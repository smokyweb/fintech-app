const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/deposit', authenticate, (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
  if (amount > 1000000) return res.status(400).json({ error: 'Maximum deposit is $1,000,000' });

  const txn = db.transaction(() => {
    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(amount, req.user.id);
    db.prepare('INSERT INTO transactions (id, user_id, type, amount, description) VALUES (?, ?, ?, ?, ?)')
      .run(uuidv4(), req.user.id, 'deposit', amount, `Demo deposit of $${amount}`);

    // Check referral bonus
    const referral = db.prepare(
      "SELECT r.*, u.name as referrer_name FROM referrals r JOIN users u ON r.referrer_id = u.id WHERE r.referred_id = ? AND r.status = 'pending'"
    ).get(req.user.id);

    if (referral) {
      const bonus = +(amount * 0.05).toFixed(2);
      db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(bonus, referral.referrer_id);
      db.prepare('INSERT INTO transactions (id, user_id, type, amount, description) VALUES (?, ?, ?, ?, ?)')
        .run(uuidv4(), referral.referrer_id, 'referral_bonus', bonus, `5% referral bonus from referred user`);
      db.prepare("UPDATE referrals SET bonus_amount = ?, status = 'completed' WHERE id = ?")
        .run(bonus, referral.id);
    }
  });

  txn();
  const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
  res.json({ balance: user.balance, message: `Successfully deposited $${amount}` });
});

router.post('/withdraw', authenticate, (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

  const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
  if (user.balance < amount) return res.status(400).json({ error: 'Insufficient funds' });

  db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(amount, req.user.id);
  db.prepare('INSERT INTO transactions (id, user_id, type, amount, description) VALUES (?, ?, ?, ?, ?)')
    .run(uuidv4(), req.user.id, 'withdrawal', -amount, `Withdrawal of $${amount}`);

  const updated = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
  res.json({ balance: updated.balance, message: `Successfully withdrew $${amount}` });
});

router.get('/transactions', authenticate, (req, res) => {
  const txns = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50')
    .all(req.user.id);
  res.json(txns);
});

router.get('/balance', authenticate, (req, res) => {
  const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
  res.json({ balance: user.balance });
});

module.exports = router;
