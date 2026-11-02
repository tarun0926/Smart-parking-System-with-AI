import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import RoleSwitcher from './RoleSwitcher';
import { Car, MapPin, User, LogOut, Menu, X, Shield, Store, LayoutDashboard } from 'lucide-react';

export const Navbar = () => {
  const { role, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const getDashboardPath = () => {
    if (role === 'owner') return '/owner/dashboard';
    if (role === 'admin') return '/admin/dashboard';
    return '/user/dashboard';
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <RoleSwitcher />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Car className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold text-white tracking-tight">SmartPark</span>
                <span className="text-xs font-extrabold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">AI</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Smart Parking System</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <Link
              to="/"
              className={`hover:text-white transition-colors ${location.pathname === '/' ? 'text-blue-400 font-semibold' : ''}`}
            >
              Home
            </Link>
            <Link
              to="/user/map"
              className={`hover:text-white transition-colors flex items-center gap-1.5 ${
                location.pathname === '/user/map' ? 'text-blue-400 font-semibold' : ''
              }`}
            >
              <MapPin className="w-4 h-4 text-blue-400" />
              <span>Live Parking Map</span>
            </Link>

            {role !== 'guest' ? (
              <Link
                to={getDashboardPath()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 text-blue-400" />
                <span>Dashboard ({role.toUpperCase()})</span>
              </Link>
            ) : null}
          </nav>

          {/* Right Action Area */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
            <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold text-sm">
                    {user.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="text-left leading-tight">
                    <p className="text-xs font-semibold text-white">{user.name}</p>
                    <p className="text-[10px] text-slate-400 capitalize">{user.role}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  title="Logout"
                  className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 border border-slate-700 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/user/map"
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/25 transition-all"
                >
                  Find Parking
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-6 space-y-3">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-slate-200 hover:text-blue-400"
          >
            Home
          </Link>
          <Link
            to="/user/map"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-slate-200 hover:text-blue-400"
          >
            Live Parking Map
          </Link>

          {role !== 'guest' && (
            <Link
              to={getDashboardPath()}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-medium text-blue-400"
            >
              Go to {role.toUpperCase()} Dashboard
            </Link>
          )}

          <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
            {user ? (
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                  navigate('/');
                }}
                className="w-full flex items-center justify-center gap-2 py-2 bg-rose-950/60 text-rose-300 rounded-lg border border-rose-800"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 bg-slate-800 text-slate-200 rounded-lg"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 bg-blue-600 text-white font-semibold rounded-lg"
                >
                  Register Account
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
