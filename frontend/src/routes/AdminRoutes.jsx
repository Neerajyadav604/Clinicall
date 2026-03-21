import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "../pages/admin/AdminLayout";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminProfile from "../pages/admin/AdminProfile";
import DoctorRegistrations from "../pages/admin/DoctorRegistrations";
import Appointments from "../pages/admin/Appointments";
import Users from "../pages/admin/Users";
import ApprovedDoctors from "../pages/admin/ApprovedDoctors";
import RejectedDoctors from "../pages/admin/RejectedDoctors";
import Analytics from "../pages/admin/Analytics";
import HospitalRegistrations from "../pages/admin/HospitalRegistrations";
import ApprovedHospitals from "../pages/admin/ApprovedHospitals";

const AdminRoutes = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/profile" element={<AdminProfile />} />
        <Route path="/registrations" element={<DoctorRegistrations />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/users" element={<Users />} />
        <Route path="/approved-doctors" element={<ApprovedDoctors />} />
        <Route path="/rejected-doctors" element={<RejectedDoctors />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/hospital-registrations" element={<HospitalRegistrations />} />
        <Route path="/hospitals" element={<ApprovedHospitals />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminRoutes;
