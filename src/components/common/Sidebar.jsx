import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  MapPin,
  BookmarkCheck,
  User,
  Building2,
  Grid,
  CalendarCheck,
  Users,
  Map,
  ClipboardList,
  ChevronRight,
  Shield,
  Car,
  Store,
} from 'lucide-react';

export const Sidebar = () => {
  const { role } = useAuth();

  const userNavigation = [
    { name: 'Dashboard', to: '/user/dashboard', icon: LayoutDashboard },
    { name: 'Parking Map', to: '/user/map', icon: MapPin },
    { name: 'My Bookings', to: '/user/bookings', icon: BookmarkCheck },
    { name: 'My Profile', to: '/user/profile', icon: User },
  ];

  const ownerNavigation = [
    { name: 'Owner Dashboard', to: '/owner/dashboard', icon: LayoutDashboard },
    { name: 'My Parking Spots', to: '/owner/parking', icon: Building2 },
    { name: 'Manage Slots', to: '/owner/slots', icon: Grid },
    { name: 'Reservations', to: '/owner/bookings', icon: CalendarCheck },
  ];

  const adminNavigation = [
    { name: 'Admin Overview', to: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'User Management', to: '/admin/users', icon: Users },
    { name: 'Parking Locations', to: '/admin/parking-locations', icon: Map },
    { name: 'All Bookings Audit', to: '/admin/bookings', icon: ClipboardList },
  ];

  const getNavItems = () => {
    if (role === 'owner') return ownerNavigation;
    if (role === 'admin') return adminNavigation;
    return userNavigation;
  };

  const getRoleBadge = () => {
    if (role === 'owner') {
      return { label: 'Parking Operator', icon: Store, bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
    }
    if (role === 'admin') {
      return { label: 'System Administrator', icon: Shield, bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30' };
    }
    return { label: 'Vehicle Driver', icon: Car, bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
  };

  const badge = getRoleBadge();
  const BadgeIcon = badge.icon;
  const items = getNavItems();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 shrink-0 hidden md:flex flex-col justify-between min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6">
        {/* Role Header Badge */}
        <div className={`p-3 rounded-xl border ${badge.bg} flex items-center gap-3`}>
          <div className="p-2 rounded-lg bg-slate-950/60">
            <BadgeIcon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider opacity-75">Active View</p>
            <p className="text-xs font-semibold">{badge.label}</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">
            Navigation Menu
          </p>
          <nav className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* College Project Viva Info Box Footer */}
      <div className="p-4 m-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1">
        <p className="font-semibold text-slate-300">SmartPark AI v1.0</p>
        <p className="text-[11px] text-slate-500">Major Project Phase 1 Foundation</p>
      </div>
    </aside>
  );
};

export default Sidebar;
