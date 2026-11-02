import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ─── Fix leaflet default icon paths broken by Vite/Webpack ──────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ─── Coloured SVG pin factory ────────────────────────────────────────────────
const makeIcon = (color) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="32" height="42">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.5)"/>
        </filter>
      </defs>
      <path d="M16 0C7.163 0 0 7.163 0 16c0 9.94 14 26 16 26S32 25.94 32 16C32 7.163 24.837 0 16 0z"
            fill="${color}" filter="url(#shadow)"/>
      <circle cx="16" cy="16" r="6" fill="white" opacity="0.9"/>
    </svg>`;
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  return L.icon({ iconUrl: url, iconSize: [32, 42], iconAnchor: [16, 42], popupAnchor: [0, -44] });
};

const ICONS = {
  available: makeIcon('#10b981'),
  full:      makeIcon('#ef4444'),
  selected:  makeIcon('#3b82f6'),
  searched:  makeIcon('#a855f7'),
};

// ─── Popup HTML builder ──────────────────────────────────────────────────────
function buildPopupHTML(parking, parkingId) {
  const isFull = parking.availableSlots === 0;
  const slotColor = isFull ? '#ef4444' : '#10b981';
  const statusLabel = isFull ? 'Full' : parking.status || 'Active';
  const statusColor = isFull ? '#ef4444' : '#10b981';
  const occupancyPct = parking.totalSlots
    ? Math.round(((parking.totalSlots - (parking.availableSlots || 0)) / parking.totalSlots) * 100)
    : 0;
  const barColor =
    occupancyPct > 80 ? '#ef4444' : occupancyPct > 50 ? '#f59e0b' : '#10b981';

  return `
    <div style="
      font-family: 'Inter', system-ui, sans-serif;
      min-width: 220px;
      max-width: 260px;
      background: #0f172a;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #1e293b;
    ">
      <div style="background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%); padding: 12px 14px 10px;">
        <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:8px;">
          <div>
            <div style="font-size:10px; font-weight:700; color:#60a5fa; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:3px;">Parking Facility</div>
            <div style="font-size:13px; font-weight:700; color:#f1f5f9; line-height:1.3;">${parking.name}</div>
          </div>
          <span style="font-size:9px; font-weight:600; padding:2px 7px; border-radius:99px; background:${statusColor}22; color:${statusColor}; border:1px solid ${statusColor}44; white-space:nowrap; margin-top:2px;">${statusLabel}</span>
        </div>
        <div style="font-size:10px; color:#94a3b8; margin-top:4px;">📍 ${parking.address || ''}</div>
      </div>

      <div style="padding: 10px 14px;">
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px; margin-bottom:10px;">
          <div style="background:#1e293b; border-radius:8px; padding:7px 4px; text-align:center;">
            <div style="font-size:9px; color:#64748b; font-weight:600; text-transform:uppercase; margin-bottom:2px;">Available</div>
            <div style="font-size:14px; font-weight:800; color:${slotColor};">${parking.availableSlots ?? '—'}</div>
          </div>
          <div style="background:#1e293b; border-radius:8px; padding:7px 4px; text-align:center;">
            <div style="font-size:9px; color:#64748b; font-weight:600; text-transform:uppercase; margin-bottom:2px;">Total</div>
            <div style="font-size:14px; font-weight:800; color:#f1f5f9;">${parking.totalSlots ?? '—'}</div>
          </div>
          <div style="background:#1e293b; border-radius:8px; padding:7px 4px; text-align:center;">
            <div style="font-size:9px; color:#64748b; font-weight:600; text-transform:uppercase; margin-bottom:2px;">Rate</div>
            <div style="font-size:12px; font-weight:800; color:#60a5fa;">₹${parking.pricePerHour}/h</div>
          </div>
        </div>

        <div style="margin-bottom:10px;">
          <div style="display:flex; justify-content:space-between; font-size:9px; color:#64748b; margin-bottom:3px;">
            <span>Occupancy</span><span>${occupancyPct}%</span>
          </div>
          <div style="height:4px; background:#1e293b; border-radius:2px; overflow:hidden;">
            <div style="height:100%; width:${occupancyPct}%; background:${barColor}; border-radius:2px;"></div>
          </div>
        </div>

        <div style="display:flex; gap:6px;">
          <a href="/parking/${parkingId}" style="flex:1; display:block; text-align:center; background:linear-gradient(135deg,#2563eb,#1d4ed8); color:#fff; font-size:11px; font-weight:700; padding:8px 0; border-radius:8px; text-decoration:none;">
            View Details
          </a>
          <button onclick="(function(){var p=window.__spLocations&&window.__spLocations['${parkingId}'];if(p&&p.coordinates){window.open('https://www.google.com/maps/dir/?api=1&destination='+p.coordinates.lat+','+p.coordinates.lng,'_blank');}})();" style="padding:8px 10px; background:#1e293b; border:1px solid #334155; border-radius:8px; color:#94a3b8; font-size:11px; font-weight:600; cursor:pointer; white-space:nowrap;">
            🧭 Navigate
          </button>
        </div>
      </div>
    </div>`;
}

// ─── Main Component ──────────────────────────────────────────────────────────
export const LeafletMap = ({
  locations = [],
  selectedLocationId,
  onSelectLocation,
  userLocation,
  searchedLocation,
  activeRoute = null,
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const userMarkerRef = useRef(null);
  const searchedMarkerRef = useRef(null);
  const searchedCircleRef = useRef(null);
  const routeLayerRef = useRef(null);
  const routeOutlineRef = useRef(null);
  const routeStartMarkerRef = useRef(null);
  const routeEndMarkerRef = useRef(null);
  const initialFitDone = useRef(false);
  const [mapReady, setMapReady] = useState(false);

  // Expose locations to inline popup onclick handlers
  useEffect(() => {
    const dict = {};
    locations.forEach((p) => {
      dict[p._id || p.id] = p;
    });
    window.__spLocations = dict;
    return () => { delete window.__spLocations; };
  }, [locations]);

  // ── Initialise map once ──────────────────────────────────────────────────
  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return;

    const map = L.map(mapRef.current, {
      center: [12.9716, 77.5946],
      zoom: 13,
      zoomControl: false,
      attributionControl: true,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Dark tile layer (Stadia free tier)
    const darkTile = L.tileLayer(
      'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
      {
        attribution:
          '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 20,
      }
    );

    // Standard OSM (fallback)
    const osmTile = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    });

    darkTile.addTo(map);

    L.control
      .layers({ '🌙 Dark': darkTile, '🗺️ Standard': osmTile }, {}, { position: 'topright', collapsed: true })
      .addTo(map);

    mapInstanceRef.current = map;
    setMapReady(true);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markersRef.current = {};
      userMarkerRef.current = null;
    };
  }, []);

  // ── Sync parking markers ─────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapReady) return;

    // Remove old markers
    Object.values(markersRef.current).forEach((m) => map.removeLayer(m));
    markersRef.current = {};

    if (!locations.length) return;

    locations.forEach((parking) => {
      const coords = parking.coordinates;
      if (!coords?.lat || !coords?.lng) return;

      const parkingId = String(parking._id || parking.id || '');
      const isFull = parking.availableSlots === 0;
      const isSelected = parkingId === String(selectedLocationId || '');
      const icon = isSelected ? ICONS.selected : isFull ? ICONS.full : ICONS.available;

      const marker = L.marker([coords.lat, coords.lng], { icon, title: parking.name })
        .addTo(map)
        .bindPopup(buildPopupHTML(parking, parkingId), { maxWidth: 280, className: 'sp-popup' })
        .on('click', () => {
          onSelectLocation && onSelectLocation(parkingId);
        });

      markersRef.current[parkingId] = marker;
    });

    // Fit map to all markers the first time only
    if (!initialFitDone.current) {
      const validCoords = locations
        .filter((p) => p.coordinates?.lat && p.coordinates?.lng)
        .map((p) => [p.coordinates.lat, p.coordinates.lng]);
      if (validCoords.length > 0) {
        map.fitBounds(L.latLngBounds(validCoords), { padding: [60, 60], maxZoom: 15 });
      }
      initialFitDone.current = true;
    }
  }, [locations, mapReady]);

  // ── Highlight selected marker & fly to it ───────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapReady || !selectedLocationId) return;

    const selectedStr = String(selectedLocationId);

    // Update icons
    locations.forEach((p) => {
      const pid = String(p._id || p.id || '');
      const m = markersRef.current[pid];
      if (!m) return;
      const isFull = p.availableSlots === 0;
      m.setIcon(pid === selectedStr ? ICONS.selected : isFull ? ICONS.full : ICONS.available);
    });

    const marker = markersRef.current[selectedStr];
    const parking = locations.find((p) => String(p._id || p.id) === selectedStr);
    if (parking?.coordinates) {
      map.flyTo([parking.coordinates.lat, parking.coordinates.lng], 16, { duration: 1 });
    }
    if (marker) {
      setTimeout(() => marker.openPopup(), 900);
    }
  }, [selectedLocationId, mapReady, locations]);

  // ── User location marker ─────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapReady || !userLocation?.lat) return;

    const { lat, lng } = userLocation;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([lat, lng]);
    } else {
      const pulse = L.circleMarker([lat, lng], {
        radius: 10,
        fillColor: '#f59e0b',
        fillOpacity: 0.9,
        color: '#ffffff',
        weight: 3,
      })
        .addTo(map)
        .bindPopup(
          '<div style="font-family:Inter,sans-serif;font-weight:700;color:#0f172a;">📍 Your GPS Location</div>'
        );

      userMarkerRef.current = pulse;
      // Only fly to GPS if no searched location is active
      if (!searchedLocation?.lat) {
        map.flyTo([lat, lng], 14, { duration: 1.5 });
      }
    }
  }, [userLocation, mapReady]);

  // ── Searched location marker + radius circle ──────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapReady) return;

    // Remove previous searched marker and circle
    if (searchedMarkerRef.current) { map.removeLayer(searchedMarkerRef.current); searchedMarkerRef.current = null; }
    if (searchedCircleRef.current) { map.removeLayer(searchedCircleRef.current); searchedCircleRef.current = null; }

    if (!searchedLocation?.lat) return;

    const { lat, lng, displayName } = searchedLocation;

    const marker = L.marker([lat, lng], { icon: ICONS.searched, title: displayName || 'Searched Location' })
      .addTo(map)
      .bindPopup(`<div style="font-family:Inter,sans-serif;font-weight:700;color:#f1f5f9;background:#0f172a;padding:4px 0;">🔍 ${displayName || 'Searched Location'}</div>`);

    searchedMarkerRef.current = marker;

    // Fly map to the searched location
    map.flyTo([lat, lng], 14, { duration: 1.2 });
    initialFitDone.current = false; // Allow re-fit after new location search
  }, [searchedLocation, mapReady]);

  // ── Real Driving Route Rendering ───────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapReady) return;

    // Clear previous route layers
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    if (routeOutlineRef.current) {
      map.removeLayer(routeOutlineRef.current);
      routeOutlineRef.current = null;
    }
    if (routeStartMarkerRef.current) {
      map.removeLayer(routeStartMarkerRef.current);
      routeStartMarkerRef.current = null;
    }
    if (routeEndMarkerRef.current) {
      map.removeLayer(routeEndMarkerRef.current);
      routeEndMarkerRef.current = null;
    }

    if (!activeRoute || !activeRoute.coordinates || activeRoute.coordinates.length < 2) {
      return;
    }

    // 1. Draw glowing outer polyline casing
    const outline = L.polyline(activeRoute.coordinates, {
      color: '#1d4ed8',
      weight: 8,
      opacity: 0.65,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    // 2. Draw animated/styled inner driving line
    const innerLine = L.polyline(activeRoute.coordinates, {
      color: '#60a5fa',
      weight: 4,
      opacity: 0.95,
      dashArray: '8, 6',
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    routeOutlineRef.current = outline;
    routeLayerRef.current = innerLine;

    // 3. Mark Start Origin
    const startPt = activeRoute.coordinates[0];
    const endPt = activeRoute.coordinates[activeRoute.coordinates.length - 1];

    const startMarker = L.circleMarker(startPt, {
      radius: 9,
      fillColor: '#10b981',
      color: '#ffffff',
      weight: 2.5,
      fillOpacity: 1,
    })
      .addTo(map)
      .bindPopup(
        `<div style="font-family:Inter,sans-serif;font-size:11px;font-weight:700;color:#0f172a;padding:2px;">📍 Starting Location</div>`
      );

    // 4. Mark Destination Parking
    const endMarker = L.circleMarker(endPt, {
      radius: 10,
      fillColor: '#3b82f6',
      color: '#ffffff',
      weight: 3,
      fillOpacity: 1,
    })
      .addTo(map)
      .bindPopup(
        `<div style="font-family:Inter,sans-serif;font-size:11px;font-weight:700;color:#0f172a;padding:2px;">🅿️ ${
          activeRoute.destinationName || 'Destination Parking'
        } (${activeRoute.distanceKm} km · ~${activeRoute.durationMins}m)</div>`
      );

    routeStartMarkerRef.current = startMarker;
    routeEndMarkerRef.current = endMarker;

    // 5. Fit map bounds to view the entire journey
    const routeBounds = L.latLngBounds(activeRoute.coordinates);
    map.fitBounds(routeBounds, { padding: [60, 60], maxZoom: 16 });
  }, [activeRoute, mapReady]);

  return (
    <div
      ref={mapRef}
      id="leaflet-parking-map"
      style={{ width: '100%', height: '100%', minHeight: '400px', borderRadius: '0' }}
    />
  );
};

export default LeafletMap;
