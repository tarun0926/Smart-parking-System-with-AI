import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Sparkles, Shield, ArrowRight, Car, CheckCircle2 } from 'lucide-react';

export const HeroSection = () => {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-slate-950">
      {/* Dynamic Background Glow Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>AI-Driven Parking Management Platform</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
            Smart Parking.{' '}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              Smarter Decisions.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-slate-400 leading-relaxed font-normal">
            Find available parking, reserve your slot and let AI predict parking availability before you arrive.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/user/map"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all hover:scale-105"
            >
              <MapPin className="w-5 h-5" />
              <span>Find Parking</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>

            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-base flex items-center justify-center transition-all"
            >
              Login
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-12 border-t border-slate-800/80 mt-12">
            <div className="text-center p-3 rounded-lg bg-slate-900/50 border border-slate-800">
              <span className="text-2xl font-bold text-white">99.4%</span>
              <p className="text-xs text-slate-400 mt-0.5">Prediction Accuracy</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-slate-900/50 border border-slate-800">
              <span className="text-2xl font-bold text-emerald-400">100+</span>
              <p className="text-xs text-slate-400 mt-0.5">Smart Parking Locations</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-slate-900/50 border border-slate-800">
              <span className="text-2xl font-bold text-blue-400">15 mins</span>
              <p className="text-xs text-slate-400 mt-0.5">Average Time Saved</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-slate-900/50 border border-slate-800">
              <span className="text-2xl font-bold text-purple-400">24/7</span>
              <p className="text-xs text-slate-400 mt-0.5">Real-time Sensor Feed</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
