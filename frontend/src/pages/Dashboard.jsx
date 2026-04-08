import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { TrendingUp, TrendingDown, Wallet, BarChart3, Bot, Users } from 'lucide-react';

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const [trades, setTrades] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [bots, setBots] = useState([]);

  useEffect(() => {
    refreshUser();
    api.get('/trading/trades?status=open').then(r => setTrades(r.data)).catch(() => {});
    api.get('/trading/portfolio').then(r => setPortfolio(r.data)).catch(() => {});
    api.get('/bots').then(r => setBots(r.data)).catch(() => {});
  }, []);

  const totalPortfolioValue = portfolio.reduce((s, h) => s + h.value, 0);
  const totalPnl = portfolio.reduce((s, h) => s + h.pnl, 0) + trades.reduce((s, t) => s + (t.pnl || 0), 0);
  const activeBots = bots.filter(b => b.active).length;

  const stats = [
    { label: 'Wallet Balance', value: `$${(user?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: Wallet, color: '#00D4AA' },
    { label: 'Portfolio Value', value: `$${totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: BarChart3, color: '#818CF8' },
    { label: 'Total P&L', value: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`, icon: totalPnl >= 0 ? TrendingUp : TrendingDown, color: totalPnl >= 0 ? '#00D4AA' : '#FF4757' },
    { label: 'Active Bots', value: activeBots, icon: Bot, color: '#FFA502' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <div key={i} className="card flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: s.color + '20' }}>
              <s.icon size={20} style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-xs text-[#94A3B8]">{s.label}</p>
              <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Open Trades */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Open Trades</h2>
          {trades.length === 0 ? (
            <p className="text-[#94A3B8] text-sm">No open trades</p>
          ) : (
            <div className="space-y-3">
              {trades.slice(0, 5).map(t => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-[#2A2F45] last:border-0">
                  <div>
                    <span className="font-medium text-sm">{t.symbol}</span>
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded ${t.side === 'buy' ? 'bg-[#00D4AA]/10 text-[#00D4AA]' : 'bg-[#FF4757]/10 text-[#FF4757]'}`}>
                      {t.side.toUpperCase()}
                    </span>
                  </div>
                  <span className={`text-sm font-medium ${t.pnl >= 0 ? 'text-[#00D4AA]' : 'text-[#FF4757]'}`}>
                    {t.pnl >= 0 ? '+' : ''}${t.pnl?.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Portfolio Holdings */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Portfolio Holdings</h2>
          {portfolio.length === 0 ? (
            <p className="text-[#94A3B8] text-sm">No holdings yet</p>
          ) : (
            <div className="space-y-3">
              {portfolio.map(h => (
                <div key={h.id} className="flex items-center justify-between py-2 border-b border-[#2A2F45] last:border-0">
                  <div>
                    <span className="font-medium text-sm">{h.symbol}</span>
                    <span className="ml-2 text-xs text-[#94A3B8]">{h.quantity.toFixed(6)}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">${h.value.toLocaleString()}</p>
                    <p className={`text-xs ${h.pnl >= 0 ? 'text-[#00D4AA]' : 'text-[#FF4757]'}`}>
                      {h.pnl >= 0 ? '+' : ''}{h.pnl_pct}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
