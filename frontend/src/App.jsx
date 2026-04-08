import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import WalletPage from './pages/WalletPage';
import FuturesPage from './pages/FuturesPage';
import ForexPage from './pages/ForexPage';
import CryptoPage from './pages/CryptoPage';
import BotsPage from './pages/BotsPage';
import ReferralsPage from './pages/ReferralsPage';
import AdminPage from './pages/AdminPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-[#00D4AA] border-t-transparent rounded-full animate-spin" /></div>;
  return user ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-[#00D4AA] border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" />;
  return user.role === 'admin' ? children : <Navigate to="/dashboard" />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/wallet" element={<ProtectedRoute><Layout><WalletPage /></Layout></ProtectedRoute>} />
      <Route path="/futures" element={<ProtectedRoute><Layout><FuturesPage /></Layout></ProtectedRoute>} />
      <Route path="/forex" element={<ProtectedRoute><Layout><ForexPage /></Layout></ProtectedRoute>} />
      <Route path="/crypto" element={<ProtectedRoute><Layout><CryptoPage /></Layout></ProtectedRoute>} />
      <Route path="/bots" element={<ProtectedRoute><Layout><BotsPage /></Layout></ProtectedRoute>} />
      <Route path="/referrals" element={<ProtectedRoute><Layout><ReferralsPage /></Layout></ProtectedRoute>} />
      <Route path="/admin" element={<AdminRoute><Layout><AdminPage /></Layout></AdminRoute>} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
