import React, { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout.jsx";
import { toast } from "react-toastify";
import { getRejectedDoctors } from "../../services/adminApi";

const ITEMS_PER_PAGE = 5;

const RejectedDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchRejectedDoctors();
  }, []);

  const fetchRejectedDoctors = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRejectedDoctors();
      setDoctors(data.data || []);
    } catch (err) {
      console.error("Error fetching rejected doctors:", err);
      setError(err.message || "Failed to load doctors");
      toast.error(err.message || "Failed to load doctors");
    } finally {
      setLoading(false);
    }
  };

  const getRejectionStatus = (doctor) => {
    const status = doctor.appealPending ? "appeal pending" : "rejected";
    const styles = {
      "appeal pending": { bg: "#fef9c3", color: "#854d0e", border: "#fcd34d" },
      rejected: { bg: "#fef2f2", color: "#991b1b", border: "#fecaca" },
    };
    const s = styles[status] || { bg: "#fef2f2", color: "#991b1b", border: "#fecaca" };
    return (
      <span style={{
        background: s.bg, color: s.color,
        border: `1px solid ${s.border}`,
        borderRadius: 20, padding: "3px 12px",
        fontSize: 11, fontWeight: 700,
        letterSpacing: "0.06em", textTransform: "uppercase",
        display: "inline-block",
      }}>
        {status}
      </span>
    );
  };

  const getInitial = (name) => (name || "?")[0].toUpperCase();

  const avatarColors = [
    "#dbeafe", "#dcfce7", "#fce7f3", "#fef9c3",
    "#e0e7ff", "#f0fdf4", "#fdf4ff", "#f0f9ff",
  ];
  const getAvatarColor = (name) => {
    if (!name) return avatarColors[0];
    const idx = name.charCodeAt(0) % avatarColors.length;
    return avatarColors[idx];
  };
  const getAvatarText = (name) => {
    if (!name) return "#94a3b8";
    const idx = name.charCodeAt(0) % avatarColors.length;
    const darks = ["#1d4ed8","#166534","#9d174d","#854d0e","#4338ca","#14532d","#7e22ce","#0c4a6e"];
    return darks[idx];
  };

  const filteredDoctors = doctors.filter((d) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "appeal") return d.appealPending === true;
    if (activeFilter === "final") return d.appealPending === false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredDoctors.length / ITEMS_PER_PAGE));
  const paginatedDoctors = filteredDoctors.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const formatDate = (val) => {
    if (!val) return "N/A";
    try { return new Date(val).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" }); }
    catch { return "N/A"; }
  };

  return (
    <div fullWidth={true}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .au-root { font-family: 'Inter', system-ui, sans-serif; }
        .au-filter-btn {
          padding: 7px 18px; border-radius: 8px; font-size: 13px; font-weight: 500;
          cursor: pointer; border: 1px solid #e2e8f0; background: #fff; color: #64748b;
          transition: all 0.15s;
        }
        .au-filter-btn:hover { border-color: #cbd5e1; color: #334155; }
        .au-filter-btn.active {
          background: #fff; border-color: #334155; color: #0f172a; font-weight: 600;
        }
        .au-table-row {
          display: grid;
          grid-template-columns: 200px 1fr 160px 120px 140px 1fr 80px;
          align-items: center;
          padding: 18px 20px;
          border-bottom: 1px solid #f1f5f9;
          transition: background 0.12s;
          gap: 12px;
        }
        .au-table-row:last-child { border-bottom: none; }
        .au-table-row:hover { background: #f8fafc; }
        .au-table-header {
          display: grid;
          grid-template-columns: 200px 1fr 160px 120px 140px 1fr 80px;
          padding: 10px 20px;
          gap: 12px;
          background: #f8fafc;
          border-bottom: 1px solid #e8edf4;
          border-top: 1px solid #e8edf4;
        }
        .au-th {
          font-size: 10.5px; font-weight: 700; letter-spacing: 0.08em;
          color: #94a3b8; text-transform: uppercase;
        }
        .au-page-btn {
          width: 32px; height: 32px; border-radius: 8px;
          border: 1px solid #e2e8f0; background: #fff;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; font-size: 13px; font-weight: 600; color: #475569;
          transition: all 0.15s;
        }
        .au-page-btn:hover:not(:disabled) { border-color: #94a3b8; color: #0f172a; }
        .au-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .au-page-num {
          width: 32px; height: 32px; border-radius: 8px;
          background: #1e3a6e; color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700;
        }
        .au-skeleton {
          background: linear-gradient(90deg, #f1f5f9 25%, #e8edf4 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: au-shimmer 1.4s infinite;
          border-radius: 6px;
        }
        @keyframes au-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @media (max-width: 900px) {
          .au-table-row, .au-table-header {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>

      <div className="au-root" style={{ padding: "0 0 40px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 30, fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>
              Rejected Doctors
            </h1>
            <p style={{ fontSize: 13.5, color: "#64748b", marginTop: 6, lineHeight: 1.6, maxWidth: 520 }}>
              Review rejected doctor registration requests and their appeals.<br />
              Manage rejection reasons and resubmission process.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button style={{ padding: "9px 20px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", color: "#334155", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Export List
            </button>
            <button style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: "#1e3a6e", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
              Review Appeal
            </button>
          </div>
        </div>

        {error && (
          <div style={{ marginBottom: 20, padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, color: "#dc2626", fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e3a6e", margin: 0 }}>Rejected Applications</h2>
              <p style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>Review rejected doctor registrations.</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {[
                { label: "All", value: "all" },
                { label: "Appeal Pending", value: "appeal" },
                { label: "Final", value: "final" },
              ].map((f) => (
                <button key={f.value} className={`au-filter-btn${activeFilter === f.value ? " active" : ""}`} onClick={() => { setActiveFilter(f.value); setCurrentPage(1); }}>
                  {f.label}
                </button>
              ))}
              <button style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
                </svg>
                Filter
              </button>
            </div>
          </div>

          <div style={{ background: "#fff", border: "1px solid #e8edf4", borderRadius: 14, overflow: "hidden" }}>
            <div className="au-table-header">
              <span className="au-th">Doctor Name</span>
              <span className="au-th">Email</span>
              <span className="au-th">Specialization</span>
              <span className="au-th">License</span>
              <span className="au-th">Rejection Reason</span>
              <span className="au-th">Rejected Date</span>
              <span className="au-th">Actions</span>
            </div>

            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="au-table-row">
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="au-skeleton" style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0 }} />
                    <div className="au-skeleton" style={{ height: 14, width: 100 }} />
                  </div>
                  <div className="au-skeleton" style={{ height: 13, width: "80%" }} />
                  <div className="au-skeleton" style={{ height: 13, width: 90 }} />
                  <div className="au-skeleton" style={{ height: 13, width: 70 }} />
                  <div className="au-skeleton" style={{ height: 13, width: 150 }} />
                  <div className="au-skeleton" style={{ height: 13, width: 70 }} />
                  <div className="au-skeleton" style={{ height: 13, width: 40 }} />
                </div>
              ))
            ) : paginatedDoctors.length === 0 ? (
              <div style={{ padding: "48px 20px", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>No doctors found.</div>
            ) : (
              paginatedDoctors.map((doctor, idx) => (
                <div key={doctor._id || idx} className="au-table-row">
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, background: getAvatarColor(doctor.fullName), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: getAvatarText(doctor.fullName) }}>
                      {getInitial(doctor.fullName)}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{doctor.fullName || "—"}</span>
                  </div>
                  <span style={{ fontSize: 13, color: "#475569" }}>{doctor.email || "—"}</span>
                  <span style={{ fontSize: 13, color: "#475569" }}>{doctor.specialization || "—"}</span>
                  <span style={{ fontSize: 13, color: "#475569" }}>{doctor.licenseNumber || "—"}</span>
                  <span style={{ fontSize: 13, color: "#475569" }}>{doctor.adminRemarks || "—"}</span>
                  <span style={{ fontSize: 13, color: "#475569" }}>{formatDate(doctor.reviewedAt)}</span>
                  <button style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4, borderRadius: 6 }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "#334155"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "#94a3b8"}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
                    </svg>
                  </button>
                </div>
              ))
            )}

            {!loading && filteredDoctors.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderTop: "1px solid #f1f5f9" }}>
                <span style={{ fontSize: 12.5, color: "#64748b" }}>
                  Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredDoctors.length)} of {filteredDoctors.length} doctors
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button className="au-page-btn" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
                  </button>
                  <div className="au-page-num">{currentPage}</div>
                  <button className="au-page-btn" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RejectedDoctors;