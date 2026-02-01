import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import DoctorDashboard from "../pages/doctor/DoctorDashboard";
import DoctorProfile from "../pages/doctor/DoctorProfile";
import DoctorEditProfile from "../pages/doctor/DoctorEditProfile";
import DoctorAppointments from "../pages/doctor/DoctorAppointments";
import Chat from "../pages/Chat";

/**
 * DoctorRoutes Component
 * Defines all doctor-specific routes with protection
 */
const DoctorRoutes = () => {
  return (
    <Routes>
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requiredRole="doctor">
            <DoctorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute requiredRole="doctor">
            <DoctorProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/edit-profile"
        element={
          <ProtectedRoute requiredRole="doctor">
            <DoctorEditProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/appointments"
        element={
          <ProtectedRoute requiredRole="doctor">
            <DoctorAppointments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat/:appointmentId"
        element={
          <ProtectedRoute requiredRole="doctor">
            <Chat />
          </ProtectedRoute>
        }
      />
      {/* Redirect unknown doctor routes to dashboard */}
      <Route path="*" element={<Navigate to="/doctor/dashboard" replace />} />
    </Routes>
  );
};

export default DoctorRoutes;
