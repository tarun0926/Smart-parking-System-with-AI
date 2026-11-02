import React, { useState, useEffect } from 'react';
import { BookingAPI } from '../../services/api';
import { mockBookings } from '../../data/mockData';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import {
  BookmarkCheck,
  Clock,
  MapPin,
  QrCode,
  Car,
  XCircle,
  Info,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';


export const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedQR, setSelectedQR] = useState(null);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [cancelModalBooking, setCancelModalBooking] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await BookingAPI.getMyBookings();
      const fetched = res.data || res;
      if (Array.isArray(fetched)) {
        setBookings(fetched);
      } else {
        setBookings([]);
      }
    } catch (err) {
      console.warn('[MyBookingsPage] API call failed:', err.message);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    try {
      setActionLoading(true);
      const res = await BookingAPI.cancel(bookingId);
      if (res.success || res.data) {
        setBookings((prev) =>
          prev.map((b) =>
            (b.id === bookingId || b._id === bookingId)
              ? { ...b, status: 'Cancelled' }
              : b
          )
        );
        setToastMessage({ type: 'success', text: 'Booking cancelled successfully. Slot released!' });
        setCancelModalBooking(null);
      }
    } catch (err) {
      console.error('[Cancel Booking Error]:', err);
    } finally {
      setActionLoading(false);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleOpenDetails = async (booking) => {
    try {
      const bId = booking._id || booking.id;
      const res = await BookingAPI.getById(bId);
      const detail = res.data || res || booking;
      setSelectedDetails({
        ...detail,
        parkingName: detail.parkingName || detail.parking?.name || booking.parkingName,
        address: detail.address || detail.parking?.address || booking.address,
        slotNumber: detail.slotNumber || detail.slot?.slotNumber || booking.slotNumber,
        amount: detail.amount || detail.totalPrice || booking.amount,
      });
    } catch (err) {
      console.warn('[Get Booking Details] Fallback to row data:', err.message);
      setSelectedDetails(booking);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'active') return b.status === 'Active';
    if (activeTab === 'completed') return b.status === 'Completed';
    if (activeTab === 'cancelled') return b.status === 'Cancelled';
    return true;
  });

  const formatDateString = (dateVal) => {
    if (!dateVal) return 'N/A';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return String(dateVal);
    }
  };


  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl border flex items-center gap-3 text-xs font-semibold ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/90 border-rose-500/40 text-rose-300'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookmarkCheck className="w-6 h-6 text-blue-500" />
            <span>My Reservations & Digital Tickets</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Access active parking passes, entry QR codes, and historical reservation receipts.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs flex-wrap">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'all' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'active' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Active ({bookings.filter((b) => b.status === 'Active').length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'completed' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Past ({bookings.filter((b) => b.status === 'Completed').length})
          </button>
          <button
            onClick={() => setActiveTab('cancelled')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'cancelled' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Cancelled ({bookings.filter((b) => b.status === 'Cancelled').length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 space-y-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold">Fetching your reservations...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <EmptyState title="No Bookings Found" description="You have no parking reservations matching this filter." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredBookings.map((b) => {
            const bookingId = b._id || b.id;
            const parkingName = b.parkingName || b.parking?.name || 'Central Metro Tech Park';
            const address = b.address || b.parking?.address || 'City Center';
            const slotNum = b.slotNumber || b.slot?.slotNumber || 'A-101';
            const amount = b.amount || b.totalPrice || 40;

            return (
              <div
                key={bookingId}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-blue-400 font-bold">{bookingId}</span>
                      <h3 className="text-base font-bold text-white">{parkingName}</h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span>{address}</span>
                      </p>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Bay Slot</span>
                      <span className="font-bold text-emerald-400">{slotNum}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Duration</span>
                      <span className="font-semibold text-slate-200">{b.totalHours || 1} Hours</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Amount</span>
                      <span className="font-bold text-blue-400">₹{amount}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Car className="w-3.5 h-3.5 text-slate-500" />
                      <span>{b.vehicleNumber || 'N/A'}</span>
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        {formatDateString(b.startTime)} - {formatDateString(b.endTime)}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedQR({ ...b, parkingName, slotNumber: slotNum })}
                    className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <QrCode className="w-3.5 h-3.5 text-blue-400" />
                    <span>Digital Pass QR</span>
                  </button>

                  <button
                    onClick={() => handleOpenDetails(b)}
                    className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span>Details</span>
                  </button>


                  {b.status === 'Active' && (
                    <button
                      onClick={() => setCancelModalBooking({ ...b, parkingName, slotNumber: slotNum })}
                      className="py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Code Entry Pass Modal */}
      {selectedQR && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Digital Barrier Entry QR Pass</h3>
              <button onClick={() => setSelectedQR(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="bg-white p-6 rounded-xl inline-block shadow-inner">
              <QrCode className="w-36 h-36 text-slate-900" />
            </div>

            <div className="text-xs space-y-1">
              <p className="font-bold text-white">{selectedQR.parkingName}</p>
              <p className="text-emerald-400 font-mono">Slot Bay: {selectedQR.slotNumber}</p>
              <p className="text-slate-400 font-mono text-[10px]">{selectedQR.qrCodeId || 'SP-QR-8902'}</p>
            </div>

            <button
              onClick={() => setSelectedQR(null)}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
            >
              Close Pass
            </button>
          </div>
        </div>
      )}

      {/* View Booking Details Modal */}
      {selectedDetails && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookmarkCheck className="w-5 h-5 text-blue-400" />
                <span>Booking Details (GET /api/bookings/:id)</span>
              </h3>
              <button onClick={() => setSelectedDetails(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Booking ID:</span>
                  <span className="font-mono text-blue-400 font-bold">{selectedDetails._id || selectedDetails.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <StatusBadge status={selectedDetails.status} />
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Parking Location:</span>
                  <span className="font-semibold text-white">{selectedDetails.parkingName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Reserved Slot Bay:</span>
                  <span className="font-bold text-emerald-400 font-mono">{selectedDetails.slotNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Vehicle Plate:</span>
                  <span className="font-mono text-slate-200">{selectedDetails.vehicleNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Duration:</span>
                  <span className="font-semibold text-slate-200">{selectedDetails.totalHours || 1} Hour(s)</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-800">
                  <span className="text-slate-400 font-semibold">Total Paid:</span>
                  <span className="font-bold text-blue-400 text-sm">₹{selectedDetails.amount}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedDetails(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-rose-400 flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                <span>Confirm Cancellation</span>
              </h3>
              <button onClick={() => setCancelModalBooking(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to cancel your reservation for slot{' '}
              <strong className="text-emerald-400 font-mono">{cancelModalBooking.slotNumber}</strong> at{' '}
              <strong className="text-white">{cancelModalBooking.parkingName}</strong>?
            </p>

            <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl text-[11px] text-amber-200 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Cancelling will release slot {cancelModalBooking.slotNumber} back to available status for other drivers.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCancelModalBooking(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Keep Booking
              </button>
              <button
                onClick={() => handleCancelBooking(cancelModalBooking._id || cancelModalBooking.id)}
                disabled={actionLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-rose-600/30 flex items-center gap-1.5 transition-all"
              >
                {actionLoading ? 'Cancelling...' : 'Yes, Cancel Reservation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookingsPage;
