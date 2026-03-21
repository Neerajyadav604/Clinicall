import { axiosInstance } from "./ApiConnector";

// ============================================
// DOCTOR PROFILE APIs
// ============================================

/**
 * Get the current logged-in doctor's profile
 */
export const getDoctorProfile = async () => {
  try {
    const response = await axiosInstance.get(`/profile/me`);
    return response.data;
  } catch (error) {
    console.error("Error fetching doctor profile:", error);
    throw error;
  }
};

/**
 * Get doctor profile by ID
 */
export const getDoctorById = async (doctorId) => {
  try {
    const response = await axiosInstance.get(`/doctors/${doctorId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching doctor by ID:", error);
    throw error;
  }
};

// ============================================
// DOCTOR APPOINTMENTS APIs
// ============================================

/**
 * Get all appointments for the current doctor
 * @param {string} status - Optional filter: "PENDING", "APPROVED", "REJECTED"
 */
export const getDoctorAppointments = async (status = null) => {
  try {
    console.log('[🏥 DOCTOR API] getDoctorAppointments called with status:', status);
    
    let url = `/appointments/doctor`;
    if (status) {
      url += `?status=${status}`;
    }
    
    console.log('[🏥 DOCTOR API] Making request to:', url);
    
    const response = await axiosInstance.get(url);
    
    console.log('[🏥 DOCTOR API] ✅ Response received');
    console.log('[🏥 DOCTOR API] Status code:', response.status);
    console.log('[🏥 DOCTOR API] Response data:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error("[🏥 DOCTOR API] ❌ Error fetching doctor appointments");
    console.error("[🏥 DOCTOR API] Error name:", error.name);
    console.error("[🏥 DOCTOR API] Error message:", error.message);
    console.error("[🏥 DOCTOR API] Error status:", error.response?.status);
    console.error("[🏥 DOCTOR API] Error data:", error.response?.data);
    console.error("[🏥 DOCTOR API] Error stack:", error.stack);
    console.error("[🏥 DOCTOR API] Full error object:", error);
    throw error;
  }
};

/**
 * Approve an appointment
 * @param {string} appointmentId - ID of the appointment to approve
 */
export const approveAppointment = async (appointmentId) => {
  try {
    const response = await axiosInstance.patch(`/appointments/${appointmentId}/approve`);
    return response.data;
  } catch (error) {
    console.error("Error approving appointment:", error);
    throw error;
  }
};

/**
 * Reject an appointment
 * @param {string} appointmentId - ID of the appointment to reject
 * @param {string} reason - Optional rejection reason
 */
export const rejectAppointment = async (appointmentId, reason = "") => {
  try {
    const body = reason ? { cancellationReason: reason } : {};
    const response = await axiosInstance.patch(`/appointments/${appointmentId}/reject`, body);
    return response.data;
  } catch (error) {
    console.error("Error rejecting appointment:", error);
    throw error;
  }
};

/**
 * Get dashboard statistics for doctor
 * Returns counts of pending, approved, rejected appointments
 */
export const getDoctorDashboardStats = async () => {
  try {
    console.log('[🏥 DOCTOR API] getDoctorDashboardStats called');
    
    const response = await axiosInstance.get(`/appointments/doctor/stats`);
    
    console.log('[🏥 DOCTOR API] ✅ Dashboard stats retrieved');
    console.log('[🏥 DOCTOR API] Stats data:', response.data);
    
    return response.data;
  } catch (error) {
    console.error("[🏥 DOCTOR API] ❌ Error fetching dashboard stats");
    console.error("[🏥 DOCTOR API] Error status:", error.response?.status);
    console.error("[🏥 DOCTOR API] Error data:", error.response?.data);
    console.error("[🏥 DOCTOR API] Error message:", error.message);
    console.error("[🏥 DOCTOR API] Error stack:", error.stack);
    throw error;
  }
};

/**
 * Get appointments grouped by status
 */
export const getDoctorAppointmentsByStatus = async () => {
  try {
    console.log('[🏥 DOCTOR API] getDoctorAppointmentsByStatus called');
    
    const appointments = await getDoctorAppointments();
    console.log('[🏥 DOCTOR API] Appointments fetched successfully');
    console.log('[🏥 DOCTOR API] Raw appointments:', appointments);

    // Group appointments by approval status
    const grouped = {
      PENDING: [],
      APPROVED: [],
      REJECTED: [],
    };

    console.log('[🏥 DOCTOR API] Starting to group appointments by status');
    
    if (appointments.data && Array.isArray(appointments.data)) {
      console.log('[🏥 DOCTOR API] Found', appointments.data.length, 'appointments to group');
      appointments.data.forEach((apt) => {
        const status = apt.approvalstatus || "PENDING";
        if (grouped[status]) {
          grouped[status].push(apt);
          console.log('[🏥 DOCTOR API] Grouped appointment', apt._id, 'as', status);
        }
      });
    } else {
      console.log('[🏥 DOCTOR API] ⚠️  No data array in appointments response');
    }

    console.log('[🏥 DOCTOR API] ✅ Appointments grouped successfully');
    console.log('[🏥 DOCTOR API] Grouped result:', grouped);
    
    return grouped;
  } catch (error) {
    console.error("[🏥 DOCTOR API] ❌ Error grouping appointments by status");
    console.error("[🏥 DOCTOR API] Error name:", error.name);
    console.error("[🏥 DOCTOR API] Error message:", error.message);
    console.error("[🏥 DOCTOR API] Error status:", error.response?.status);
    console.error("[🏥 DOCTOR API] Error data:", error.response?.data);
    console.error("[🏥 DOCTOR API] Error stack:", error.stack);
    throw error;
  }
};

/**
 * Decode JWT token to get user info
 * Note: This is a client-side decode (no verification)
 * Always verify token on backend
 */
export const decodeToken = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;

    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const decoded = JSON.parse(atob(parts[1]));
    return decoded;
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

/**
 * Get user role from JWT
 */
export const getUserRole = () => {
  const decoded = decodeToken();
  return decoded?.role || null;
};

/**
 * Get user ID from JWT
 */
export const getUserId = () => {
  const decoded = decodeToken();
  return decoded?.id || null;
};

/**
 * Update doctor profile
 * @param {object} profileData - Updated profile data
 */
export const updateDoctorProfile = async (profileData) => {
  try {
    const response = await axiosInstance.put(`/profile/update`, profileData);
    return response.data;
  } catch (error) {
    console.error("Error updating doctor profile:", error);
    throw error;
  }
};

/**
 * Upload doctor profile image
 * @param {File} imageFile - Image file to upload
 */
export const uploadDoctorProfileImage = async (imageFile) => {
  try {
    const formData = new FormData();
    formData.append("image", imageFile);

    // Do NOT set Content-Type header - let axios handle it automatically with FormData
    const response = await axiosInstance.post(`/profile/update-image`, formData);
    return response.data;
  } catch (error) {
    console.error("Error uploading profile image:", error);
    throw error;
  }
};
