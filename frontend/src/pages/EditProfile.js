import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { Save, X } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { updateUserProfile } from '../services/operations/Profileapi';

const EditProfile = () => {
  const { user } = useSelector((state) => state.profile);
  const { token } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm({
    defaultValues: {
      fullName: user?.fullName || '',
      email: user?.email || '',
      contact: user?.contact || '',
      address: user?.additionalDetails?.address || '',
      dob: user?.additionalDetails?.dob || '',
      gender: user?.additionalDetails?.gender || '',
      bloodGroup: user?.additionalDetails?.bloodGroup || '',
      emergencyContact: user?.additionalDetails?.emergencyContact || '',
      allergies: user?.additionalDetails?.allergies || '',
      medications: user?.additionalDetails?.medications || '',
      medicalHistory: user?.additionalDetails?.medicalHistory || '',
      insuranceProvider: user?.additionalDetails?.insuranceProvider || '',
      policyNumber: user?.additionalDetails?.policyNumber || '',
    }
  });

  const formData = watch();

  useEffect(() => {
    if (user) {
      setValue('fullName', user.fullName || '');
      setValue('email', user.email || '');
      setValue('contact', user.contact || '');

      // Handle both direct properties and nested additionalDetails
      const details = user.additionalDetails || user;

      setValue('address', details.address || user.address || '');
      setValue('dob', details.dob || user.dob || '');
      setValue('gender', details.gender || user.gender || '');
      setValue('bloodGroup', details.bloodGroup || user.bloodGroup || '');
      setValue('emergencyContact', details.emergencyContact || user.emergencyContact || '');

      // Handle array data for allergies
      setValue(
        'allergies',
        Array.isArray(details.allergies)
          ? details.allergies.join(', ')
          : Array.isArray(user.allergies)
          ? user.allergies.join(', ')
          : details.allergies || user.allergies || ''
      );

      // Handle array data for medications
      setValue(
        'medications',
        Array.isArray(details.medications)
          ? details.medications.join(', ')
          : Array.isArray(user.medications)
          ? user.medications.join(', ')
          : details.medications || user.medications || ''
      );

      // Handle array data for medical history
      setValue(
        'medicalHistory',
        Array.isArray(details.medicalHistory)
          ? details.medicalHistory.join(', ')
          : Array.isArray(user.medicalHistory)
          ? user.medicalHistory.join(', ')
          : details.medicalHistory || user.medicalHistory || ''
      );

      // Handle insurance data
      const insurance = details.insurance || user.insurance || {};
      setValue('insuranceProvider', insurance.provider || details.insuranceProvider || user.insuranceProvider || '');
      setValue('policyNumber', insurance.policyNumber || details.policyNumber || user.policyNumber || '');
    }
  }, [user, setValue]);

  const submitProfileForm = async (data) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        medications: data.medications
          ? data.medications.split(",").map(item => item.trim())
          : [],
        allergies: data.allergies
          ? data.allergies.split(",").map(item => item.trim())
          : [],
        medicalHistory: data.medicalHistory
          ? data.medicalHistory.split(",").map(item => item.trim())
          : [],
      };
      console.log("Payload:", payload);
      await dispatch(updateUserProfile(token, payload));
   
    } catch (err) {
      console.log("Error Occurred:", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 mt-24">
      <div className="max-w-full mx-auto px-4 md:px-8">
        <div className="bg-white rounded-lg shadow-sm">
          <form onSubmit={handleSubmit(submitProfileForm)}>
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl md:text-3xl font-normal text-gray-800">Edit Profile</h1>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Left Column - Personal Information */}
                <div>
                  <h3 className="text-gray-400 text-xs uppercase mb-4">Personal Information</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        {...register("fullName", { required: "Full name is required" })}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {errors.fullName && (
                        <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        {...register("email", {
                          required: "Email is required",
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: "Invalid email address"
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {errors.email && (
                        <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        {...register("contact", { required: "Phone number is required" })}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {errors.contact && (
                        <p className="text-red-500 text-xs mt-1">{errors.contact.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-1">
                        Address
                      </label>
                      <textarea
                        {...register("address")}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          {...register("dob")}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">
                          Gender
                        </label>
                        <select
                          {...register("gender")}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">
                          Blood Group
                        </label>
                        <select
                          {...register("bloodGroup")}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">
                          Emergency Contact
                        </label>
                        <input
                          type="tel"
                          {...register("emergencyContact")}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Medical Information */}
                <div>
                  <h3 className="text-gray-400 text-xs uppercase mb-4">Medical Information</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-1">
                        Allergies
                      </label>
                      <input
                        type="text"
                        {...register("allergies")}
                        placeholder="Separate with commas (e.g., Peanuts, Penicillin)"
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Separate multiple items with commas</p>
                    </div>

                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-1">
                        Current Medications
                      </label>
                      <textarea
                        {...register("medications")}
                        rows={3}
                        placeholder="Separate with commas (e.g., Lisinopril, Metformin)"
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Separate multiple items with commas</p>
                    </div>

                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-1">
                        Medical History
                      </label>
                      <textarea
                        {...register("medicalHistory")}
                        rows={3}
                        placeholder="Separate with commas (e.g., Hypertension, Diabetes)"
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Separate multiple items with commas</p>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="text-gray-700 text-sm font-medium mb-3">Insurance Information</h4>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-gray-700 text-sm font-medium mb-1">
                            Insurance Provider
                          </label>
                          <input
                            type="text"
                            {...register("insuranceProvider")}
                            placeholder="e.g., HealthCare Plus"
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-700 text-sm font-medium mb-1">
                            Policy Number
                          </label>
                          <input
                            type="text"
                            {...register("policyNumber")}
                            placeholder="e.g., HCP-123456789"
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Save Button */}
              <div className="mt-8 md:hidden flex gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;