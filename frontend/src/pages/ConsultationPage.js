import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import DoctorConsultationPanel from "../components/consultation/DoctorConsultationPanel";
import PatientLiveView from "../components/consultation/PatientLiveView";

const ConsultationPage = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appointment, setAppointment] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const baseURL = process.env.REACT_APP_BASE_URL || "http://localhost:4000";
  const token = localStorage.getItem("token");

  const axiosInstance = useMemo(() => axios.create({
    baseURL,
    headers: { Authorization: `Bearer ${token}` },
  }), [baseURL, token]);

  // Track screen size
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarCollapsed(true);
      else setSidebarCollapsed(false);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Timer tick
  useEffect(() => {
    if (!activeSession) return;
    const start = activeSession.startedAt ? new Date(activeSession.startedAt) : new Date();
    const tick = () => setElapsedSeconds(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeSession]);

  const formatDuration = (secs) => ({
    h: Math.floor(secs / 3600),
    m: Math.floor((secs % 3600) / 60),
    s: secs % 60,
  });

  useEffect(() => {
    const fetchAppointmentAndRole = async () => {
      try {
        setLoading(true);
        const userDataStr = localStorage.getItem("user");
        const userData = userDataStr ? JSON.parse(userDataStr) : null;
        if (!userData?._id) { setError("User information not found"); return; }

        const roles = userData.roles
          ? userData.roles.map((r) => r.toLowerCase())
          : [(userData.role || "").toLowerCase()];
        const isDoctor = roles.includes("doctor");

        if (isDoctor) {
          try {
            const res = await axiosInstance.get(`/appointments/doctor`);
            const list = res.data.data || res.data;
            const apt = Array.isArray(list) ? list.find((a) => a._id === appointmentId) : null;
            if (apt) { setAppointment(apt); setUserRole("doctor"); }
            else setError("Appointment not found in your doctor appointments");
          } catch { setError("Failed to load doctor appointments"); }
        } else {
          try {
            const res = await axiosInstance.get(`/user/appointments`);
            const list = res.data.data || res.data;
            const apt = Array.isArray(list) ? list.find((a) => a._id === appointmentId) : null;
            if (apt) { setAppointment(apt); setUserRole("patient"); }
            else setError("Appointment not found in your appointments");
          } catch { setError("Failed to load appointments"); }
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load appointment");
      } finally {
        setLoading(false);
      }
    };
    if (appointmentId && token) fetchAppointmentAndRole();
  }, [appointmentId, token]);

  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const res = await axiosInstance.get(`/consultation/active/${appointmentId}`);
        if (res.data.success && res.data.data) {
          setActiveSession(res.data.data);
          setSessionId(res.data.data._id);
        } else {
          setActiveSession(null);
          setSessionId(null);
        }
      } catch { setActiveSession(null); setSessionId(null); }
    };
    if (appointmentId && userRole) {
      checkActiveSession();
      const interval = setInterval(checkActiveSession, 5000);
      return () => clearInterval(interval);
    }
  }, [appointmentId, userRole]);

  const userData = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
  }, []);

  const doctorName = appointment?.doctorId?.fullName || userData?.fullName || "Consulting Physician";
  const doctorImage = appointment?.doctorId?.image || userData?.image || null;
  const doctorTitle = appointment?.doctorId?.specialization || "Consulting Physician";
  const patientName = appointment?.patientId?.fullName || appointment?.patientName || "Patient";
  const lastVisit = appointment?.patientId?.lastVisit || null;
  const riskLevel = appointment?.patientId?.riskLevel || appointment?.riskLevel || null;
  const { h, m, s } = formatDuration(elapsedSeconds);

  const initials = (name) =>
    (name || "").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const riskColor = (level) => {
    const l = (level || "").toLowerCase();
    if (l === "high") return { bg: "#fee2e2", color: "#dc2626" };
    if (l === "medium") return { bg: "#fef9c3", color: "#b45309" };
    return { bg: "#dcfce7", color: "#166534" };
  };

  // ── Loading ──
  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#f4f7fb", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Fraunces:wght@700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <div style={{ textAlign: "center", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ width: 44, height: 44, border: "3px solid #dbeafe", borderTopColor: "#1d4ed8", borderRadius: "50%", margin: "0 auto 16px", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: "#64748b", fontSize: 14 }}>Loading consultation...</p>
      </div>
    </div>
  );

  // ── Error ──
  if (error) return (
    <div style={{ minHeight: "100vh", background: "#f4f7fb", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", border: "1px solid #fecaca", borderRadius: 12, padding: "32px 40px", textAlign: "center", maxWidth: 400, width: "100%" }}>
        <p style={{ color: "#dc2626", marginBottom: 16, fontFamily: "'DM Sans', sans-serif" }}>{error}</p>
        <button onClick={() => navigate(-1)} style={{ padding: "8px 20px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Go Back</button>
      </div>
    </div>
  );

  if (!userRole) return (
    <div style={{ minHeight: "100vh", background: "#f4f7fb", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ textAlign: "center", fontFamily: "'DM Sans', sans-serif" }}>
        <p style={{ color: "#64748b", marginBottom: 16 }}>Unable to determine your role</p>
        <button onClick={() => navigate(-1)} style={{ padding: "8px 20px", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>Go Back</button>
      </div>
    </div>
  );

  const showLeftPanel = userRole === "doctor";
  const leftExpanded = showLeftPanel && !sidebarCollapsed;

  return (
    <div style={{ minHeight: "100vh", background: "#f4f7fb", fontFamily: "'DM Sans', sans-serif", display: "flex", flexDirection: "column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:wght@700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .cp-page { display: flex; flex-direction: column; min-height: 100vh; }

        /* ── Page header bar ── */
        .cp-topbar {
          background: #fff;
          border-bottom: 1px solid #e8edf4;
          padding: clamp(12px, 2vw, 18px) clamp(12px, 3vw, 32px);
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .cp-back-btn {
          display: inline-flex; align-items: center; gap: 6px;
          background: none; border: none; cursor: pointer;
          color: #475569; font-size: clamp(12px, 1.5vw, 13px);
          font-weight: 600; padding: 0; font-family: 'DM Sans', sans-serif;
          margin-bottom: 10px;
          white-space: nowrap;
        }
        .cp-back-btn:hover { color: #0f3460; }

        .cp-title-row {
          display: flex; align-items: center; flex-wrap: wrap; gap: 8px;
        }
        .cp-title {
          font-family: 'Fraunces', serif;
          font-size: clamp(18px, 3vw, 26px);
          font-weight: 800; color: #0f1e2e; line-height: 1.2;
        }
        .cp-appt-id {
          font-size: clamp(10px, 1.2vw, 12px);
          color: #94a3b8; font-weight: 600;
          letter-spacing: 0.04em; margin-top: 5px;
          word-break: break-all;
        }

        .cp-active-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 10px; border-radius: 20px;
          background: #f0fdf4; border: 1px solid #bbf7d0;
          font-size: clamp(10px, 1.2vw, 12px); font-weight: 600; color: #166534;
          white-space: nowrap;
        }
        .cp-active-dot {
          width: 7px; height: 7px; border-radius: 50%; background: #22c55e; flex-shrink: 0;
          animation: pulse-dot 1.5s ease-in-out infinite;
        }
        .cp-no-session-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 10px; border-radius: 20px;
          background: #fffbeb; border: 1px solid #fde68a;
          font-size: clamp(10px, 1.2vw, 12px); font-weight: 600; color: #92400e;
          white-space: nowrap;
        }

        /* Doctor info top-right */
        .cp-doctor-info {
          display: flex; align-items: center; gap: 10px;
          flex-shrink: 0;
        }
        .cp-doctor-text { text-align: right; }
        .cp-doctor-name {
          font-weight: 700; font-size: clamp(12px, 1.5vw, 14px); color: #0f1e2e;
          white-space: nowrap;
        }
        .cp-doctor-title {
          font-size: clamp(10px, 1.2vw, 12px); color: #64748b; margin-top: 2px;
          white-space: nowrap;
        }
        .cp-doctor-avatar {
          width: clamp(36px, 5vw, 48px);
          height: clamp(36px, 5vw, 48px);
          border-radius: 10px; overflow: hidden; background: #dbeafe;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; border: 2px solid #e8edf4;
        }
        .cp-doctor-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .cp-doctor-avatar span {
          font-weight: 700; font-size: clamp(12px, 1.8vw, 16px); color: #1d4ed8;
        }

        /* Toggle sidebar btn (mobile) */
        .cp-toggle-btn {
          display: none;
          align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: 8px;
          border: 1.5px solid #e2e8f0; background: #f8fafc;
          color: #475569; font-size: 12px; font-weight: 600;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          margin-top: 8px; white-space: nowrap;
        }

        /* ── Body: sidebar + main ── */
        .cp-body {
          display: flex;
          flex: 1;
          gap: 0;
          overflow: hidden;
        }

        /* ── Left sidebar ── */
        .cp-sidebar {
          background: #fff;
          border-right: 1px solid #e8edf4;
          flex-shrink: 0;
          overflow-y: auto;
          transition: width 0.25s ease, min-width 0.25s ease;
        }
        .cp-sidebar.expanded { width: clamp(260px, 28vw, 340px); min-width: 260px; }
        .cp-sidebar.collapsed { width: 0; min-width: 0; overflow: hidden; }
        .cp-sidebar-inner {
          padding: clamp(16px, 2vw, 24px);
          min-width: 260px;
        }

        .cp-label {
          font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
          color: #94a3b8; text-transform: uppercase; margin-bottom: 8px;
          display: block;
        }
        .cp-status-row {
          display: flex; align-items: center; gap: 8px;
          font-size: clamp(15px, 2vw, 20px); font-weight: 700; color: #0f1e2e;
          margin-bottom: 18px;
        }
        .cp-status-dot {
          width: 10px; height: 10px; border-radius: 50%; background: #cbd5e1; flex-shrink: 0;
        }
        .cp-status-dot.active { background: #22c55e; }

        .cp-duration-label {
          font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
          color: #94a3b8; text-transform: uppercase; margin-bottom: 5px;
          display: flex; align-items: center; gap: 5px;
        }
        .cp-timer {
          font-family: 'Fraunces', serif;
          font-size: clamp(26px, 4vw, 36px);
          font-weight: 800; color: #0f1e2e;
          display: flex; align-items: baseline; gap: 1px;
          margin-bottom: 18px; flex-wrap: wrap;
        }
        .cp-timer-unit {
          font-size: clamp(11px, 1.5vw, 14px); font-weight: 500; color: #64748b; margin-left: 1px;
        }

        .cp-end-btn {
          width: 100%; padding: clamp(10px, 1.5vw, 13px);
          background: #0f3460; color: #fff;
          border: none; border-radius: 12px;
          font-size: clamp(12px, 1.5vw, 14px); font-weight: 700;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          cursor: pointer; transition: background 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .cp-end-btn:hover { background: #1a4a7a; }

        .cp-divider { height: 1px; background: #f1f5f9; margin: 18px 0; }

        .cp-context-heading {
          display: flex; align-items: center; gap: 6px;
          font-size: 13px; font-weight: 700; color: #0f1e2e; margin-bottom: 12px;
        }
        .cp-context-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: clamp(6px, 1vw, 8px) 0;
          border-bottom: 1px solid #f8fafc;
          font-size: clamp(11px, 1.3vw, 13px);
          gap: 8px;
        }
        .cp-context-row:last-child { border-bottom: none; }
        .cp-context-key { color: #94a3b8; font-weight: 500; flex-shrink: 0; }
        .cp-context-val { color: #0f1e2e; font-weight: 600; text-align: right; word-break: break-word; }
        .cp-risk-badge {
          padding: 2px 10px; border-radius: 20px;
          font-size: 10px; font-weight: 800; letter-spacing: 0.06em;
        }

        /* ── Main content ── */
        .cp-main {
          flex: 1;
          overflow-y: auto;
          padding: clamp(12px, 2vw, 24px);
          min-width: 0;
        }
        .cp-main-card {
          background: #fff;
          border: 1px solid #e8edf4;
          border-radius: 14px;
          box-shadow: 0 2px 12px rgba(10,30,60,0.05);
          overflow: hidden;
          min-height: 400px;
          animation: fadeSlideIn 0.3s ease;
          height: 100%;
        }

        /* ── Footer ── */
        .cp-footer {
          border-top: 1px solid #e8edf4;
          padding: clamp(10px, 1.5vw, 14px) clamp(12px, 3vw, 32px);
          display: flex; align-items: center; justify-content: space-between;
          font-size: clamp(10px, 1.2vw, 12px); color: #94a3b8;
          flex-wrap: wrap; gap: 8px;
          background: #fff;
        }
        .cp-footer-links { display: flex; gap: clamp(10px, 2vw, 20px); flex-wrap: wrap; }
        .cp-footer-link {
          cursor: pointer; font-weight: 600; letter-spacing: 0.06em;
          color: #94a3b8; text-decoration: none;
        }
        .cp-footer-link:hover { color: #475569; }

        /* ── Mobile drawer overlay ── */
        .cp-overlay {
          display: none;
          position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 30;
        }
        .cp-drawer {
          display: none;
          position: fixed; left: 0; top: 0; bottom: 0;
          width: min(320px, 88vw);
          background: #fff; z-index: 31;
          overflow-y: auto;
          box-shadow: 4px 0 24px rgba(0,0,0,0.12);
          transition: transform 0.25s ease;
        }

        /* ── Breakpoints ── */

        /* < 480px (xs) */
        @media (max-width: 479px) {
          .cp-toggle-btn { display: inline-flex; }
          .cp-topbar { flex-direction: column; }
          .cp-doctor-info { align-self: flex-start; }
          .cp-sidebar { display: none; }
          .cp-drawer { display: block; }
          .cp-overlay { display: block; }
          .cp-main { padding: 10px; }
          .cp-footer { flex-direction: column; align-items: flex-start; }
        }

        /* 480px - 767px (sm) */
        @media (min-width: 480px) and (max-width: 767px) {
          .cp-toggle-btn { display: inline-flex; }
          .cp-sidebar { display: none; }
          .cp-drawer { display: block; }
          .cp-overlay { display: block; }
          .cp-main { padding: 14px; }
        }

        /* 768px - 1023px (md) — sidebar collapses to icon strip */
        @media (min-width: 768px) and (max-width: 1023px) {
          .cp-sidebar.expanded { width: clamp(220px, 26vw, 280px); min-width: 220px; }
          .cp-toggle-btn { display: inline-flex; }
          .cp-drawer { display: none !important; }
          .cp-overlay { display: none !important; }
        }

        /* 1024px+ — always show sidebar, no toggle needed for doctor */
        @media (min-width: 1024px) {
          .cp-toggle-btn { display: none; }
          .cp-drawer { display: none !important; }
          .cp-overlay { display: none !important; }
          .cp-sidebar { display: block !important; }
          .cp-sidebar.collapsed { width: clamp(260px, 28vw, 340px); min-width: 260px; }
        }

        /* Very large screens (>1600px) */
        @media (min-width: 1600px) {
          .cp-sidebar.expanded { width: 360px; min-width: 360px; }
          .cp-main { padding: 32px; }
        }
      `}</style>

      <div className="cp-page">

        {/* ── Top Bar (no navbar) ── */}
        <div className="cp-topbar">
          <div style={{ flex: 1, minWidth: 0 }}>
            <button className="cp-back-btn" onClick={() => navigate(-1)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
              Back
            </button>

            <div className="cp-title-row">
              <h1 className="cp-title">Consultation Session</h1>
              {activeSession ? (
                <span className="cp-active-badge">
                  <span className="cp-active-dot" />
                  Active consultation session in progress
                </span>
              ) : userRole === "doctor" ? (
                <span className="cp-no-session-badge">No active session</span>
              ) : null}
            </div>

            <p className="cp-appt-id">
              <span style={{ color: "#64748b" }}>APPOINTMENT ID: </span>
              <span style={{ fontFamily: "monospace", color: "#475569" }}>{appointmentId}</span>
            </p>

            {/* Toggle button for sidebar on small/medium screens */}
            {showLeftPanel && (
              <button className="cp-toggle-btn" onClick={() => setSidebarCollapsed((v) => !v)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                </svg>
                {sidebarCollapsed ? "Show Session Info" : "Hide Session Info"}
              </button>
            )}
          </div>

          {/* Doctor info */}
          <div className="cp-doctor-info">
            <div className="cp-doctor-text">
              <p className="cp-doctor-name">{doctorName}</p>
              <p className="cp-doctor-title">{doctorTitle}</p>
            </div>
            <div className="cp-doctor-avatar">
              {doctorImage
                ? <img src={`${doctorImage}?t=${Date.now()}`} alt={doctorName} />
                : <span>{initials(doctorName)}</span>
              }
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="cp-body">

          {/* Mobile/tablet overlay + drawer */}
          {showLeftPanel && isMobile && !sidebarCollapsed && (
            <>
              <div className="cp-overlay" onClick={() => setSidebarCollapsed(true)} />
              <div className="cp-drawer" style={{ transform: sidebarCollapsed ? "translateX(-100%)" : "translateX(0)" }}>
                <SidebarContent
                  activeSession={activeSession}
                  h={h} m={m} s={s}
                  patientName={patientName}
                  lastVisit={lastVisit}
                  riskLevel={riskLevel}
                  appointment={appointment}
                  riskColor={riskColor}
                  onClose={() => setSidebarCollapsed(true)}
                />
              </div>
            </>
          )}

          {/* Desktop sidebar */}
          {showLeftPanel && (
            <div className={`cp-sidebar ${leftExpanded && !isMobile ? "expanded" : "collapsed"}`}>
              {leftExpanded && !isMobile && (
                <div className="cp-sidebar-inner">
                  <SidebarContent
                    activeSession={activeSession}
                    h={h} m={m} s={s}
                    patientName={patientName}
                    lastVisit={lastVisit}
                    riskLevel={riskLevel}
                    appointment={appointment}
                    riskColor={riskColor}
                  />
                </div>
              )}
            </div>
          )}

          {/* Main content */}
          <div className="cp-main">
            <div className="cp-main-card">
              {userRole === "doctor" ? (
                <DoctorConsultationPanel
                  appointmentId={appointmentId}
                  appointment={appointment}
                  sessionId={sessionId}
                  activeSession={activeSession}
                  onSessionStarted={(session) => {
                    setSessionId(session._id);
                    setActiveSession(session);
                  }}
                />
              ) : (
                <PatientLiveView
                  appointmentId={appointmentId}
                  sessionId={sessionId}
                  activeSession={activeSession}
                />
              )}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <footer className="cp-footer">
          <span>© {new Date().getFullYear()} Clinicall Healthcare Systems. All clinical data is encrypted.</span>
          <div className="cp-footer-links">
            {["SECURITY", "PRIVACY", "SUPPORT"].map((l) => (
              <span key={l} className="cp-footer-link">{l}</span>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
};

/* ── Sidebar content extracted as sub-component ── */
const SidebarContent = ({ activeSession, h, m, s, patientName, lastVisit, riskLevel, appointment, riskColor, onClose }) => {
  const rc = riskColor(riskLevel);
  return (
    <div>
      {onClose && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 4 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}

      <span className="cp-label">Current Status</span>
      <div className="cp-status-row">
        <span className={`cp-status-dot${activeSession ? " active" : ""}`} />
        {activeSession ? "Session Active" : "No Active Session"}
      </div>

      {activeSession && (
        <>
          <div className="cp-duration-label">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            Total Duration
          </div>
          <div className="cp-timer">
            {h}<span className="cp-timer-unit">h</span>{" "}
            {String(m).padStart(2, "0")}<span className="cp-timer-unit">m</span>{" "}
            {String(s).padStart(2, "0")}<span className="cp-timer-unit">s</span>
          </div>
        </>
      )}

      <button className="cp-end-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10"/><rect x="9" y="9" width="6" height="6"/>
        </svg>
        End Session
      </button>

      <div className="cp-divider" />

      <div className="cp-context-heading">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
        Session Context
      </div>

      <div>
        <div className="cp-context-row">
          <span className="cp-context-key">Patient Name</span>
          <span className="cp-context-val">{patientName}</span>
        </div>
        {lastVisit && (
          <div className="cp-context-row">
            <span className="cp-context-key">Last Visit</span>
            <span className="cp-context-val">
              {new Date(lastVisit).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
        )}
        {riskLevel && (
          <div className="cp-context-row">
            <span className="cp-context-key">Risk Level</span>
            <span className="cp-risk-badge" style={{ background: rc.bg, color: rc.color }}>
              {riskLevel.toUpperCase()}
            </span>
          </div>
        )}
        {appointment?.appointmentDate && (
          <div className="cp-context-row">
            <span className="cp-context-key">Appointment</span>
            <span className="cp-context-val">
              {new Date(appointment.appointmentDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultationPage;