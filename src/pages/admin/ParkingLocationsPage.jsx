import React, { useState, useEffect } from 'react';
import { ParkingAPI } from '../../services/api';
import { mockParkingLocations } from '../../data/mockData';
import StatusBadge from '../../components/common/StatusBadge';
import {
  Map,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Wrench,
  Building2,
  MapPin,
  RefreshCw,
  X,
  Check,
} from 'lucide-react';

export const ParkingLocationsPage = () => {
  const [locations, setLocations] = useState(mockParkingLocations);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingParking, setEditingParking] = useState(null);
  const [notification, setNotification] = useState(null);

  const [parkingForm, setParkingForm] = useState({
    name: '',
    address: '',
    pricePerHour: 40,
    totalSlots: 30,
    type: 'Multi-level Covered',
    facilities: 'EV Fast Charging, CCTV, Disabled Access',
  });

  const fetchParking = async () => {
    try {
      setLoading(true);
      const res = await ParkingAPI.getAll();
      if (res.data && res.data.length > 0) {
        setLocations(res.data);
      }
    } catch (err) {
      console.warn('[ParkingLocationsPage] Using fallback parking locations:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParking();
  }, []);

  const notify = (text) => {
    setNotification(text);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleCreateParking = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: parkingForm.name,
        address: parkingForm.address,
        pricePerHour: Number(parkingForm.pricePerHour),
        totalSlots: Number(parkingForm.totalSlots),
        type: parkingForm.type,
        facilities: parkingForm.facilities.split(',').map((f) => f.trim()),
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
      setParkingForm({
        name: '',
        address: '',
        pricePerHour: 40,
        totalSlots: 30,
        type: 'Multi-level Covered',
        facilities: 'EV Fast Charging, CCTV, Disabled Access',
      });
      notify(`Parking facility "${created.name}" created successfully!`);
    } catch (err) {
      // Local fallback
      const created = {
        id: `p-${Date.now()}`,
        name: parkingForm.name,
        address: parkingForm.address,
        pricePerHour: Number(parkingForm.pricePerHour),
        totalSlots: Number(parkingForm.totalSlots),
        availableSlots: Number(parkingForm.totalSlots),
        status: 'Active',
        type: parkingForm.type,
        facilities: parkingForm.facilities.split(',').map((f) => f.trim()),
      };
      setLocations((prev) => [created, ...prev]);
      setShowAddModal(false);
      notify(`Parking facility "${created.name}" created (In-Memory mode)`);
    }
  };

  const handleUpdateParking = async (e) => {
    e.preventDefault();
    if (!editingParking) return;

    try {
      await ParkingAPI.update(editingParking.id, editingParking);
      setLocations((prev) =>
        prev.map((p) => (p.id === editingParking.id ? editingParking : p))
      );
      setEditingParking(null);
      notify(`Facility "${editingParking.name}" updated successfully!`);
    } catch (err) {
      setLocations((prev) =>
        prev.map((p) => (p.id === editingParking.id ? editingParking : p))
      );
      setEditingParking(null);
      notify(`Facility "${editingParking.name}" updated (Local)`);
    }
  };

  const handleDeleteParking = async (loc) => {
    if (!window.confirm(`Are you sure you want to delete parking facility "${loc.name}"?`)) return;
    try {
      await ParkingAPI.delete(loc.id);
      setLocations((prev) => prev.filter((p) => p.id !== loc.id));
      notify(`Parking facility "${loc.name}" deleted.`);
    } catch (err) {
      setLocations((prev) => prev.filter((p) => p.id !== loc.id));
      notify(`Parking facility "${loc.name}" deleted (Local).`);
    }
  };

  const handleToggleMaintenance = async (loc) => {
    const nextStatus = loc.status === 'Active' ? 'Maintenance' : 'Active';
    try {
      await ParkingAPI.update(loc.id, { status: nextStatus });
      setLocations((prev) =>
        prev.map((p) => (p.id === loc.id ? { ...p, status: nextStatus } : p))
      );
      notify(`Status of "${loc.name}" set to ${nextStatus}`);
    } catch (err) {
      setLocations((prev) =>
        prev.map((p) => (p.id === loc.id ? { ...p, status: nextStatus } : p))
      );
      notify(`Status of "${loc.name}" set to ${nextStatus} (Local)`);
    }
  };

  const filtered = locations.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.address?.toLowerCase().includes(searchTerm.toLowerCase());
    if (statusFilter === 'active') return matchesSearch && p.status === 'Active';
    if (statusFilter === 'maintenance') return matchesSearch && p.status === 'Maintenance';
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Map className="w-6 h-6 text-purple-500" />
            <span>Parking Locations & Facilities</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Audit registered garage facilities, adjust hourly pricing rates, and manage operational statuses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchParking}
            disabled={loading}
            className="p-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl text-xs transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Parking Spot</span>
          </button>
        </div>
      </div>

      {/* Action Notification */}
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

      {/* Search & Filter */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search facility name, address, or district..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 w-full sm:w-auto"
        >
          <option value="all">All Statuses ({locations.length})</option>
          <option value="active">Active Only</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      {/* Locations Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Facility Name & Address</th>
                <th className="p-4">Garage Type</th>
                <th className="p-4">Capacity</th>
                <th className="p-4">Available Bays</th>
                <th className="p-4">Rate (₹/hr)</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">
                    No parking locations matching "{searchTerm}" found.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-white text-sm">{p.name}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-purple-400 shrink-0" />
                        <span>{p.address}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-300">{p.type || 'Multi-level Covered'}</td>
                    <td className="p-4 font-mono font-semibold text-white">{p.totalSlots} Slots</td>
                    <td className="p-4 font-mono text-emerald-400 font-bold">{p.availableSlots} Bays Free</td>
                    <td className="p-4 font-semibold text-blue-400">₹{p.pricePerHour}/hr</td>
                    <td className="p-4">
                      <StatusBadge status={p.status || 'Active'} />
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleMaintenance(p)}
                          title={p.status === 'Active' ? 'Set to Maintenance' : 'Set to Active'}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg border border-slate-700"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingParking(p)}
                          title="Edit Facility"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg border border-slate-700"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteParking(p)}
                          title="Delete Facility"
                          className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Parking */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-400" />
                <span>Add New Parking Location</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateParking} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Facility Name *</label>
                <input
                  type="text"
                  required
                  value={parkingForm.name}
                  onChange={(e) => setParkingForm({ ...parkingForm, name: e.target.value })}
                  placeholder="e.g. Phoenix MarketCity Garage"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Address / Street *</label>
                <input
                  type="text"
                  required
                  value={parkingForm.address}
                  onChange={(e) => setParkingForm({ ...parkingForm, address: e.target.value })}
                  placeholder="e.g. 88 Whitefield Main Road"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Hourly Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="10"
                    value={parkingForm.pricePerHour}
                    onChange={(e) => setParkingForm({ ...parkingForm, pricePerHour: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Total Slot Bays</label>
                  <input
                    type="number"
                    required
                    min="4"
                    max="100"
                    value={parkingForm.totalSlots}
                    onChange={(e) => setParkingForm({ ...parkingForm, totalSlots: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Garage Structure Type</label>
                <select
                  value={parkingForm.type}
                  onChange={(e) => setParkingForm({ ...parkingForm, type: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Multi-level Covered">Multi-level Covered</option>
                  <option value="Underground Basement">Underground Basement</option>
                  <option value="Surface Open Parking">Surface Open Parking</option>
                  <option value="Rooftop Deck">Rooftop Deck</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Facilities (comma-separated)</label>
                <input
                  type="text"
                  value={parkingForm.facilities}
                  onChange={(e) => setParkingForm({ ...parkingForm, facilities: e.target.value })}
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
                  Create Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Parking */}
      {editingParking && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-400" />
                <span>Edit Parking Facility</span>
              </h3>
              <button onClick={() => setEditingParking(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateParking} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Facility Name</label>
                <input
                  type="text"
                  required
                  value={editingParking.name}
                  onChange={(e) => setEditingParking({ ...editingParking, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Address</label>
                <input
                  type="text"
                  required
                  value={editingParking.address}
                  onChange={(e) => setEditingParking({ ...editingParking, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Price Per Hour (₹)</label>
                  <input
                    type="number"
                    required
                    value={editingParking.pricePerHour}
                    onChange={(e) =>
                      setEditingParking({ ...editingParking, pricePerHour: Number(e.target.value) })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Status</label>
                  <select
                    value={editingParking.status || 'Active'}
                    onChange={(e) => setEditingParking({ ...editingParking, status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
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
                  onClick={() => setEditingParking(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParkingLocationsPage;
