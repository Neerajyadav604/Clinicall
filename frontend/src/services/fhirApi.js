import axios from 'axios';

const BASE_URL = process.env.REACT_APP_BASE_URL;

/**
 * FHIR R4 API service
 * Handles requests to /api/v1/fhir/R4 endpoints
 */

// ==================== FHIR DATE HELPER ====================

/**
 * Convert date to ISO 8601 format without milliseconds (most backend-compatible)
 * Strips .000Z portion to produce: "2026-03-15T07:33:25Z"
 * @param {Date|string|null} date - Date to convert (defaults to now if invalid)
 * @returns {string} Clean ISO 8601 datetime string without milliseconds
 */
const toCleanISO = (date) => {
  const d = date ? new Date(date) : new Date();
  if (isNaN(d.getTime())) {
    // Invalid date — fallback to now
    return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  }
  // Remove milliseconds: "2026-03-15T07:33:25.123Z" → "2026-03-15T07:33:25Z"
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
};

// ==================== FHIR VALIDATION HELPERS ====================

/**
 * Regex patterns for FHIR validation
 */
const FHIR_REGEXES = {
  // FHIR Reference format: ResourceType/id or full URL
  // Examples: "Patient/123", "Practitioner/abc-def", "https://example.com/Patient/123"
  REFERENCE: /^(https?:\/\/.+\/)?[A-Z][a-zA-Z0-9]*\/[a-zA-Z0-9.-]+$/,
  
  // ICD-10/SNOMED medical codes: alphanumeric + dots/hyphens
  // Examples: "J45.9", "E11.9", "A00", "J06-9"
  MEDICAL_CODE: /^[A-Z0-9.-]{1,20}$/i,
  
  // ISO 8601 date: YYYY-MM-DD or with time
  ISO_DATE: /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})?)?$/,
  
  // MongoDB ObjectId: 24 hex characters
  MONGODB_ID: /^[a-f0-9]{24}$/i
};

/**
 * Validate FHIR reference format: ResourceType/id
 * @param {string} reference - Reference string to validate (e.g. "Patient/123")
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidFHIRReference = (reference) => {
  if (!reference || typeof reference !== 'string') return false;
  return FHIR_REGEXES.REFERENCE.test(reference);
};

/**
 * Validate medical code format (ICD-10, SNOMED, LOINC)
 * @param {string} code - Code to validate (e.g. "J45.9")
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidMedicalCode = (code) => {
  if (!code || typeof code !== 'string') return false;
  return FHIR_REGEXES.MEDICAL_CODE.test(code.trim());
};

/**
 * Validate ISO 8601 date format
 * @param {string} dateString - Date string to validate (e.g. "2026-03-15")
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidISO8601Date = (dateString) => {
  if (!dateString || typeof dateString !== 'string') return false;
  if (!FHIR_REGEXES.ISO_DATE.test(dateString)) return false;
  // Additional check: ensure it's a valid date
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

/**
 * Format a MongoDB ObjectId as a FHIR reference
 * @param {string} resourceType - FHIR resource type (e.g. "Patient", "Practitioner")
 * @param {string} id - MongoDB ObjectId or string ID
 * @returns {string} Formatted reference (e.g. "Patient/507f1f77bcf86cd799439011")
 */
export const formatFHIRReference = (resourceType, id) => {
  if (!resourceType || !id) {
    throw new Error('resourceType and id are required');
  }
  if (typeof resourceType !== 'string' || typeof id !== 'string') {
    throw new TypeError('resourceType and id must be strings');
  }
  return `${resourceType}/${id.trim()}`;
};

/**
 * Sanitize medical code: remove invalid characters
 * "J45{Asthma)" → "J45", "E11.9" → "E11.9"
 * @param {string} code - Code to sanitize
 * @returns {string} Sanitized code (alphanumeric + dots/hyphens only)
 */
export const sanitizeMedicalCode = (code) => {
  if (!code) return '';
  
  return code
    .toUpperCase()
    .trim()
    .replace(/[{}()]/g, '')              // Remove all brackets and parens
    .replace(/\s+/g, '')                 // Remove spaces
    .replace(/[^A-Z0-9.-]/g, '')         // Keep only alphanumeric, dots, hyphens
    .substring(0, 20);                   // Max 20 chars
};

/**
 * Validate a Condition payload before sending to server
 * @param {Object} condition - Condition payload to validate
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export const validateConditionPayload = (condition) => {
  const errors = [];

  // Check if payload exists
  if (!condition || typeof condition !== 'object') {
    return { valid: false, errors: ['Condition payload must be an object'] };
  }

  // Check required fields
  if (!condition.user_ref) {
    errors.push('user_ref (patient reference) is required');
  } else if (!isValidFHIRReference(condition.user_ref)) {
    errors.push(
      `user_ref has invalid FHIR reference format. Must be "ResourceType/id" ` +
      `(e.g., "Patient/507f1f77bcf86cd799439011"), got: "${condition.user_ref}"`
    );
  }

  if (!condition.code) {
    errors.push('code (medical code) is required');
  } else if (!isValidMedicalCode(condition.code)) {
    errors.push(
      `code has invalid medical code format. Must be alphanumeric with dots/hyphens ` +
      `(e.g., "J45.9", "E11.9"), got: "${condition.code}"`
    );
  }

  // Optional field validations
  if (condition.severity && !['mild', 'moderate', 'severe'].includes(condition.severity.toLowerCase())) {
    errors.push(`severity must be one of: mild, moderate, severe, got: "${condition.severity}"`);
  }

  if (condition.clinicalStatus && !['active', 'recurrence', 'inactive', 'remission'].includes(condition.clinicalStatus.toLowerCase())) {
    errors.push(`clinicalStatus must be one of: active, recurrence, inactive, remission`);
  }

  if (condition.display && typeof condition.display !== 'string') {
    errors.push('display must be a string');
  }

  if (condition.notes && typeof condition.notes !== 'string') {
    errors.push('notes must be a string');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Extract human-readable error messages from FHIR OperationOutcome response
 * @param {Object} operationOutcome - FHIR OperationOutcome object from 422 response
 * @returns {string[]} Array of error messages
 */
