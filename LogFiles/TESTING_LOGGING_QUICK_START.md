# QUICK START: Test Comprehensive Logging

## 5-Minute Setup & Test

### Step 1: Stop Any Running Server
```bash
# If server is running, press Ctrl+C in the terminal
```

### Step 2: Start Server Fresh
```bash
cd server
npm start
```

**Expected Output:**
```
✅ Server running on http://localhost:4000
```

---

## Test Scenarios

### ✅ TEST 1: Valid Condition Creation
**What to try:**
1. Open frontend in browser
2. Navigate to Clinical Notes
3. Fill in:
   - Patient: Select a patient
   - Code: `J45.9`
   - Display: `Asthma`
   - Onset Date: Today's date
4. Click "Save Condition"

**What to watch for in console:**
- `========== [POST /Condition] ========== START ==========`
- Multiple `✅` checkmarks
- All 10 STEPS present
- Ends with: `========== [POST /Condition] ========== END (SUCCESS) ==========`

**Console should show:**
```
[POST /Condition] [STEP 1/10] Request received ✅
[POST /Condition] [STEP 2/10] Validation passed ✅
[POST /Condition] [STEP 3/10] Extracting fields ✅
[POST /Condition] [STEP 4/10] Parsing FHIR reference ✅
[POST /Condition] [STEP 5/10] Normalizing code ✅
[POST /Condition] [STEP 6/10] Creating object ✅
[POST /Condition] [STEP 7/10] Saved successfully ✅
[POST /Condition] [STEP 8/10] Audit log created ✅
[POST /Condition] [STEP 9/10] Socket notification ✅
[POST /Condition] [STEP 10/10] Response sent ✅
========== END (SUCCESS) ==========
```

**Expected Result in Browser:**
- Success toast notification
- Condition appears in list
- HTTP 201 response

---

### ❌ TEST 2: Invalid Reference (Missing "Patient/")
**What to try:**
1. Open browser console (F12)
2. Create request with invalid reference:
```javascript
// In browser console:
fetch('http://localhost:4000/api/v1/fhir/R4/Condition', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/fhir+json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    resourceType: 'Condition',
    subject: '507f1f77bcf86cd799439011',  // ❌ Missing "Patient/"
    code: 'J45.9',
    display: 'Asthma'
  })
})
```

