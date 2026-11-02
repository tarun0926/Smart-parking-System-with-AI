import React from 'react';
import { Cpu, ShieldCheck, Zap, BarChart3, QrCode, Bell } from 'lucide-react';

export const FeaturesSection = () => {
  const features = [
    {
      title: 'Real-Time Sensor Feed',
      description: 'Instant status sync across available, occupied, and reserved parking bays.',
      icon: Zap,
    },
    {
      title: 'AI Occupancy Engine',
      description: 'Predictive analytics forecast parking availability hours in advance.',
      icon: Cpu,
    },
    {
      title: 'QR Code Check-in',
      description: 'Contactless automated boom barrier entry and exit validation.',
      icon: QrCode,
    },
    {
      title: 'Owner Revenue Analytics',
      description: 'Comprehensive financial reports and hourly slot utilization charts for parking owners.',
      icon: BarChart3,
    },
    {
      title: 'Multi-Role Access Control',
      description: 'Dedicated user, operator, and administrator permission workflows.',
      icon: ShieldCheck,
    },
    {
      title: 'Smart Slot Reservation',
      description: 'Guaranteed parking spot allocation with flexible extension controls.',
      icon: Bell,
    },
  ];

  return (
    <section className="py-20 bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-xs font-extrabold text-blue-400 uppercase tracking-widest mb-2">Platform Capabilities</h2>
          <p className="text-3xl font-bold text-white">Smart Parking Features</p>
          <p className="text-sm text-slate-400 mt-2">Built for drivers, parking operators, and city administrators.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 hover:border-blue-500/40 transition-all hover:shadow-lg hover:shadow-blue-500/5">
                <div className="w-10 h-10 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-white">{f.title}</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{f.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
