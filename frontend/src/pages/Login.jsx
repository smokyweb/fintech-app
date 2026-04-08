import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      navigate(data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
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
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-[#94A3B8] mt-1">Sign in to your trading account</p>
        </div>
        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && <div className="bg-[#FF4757]/10 border border-[#FF4757]/30 text-[#FF4757] px-4 py-2 rounded-lg text-sm">{error}</div>}
          <div>
            <label className="block text-sm text-[#94A3B8] mb-1">Email</label>
            <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" required />
          </div>
          <div>
            <label className="block text-sm text-[#94A3B8] mb-1">Password</label>
            <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" required />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <p className="text-center text-sm text-[#94A3B8]">
            No account? <Link to="/signup" className="text-[#00D4AA] hover:underline">Sign up</Link>
          </p>
        </form>
        <p className="text-center text-xs text-[#94A3B8] mt-6">Demo app for <span className="text-[#00D4AA]">bluesapps.com</span></p>
      </div>
    </div>
  );
}
