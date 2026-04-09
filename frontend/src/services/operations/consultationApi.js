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
    const payload = { appointmentId };
    console.log("📤 [initiatePayment] Sending POST /createOrder with payload:", payload);
    
    const response = await axiosInstance.post(
      `/createOrder`,
      payload
    );
    console.log("✅ [initiatePayment] Response received, status:", response.status, "data:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ [initiatePayment] Error initiating payment:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      appointmentId: appointmentId
    });
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

// ============================================
// MEDICAL RECORDS API (Consultation Records)
// ============================================

/**
 * Get all consultation history with medical records for logged-in patient
 * @returns {Promise<Object>} - { sessions: Array of sessions with their records }
 */
export const getConsultationHistory = async () => {
  try {
    const response = await axiosInstance.get(`/consultation/history`);
    return response.data;
  } catch (error) {
    console.error("Error fetching consultation history:", error);
    throw error;
  }
};

/**
 * Get all medical records for a specific consultation session
 * @param {string} sessionId - Consultation session ID
 * @returns {Promise<Object>} - { records: Array of medical records }
 */
export const getSessionRecords = async (sessionId) => {
  try {
    const response = await axiosInstance.get(`/consultation/records/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching records for session ${sessionId}:`, error);
    throw error;
  }
};

/**
 * Download a single medical record as PDF
 * @param {string} recordId - Medical record ID
 * @returns {Promise<Blob>} - PDF file blob
 */
export const downloadRecord = async (recordId) => {
  try {
    const response = await axiosInstance.get(
      `/consultation/download/${recordId}`,
      { responseType: "blob" }
    );
    return response.data;
  } catch (error) {
    console.error(`Error downloading record ${recordId}:`, error);
    throw error;
  }
};

/**
 * Get all FHIR Conditions (diagnoses with clinical notes from doctors)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - { entry: Array of Condition resources }
 */
export const getFHIRConditions = async (userId) => {
  try {
    const response = await axiosInstance.get(
      `/fhir/R4/Condition?patient=${userId}`
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching FHIR conditions for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Get all FHIR Observations (vitals & lab results with clinical notes from doctors)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - { entry: Array of Observation resources }
 */
export const getFHIRObservations = async (userId) => {
  try {
    const response = await axiosInstance.get(
      `/fhir/R4/Observation?subject=${userId}`
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching FHIR observations for user ${userId}:`, error);
    throw error;
  }
};
