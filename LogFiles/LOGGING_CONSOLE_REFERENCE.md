# Quick Reference: Console Logging Output Guide

## What To Expect When Testing

### ✅ SUCCESSFUL Request (HTTP 201)

When creating a valid Condition, the console will show:

```
========== [POST /Condition] ========== START ==========
[POST /Condition] [STEP 1/10] Request received
   User ID: 507f1f77bcf86cd799439011
   User Email: doctor@clinic.com
   User Role: doctor
   Request Body: {
     "resourceType": "Condition",
     "subject": "Patient/507f1f77bcf86cd799439011",
     "code": "J45.9",
     "display": "Asthma"
   }
[POST /Condition] [STEP 2/10] Validating FHIR resource...
[POST /Condition] [STEP 2/10] Validation result: true
[POST /Condition] [STEP 2/10] ✅ Validation passed
[POST /Condition] [STEP 3/10] Extracting fields from request...
   subject: Patient/507f1f77bcf86cd799439011
   code: J45.9
   display: Asthma
[POST /Condition] [STEP 4/10] Parsing FHIR reference...
   [extractIdFromReference] Input: Patient/507f1f77bcf86cd799439011
   [extractIdFromReference] Split parts: [ 'Patient', '507f1f77bcf86cd799439011' ]
   [extractIdFromReference] Extracted ID: 507f1f77bcf86cd799439011
[POST /Condition] [STEP 4/10] ✅ Parsed FHIR reference. Patient ID: 507f1f77bcf86cd799439011
[POST /Condition] [STEP 5/10] Normalizing code...
[POST /Condition] [STEP 5/10] ✅ Normalized code: J45.9
[POST /Condition] [STEP 6/10] Creating Condition object...
[POST /Condition] [STEP 6/10] ✅ Condition object created: 507f9f77bcf86cd799439088
[POST /Condition] [STEP 7/10] Saving to database...
[POST /Condition] [STEP 7/10] ✅ Saved successfully. ID: 507f9f77bcf86cd799439088
[POST /Condition] [STEP 8/10] Logging FHIR access for audit trail...
[POST /Condition] [STEP 8/10] ✅ Audit log created
[POST /Condition] [STEP 9/10] Sending Socket.io notification...
[POST /Condition] [STEP 9/10] ✅ Socket.io notification sent
[POST /Condition] [STEP 10/10] Sending FHIR response...
[POST /Condition] ========== END (SUCCESS) ==========

[fhirValidator.validateResource] ========== START ==========
[fhirValidator.validateResource] Resource type: Condition
[fhirValidator.validateResource] Input JSON: {...}
[fhirValidator.validateResource] [1/6] Checking resourceType field...
[fhirValidator.validateResource]   ✅ resourceType OK
[fhirValidator.validateResource] [2/6] Checking required fields...
[fhirValidator.validateResource]   Expected required fields: [ 'code' ]
[fhirValidator.validateResource]   ✅ code = J45.9
[fhirValidator.validateResource] [3/6] Validating date fields...
[fhirValidator.validateResource] [4/6] Validating reference fields...
[fhirValidator.validateResource]   Checking subject : Patient/507f1f77bcf86cd799439011
[isValidFHIRReference] Validating: Patient/507f1f77bcf86cd799439011
[isValidFHIRReference] ✅ Pattern: /^(https?:\/\/.+\/)?[A-Z][a-zA-Z]*\/[a-zA-Z0-9\-\.]+$/
[fhirValidator.validateResource]   ✅ subject is valid
[fhirValidator.validateResource] [5/6] Validating code fields...
[fhirValidator.validateResource]   Checking code : J45.9
[isValidMedicalCode] Validating: J45.9
[isValidMedicalCode] ✅ Pattern required: '/^[A-Z0-9\.\-]{1,50}$/'
[fhirValidator.validateResource] [6/6] Resource-specific validations...
[fhirValidator.validateResource]   Running Condition-specific validations...
[fhirValidator.validateResource] Result: { valid: true, errorCount: 0 }
[fhirValidator.validateResource] ========== END ==========
```

**🎯 What to Look For:**
- ✅ checkmarks throughout
- All 10 STEP entries present/logged
- `Result: { valid: true, errorCount: 0 }`
- Ends with `========== END (SUCCESS) ==========`

