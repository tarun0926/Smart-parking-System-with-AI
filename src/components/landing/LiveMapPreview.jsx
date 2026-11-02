import React, { useState } from 'react';
import InteractiveMap from '../parking/InteractiveMap';
import { mockParkingLocations } from '../../data/mockData';

export const LiveMapPreview = () => {
  const [selectedId, setSelectedId] = useState(mockParkingLocations[0].id);

  return (
    <section className="py-20 bg-slate-950 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-extrabold text-blue-400 uppercase tracking-widest mb-2">Interactive Preview</h2>
          <p className="text-3xl font-bold text-white">Live Parking Map</p>
          <p className="text-sm text-slate-400 mt-2">
            Click on any pin to inspect real-time bay availability and pricing details.
          </p>
        </div>

        <InteractiveMap
          locations={mockParkingLocations}
          selectedLocationId={selectedId}
          onSelectLocation={setSelectedId}
        />
      </div>
    </section>
  );
};

export default LiveMapPreview;
