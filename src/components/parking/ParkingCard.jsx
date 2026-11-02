import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';
import { MapPin, DollarSign, Layers, ChevronRight, Sparkles, Navigation } from 'lucide-react';

export const ParkingCard = ({ parking }) => {
  const navigate = useNavigate();

  const isFull = parking.availableSlots === 0;

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-blue-500/40 rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:shadow-blue-500/5 transition-all group flex flex-col justify-between">
      <div className="p-5 space-y-4">
        {/* Header Title & Status */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
              {parking.name}
            </h3>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-1 line-clamp-1">
              <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>{parking.address}</span>
            </p>
          </div>
          <StatusBadge status={isFull ? 'Full' : parking.status} />
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 text-xs">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Distance</span>
            <span className="font-semibold text-slate-200">{parking.distance}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Slots</span>
            <span className={`font-semibold ${isFull ? 'text-rose-400' : 'text-emerald-400'}`}>
              {parking.availableSlots} / {parking.totalSlots}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Rate</span>
            <span className="font-semibold text-blue-400">₹{parking.pricePerHour}/hr</span>
          </div>
        </div>

        {/* AI Insight Badge */}
        {parking.aiPrediction && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-950/40 border border-blue-800/40 text-xs text-blue-300">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0 animate-pulse" />
            <span className="truncate">{parking.aiPrediction.recommendation}</span>
          </div>
        )}
      </div>

      {/* Card Actions */}
      <div className="p-4 bg-slate-900/80 border-t border-slate-800/80 flex items-center gap-2">
        <button
          onClick={() => navigate(`/parking/${parking._id || parking.id}`)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          <span>View Details & Slots</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => navigate(`/user/map?select=${parking._id || parking.id}`)}
          className="flex items-center justify-center gap-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
          title="View on Map"
        >
          <Navigation className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">Map</span>
        </button>
      </div>

    </div>
  );
};

export default ParkingCard;
