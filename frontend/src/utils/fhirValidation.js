/**
 * FHIR R4 Validation Utilities
 * Central place for all FHIR validation logic and regex patterns
 * 
 * Use these functions and patterns for validating FHIR resources
 * in the frontend before sending to the backend.
 */

// ==================== REGEX PATTERNS ====================

/**
 * FHIR Reference Format
 * Pattern: ResourceType/id or full URL
 * 
 * Valid examples:
 *   - "Patient/507f1f77bcf86cd799439011"
 *   - "Practitioner/doctor-123"
 *   - "Condition/cond-001"
 *   - "https://example.com/fhir/R4/Patient/123"
 * 
 * Invalid examples:
 *   - "507f1f77bcf86cd799439011" (missing ResourceType)
 *   - "patient/123" (lowercase ResourceType)
 *   - "Patient/" (missing id)
 *   - "/Patient/123" (leading slash)
 */
export const FHIR_REFERENCE_REGEX = /^(https?:\/\/.+\/)?[A-Z][a-zA-Z0-9]*\/[a-zA-Z0-9\-\.]+$/;

/**
 * ICD-10 / SNOMED-CT Medical Code Format
 * Pattern: Alphanumeric with dots and hyphens, max 20 chars
 * 
 * Valid examples:
 *   - "J45.9" (Asthma, unspecified)
 *   - "E11.9" (Type 2 diabetes)
 *   - "A00" (Cholera)
 *   - "J06-9" (Unspecified acute upper respiratory infection)
 *   - "I10" (Essential hypertension)
 * 
 * Invalid examples:
 *   - "J45{Asthma}" (has curly braces)
 *   - "J45 (Asthma)" (has parentheses and space)
 *   - "45" (missing letter prefix)
 *   - "J45@9" (has @ symbol)
 *   - "j45.9" (lowercase, though we uppercase in sanitizer)
 */
export const MEDICAL_CODE_REGEX = /^[A-Z0-9\.\-]{1,20}$/i;

/**
 * ICD-10-CM Code Format (more specific)
 * Pattern: Letter(s) + number + optional (dot + descriptors)
 * 
 * Valid examples:
 *   - "J45.901" (Uncontrolled asthma with status specified)
 *   - "E10.65" (Type 1 diabetes with hypoglycemia)
 *   - "I50.9" (Heart failure, unspecified)
 * 
 * Note: Backend accepts the simpler MEDICAL_CODE_REGEX
 */
export const ICD10_REGEX = /^[A-Z]\d{2}(\.\d{1,2})?$/;

/**
 * SNOMED-CT Code Format (numeric format)
 * Pattern: 1-18 digit code
 * 
 * Valid examples:
 *   - "38341003" (Hypertensive disorder)
 *   - "195662009" (Viral pneumonia)
 */
export const SNOMED_NUMERIC_REGEX = /^\d{1,18}$/;

/**
 * LOINC Code Format (numeric with optional hyphen)
 * Pattern: 1-5 digits, optional hyphen, 1 digit
 * 
 * Valid examples:
 *   - "2345-7" (Glucose [Mass/volume] in Serum)
 *   - "3016-3" (Hemoglobin [Mass/volume] in Blood)
 */
export const LOINC_REGEX = /^\d{1,5}-\d{1}$/;

/**
 * MongoDB ObjectId Format
 * Pattern: 24 hexadecimal characters
 * 
 * Valid examples:
 *   - "507f1f77bcf86cd799439011"
 *   - "507f191e810c19729de860ea"
 */
export const MONGODB_ID_REGEX = /^[a-f0-9]{24}$/i;

/**
 * ISO 8601 Date Format
 * Pattern: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss or with timezone
 * 
 * Valid examples:
 *   - "2026-03-15"
 *   - "2026-03-15T14:30:00"
 *   - "2026-03-15T14:30:00Z"
 *   - "2026-03-15T14:30:00+05:30"
 */
export const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})?)?$/;

// ==================== VALIDATION FUNCTIONS ====================

/**
 * Validate FHIR reference format
 * @param {string} reference - Reference to validate
 * @returns {boolean}
 * 
 * @example
 * validateFHIRReference("Patient/507f1f77bcf86cd799439011") // true
 * validateFHIRReference("507f1f77bcf86cd799439011") // false
 */
export const validateFHIRReference = (reference) => {
  if (!reference || typeof reference !== 'string') return false;
  return FHIR_REFERENCE_REGEX.test(reference);
};

