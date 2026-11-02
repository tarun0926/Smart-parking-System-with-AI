import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserAPI } from '../../services/api';
import { User, Mail, Phone, Car, Shield, Bell, Save, CheckCircle2, AlertCircle } from 'lucide-react';

export const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [vehicle, setVehicle] = useState(user?.vehicle || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [saving, setSaving] = useState(false);

  // Sync state whenever authenticated user updates
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setVehicle(user.vehicle || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSavedSuccess(false);
    setErrorMessage('');
    setSaving(true);

    try {
      const res = await UserAPI.updateProfile({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        vehicle: vehicle.trim(),
        phone: phone.trim(),
      });

      if (res.user) {
        updateUser(res.user);
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <User className="w-6 h-6 text-blue-500" />
          <span>User Profile & Vehicle Settings</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">Manage personal details, registered vehicle plates, and account settings.</p>
      </div>

      {savedSuccess && (
        <div id="profile-success-alert" className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Profile changes updated successfully in database.</span>
        </div>
      )}

      {errorMessage && (
        <div id="profile-error-alert" className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
          <div className="w-16 h-16 rounded-full bg-blue-600/20 border-2 border-blue-500 flex items-center justify-center text-blue-400 font-bold text-2xl shadow-md">
            {name ? name.charAt(0).toUpperCase() : (user?.name?.charAt(0)?.toUpperCase() || '?')}
          </div>
          <div>
            <h2 id="profile-heading-name" className="text-lg font-bold text-white">{name || user?.name || 'Driver'}</h2>
            <p id="profile-heading-role" className="text-xs text-slate-400 capitalize">Role: {user?.role || 'user'}</p>
            <p id="profile-heading-email" className="text-xs text-blue-400 font-mono mt-0.5">{email || user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="profile-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="Your full name"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="profile-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="your.email@example.com"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Registered Vehicle Plate</label>
              <div className="relative">
                <Car className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="profile-vehicle"
                  type="text"
                  value={vehicle}
                  onChange={(e) => setVehicle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm font-mono text-emerald-400 focus:outline-none focus:border-blue-500"
                  placeholder="e.g. KA-01-AB-1234"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="profile-phone"
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              id="profile-submit"
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-2 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
