// Doctor API Service
// This file contains all API calls for the doctor dashboard

const BASE_URL = process.env.REACT_APP_BASE_URL || "http://localhost:4000/api/v1";

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No authentication token found. Please login first.");
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// Helper function to safely parse response
const parseResponse = async (response) => {
  const contentType = response.headers.get("content-type");

  if (!response.ok) {
    const errorData = await response.json();
    const errorMessage = errorData.message || `HTTP Error ${response.status}`;
    throw new Error(errorMessage);
  }

  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("Invalid response format. Server did not return JSON.");
  }

  return await response.json();
};

// ============================================
// DOCTOR PROFILE APIs
// ============================================

/**
 * Get the current logged-in doctor's profile
 */
export const getDoctorProfile = async () => {
  try {
    const response = await fetch(`${BASE_URL}/profile/me`, {
      headers: getAuthHeaders(),
    });
    return await parseResponse(response);
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
    const response = await fetch(`${BASE_URL}/doctors/${doctorId}`, {
      headers: getAuthHeaders(),
    });
    return await parseResponse(response);
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
    let url = `${BASE_URL}/appointments/doctor`;
    if (status) {
      url += `?status=${status}`;
    }
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return await parseResponse(response);
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
    const response = await fetch(
      `${BASE_URL}/appointments/${appointmentId}/approve`,
      {
        method: "PATCH",
        headers: getAuthHeaders(),
      }
    );
    return await parseResponse(response);
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
    const response = await fetch(
      `${BASE_URL}/appointments/${appointmentId}/reject`,
      {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      }
    );
    return await parseResponse(response);
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
    const response = await fetch(`${BASE_URL}/appointments/doctor/stats`, {
      headers: getAuthHeaders(),
    });
    return await parseResponse(response);
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
    const response = await fetch(`${BASE_URL}/profile/update`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData),
    });
    return await parseResponse(response);
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

    const response = await fetch(`${BASE_URL}/profile/update-image`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: formData,
    });
    return await parseResponse(response);
  } catch (error) {
    console.error("Error uploading profile image:", error);
    throw error;
  }
};