**What to watch for in console:**
- `[POST /Condition] [STEP 2/10] Validation result: false`
- `❌ Validation failed`
- Error message in OperationOutcome
- Stops at STEP 2 (doesn't proceed to parsing)

**Console should show:**
```
[fhirValidator.validateResource] [4/6] Validating reference fields...
   Checking subject : 507f1f77bcf86cd799439011
[isValidFHIRReference] ❌ Not a non-empty string OR Pattern failed
[POST /Condition] ❌ Validation failed. Errors: [
  "Invalid FHIR reference format for subject: must be ResourceType/id"
]
```

**Expected Result:**
- HTTP 422 Unprocessable Entity
- Error message in response body
- Validation fails immediately (no DB access)

---

### ❌ TEST 3: Invalid Medical Code
**What to try:**
1. Create condition with bad code:
```javascript
fetch('http://localhost:4000/api/v1/fhir/R4/Condition', {
  method: 'POST',
  headers: {'Content-Type': 'application/fhir+json'},
  body: JSON.stringify({
    resourceType: 'Condition',
    subject: 'Patient/507f1f77bcf86cd799439011',
    code: 'J45{bad}',  // ❌ Invalid characters
    display: 'Asthma'
  })
})
```

**What to watch for in console:**
- `[fhirValidator.validateResource] [5/6] Validating code fields...`
- `[isValidMedicalCode] ❌ Pattern required: '/^[A-Z0-9\.\-]{1,50}$/'`
- Validation fails with code error message

**Console should show:**
```
[fhirValidator.validateResource]   Checking code : J45{bad}
[isValidMedicalCode] Validating: J45{bad}
[isValidMedicalCode] ❌ Pattern required: '/^[A-Z0-9\.\-]{1,50}$/'
[POST /Condition] ❌ Validation failed. Errors: [
  "Invalid medical code format for code: \"J45{bad}\""
]
```

**Expected Result:**
- HTTP 422 Unprocessable Entity
- Error identifies the bad code value

---

### ✅ TEST 4: Valid Observation Creation
**What to try:**
1. In frontend, navigate to Observations section
2. Fill in:
   - Patient: Select a patient
   - Code: `8480-6` (Systolic BP)
   - Value: `120`
   - Unit: `mmHg`
3. Click "Save Observation"

**What to watch for in console:**
- `========== [POST /Observation] ========== START ==========`
- 10 STEP entries (similar to Condition)
- Value normalization logged
- Ends with: `========== [POST /Observation] ========== END (SUCCESS) ==========`

**Console should include:**
```
[POST /Observation] [STEP 6/10] Normalizing value...
[POST /Observation] [STEP 6/10] Value is number. Normalized to quantity
[POST /Observation] [STEP 6/10] ✅ Normalized value: {
  quantity: {
    value: 120,
    unit: "mmHg",
    code: "8480-6"
  }
}
```

**Expected Result:**
- HTTP 201 response
- Observation saved successfully

---

### ✅ TEST 5: Valid MedicationRequest Creation  
**What to try:**
1. In frontend, navigate to Prescriptions section
2. Fill in:
   - Patient: Select a patient
   - Medication: Select a medication
   - Dosage: "One tablet twice daily"
3. Click "Send Prescription"

**What to watch for in console:**
- `========== [POST /MedicationRequest] ========== START ==========`
- 9 STEP entries
- TWO FHIR references parsed (user_ref and medication_ref)
- Ends with: `========== [POST /MedicationRequest] ========== END (SUCCESS) ==========`

**Console should include:**
```
[POST /MedicationRequest] [STEP 4/9] Parsing FHIR references...
   [extractIdFromReference] Input: Patient/507f...
   [extractIdFromReference] Extracted ID: 507f...
   [extractIdFromReference] Input: Medication/507g...
   [extractIdFromReference] Extracted ID: 507g...
[POST /MedicationRequest] [STEP 4/9] ✅ Parsed FHIR references
   User ID: 507f...
   Medication ID: 507g...
```

**Expected Result:**
- HTTP 201 response
- MedicationRequest created

---

### ✅ TEST 6: Valid DiagnosticReport (WITH FILE)
**What to try:**
1. In frontend, navigate to Reports section
2. Fill in:
   - Patient: Select a patient
   - Code: `70553007`
   - Display: `CT Scan Report`
   - Choose a PDF/image file to attach
3. Click "Submit Report"

**What to watch for in console:**
- `========== [POST /DiagnosticReport] ========== START ==========`
- 10 STEP entries
- **STEP 6 shows file processing:**

**Console should include:**
```
[POST /DiagnosticReport] [STEP 6/10] Checking for file attachment...
[POST /DiagnosticReport] [STEP 6/10] Processing uploaded file...
   File name: report.pdf
   File size: 245632
   File type: application/pdf
[POST /DiagnosticReport] [STEP 6/10] ✅ File uploaded successfully. URL: https://cloudinary.com/...
```

**Expected Result:**
- HTTP 201 response
- File uploaded to Cloudinary
- Report saved with attachment URL

---

### ❌ TEST 7: DiagnosticReport WITHOUT FILE
**What to try:**
1. Same as TEST 6 but DON'T select a file
2. Submit

**What to watch for in console:**
- STEP 6 shows: `ℹ️  No file attachment included`
- Rest of steps proceed normally
- Still succeeds (file is optional)

**Console should include:**
```
[POST /DiagnosticReport] [STEP 6/10] Checking for file attachment...
[POST /DiagnosticReport] [STEP 6/10] ℹ️  No file attachment included
[POST /DiagnosticReport] [STEP 7/10] Saving to database...
```

**Expected Result:**
- HTTP 201 response
- Report saved without attachment

---

## Console Debugging Tips

### 1. **Find the Failure Point**
```
Look for the first ❌ mark in the console output.
That's where the problem is!
```

### 2. **Check Logged Values**
```
All values are logged with field names.
Use them to debug data transformation.
```

### 3. **Read Error Details**
```
When ❌ appears, the error message below it
explains what went wrong and why.
```

### 4. **Look for Patterns**
```
- Missing ✅ on STEP X = failure point
- Error before STEP 2 = frontend issue
- Error at STEP 7 = database issue  
- Error at STEP 8-9 = secondary operation issue
```

---

## Quick Reference: Expected Console Patterns

### ✅ SUCCESS Pattern (All Steps)
```
========== START ==========
[STEP 1/X] ✅
[STEP 2/X] ✅
... (all steps show ✅)
[STEP X/X] ✅
========== END (SUCCESS) ==========
```

### ❌ VALIDATION Error Pattern (Stops at STEP 2)
```
========== START ==========
[STEP 1/X] ✅
[STEP 2/X] Validation result: false
❌ Validation failed. Errors: [...]
(No further steps logged)
```

### ❌ DATABASE Error Pattern (Fails at STEP 7)
```
========== START ==========
[STEP 1/X] ✅
... steps 2-6 ✅
[STEP 7/X] ❌ Database save failed
   Error name: ...
   Error message: ...
========== END (ERROR) ==========
```

### ⚠️ WARNING Pattern (Non-blocking)
```
[STEP 8/X] ⚠️  Audit logging failed (non-blocking)
[STEP 9/X] ⚠️  Socket.io not available
(API still responds successfully)
========== END (SUCCESS) ==========
```

---

## Troubleshooting

| What You See | What It Means | Fix |
|--------------|---------------|-----|
| No console output | Server not logging | Restart server |
| Only STEP 1-2 | Validation failing | Check request data format |
| Missing STEP 3-5 | Data extraction error | Check required fields |
| Error at STEP 7 | Database schema mismatch | Check if reference parsed correctly |
| Toast says "error" but console says "success" | Frontend error handler issue | Check browser console (F12) |
| All steps ✅ but no toast | Socket.io or notification issue | Check error logs, non-blocking |

---

## Next Steps

1. **Restart Server:** Stop and `npm start` again
2. **Run TEST 1:** Create valid Condition, check console
3. **Run TEST 2:** Try invalid reference, watch validation fail
4. **Run TEST 3:** Try invalid code, watch code validation fail
5. **Run TESTS 4-5:** Test Observation and MedicationRequest
6. **Run TEST 6:** Test file upload on DiagnosticReport
7. **Analyze Results:** Use console output to understand flow

**If you encounter any errors, the console output will pinpoint exactly where and why!**

---

**Happy Testing! 🚀**

The comprehensive logging system is now ready to help you diagnose and fix any issues in the FHIR API.
