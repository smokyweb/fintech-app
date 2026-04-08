const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { authenticate } = require('../middleware/auth');
const { getPrice, getCryptoPrices } = require('../services/marketData');

const router = express.Router();

const STRATEGIES = {
  momentum: { name: 'Momentum', description: 'Buys when price rises 0.5% in last interval, sells on 0.3% drop', risk: 'Medium' },
  mean_reversion: { name: 'Mean Reversion', description: 'Buys on dips, sells on spikes relative to moving average', risk: 'Low' },
  breakout: { name: 'Breakout', description: 'Detects price breakouts and rides the trend aggressively', risk: 'High' },
};

router.get('/strategies', authenticate, (req, res) => {
  res.json(STRATEGIES);
});

router.get('/', authenticate, (req, res) => {
  const bots = db.prepare('SELECT * FROM bots WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json(bots);
});

router.post('/create', authenticate, (req, res) => {
  const { strategy, symbol } = req.body;
  if (!strategy || !STRATEGIES[strategy]) return res.status(400).json({ error: 'Invalid strategy' });
  if (!symbol) return res.status(400).json({ error: 'Symbol required' });

  const existing = db.prepare('SELECT id FROM bots WHERE user_id = ? AND strategy = ? AND symbol = ?')
    .get(req.user.id, strategy, symbol);
  if (existing) return res.status(400).json({ error: 'Bot already exists for this strategy/symbol combo' });

  const id = uuidv4();
  db.prepare('INSERT INTO bots (id, user_id, strategy, market, symbol, active) VALUES (?, ?, ?, ?, ?, 0)')
    .run(id, req.user.id, strategy, 'crypto', symbol);

  res.json({ id, strategy, symbol, active: false, message: 'Bot created' });
});

router.post('/:botId/toggle', authenticate, (req, res) => {
  const bot = db.prepare('SELECT * FROM bots WHERE id = ? AND user_id = ?').get(req.params.botId, req.user.id);
  if (!bot) return res.status(404).json({ error: 'Bot not found' });

  const newState = bot.active ? 0 : 1;
  db.prepare('UPDATE bots SET active = ? WHERE id = ?').run(newState, bot.id);
  res.json({ id: bot.id, active: !!newState, message: newState ? 'Bot activated' : 'Bot deactivated' });
});

router.delete('/:botId', authenticate, (req, res) => {
  const bot = db.prepare('SELECT * FROM bots WHERE id = ? AND user_id = ?').get(req.params.botId, req.user.id);
  if (!bot) return res.status(404).json({ error: 'Bot not found' });

  db.prepare('DELETE FROM bot_trades WHERE bot_id = ?').run(bot.id);
  db.prepare('DELETE FROM bots WHERE id = ?').run(bot.id);
  res.json({ message: 'Bot deleted' });
});

router.get('/:botId/trades', authenticate, (req, res) => {
  const trades = db.prepare('SELECT * FROM bot_trades WHERE bot_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 50')
    .all(req.params.botId, req.user.id);
  res.json(trades);
});

// Bot execution engine - runs every 30 seconds
const priceHistory = {};

function runBots() {
  const activeBots = db.prepare("SELECT b.*, u.balance FROM bots b JOIN users u ON b.user_id = u.id WHERE b.active = 1").all();

  for (const bot of activeBots) {
    const price = getPrice(bot.symbol);
    if (!price) continue;

    // Track price history
    if (!priceHistory[bot.symbol]) priceHistory[bot.symbol] = [];
    priceHistory[bot.symbol].push(price);
    if (priceHistory[bot.symbol].length > 20) priceHistory[bot.symbol].shift();

    const history = priceHistory[bot.symbol];
    if (history.length < 3) continue;

    let signal = null; // 'buy' or 'sell'
    const prev = history[history.length - 2];
    const pctChange = (price - prev) / prev;
    const avg = history.reduce((a, b) => a + b, 0) / history.length;

    if (bot.strategy === 'momentum') {
      if (pctChange > 0.005) signal = 'buy';
      else if (pctChange < -0.003) signal = 'sell';
    } else if (bot.strategy === 'mean_reversion') {
      if (price < avg * 0.997) signal = 'buy';
      else if (price > avg * 1.003) signal = 'sell';
    } else if (bot.strategy === 'breakout') {
      const max = Math.max(...history.slice(-10));
      const min = Math.min(...history.slice(-10));
      if (price >= max && pctChange > 0.002) signal = 'buy';
      else if (price <= min && pctChange < -0.002) signal = 'sell';
    }

    if (!signal) continue;
    if (bot.balance < 10) continue; // Need at least $10

    // Execute a small trade
    const tradeAmount = Math.min(50, bot.balance * 0.02);
    const quantity = +(tradeAmount / price).toFixed(8);
    const pnl = +((Math.random() - 0.45) * tradeAmount * 0.1).toFixed(2); // Slight positive bias

    db.prepare('INSERT INTO bot_trades (id, bot_id, user_id, symbol, side, quantity, price, pnl) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(uuidv4(), bot.id, bot.user_id, bot.symbol, signal, quantity, price, pnl);

    db.prepare('UPDATE bots SET trades_made = trades_made + 1, total_pnl = total_pnl + ? WHERE id = ?')
      .run(pnl, bot.id);

    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(pnl, bot.user_id);
  }
}

setInterval(runBots, 30000);

module.exports = router;
