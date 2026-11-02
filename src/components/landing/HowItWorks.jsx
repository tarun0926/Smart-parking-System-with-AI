import React from 'react';
import { Search, Brain, Calendar, Car } from 'lucide-react';

export const HowItWorks = () => {
  const steps = [
    {
      step: '01',
      title: 'Search & Locate',
      description: 'Enter your destination or use current location to discover nearby available parking spots in real-time.',
      icon: Search,
      color: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
    },
    {
      step: '02',
      title: 'Check AI Availability Forecast',
      description: 'View predictive ML charts showing expected occupancy trends for your arrival time.',
      icon: Brain,
      color: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
    },
    {
      step: '03',
      title: 'Reserve Guaranteed Slot',
      description: 'Select your preferred parking bay and lock your reservation before starting your journey.',
      icon: Calendar,
      color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    },
    {
      step: '04',
      title: 'Seamless Park & Go',
      description: 'Navigate straight to your reserved slot with QR-code automatic gate access.',
      icon: Car,
      color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    },
  ];

  return (
    <section className="py-16 bg-slate-900/50 border-y border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-extrabold text-blue-400 uppercase tracking-widest mb-2">Step-By-Step Workflow</h2>
          <p className="text-2xl sm:text-3xl font-bold text-white">How SmartPark AI Works</p>
          <p className="text-sm text-slate-400 mt-2">Eliminate city traffic cruising with automated smart parking intelligence.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.step} className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative group hover:border-slate-700 transition-all">
                <span className="absolute top-4 right-4 text-2xl font-black text-slate-800 font-mono group-hover:text-slate-700">
                  {s.step}
                </span>
                <div className={`w-12 h-12 rounded-xl border ${s.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">{s.title}</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{s.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
