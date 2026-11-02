import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ParkingAPI } from '../../services/api';
import { mockParkingLocations } from '../../data/mockData';
import {
  Grid,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  RefreshCw,
  Plus,
  Zap,
  Check,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';

export const ManageSlotsPage = () => {
  const [searchParams] = useSearchParams();
  const locationParamId = searchParams.get('location');

  const [locations, setLocations] = useState(mockParkingLocations);
  const [selectedLocation, setSelectedLocation] = useState(
    mockParkingLocations.find((l) => l.id === locationParamId) || mockParkingLocations[0]
  );
  const [slots, setSlots] = useState(selectedLocation.slots || []);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newSlot, setNewSlot] = useState({
    slotNumber: '',
    floor: 'Level 1',
    type: 'Standard',
    price: 40,
  });

  const notify = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Load locations from API
  useEffect(() => {
    const fetchAllLocations = async () => {
      try {
        setLoading(true);
        const res = await ParkingAPI.getAll();
        if (res.data && res.data.length > 0) {
          setLocations(res.data);
          const matched = res.data.find((l) => l.id === locationParamId || l._id === locationParamId);
          const target = matched || res.data[0];
          setSelectedLocation(target);
          if (target.slots && target.slots.length > 0) {
            setSlots(target.slots);
          } else {
            // Fetch individual slots
            const slotRes = await ParkingAPI.getSlots(target.id || target._id);
            if (slotRes.data) setSlots(slotRes.data);
          }
        }
      } catch (err) {
        console.warn('[ManageSlotsPage] Using local mock slots:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAllLocations();
  }, [locationParamId]);

  const handleSelectLocation = async (locId) => {
    const loc = locations.find((l) => l.id === locId || l._id === locId);
    if (!loc) return;
    setSelectedLocation(loc);

    try {
      setLoading(true);
      const res = await ParkingAPI.getSlots(loc.id || loc._id);
      if (res.data) {
        setSlots(res.data);
      } else {
        setSlots(loc.slots || []);
      }
    } catch (err) {
      setSlots(loc.slots || []);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (slotId) => {
    const targetSlot = slots.find((s) => s.id === slotId || s.number === slotId || s._id === slotId);
    if (!targetSlot) return;

    const nextStatus =
      targetSlot.status === 'available'
        ? 'occupied'
        : targetSlot.status === 'occupied'
        ? 'maintenance'
        : 'available';

    // Optimistic UI update
    setSlots((prev) =>
      prev.map((s) => (s.id === slotId || s.number === slotId ? { ...s, status: nextStatus } : s))
    );

    try {
      await ParkingAPI.updateSlot(
        selectedLocation.id || selectedLocation._id,
        targetSlot.id || targetSlot._id || targetSlot.number,
        nextStatus
      );
      notify(`Slot ${targetSlot.number || targetSlot.slotNumber} set to "${nextStatus}"`);
    } catch (err) {
      notify(`Slot ${targetSlot.number || targetSlot.slotNumber} set to "${nextStatus}" (Local)`);
    }
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    if (!newSlot.slotNumber) return;

    try {
      const res = await ParkingAPI.addSlot(selectedLocation.id || selectedLocation._id, newSlot);
      const added = res.data || {
        id: `S-${Date.now()}`,
        number: newSlot.slotNumber,
        floor: newSlot.floor,
        type: newSlot.type,
        status: 'available',
        price: newSlot.price,
      };

      setSlots((prev) => [...prev, added]);
      setShowAddModal(false);
      setNewSlot({ slotNumber: '', floor: 'Level 1', type: 'Standard', price: 40 });
      notify(`Slot ${added.number || added.slotNumber} added to ${selectedLocation.name}!`);
    } catch (err) {
      const added = {
        id: `S-${Date.now()}`,
        number: newSlot.slotNumber,
        floor: newSlot.floor,
        type: newSlot.type,
        status: 'available',
        price: newSlot.price,
      };
      setSlots((prev) => [...prev, added]);
      setShowAddModal(false);
      notify(`Slot ${added.number} added (Local mode)!`);
    }
  };

  const handleBulkAvailable = () => {
    setSlots((prev) => prev.map((s) => ({ ...s, status: 'available' })));
    notify('All slot bays marked as available!');
  };

  const availableCount = slots.filter((s) => s.status === 'available').length;
  const occupiedCount = slots.filter((s) => s.status === 'occupied' || s.status === 'reserved').length;
  const maintenanceCount = slots.filter((s) => s.status === 'maintenance').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Grid className="w-6 h-6 text-emerald-500" />
            <span>Real-Time Slot Sensor Manager</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Click on any individual bay to cycle states (Available ➔ Occupied ➔ Maintenance).
          </p>
        </div>

        {/* Location Dropdown & Add Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedLocation.id || selectedLocation._id}
            onChange={(e) => handleSelectLocation(e.target.value)}
            className="w-full sm:w-64 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            {locations.map((loc) => (
              <option key={loc.id || loc._id} value={loc.id || loc._id}>
                {loc.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Slot</span>
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

      {/* Stats & Quick Actions Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-5">
          <span className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-emerald-500/20 border border-emerald-500"></span>
            <span>Available ({availableCount})</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-rose-500/20 border border-rose-500"></span>
            <span>Occupied ({occupiedCount})</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-amber-500/20 border border-amber-500"></span>
            <span>Maintenance ({maintenanceCount})</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleBulkAvailable}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-[11px] font-semibold transition-colors"
          >
            Mark All Available
          </button>
          <div className="text-slate-400 font-mono text-[11px]">
            Total: <strong className="text-white">{slots.length} Bays</strong>
          </div>
        </div>
      </div>

      {/* Interactive Slot Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Bays layout for <strong>{selectedLocation.name}</strong></span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Live Sync Active</span>
        </div>

        {slots.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No slot bays created for this facility yet. Click "Add Slot" to generate bays.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {slots.map((slot) => {
              const isAvail = slot.status === 'available';
              const isOcc = slot.status === 'occupied' || slot.status === 'reserved';
              const isEv = slot.type === 'EV Charging';

              return (
                <button
                  key={slot.id || slot._id || slot.number}
                  onClick={() => toggleStatus(slot.id || slot._id || slot.number)}
                  className={`p-3.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 relative group ${
                    isAvail
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                      : isOcc
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                  }`}
                >
                  {isEv && (
                    <span className="absolute top-1.5 right-1.5 text-blue-400" title="EV Charging Bay">
                      <Zap className="w-3 h-3" />
                    </span>
                  )}
                  <span className="text-xs font-mono font-bold">{slot.number || slot.slotNumber}</span>
                  <span className="text-[9px] uppercase font-semibold">{slot.status}</span>
                  <span className="text-[8px] text-slate-500 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to switch
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Add New Slot */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Add Slot Bay to {selectedLocation.name}</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSlot} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Slot Bay Number / Code *</label>
                <input
                  type="text"
                  required
                  value={newSlot.slotNumber}
                  onChange={(e) => setNewSlot({ ...newSlot, slotNumber: e.target.value })}
                  placeholder="e.g. D-401 or A5"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Floor Level</label>
                <select
                  value={newSlot.floor}
                  onChange={(e) => setNewSlot({ ...newSlot, floor: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Ground">Ground Floor</option>
                  <option value="Level 1">Level 1</option>
                  <option value="Level 2">Level 2</option>
                  <option value="Basement 1">Basement 1</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Bay Type</label>
                <select
                  value={newSlot.type}
                  onChange={(e) => setNewSlot({ ...newSlot, type: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Standard">Standard Parking</option>
                  <option value="EV Charging">EV Fast Charging Bay</option>
                  <option value="Disabled Access">Disabled Priority</option>
                </select>
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
                  Add Bay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageSlotsPage;
