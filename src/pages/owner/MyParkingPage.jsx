import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ParkingAPI } from '../../services/api';
import { mockParkingLocations } from '../../data/mockData';
import StatusBadge from '../../components/common/StatusBadge';
import {
  Building2,
  Plus,
  MapPin,
  Grid,
  Edit,
  Trash2,
  RefreshCw,
  X,
  Check,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';

export const MyParkingPage = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLoc, setEditingLoc] = useState(null);
  const [notification, setNotification] = useState(null);

  const [form, setForm] = useState({
    name: '',
    address: '',
    pricePerHour: 45,
    totalSlots: 24,
    type: 'Multi-level Covered',
    facilities: 'EV Charging, 24/7 Security, CCTV',
  });

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const res = await ParkingAPI.getAll();
      if (Array.isArray(res.data) && res.data.length > 0) {
        setLocations(res.data);
      } else {
        setLocations(mockParkingLocations);
      }
    } catch (err) {
      console.warn('[MyParkingPage] Error fetching locations:', err.message);
      setLocations(mockParkingLocations);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const notify = (text) => {
    setNotification(text);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        address: form.address,
        pricePerHour: Number(form.pricePerHour),
        totalSlots: Number(form.totalSlots),
        type: form.type,
        facilities: form.facilities.split(',').map((f) => f.trim()),
      };

      const res = await ParkingAPI.create(payload);
      const created = res.data || {
        id: `p-${Date.now()}`,
        ...payload,
        availableSlots: payload.totalSlots,
        status: 'Active',
      };

      setLocations((prev) => [created, ...prev]);
      setShowAddModal(false);
      setForm({
        name: '',
        address: '',
        pricePerHour: 45,
        totalSlots: 24,
        type: 'Multi-level Covered',
        facilities: 'EV Charging, 24/7 Security, CCTV',
      });
      notify(`Parking facility "${created.name}" created successfully!`);
    } catch (err) {
      const created = {
        id: `p-${Date.now()}`,
        name: form.name,
        address: form.address,
        pricePerHour: Number(form.pricePerHour),
        totalSlots: Number(form.totalSlots),
        availableSlots: Number(form.totalSlots),
        type: form.type,
        status: 'Active',
        facilities: form.facilities.split(',').map((f) => f.trim()),
      };
      setLocations((prev) => [created, ...prev]);
      setShowAddModal(false);
      notify(`Parking facility "${created.name}" created (In-Memory mode)`);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingLoc) return;

    const locId = editingLoc._id || editingLoc.id;
    try {
      await ParkingAPI.update(locId, editingLoc);
      setLocations((prev) =>
        prev.map((loc) => ((loc._id || loc.id) === locId ? editingLoc : loc))
      );
      setEditingLoc(null);
      notify(`Facility "${editingLoc.name}" updated!`);
    } catch (err) {
      setLocations((prev) =>
        prev.map((loc) => ((loc._id || loc.id) === locId ? editingLoc : loc))
      );
      setEditingLoc(null);
      notify(`Facility "${editingLoc.name}" updated (Local)`);
    }
  };

  const handleDelete = async (loc) => {
    if (!window.confirm(`Delete facility "${loc.name}"? All slot bays will be removed.`)) return;
    const locId = loc._id || loc.id;
    try {
      await ParkingAPI.delete(locId);
      setLocations((prev) => prev.filter((p) => (p._id || p.id) !== locId));
      notify(`Facility "${loc.name}" removed.`);
    } catch (err) {
      setLocations((prev) => prev.filter((p) => (p._id || p.id) !== locId));
      notify(`Facility "${loc.name}" removed (Local).`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-500" />
            <span>My Parking Facilities</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure hourly rates, inspect slot bay capacity, and adjust garage operational rules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLocations}
            disabled={loading}
            className="p-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl text-xs transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Parking Facility</span>
          </button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)}>
            <X className="w-4 h-4 text-slate-400 hover:text-white" />
          </button>
        </div>
      )}

      {/* Parking Facility Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {locations.map((p) => (
          <div
            key={p._id || p.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 font-mono">
                    Facility ID: {p._id || p.id}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-0.5">{p.name}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>{p.address}</span>
                  </p>
                </div>
                <StatusBadge status={p.status || 'Active'} />
              </div>

              {/* Facility Capacity Metrics */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Capacity</span>
                  <span className="font-bold text-white font-mono">{p.totalSlots} Slots</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Available</span>
                  <span className="font-bold text-emerald-400 font-mono">{p.availableSlots} Bays Free</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Hourly Fee</span>
                  <span className="font-bold text-blue-400 font-mono">₹{p.pricePerHour}/hr</span>
                </div>
              </div>

              {/* Facilities tags */}
              {p.facilities && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(Array.isArray(p.facilities) ? p.facilities : [p.facilities]).map((f, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 flex items-center justify-between gap-2 border-t border-slate-800">
              <Link
                to={`/owner/slots?location=${p._id || p.id}`}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Grid className="w-3.5 h-3.5 text-emerald-400" />
                <span>Manage Slot Bays</span>
              </Link>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditingLoc(p)}
                  className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                  title="Edit Facility"
                >
                  <Edit className="w-4 h-4 text-blue-400" />
                </button>
                <button
                  onClick={() => handleDelete(p)}
                  className="p-2 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors"
                  title="Delete Facility"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Add Parking */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <span>Register New Parking Lot</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Facility / Lot Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Phoenix Metro Station Garage"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Address *</label>
                <input
                  type="text"
                  required
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="e.g. Plot 14, Outer Ring Road, Mahadevapura"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Hourly Fee (₹) *</label>
                  <input
                    type="number"
                    required
                    min="10"
                    value={form.pricePerHour}
                    onChange={(e) => setForm({ ...form, pricePerHour: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Total Bays to Create</label>
                  <input
                    type="number"
                    required
                    min="4"
                    max="100"
                    value={form.totalSlots}
                    onChange={(e) => setForm({ ...form, totalSlots: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Garage Structure Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Multi-level Covered">Multi-level Covered</option>
                  <option value="Underground Basement">Underground Basement</option>
                  <option value="Surface Open Parking">Surface Open Parking</option>
                  <option value="Valet Parking Yard">Valet Parking Yard</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Amenities & Features (comma-separated)</label>
                <input
                  type="text"
                  value={form.facilities}
                  onChange={(e) => setForm({ ...form, facilities: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl"
                >
                  Register Lot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Parking */}
      {editingLoc && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit className="w-5 h-5 text-emerald-400" />
                <span>Edit Parking Facility</span>
              </h3>
              <button onClick={() => setEditingLoc(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Facility Name</label>
                <input
                  type="text"
                  required
                  value={editingLoc.name}
                  onChange={(e) => setEditingLoc({ ...editingLoc, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Address</label>
                <input
                  type="text"
                  required
                  value={editingLoc.address}
                  onChange={(e) => setEditingLoc({ ...editingLoc, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Price Per Hour (₹)</label>
                  <input
                    type="number"
                    required
                    value={editingLoc.pricePerHour}
                    onChange={(e) =>
                      setEditingLoc({ ...editingLoc, pricePerHour: Number(e.target.value) })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Operating Status</label>
                  <select
                    value={editingLoc.status || 'Active'}
                    onChange={(e) => setEditingLoc({ ...editingLoc, status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Full">Full</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingLoc(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl"
                >
                  Save Facility Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyParkingPage;
