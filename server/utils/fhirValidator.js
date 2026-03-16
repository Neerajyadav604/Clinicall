/**
 * FHIR R4 Profile Validation Utility
 * Validates FHIR resources against R4 rules
 * Called in POST handlers before saving to database
 */

const logger = require('../config/logger');

/**
 * FHIR R4 Required Fields by Resource Type
 */
const FHIR_REQUIRED_FIELDS = {
  Patient: ['name'],
  Condition: ['code'],
  Observation: ['code', 'value'],
  MedicationRequest: ['medication', 'subject'],
  Medication: ['code'],
  AllergyIntolerance: ['type', 'category'],
  DiagnosticReport: ['code', 'status'],
  Procedure: ['code', 'status'],
  Immunization: ['vaccineCode', 'status'],
  DocumentReference: ['status', 'content'],
  Consent: ['status', 'scope']
};

/**
 * Validate ISO 8601 date format
 */
function isValidISO8601Date(dateString) {
  console.log('[isValidISO8601Date] Validating:', dateString);
  if (!dateString) {
    console.log('[isValidISO8601Date] ❌ Empty or null');
    return false;
  }
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})?)?$/;
  if (!iso8601Regex.test(dateString)) {
    console.log('[isValidISO8601Date] ❌ Regex failed:', dateString);
    return false;
  }
  const date = new Date(dateString);
  const isValid = !isNaN(date.getTime());
  console.log('[isValidISO8601Date]', isValid ? '✅' : '❌', 'Result:', isValid);
  return isValid;
}

/**
 * Validate FHIR reference format
 * Must be: ResourceType/id or full URL
 */
function isValidFHIRReference(reference) {
  console.log('[isValidFHIRReference] Validating:', reference);
  if (!reference || typeof reference !== 'string') {
    console.log('[isValidFHIRReference] ❌ Not a non-empty string. Type:', typeof reference, 'Value:', reference);
    return false;
  }
  // Allow full URLs or ResourceType/id format
  const fhirRefRegex = /^(https?:\/\/.+\/)?[A-Z][a-zA-Z]*\/[a-zA-Z0-9\-\.]+$/;
  const isValid = fhirRefRegex.test(reference);
  console.log('[isValidFHIRReference]', isValid ? '✅' : '❌', 'Pattern:', fhirRefRegex);
  return isValid;
}

/**
 * Validate medical code fields
 * ICD-10, LOINC, SNOMED-CT must be non-empty
 */
function isValidMedicalCode(code) {
  console.log('[isValidMedicalCode] Validating:', code);
  if (!code || typeof code !== 'string') {
    console.log('[isValidMedicalCode] ❌ Not a non-empty string. Type:', typeof code, 'Value:', code);
    return false;
  }
  // Must be non-empty and can contain: alphanumerics, dots, hyphens
  const codeRegex = /^[A-Z0-9\.\-]{1,50}$/;
  const isValid = codeRegex.test(code);
  console.log('[isValidMedicalCode]', isValid ? '✅' : '❌', 'Pattern required:', '/^[A-Z0-9\.\-]{1,50}$/');
  return isValid;
}

/**
 * Validate a FHIR resource against R4 rules
 * @param {string} resourceType - FHIR resource type (Patient, Condition, etc)
 * @param {object} fhirJson - FHIR resource JSON object
 * @returns {object} { valid: boolean, errors: [] }
 */
