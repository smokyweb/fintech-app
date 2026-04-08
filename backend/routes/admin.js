const express = require('express');
const db = require('../database');
const { authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/users', authenticate, adminOnly, (req, res) => {
  const users = db.prepare('SELECT id, email, name, balance, referral_code, role, created_at FROM users ORDER BY created_at DESC').all();
  res.json(users);
});

router.get('/trades', authenticate, adminOnly, (req, res) => {
  const trades = db.prepare(`
    SELECT t.*, u.name as user_name, u.email as user_email
    FROM trades t JOIN users u ON t.user_id = u.id
    ORDER BY t.created_at DESC LIMIT 200
  `).all();
  res.json(trades);
});

router.get('/bots', authenticate, adminOnly, (req, res) => {
  const bots = db.prepare(`
    SELECT b.*, u.name as user_name, u.email as user_email
    FROM bots b JOIN users u ON b.user_id = u.id
    ORDER BY b.created_at DESC
  `).all();
  res.json(bots);
});

router.get('/stats', authenticate, adminOnly, (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const totalBalance = db.prepare('SELECT COALESCE(SUM(balance), 0) as total FROM users').get().total;
  const totalTrades = db.prepare('SELECT COUNT(*) as count FROM trades').get().count;
  const openTrades = db.prepare("SELECT COUNT(*) as count FROM trades WHERE status = 'open'").get().count;
  const activeBots = db.prepare('SELECT COUNT(*) as count FROM bots WHERE active = 1').get().count;
  const totalReferrals = db.prepare('SELECT COUNT(*) as count FROM referrals').get().count;

  res.json({ totalUsers, totalBalance, totalTrades, openTrades, activeBots, totalReferrals });
});

router.get('/transactions', authenticate, adminOnly, (req, res) => {
  const txns = db.prepare(`
    SELECT t.*, u.name as user_name FROM transactions t
    JOIN users u ON t.user_id = u.id
    ORDER BY t.created_at DESC LIMIT 200
  `).all();
  res.json(txns);
});

module.exports = router;
