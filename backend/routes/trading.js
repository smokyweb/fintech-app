const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { authenticate } = require('../middleware/auth');
const { getPrice, getFuturesPrices, getForexPrices, getCryptoPrices } = require('../services/marketData');

const router = express.Router();

// Get market prices
router.get('/prices/futures', authenticate, (req, res) => res.json(getFuturesPrices()));
router.get('/prices/forex', authenticate, (req, res) => res.json(getForexPrices()));
router.get('/prices/crypto', authenticate, (req, res) => res.json(getCryptoPrices()));

// Open a trade (futures/forex)
router.post('/open', authenticate, (req, res) => {
  const { market, symbol, side, quantity } = req.body;
  if (!market || !symbol || !side || !quantity) {
    return res.status(400).json({ error: 'market, symbol, side, quantity are required' });
  }
  if (!['buy', 'sell'].includes(side)) return res.status(400).json({ error: 'Side must be buy or sell' });

  const price = getPrice(symbol);
  if (!price) return res.status(400).json({ error: 'Invalid symbol' });

  const cost = price * quantity;
  const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
  if (user.balance < cost * 0.1) { // 10x leverage for futures/forex
    return res.status(400).json({ error: 'Insufficient margin. Need ' + (cost * 0.1).toFixed(2) });
  }

  const margin = +(cost * 0.1).toFixed(2);
  db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(margin, req.user.id);

  const id = uuidv4();
  db.prepare(`INSERT INTO trades (id, user_id, market, symbol, side, quantity, entry_price, current_price, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open')`).run(id, req.user.id, market, symbol, side, quantity, price, price);

  db.prepare('INSERT INTO transactions (id, user_id, type, amount, description) VALUES (?, ?, ?, ?, ?)')
    .run(uuidv4(), req.user.id, 'trade_margin', -margin, `Margin for ${side} ${quantity} ${symbol}`);

  res.json({ id, symbol, side, quantity, entry_price: price, margin, message: 'Trade opened' });
});

// Close a trade
router.post('/close/:tradeId', authenticate, (req, res) => {
  const trade = db.prepare("SELECT * FROM trades WHERE id = ? AND user_id = ? AND status = 'open'")
    .get(req.params.tradeId, req.user.id);
  if (!trade) return res.status(404).json({ error: 'Trade not found' });

  const currentPrice = getPrice(trade.symbol);
  let pnl;
  if (trade.side === 'buy') {
    pnl = (currentPrice - trade.entry_price) * trade.quantity;
  } else {
    pnl = (trade.entry_price - currentPrice) * trade.quantity;
  }
  pnl = +pnl.toFixed(2);

  const margin = +(trade.entry_price * trade.quantity * 0.1).toFixed(2);
  const returnAmount = +(margin + pnl).toFixed(2);

  db.prepare("UPDATE trades SET status = 'closed', current_price = ?, pnl = ?, closed_at = datetime('now') WHERE id = ?")
    .run(currentPrice, pnl, trade.id);
  db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?')
    .run(Math.max(0, returnAmount), req.user.id);
  db.prepare('INSERT INTO transactions (id, user_id, type, amount, description) VALUES (?, ?, ?, ?, ?)')
    .run(uuidv4(), req.user.id, 'trade_close', returnAmount, `Closed ${trade.side} ${trade.symbol}: PnL $${pnl}`);

  res.json({ trade_id: trade.id, pnl, return_amount: returnAmount, close_price: currentPrice });
});

// Get user trades
router.get('/trades', authenticate, (req, res) => {
  const { market, status } = req.query;
  let query = 'SELECT * FROM trades WHERE user_id = ?';
  const params = [req.user.id];
  if (market) { query += ' AND market = ?'; params.push(market); }
  if (status) { query += ' AND status = ?'; params.push(status); }
  query += ' ORDER BY created_at DESC LIMIT 100';

  const trades = db.prepare(query).all(...params);
  // Update current prices for open trades
  for (const t of trades) {
    if (t.status === 'open') {
      t.current_price = getPrice(t.symbol);
      t.pnl = t.side === 'buy'
        ? +((t.current_price - t.entry_price) * t.quantity).toFixed(2)
        : +((t.entry_price - t.current_price) * t.quantity).toFixed(2);
    }
  }
  res.json(trades);
});

