import { axiosInstance } from "../ApiConnector";

// ============================================
// APPOINTMENT CONSULTATION & PAYMENT API
// ============================================

/**
 * Set consultation mode for appointment
 * @param {string} appointmentId - Appointment ID
 * @param {string} mode - "online" or "offline"
 * @returns {Promise<Object>}
 */
export const setConsultationMode = async (appointmentId, mode) => {
  try {
    const response = await axiosInstance.patch(
      `/user/appointments/${appointmentId}/consultation-mode`,
      { consultationMode: mode }
    );
    return response.data;
  } catch (error) {
    console.error("Error setting consultation mode:", error);
    throw error;
  }
};

/**
 * Check if user can access chat for appointment
 * @param {string} appointmentId - Appointment ID
 * @returns {Promise<Object>}
 */
export const checkChatAccess = async (appointmentId) => {
  try {
    const response = await axiosInstance.get(
      `/user/appointments/${appointmentId}/chat-access`
    );
    console.log("data from consultation api", response.data);
    return response.data;
  } catch (error) {
    console.error("Error checking chat access:", error);
    throw error;
  }
};

/**
 * Initiate Razorpay payment for online consultation
 * @param {string} appointmentId - Appointment ID
 * @returns {Promise<Object>}
 */
export const initiatePayment = async (appointmentId) => {
  try {
    const response = await axiosInstance.post(
      `/createOrder`,
      { appointmentId }
    );
    console.log("data :", response.status);
    return response.data;
  } catch (error) {
    console.error("Error initiating payment:", error);
    throw error;
  }
};

/**
 * Verify Razorpay payment
 * @param {Object} paymentData - Payment verification data
 * @returns {Promise<Object>}
 */
export const verifyPayment = async (paymentData) => {
  try {
    const response = await axiosInstance.post(
      `/verifyPayment`,
      paymentData
    );
    return response.data;
  } catch (error) {
    console.error("Error verifying payment:", error);
    throw error;
  }
};
