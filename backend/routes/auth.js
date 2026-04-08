const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { JWT_SECRET, authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/signup', (req, res) => {
  const { email, password, name, referralCode } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(400).json({ error: 'Email already registered' });

  const hash = bcrypt.hashSync(password, 10);
  const id = uuidv4();
  const userReferralCode = name.substring(0, 3).toUpperCase() + Date.now().toString(36).toUpperCase();

  let referredBy = null;
  if (referralCode) {
    const referrer = db.prepare('SELECT id FROM users WHERE referral_code = ?').get(referralCode);
    if (referrer) referredBy = referrer.id;
  }

  db.prepare(`INSERT INTO users (id, email, password, name, referral_code, referred_by)
    VALUES (?, ?, ?, ?, ?, ?)`).run(id, email, hash, name, userReferralCode, referredBy);

  if (referredBy) {
    db.prepare(`INSERT INTO referrals (id, referrer_id, referred_id, status)
      VALUES (?, ?, ?, 'pending')`).run(uuidv4(), referredBy, id);
  }

  const token = jwt.sign({ id, email, name, role: 'user' }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: { id, email, name, role: 'user', balance: 0, referral_code: userReferralCode } });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  res.json({
    token,
    user: {
      id: user.id, email: user.email, name: user.name,
      role: user.role, balance: user.balance, referral_code: user.referral_code,
    },
  });
});

router.get('/me', authenticate, (req, res) => {
  const user = db.prepare('SELECT id, email, name, balance, referral_code, role, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

module.exports = router;
