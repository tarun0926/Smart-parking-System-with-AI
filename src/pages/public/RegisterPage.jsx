import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Car, Lock, Mail, User, Phone, ArrowRight, AlertTriangle, ShieldCheck } from 'lucide-react';

export const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [roleType, setRoleType] = useState('user');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      const result = await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim(),
        vehicle: roleType === 'user' ? vehicle.trim() : '',
        role: roleType,
      });

      if (result?.success) {
        if (roleType === 'owner') navigate('/owner/dashboard');
        else navigate('/user/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-950">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 mb-2">
            <Car className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-xs text-slate-400">Join SmartPark AI to reserve slots and access prediction analytics</p>
        </div>

        {error && (
          <div id="register-error" className="flex items-center gap-2 p-3 rounded-lg bg-rose-950/50 border border-rose-700/60 text-rose-300 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Account Role</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="role-user-btn"
                type="button"
                onClick={() => setRoleType('user')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                  roleType === 'user'
                    ? 'bg-blue-600/20 text-blue-400 border-blue-500'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                Driver (User)
              </button>
              <button
                id="role-owner-btn"
                type="button"
                onClick={() => setRoleType('owner')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                  roleType === 'owner'
                    ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                Parking Owner
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="register-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                placeholder="Alex Morgan"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="register-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                placeholder="alex@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="register-phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            {roleType === 'user' ? (
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Vehicle Plate</label>
                <input
                  id="register-vehicle"
                  type="text"
                  value={vehicle}
                  onChange={(e) => setVehicle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="KA-05-EV-4092"
                />
              </div>
            ) : (
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Owner Type</label>
                <div className="p-2 text-slate-400 text-xs bg-slate-950 rounded-lg border border-slate-800">
                  Facility Operator
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="register-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            id="register-submit"
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all mt-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Creating account...
              </span>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 font-semibold hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
