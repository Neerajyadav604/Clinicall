import React, { useState, useEffect } from "react";
import StatCard from "../../components/admin/StatCard";
import { HiOutlineUsers, HiOutlineCalendar, HiOutlineCheckCircle, HiOutlineClock, HiOutlineOfficeBuilding, HiOutlineHome } from "react-icons/hi";
import { getAdminStats } from "../../services/adminApi";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    pendingRegistrations: 0,
    totalRevenue: 0,
    newUsersThisMonth: 0,
    appointmentsToday: 0,
    approvalRate: 0,
    avgResponseHours: null,
    systemStatus: "operational",
    recentActivities: [],
    totalHospitals: 0,
    totalClinics: 0,
    pendingEntityApplications: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const res = await getAdminStats();
      setStats(res.data || {});
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
      title: "Total Users",
      value: stats.totalUsers,
      icon: HiOutlineUsers,
      color: "blue",
    },
    {
      title: "Total Doctors",
      value: stats.totalDoctors,
      icon: HiOutlineCheckCircle,
      color: "purple",
    },
    {
      title: "Total Appointments",
      value: stats.totalAppointments,
      icon: HiOutlineCalendar,
      color: "green",
    },
    {
      title: "Pending Registrations",
      value: stats.pendingRegistrations,
      icon: HiOutlineClock,
      color: "yellow",
    },
    {
      title: "Total Hospitals",
      value: stats.totalHospitals,
      icon: HiOutlineOfficeBuilding,
      color: "blue",
    },
    {
      title: "Total Clinics",
      value: stats.totalClinics,
      icon: HiOutlineHome,
      color: "green",
    },
    {
      title: "Pending Entities",
      value: stats.pendingEntityApplications,
      icon: HiOutlineClock,
      color: "orange",
    },
  ];

  return (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6">
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
            {loading ? (
              <p className="text-sm text-gray-500">Loading activities...</p>
            ) : stats.recentActivities?.length ? (
              <div className="space-y-4">
                {stats.recentActivities.map((activity, index) => (
                  <div
                    key={`${activity.type}-${index}`}
                    className={`flex items-center gap-4 ${index < stats.recentActivities.length - 1 ? "pb-4 border-b border-gray-200" : ""}`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        activity.type === "registration"
                          ? "bg-yellow-600"
                          : "bg-blue-600"
                      }`}
                    ></div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-500">{activity.detail}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : ""}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No recent activity found.</p>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Stats</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <span className="text-gray-700">Approval Rate</span>
                <span className="font-bold text-green-600">
                  {loading ? "..." : `${stats.approvalRate || 0}%`}
                </span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <span className="text-gray-700">Avg. Response Time</span>
                <span className="font-bold text-blue-600">
                  {loading
                    ? "..."
                    : stats.avgResponseHours
                    ? `${stats.avgResponseHours.toFixed(1)} hours`
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <span className="text-gray-700">Appointments Today</span>
                <span className="font-bold text-purple-600">
                  {loading ? "..." : stats.appointmentsToday || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">System Status</span>
                <span className="font-bold text-green-600">
                  {loading ? "..." : stats.systemStatus || "operational"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

export default AdminDashboard;
