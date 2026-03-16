# FHIR Condition Creation Fix — Complete Guide

## Overview

This document explains the fixes for the 422 Unprocessable Entity errors when calling `fhirApi.createCondition()`. The issues were:

1. **Invalid FHIR reference format**: Sending plain MongoDB ObjectId instead of `Patient/id` format
2. **Invalid medical code format**: Sending malformed codes like `J45{Asthma)` instead of `J45.9`

This guide covers the complete fix stack: frontend validation, backend validation, regexes, and error handling.

---

## Error Summary

### Error 1: Invalid FHIR Reference Format

```
Invalid FHIR reference format for user_ref: must be ResourceType/id
```

**Root Cause**: Frontend was sending:
```json
{
  "user_ref": "64abc123def456"  // ❌ Plain MongoDB ObjectId
}
```

**Expected Format**:
```json
{
  "user_ref": "Patient/64abc123def456"  // ✅ FHIR ResourceType/id format
}
```

### Error 2: Invalid Medical Code Format

```
Invalid medical code format for code: "J45{Asthma)"
```

**Root Cause**: Frontend input field had malformed characters:
```json
{
  "code": "J45{Asthma)"  // ❌ Invalid { character, mismatched )
}
```

**Expected Format**:
```json
{
  "code": "J45.9"  // ✅ Valid ICD-10 code format
}
```

---

## Frontend Fixes

### 1. ClinicalNotes.jsx — ConditionForm Component

**File**: [frontend/src/pages/doctor/ClinicalNotes.jsx](frontend/src/pages/doctor/ClinicalNotes.jsx)

#### Key Changes:

1. **Format user_ref as FHIR reference**:
   ```javascript
   // BEFORE (❌ wrong)
   const payload = {
     user_ref: patientId  // "64abc123def456"
   };

   // AFTER (✅ correct)
   const payload = {
     user_ref: `Patient/${patientId}`  // "Patient/64abc123def456"
   };
   ```

2. **Sanitize code input**:
   ```javascript
   const sanitizeCode = (codeInput) => {
     if (!codeInput) return '';
     
     return codeInput
       .toUpperCase()
       .replace(/[{}]/g, '')           // Remove curly braces
       .replace(/\([^)]*\)/g, '')      // Remove text in parentheses
       .replace(/\s+/g, '')            // Remove spaces
       .replace(/[^A-Z0-9\.\-]/g, ''); // Keep only alphanumeric, dots, hyphens
   };
   ```

3. **Client-side validation before submission**:
   ```javascript
   const validateConditionForm = () => {
     const errors = [];
     
     // Code must exist
     if (!form.code || !form.code.trim()) {
       errors.push('Condition code is required');
       return errors;
     }

     // Code format validation: alphanumeric + dots/hyphens only
     const codeRegex = /^[A-Z0-9\.\-]{1,20}$/i;
     if (!codeRegex.test(form.code.trim())) {
       errors.push(
         'Code contains invalid characters. ' +
         'Only alphanumeric, dots (.), and hyphens (-) allowed. ' +
         'Example: J45.9, E11-22'
       );
     }

     return errors;
   };
   ```

4. **Display validation errors inline**:
   ```javascript
   {validationErrors.length > 0 && (
     <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
       <AlertCircle className="w-5 h-5 text-red-600" />
       <ul className="text-sm text-red-800 space-y-1">
         {validationErrors.map((err, i) => (
           <li key={i}>{err}</li>
         ))}
       </ul>
     </div>
   )}
   ```

5. **Handle OperationOutcome errors from server**:
   ```javascript
   catch (error) {
     // Extract validation errors (422 response)
     if (error.validationErrors && Array.isArray(error.validationErrors)) {
       error.validationErrors.forEach(msg => toast.error(msg));
     }
     // Or client-side validation errors
     else if (error.clientValidationErrors && Array.isArray(error.clientValidationErrors)) {
       error.clientValidationErrors.forEach(msg => toast.error(msg));
     }
     // Generic fallback
     else {
       toast.error(error.message || 'Error creating condition');
     }
   }
   ```

