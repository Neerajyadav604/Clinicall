import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

/**
 * DoctorLayout Component
 * Provides navigation and layout for all doctor dashboard pages
 */
const DoctorLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Get doctor name from localStorage or token
  const getDoctorName = () => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        return user.fullName || "Doctor";
      }
      return "Doctor";
    } catch (error) {
      return "Doctor";
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("doctorProfile");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const isActive = (path) => {
    return location.pathname === path ? "active" : "";
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-gradient-to-b from-blue-600 to-blue-800 text-white transition-all duration-300 ease-in-out flex flex-col shadow-lg`}
      >
        {/* Logo / Header */}
        <div className="p-6 border-b border-blue-700 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-xl font-bold">ClinicAll</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-blue-700 rounded"
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link
            to="/doctor/dashboard"
            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
              isActive("/doctor/dashboard")
                ? "bg-blue-700"
                : "hover:bg-blue-700"
            }`}
            title="Dashboard"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-3m2 3l2-3m6 0l2 3m2-3l2 3m-9 3v6m0 0v3m0-3h3m0 0h3"
              />
            </svg>
            {sidebarOpen && <span className="ml-4">Dashboard</span>}
          </Link>

          <Link
            to="/doctor/profile"
            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
              isActive("/doctor/profile") ? "bg-blue-700" : "hover:bg-blue-700"
            }`}
            title="Profile"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            {sidebarOpen && <span className="ml-4">Profile</span>}
          </Link>

          <Link
            to="/doctor/appointments"
            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
              isActive("/doctor/appointments")
                ? "bg-blue-700"
                : "hover:bg-blue-700"
            }`}
            title="Appointments"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {sidebarOpen && <span className="ml-4">Appointments</span>}
          </Link>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-blue-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 transition-colors justify-center"
            title="Logout"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            {sidebarOpen && <span className="ml-4">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Top Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-8 py-4 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-800">
              Welcome, {getDoctorName()}!
            </h2>
            <div className="flex items-center space-x-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg
                  className="w-6 h-6 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </button>
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                {getDoctorName().charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
};

export default DoctorLayout;
