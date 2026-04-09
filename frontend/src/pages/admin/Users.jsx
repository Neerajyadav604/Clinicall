import React, { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout.jsx";
import { toast } from "react-toastify";
import { getUsers } from "../../services/adminApi";

const ITEMS_PER_PAGE = 5;

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUsers("user");
      setUsers(data.data || []);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err.message || "Failed to load users");
      toast.error(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    if (!role) return null;
    const r = role.toLowerCase();
    const styles = {
      user:           { bg: "#e8f0fb", color: "#3b6fd4", border: "#c5d8f5" },
      doctor:         { bg: "#e6f7ee", color: "#1e8a4a", border: "#b6e5ca" },
      admin:          { bg: "#f0ebfb", color: "#7c3aed", border: "#d4c5f5" },
      hospital_admin: { bg: "#fdf0fb", color: "#a21caf", border: "#e9c5f5" },
    };
    const s = styles[r] || { bg: "#f1f5f9", color: "#475569", border: "#e2e8f0" };
    return (
      <span style={{
        background: s.bg, color: s.color,
        border: `1px solid ${s.border}`,
        borderRadius: 20, padding: "3px 12px",
        fontSize: 11, fontWeight: 700,
        letterSpacing: "0.06em", textTransform: "uppercase",
        display: "inline-block",
      }}>
        {role.replace("_", " ")}
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

  const filteredUsers = users.filter((u) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "pending") return u.status === "pending" || !u.isVerified;
    if (activeFilter === "flagged") return u.flagged === true;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const paginatedUsers = filteredUsers.slice(
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
          grid-template-columns: 220px 1fr 160px 160px 140px 80px;
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
          grid-template-columns: 220px 1fr 160px 160px 140px 80px;
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
        .au-stat-card {
          border-radius: 14px; padding: 22px 24px;
          border: 1px solid #e8edf4; background: #fff;
          display: flex; flex-direction: column; gap: 8px;
          flex: 1;
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

        {/* ── PAGE HEADER ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
          
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button style={{
              padding: "9px 20px", borderRadius: 10, border: "1.5px solid #e2e8f0",
              background: "#fff", color: "#334155", fontSize: 13, fontWeight: 600,
              cursor: "pointer", transition: "border-color 0.15s",
            }}>
              Generate Report
            </button>
            <button style={{
              padding: "9px 20px", borderRadius: 10, border: "none",
              background: "#1e3a6e", color: "#fff", fontSize: 13, fontWeight: 600,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            }}>
              <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
              New User
            </button>
          </div>
        </div>

        {/* ── ERROR ── */}
        {error && (
          <div style={{
            marginBottom: 20, padding: "12px 16px",
            background: "#fef2f2", border: "1px solid #fecaca",
            borderRadius: 10, color: "#dc2626", fontSize: 13,
          }}>
            {error}
          </div>
        )}

        {/* ── USERS SECTION ── */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e3a6e", margin: 0 }}>Users</h2>
              <p style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>Manage system users and their roles.</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {[
                { label: "All Users", value: "all" },
                { label: "Pending",   value: "pending" },
                { label: "Flagged",   value: "flagged" },
              ].map((f) => (
                <button
                  key={f.value}
                  className={`au-filter-btn${activeFilter === f.value ? " active" : ""}`}
                  onClick={() => { setActiveFilter(f.value); setCurrentPage(1); }}
                >
                  {f.label}
                </button>
              ))}
              <button style={{
                padding: "7px 14px", borderRadius: 8, border: "1px solid #e2e8f0",
                background: "#fff", color: "#64748b", fontSize: 13, fontWeight: 500,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
                </svg>
                Filter
              </button>
            </div>
          </div>

          {/* Table */}
          <div style={{ background: "#fff", border: "1px solid #e8edf4", borderRadius: 14, overflow: "hidden" }}>

            {/* Header */}
            <div className="au-table-header">
              <span className="au-th">Full Name</span>
              <span className="au-th">Contact Email</span>
              <span className="au-th">Phone Number</span>
              <span className="au-th">System Role</span>
              <span className="au-th">Renewal Date</span>
              <span className="au-th">Actions</span>
            </div>

            {/* Rows */}
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="au-table-row">
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="au-skeleton" style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0 }} />
                    <div className="au-skeleton" style={{ height: 14, width: 100 }} />
                  </div>
                  <div className="au-skeleton" style={{ height: 13, width: "80%" }} />
                  <div className="au-skeleton" style={{ height: 13, width: 90 }} />
                  <div className="au-skeleton" style={{ height: 22, width: 60, borderRadius: 20 }} />
                  <div className="au-skeleton" style={{ height: 13, width: 70 }} />
                  <div className="au-skeleton" style={{ height: 13, width: 40 }} />
                </div>
              ))
            ) : paginatedUsers.length === 0 ? (
              <div style={{ padding: "48px 20px", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
                No users found.
              </div>
            ) : (
              paginatedUsers.map((user, idx) => (
                <div key={user._id || idx} className="au-table-row">
                  {/* Name + Avatar */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {user.image ? (
                      <img 
                        src={user.image} 
                        alt={user.fullName}
                        style={{
                          width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                          objectFit: "cover",
                          border: "1px solid #e2e8f0",
                        }}
                      />
                    ) : (
                      <div style={{
                        width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                        background: getAvatarColor(user.fullName),
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13, fontWeight: 700,
                        color: getAvatarText(user.fullName),
                      }}>
                        {getInitial(user.fullName)}
                      </div>
                    )}
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
                      {user.fullName || "—"}
                    </span>
                  </div>

                  {/* Email */}
                  <span style={{ fontSize: 13, color: "#475569" }}>{user.email || "—"}</span>

                  {/* Phone */}
                  <span style={{ fontSize: 13, color: "#475569" }}>{user.contact || "—"}</span>

                  {/* Role */}
                  <div>{getRoleBadge(user.role || user.roles?.[0])}</div>

                  {/* Renewal / Joined Date */}
                  <span style={{ fontSize: 13, color: "#475569" }}>
                    {formatDate(user.renewalDate || user.createdAt)}
                  </span>

                  {/* Actions */}
                  <button style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "#94a3b8", padding: 4, borderRadius: 6,
                    transition: "color 0.15s",
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "#334155"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "#94a3b8"}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
                    </svg>
                  </button>
                </div>
              ))
            )}

            {/* Footer / Pagination */}
            {!loading && filteredUsers.length > 0 && (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 20px", borderTop: "1px solid #f1f5f9",
              }}>
                <span style={{ fontSize: 12.5, color: "#64748b" }}>
                  Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to{" "}
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} of{" "}
                  {filteredUsers.length} users
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button
                    className="au-page-btn"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M15 18l-6-6 6-6"/>
                    </svg>
                  </button>
                  <div className="au-page-num">{currentPage}</div>
                  <button
                    className="au-page-btn"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── STAT CARDS ── */}
        <div style={{ display: "flex", gap: 16, marginTop: 24, flexWrap: "wrap" }}>

          {/* System Uptime */}
          <div style={{
            borderRadius: 14, padding: "22px 24px",
            background: "linear-gradient(135deg, #1e3a6e 0%, #2563b0 100%)",
            flex: 1, minWidth: 220, position: "relative", overflow: "hidden",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.8">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                background: "rgba(255,255,255,0.18)", color: "#fff", letterSpacing: "0.04em",
              }}>+12% vs last month</span>
            </div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", margin: "0 0 4px", fontWeight: 500 }}>
              System Uptime
            </p>
            <p style={{ fontSize: 28, fontWeight: 800, color: "#fff", margin: 0 }}>99.98%</p>
          </div>

          {/* New Registrations */}
          <div className="au-stat-card" style={{ minWidth: 200 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.8">
                <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
              </svg>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                background: "#f1f5f9", color: "#475569", letterSpacing: "0.04em",
              }}>Real-time</span>
            </div>
            <p style={{ fontSize: 12.5, color: "#64748b", margin: "10px 0 4px", fontWeight: 500 }}>New Registrations</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", margin: 0 }}>42</p>
          </div>

          {/* Active Hospitals */}
          <div className="au-stat-card" style={{ minWidth: 200 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.8">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                background: "#f1f5f9", color: "#475569", letterSpacing: "0.04em",
              }}>Global</span>
            </div>
            <p style={{ fontSize: 12.5, color: "#64748b", margin: "10px 0 4px", fontWeight: 500 }}>Active Hospitals</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", margin: 0 }}>118</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Users;