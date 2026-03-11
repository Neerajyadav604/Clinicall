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
} from "lucide-react";
import {
  fetchUserProfile,
  updateDisplayPicture,
  updateUserProfile,
} from "../services/operations/Profileapi";
import AvatarUploader from "../components/profile/AvatarUploader";
import UtilitiesPanel from "../components/profile/UtilitiesPanel";
import { Sidebar, SidebarBody, SidebarLinkItem } from "../components/ui/sidebar";
import { getDoctorRegistrationStatus, logout } from "../services/operations/Authapi";


const toList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return [value];
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
        {items.map((item, index) => (
          <span key={`${item}-${index}`} className="rounded-full bg-white px-3 py-1 text-xs">
            {item}
          </span>
        ))}
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

  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [previewSource, setPreviewSource] = useState(null);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [registrationError, setRegistrationError] = useState("");

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName || "",
        email: user.email || "",
        contact: user.contact || "",
        address: user.address || "",
        emergencyContact: user.emergencyContact || "",
        bloodGroup: user.bloodGroup || "",
      });
    }
  }, [user]);

  useEffect(() => {
    if (token) dispatch(fetchUserProfile());
  }, [dispatch, token]);

  useEffect(() => {
    if (!user) return;
    const role = user.role?.toLowerCase();
    if (role === "doctor") {
      navigate("/doctor");
      return;
    }
    if (role !== "user") return;

    let active = true;
    const loadStatus = async () => {
      setRegistrationLoading(true);
      setRegistrationError("");
      try {
        const res = await getDoctorRegistrationStatus();
        const status = res?.data?.status || res?.status || "NONE";
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

  useEffect(() => {
    if (registrationStatus === "APPROVED") {
      navigate("/doctor");
    }
  }, [registrationStatus, navigate]);

  const locationText = useMemo(() => {
    if (!user?.address) return "Location not set";
    return user.address.split(",").slice(-2).join(",").trim();
  }, [user]);

  const completion = useMemo(() => {
    const required = [
      form.fullName,
      form.email,
      form.contact,
      form.address,
      form.emergencyContact,
      form.bloodGroup,
    ];
    const filled = required.filter((item) => String(item || "").trim()).length;
    return Math.round((filled / required.length) * 100);
  }, [form]);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleImageSelect = (file) => {
    setImageFile(file);
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreviewSource(reader.result);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!imageFile) return;
    setLoadingUpload(true);
    try {
      const data = new FormData();
      data.append("displayPicture", imageFile);
      await dispatch(updateDisplayPicture(token, data));
      setUploadSuccess(true);
      setImageFile(null);
      setPreviewSource(null);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingUpload(false);
    }
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.fullName?.trim()) nextErrors.fullName = "Required";
    if (!form.email?.trim()) nextErrors.email = "Required";
    if (!form.contact?.trim()) nextErrors.contact = "Required";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await dispatch(updateUserProfile(token, { ...form }));
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
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

  const allergies = toList(user.allergies);
  const medications = toList(user.medications);
  const medicalHistory = toList(user.medicalHistory);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[var(--page)]">
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
      <div className="flex-1 overflow-y-auto">
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
                          }}
                          className="rounded-lg border border-white/35 px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          Cancel
                        </button>
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
                    <p className="mt-1 text-sm text-cyan-100">{user.role || "Member"}</p>
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
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:opacity-70"
                    >
                      {saving ? "Saving..." : "Save changes"}
                    </button>
                  </div>
                </div>
              </div>
            </header>

            <main className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <aside className="space-y-6">
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
                    {form.bloodGroup ? (
                      <InfoTile label="Blood Group" value={form.bloodGroup} />
                    ) : null}
                  </div>
                </SectionShell>

                <SectionShell title="Utilities">
                  <UtilitiesPanel />
                </SectionShell>
              </aside>

              <div className="space-y-6 lg:col-span-2">
                {user?.role?.toLowerCase() === "user" ? (
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
                    ) : registrationStatus === "PENDING" ? (
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
                    ) : registrationStatus === "APPROVED" ? (
                      <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                        <div>
                          <p className="text-sm font-semibold text-emerald-900">
                            Your application has been approved
                          </p>
                          <p className="mt-1 text-xs text-emerald-800">
                            Redirecting you to the doctor dashboard.
                          </p>
                        </div>
                        <span className="rounded-full bg-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-900">
                          Approved
                        </span>
                      </div>
                    ) : registrationStatus === "REJECTED" ? (
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
                          className="inline-flex items-center justify-center rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-700"
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
                    <InputField
                      label="Full Name"
                      name="fullName"
                      value={form.fullName}
                      onChange={handleProfileChange}
                      error={errors.fullName}
                    />
                    <InputField
                      label="Email Address"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleProfileChange}
                      error={errors.email}
                    />
                    <InputField
                      label="Phone Number"
                      name="contact"
                      value={form.contact}
                      onChange={handleProfileChange}
                      error={errors.contact}
                    />
                    <InputField
                      label="Blood Group"
                      name="bloodGroup"
                      value={form.bloodGroup}
                      onChange={handleProfileChange}
                    />
                    <div className="md:col-span-2">
                      <InputField
                        label="Address"
                        name="address"
                        value={form.address}
                        onChange={handleProfileChange}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <InputField
                        label="Emergency Contact"
                        name="emergencyContact"
                        value={form.emergencyContact}
                        onChange={handleProfileChange}
                        placeholder="Name and phone number"
                      />
                    </div>
                  </div>
                </SectionShell>

                <SectionShell
                  title="Medical Information"
                  subtitle="Read-only records currently available in your profile."
                >
                  <div className="space-y-4">
                    {allergies.length > 0 ? (
                      <PillList
                        title="Allergies"
                        items={allergies}
                        tone="amber"
                        icon={AlertTriangle}
                      />
                    ) : null}
                    {medications.length > 0 ? (
                      <PillList
                        title="Current Medications"
                        items={medications}
                        tone="cyan"
                        icon={Pill}
                      />
                    ) : null}
                    {medicalHistory.length > 0 ? (
                      <PillList
                        title="Medical History"
                        items={medicalHistory}
                        tone="slate"
                        icon={HeartPulse}
                      />
                    ) : null}
                    {allergies.length === 0 &&
                      medications.length === 0 &&
                      medicalHistory.length === 0 ? (
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
