import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import Navbar from '../common/Navbar';
import Sidebar from '../common/Sidebar';
import Footer from '../common/Footer';
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
} from 'lucide-react';

export const DashboardLayout = () => {
  const { role } = useAuth();

  const userItems = [
    { name: 'Dashboard', to: '/user/dashboard', icon: LayoutDashboard },
    { name: 'Parking Map', to: '/user/map', icon: MapPin },
    { name: 'Bookings', to: '/user/bookings', icon: BookmarkCheck },
    { name: 'Profile', to: '/user/profile', icon: User },
  ];

  const ownerItems = [
    { name: 'Dashboard', to: '/owner/dashboard', icon: LayoutDashboard },
    { name: 'Parking Spots', to: '/owner/parking', icon: Building2 },
    { name: 'Slots', to: '/owner/slots', icon: Grid },
    { name: 'Reservations', to: '/owner/bookings', icon: CalendarCheck },
  ];

  const adminItems = [
    { name: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Users', to: '/admin/users', icon: Users },
    { name: 'Locations', to: '/admin/parking-locations', icon: Map },
    { name: 'Audit Log', to: '/admin/bookings', icon: ClipboardList },
  ];

  const mobileNav = role === 'owner' ? ownerItems : role === 'admin' ? adminItems : userItems;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 flex flex-col">
          {/* Mobile Horizontal Scrollable Dashboard Sub-Navigation */}
          <div className="md:hidden mb-6 bg-slate-900 border border-slate-800 p-1.5 rounded-xl flex items-center gap-1 overflow-x-auto text-xs scrollbar-none">
            {mobileNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </div>

          <div className="flex-1">
            <Outlet />
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default DashboardLayout;
