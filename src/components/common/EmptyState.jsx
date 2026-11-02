import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No Data Found',
  description = 'There are no items to display at the moment.',
  actionLabel,
  onAction,
}) => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl py-12 px-6 text-center flex flex-col items-center">
      <div className="p-4 rounded-full bg-slate-800/80 border border-slate-700 text-slate-400 mb-4">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="text-sm text-slate-400 max-w-md mt-1 mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
