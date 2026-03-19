import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  submitHospitalRegistration,
  getHospitalRegistrationStatus,
} from "../services/operations/hospitalAdminApi";

const SPECIALIZATIONS = [
  "Cardiology", "Neurology", "Orthopedics", "Gynecology", "Pediatrics",
  "Oncology", "Dermatology", "Ophthalmology", "ENT", "General Surgery",
  "Psychiatry", "Urology", "Nephrology", "Gastroenterology", "Pulmonology",
];

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const defaultTimings = {
  monday:    { open: "09:00", close: "18:00", isClosed: false },
  tuesday:   { open: "09:00", close: "18:00", isClosed: false },
  wednesday: { open: "09:00", close: "18:00", isClosed: false },
  thursday:  { open: "09:00", close: "18:00", isClosed: false },
  friday:    { open: "09:00", close: "18:00", isClosed: false },
  saturday:  { open: "09:00", close: "14:00", isClosed: false },
  sunday:    { open: "",      close: "",      isClosed: true  },
};

// ─── Helpers ───────────────────────────────────────────────────

const inputCls = (err) =>
  "w-full border " + (err ? "border-red-400 bg-red-50" : "border-gray-200") +
  " rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition";

const InputField = ({ label, required, error, children }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
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

// ─── Document Upload Box ───────────────────────────────────────

const DocUploadBox = ({ label, helper, accept, required, name, file, onChange, onRemove, error }) => {
  const inputRef = useRef(null);
  const isImage  = file && file.type && file.type.startsWith("image/");

  return (
    <div
      onClick={() => !file && inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (file) return;
        const dropped = e.dataTransfer.files[0];
        if (dropped) onChange({ target: { name, files: [dropped] } });
      }}
      className={"relative border-2 rounded-xl p-4 text-center transition-all min-h-[130px] flex flex-col items-center justify-center " + (
        file
          ? "border-emerald-400 bg-emerald-50 cursor-default"
          : error
          ? "border-red-300 bg-red-50 cursor-pointer"
          : "border-dashed border-gray-300 bg-gray-50 hover:border-emerald-400 hover:bg-emerald-50 cursor-pointer"
      )}
    >
      {file ? (
        <>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="absolute top-2 right-2 w-6 h-6 bg-red-100 rounded-full text-red-500 hover:bg-red-200 flex items-center justify-center text-xs font-bold"
          >x</button>
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-2">
            {isImage
              ? <img src={URL.createObjectURL(file)} alt="" className="w-10 h-10 object-cover rounded-lg" />
              : <span className="text-xl">📄</span>}
          </div>
          <p className="text-xs font-semibold text-emerald-700 truncate w-full px-1">{file.name}</p>
          <p className="text-xs text-emerald-500 mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
        </>
      ) : (
        <>
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className="text-xs font-semibold text-gray-600">
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
          </p>
          {helper && <p className="text-[11px] text-gray-400 mt-0.5">{helper}</p>}
        </>
      )}
      <input ref={inputRef} type="file" name={name} accept={accept} className="hidden" onChange={onChange} />
      {error && !file && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

// ─── Registration Summary Panel ────────────────────────────────

const RegistrationSummary = ({ form, isClinic, currentStep }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sticky top-4">
    <h3 className="text-sm font-bold text-gray-900 mb-4">Registration Summary</h3>

    <div className="space-y-4 text-xs">
      <div>
        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2">Entity Details</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-500">Entity Type</span>
            <span className={"font-semibold px-2 py-0.5 rounded-full text-[11px] " + (isClinic ? "bg-teal-100 text-teal-700" : "bg-emerald-100 text-emerald-700")}>
              {isClinic ? "Private Clinic" : "Hospital"}
            </span>
          </div>
          {form.hospitalName && (
            <div className="flex items-start justify-between gap-2">
              <span className="text-gray-500 flex-shrink-0">Name</span>
              <span className="font-semibold text-gray-800 text-right max-w-[145px] break-words">{form.hospitalName}</span>
            </div>
          )}
          {form.email && (
            <div className="flex items-start justify-between gap-2">
              <span className="text-gray-500 flex-shrink-0">Email</span>
              <span className="font-medium text-gray-700 text-right max-w-[145px] break-all">{form.email}</span>
            </div>
          )}
          {form.phone && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-500">Phone</span>
              <span className="font-medium text-gray-700">{form.phone}</span>
            </div>
          )}
          {form.establishedYear && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-500">Est. Year</span>
              <span className="font-medium text-gray-700">{form.establishedYear}</span>
            </div>
          )}
          {!isClinic && form.totalBeds && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-500">Beds</span>
              <span className="font-medium text-gray-700">{form.totalBeds}</span>
            </div>
          )}
        </div>
      </div>

      {(form.city || form.state) && (
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2">Location Details</p>
          <div className="space-y-2">
            {form.city && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-gray-500">City</span>
                <span className="font-medium text-gray-700">{form.city}</span>
              </div>
            )}
            {form.state && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-gray-500">State</span>
                <span className="font-medium text-gray-700">{form.state}</span>
              </div>
            )}
            <p className="text-[11px] text-gray-400 bg-gray-50 rounded-lg p-2 leading-relaxed mt-1">
              Address details will appear here as you type…
            </p>
          </div>
        </div>
      )}

      {form.specializations && form.specializations.length > 0 && (
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2">Specializations</p>
          <div className="flex flex-wrap gap-1">
            {form.specializations.slice(0, 4).map((s) => (
              <span key={s} className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-medium">{s}</span>
            ))}
            {form.specializations.length > 4 && (
              <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded-full font-medium">+{form.specializations.length - 4}</span>
            )}
          </div>
        </div>
      )}
    </div>

    <div className="mt-5 pt-4 border-t border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-gray-600">Overall Progress</span>
        <span className="text-xs text-emerald-600 font-bold">Step {currentStep} of 4</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div
          className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
          style={{ width: ((currentStep / 4) * 100) + "%" }}
        />
      </div>
      <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
        Please complete additional steps to submit your {isClinic ? "clinic" : "hospital"} and verify it.
      </p>
    </div>
  </div>
);

