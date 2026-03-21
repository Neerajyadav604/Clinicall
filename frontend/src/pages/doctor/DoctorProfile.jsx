import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import DoctorLayout from "../../components/DoctorLayout";
import { getDoctorProfile } from "../../services/doctorApi";
import { setUser } from "../../slices/ProfileSlice";
import { toast } from "react-toastify";

const DoctorProfile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchDoctorProfile = async () => {
      try {
        setLoading(true);
        const response = await getDoctorProfile();
        const doctorData = response.data || response.user || response;
        setProfile(doctorData);
        dispatch(setUser(doctorData));
      } catch (error) {
        console.error("Error fetching doctor profile:", error);
        toast.error("Failed to load doctor profile");
        try {
          const userData = localStorage.getItem("user");
          if (userData) {
            const parsedUser = JSON.parse(userData);
            setProfile(parsedUser);
            dispatch(setUser(parsedUser));
          }
        } catch (e) {
          setProfile(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorProfile();

    const handleFocus = () => fetchDoctorProfile();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [dispatch]);

  if (loading) {
    return (
      <DoctorLayout>
        <div className="animate-pulse space-y-4">
          <div className="bg-gray-200 h-40 rounded-2xl"></div>
          <div className="bg-gray-200 h-64 rounded-2xl"></div>
        </div>
      </DoctorLayout>
    );
  }

  if (!profile) {
    return (
      <DoctorLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-800">
          <p>Unable to load profile information. Please try again later.</p>
        </div>
      </DoctorLayout>
    );
  }

  const initials = (profile?.fullName || "DR")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isApproved = profile?.verificationStatus === "APPROVED";

  return (
    <DoctorLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap');
        .dp-root { font-family: 'DM Sans', sans-serif; }
        .dp-name { font-family: 'Playfair Display', serif; }
        .dp-card {
          background: #ffffff;
          border: 1px solid #e8edf2;
          border-radius: 16px;
          box-shadow: 0 2px 12px rgba(10,40,80,0.06);
        }
        .dp-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: #eaf3ff; color: #1a56a4;
          font-size: 11px; font-weight: 600; letter-spacing: 0.04em;
          padding: 4px 10px; border-radius: 20px; border: 1px solid #c3d9f7;
        }
        .dp-label { font-size: 11px; font-weight: 600; letter-spacing: 0.08em; color: #8a99ab; text-transform: uppercase; }
        .dp-value { font-size: 14px; font-weight: 500; color: #1a2332; margin-top: 3px; }
        .dp-section-title { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; color: #8a99ab; text-transform: uppercase; margin-bottom: 14px; }
        .dp-status-approved {
          background: #f0faf4; border: 1px solid #b6e5c8; border-radius: 12px; padding: 14px 16px;
        }
        .dp-status-pending {
          background: #fffbf0; border: 1px solid #f0d99b; border-radius: 12px; padding: 14px 16px;
        }
        .dp-contact-row {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 0; border-bottom: 1px solid #f0f4f8;
        }
        .dp-contact-row:last-child { border-bottom: none; }
        .dp-icon-box {
          width: 36px; height: 36px; border-radius: 10px;
          background: #eaf3ff; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .dp-expertise-tag {
          background: #f0f6ff; color: #1a56a4;
          border: 1px solid #cfe0f7; border-radius: 20px;
          font-size: 12px; font-weight: 500; padding: 5px 12px;
        }
        .dp-stat-box {
          background: #f7faff; border: 1px solid #dce8f7; border-radius: 12px;
          padding: 16px 20px; text-align: center; flex: 1;
        }
        .dp-stat-num { font-family: 'Playfair Display', serif; font-size: 26px; color: #0d3880; font-weight: 700; }
        .dp-stat-label { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; color: #8a99ab; text-transform: uppercase; margin-top: 2px; }
        .dp-doc-row {
          display: grid; grid-template-columns: 1fr 120px 140px 80px;
          align-items: center; gap: 12px;
          padding: 12px 16px; border-bottom: 1px solid #f0f4f8;
          font-size: 13px;
        }
        .dp-doc-row:last-child { border-bottom: none; }
        .dp-doc-header {
          display: grid; grid-template-columns: 1fr 120px 140px 80px;
          gap: 12px; padding: 8px 16px;
          background: #f7faff; border-radius: 8px; margin-bottom: 4px;
        }
        .dp-action-btn {
          width: 30px; height: 30px; border-radius: 8px; border: 1px solid #dce8f7;
          background: #fff; display: inline-flex; align-items: center; justify-content: center;
          cursor: pointer; transition: background 0.15s;
        }
        .dp-action-btn:hover { background: #eaf3ff; }
        .dp-header-hero {
          background: linear-gradient(135deg, #0a2a5e 0%, #1a56a4 60%, #2271d1 100%);
          border-radius: 16px; padding: 28px 32px; color: white; position: relative; overflow: hidden;
        }
        .dp-header-hero::before {
          content: ''; position: absolute; top: -40px; right: -40px;
          width: 200px; height: 200px; border-radius: 50%;
          background: rgba(255,255,255,0.04);
        }
        .dp-header-hero::after {
          content: ''; position: absolute; bottom: -60px; right: 100px;
          width: 150px; height: 150px; border-radius: 50%;
          background: rgba(255,255,255,0.03);
        }
        .dp-edit-btn {
          display: inline-flex; align-items: center; gap-6px; gap: 6px;
          border: 1.5px solid rgba(255,255,255,0.4); color: white;
          background: rgba(255,255,255,0.1); backdrop-filter: blur(4px);
          border-radius: 10px; padding: 8px 18px; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: background 0.2s;
        }
        .dp-edit-btn:hover { background: rgba(255,255,255,0.2); }
        .dp-share-btn {
          display: inline-flex; align-items: center; gap: 6px;
          background: #ffffff; color: #0d3880;
          border-radius: 10px; padding: 8px 18px; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: opacity 0.2s; border: none;
        }
        .dp-share-btn:hover { opacity: 0.9; }
        .dp-license-box {
          background: #eaf3ff; border: 1px solid #c3d9f7;
          border-radius: 8px; padding: 8px 14px;
          font-size: 13px; font-weight: 600; color: #1a56a4; letter-spacing: 0.04em;
          display: inline-block;
        }
        .dp-info-banner {
          background: #eaf3ff; border: 1px solid #c3d9f7; border-radius: 10px;
          padding: 12px 16px; display: flex; gap: 10px; align-items: flex-start;
          font-size: 12px; color: #1a56a4; margin-top: 12px;
        }
      `}</style>

      <div className="dp-root space-y-5">

        {/* ── Hero Header ── */}
        <div className="dp-header-hero">
          <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
            {/* Avatar */}
            <div style={{
              width: 80, height: 80, borderRadius: 14,
              border: "3px solid rgba(255,255,255,0.3)",
              overflow: "hidden", flexShrink: 0, position: "relative",
              background: "#1a56a4", display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              {profile?.image ? (
                <img src={`${profile.image}?t=${Date.now()}`} alt="Profile"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: 28, fontWeight: 700, color: "white" }}>{initials}</span>
              )}
              {isApproved && (
                <div style={{
                  position: "absolute", bottom: 4, right: 4,
                  background: "#22c55e", borderRadius: "50%",
                  width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center",
                  border: "2px solid white"
                }}>
                  <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </div>

            {/* Name & Info */}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h1 className="dp-name" style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>
                  {profile?.fullName || "Doctor"}
                </h1>
                <span className="dp-badge" style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.3)" }}>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  VERIFIED DOCTOR
                </span>
              </div>
              <p style={{ margin: "4px 0 10px", fontSize: 15, opacity: 0.85 }}>
                {profile?.specialization || "Medical Professional"}
              </p>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap", fontSize: 13, opacity: 0.8 }}>
                {profile?.hospitalName && (
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    {profile.hospitalName}{profile?.address ? `, ${profile.address.split(",").slice(-1)[0].trim()}` : ""}
                  </span>
                )}
                {profile?.experienceYears && (
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {profile.experienceYears} Years Experience
                  </span>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginLeft: "auto" }}>
              <button className="dp-edit-btn" onClick={() => navigate("/doctor/edit-profile")}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit Profile
              </button>
              <button className="dp-share-btn">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                Share Profile
              </button>
            </div>
          </div>
        </div>

        {/* ── Main Two-Column Layout ── */}
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20, alignItems: "start" }}>

          {/* LEFT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Account Status */}
            <div className="dp-card" style={{ padding: 20 }}>
              <p className="dp-section-title">Account Status</p>
              <div className={isApproved ? "dp-status-approved" : "dp-status-pending"}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: isApproved ? "#22c55e" : "#f59e0b",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    {isApproved ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                    )}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: isApproved ? "#166534" : "#92400e" }}>
                      {isApproved ? "Approved" : (profile?.verificationStatus || "Pending")}
                    </p>
                    <p style={{ fontSize: 11, color: isApproved ? "#166534" : "#92400e", marginTop: 1, opacity: 0.8 }}>
                      {isApproved
                        ? `Profile verified${profile?.verifiedAt ? ` on ${new Date(profile.verifiedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : ""}`
                        : "Pending admin verification"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="dp-card" style={{ padding: 20 }}>
              <p className="dp-section-title">Contact Information</p>
              <div className="dp-contact-row">
                <div className="dp-icon-box">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1a56a4" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <div>
                  <p className="dp-label">Primary Email</p>
                  <p className="dp-value" style={{ fontSize: 13 }}>{profile?.email || "Not provided"}</p>
                </div>
              </div>
              <div className="dp-contact-row">
                <div className="dp-icon-box">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1a56a4" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8a19.79 19.79 0 01-3.07-8.64A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z"/>
                  </svg>
                </div>
                <div>
                  <p className="dp-label">Phone Number</p>
                  <p className="dp-value" style={{ fontSize: 13 }}>{profile?.contact || "Not provided"}</p>
                </div>
              </div>
            </div>

            {/* Professional Identity */}
            <div className="dp-card" style={{ padding: 20 }}>
              <p className="dp-section-title">Professional Identity</p>
              <div style={{ marginBottom: 16 }}>
                <p className="dp-label">Medical License Number</p>
                <div style={{ marginTop: 6 }}>
                  <span className="dp-license-box">{profile?.licenseNumber || "Not provided"}</span>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <p className="dp-label">Qualification</p>
                  <p className="dp-value">{profile?.qualification || "—"}</p>
                </div>
                <div>
                  <p className="dp-label">Experience</p>
                  <p className="dp-value">{profile?.experienceYears ? `${profile.experienceYears} Years` : "—"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Primary Institution */}
            <div className="dp-card" style={{ padding: 24 }}>
              <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
                {/* Hospital image placeholder */}
                <div style={{
                  width: 180, height: 120, borderRadius: 10, flexShrink: 0, overflow: "hidden",
                  background: "linear-gradient(135deg, #dce8f7 0%, #eaf3ff 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1a56a4" strokeWidth="1.5" opacity="0.4">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <p className="dp-label">Primary Institution</p>
                  <h3 className="dp-name" style={{ fontSize: 20, color: "#0d3880", margin: "4px 0 8px" }}>
                    {profile?.hospitalName || "Not specified"}
                  </h3>
                  {profile?.address && (
                    <p style={{ fontSize: 13, color: "#4a6080", lineHeight: 1.6, marginBottom: 12 }}>
                      {profile.address}
                    </p>
                  )}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span style={{
                      fontSize: 12, fontWeight: 500, padding: "5px 12px", borderRadius: 20,
                      background: "#f0f6ff", color: "#1a56a4", border: "1px solid #cfe0f7"
                    }}>In-Person Consultation</span>
                    <span style={{
                      fontSize: 12, fontWeight: 500, padding: "5px 12px", borderRadius: 20,
                      background: "#f0f6ff", color: "#1a56a4", border: "1px solid #cfe0f7"
                    }}>Tele-Medicine Available</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Documents */}
            <div className="dp-card" style={{ padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <p className="dp-section-title" style={{ margin: 0 }}>Verification Documents</p>
                <button style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  fontSize: 12, fontWeight: 600, color: "#1a56a4",
                  background: "none", border: "none", cursor: "pointer", padding: 0
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  Upload New
                </button>
              </div>

              {/* Table header */}
              <div className="dp-doc-header">
                <span className="dp-label" style={{ margin: 0 }}>Document Name</span>
                <span className="dp-label" style={{ margin: 0 }}>Category</span>
                <span className="dp-label" style={{ margin: 0 }}>Upload Date</span>
                <span className="dp-label" style={{ margin: 0 }}>Action</span>
              </div>

              {/* Document rows */}
              {profile?.documents && profile.documents.length > 0 ? (
                profile.documents.map((doc, index) => (
                  <div key={index} className="dp-doc-row">
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, background: "#fff0f0",
                        border: "1px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                        </svg>
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: 13, color: "#1a2332" }}>Document {index + 1}</p>
                        <p style={{ fontSize: 11, color: "#8a99ab", marginTop: 1 }}>
                          {typeof doc === "string" ? doc.split("/").pop() : `document_${index + 1}.pdf`}
                        </p>
                      </div>
                    </div>
                    <div>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                        background: "#f0f6ff", color: "#1a56a4", border: "1px solid #cfe0f7"
                      }}>Legal/ID</span>
                    </div>
                    <span style={{ fontSize: 13, color: "#4a6080" }}>
                      {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <a href={doc} target="_blank" rel="noopener noreferrer" className="dp-action-btn" title="View">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1a56a4" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                      </a>
                      <a href={doc} download className="dp-action-btn" title="Download">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1a56a4" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: "20px 0", textAlign: "center", color: "#8a99ab", fontSize: 13 }}>
                  No documents uploaded yet.
                </div>
              )}

              <div className="dp-info-banner">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1a56a4" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>All documents are stored in a HIPAA-compliant encrypted vault. Only authorized clinic administrators can access sensitive credentialing information.</span>
              </div>
            </div>

            {/* Bottom Row: Expertise + Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

              {/* Expertise Focus */}
              <div className="dp-card" style={{ padding: 20 }}>
                <p className="dp-section-title">Expertise Focus</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {profile?.specialization && (
                    <span className="dp-expertise-tag">{profile.specialization}</span>
                  )}
                  {profile?.expertise && Array.isArray(profile.expertise)
                    ? profile.expertise.map((item, i) => (
                        <span key={i} className="dp-expertise-tag">{item}</span>
                      ))
                    : !profile?.specialization && (
                        <p style={{ fontSize: 13, color: "#8a99ab" }}>No expertise listed.</p>
                      )
                  }
                </div>
              </div>

              {/* Patient Stats */}
              <div className="dp-card" style={{ padding: 20 }}>
                <p className="dp-section-title">Patient Stats</p>
                <div style={{ display: "flex", gap: 12 }}>
                  <div className="dp-stat-box">
                    <p className="dp-stat-num">{profile?.totalConsultations ? `${Math.round(profile.totalConsultations / 1000)}k+` : "—"}</p>
                    <p className="dp-stat-label">Consultations</p>
                  </div>
                  <div className="dp-stat-box">
                    <p className="dp-stat-num">{profile?.rating || "—"}</p>
                    <p className="dp-stat-label">Patient Rating</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "12px 0 4px", fontSize: 11, color: "#b0bec8", letterSpacing: "0.04em" }}>
          © 2024 Clinical Clarity Systems • Secure Physician Dashboard • Profile {profile?.licenseNumber || ""}
        </div>
      </div>
    </DoctorLayout>
  );
};

export default DoctorProfile;
