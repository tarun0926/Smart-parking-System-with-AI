import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export const ErrorAlert = ({
  title = 'Something went wrong',
  message = 'Failed to load information. Please try again.',
  onRetry,
}) => {
  return (
    <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-4 flex items-start gap-3 text-rose-200">
      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-rose-300">{title}</h4>
        <p className="text-xs text-rose-200/80 mt-1">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-900/60 hover:bg-rose-900 border border-rose-700/80 text-rose-200 text-xs font-medium rounded-lg transition-all shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
};

export default ErrorAlert;
