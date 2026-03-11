import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminDashboard from "../pages/admin/AdminDashboard";
import DoctorRegistrations from "../pages/admin/DoctorRegistrations";
import Appointments from "../pages/admin/Appointments";
import Users from "../pages/admin/Users";
import ApprovedDoctors from "../pages/admin/ApprovedDoctors";
import RejectedDoctors from "../pages/admin/RejectedDoctors";
import Analytics from "../pages/admin/Analytics";

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<AdminDashboard />} />
      <Route path="/registrations" element={<DoctorRegistrations />} />
      <Route path="/appointments" element={<Appointments />} />
      <Route path="/users" element={<Users />} />
      <Route path="/approved-doctors" element={<ApprovedDoctors />} />
      <Route path="/rejected-doctors" element={<RejectedDoctors />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AdminRoutes;
