import { useState, useEffect } from 'react';
import api from '../api';
import { Users, DollarSign, BarChart3, Bot, TrendingUp, Activity } from 'lucide-react';

export default function AdminPage() {
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [trades, setTrades] = useState([]);
  const [bots, setBots] = useState([]);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    api.get('/admin/stats').then(r => setStats(r.data)).catch(() => {});
    api.get('/admin/users').then(r => setUsers(r.data)).catch(() => {});
    api.get('/admin/trades').then(r => setTrades(r.data)).catch(() => {});
    api.get('/admin/bots').then(r => setBots(r.data)).catch(() => {});
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'Users' },
    { id: 'trades', label: 'Trades' },
    { id: 'bots', label: 'Bots' },
  ];

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers || 0, icon: Users, color: '#818CF8' },
    { label: 'Total Balance', value: `$${(stats.totalBalance || 0).toLocaleString()}`, icon: DollarSign, color: '#00D4AA' },
    { label: 'Total Trades', value: stats.totalTrades || 0, icon: BarChart3, color: '#FFA502' },
    { label: 'Open Trades', value: stats.openTrades || 0, icon: TrendingUp, color: '#FF4757' },
    { label: 'Active Bots', value: stats.activeBots || 0, icon: Bot, color: '#00D4AA' },
    { label: 'Referrals', value: stats.totalReferrals || 0, icon: Activity, color: '#818CF8' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#111827] rounded-lg p-1 mb-6 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${tab === t.id ? 'bg-[#00D4AA] text-black' : 'text-[#94A3B8] hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map((s, i) => (
            <div key={i} className="card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.color + '20' }}>
                  <s.icon size={20} style={{ color: s.color }} />
                </div>
                <div>
                  <p className="text-xs text-[#94A3B8]">{s.label}</p>
                  <p className="text-xl font-bold">{s.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'users' && (
        <div className="card overflow-x-auto">
          <h2 className="text-lg font-semibold mb-4">All Users ({users.length})</h2>
          <table className="w-full text-sm">
            <thead><tr className="text-[#94A3B8] text-xs">
              <th className="text-left pb-3">Name</th><th className="text-left pb-3">Email</th><th className="text-right pb-3">Balance</th><th className="text-left pb-3">Role</th><th className="text-left pb-3">Referral</th><th className="text-right pb-3">Joined</th>
            </tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-t border-[#2A2F45]">
                  <td className="py-2 font-medium">{u.name}</td>
                  <td className="text-[#94A3B8]">{u.email}</td>
                  <td className="text-right text-[#00D4AA] font-medium">${u.balance.toFixed(2)}</td>
                  <td><span className={`text-xs px-2 py-0.5 rounded ${u.role === 'admin' ? 'bg-[#FF4757]/10 text-[#FF4757]' : 'bg-[#818CF8]/10 text-[#818CF8]'}`}>{u.role}</span></td>
                  <td className="text-xs font-mono text-[#94A3B8]">{u.referral_code}</td>
                  <td className="text-right text-[#94A3B8] text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'trades' && (
        <div className="card overflow-x-auto">
          <h2 className="text-lg font-semibold mb-4">All Trades ({trades.length})</h2>
          <table className="w-full text-sm">
            <thead><tr className="text-[#94A3B8] text-xs">
              <th className="text-left pb-3">User</th><th className="text-left pb-3">Market</th><th className="text-left pb-3">Symbol</th><th className="text-left pb-3">Side</th><th className="text-right pb-3">Qty</th><th className="text-right pb-3">Entry</th><th className="text-right pb-3">P&L</th><th className="text-left pb-3">Status</th>
            </tr></thead>
            <tbody>
              {trades.slice(0, 50).map(t => (
                <tr key={t.id} className="border-t border-[#2A2F45]">
                  <td className="py-2">{t.user_name}</td>
                  <td className="text-xs text-[#94A3B8]">{t.market}</td>
                  <td className="font-medium">{t.symbol}</td>
                  <td className={t.side === 'buy' ? 'text-[#00D4AA]' : 'text-[#FF4757]'}>{t.side.toUpperCase()}</td>
                  <td className="text-right">{t.quantity}</td>
                  <td className="text-right">${t.entry_price}</td>
                  <td className={`text-right font-medium ${t.pnl >= 0 ? 'text-[#00D4AA]' : 'text-[#FF4757]'}`}>${t.pnl?.toFixed(2)}</td>
                  <td><span className={`text-xs px-2 py-0.5 rounded ${t.status === 'open' ? 'bg-[#00D4AA]/10 text-[#00D4AA]' : 'bg-[#94A3B8]/10 text-[#94A3B8]'}`}>{t.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'bots' && (
        <div className="card overflow-x-auto">
          <h2 className="text-lg font-semibold mb-4">All Bots ({bots.length})</h2>
          <table className="w-full text-sm">
            <thead><tr className="text-[#94A3B8] text-xs">
              <th className="text-left pb-3">User</th><th className="text-left pb-3">Strategy</th><th className="text-left pb-3">Symbol</th><th className="text-right pb-3">Trades</th><th className="text-right pb-3">P&L</th><th className="text-left pb-3">Status</th>
            </tr></thead>
            <tbody>
              {bots.map(b => (
                <tr key={b.id} className="border-t border-[#2A2F45]">
                  <td className="py-2">{b.user_name}</td>
                  <td className="capitalize">{b.strategy.replace('_', ' ')}</td>
                  <td className="font-medium">{b.symbol}</td>
                  <td className="text-right">{b.trades_made}</td>
                  <td className={`text-right font-medium ${b.total_pnl >= 0 ? 'text-[#00D4AA]' : 'text-[#FF4757]'}`}>${b.total_pnl.toFixed(2)}</td>
                  <td><span className={`text-xs px-2 py-0.5 rounded ${b.active ? 'bg-[#00D4AA]/10 text-[#00D4AA]' : 'bg-[#94A3B8]/10 text-[#94A3B8]'}`}>{b.active ? 'Active' : 'Inactive'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
