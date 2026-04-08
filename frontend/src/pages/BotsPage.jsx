import { useState, useEffect } from 'react';
import api from '../api';
import { Bot, Play, Pause, Trash2, Plus } from 'lucide-react';

const CRYPTO_SYMBOLS = ['BTC', 'ETH', 'SOL', 'ADA'];
const STRATEGY_COLORS = { momentum: '#00D4AA', mean_reversion: '#818CF8', breakout: '#FFA502' };

export default function BotsPage() {
  const [strategies, setStrategies] = useState({});
  const [bots, setBots] = useState([]);
  const [botTrades, setBotTrades] = useState({});
  const [newStrategy, setNewStrategy] = useState('momentum');
  const [newSymbol, setNewSymbol] = useState('BTC');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const fetchData = () => {
    api.get('/bots/strategies').then(r => setStrategies(r.data));
    api.get('/bots').then(r => setBots(r.data));
  };

  useEffect(() => { fetchData(); }, []);

  const createBot = async (e) => {
    e.preventDefault();
    setMsg(''); setError('');
    try {
      await api.post('/bots/create', { strategy: newStrategy, symbol: newSymbol });
      setMsg('Bot created!');
      setShowCreate(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed');
    }
  };

  const toggleBot = async (botId) => {
    try {
      await api.post(`/bots/${botId}/toggle`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Toggle failed');
    }
  };

  const deleteBot = async (botId) => {
    try {
      await api.delete(`/bots/${botId}`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Delete failed');
    }
  };

  const loadBotTrades = async (botId) => {
    if (botTrades[botId]) {
      setBotTrades(prev => { const n = { ...prev }; delete n[botId]; return n; });
      return;
    }
    const res = await api.get(`/bots/${botId}/trades`);
    setBotTrades(prev => ({ ...prev, [botId]: res.data }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Trading Bots</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Bot
        </button>
      </div>

      {msg && <div className="bg-[#00D4AA]/10 border border-[#00D4AA]/30 text-[#00D4AA] px-4 py-2 rounded-lg text-sm mb-4">{msg}</div>}
      {error && <div className="bg-[#FF4757]/10 border border-[#FF4757]/30 text-[#FF4757] px-4 py-2 rounded-lg text-sm mb-4">{error}</div>}

      {/* Create Bot Form */}
      {showCreate && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">Create New Bot</h2>
          <form onSubmit={createBot} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1">Strategy</label>
              <select className="input" value={newStrategy} onChange={e => setNewStrategy(e.target.value)}>
                {Object.entries(strategies).map(([key, s]) => (
                  <option key={key} value={key}>{s.name} ({s.risk} Risk)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1">Symbol</label>
              <select className="input" value={newSymbol} onChange={e => setNewSymbol(e.target.value)}>
                {CRYPTO_SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" className="btn-primary w-full">Create Bot</button>
            </div>
          </form>
          {strategies[newStrategy] && (
            <p className="text-sm text-[#94A3B8] mt-3">{strategies[newStrategy].description}</p>
          )}
        </div>
      )}

      {/* Strategy Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {Object.entries(strategies).map(([key, s]) => (
          <div key={key} className="card">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full" style={{ background: STRATEGY_COLORS[key] }} />
              <h3 className="font-semibold">{s.name}</h3>
            </div>
            <p className="text-sm text-[#94A3B8] mb-2">{s.description}</p>
            <span className={`text-xs px-2 py-1 rounded ${s.risk === 'Low' ? 'bg-[#00D4AA]/10 text-[#00D4AA]' : s.risk === 'Medium' ? 'bg-[#FFA502]/10 text-[#FFA502]' : 'bg-[#FF4757]/10 text-[#FF4757]'}`}>
              {s.risk} Risk
            </span>
          </div>
        ))}
      </div>

      {/* Bots List */}
      <div className="space-y-4">
        {bots.length === 0 ? (
          <div className="card text-center py-12">
            <Bot size={48} className="mx-auto mb-4 text-[#94A3B8]" />
            <p className="text-[#94A3B8]">No bots yet. Create one to start automated trading!</p>
          </div>
        ) : bots.map(bot => (
          <div key={bot.id} className="card">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: (STRATEGY_COLORS[bot.strategy] || '#666') + '20' }}>
                  <Bot size={20} style={{ color: STRATEGY_COLORS[bot.strategy] }} />
                </div>
                <div>
                  <p className="font-medium">{strategies[bot.strategy]?.name || bot.strategy} - {bot.symbol}</p>
                  <div className="flex items-center gap-3 text-xs text-[#94A3B8]">
                    <span>Trades: {bot.trades_made}</span>
                    <span className={bot.total_pnl >= 0 ? 'text-[#00D4AA]' : 'text-[#FF4757]'}>
                      P&L: {bot.total_pnl >= 0 ? '+' : ''}${bot.total_pnl.toFixed(2)}
                    </span>
                    <span className={`px-2 py-0.5 rounded ${bot.active ? 'bg-[#00D4AA]/10 text-[#00D4AA]' : 'bg-[#94A3B8]/10 text-[#94A3B8]'}`}>
                      {bot.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => loadBotTrades(bot.id)} className="btn-outline text-xs !py-1.5 !px-3">
                  {botTrades[bot.id] ? 'Hide' : 'Trades'}
                </button>
                <button onClick={() => toggleBot(bot.id)} className={`p-2 rounded-lg ${bot.active ? 'bg-[#FFA502]/10 text-[#FFA502]' : 'bg-[#00D4AA]/10 text-[#00D4AA]'}`} title={bot.active ? 'Pause' : 'Start'}>
                  {bot.active ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <button onClick={() => deleteBot(bot.id)} className="p-2 rounded-lg bg-[#FF4757]/10 text-[#FF4757]" title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {botTrades[bot.id] && (
              <div className="mt-4 border-t border-[#2A2F45] pt-4">
                <h4 className="text-sm font-medium mb-2">Recent Bot Trades</h4>
                {botTrades[bot.id].length === 0 ? <p className="text-xs text-[#94A3B8]">No trades yet</p> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="text-[#94A3B8]">
                        <th className="text-left pb-2">Time</th><th className="text-left pb-2">Side</th><th className="text-right pb-2">Qty</th><th className="text-right pb-2">Price</th><th className="text-right pb-2">P&L</th>
                      </tr></thead>
                      <tbody>
                        {botTrades[bot.id].slice(0, 10).map(t => (
                          <tr key={t.id} className="border-t border-[#2A2F45]/50">
                            <td className="py-1.5 text-[#94A3B8]">{new Date(t.created_at).toLocaleString()}</td>
                            <td className={t.side === 'buy' ? 'text-[#00D4AA]' : 'text-[#FF4757]'}>{t.side.toUpperCase()}</td>
                            <td className="text-right">{t.quantity.toFixed(6)}</td>
                            <td className="text-right">${t.price.toLocaleString()}</td>
                            <td className={`text-right ${t.pnl >= 0 ? 'text-[#00D4AA]' : 'text-[#FF4757]'}`}>${t.pnl.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
