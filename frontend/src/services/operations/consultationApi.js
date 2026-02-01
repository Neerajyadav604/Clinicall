// ============================================
// APPOINTMENT CONSULTATION & PAYMENT API
// ============================================

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:4000/api/v1";

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

/**
 * Set consultation mode for appointment
 * @param {string} appointmentId - Appointment ID
 * @param {string} mode - "online" or "offline"
 * @returns {Promise<Object>}
 */
export const setConsultationMode = async (appointmentId, mode) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/user/appointments/${appointmentId}/consultation-mode`,
      {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ consultationMode: mode }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to set consultation mode");
    }

    return data;
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
    const response = await fetch(
      `${API_BASE_URL}/user/appointments/${appointmentId}/chat-access`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );

    const data = await response.json();
    console.log("data from consultation api",data)

    if (!response.ok) {
      throw new Error(data.message || "Failed to check chat access");
    }

    return data;
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
    const response = await fetch(
      `${API_BASE_URL}/createOrder`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ appointmentId }),
      }
    );

    const data = await response.json();
console.log("data :", response.ok)
    if (!response.ok) {
      throw new Error(data.message || "Failed to initiate payment");
    }
    return data;
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
    const response = await fetch(
      `${API_BASE_URL}/verifyPayment`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(paymentData),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Payment verification failed");
    }

    return data;
  } catch (error) {
    console.error("Error verifying payment:", error);
    throw error;
  }
};
