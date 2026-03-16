import React, { useEffect, useState } from "react";
import DoctorLayout from "../../components/DoctorLayout";
import { getDoctorAppointmentsByStatus } from "../../services/doctorApi";
import { toast } from "react-toastify";

/**
 * DoctorDashboard Component
 * Displays overview of doctor's appointments and key metrics
 */
const DoctorDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    const fetchAppointmentStats = async () => {
      try {
        console.log('[📊 DOCTOR DASHBOARD] useEffect triggered - fetching appointment stats');
        setLoading(true);
        console.log('[📊 DOCTOR DASHBOARD] Loading state set to true');
        
        console.log('[📊 DOCTOR DASHBOARD] Calling getDoctorAppointmentsByStatus()');
        const grouped = await getDoctorAppointmentsByStatus();
        
        console.log('[📊 DOCTOR DASHBOARD] ✅ getDoctorAppointmentsByStatus returned');
        console.log('[📊 DOCTOR DASHBOARD] Grouped data:', grouped);

        const newStats = {
          total:
            (grouped.PENDING?.length || 0) +
            (grouped.APPROVED?.length || 0) +
            (grouped.REJECTED?.length || 0),
          pending: grouped.PENDING?.length || 0,
          approved: grouped.APPROVED?.length || 0,
          rejected: grouped.REJECTED?.length || 0,
        };
        
        console.log('[📊 DOCTOR DASHBOARD] Calculated stats:', newStats);
        
        setStats(newStats);
        console.log('[📊 DOCTOR DASHBOARD] Stats state updated successfully');
      } catch (error) {
        console.error("[📊 DOCTOR DASHBOARD] ❌ Error fetching stats");
        console.error("[📊 DOCTOR DASHBOARD] Error name:", error.name);
        console.error("[📊 DOCTOR DASHBOARD] Error message:", error.message);
        console.error("[📊 DOCTOR DASHBOARD] Error status:", error.response?.status);
        console.error("[📊 DOCTOR DASHBOARD] Error response data:", error.response?.data);
        console.error("[📊 DOCTOR DASHBOARD] Error stack:", error.stack);
        console.error("[📊 DOCTOR DASHBOARD] Full error object:", error);
        
        toast.error("Failed to load dashboard statistics");
        setStats({
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
        });
      } finally {
        setLoading(false);
        console.log('[📊 DOCTOR DASHBOARD] Loading state set to false');
      }
    };

    console.log('[📊 DOCTOR DASHBOARD] Mounting - calling fetchAppointmentStats');
    fetchAppointmentStats();
  }, []);

  return (
    <DoctorLayout>
      <div className="space-y-6">
        {/* Page Title */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard Overview
          </h1>
          <p className="text-gray-600 mt-2">
            Here's a summary of your appointments and patient requests.
          </p>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-gray-200 rounded-lg p-6 animate-pulse h-32"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Total Appointments */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">
                    Total Appointments
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.total}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <svg
                    className="w-8 h-8 text-blue-600"
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
                </div>
              </div>
            </div>

            {/* Pending Appointments */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Pending</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.pending}
                  </p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <svg
                    className="w-8 h-8 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Approved Appointments */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Approved</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.approved}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Rejected Appointments */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Rejected</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.rejected}
                  </p>
                </div>
                <div className="bg-red-100 p-3 rounded-lg">
                  <svg
                    className="w-8 h-8 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 14l-2-2m0 0l-2-2m2 2l2-2m-2 2l-2 2m2-2l2 2m6-10a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Info Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Next Steps */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Next Steps
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="flex-shrink-0 h-6 w-6 text-green-600 mr-3">
                  ✓
                </span>
                <span className="text-gray-700">
                  Review pending appointment requests
                </span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 h-6 w-6 text-green-600 mr-3">
                  ✓
                </span>
                <span className="text-gray-700">
                  Update your profile information
                </span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 h-6 w-6 text-green-600 mr-3">
                  ✓
                </span>
                <span className="text-gray-700">
                  Manage your availability and schedule
                </span>
              </li>
            </ul>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Account Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Profile Completion</span>
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" width="85%"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Response Rate</span>
                <span className="text-green-600 font-semibold">
                  {stats.total > 0
                    ? Math.round(
                        ((stats.pending + stats.approved) / stats.total) * 100
                      )
                    : 0}
                  %
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Active Status</span>
                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  Online
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DoctorLayout>
  );
};

export default DoctorDashboard;
