import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ─── Fix leaflet default icon paths broken by Vite/Webpack ──────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ─── Helper: parse coordinates safely ─────────────────────────────────────────
export function parseCoordinates(parking) {
  if (!parking) return null;
  const c = parking.coordinates;
  if (!c) return null;
  let lat = null;
  let lng = null;
  if (Array.isArray(c) && c.length >= 2) {
    lat = Number(c[0]);
    lng = Number(c[1]);
  } else if (typeof c === 'object') {
    lat = Number(c.lat ?? c.latitude);
    lng = Number(c.lng ?? c.longitude);
  }
  if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0)) {
    return { lat, lng };
  }
  return null;
}

// ─── Coloured SVG pin factory ────────────────────────────────────────────────
const makeIcon = (color) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="32" height="42">
      <defs>
        <filter id="shadow-${color.replace('#', '')}" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.5)"/>
        </filter>
      </defs>
      <path d="M16 0C7.163 0 0 7.163 0 16c0 9.94 14 26 16 26S32 25.94 32 16C32 7.163 24.837 0 16 0z"
            fill="${color}" filter="url(#shadow-${color.replace('#', '')})"/>
      <circle cx="16" cy="16" r="6" fill="white" opacity="0.95"/>
      <text x="16" y="20" font-size="11" font-weight="bold" text-anchor="middle" fill="${color}">P</text>
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
      min-width: 230px;
      max-width: 270px;
      background: #0f172a;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #1e293b;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
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
          <button data-action="details" data-id="${parkingId}" style="flex:1; display:block; text-align:center; background:linear-gradient(135deg,#2563eb,#1d4ed8); color:#fff; font-size:11px; font-weight:700; padding:8px 0; border-radius:8px; border:none; cursor:pointer;">
            View Details
          </button>
          <button data-action="route" data-id="${parkingId}" style="padding:8px 10px; background:#1e293b; border:1px solid #334155; border-radius:8px; color:#60a5fa; font-size:11px; font-weight:600; cursor:pointer; white-space:nowrap;">
            🧭 Route
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
  onRequestRoute,
  onMapClick,
  userLocation,
  searchedLocation,
  activeRoute = null,
}) => {
  const navigate = useNavigate();
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

  // Expose global callback for popup clicks
  useEffect(() => {
    const handlePopupAction = (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');
      if (action === 'details' && id) {
        navigate(`/parking/${id}`);
      } else if (action === 'route' && id && onRequestRoute) {
        onRequestRoute(id);
      }
    };

    const container = mapRef.current;
    if (container) {
      container.addEventListener('click', handlePopupAction);
    }
    return () => {
      if (container) {
        container.removeEventListener('click', handlePopupAction);
      }
    };
  }, [navigate, onRequestRoute]);

  // ── Initialise map once ──────────────────────────────────────────────────
  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return;

    // Safety: delete _leaflet_id if left over from previous mount to prevent "Map container is already initialized"
    if (mapRef.current._leaflet_id) {
      delete mapRef.current._leaflet_id;
    }

    const map = L.map(mapRef.current, {
      center: [12.9716, 77.5946],
      zoom: 13,
      zoomControl: false,
      attributionControl: true,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    // CartoDB Dark Matter tile layer (100% Free, No API Key required, fast CDN)
    const darkTile = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      }
    );

    // Standard OSM (fallback / alternative)
    const osmTile = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    });

    darkTile.addTo(map);

    L.control
      .layers({ '🌙 Dark': darkTile, '🗺️ Standard': osmTile }, {}, { position: 'topright', collapsed: true })
      .addTo(map);

    // Map click handler (click on empty map spot)
    map.on('click', (e) => {
      if (onMapClick) {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    });

    mapInstanceRef.current = map;
    setMapReady(true);

    // Invalidate size after layout completes (fixes blank/gray tiles on initial load or flex layout)
    const timer1 = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    const timer2 = setTimeout(() => {
      map.invalidateSize();
    }, 600);

    // ResizeObserver to handle container size changes cleanly
    let resizeObserver = null;
    if (window.ResizeObserver && mapRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      });
      resizeObserver.observe(mapRef.current);
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if (mapRef.current) {
        delete mapRef.current._leaflet_id;
      }
      markersRef.current = {};
      userMarkerRef.current = null;
      searchedMarkerRef.current = null;
      searchedCircleRef.current = null;
      routeLayerRef.current = null;
      routeOutlineRef.current = null;
    };
  }, []);

  // ── Sync parking markers ─────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapReady) return;

    // Remove old markers
    Object.values(markersRef.current).forEach((m) => map.removeLayer(m));
    markersRef.current = {};

    if (!locations || !locations.length) return;

    const validPoints = [];

    locations.forEach((parking) => {
      const coords = parseCoordinates(parking);
      if (!coords) return;

      validPoints.push([coords.lat, coords.lng]);

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

    // Fit map to all markers the first time only if no searchedLocation exists
    if (!initialFitDone.current && validPoints.length > 0 && !searchedLocation?.lat) {
      map.fitBounds(L.latLngBounds(validPoints), { padding: [60, 60], maxZoom: 15 });
      initialFitDone.current = true;
    }
  }, [locations, mapReady, selectedLocationId]);

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
      if (pid === selectedStr) {
        m.setZIndexOffset(1000);
      } else {
        m.setZIndexOffset(0);
      }
    });

    const marker = markersRef.current[selectedStr];
    const parking = locations.find((p) => String(p._id || p.id) === selectedStr);
    const coords = parseCoordinates(parking);

    if (coords) {
      map.flyTo([coords.lat, coords.lng], Math.max(map.getZoom(), 15), { duration: 1 });
    }
    if (marker) {
      setTimeout(() => {
        if (mapInstanceRef.current) marker.openPopup();
      }, 700);
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
        fillColor: '#3b82f6',
        fillOpacity: 0.9,
        color: '#ffffff',
        weight: 3,
      })
        .addTo(map)
        .bindPopup(
          '<div style="font-family:Inter,sans-serif;font-weight:700;color:#0f172a;padding:4px 6px;">📍 Your Current Location</div>'
        );

      userMarkerRef.current = pulse;
      if (!searchedLocation?.lat) {
        map.flyTo([lat, lng], 14, { duration: 1.2 });
      }
    }
  }, [userLocation, mapReady]);

  // ── Searched location marker + radius circle ──────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapReady) return;

    // Remove previous searched marker and circle
    if (searchedMarkerRef.current) {
      map.removeLayer(searchedMarkerRef.current);
      searchedMarkerRef.current = null;
    }
    if (searchedCircleRef.current) {
      map.removeLayer(searchedCircleRef.current);
      searchedCircleRef.current = null;
    }

    if (!searchedLocation?.lat || !searchedLocation?.lng) return;

    const { lat, lng, displayName, radiusKm } = searchedLocation;

    const marker = L.marker([lat, lng], {
      icon: ICONS.searched,
      title: displayName || 'Searched Location',
      zIndexOffset: 900,
    })
      .addTo(map)
      .bindPopup(
        `<div style="font-family:Inter,sans-serif;font-weight:700;color:#f1f5f9;background:#0f172a;padding:6px 8px;border-radius:6px;">🔍 ${
          displayName || 'Searched Location'
        }</div>`
      );

    searchedMarkerRef.current = marker;

    if (radiusKm) {
      const circle = L.circle([lat, lng], {
        radius: radiusKm * 1000,
        color: '#a855f7',
        fillColor: '#a855f7',
        fillOpacity: 0.08,
        weight: 1.5,
        dashArray: '4, 4',
      }).addTo(map);
      searchedCircleRef.current = circle;
    }

    // Fly map to searched point
    map.flyTo([lat, lng], 14, { duration: 1.2 });
  }, [searchedLocation, mapReady]);

  // ── Driving Route Rendering ───────────────────────────────────────────────
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

    // Outer glow casing
    const outline = L.polyline(activeRoute.coordinates, {
      color: '#1d4ed8',
      weight: 8,
      opacity: 0.7,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    // Inner animated dashed line
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

    // Route endpoints
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
        `<div style="font-family:Inter,sans-serif;font-size:11px;font-weight:700;color:#0f172a;padding:2px;">📍 Start: ${
          activeRoute.originName || 'Origin'
        }</div>`
      );

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
          activeRoute.destinationName || 'Destination'
        } (${activeRoute.distanceKm} km · ~${activeRoute.durationMins}m)</div>`
      );

    routeStartMarkerRef.current = startMarker;
    routeEndMarkerRef.current = endMarker;

    // Fit map to view whole route
    const routeBounds = L.latLngBounds(activeRoute.coordinates);
    map.fitBounds(routeBounds, { padding: [60, 60], maxZoom: 16 });
  }, [activeRoute, mapReady]);

  return (
    <div
      ref={mapRef}
      id="leaflet-parking-map"
      className="w-full h-full relative"
      style={{ width: '100%', height: '100%', minHeight: '380px', zIndex: 1 }}
    />
  );
};

export default LeafletMap;
