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
  LayoutDashboard,
  ClipboardList,
  Calendar,
  UserCog,
  LogOut,
  Loader,
  FileText,
} from "lucide-react";
import {
  fetchUserProfile,
  updateDisplayPicture,
} from "../services/operations/Profileapi";
import { logout, getDoctorRegistrationStatus } from "../services/operations/Authapi";
import { getConditions, getAllergies, triggerExport, pollExportStatus, getPendingConsentRequests } from "../services/fhirApi";
import { getUserRequests } from "../services/operations/requestApi";
import {
  setConditions,
  setAllergies,
  setConditionsLoading,
  setAllergiesLoading,
  setConditionsError,
  setAllergiesError,
  setExportJobId,
  setExportLoading,
  updateExportJob,
  clearExportJob,
  setConsentRequests,
  setConsentRequestsLoading,
} from "../slices/fhirSlice";
import { Sidebar, SidebarBody, SidebarLinkItem } from "../components/ui/sidebar";
import ConsentManager from "../components/consent/ConsentManager";
import AccessLogViewer from "../components/consent/AccessLogViewer";
import DocumentVault from "../components/clinical/DocumentVault";


const toList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return [value];
};

const getFhirDisplay = (field) => {
  if (!field) return "";
  if (typeof field === "string") return field;
  if (typeof field === "number") return String(field);
  if (field.text) return field.text;
  if (Array.isArray(field.coding) && field.coding[0]?.display) {
    return field.coding[0].display;
  }
  if (field.display) return field.display;
  if (Array.isArray(field) && field.length > 0) {
    return getFhirDisplay(field[0]);
  }
  return "";
};

const SectionShell = ({ title, subtitle, children }) => (
  <section
    className="rounded-[20px] border bg-white p-4 sm:p-5 md:p-6 shadow-[0_16px_34px_-26px_rgba(2,6,23,0.45)]"
    style={{ borderColor: "#d9e2ec", backgroundColor: "#ffffff" }}
  >
    <h2 className="text-base sm:text-lg md:text-xl font-semibold text-slate-900 leading-tight">{title}</h2>
    {subtitle ? <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">{subtitle}</p> : null}
    <div className="mt-4 sm:mt-5 md:mt-6">{children}</div>
  </section>
);

const InfoTile = ({ label, value }) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4 md:p-5 min-h-[60px] sm:min-h-[70px] flex flex-col justify-center">
    <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">{label}</p>
    <p className="mt-0.5 sm:mt-1 text-sm sm:text-base font-semibold text-slate-800 leading-tight">{value || "Not set"}</p>
  </div>
);

