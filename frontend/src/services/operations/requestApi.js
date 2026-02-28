import { axiosInstance } from "../ApiConnector";

// ============================================
// USER REQUESTS / APPOINTMENTS APIs
// ============================================

/**
 * Get all appointment requests for the current user
 * @param {string} status - Optional filter: "APPROVED", "REJECTED", "PENDING", "ALL"
 */
export const getUserRequests = async (status = "ALL") => {
  try {
    let url = `/user/appointments`;
    if (status && status !== "ALL") {
      url += `?status=${status}`;
    }
    const response = await axiosInstance.get(url);
    return response.data;
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
    const response = await axiosInstance.get(`/user/appointments/${appointmentId}`);
    return response.data;
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
    const response = await axiosInstance.get(`/user/appointments/stats`);
    return response.data;
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
    const response = await axiosInstance.patch(`/user/appointments/${appointmentId}/cancel`, body);
    return response.data;
  } catch (error) {
    console.error("Error canceling appointment:", error);
    throw error;
  }
};
