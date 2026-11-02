import React from 'react';
import { Link } from 'react-router-dom';
import { Car, Shield, Cpu, Activity } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Car className="w-5 h-5 text-white" />
              </div>
              <span className="text-base font-bold text-white">SmartPark AI</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Next-generation intelligent smart parking management and AI-powered occupancy prediction platform.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Quick Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/" className="hover:text-blue-400 transition-colors">Landing Page</Link></li>
              <li><Link to="/user/map" className="hover:text-blue-400 transition-colors">Live Parking Map</Link></li>
              <li><Link to="/login" className="hover:text-blue-400 transition-colors">Login Portal</Link></li>
              <li><Link to="/register" className="hover:text-blue-400 transition-colors">Register Account</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Core Modules</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-blue-400" /> AI Occupancy Engine</li>
              <li className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-emerald-400" /> Real-time Slot Sensor Simulation</li>
              <li className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-purple-400" /> Multi-role Access Control</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">College Major Project</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Designed & Developed for College Viva Demonstration. Modular architecture built with React, Vite, and Tailwind CSS.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} SmartPark AI. All rights reserved.</p>
          <p className="font-mono text-[11px]">Phase 1 Frontend Foundation • Status: Operational</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
