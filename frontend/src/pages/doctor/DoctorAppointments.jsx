import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DoctorLayout from "../../components/DoctorLayout";
import {
  getDoctorAppointments,
  approveAppointment,
  rejectAppointment,
} from "../../services/doctorApi";
import { toast } from "react-toastify";

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

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await getDoctorAppointments();
      const appointmentList = response.data || response || [];
      const validAppointments = Array.isArray(appointmentList) ? appointmentList : [];
      setAppointments(validAppointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Failed to load appointments");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAppointment = async (appointmentId) => {
    try {
      setActionLoading(appointmentId);
      await approveAppointment(appointmentId);
      toast.success("Appointment approved successfully");
      setAppointments((prev) =>
        prev.map((apt) =>
          apt._id === appointmentId
            ? { ...apt, approvalstatus: "APPROVED", paymentStatus: "unpaid", consultationStatus: "locked" }
            : apt
        )
      );
    } catch (error) {
      toast.error(error.message || "Failed to approve appointment");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectClick = (appointmentId) => {
    setRejectionModal({ open: true, appointmentId, reason: "" });
  };

  const handleConfirmReject = async () => {
    const { appointmentId, reason } = rejectionModal;
    try {
      setActionLoading(appointmentId);
      await rejectAppointment(appointmentId, reason);
      toast.success("Appointment rejected successfully");
      setAppointments((prev) =>
        prev.map((apt) =>
          apt._id === appointmentId ? { ...apt, approvalstatus: "REJECTED" } : apt
        )
      );
      setRejectionModal({ open: false, appointmentId: null, reason: "" });
    } catch (error) {
      toast.error(error.message || "Failed to reject appointment");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (filter === "all") return true;
    return apt.approvalstatus?.toUpperCase() === filter.toUpperCase();
  });

  const countByStatus = (status) =>
    appointments.filter((apt) => apt.approvalstatus?.toUpperCase() === status.toUpperCase()).length;

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric",
      });
    } catch { return dateString; }
  };

  const formatTime = (timeString) => timeString || "—";

  // Generate a short patient display ID from mongo _id
  const shortId = (apt) => {
    if (apt.patientId?.shortId) return `#${apt.patientId.shortId}`;
    if (apt._id) return `#${apt._id.slice(-4).toUpperCase()}`;
    return "#—";
  };

  const patientName = (apt) =>
    apt.patientId?.fullName || apt.patientName || null;

  return (
    <DoctorLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        .da-root { font-family: 'Sora', sans-serif; }
        .da-mono { font-family: 'JetBrains Mono', monospace; }

        .da-tab {
          padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: 600;
          cursor: pointer; border: 1.5px solid #e2e8f0; background: #fff;
          color: #64748b; transition: all 0.15s; white-space: nowrap;
        }
        .da-tab:hover { border-color: #cbd5e1; color: #1e3a5f; }
        .da-tab.active { background: #0f3460; color: #fff; border-color: #0f3460; }

        .da-table-header {
          display: grid;
          grid-template-columns: 180px 160px 1fr 200px 220px;
          gap: 12px; padding: 10px 20px;
          font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
          color: #94a3b8; text-transform: uppercase;
          border-bottom: 1px solid #e8edf4;
        }
        .da-row {
          display: grid;
          grid-template-columns: 180px 160px 1fr 200px 220px;
          gap: 12px; padding: 16px 20px;
          align-items: center;
          border-bottom: 1px solid #f1f5f9;
          transition: background 0.12s;
        }
        .da-row:last-child { border-bottom: none; }
        .da-row:hover { background: #f8fafc; }
        .da-row.locked { opacity: 0.55; }

        .da-avatar {
          width: 36px; height: 36px; border-radius: 10px;
          background: #dbeafe; display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .da-avatar.locked-avatar { background: #fee2e2; }

        .da-status-badge {
          display: inline-flex; align-items: center;
          padding: 3px 10px; border-radius: 20px;
          font-size: 11px; font-weight: 700; letter-spacing: 0.04em;
        }
        .da-status-APPROVED { background: #dbeafe; color: #1d4ed8; }
        .da-status-PENDING  { background: #fef9c3; color: #b45309; }
        .da-status-REJECTED { background: #fee2e2; color: #dc2626; }
        .da-status-default  { background: #f1f5f9; color: #64748b; }

        .da-paid-badge {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 12px; font-weight: 600; color: #16a34a; margin-top: 4px;
        }
        .da-unpaid-badge {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 12px; font-weight: 600; color: #d97706; margin-top: 4px;
        }

        .da-btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 7px 13px; border-radius: 8px; font-size: 12px; font-weight: 600;
          cursor: pointer; border: none; transition: all 0.15s; white-space: nowrap;
        }
        .da-btn-consult { background: #0f3460; color: #fff; }
        .da-btn-consult:hover { background: #1a4a7a; }
        .da-btn-chat { background: #dbeafe; color: #1d4ed8; }
        .da-btn-chat:hover { background: #bfdbfe; }
        .da-btn-notes { background: #dbeafe; color: #1d4ed8; }
        .da-btn-notes:hover { background: #bfdbfe; }
        .da-btn-manage { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
        .da-btn-manage:hover { background: #e8edf4; }
        .da-btn-approve { background: #dcfce7; color: #15803d; }
        .da-btn-approve:hover { background: #bbf7d0; }
        .da-btn-reject { background: #fee2e2; color: #dc2626; }
        .da-btn-reject:hover { background: #fecaca; }
        .da-btn-locked { background: #f1f5f9; color: #94a3b8; cursor: not-allowed; }
        .da-btn-viewlog { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
        .da-btn-viewlog:hover { background: #e2e8f0; }

        .da-fab {
          position: fixed; bottom: 32px; right: 32px;
          width: 52px; height: 52px; border-radius: 16px;
          background: #0f3460; color: white; border: none;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; box-shadow: 0 8px 24px rgba(15,52,96,0.35);
          font-size: 22px; transition: transform 0.15s, box-shadow 0.15s;
        }
        .da-fab:hover { transform: scale(1.06); box-shadow: 0 12px 32px rgba(15,52,96,0.45); }

        .da-empty {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; padding: 60px 20px; color: #94a3b8;
        }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .da-animate { animation: fadeIn 0.25s ease forwards; }
      `}</style>

      <div className="da-root" style={{ paddingBottom: 80 }}>

        {/* ── Page Header ── */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#0f1e2e", margin: 0 }}>
            Appointment Management
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", marginTop: 6 }}>
            Review and manage patient appointment requests
          </p>
        </div>

        {/* ── Filter Tabs ── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {[
            { label: "All", value: "all", count: appointments.length },
            { label: "Pending", value: "pending", count: countByStatus("pending") },
            { label: "Approved", value: "approved", count: countByStatus("approved") },
            { label: "Rejected", value: "rejected", count: countByStatus("rejected") },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`da-tab${filter === tab.value ? " active" : ""}`}
            >
              {tab.label}
              {tab.value !== "all" && (
                <span style={{
                  marginLeft: 6, fontSize: 11,
                  opacity: filter === tab.value ? 0.8 : 0.6
                }}>({tab.count})</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Table ── */}
        <div style={{
          background: "#fff", borderRadius: 14,
          border: "1px solid #e8edf4",
          boxShadow: "0 2px 12px rgba(10,30,60,0.06)",
          overflow: "hidden"
        }}>
          {/* Table Header */}
          <div className="da-table-header">
            <span>Patient ID</span>
            <span>Date &amp; Time</span>
            <span>Reason</span>
            <span>Status &amp; Payment</span>
            <span style={{ textAlign: "right" }}>Actions</span>
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ padding: "40px 20px" }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{
                  height: 64, borderRadius: 8, background: "#f1f5f9",
                  marginBottom: 8, animation: "pulse 1.5s infinite"
                }} />
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && filteredAppointments.length === 0 && (
            <div className="da-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
                <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <p style={{ marginTop: 14, fontWeight: 600, color: "#64748b", fontSize: 15 }}>
                No Appointments Found
              </p>
              <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>
                {filter === "all" ? "No appointments yet." : `No ${filter} appointments.`}
              </p>
            </div>
          )}

          {/* Rows */}
          {!loading && filteredAppointments.map((apt, idx) => {
            const status = apt.approvalstatus?.toUpperCase() || "PENDING";
            const consultationActive = apt.paymentStatus === "paid" && apt.consultationStatus === "active";
            const isLocked = status === "APPROVED" && !consultationActive && apt.consultationStatus === "locked";
            const isPaid = apt.paymentStatus === "paid";

            return (
              <div
                key={apt._id}
                className={`da-row da-animate${isLocked ? " locked" : ""}`}
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                {/* Patient ID */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div className={`da-avatar${isLocked ? " locked-avatar" : ""}`}>
                    {isLocked ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0110 0v4"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="da-mono" style={{ fontWeight: 600, fontSize: 13, color: "#0f1e2e" }}>
                      {shortId(apt)}
                    </p>
                    {patientName(apt) && (
                      <p style={{ fontSize: 11, color: "#64748b", marginTop: 1 }}>{patientName(apt)}</p>
                    )}
                    {isLocked && (
                      <p style={{ fontSize: 10, color: "#dc2626", marginTop: 1, fontWeight: 600 }}>
                        Session expired or restricted
                      </p>
                    )}
                  </div>
                </div>

                {/* Date & Time */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#1e293b" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span style={{ fontWeight: 500 }}>{formatDate(apt.appointmentDate)}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#64748b", marginTop: 4 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <span>{formatTime(apt.appointmentTime)}</span>
                  </div>
                </div>

                {/* Reason */}
                <div style={{ fontSize: 13, color: "#334155", fontWeight: 500 }}>
                  {apt.reason || <span style={{ color: "#94a3b8", fontStyle: "italic" }}>No reason provided</span>}
                </div>

                {/* Status & Payment */}
                <div>
                  <span className={`da-status-badge da-status-${status} da-status-default`}
                    style={
                      status === "APPROVED" ? { background: "#dbeafe", color: "#1d4ed8" } :
                      status === "PENDING"  ? { background: "#fef9c3", color: "#b45309" } :
                      status === "REJECTED" ? { background: "#fee2e2", color: "#dc2626" } :
                      { background: "#f1f5f9", color: "#64748b" }
                    }
                  >
                    {status}
                  </span>
                  {isPaid ? (
                    <div className="da-paid-badge">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                      Paid
                    </div>
                  ) : apt.paymentStatus ? (
                    <div className="da-unpaid-badge">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      Unpaid
                    </div>
                  ) : null}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
                  {status === "PENDING" ? (
                    <>
                      <button
                        className="da-btn da-btn-approve"
                        onClick={() => handleApproveAppointment(apt._id)}
                        disabled={actionLoading === apt._id}
                      >
                        {actionLoading === apt._id ? (
                          <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                          </svg>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                        Approve
                      </button>
                      <button
                        className="da-btn da-btn-reject"
                        onClick={() => handleRejectClick(apt._id)}
                        disabled={actionLoading === apt._id}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                        Reject
                      </button>
                    </>

                  ) : status === "APPROVED" && consultationActive ? (
                    <>
                      <button className="da-btn da-btn-consult" onClick={() => navigate(`/consultation/${apt._id}`)}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                        </svg>
                        Consult
                      </button>
                      <button className="da-btn da-btn-chat" onClick={() => navigate(`/doctor/chat/${apt._id}`)}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                        </svg>
                        Chat
                      </button>
                      <button className="da-btn da-btn-notes" onClick={() => navigate(`/doctor/clinical-notes/${apt._id}`)}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                        </svg>
                        Notes
                      </button>
                    </>

                  ) : status === "APPROVED" && isLocked ? (
                    <button className="da-btn da-btn-viewlog" onClick={() => navigate(`/doctor/appointment-log/${apt._id}`)}>
                      VIEW LOG
                    </button>

                  ) : status === "APPROVED" ? (
                    <button className="da-btn da-btn-manage" onClick={() => navigate(`/doctor/appointment/${apt._id}`)}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
                      </svg>
                      Manage Request
                    </button>

                  ) : status === "REJECTED" ? (
                    <span style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>No actions</span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* FAB */}
        <button className="da-fab" title="New Appointment" onClick={() => navigate("/doctor/new-appointment")}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>

      {/* ── Rejection Modal ── */}
      {rejectionModal.open && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 50, padding: 16
        }}>
          <div style={{
            background: "#fff", borderRadius: 16,
            boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
            maxWidth: 440, width: "100%", overflow: "hidden",
            fontFamily: "'Sora', sans-serif"
          }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9" }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f1e2e", margin: 0 }}>
                Reject Appointment
              </h3>
              <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                Provide an optional reason for the patient.
              </p>
            </div>
            <div style={{ padding: "20px 24px" }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Rejection Reason (Optional)
              </label>
              <textarea
                value={rejectionModal.reason}
                onChange={(e) => setRejectionModal({ ...rejectionModal, reason: e.target.value })}
                placeholder="e.g., Already booked at this time, Cannot accommodate this case, etc."
                style={{
                  width: "100%", marginTop: 8, padding: "10px 12px",
                  border: "1.5px solid #e2e8f0", borderRadius: 10,
                  fontSize: 13, color: "#0f1e2e", resize: "none",
                  outline: "none", fontFamily: "'Sora', sans-serif",
                  boxSizing: "border-box"
                }}
                rows={4}
                onFocus={(e) => e.target.style.borderColor = "#0f3460"}
                onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
              />
            </div>
            <div style={{
              padding: "16px 24px", background: "#f8fafc",
              borderTop: "1px solid #f1f5f9", display: "flex", gap: 10
            }}>
              <button
                onClick={() => setRejectionModal({ open: false, appointmentId: null, reason: "" })}
                style={{
                  flex: 1, padding: "9px 0", borderRadius: 10, border: "1.5px solid #e2e8f0",
                  background: "#fff", color: "#475569", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", fontFamily: "'Sora', sans-serif"
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={actionLoading === rejectionModal.appointmentId}
                style={{
                  flex: 1, padding: "9px 0", borderRadius: 10, border: "none",
                  background: "#dc2626", color: "#fff", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", fontFamily: "'Sora', sans-serif",
                  opacity: actionLoading === rejectionModal.appointmentId ? 0.6 : 1
                }}
              >
                {actionLoading === rejectionModal.appointmentId ? "Processing..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DoctorLayout>
  );
};

export default DoctorAppointments;