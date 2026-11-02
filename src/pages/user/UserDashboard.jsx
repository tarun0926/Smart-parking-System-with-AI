import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import MetricCard from '../../components/common/MetricCard';
import ParkingCard from '../../components/parking/ParkingCard';
import ParkingFilter from '../../components/parking/ParkingFilter';
import SmartRecommendationCard from '../../components/parking/SmartRecommendationCard';
import { getSmartRecommendations } from '../../utils/recommendationEngine';
import StatusBadge from '../../components/common/StatusBadge';
import { ParkingAPI, BookingAPI } from '../../services/api';
import { mockParkingLocations, mockBookings } from '../../data/mockData';
import { MapPin, Grid, BookmarkCheck, Clock, Navigation } from 'lucide-react';
import { Link } from 'react-router-dom';

export const UserDashboard = () => {
  const { user } = useAuth();
  const [parkings, setParkings] = useState([]);
  const [userBookings, setUserBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('distance');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [parkingRes, bookingRes] = await Promise.allSettled([
          ParkingAPI.getAll(),
          BookingAPI.getMyBookings(),
        ]);

        if (parkingRes.status === 'fulfilled' && (parkingRes.value?.data || parkingRes.value)) {
          const list = parkingRes.value.data || parkingRes.value;
          setParkings(Array.isArray(list) && list.length > 0 ? list : mockParkingLocations);
        } else {
          setParkings(mockParkingLocations);
        }

        if (bookingRes.status === 'fulfilled') {
          const val = bookingRes.value;
          const bList = Array.isArray(val?.data) ? val.data : Array.isArray(val) ? val : [];
          setUserBookings(bList);
        } else {
          setUserBookings([]);
        }
      } catch (err) {
        console.warn('[UserDashboard] API error:', err);
        setParkings(mockParkingLocations);
        setUserBookings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const activeBooking = userBookings.find((b) => b.status === 'Active');
  const totalAvailableSlots = parkings.reduce((acc, p) => acc + (p.availableSlots || 0), 0);

  // Filter & Sort Logic
  const filteredParking = parkings
    .filter((p) => {
      const matchesSearch =
        (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.address || '').toLowerCase().includes(searchTerm.toLowerCase());
      if (filterType === 'available') return matchesSearch && p.availableSlots > 0;
      if (filterType === 'ev') return matchesSearch && p.facilities?.some((f) => f.includes('EV'));
      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'available') return (b.availableSlots || 0) - (a.availableSlots || 0);
      if (sortBy === 'price_low') return (a.pricePerHour || 0) - (b.pricePerHour || 0);
      if (sortBy === 'price_high') return (b.pricePerHour || 0) - (a.pricePerHour || 0);
      return parseFloat(a.distance || 0) - parseFloat(b.distance || 0);
    });

  // AI Predictions Cache for Recommendation
  const [aiPredictionsMap, setAiPredictionsMap] = useState({});

  useEffect(() => {
    if (parkings && parkings.length > 0) {
      parkings.forEach(async (p) => {
        const id = p._id || p.id;
        try {
          const res = await ParkingAPI.getPrediction(id);
          if (res && res.data) {
            setAiPredictionsMap((prev) => ({ ...prev, [id]: res.data }));
          }
        } catch (e) {
          // Graceful fallback
        }
      });
    }
  }, [parkings]);

  // Dynamic recommendation based on active filters & real AI predictions
  const smartRecommendation = useMemo(() => {
    return getSmartRecommendations(filteredParking, aiPredictionsMap);
  }, [filteredParking, aiPredictionsMap]);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900/60 via-slate-900 to-slate-900 border border-blue-500/20 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 id="user-dashboard-welcome" className="text-2xl font-bold text-white">Welcome back, <span id="user-dashboard-name">{user?.name || 'Driver'}</span> 👋</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time parking availability and AI predictions tailored for your commute.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/user/map"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-2 transition-all"
          >
            <Navigation className="w-4 h-4" />
            <span>Open Interactive Map</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Nearby Parking Spots"
          value={parkings.length}
          subtitle="Within 5 km radius"
          icon={MapPin}
          color="blue"
        />
        <MetricCard
          title="Available Slots"
          value={totalAvailableSlots}
          subtitle="Real-time sensor feed"
          icon={Grid}
          color="emerald"
        />
        <MetricCard
          title="Active Booking"
          value={activeBooking ? '1 Active' : 'None'}
          subtitle={
            activeBooking
              ? `Slot ${activeBooking.slotNumber || activeBooking.slot?.slotNumber}`
              : 'No active session'
          }
          icon={Clock}
          color={activeBooking ? 'amber' : 'purple'}
        />
        <MetricCard
          title="Total Bookings"
          value={userBookings.length}
          subtitle="Lifetime reservations"
          icon={BookmarkCheck}
          color="purple"
        />
      </div>

      {/* Active Reservation Banner (If Any) */}
      {activeBooking && (
        <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-5 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold text-amber-400">Current Session</span>
                <StatusBadge status="Active" />
              </div>
              <h3 className="text-base font-bold text-white mt-1">
                {activeBooking.parkingName || activeBooking.parking?.name || 'Central Metro Tech Park'}
              </h3>
              <p className="text-xs text-amber-200/80 mt-0.5">
                Slot {activeBooking.slotNumber || activeBooking.slot?.slotNumber} • Vehicle: {activeBooking.vehicleNumber || user?.vehicle || 'N/A'}
              </p>
            </div>
          </div>
          <Link
            to="/user/bookings"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors"
          >
            View Ticket QR Code
          </Link>
        </div>
      )}

      {/* Filter and Parking Locations Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-white">Explore Nearby Parking</h2>
            <p className="text-xs text-slate-400">Select a location to check slot availability and AI forecasts</p>
          </div>
        </div>

        {/* Filter Controls */}
        <ParkingFilter
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          sortBy={sortBy}
          setSortBy={setSortBy}
          filterType={filterType}
          setFilterType={setFilterType}
        />

        {/* AI Smart Recommendation Feature */}
        {smartRecommendation?.recommended && (
          <div className="pt-1">
            <SmartRecommendationCard recommendation={smartRecommendation.recommended} />
          </div>
        )}

        {/* Parking Cards Grid */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 space-y-3">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-semibold">Loading nearby parking facilities...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredParking.map((parking) => (
              <ParkingCard key={parking.id || parking._id} parking={parking} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
