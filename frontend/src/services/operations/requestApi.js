// Request API Service
// This file contains all API calls for user appointment/request management

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
// USER REQUESTS / APPOINTMENTS APIs
// ============================================

/**
 * Get all appointment requests for the current user
 * @param {string} status - Optional filter: "APPROVED", "REJECTED", "PENDING", "ALL"
 */
export const getUserRequests = async (status = "ALL") => {
  try {
    let url = `${BASE_URL}/user/appointments`;
    if (status && status !== "ALL") {
      url += `?status=${status}`;
    }
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return await parseResponse(response);
  } catch (error) {
    console.error("Error fetching user requests:", error);
    throw error;
  }
};

/**
 * Get a single appointment request by ID
 * @param {string} appointmentId - ID of the appointment
 */
export const getRequestById = async (appointmentId) => {
  try {
    const response = await fetch(`${BASE_URL}/user/appointments/${appointmentId}`, {
      headers: getAuthHeaders(),
    });
    return await parseResponse(response);
  } catch (error) {
    console.error("Error fetching appointment:", error);
    throw error;
  }
};

/**
 * Get requests grouped by status
 */
export const getRequestsByStatus = async () => {
  try {
    const response = await fetch(`${BASE_URL}/user/appointments/stats`, {
      headers: getAuthHeaders(),
    });
    return await parseResponse(response);
  } catch (error) {
    console.error("Error fetching request statistics:", error);
    throw error;
  }
};

/**
 * Cancel an appointment request
 * @param {string} appointmentId - ID of the appointment to cancel
 * @param {string} reason - Optional cancellation reason
 */
export const cancelRequest = async (appointmentId, reason = "") => {
  try {
    const body = reason ? { cancellationReason: reason } : {};
    const response = await fetch(`${BASE_URL}/user/appointments/${appointmentId}/cancel`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    return await parseResponse(response);
  } catch (error) {
    console.error("Error canceling appointment:", error);
    throw error;
  }
};