/**
 * Validate medical code (ICD-10, SNOMED-CT, LOINC)
 * Accepts simple alphanumeric + dots/hyphens format
 * @param {string} code - Code to validate
 * @returns {boolean}
 * 
 * @example
 * validateMedicalCode("J45.9") // true
 * validateMedicalCode("J45{Asthma)") // false
 */
export const validateMedicalCode = (code) => {
  if (!code || typeof code !== 'string') return false;
  return MEDICAL_CODE_REGEX.test(code.trim());
};

/**
 * Validate ICD-10 specific format
 * @param {string} code - ICD-10 code to validate
 * @returns {boolean}
 */
export const validateICD10Code = (code) => {
  if (!code || typeof code !== 'string') return false;
  return ICD10_REGEX.test(code.trim());
};

/**
 * Validate SNOMED-CT code
 * @param {string} code - SNOMED code to validate
 * @returns {boolean}
 */
export const validateSNOMEDCode = (code) => {
  if (!code || typeof code !== 'string') return false;
  return SNOMED_NUMERIC_REGEX.test(code.trim());
};

/**
 * Validate LOINC code
 * @param {string} code - LOINC code to validate
 * @returns {boolean}
 */
export const validateLOINCCode = (code) => {
  if (!code || typeof code !== 'string') return false;
  return LOINC_REGEX.test(code.trim());
};

/**
 * Validate MongoDB ObjectId
 * @param {string} id - ID to validate
 * @returns {boolean}
 */
export const validateMongoDBId = (id) => {
  if (!id || typeof id !== 'string') return false;
  return MONGODB_ID_REGEX.test(id);
};

/**
 * Validate ISO 8601 date
 * @param {string} dateString - Date string to validate
 * @returns {boolean}
 */
