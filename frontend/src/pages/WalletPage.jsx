import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';

export default function WalletPage() {
  const { user, refreshUser } = useAuth();
  const [amount, setAmount] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState('deposit');

  const loadTxns = () => api.get('/wallet/transactions').then(r => setTransactions(r.data));

  useEffect(() => { loadTxns(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(''); setError('');
    const val = parseFloat(amount);
    if (!val || val <= 0) return setError('Enter a valid amount');
    try {
      const endpoint = tab === 'deposit' ? '/wallet/deposit' : '/wallet/withdraw';
      const res = await api.post(endpoint, { amount: val });
      setMsg(res.data.message);
      setAmount('');
      refreshUser();
      loadTxns();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed');
    }
  };

  const presets = [100, 500, 1000, 5000, 10000, 50000];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Wallet</h1>

      <div className="card mb-6 text-center">
        <p className="text-[#94A3B8] text-sm">Available Balance</p>
        <p className="text-4xl font-bold text-[#00D4AA] mt-2">
          ${(user?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex gap-2 mb-4">
            <button onClick={() => setTab('deposit')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'deposit' ? 'bg-[#00D4AA] text-black' : 'bg-[#111827] text-[#94A3B8]'}`}>
              <ArrowDownToLine size={14} className="inline mr-1 -mt-0.5" /> Deposit
            </button>
            <button onClick={() => setTab('withdraw')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'withdraw' ? 'bg-[#FF4757] text-white' : 'bg-[#111827] text-[#94A3B8]'}`}>
              <ArrowUpFromLine size={14} className="inline mr-1 -mt-0.5" /> Withdraw
            </button>
          </div>

          {msg && <div className="bg-[#00D4AA]/10 border border-[#00D4AA]/30 text-[#00D4AA] px-4 py-2 rounded-lg text-sm mb-4">{msg}</div>}
          {error && <div className="bg-[#FF4757]/10 border border-[#FF4757]/30 text-[#FF4757] px-4 py-2 rounded-lg text-sm mb-4">{error}</div>}

          <form onSubmit={handleSubmit}>
            <label className="block text-sm text-[#94A3B8] mb-1">Amount (USD)</label>
            <input type="number" className="input mb-3" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Enter amount" step="0.01" min="0" />
            <div className="flex flex-wrap gap-2 mb-4">
              {presets.map(p => (
                <button type="button" key={p} onClick={() => setAmount(p.toString())} className="px-3 py-1.5 bg-[#111827] border border-[#2A2F45] rounded-lg text-xs text-[#94A3B8] hover:border-[#00D4AA] hover:text-[#00D4AA] transition-colors">
                  ${p.toLocaleString()}
                </button>
              ))}
            </div>
            <button type="submit" className={tab === 'deposit' ? 'btn-primary w-full' : 'btn-danger w-full'}>
              {tab === 'deposit' ? 'Deposit Funds' : 'Withdraw Funds'}
            </button>
          </form>
          <p className="text-xs text-[#94A3B8] mt-3 text-center">This is a demo. No real money is involved.</p>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Transaction History</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {transactions.length === 0 ? (
              <p className="text-[#94A3B8] text-sm">No transactions yet</p>
            ) : transactions.map(t => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-[#2A2F45] last:border-0">
                <div>
                  <p className="text-sm font-medium capitalize">{t.type.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-[#94A3B8]">{new Date(t.created_at).toLocaleString()}</p>
                </div>
                <span className={`text-sm font-semibold ${t.amount >= 0 ? 'text-[#00D4AA]' : 'text-[#FF4757]'}`}>
                  {t.amount >= 0 ? '+' : ''}${Math.abs(t.amount).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