// ─── Page Header (no global navbar) ────────────────────────────

const PageHeader = ({ right }) => (
  <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
        <span className="text-white font-extrabold text-sm">C</span>
      </div>
      <span className="font-bold text-gray-900 text-base">Clinicall</span>
    </div>
    {right && <span className="text-sm text-gray-500">{right}</span>}
  </div>
);

// ─── Main Component ─────────────────────────────────────────────

const HospitalRegistrationPage = () => {
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);

  const [appStatus, setAppStatus]     = useState(null);
  const [regData, setRegData]         = useState(null);
  const [entityType, setEntityType]   = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting]   = useState(false);

  const [form, setForm] = useState({
    hospitalName: "", email: "", phone: "", website: "",
    street: "", city: "", state: "", pincode: "", country: "India",
    latitude: "", longitude: "", googleMapsUrl: "",
    totalBeds: "", establishedYear: "", about: "",
    contactPersonName: "", contactPersonDesignation: "",
    contactPersonPhone: "", contactPersonEmail: "",
    panNumber: "", gstNumber: "",
    consultationFee: "", maxPatientsPerDay: "", appointmentDuration: "15",
    specializations: [],
    clinicTimings: defaultTimings,
  });

  const [files, setFiles] = useState({
    registrationCertificate: null,
    nabhCertificate: null,
    ownerIdProof: null,
    addressProof: null,
    ownerMedicalLicense: null,
    degreeCertificate: null,
    logo: null,
    coverImage: null,
  });

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    getHospitalRegistrationStatus()
      .then((res) => {
        setAppStatus(res.data?.status || "none");
        setRegData(res.data || null);
      })
      .catch(() => setAppStatus("none"));
  }, [token, navigate]);

  const isClinic = entityType === "clinic";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
    if (submitError) setSubmitError("");
  };

  const handleSpecializationToggle = (spec) => {
    setForm((p) => {
      const existing = p.specializations || [];
      return existing.includes(spec)
        ? { ...p, specializations: existing.filter((s) => s !== spec) }
        : { ...p, specializations: [...existing, spec] };
    });
  };

  const handleTimingChange = (day, field, value) => {
    setForm((p) => ({
      ...p,
      clinicTimings: { ...p.clinicTimings, [day]: { ...p.clinicTimings[day], [field]: value } },
    }));
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    const file = selectedFiles[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors((p) => ({ ...p, [name]: "File size must be under 5MB" }));
      return;
    }
    setFiles((p) => ({ ...p, [name]: file }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
    if (submitError) setSubmitError("");
  };

  const handleFileRemove = (name) => setFiles((p) => ({ ...p, [name]: null }));

  const validateStep = (step) => {
    const errs = {};
    if (step === 1) {
      if (!form.hospitalName.trim()) errs.hospitalName = "Name is required";
      if (!form.email.trim())        errs.email        = "Email is required";
      if (!form.phone.trim())        errs.phone        = "Phone is required";
    }
    if (step === 2) {
      if (!form.street.trim())  errs.street  = "Street is required";
      if (!form.city.trim())    errs.city    = "City is required";
      if (!form.state.trim())   errs.state   = "State is required";
      if (!form.pincode.trim()) errs.pincode = "Pincode is required";
    }
    if (step === 4) {
      if (!files.registrationCertificate) errs.registrationCertificate = "Required";
      if (!files.ownerIdProof)            errs.ownerIdProof            = "Required";
      if (!files.addressProof)            errs.addressProof            = "Required";
      if (isClinic) {
        if (!files.ownerMedicalLicense) errs.ownerMedicalLicense = "Required for clinics";
        if (!files.degreeCertificate)   errs.degreeCertificate   = "Required for clinics";
      }
      if (!form.panNumber.trim()) errs.panNumber = "PAN number is required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => { if (validateStep(currentStep)) setCurrentStep((p) => p + 1); };
  const handleBack = () => setCurrentStep((p) => p - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(4)) return;
    setSubmitting(true);
    setSubmitError("");

    const fd = new FormData();
    ["hospitalName","email","phone","website","street","city","state","pincode","country",
     "latitude","longitude","googleMapsUrl","totalBeds","establishedYear","about",
     "contactPersonName","contactPersonDesignation","contactPersonPhone","contactPersonEmail",
     "panNumber","gstNumber"].forEach((f) => fd.append(f, form[f]));
    fd.append("entityType", isClinic ? "clinic" : "hospital");
    fd.append("specializations", JSON.stringify(form.specializations));
    if (isClinic) {
      fd.append("consultationFee",     form.consultationFee);
      fd.append("maxPatientsPerDay",   form.maxPatientsPerDay);
      fd.append("appointmentDuration", form.appointmentDuration);
      fd.append("clinicTimings",       JSON.stringify(form.clinicTimings));
    }
    Object.entries(files).forEach(([key, file]) => { if (file) fd.append(key, file); });

    try {
      await submitHospitalRegistration(fd);
      toast.success("Application submitted successfully!");
      setAppStatus("submitted");
    } catch (err) {
      setSubmitError(err.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────
  if (appStatus === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Checking your application status…</p>
        </div>
      </div>
    );
  }

  // ── Submitted Success ────────────────────────────────────────
  if (appStatus === "submitted") {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader right="Need help? Contact Support" />
        <div className="max-w-4xl mx-auto pt-8 px-4">
          <Stepper steps={["Entity", "Details", "Contact", "Docs", "Finished"]} current={5} />
        </div>
        <div className="max-w-4xl mx-auto px-4 py-8 flex gap-6 items-start">
          <div className="flex-1 space-y-6">
            <div className="bg-white rounded-2xl border border-emerald-200 p-6 flex items-start gap-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Your application has been submitted successfully!</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Thank you for registering with Clinicall. We have received your application and it is now under review by our verification team.
                </p>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-sm font-bold text-gray-700 mb-4">Application Details</h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                {[
                  ["ENTITY TYPE",        isClinic ? "Clinic" : "Hospital"],
                  ["APPLICATION NUMBER", "ACL-2025-00001"],
                  ["REGISTERED NAME",    form.hospitalName || "—"],
                  ["EMAIL ADDRESS",      form.email        || "—"],
                  ["PHONE NUMBER",       form.phone        || "—"],
                  ["CITY",               form.city         || "—"],
                  ["CONTACT PERSON",     form.contactPersonName        || "—"],
                  ["DESIGNATION",        form.contactPersonDesignation || "—"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">{value}</p>
                  </div>
                ))}
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">STATUS</p>
                  <span className="inline-block mt-1 px-3 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">Under Review</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 text-sm text-gray-600 border border-gray-200 px-5 py-2.5 rounded-xl hover:bg-gray-50 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Application Copy
            </button>
          </div>

          <div className="w-72 flex-shrink-0 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Application Summary</h3>
            <div className="space-y-3 text-xs">
              {[
                ["Type",        isClinic ? "Clinic" : "Hospital"],
                ["Submitted",   new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })],
                ["Review Time", "3–5 Business Days"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-semibold text-gray-800">{v}</span>
                </div>
              ))}
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Current Status</span>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 font-bold rounded-full text-[11px]">UNDER REVIEW</span>
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-700 mb-3">What happens next?</p>
              <ol className="space-y-2.5 text-xs text-gray-500">
                {[
                  "Our verification team will review your submitted documents for completeness.",
                  "You will receive an email confirmation once your application status changes.",
                  "Access your clinic dashboard and start configuring your medical content.",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
              <button
                onClick={() => navigate("/login")}
                className="w-full mt-5 py-2.5 bg-emerald-500 text-white text-sm font-semibold rounded-xl hover:bg-emerald-600 transition"
              >
                Download Summary
              </button>
            </div>
          </div>
        </div>
        <footer className="text-center text-xs text-gray-400 py-6 border-t border-gray-100">
          © 2025 Clinicall Medical Services Ltd. All rights reserved.
        </footer>
      </div>
    );
  }

  // ── Pending ──────────────────────────────────────────────────
  if (appStatus === "pending") {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader right="Registration Portal" />
        <div className="flex items-center justify-center min-h-[80vh] px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">⏳</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Application Under Review</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Your {regData?.isClinic ? "clinic" : "hospital"} registration for{" "}
              <strong className="text-gray-700">{regData?.hospitalName}</strong> is being reviewed by our team.
            </p>
            <div className="mt-5 p-3 bg-amber-50 rounded-xl text-sm text-amber-700 font-medium">
              Review typically takes 3–5 business days.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Approved ─────────────────────────────────────────────────
  if (appStatus === "approved") {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader right="Registration Portal" />
        <div className="flex items-center justify-center min-h-[80vh] px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-emerald-700 mb-2">Verified &amp; Live</h2>
            <p className="text-gray-500 text-sm">
              <strong className="text-gray-700">{regData?.hospitalName}</strong> is verified and live on Clinicall.
            </p>
            <p className="text-sm text-amber-600 mt-4 bg-amber-50 rounded-xl px-4 py-3">
              Please <strong>log out and log back in</strong> to activate your Hospital Admin dashboard.
            </p>
            <div className="flex gap-3 mt-6 justify-center">
              <button onClick={() => navigate("/hospital-admin")}
                className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 transition">
                Go to Dashboard
              </button>
              <button onClick={() => navigate("/login")}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition">
                Re-Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Entity Type Selection ─────────────────────────────────────
  if (!entityType) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader right="Registration Portal" />
        <div className="max-w-3xl mx-auto pt-10 px-4">
          <Stepper steps={["Entity Type", "Details", "Location", "Documents", "Finish"]} current={0} />
          <div className="text-center mt-10 mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Register Your Healthcare Entity</h1>
            <p className="text-gray-500 text-sm">Tell us what you are registering to get started with your account.</p>
          </div>

          {appStatus === "rejected" && regData?.rejectionReason && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
              <p className="font-bold mb-1">Previous application rejected:</p>
              <p>{regData.rejectionReason}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => setEntityType("hospital")}
              className="bg-white rounded-2xl shadow-sm border-2 border-transparent hover:border-emerald-400 p-8 text-left transition-all duration-200 hover:shadow-md group focus:outline-none focus:border-emerald-400"
            >
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition">
                <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Hospital</h3>
              <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                Large-scale facility with multiple departments, surgical suites, and inpatient beds.
              </p>
              <ul className="space-y-2 mb-6">
                {["Multi-department management", "Complex staffing workflows", "Advanced patient reporting"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <div className="w-full border-2 border-emerald-500 text-emerald-600 rounded-xl py-2.5 text-center text-sm font-bold group-hover:bg-emerald-500 group-hover:text-white transition">
                Select Hospital
              </div>
            </button>

            <button
              onClick={() => setEntityType("clinic")}
              className="bg-white rounded-2xl shadow-sm border-2 border-transparent hover:border-emerald-400 p-8 text-left transition-all duration-200 hover:shadow-md group focus:outline-none focus:border-emerald-400"
            >
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition">
                <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Clinic / Private Practice</h3>
              <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                Individual practices or specialized centers with streamlined administrative needs.
              </p>
              <ul className="space-y-2 mb-6">
                {["Focused appointment scheduling", "Simple billing & invoicing", "Personalized patient charts"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <div className="w-full border-2 border-emerald-500 text-emerald-600 rounded-xl py-2.5 text-center text-sm font-bold group-hover:bg-emerald-500 group-hover:text-white transition">
                Select Clinic
              </div>
            </button>
          </div>

          <div className="flex justify-center mt-8 mb-12">
            <button disabled className="px-10 py-3 bg-emerald-500 text-white rounded-xl font-semibold opacity-40 cursor-not-allowed text-sm">
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Multi-Step Form ───────────────────────────────────────────
  const STEP_LABELS = ["Entity Type", "Basic Info", "Location", "Contact", "Documents"];

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader right={isClinic ? "Clinic Registration Portal" : "Hospital Registration Portal"} />

      <div className="max-w-5xl mx-auto pt-8 px-4">
        <Stepper steps={STEP_LABELS} current={currentStep} />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit}>
          <div className="flex gap-6 items-start">

            {/* ── Main Form Panel ── */}
            <div className="flex-1 min-w-0 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

              {/* ── STEP 1: Basic Information ── */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Basic Information</h2>
                    <p className="text-sm text-gray-500 mt-1">Tell us about your {isClinic ? "clinic" : "hospital"}.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label={isClinic ? "Clinic Name" : "Hospital Name"} required error={errors.hospitalName}>
                      <input type="text" name="hospitalName" value={form.hospitalName} onChange={handleChange}
                        placeholder="Enter official name" className={inputCls(errors.hospitalName)} />
                    </InputField>

                    <InputField label="Office Lines" error={errors.email}>
                      <input type="email" name="email" value={form.email} onChange={handleChange}
                        placeholder="example@hospital.com" className={inputCls(errors.email)} />
                    </InputField>

                    <InputField label="Official Phone Number" required error={errors.phone}>
                      <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                        placeholder="+91 (000) 000-0000" className={inputCls(errors.phone)} />
                    </InputField>

                    <InputField label="Website (Optional)">
                      <input type="url" name="website" value={form.website} onChange={handleChange}
                        placeholder="https://www.example.com" className={inputCls(false)} />
                    </InputField>

                    <InputField label="Facility Type">
                      <input type="text"
                        value={isClinic ? "Private Medical Clinic" : "Multi-speciality Hospital"}
                        readOnly
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
                    </InputField>

                    <InputField label="Year Established">
                      <input type="number" name="establishedYear" value={form.establishedYear}
                        onChange={handleChange} placeholder="YYYY" className={inputCls(false)} />
                    </InputField>

                    {!isClinic && (
                      <InputField label="Total Bed Capacity">
                        <input type="number" name="totalBeds" value={form.totalBeds}
                          onChange={handleChange} placeholder="e.g. 150" className={inputCls(false)} />
                      </InputField>
                    )}

                    {isClinic && (
                      <>
                        <InputField label="Consultation Fee (₹)">
                          <input type="number" name="consultationFee" value={form.consultationFee}
                            onChange={handleChange} className={inputCls(false)} />
                        </InputField>
                        <InputField label="Max Patients / Day">
                          <input type="number" name="maxPatientsPerDay" value={form.maxPatientsPerDay}
                            onChange={handleChange} className={inputCls(false)} />
                        </InputField>
                        <InputField label="Appointment Duration">
                          <select name="appointmentDuration" value={form.appointmentDuration}
                            onChange={handleChange} className={inputCls(false)}>
                            {[10, 15, 20, 30, 45, 60].map((m) => (
                              <option key={m} value={m}>{m} minutes</option>
                            ))}
                          </select>
                        </InputField>
                      </>
                    )}

                    <div className="md:col-span-2">
                      <InputField label="About / Description">
                        <textarea name="about" value={form.about} onChange={handleChange} rows={3}
                          placeholder="Briefly describe your medical facility…"
                          className={inputCls(false) + " resize-none"} />
                      </InputField>
                    </div>
                  </div>

                  {/* Primary Contact */}
                  <div>
                    <SectionHeader>Primary Contact Person</SectionHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputField label="Full Name">
                        <input type="text" name="contactPersonName" value={form.contactPersonName}
                          onChange={handleChange} placeholder="Representative name" className={inputCls(false)} />
                      </InputField>
                      <InputField label="Designation">
                        <input type="text" name="contactPersonDesignation" value={form.contactPersonDesignation}
                          onChange={handleChange} placeholder="e.g. Medical Director" className={inputCls(false)} />
                      </InputField>
                      <InputField label="Contact Phone">
                        <input type="tel" name="contactPersonPhone" value={form.contactPersonPhone}
                          onChange={handleChange} placeholder="Personal or direct extension" className={inputCls(false)} />
                      </InputField>
                      <InputField label="Contact Email">
                        <input type="email" name="contactPersonEmail" value={form.contactPersonEmail}
                          onChange={handleChange} placeholder="contact-name@email.com" className={inputCls(false)} />
                      </InputField>
                    </div>
                  </div>

                  {/* Specializations */}
                  <div>
                    <SectionHeader>Specializations Offered</SectionHeader>
                    {!isClinic ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {SPECIALIZATIONS.map((spec) => (
                          <label
                            key={spec}
                            className={"flex items-center gap-2.5 cursor-pointer border rounded-xl px-3 py-2.5 text-sm transition-colors " + (
                              form.specializations.includes(spec)
                                ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                                : "border-gray-200 text-gray-600 hover:border-emerald-300 hover:bg-emerald-50"
                            )}
                          >
                            <input type="checkbox" checked={form.specializations.includes(spec)}
                              onChange={() => handleSpecializationToggle(spec)} className="hidden" />
                            <div className={"w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors " + (
                              form.specializations.includes(spec) ? "bg-emerald-500" : "border-2 border-gray-300"
                            )}>
                              {form.specializations.includes(spec) && (
                                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            {spec}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <InputField label="Specialization">
                        <select
                          value={form.specializations[0] || ""}
                          onChange={(e) => setForm((p) => ({ ...p, specializations: e.target.value ? [e.target.value] : [] }))}
                          className={inputCls(false)}
                        >
                          <option value="">-- Select --</option>
                          {SPECIALIZATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </InputField>
                    )}
                  </div>
                </div>
              )}

              {/* ── STEP 2: Location & Address ── */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Location & Address</h2>
                    <p className="text-sm text-gray-500 mt-1">Provide the physical address where your services are registered.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <InputField label="Street Address" required error={errors.street}>
                        <input type="text" name="street" value={form.street} onChange={handleChange}
                          placeholder="Flat, House no., Building, Company, Apartment"
                          className={inputCls(errors.street)} />
                      </InputField>
                    </div>
                    <InputField label="City" required error={errors.city}>
                      <input type="text" name="city" value={form.city} onChange={handleChange}
                        placeholder="e.g. Mumbai" className={inputCls(errors.city)} />
                    </InputField>
                    <InputField label="State" required error={errors.state}>
                      <input type="text" name="state" value={form.state} onChange={handleChange}
                        placeholder="Select State" className={inputCls(errors.state)} />
                    </InputField>
                    <InputField label="Pincode" required error={errors.pincode}>
                      <input type="text" name="pincode" value={form.pincode} onChange={handleChange}
                        placeholder="6-digit code" className={inputCls(errors.pincode)} />
                    </InputField>
                    <InputField label="Country">
                      <input type="text" name="country" value={form.country} onChange={handleChange}
                        className={inputCls(false)} />
                    </InputField>
                  </div>

                  {/* Map Coordinates */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <h3 className="text-sm font-bold text-gray-700">Map Coordinates</h3>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4 flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <p className="text-xs text-blue-600 leading-relaxed">
                        Pinning your exact location helps patients find your clinic easily. You can paste a Google Maps URL or enter coordinates manually.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <InputField label="Google Maps URL">
                          <input type="url" name="googleMapsUrl" value={form.googleMapsUrl} onChange={handleChange}
                            placeholder="https://www.google.com/maps/..." className={inputCls(false)} />
                        </InputField>
                      </div>
                      <InputField label="Latitude">
                        <input type="number" name="latitude" value={form.latitude} onChange={handleChange}
                          step="any" placeholder="e.g. 19.0760" className={inputCls(false)} />
                      </InputField>
                      <InputField label="Longitude">
                        <input type="number" name="longitude" value={form.longitude} onChange={handleChange}
                          step="any" placeholder="e.g. 72.8777" className={inputCls(false)} />
                      </InputField>
                    </div>
                    <div className="mt-4 border-2 border-dashed border-gray-200 rounded-xl h-36 flex flex-col items-center justify-center gap-2 bg-gray-50">
                      <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      <p className="text-xs text-gray-400 font-semibold tracking-widest">MAP PREVIEW AREA</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 3: Contact & Services ── */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Contact & Services</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Confirm your contact details and {isClinic ? "clinic timings" : "hospital specializations"}.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      ["contactPersonName",        "Contact Person Name", "Representative name"],
                      ["contactPersonDesignation", "Designation",         "e.g. Medical Director"],
                      ["contactPersonPhone",       "Contact Phone",       ""],
                      ["contactPersonEmail",       "Contact Email",       ""],
                    ].map(([name, label, placeholder]) => (
                      <InputField key={name} label={label}>
                        <input type="text" name={name} value={form[name]} onChange={handleChange}
                          placeholder={placeholder} className={inputCls(false)} />
                      </InputField>
                    ))}
                  </div>

                  {!isClinic ? (
                    <div>
                      <SectionHeader>Specializations</SectionHeader>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {SPECIALIZATIONS.map((spec) => (
                          <label
                            key={spec}
                            className={"flex items-center gap-2.5 cursor-pointer border rounded-xl px-3 py-2.5 text-sm transition-colors " + (
                              form.specializations.includes(spec)
                                ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                                : "border-gray-200 text-gray-600 hover:border-emerald-300 hover:bg-emerald-50"
                            )}
                          >
                            <input type="checkbox" checked={form.specializations.includes(spec)}
                              onChange={() => handleSpecializationToggle(spec)} className="hidden" />
                            <div className={"w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors " + (
                              form.specializations.includes(spec) ? "bg-emerald-500" : "border-2 border-gray-300"
                            )}>
                              {form.specializations.includes(spec) && (
                                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            {spec}
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <SectionHeader>Clinic Timings</SectionHeader>
                      <div className="space-y-2">
                        {DAYS.map((day) => (
                          <div key={day} className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-2.5 hover:border-gray-300 transition">
                            <span className="w-24 text-sm text-gray-700 capitalize font-medium">{day}</span>
                            <input type="time" value={form.clinicTimings[day]?.open || ""}
                              onChange={(e) => handleTimingChange(day, "open", e.target.value)}
                              disabled={form.clinicTimings[day]?.isClosed}
                              className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm disabled:bg-gray-100 focus:ring-2 focus:ring-emerald-400 focus:outline-none" />
                            <span className="text-gray-400 text-xs">to</span>
                            <input type="time" value={form.clinicTimings[day]?.close || ""}
                              onChange={(e) => handleTimingChange(day, "close", e.target.value)}
                              disabled={form.clinicTimings[day]?.isClosed}
                              className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm disabled:bg-gray-100 focus:ring-2 focus:ring-emerald-400 focus:outline-none" />
                            <label className="flex items-center gap-1.5 ml-auto text-sm text-gray-500 cursor-pointer">
                              <input type="checkbox"
                                checked={form.clinicTimings[day]?.isClosed || false}
                                onChange={(e) => handleTimingChange(day, "isClosed", e.target.checked)}
                                className="w-4 h-4 accent-emerald-500 cursor-pointer" />
                              Closed
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP 4: Documents & Verification ── */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Documents & Verification</h2>
                    <p className="text-sm text-gray-500 mt-1">Upload required documents to verify your medical institution.</p>
                  </div>

                  <div>
                    <SectionHeader>Required Documents</SectionHeader>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <DocUploadBox label="Registration Certificate" required
                        helper="Official govt-issued doc" accept=".pdf,.jpg,.jpeg,.png"
                        name="registrationCertificate" file={files.registrationCertificate}
                        onChange={handleFileChange} onRemove={() => handleFileRemove("registrationCertificate")}
                        error={errors.registrationCertificate} />
                      <DocUploadBox label="Owner ID Proof" required
                        helper="PDF, JPG or PNG · 5MB" accept=".pdf,.jpg,.jpeg,.png"
                        name="ownerIdProof" file={files.ownerIdProof}
                        onChange={handleFileChange} onRemove={() => handleFileRemove("ownerIdProof")}
                        error={errors.ownerIdProof} />
                      <DocUploadBox label="Address Proof" required
                        helper="Utility bill or property doc" accept=".pdf,.jpg,.jpeg,.png"
                        name="addressProof" file={files.addressProof}
                        onChange={handleFileChange} onRemove={() => handleFileRemove("addressProof")}
                        error={errors.addressProof} />
                    </div>
                  </div>

                  {isClinic && (
                    <div>
                      <SectionHeader>Clinic-Specific Documents</SectionHeader>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DocUploadBox label="Owner's Medical License" required
                          helper="Valid MCI/NMC license" accept=".pdf,.jpg,.jpeg,.png"
                          name="ownerMedicalLicense" file={files.ownerMedicalLicense}
                          onChange={handleFileChange} onRemove={() => handleFileRemove("ownerMedicalLicense")}
                          error={errors.ownerMedicalLicense} />
                        <DocUploadBox label="Degree Certificate" required
                          helper="MBBS/MD or relevant degree" accept=".pdf,.jpg,.jpeg,.png"
                          name="degreeCertificate" file={files.degreeCertificate}
                          onChange={handleFileChange} onRemove={() => handleFileRemove("degreeCertificate")}
                          error={errors.degreeCertificate} />
                      </div>
                    </div>
                  )}

                  {!isClinic && (
                    <div>
                      <SectionHeader>Optional Documents</SectionHeader>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DocUploadBox label="NABH / JCI Accreditation"
                          accept=".pdf,.jpg,.jpeg,.png" name="nabhCertificate"
                          file={files.nabhCertificate} onChange={handleFileChange}
                          onRemove={() => handleFileRemove("nabhCertificate")} />
                      </div>
                    </div>
                  )}

                  <div>
                    <SectionHeader>Additional Tax Information</SectionHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputField label="PAN Number" required error={errors.panNumber}>
                        <input type="text" name="panNumber" value={form.panNumber} onChange={handleChange}
                          placeholder="Enter 10-digit PAN" className={inputCls(errors.panNumber)} />
                      </InputField>
                      <InputField label="GST Number (Optional)">
                        <input type="text" name="gstNumber" value={form.gstNumber} onChange={handleChange}
                          placeholder="Enter 15-digit GSTIN" className={inputCls(false)} />
                      </InputField>
                    </div>
                  </div>

                  <div>
                    <SectionHeader>Hospital Branding</SectionHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <DocUploadBox label="Hospital Logo"
                        helper="Square PNG or JPG · 500KB" accept=".jpg,.jpeg,.png,.webp"
                        name="logo" file={files.logo}
                        onChange={handleFileChange} onRemove={() => handleFileRemove("logo")} />
                      <DocUploadBox label="Cover Image"
                        helper="Wide banner image" accept=".jpg,.jpeg,.png,.webp"
                        name="coverImage" file={files.coverImage}
                        onChange={handleFileChange} onRemove={() => handleFileRemove("coverImage")} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Registration Summary Panel ── */}
            <div className="w-72 flex-shrink-0 hidden lg:block space-y-4">
              <RegistrationSummary form={form} isClinic={isClinic} currentStep={currentStep} />

              {/* Document Checklist (step 4 only) */}
              {currentStep === 4 && (() => {
                const reqKeys = isClinic
                  ? ["registrationCertificate","ownerIdProof","addressProof","ownerMedicalLicense","degreeCertificate"]
                  : ["registrationCertificate","ownerIdProof","addressProof"];
                const uploaded = reqKeys.filter((k) => files[k]).length;
                const pct = Math.round((uploaded / reqKeys.length) * 100);
                return (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                    <h4 className="text-xs font-bold text-gray-700 mb-3">Document Checklist</h4>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-500">{uploaded} of {reqKeys.length} uploaded</span>
                      <span className="text-emerald-600 font-bold">{pct}% Complete</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
                      <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: pct + "%" }} />
                    </div>
                    <ul className="space-y-2.5">
                      {[
                        { key: "registrationCertificate", label: "Registration Certificate", sub: "Official registration doc" },
                        { key: "ownerIdProof",            label: "Owner ID Proof",           sub: "Govt-issued photo ID"     },
                        { key: "addressProof",            label: "Address Proof",            sub: "Utility bill or lease"    },
                        ...(isClinic ? [
                          { key: "ownerMedicalLicense", label: "Medical License",    sub: "MCI/NMC license"   },
                          { key: "degreeCertificate",   label: "Degree Certificate", sub: "MBBS/MD or equiv." },
                        ] : []),
                      ].map(({ key, label, sub }) => (
                        <li key={key} className="flex items-start gap-2.5 text-xs">
                          <div className={"w-4 h-4 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0 " + (
                            files[key] ? "bg-emerald-500" : "border-2 border-gray-300"
                          )}>
                            {files[key] && (
                              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className={"font-semibold " + (files[key] ? "text-emerald-700" : "text-gray-700")}>{label}</p>
                            <p className="text-[11px] text-gray-400">{files[key] ? "File attached" : sub}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
                      <p className="text-[11px] font-bold text-amber-700 mb-1">Verification Note</p>
                      <p className="text-[11px] text-amber-600 leading-relaxed">
                        Documents are usually verified within 24–48 business hours after final submission.
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {submitError ? (
            <div className="error-box mt-4" role="alert" aria-live="polite">
              {submitError}
            </div>
          ) : null}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            <button
              type="button"
              onClick={currentStep === 1 ? () => { setEntityType(null); setCurrentStep(1); } : handleBack}
              className="flex items-center gap-2 px-6 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 text-sm font-semibold transition"
            >
              ← Back
            </button>

            {currentStep < 4 ? (
              <button type="button" onClick={handleNext}
                className="px-8 py-2.5 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 text-sm transition shadow-sm">
                Continue
              </button>
            ) : (
              <button type="submit" disabled={submitting}
                className="px-8 py-2.5 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 text-sm transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed">
                {submitting ? (
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
    </div>
  );
};

export default HospitalRegistrationPage;
