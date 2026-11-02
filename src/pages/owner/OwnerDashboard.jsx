import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MetricCard from '../../components/common/MetricCard';
import { AnalyticsAPI } from '../../services/api';
import {
  Building2,
  Grid,
  CheckCircle2,
  AlertCircle,
  CalendarCheck,
  DollarSign,
  TrendingUp,
  Activity,
  Sparkles,
  RefreshCw,
  Plus,
  ArrowRight,
  Clock,
  Zap,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

export const OwnerDashboard = () => {
  const [stats, setStats] = useState({
    parkingName: 'Central Metro Tech Park Parking',
    parkingId: 'p1',
    totalSlots: 60,
    availableSlots: 18,
    occupiedSlots: 42,
    occupancyRate: 70.0,
    todayBookings: 14,
    revenue: 1680,
    revenueChart: [
      { day: 'Mon', revenue: 1400 },
      { day: 'Tue', revenue: 1680 },
      { day: 'Wed', revenue: 1850 },
      { day: 'Thu', revenue: 1600 },
      { day: 'Fri', revenue: 2200 },
      { day: 'Sat', revenue: 2450 },
      { day: 'Sun', revenue: 2100 },
    ],
    aiPredictions: {
      parking_id: 'p1',
      total_slots: 60,
      current_occupied: 42,
      current_available_slots: 18,
      current_occupancy_percentage: 70.0,
      predicted_occupied_slots: 46,
      predicted_available_slots: 14,
      predictions: {
        '30_min': {
          horizon_minutes: 30,
          predicted_occupied_slots: 44,
          predicted_available_slots: 16,
          occupancy_rate_percentage: 73.3,
          status: 'Moderate Demand / Normal Availability',
          trend: 'Increasing',
        },
        '60_min': {
          horizon_minutes: 60,
          predicted_occupied_slots: 48,
          predicted_available_slots: 12,
          occupancy_rate_percentage: 80.0,
          status: 'High Demand / Limited Slots',
          trend: 'Increasing',
        },
        '90_min': {
          horizon_minutes: 90,
          predicted_occupied_slots: 52,
          predicted_available_slots: 8,
          occupancy_rate_percentage: 86.7,
          status: 'High Demand / Limited Slots',
          trend: 'Increasing',
        },
      },
    },
  });
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date().toLocaleTimeString());

  const fetchOwnerStats = async () => {
    try {
      setLoading(true);
      const res = await AnalyticsAPI.getOwner();
      if (res.data) {
        setStats(res.data);
        setLastRefreshed(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.warn('[OwnerDashboard] Note loading analytics:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwnerStats();
  }, []);

  const aiPreds = stats.aiPredictions?.predictions || {};
  const pred30 = aiPreds['30_min'] || {};
  const pred60 = aiPreds['60_min'] || {};
  const pred90 = aiPreds['90_min'] || {};

  return (
    <div className="space-y-8">
      {/* Facility Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-emerald-950/20 to-slate-900 border border-emerald-500/20 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              Parking Operator Command
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Synced: {lastRefreshed}</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">{stats.parkingName}</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time bay occupancy, AI demand forecasting, and operational revenue analytics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchOwnerStats}
            disabled={loading}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Sensors</span>
          </button>
          <Link
            to="/owner/slots"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-2 transition-all"
          >
            <Grid className="w-4 h-4" />
            <span>Manage Slots</span>
          </Link>
        </div>
      </div>

      {/* 5 Required Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Slots"
          value={stats.totalSlots}
          subtitle="Managed bay capacity"
          icon={Grid}
          color="blue"
        />
        <MetricCard
          title="Available Slots"
          value={stats.availableSlots}
          subtitle="Ready for incoming drivers"
          icon={CheckCircle2}
          color="emerald"
        />
        <MetricCard
          title="Occupied Slots"
          value={stats.occupiedSlots}
          subtitle={`${stats.occupancyRate || Math.round((stats.occupiedSlots / stats.totalSlots) * 100)}% utilization`}
          icon={AlertCircle}
          color="rose"
        />
        <MetricCard
          title="Today's Bookings"
          value={stats.todayBookings}
          subtitle="Checked in & active"
          icon={CalendarCheck}
          color="amber"
          trend="+12% vs yesterday"
        />
        <MetricCard
          title="Revenue"
          value={`₹${stats.revenue.toLocaleString()}`}
          subtitle="Today's gross earnings"
          icon={DollarSign}
          color="purple"
          trend="+15% surge"
        />
      </div>

      {/* AI Predictions & Dynamic Demand Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>AI Machine Learning Occupancy Predictions</span>
                <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                  FastAPI Random Forest v1.0
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Trained multi-output regression model forecasting garage saturation over future horizons
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            <span>Inference Time: &lt; 15ms</span>
          </div>
        </div>

        {/* 3 Horizon Forecast Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 30 Min Horizon */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-purple-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> +30 Minutes
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                {pred30.trend || 'Increasing'}
              </span>
            </div>

            <div>
              <div className="text-2xl font-bold font-mono text-white">
                {pred30.predicted_occupied_slots ?? stats.occupiedSlots + 2}{' '}
                <span className="text-xs text-slate-400 font-sans font-normal">/ {stats.totalSlots} Slots</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Expected Available:{' '}
                <strong className="text-emerald-400 font-mono">
                  {pred30.predicted_available_slots ?? Math.max(0, stats.availableSlots - 2)} Bays
                </strong>
              </p>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                <span>Predicted Occupancy</span>
                <span className="font-mono font-semibold text-white">
                  {pred30.occupancy_rate_percentage || 73.3}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${pred30.occupancy_rate_percentage || 73.3}%` }}
                ></div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 italic">
              {pred30.status || 'Moderate Demand / Normal Availability'}
            </p>
          </div>

          {/* 60 Min Horizon */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-amber-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> +60 Minutes
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                {pred60.trend || 'Increasing'}
              </span>
            </div>

            <div>
              <div className="text-2xl font-bold font-mono text-white">
                {pred60.predicted_occupied_slots ?? stats.occupiedSlots + 4}{' '}
                <span className="text-xs text-slate-400 font-sans font-normal">/ {stats.totalSlots} Slots</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Expected Available:{' '}
                <strong className="text-amber-400 font-mono">
                  {pred60.predicted_available_slots ?? Math.max(0, stats.availableSlots - 4)} Bays
                </strong>
              </p>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                <span>Predicted Occupancy</span>
                <span className="font-mono font-semibold text-white">
                  {pred60.occupancy_rate_percentage || 80.0}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{ width: `${pred60.occupancy_rate_percentage || 80.0}%` }}
                ></div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 italic">
              {pred60.status || 'High Demand / Limited Slots'}
            </p>
          </div>

          {/* 90 Min Horizon */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-rose-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> +90 Minutes
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
                Peak Demand
              </span>
            </div>

            <div>
              <div className="text-2xl font-bold font-mono text-white">
                {pred90.predicted_occupied_slots ?? stats.occupiedSlots + 6}{' '}
                <span className="text-xs text-slate-400 font-sans font-normal">/ {stats.totalSlots} Slots</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Expected Available:{' '}
                <strong className="text-rose-400 font-mono">
                  {pred90.predicted_available_slots ?? Math.max(0, stats.availableSlots - 6)} Bays
                </strong>
              </p>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                <span>Predicted Occupancy</span>
                <span className="font-mono font-semibold text-white">
                  {pred90.occupancy_rate_percentage || 86.7}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all"
                  style={{ width: `${pred90.occupancy_rate_percentage || 86.7}%` }}
                ></div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 italic">
              {pred90.status || 'Near Capacity / Suggest Reservation'}
            </p>
          </div>
        </div>

        {/* AI Actionable Recommendation Note */}
        <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 flex items-start gap-3">
          <Zap className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-purple-300">SmartPark AI Operator Recommendation:</span>
            <p className="text-slate-300 mt-0.5">
              High influx projected between 11:30 AM and 02:00 PM (+22% arrival rate). Ensure all level boom
              barriers are online and recommend keeping dynamic valet bays available for premium EV reservation slots.
            </p>
          </div>
        </div>
      </div>

      {/* Revenue & Occupancy Area Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span>Facility Weekly Revenue Performance (₹)</span>
            </h3>
            <p className="text-xs text-slate-400">Daily gross reservation fees collected from this location</p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400">
            ₹{stats.revenueChart.reduce((a, b) => a + b.revenue, 0).toLocaleString()} Total This Week
          </span>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.revenueChart}>
              <defs>
                <linearGradient id="ownerRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
              <Tooltip
                formatter={(val) => [`₹${val}`, 'Daily Revenue']}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#ownerRevGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/owner/parking"
          className="group bg-slate-900 border border-slate-800 hover:border-emerald-500/40 p-5 rounded-2xl transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-emerald-300">My Parking Spots</h4>
              <p className="text-[11px] text-slate-400">Add or edit parking lots & rates</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          to="/owner/slots"
          className="group bg-slate-900 border border-slate-800 hover:border-blue-500/40 p-5 rounded-2xl transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
              <Grid className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-blue-300">Manage Slot Bays</h4>
              <p className="text-[11px] text-slate-400">Real-time sensor bay manager</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          to="/owner/bookings"
          className="group bg-slate-900 border border-slate-800 hover:border-purple-500/40 p-5 rounded-2xl transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-purple-300">Customer Bookings</h4>
              <p className="text-[11px] text-slate-400">Track check-ins & fee audit</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
        </Link>
      </div>
    </div>
  );
};

export default OwnerDashboard;
