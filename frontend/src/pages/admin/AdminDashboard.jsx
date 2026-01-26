import React, { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import StatCard from "../../components/admin/StatCard";
import { HiOutlineUsers, HiOutlineCalendar, HiOutlineCheckCircle, HiOutlineClock } from "react-icons/hi";
import { getDashboardStats } from "../../services/adminApi";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalDoctors: 0,
    pendingRegistrations: 0,
    totalAppointments: 0,
    pendingAppointments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const data = await getDashboardStats();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
      setError("Failed to load dashboard statistics. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const statCardsData = [
    {
      title: "Total Doctors",
      value: stats.totalDoctors,
      icon: HiOutlineUsers,
      color: "blue",
    },
    {
      title: "Pending Registrations",
      value: stats.pendingRegistrations,
      icon: HiOutlineClock,
      color: "yellow",
    },
    {
      title: "Total Appointments",
      value: stats.totalAppointments,
      icon: HiOutlineCalendar,
      color: "green",
    },
    {
      title: "Pending Appointments",
      value: stats.pendingAppointments,
      icon: HiOutlineCheckCircle,
      color: "purple",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's what's happening today.</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCardsData.map((stat, index) => (
            <StatCard
              key={index}
              title={stat.title}
              value={loading ? "..." : stat.value}
              icon={stat.icon}
              color={stat.color}
            />
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activities */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activities</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">New doctor registration</p>
                  <p className="text-sm text-gray-500">Dr. Sarah Johnson</p>
                </div>
                <span className="text-xs text-gray-500">2 hours ago</span>
              </div>
              <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Appointment approved</p>
                  <p className="text-sm text-gray-500">John Doe with Dr. Smith</p>
                </div>
                <span className="text-xs text-gray-500">4 hours ago</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Pending registration</p>
                  <p className="text-sm text-gray-500">Dr. Mike Wilson</p>
                </div>
                <span className="text-xs text-gray-500">1 day ago</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Stats</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <span className="text-gray-700">Approval Rate</span>
                <span className="font-bold text-green-600">92%</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <span className="text-gray-700">Avg. Response Time</span>
                <span className="font-bold text-blue-600">2.3 hours</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">System Status</span>
                <span className="font-bold text-green-600">Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
