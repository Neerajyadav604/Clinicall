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
    <div className="space-y-6 sm:space-y-8 md:space-y-10">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-tight">Dashboard</h1>
          <p className="text-gray-600 text-xs sm:text-sm md:text-base mt-1 sm:mt-2 md:mt-3 leading-relaxed">Welcome back! Here's what's happening today.</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 md:p-5">
            <p className="text-red-800 text-xs sm:text-sm md:text-base leading-relaxed">{error}</p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
          {/* Recent Activities */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-5 md:p-6">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">Recent Activities</h2>
            {loading ? (
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">Loading activities...</p>
            ) : stats.recentActivities?.length ? (
              <div className="space-y-3 sm:space-y-4">
                {stats.recentActivities.map((activity, index) => (
                  <div
                    key={`${activity.type}-${index}`}
                    className={`flex items-center gap-3 sm:gap-4 ${index < stats.recentActivities.length - 1 ? "pb-3 sm:pb-4 border-b border-gray-200" : ""}`}
                  >
                    <div
                      className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0 ${
                        activity.type === "registration"
                          ? "bg-yellow-600"
                          : "bg-blue-600"
                      }`}
                    ></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-xs sm:text-sm md:text-base leading-tight">{activity.title}</p>
                      <p className="text-xs sm:text-sm text-gray-500 mt-0.5 leading-relaxed truncate">{activity.detail}</p>
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : ""}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">No recent activity found.</p>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-5 md:p-6">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">Quick Stats</h2>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center pb-3 sm:pb-4 border-b border-gray-200 gap-2">
                <span className="text-gray-700 text-xs sm:text-sm md:text-base">Approval Rate</span>
                <span className="font-bold text-green-600 text-xs sm:text-sm md:text-base flex-shrink-0">
                  {loading ? "..." : `${stats.approvalRate || 0}%`}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 sm:pb-4 border-b border-gray-200 gap-2">
                <span className="text-gray-700 text-xs sm:text-sm md:text-base">Avg. Response Time</span>
                <span className="font-bold text-blue-600 text-xs sm:text-sm md:text-base flex-shrink-0">
                  {loading
                    ? "..."
                    : stats.avgResponseHours
                    ? `${stats.avgResponseHours.toFixed(1)} hr`
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 sm:pb-4 border-b border-gray-200 gap-2">
                <span className="text-gray-700 text-xs sm:text-sm md:text-base">Appointments Today</span>
                <span className="font-bold text-purple-600 text-xs sm:text-sm md:text-base flex-shrink-0">
                  {loading ? "..." : stats.appointmentsToday || 0}
                </span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-gray-700 text-xs sm:text-sm md:text-base">System Status</span>
                <span className="font-bold text-green-600 text-xs sm:text-sm md:text-base flex-shrink-0">
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
