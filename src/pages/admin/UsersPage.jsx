import React, { useState, useEffect } from 'react';
import { UserAPI } from '../../services/api';
import { mockUsersList } from '../../data/mockData';
import StatusBadge from '../../components/common/StatusBadge';
import {
  Users,
  Search,
  UserCheck,
  Shield,
  Trash2,
  UserX,
  UserPlus,
  RefreshCw,
  Check,
  AlertTriangle,
  X,
} from 'lucide-react';

export const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [actionMessage, setActionMessage] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'Driver',
    phone: '',
    vehicle: '',
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await UserAPI.getAllUsers();
      if (Array.isArray(res.data)) {
        setUsers(res.data);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.warn('[UsersPage] Error fetching users:', err.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === 'Active' ? 'Suspended' : 'Active';
    try {
      await UserAPI.updateStatus(user.id, { status: nextStatus });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u))
      );
      setActionMessage({ type: 'success', text: `User ${user.name} marked as ${nextStatus}` });
    } catch (err) {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u))
      );
      setActionMessage({ type: 'success', text: `User ${user.name} marked as ${nextStatus} (Local)` });
    }
    setTimeout(() => setActionMessage(null), 3500);
  };

  const handleToggleRole = async (user) => {
    const nextRole = user.role === 'Driver' ? 'Owner' : 'Driver';
    try {
      await UserAPI.updateStatus(user.id, { role: nextRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: nextRole } : u))
      );
      setActionMessage({ type: 'success', text: `User ${user.name} role changed to ${nextRole}` });
    } catch (err) {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: nextRole } : u))
      );
      setActionMessage({ type: 'success', text: `User ${user.name} role changed to ${nextRole} (Local)` });
    }
    setTimeout(() => setActionMessage(null), 3500);
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to delete user "${user.name}"?`)) return;
    try {
      await UserAPI.deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setActionMessage({ type: 'success', text: `User ${user.name} removed successfully` });
    } catch (err) {
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setActionMessage({ type: 'success', text: `User ${user.name} removed (Local)` });
    }
    setTimeout(() => setActionMessage(null), 3500);
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;

    const created = {
      id: `u-${Date.now()}`,
      ...newUser,
      status: 'Active',
    };

    setUsers((prev) => [created, ...prev]);
    setShowAddModal(false);
    setNewUser({ name: '', email: '', role: 'Driver', phone: '', vehicle: '' });
    setActionMessage({ type: 'success', text: `User ${created.name} registered successfully` });
    setTimeout(() => setActionMessage(null), 3500);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.vehicle?.toLowerCase().includes(searchTerm.toLowerCase());
    if (roleFilter === 'driver') return matchesSearch && (u.role === 'Driver' || u.role === 'user');
    if (roleFilter === 'owner') return matchesSearch && u.role === 'Owner';
    if (roleFilter === 'admin') return matchesSearch && u.role === 'Admin';
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-500" />
            <span>Platform User Directory</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage registered vehicle drivers, parking garage owners, and admin access levels.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="p-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl text-xs transition-colors"
            title="Refresh Users"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-2 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register New User</span>
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)}>
            <X className="w-4 h-4 text-slate-400 hover:text-white" />
          </button>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or vehicle plate..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 w-full sm:w-auto"
        >
          <option value="all">All Roles ({users.length})</option>
          <option value="driver">Drivers Only</option>
          <option value="owner">Owners Only</option>
          <option value="admin">Administrators</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4">User Details</th>
                <th className="p-4">Role</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Vehicle Plate</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Management Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400">
                    No users matching "{searchTerm}" found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isSuspended = u.status === 'Suspended';
                  return (
                    <tr key={u.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-white">{u.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleRole(u)}
                          title="Click to toggle role between Driver and Owner"
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all ${
                            u.role === 'Owner'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                              : u.role === 'Admin'
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20'
                          }`}
                        >
                          {u.role || 'Driver'}
                        </button>
                      </td>
                      <td className="p-4 text-slate-300 font-mono">{u.phone || '—'}</td>
                      <td className="p-4 font-mono font-medium text-emerald-400">{u.vehicle || '—'}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            isSuspended
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          {u.status || 'Active'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
                              isSuspended
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                            }`}
                            title={isSuspended ? 'Reactivate account' : 'Suspend account'}
                          >
                            {isSuspended ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                            <span className="hidden sm:inline text-[11px]">
                              {isSuspended ? 'Activate' : 'Suspend'}
                            </span>
                          </button>

                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add New User */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-400" />
                <span>Register Platform User</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="e.g. rahul@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Driver">Driver</option>
                    <option value="Owner">Parking Owner</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Vehicle Plate (Drivers)</label>
                <input
                  type="text"
                  value={newUser.vehicle}
                  onChange={(e) => setNewUser({ ...newUser, vehicle: e.target.value })}
                  placeholder="KA-05-EV-4092"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl"
                >
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
