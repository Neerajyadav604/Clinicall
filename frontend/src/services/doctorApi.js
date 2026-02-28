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
    let url = `/appointments/doctor`;
    if (status) {
      url += `?status=${status}`;
    }
    const response = await axiosInstance.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching doctor appointments:", error);
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
    const response = await axiosInstance.get(`/appointments/doctor/stats`);
    return response.data;
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }
};

/**
 * Get appointments grouped by status
 */
export const getDoctorAppointmentsByStatus = async () => {
  try {
    const appointments = await getDoctorAppointments();

    // Group appointments by approval status
    const grouped = {
      PENDING: [],
      APPROVED: [],
      REJECTED: [],
    };

    if (appointments.data && Array.isArray(appointments.data)) {
      appointments.data.forEach((apt) => {
        const status = apt.approvalstatus || "PENDING";
        if (grouped[status]) {
          grouped[status].push(apt);
        }
      });
    }

    return grouped;
  } catch (error) {
    console.error("Error grouping appointments by status:", error);
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

    const response = await axiosInstance.post(`/profile/update-image`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error uploading profile image:", error);
    throw error;
  }
};
