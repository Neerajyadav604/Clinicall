import { handleUnauthorized } from "./authSession";

// Admin API Service
// This file contains all API calls for the admin panel

const BASE_URL = process.env.REACT_APP_BASE_URL || "http://localhost:4000/api/v1";

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token =
    localStorage.getItem("adminToken") || localStorage.getItem("token");
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
    if (response.status === 401) {
      handleUnauthorized();
    }
    // Always expect JSON from our API
    const errorData = await response.json();
    const errorMessage = errorData.message || `HTTP Error ${response.status}`;
    throw new Error(errorMessage);
  }

  // Ensure response is JSON
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("Invalid response format. Server did not return JSON.");
  }

  return await response.json();
};

// ============================================
// DASHBOARD APIs
// ============================================

export const getDashboardStats = async () => {
  try {
    const [doctorsRes, registrationsRes, appointmentsRes] = await Promise.all([
      fetch(`${BASE_URL}/admin/doctors/count`, {
        headers: getAuthHeaders(),
      }),
      fetch(`${BASE_URL}/admin/registrations/pending/count`, {
        headers: getAuthHeaders(),
      }),
      fetch(`${BASE_URL}/admin/appointments/count`, {
        headers: getAuthHeaders(),
      }),
    ]);

    const doctors = await parseResponse(doctorsRes);
    const registrations = await parseResponse(registrationsRes);
    const appointments = await parseResponse(appointmentsRes);

    return {
      totalDoctors: doctors.count || 0,
      pendingRegistrations: registrations.count || 0,
      totalAppointments: appointments.count || 0,
      pendingAppointments: appointments.pendingCount || 0,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }
};

export const getAdminStats = async () => {
  try {
    const response = await fetch(`${BASE_URL}/admin/stats`, {
      headers: getAuthHeaders(),
    });
    return await parseResponse(response);
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    throw error;
  }
};

// ============================================
// DOCTOR REGISTRATION APIs
// ============================================

export const getDoctorRegistrations = async (status = "PENDING") => {
  try {
    const url = status ? `${BASE_URL}/admin/registrations?status=${status}` : `${BASE_URL}/admin/registrations`;
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    console.log(response)
    return await parseResponse(response);
  } catch (error) {
    console.error("Error fetching doctor registrations:", error);
    throw error;
  }
};

export const approveDoctorRegistration = async (registrationId) => {
  try {
    const response = await fetch(
      `${BASE_URL}/admin/registrations/${registrationId}/approve`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
      }
    );
    return await parseResponse(response);
  } catch (error) {
    console.error("Error approving registration:", error);
    throw error;
  }
};

export const rejectDoctorRegistration = async (registrationId, reason = "") => {
  try {
    const response = await fetch(
      `${BASE_URL}/admin/registrations/${registrationId}/reject`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ rejectionReason: reason }),
      }
    );
    return await parseResponse(response);
  } catch (error) {
    console.error("Error rejecting registration:", error);
    throw error;
  }
};

// ============================================
// APPOINTMENT APIs
// ============================================

export const getAppointments = async (status = null) => {
  try {
    let url = `${BASE_URL}/admin/appointments`;
    if (status) {
      url += `?status=${status}`;
    }
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return await parseResponse(response);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    throw error;
  }
};

export const approveAppointment = async (appointmentId) => {
  try {
    const response = await fetch(
      `${BASE_URL}/admin/appointments/${appointmentId}/approve`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
      }
    );
    return await parseResponse(response);
  } catch (error) {
    console.error("Error approving appointment:", error);
    throw error;
  }
};

export const rejectAppointment = async (appointmentId, reason = "") => {
  try {
    const response = await fetch(
      `${BASE_URL}/admin/appointments/${appointmentId}/reject`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ cancellationReason: reason }),
      }
    );
    return await parseResponse(response);
  } catch (error) {
    console.error("Error rejecting appointment:", error);
    throw error;
  }
};

// ============================================
// USER APIs
// ============================================

export const getUsers = async (role = null) => {
  try {
    let url = `${BASE_URL}/admin/users`;
    if (role) {
      url += `?role=${role}`;
    }
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return await parseResponse(response);
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

// ============================================
// ANALYTICS APIs
// ============================================

export const getAnalyticsOverview = async () => {
  const response = await fetch(`${BASE_URL}/admin/analytics/overview`, { headers: getAuthHeaders() });
  return await parseResponse(response);
};

export const getTrendData = async (period) => {
  let url = `${BASE_URL}/admin/analytics/trends`;
  if (period) url += `?period=${period}`;
  const response = await fetch(url, { headers: getAuthHeaders() });
  return await parseResponse(response);
};

export const getTopDoctors = async (limit) => {
  let url = `${BASE_URL}/admin/analytics/top-doctors`;
  if (limit) url += `?limit=${limit}`;
  const response = await fetch(url, { headers: getAuthHeaders() });
  return await parseResponse(response);
};

export const getConsultationRatio = async () => {
  const response = await fetch(`${BASE_URL}/admin/analytics/consultation-ratio`, { headers: getAuthHeaders() });
  return await parseResponse(response);
};

// ============================================
// DOCTOR APIs
// ============================================

export const getApprovedDoctors = async () => {
  try {
    const response = await fetch(`${BASE_URL}/admin/doctors/approved`, {
      headers: getAuthHeaders(),
    });
    return await parseResponse(response);
  } catch (error) {
    console.error("Error fetching approved doctors:", error);
    throw error;
  }
};

export const getRejectedDoctors = async () => {
  try {
    const response = await fetch(`${BASE_URL}/admin/doctors/rejected`, {
      headers: getAuthHeaders(),
    });
    return await parseResponse(response);
  } catch (error) {
    console.error("Error fetching rejected doctors:", error);
    throw error;
  }
};

// ============================================
// EMAIL APIs
// ============================================

export const sendNotificationEmail = async (email, status, doctorName) => {
  try {
    const response = await fetch(`${BASE_URL}/admin/send-email`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        email,
        status,
        doctorName,
        templateType: "doctorRegistration",
      }),
    });
    return await parseResponse(response);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

// ============================================
// AUTHENTICATION
// ============================================

export const adminLogin = async (email, password) => {
  try {
    const response = await fetch(`${BASE_URL}/admin/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    return await response.json();
  } catch (error) {
    console.error("Error during admin login:", error);
    throw error;
  }
};

export const adminLogout = () => {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminName");
};
