import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../common/Navbar';
import Footer from '../common/Footer';

export const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
