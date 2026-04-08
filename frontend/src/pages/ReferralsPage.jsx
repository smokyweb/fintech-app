import { useState, useEffect } from 'react';
import api from '../api';
import { Copy, Check, Users, Gift } from 'lucide-react';

export default function ReferralsPage() {
  const [referralCode, setReferralCode] = useState('');
  const [stats, setStats] = useState({ referrals: [], total_referrals: 0, total_bonus: 0 });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get('/referrals/code').then(r => setReferralCode(r.data.referral_code));
    api.get('/referrals/stats').then(r => setStats(r.data));
  }, []);

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Referral Rewards</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card text-center">
          <Users size={24} className="mx-auto mb-2 text-[#818CF8]" />
          <p className="text-2xl font-bold">{stats.total_referrals}</p>
          <p className="text-sm text-[#94A3B8]">Total Referrals</p>
        </div>
        <div className="card text-center">
          <Gift size={24} className="mx-auto mb-2 text-[#00D4AA]" />
          <p className="text-2xl font-bold text-[#00D4AA]">${stats.total_bonus.toFixed(2)}</p>
          <p className="text-sm text-[#94A3B8]">Total Bonus Earned</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-[#94A3B8] mb-2">Bonus Rate</p>
          <p className="text-2xl font-bold text-[#FFA502]">5%</p>
          <p className="text-sm text-[#94A3B8]">of friend's first deposit</p>
        </div>
      </div>

      {/* Referral Code */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-3">Your Referral Code</h2>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-[#111827] border border-[#2A2F45] rounded-lg px-4 py-3 font-mono text-lg text-[#00D4AA] tracking-widest">
            {referralCode}
          </div>
          <button onClick={copyCode} className="btn-primary flex items-center gap-2 !px-4">
            {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy</>}
          </button>
        </div>
        <p className="text-sm text-[#94A3B8] mt-3">
          Share this code with friends. When they sign up and make their first deposit, you earn a 5% bonus!
        </p>
      </div>

      {/* Referrals List */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Referral History</h2>
        {stats.referrals.length === 0 ? (
          <div className="text-center py-8">
            <Users size={40} className="mx-auto mb-3 text-[#94A3B8]" />
            <p className="text-[#94A3B8]">No referrals yet. Share your code to start earning!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-[#94A3B8] text-xs">
                <th className="text-left pb-3">User</th>
                <th className="text-left pb-3">Status</th>
                <th className="text-right pb-3">Bonus</th>
                <th className="text-right pb-3">Date</th>
              </tr></thead>
              <tbody>
                {stats.referrals.map(r => (
                  <tr key={r.id} className="border-t border-[#2A2F45]">
                    <td className="py-3">
                      <p className="font-medium">{r.referred_name}</p>
                      <p className="text-xs text-[#94A3B8]">{r.referred_email}</p>
                    </td>
                    <td>
                      <span className={`text-xs px-2 py-1 rounded ${r.status === 'completed' ? 'bg-[#00D4AA]/10 text-[#00D4AA]' : 'bg-[#FFA502]/10 text-[#FFA502]'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="text-right font-medium text-[#00D4AA]">
                      {r.bonus_amount > 0 ? `+$${r.bonus_amount.toFixed(2)}` : '--'}
                    </td>
                    <td className="text-right text-[#94A3B8]">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
