import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  getHospitalDoctorRegistrations,
  approveHospitalDoctorRegistration,
  rejectHospitalDoctorRegistration,
} from "../services/operations/hospitalAdminApi";

const STATUS_TABS = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

const RejectModal = ({ doctor, onClose, onConfirm, loading }) => {
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Reject Doctor Application</h3>
        <p className="text-sm text-gray-600">Rejecting application from <strong>Dr. {doctor?.fullName}</strong></p>
        <textarea
          className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none"
          rows={3}
          placeholder="Enter reason for rejection..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex gap-3">
          <button
            onClick={() => {
              if (!reason.trim()) { toast.warn("Please enter a rejection reason"); return; }
              onConfirm(reason);
            }}
            disabled={loading}
            className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
          >
            {loading ? "Rejecting..." : "Confirm Reject"}
          </button>
          <button onClick={onClose} className="flex-1 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const HospitalAdminDashboard = () => {
  const { user, token } = useSelector((state) => state.auth);
  const { profile } = useSelector((state) => state.profile);
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [statusTab, setStatusTab]       = useState("pending");
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectTarget, setRejectTarget]   = useState(null);

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetchApplications();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusTab, token]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getHospitalDoctorRegistrations(statusTab);
      setApplications(res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load applications");
      toast.error(err.message || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      setActionLoading(true);
      await approveHospitalDoctorRegistration(id);
      toast.success("Doctor application approved!");
      await fetchApplications();
    } catch (err) {
      toast.error(err.message || "Approval failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (reason) => {
    if (!rejectTarget) return;
    try {
      setActionLoading(true);
      await rejectHospitalDoctorRegistration(rejectTarget._id, reason);
      toast.success("Doctor application rejected.");
      setRejectTarget(null);
      await fetchApplications();
    } catch (err) {
      toast.error(err.message || "Rejection failed");
    } finally {
      setActionLoading(false);
    }
  };

  const hospitalName = profile?.hospitalName || user?.hospitalName || "Your Hospital";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{hospitalName}</h1>
          <p className="text-sm text-gray-500">Hospital Admin Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/hospitals")}
            className="px-4 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition font-medium"
          >
            View Public Listing →
          </button>
          {profile?.displayPicture ? (
            <img src={profile.displayPicture} alt="avatar" className="w-9 h-9 rounded-full object-cover border" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
              {(user?.name || "H")[0].toUpperCase()}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {STATUS_TABS.map((t) => {
            // eslint-disable-next-line no-unused-vars
            const _count = t.value === statusTab ? applications.length : "—";
            return (
              <div key={t.value} className="bg-white rounded-2xl shadow p-5 cursor-pointer hover:shadow-md transition" onClick={() => setStatusTab(t.value)}>
                <p className="text-sm text-gray-500 mb-1">{t.label} Applications</p>
                <p className="text-3xl font-bold text-gray-900">{statusTab === t.value ? applications.length : "—"}</p>
              </div>
            );
          })}
        </div>

        {/* Doctor Applications */}
        <div className="bg-white rounded-2xl shadow">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-gray-900">Doctor Applications</h2>
            {/* Status tabs */}
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              {STATUS_TABS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setStatusTab(t.value)}
                  className={`px-4 py-1.5 text-sm font-medium transition ${
                    statusTab === t.value
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mx-6 my-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="p-12 text-center text-gray-400">Loading...</div>
          ) : applications.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No {statusTab} applications.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-6 py-3 text-gray-500 font-medium">Doctor</th>
                    <th className="text-left px-6 py-3 text-gray-500 font-medium">Specialization</th>
                    <th className="text-left px-6 py-3 text-gray-500 font-medium">Experience</th>
                    <th className="text-left px-6 py-3 text-gray-500 font-medium">Applied On</th>
                    <th className="text-left px-6 py-3 text-gray-500 font-medium">Status</th>
                    {statusTab === "pending" && (
                      <th className="text-left px-6 py-3 text-gray-500 font-medium">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {app.displayPicture
                            ? <img src={app.displayPicture} alt="" className="w-8 h-8 rounded-full object-cover" />
                            : <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm">👨‍⚕️</div>
                          }
                          <div>
                            <p className="font-medium text-gray-800">{app.fullName}</p>
                            <p className="text-xs text-gray-400">{app.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{app.specialization || "—"}</td>
                      <td className="px-6 py-4 text-gray-700">{app.experienceYears ? `${app.experienceYears} yrs` : "—"}</td>
                      <td className="px-6 py-4 text-gray-500">{app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : "—"}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          app.hospitalStatus === "approved_hospital" ? "bg-green-100 text-green-700"
                          : app.hospitalStatus === "rejected_hospital" ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {app.hospitalStatus === "approved_hospital" ? "Approved"
                            : app.hospitalStatus === "rejected_hospital" ? "Rejected"
                            : "Pending"}
                        </span>
                      </td>
                      {statusTab === "pending" && (
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(app._id)}
                              disabled={actionLoading}
                              className="px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded hover:bg-green-100 transition disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setRejectTarget(app)}
                              disabled={actionLoading}
                              className="px-3 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded hover:bg-red-100 transition disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {rejectTarget && (
        <RejectModal
          doctor={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={handleReject}
          loading={actionLoading}
        />
      )}
    </div>
  );
};

export default HospitalAdminDashboard;
