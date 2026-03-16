/**
 * PHI Sanitizer Middleware
 * Strips Protected Health Information from error responses before sending to client
 * Applied AFTER all routes, BEFORE global errorHandler
 * 
 * Does not affect 2xx, 3xx responses — only applies to error responses (4xx, 5xx)
 */

/**
 * Regex patterns to detect and redact PHI
 */
const PHI_PATTERNS = {
  // Patient names (3+ words or all-caps)
  patientName: /\b[A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g,
  
  // Dates of birth (MM/DD/YYYY or YYYY-MM-DD)
  dob: /\b\d{1,2}\/\d{1,2}\/\d{4}\b|\b\d{4}-\d{1,2}-\d{1,2}\b/g,
  
  // Phone numbers (various formats)
  phone: /\b(?:\+?1[-.\s]?)?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})\b/g,
  
  // Email addresses
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  
  // Social Security Numbers
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  
  // Medical Record Numbers (MRN)
  mrn: /(?:MRN|Medical Record|Patient ID)[:\s]+(\d+)/gi,
  
  // ICD-10 codes
  icd10: /\b[A-Z]\d{2}(?:\.\d{1,2})?\b/g,
  
  // CPT codes (5 digits)
  cpt: /\b\d{5}\b/g,
  
  // SNOMED CT codes
  snomedCt: /\b\d{6,18}\b/g,
  
  // Common diagnosis keywords in context
  diagnosis: /(?:diagnosis|condition|disease|syndrome):\s*([A-Za-z\s]+)/gi,
  
  // Medication names
  medication: /(?:medication|drug|prescribed):\s*([A-Za-z\s]+)/gi,
  
  // Addresses (street patterns)
  address: /\d+\s+(?:North|South|East|West)?\s*\w+\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Circle|Cir|Lane|Ln|Drive|Dr|Way|Court|Ct|Place|Pl)/gi
};

/**
 * Redact PHI from a string
 */
function redactPHI(text) {
  if (typeof text !== 'string') {
    return text;
  }

  let redacted = text;
  
  // Redact patient names
  redacted = redacted.replace(PHI_PATTERNS.patientName, '[PATIENT_NAME]');
  
  // Redact dates of birth
  redacted = redacted.replace(PHI_PATTERNS.dob, '[DOB]');
  
  // Redact phone numbers
  redacted = redacted.replace(PHI_PATTERNS.phone, '[PHONE]');
  
  // Redact email addresses
  redacted = redacted.replace(PHI_PATTERNS.email, '[EMAIL]');
  
  // Redact SSN
  redacted = redacted.replace(PHI_PATTERNS.ssn, '[SSN]');
  
  // Redact MRN
  redacted = redacted.replace(PHI_PATTERNS.mrn, 'MRN: [REDACTED]');
  
  // Redact ICD-10 codes
  redacted = redacted.replace(PHI_PATTERNS.icd10, '[ICD10_CODE]');
  
  // Redact diagnosis information
  redacted = redacted.replace(PHI_PATTERNS.diagnosis, 'diagnosis: [DIAGNOSIS_REDACTED]');
  
  // Redact medication information
  redacted = redacted.replace(PHI_PATTERNS.medication, 'medication: [MEDICATION_REDACTED]');
  
  // Redact addresses
  redacted = redacted.replace(PHI_PATTERNS.address, '[ADDRESS]');
  
  return redacted;
}

/**
 * Recursively redact PHI from error objects/stack traces
 */
function sanitizeErrorObject(error) {
  if (!error) return error;
  
  const sanitized = { ...error };
  
  // Redact message
  if (sanitized.message) {
    sanitized.message = redactPHI(sanitized.message);
  }
  
  // Redact stack trace
  if (sanitized.stack) {
    sanitized.stack = redactPHI(sanitized.stack);
  }
  
  // Redact custom error fields
  if (sanitized.details) {
    if (typeof sanitized.details === 'string') {
      sanitized.details = redactPHI(sanitized.details);
    } else if (typeof sanitized.details === 'object') {
      Object.keys(sanitized.details).forEach(key => {
        if (typeof sanitized.details[key] === 'string') {
          sanitized.details[key] = redactPHI(sanitized.details[key]);
        }
      });
    }
  }
  
  // Redact any other string properties
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'string' && key !== 'stack') {
      sanitized[key] = redactPHI(sanitized[key]);
    }
  });
  
  return sanitized;
}

/**
 * PHI Sanitizer Middleware
 * Strips PHI from error responses before they reach the client
 */
function phiSanitizer(err, req, res, next) {
  // Only apply to error responses (4xx, 5xx)
  if (res.statusCode >= 400) {
    // Sanitize error object
    if (err && typeof err === 'object') {
      err = sanitizeErrorObject(err);
    }
    
    // Sanitize response body if already set
    if (res.locals && res.locals.errorResponse) {
      if (typeof res.locals.errorResponse === 'string') {
        res.locals.errorResponse = redactPHI(res.locals.errorResponse);
      } else if (typeof res.locals.errorResponse === 'object') {
        res.locals.errorResponse = sanitizeErrorObject(res.locals.errorResponse);
      }
    }
  }
  
  // Pass to next middleware
  next(err);
}

module.exports = phiSanitizer;
