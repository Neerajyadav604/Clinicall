import React, { useState, useCallback } from "react";
import "./UserProfile.css";
import {
    MapPin, Mail, Phone, Calendar, Cake, User2,
    Droplet, Eye, EyeOff, Camera, MoreVertical,
    Pencil, Link2, Phone as PhoneIcon, Shield,
    AlertTriangle, ClipboardList, Pill,
    CheckCircle,
} from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const toTitleCase = (str) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const toList = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean);
    return [value];
};

const NotProvided = () => <span className="not-provided">Not provided</span>;

// ─── Chip ────────────────────────────────────────────────────────────────────

const Chip = ({ label, color = "blue" }) => (
    <span className={`chip chip--${color}`}>{label}</span>
);

// ─── Meta Pill ────────────────────────────────────────────────────────────────

const MetaPill = ({ icon: Icon, label, color = "blue", masked = false, revealed = false, onReveal }) => {
    const colorMap = {
        blue: "bg-blue-50   text-blue-700   border-blue-200",
        teal: "bg-teal-50   text-teal-700   border-teal-200",
        purple: "bg-purple-50 text-purple-700 border-purple-200",
        orange: "bg-orange-50 text-orange-700 border-orange-200",
        indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
        red: "bg-red-50    text-red-700    border-red-200",
    };

    return (
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${colorMap[color] || colorMap.blue}`}>
            <Icon className="h-3.5 w-3.5 flex-shrink-0" />
            {masked ? (
                <span className={revealed ? "revealed-value" : "masked-value"}>
                    {revealed ? label : "••••••••"}
                </span>
            ) : (
                <span>{label || <NotProvided />}</span>
            )}
            {masked && (
                <button onClick={onReveal} className="ml-1 opacity-60 hover:opacity-100 transition-opacity">
                    {revealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </button>
            )}
        </div>
    );
};

// ─── Masked Field ─────────────────────────────────────────────────────────────

const MaskedField = ({ value, fieldKey, revealed, onToggle }) => {
    if (!value) return <NotProvided />;
    return (
        <div className="flex items-center gap-2">
            <span className={revealed[fieldKey] ? "revealed-value" : "masked-value"}>
                {revealed[fieldKey] ? value : "••••••••••••••"}
            </span>
            <button
                onClick={() => onToggle(fieldKey)}
                className="text-gray-400 hover:text-gray-700 transition-colors"
                aria-label={revealed[fieldKey] ? "Hide" : "Show"}
            >
                {revealed[fieldKey] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
        </div>
    );
};

// ─── Chip List ────────────────────────────────────────────────────────────────

const ChipList = ({ items, color, fieldKey, revealed, onToggle, masked = false }) => {
    const list = toList(items);
    if (!list.length) return <p className="not-provided">None recorded</p>;

    if (masked && !revealed[fieldKey]) {
        return (
            <div className="flex items-center gap-2">
                <span className="masked-value">••••••••••••</span>
                <button onClick={() => onToggle(fieldKey)} className="text-gray-400 hover:text-gray-700 transition-colors">
                    <Eye className="h-4 w-4" />
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-wrap gap-2">
            {list.map((item, i) => (
                <Chip key={i} label={item} color={color} />
            ))}
            {masked && (
                <button onClick={() => onToggle(fieldKey)} className="text-gray-400 hover:text-gray-700 transition-colors ml-1">
                    <EyeOff className="h-4 w-4" />
                </button>
            )}
        </div>
    );
};

// ─── Info Card ────────────────────────────────────────────────────────────────

const InfoCard = ({ icon: Icon, iconBg, title, children }) => (
    <div className="rounded-2xl bg-white shadow-md p-5 border border-gray-100 flex flex-col gap-3">
        <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                <Icon className="h-4.5 w-4.5" />
            </div>
            <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        </div>
        <div className="pl-12">{children}</div>
    </div>
);

// ─── UserProfile ──────────────────────────────────────────────────────────────

const UserProfile = ({ user = {}, profile = {}, onEditProfile }) => {
    const [revealed, setRevealed] = useState({});

    const toggleReveal = useCallback((key) => {
        setRevealed((prev) => ({ ...prev, [key]: !prev[key] }));
    }, []);

    const copyLink = () => {
        const url = `${window.location.origin}/profile`;
        navigator.clipboard.writeText(url).then(() => alert("Profile link copied!"));
    };

    // Avatar: prefer profile image, then user image, then placeholder
    const avatarSrc =
        profile?.image ||
        user?.image ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || "User")}&background=3b82f6&color=fff&size=128`;

    const insurance = profile?.insurance || {};

    return (
        <div className="user-profile-root min-h-screen bg-gray-50 pb-12">

            {/* ── Cover Banner ── */}
            <div className="relative w-full">
                <div className="cover-banner w-full h-44 rounded-b-3xl relative overflow-hidden">
                    {/* Top-right controls */}
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                        <button className="bg-white/70 backdrop-blur-sm hover:bg-white text-gray-600 rounded-full p-2 transition-all shadow">
                            <Camera className="h-4 w-4" />
                        </button>
                        <button className="bg-white/70 backdrop-blur-sm hover:bg-white text-gray-600 rounded-full p-2 transition-all shadow">
                            <MoreVertical className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Decorative dots */}
                    <div className="absolute bottom-6 right-8 w-12 h-12 rounded-full border-4 border-white/30 opacity-40" />
                    <div className="absolute top-10 left-1/2 w-20 h-20 rounded-full border-4 border-blue-300/20 opacity-30" />
                </div>

                {/* Avatar overlapping banner */}
                <div className="avatar-wrapper">
                    <div className="relative">
                        <img
                            src={avatarSrc}
                            alt={user?.fullName || "Profile"}
                            className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
                            onError={(e) => {
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || "U")}&background=3b82f6&color=fff&size=128`;
                            }}
                        />
                        <button className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1.5 shadow-md hover:bg-blue-700 transition-colors">
                            <Camera className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Content container ── */}
            <div className="max-w-2xl mx-auto px-4 pt-16 space-y-5">

                {/* ── Identity Row ── */}
                <div className="flex items-start justify-between flex-wrap gap-3 pt-2">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {user?.fullName || <NotProvided />}
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {toTitleCase(user?.role) || "Patient"} &nbsp;·&nbsp; Clinicall Healthcare
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                            onClick={onEditProfile}
                            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-full transition-all shadow-md"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit Profile
                        </button>
                        <button
                            onClick={copyLink}
                            className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-600 text-xs font-semibold px-3 py-2 rounded-full border border-gray-200 transition-all shadow-sm"
                        >
                            <Link2 className="h-3.5 w-3.5" />
                            Copy Link
                        </button>
                    </div>
                </div>

                {/* ── Meta Pills ── */}
                <div className="flex flex-wrap gap-2">
                    <MetaPill
                        icon={MapPin}
                        label={profile?.address}
                        color="blue"
                        masked
                        revealed={revealed["address"]}
                        onReveal={() => toggleReveal("address")}
                    />
                    <MetaPill icon={Mail} label={user?.email} color="blue" />
                    <MetaPill icon={Phone} label={user?.contact} color="teal" />
                    <MetaPill
                        icon={Calendar}
                        label={`Joined ${formatDate(user?.createdAt)}`}
                        color="purple"
                    />
                    {profile?.dob && (
                        <MetaPill icon={Cake} label={formatDate(profile.dob)} color="orange" />
                    )}
                    {profile?.gender && (
                        <MetaPill icon={User2} label={toTitleCase(profile.gender)} color="indigo" />
                    )}
                    {profile?.bloodGroup && (
                        <MetaPill icon={Droplet} label={profile.bloodGroup} color="red" />
                    )}
                </div>

                {/* ── About ── */}
                <div className="bg-white rounded-2xl shadow-md p-5 border border-gray-100">
                    <h2 className="text-base font-semibold text-gray-800 mb-2">About</h2>
                    <p className="text-sm text-gray-500 leading-relaxed">
                        {profile?.bio ||
                            "Healthcare professional actively managing appointments and medical records through Clinicall. Committed to health-first living and proactive wellness."}
                    </p>
                    <hr className="mt-4 border-gray-100" />
                </div>

                {/* ── Medical Info Grid ── */}
                <div>
                    <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                        Medical Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* Emergency Contact */}
                        <InfoCard icon={PhoneIcon} iconBg="bg-red-50 text-red-600" title="Emergency Contact">
                            <MaskedField
                                value={profile?.emergencyContact}
                                fieldKey="emergencyContact"
                                revealed={revealed}
                                onToggle={toggleReveal}
                            />
                        </InfoCard>

                        {/* Insurance */}
                        <InfoCard icon={Shield} iconBg="bg-blue-50 text-blue-600" title="Insurance">
                            <div className="space-y-1">
                                <p className="text-xs text-gray-400 mb-1">Provider</p>
                                <MaskedField
                                    value={insurance?.provider}
                                    fieldKey="insuranceProvider"
                                    revealed={revealed}
                                    onToggle={toggleReveal}
                                />
                                <p className="text-xs text-gray-400 mt-2 mb-1">Policy Number</p>
                                <MaskedField
                                    value={insurance?.policyNumber}
                                    fieldKey="insurancePolicy"
                                    revealed={revealed}
                                    onToggle={toggleReveal}
                                />
                            </div>
                        </InfoCard>

                        {/* Allergies */}
                        <InfoCard icon={AlertTriangle} iconBg="bg-red-50 text-red-600" title="Allergies">
                            <ChipList
                                items={profile?.allergies}
                                color="red"
                                fieldKey="allergies"
                                revealed={revealed}
                                onToggle={toggleReveal}
                                masked={false}
                            />
                        </InfoCard>

                        {/* Medical History */}
                        <InfoCard icon={ClipboardList} iconBg="bg-blue-50 text-blue-600" title="Medical History">
                            <ChipList
                                items={profile?.medicalHistory}
                                color="blue"
                                fieldKey="medicalHistory"
                                revealed={revealed}
                                onToggle={toggleReveal}
                                masked={true}
                            />
                        </InfoCard>

                        {/* Medications */}
                        <InfoCard icon={Pill} iconBg="bg-green-50 text-green-600" title="Current Medications">
                            <ChipList
                                items={profile?.medications}
                                color="green"
                                fieldKey="medications"
                                revealed={revealed}
                                onToggle={toggleReveal}
                                masked={true}
                            />
                        </InfoCard>

                        {/* Quick Stats card */}
                        <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-md p-5 text-white flex flex-col gap-3">
                            <h3 className="text-sm font-semibold opacity-90">Quick Stats</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: "Blood Group", value: profile?.bloodGroup },
                                    { label: "Gender", value: toTitleCase(profile?.gender) },
                                    { label: "DOB", value: formatDate(profile?.dob) },
                                    { label: "Role", value: toTitleCase(user?.role) },
                                ].map(({ label, value }) => (
                                    <div key={label} className="bg-white/15 rounded-xl p-2.5">
                                        <p className="text-[10px] uppercase tracking-wide opacity-70">{label}</p>
                                        <p className="text-sm font-bold mt-0.5">{value || "—"}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
