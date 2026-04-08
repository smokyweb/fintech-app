const express = require('express');
const cors = require('cors');
const path = require('path');

// Initialize database
require('./database');

const authRoutes = require('./routes/auth');
const walletRoutes = require('./routes/wallet');
const tradingRoutes = require('./routes/trading');
const botRoutes = require('./routes/bots');
const referralRoutes = require('./routes/referrals');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 4050;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/trading', tradingRoutes);
app.use('/api/bots', botRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/admin', adminRoutes);

// Serve frontend in production
const frontendPath = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendPath));
app.get('/{*path}', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendPath, 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`Fintech API running on port ${PORT}`);
});
