import React from 'react';

export const MetricCard = ({ title, value, subtitle, icon: Icon, trend, color = 'blue' }) => {
  const colorMap = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition-all">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-400">{title}</span>
        {Icon && (
          <div className={`p-2.5 rounded-lg border ${colorMap[color] || colorMap.blue}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-3">
        <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
      </div>
      {(subtitle || trend) && (
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
          {subtitle && <span>{subtitle}</span>}
          {trend && (
            <span className={`font-semibold ${trend.startsWith('+') ? 'text-emerald-400' : 'text-slate-400'}`}>
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default MetricCard;
