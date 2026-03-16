import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  HeartPulse,
  Mail,
  MapPin,
  Phone,
  Pill,
  ShieldCheck,
  UserRound,
  LayoutDashboard,
  ClipboardList,
  Calendar,
  UserCog,
  LogOut,
  Loader,
  FileText,
  Download,
} from "lucide-react";
import {
  fetchUserProfile,
  updateDisplayPicture,
  updateUserProfile,
} from "../services/operations/Profileapi";
import { getConditions, getAllergies, triggerExport, pollExportStatus, getPendingConsentRequests } from "../services/fhirApi";
import { getUserRequests } from "../services/operations/requestApi";
import {
  setConditions,
  setAllergies,
  setConditionsLoading,
  setAllergiesLoading,
  setExportJobId,
  setExportLoading,
  updateExportJob,
  clearExportJob,
  pollExportJobThunk,
  setConsentRequests,
  setConsentRequestsLoading
} from "../slices/fhirSlice";
import AvatarUploader from "../components/profile/AvatarUploader";
import UtilitiesPanel from "../components/profile/UtilitiesPanel";
import { Sidebar, SidebarBody, SidebarLinkItem } from "../components/ui/sidebar";
import { getDoctorRegistrationStatus, logout } from "../services/operations/Authapi";
import ConsentManager from "../components/consent/ConsentManager";
import AccessLogViewer from "../components/consent/AccessLogViewer";
import DocumentVault from "../components/clinical/DocumentVault";


const toList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return [value];
};

/**
 * Safely extract display value from FHIR fields
 * Handles: strings, objects with text/coding, arrays, numbers
 */
const getFhirDisplay = (field) => {
  if (!field) return "";
  
  // Already a string
  if (typeof field === "string") return field;
  
  // Number
  if (typeof field === "number") return String(field);
  
  // Object with text field (preferred)
  if (field.text) return field.text;
  
  // Object with coding array
  if (Array.isArray(field.coding) && field.coding[0]?.display) {
    return field.coding[0].display;
  }
  
  // Object with display field
  if (field.display) return field.display;
  
  // Array of objects - recursively get first display
  if (Array.isArray(field) && field.length > 0) {
    return getFhirDisplay(field[0]);
  }
  
  // Fallback - empty string (don't render objects)
  return "";
};

const SectionShell = ({ title, subtitle, children }) => (
  <section className="rounded-[20px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_16px_34px_-26px_rgba(2,6,23,0.45)] md:p-6">
    <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
    {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
    <div className="mt-5">{children}</div>
  </section>
);

const InfoTile = ({ label, value }) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
    <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-1 text-sm font-semibold text-slate-800">{value || "Not set"}</p>
  </div>
);

