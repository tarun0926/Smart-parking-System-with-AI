import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, ArrowLeft, LogIn } from 'lucide-react';

export const ProtectedRoute = ({ allowedRoles, children }) => {
  const { isAuthenticated, loading, role, user } = useAuth();
  const location = useLocation();

  // While session is being restored, show a loading state
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Verifying session…</p>
        </div>
      </div>
    );
  }

  // Not authenticated — redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Normalize role comparison
  const userRole = (role || 'user').toLowerCase();
  const normalizedAllowed = allowedRoles
    ? allowedRoles.map((r) => r.toLowerCase().replace('driver', 'user'))
    : null;

  // Role not allowed — show access denied
  if (normalizedAllowed && !normalizedAllowed.includes(userRole)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-rose-500/30 rounded-2xl p-6 shadow-2xl text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
            <ShieldAlert className="w-6 h-6" />
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
              Access Restricted
            </span>
            <h2 className="text-xl font-bold text-white mt-1">Role Authorization Required</h2>
            <p className="text-xs text-slate-400 mt-2">
              This portal requires <strong className="text-white capitalize">{allowedRoles.join(' or ')}</strong> permissions.
              You are currently signed in as <strong className="text-rose-300 capitalize">{user?.name}</strong> ({role}).
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={role === 'owner' ? '/owner/dashboard' : role === 'admin' ? '/admin/dashboard' : '/user/dashboard'}
              className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to My Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
