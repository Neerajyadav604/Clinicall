// ──────────────────────────────────────────────────────────────
// DoctorRegistrationPage – styled to match Clinicall UI
// ──────────────────────────────────────────────────────────────
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { doctorRegistration, getDoctorRegistrationStatus } from "../services/operations/Authapi";
import { getAllHospitals } from "../services/operations/hospitalAdminApi";

const SPECIALIZATIONS = [
  "Cardiology", "Neurology", "Orthopedics", "Gynecology", "Pediatrics",
  "Oncology", "Dermatology", "Ophthalmology", "ENT", "General Surgery",
  "Psychiatry", "Urology", "Nephrology", "Gastroenterology", "Pulmonology",
];

// ─── Helpers ───────────────────────────────────────────────────

const inputCls = (err) =>
  "w-full border rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition min-h-[44px] " + (err ? "border-red-400 bg-red-50" : "border-gray-200 bg-white");

const InputField = ({ label, required, error, children }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 mb-1.5 sm:mb-2 uppercase tracking-wide">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

const SectionHeader = ({ children }) => (
  <div className="flex items-center gap-3 mb-4 mt-2">
    <div className="w-1 h-5 bg-emerald-500 rounded-full" />
    <h3 className="text-sm font-bold text-gray-700">{children}</h3>
  </div>
);

// ─── Stepper ───────────────────────────────────────────────────

const Stepper = ({ steps, current }) => (
  <div className="flex items-start justify-start sm:justify-center px-2 overflow-x-auto gap-1 sm:gap-2">
    {steps.map((step, i) => (
      <React.Fragment key={i}>
        <div className="flex flex-col items-center flex-shrink-0">
          <div className={"w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold border-2 transition-all " + (
            i < current
              ? "bg-emerald-500 border-emerald-500 text-white"
              : i === current
              ? "bg-emerald-500 border-emerald-500 text-white ring-4 ring-emerald-100"
              : "bg-white border-gray-300 text-gray-400"
          )}>
            {i < current ? (
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : i + 1}
          </div>
          <span className={"mt-1 text-[8px] sm:text-[10px] font-semibold uppercase tracking-wide text-center max-w-[60px] " + (
            i === current ? "text-emerald-600" : i < current ? "text-emerald-500" : "text-gray-400"
          )}>
            {step}
          </span>
        </div>
        {i < steps.length - 1 && (
          <div className={"hidden sm:flex flex-1 h-0.5 mx-1 sm:mx-2 mt-4 flex-shrink-0 w-4 sm:w-auto " + (i < current ? "bg-emerald-500" : "bg-gray-200")} />
        )}
      </React.Fragment>
    ))}
  </div>
);

// ─── Page Header ───────────────────────────────────────────────

const PageHeader = ({ right }) => (
  <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2">
    <div className="flex items-center gap-2 min-w-0">
      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
        <span className="text-white font-extrabold text-xs sm:text-sm">C</span>
      </div>
      <span className="font-bold text-gray-900 text-sm sm:text-base truncate">Clinicall</span>
    </div>
    {right && <span className="text-xs sm:text-sm text-gray-500 flex-shrink-0">{right}</span>}
  </div>
);

// ─── Registration Summary Panel ────────────────────────────────

const DoctorSummary = ({ form, currentStep, imagePreview }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 sticky top-4">
    <h3 className="text-xs sm:text-sm font-bold text-gray-900 mb-4">Application Summary</h3>

    {/* Avatar */}
    <div className="flex flex-col items-center mb-4">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-emerald-300 bg-emerald-50 flex items-center justify-center flex-shrink-0">
        {imagePreview
          ? <img src={imagePreview} alt="profile" className="w-full h-full object-cover" />
          : (
            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )
        }
      </div>
      {form.fullName && <p className="text-xs font-bold text-gray-800 mt-2 text-center">{form.fullName}</p>}
      {form.specialization && <p className="text-[11px] text-emerald-600 mt-0.5">{form.specialization}</p>}
    </div>

    <div className="space-y-1.5 sm:space-y-2 text-xs">
      {form.email && (
        <div className="flex items-start justify-between gap-2">
          <span className="text-gray-400 flex-shrink-0">Email</span>
          <span className="font-medium text-gray-700 text-right break-all max-w-[120px] text-[11px]">{form.email}</span>
        </div>
      )}
      {form.contact && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-gray-400">Phone</span>
          <span className="font-medium text-gray-700">{form.contact}</span>
        </div>
      )}
      {form.qualification && (
        <div className="flex items-start justify-between gap-2">
          <span className="text-gray-400 flex-shrink-0">Qualification</span>
          <span className="font-medium text-gray-700 text-right max-w-[120px]">{form.qualification}</span>
        </div>
      )}
      {form.experienceYears !== "" && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-gray-400">Experience</span>
          <span className="font-medium text-gray-700">{form.experienceYears} yrs</span>
        </div>
      )}
      {form.licenseNumber && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-gray-400">License</span>
          <span className="font-medium text-gray-700 font-mono text-[10px]">{form.licenseNumber}</span>
        </div>
      )}
      {form.hospitalName && (
        <div className="flex items-start justify-between gap-2">
          <span className="text-gray-400 flex-shrink-0">Hospital</span>
          <span className="font-medium text-gray-700 text-right max-w-[120px]">{form.hospitalName}</span>
        </div>
      )}
    </div>

    <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-gray-600">Progress</span>
        <span className="text-xs text-emerald-600 font-bold">Step {currentStep} of 3</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div
          className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
          style={{ width: ((currentStep / 3) * 100) + "%" }}
        />
      </div>
    </div>

    {/* Review note */}
    <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl">
      <p className="text-[11px] font-bold text-blue-700 mb-1">Review Timeline</p>
      <p className="text-[11px] text-blue-600 leading-relaxed">
        Most applications are reviewed within <strong>24–48 hours</strong> after submission.
      </p>
    </div>

    {form.hospital && (
      <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
        <p className="text-[11px] font-bold text-amber-700 mb-1">Two-Stage Review</p>
        <p className="text-[11px] text-amber-600 leading-relaxed">
          Applications with hospital affiliation go through hospital admin review first, then the platform admin.
        </p>
      </div>
    )}
  </div>
);

