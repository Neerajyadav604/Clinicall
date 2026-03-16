import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DoctorLayout from "../../components/DoctorLayout";
import { getDoctorProfile, updateDoctorProfile, uploadDoctorProfileImage } from "../../services/doctorApi";
import { toast } from "react-toastify";

/**
 * DoctorEditProfile Component
 * Allows doctors to edit their profile information and upload a new profile picture
 */
const DoctorEditProfile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [imageError, setImageError] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    contact: "",
    specialization: "",
    qualification: "",
    experienceYears: "",
    licenseNumber: "",
    hospitalName: "",
    documents: "",
    image: null,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchDoctorProfile = async () => {
      try {
        setLoading(true);
        const response = await getDoctorProfile();
        const doctorData = response.data || response.user || response;
        setProfile(doctorData);

        // Populate form data
        setFormData({
          fullName: doctorData?.fullName || "",
          email: doctorData?.email || "",
          contact: doctorData?.contact || "",
          specialization: doctorData?.specialization || "",
          qualification: doctorData?.qualification || "",
          experienceYears: doctorData?.experienceYears || "",
          licenseNumber: doctorData?.licenseNumber || "",
          hospitalName: doctorData?.hospitalName || "",
          documents: Array.isArray(doctorData?.documents)
            ? doctorData.documents.join("\n")
            : doctorData?.documents || "",
          image: null,
        });

        // Set image preview if exists
        if (doctorData?.image) {
          setImagePreview(doctorData.image);
        }
      } catch (error) {
        console.error("Error fetching doctor profile:", error);
        setLoadError("Failed to load profile for editing.");
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorProfile();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (formError) setFormError("");
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imageError) setImageError("");
    if (formError) setFormError("");

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setImageError("Please select a valid image file.");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setImageError("Image size should be less than 5MB.");
      return;
    }

    setFormData((prev) => ({ ...prev, image: file }));

    // Create preview
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);

    if (errors.image) {
      setErrors((prev) => ({ ...prev, image: "" }));
    }
  };

  const validateForm = () => {
    const err = {};

    if (!formData.fullName.trim()) {
      err.fullName = "Full name is required";
    }

    if (!formData.email.trim()) {
      err.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      err.email = "Enter a valid email";
    }

    if (!formData.contact.trim()) {
      err.contact = "Contact is required";
    }

    if (!formData.specialization.trim()) {
      err.specialization = "Specialization is required";
    }

    if (!formData.licenseNumber.trim()) {
      err.licenseNumber = "License number is required";
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setFormError("Please fill in all required fields.");
      return;
    }

    try {
      setFormError("");
      setSubmitting(true);
      const toastId = toast.loading("Updating profile...");

      // Prepare update data (without image)
      const updateData = {
        fullName: formData.fullName,
        email: formData.email,
        contact: formData.contact,
        specialization: formData.specialization,
        qualification: formData.qualification,
        experienceYears: formData.experienceYears ? parseInt(formData.experienceYears) : 0,
        licenseNumber: formData.licenseNumber,
        hospitalName: formData.hospitalName,
        documents: formData.documents
          ? formData.documents.split("\n").filter((doc) => doc.trim())
          : [],
      };

      // Handle image upload separately if new image selected
      let updatedProfile = { ...profile };
      if (formData.image) {
        try {
          console.log("Uploading image...");
          const imageResponse = await uploadDoctorProfileImage(formData.image);
          console.log("Image upload response:", imageResponse);
          
          if (imageResponse.success && imageResponse.data?.image) {
            const imageUrl = imageResponse.data.image;
            console.log("Image uploaded successfully:", imageUrl);
            
            // ✅ UPDATE PROFILE STATE IMMEDIATELY
            updatedProfile.image = imageUrl;
            setProfile(updatedProfile);
            
            // ✅ UPDATE IMAGE PREVIEW WITH CACHE BUSTING
            setImagePreview(`${imageUrl}?t=${Date.now()}`);
            
            // Update form data for subsequent save
            updateData.image = imageUrl;
          } else {
            throw new Error(imageResponse.message || "Image upload failed");
          }
        } catch (imageError) {
          console.error("Image upload error:", imageError);
          setImageError(`Image upload failed: ${imageError.message}`);
          return; // Stop if image upload fails
        }
      }

      const response = await updateDoctorProfile(updateData);

      if (response.success) {
        // Update localStorage with new profile data
        if (response.data) {
          localStorage.setItem("doctorProfile", JSON.stringify(response.data));
        }

        toast.dismiss(toastId);
        toast.success("Profile updated successfully! ✅");
        
        // Redirect after a short delay to show toast
        setTimeout(() => {
          navigate("/doctor/profile");
        }, 1500);
      } else {
        throw new Error(response.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setFormError(error.message || "Failed to update profile");
    } finally {
      setSubmitting(false);
      toast.dismiss();
    }
  };

  if (loading) {
    return (
      <DoctorLayout>
        <div className="animate-pulse space-y-6">
          <div className="bg-gray-200 h-96 rounded-lg"></div>
        </div>
      </DoctorLayout>
    );
  }

  if (loadError) {
    return (
      <DoctorLayout>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="error-box" role="alert" aria-live="polite">
            {loadError}
          </div>
          <button
            type="button"
            onClick={() => navigate("/doctor/profile")}
            className="mt-4 px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Back to Profile
          </button>
        </div>
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout>
      <div className="space-y-6">
        {/* Page Title */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
          <p className="text-gray-600 mt-2">
            Update your professional information and profile picture
          </p>
        </div>
        {formError ? (
          <div className="error-box" role="alert" aria-live="polite">
            {formError}
          </div>
        ) : null}

        {/* Edit Profile Form */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Picture Section */}
              <div className="flex flex-col items-center py-6 border-b">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-400 shadow-xl">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-300 to-blue-500 flex items-center justify-center text-white text-4xl font-bold">
                        {formData.fullName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase() || "DR"}
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </button>
                </div>
                <p className="text-gray-600 text-sm mt-3">
                  Click the camera icon to change your profile picture
                </p>
                {imageError ? (
                  <div className="error-box mt-3" role="alert" aria-live="polite">
                    {imageError}
                  </div>
                ) : null}
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.fullName ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter your full name"
                  />
                  {errors.fullName && (
                    <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.email ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="john@hospital.com"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Contact */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="contact"
                    value={formData.contact}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.contact ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="+1 (555) 000-0000"
                  />
                  {errors.contact && (
                    <p className="text-red-500 text-sm mt-1">{errors.contact}</p>
                  )}
                </div>

                {/* Specialization */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Specialization <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.specialization ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Cardiology"
                  />
                  {errors.specialization && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.specialization}
                    </p>
                  )}
                </div>

                {/* Qualification */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Educational Qualification
                  </label>
                  <input
                    type="text"
                    name="qualification"
                    value={formData.qualification}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="MD, PhD"
                  />
                </div>

                {/* Experience Years */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    name="experienceYears"
                    value={formData.experienceYears}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="10"
                  />
                </div>

                {/* License Number */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    License Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.licenseNumber ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="MED-123456-2024"
                  />
                  {errors.licenseNumber && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.licenseNumber}
                    </p>
                  )}
                </div>

                {/* Hospital Name */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Hospital / Clinic Name
                  </label>
                  <input
                    type="text"
                    name="hospitalName"
                    value={formData.hospitalName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="City Hospital"
                  />
                </div>
              </div>

              {/* Documents URLs */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Verification Documents Links
                </label>
                <textarea
                  name="documents"
                  value={formData.documents}
                  onChange={handleChange}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="https://drive.google.com/..."
                />
                <p className="text-gray-500 text-sm mt-2">
                  Enter one URL per line for your medical credentials and certifications
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-end pt-6 border-t">
                <button
                  type="button"
                  onClick={() => navigate("/doctor/profile")}
                  className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-6 py-3 font-semibold rounded-lg text-white transition-all ${
                    submitting
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-5 w-5"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Updating...
                    </span>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DoctorLayout>
  );
};

export default DoctorEditProfile;
