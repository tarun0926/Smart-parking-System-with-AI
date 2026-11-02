import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import PublicLayout from '../components/layouts/PublicLayout';
import DashboardLayout from '../components/layouts/DashboardLayout';

// Public Pages
import LandingPage from '../pages/public/LandingPage';
import LoginPage from '../pages/public/LoginPage';
import RegisterPage from '../pages/public/RegisterPage';

// User Pages
import UserDashboard from '../pages/user/UserDashboard';
import ParkingMapPage from '../pages/user/ParkingMapPage';
import ParkingDetailsPage from '../pages/user/ParkingDetailsPage';
import MyBookingsPage from '../pages/user/MyBookingsPage';
import ProfilePage from '../pages/user/ProfilePage';

// Owner Pages
import OwnerDashboard from '../pages/owner/OwnerDashboard';
import MyParkingPage from '../pages/owner/MyParkingPage';
import ManageSlotsPage from '../pages/owner/ManageSlotsPage';
import OwnerBookingsPage from '../pages/owner/OwnerBookingsPage';

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import UsersPage from '../pages/admin/UsersPage';
import ParkingLocationsPage from '../pages/admin/ParkingLocationsPage';
import AllBookingsPage from '../pages/admin/AllBookingsPage';

import ProtectedRoute from '../components/common/ProtectedRoute';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes wrapped in PublicLayout */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Dashboard Routes wrapped in DashboardLayout */}
      <Route element={<DashboardLayout />}>
        {/* User Driver Routes */}
        <Route
          path="/user/dashboard"
          element={
            <ProtectedRoute allowedRoles={['user', 'driver', 'owner', 'admin']}>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/map"
          element={
            <ProtectedRoute allowedRoles={['user', 'driver', 'owner', 'admin']}>
              <ParkingMapPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parking/:id"
          element={
            <ProtectedRoute allowedRoles={['user', 'driver', 'owner', 'admin']}>
              <ParkingDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/bookings"
          element={
            <ProtectedRoute allowedRoles={['user', 'driver', 'owner', 'admin']}>
              <MyBookingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/profile"
          element={
            <ProtectedRoute allowedRoles={['user', 'driver', 'owner', 'admin']}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Owner Operator Routes */}
        <Route
          path="/owner/dashboard"
          element={
            <ProtectedRoute allowedRoles={['owner', 'admin']}>
              <OwnerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/parking"
          element={
            <ProtectedRoute allowedRoles={['owner', 'admin']}>
              <MyParkingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/slots"
          element={
            <ProtectedRoute allowedRoles={['owner', 'admin']}>
              <ManageSlotsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/bookings"
          element={
            <ProtectedRoute allowedRoles={['owner', 'admin']}>
              <OwnerBookingsPage />
            </ProtectedRoute>
          }
        />

        {/* Admin System Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/parking-locations"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ParkingLocationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/bookings"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AllBookingsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};


export default AppRoutes;