// Buy crypto (spot)
router.post('/crypto/buy', authenticate, (req, res) => {
  const { symbol, amount } = req.body; // amount in USD
  if (!symbol || !amount || amount <= 0) return res.status(400).json({ error: 'symbol and amount required' });

  const price = getPrice(symbol);
  if (!price) return res.status(400).json({ error: 'Invalid symbol' });

  const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
  if (user.balance < amount) return res.status(400).json({ error: 'Insufficient funds' });

  const quantity = +(amount / price).toFixed(8);

  db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(amount, req.user.id);

  // Upsert portfolio
  const existing = db.prepare("SELECT * FROM portfolios WHERE user_id = ? AND symbol = ? AND market = 'crypto'")
    .get(req.user.id, symbol);
  if (existing) {
    const newQty = existing.quantity + quantity;
    const newAvg = +((existing.avg_price * existing.quantity + price * quantity) / newQty).toFixed(2);
    db.prepare('UPDATE portfolios SET quantity = ?, avg_price = ? WHERE id = ?')
      .run(newQty, newAvg, existing.id);
  } else {
    db.prepare("INSERT INTO portfolios (id, user_id, symbol, quantity, avg_price, market) VALUES (?, ?, ?, ?, ?, 'crypto')")
      .run(uuidv4(), req.user.id, symbol, quantity, price);
  }

  db.prepare('INSERT INTO transactions (id, user_id, type, amount, description) VALUES (?, ?, ?, ?, ?)')
    .run(uuidv4(), req.user.id, 'crypto_buy', -amount, `Bought ${quantity} ${symbol} @ $${price}`);

  res.json({ symbol, quantity, price, cost: amount });
});

// Sell crypto
router.post('/crypto/sell', authenticate, (req, res) => {
  const { symbol, quantity } = req.body;
  if (!symbol || !quantity || quantity <= 0) return res.status(400).json({ error: 'symbol and quantity required' });

  const portfolio = db.prepare("SELECT * FROM portfolios WHERE user_id = ? AND symbol = ? AND market = 'crypto'")
    .get(req.user.id, symbol);
  if (!portfolio || portfolio.quantity < quantity) {
    return res.status(400).json({ error: 'Insufficient holdings' });
  }

  const price = getPrice(symbol);
  const proceeds = +(price * quantity).toFixed(2);

  db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(proceeds, req.user.id);

  const newQty = +(portfolio.quantity - quantity).toFixed(8);
  if (newQty <= 0.00000001) {
    db.prepare('DELETE FROM portfolios WHERE id = ?').run(portfolio.id);
  } else {
    db.prepare('UPDATE portfolios SET quantity = ? WHERE id = ?').run(newQty, portfolio.id);
  }

  db.prepare('INSERT INTO transactions (id, user_id, type, amount, description) VALUES (?, ?, ?, ?, ?)')
    .run(uuidv4(), req.user.id, 'crypto_sell', proceeds, `Sold ${quantity} ${symbol} @ $${price}`);

  res.json({ symbol, quantity, price, proceeds });
});

// Portfolio
router.get('/portfolio', authenticate, (req, res) => {
  const holdings = db.prepare('SELECT * FROM portfolios WHERE user_id = ?').all(req.user.id);
  for (const h of holdings) {
    h.current_price = getPrice(h.symbol);
    h.value = +(h.current_price * h.quantity).toFixed(2);
    h.pnl = +((h.current_price - h.avg_price) * h.quantity).toFixed(2);
    h.pnl_pct = +(((h.current_price - h.avg_price) / h.avg_price) * 100).toFixed(2);
  }
  res.json(holdings);
});

module.exports = router;
