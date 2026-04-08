import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      await signup(name, email, password, referralCode || undefined);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#00D4AA] mb-4">
            <span className="text-2xl font-bold text-black">FT</span>
          </div>
          <h1 className="text-2xl font-bold">Create account</h1>
          <p className="text-[#94A3B8] mt-1">Start trading in minutes</p>
        </div>
        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && <div className="bg-[#FF4757]/10 border border-[#FF4757]/30 text-[#FF4757] px-4 py-2 rounded-lg text-sm">{error}</div>}
          <div>
            <label className="block text-sm text-[#94A3B8] mb-1">Full Name</label>
            <input type="text" className="input" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" required />
          </div>
          <div>
            <label className="block text-sm text-[#94A3B8] mb-1">Email</label>
            <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" required />
          </div>
          <div>
            <label className="block text-sm text-[#94A3B8] mb-1">Password</label>
            <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" required />
          </div>
          <div>
            <label className="block text-sm text-[#94A3B8] mb-1">Referral Code (optional)</label>
            <input type="text" className="input" value={referralCode} onChange={e => setReferralCode(e.target.value)} placeholder="Enter referral code" />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Creating...' : 'Create Account'}
          </button>
          <p className="text-center text-sm text-[#94A3B8]">
            Have an account? <Link to="/login" className="text-[#00D4AA] hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
