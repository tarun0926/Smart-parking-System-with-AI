import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import LeafletMap, { parseCoordinates } from '../../components/parking/LeafletMap';
import ParkingFilter from '../../components/parking/ParkingFilter';
import ParkingCard from '../../components/parking/ParkingCard';
import SmartRecommendationCard from '../../components/parking/SmartRecommendationCard';
import { getSmartRecommendations } from '../../utils/recommendationEngine';
import { fetchDrivingRoute } from '../../utils/routing';
import { ParkingAPI } from '../../services/api';
import { mockParkingLocations } from '../../data/mockData';
import {
  MapPin,
  Navigation,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Layers,
  Search,
  X,
  Loader2,
  Info,
  Route,
  Compass,
} from 'lucide-react';

// ─── Haversine (km) ──────────────────────────────────────────────────────────
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Nominatim geocode via OpenStreetMap (free, no API key) ─────────────────
async function geocodeLocation(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
  const res = await fetch(url, {
    headers: { 'Accept-Language': 'en', 'User-Agent': 'SmartParkAI/1.0' },
  });
  if (!res.ok) throw new Error('Geocoding service unavailable. Please try again.');
  const data = await res.json();
  if (!data.length) throw new Error(`No location found for "${query}". Try a more specific address.`);
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), displayName: data[0].display_name };
}

const RADIUS_OPTIONS = [1, 3, 5, 10, 20];