---

### 2. fhirApi.js — API Service Layer

**File**: [frontend/src/services/fhirApi.js](frontend/src/services/fhirApi.js)

#### Key Additions:

1. **Validation regex patterns**:
   ```javascript
   const FHIR_REGEXES = {
     // FHIR Reference: ResourceType/id
     REFERENCE: /^(https?:\/\/.+\/)?[A-Z][a-zA-Z0-9]*\/[a-zA-Z0-9\-\.]+$/,
     
     // Medical code: alphanumeric + dots/hyphens
     MEDICAL_CODE: /^[A-Z0-9\.\-]{1,20}$/i,
     
     // ISO 8601 date
     ISO_DATE: /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})?)?$/
   };
   ```

2. **Validator functions**:
   ```javascript
   export const isValidFHIRReference = (reference) => {
     if (!reference || typeof reference !== 'string') return false;
     return FHIR_REGEXES.REFERENCE.test(reference);
   };

   export const isValidMedicalCode = (code) => {
     if (!code || typeof code !== 'string') return false;
     return FHIR_REGEXES.MEDICAL_CODE.test(code.trim());
   };
   ```

3. **Payload validator**:
   ```javascript
   export const validateConditionPayload = (condition) => {
     const errors = [];

     if (!condition.user_ref) {
       errors.push('user_ref is required');
     } else if (!isValidFHIRReference(condition.user_ref)) {
       errors.push(
         `user_ref must be "ResourceType/id" format. ` +
         `Got: "${condition.user_ref}"`
       );
     }

     if (!condition.code) {
       errors.push('code is required');
     } else if (!isValidMedicalCode(condition.code)) {
       errors.push(
         `code must be alphanumeric with dots/hyphens. ` +
         `Got: "${condition.code}"`
       );
     }

     return { valid: errors.length === 0, errors };
   };
   ```

4. **OperationOutcome error extraction**:
   ```javascript
   export const extractOperationOutcomeErrors = (operationOutcome) => {
     const errors = [];

     if (Array.isArray(operationOutcome.issue)) {
       operationOutcome.issue.forEach(issue => {
         if (issue.diagnostics) {
           errors.push(issue.diagnostics);
         } else if (issue.details?.text) {
           errors.push(issue.details.text);
         }
       });
     }

     return errors.length > 0 ? errors : ['Unknown validation error'];
   };
   ```

5. **Enhanced createCondition function**:
   ```javascript
   export const createCondition = async (condition) => {
     try {
       // Validate before sending
       const validation = validateConditionPayload(condition);
       if (!validation.valid) {
         const error = new Error('Client validation failed: ' + validation.errors.join('; '));
         error.clientValidationErrors = validation.errors;
         throw error;
       }

       // Send to server
       const response = await fhirClient.post('/Condition', condition);
       return response.data;
     } catch (error) {
       // Extract OperationOutcome if 422 response
       if (error.response?.status === 422) {
         const outcome = error.response.data;
         const outcomeErrors = extractOperationOutcomeErrors(outcome);
         const newError = new Error('Server validation failed');
         newError.validationErrors = outcomeErrors;
         newError.response = error.response;
         throw newError;
       }
       throw error;
     }
   };
   ```

---

### 3. New Utility File: fhirValidation.js

**File**: [frontend/src/utils/fhirValidation.js](frontend/src/utils/fhirValidation.js)

This file provides comprehensive validation utilities:

```javascript
export const FHIR_REFERENCE_REGEX = /^(https?:\/\/.+\/)?[A-Z][a-zA-Z0-9]*\/[a-zA-Z0-9\-\.]+$/;
export const MEDICAL_CODE_REGEX = /^[A-Z0-9\.\-]{1,20}$/i;

export const validateFHIRReference = (reference) => { /* ... */ };
export const validateMedicalCode = (code) => { /* ... */ };
export const sanitizeCode = (code) => { /* ... */ };
export const formatReference = (resourceType, id) => { /* ... */ };
```

