import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DoctorLayout from "../../components/DoctorLayout";
import { getDoctorProfile } from "../../services/doctorApi";
import { toast } from "react-toastify";

/**
 * DoctorProfile Component
 * Displays the doctor's full profile information
 */
const DoctorProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchDoctorProfile = async () => {
      try {
        setLoading(true);
        const response = await getDoctorProfile();
        
        // The response structure depends on backend, adjust accordingly
        const doctorData = response.data || response.user || response;
        setProfile(doctorData);
      } catch (error) {
        console.error("Error fetching doctor profile:", error);
        toast.error("Failed to load doctor profile");
        
        // Fallback: try to get from localStorage
        try {
          const userData = localStorage.getItem("user");
          if (userData) {
            setProfile(JSON.parse(userData));
          }
        } catch (e) {
          setProfile(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorProfile();

    // Optional: Refresh profile when returning from edit page
    const unsubscribe = window.addEventListener('focus', () => {
      fetchDoctorProfile();
    });

    return () => window.removeEventListener('focus', unsubscribe);
  }, []);

  if (loading) {
    return (
      <DoctorLayout>
        <div className="animate-pulse">
          <div className="bg-gray-200 h-96 rounded-lg"></div>
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

  return (
    <DoctorLayout>
      <div className="space-y-6">
        {/* Page Title */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-2">
            View and manage your professional information
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Banner */}
          <div className="h-32 bg-gradient-to-r from-blue-600 to-blue-800"></div>

          {/* Profile Content */}
          <div className="px-6 pb-6">
            {/* Profile Photo and Basic Info */}
            <div className="flex flex-col md:flex-row md:items-end md:space-x-6 -mt-16 mb-6">
              {/* Profile Photo */}
              <div className="flex-shrink-0">
                <div className="w-32 h-32 bg-blue-100 rounded-lg border-4 border-white shadow-lg flex items-center justify-center text-blue-600 text-4xl font-bold">
                  {profile?.image ? (
                    <img
                      src={`${profile.image}?t=${Date.now()}`}
                      alt="Profile"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    (profile?.fullName || "DR").charAt(0).toUpperCase()
                  )}
                </div>
              </div>

              {/* Name and Title */}
              <div className="flex-1 mt-4 md:mt-0">
                <h2 className="text-3xl font-bold text-gray-900">
                  {profile?.fullName || "Doctor"}
                </h2>
                <p className="text-lg text-blue-600 font-semibold">
                  {profile?.specialization || "Medical Professional"}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    Verified Doctor
                  </span>
                </div>
              </div>
            </div>

            {/* Edit Button */}
            <div className="flex justify-end mb-6">
              <button 
                onClick={() => navigate("/doctor/edit-profile")}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Edit Profile
              </button>
            </div>

            {/* Profile Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Information */}
              <div className="border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Contact Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-500 text-sm">Email</p>
                    <p className="text-gray-900 font-medium">
                      {profile?.email || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Phone Number</p>
                    <p className="text-gray-900 font-medium">
                      {profile?.contact || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className="border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Professional Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-500 text-sm">Specialization</p>
                    <p className="text-gray-900 font-medium">
                      {profile?.specialization || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Experience</p>
                    <p className="text-gray-900 font-medium">
                      {profile?.experienceYears
                        ? `${profile.experienceYears} years`
                        : "Not specified"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Credentials */}
              <div className="border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Credentials
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-500 text-sm">License Number</p>
                    <p className="text-gray-900 font-medium">
                      {profile?.licenseNumber || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Qualification</p>
                    <p className="text-gray-900 font-medium">
                      {profile?.qualification || "Not specified"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Clinic Information */}
              <div className="border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Clinic / Hospital
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-500 text-sm">Institution Name</p>
                    <p className="text-gray-900 font-medium">
                      {profile?.hospitalName || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Address</p>
                    <p className="text-gray-900 font-medium">
                      {profile?.address || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Details Section */}
            {profile?.documents && profile.documents.length > 0 && (
              <div className="mt-6 border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Uploaded Documents
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {profile.documents.map((doc, index) => (
                    <a
                      key={index}
                      href={doc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="text-center">
                        <svg
                          className="w-8 h-8 text-gray-400 mx-auto mb-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <p className="text-sm text-gray-600">Document {index + 1}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Verification Status */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-blue-600 mt-0.5 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11-1h2v2H7V4zm2 4H7v2h2V8zm2-4h2v2h-2V4zm2 4h-2v2h2V8z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-blue-900">
                    Account Status: {profile?.verificationStatus || "PENDING"}
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    {profile?.verificationStatus === "APPROVED"
                      ? "Your account is verified and active."
                      : "Your account is pending verification. Please wait for admin approval."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DoctorLayout>
  );
};

export default DoctorProfile;