// ─── Main Component ─────────────────────────────────────────────

const DoctorRegistrationPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token, loading } = useSelector((state) => state.auth);
  const { user } = useSelector((state) => state.profile);

  // Detect if user is a hospital owner
  const isHospitalOwner = user && (
    Array.isArray(user.roles) ? user.roles.includes("hospital_admin") : user.role === "hospital_admin"
  );

  const [currentStep, setCurrentStep]         = useState(1);
  const [status, setStatus]                   = useState(null); // null = loading
  const [statusMessage, setStatusMessage]     = useState("");
  const [hospitalList, setHospitalList]       = useState([]);
  const [hospitalSearch, setHospitalSearch]   = useState("");
  const [dropdownOpen, setDropdownOpen]       = useState(false);
  const [imagePreview, setImagePreview]       = useState(null);
  const [errors, setErrors]                   = useState({});
  const [submitError, setSubmitError]         = useState("");
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    fullName: "", email: "", contact: "",
    specialization: "", qualification: "", experienceYears: "", licenseNumber: "",
    hospital: "", hospitalName: "",
    documents: "", image: null,
  });

  // Load hospitals
  useEffect(() => {
    getAllHospitals({}).then((res) => setHospitalList(res.data || [])).catch(() => {});
  }, []);

  // Load registration status
  useEffect(() => {
    let active = true;
    getDoctorRegistrationStatus()
      .then((res) => {
        if (!active) return;
        setStatus(res?.data?.status || "none");
        setStatusMessage(res?.data?.message || "");
      })
      .catch(() => { if (active) setStatus("none"); });
    return () => { active = false; };
  }, []);

  // Auto-redirect if approved
  useEffect(() => {
    if (status === "approved") {
      const t = setTimeout(() => navigate("/doctor"), 2500);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [status, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
    if (submitError) setSubmitError("");
  };

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((p) => ({ ...p, image: file }));
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
    if (errors.image) setErrors((p) => ({ ...p, image: "" }));
    if (submitError) setSubmitError("");
  };

  const validateStep = (step) => {
    const err = {};
    if (step === 1) {
      if (!form.fullName.trim())  err.fullName  = "Full name is required";
      if (!form.email.trim())     err.email     = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) err.email = "Enter a valid email";
      if (!form.contact.trim())   err.contact   = "Phone is required";
      if (!form.image)            err.image     = "Profile photo is required";
    }
    if (step === 2) {
      if (!form.specialization.trim())  err.specialization  = "Specialization is required";
      if (!form.qualification.trim())   err.qualification   = "Qualification is required";
      if (!form.licenseNumber.trim())   err.licenseNumber   = "License number is required";
    }
    if (step === 3) {
      if (!form.documents.trim())            err.documents = "Document link is required";
      else if (!/^https?:\/\/.+/.test(form.documents)) err.documents = "Enter a valid URL (http/https)";
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleNext = () => { if (validateStep(currentStep)) setCurrentStep((p) => p + 1); };
  const handleBack = () => setCurrentStep((p) => p - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(3)) return;
    if (!token) {
      setSubmitError("Please log in first.");
      return;
    }
    setSubmitError("");
    const result = await dispatch(doctorRegistration(form, token, navigate));
    if (result && result.success === false) {
      setSubmitError(result.message || "Doctor registration failed.");
    }
  };

  const STEPS = ["Personal Info", "Credentials", "Documents"];

  // ── Loading ─────────────────────────────────────────────────
  if (status === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Checking your status…</p>
        </div>
      </div>
    );
  }

  // ── Approved ─────────────────────────────────────────────────
  if (status === "approved") {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader right="Doctor Portal" />
        <div className="flex items-center justify-center min-h-[80vh] px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-emerald-700 mb-2">You are a Verified Doctor</h2>
            <p className="text-gray-500 text-sm">Redirecting you to your dashboard…</p>
            <div className="mt-4 w-8 h-1.5 bg-emerald-200 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Pending ──────────────────────────────────────────────────
  if (status === "pending") {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader right="Doctor Portal" />
        <div className="flex items-center justify-center min-h-[80vh] px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-lg w-full text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">⏳</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Application Under Review</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Your doctor registration is currently being reviewed by our team. We will notify you once a decision is made.
            </p>
            {statusMessage && (
              <p className="text-sm text-blue-600 mt-3 bg-blue-50 rounded-xl px-4 py-2">{statusMessage}</p>
            )}
            <div className="mt-6 grid grid-cols-3 gap-3 text-xs text-gray-500">
              {[["Submitted", "✅"], ["Under Review", "⏳"], ["Decision", "⬜"]].map(([label, icon]) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <span className="text-lg">{icon}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate("/my-profile")}
              className="mt-6 px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 transition"
            >
              Back to Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form (none or rejected) ────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader right="Doctor Registration Portal" />

      <div className="max-w-4xl mx-auto pt-8 px-4">
        <Stepper steps={STEPS} current={currentStep - 1} />
      </div>

      {/* Hospital owner info banner */}
      {isHospitalOwner && (
        <div className="max-w-4xl mx-auto px-4 mt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
            <span className="text-xl flex-shrink-0">ℹ️</span>
            <div>
              <p className="text-sm font-bold text-blue-800">Hospital Owner Registration</p>
              <p className="text-xs text-blue-700 mt-0.5">You can register as a doctor while maintaining your hospital admin role. If you select your own hospital, the hospital approval stage will be automatic.</p>
            </div>
          </div>
        </div>
      )}

      {/* Rejection banner */}
      {status === "rejected" && (
        <div className="max-w-4xl mx-auto px-4 mt-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
            <span className="text-xl flex-shrink-0">⚠️</span>
            <div>
              <p className="text-sm font-bold text-amber-800">Previous application was rejected</p>
              {statusMessage && <p className="text-xs text-amber-700 mt-0.5">{statusMessage}</p>}
              <p className="text-xs text-amber-600 mt-1">You may reapply below with updated information.</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit}>
          <div className="flex gap-6 items-start">

            {/* ── Main Panel ── */}
            <div className="flex-1 min-w-0 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 md:p-8">
              {submitError ? (
                <div className="error-box mb-4" role="alert" aria-live="polite">
                  {submitError}
                </div>
              ) : null}

              {/* STEP 1 – Personal Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Personal Information</h2>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">Tell us about yourself.</p>
                  </div>

                  {/* Profile Photo */}
                  <div className="flex flex-col items-center py-4">
                    <div
                      className="relative group cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className={"w-28 h-28 rounded-full overflow-hidden border-4 shadow-lg transition-all duration-300 group-hover:scale-105 " + (errors.image ? "border-red-400" : "border-emerald-300")}>
                        {imagePreview
                          ? <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                          : (
                            <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                              <svg className="w-14 h-14 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          )
                        }
                      </div>
                      <div className="absolute bottom-0 right-0 w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm group-hover:bg-emerald-600 transition">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    </div>
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImage} className="hidden" />
                    <p className="text-xs text-gray-500 mt-2">Upload a professional photo</p>
                    {errors.image && <p className="text-xs text-red-500 mt-1">{errors.image}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <InputField label="Full Name" required error={errors.fullName}>
                        <input type="text" name="fullName" value={form.fullName} onChange={handleChange}
                          placeholder="Dr. Alexandra Smith" className={inputCls(errors.fullName)} />
                      </InputField>
                    </div>
                    <InputField label="Email Address" required error={errors.email}>
                      <input type="email" name="email" value={form.email} onChange={handleChange}
                        placeholder="doctor@hospital.com" className={inputCls(errors.email)} />
                    </InputField>
                    <InputField label="Phone Number" required error={errors.contact}>
                      <input type="tel" name="contact" value={form.contact} onChange={handleChange}
                        placeholder="+91 (000) 000-0000" className={inputCls(errors.contact)} />
                    </InputField>
                  </div>
                </div>
              )}

              {/* STEP 2 – Professional Credentials */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Professional Credentials</h2>
                    <p className="text-sm text-gray-500 mt-1">Your qualifications and medical registration details.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Medical Specialization" required error={errors.specialization}>
                      <select name="specialization" value={form.specialization} onChange={handleChange} className={inputCls(errors.specialization)}>
                        <option value="">-- Select Specialization --</option>
                        {SPECIALIZATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </InputField>

                    <InputField label="Educational Qualification" required error={errors.qualification}>
                      <input type="text" name="qualification" value={form.qualification} onChange={handleChange}
                        placeholder="e.g. MBBS, MD Cardiology" className={inputCls(errors.qualification)} />
                    </InputField>

                    <InputField label="Years of Experience">
                      <input type="number" name="experienceYears" value={form.experienceYears}
                        onChange={handleChange} min="0" placeholder="e.g. 10" className={inputCls(false)} />
                    </InputField>

                    <InputField label="Medical License Number" required error={errors.licenseNumber}>
                      <input type="text" name="licenseNumber" value={form.licenseNumber} onChange={handleChange}
                        placeholder="MCI-123456-2024" className={inputCls(errors.licenseNumber)} />
                    </InputField>
                  </div>

                  {/* Hospital Affiliation */}
                  <div>
                    <SectionHeader>Hospital / Clinic Affiliation</SectionHeader>
                    <p className="text-xs text-gray-500 mb-3">Optional. If affiliated, your application will be reviewed by the hospital admin first.</p>

                    {form.hospital ? (
                      <div className="flex items-center gap-3 border border-emerald-200 rounded-xl px-4 py-3 bg-emerald-50">
                        {(() => {
                          const h = hospitalList.find((x) => x._id === form.hospital);
                          return h ? (
                            <>
                              {h.logo
                                ? <img src={h.logo} alt="" className="w-9 h-9 rounded-lg object-cover" />
                                : <span className="text-xl">{h.isClinic ? "🩺" : "🏥"}</span>}
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-emerald-800">{h.name}</p>
                                <p className="text-xs text-emerald-600">{h.address?.city}, {h.address?.state}</p>
                              </div>
                            </>
                          ) : <span className="text-sm font-medium text-emerald-700">{form.hospitalName}</span>;
                        })()}
                        <button type="button"
                          onClick={() => setForm((p) => ({ ...p, hospital: "", hospitalName: "" }))}
                          className="text-xs text-red-500 hover:text-red-700 font-semibold px-2 py-1 rounded hover:bg-red-50 transition">
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="relative">
                          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          <input
                            type="text"
                            value={hospitalSearch}
                            onChange={(e) => { setHospitalSearch(e.target.value); setDropdownOpen(true); }}
                            onFocus={() => setDropdownOpen(true)}
                            onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
                            placeholder="Search hospitals or clinics…"
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                          />
                        </div>
                        {dropdownOpen && (
                          <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-56 overflow-y-auto">
                            {hospitalList
                              .filter((h) =>
                                !hospitalSearch ||
                                h.name.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
                                (h.address?.city || "").toLowerCase().includes(hospitalSearch.toLowerCase())
                              )
                              .slice(0, 8)
                              .map((h) => (
                                <button
                                  key={h._id}
                                  type="button"
                                  onMouseDown={() => {
                                    setForm((p) => ({ ...p, hospital: h._id, hospitalName: h.name }));
                                    setHospitalSearch("");
                                    setDropdownOpen(false);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-emerald-50 text-left transition"
                                >
                                  {h.logo
                                    ? <img src={h.logo} alt="" className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
                                    : <span className="text-lg flex-shrink-0">{h.isClinic ? "🩺" : "🏥"}</span>}
                                  <div>
                                    <p className="text-sm font-medium text-gray-800">{h.name}</p>
                                    <p className="text-xs text-gray-400">{h.address?.city}, {h.address?.state} · {h.isClinic ? "Clinic" : "Hospital"}</p>
                                  </div>
                                </button>
                              ))}
                            {hospitalList.filter((h) =>
                              !hospitalSearch ||
                              h.name.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
                              (h.address?.city || "").toLowerCase().includes(hospitalSearch.toLowerCase())
                            ).length === 0 && (
                              <p className="text-sm text-gray-400 text-center py-5">No hospitals found</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {form.hospital && (
                      <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                        <svg className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <p className="text-xs text-amber-700 leading-relaxed">
                          Your application will undergo a <strong>two-stage review</strong>: first by the hospital admin, then by the platform admin.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 3 – Documents */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Verification Documents</h2>
                    <p className="text-sm text-gray-500 mt-1">Provide a link to your credentials and certifications.</p>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                    <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-blue-800 mb-1">What documents should I include?</p>
                      <ul className="text-xs text-blue-600 space-y-1">
                        <li>• Medical degree / MBBS / MD certificate</li>
                        <li>• MCI / NMC registration certificate</li>
                        <li>• Government-issued ID proof</li>
                        <li>• Specialty certificate (if applicable)</li>
                      </ul>
                    </div>
                  </div>

                  <InputField label="Verification Documents Link" required error={errors.documents}>
                    <input
                      type="url"
                      name="documents"
                      value={form.documents}
                      onChange={handleChange}
                      placeholder="https://drive.google.com/your-verification-docs"
                      className={inputCls(errors.documents)}
                    />
                    <p className="text-xs text-gray-400 mt-1.5">
                      Upload your documents to Google Drive, Dropbox, or similar, then paste the public link here.
                    </p>
                  </InputField>

                  {/* Review Summary */}
                  <div className="border border-gray-100 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100">
                      <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Submission Checklist</p>
                    </div>
                    <div className="p-4 space-y-2.5">
                      {[
                        { done: !!form.fullName && !!form.email && !!form.contact && !!form.image, label: "Personal info & profile photo" },
                        { done: !!form.specialization && !!form.licenseNumber, label: "Specialization & license number" },
                        { done: !!form.qualification, label: "Educational qualification" },
                        { done: !!form.documents, label: "Verification documents link" },
                      ].map(({ done, label }) => (
                        <div key={label} className="flex items-center gap-2.5 text-sm">
                          <div className={"w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 " + (done ? "bg-emerald-500" : "bg-gray-200")}>
                            {done ? (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : <div className="w-2 h-2 rounded-full bg-gray-400" />}
                          </div>
                          <span className={done ? "text-gray-700" : "text-gray-400"}>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <div>
                      <p className="text-xs font-bold text-gray-600">Secure & Confidential</p>
                      <p className="text-xs text-gray-400 mt-0.5">Your credentials are encrypted and only accessed by our verification team.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Summary Panel ── */}
            <div className="w-72 flex-shrink-0 hidden lg:block">
              <DoctorSummary form={form} currentStep={currentStep} imagePreview={imagePreview} />
            </div>
          </div>

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 mt-6">
            <button
              type="button"
              onClick={currentStep === 1 ? () => navigate(-1) : handleBack}
              className="flex items-center gap-2 px-6 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 text-sm font-semibold transition"
            >
              ← Back
            </button>

            {currentStep < 3 ? (
              <button type="button" onClick={handleNext}
                className="px-8 py-2.5 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 text-sm transition shadow-sm">
                Continue
              </button>
            ) : (
              <button type="submit" disabled={loading}
                className="px-8 py-2.5 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 text-sm transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Submitting…
                  </span>
                ) : "Submit Application"}
              </button>
            )}
          </div>
        </form>
      </div>

      <footer className="text-center text-xs text-gray-400 py-6 border-t border-gray-100 mt-4">
        © 2025 Clinicall Medical Services Ltd. All rights reserved.
      </footer>
    </div>
  );
};

export default DoctorRegistrationPage;
