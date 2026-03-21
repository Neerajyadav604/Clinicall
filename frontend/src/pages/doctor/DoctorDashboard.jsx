import React, { useEffect, useState } from "react";
import DoctorLayout from "../../components/DoctorLayout";
import { getDoctorAppointmentsByStatus } from "../../services/doctorApi";
import { toast } from "react-toastify";
import { ShieldCheck, MapPin } from "lucide-react";

/**
 * DoctorDashboard Component
 * Displays overview of doctor's appointments and key metrics
 * Updated with Stitch design system for modern, clean aesthetics
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

  const getDoctorInfo = () => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        return JSON.parse(userData);
      }
      return null;
    } catch {
      return null;
    }
  };

  const doctorInfo = getDoctorInfo();
  const profileCompletion = 85; // Default value, can be enhanced with actual calculation

  return (
    <DoctorLayout>
      <div className="space-y-6 md:space-y-8">
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* HEADER SECTION - Stitch Design */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 sm:p-6 md:p-8 text-white shadow-[0_16px_34px_-26px_rgba(2,6,23,0.45)]">
          {/* Decorative gradient orbs */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-blue-400/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 left-0 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
          
          {/* Content */}
          <div className="relative space-y-5 md:space-y-6">
            {/* Title & Subtitle */}
            <div>
              <p className="text-xs sm:text-sm uppercase tracking-[0.15em] text-blue-200 font-semibold">Dashboard</p>
              <h1 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
                Welcome, {doctorInfo?.fullName || "Doctor"}
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-200">
                Here's a summary of your appointments and patient requests.
              </p>
            </div>

            {/* Status badges */}
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/30 bg-blue-500/15 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-blue-100">
                <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0" />
                Verified account
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-400/30 bg-slate-400/15 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-200">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                Active status
              </span>
            </div>
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* APPOINTMENT STATISTICS CARDS - Stitch Design */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {loading ? (
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 bg-slate-100 p-5 md:p-6 animate-pulse h-32 sm:h-36"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {/* Total Appointments Card */}
            <StatCard
              label="Total Appointments"
              value={stats.total}
              iconColor="bg-blue-100"
              iconBg="text-blue-600"
              accentColor="from-blue-50 to-blue-50/50"
              icon={
                <svg
                  className="h-6 w-6"
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
              }
            />

            {/* Pending Appointments Card */}
            <StatCard
              label="Pending"
              value={stats.pending}
              iconColor="bg-amber-100"
              iconBg="text-amber-600"
              accentColor="from-amber-50 to-amber-50/50"
              icon={
                <svg
                  className="h-6 w-6"
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
              }
            />

            {/* Approved Appointments Card */}
            <StatCard
              label="Approved"
              value={stats.approved}
              iconColor="bg-emerald-100"
              iconBg="text-emerald-600"
              accentColor="from-emerald-50 to-emerald-50/50"
              icon={
                <svg
                  className="h-6 w-6"
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
              }
            />

            {/* Rejected Appointments Card */}
            <StatCard
              label="Rejected"
              value={stats.rejected}
              iconColor="bg-rose-100"
              iconBg="text-rose-600"
              accentColor="from-rose-50 to-rose-50/50"
              icon={
                <svg
                  className="h-6 w-6"
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
              }
            />
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* QUICK INFO SECTION - Stitch Design */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Next Steps Card */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 md:p-7 shadow-[0_2px_8px_rgba(2,6,23,0.06)] hover:shadow-[0_8px_16px_rgba(2,6,23,0.08)] transition-shadow">
            <div className="space-y-5">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-900">
                  Next Steps
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-slate-500">
                  Complete these tasks to optimize your profile
                </p>
              </div>

              <ul className="space-y-3 sm:space-y-4">
                <ChecklistItem
                  title="Review pending appointment requests"
                  description="Respond to patient requests promptly"
                />
                <ChecklistItem
                  title="Update your profile information"
                  description="Keep your details current for better bookings"
                />
                <ChecklistItem
                  title="Manage your availability and schedule"
                  description="Set your working hours and time slots"
                />
              </ul>
            </div>
          </section>

          {/* Account Status Card */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 md:p-7 shadow-[0_2px_8px_rgba(2,6,23,0.06)] hover:shadow-[0_8px_16px_rgba(2,6,23,0.08)] transition-shadow">
            <div className="space-y-5">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-900">
                  Account Status
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-slate-500">
                  Monitor your account performance and completion
                </p>
              </div>

              <div className="space-y-5 sm:space-y-6">
                {/* Profile Completion */}
                <div>
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <label className="text-xs sm:text-sm font-medium text-slate-700">
                      Profile Completeness
                    </label>
                    <span className="text-sm sm:text-base font-bold text-slate-900">
                      {profileCompletion}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500"
                      style={{ width: `${profileCompletion}%` }}
                    />
                  </div>
                </div>

                {/* Response Rate */}
                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 sm:p-5">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                      Response Rate
                    </p>
                    <p className="mt-1 text-lg sm:text-2xl font-bold text-slate-900">
                      {stats.total > 0
                        ? Math.round(
                            ((stats.pending + stats.approved) / stats.total) * 100
                          )
                        : 0}
                      %
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">
                      {stats.pending + stats.approved} of {stats.total} appointments
                    </p>
                  </div>
                </div>

                {/* Active Status */}
                <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                      Account Status
                    </p>
                    <p className="mt-1 text-sm sm:text-base font-semibold text-slate-900">
                      Active & Verified
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-medium text-emerald-700">Online</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </DoctorLayout>
  );
};

/**
 * StatCard Component - Reusable stat display card with Stitch design
 */
const StatCard = ({
  label,
  value,
  iconColor,
  iconBg,
  accentColor,
  icon,
}) => (
  <div className={`rounded-2xl border border-slate-200 bg-gradient-to-br ${accentColor} bg-white p-5 sm:p-6 md:p-7 shadow-[0_2px_8px_rgba(2,6,23,0.06)] hover:shadow-[0_8px_16px_rgba(2,6,23,0.08)] transition-shadow`}>
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
          {label}
        </p>
        <p className="mt-3 text-3xl sm:text-4xl md:text-3xl font-bold text-slate-900 leading-tight">
          {value}
        </p>
      </div>
      <div className={`${iconColor} p-3 sm:p-4 rounded-xl flex-shrink-0`}>
        <div className={`${iconBg} h-6 w-6 sm:h-7 sm:w-7`}>
          {icon}
        </div>
      </div>
    </div>
  </div>
);

/**
 * ChecklistItem Component - Reusable checklist item with Stitch design
 */
const ChecklistItem = ({ title, description }) => (
  <li className="flex items-start gap-3 sm:gap-4 rounded-lg border border-slate-100 bg-slate-50 p-4 sm:p-5 transition-colors hover:bg-slate-100">
    <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-emerald-300 bg-emerald-50">
      <span className="text-emerald-600 font-bold text-xs">✓</span>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-slate-900">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  </li>
);

export default DoctorDashboard;
