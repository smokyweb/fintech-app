import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Wallet, TrendingUp, Globe, Bitcoin,
  Bot, Users, Shield, LogOut, Menu, X
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/wallet', label: 'Wallet', icon: Wallet },
  { path: '/futures', label: 'Futures', icon: TrendingUp },
  { path: '/forex', label: 'Forex', icon: Globe },
  { path: '/crypto', label: 'Crypto', icon: Bitcoin },
  { path: '/bots', label: 'Bots', icon: Bot },
  { path: '/referrals', label: 'Referrals', icon: Users },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#111827] border-r border-[#2A2F45] transform transition-transform duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static`}>
        <div className="p-5 border-b border-[#2A2F45]">
          <Link to="/dashboard" className="flex items-center gap-2 no-underline">
            <div className="w-8 h-8 rounded-lg bg-[#00D4AA] flex items-center justify-center font-bold text-black text-sm">FT</div>
            <span className="text-lg font-bold text-white">FinTech Pro</span>
          </Link>
        </div>
        <nav className="p-3 flex flex-col gap-1">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm no-underline transition-colors ${
                location.pathname === path
                  ? 'bg-[#00D4AA]/10 text-[#00D4AA]'
                  : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm no-underline transition-colors ${
                location.pathname === '/admin'
                  ? 'bg-[#00D4AA]/10 text-[#00D4AA]'
                  : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
              }`}
            >
              <Shield size={18} />
              Admin
            </Link>
          )}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#2A2F45]">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-[#94A3B8] truncate">{user?.email}</p>
            </div>
            <button onClick={handleLogout} className="p-2 text-[#94A3B8] hover:text-[#FF4757] transition-colors" title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Main content */}
      <main className="flex-1 min-h-screen lg:ml-0">
        <header className="sticky top-0 z-30 bg-[#0A0F1E]/80 backdrop-blur-md border-b border-[#2A2F45] px-4 py-3 flex items-center justify-between lg:px-6">
          <button className="lg:hidden p-2 text-[#94A3B8]" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[#94A3B8]">Balance:</span>
            <span className="text-sm font-bold text-[#00D4AA]">${(user?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </header>
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