function validateResource(resourceType, fhirJson) {
  console.log('[fhirValidator.validateResource] ========== START ==========');
  console.log('[fhirValidator.validateResource] Resource type:', resourceType);
  console.log('[fhirValidator.validateResource] Input JSON:', JSON.stringify(fhirJson, null, 2));
  
  const errors = [];

  if (!fhirJson) {
    console.error('[fhirValidator.validateResource] ❌ Resource body is empty');
    return {
      valid: false,
      errors: ['Resource body is empty']
    };
  }

  // 1. Verify resourceType field matches
  console.log('[fhirValidator.validateResource] [1/6] Checking resourceType field...');
  if (fhirJson.resourceType && fhirJson.resourceType !== resourceType) {
    const msg = `resourceType mismatch: expected ${resourceType}, got ${fhirJson.resourceType}`;
    console.error('[fhirValidator.validateResource]   ❌', msg);
    errors.push(msg);
  } else {
    console.log('[fhirValidator.validateResource]   ✅ resourceType OK');
  }

  // 2. Check required fields for this resource type
  console.log('[fhirValidator.validateResource] [2/6] Checking required fields...');
  const requiredFields = FHIR_REQUIRED_FIELDS[resourceType] || [];
  console.log('[fhirValidator.validateResource]   Expected required fields:', requiredFields);
  for (const field of requiredFields) {
    if (!fhirJson[field]) {
      const msg = `Missing required field: ${field}`;
      console.error('[fhirValidator.validateResource]   ❌', msg);
      errors.push(msg);
    } else {
      console.log('[fhirValidator.validateResource]   ✅', field, '=', fhirJson[field]);
    }
  }

  // 3. Validate date fields (ISO 8601 format)
  console.log('[fhirValidator.validateResource] [3/6] Validating date fields...');
  const dateFields = ['effectiveDate', 'issued', 'recordedDate', 'authoredOn', 'occurrenceDate', 'onsetDate', 'abatementDate'];
  for (const dateField of dateFields) {
    if (fhirJson[dateField]) {
      console.log('[fhirValidator.validateResource]   Checking', dateField, ':', fhirJson[dateField]);
      if (!isValidISO8601Date(fhirJson[dateField])) {
        const msg = `Invalid date format for ${dateField}: must be ISO 8601`;
        console.error('[fhirValidator.validateResource]   ❌', msg);
        errors.push(msg);
      } else {
        console.log('[fhirValidator.validateResource]   ✅', dateField, 'is valid');
      }
    }
  }

  // 4. Validate reference fields
  console.log('[fhirValidator.validateResource] [4/6] Validating reference fields...');
  const refFields = ['subject', 'performer', 'recorder', 'patient_ref', 'user_ref', 'doctor_ref', 'medication_ref'];
  for (const refField of refFields) {
    if (fhirJson[refField] && typeof fhirJson[refField] === 'string') {
      console.log('[fhirValidator.validateResource]   Checking', refField, ':', fhirJson[refField]);
      if (!isValidFHIRReference(fhirJson[refField])) {
        const msg = `Invalid FHIR reference format for ${refField}: must be ResourceType/id`;
        console.error('[fhirValidator.validateResource]   ❌', msg);
        errors.push(msg);
      } else {
        console.log('[fhirValidator.validateResource]   ✅', refField, 'is valid');
      }
    }
  }

  // 5. Validate code fields (ICD-10, LOINC, SNOMED)
  console.log('[fhirValidator.validateResource] [5/6] Validating code fields...');
  const codeFields = ['code', 'coding', 'vaccineCode'];
  for (const codeField of codeFields) {
    if (fhirJson[codeField]) {
      console.log('[fhirValidator.validateResource]   Checking', codeField, ':', fhirJson[codeField]);
      let codeValue = null;

      // Extract code value from different formats
      if (typeof fhirJson[codeField] === 'string') {
        codeValue = fhirJson[codeField];
        console.log('[fhirValidator.validateResource]     Is string:', codeValue);
      } else if (typeof fhirJson[codeField] === 'object') {
        // Handle { coding: "J00" }, { code: "J00" }, or { coding: ["..."] }
        codeValue = fhirJson[codeField].coding || fhirJson[codeField].code;
        console.log('[fhirValidator.validateResource]     Is object, extracted:', codeValue);
      }

      // Validate extracted code value
      if (codeValue) {
        // Handle case where coding is an array (convert to string for validation)
        const stringCode = Array.isArray(codeValue) ? codeValue[0] : codeValue;
        console.log('[fhirValidator.validateResource]     Validating code:', stringCode);
        if (typeof stringCode === 'string' && !isValidMedicalCode(stringCode)) {
          const msg = `Invalid medical code format for ${codeField}: "${stringCode}"`;
          console.error('[fhirValidator.validateResource]   ❌', msg);
          errors.push(msg);
        } else {
          console.log('[fhirValidator.validateResource]   ✅', codeField, 'is valid');
        }
      }
    }
  }

  // 6. Resource-specific validations
  console.log('[fhirValidator.validateResource] [6/6] Resource-specific validations...');
  if (resourceType === 'Observation') {
    console.log('[fhirValidator.validateResource]   Running Observation-specific validations...');
    // Validate patient reference (subject/userId/user_ref)
    if (!fhirJson.subject && !fhirJson.userId && !fhirJson.user_ref) {
      const msg = 'Observation must have subject (patient reference)';
      console.error('[fhirValidator.validateResource]   ❌', msg);
      errors.push(msg);
    }

    // Validate code
    if (!fhirJson.code) {
      const msg = 'Observation code is required';
      console.error('[fhirValidator.validateResource]   ❌', msg);
      errors.push(msg);
    }

    // Validate value - can be: quantity, codeableConcept, or string
    // Accept flexible formats: direct number, or object with value property
    if (!fhirJson.value && fhirJson.value !== 0) {
      const msg = 'Observation must have a value (quantity, codeableConcept, or string)';
      console.error('[fhirValidator.validateResource]   ❌', msg);
      errors.push(msg);
    }
  }
  
  if (resourceType === 'Condition') {
    console.log('[fhirValidator.validateResource]   Running Condition-specific validations...');
    
    // Validate code.system enum
    if (fhirJson.code && typeof fhirJson.code === 'object') {
      const codeSystem = fhirJson.code.system;
      const allowedSystems = ['http://hl7.org/fhir/sid/icd-10', 'http://hl7.org/fhir/sid/icd-10-cm', 'http://snomed.info/sct', 'http://clinicall.local/condition'];
      
      console.log('[fhirValidator.validateResource]   Checking code.system:', codeSystem);
      console.log('[fhirValidator.validateResource]   Allowed systems:', allowedSystems);
      
      if (codeSystem && !allowedSystems.includes(codeSystem)) {
        const msg = `Invalid code.system "${codeSystem}". Must be one of: ${allowedSystems.join(', ')}`;
        console.error('[fhirValidator.validateResource]   ❌', msg);
        errors.push(msg);
      } else {
        console.log('[fhirValidator.validateResource]   ✅ code.system is valid');
      }
    }
    
    console.log('[fhirValidator.validateResource]   Total errors found:', errors.length);
  }

  const result = {
    valid: errors.length === 0,
    errors
  };
  
  console.log('[fhirValidator.validateResource] Result:', { valid: result.valid, errorCount: result.errors.length });
  if (result.errors.length > 0) {
    console.log('[fhirValidator.validateResource] Errors:', result.errors);
  }
  console.log('[fhirValidator.validateResource] ========== END ==========');
  
  return result;
}


/**
 * Create FHIR OperationOutcome response for validation errors
 * @param {array} errors - Array of error messages
 * @returns {object} FHIR OperationOutcome resource
 */
function createOperationOutcome(errors) {
  return {
    resourceType: 'OperationOutcome',
    issue: (errors || []).map((error, index) => ({
      severity: 'error',
      code: 'invalid',
      details: {
        text: error
      },
      expression: [`resource.field[${index}]`]
    }))
  };
}

module.exports = {
  validateResource,
  createOperationOutcome,
  isValidISO8601Date,
  isValidFHIRReference,
  isValidMedicalCode
};
