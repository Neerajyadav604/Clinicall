import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DoctorLayout from "../../components/DoctorLayout";
import {
  getDoctorAppointments,
  approveAppointment,
  rejectAppointment,
} from "../../services/doctorApi";
import { toast } from "react-toastify";

/**
 * DoctorAppointments Component
 * Displays and manages doctor's appointments with approve/reject functionality
 */
const DoctorAppointments = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectionModal, setRejectionModal] = useState({
    open: false,
    appointmentId: null,
    reason: "",
  });

  // Fetch appointments on component mount
  useEffect(() => {
    console.log('[📋 DOCTOR APPOINTMENTS] Component mounted - fetching appointments');
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      console.log('[📋 DOCTOR APPOINTMENTS] fetchAppointments called');
      setLoading(true);
      console.log('[📋 DOCTOR APPOINTMENTS] Loading state set to true');
      
      console.log('[📋 DOCTOR APPOINTMENTS] Calling getDoctorAppointments()');
      const response = await getDoctorAppointments();
      
      console.log('[📋 DOCTOR APPOINTMENTS] ✅ getDoctorAppointments returned');
      console.log('[📋 DOCTOR APPOINTMENTS] Response:', response);
      
      const appointmentList = response.data || response || [];
      console.log('[📋 DOCTOR APPOINTMENTS] Extracted appointment list:', appointmentList);
      console.log('[📋 DOCTOR APPOINTMENTS] Appointment list length:', appointmentList.length);
      
      const validAppointments = Array.isArray(appointmentList) ? appointmentList : [];
      console.log('[📋 DOCTOR APPOINTMENTS] Valid appointments count:', validAppointments.length);
      
      setAppointments(validAppointments);
      console.log('[📋 DOCTOR APPOINTMENTS] Appointments state updated');
    } catch (error) {
      console.error("[📋 DOCTOR APPOINTMENTS] ❌ Error fetching appointments");
      console.error("[📋 DOCTOR APPOINTMENTS] Error name:", error.name);
      console.error("[📋 DOCTOR APPOINTMENTS] Error message:", error.message);
      console.error("[📋 DOCTOR APPOINTMENTS] Error status:", error.response?.status);
      console.error("[📋 DOCTOR APPOINTMENTS] Error response data:", error.response?.data);
      console.error("[📋 DOCTOR APPOINTMENTS] Error stack:", error.stack);
      console.error("[📋 DOCTOR APPOINTMENTS] Full error object:", error);
      
      toast.error("Failed to load appointments");
      setAppointments([]);
    } finally {
      setLoading(false);
      console.log('[📋 DOCTOR APPOINTMENTS] Loading state set to false');
    }
  };

  const handleApproveAppointment = async (appointmentId) => {
    try {
      console.log('[📋 DOCTOR APPOINTMENTS] handleApproveAppointment called for:', appointmentId);
      setActionLoading(appointmentId);
      console.log('[📋 DOCTOR APPOINTMENTS] Action loading state set to:', appointmentId);
      
      console.log('[📋 DOCTOR APPOINTMENTS] Calling approveAppointment()');
      const response = await approveAppointment(appointmentId);
      console.log('[📋 DOCTOR APPOINTMENTS] ✅ Appointment approved');
      console.log('[📋 DOCTOR APPOINTMENTS] Approval response:', response);
      
      toast.success("Appointment approved successfully");

      // Update local state
      const updatedAppointments = appointments.map((apt) =>
        apt._id === appointmentId
          ? { ...apt, approvalstatus: "APPROVED", paymentStatus: "unpaid", consultationStatus: "locked" }
          : apt
      );
      setAppointments(updatedAppointments);
      console.log('[📋 DOCTOR APPOINTMENTS] Appointments state updated with new approval status');
    } catch (error) {
      console.error("[📋 DOCTOR APPOINTMENTS] ❌ Error approving appointment");
      console.error("[📋 DOCTOR APPOINTMENTS] Appointment ID:", appointmentId);
      console.error("[📋 DOCTOR APPOINTMENTS] Error message:", error.message);
      console.error("[📋 DOCTOR APPOINTMENTS] Error status:", error.response?.status);
      console.error("[📋 DOCTOR APPOINTMENTS] Error data:", error.response?.data);
      console.error("[📋 DOCTOR APPOINTMENTS] Error stack:", error.stack);
      
      toast.error(error.message || "Failed to approve appointment");
    } finally {
      setActionLoading(null);
      console.log('[📋 DOCTOR APPOINTMENTS] Action loading state cleared');
    }
  };

  const handleRejectClick = (appointmentId) => {
    setRejectionModal({
      open: true,
      appointmentId,
      reason: "",
    });
  };

  const handleConfirmReject = async () => {
    const { appointmentId, reason } = rejectionModal;

    try {
      console.log('[📋 DOCTOR APPOINTMENTS] handleConfirmReject called');
      console.log('[📋 DOCTOR APPOINTMENTS] Appointment ID:', appointmentId);
      console.log('[📋 DOCTOR APPOINTMENTS] Rejection reason:', reason);
      
      setActionLoading(appointmentId);
      console.log('[📋 DOCTOR APPOINTMENTS] Action loading state set');
      
      console.log('[📋 DOCTOR APPOINTMENTS] Calling rejectAppointment()');
      const response = await rejectAppointment(appointmentId, reason);
      console.log('[📋 DOCTOR APPOINTMENTS] ✅ Appointment rejected');
      console.log('[📋 DOCTOR APPOINTMENTS] Rejection response:', response);
      
      toast.success("Appointment rejected successfully");

      // Update local state
      const updatedAppointments = appointments.map((apt) =>
        apt._id === appointmentId
          ? { ...apt, approvalstatus: "REJECTED" }
          : apt
      );
      setAppointments(updatedAppointments);
      console.log('[📋 DOCTOR APPOINTMENTS] Appointments state updated with rejection status');

      setRejectionModal({ open: false, appointmentId: null, reason: "" });
      console.log('[📋 DOCTOR APPOINTMENTS] Rejection modal closed');
    } catch (error) {
      console.error("[📋 DOCTOR APPOINTMENTS] ❌ Error rejecting appointment");
      console.error("[📋 DOCTOR APPOINTMENTS] Appointment ID:", appointmentId);
      console.error("[📋 DOCTOR APPOINTMENTS] Error message:", error.message);
      console.error("[📋 DOCTOR APPOINTMENTS] Error status:", error.response?.status);
      console.error("[📋 DOCTOR APPOINTMENTS] Error data:", error.response?.data);
      console.error("[📋 DOCTOR APPOINTMENTS] Error stack:", error.stack);
      
      toast.error(error.message || "Failed to reject appointment");
    } finally {
      setActionLoading(null);
      console.log('[📋 DOCTOR APPOINTMENTS] Action loading state cleared');
    }
  };

  // Filter appointments based on selected filter
  const filteredAppointments = appointments.filter((apt) => {
    if (filter === "all") return true;
    return apt.approvalstatus?.toUpperCase() === filter.toUpperCase();
  });

  // Format date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <DoctorLayout>
      <div className="space-y-6">
        {/* Page Title */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Appointment Management
          </h1>
          <p className="text-gray-600 mt-2">
            Review and manage patient appointment requests
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex flex-wrap gap-2">
            {[
              { label: "All", value: "all" },
              { label: "Pending", value: "pending" },
              { label: "Approved", value: "approved" },
              { label: "Rejected", value: "rejected" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === tab.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {tab.label}
                {tab.value !== "all" && (
                  <span className="ml-2">
                    (
                    {
                      appointments.filter(
                        (apt) =>
                          apt.approvalstatus?.toUpperCase() ===
                          tab.value.toUpperCase()
                      ).length
                    }
                    )
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Appointments List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-gray-200 rounded-lg p-6 animate-pulse h-48"
              />
            ))}
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Appointments Found
            </h3>
            <p className="text-gray-600">
              {filter === "all"
                ? "You don't have any appointments yet."
                : `No ${filter} appointments at the moment.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredAppointments.map((appointment) => {
              const consultationActive =
                appointment.paymentStatus === "paid" &&
                appointment.consultationStatus === "active";

              const chatButtonClass = consultationActive
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-slate-300 text-slate-600 cursor-not-allowed";

              const notesButtonClass = consultationActive
                ? "bg-cyan-600 text-white hover:bg-cyan-700"
                : "bg-slate-300 text-slate-600 cursor-not-allowed";

              return (
                <div
                  key={appointment._id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-600 px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Appointment Request
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatDate(appointment.appointmentDate)}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        appointment.approvalstatus
                      )}`}
                    >
                      {appointment.approvalstatus || "PENDING"}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="px-6 py-4 space-y-4">
                  {/* Appointment Time */}
                  <div className="flex items-center text-gray-700">
                    <svg
                      className="w-5 h-5 text-gray-400 mr-3"
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
                    <span>{appointment.appointmentTime || "Time not set"}</span>
                  </div>

                  {/* Reason / Symptoms */}
                  {appointment.reason && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Reason for Visit
                      </p>
                      <p className="text-gray-900 mt-1">{appointment.reason}</p>
                    </div>
                  )}

                  {/* Payment Status */}
                  <div className="flex items-center text-sm">
                    <span className="text-gray-600">Payment Status:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {appointment.paymentStatus === "paid" ? (
                        <span className="text-green-600 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor">
                            <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                          </svg>
                          Paid
                        </span>
                      ) : (
                        <span className="text-yellow-600">Unpaid</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Card Footer - Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                  {appointment.approvalstatus?.toUpperCase() === "PENDING" ? (
                    <div className="flex gap-3">
                      <button
                        onClick={() =>
                          handleApproveAppointment(appointment._id)
                        }
                        disabled={actionLoading === appointment._id}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
                      >
                        {actionLoading === appointment._id ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4">
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            Processing...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="currentColor">
                              <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                            </svg>
                            Approve
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleRejectClick(appointment._id)}
                        disabled={actionLoading === appointment._id}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
                      >
                        {actionLoading === appointment._id ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4">
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            Processing...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="currentColor">
                              <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
                            </svg>
                            Reject
                          </>
                        )}
                      </button>
                    </div>
                  ) : appointment.approvalstatus?.toUpperCase() === "APPROVED" ? (
                    <div className="flex gap-3">
                      <button
                        onClick={() => navigate(`/consultation/${appointment._id}`)}
                        disabled={!consultationActive}
                        title={
                          consultationActive
                            ? "Start live consultation"
                            : "Available after payment is confirmed"
                        }
                        className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium flex items-center justify-center ${
                          consultationActive
                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        <svg className="w-4 h-4 mr-2" fill="currentColor">
                          <path d="M18 9.5a8 8 0 11-16 0 8 8 0 0116 0z" />
                          <path d="M9 9a3 3 0 100-6 3 3 0 000 6zm0 6a6 6 0 016-6H7a6 6 0 016 6v1H9v-1z" />
                        </svg>
                        {consultationActive ? "Live Consultation" : "Locked"}
                      </button>
                      <button
                        onClick={() => navigate(`/doctor/chat/${appointment._id}`)}
                        disabled={!consultationActive}
                        title={
                          consultationActive
                            ? "Start chat"
                            : "Available after payment is confirmed"
                        }
                        className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium flex items-center justify-center ${chatButtonClass}`}
                      >
                        <svg className="w-4 h-4 mr-2" fill="currentColor">
                          <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                          <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                        </svg>
                        {consultationActive ? "Chat" : "Chat Locked"}
                      </button>
                      <button
                        onClick={() => navigate(`/doctor/clinical-notes/${appointment._id}`)}
                        disabled={!consultationActive}
                        title={
                          consultationActive
                            ? "Open clinical notes"
                            : "Available after payment is confirmed"
                        }
                        className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium flex items-center justify-center ${notesButtonClass}`}
                      >
                        <svg className="w-4 h-4 mr-2" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                        {consultationActive ? "Clinical Notes" : "Locked"}
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-sm text-gray-600">
                        Status: <span className="font-semibold">
                          {appointment.approvalstatus || "PENDING"}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )})}
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {rejectionModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Reject Appointment
              </h3>
            </div>

            <div className="px-6 py-4">
              <label className="block mb-4">
                <span className="text-gray-700 text-sm font-medium mb-2 block">
                  Rejection Reason (Optional)
                </span>
                <textarea
                  value={rejectionModal.reason}
                  onChange={(e) =>
                    setRejectionModal({
                      ...rejectionModal,
                      reason: e.target.value,
                    })
                  }
                  placeholder="e.g., Already booked at this time, Cannot accommodate this case, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows="4"
                />
              </label>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
              <button
                onClick={() =>
                  setRejectionModal({ open: false, appointmentId: null, reason: "" })
                }
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={actionLoading === rejectionModal.appointmentId}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {actionLoading === rejectionModal.appointmentId
                  ? "Processing..."
                  : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DoctorLayout>
  );
};

export default DoctorAppointments;
