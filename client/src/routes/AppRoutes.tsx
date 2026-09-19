import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { StaffLayout } from '../layouts/StaffLayout';
import { Home } from '../pages/Home/Home';
import { ShowDetails } from '../pages/ShowDetails/ShowDetails';
import { BookSeats } from '../pages/BookSeats/BookSeats';
import { Checkout } from '../pages/Checkout/Checkout';
import { Receipts } from '../pages/Receipts/Receipts';
import { CinemaList } from '../pages/Cinema/CinemaList';
import { CinemaDetail } from '../pages/Cinema/CinemaDetail';
import { MovieSchedule } from '../pages/Schedule/MovieSchedule';
import { Login } from '../pages/Login/Login';
import { Register } from '../pages/Register/Register';
import { AdminDashboard } from '../pages/Admin/AdminDashboard';
import { StaffScanner } from '../pages/Staff/StaffScanner';
import { StaffBoxOffice } from '../pages/Staff/StaffBoxOffice';
import { StaffSeatSwap } from '../pages/Staff/StaffSeatSwap';
import { StaffAttendance } from '../pages/Staff/StaffAttendance';
import { ProtectedRoute } from './ProtectedRoute';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Staff Console Subsystem (Dedicated Mobile/Tablet Portrait Layout) */}
      <Route
        path="/staff"
        element={
          <ProtectedRoute requiredRole="staff">
            <StaffLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/staff/scanner" replace />} />
        <Route path="scanner" element={<StaffScanner />} />
        <Route path="box-office" element={<StaffBoxOffice />} />
        <Route path="seat-swap" element={<StaffSeatSwap />} />
        <Route path="attendance" element={<StaffAttendance />} />
      </Route>

      {/* Main Website Layout (Customer & Admin Operations) */}
      <Route element={<MainLayout />}>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/movie/:id" element={<ShowDetails />} />
        <Route path="/cinemas" element={<CinemaList />} />
        <Route path="/cinema/:id" element={<CinemaDetail />} />
        <Route path="/schedule" element={<MovieSchedule />} />
        <Route path="/showtimes" element={<Navigate to="/schedule" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/receipts" element={<Receipts />} />

        {/* Admin Dashboard Route (Admin Office Operations) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected Booking Flow Routes */}
        <Route
          path="/book/:showtimeId"
          element={
            <ProtectedRoute>
              <BookSeats />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />

        {/* Fallback 404 Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};
