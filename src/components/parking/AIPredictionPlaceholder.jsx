import React from 'react';
import { Brain, Clock, TrendingUp, Cpu, Info, ShieldCheck } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import AIPredictionCard from './AIPredictionCard';

export const AIPredictionPlaceholder = ({ predictionData, parkingId }) => {
  if (parkingId) {
    return <AIPredictionCard parkingId={parkingId} />;
  }
  const defaultTrends = [
    { time: '08:00', predicted: 42, actual: 40 },
    { time: '10:00', predicted: 80, actual: 82 },
    { time: '12:00', predicted: 68, actual: 65 },
    { time: '14:00', predicted: 58, actual: 55 },
    { time: '16:00', predicted: 78, actual: 75 },
    { time: '18:00', predicted: 92, actual: 90 },
    { time: '20:00', predicted: 48, actual: 50 },
  ];

  const trends = predictionData?.hourlyTrends || defaultTrends;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40 border border-blue-500/30 rounded-xl p-6 shadow-xl space-y-6">
      {/* Section Header with Clearly Labelled AI Placeholder Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400">
            <Brain className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">AI Availability Prediction</h3>
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-mono font-semibold">
                PHASE 1 PLACEHOLDER
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Machine Learning Time-Series Model Slot Occupancy Forecast
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Model Architecture: XGBoost + LSTM Ready</span>
        </div>
      </div>

      {/* Highlights Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Predicted Peak Hours</span>
          </div>
          <p className="text-sm font-semibold text-white mt-1">
            {predictionData?.peakHours || '09:00 AM - 11:30 AM'}
          </p>
        </div>

        <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Predicted Occupancy (1h)</span>
          </div>
          <p className="text-sm font-semibold text-emerald-400 mt-1">
            {predictionData?.predictedOccupancy1hr || 85}% Expected Full
          </p>
        </div>

        <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Cpu className="w-4 h-4 text-blue-400" />
            <span>AI Confidence Index</span>
          </div>
          <p className="text-sm font-semibold text-blue-400 mt-1">94.8% Accuracy Score</p>
        </div>
      </div>

      {/* Chart Visualization */}
      <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-slate-300">Hourly Occupancy Rate Forecast (%)</span>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Predicted
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Historical Actual
            </span>
          </div>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trends}>
              <defs>
                <linearGradient id="predictedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="predicted" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#predictedGrad)" />
              <Area type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#actualGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* College Project Viva Explanatory Callout */}
      <div className="p-3.5 rounded-lg bg-blue-950/40 border border-blue-800/40 flex items-start gap-3 text-xs text-blue-200">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Note for Major Project Viva:</strong> This component is structured as a dedicated AI prediction placeholder. In Phase 2, this section connects to the Flask/FastAPI Python ML backend serving real-time predictions trained on historical parking dataset APIs.
        </p>
      </div>
    </div>
  );
};

export default AIPredictionPlaceholder;
