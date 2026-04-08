const express = require('express');
const db = require('../database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/code', authenticate, (req, res) => {
  const user = db.prepare('SELECT referral_code FROM users WHERE id = ?').get(req.user.id);
  res.json({ referral_code: user.referral_code });
});

router.get('/stats', authenticate, (req, res) => {
  const referrals = db.prepare(`
    SELECT r.*, u.name as referred_name, u.email as referred_email
    FROM referrals r JOIN users u ON r.referred_id = u.id
    WHERE r.referrer_id = ? ORDER BY r.created_at DESC
  `).all(req.user.id);

  const totalBonus = db.prepare(
    "SELECT COALESCE(SUM(bonus_amount), 0) as total FROM referrals WHERE referrer_id = ? AND status = 'completed'"
  ).get(req.user.id);

  res.json({
    referrals,
    total_referrals: referrals.length,
    total_bonus: totalBonus.total,
  });
});

module.exports = router;
