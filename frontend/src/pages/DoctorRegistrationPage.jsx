import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { doctorRegistration } from "../services/operations/Authapi";
import { toast } from "react-toastify";
import Footer from "../components/Footer";

const DoctorRegistrationPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token, loading } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    contact: "",
    specialization: "",
    qualification: "",
    experienceYears: "",
    licenseNumber: "",
    hospitalName: "",
    image: null,
    documents: "",
  });

  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  };

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormData((p) => ({ ...p, image: file }));
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
    if (errors.image) setErrors((p) => ({ ...p, image: "" }));
  };

  const validate = () => {
    const err = {};
    if (!formData.fullName.trim()) err.fullName = "Full name is required";
    if (!formData.email.trim()) err.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) err.email = "Enter a valid email";
    if (!formData.contact.trim()) err.contact = "Contact is required";
    if (!formData.specialization.trim()) err.specialization = "Specialization is required";
    if (!formData.licenseNumber.trim()) err.licenseNumber = "License number is required";
    if (!formData.documents.trim()) err.documents = "Document URL is required";
    else if (!/^https?:\/\/.+/.test(formData.documents)) err.documents = "Enter a valid URL (http/https)";
    if (!formData.image) err.image = "Profile image is required";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (!token) {
      toast.error("Please login first to register as a doctor");
      navigate("/login");
      return;
    }

    dispatch(doctorRegistration(formData, token, navigate));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-20 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-500/30">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-blue-900 mb-3">Medical Professional Verification</h1>
          <p className="text-blue-600 text-lg">Join our network of certified healthcare providers</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-blue-100">
          <div className="p-8 md:p-12">
            {/* Progress Indicator */}
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold shadow-lg">1</div>
                <span className="text-blue-900 font-medium">Personal Info</span>
              </div>
              <div className="flex-1 h-1 bg-blue-200 mx-4"></div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-semibold">2</div>
                <span className="text-blue-600 font-medium">Credentials</span>
              </div>
              <div className="flex-1 h-1 bg-blue-200 mx-4"></div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-semibold">3</div>
                <span className="text-blue-600 font-medium">Review</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Image Upload Section */}
              <div className="flex flex-col items-center py-6">
                <div className="relative group">
                  <div className={`w-32 h-32 rounded-full overflow-hidden border-4 ${errors.image ? 'border-red-400' : 'border-blue-400'} shadow-xl transition-all duration-300 group-hover:scale-105`}>
                    {imagePreview ? (
                      <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-300 to-blue-500 flex items-center justify-center">
                        <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImage} className="hidden" id="profile-upload" />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
                <p className="text-blue-600 text-sm mt-3">Upload professional photo</p>
                {errors.image && <p className="text-red-400 text-sm mt-2">{errors.image}</p>}
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="relative">
                  <label className="block text-blue-900 text-sm font-medium mb-2">Full Name</label>
                  <input
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-white border ${errors.fullName ? 'border-red-400' : 'border-blue-300'} rounded-xl text-blue-900 placeholder-blue-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-all`}
                    placeholder="Dr. Alexandra Smith"
                  />
                  {errors.fullName && <p className="text-red-400 text-xs mt-1">{errors.fullName}</p>}
                </div>

                {/* Email */}
                <div className="relative">
                  <label className="block text-blue-900 text-sm font-medium mb-2">Email Address</label>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-white border ${errors.email ? 'border-red-400' : 'border-blue-300'} rounded-xl text-blue-900 placeholder-blue-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-all`}
                    placeholder="alexandra@hospital.com"
                  />
                  {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                </div>

                {/* Contact */}
                <div className="relative">
                  <label className="block text-blue-900 text-sm font-medium mb-2">Phone Number</label>
                  <input
                    name="contact"
                    value={formData.contact}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-white border ${errors.contact ? 'border-red-400' : 'border-blue-300'} rounded-xl text-blue-900 placeholder-blue-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-all`}
                    placeholder="+1 (555) 000-0000"
                  />
                  {errors.contact && <p className="text-red-400 text-xs mt-1">{errors.contact}</p>}
                </div>

                {/* Specialization */}
                <div className="relative">
                  <label className="block text-blue-900 text-sm font-medium mb-2">Medical Specialization</label>
                  <input
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-white border ${errors.specialization ? 'border-red-400' : 'border-blue-300'} rounded-xl text-blue-900 placeholder-blue-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-all`}
                    placeholder="Neurosurgery"
                  />
                  {errors.specialization && <p className="text-red-400 text-xs mt-1">{errors.specialization}</p>}
                </div>

                {/* Qualification */}
                <div className="relative">
                  <label className="block text-blue-900 text-sm font-medium mb-2">Educational Qualification</label>
                  <input
                    name="qualification"
                    value={formData.qualification}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-blue-300 rounded-xl text-blue-900 placeholder-blue-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-all"
                    placeholder="MD, PhD in Neuroscience"
                  />
                </div>

                {/* Experience */}
                <div className="relative">
                  <label className="block text-blue-900 text-sm font-medium mb-2">Years of Practice</label>
                  <input
                    name="experienceYears"
                    type="number"
                    min="0"
                    value={formData.experienceYears}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-blue-300 rounded-xl text-blue-900 placeholder-blue-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-all"
                    placeholder="15"
                  />
                </div>

                {/* License Number */}
                <div className="relative">
                  <label className="block text-blue-900 text-sm font-medium mb-2">Medical License Number</label>
                  <input
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-white border ${errors.licenseNumber ? 'border-red-400' : 'border-blue-300'} rounded-xl text-blue-900 placeholder-blue-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-all`}
                    placeholder="MED-123456-2024"
                  />
                  {errors.licenseNumber && <p className="text-red-400 text-xs mt-1">{errors.licenseNumber}</p>}
                </div>

                {/* Hospital Name */}
                <div className="relative">
                  <label className="block text-blue-900 text-sm font-medium mb-2">Current Institution</label>
                  <input
                    name="hospitalName"
                    value={formData.hospitalName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-blue-300 rounded-xl text-blue-900 placeholder-blue-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-all"
                    placeholder="Memorial Medical Center"
                  />
                </div>
              </div>

              {/* Documents URL */}
              <div className="relative">
                <label className="block text-blue-900 text-sm font-medium mb-2">Verification Documents Link</label>
                <textarea
                  name="documents"
                  value={formData.documents}
                  onChange={handleChange}
                  rows="3"
                  className={`w-full px-4 py-3 bg-white border ${errors.documents ? 'border-red-400' : 'border-blue-300'} rounded-xl text-blue-900 placeholder-blue-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-all resize-none`}
                  placeholder="https://drive.google.com/your-verification-docs"
                />
                <p className="text-blue-600 text-xs mt-2">Provide a publicly accessible link to your medical credentials and certifications</p>
                {errors.documents && <p className="text-red-400 text-xs mt-1">{errors.documents}</p>}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex-1 px-6 py-4 bg-white border border-blue-300 text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all duration-300"
                >
                  Go Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 px-6 py-4 font-semibold rounded-xl transition-all duration-300 shadow-lg ${
                    loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-blue-500/30'
                  } text-white`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    'Submit Application'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Bottom Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-2xl p-6 border border-blue-200 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-blue-900 font-semibold mb-2">Secure Processing</h3>
            <p className="text-blue-600 text-sm">Your credentials are encrypted and protected</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-blue-200 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-blue-900 font-semibold mb-2">Fast Approval</h3>
            <p className="text-blue-600 text-sm">Most applications reviewed within 48 hours</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-blue-200 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-blue-900 font-semibold mb-2">Global Network</h3>
            <p className="text-blue-600 text-sm">Join 50,000+ verified medical professionals</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DoctorRegistrationPage;