const PillList = ({ items, tone = "slate", icon: Icon, title }) => {
  const tones = {
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    cyan: "border-cyan-200 bg-cyan-50 text-cyan-900",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
  };
  return (
    <div className={`rounded-xl border p-3 sm:p-4 md:p-5 ${tones[tone]}`}>
      <p className="inline-flex items-center gap-1.5 text-xs sm:text-xs font-semibold uppercase tracking-wide leading-tight">
        {Icon ? <Icon className="h-3.5 w-3.5 flex-shrink-0" /> : null}
        {title}
      </p>
      <div className="mt-2 sm:mt-3 flex flex-wrap gap-2 sm:gap-2.5">
        {items.map((item, index) => {
          const displayValue = getFhirDisplay(item);
          if (!displayValue) return null;
          return (
            <span key={`${displayValue}-${index}`} className="rounded-full bg-white px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-xs font-medium leading-tight">
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
  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [registrationError, setRegistrationError] = useState("");
  const [paidAppointmentId, setPaidAppointmentId] = useState(null);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);

  const { exportJob, exportLoading } = useSelector(state => state.fhir);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportResourceTypes, setExportResourceTypes] = useState([]);
  const [exportPollingInterval, setExportPollingInterval] = useState(null);

  useEffect(() => {
    if (token) dispatch(fetchUserProfile());
  }, [dispatch, token]);

  useEffect(() => {
    if (!user) return;
    const userRoles = Array.isArray(user.roles) ? user.roles : [user.role || ""];
    if (userRoles.includes("doctor")) {
      navigate("/doctor");
      return;
    }
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
    return () => { active = false; };
  }, [user, navigate]);

  useEffect(() => {
    return () => {
      if (exportPollingInterval) clearInterval(exportPollingInterval);
    };
  }, [exportPollingInterval]);

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
        if (active) setPaidAppointmentId(paidAppointment?._id || null);
      } catch (error) {
        console.error("Error loading appointments for profile:", error);
        if (active) setPaidAppointmentId(null);
      } finally {
        if (active) setAppointmentsLoading(false);
      }
    };
    fetchPaidAppointment();
    return () => { active = false; };
  }, [user?._id]);

  useEffect(() => {
    if (!user?._id || appointmentsLoading || !paidAppointmentId) return;
    const loadFhirData = async () => {
      try {
        dispatch(setConditionsLoading(true));
        dispatch(setAllergiesLoading(true));
        dispatch(setConditionsError(null));
        dispatch(setAllergiesError(null));
        try {
          const conditionsResponse = await getConditions(user._id, { appointmentId: paidAppointmentId });
          const conditionsList = conditionsResponse?.entry?.map((entry) => entry.resource) || [];
          dispatch(setConditions(conditionsList));
        } catch (error) {
          console.error("Error loading conditions:", error);
          dispatch(setConditions([]));
          dispatch(setConditionsError(
            error?.response?.status === 403
              ? "You don't have permission to view conditions."
              : (error.message || "Failed to load conditions.")
          ));
        }
        try {
          const allergiesResponse = await getAllergies(user._id);
          const allergiesList = allergiesResponse?.entry?.map((entry) => entry.resource) || [];
          dispatch(setAllergies(allergiesList));
        } catch (error) {
          console.error("Error loading allergies:", error);
          dispatch(setAllergies([]));
          dispatch(setAllergiesError(error.message || "Failed to load allergies."));
        }
      } finally {
        dispatch(setConditionsLoading(false));
        dispatch(setAllergiesLoading(false));
      }
    };
    loadFhirData();
  }, [user?._id, dispatch, paidAppointmentId, appointmentsLoading]);

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

  const handleStartExport = async () => {
    if (exportResourceTypes.length === 0) {
      alert('Please select at least one resource type to export');
      return;
    }
    try {
      dispatch(setExportLoading(true));
      const jobUrl = await triggerExport(user._id, exportResourceTypes);
      const jobId = jobUrl.split('/').pop();
      dispatch(setExportJobId(jobId));
      const pollInterval = setInterval(async () => {
        try {
          const status = await pollExportStatus(jobId);
          if (status.status === 'completed') {
            dispatch(updateExportJob({ status: 'completed', outputUrls: status.outputUrls }));
            clearInterval(pollInterval);
            setExportPollingInterval(null);
          } else if (status.status === 'failed') {
            dispatch(updateExportJob({ status: 'failed', error: status.error }));
            clearInterval(pollInterval);
            setExportPollingInterval(null);
          }
        } catch (error) {
          console.error('Error polling export status:', error);
        }
      }, 2000);
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
    <div className="min-h-screen flex flex-row" style={{ backgroundColor: "#f3f7fb" }}>
      {/* ── Sidebar ── */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <SidebarBody className="justify-between gap-10 h-full min-h-screen">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            <div className="flex items-center gap-2 px-2 py-4 mb-4 border-b border-slate-100">
              <div className="h-5 w-5 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex-shrink-0" />
              {sidebarOpen && (
                <span className="font-semibold text-slate-800 text-sm">Clinicall</span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              {sidebarLinks.map((link, idx) => (
                <SidebarLinkItem key={idx} link={link} />
              ))}
            </div>
          </div>
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
      <div className="flex-1 overflow-y-auto md:ml-16 lg:ml-[240px]">
        <div className="px-4 py-6 md:px-8 md:py-8" style={{ backgroundColor: "#f3f7fb" }}>
          <div className="mx-auto max-w-7xl space-y-6">

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ HEADER SECTION ━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <header className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <img
                      src={previewSource || user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || 'U')}&background=0f3b4a&color=fff&size=80`}
                      alt="Profile"
                      className="h-20 w-20 rounded-xl object-cover border-2 border-slate-200"
                    />
                    <button
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageSelect(file);
                        };
                        input.click();
                      }}
                      className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-lg border border-white shadow-sm hover:bg-blue-700 transition"
                      title="Change photo"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{user.fullName}</h1>
                    <p className="text-slate-500 text-sm mt-1">{locationText}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-emerald-100">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span className="text-sm font-medium text-slate-700">Active Patient</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    to="/editprofile"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Profile
                  </Link>
                  <button
                    onClick={() => setShowExportModal(true)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition text-sm"
                  >
                    <FileText className="w-4 h-4" />
                    Export Records
                  </button>
                </div>
              </div>

              {imageFile && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                  <span className="text-sm text-blue-700">Ready to upload new photo</span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpload}
                      disabled={loadingUpload}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                    >
                      {loadingUpload ? "Uploading..." : "Upload"}
                    </button>
                    <button
                      onClick={() => { setImageFile(null); setPreviewSource(null); setUploadError(""); }}
                      className="px-3 py-1.5 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              {uploadError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                  {uploadError}
                </div>
              )}
            </header>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ STATS CARDS ━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Member Since</p>
                <p className="mt-2 text-lg font-bold text-blue-600">
                  {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Gender</p>
                <p className="mt-2 text-lg font-bold text-slate-900">{user.gender || "—"}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Blood Group</p>
                <p className="mt-2 text-lg font-bold text-red-600">{user.bloodGroup || "—"}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Status</p>
                <p className="mt-2 text-lg font-bold text-emerald-600">Active Patient</p>
              </div>
            </div>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ TWO COLUMN LAYOUT ━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">

                {/* Basic Information */}
                <SectionShell
                  title="Basic Information"
                  subtitle="Keep your core details current for smooth booking and communication."
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InfoTile label="Full Name" value={user.fullName} />
                    <InfoTile label="Email Address" value={user.email} />
                    <InfoTile label="Phone Number" value={user.contact} />
                    <InfoTile label="Date of Birth" value={user.dob ? new Date(user.dob).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null} />
                    <div className="md:col-span-2">
                      <InfoTile label="Primary Address" value={user.address} />
                    </div>
                    <div className="md:col-span-2">
                      <InfoTile label="Emergency Contact" value={user.emergencyContact} />
                    </div>
                  </div>
                </SectionShell>

                {/* Clinical Overview */}
                <SectionShell
                  title="Clinical Overview"
                  subtitle="Your current health information"
                >
                  <div className="space-y-4">
                    {userAllergies.length > 0 ? (
                      <PillList title="Allergies" items={userAllergies} tone="amber" icon={AlertTriangle} />
                    ) : null}
                    {userMedications.length > 0 ? (
                      <PillList title="Current Medications" items={userMedications} tone="cyan" icon={Pill} />
                    ) : null}
                    {userMedicalHistory.length > 0 ? (
                      <PillList title="Medical History" items={userMedicalHistory} tone="slate" icon={HeartPulse} />
                    ) : null}
                  </div>
                </SectionShell>

                {/* Clinical Records (FHIR) */}
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
                          {conditions.map((cond, index) => (
                            <div key={cond.id ?? index} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                              <p className="text-sm font-semibold text-amber-900">
                                {getFhirDisplay(cond.code) || "Unknown Condition"}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <span className="inline-block rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-800">
                                  {cond.clinicalStatus?.coding?.[0]?.code || "unknown"}
                                </span>
                                {cond.severity && (
                                  <span className="inline-block rounded-full bg-orange-100 px-2 py-1 text-xs text-orange-800">
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
                          {allergies.map((allergy, index) => (
                            <div key={allergy.id ?? index} className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-rose-900">
                                    {getFhirDisplay(allergy.substance) || "Unknown Substance"}
                                  </p>
                                  <p className="mt-1 text-xs text-rose-700">
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
                                  {typeof allergy.criticality === 'string' ? allergy.criticality : getFhirDisplay(allergy.criticality) || "unknown"}
                                </span>
                              </div>
                              {allergy.reaction && allergy.reaction.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs font-medium text-rose-700">Reactions:</p>
                                  <p className="text-xs text-rose-600">
                                    {allergy.reaction
                                      .map((r) => getFhirDisplay(r.manifestation))
                                      .filter(Boolean)
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

                {/* Document Vault */}
                <DocumentVault patientId={user._id} isDoctor={false} />

                {/* Privacy & Data Logs */}
                <SectionShell title="Privacy & Data Logs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 font-semibold text-slate-700">Date/Time</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-700">Action</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-700">Who</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-700">Resource</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 text-slate-600">2026-03-24 10:20</td>
                          <td className="py-3 px-4 text-slate-700">Export ND-JSON</td>
                          <td className="py-3 px-4 text-slate-600">Patient (Self)</td>
                          <td className="py-3 px-4 text-slate-600">Full Record</td>
                          <td className="py-3 px-4"><span className="inline-block px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">SUCCESS</span></td>
                        </tr>
                        <tr className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 text-slate-600">2026-03-22 14:15</td>
                          <td className="py-3 px-4 text-slate-700">View Medications</td>
                          <td className="py-3 px-4 text-slate-600">Dr. Arjit Jain</td>
                          <td className="py-3 px-4 text-slate-600">Medications/Refills</td>
                          <td className="py-3 px-4"><span className="inline-block px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">SUCCESS</span></td>
                        </tr>
                        <tr className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 text-slate-600">2026-03-20 08:00</td>
                          <td className="py-3 px-4 text-slate-700">Profile_Update</td>
                          <td className="py-3 px-4 text-slate-600">Patient (Self)</td>
                          <td className="py-3 px-4 text-slate-600">Address</td>
                          <td className="py-3 px-4"><span className="inline-block px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">SUCCESS</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </SectionShell>
              </div>

              {/* Right Column */}
              <div className="space-y-6">

                {/* Doctor Application Card */}
                {(() => {
                  const userRoles = Array.isArray(user?.roles) ? user.roles : [user?.role || ""];
                  return userRoles.includes("user") && registrationStatus !== "approved";
                })() && (
                  <SectionShell
                    title="Become a verified doctor on Clinicall"
                    subtitle="Use our network of healthcare professionals and manage your practice seamlessly."
                  >
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
                      {registrationLoading ? (
                        <div className="text-center p-4">Loading status...</div>
                      ) : registrationStatus === "pending" ? (
                        <div className="space-y-3">
                          <p className="text-sm font-semibold text-slate-900">Your application is under review</p>
                          <p className="text-xs text-slate-600">We will notify you once the admin completes verification.</p>
                          <span className="inline-block rounded-full bg-amber-200 px-3 py-1 text-xs font-semibold text-amber-900">Pending</span>
                        </div>
                      ) : registrationStatus === "rejected" ? (
                        <div className="space-y-3">
                          <p className="text-sm font-semibold text-rose-900">Your application was rejected</p>
                          <p className="text-xs text-rose-700">You can update your details and reapply.</p>
                          <Link to="/doctor-registration" className="block w-full text-center px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition text-sm">
                            Reapply as Doctor
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-sm font-semibold text-slate-900">Join as a verified healthcare professional</p>
                          <p className="text-xs text-slate-600">Submit your credentials and get verified by our admin team.</p>
                          <Link to="/doctor-registration" className="block w-full text-center px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition text-sm">
                            Apply to become a Doctor
                          </Link>
                        </div>
                      )}
                    </div>
                  </SectionShell>
                )}

                {/* Consent Management */}
                <ConsentManager patientId={user._id} />

                {/* Contact Snapshot */}
                <SectionShell title="Contact Snapshot">
                  <div className="space-y-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-start gap-3">
                      <Mail className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Email</p>
                        <p className="mt-1 text-sm text-slate-700 break-all">{user.email || "Not set"}</p>
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-start gap-3">
                      <Phone className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Phone</p>
                        <p className="mt-1 text-sm text-slate-700">{user.contact || "Not set"}</p>
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Address</p>
                        <p className="mt-1 text-sm text-slate-700">{user.address || "Not set"}</p>
                      </div>
                    </div>
                  </div>
                </SectionShell>

                {/* Account Utilities */}
                <SectionShell title="Account Utilities">
                  <div className="space-y-3">
                    <button
                      onClick={() => navigate("/editprofile")}
                      className="w-full flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">🔑</span>
                        <span className="font-medium text-slate-700">Change Password</span>
                      </div>
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <button className="w-full flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition text-left">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">💬</span>
                        <span className="font-medium text-slate-700">Help & Support</span>
                      </div>
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </SectionShell>

                {/* Data Portability */}
                <SectionShell title="Data Portability">
                  <div className="space-y-3 text-sm text-slate-600">
                    <p>
                      Export your full medical record in secure FHIR ND-JSON format for third-party medical software.
                    </p>
                    <Link
                      to="#"
                      onClick={() => setShowExportModal(true)}
                      className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
                    >
                      Learn about ND-JSON
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </SectionShell>

                {/* Access Log */}
                <AccessLogViewer patientId={user._id} />
              </div>
            </main>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ EXPORT MODAL ━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {showExportModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Export My Records</h3>

                  {exportJob.status ? (
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
                    <div className="space-y-4">
                      <p className="text-sm text-slate-600">Select resource types to export as NDJSON files:</p>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          'Patient', 'Condition', 'Observation', 'AllergyIntolerance',
                          'MedicationRequest', 'DiagnosticReport', 'Procedure', 'Immunization', 'DocumentReference'
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

            {uploadSuccess ? (
              <div className="fixed bottom-6 right-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 shadow">
                Profile picture updated
              </div>
            ) : null}

          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
