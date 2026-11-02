import React, { useState, useEffect } from 'react';
import { BookingAPI } from '../../services/api';
import { mockBookings } from '../../data/mockData';
import StatusBadge from '../../components/common/StatusBadge';
import {
  ClipboardList,
  Search,
  Download,
  RefreshCw,
  QrCode,
  X,
  CheckCircle,
  AlertTriangle,
  Ban,
  Car,
  Calendar,
  Clock,
  MapPin,
} from 'lucide-react';

export const AllBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [notification, setNotification] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await BookingAPI.getAllBookings();
      if (Array.isArray(res.data)) {
        setBookings(res.data);
      } else {
        setBookings([]);
      }
    } catch (err) {
      console.warn('[AllBookingsPage] Fetch error:', err.message);
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

  const handleCancelBooking = async (b) => {
    if (!window.confirm(`Cancel reservation #${b.id}? Slot will be released back to parking pool.`)) return;
    try {
      await BookingAPI.cancel(b.id);
      setBookings((prev) =>
        prev.map((item) => (item.id === b.id ? { ...item, status: 'Cancelled' } : item))
      );
      if (selectedBooking && selectedBooking.id === b.id) {
        setSelectedBooking((prev) => ({ ...prev, status: 'Cancelled' }));
      }
      notify(`Booking #${b.id} has been cancelled.`);
    } catch (err) {
      setBookings((prev) =>
        prev.map((item) => (item.id === b.id ? { ...item, status: 'Cancelled' } : item))
      );
      notify(`Booking #${b.id} cancelled (Local store).`);
    }
  };

  const exportAuditLog = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Ticket ID,Facility,Slot,Vehicle,Customer,Amount,Status,Time'].join(',') +
      '\n' +
      bookings
        .map((b) =>
          [
            b.id,
            `"${b.parkingName || ''}"`,
            b.slotNumber,
            b.vehicleNumber,
            `"${b.customerName || 'Alex Morgan'}"`,
            b.totalPrice,
            b.status,
            `"${b.startTime || ''}"`,
          ].join(',')
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smartpark_admin_audit_log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify('Platform Audit Log exported as CSV.');
  };

  const filtered = bookings.filter((b) => {
    const matchesSearch =
      b.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.parkingName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
    if (statusFilter === 'active') return matchesSearch && (b.status === 'Active' || b.status === 'confirmed');
    if (statusFilter === 'completed') return matchesSearch && b.status === 'Completed';
    if (statusFilter === 'cancelled') return matchesSearch && b.status === 'Cancelled';
    return matchesSearch;
  });

  const totalRevenue = bookings.reduce((sum, b) => (b.status !== 'Cancelled' ? sum + (b.totalPrice || 0) : sum), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-purple-500" />
            <span>Platform Global Bookings Audit</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Audit driver reservations, check QR verification statuses, and monitor live parking fees.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchBookings}
            disabled={loading}
            className="p-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl text-xs transition-colors"
            title="Refresh bookings"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
          </button>
          <button
            onClick={exportAuditLog}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 text-purple-400" />
            <span>Export Audit Log (CSV)</span>
          </button>
        </div>
      </div>

      {/* Notification banner */}
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

      {/* Summary KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs">
        <div>
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Reservations</span>
          <span className="text-lg font-bold text-white font-mono">{bookings.length} Tickets</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Active Bookings</span>
          <span className="text-lg font-bold text-emerald-400 font-mono">
            {bookings.filter((b) => b.status === 'Active' || b.status === 'confirmed').length} Live
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Cancelled Rate</span>
          <span className="text-lg font-bold text-rose-400 font-mono">
            {bookings.length ? Math.round((bookings.filter((b) => b.status === 'Cancelled').length / bookings.length) * 100) : 0}%
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Platform Value</span>
          <span className="text-lg font-bold text-purple-400 font-mono">₹{totalRevenue.toLocaleString()}</span>
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
            placeholder="Search by Ticket ID, customer, vehicle plate, or parking garage..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 w-full sm:w-auto"
        >
          <option value="all">All Statuses ({bookings.length})</option>
          <option value="active">Active Only</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Ticket ID</th>
                <th className="p-4">Facility Name</th>
                <th className="p-4">Slot</th>
                <th className="p-4">Vehicle Plate</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Fee (₹)</th>
                <th className="p-4">System Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400">
                    No bookings found matching "{searchTerm}".
                  </td>
                </tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 font-mono font-bold text-purple-400">{b.id}</td>
                    <td className="p-4 font-medium text-white">{b.parkingName || 'Central Metro'}</td>
                    <td className="p-4 font-mono text-emerald-400 font-bold">{b.slotNumber}</td>
                    <td className="p-4 font-mono text-slate-300">{b.vehicleNumber}</td>
                    <td className="p-4 text-slate-300">{b.customerName || 'Alex Morgan'}</td>
                    <td className="p-4 font-bold text-white">₹{b.totalPrice}</td>
                    <td className="p-4">
                      <StatusBadge status={b.status || 'Active'} />
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="px-2.5 py-1 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                        {b.status !== 'Cancelled' && (
                          <button
                            onClick={() => handleCancelBooking(b)}
                            title="Cancel Booking"
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

      {/* Booking Inspector / QR Pass Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-purple-400">Audit Reservation Ticket</span>
                <h3 className="text-base font-bold text-white">#{selectedBooking.id}</h3>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* QR Code Graphic Mock */}
            <div className="bg-white p-4 rounded-xl flex flex-col items-center justify-center shadow-inner mx-auto w-44">
              <div className="w-32 h-32 border-4 border-slate-900 flex items-center justify-center relative bg-slate-100">
                <div className="grid grid-cols-4 gap-1 p-2">
                  <div className="w-5 h-5 bg-black"></div>
                  <div className="w-5 h-5 bg-black"></div>
                  <div className="w-5 h-5 bg-transparent"></div>
                  <div className="w-5 h-5 bg-black"></div>
                  <div className="w-5 h-5 bg-transparent"></div>
                  <div className="w-5 h-5 bg-black"></div>
                  <div className="w-5 h-5 bg-black"></div>
                  <div className="w-5 h-5 bg-transparent"></div>
                  <div className="w-5 h-5 bg-black"></div>
                  <div className="w-5 h-5 bg-transparent"></div>
                  <div className="w-5 h-5 bg-black"></div>
                  <div className="w-5 h-5 bg-black"></div>
                </div>
              </div>
              <span className="text-[9px] font-mono text-slate-800 mt-2 font-bold">
                {selectedBooking.qrCodeId || `SP-QR-${selectedBooking.id.slice(-4)}`}
              </span>
            </div>

            {/* Ticket Metadata Details */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Facility:</span>
                <span className="font-semibold text-white">{selectedBooking.parkingName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Slot Bay:</span>
                <span className="font-mono font-bold text-emerald-400">{selectedBooking.slotNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Vehicle Registration:</span>
                <span className="font-mono text-white">{selectedBooking.vehicleNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Driver / Customer:</span>
                <span className="text-white">{selectedBooking.customerName || 'Alex Morgan'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Billed:</span>
                <span className="font-bold text-purple-400">₹{selectedBooking.totalPrice}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                <span className="text-slate-400">Status:</span>
                <StatusBadge status={selectedBooking.status} />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              {selectedBooking.status !== 'Cancelled' && (
                <button
                  onClick={() => handleCancelBooking(selectedBooking)}
                  className="px-3.5 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold"
                >
                  Cancel Booking
                </button>
              )}
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllBookingsPage;
