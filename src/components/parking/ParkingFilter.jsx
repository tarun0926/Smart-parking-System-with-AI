import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';

export const ParkingFilter = ({
  searchTerm = '',
  setSearchTerm = () => {},
  sortBy = 'distance',
  setSortBy = () => {},
  filterType = 'all',
  setFilterType = () => {},
  maxDistance = 50,
  setMaxDistance = null,
  maxPrice = 500,
  setMaxPrice = null,
  hasUserLocation = false,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
      {/* Row 1: Search + Quick filters */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="map-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by parking name, street or area…"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Availability filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            id="map-filter-type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer flex-1 md:flex-initial"
          >
            <option value="all">All Parking</option>
            <option value="available">Available Slots Only</option>
            <option value="ev">EV Charging</option>
            <option value="covered">Covered Bay</option>
          </select>

          {/* Sort */}
          <select
            id="map-sort-by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer flex-1 md:flex-initial"
          >
            <option value="distance">Sort: Distance</option>
            <option value="available">Sort: Most Available</option>
            <option value="price_low">Price: Low → High</option>
            <option value="price_high">Price: High → Low</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Row 2: Sliders (Only if handlers are passed) */}
      {(setMaxDistance || setMaxPrice) && (
        <div className="flex flex-col sm:flex-row gap-4 pt-1">
          {/* Distance filter – only meaningful when user location is available */}
          {setMaxDistance && (
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Max Distance
                </label>
                <span className="text-[11px] font-bold text-blue-400">
                  {maxDistance >= 50 ? 'Any' : `${maxDistance} km`}
                </span>
              </div>
              <input
                id="map-filter-distance"
                type="range"
                min={1}
                max={50}
                step={1}
                value={maxDistance}
                onChange={(e) => setMaxDistance(Number(e.target.value))}
                disabled={!hasUserLocation}
                title={!hasUserLocation ? 'Enable location to filter by distance' : ''}
                className="w-full h-1.5 accent-blue-500 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              />
              {!hasUserLocation && (
                <p className="text-[10px] text-slate-500 mt-0.5">📍 Enable location for distance filter</p>
              )}
            </div>
          )}

          {/* Price filter */}
          {setMaxPrice && (
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Max Price / Hour
                </label>
                <span className="text-[11px] font-bold text-emerald-400">
                  {maxPrice >= 500 ? 'Any' : `₹${maxPrice}`}
                </span>
              </div>
              <input
                id="map-filter-price"
                type="range"
                min={10}
                max={500}
                step={10}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full h-1.5 accent-emerald-500 cursor-pointer"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ParkingFilter;
