import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ParkingAPI, BookingAPI } from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import AIPredictionCard from '../../components/parking/AIPredictionCard';
import { useAuth } from '../../context/AuthContext';
import {
  MapPin,
  Calendar,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';


export const ParkingDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [parking, setParking] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Booking Form State
  const [reservationModalOpen, setReservationModalOpen] = useState(false);
  const [startTime, setStartTime] = useState(() => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    return new Date(now.getTime() + 15 * 60000).toISOString().slice(0, 16);
  });
  const [endTime, setEndTime] = useState(() => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    return new Date(now.getTime() + 135 * 60000).toISOString().slice(0, 16);
  });
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Fetch parking and slots from backend API
  const fetchParkingData = async () => {
    try {
      setLoading(true);
      setNotFound(false);
      const res = await ParkingAPI.getById(id);
      const fetchedParking = res.data || res;
      setParking(fetchedParking);

      // Fetch slots
      try {
        const slotsRes = await ParkingAPI.getSlots(id);
        const fetchedSlots = slotsRes.data || fetchedParking.slots || [];
        setSlots(fetchedSlots);
        const avail = fetchedSlots.find((s) => s.status === 'available');
        setSelectedSlot(avail || fetchedSlots[0] || null);
      } catch (err) {
        setSlots(fetchedParking.slots || []);
        const avail = (fetchedParking.slots || []).find((s) => s.status === 'available');
        setSelectedSlot(avail || fetchedParking.slots?.[0] || null);
      }
    } catch (err) {
      console.warn('[ParkingDetailsPage] API call failed:', err.message);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParkingData();
  }, [id]);

  // Pre-fill vehicle number from authenticated user profile (separate effect to avoid re-fetch loop)
  useEffect(() => {
    if (user?.vehicle && !vehicleNumber) {
      setVehicleNumber(user.vehicle);
    }
  }, [user?.vehicle]);

  if (loading || (!parking && !notFound)) {
    return (
      <div className="max-w-5xl mx-auto py-12 text-center text-slate-400 space-y-4">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm font-semibold">Loading parking details and live slot grid...</p>
      </div>
    );
  }

  if (notFound || !parking) {
    return (
      <div className="max-w-5xl mx-auto py-12 text-center text-slate-400 space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Parking Location Not Found</h2>
        <p className="text-sm text-slate-400">This parking location does not exist in the database or the backend is unavailable.</p>
        <Link to="/user/map" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Parking Map
        </Link>
      </div>
    );
  }

  const isFull = parking.availableSlots === 0 || !slots.some((s) => s.status === 'available');

  // Calculate Duration and Price
  const startMs = new Date(startTime).getTime();
  const endMs = new Date(endTime).getTime();
  const validDates = !isNaN(startMs) && !isNaN(endMs) && endMs > startMs;
  const durationHours = validDates ? Math.max(1, Math.ceil((endMs - startMs) / (1000 * 60 * 60))) : 1;
  const totalPrice = durationHours * (selectedSlot?.price || parking.pricePerHour || 40);

  // Handle Booking Submit
  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedSlot) {
      setErrorMsg('Please select an available parking slot bay first.');
      return;
    }

    if (selectedSlot.status !== 'available') {
      setErrorMsg(`Slot ${selectedSlot.number || selectedSlot.slotNumber} is already ${selectedSlot.status}.`);
      return;
    }

    if (!validDates) {
      setErrorMsg('End time must be later than start time.');
      return;
    }

    try {
      setBookingLoading(true);
      const payload = {
        parking: parking._id || parking.id,
        slot: selectedSlot._id || selectedSlot.id,
        slotNumber: selectedSlot.number || selectedSlot.slotNumber,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        totalHours: durationHours,
        amount: totalPrice,
        vehicleNumber: vehicleNumber || user?.vehicle || 'N/A',
      };

      const res = await BookingAPI.create(payload);
      if (res.success || res.data) {
        setSuccessMsg(`Booking confirmed! Slot ${selectedSlot.number || selectedSlot.slotNumber} reserved.`);
        
        // Optimistically update slot status
        setSlots((prev) =>
          prev.map((s) =>
            (s.id === selectedSlot.id || s._id === selectedSlot._id)
              ? { ...s, status: 'occupied' }
              : s
          )
        );

        setTimeout(() => {
          setReservationModalOpen(false);
          navigate('/user/bookings');
        }, 1200);
      }
    } catch (err) {
      console.error('[Booking Error]:', err);
      setErrorMsg(err.message || 'Failed to complete booking. Please check slot availability.');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      {/* Back Button */}
      <Link
        to="/user/dashboard"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </Link>

      {/* Main Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{parking.name}</h1>
              <StatusBadge status={isFull ? 'Full' : parking.status || 'Active'} />
            </div>
            <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
              <span>{parking.address}</span>
              <span className="text-slate-600">•</span>
              <span className="text-blue-400 font-semibold">{parking.distance || '1.0 km'} away</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setErrorMsg(null);
                setSuccessMsg(null);
                setReservationModalOpen(true);
              }}
              disabled={isFull}
              className={`px-6 py-3 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center gap-2 ${
                isFull
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 hover:scale-105'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>{isFull ? 'Parking Full' : 'Reserve Selected Slot'}</span>
            </button>
          </div>
        </div>

        {/* Essential Specs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 font-semibold uppercase block">Hourly Rate</span>
            <span className="text-xl font-bold text-blue-400">₹{parking.pricePerHour}/hr</span>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 font-semibold uppercase block">Available Slots</span>
            <span className={`text-xl font-bold ${isFull ? 'text-rose-400' : 'text-emerald-400'}`}>
              {slots.filter((s) => s.status === 'available').length} Bay(s)
            </span>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 font-semibold uppercase block">Total Capacity</span>
            <span className="text-xl font-bold text-slate-200">{parking.totalSlots || slots.length} Slots</span>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 font-semibold uppercase block">Facility Rating</span>
            <span className="text-xl font-bold text-amber-400">★ {parking.rating || 4.8} / 5.0</span>
          </div>
        </div>

        {/* Facilities List */}
        {parking.facilities && (
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Available Amenities
            </h3>
            <div className="flex flex-wrap gap-2">
              {parking.facilities.map((fac, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-medium text-slate-300 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                  {fac}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Interactive Slot Grid Layout */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-white">Live Slot Bay Grid</h3>
            <p className="text-xs text-slate-400">
              Select an available green slot bay. Occupied and reserved bays cannot be selected.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500"></span> Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500"></span> Reserved
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-rose-500/20 border border-rose-500"></span> Occupied
            </span>
          </div>
        </div>

        {/* Slot Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
          {slots.map((slot) => {
            const statusNormalized = (slot.status || 'available').toLowerCase();
            const isAvail = statusNormalized === 'available';
            const isReserved = statusNormalized === 'reserved';
            const isOccupied = statusNormalized === 'occupied';
            const slotNum = slot.number || slot.slotNumber;
            const slotId = slot.id || slot._id;
            const isSelected = selectedSlot && (selectedSlot.id === slotId || selectedSlot._id === slotId);

            return (
              <button
                key={slotId}
                type="button"
                disabled={!isAvail}
                onClick={() => setSelectedSlot(slot)}
                title={
                  isAvail
                    ? `Click to select slot ${slotNum}`
                    : `Slot ${slotNum} is currently ${slot.status}`
                }
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center relative ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-500/50 shadow-lg scale-105 font-bold z-10'
                    : isAvail
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/25 hover:border-emerald-400 cursor-pointer font-semibold shadow-sm'
                    : isReserved
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 cursor-not-allowed opacity-75'
                    : 'bg-rose-500/10 text-rose-500 border-rose-500/25 cursor-not-allowed opacity-60'
                }`}
              >
                <span className="text-sm font-mono font-bold tracking-tight">{slotNum}</span>
                <span className="text-[10px] uppercase font-semibold tracking-tighter opacity-90 mt-0.5">
                  {isAvail ? slot.type || 'Standard' : isReserved ? 'Reserved' : 'Occupied'}
                </span>
              </button>
            );
          })}
        </div>


        {selectedSlot && (
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center font-mono font-bold text-sm">
                {selectedSlot.number || selectedSlot.slotNumber}
              </div>
              <div>
                <p className="font-bold text-white">Selected Slot: {selectedSlot.number || selectedSlot.slotNumber}</p>
                <p className="text-slate-400">
                  Floor: {selectedSlot.floor || 'Level 1'} • Type: {selectedSlot.type || 'Standard'} • Rate: ₹{selectedSlot.price || parking.pricePerHour}/hr
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setErrorMsg(null);
                setSuccessMsg(null);
                setReservationModalOpen(true);
              }}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all shadow-md shrink-0"
            >
              Book Slot {selectedSlot.number || selectedSlot.slotNumber} Now
            </button>
          </div>
        )}
      </div>

      {/* Live AI Prediction Component */}
      <AIPredictionCard parkingId={id} initialParking={parking} />

      {/* Booking Modal */}
      {reservationModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  <span>Reserve Parking Bay</span>
                </h3>
                <p className="text-xs text-slate-400">{parking.name}</p>
              </div>
              <button
                onClick={() => setReservationModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleConfirmBooking} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Selected Bay Slot:</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {selectedSlot?.number || selectedSlot?.slotNumber} ({selectedSlot?.type || 'Standard'})
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Hourly Price:</span>
                  <span className="font-semibold text-slate-200">₹{selectedSlot?.price || parking.pricePerHour}/hr</span>
                </div>
              </div>

              {/* Start & End Date Time Pickers */}
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Vehicle License Plate Number</label>
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    placeholder="e.g. KA-05-EV-4092"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono uppercase focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Amount Breakdown */}
              <div className="p-3.5 bg-blue-950/40 border border-blue-800/40 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-300 block">Total Estimated Amount</span>
                  <span className="text-slate-400">{durationHours} Hour(s) Session</span>
                </div>
                <span className="text-xl font-bold text-blue-400">₹{totalPrice}</span>
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReservationModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingLoading || !validDates || successMsg}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {bookingLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Reserving...</span>
                    </>
                  ) : (
                    <span>Confirm & Book Slot</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParkingDetailsPage;
