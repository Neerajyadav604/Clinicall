import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { axiosInstance } from "../../services/ApiConnector";
import symptomsData from "../../data/symptoms_list.json";
import {
  setSymptomPredictions,
  setRecommendedDoctors,
  setSelectedSymptoms,
  setMlLoading,
  setMlError,
  setMlServiceDown,
  selectSymptomPredictions,
  selectSelectedSymptoms,
  selectMlLoading,
  selectMlError,
  selectMlServiceDown,
  selectRecommendedDoctors,
} from "../../slices/mlSlice";
import DoctorMatchCard from "./DoctorMatchCard";

const SymptomChecker = () => {
  const dispatch = useDispatch();
  const symptomPredictions = useSelector(selectSymptomPredictions);
  const selectedSymptoms   = useSelector(selectSelectedSymptoms);
  const loading            = useSelector(selectMlLoading);
  const error              = useSelector(selectMlError);
  const mlServiceDown      = useSelector(selectMlServiceDown);
  const recommendedDoctors = useSelector(selectRecommendedDoctors);

  const [searchQuery,   setSearchQuery]   = useState("");
  const [showDropdown,  setShowDropdown]  = useState(false);
  const [showResults,   setShowResults]   = useState(false);
  const [findingDoctors,setFindingDoctors]= useState(false);
  const dropdownRef = useRef(null);

  const ALL_SYMPTOMS = symptomsData.symptoms || [];
  const filteredSymptoms = ALL_SYMPTOMS.filter(
    (s) => s.toLowerCase().includes(searchQuery.toLowerCase()) && !selectedSymptoms.includes(s)
  ).slice(0, 8);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddSymptom = (symptom) => {
    if (!selectedSymptoms.includes(symptom))
      dispatch(setSelectedSymptoms([...selectedSymptoms, symptom]));
    setSearchQuery("");
    setShowDropdown(false);
  };

  const handleRemoveSymptom = (symptom) =>
    dispatch(setSelectedSymptoms(selectedSymptoms.filter((s) => s !== symptom)));

  const handlePredict = async () => {
    if (selectedSymptoms.length === 0) return;
    dispatch(setMlLoading({ symptoms: true }));
    dispatch(setMlError({ symptoms: null }));
    try {
      const { data } = await axiosInstance.post("/ai/symptoms/predict", {
        symptoms: selectedSymptoms,
      });
      if (data.mlServiceDown) { dispatch(setMlServiceDown(true)); return; }
      if (data.success) {
        dispatch(setSymptomPredictions(data.predictions));
        dispatch(setMlServiceDown(false));
        setShowResults(true);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Prediction failed";
      dispatch(setMlError({ symptoms: msg }));
      if (err.response?.status === 503) dispatch(setMlServiceDown(true));
    } finally {
      dispatch(setMlLoading({ symptoms: false }));
    }
  };

  const handleFindDoctors = async () => {
    if (symptomPredictions.length === 0) return;
    setFindingDoctors(true);
    const topPrediction = symptomPredictions[0];
    try {
      const { data } = await axiosInstance.get("/ai/doctors/recommend", {
        params: {
          disease: topPrediction.disease,
          specialization: topPrediction.recommended_specialization || "General Physician",
        },
      });
      if (data.success) dispatch(setRecommendedDoctors(data.recommended_doctors));
    } catch (err) {
      console.error("Doctor recommendation failed:", err);
    } finally {
      setFindingDoctors(false);
    }
  };

  const handleClear = () => {
    dispatch(setSelectedSymptoms([]));
    dispatch(setSymptomPredictions([]));
    dispatch(setRecommendedDoctors([]));
    setShowResults(false);
    setSearchQuery("");
  };

  /* ── confidence helpers ── */
  const confColor = (c) =>
    c >= 0.7 ? "#16a34a" : c >= 0.4 ? "#d97706" : "#dc2626";
  const confBg = (c) =>
    c >= 0.7 ? "#dcfce7" : c >= 0.4 ? "#fef9c3" : "#fee2e2";
  const barColor = (c) =>
    c >= 0.7 ? "#22c55e" : c >= 0.4 ? "#f59e0b" : "#f87171";
  const rankBorder = (i) =>
    i === 0 ? "#1d4ed8" : i === 1 ? "#16a34a" : "#d97706";

  return (
    <>
      <style>{`
        .sc-wrap {
          background: #ffffff;
          border: 1px solid #e8edf4;
          border-radius: 20px;
          box-shadow: 0 2px 16px rgba(10,30,60,0.06);
          padding: clamp(20px, 3vw, 32px);
          font-family: 'DM Sans', system-ui, sans-serif;
        }

        /* input */
        .sc-input {
          width: 100%;
          padding: 12px 16px;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          font-size: 14px;
          color: #1e293b;
          background: #f8fafc;
          outline: none;
          transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
          font-family: inherit;
          min-height: 48px;
        }
        .sc-input:focus {
          border-color: #3b82f6;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
        }
        .sc-input::placeholder { color: #94a3b8; }

        /* dropdown */
        .sc-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0; right: 0;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 8px 28px rgba(10,30,60,0.10);
          max-height: 220px;
          overflow-y: auto;
          z-index: 50;
        }
        .sc-dropdown::-webkit-scrollbar { width: 4px; }
        .sc-dropdown::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }

        .sc-dropdown-item {
          padding: 11px 16px;
          font-size: 13.5px;
          color: #334155;
          cursor: pointer;
          border-bottom: 0.5px solid #f1f5f9;
          transition: background 0.12s;
          min-height: 44px;
          display: flex;
          align-items: center;
        }
        .sc-dropdown-item:last-child { border-bottom: none; }
        .sc-dropdown-item:hover { background: #eff6ff; color: #1d4ed8; }

        /* chips */
        .sc-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1d4ed8;
          font-size: 12px;
          font-weight: 500;
          padding: 6px 12px;
          border-radius: 50px;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
          min-height: 34px;
          font-family: inherit;
        }
        .sc-chip:hover { background: #dbeafe; border-color: #93c5fd; }
        .sc-chip-x {
          width: 15px; height: 15px;
          background: #bfdbfe;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          color: #1d4ed8;
          flex-shrink: 0;
          transition: background 0.15s;
        }
        .sc-chip:hover .sc-chip-x { background: #93c5fd; }

        /* primary button */
        .sc-btn-primary {
          width: 100%;
          padding: 13px 20px;
          background: #1d4ed8;
          color: #fff;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.18s, transform 0.12s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: inherit;
          min-height: 48px;
        }
        .sc-btn-primary:hover:not(:disabled) { background: #1e40af; transform: translateY(-1px); }
        .sc-btn-primary:active:not(:disabled) { transform: translateY(0); }
        .sc-btn-primary:disabled { background: #cbd5e1; cursor: not-allowed; color: #94a3b8; }

        /* secondary button */
        .sc-btn-secondary {
          padding: 9px 18px;
          background: transparent;
          color: #64748b;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
          font-family: inherit;
          min-height: 40px;
        }
        .sc-btn-secondary:hover { background: #f1f5f9; border-color: #cbd5e1; }

        /* prediction card */
        .sc-pred-card {
          border: 1.5px solid #e8edf4;
          border-radius: 14px;
          padding: clamp(14px, 2vw, 20px);
          background: #fff;
          transition: box-shadow 0.18s;
          position: relative;
          overflow: hidden;
        }
        .sc-pred-card::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 4px;
          border-radius: 14px 0 0 14px;
        }
        .sc-pred-card:hover { box-shadow: 0 4px 20px rgba(10,30,60,0.08); }

        /* precaution tag */
        .sc-tag {
          display: inline-flex;
          align-items: center;
          background: #f1f5f9;
          color: #475569;
          font-size: 11.5px;
          font-weight: 500;
          padding: 5px 11px;
          border-radius: 50px;
          border: 1px solid #e2e8f0;
        }

        /* label */
        .sc-label {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #94a3b8;
          margin-bottom: 8px;
          display: block;
        }

        /* section divider */
        .sc-divider {
          height: 1px;
          background: #f1f5f9;
          margin: 24px 0;
        }

        @keyframes sc-spin {
          to { transform: rotate(360deg); }
        }
        .sc-spinner {
          animation: sc-spin 0.8s linear infinite;
        }

        @media (max-width: 480px) {
          .sc-pred-header { flex-direction: column; align-items: flex-start !important; }
        }
      `}</style>

      <div className="sc-wrap">

        {/* ── HEADER ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 24 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              {/* Brain icon */}
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: "linear-gradient(135deg,#eff6ff,#dbeafe)",
                border: "1px solid #bfdbfe",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="1.8">
                  <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-4.14z"/>
                  <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-4.14z"/>
                </svg>
              </div>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", margin: 0, lineHeight: 1.3 }}>
                  AI Symptom Checker
                </h2>
                <p style={{ fontSize: 11.5, color: "#94a3b8", margin: "2px 0 0", fontWeight: 500 }}>
                  Powered by Random Forest ML
                </p>
              </div>
            </div>
          </div>

          {showResults && (
            <button className="sc-btn-secondary" onClick={handleClear}>
              ← New check
            </button>
          )}
        </div>

        {/* ── ML SERVICE DOWN BANNER ── */}
        {mlServiceDown && (
          <div style={{
            marginBottom: 20,
            padding: "12px 16px",
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: 12,
            display: "flex", gap: 10, alignItems: "flex-start",
          }} role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <p style={{ fontSize: 13, color: "#92400e", lineHeight: 1.55, margin: 0 }}>
              <strong>AI features temporarily unavailable.</strong> The ML service may be starting up. Please try again in a moment.
            </p>
          </div>
        )}

        {/* ── INPUT PHASE ── */}
        {!showResults && (
          <>
            <span className="sc-label">Select your symptoms</span>

            <div ref={dropdownRef} style={{ position: "relative", marginBottom: 20 }}>
              <div style={{ position: "relative" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"
                  style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  id="symptom-input"
                  type="text"
                  placeholder="Search symptoms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowDropdown(true)}
                  className="sc-input"
                  style={{ paddingLeft: 40 }}
                  aria-label="Search for symptoms"
                  aria-owns="symptom-dropdown"
                />
              </div>

              {showDropdown && filteredSymptoms.length > 0 && (
                <ul id="symptom-dropdown" className="sc-dropdown" role="listbox">
                  {filteredSymptoms.map((symptom) => (
                    <li
                      key={symptom}
                      onClick={() => handleAddSymptom(symptom)}
                      className="sc-dropdown-item"
                      role="option"
                      aria-selected={false}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                        style={{ marginRight: 8, flexShrink: 0, opacity: 0.4 }}>
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      {symptom}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Selected Chips */}
            {selectedSymptoms.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <span className="sc-label">
                  Selected ({selectedSymptoms.length})
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {selectedSymptoms.map((symptom) => (
                    <button
                      key={symptom}
                      onClick={() => handleRemoveSymptom(symptom)}
                      className="sc-chip"
                      aria-label={`Remove ${symptom}`}
                    >
                      {symptom}
                      <span className="sc-chip-x">×</span>
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 8 }}>Click a symptom to remove it</p>
              </div>
            )}

            {/* Analyse Button */}
            <button
              onClick={handlePredict}
              disabled={selectedSymptoms.length === 0 || loading.symptoms}
              className="sc-btn-primary"
              aria-busy={loading.symptoms}
            >
              {loading.symptoms ? (
                <>
                  <svg className="sc-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                  Analysing symptoms...
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-4.14z"/>
                    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-4.14z"/>
                  </svg>
                  Analyse{selectedSymptoms.length > 0 ? ` ${selectedSymptoms.length}` : ""} Symptom{selectedSymptoms.length !== 1 ? "s" : ""}
                </>
              )}
            </button>

            {/* Error */}
            {error.symptoms && (
              <div style={{
                marginTop: 16, padding: "12px 16px",
                background: "#fef2f2", border: "1px solid #fecaca",
                borderRadius: 12, fontSize: 13, color: "#dc2626", lineHeight: 1.55,
              }} role="alert">
                {error.symptoms}
              </div>
            )}
          </>
        )}

        {/* ── RESULTS PHASE ── */}
        {showResults && symptomPredictions.length > 0 && (
          <div>
            {/* Results header */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%", background: "#22c55e",
                  boxShadow: "0 0 0 3px rgba(34,197,94,0.2)",
                }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                  Analysis Complete
                </h3>
              </div>
              <p style={{ fontSize: 12.5, color: "#64748b", margin: 0 }}>
                Top predictions based on {selectedSymptoms.length} symptom{selectedSymptoms.length !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Prediction cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
              {symptomPredictions.map((prediction, idx) => (
                <div key={idx} className="sc-pred-card">
                  {/* Left accent bar */}
                  <div style={{
                    position: "absolute", left: 0, top: 0, bottom: 0,
                    width: 4, background: rankBorder(idx),
                    borderRadius: "14px 0 0 14px",
                  }} />

                  <div style={{ paddingLeft: 6 }}>
                    {/* Card header */}
                    <div className="sc-pred-header" style={{
                      display: "flex", alignItems: "center",
                      justifyContent: "space-between", gap: 10, marginBottom: 12,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{
                          width: 28, height: 28, borderRadius: 8,
                          background: "#f1f5f9",
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          fontSize: 11, fontWeight: 800, color: "#475569", flexShrink: 0,
                        }}>
                          #{idx + 1}
                        </span>
                        <span style={{ fontWeight: 700, color: "#0f172a", fontSize: 15, lineHeight: 1.3 }}>
                          {prediction.disease}
                        </span>
                      </div>

                      {/* Confidence pill */}
                      <span style={{
                        padding: "4px 12px", borderRadius: 50,
                        background: confBg(prediction.confidence),
                        color: confColor(prediction.confidence),
                        fontSize: 13, fontWeight: 800, flexShrink: 0,
                      }}>
                        {Math.round(prediction.confidence * 100)}%
                      </span>
                    </div>

                    {/* Confidence bar */}
                    <div style={{
                      width: "100%", height: 5,
                      background: "#f1f5f9", borderRadius: 10, marginBottom: 12, overflow: "hidden",
                    }}>
                      <div style={{
                        height: "100%",
                        width: `${prediction.confidence * 100}%`,
                        background: barColor(prediction.confidence),
                        borderRadius: 10,
                        transition: "width 0.8s ease",
                      }} />
                    </div>

                    {/* Description */}
                    {prediction.description && (
                      <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, marginBottom: 12 }}>
                        {prediction.description}
                      </p>
                    )}

                    {/* Precautions */}
                    {prediction.precautions?.length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <span className="sc-label" style={{ marginBottom: 6 }}>Precautions</span>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {prediction.precautions.map((p, pi) => (
                            <span key={pi} className="sc-tag">{p}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Unknown symptoms note */}
                    {prediction.symptoms_unknown?.length > 0 && (
                      <p style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 8, lineHeight: 1.5 }}>
                        <strong>Note:</strong> {prediction.symptoms_unknown.length} symptom(s) not recognised: {prediction.symptoms_unknown.join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Find Doctors Button */}
            <button
              onClick={handleFindDoctors}
              disabled={findingDoctors}
              className="sc-btn-primary"
              aria-busy={findingDoctors}
            >
              {findingDoctors ? (
                <>
                  <svg className="sc-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                  Finding matching doctors...
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                  Find doctors for {symptomPredictions[0]?.disease}
                </>
              )}
            </button>

            {/* Recommended Doctors */}
            {recommendedDoctors.length > 0 && (
              <>
                <div className="sc-divider" />
                <span className="sc-label">Matching Doctors</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {recommendedDoctors.map((doctor) => (
                    <DoctorMatchCard key={doctor.doctorId} doctor={doctor} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default SymptomChecker;