---

### ❌ FAILED Request - Invalid FHIR Reference (HTTP 422)

When sending `subject: "507f1f77bcf86cd799439011"` (without "Patient/"):

```
========== [POST /Condition] ========== START ==========
[POST /Condition] [STEP 1/10] Request received
   User ID: 507f1f77bcf86cd799439011
   User Email: doctor@clinic.com
   Request Body: {
     "resourceType": "Condition",
     "subject": "507f1f77bcf86cd799439011",
     "code": "J45.9"
   }
[POST /Condition] [STEP 2/10] Validating FHIR resource...
[POST /Condition] [STEP 2/10] Validation result: false
[POST /Condition] ❌ Validation failed. Errors: [
  "Invalid FHIR reference format for subject: must be ResourceType/id"
]
```

**Then Backend sends 422 response to frontend:**
```
{
  "resourceType": "OperationOutcome",
  "issue": [{
    "severity": "error",
    "code": "invalid",
    "details": {
      "text": "Invalid FHIR reference format for subject: must be ResourceType/id"
    }
  }]
}
```

**And frontend logs:**
```
[fhirApi.createCondition] [NETWORK] Response received with status: 422
[fhirApi.createCondition] ❌ Server returned 422 Unprocessable Entity
[fhirApi.createCondition] OperationOutcome errors: [
  "Invalid FHIR reference format for subject: must be ResourceType/id"
]
[fhirApi.createCondition] ❌ FHIR API error: Invalid FHIR reference format for subject
```