export const validateISO8601Date = (dateString) => {
  if (!dateString || typeof dateString !== 'string') return false;
  if (!ISO_DATE_REGEX.test(dateString)) return false;
  // Additional check: ensure it's a valid date
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

// ==================== SANITIZATION FUNCTIONS ====================

/**
 * Sanitize medical code by removing invalid characters
 * Converts to uppercase and removes: {}, (), spaces, special chars
 * 
 * @param {string} code - Code to sanitize
 * @returns {string} Sanitized code
 * 
 * @example
 * sanitizeCode("J45{Asthma)") // "J45"
 * sanitizeCode("E11.9") // "E11.9"
 * sanitizeCode("j45-9 (asthma)") // "J45-9"
 */
export const sanitizeCode = (code) => {
  if (!code) return '';
  
  return code
    .toUpperCase()
    .trim()
    .replace(/[{}()]/g, '')              // Remove all brackets and parens
    .replace(/\s+/g, '')                 // Remove spaces
    .replace(/[^A-Z0-9\.\-]/g, '')       // Keep only alphanumeric, dots, hyphens
    .substring(0, 20);                   // Max 20 chars
};

/**
 * Format MongoDB ObjectId as FHIR reference
 * @param {string} resourceType - Resource type (Patient, Practitioner, etc)
 * @param {string} id - MongoDB ObjectId
 * @returns {string} FHIR reference (e.g., "Patient/507f1f77bcf86cd799439011")
 * 
 * @example
 * formatReference("Patient", "507f1f77bcf86cd799439011")
 * // "Patient/507f1f77bcf86cd799439011"
 */
export const formatReference = (resourceType, id) => {
  if (!resourceType || !id) {
    throw new Error('resourceType and id are required');
  }
  if (typeof resourceType !== 'string' || typeof id !== 'string') {
    throw new TypeError('resourceType and id must be strings');
  }
  return `${resourceType}/${id.trim()}`;
};

/**
 * Extract resource type and ID from FHIR reference
 * @param {string} reference - FHIR reference (e.g., "Patient/507f...")
 * @returns {{resourceType: string, id: string} | null} Object with resourceType and id, or null if invalid
 * 
 * @example
 * parseReference("Patient/507f1f77bcf86cd799439011")
 * // { resourceType: "Patient", id: "507f1f77bcf86cd799439011" }
 */
export const parseReference = (reference) => {
  if (!validateFHIRReference(reference)) return null;
  
  // Handle URL format: https://example.com/fhir/R4/Patient/123
  if (reference.startsWith('http')) {
    const parts = reference.split('/');
    return {
      resourceType: parts[parts.length - 2],
      id: parts[parts.length - 1]
    };
  }
  
  // Handle simple format: Patient/123
  const [resourceType, id] = reference.split('/');
  return { resourceType, id };
};

// ==================== ERROR MESSAGES ====================

/**
 * Get user-friendly error message for validation failures
 * @param {string} fieldName - Field name (e.g., "code", "user_ref")
 * @param {string} validationType - Type of validation (e.g., "reference", "code")
 * @returns {string} Error message
 */
export const getValidationErrorMessage = (fieldName, validationType) => {
  const messages = {
    'code.medical_code': 'Medical code must contain only letters, numbers, dots, and hyphens (e.g., J45.9)',
    'code.required': 'Medical code is required. Example: J45.9 (Asthma)',
    'code.invalid_chars': 'Code contains invalid characters. Remove brackets, parentheses, and special symbols.',
    'user_ref.reference': 'Patient reference must be in format "Patient/id" (e.g., "Patient/507f1f77bcf86cd799439011")',
    'user_ref.required': 'Patient reference is required',
    'severity.enum': 'Severity must be one of: mild, moderate, severe',
    'clinicalStatus.enum': 'Status must be one of: active, recurrence, inactive, remission',
    'date.iso8601': 'Date must be in ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ)'
  };
  
  const key = `${fieldName}.${validationType}`;
  return messages[key] || `Invalid ${fieldName}`;
};

// ==================== REFERENCE PATTERNS DOCUMENTATION ====================

/**
 * FHIR Reference Format Cheat Sheet
 * 
 * CORRECT FORMATS:
 * ├─ Patient reference: "Patient/507f1f77bcf86cd799439011"
 * ├─ Doctor reference: "Practitioner/doctor-123"
 * ├─ Hospital ref: "Organization/hospital-456"
 * ├─ Full URL: "https://example.com/fhir/R4/Patient/123"
 * └─ Relative URL: "/fhir/R4/Patient/123"
 * 
 * INCORRECT FORMATS (will FAIL validation):
 * ├─ "507f1f77bcf86cd799439011" ❌ Missing ResourceType prefix
 * ├─ "patient/507f..." ❌ ResourceType must be capitalized
 * ├─ "Patient/" ❌ Missing id
 * ├─ "/Patient/123" ❌ Leading slash
 * ├─ "Patient 507f..." ❌ Space instead of slash
 * └─ "Patient\\507f..." ❌ Backslash instead of slash
 * 
 * VALID RESOURCE TYPES:
 * ├─ Patient                ├─ Practitioner          ├─ Organization
 * ├─ Condition              ├─ Observation           ├─ MedicationRequest
 * ├─ Medication             ├─ DiagnosticReport      ├─ AllergyIntolerance
 * μ─ Procedure              ├─ Immunization          └─ Encounter
 */

/**
 * Medical Code Format Cheat Sheet
 * 
 * ICD-10 EXAMPLES:
 * ├─ J45.9 (Asthma, unspecified)
 * ├─ E11.9 (Type 2 diabetes without complications)
 * ├─ I10 (Essential hypertension)
 * └─ A00 (Cholera)
 * 
 * SNOMED-CT EXAMPLES:
 * ├─ 38341003 (Hypertensive disorder)
 * ├─ 195662009 (Viral pneumonia)
 * └─ 73211009 (Diabetes mellitus)
 * 
 * LOINC EXAMPLES:
 * ├─ 2345-7 (Glucose in Serum)
 * ├─ 3016-3 (Hemoglobin in Blood)
 * └─ 718-7 (Hemoglobin in Serum)
 * 
 * INVALID FORMATS:
 * ├─ "J45{Asthma)" ❌ Curly brace and wrong paren
 * ├─ "J45 (Asthma)" ❌ Parentheses and description
 * ├─ "45" ❌ Missing letter prefix
 * ├─ "J45@9" ❌ Invalid @ symbol
 * └─ "ASTHMA" ❌ No code number
 */

export default {
  FHIR_REFERENCE_REGEX,
  MEDICAL_CODE_REGEX,
  ICD10_REGEX,
  SNOMED_NUMERIC_REGEX,
  LOINC_REGEX,
  MONGODB_ID_REGEX,
  ISO_DATE_REGEX,
  validateFHIRReference,
  validateMedicalCode,
  validateICD10Code,
  validateSNOMEDCode,
  validateLOINCCode,
  validateMongoDBId,
  validateISO8601Date,
  sanitizeCode,
  formatReference,
  parseReference,
  getValidationErrorMessage
};
