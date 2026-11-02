import React, { useState, useEffect } from 'react';
import { BookingAPI } from '../../services/api';
import { mockBookings } from '../../data/mockData';
import StatusBadge from '../../components/common/StatusBadge';
import {
  CalendarCheck,
  Search,
  RefreshCw,
  QrCode,
  X,
  CheckCircle,
  Ban,
  Clock,
  MapPin,
  DollarSign,
} from 'lucide-react';

export const OwnerBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [notification, setNotification] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await BookingAPI.getOwnerBookings();
      if (Array.isArray(res.data)) {
        setBookings(res.data);
      } else {
        setBookings([]);
      }
    } catch (err) {
      console.warn('[OwnerBookingsPage] Fetch failed:', err.message);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const notify = (text) => {
    setNotification(text);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleCancel = async (b) => {
    if (!window.confirm(`Cancel reservation #${b.id}? Slot will be freed up for other drivers.`)) return;
    try {
      await BookingAPI.cancel(b.id);
      setBookings((prev) =>
        prev.map((item) => (item.id === b.id ? { ...item, status: 'Cancelled' } : item))
      );
      if (selectedBooking && selectedBooking.id === b.id) {
        setSelectedBooking((prev) => ({ ...prev, status: 'Cancelled' }));
      }
      notify(`Reservation #${b.id} has been cancelled.`);
    } catch (err) {
      setBookings((prev) =>
        prev.map((item) => (item.id === b.id ? { ...item, status: 'Cancelled' } : item))
      );
      notify(`Reservation #${b.id} cancelled (Local store).`);
    }
  };

  const filtered = bookings.filter((b) => {
    const matchesSearch =
      b.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.parkingName?.toLowerCase().includes(searchTerm.toLowerCase());
    if (statusFilter === 'active') return matchesSearch && (b.status === 'Active' || b.status === 'confirmed');
    if (statusFilter === 'completed') return matchesSearch && b.status === 'Completed';
    if (statusFilter === 'cancelled') return matchesSearch && b.status === 'Cancelled';
    return matchesSearch;
  });

  const totalOwnerRevenue = bookings.reduce(
    (sum, b) => (b.status !== 'Cancelled' ? sum + (b.totalPrice || 0) : sum),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-emerald-500" />
            <span>Facility Reservations & Check-Ins</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Audit customer vehicle reservations across your managed parking lots.
          </p>
        </div>

        <button
          onClick={fetchBookings}
          disabled={loading}
          className="p-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl text-xs flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          <span className="hidden sm:inline">Refresh Bookings</span>
        </button>
      </div>

      {/* Notification */}
      {notification && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)}>
            <X className="w-4 h-4 text-slate-400 hover:text-white" />
          </button>
        </div>
      )}

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs">
        <div>
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Bookings</span>
          <span className="text-lg font-bold text-white font-mono">{bookings.length} Passes</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Live Active Bays</span>
          <span className="text-lg font-bold text-emerald-400 font-mono">
            {bookings.filter((b) => b.status === 'Active' || b.status === 'confirmed').length} Parked
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Facility Earnings</span>
          <span className="text-lg font-bold text-blue-400 font-mono">₹{totalOwnerRevenue.toLocaleString()}</span>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Ticket ID, vehicle license plate, or lot..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 w-full sm:w-auto"
        >
          <option value="all">All Bookings ({bookings.length})</option>
          <option value="active">Active Reservations</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Bookings Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Ticket ID</th>
                <th className="p-4">Parking Facility</th>
                <th className="p-4">Assigned Slot</th>
                <th className="p-4">Vehicle Plate</th>
                <th className="p-4">Time Window</th>
                <th className="p-4">Collected Fee</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400">
                    No reservations matching "{searchTerm}".
                  </td>
                </tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 font-mono font-bold text-blue-400">{b.id}</td>
                    <td className="p-4 font-semibold text-white">{b.parkingName}</td>
                    <td className="p-4 font-mono text-emerald-400 font-bold">{b.slotNumber}</td>
                    <td className="p-4 font-mono text-slate-300">{b.vehicleNumber}</td>
                    <td className="p-4 text-slate-400 font-mono text-[11px]">
                      {b.startTime?.includes(' ') ? b.startTime : 'Today 10:00 AM - 01:00 PM'}
                    </td>
                    <td className="p-4 font-bold text-white font-mono">₹{b.totalPrice}</td>
                    <td className="p-4">
                      <StatusBadge status={b.status || 'Active'} />
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="px-2.5 py-1 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>QR Pass</span>
                        </button>
                        {b.status !== 'Cancelled' && (
                          <button
                            onClick={() => handleCancel(b)}
                            title="Release bay / cancel"
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg transition-colors"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Ticket Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400">Driver Check-In Pass</span>
                <h3 className="text-base font-bold text-white">#{selectedBooking.id}</h3>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-white p-4 rounded-xl flex flex-col items-center justify-center shadow-inner mx-auto w-40">
              <div className="w-28 h-28 border-4 border-slate-900 flex items-center justify-center bg-slate-100">
                <div className="grid grid-cols-4 gap-1 p-2">
                  <div className="w-4 h-4 bg-black"></div>
                  <div className="w-4 h-4 bg-black"></div>
                  <div className="w-4 h-4 bg-transparent"></div>
                  <div className="w-4 h-4 bg-black"></div>
                  <div className="w-4 h-4 bg-black"></div>
                  <div className="w-4 h-4 bg-transparent"></div>
                  <div className="w-4 h-4 bg-black"></div>
                  <div className="w-4 h-4 bg-black"></div>
                  <div className="w-4 h-4 bg-black"></div>
                  <div className="w-4 h-4 bg-black"></div>
                </div>
              </div>
              <span className="text-[9px] font-mono text-slate-800 mt-2 font-bold">
                {selectedBooking.qrCodeId || 'SP-VERIFIED-PASS'}
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Lot:</span>
                <span className="font-semibold text-white">{selectedBooking.parkingName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Bay:</span>
                <span className="font-mono font-bold text-emerald-400">{selectedBooking.slotNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Vehicle:</span>
                <span className="font-mono text-white">{selectedBooking.vehicleNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Fee:</span>
                <span className="font-bold text-blue-400">₹{selectedBooking.totalPrice}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                <span className="text-slate-400">Status:</span>
                <StatusBadge status={selectedBooking.status} />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerBookingsPage;
