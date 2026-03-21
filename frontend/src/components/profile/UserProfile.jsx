import React from "react";
import "./UserProfile.css";

const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
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

const UserProfile = ({ user = {}, profile = {}, onEditProfile }) => {
    const avatarSrc = profile?.image || user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || "User")}&background=3b82f6&color=fff&size=128`;

    return (
        <div className="stitch-profile-container bg-stitch-background text-stitch-on-background min-h-screen">
            <main className="max-w-7xl mx-auto p-6 md:p-8">
                {/* Profile Overview Header */}
                <header className="flex flex-col gap-6 mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-20 h-20 rounded-full bg-stitch-primary-fixed flex items-center justify-center border-4 border-white shadow-lg overflow-hidden shrink-0">
                                <img
                                    alt={user?.fullName || "Profile"}
                                    className="w-full h-full object-cover"
                                    src={avatarSrc}
                                />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold font-headline text-stitch-on-background tracking-tight">
                                    {user?.fullName || "Not provided"}
                                </h2>
                                <p className="text-stitch-on-surface-variant flex items-center gap-2 mt-1">
                                    <span className="material-symbols-outlined text-sm">location_on</span>
                                    {profile?.address || "Address not provided"}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 w-full sm:w-auto">
                            <button
                                onClick={onEditProfile}
                                className="flex-1 sm:flex-none bg-stitch-surface-container-high text-stitch-primary px-5 py-2.5 rounded-md font-medium text-sm transition-colors hover:bg-stitch-surface-container-highest flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[1.2rem]">edit</span>
                                Edit Profile
                            </button>
                            <button className="flex-1 sm:flex-none primary-gradient text-white px-6 py-2.5 rounded-md font-medium text-sm shadow-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-[1.2rem]">share</span>
                                Export Records
                            </button>
                        </div>
                    </div>

                    {/* Bento Grid: Top Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="bg-stitch-surface-container-lowest p-6 rounded-xl shadow-[0px_20px_40px_rgba(0,71,141,0.04)]">
                            <p className="text-stitch-on-surface-variant text-[0.6875rem] font-bold uppercase tracking-wider mb-2">Member Since</p>
                            <p className="text-lg font-headline font-bold text-stitch-primary">{formatDate(user?.createdAt) || "N/A"}</p>
                        </div>
                        <div className="bg-stitch-surface-container-lowest p-6 rounded-xl shadow-[0px_20px_40px_rgba(0,71,141,0.04)]">
                            <p className="text-stitch-on-surface-variant text-[0.6875rem] font-bold uppercase tracking-wider mb-2">Gender</p>
                            <p className="text-lg font-headline font-bold text-stitch-primary">{toTitleCase(profile?.gender) || "N/A"}</p>
                        </div>
                        <div className="bg-stitch-surface-container-lowest p-6 rounded-xl shadow-[0px_20px_40px_rgba(0,71,141,0.04)]">
                            <p className="text-stitch-on-surface-variant text-[0.6875rem] font-bold uppercase tracking-wider mb-2">Blood Group</p>
                            <p className="text-lg font-headline font-bold text-stitch-error">{profile?.bloodGroup || "N/A"}</p>
                        </div>
                        <div className="bg-stitch-surface-container-lowest p-6 rounded-xl shadow-[0px_20px_40px_rgba(0,71,141,0.04)] flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-stitch-secondary-container flex items-center justify-center">
                                <span className="material-symbols-outlined text-stitch-on-secondary-container" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                            </div>
                            <div>
                                <p className="text-stitch-on-surface-variant text-[0.6875rem] font-bold uppercase tracking-wider">Status</p>
                                <p className="text-sm font-bold text-stitch-on-secondary-container">{toTitleCase(user?.role) || "Active Patient"}</p>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Core Medical & Personal */}
                    <div className="lg:col-span-8 flex flex-col gap-8">
                        {/* Basic Information Card */}
                        <section className="bg-stitch-surface-container-lowest rounded-xl p-8 shadow-[0px_20px_40px_rgba(0,71,141,0.04)]">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-bold font-headline flex items-center gap-3">
                                    <span className="material-symbols-outlined text-stitch-primary">person</span>
                                    Basic Information
                                </h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                                <div className="border-b border-stitch-surface-container-high pb-4">
                                    <label className="text-[0.6875rem] font-bold text-stitch-on-surface-variant uppercase tracking-wider block mb-1">Full Name</label>
                                    <p className="text-sm font-medium text-stitch-on-background">{user?.fullName || "Not provided"}</p>
                                </div>
                                <div className="border-b border-stitch-surface-container-high pb-4">
                                    <label className="text-[0.6875rem] font-bold text-stitch-on-surface-variant uppercase tracking-wider block mb-1">Email</label>
                                    <p className="text-sm font-medium text-stitch-on-background">{user?.email || profile?.email || "Not provided"}</p>
                                </div>
                                <div className="border-b border-stitch-surface-container-high pb-4">
                                    <label className="text-[0.6875rem] font-bold text-stitch-on-surface-variant uppercase tracking-wider block mb-1">Phone</label>
                                    <p className="text-sm font-medium text-stitch-on-background">{user?.contact || profile?.contact || "Not provided"}</p>
                                </div>
                                <div className="border-b border-stitch-surface-container-high pb-4">
                                    <label className="text-[0.6875rem] font-bold text-stitch-on-surface-variant uppercase tracking-wider block mb-1">Date of Birth</label>
                                    <p className="text-sm font-medium text-stitch-on-background">{formatDate(profile?.dob) || "Not provided"}</p>
                                </div>
                                <div className="border-b border-stitch-surface-container-high pb-4 md:col-span-2">
                                    <label className="text-[0.6875rem] font-bold text-stitch-on-surface-variant uppercase tracking-wider block mb-1">Primary Address</label>
                                    <p className="text-sm font-medium text-stitch-on-background">{profile?.address || "Not provided"}</p>
                                </div>
                                <div className="border-b border-stitch-surface-container-high pb-4 md:col-span-2">
                                    <label className="text-[0.6875rem] font-bold text-stitch-on-surface-variant uppercase tracking-wider block mb-1">Emergency Contact</label>
                                    <p className="text-sm font-medium text-stitch-on-background">{profile?.emergencyContact || "Not provided"}</p>
                                </div>
                            </div>
                        </section>

                        {/* Medical Context Card */}
                        <section className="bg-stitch-surface-container-lowest rounded-xl p-8 shadow-[0px_20px_40px_rgba(0,71,141,0.04)]">
                            <h3 className="text-xl font-bold font-headline mb-8 flex items-center gap-3">
                                <span className="material-symbols-outlined text-stitch-primary">medical_services</span>
                                Clinical Overview
                            </h3>
                            <div className="space-y-8">
                                <div>
                                    <label className="text-[0.6875rem] font-bold text-stitch-on-surface-variant uppercase tracking-wider block mb-3">Allergies</label>
                                    <div className="flex flex-wrap gap-2">
                                        {toList(profile?.allergies).length > 0 ? (
                                            toList(profile?.allergies).map((allergy, index) => (
                                                <span key={index} className="px-3 py-1 bg-stitch-error-container text-stitch-on-error-container rounded-full text-[0.6875rem] font-bold">
                                                    {allergy}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-sm text-stitch-on-surface-variant italic">No allergies recorded</span>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="bg-stitch-surface-container-low p-5 rounded-lg">
                                        <label className="text-[0.6875rem] font-bold text-stitch-on-surface-variant uppercase tracking-wider block mb-2">Current Medications</label>
                                        {toList(profile?.medications).length > 0 ? (
                                            toList(profile?.medications).map((med, index) => (
                                                <div key={index} className="mb-2">
                                                    <p className="text-sm font-semibold text-stitch-primary">{med}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <span className="text-sm text-stitch-on-surface-variant italic">No medications recorded</span>
                                        )}
                                    </div>
                                    <div className="bg-stitch-surface-container-low p-5 rounded-lg">
                                        <label className="text-[0.6875rem] font-bold text-stitch-on-surface-variant uppercase tracking-wider block mb-2">Medical History</label>
                                        {toList(profile?.medicalHistory).length > 0 ? (
                                            toList(profile?.medicalHistory).map((history, index) => (
                                                <div key={index} className="mb-2">
                                                    <p className="text-sm font-semibold text-stitch-on-background">{history}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <span className="text-sm text-stitch-on-surface-variant italic">No history recorded</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Clinical Records (FHIR) placeholder */}
                        <section className="bg-stitch-surface-container-lowest rounded-xl overflow-hidden shadow-[0px_20px_40px_rgba(0,71,141,0.04)]">
                            <div className="px-8 py-6 bg-stitch-surface-container-high flex justify-between items-center">
                                <h3 className="text-sm font-bold font-headline uppercase tracking-widest text-stitch-on-surface">Clinical Records</h3>
                                <span className="px-2 py-0.5 bg-stitch-primary-fixed text-stitch-on-primary-fixed-variant rounded text-[0.6rem] font-bold">SECURE</span>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="pt-4">
                                    <h4 className="text-[0.6875rem] font-bold text-stitch-on-surface-variant uppercase tracking-wider mb-4">My Documents</h4>
                                    <div className="bg-stitch-surface-container-low p-10 rounded-xl text-center">
                                        <span className="material-symbols-outlined text-4xl text-stitch-outline-variant mb-2 block">folder_open</span>
                                        <p className="text-sm text-stitch-on-surface-variant">No documents found. Upload your medical reports to manage them here.</p>
                                        <button className="mt-4 text-stitch-primary text-xs font-bold hover:underline">Upload Document</button>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Actions & Utilities */}
                    <div className="lg:col-span-4 flex flex-col gap-8">
                        {/* Snapshot Card */}
                        <section className="bg-stitch-surface-container-lowest p-8 rounded-xl shadow-[0px_20px_40px_rgba(0,71,141,0.04)] border-t-4 border-stitch-primary">
                            <h3 className="text-lg font-bold font-headline mb-6">Contact Snapshot</h3>
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-stitch-surface-container-high flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-stitch-primary text-xl">mail</span>
                                    </div>
                                    <div>
                                        <p className="text-[0.6875rem] font-bold text-stitch-on-surface-variant uppercase tracking-wider">Email</p>
                                        <p className="text-sm font-medium">{user?.email || profile?.email || "Not provided"}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-stitch-surface-container-high flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-stitch-primary text-xl">call</span>
                                    </div>
                                    <div>
                                        <p className="text-[0.6875rem] font-bold text-stitch-on-surface-variant uppercase tracking-wider">Phone</p>
                                        <p className="text-sm font-medium">{user?.contact || profile?.contact || "Not provided"}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-stitch-surface-container-high flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-stitch-primary text-xl">location_on</span>
                                    </div>
                                    <div>
                                        <p className="text-[0.6875rem] font-bold text-stitch-on-surface-variant uppercase tracking-wider">Address</p>
                                        <p className="text-sm font-medium">{profile?.address || "Not provided"}</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Utilities */}
                        <section className="bg-stitch-surface-container-lowest p-8 rounded-xl shadow-[0px_20px_40px_rgba(0,71,141,0.04)]">
                            <h3 className="text-lg font-bold font-headline mb-6">Account Utilities</h3>
                            <div className="space-y-2">
                                <button className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-stitch-surface-container-low transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <span className="material-symbols-outlined text-stitch-on-surface-variant group-hover:text-stitch-primary transition-colors">lock_reset</span>
                                        <span className="text-sm font-medium">Change Password</span>
                                    </div>
                                    <span className="material-symbols-outlined text-stitch-outline-variant">chevron_right</span>
                                </button>
                                <button className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-stitch-surface-container-low transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <span className="material-symbols-outlined text-stitch-on-surface-variant group-hover:text-stitch-primary transition-colors">contact_support</span>
                                        <span className="text-sm font-medium">Help & Support</span>
                                    </div>
                                    <span className="material-symbols-outlined text-stitch-outline-variant">chevron_right</span>
                                </button>
                            </div>
                        </section>

                        {/* Export Records Footer */}
                        <div className="p-6 bg-stitch-surface-container-low rounded-xl">
                            <h4 className="text-sm font-bold mb-2">Data Portability</h4>
                            <p className="text-xs text-stitch-on-surface-variant mb-4">Export your full medical record securely for third-party software.</p>
                            <button className="text-stitch-primary text-xs font-bold flex items-center gap-1 hover:translate-x-1 transition-transform">
                                Learn about the formats
                                <span className="material-symbols-outlined text-sm">open_in_new</span>
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default UserProfile;
