import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ text = 'Loading data...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
      <p className="text-sm text-slate-400 font-medium">{text}</p>
    </div>
  );
};

export default LoadingSpinner;
