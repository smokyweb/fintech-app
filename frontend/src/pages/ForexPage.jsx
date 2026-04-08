import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const PAIRS = {
  'EUR/USD': { name: 'Euro / US Dollar', flag: '🇪🇺' },
  'GBP/USD': { name: 'British Pound / US Dollar', flag: '🇬🇧' },
  'USD/JPY': { name: 'US Dollar / Japanese Yen', flag: '🇯🇵' },
  'AUD/USD': { name: 'Australian Dollar / US Dollar', flag: '🇦🇺' },
  'USD/CHF': { name: 'US Dollar / Swiss Franc', flag: '🇨🇭' },
  'USD/CAD': { name: 'US Dollar / Canadian Dollar', flag: '🇨🇦' },
};

export default function ForexPage() {
  const { refreshUser } = useAuth();
  const [prices, setPrices] = useState({});
  const [prevPrices, setPrevPrices] = useState({});
  const [trades, setTrades] = useState([]);
  const [symbol, setSymbol] = useState('EUR/USD');
  const [side, setSide] = useState('buy');
  const [lots, setLots] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const fetchData = () => {
    api.get('/trading/prices/forex').then(r => {
      setPrevPrices(prev => ({ ...prices }));
      setPrices(r.data);
    });
    api.get('/trading/trades?market=forex').then(r => setTrades(r.data));
  };

  useEffect(() => {
    fetchData();
    const iv = setInterval(() => {
      api.get('/trading/prices/forex').then(r => {
        setPrevPrices(prices);
        setPrices(r.data);
      });
    }, 10000);
    return () => clearInterval(iv);
  }, []);

  const openTrade = async (e) => {
    e.preventDefault();
    setMsg(''); setError('');
    const qty = parseFloat(lots);
    if (!qty || qty <= 0) return setError('Enter valid lot size');
    // 1 lot = 100,000 units in forex
    const actualQty = qty * 100000;
    try {
      const res = await api.post('/trading/open', { market: 'forex', symbol, side, quantity: actualQty });
      setMsg(`Opened ${side} ${qty} lots ${symbol} @ ${res.data.entry_price}. Margin: $${res.data.margin}`);
      setLots('');
      refreshUser();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Trade failed');
    }
  };

  const closeTrade = async (tradeId) => {
    try {
      const res = await api.post(`/trading/close/${tradeId}`);
      setMsg(`Closed. P&L: $${res.data.pnl}`);
      refreshUser();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Close failed');
    }
  };

  const openTrades = trades.filter(t => t.status === 'open');

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Forex Trading</h1>

      {/* Live Rates */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {Object.entries(PAIRS).map(([sym, info]) => {
          const price = prices[sym];
          const prev = prevPrices[sym];
          const dir = price > prev ? 'up' : price < prev ? 'down' : 'flat';
          return (
            <div key={sym} className={`card cursor-pointer transition-all ${symbol === sym ? 'border-[#00D4AA]' : ''}`} onClick={() => setSymbol(sym)}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{info.flag}</span>
                <span className="font-medium text-sm">{sym}</span>
              </div>
              <p className={`text-xl font-bold ${dir === 'up' ? 'text-[#00D4AA]' : dir === 'down' ? 'text-[#FF4757]' : ''}`}>
                {price?.toFixed(4) || '---'}
              </p>
              <p className="text-xs text-[#94A3B8]">{info.name}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Form */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">New Forex Order</h2>
          {msg && <div className="bg-[#00D4AA]/10 border border-[#00D4AA]/30 text-[#00D4AA] px-3 py-2 rounded-lg text-sm mb-3">{msg}</div>}
          {error && <div className="bg-[#FF4757]/10 border border-[#FF4757]/30 text-[#FF4757] px-3 py-2 rounded-lg text-sm mb-3">{error}</div>}
          <form onSubmit={openTrade} className="space-y-3">
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1">Pair</label>
              <select className="input" value={symbol} onChange={e => setSymbol(e.target.value)}>
                {Object.keys(PAIRS).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setSide('buy')} className={`flex-1 py-2 rounded-lg text-sm font-medium ${side === 'buy' ? 'bg-[#00D4AA] text-black' : 'bg-[#111827] text-[#94A3B8]'}`}>Buy</button>
              <button type="button" onClick={() => setSide('sell')} className={`flex-1 py-2 rounded-lg text-sm font-medium ${side === 'sell' ? 'bg-[#FF4757] text-white' : 'bg-[#111827] text-[#94A3B8]'}`}>Sell</button>
            </div>
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1">Lots (1 lot = 100K units)</label>
              <input type="number" className="input" value={lots} onChange={e => setLots(e.target.value)} placeholder="e.g. 0.1" step="0.01" min="0" />
            </div>
            {lots && prices[symbol] && (
              <div className="bg-[#111827] rounded-lg p-3 text-sm">
                <div className="flex justify-between"><span className="text-[#94A3B8]">Notional</span><span>${(prices[symbol] * parseFloat(lots || 0) * 100000).toFixed(2)}</span></div>
                <div className="flex justify-between mt-1"><span className="text-[#94A3B8]">Margin (10%)</span><span className="text-[#00D4AA]">${(prices[symbol] * parseFloat(lots || 0) * 100000 * 0.1).toFixed(2)}</span></div>
              </div>
            )}
            <button type="submit" className="btn-primary w-full">Place Order</button>
          </form>
        </div>

        {/* Open Positions */}
        <div className="card lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Open Positions ({openTrades.length})</h2>
          {openTrades.length === 0 ? <p className="text-[#94A3B8] text-sm">No open forex positions</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-[#94A3B8] text-xs">
                  <th className="text-left pb-2">Pair</th><th className="text-left pb-2">Side</th><th className="text-right pb-2">Lots</th><th className="text-right pb-2">Entry</th><th className="text-right pb-2">Current</th><th className="text-right pb-2">P&L</th><th></th>
                </tr></thead>
                <tbody>
                  {openTrades.map(t => (
                    <tr key={t.id} className="border-t border-[#2A2F45]">
                      <td className="py-2 font-medium">{t.symbol}</td>
                      <td className={t.side === 'buy' ? 'text-[#00D4AA]' : 'text-[#FF4757]'}>{t.side.toUpperCase()}</td>
                      <td className="text-right">{(t.quantity / 100000).toFixed(2)}</td>
                      <td className="text-right">{t.entry_price.toFixed(4)}</td>
                      <td className="text-right">{t.current_price?.toFixed(4)}</td>
                      <td className={`text-right font-medium ${t.pnl >= 0 ? 'text-[#00D4AA]' : 'text-[#FF4757]'}`}>${t.pnl?.toFixed(2)}</td>
                      <td className="text-right"><button onClick={() => closeTrade(t.id)} className="btn-outline text-xs !py-1 !px-3">Close</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
