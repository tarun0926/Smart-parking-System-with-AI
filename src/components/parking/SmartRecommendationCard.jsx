import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  MapPin,
  Clock,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Navigation,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';

/**
 * SmartRecommendationCard
 * Displays the top-ranked parking option selected by the multi-factor Recommendation Engine
 * Factors: Distance, Current Availability, Predicted Availability, Price/hour
 * Includes transparent, explainable reasons for user trust.
 */
export const SmartRecommendationCard = ({
  recommendation,
  onSelectOnMap = null,
  compact = false,
}) => {
  if (!recommendation || !recommendation.parking) {
    return null;
  }

  const { parking, metrics, reasons, compositeScore, scores } = recommendation;
  const parkingId = parking._id || parking.id;

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-950/60 via-slate-900 to-slate-900 border-2 border-blue-500/50 rounded-2xl p-6 shadow-2xl space-y-5 transition-all hover:border-blue-400">
      {/* Decorative Glow Effect */}
      <div className="absolute -top-12 -right-12 w-44 h-44 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold font-mono tracking-wider uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40">
                AI MATCH • SCORE {compositeScore}/100
              </span>
              <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Best Overall Option
              </span>
            </div>
            <h3 className="text-xl font-black text-white tracking-tight mt-1">
              Recommended Parking
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onSelectOnMap && (
            <button
              onClick={() => onSelectOnMap(parkingId)}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all"
            >
              <Navigation className="w-3.5 h-3.5 text-blue-400" />
              <span>Locate on Map</span>
            </button>
          )}
          <Link
            to={`/parking/${parkingId}`}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all"
          >
            <span>Book Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Facility Name & Location */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
        <div>
          <h4 className="text-lg font-bold text-white flex items-center gap-2">
            <span>{parking.name}</span>
            <span className="text-xs font-normal px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {parking.type || 'Covered Facility'}
            </span>
          </h4>
          <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
            <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>{parking.address}</span>
          </p>
        </div>
      </div>

      {/* 4 Factor Highlight Blocks */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Factor 1: Distance */}
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80">
          <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
            <span>Distance</span>
            <span className="text-[10px] text-blue-400 font-mono">Factor #1</span>
          </div>
          <div className="text-lg font-extrabold text-white mt-1">
            {metrics.distanceKm !== undefined ? `${metrics.distanceKm} km` : parking.distance || '1.0 km'}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">from current location</p>
        </div>

        {/* Factor 2: Current Availability */}
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80">
          <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
            <span>Current Availability</span>
            <span className="text-[10px] text-emerald-400 font-mono">Factor #2</span>
          </div>
          <div className="text-lg font-extrabold text-emerald-400 mt-1">
            {metrics.availableSlots} <span className="text-xs font-normal text-slate-400">/ {metrics.totalSlots}</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {100 - metrics.occupancyPercentage}% available right now
          </p>
        </div>

        {/* Factor 3: Predicted Availability */}
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80">
          <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
            <span>Predicted Availability</span>
            <span className="text-[10px] text-purple-400 font-mono">AI Forecast</span>
          </div>
          <div className="text-lg font-extrabold text-purple-400 mt-1">
            {metrics.predAvailableSlots} <span className="text-xs font-normal text-slate-400">slots</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">est. in 30-60 mins</p>
        </div>

        {/* Factor 4: Price/Hour */}
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80">
          <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
            <span>Price / Hour</span>
            <span className="text-[10px] text-amber-400 font-mono">Factor #4</span>
          </div>
          <div className="text-lg font-extrabold text-amber-400 mt-1">
            ₹{metrics.pricePerHour} <span className="text-xs font-normal text-slate-400">/hr</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">standard hourly tariff</p>
        </div>
      </div>

      {/* Transparent Reasons Breakdown */}
      <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-400" />
            Transparent Decision Reasons
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            Multi-Objective Optimization
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {reasons && reasons.length > 0 ? (
            reasons.map((r, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-900/80 border border-slate-800"
              >
                <div className="mt-0.5">
                  {r.positive ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-200">{r.title}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{r.detail}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 col-span-2">
              Optimal balance of distance, price, and current plus future space.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmartRecommendationCard;