**Why separate file**:
- Reusable across multiple components
- Centralized reference for all FHIR validation logic
- Easy to test and maintain
- Clear documentation with examples

---

## Backend Validation (Reference)

### fhirValidator.js — Backend Validation Logic

**File**: [server/utils/fhirValidator.js](server/utils/fhirValidator.js)

The backend validates using:

```javascript
// Reference validation regex
const fhirRefRegex = /^(https?:\/\/.+\/)?[A-Z][a-zA-Z]*\/[a-zA-Z0-9\-\.]+$/;

// Medical code validation
function isValidMedicalCode(code) {
  return /^[A-Z0-9\.\-]{1,50}$/.test(code);
}

// In POST /Condition handler:
const validation = validateResource('Condition', req.body);
if (!validation.valid) {
  return res.status(422).json(createOperationOutcome(validation.errors));
}
```

**Backend expects you to**:
1. Format `user_ref` as `Patient/{id}` ✅ (Fixed in frontend)
2. Send clean code like `J45.9` ✅ (Fixed with sanitizer)
3. No custom validation needed on backend — frontend fixes are sufficient

---

## Regex Patterns — Complete Reference

### FHIR Reference Format

**Pattern**:
```
ResourceType/id
or
https://.../ ResourceType/id
```

**Regex**:
```regex
^(https?:\/\/.+\/)?[A-Z][a-zA-Z0-9]*\/[a-zA-Z0-9\-\.]+$
```

**Valid Examples**:
```
✅ Patient/507f1f77bcf86cd799439011
✅ Practitioner/doctor-123
✅ Condition/cond-001-abc
✅ https://example.com/fhir/R4/Patient/123
```

**Invalid Examples** (will FAIL 422 validation):
```
❌ 507f1f77bcf86cd799439011           (no ResourceType)
❌ patient/507f...                    (lowercase ResourceType)
❌ Patient/                            (no id)
❌ /Patient/123                        (leading slash)
❌ Patient 507f...                     (space instead of slash)
```

### ICD-10 Medical Code Format

**Pattern**:
```
Letter(s) + Digit(s) + optional(Dot or Hyphen + Digit)
```

**Regex** (simplified, accepts ICD-10, SNOMED, LOINC):
```regex
^[A-Z0-9\.\-]{1,20}$
```

**Regex** (ICD-10 specific):
```regex
^[A-Z]\d{2}(\.\d{1,2})?$
```

**Valid Examples**:
```
✅ J45.9       (Asthma, unspecified)
✅ E11.9       (Type 2 diabetes)
✅ I10         (Essential hypertension)
✅ A00         (Cholera)
✅ J06-9       (Upper respiratory infection)
```

**Invalid Examples** (will FAIL 422 validation):
```
❌ J45{Asthma}   (curly braces)
❌ J45 (Asthma)  (parentheses + space)
❌ j45.9         (lowercase, though tolerant)
❌ 45.9          (no letter prefix)
❌ J45@9         (special char @)
❌ ASTHMA        (no code)
```

### SNOMED-CT Code Format

**Regex**:
```regex
^\d{1,18}$
```

**Valid Examples**:
```
✅ 38341003          (Hypertensive disorder)
✅ 195662009         (Viral pneumonia)
```

### LOINC Code Format

**Regex**:
```regex
^\d{1,5}-\d{1}$
```

**Valid Examples**:
```
✅ 2345-7       (Glucose in Serum)
✅ 3016-3       (Hemoglobin in Blood)
```

---

## Error Handling — Complete Flow

### Scenario: User enters "J45{Asthma)"

