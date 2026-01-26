import React from "react";
import { Navigate } from "react-router-dom";
import { decodeToken } from "../services/doctorApi";

/**
 * ProtectedRoute Component
 * Guards doctor routes to ensure only authenticated doctors can access
 */
const ProtectedRoute = ({ children, requiredRole = "doctor" }) => {
  // Check if token exists
  const token = localStorage.getItem("token");
  
  if (!token) {
    // No token, redirect to login
    return <Navigate to="/login" replace />;
  }

  // Decode token to get user role
  const decoded = decodeToken();
  
  if (!decoded) {
    // Invalid token, redirect to login
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }

  // Check if user has the required role
  const userRole = decoded.role?.toLowerCase();
  const requiredRoleLower = requiredRole.toLowerCase();

  if (userRole !== requiredRoleLower) {
    // User doesn't have required role, redirect to home
    return <Navigate to="/" replace />;
  }

  // User is authenticated and has required role
  return children;
};

export default ProtectedRoute;
