import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Navigation, Compass, Layers, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export const InteractiveMap = ({ locations, selectedLocationId, onSelectLocation }) => {
  const activeSpot = locations.find((l) => String(l._id || l.id) === String(selectedLocationId)) || locations[0];
  const activeSpotId = activeSpot ? String(activeSpot._id || activeSpot.id) : null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col md:flex-row h-[600px]">
      {/* Map Interactive Canvas Simulator */}
      <div className="flex-1 relative bg-slate-950 p-6 flex flex-col justify-between overflow-hidden group">
        {/* Map Grid Simulation Layer */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px]"></div>

        {/* Top Controls Overlay */}
        <div className="relative z-10 flex items-center justify-between bg-slate-900/90 backdrop-blur-md p-3 rounded-lg border border-slate-800 shadow-md">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-blue-400 animate-spin" style={{ animationDuration: '10s' }} />
            <span className="text-xs font-semibold text-white">Live GPS Parking Map Grid</span>
          </div>
          <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
            ● GPS Active
          </span>
        </div>

        {/* Simulated Map Markers Pin Container */}
        <div className="relative z-10 my-auto flex flex-wrap items-center justify-center gap-8 py-10">
          {locations.map((loc) => {
            const locId = String(loc._id || loc.id || '');
            const isSelected = locId === activeSpotId;
            const isFull = loc.availableSlots === 0;

            return (
              <button
                key={locId || loc.name}
                onClick={() => onSelectLocation && onSelectLocation(locId)}
                className={`relative group/pin flex flex-col items-center transition-all ${
                  isSelected ? 'scale-110 z-20' : 'hover:scale-105 opacity-80 hover:opacity-100'
                }`}
              >
                {/* Tooltip on pin */}
                <div className="mb-2 bg-slate-900 border border-slate-700 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md shadow-lg flex items-center gap-1.5 whitespace-nowrap">
                  <span>{loc.name.split(' ')[0]}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded ${isFull ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {loc.availableSlots} left
                  </span>
                </div>

                {/* Pin Icon */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 ${
                    isSelected
                      ? 'bg-blue-600 border-white text-white ring-4 ring-blue-500/30'
                      : isFull
                      ? 'bg-rose-600 border-rose-400 text-white'
                      : 'bg-emerald-600 border-emerald-400 text-white'
                  }`}
                >
                  <MapPin className="w-5 h-5" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom Legend */}
        <div className="relative z-10 flex items-center justify-center gap-6 bg-slate-900/90 backdrop-blur-md p-3 rounded-lg border border-slate-800 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500"></span>
            <span>Full</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 ring-2 ring-white"></span>
            <span>Selected Spot</span>
          </div>
        </div>
      </div>

      {/* Selected Location Details Panel */}
      {activeSpot && (
        <div className="w-full md:w-80 bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 p-5 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Selected Location</span>
                <h3 className="text-base font-bold text-white mt-0.5">{activeSpot.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{activeSpot.address}</p>
              </div>
              <StatusBadge status={activeSpot.availableSlots === 0 ? 'Full' : activeSpot.status} />
            </div>

            {/* Quick Metrics */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-300">
                <span className="text-slate-400">Distance</span>
                <span className="font-semibold text-white">{activeSpot.distance}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-300">
                <span className="text-slate-400">Available Slots</span>
                <span className="font-semibold text-emerald-400">{activeSpot.availableSlots} / {activeSpot.totalSlots}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-300">
                <span className="text-slate-400">Hourly Rate</span>
                <span className="font-semibold text-blue-400">₹{activeSpot.pricePerHour}/hr</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-300">
                <span className="text-slate-400">Parking Type</span>
                <span className="font-medium text-slate-200">{activeSpot.type}</span>
              </div>
            </div>

            {/* Slot Layout Mini Map */}
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Live Slot Preview</p>
                <div className="grid grid-cols-6 gap-1 bg-slate-950 p-2 rounded-lg border border-slate-800">
                  {activeSpot.slots?.slice(0, 18).map((slot) => {
                    const sNum = slot.number || slot.slotNumber || 'S';
                    const displayNum = sNum.includes('-') ? sNum.split('-')[1] : sNum;
                    const isAvail = slot.status === 'available';
                    return (
                      <div
                        key={slot.id || slot._id || sNum}
                        title={`${sNum} (${slot.status})`}
                        className={`h-6 rounded text-[9px] font-mono flex items-center justify-center font-bold ${
                          isAvail
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        }`}
                      >
                        {displayNum}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-2">
              <Link
                to={`/parking/${activeSpot._id || activeSpot.id}`}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <span>View Full Details & Reserve</span>
              </Link>
            </div>

        </div>
      )}
    </div>
  );
};

export default InteractiveMap;
