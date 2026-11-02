import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Car, Lock, Mail, ArrowRight, AlertTriangle } from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    try {
      const result = await login(email.trim().toLowerCase(), password);
      if (result?.success) {
        const userRole = result.user?.role || 'user';
        if (userRole === 'owner') navigate('/owner/dashboard');
        else if (userRole === 'admin') navigate('/admin/dashboard');
        else navigate('/user/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials and try again.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-950">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 mb-2">
            <Car className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="text-xs text-slate-400">Log in to manage your smart parking reservations</p>
        </div>

        {/* Error Message */}
        {error && (
          <div id="login-error" className="flex items-center gap-2 p-3 rounded-lg bg-rose-950/50 border border-rose-700/60 text-rose-300 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="name@domain.com"
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            id="login-submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all mt-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Signing In...
              </span>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-400 font-semibold hover:underline">
            Register now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