**🎯 What to Look For:**
- ❌ Mark on STEP 2 (validation failed)
- Error message clearly identifies the problem
- Request STOPS at validation step (doesn't proceed to parsing/database)
- Frontend receives 422 response with error details
- Toast notification shows validation error

---

### ❌ FAILED Request - Database Error (HTTP 500)

When FHIR reference parsing fails or database has schema mismatch:

```
========== [POST /Condition] ========== START ==========
[POST /Condition] [STEP 1/10] Request received
[POST /Condition] [STEP 2/10] Validating FHIR resource...
[POST /Condition] [STEP 2/10] ✅ Validation passed
[POST /Condition] [STEP 3/10] Extracting fields from request...
   subject: Patient/507f1f77bcf86cd799439011
   code: J45.9
[POST /Condition] [STEP 4/10] Parsing FHIR reference...
   [extractIdFromReference] Input: Patient/507f1f77bcf86cd799439011
   [extractIdFromReference] Split parts: [ 'Patient', '507f1f77bcf86cd799439011' ]
   [extractIdFromReference] Extracted ID: 507f1f77bcf86cd799439011
[POST /Condition] [STEP 4/10] ✅ Parsed FHIR reference
[POST /Condition] [STEP 5/10] Normalizing code...
[POST /Condition] [STEP 5/10] ✅ Normalized code: J45.9
[POST /Condition] [STEP 6/10] Creating Condition object...
[POST /Condition] [STEP 6/10] ✅ Condition object created: 507f9f77bcf86cd799439088
[POST /Condition] [STEP 7/10] Saving to database...
[POST /Condition] [STEP 7/10] ❌ Database save failed
   Error name: ValidationError
   Error message: userId: Cast to ObjectId failed for value "Patient/507f1f77bcf86cd799439011 "
   Error details: {
     "name": "ValidationError",
     "message": "userId: Cast to ObjectId failed for value \"Patient/507f1f77bcf86cd799439011\"",
     "errors": {
       "userId": {
         "name": "CastError",
         "message": "Cast to ObjectId failed for value \"Patient/507f1f77bcf86cd799439011\" at path \"userId\""
       }
     }
   }

========== [POST /Condition] ========== END (ERROR) ==========
[POST /Condition] ❌ Exception caught:
   Error type: ValidationError
   Error message: userId: Cast to ObjectId failed for value "Patient/507f1f77bcf86cd799439011"
   Error stack: Error: userId: Cast to ObjectId failed for value "Patient/507f1f77bcf86cd799439011"
       at model.validate (/path/to/server/node_modules/mongoose/lib/model.js:...)
       at runValidators (/path/to/server/node_modules/mongoose/lib/model.js:...)
   Full error object: {...}
```

**🎯 What to Look For:**
- ✅ up to STEP 6 (object creation works)
- ❌ Mark on STEP 7 (database save fails)
- Error name: `ValidationError` or `CastError`
- Error message shows the problematic value: `"Patient/507f1f77bcf86cd799439011"`
- ⚠️ ISSUE: The reference wasn't properly parsed!
- Stack trace shows mongoose throwing the error

**🔧 Fix Strategy:**
- Check if `extractIdFromReference()` is being called
- Verify it's properly splitting on "/"
- Confirm the extracted ID is being used, not the full reference

---

### ❌ FAILED Request - Missing Required Field (HTTP 400/422)

When required field is missing:

```
========== [POST /Condition] ========== START ==========
[POST /Condition] [STEP 1/10] Request received
   Request Body: {
     "resourceType": "Condition",
     "subject": "Patient/507f1f77bcf86cd799439011"
   }
[POST /Condition] [STEP 2/10] Validating FHIR resource...
[fhirValidator.validateResource] [2/6] Checking required fields...
[fhirValidator.validateResource]   Expected required fields: [ 'code' ]
[fhirValidator.validateResource]   ❌ Missing required field: code
[POST /Condition] [STEP 2/10] Validation result: false
[POST /Condition] ❌ Validation failed. Errors: [
  "Missing required field: code"
]
```

**🎯 What to Look For:**
- Error message identifies missing field: `"code"`
- Validation returns false immediately
- No database access attempted
- Frontend receives 422 with specific error message

---

## Common Error Patterns to Recognize

| Error | What to Look For | Root Cause |
|-------|-----------------|-----------|
| **Invalid FHIR reference** | "Invalid FHIR reference format" in validation | Missing "Patient/" prefix on reference |
| **Invalid medical code** | "Invalid medical code format" | Code contains invalid characters like `{`, `}`, `(`, `)` |
| **Cast to ObjectId failed** | "Cast to ObjectId failed for value..." at STEP 7 | FHIR reference not being extracted before DB save |
| **Missing required field** | "Missing required field: X" at STEP 2 | Payload missing required property |
| **Database save failed** | "❌ Database save failed" at STEP 7 | Schema validation error (type mismatch, invalid format) |
| **Socket.io not available** | "⚠️  Socket.io not available" at STEP 9 | Non-blocking warning, API still responds |
| **Audit logging failed** | "⚠️  Audit logging failed" at STEP 8 | Non-blocking warning, API still responds |

---

## Step-by-Step Debugging Workflow

### If You See STEP 500 Error:
1. **Look at console for last ✅ step** - that's where things worked
2. **Next step after that** - that's where it failed
3. **Read the error details** - tells you what went wrong
4. **Check the logged values** - see what data caused the failure

### Example Investigation:
```
[STEP 4] ✅ Parsed FHIR reference. Patient ID: 507f...
[STEP 5] ✅ Normalized code: J45.9
[STEP 6] ✅ Condition object created: 507f...
[STEP 7] ❌ Database save failed
```

**What This Tells You:**
- ✅ Reference parsing works
- ✅ Code normalization works
- ✅ Object creation works
- ❌ Database schema validation is failing

**Next Step:** Check if the saved object has correct ObjectId types

---

## Testing Checklist

- [ ] Start server with `npm start`
- [ ] Watch for "Server running on..." message
- [ ] Create valid Condition (expect 201 + all ✅ steps)
- [ ] Create Condition without "Patient/" prefix (expect 422 at STEP 2)
- [ ] Create Condition with bad code like "J45{asthma)" (expect 422 at STEP 5)
- [ ] Create Condition missing required code field (expect 422 at STEP 2)
- [ ] Create Observation with valid data (expect 201 + all ✅ steps)
- [ ] Create MedicationRequest with valid data (expect 201 + all ✅ steps)
- [ ] Create DiagnosticReport with file attachment (check STEP 6 file logging)
- [ ] Create DiagnosticReport without file (expect to see "No file attachment" at STEP 6)

---

**Remember:** The logging is your diagnostic tool. Every ✅ tells you that step succeeded, and the first ❌ tells you where to investigate!