export const ParkingMapPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // ── All DB parking locations ─────────────────────────────────────────────
  const [allLocations, setAllLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Location search (geocoding) ──────────────────────────────────────────
  const [locationQuery, setLocationQuery] = useState('');
  const [searchedLocation, setSearchedLocation] = useState(null); // { lat, lng, displayName, radiusKm }
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState(null);
  const [searchRadius, setSearchRadius] = useState(5); // km

  // ── GPS user location ────────────────────────────────────────────────────
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState(null);

  // ── Driving Route State ──────────────────────────────────────────────────
  const [activeRoute, setActiveRoute] = useState(null);
  const [routingLoading, setRoutingLoading] = useState(false);
  const [routeError, setRouteError] = useState(null);

  // ── The map center (searched location or GPS or default) ─────────────────
  const mapCenter = searchedLocation || userLocation || null;

  // ── Selection ────────────────────────────────────────────────────────────
  const [selectedId, setSelectedId] = useState(searchParams.get('select') || null);

  // ── Filter & sort state ──────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('distance');
  const [filterType, setFilterType] = useState('all');
  const [maxDistance, setMaxDistance] = useState(50);
  const [maxPrice, setMaxPrice] = useState(500);

  // ── UI ───────────────────────────────────────────────────────────────────
  const [listExpanded, setListExpanded] = useState(false);
  const locationInputRef = useRef(null);

  // ── Fetch all parking from DB (with fallback to mock data) ───────────────
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await ParkingAPI.getAll();
        const data = res.data || res;
        if (Array.isArray(data) && data.length > 0) {
          setAllLocations(data);
          const initialId = searchParams.get('select') || data[0]._id || data[0].id;
          if (!selectedId) setSelectedId(initialId);
        } else {
          setAllLocations(mockParkingLocations);
          const initialId = searchParams.get('select') || mockParkingLocations[0].id;
          if (!selectedId) setSelectedId(initialId);
        }
      } catch (err) {
        console.warn('[ParkingMapPage] API error, using fallback data:', err.message);
        setAllLocations(mockParkingLocations);
        const initialId = searchParams.get('select') || mockParkingLocations[0].id;
        if (!selectedId) setSelectedId(initialId);
      } finally {
        setLoading(false);
      }
    };
    fetchLocations();
  }, []);

  // ── AI Predictions Cache ─────────────────────────────────────────────────
  const [aiPredictionsMap, setAiPredictionsMap] = useState({});

  useEffect(() => {
    if (allLocations.length > 0) {
      allLocations.forEach(async (loc) => {
        const id = loc._id || loc.id;
        try {
          const res = await ParkingAPI.getPrediction(id);
          if (res && res.data) {
            setAiPredictionsMap((prev) => ({ ...prev, [id]: res.data }));
          }
        } catch (err) {
          // Graceful fallback — AI service may be offline
        }
      });
    }
  }, [allLocations]);

  // ── Geocode search handler ────────────────────────────────────────────────
  const handleLocationSearch = useCallback(async (e) => {
    e?.preventDefault();
    const query = locationQuery.trim();
    if (!query) return;

    setGeocoding(true);
    setGeocodeError(null);
    try {
      const result = await geocodeLocation(query);
      setSearchedLocation({ ...result, radiusKm: searchRadius });
      setSortBy('distance');
    } catch (err) {
      setGeocodeError(err.message || 'Geocoding failed. Try a different search term.');
    } finally {
      setGeocoding(false);
    }
  }, [locationQuery, searchRadius]);

  const clearLocationSearch = () => {
    setSearchedLocation(null);
    setLocationQuery('');
    setGeocodeError(null);
    locationInputRef.current?.focus();
  };

  // ── Browser GPS location ─────────────────────────────────────────────────
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocError('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        if (!searchedLocation) {
          setSearchedLocation({ ...loc, displayName: 'Your Current Location', radiusKm: searchRadius });
        }
        setLocating(false);
      },
      (err) => {
        setLocError('Location access denied or unavailable. Use the search box or click on map.');
        setLocating(false);
      },
      { timeout: 10000 }
    );
  }, [searchedLocation, searchRadius]);

  // ── Map Click to set search origin ─────────────────────────────────────────
  const handleMapClick = useCallback((coords) => {
    setSearchedLocation({
      lat: coords.lat,
      lng: coords.lng,
      displayName: `Pinned Location (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`,
      radiusKm: searchRadius,
    });
    setSortBy('distance');
  }, [searchRadius]);

  // Update radius on searchedLocation if user changes radius selector
  const handleRadiusChange = (newRadius) => {
    setSearchRadius(newRadius);
    if (searchedLocation) {
      setSearchedLocation((prev) => ({ ...prev, radiusKm: newRadius }));
    }
  };

  // ── Filter + sort pipeline ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const refLat = mapCenter?.lat;
    const refLng = mapCenter?.lng;

    return allLocations
      .filter((p) => {
        // Text search within name/address
        const q = searchTerm.toLowerCase();
        if (q && !p.name?.toLowerCase().includes(q) && !p.address?.toLowerCase().includes(q))
          return false;

        // Availability filter
        if (filterType === 'available' && !(p.availableSlots > 0)) return false;
        if (filterType === 'ev' && !p.facilities?.some((f) => f.toLowerCase().includes('ev')))
          return false;
        if (filterType === 'covered' && !p.facilities?.some((f) => f.toLowerCase().includes('covered')))
          return false;

        // Price filter
        if (maxPrice < 500 && (p.pricePerHour || 0) > maxPrice) return false;

        // Radius filter relative to the searched/GPS location
        const coords = parseCoordinates(p);
        if (refLat && refLng && coords) {
          const dist = haversine(refLat, refLng, coords.lat, coords.lng);
          const radiusToUse = searchedLocation ? searchRadius : maxDistance;
          if (radiusToUse < 50 && dist > radiusToUse) return false;
        }

        return true;
      })
      .map((p) => {
        const coords = parseCoordinates(p);
        if (refLat && refLng && coords) {
          const dist = haversine(refLat, refLng, coords.lat, coords.lng);
          return { ...p, _distKm: dist, distance: `${dist.toFixed(1)} km` };
        }
        return { ...p, _distKm: parseFloat(p.distance) || 999 };
      })
      .sort((a, b) => {
        if (sortBy === 'distance') return (a._distKm || 999) - (b._distKm || 999);
        if (sortBy === 'available') return (b.availableSlots || 0) - (a.availableSlots || 0);
        if (sortBy === 'price_low') return (a.pricePerHour || 0) - (b.pricePerHour || 0);
        if (sortBy === 'price_high') return (b.pricePerHour || 0) - (a.pricePerHour || 0);
        if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
        return 0;
      });
  }, [allLocations, searchTerm, filterType, maxDistance, maxPrice, mapCenter, searchRadius, searchedLocation, sortBy]);

  const selectedParking = filtered.find(
    (p) => String(p._id || p.id) === String(selectedId)
  ) || filtered[0];

  // ── Driving Route Handler ────────────────────────────────────────────────
  const handleGetRoute = useCallback(async (targetId) => {
    const target = allLocations.find((p) => String(p._id || p.id) === String(targetId)) || selectedParking;
    if (!target) return;

    const destCoords = parseCoordinates(target);
    if (!destCoords) {
      setRouteError('Destination coordinates not available.');
      return;
    }

    let originCoords = userLocation || (searchedLocation?.lat ? searchedLocation : null);
    let originName = searchedLocation?.displayName || (userLocation ? 'Your Location' : 'City Center');

    // If no user location or searched location, default to Bangalore City Center
    if (!originCoords) {
      originCoords = { lat: 12.9716, lng: 77.5946 };
      originName = 'City Center Default Origin';
    }

    setRoutingLoading(true);
    setRouteError(null);

    try {
      const route = await fetchDrivingRoute(
        originCoords.lat,
        originCoords.lng,
        destCoords.lat,
        destCoords.lng,
        target.name
      );

      if (route) {
        setActiveRoute({
          ...route,
          originName,
          targetId: String(target._id || target.id),
        });
        setSelectedId(String(target._id || target.id));
      } else {
        setRouteError('Unable to generate route.');
      }
    } catch (err) {
      setRouteError(err.message || 'Failed to fetch road route.');
    } finally {
      setRoutingLoading(false);
    }
  }, [allLocations, selectedParking, userLocation, searchedLocation]);

  const clearRoute = () => {
    setActiveRoute(null);
    setRouteError(null);
  };

  // ── Smart Recommendation ─────────────────────────────────────────────────
  const smartRecommendation = useMemo(() => {
    return getSmartRecommendations(filtered, aiPredictionsMap);
  }, [filtered, aiPredictionsMap]);

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MapPin className="w-6 h-6 text-blue-500" />
            <span>Live Interactive Parking Map</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Search any location or click directly on the map to find nearby parking &amp; get driving directions
          </p>
        </div>

        {/* GPS Location button */}
        <button
          id="btn-locate-me"
          onClick={requestLocation}
          disabled={locating}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60 disabled:cursor-wait"
        >
          <Navigation className={`w-3.5 h-3.5 text-blue-400 ${locating ? 'animate-pulse' : ''}`} />
          {locating ? 'Locating…' : userLocation ? '📍 GPS Active' : 'Use My GPS'}
        </button>
      </div>

      {/* ── Location Search Box ─────────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Search className="w-3.5 h-3.5 text-blue-400" />
            Search Location &amp; Find Nearby Parking
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            💡 Tip: You can also click anywhere on the map to search around that spot
          </span>
        </div>

        <form onSubmit={handleLocationSearch} className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={locationInputRef}
              id="location-search-input"
              type="text"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              placeholder="Search area, locality, landmark or address (e.g. Indiranagar, Koramangala)…"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-8 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            {locationQuery && (
              <button
                type="button"
                onClick={() => { setLocationQuery(''); setGeocodeError(null); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Radius selector */}
          <select
            id="radius-select"
            value={searchRadius}
            onChange={(e) => handleRadiusChange(Number(e.target.value))}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            {RADIUS_OPTIONS.map((r) => (
              <option key={r} value={r}>{r} km radius</option>
            ))}
          </select>

          <button
            type="submit"
            id="btn-search-location"
            disabled={geocoding || !locationQuery.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold transition-colors"
          >
            {geocoding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            {geocoding ? 'Searching…' : 'Search'}
          </button>
        </form>

        {/* Active search location indicator */}
        {searchedLocation && (
          <div className="flex items-center justify-between bg-blue-950/40 border border-blue-800/40 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block">Searching near:</span>
                <span className="text-xs text-slate-300 truncate block">{searchedLocation.displayName}</span>
                <span className="text-[10px] text-slate-500">
                  {searchedLocation.lat?.toFixed(4)}, {searchedLocation.lng?.toFixed(4)} · Radius: {searchRadius} km
                </span>
              </div>
            </div>
            <button
              onClick={clearLocationSearch}
              className="text-slate-500 hover:text-red-400 ml-2 shrink-0 transition-colors p-1"
              title="Clear searched location"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Active Route banner */}
        {activeRoute && (
          <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-600/40 rounded-lg px-3 py-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <Route className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Active Driving Route</span>
                <div className="text-xs text-white font-semibold">
                  To {activeRoute.destinationName} · <span className="text-emerald-400 font-bold">{activeRoute.distanceKm} km</span> · <span className="text-blue-300 font-bold">~{activeRoute.durationMins} mins</span>
                </div>
                <span className="text-[10px] text-slate-400">From {activeRoute.originName}</span>
              </div>
            </div>
            <button
              onClick={clearRoute}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md text-xs font-medium border border-slate-700 transition-colors"
            >
              <X className="w-3 h-3" />
              <span>Clear Route</span>
            </button>
          </div>
        )}

        {/* Geocode error */}
        {geocodeError && (
          <div className="flex items-center gap-2 text-amber-300 text-xs bg-amber-950/40 border border-amber-700/40 rounded-lg px-3 py-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{geocodeError}</span>
          </div>
        )}

        {/* Route error */}
        {routeError && (
          <div className="flex items-center gap-2 text-rose-300 text-xs bg-rose-950/40 border border-rose-700/40 rounded-lg px-3 py-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{routeError}</span>
          </div>
        )}
      </div>

      {/* Error / warning banners */}
      {error && (
        <div className="flex items-center gap-2 bg-amber-950/50 border border-amber-700/40 text-amber-300 rounded-lg px-4 py-2.5 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {locError && (
        <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700 text-slate-400 rounded-lg px-4 py-2.5 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{locError}</span>
        </div>
      )}

      {/* Filters */}
      <ParkingFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortBy={sortBy}
        setSortBy={setSortBy}
        filterType={filterType}
        setFilterType={setFilterType}
        maxDistance={maxDistance}
        setMaxDistance={setMaxDistance}
        maxPrice={maxPrice}
        setMaxPrice={setMaxPrice}
        hasUserLocation={!!mapCenter}
      />

      {/* Smart Parking AI Recommendation */}
      {smartRecommendation?.recommended && (
        <SmartRecommendationCard
          recommendation={smartRecommendation.recommended}
          onSelectOnMap={(recId) => {
            setSelectedId(recId);
            const mapEl = document.getElementById('parking-map-view');
            if (mapEl) {
              mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }}
        />
      )}

      {/* Map + Side Panel */}
      <div id="parking-map-view" className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col lg:flex-row"
           style={{ minHeight: '620px', height: '620px' }}>

        {/* ── Leaflet Map ── */}
        <div className="flex-1 relative" style={{ minHeight: '360px' }}>
          {loading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm gap-3">
              <RefreshCw className="w-7 h-7 text-blue-400 animate-spin" />
              <span className="text-sm text-slate-300 font-medium">Loading live parking data…</span>
            </div>
          )}

          <LeafletMap
            locations={filtered}
            selectedLocationId={selectedId}
            onSelectLocation={setSelectedId}
            onRequestRoute={handleGetRoute}
            onMapClick={handleMapClick}
            userLocation={userLocation}
            searchedLocation={searchedLocation}
            activeRoute={activeRoute}
          />

          {/* Marker legend overlay */}
          <div className="absolute bottom-3 left-3 z-[400] flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-700 text-[10px] text-slate-300 pointer-events-none shadow-lg">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Full
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-1 ring-white inline-block" /> Selected
            </span>
            {userLocation && (
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 ring-1 ring-white inline-block" /> GPS
              </span>
            )}
            {searchedLocation && (
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400 ring-1 ring-white inline-block" /> Search
              </span>
            )}
          </div>

          {/* Result count & interactive indicator */}
          <div className="absolute top-3 left-3 z-[400] flex items-center gap-2">
            <div className="bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-700 text-[10px] font-semibold text-slate-300 shadow-md">
              <Layers className="w-3 h-3 inline mr-1 text-blue-400" />
              {filtered.length} location{filtered.length !== 1 ? 's' : ''}{searchedLocation ? ` within ${searchRadius} km` : ''}
            </div>
            {activeRoute && (
              <div className="bg-emerald-950/90 backdrop-blur-md text-emerald-400 border border-emerald-600/50 px-2.5 py-1.5 rounded-lg text-[10px] font-bold shadow-md">
                Route: {activeRoute.distanceKm} km ({activeRoute.durationMins}m)
              </div>
            )}
          </div>
        </div>

        {/* ── Side Panel: Selected parking detail ── */}
        {selectedParking ? (
          <div className="w-full lg:w-80 shrink-0 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">
                    Selected Parking
                  </span>
                  <h2 className="text-sm font-bold text-white mt-0.5 leading-snug">
                    {selectedParking.name}
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 shrink-0 text-blue-400" />
                    {selectedParking.address}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                    selectedParking.availableSlots === 0
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {selectedParking.availableSlots === 0 ? 'Full' : selectedParking.status || 'Active'}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    label: 'Available',
                    value: selectedParking.availableSlots,
                    color:
                      selectedParking.availableSlots === 0
                        ? 'text-red-400'
                        : 'text-emerald-400',
                  },
                  { label: 'Total', value: selectedParking.totalSlots, color: 'text-white' },
                  {
                    label: 'Rate/hr',
                    value: `₹${selectedParking.pricePerHour}`,
                    color: 'text-blue-400',
                  },
                ].map((m) => (
                  <div key={m.label} className="bg-slate-950 rounded-lg p-2.5 text-center">
                    <div className="text-[9px] uppercase font-bold text-slate-500 mb-1">{m.label}</div>
                    <div className={`text-base font-extrabold ${m.color}`}>{m.value}</div>
                  </div>
                ))}
              </div>

              {/* Occupancy bar */}
              {selectedParking.totalSlots > 0 && (
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>Occupancy</span>
                    <span className="font-bold">
                      {Math.round(
                        ((selectedParking.totalSlots - selectedParking.availableSlots) /
                          selectedParking.totalSlots) *
                          100
                      )}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.round(
                          ((selectedParking.totalSlots - selectedParking.availableSlots) /
                            selectedParking.totalSlots) *
                            100
                        )}%`,
                        background:
                          selectedParking.availableSlots === 0
                            ? '#ef4444'
                            : selectedParking.availableSlots / selectedParking.totalSlots < 0.3
                            ? '#f59e0b'
                            : '#10b981',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Distance from searched location */}
              {selectedParking._distKm && selectedParking._distKm < 999 && (
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 bg-slate-950 rounded-lg px-2.5 py-2">
                  <Navigation className="w-3 h-3 text-blue-400 shrink-0" />
                  <span><span className="font-bold text-slate-200">{selectedParking.distance}</span> from {searchedLocation ? 'searched point' : 'you'}</span>
                </div>
              )}

              {/* Meta rows */}
              <div className="space-y-1.5 text-xs">
                {[
                  { label: 'Type', value: selectedParking.type },
                  { label: 'Rating', value: selectedParking.rating ? `⭐ ${selectedParking.rating}` : null },
                ]
                  .filter((r) => r.value)
                  .map((r) => (
                    <div
                      key={r.label}
                      className="flex justify-between py-1.5 border-b border-slate-800/60 text-slate-300"
                    >
                      <span className="text-slate-500">{r.label}</span>
                      <span className="font-medium text-slate-200">{r.value}</span>
                    </div>
                  ))}
              </div>

              {/* Facilities */}
              {selectedParking.facilities?.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500 mb-2">Facilities</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedParking.facilities.map((f) => (
                      <span
                        key={f}
                        className="bg-slate-800 border border-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded-full"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Slot preview */}
              {selectedParking.slots?.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500 mb-2">Slot Preview</div>
                  <div className="grid grid-cols-6 gap-1 bg-slate-950 p-2 rounded-lg border border-slate-800">
                    {selectedParking.slots.slice(0, 18).map((slot) => {
                      const sNum = slot.number || slot.slotNumber || 'S';
                      const displayNum = sNum.includes('-') ? sNum.split('-')[1] : sNum;
                      const isAvail = slot.status === 'available';
                      return (
                        <div
                          key={slot.id || slot._id || sNum}
                          title={`${sNum} (${slot.status})`}
                          className={`h-5 rounded text-[8px] font-mono flex items-center justify-center font-bold ${
                            isAvail
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {displayNum}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-slate-800 space-y-2">
              {/* In-app driving route */}
              <button
                id="btn-show-driving-route"
                onClick={() => handleGetRoute(selectedParking._id || selectedParking.id)}
                disabled={routingLoading}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-md shadow-emerald-600/20"
              >
                {routingLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Calculating Route…</span>
                  </>
                ) : activeRoute && activeRoute.targetId === String(selectedParking._id || selectedParking.id) ? (
                  <>
                    <Route className="w-3.5 h-3.5" />
                    <span>Route Active ({activeRoute.distanceKm} km · {activeRoute.durationMins}m)</span>
                  </>
                ) : (
                  <>
                    <Route className="w-3.5 h-3.5" />
                    <span>Show Driving Route on Map</span>
                  </>
                )}
              </button>

              <button
                id="btn-view-details"
                onClick={() =>
                  navigate(`/parking/${selectedParking._id || selectedParking.id}`)
                }
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
              >
                View Details &amp; Reserve Bay
              </button>

              <button
                id="btn-navigate"
                onClick={() => {
                  const coords = parseCoordinates(selectedParking);
                  if (coords) {
                    window.open(
                      `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`,
                      '_blank'
                    );
                  }
                }}
                disabled={!parseCoordinates(selectedParking)}
                className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
              >
                <Navigation className="w-3.5 h-3.5 text-blue-400" />
                Open in Google Maps
              </button>
            </div>
          </div>
        ) : !loading && (
          <div className="w-full lg:w-80 shrink-0 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col items-center justify-center p-6 text-center">
            <MapPin className="w-10 h-10 text-slate-700 mb-3" />
            <p className="text-sm font-bold text-slate-400">No Parking Found</p>
            {searchedLocation ? (
              <div className="mt-2 space-y-2">
                <p className="text-xs text-slate-500">No parking in database within {searchRadius} km of this location.</p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {RADIUS_OPTIONS.filter(r => r > searchRadius).slice(0, 3).map(r => (
                    <button
                      key={r}
                      onClick={() => handleRadiusChange(r)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs rounded-full transition-colors"
                    >
                      Try {r} km
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 mt-1">Search a location or click anywhere on the map to find nearby parking.</p>
            )}
          </div>
        )}
      </div>

      {/* Parking Cards List */}
      <div>
        <button
          id="btn-toggle-list"
          onClick={() => setListExpanded((v) => !v)}
          className="flex items-center gap-2 text-sm font-bold text-white mb-4 hover:text-blue-400 transition-colors"
        >
          All Parking Facilities ({filtered.length})
          {listExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {listExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((parking) => (
              <ParkingCard key={parking._id || parking.id} parking={parking} />
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-10 text-slate-500 text-sm">
                {searchedLocation
                  ? `No parking locations in the database within ${searchRadius} km of "${searchedLocation.displayName}". Try increasing the search radius.`
                  : 'No parking locations match your filters.'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParkingMapPage;