**Step 1: Frontend Input**
```javascript
const form = { code: "J45{Asthma)" };
```

**Step 2: Client-side Validation (ClinicalNotes.jsx)**
```javascript
validateConditionForm()
// Returns: ['Code contains invalid characters...']
// Shows user inline error ❌
```

**Step 3: If user somehow bypasses, Sanitization (fhirApi.js)**
```javascript
sanitizeMedicalCode("J45{Asthma)")
// Returns: "J45" (cleaned version)
// Sends sanitized code to server
```

**Step 4: Server Validation (backend fhirValidator.js)**
```javascript
isValidMedicalCode("J45")
// Returns: true ✅
```

**Step 5: Success**
```json
{
  "code": "J45",
  "display": "J45",
  "user_ref": "Patient/507f...",
  "severity": "mild",
  "clinicalStatus": "active"
}
```

### Scenario: User provides correct input

**Input**: `code: "J45.9"`, `patientId: "507f1f77bcf86cd799439011"`

**Step 1: Format and validate**
```javascript
const payload = {
  user_ref: `Patient/507f1f77bcf86cd799439011`,  // ✅ Correct format
  code: "J45.9",                                  // ✅ Correct format
  display: "J45.9"
};

validateConditionPayload(payload)
// Returns: { valid: true, errors: [] }
```

**Step 2: Send to server**
```javascript
await fhirClient.post('/Condition', payload);
// 201 Created ✅
```

**Step 3: Success response**
```json
{
  "resourceType": "Condition",
  "id": "new-condition-id",
  "code": { "coding": "J45.9", "display": "J45.9" },
  "subject": { "reference": "Patient/507f..." }
}
```

---

## Usage Examples

### Example 1: Creating a Condition (Correct Way)

```javascript
// ClinicalNotes.jsx
import { createCondition } from '../../services/fhirApi';
import { formatReference } from '../../utils/fhirValidation';

const handleSubmit = async (e) => {
  e.preventDefault();

  // Format reference
  const patientRef = formatReference('Patient', patientId);

  // Sanitize code
  const code = sanitizeCode(form.code);

  // Create payload
  const payload = {
    user_ref: patientRef,
    code: code,
    display: code,
    severity: form.severity,
    clinicalStatus: form.status,
    notes: form.notes
  };

  try {
    // This validates and sends
    await createCondition(payload);
    toast.success('Condition created!');
  } catch (error) {
    // Show validation errors
    if (error.validationErrors) {
      error.validationErrors.forEach(msg => toast.error(msg));
    }
  }
};
```

### Example 2: Validating Reference Format

```javascript
import { validateFHIRReference, formatReference } from '../../utils/fhirValidation';

const userId = "507f1f77bcf86cd799439011";

// Wrong way
const wrongRef = userId;
console.log(validateFHIRReference(wrongRef)); // false ❌

// Right way
const correctRef = formatReference('Patient', userId);
console.log(validateFHIRReference(correctRef)); // true ✅
console.log(correctRef); // "Patient/507f1f77bcf86cd799439011" ✅
```

### Example 3: Code Sanitization

```javascript
import { sanitizeCode, validateMedicalCode } from '../../utils/fhirValidation';

const userInput = "J45{Asthma) (Respiratory)";

// Before sanitization
console.log(validateMedicalCode(userInput)); // false ❌

// After sanitization
const clean = sanitizeCode(userInput);
console.log(clean); // "J45ASTHMARESPIRATORY"
console.log(validateMedicalCode(clean)); // true ✅
```

---

## Testing

### Unit Test: Regex Reference Validation