const InputField = ({
  label,
  name,
  value,
  onChange,
  error,
  type = "text",
  placeholder = "",
}) => (
  <div>
    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
      {label}
    </label>
    <input
      type={type}
      name={name}
      value={value || ""}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/20 ${error ? "border-rose-400" : "border-slate-200"
        }`}
    />
    {error ? <p className="mt-1 text-xs text-rose-500">{error}</p> : null}
  </div>
);

const PillList = ({ items, tone = "slate", icon: Icon, title }) => {
  const tones = {
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    cyan: "border-cyan-200 bg-cyan-50 text-cyan-900",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
  };
  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide">
        {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        {title}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item, index) => {
          // ✅ Extract display text from FHIR objects or use string directly
          const displayValue = getFhirDisplay(item);
          // Skip empty values
          if (!displayValue) return null;
          return (
            <span key={`${displayValue}-${index}`} className="rounded-full bg-white px-3 py-1 text-xs">
              {displayValue}
            </span>
          );
        })}
      </div>
    </div>
  );
};

const MyProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);
 

  const sidebarLinks = [
    {
      label: "Dashboard",
      href: "/my-profile",
      icon: <LayoutDashboard className="h-5 w-5 flex-shrink-0 text-slate-600" />,
    },
    {
      label: "Medical Records",
      href: "/medical-records",
      icon: <FileText className="h-5 w-5 flex-shrink-0 text-slate-600" />,
    },
    {
      label: "My Requests",
      href: "/my-requests",
      icon: <ClipboardList className="h-5 w-5 flex-shrink-0 text-slate-600" />,
    },
    {
      label: "Book Appointment",
      href: "/appointment",
      icon: <Calendar className="h-5 w-5 flex-shrink-0 text-slate-600" />,
    },
    {
      label: "Edit Profile",
      href: "/editprofile",
      icon: <UserCog className="h-5 w-5 flex-shrink-0 text-slate-600" />,
    },
    {
      label: "Logout",
      href: "",
      icon: <LogOut className="h-5 w-5 flex-shrink-0 text-rose-500" />,
      onClick: () => dispatch(logout(navigate)),
    },
  ];
  const { user } = useSelector((state) => state.profile);
  const { conditions, conditionsLoading, allergies, allergiesLoading } = useSelector(
    (state) => state.fhir
  );

  const [imageFile, setImageFile] = useState(null);
  const [previewSource, setPreviewSource] = useState(null);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [errors, setErrors] = useState({});
  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [registrationError, setRegistrationError] = useState("");
  const [paidAppointmentId, setPaidAppointmentId] = useState(null);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);

  // Export state
  const { exportJob, exportLoading } = useSelector(state => state.fhir);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportResourceTypes, setExportResourceTypes] = useState([]);
  const [exportPollingInterval, setExportPollingInterval] = useState(null);

  useEffect(() => {
    if (token) dispatch(fetchUserProfile());
  }, [dispatch, token]);

  useEffect(() => {
    if (!user) return;
    // Check if user has doctor role (support both old and new schema)
    const userRoles = Array.isArray(user.roles) ? user.roles : [user.role || ""];
    if (userRoles.includes("doctor")) {
      navigate("/doctor");
      return;
    }
    // Only show registration status for regular users (not hospital_admin or other roles)
    if (!userRoles.includes("user")) return;

    let active = true;
    const loadStatus = async () => {
      setRegistrationLoading(true);
      setRegistrationError("");
      try {
        const res = await getDoctorRegistrationStatus();
        const status = res?.data?.status || res?.status || "none";
        if (active) setRegistrationStatus(status);
      } catch (error) {
        if (active) {
          setRegistrationError(error?.message || "Unable to load application status");
        }
      } finally {
        if (active) setRegistrationLoading(false);
      }
    };

    loadStatus();
    return () => {
      active = false;
    };
  }, [user, navigate]);

  // Cleanup export polling interval on unmount
  useEffect(() => {
    return () => {
      if (exportPollingInterval) {
        clearInterval(exportPollingInterval);
      }
    };
  }, [exportPollingInterval]);

  // Fetch a paid/active appointment for gated FHIR access
  useEffect(() => {
    if (!user?._id) return;

    let active = true;

    const fetchPaidAppointment = async () => {
      try {
        setAppointmentsLoading(true);
        const response = await getUserRequests("ALL");
        const appointments = response?.data || response?.appointments || [];
        const paidAppointment = (Array.isArray(appointments) ? appointments : []).find(
          (apt) => apt.paymentStatus === "paid" && apt.consultationStatus === "active"
        );

        if (active) {
          setPaidAppointmentId(paidAppointment?._id || null);
        }
      } catch (error) {
        console.error("Error loading appointments for profile:", error);
        if (active) {
          setPaidAppointmentId(null);
        }
      } finally {
        if (active) {
          setAppointmentsLoading(false);
        }
      }
    };

    fetchPaidAppointment();

    return () => {
      active = false;
    };
  }, [user?._id]);

  // Load FHIR Clinical Data (Conditions & Allergies)
  useEffect(() => {
    if (!user?._id || appointmentsLoading || !paidAppointmentId) return;

    const loadFhirData = async () => {
      try {
        // Load conditions
        dispatch(setConditionsLoading(true));
        const conditionsResponse = await getConditions(user._id, {
          appointmentId: paidAppointmentId,
        });
        const conditionsList = conditionsResponse?.entry?.map((entry) => entry.resource) || [];
        dispatch(setConditions(conditionsList));

        // Load allergies
        dispatch(setAllergiesLoading(true));
        const allergiesResponse = await getAllergies(user._id);
        const allergiesList = allergiesResponse?.entry?.map((entry) => entry.resource) || [];
        dispatch(setAllergies(allergiesList));
      } catch (error) {
        console.error("Error loading FHIR data:", error);
        // Not fatal - just log the error
      } finally {
        dispatch(setConditionsLoading(false));
        dispatch(setAllergiesLoading(false));
      }
    };

    loadFhirData();
  }, [user?._id, dispatch, paidAppointmentId, appointmentsLoading]);

  // Load pending consent requests
  useEffect(() => {
    if (!user?._id) return;
    
    const loadConsentRequests = async () => {
      try {
        dispatch(setConsentRequestsLoading(true));
        const response = await getPendingConsentRequests(user._id);
        if (response?.data) {
          dispatch(setConsentRequests(response.data || []));
        }
      } catch (error) {
        console.error("Error loading consent requests:", error);
        // Non-fatal - just log
      } finally {
        dispatch(setConsentRequestsLoading(false));
      }
    };

    loadConsentRequests();
  }, [user?._id, dispatch]);

  const locationText = useMemo(() => {
    if (!user?.address) return "Location not set";
    return user.address.split(",").slice(-2).join(",").trim();
  }, [user]);

  const completion = useMemo(() => {
    const required = [
      user?.fullName,
      user?.email,
      user?.contact,
      user?.address,
      user?.emergencyContact,
      user?.bloodGroup,
    ];
    const filled = required.filter((item) => String(item || "").trim()).length;
    return Math.round((filled / required.length) * 100);
  }, [user]);

  const handleImageSelect = (file) => {
    setImageFile(file);
    if (uploadError) setUploadError("");
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreviewSource(reader.result);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!imageFile) return;
    setLoadingUpload(true);
    setUploadError("");
    try {
      const data = new FormData();
      data.append("displayPicture", imageFile);
      const result = await dispatch(updateDisplayPicture(token, data));
      if (result && result.success === false) {
        setUploadError(result.message || "Could not update display picture.");
        return;
      }
      setUploadSuccess(true);
      setImageFile(null);
      setPreviewSource(null);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error) {
      console.error(error);
      setUploadError("Could not update display picture.");
    } finally {
      setLoadingUpload(false);
    }
  };

  const validate = () => {
    const nextErrors = {};
    if (!user?.fullName?.trim()) nextErrors.fullName = "Required";
    if (!user?.email?.trim()) nextErrors.email = "Required";
    if (!user?.contact?.trim()) nextErrors.contact = "Required";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleStartExport = async () => {
    if (exportResourceTypes.length === 0) {
      alert('Please select at least one resource type to export');
      return;
    }

    try {
      dispatch(setExportLoading(true));
      const jobUrl = await triggerExport(user._id, exportResourceTypes);
      
      // Extract jobId from jobUrl
      const jobId = jobUrl.split('/').pop();
      dispatch(setExportJobId(jobId));

      // Start polling for export status
      const pollInterval = setInterval(async () => {
        try {
          const status = await pollExportStatus(jobId);
          
          if (status.status === 'completed') {
            dispatch(updateExportJob({
              status: 'completed',
              outputUrls: status.outputUrls
            }));
            clearInterval(pollInterval);
            setExportPollingInterval(null);
          } else if (status.status === 'failed') {
            dispatch(updateExportJob({
              status: 'failed',
              error: status.error
            }));
            clearInterval(pollInterval);
            setExportPollingInterval(null);
          }
        } catch (error) {
          console.error('Error polling export status:', error);
        }
      }, 2000); // Poll every 2 seconds

      setExportPollingInterval(pollInterval);
      setExportResourceTypes([]);
    } catch (error) {
      alert('Error starting export: ' + error.message);
    } finally {
      dispatch(setExportLoading(false));
    }
  };

  const handleCancelExport = () => {
    if (exportPollingInterval) {
      clearInterval(exportPollingInterval);
      setExportPollingInterval(null);
    }
    dispatch(clearExportJob());
    setShowExportModal(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-6xl space-y-4">
          <div className="h-40 animate-pulse rounded-3xl bg-slate-200" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="h-80 animate-pulse rounded-2xl bg-slate-200" />
            <div className="h-96 animate-pulse rounded-2xl bg-slate-200 lg:col-span-2" />
          </div>
        </div>
      </div>
    );
  }

  const userAllergies = toList(user.allergies);
  const userMedications = toList(user.medications);
  const userMedicalHistory = toList(user.medicalHistory);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--page)]">
      {/* ── Sidebar ── */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <SidebarBody className="justify-between gap-10 h-full min-h-screen">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {/* Logo */}
            <div className="flex items-center gap-2 px-2 py-4 mb-4 border-b border-slate-100">
              <div className="h-5 w-5 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex-shrink-0" />
              {sidebarOpen && (
                <span className="font-semibold text-slate-800 text-sm">Clinicall</span>
              )}
            </div>
            {/* Nav links */}
            <div className="flex flex-col gap-1">
              {sidebarLinks.map((link, idx) => (
                <SidebarLinkItem key={idx} link={link} />
              ))}
            </div>
          </div>
          {/* User avatar at bottom */}
          {user && (
            <div className="flex items-center gap-2 px-2 py-2 border-t border-slate-100 mt-4">
              <img
                src={user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || 'U')}&background=0f3b4a&color=fff`}
                alt="Profile"
                className="h-8 w-8 rounded-full object-cover flex-shrink-0"
              />
              {sidebarOpen && (
                <div className="overflow-hidden">
                  <p className="text-sm font-medium text-slate-800 truncate">{user.fullName}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              )}
            </div>
          )}
        </SidebarBody>
      </Sidebar>

      {/* ── Main Content ── */}
      <div className="flex-1 overflow-y-auto md:ml-[260px]">
        <div
          className="bg-[var(--page)] px-4 py-8 md:px-8"
          style={{
            "--page": "#f3f7fb",
            "--surface": "#ffffff",
            "--line": "#d9e2ec",
          }}
        >
          <div className="mx-auto max-w-6xl space-y-6">
            <header className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-[#0f172a] via-[#0f3b4a] to-[#0d1f2d] p-6 text-white shadow-[0_28px_60px_-36px_rgba(2,6,23,0.85)] md:p-8">
              <div className="pointer-events-none absolute -left-12 -top-12 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 right-0 h-48 w-48 rounded-full bg-emerald-300/20 blur-3xl" />

              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-5">
                  <div className="space-y-3">
                    <AvatarUploader
                      src={previewSource || user.image}
                      onUpload={handleImageSelect}
                    />
                    {imageFile ? (
                      <div className="flex gap-2">
                        <button
                          onClick={handleUpload}
                          disabled={loadingUpload}
                          className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-slate-100 disabled:opacity-70"
                        >
                          {loadingUpload ? "Uploading..." : "Upload photo"}
                        </button>
                        <button
                          onClick={() => {
                            setImageFile(null);
                            setPreviewSource(null);
                            setUploadError("");
                          }}
                          className="rounded-lg border border-white/35 px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : null}
                    {uploadError ? (
                      <div className="error-box mt-2" role="alert" aria-live="polite">
                        {uploadError}
                      </div>
                    ) : null}
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-cyan-100">Care Identity</p>
                    <h1
                      className="mt-2 text-3xl leading-tight md:text-4xl"
                      style={{ fontFamily: 'Fraunces, "Times New Roman", serif' }}
                    >
                      {user.fullName}
                    </h1>
                    <p className="mt-1 text-sm text-cyan-100">
                      {(() => {
                        const userRoles = Array.isArray(user.roles) ? user.roles : [user.role || ""];
                        const rolesPriority = ["admin", "hospital_admin", "doctor", "user"];
                        const primaryRole = rolesPriority.find(r => userRoles.includes(r)) || "Member";
                        return primaryRole.charAt(0).toUpperCase() + primaryRole.slice(1).replace(/_/g, " ");
                      })()}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-white/15 px-3 py-1 text-cyan-100">
                        <MapPin className="mr-1 inline h-3.5 w-3.5" />
                        {locationText}
                      </span>
                      <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-emerald-100">
                        <ShieldCheck className="mr-1 inline h-3.5 w-3.5" />
                        Active account
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-full max-w-xs space-y-3">
                  <div className="rounded-xl border border-white/20 bg-white/10 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-wide text-cyan-100">
                        Profile completeness
                      </p>
                      <p className="text-sm font-semibold">{completion}%</p>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-white/15">
                      <div
                        className="h-2 rounded-full bg-emerald-300 transition-all"
                        style={{ width: `${completion}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to="/editprofile"
                      className="rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium transition hover:bg-white/20"
                    >
                      Edit profile
                    </Link>
                  </div>
                </div>
              </div>
            </header>

            <main className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                <SectionShell title="Profile Overview">
                  <div className="space-y-3">
                    <InfoTile
                      label="Member since"
                      value={new Date(user.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    />
                    {user.gender ? <InfoTile label="Gender" value={user.gender} /> : null}
                    {user.bloodGroup ? (
                      <InfoTile label="Blood Group" value={user.bloodGroup} />
                    ) : null}
                  </div>
                </SectionShell>

                <SectionShell title="Utilities">
                  <UtilitiesPanel />
                </SectionShell>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {(() => {
                  const userRoles = Array.isArray(user?.roles) ? user.roles : [user?.role || ""];
                  return userRoles.includes("user") && registrationStatus !== "approved";
                })() ? (
                  <SectionShell
                    title="Doctor Application"
                    subtitle="Apply to join Clinicall as a verified medical professional."
                  >
                    {registrationLoading ? (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                        Checking application status...
                      </div>
                    ) : registrationError ? (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                        {registrationError}
                      </div>
                    ) : registrationStatus === "pending" ? (
                      <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <div>
                          <p className="text-sm font-semibold text-amber-900">
                            Your application is under review
                          </p>
                          <p className="mt-1 text-xs text-amber-800">
                            We will notify you once the admin completes verification.
                          </p>
                        </div>
                        <span className="rounded-full bg-amber-200 px-3 py-1 text-xs font-semibold text-amber-900">
                          Pending
                        </span>
                      </div>
                    ) : registrationStatus === "rejected" ? (
                      <div className="space-y-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
                        <div>
                          <p className="text-sm font-semibold text-rose-900">
                            Your application was rejected
                          </p>
                          <p className="mt-1 text-xs text-rose-700">
                            You can update your details and reapply.
                          </p>
                        </div>
                        <Link
                          to="/doctor-registration"
                          className="inline-flex items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-amber-700"
                        >
                          Reapply as Doctor
                        </Link>
                      </div>
                    ) : (
                      <div className="flex flex-col items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            Become a verified doctor on Clinicall
                          </p>
                          <p className="mt-1 text-xs text-slate-600">
                            Submit your credentials and get verified by our admin team.
                          </p>
                        </div>
                        <Link
                          to="/doctor-registration"
                          className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                        >
                          Apply to become a Doctor
                        </Link>
                      </div>
                    )}
                  </SectionShell>
                ) : null}

                <SectionShell
                  title="Basic Information"
                  subtitle="Keep your core details current for smooth booking and communication."
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InfoTile label="Full Name" value={user.fullName} />
                    <InfoTile label="Email Address" value={user.email} />
                    <InfoTile label="Phone Number" value={user.contact} />
                    <InfoTile label="Blood Group" value={user.bloodGroup} />
                    <div className="md:col-span-2">
                      <InfoTile label="Address" value={user.address} />
                    </div>
                    <div className="md:col-span-2">
                      <InfoTile label="Emergency Contact" value={user.emergencyContact} />
                    </div>
                    <div className="md:col-span-2">
                      <InfoTile label="Date of Birth" value={user.dob ? new Date(user.dob).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null} />
                    </div>
                  </div>
                </SectionShell>

                <SectionShell
                  title="Medical Information"
                  subtitle="Read-only records currently available in your profile."
                >
                  <div className="space-y-4">
                    {userAllergies.length > 0 ? (
                      <PillList
                        title="Allergies"
                        items={userAllergies}
                        tone="amber"
                        icon={AlertTriangle}
                      />
                    ) : null}
                    {userMedications.length > 0 ? (
                      <PillList
                        title="Current Medications"
                        items={userMedications}
                        tone="cyan"
                        icon={Pill}
                      />
                    ) : null}
                    {userMedicalHistory.length > 0 ? (
                      <PillList
                        title="Medical History"
                        items={userMedicalHistory}
                        tone="slate"
                        icon={HeartPulse}
                      />
                    ) : null}
                    {userAllergies.length === 0 &&
                      userMedications.length === 0 &&
                      userMedicalHistory.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                        <UserRound className="mx-auto h-8 w-8 text-slate-400" />
                        <p className="mt-2 text-sm font-medium text-slate-700">
                          No medical records added yet
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Add details to improve personalized care suggestions.
                        </p>
                      </div>
                    ) : null}
                  </div>
                </SectionShell>

                <SectionShell title="Clinical Records (FHIR)">
                  <div className="space-y-4">
                    {/* Conditions */}
                    <div>
                      <p className="mb-3 text-sm font-semibold text-slate-700">Active Conditions</p>
                      {conditionsLoading ? (
                        <div className="flex items-center justify-center gap-2 rounded-lg bg-slate-50 p-4">
                          <Loader className="h-4 w-4 animate-spin text-slate-400" />
                          <span className="text-sm text-slate-600">Loading conditions...</span>
                        </div>
                      ) : conditions.length > 0 ? (
                        <div className="space-y-2">
                          {conditions.map((cond) => (
                            <div
                              key={cond.id}
                              className="rounded-lg border border-amber-200 bg-amber-50 p-3"
                            >
                              <p className="text-sm font-semibold text-amber-900">
                                {/* ✅ Use getFhirDisplay to safely extract code display */}
                                {getFhirDisplay(cond.code) || "Unknown Condition"}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <span className="inline-block rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-800">
                                  {cond.clinicalStatus?.coding?.[0]?.code || "unknown"}
                                </span>
                                {cond.severity && (
                                  <span className="inline-block rounded-full bg-orange-100 px-2 py-1 text-xs text-orange-800">
                                    {/* ✅ Use getFhirDisplay in case severity is an object */}
                                    {getFhirDisplay(cond.severity) || "Unspecified"}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
                          <p className="text-sm text-slate-600">No active conditions recorded</p>
                        </div>
                      )}
                    </div>

                    {/* Allergies */}
                    <div className="border-t border-slate-200 pt-4">
                      <p className="mb-3 text-sm font-semibold text-slate-700">Allergies & Intolerances</p>
                      {allergiesLoading ? (
                        <div className="flex items-center justify-center gap-2 rounded-lg bg-slate-50 p-4">
                          <Loader className="h-4 w-4 animate-spin text-slate-400" />
                          <span className="text-sm text-slate-600">Loading allergies...</span>
                        </div>
                      ) : allergies.length > 0 ? (
                        <div className="space-y-2">
                          {allergies.map((allergy) => (
                            <div
                              key={allergy.id}
                              className="rounded-lg border border-rose-200 bg-rose-50 p-3"
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-rose-900">
                                    {/* ✅ Use getFhirDisplay for substance which may be a CodeableConcept */}
                                    {getFhirDisplay(allergy.substance) || "Unknown Substance"}
                                  </p>
                                  <p className="mt-1 text-xs text-rose-700">
                                    {/* ✅ Use getFhirDisplay in case type/category are objects */}
                                    {getFhirDisplay(allergy.type) || "Unknown"} • {getFhirDisplay(allergy.category) || "Unknown"}
                                  </p>
                                </div>
                                <span
                                  className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                                    (typeof allergy.criticality === 'string' ? allergy.criticality : getFhirDisplay(allergy.criticality)) === "high"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  {/* ✅ Use getFhirDisplay in case criticality is an object */}
                                  {typeof allergy.criticality === 'string' ? allergy.criticality : getFhirDisplay(allergy.criticality) || "unknown"}
                                </span>
                              </div>
                              {allergy.reaction && allergy.reaction.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs font-medium text-rose-700">Reactions:</p>
                                  <p className="text-xs text-rose-600">
                                    {/* ✅ Extract display from CodeableConcept objects in reaction array */}
                                    {allergy.reaction
                                      .map((r) => {
                                        // r.manifestation is a CodeableConcept: { coding: [...], text: "..." }
                                        const manifestation = r.manifestation;
                                        return getFhirDisplay(manifestation);
                                      })
                                      .filter(Boolean)  // Remove empty strings
                                      .join(", ")}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
                          <p className="text-sm text-slate-600">No allergies recorded</p>
                        </div>
                      )}
                    </div>
                  </div>
                </SectionShell>

                {/* Export Records Modal */}
                {showExportModal && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Export My Records</h3>

                      {exportJob.status ? (
                        // Show export status
                        <div className="space-y-4">
                          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                            <p className="text-sm font-medium text-slate-700">Export Status:</p>
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-sm text-slate-600">
                                {exportJob.status === 'pending' && 'Starting export...'}
                                {exportJob.status === 'in-progress' && 'Processing your data...'}
                                {exportJob.status === 'completed' && '✅ Export ready for download'}
                                {exportJob.status === 'failed' && '❌ Export failed'}
                              </span>
                              {exportJob.status === 'in-progress' && (
                                <div className="w-4 h-4 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
                              )}
                            </div>
                          </div>

                          {exportJob.status === 'completed' && exportJob.outputUrls && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-slate-700">Download files:</p>
                              {Object.entries(exportJob.outputUrls).map(([resourceType, url]) => (
                                <a
                                  key={resourceType}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block p-3 border border-slate-200 rounded-lg hover:bg-cyan-50 transition text-sm font-medium text-cyan-700"
                                >
                                  📄 {resourceType}.ndjson
                                </a>
                              ))}
                            </div>
                          )}

                          {exportJob.status === 'failed' && (
                            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
                              {exportJob.error}
                            </div>
                          )}

                          <button
                            onClick={handleCancelExport}
                            className="w-full px-4 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition"
                          >
                            {exportJob.status === 'completed' ? 'Done' : 'Cancel'}
                          </button>
                        </div>
                      ) : (
                        // Show resource selection
                        <div className="space-y-4">
                          <p className="text-sm text-slate-600">
                            Select resource types to export as NDJSON files:
                          </p>

                          <div className="grid grid-cols-2 gap-3">
                            {[
                              'Patient',
                              'Condition',
                              'Observation',
                              'AllergyIntolerance',
                              'MedicationRequest',
                              'DiagnosticReport',
                              'Procedure',
                              'Immunization',
                              'DocumentReference'
                            ].map(resourceType => (
                              <label key={resourceType} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={exportResourceTypes.includes(resourceType)}
                                  onChange={() => {
                                    setExportResourceTypes(prev =>
                                      prev.includes(resourceType)
                                        ? prev.filter(r => r !== resourceType)
                                        : [...prev, resourceType]
                                    );
                                  }}
                                  className="w-4 h-4 rounded border-slate-300 text-cyan-700 focus:ring-cyan-700"
                                />
                                <span className="text-sm text-slate-700">{resourceType}</span>
                              </label>
                            ))}
                          </div>

                          <div className="flex gap-3 pt-4 border-t border-slate-200">
                            <button
                              onClick={handleStartExport}
                              disabled={exportLoading || exportResourceTypes.length === 0}
                              className="flex-1 px-4 py-2.5 bg-cyan-700 text-white font-medium rounded-xl hover:bg-cyan-800 disabled:bg-slate-400 transition flex items-center justify-center gap-2"
                            >
                              {exportLoading ? 'Starting...' : 'Start Export'}
                            </button>
                            <button
                              onClick={() => setShowExportModal(false)}
                              className="px-4 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Document Vault */}
                <DocumentVault patientId={user._id} isDoctor={false} />

                {/* Consent Manager */}
                <ConsentManager patientId={user._id} />

                {/* Access Log */}
                <AccessLogViewer patientId={user._id} />

                {/* Export Records Button Section */}
                <SectionShell title="Data Export">
                  <div className="space-y-4">
                    <p className="text-sm text-slate-700">
                      Download your complete health records in FHIR NDJSON format for portability
                      or external use.
                    </p>
                    <button
                      onClick={() => setShowExportModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-700 text-white font-medium rounded-xl hover:bg-cyan-800 transition"
                    >
                      <FileText className="w-4 h-4" />
                      Export My Records
                    </button>
                  </div>
                </SectionShell>

                <SectionShell title="Contact Snapshot">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <Mail className="h-3.5 w-3.5" />
                        Email
                      </p>
                      <p className="mt-1 text-sm text-cyan-700">{user.email || "Not set"}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <Phone className="h-3.5 w-3.5" />
                        Phone
                      </p>
                      <p className="mt-1 text-sm text-cyan-700">{user.contact || "Not set"}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 md:col-span-2">
                      <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <MapPin className="h-3.5 w-3.5" />
                        Address
                      </p>
                      <p className="mt-1 text-sm text-slate-700">{user.address || "Not set"}</p>
                    </div>
                  </div>
                </SectionShell>
              </div>
            </main>

            {uploadSuccess ? (
              <div className="fixed bottom-6 right-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 shadow">
                Profile picture updated
              </div>
            ) : null}
          </div>
        </div>
      </div>{/* end main content */}
    </div> // end outer flex
  );
};

export default MyProfile;