export const extractOperationOutcomeErrors = (operationOutcome) => {
  const errors = [];

  if (!operationOutcome) return errors;

  // Handle OperationOutcome with issue array
  if (Array.isArray(operationOutcome.issue)) {
    operationOutcome.issue.forEach(issue => {
      if (issue.diagnostics) {
        errors.push(issue.diagnostics);
      } else if (issue.details && issue.details.text) {
        errors.push(issue.details.text);
      } else if (issue.code) {
        errors.push(`Validation error: ${issue.code}`);
      }
    });
  }

  return errors.length > 0 ? errors : ['Unknown validation error from server'];
};

// Create axios instance for FHIR requests with appropriate headers
const fhirClient = axios.create({
  baseURL: `${BASE_URL}/fhir/R4`,
  headers: {
    Accept: 'application/fhir+json',
    'Content-Type': 'application/fhir+json'
  }
});

// Create axios instance for API requests (non-FHIR) with baseURL already containing /api/v1
const apiBaseUrl = BASE_URL?.endsWith('/api/v1') ? BASE_URL : `${BASE_URL}/api/v1`;
const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
fhirClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add token to apiClient requests as well
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Fetch a patient resource by ID
 * @param {string} patientId - The patient's MongoDB ID
 * @returns {Promise<Object>} FHIR Patient resource
 */
