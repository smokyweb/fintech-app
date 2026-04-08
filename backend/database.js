const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const db = new Database(path.join(__dirname, 'fintech.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    balance REAL DEFAULT 0,
    referral_code TEXT UNIQUE NOT NULL,
    referred_by TEXT,
    role TEXT DEFAULT 'user',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS trades (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    market TEXT NOT NULL,
    symbol TEXT NOT NULL,
    side TEXT NOT NULL,
    quantity REAL NOT NULL,
    entry_price REAL NOT NULL,
    current_price REAL,
    pnl REAL DEFAULT 0,
    status TEXT DEFAULT 'open',
    created_at TEXT DEFAULT (datetime('now')),
    closed_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS portfolios (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    quantity REAL NOT NULL,
    avg_price REAL NOT NULL,
    market TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, symbol, market)
  );

  CREATE TABLE IF NOT EXISTS bots (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    strategy TEXT NOT NULL,
    market TEXT NOT NULL,
    symbol TEXT NOT NULL,
    active INTEGER DEFAULT 0,
    trades_made INTEGER DEFAULT 0,
    total_pnl REAL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS bot_trades (
    id TEXT PRIMARY KEY,
    bot_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    side TEXT NOT NULL,
    quantity REAL NOT NULL,
    price REAL NOT NULL,
    pnl REAL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (bot_id) REFERENCES bots(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS referrals (
    id TEXT PRIMARY KEY,
    referrer_id TEXT NOT NULL,
    referred_id TEXT NOT NULL,
    bonus_amount REAL DEFAULT 0,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (referrer_id) REFERENCES users(id),
    FOREIGN KEY (referred_id) REFERENCES users(id)
  );
`);

// Seed admin user
const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@fintech.com');
if (!adminExists) {
  const hash = bcrypt.hashSync('Admin2026!', 10);
  db.prepare(`INSERT INTO users (id, email, password, name, balance, referral_code, role)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    uuidv4(), 'admin@fintech.com', hash, 'Admin', 100000, 'ADMIN001', 'admin'
  );
}

module.exports = db;