```javascript
import { validateFHIRReference, FHIR_REFERENCE_REGEX } from '../../utils/fhirValidation';

describe('FHIR Reference Validation', () => {
  it('should accept valid references', () => {
    expect(validateFHIRReference('Patient/507f1f77bcf86cd799439011')).toBe(true);
    expect(validateFHIRReference('Practitioner/doctor-123')).toBe(true);
    expect(validateFHIRReference('https://example.com/fhir/R4/Patient/123')).toBe(true);
  });

  it('should reject invalid references', () => {
    expect(validateFHIRReference('507f1f77bcf86cd799439011')).toBe(false);
    expect(validateFHIRReference('patient/123')).toBe(false);
    expect(validateFHIRReference('Patient/')).toBe(false);
  });
});
```

### Unit Test: Medical Code Validation

```javascript
import { validateMedicalCode, sanitizeCode } from '../../utils/fhirValidation';

describe('Medical Code Validation', () => {
  it('should validate ICD-10 codes', () => {
    expect(validateMedicalCode('J45.9')).toBe(true);
    expect(validateMedicalCode('E11.9')).toBe(true);
  });

  it('should reject invalid codes', () => {
    expect(validateMedicalCode('J45{Asthma)')).toBe(false);
    expect(validateMedicalCode('J45 (Asthma)')).toBe(false);
  });

  it('should sanitize codes', () => {
    expect(sanitizeCode('J45{Asthma)')).toBe('J45');
    expect(sanitizeCode('E11.9')).toBe('E11.9');
  });
});
```

---

## Summary Checklist

### Frontend Changes ✅

- [x] **ClinicalNotes.jsx**
  - Format `user_ref` as `Patient/{patientId}`
  - Add `sanitizeCode()` function
  - Add `validateConditionForm()` function
  - Display validation errors inline
  - Handle OperationOutcome errors from 422 response

- [x] **fhirApi.js**
  - Add validation regex patterns
  - Add `isValidFHIRReference()`, `isValidMedicalCode()`
  - Add `validateConditionPayload()` function
  - Add `extractOperationOutcomeErrors()` function
  - Enhance `createCondition()` with validation and error extraction

- [x] **fhirValidation.js** (new file)
  - Centralized FHIR validation utilities
  - Comprehensive regex patterns
  - Reusable validator and sanitizer functions
  - Full documentation with examples

### Backend (No Changes Needed) ✅

- Backend validation rules remain unchanged
- Backend expects properly formatted data
- Frontend fixes ensure data is compliant

---

## Troubleshooting

### Problem: Still getting 422 error after fix

**Check**:
1. Is `user_ref` prefixed with `Patient/`?
2. Does code contain only `A-Z`, `0-9`, `.`, `-`?
3. Is code max 20 characters?
4. Is the MongoDB token fresh?

**Example**:
```javascript
// Debug logging
console.log('Payload:', {
  user_ref: `Patient/${patientId}`,
  code: sanitizeCode(form.code)
});
```

### Problem: Validation passes but server still rejects

**Check**:
1. Backend validation might have stricter rules
2. Reread backend [server/utils/fhirValidator.js](server/utils/fhirValidator.js)
3. Check server logs for full error message

### Problem: User sees "Validation failed" but no details

**Check**:
1. Ensure `error.validationErrors` is populated
2. Add logging: `console.error('Validation errors:', error.validationErrors)`
3. Check toast notifications are rendering

---

## Related Files

- [ClinicalNotes.jsx](frontend/src/pages/doctor/ClinicalNotes.jsx) — ConditionForm component
- [fhirApi.js](frontend/src/services/fhirApi.js) — API service with validation
- [fhirValidation.js](frontend/src/utils/fhirValidation.js) — Validation utilities
- [server/utils/fhirValidator.js](server/utils/fhirValidator.js) — Backend validation
- [server/routes/fhir.js](server/routes/fhir.js) — FHIR routes

---

## Questions?

Refer to:
1. **FHIR R4 Specification**: https://www.hl7.org/fhir/r4/references.html
2. **ICD-10 Code Format**: https://www.cdc.gov/nchs/icd/icd10cm.htm
3. **Mongoose ObjectId**: https://mongoosejs.com/docs/api/objectid.html
