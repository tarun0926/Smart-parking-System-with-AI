import React from 'react';

export const StatusBadge = ({ status }) => {
  const getStyle = (st) => {
    switch (st?.toLowerCase()) {
      case 'available':
      case 'active':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'occupied':
      case 'full':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'reserved':
      case 'pending':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'completed':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'maintenance':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
      default:
        return 'bg-slate-700/30 text-slate-300 border-slate-700';
    }
  };

  return (
    <span
      className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getStyle(
        status
      )} tracking-wide inline-flex items-center gap-1.5`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {status}
    </span>
  );
};

export default StatusBadge;