export const getPatient = async (patientId) => {
  try {
    const response = await fhirClient.get(`/Patient/${patientId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching patient:', error);
    throw error;
  }
};

/**
 * Fetch a practitioner resource by ID
 * @param {string} practitionerId - The doctor's MongoDB ID
 * @returns {Promise<Object>} FHIR Practitioner resource
 */
export const getPractitioner = async (practitionerId) => {
  try {
    const response = await fhirClient.get(`/Practitioner/${practitionerId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching practitioner:', error);
    throw error;
  }
};

/**
 * Fetch an organization resource by ID
 * @param {string} organizationId - The hospital's MongoDB ID
 * @returns {Promise<Object>} FHIR Organization resource
 */
export const getOrganization = async (organizationId) => {
  try {
    const response = await fhirClient.get(`/Organization/${organizationId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching organization:', error);
    throw error;
  }
};

/**
 * Fetch all data for a patient ($everything operation)
 * Returns Patient + Conditions, Observations, Allergies, Encounters
 * @param {string} patientId - The patient's MongoDB ID
 * @returns {Promise<Object>} FHIR Bundle with all patient resources
 */
export const getPatientEverything = async (patientId) => {
  try {
    const response = await fhirClient.get(`/Patient/${patientId}/$everything`);
    return response.data;
  } catch (error) {
    console.error('Error fetching patient everything:', error);
    throw error;
  }
};

/**
 * Search conditions for a patient
 * @param {string} patientId - The patient's MongoDB ID
 * @returns {Promise<Object>} FHIR Bundle of Condition resources
 */
export const getConditions = async (patientId, params = {}) => {
  try {
    let url = `/Condition?patient=${patientId}`;
    if (params.appointmentId) {
      url += `&appointmentId=${params.appointmentId}`;
    }
    const response = await fhirClient.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching conditions:', error);
    throw error;
  }
};

/**
 * Search observations for a patient
 * @param {string} patientId - The patient's MongoDB ID
 * @param {string} category - Optional: vital-signs, laboratory, imaging, etc.
 * @returns {Promise<Object>} FHIR Bundle of Observation resources
 */
export const getObservations = async (patientId, category = null, params = {}) => {
  try {
    let url = `/Observation?subject=${patientId}`;
    if (category) {
      url += `&category=${category}`;
    }
    if (params.appointmentId) {
      url += `&appointmentId=${params.appointmentId}`;
    }
    const response = await fhirClient.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching observations:', error);
    throw error;
  }
};

/**
 * Search 生活vital signs observations
 * @param {string} patientId - The patient's MongoDB ID
 * @returns {Promise<Object>} FHIR Bundle of vital sign Observations
 */
export const getVitalSigns = async (patientId) => {
  return getObservations(patientId, 'vital-signs');
};

/**
 * Search laboratory observations
 * @param {string} patientId - The patient's MongoDB ID
 * @returns {Promise<Object>} FHIR Bundle of lab Observations
 */
export const getLabResults = async (patientId) => {
  return getObservations(patientId, 'laboratory');
};

/**
 * Search allergies for a patient
 * @param {string} patientId - The patient's MongoDB ID
 * @returns {Promise<Object>} FHIR Bundle of AllergyIntolerance resources
 */
export const getAllergies = async (patientId) => {
  try {
    const response = await fhirClient.get(`/AllergyIntolerance?patient=${patientId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching allergies:', error);
    throw error;
  }
};

/**
 * Fetch server capability statement
 * @returns {Promise<Object>} FHIR CapabilityStatement
 */
export const getMetadata = async () => {
  try {
    const response = await fhirClient.get('/metadata');
    return response.data;
  } catch (error) {
    console.error('Error fetching metadata:', error);
    throw error;
  }
};

/**
 * Search medication requests for a patient
 * @param {string} patientId - The patient's MongoDB ID
 * @param {Object} params - Optional query parameters { status: "active" }
 * @returns {Promise<Object>} FHIR Bundle of MedicationRequest resources
 */
export const getMedicationRequests = async (patientId, params = {}) => {
  try {
    let url = `/MedicationRequest?patient=${patientId}`;
    if (params.status) {
      url += `&status=${params.status}`;
    }
    if (params.appointmentId) {
      url += `&appointmentId=${params.appointmentId}`;
    }
    const response = await fhirClient.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching medication requests:', error);
    throw error;
  }
};

/**
 * Search diagnostic reports for a patient
 * @param {string} patientId - The patient's MongoDB ID
 * @param {Object} params - Optional query parameters { date: "2026-03-13" }
 * @returns {Promise<Object>} FHIR Bundle of DiagnosticReport resources
 */
export const getDiagnosticReports = async (patientId, params = {}) => {
  try {
    let url = `/DiagnosticReport?patient=${patientId}`;
    if (params.date) {
      url += `&date=${params.date}`;
    }
    if (params.appointmentId) {
      url += `&appointmentId=${params.appointmentId}`;
    }
    const response = await fhirClient.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching diagnostic reports:', error);
    throw error;
  }
};

/**
 * Search procedures for a patient
 * @param {string} patientId - The patient's MongoDB ID
 * @returns {Promise<Object>} FHIR Bundle of Procedure resources
 */
export const getProcedures = async (patientId) => {
  try {
    const response = await fhirClient.get(`/Procedure?patient=${patientId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching procedures:', error);
    throw error;
  }
};

/**
 * Search immunizations for a patient
 * @param {string} patientId - The patient's MongoDB ID
 * @returns {Promise<Object>} FHIR Bundle of Immunization resources
 */
export const getImmunizations = async (patientId) => {
  try {
    const response = await fhirClient.get(`/Immunization?patient=${patientId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching immunizations:', error);
    throw error;
  }
};

/**
 * Search code system for matching codes
 * @param {string} system - Code system (icd10, loinc, snomed)
 * @param {string} query - Search term
 * @returns {Promise<Object>} FHIR ValueSet with matching codes
 */
export const searchCodes = async (system, query) => {
  try {
    const response = await fhirClient.get(`/CodeSystem?system=${system}&query=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    console.error('Error searching codes:', error);
    throw error;
  }
};

/**
 * Create a new condition for a patient (doctor only)
 * @param {Object} condition - Condition data { user_ref, code, display, severity, notes, ... }
 * @returns {Promise<Object>} Created FHIR Condition resource
 * @throws {Error} With enhanced error message from OperationOutcome if 422 response
 */
export const createCondition = async (condition, appointmentId = null) => {
  try {
    const payload = appointmentId ? { ...condition, appointmentId } : condition;
    console.log('[fhirApi.createCondition] ========== START ==========');
    console.log('[fhirApi.createCondition] Input condition:', JSON.stringify(payload, null, 2));
    
    // Client-side validation before sending to server
    console.log('[fhirApi.createCondition] Running client-side validation...');
    const validation = validateConditionPayload(payload);
    console.log('[fhirApi.createCondition] Validation result:', { valid: validation.valid, errors: validation.errors });
    
    if (!validation.valid) {
      console.warn('[fhirApi.createCondition] ❌ Client validation FAILED');
      const validationError = new Error('Client-side validation failed: ' + validation.errors.join('; '));
      validationError.clientValidationErrors = validation.errors;
      throw validationError;
    }

    console.log('[fhirApi.createCondition] ✅ Client validation PASSED');
    console.log('[fhirApi.createCondition] Preparing to send request...');
    console.log('[fhirApi.createCondition] Request URL: POST /Condition');
    console.log('[fhirApi.createCondition] Payload:', JSON.stringify(payload, null, 2));
    
    const response = await fhirClient.post('/Condition', payload);
    
    console.log('[fhirApi.createCondition] ✅ Server response received');
    console.log('[fhirApi.createCondition] Response status:', response.status);
    console.log('[fhirApi.createCondition] Response headers:', response.headers);
    console.log('[fhirApi.createCondition] Response data:', JSON.stringify(response.data, null, 2));
    console.log('[fhirApi.createCondition] ✅ Success (201 Created) ==========');
    return response.data;
  } catch (error) {
    console.error('[fhirApi.createCondition] ❌ ERROR CAUGHT');
    console.error('[fhirApi.createCondition] Error type:', error.constructor.name);
    console.error('[fhirApi.createCondition] Error message:', error.message);
    console.error('[fhirApi.createCondition] Error stack:', error.stack);
    
    // Enhanced error handling with OperationOutcome extraction
    let enhancedError = error;

    // Check for 422 Unprocessable Entity with OperationOutcome
    if (error.response?.status === 422) {
      console.error('[fhirApi.createCondition] ❌ Server validation error (422 Unprocessable Entity)');
      const operationOutcome = error.response?.data;
      console.error('[fhirApi.createCondition] OperationOutcome:', JSON.stringify(operationOutcome, null, 2));
      const outcomeErrors = extractOperationOutcomeErrors(operationOutcome);
      
      console.error('[fhirApi.createCondition] Extracted errors:', outcomeErrors);
      
      // Create enhanced error object with structured error info
      enhancedError = new Error('Server validation failed: ' + outcomeErrors.join('; '));
      enhancedError.response = error.response;
      enhancedError.operationOutcome = operationOutcome;
      enhancedError.validationErrors = outcomeErrors;
    } else if (error.response?.status === 500) {
      console.error('[fhirApi.createCondition] ❌❌ SERVER ERROR (500 Internal Server Error) ❌❌');
      console.error('[fhirApi.createCondition] Response status:', error.response?.status);
      console.error('[fhirApi.createCondition] Response statusText:', error.response?.statusText);
      console.error('[fhirApi.createCondition] Response data:', JSON.stringify(error.response?.data, null, 2));
      console.error('[fhirApi.createCondition] Response headers:', error.response?.headers);
      enhancedError = new Error(`HTTP ${error.response.status}: ${error.response.statusText || 'Internal Server Error'}`);
      enhancedError.response = error.response;
    } else if (error.response?.status) {
      console.error('[fhirApi.createCondition] ❌ HTTP error:', error.response.status);
      console.error('[fhirApi.createCondition] Response details:', JSON.stringify(error.response?.data, null, 2));
      enhancedError = new Error(`HTTP ${error.response.status}: ${error.response.statusText || 'Error'}`);
      enhancedError.response = error.response;
    } else if (error.clientValidationErrors) {
      console.error('[fhirApi.createCondition] ❌ Client validation error');
      console.error('[fhirApi.createCondition] Validation errors:', error.clientValidationErrors);
      enhancedError = error;
    } else {
      console.error('[fhirApi.createCondition] ❌ Unknown error type');
    }

    console.error('[fhirApi.createCondition] ========== END (ERROR) ==========');
    throw enhancedError;
  }
};

/**
 * Create a new observation (doctor only)
 * @param {Object} observation - Observation data { user_ref, code, value, effectiveDate, ... }
 * @returns {Promise<Object>} Created FHIR Observation resource
 * @throws {Error} With enhanced error message from OperationOutcome if 422 response
 */
export const createObservation = async (observation, appointmentId = null) => {
  let fhirPayload = null;
  try {
    console.log('[fhirApi.createObservation] ========== START ==========');
    console.log('[fhirApi.createObservation] Input observation:', JSON.stringify(observation, null, 2));
    
    // ✅ Fix dates: strip milliseconds for backend compatibility
    fhirPayload = {
      ...(appointmentId ? { ...observation, appointmentId } : observation),
      effectiveDateTime: observation.effectiveDateTime
        ? toCleanISO(observation.effectiveDateTime)
        : toCleanISO(),
      issued: observation.issued ? toCleanISO(observation.issued) : toCleanISO()
    };
    
    console.log('[fhirApi.createObservation] Sending request with payload:', JSON.stringify(fhirPayload, null, 2));
    const response = await fhirClient.post('/Observation', fhirPayload);
    
    console.log('[fhirApi.createObservation] ✅ Response received:', response.status);
    console.log('[fhirApi.createObservation] Response data:', JSON.stringify(response.data, null, 2));
    console.log('[fhirApi.createObservation] ========== END (SUCCESS) ==========');
    return response.data;
  } catch (error) {
    console.error('[fhirApi.createObservation] ❌ ERROR CAUGHT');
    console.error('[fhirApi.createObservation] Error type:', error.constructor.name);
    console.error('[fhirApi.createObservation] Error message:', error.message);
    
    // Enhanced error handling with OperationOutcome extraction
    let enhancedError = error;

    // Check for 422 Unprocessable Entity with OperationOutcome
    if (error.response?.status === 422) {
      console.error('[fhirApi.createObservation] ❌ Server validation error (422 Unprocessable Entity)');
      const operationOutcome = error.response?.data;
      console.error('[fhirApi.createObservation] OperationOutcome:', JSON.stringify(operationOutcome, null, 2));
      const outcomeErrors = extractOperationOutcomeErrors(operationOutcome);
      
      console.error('[fhirApi.createObservation] Extracted errors:', outcomeErrors);
      console.error('[fhirApi.createObservation] Sent payload:', JSON.stringify(fhirPayload, null, 2));
      
      // Create enhanced error object with structured error info
      enhancedError = new Error('Server validation failed: ' + outcomeErrors.join('; '));
      enhancedError.response = error.response;
      enhancedError.operationOutcome = operationOutcome;
      enhancedError.validationErrors = outcomeErrors;
    } else if (error.response?.status === 500) {
      console.error('[fhirApi.createObservation] ❌❌ SERVER ERROR (500 Internal Server Error) ❌❌');
      console.error('[fhirApi.createObservation] Response status:', error.response?.status);
      console.error('[fhirApi.createObservation] Response data:', JSON.stringify(error.response?.data, null, 2));
      console.error('[fhirApi.createObservation] Sent payload:', JSON.stringify(fhirPayload, null, 2));
      enhancedError = new Error(`HTTP ${error.response.status}: ${error.response.statusText || 'Internal Server Error'}`);
      enhancedError.response = error.response;
    } else if (error.response?.status) {
      console.error('[fhirApi.createObservation] ❌ HTTP error:', error.response.status);
      console.error('[fhirApi.createObservation] Response details:', JSON.stringify(error.response?.data, null, 2));
      console.error('[fhirApi.createObservation] Sent payload:', JSON.stringify(fhirPayload, null, 2));
      enhancedError = new Error(`HTTP ${error.response.status}: ${error.response.statusText || 'Error'}`);
      enhancedError.response = error.response;
    } else {
      console.error('[fhirApi.createObservation] ❌ Unknown error type');
    }

    console.error('[fhirApi.createObservation] ========== END (ERROR) ==========');
    throw enhancedError;
  }
};

/**
 * Create a new medication request (doctor only)
 * @param {Object} request - MedicationRequest data with FHIR R4 structure
 * @returns {Promise<Object>} Created FHIR MedicationRequest resource
 */
export const createMedicationRequest = async (request, appointmentId = null) => {
  let fhirPayload = null;
  try {
    // ✅ Fix dates: strip milliseconds for backend compatibility
    fhirPayload = {
      ...(appointmentId ? { ...request, appointmentId } : request),
      authoredOn: request.authoredOn ? toCleanISO(request.authoredOn) : toCleanISO()
    };
    
    console.log('[fhirApi.createMedicationRequest] Payload being sent:', JSON.stringify(fhirPayload, null, 2));
    const response = await fhirClient.post('/MedicationRequest', fhirPayload);
    return response.data;
  } catch (error) {
    // Step 1: Expose hidden error details including OperationOutcome
    console.error('MedicationRequest creation error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data ? JSON.stringify(error.response.data, null, 2) : 'No response data',
      sentPayload: fhirPayload ? JSON.stringify(fhirPayload, null, 2) : 'No payload',
      message: error.message
    });
    if (error.response?.status === 422) {
      const operationOutcome = error.response?.data;
      const outcomeErrors = extractOperationOutcomeErrors(operationOutcome);
      const enhancedError = new Error('Server validation failed: ' + outcomeErrors.join('; '));
      enhancedError.response = error.response;
      enhancedError.operationOutcome = operationOutcome;
      enhancedError.validationErrors = outcomeErrors;
      throw enhancedError;
    }
    throw error;
  }
};

/**
 * Create a new diagnostic report (doctor only)
 * @param {Object} report - DiagnosticReport data { user_ref, code, display, conclusion, ... }
 * @param {File} attachmentFile - Optional file attachment for the report
 * @returns {Promise<Object>} Created FHIR DiagnosticReport resource
 */
export const createDiagnosticReport = async (report, attachmentFile = null) => {
  let fhirPayload = null;
  try {
    const {
      appointmentId,
      patientId,
      doctorId,
      reportCode,
      reportName,
      reportDate,
      conclusion,
      observationIds
    } = report || {};

    if (!patientId) throw new Error('Missing patientId');
    if (!doctorId) throw new Error('Missing doctorId');

    // ✅ Use toCleanISO helper for all dates to strip milliseconds
    const now = toCleanISO();
    const effectiveDate = reportDate && !isNaN(new Date(reportDate))
      ? toCleanISO(reportDate)
      : now;

    // ✅ Build FHIR payload with clean date values
    fhirPayload = {
      ...(appointmentId ? { appointmentId } : {}),
      resourceType: 'DiagnosticReport',
      status: 'final',
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: reportCode || '11502-2',
          display: reportName || 'Lab Report'
        }],
        text: reportName || 'Lab Report'
      },
      subject: {
        reference: `Patient/${patientId}`
      },
      performer: [{
        reference: `Practitioner/${doctorId}`
      }],
      effectiveDateTime: effectiveDate,
      issued: now,
      result: observationIds?.length
        ? observationIds.map(id => ({ reference: `Observation/${id}` }))
        : [],
      conclusion: conclusion || ''
    };

    if (attachmentFile) {
      console.warn('[fhirApi.createDiagnosticReport] Attachment provided but JSON payload is required. Skipping file upload.');
    }

    console.log('[fhirApi.createDiagnosticReport] Payload being sent (json):', JSON.stringify(fhirPayload, null, 2));
    const response = await fhirClient.post('/DiagnosticReport', fhirPayload, {
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  } catch (error) {
    console.error('DiagnosticReport error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      operationOutcome: error.response?.data ? JSON.stringify(error.response.data, null, 2) : 'No response data',
      sentPayload: fhirPayload ? JSON.stringify(fhirPayload, null, 2) : 'No payload',
      message: error.message
    });
    if (error.response?.status === 422) {
      const operationOutcome = error.response?.data;
      const outcomeErrors = extractOperationOutcomeErrors(operationOutcome);
      const enhancedError = new Error('Server validation failed: ' + outcomeErrors.join('; '));
      enhancedError.response = error.response;
      enhancedError.operationOutcome = operationOutcome;
      enhancedError.validationErrors = outcomeErrors;
      throw enhancedError;
    }
    throw error;
  }
};

// ==================== PHASE 3: EXPORT, CONSENT & AUDIT ====================

/**
 * Trigger a bulk FHIR export job for a patient
 * @param {string} patientId - The patient's MongoDB ID
 * @param {Array} resourceTypes - Optional array of resource types to export
 * @returns {Promise<string>} Job location URL for polling
 */
export const triggerExport = async (patientId, resourceTypes = []) => {
  try {
    let url = `/Patient/${patientId}/$export`;
    if (resourceTypes.length > 0) {
      url += `?_type=${resourceTypes.join(',')}`;
    }
    const response = await fhirClient.get(url);
    // FHIR spec returns Content-Location header with job URL
    return response.headers['content-location'] || `/$export-status/${response.data?.issue?.[0]?.details?.text?.split(' ')[2]}`;
  } catch (error) {
    console.error('Error triggering export:', error);
    throw error;
  }
};

/**
 * Poll export job status
 * @param {string} jobId - The export job ID
 * @returns {Promise<Object>} { status: 'in-progress'|'completed'|'failed', outputUrls: {...} }
 */
export const pollExportStatus = async (jobId) => {
  try {
    const response = await fhirClient.get(`/$export-status/${jobId}`);
    
    // Parse response based on status code
    if (response.status === 202) {
      return { status: 'in-progress' };
    }
    
    if (response.status === 200) {
      // Extract URLs from bundle entry
      const outputUrls = {};
      if (response.data.entry) {
        response.data.entry.forEach(entry => {
          // Try to extract resource type from the data URL or use index
          const url = entry.resource?.data;
          const match = url?.match(/\/([A-Za-z]+)\.ndjson/);
          const resourceType = match ? match[1] : `file_${Object.keys(outputUrls).length}`;
          outputUrls[resourceType] = url;
        });
      }
      return { status: 'completed', outputUrls };
    }
    
    return { status: 'unknown' };
  } catch (error) {
    if (error.response?.status === 500) {
      const errorMsg = error.response.data?.issue?.[0]?.details?.text || 'Export failed';
      return { status: 'failed', error: errorMsg };
    }
    console.error('Error polling export status:', error);
    throw error;
  }
};

/**
 * Cancel a pending export job
 * @param {string} jobId - The export job ID
 * @returns {Promise<void>}
 */
export const cancelExport = async (jobId) => {
  try {
    await fhirClient.delete(`/$export-status/${jobId}`);
  } catch (error) {
    console.error('Error cancelling export:', error);
    throw error;
  }
};

/**
 * Grant consent to a doctor/hospital for specific resources
 * @param {Object} consentData - { grantedTo_ref, grantedToType, resourceTypes[], purpose, period }
 * @returns {Promise<Object>} Created FHIR Consent resource
 */
export const grantConsent = async (consentData) => {
  try {
    const response = await fhirClient.post('/Consent', consentData);
    return response.data;
  } catch (error) {
    console.error('Error granting consent:', error);
    throw error;
  }
};

/**
 * Request consent from a patient for specific resources (doctor only)
 * @param {Object} requestData - { patientId, doctorId, resourceTypes: [], message: "" }
 * @returns {Promise<Object>} { success: true, requestId, ... }
 */
export const requestConsent = async (requestData) => {
  try {
    console.log('🔵 [fhirApi] requestConsent called with:', requestData);
    console.log('   patientId:', requestData.patientId, 'Type:', typeof requestData.patientId);
    console.log('   doctorId:', requestData.doctorId, 'Type:', typeof requestData.doctorId);
    console.log('   resourceTypes:', requestData.resourceTypes);
    
    // Use apiClient which already has baseURL: ${BASE_URL}/api/v1
    const response = await apiClient.post('/consent/request', requestData);
    console.log('✅ [fhirApi] requestConsent response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ [fhirApi] Error requesting consent:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    throw error;
  }
};

/**
 * Get all consents for a patient
 * @param {string} patientId - The patient's MongoDB ID
 * @returns {Promise<Object>} FHIR Bundle of Consent resources
 */
export const getConsents = async (patientId, appointmentId = null) => {
  try {
    // Use apiClient which already has baseURL: ${BASE_URL}/api/v1
    const params = new URLSearchParams();
    if (appointmentId) {
      params.append('appointment', appointmentId);
    }
    const response = await apiClient.get(`/consent/active${params.toString() ? '?' + params.toString() : ''}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching consents:', error);
    throw error;
  }
};

/**
 * Revoke a consent
 * @param {string} consentId - The consent ID
 * @returns {Promise<void>}
 */
export const revokeConsent = async (consentId) => {
  try {
    await fhirClient.delete(`/Consent/${consentId}`);
  } catch (error) {
    console.error('Error revoking consent:', error);
    throw error;
  }
};

/**
 * Update a consent (period or resource types)
 * @param {string} consentId - The consent ID
 * @param {Object} updates - { period: {...}, resourceTypes: [...], status: ... }
 * @returns {Promise<Object>} Updated FHIR Consent resource
 */
export const updateConsent = async (consentId, updates) => {
  try {
    const response = await fhirClient.patch(`/Consent/${consentId}`, updates);
    return response.data;
  } catch (error) {
    console.error('Error updating consent:', error);
    throw error;
  }
};

/**
 * Get audit events for a patient
 * @param {string} patientId - The patient's MongoDB ID
 * @param {Object} params - Optional filters { date: '2026-03-13', action: 'READ' }
 * @returns {Promise<Object>} FHIR Bundle of AuditEvent resources
 */
export const getAuditEvents = async (patientId, params = {}) => {
  try {
    let url = `/AuditEvent?patient=${patientId}`;
    if (params.date) {
      url += `&date=${params.date}`;
    }
    if (params.action) {
      url += `&action=${params.action}`;
    }
    const response = await fhirClient.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching audit events:', error);
    throw error;
  }
};

/**
 * Upload a document for a patient (doctor only)
 * @param {FormData} formData - Form data with document fields and file
 * @returns {Promise<Object>} Created FHIR DocumentReference resource
 */
export const uploadDocument = async (formData) => {
  try {
    const uploadClient = axios.create({
      baseURL: `${BASE_URL}/fhir/R4`,
      headers: {
        Accept: 'application/fhir+json',
        // Don't set Content-Type for FormData
      }
    });

    uploadClient.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const response = await uploadClient.post('/DocumentReference', formData);
    return response.data;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
};

/**
 * Get all documents for a patient
 * @param {string} patientId - The patient's MongoDB ID
 * @param {Object} params - Optional filters { type: 'LOINC code', date: '2026-03-13' }
 * @returns {Promise<Object>} FHIR Bundle of DocumentReference resources
 */
export const getDocuments = async (patientId, params = {}) => {
  try {
    let url = `/DocumentReference?patient=${patientId}`;
    if (params.type) {
      url += `&type=${params.type}`;
    }
    if (params.date) {
      url += `&date=${params.date}`;
    }
    const response = await fhirClient.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }
};

/**
 * Delete a document (soft delete - marks as entered-in-error)
 * @param {string} docId - The document ID
 * @returns {Promise<void>}
 */
export const deleteDocument = async (docId) => {
  try {
    await fhirClient.delete(`/DocumentReference/${docId}`);
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

// ============================================
// OAUTH2/SMART ON FHIR FUNCTIONS
// ============================================

/**
 * Initiate OAuth2 SMART launch flow
 * Redirects to FHIR server authorization endpoint
 */
export const initiateSmartLaunch = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/auth/fhir/launch`);
    return response.data;
  } catch (error) {
    console.error('Error initiating SMART launch:', error);
    throw error;
  }
};

/**
 * Disconnect from FHIR OAuth
 * Revokes token and clears session
 */
export const disconnectFhir = async () => {
  try {
    await axios.get(`${BASE_URL}/auth/fhir/logout`);
  } catch (error) {
    console.error('Error disconnecting from FHIR:', error);
    throw error;
  }
};

/**
 * Get current FHIR OAuth connection status
 */
export const getFhirConnectionStatus = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/auth/fhir/status`);
    return response.data;
  } catch (error) {
    console.error('Error checking FHIR connection status:', error);
    throw error;
  }
};

/**
 * Refresh expired FHIR OAuth token
 * @param {string} refreshToken - Refresh token
 */
export const refreshFhirToken = async (refreshToken) => {
  try {
    const response = await axios.post(`${BASE_URL}/auth/fhir/refresh`, {
      refreshToken
    });
    return response.data;
  } catch (error) {
    console.error('Error refreshing FHIR token:', error);
    throw error;
  }
};

// ============================================
// DATA SYNCHRONIZATION FUNCTIONS
// ============================================

/**
 * Trigger bidirectional sync from external FHIR server
 * @param {string} patientId - Patient ID
 * @param {string} direction - Sync direction: 'in', 'out', 'both'
 */
export const triggerSync = async (patientId, direction = 'both') => {
  try {
    const response = await fhirClient.post(`/Patient/${patientId}/$sync`, {
      direction
    });
    return response.data;
  } catch (error) {
    console.error('Error triggering sync:', error);
    throw error;
  }
};

/**
 * Get status of sync operation
 * @param {string} patientId - Patient ID
 * @param {string} jobId - Optional sync job ID
 */
export const getSyncStatus = async (patientId, jobId = null) => {
  try {
    let url = `/Patient/${patientId}/$sync-status`;
    if (jobId) {
      url += `?jobId=${jobId}`;
    }
    const response = await fhirClient.get(url);
    
    // Extract sync status from OperationOutcome
    const outcome = response.data;
    return {
      status: outcome.meta?.status || outcome.issue?.[0]?.code,
      syncedAt: outcome.meta?.syncedAt,
      direction: outcome.meta?.direction,
      error: outcome.issue?.[0]?.diagnostics,
      syncedCount: outcome.meta?.syncedCount,
      conflicts: outcome.meta?.conflicts || [],
      details: outcome.meta || {}
    };
  } catch (error) {
    console.error('Error getting sync status:', error);
    throw error;
  }
};

/**
 * Get differences between local and external data
 * Useful for reviewing before sync
 * @param {string} patientId - Patient ID
 */
export const getSyncDiff = async (patientId) => {
  try {
    const response = await fhirClient.get(`/Patient/${patientId}/$diff`);
    
    // Parse FHIR Bundle response
    const bundle = response.data;
    const conflicts = (bundle.entry || [])
      .map(entry => ({
        resourceType: entry.resource.issue?.[0]?.meta?.conflictType,
        localId: entry.resource.issue?.[0]?.details?.localId,
        externalId: entry.resource.issue?.[0]?.details?.externalId,
        differences: entry.resource.issue?.[0]?.details?.differences
      }))
      .filter(c => c.localId);

    return {
      totalConflicts: bundle.total || 0,
      conflicts
    };
  } catch (error) {
    console.error('Error getting sync differences:', error);
    throw error;
  }
};

/**
 * Get a single condition by ID
 * @param {string} conditionId - The condition ID
 * @returns {Promise<Object>} FHIR Condition resource
 */
export const getConditionById = async (conditionId) => {
  try {
    const response = await fhirClient.get(`/Condition/${conditionId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching condition:', error);
    throw error;
  }
};

/**
 * Get pending consent requests for a patient
 * @param {string} patientId - The patient's MongoDB ID
 * @returns {Promise<Object>} FHIR Bundle of ConsentRequest resources
 */
export const getPendingConsentRequests = async (patientId) => {
  try {
    // Use apiClient which already has baseURL: ${BASE_URL}/api/v1
    const response = await apiClient.get(`/consent/requests?patient=${patientId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching pending consent requests:', error);
    throw error;
  }
};

/**
 * Respond to a consent request (approve or reject)
 * @param {string} requestId - The consent request ID
 * @param {string} action - 'approve' or 'reject'
 * @returns {Promise<Object>} Updated ConsentRequest resource
 */
export const respondToConsentRequest = async (requestId, action) => {
  try {
    // Use apiClient which already has baseURL: ${BASE_URL}/api/v1
    const endpoint = action === 'approve' ? 'approve' : 'reject';
    const response = await apiClient.post(`/consent/${endpoint}/${requestId}`);
    return response.data;
  } catch (error) {
    console.error('Error responding to consent request:', error);
    throw error;
  }
};

/**
 * Update an existing condition
 * @param {string} conditionId - The condition ID
 * @param {Object} updates - Fields to update { status, clinicalStatus, notes }
 * @returns {Promise<Object>} Updated FHIR Condition resource
 */
export const updateCondition = async (conditionId, updates) => {
  try {
    const response = await fhirClient.patch(`/Condition/${conditionId}`, updates);
    return response.data;
  } catch (error) {
    console.error('Error updating condition:', error);
    throw error;
  }
};

/**
 * Delete a condition (soft delete - marked as entered-in-error)
 * @param {string} conditionId - The condition ID
 * @returns {Promise<void>}
 */
export const deleteCondition = async (conditionId) => {
  try {
    await fhirClient.delete(`/Condition/${conditionId}`);
  } catch (error) {
    console.error('Error deleting condition:', error);
    throw error;
  }
};

/**
 * Get a single observation by ID
 * @param {string} observationId - The observation ID
 * @returns {Promise<Object>} FHIR Observation resource
 */
export const getObservationById = async (observationId) => {
  try {
    const response = await fhirClient.get(`/Observation/${observationId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching observation:', error);
    throw error;
  }
};

/**
 * Update an existing observation
 * @param {string} observationId - The observation ID
 * @param {Object} updates - Fields to update { value, interpretation, status }
 * @returns {Promise<Object>} Updated FHIR Observation resource
 */
export const updateObservation = async (observationId, updates) => {
  try {
    const response = await fhirClient.patch(`/Observation/${observationId}`, updates);
    return response.data;
  } catch (error) {
    console.error('Error updating observation:', error);
    throw error;
  }
};

/**
 * Get a single allergy/intolerance by ID
 * @param {string} allergyId - The allergy ID
 * @returns {Promise<Object>} FHIR AllergyIntolerance resource
 */
export const getAllergyById = async (allergyId) => {
  try {
    const response = await fhirClient.get(`/AllergyIntolerance/${allergyId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching allergy:', error);
    throw error;
  }
};

/**
 * Create a new allergy/intolerance
 * @param {Object} allergy - Allergy data { type, category, substance, reaction, clinicalStatus }
 * @returns {Promise<Object>} Created FHIR AllergyIntolerance resource
 */
export const createAllergyIntolerance = async (allergy) => {
  try {
    const response = await fhirClient.post('/AllergyIntolerance', allergy);
    return response.data;
  } catch (error) {
    console.error('Error creating allergy:', error);
    throw error;
  }
};

/**
 * Update an existing allergy/intolerance
 * @param {string} allergyId - The allergy ID
 * @param {Object} updates - Fields to update { clinicalStatus, reaction, note }
 * @returns {Promise<Object>} Updated FHIR AllergyIntolerance resource
 */
export const updateAllergy = async (allergyId, updates) => {
  try {
    const response = await fhirClient.patch(`/AllergyIntolerance/${allergyId}`, updates);
    return response.data;
  } catch (error) {
    console.error('Error updating allergy:', error);
    throw error;
  }
};

/**
 * Search medications
 * @param {Object} params - Query parameters { code, status }
 * @returns {Promise<Object>} FHIR Bundle of Medication resources
 */
export const getMedications = async (params = {}) => {
  try {
    let url = '/Medication';
    if (Object.keys(params).length > 0) {
      const queryString = new URLSearchParams(params).toString();
      url += `?${queryString}`;
    }
    const response = await fhirClient.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching medications:', error);
    throw error;
  }
};

/**
 * Get a single medication by ID
 * @param {string} medicationId - The medication ID
 * @returns {Promise<Object>} FHIR Medication resource
 */
export const getMedicationById = async (medicationId) => {
  try {
    const response = await fhirClient.get(`/Medication/${medicationId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching medication:', error);
    throw error;
  }
};

/**
 * Create a new medication
 * @param {Object} medication - Medication data { code, status }
 * @returns {Promise<Object>} Created FHIR Medication resource
 */
export const createMedication = async (medication) => {
  try {
    const response = await fhirClient.post('/Medication', medication);
    return response.data;
  } catch (error) {
    console.error('Error creating medication:', error);
    throw error;
  }
};

/**
 * Get a single medication request by ID
 * @param {string} requestId - The medication request ID
 * @returns {Promise<Object>} FHIR MedicationRequest resource
 */
export const getMedicationRequestById = async (requestId) => {
  try {
    const response = await fhirClient.get(`/MedicationRequest/${requestId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching medication request:', error);
    throw error;
  }
};

/**
 * Update a medication request
 * @param {string} requestId - The medication request ID
 * @param {Object} updates - Fields to update { status, dosageInstruction }
 * @returns {Promise<Object>} Updated FHIR MedicationRequest resource
 */
export const updateMedicationRequest = async (requestId, updates) => {
  try {
    const response = await fhirClient.patch(`/MedicationRequest/${requestId}`, updates);
    return response.data;
  } catch (error) {
    console.error('Error updating medication request:', error);
    throw error;
  }
};

/**
 * Get a single diagnostic report by ID
 * @param {string} reportId - The diagnostic report ID
 * @returns {Promise<Object>} FHIR DiagnosticReport resource
 */
export const getDiagnosticReportById = async (reportId) => {
  try {
    const response = await fhirClient.get(`/DiagnosticReport/${reportId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching diagnostic report:', error);
    throw error;
  }
};

/**
 * Get a single procedure by ID
 * @param {string} procedureId - The procedure ID
 * @returns {Promise<Object>} FHIR Procedure resource
 */
export const getProcedureById = async (procedureId) => {
  try {
    const response = await fhirClient.get(`/Procedure/${procedureId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching procedure:', error);
    throw error;
  }
};

/**
 * Create a new procedure
 * @param {Object} procedure - Procedure data { code, status, subject, performedDateTime }
 * @returns {Promise<Object>} Created FHIR Procedure resource
 */
export const createProcedure = async (procedure) => {
  try {
    const response = await fhirClient.post('/Procedure', procedure);
    return response.data;
  } catch (error) {
    console.error('Error creating procedure:', error);
    throw error;
  }
};

/**
 * Get a single immunization by ID
 * @param {string} immunizationId - The immunization ID
 * @returns {Promise<Object>} FHIR Immunization resource
 */
export const getImmunizationById = async (immunizationId) => {
  try {
    const response = await fhirClient.get(`/Immunization/${immunizationId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching immunization:', error);
    throw error;
  }
};

/**
 * Create a new immunization
 * @param {Object} immunization - Immunization data { vaccineCode, patient, status }
 * @returns {Promise<Object>} Created FHIR Immunization resource
 */
export const createImmunization = async (immunization) => {
  try {
    const response = await fhirClient.post('/Immunization', immunization);
    return response.data;
  } catch (error) {
    console.error('Error creating immunization:', error);
    throw error;
  }
};

/**
 * Trigger a bulk FHIR export (alias for triggerExport)
 */
export const initiateExport = async (patientId, resourceTypes = []) => {
  return triggerExport(patientId, resourceTypes);
};

/**
 * Edit a consent (alias for updateConsent)
 */
export const editConsent = async (consentId, updates) => {
  return updateConsent(consentId, updates);
};

/**
 * List all consents (alias for getConsents)
 */
export const listConsents = async (patientId) => {
  return getConsents(patientId);
};

/**
 * Get access logs (alias for getAuditEvents)
 */
export const getAccessLogs = async (patientId, params = {}) => {
  return getAuditEvents(patientId, params);
};

/**
 * List all documents (alias for getDocuments)
 */
export const listDocuments = async (patientId, params = {}) => {
  return getDocuments(patientId, params);
};

// ============================================
// FHIR API EXPORT OBJECT
// ============================================

/**
 * Main FHIR API export object
 * Provides all FHIR API methods in one namespace
 */
export const fhirApi = {
  // Patient data
  getPatient,
  getPractitioner,
  getOrganization,

  // Clinical resources
  getConditions,
  getConditionById,
  createCondition,
  updateCondition,
  deleteCondition,

  getObservations,
  getObservationById,
  createObservation,
  updateObservation,

  getAllergies,
  getAllergyById,
  createAllergyIntolerance,
  updateAllergy,

  getMedications,
  getMedicationById,
  createMedication,

  getMedicationRequests,
  getMedicationRequestById,
  createMedicationRequest,
  updateMedicationRequest,

  getDiagnosticReports,
  getDiagnosticReportById,
  createDiagnosticReport,

  getProcedures,
  getProcedureById,
  createProcedure,

  getImmunizations,
  getImmunizationById,
  createImmunization,

  // Phase 3: Export
  initiateExport,
  pollExportStatus,
  cancelExport,

  // Phase 3: Consent
  grantConsent,
  revokeConsent,
  editConsent,
  listConsents,
  getPendingConsentRequests,
  respondToConsentRequest,

  // Phase 3: Audit
  getAccessLogs,

  // Phase 3: Documents
  uploadDocument,
  listDocuments,
  deleteDocument,

  // OAuth/FHIR connection
  initiateSmartLaunch,
  disconnectFhir,
  getFhirConnectionStatus,
  refreshFhirToken,

  // Data sync
  triggerSync,
  getSyncStatus,
  getSyncDiff
};

export default fhirClient;
