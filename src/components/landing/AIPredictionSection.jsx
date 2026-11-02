import React from 'react';
import AIPredictionPlaceholder from '../parking/AIPredictionPlaceholder';
import { mockParkingLocations } from '../../data/mockData';

export const AIPredictionSection = () => {
  const sampleData = mockParkingLocations[0].aiPrediction;

  return (
    <section className="py-20 bg-slate-900/40 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-extrabold text-blue-400 uppercase tracking-widest mb-2">Next-Gen Intelligence</h2>
          <p className="text-3xl font-bold text-white">AI Prediction Engine Showcase</p>
          <p className="text-sm text-slate-400 mt-2">
            Predictive machine learning models anticipate rush hours before you even start your engine.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <AIPredictionPlaceholder predictionData={sampleData} />
        </div>
      </div>
    </section>
  );
};

export default AIPredictionSection;
