import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const COINS = {
  BTC: { name: 'Bitcoin', color: '#F7931A' },
  ETH: { name: 'Ethereum', color: '#627EEA' },
  SOL: { name: 'Solana', color: '#9945FF' },
  ADA: { name: 'Cardano', color: '#0033AD' },
};

export default function CryptoPage() {
  const { refreshUser } = useAuth();
  const [prices, setPrices] = useState({});
  const [portfolio, setPortfolio] = useState([]);
  const [selectedCoin, setSelectedCoin] = useState('BTC');
  const [tab, setTab] = useState('buy');
  const [amount, setAmount] = useState('');
  const [sellQty, setSellQty] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const fetchData = () => {
    api.get('/trading/prices/crypto').then(r => setPrices(r.data));
    api.get('/trading/portfolio').then(r => setPortfolio(r.data));
  };

  useEffect(() => {
    fetchData();
    const iv = setInterval(() => api.get('/trading/prices/crypto').then(r => setPrices(r.data)), 10000);
    return () => clearInterval(iv);
  }, []);

  const handleBuy = async (e) => {
    e.preventDefault();
    setMsg(''); setError('');
    const val = parseFloat(amount);
    if (!val || val <= 0) return setError('Enter valid amount');
    try {
      const res = await api.post('/trading/crypto/buy', { symbol: selectedCoin, amount: val });
      setMsg(`Bought ${res.data.quantity} ${selectedCoin} @ $${res.data.price}`);
      setAmount('');
      refreshUser();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Buy failed');
    }
  };

  const handleSell = async (e) => {
    e.preventDefault();
    setMsg(''); setError('');
    const qty = parseFloat(sellQty);
    if (!qty || qty <= 0) return setError('Enter valid quantity');
    try {
      const res = await api.post('/trading/crypto/sell', { symbol: selectedCoin, quantity: qty });
      setMsg(`Sold ${res.data.quantity} ${selectedCoin} @ $${res.data.price} for $${res.data.proceeds}`);
      setSellQty('');
      refreshUser();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Sell failed');
    }
  };

  const totalValue = portfolio.reduce((s, h) => s + h.value, 0);
  const holding = portfolio.find(p => p.symbol === selectedCoin);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Crypto Investing</h1>

      {/* Coins Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {Object.entries(COINS).map(([sym, info]) => {
          const h = portfolio.find(p => p.symbol === sym);
          return (
            <div key={sym} className={`card cursor-pointer transition-all ${selectedCoin === sym ? 'border-[#00D4AA]' : ''}`} onClick={() => setSelectedCoin(sym)}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: info.color }}>{sym[0]}</div>
                <div>
                  <p className="font-medium text-sm">{sym}</p>
                  <p className="text-xs text-[#94A3B8]">{info.name}</p>
                </div>
              </div>
              <p className="text-xl font-bold">${prices[sym]?.toLocaleString() || '---'}</p>
              {h && <p className="text-xs text-[#94A3B8] mt-1">Holding: {h.quantity.toFixed(6)} (${h.value.toFixed(2)})</p>}
            </div>
          );
        })}
      </div>

      {/* Portfolio Summary */}
      {portfolio.length > 0 && (
        <div className="card mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-[#94A3B8]">Total Portfolio Value</p>
              <p className="text-2xl font-bold text-[#00D4AA]">${totalValue.toFixed(2)}</p>
            </div>
            <div className="flex gap-6">
              {portfolio.map(h => (
                <div key={h.symbol} className="text-right">
                  <p className="text-sm font-medium">{h.symbol}</p>
                  <p className={`text-sm ${h.pnl >= 0 ? 'text-[#00D4AA]' : 'text-[#FF4757]'}`}>
                    {h.pnl >= 0 ? '+' : ''}{h.pnl_pct}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Buy/Sell Form */}
        <div className="card">
          <div className="flex gap-2 mb-4">
            <button onClick={() => setTab('buy')} className={`flex-1 py-2 rounded-lg text-sm font-medium ${tab === 'buy' ? 'bg-[#00D4AA] text-black' : 'bg-[#111827] text-[#94A3B8]'}`}>Buy</button>
            <button onClick={() => setTab('sell')} className={`flex-1 py-2 rounded-lg text-sm font-medium ${tab === 'sell' ? 'bg-[#FF4757] text-white' : 'bg-[#111827] text-[#94A3B8]'}`}>Sell</button>
          </div>

          {msg && <div className="bg-[#00D4AA]/10 border border-[#00D4AA]/30 text-[#00D4AA] px-3 py-2 rounded-lg text-sm mb-3">{msg}</div>}
          {error && <div className="bg-[#FF4757]/10 border border-[#FF4757]/30 text-[#FF4757] px-3 py-2 rounded-lg text-sm mb-3">{error}</div>}

          {tab === 'buy' ? (
            <form onSubmit={handleBuy} className="space-y-3">
              <p className="text-sm text-[#94A3B8]">Buy {selectedCoin} @ ${prices[selectedCoin]?.toLocaleString()}</p>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Amount (USD)</label>
                <input type="number" className="input" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 100" step="0.01" min="0" />
              </div>
              {amount && prices[selectedCoin] && (
                <p className="text-sm text-[#94A3B8]">You'll receive ~{(parseFloat(amount) / prices[selectedCoin]).toFixed(6)} {selectedCoin}</p>
              )}
              <div className="flex gap-2 flex-wrap">
                {[50, 100, 500, 1000].map(p => (
                  <button type="button" key={p} onClick={() => setAmount(p.toString())} className="px-3 py-1 bg-[#111827] border border-[#2A2F45] rounded text-xs text-[#94A3B8] hover:border-[#00D4AA]">${p}</button>
                ))}
              </div>
              <button type="submit" className="btn-primary w-full">Buy {selectedCoin}</button>
            </form>
          ) : (
            <form onSubmit={handleSell} className="space-y-3">
              <p className="text-sm text-[#94A3B8]">Sell {selectedCoin} @ ${prices[selectedCoin]?.toLocaleString()}</p>
              {holding ? (
                <>
                  <p className="text-sm">Available: <span className="font-medium text-[#00D4AA]">{holding.quantity.toFixed(6)} {selectedCoin}</span></p>
                  <div>
                    <label className="block text-sm text-[#94A3B8] mb-1">Quantity</label>
                    <input type="number" className="input" value={sellQty} onChange={e => setSellQty(e.target.value)} placeholder="e.g. 0.001" step="0.000001" min="0" />
                  </div>
                  <button type="button" onClick={() => setSellQty(holding.quantity.toString())} className="text-xs text-[#00D4AA] hover:underline">Sell All</button>
                  {sellQty && prices[selectedCoin] && (
                    <p className="text-sm text-[#94A3B8]">Proceeds: ${(parseFloat(sellQty) * prices[selectedCoin]).toFixed(2)}</p>
                  )}
                  <button type="submit" className="btn-danger w-full">Sell {selectedCoin}</button>
                </>
              ) : (
                <p className="text-[#94A3B8] text-sm">You don't hold any {selectedCoin}</p>
              )}
            </form>
          )}
        </div>

        {/* Holdings Detail */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Your Holdings</h2>
          {portfolio.length === 0 ? <p className="text-[#94A3B8] text-sm">No crypto holdings yet. Buy some coins to get started!</p> : (
            <div className="space-y-4">
              {portfolio.map(h => (
                <div key={h.id} className="bg-[#111827] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: COINS[h.symbol]?.color }}>{h.symbol[0]}</div>
                      <div>
                        <p className="font-medium">{h.symbol}</p>
                        <p className="text-xs text-[#94A3B8]">{COINS[h.symbol]?.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${h.value.toFixed(2)}</p>
                      <p className={`text-sm ${h.pnl >= 0 ? 'text-[#00D4AA]' : 'text-[#FF4757]'}`}>
                        {h.pnl >= 0 ? '+' : ''}${h.pnl.toFixed(2)} ({h.pnl_pct}%)
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-[#94A3B8]">
                    <span>Qty: {h.quantity.toFixed(6)}</span>
                    <span>Avg: ${h.avg_price.toLocaleString()}</span>
                    <span>Now: ${h.current_price.toLocaleString()}</span>
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
