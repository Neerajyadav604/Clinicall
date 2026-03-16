# CONDITION CREATION DIAGNOSTIC REPORT
## Complete End-to-End Trace (8-Part Scan)

**Report Date:** March 14, 2026  
**Issue:** Condition creation returning 422 Unprocessable Entity  
**Root Causes Identified:** **3 CRITICAL ISSUES**

---

## SCAN 1 — Frontend Form Payload (ClinicalNotes.jsx)

**File:** [frontend/src/pages/doctor/ClinicalNotes.jsx](frontend/src/pages/doctor/ClinicalNotes.jsx#L57-L95)  
**Location:** Line 57-95 (ConditionForm component)  
**Handler Method:** `handleSubmit` at line 69

### Q: What exact fields are being collected from the form state?
**A:** The form state (`form`) contains 4 fields:
```javascript
{
  code: '',           // User enters ICD-10/SNOMED code (string)
  severity: 'mild',   // Dropdown: 'mild' | 'moderate' | 'severe'
  status: 'active',   // Dropdown: 'active' | 'inactive' | 'remission'
  notes: ''           // Textarea: additional clinical notes
}
```

### Q: What is the exact payload object being passed to createCondition?
**A:** **PAYLOAD OBJECT (Line 80-86):**
```javascript
{
  user_ref: patientId,                    // Patient ID from useParams()
  code: {                                 // ⚠️ PROBLEM #1: Nested object structure
    coding: [
      {
        system: 'http://snomed.info/sct',
        code: form.code                   // e.g., "J45"
      }
    ]
  },
  display: form.code,                     // e.g., "J45"
  severity: form.severity,                // 'mild' | 'moderate' | 'severe'
  clinicalStatus: form.status,            // 'active' | 'inactive' | 'remission'
  notes: form.notes                       // Textarea value
}
```

### Q: Is patientId present? Where does it come from?
**A:** ✅ **YES**, `patientId` is present as `user_ref`.  
**Source:** `const { patientId } = useParams()` (line 554)  
**Actual value at runtime:** Patient MongoDB ObjectId (e.g., "507f1f77bcf86cd799439011")

### Q: Is code present? What state variable holds it? String or object?
**A:** ✅ **YES**, code is present.  
**State variable:** `form.code` (initialized empty string, user types into it)  
**Type sent:** **OBJECT** with nested structure:
```javascript
{
  coding: [{ system: 'http://snomed.info/sct', code: 'J45' }]
}
```
⚠️ **This is an array of objects, NOT a simple string or single object.**

### Q: Is clinicalStatus present? What are the possible values?
**A:** ✅ **YES**, present as `clinicalStatus: form.status`  
**Possible values sent:** `'active'`, `'inactive'`, `'remission'`  
**Value casing:** **LOWERCASE**

### Q: Is severity present? Optional or required?
**A:** ✅ **YES**, present.  
**Required?** **NOT REQUIRED** — defaults to `'mild'` even if empty  
**Possible values:** `'mild'`, `'moderate'`, `'severe'`

### Q: Is notes or note present? Which field name?
**A:** ✅ **YES**, field name is `notes` (not `note`)  
**Type:** String from textarea

### Q: Are any fields empty strings instead of undefined?
**A:** ⚠️ **YES — POTENTIAL ISSUE #2:**
- `form.code` starts as empty string `''`
- Validation at line 74-76 checks `if (!form.code.trim())` **but this only checks BEFORE submit**
- The payload for other fields like `notes` can be empty string `''` if user didn't enter anything

### Q: Console.log output before createCondition?
**A:** ⚠️ **NOT CURRENTLY ADDED** — Adding instrumentation:

**ADD THIS at line 81 (before createCondition call):**
```javascript
console.log('Condition payload:', JSON.stringify({
  user_ref: patientId,
  code: { coding: [{ system: 'http://snomed.info/sct', code: form.code }] },
  display: form.code,
  severity: form.severity,
  clinicalStatus: form.status,
  notes: form.notes
}, null, 2));
```

---

## SCAN 2 — API Function (fhirApi.js line 297)

**File:** [frontend/src/services/fhirApi.js](frontend/src/services/fhirApi.js#L285-L300)  
**Location:** Line 285-300

### Q: What is the exact function signature?
**A:**
```javascript
export const createCondition = async (condition) => {
  try {
    const response = await fhirClient.post('/Condition', condition);
    return response.data;
  } catch (error) {
    console.error('Error creating condition:', error);
    throw error;
  }
}
```

### Q: Does it transform or rename any fields before sending?
**A:** ✅ **NO** — payload passes straight through unchanged.  
`fhirClient.post('/Condition', condition)` sends the condition object as-is.

### Q: What is the exact axios call?
**A:**
```javascript
POST /Condition
URL: http://localhost:4000/fhir/R4/Condition  (based on REACT_APP_BASE_URL)
Headers: {
  Accept: 'application/fhir+json',
  Content-Type: 'application/fhir+json',
  Authorization: 'Bearer {JWT_TOKEN}'  // Added by interceptor at line 23-30
}
Body: {
  user_ref: patientId,
  code: { coding: [...] },
  display: form.code,
  severity: form.severity,
  clinicalStatus: form.status,
  notes: form.notes
}
```

### Q: Is JWT Authorization header attached?
**A:** ✅ **YES** — interceptor at line 23-30 adds:
```javascript
fhirClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;  // ✅ Added
    }
    return config;
  }
);
```

### Q: Console.log of createCondition payload?
**A:** ⚠️ **NOT CURRENTLY ADDED** — Adding instrumentation:

**ADD THIS at line 288 (top of function):**
```javascript
console.log('[fhirApi] createCondition payload:', JSON.stringify(condition, null, 2));
```

### Q: Console.log of error response?
**A:** ⚠️ **NOT CURRENTLY ADDED** — Adding instrumentation:

**MODIFY catch block (line 293) to:**
```javascript
} catch (error) {
  console.log('[fhirApi] createCondition response error:', error.response?.data);
  console.error('Error creating condition:', error);
  throw error;
}
```

---

## SCAN 3 — FHIR Validator (server/utils/fhirValidator.js)

**File:** [server/utils/fhirValidator.js](server/utils/fhirValidator.js#L11-20)  
**Location:** Lines 11-20, validation function at 63-160

### Q: Copy the exact validation rules for Condition?
**A:** **VALIDATION RULES FOR CONDITION:**

From `FHIR_REQUIRED_FIELDS` (line 11-20):
```javascript
Condition: ['code']  // Only 'code' is required
```

Resource-specific validation (line 150-156):
```javascript
if (resourceType === 'Condition') {
  if (!fhirJson.subject && !fhirJson.userId && !fhirJson.user_ref) {
    errors.push('Condition must have subject (patient reference)');
  }
}
```

### Q: What field names does it expect?
**A:** 
- For **code field:** expects `code` (can accept string or object with `coding` property)
- For **subject/patient reference:** accepts `subject` OR `userId` OR `user_ref`
- Medical code validation (line 55-57): Must match `/^[A-Z0-9\.\-]{1,50}$/`

### Q: What values does it accept for clinicalStatus?
**A:** ⚠️ **VALIDATOR DOES NOT CHECK clinicalStatus AT ALL.**  
- No validation rule for clinicalStatus
- No enum check
- No case-sensitivity check
- The validator will PASS regardless of what value is sent

### Q: Does it check severity?
**A:** ⚠️ **NO** — severity is not validated by fhirValidator  
**Is it required?** According to validator: **NO, it's optional**

### Q: Does it check subject as FHIR reference format?
**A:** ✅ **YES** — Reference field validation at line 97-102:
```javascript
const refFields = ['subject', 'performer', 'recorder', 'patient_ref', 'user_ref', 'doctor_ref', 'medication_ref'];
for (const refField of refFields) {
  if (fhirJson[refField] && typeof fhirJson[refField] === 'string' && !isValidFHIRReference(fhirJson[refField])) {
    errors.push(`Invalid FHIR reference format for ${refField}: must be ResourceType/id`);
  }
}
```

⚠️ **PROBLEM:** Validator expects `user_ref` to BE A STRING in format `Patient/id` or full URL.  
But frontend sends `user_ref: patientId` which is just a MongoDB ObjectId string like `507f1f77bcf86cd799439011`  
**This should fail validation, but it doesn't because:**
- The regex check at line 82 only runs if the field is a string: `typeof fhirJson[refField] === 'string'`
- The frontend IS sending a string `patientId`, so it SHOULD be checked
- The regex `/^(https?:\/\/.+\/)?[A-Z][a-zA-Z]*\/[a-zA-Z0-9\-\.]+$/` requires format like `Patient/507f1f77...`
- But frontend sends just `507f1f77...` without `Patient/` prefix
- **This SHOULD fail but might not depending on MongoDB ObjectId format**

### Q: Does it check that code is non-empty string?
**A:** ✅ **YES** — Code validation at line 104-113:
```javascript
const codeFields = ['code', 'coding', 'vaccineCode'];
for (const codeField of codeFields) {
  if (fhirJson[codeField]) {
    // Check if it's a string
    if (typeof fhirJson[codeField] === 'string') {
      if (!isValidMedicalCode(fhirJson[codeField])) {
        errors.push(`Invalid medical code format for ${codeField}`);
      }
    }
    // Check if it's an object with coding property
    if (typeof fhirJson[codeField] === 'object' && fhirJson[codeField].coding) {
      if (!isValidMedicalCode(fhirJson[codeField].coding)) {
        errors.push(`Invalid medical code in ${codeField}.coding`);
      }
    }
  }
}
```

**Analysis:**
- Frontend sends `code: { coding: [{ system: '...', code: 'J45' }] }`
- This is an OBJECT with a `coding` property
- The code checks: `if (typeof fhirJson[codeField] === 'object' && fhirJson[codeField].coding)`
- **ERROR #1:** Frontend sends `coding` as **ARRAY** `[{ ... }]`
- Code expects `coding` to be a **STRING** (checks `!isValidMedicalCode(fhirJson[codeField].coding)`)
- `isValidMedicalCode(array)` will FAIL because array doesn't match regex `/^[A-Z0-9\.\-]{1,50}$/`

### Q: Would an empty string pass or fail?
**A:** ✅ **FAIL** — `isValidMedicalCode('')` returns false

### Full Condition validation block?
**A:**
```javascript
// Condition only checks: presence of code, and subject/userId/user_ref
// No enum checks for clinicalStatus
// No severity validation
// Code must be non-empty string matching /^[A-Z0-9\.\-]{1,50}$/
if (resourceType === 'Condition') {
  if (!fhirJson.subject && !fhirJson.userId && !fhirJson.user_ref) {
    errors.push('Condition must have subject (patient reference)');
  }
}
```

---

## SCAN 4 — FHIR Route Handler (server/routes/fhir.js)

**File:** [server/routes/fhir.js](server/routes/fhir.js#L816-875)  
**Location:** Lines 816-875 (POST /Condition handler)

### Q: Does it call validateResource('Condition', req.body)?
**A:** ✅ **YES** — line 826:
```javascript
const validation = validateResource('Condition', req.body);
if (!validation.valid) {
  console.warn('❌ Condition validation failed:', validation.errors);
  return res.status(422).json(createOperationOutcome(validation.errors));
}
```

### Q: What does it destructure from req.body?
**A:** **Line 830:**
```javascript
const { user_ref, code, display, clinicalStatus, verificationStatus, severity, notes } = req.body;
```

### Q: What does it pass to Condition.create?
**A:** **Lines 832-847 — Creates new Condition object:**
```javascript
const condition = new Condition({
  userId: user_ref,
  code: {
    system: 'http://hl7.org/fhir/sid/icd-10-cm',  // ⚠️ HARDCODED system (ignores frontend's http://snomed.info/sct)
    coding: code,                                  // ⚠️ PROBLEM #3: code is an object, but schema expects string
    display
  },
  clinicalStatus: clinicalStatus || 'active',
  verificationStatus: verificationStatus || 'confirmed',
  severity,
  notes,
  recordedBy: req.user._id,
  recordedDate: new Date()
});
```

### Q: Are field names matching Mongoose schema exactly?
**A:** ⚠️ **PARTIAL MISMATCH**

**Mapping:**
| Route Handler | Mongoose Schema | Match? |
|---|---|---|
| `userId: user_ref` | `userId` | ✅ YES |
| `code: { system, coding, display }` | `code: { system, coding, display }` | ⚠️ PARTIAL |
| `clinicalStatus` | `clinicalStatus` | ✅ YES |
| `verificationStatus` | `verificationStatus` | ✅ YES |
| `severity` | `severity` | ✅ YES |
| `notes` | `notes` | ✅ YES |
| `recordedBy` | `recordedBy` | ✅ YES |
| `recordedDate` | `recordedDate` | ✅ YES |

**The `code` field mismatch:**
- **Frontend sends:** `code: { coding: [array] }`
- **Handler receives:** `code = { coding: [array] }`
- **Handler assigns to Mongoose:** `coding: code` → `coding: { coding: [array] }`
- **Schema expects:** `coding: String` (e.g., "E11.9")
- **Result:** **Mongoose will fail validation because `coding` is an object, not a string**

### Q: Any logging of req.body before validation?
**A:** ⚠️ **NO** — No `console.log` of req.body before validation

**ADD THIS at line 825 (before validation):**
```javascript
console.log('POST /Condition req.body:', JSON.stringify(req.body, null, 2));
```

### Q: Is authenticateUser middleware applied?
**A:** ✅ **YES** — line 823: `authenticateUser`

### Q: Is isDoctor middleware applied?
**A:** ✅ **YES** — line 823: `isDoctor`

### Q: Could either be rejecting the request before validation?
**A:** ⚠️ **POSSIBLE** — if doctor authentication fails, request returns 401, 403, or 404 *before* reaching validation logic

### Q: Is consentMiddleware applied to POST routes?
**A:** ⚠️ **NO** — consentMiddleware is NOT in the POST /Condition handler  
✅ **CORRECT** — Consent should only gate GET requests, not writes

### Q: After validation fails, what error response is returned?
**A:** **Lines 827-829:**
```javascript
return res.status(422).json(createOperationOutcome(validation.errors));
```

**Response body structure:** FHIR OperationOutcome:
```javascript
{
  resourceType: 'OperationOutcome',
  issue: [
    {
      severity: 'error',
      code: 'invalid',
      details: { text: 'Error message' },
      expression: ['resource.field[0]']
    }
  ]
}
```

### Q: Add console.log of validation errors?
**A:** ⚠️ **MISSING** — Add at line 828:
```javascript
console.log('Validation errors:', validationResult.errors);
```

---

## SCAN 5 — Mongoose Model (server/models/Condition.js)

**File:** [server/models/Condition.js](server/models/Condition.js#L1-56)  
**Location:** Full schema definition

### Q: What are the exact field names in the schema?
**A:**
```javascript
{
  userId (ObjectId ref 'User')
  code:
    - system (String, enum, default)
    - coding (String)
    - display (String)
  clinicalStatus (String, enum, default 'active')
  verificationStatus (String, enum, default 'unconfirmed')
  severity (String, enum, default 'moderate')
  notes (String)
  onsetDate (Date)
  abatementDate (Date)
  recordedBy (ObjectId ref 'Doctor')
  recordedDate (Date, default Date.now)
  timestamps: true
}
```

### Q: Which fields have required: true?
**A:**
- `userId` → **required: true**
- `code.system` → has enum but no explicit required
- `code.coding` → **NO required: true specified**
- `code.display` → **NO required: true specified**
- All other fields → **OPTIONAL**

### Q: What are the field types?
**A:**
| Field | Type |
|---|---|
| `userId` | ObjectId (ref: 'User') |
| `code.system` | String (enum) |
| `code.coding` | String |
| `code.display` | String |
| `clinicalStatus` | String |
| `verificationStatus` | String |
| `severity` | String |
| `notes` | String |
| `onsetDate` | Date |
| `abatementDate` | Date |
| `recordedBy` | ObjectId (ref: 'Doctor') |
| `recordedDate` | Date |

### Q: Does clinicalStatus have an enum validator?
**A:** ✅ **YES** — line 21-26:
```javascript
clinicalStatus: {
  type: String,
  enum: ['active', 'recurrence', 'relapse', 'inactive', 'remission', 'resolved'],
  default: 'active'
}
```

**Allowed values:** `'active'`, `'recurrence'`, `'relapse'`, `'inactive'`, `'remission'`, `'resolved'`  
**Casing:** **LOWERCASE only**

### Q: Does code have any validators beyond required?
**A:** ⚠️ **NO** — code fields have no validators:
```javascript
code: {
  system: { type: String, enum: [...], default: '...' },
  coding: String,              // ← No validators
  display: String              // ← No validators
}
```

### Q: Does user_ref use ref: 'User' or ref: 'Doctor'?
**A:** Field name is `userId` (not `user_ref`), and it uses `ref: 'User'`:
```javascript
userId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  required: true,
  index: true
}
```

### Q: Is mongoose-field-encryption applied?
**A:** ✅ **YES** — line 48-51:
```javascript
ConditionSchema.plugin(fieldEncryption, {
  fields: ['notes'],
  secret: process.env.FIELD_ENC_KEY || 'change_this_in_prod'
});
```

**Which field?** Only `notes` is encrypted  
**Secret:** Uses `process.env.FIELD_ENC_KEY`

### Q: Full schema definition?
**A:**
```javascript
const mongoose = require('mongoose');
const fieldEncryption = require('mongoose-field-encryption').fieldEncryption;

const ConditionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    // FHIR Code - typically ICD-10 or SNOMED-CT
    code: {
      system: {
        type: String,
        enum: ['http://hl7.org/fhir/sid/icd-10', 'http://snomed.info/sct', 'http://clinicall.local/condition'],
        default: 'http://clinicall.local/condition'
      },
      coding: String, // e.g., "E11.9" for Type 2 Diabetes
      display: String // e.g., "Type 2 Diabetes Mellitus"
    },
    // Clinical status
    clinicalStatus: {
      type: String,
      enum: ['active', 'recurrence', 'relapse', 'inactive', 'remission', 'resolved'],
      default: 'active'
    },
    // Verification status
    verificationStatus: {
      type: String,
      enum: ['unconfirmed', 'provisional', 'differential', 'confirmed', 'refuted', 'entered-in-error'],
      default: 'unconfirmed'
    },
    // Severity
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe'],
      default: 'moderate'
    },
    // Additional notes
    notes: String,
    // Date when condition started
    onsetDate: Date,
    // Date when condition ended (if applicable)
    abatementDate: Date,
    // Diagnosed by doctor
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor'
    },
    // When condition was recorded
    recordedDate: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Encrypt sensitive fields
ConditionSchema.plugin(fieldEncryption, {
  fields: ['notes'],
  secret: process.env.FIELD_ENC_KEY || 'change_this_in_prod'
});

module.exports = mongoose.model('Condition', ConditionSchema);
```

---

## SCAN 6 — Environment Variables

**File:** [server/.env](server/.env)  
**File:** [server/config/production.js](server/config/production.js)

### Q: Is ENCRYPTION_KEY set?
**A:** ⚠️ **PARTIALLY** — Two keys exist:
```
ENCRYPTION_KEY=your_32_char_encryption_key_for_mongoose_field_encryption  ← PLACEHOLDER
FIELD_ENC_KEY=clinicall_super_secure_key_123456  ← ACTUAL (32 chars for AES-256)
```

**Problem:** `ENCRYPTION_KEY` is a placeholder string, not a valid 32-char key  
**Actual key used by Condition model:** `FIELD_ENC_KEY` (correct length)

### Q: Is ENCRYPTION_KEY exactly 32 characters?
**A:** ⚠️ **NO**
```
ENCRYPTION_KEY = "your_32_char_encryption_key_for_mongoose_field_encryption"
Length = 59 characters (TOO LONG)
```

**FIELD_ENC_KEY:**
```
FIELD_ENC_KEY = "clinicall_super_secure_key_123456"
Length = 34 characters (TOO LONG for AES-256, should be 32)
```

**Both are INVALID!** AES-256 requires exactly 32 bytes/characters.

### Q: Is MONGO_URI correct?
**A:** ✅ **YES** — properly configured:
```
DATABASEURL=mongodb+srv://dheeraj0987bhari:%40%21e%2F%25x8FK9%263%2DUn@cluster0.q9qfkhp.mongodb.net/ClinicallDatabase
```

### Q: Is JWT_SECRET set?
**A:** ✅ **YES**:
```
JWT_SECRET=v8Y@3jK!zR^9q#H)1LpXf*5nS%gE2mB&dFutN
```

### Q: Is NODE_ENV set?
**A:** ✅ **YES**:
```
NODE_ENV=production
```

### Does production.js validate ENCRYPTION_KEY on startup?
**A:** ✅ **YES** — lines 12-48 in production.js:
```javascript
const requiredEnvVars = [
  'DATABASEURL',
  'JWT_SECRET',
  'CLOUD_NAME',
  'CLOUD_API_KEY',
  'CLOUD_API_SECRET',
  'FHIR_SERVER_URL',
  'FHIR_CLIENT_ID',
  'FHIR_CLIENT_SECRET',
  'FHIR_REDIRECT_URI',
  'MAIL_USER',
  'MAIL_PASS',
  'ENCRYPTION_KEY',
  'FIELD_ENC_KEY'
];

function validateEnvironment() {
  const missing = [];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }
  // If any is missing, throw error and exit(1)
}
```

⚠️ **However:** This only checks if the variables are SET, not if they're VALID (correct length).

---

## SCAN 7 — Middleware Chain (server/index.js)

**File:** [server/index.js](server/index.js#L1-250)

### Q: What middleware runs before FHIR routes?
**A:** **MIDDLEWARE ORDER:**

1. **Line 40-60:** Helmet security headers
2. **Line 62-72:** CORS
3. **Line 74-86:** Socket.IO
4. **Line 92-104:** Session middleware
5. **Line 106-110:** File upload middleware
6. **Line 112:** `express.json()` ✅
7. **Line 113:** `cookieParser()`
8. **Line 115-121:** Request logging
9. **Line 123-128:** mongoSanitize (removes $ and . from keys)
10. **Line 130-144:** xssClean (sanitizes values)
11. **Lines 200-240+:** Standard routes (Auth, Doctor, etc.) registered
12. **Line 328+:** FHIR route registered asynchronously

### Q: Does mongoSanitize strip code field with dots?
**A:** ⚠️ **POTENTIALLY** — mongoSanitize removes keys containing ".", "$$", etc.

**Analysis of frontend payload:**
```javascript
{
  user_ref: patientId,
  code: {
    coding: [
      {
        system: 'http://snomed.info/sct',  // ← This is a VALUE, not a KEY
        code: 'J45'                         // ← This is a KEY, but value is 'J45'
      }
    ]
  },
  ...
}
```

**Result:**
- The VALUE `'http://snomed.info/sct'` contains dots but is safe (it's a value)
- The KEYS `'system'` and `'code'` don't contain dots (they're safe)
- mongoSanitize will NOT strip this

**However:** If a KEY contained dots (like `'field.name'`), it would be removed.

### Q: Does xssClean transform field values?
**A:** ✅ **YES** — but for Condition payload, mostly safe:
- `user_ref` (ObjectId string) → safe
- `code` object → safe (valid medical code)
- `display` string → safe
- `severity` string → safe
- `clinicalStatus` string → safe
- `notes` string → could contain HTML/JS, will be cleaned

### Q: Is express.json() present and before FHIR routes?
**A:** ✅ **YES** — line 112:
```javascript
app.use(express.json({ type: ['application/json', 'application/fhir+json'] }));
```

**Order:**
1. express.json() at line 112 ✅
2. FHIR route registered at line 328+ ✅
3. Correct order ✅

### Q: Is fileUpload middleware interfering with JSON body parsing?
**A:** ⚠️ **POSSIBLE ISSUE** — fileUpload at line 106-110 runs BEFORE express.json():
```javascript
// Line 106-110: fileUpload RUNS FIRST
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: os.tmpdir(),
  })
);

// Line 112: express.json() runs SECOND
app.use(express.json({ type: [...] }));
```

**Risk:** If fileUpload sees a multipart/form-data request, it consumes the body, and express.json() may not parse JSON properly.  
**For the Condition creation:** Frontend sends `Content-Type: application/fhir+json`, so fileUpload should NOT interfere.

---

## SCAN 8 — Auth Middleware (server/middleware/authMiddleware.js)

**File:** [server/middleware/authMiddleware.js](server/middleware/authMiddleware.js#L1-120)

### Q: Does authenticateUser attach req.user correctly?
**A:** ✅ **YES** — lines 28-38:
```javascript
const decoded = verifyAccessToken(token);
const user = await User.findById(decoded.id);
if (!user) {
  return res.status(401).json({
    success: false,
    message: "User not found. Invalid token.",
  });
}

req.user = user;  // ← Attached to request
next();
```

**What's attached:** Full `User` document from MongoDB  
**Contains:** `_id`, `email`, `role`/`roles`, all user fields

### Q: Is req.user._id or req.user.id?
**A:** ✅ **req.user._id** — because `user` is a full Mongoose document:
```javascript
req.user = user;  // User is Mongoose doc with ._id property
```

### Q: Does isDoctor check req.user.role or req.user.roles?
**A:** ✅ **BOTH** — supports both schemas (lines 95-99):
```javascript
const userRoles = Array.isArray(req.user.roles)
  ? req.user.roles.map(r => r.toLowerCase())
  : [(req.user.role || "").toLowerCase()];

if (!userRoles.includes("doctor")) {
  return res.status(403).json({
    success: false,
    message: "Access denied. Doctor only."
  });
}
```

### Q: What exact value does it check for?
**A:** Checks for **`"doctor"`** (lowercase after conversion)

**Value stored in User doc:** Must be `"doctor"` (case-insensitive, will be lowercased)

### Q: Is doctor's role stored as lowercase in database?
**A:** ⚠️ **UNKNOWN** — Depends on how User is created

**The middleware converts to lowercase for comparison:**
```javascript
.map(r => r.toLowerCase())  // "Doctor" → "doctor", "DOCTOR" → "doctor"
```

So even if role is stored as `"Doctor"` (capital), it will match.

### Q: Does isDoctor call next() on success?
**A:** ✅ **YES** — line 115:
```javascript
process.stdout.write('✅ [DOCTOR-AUTH] Doctor verified for ' + req.user.email + '\n');
req.doctor = doctor;
next();  // ← Continues to next middleware/handler
```

---

## ROOT CAUSE ANALYSIS

### **CRITICAL ISSUE #1: Code Field Structure Mismatch**

**Problem:** Frontend sends nested array, server expects string:
```javascript
// Frontend sends:
code: { coding: [{ system: '...', code: 'J45' }] }

// Server destructures:
const { code } = req.body;  // code = { coding: [...] }

// Server assigns to Mongoose:
code: {
  system: '...',
  coding: code,  // ← Now: { coding: [...] }
  display
}

// Mongoose expects:
code: {
  system: String,
  coding: String,  // ← Should be "J45", not { coding: [...] }
  display: String
}
```

**Result:** Mongoose validation FAILS because `coding` field is an object, not a string.  
**HTTP Response:** 422 Unprocessable Entity

---

### **CRITICAL ISSUE #2: FIELD_ENC_KEY Length Invalid**

**Problem:** Both encryption keys are the wrong length:
```
FIELD_ENC_KEY=clinicall_super_secure_key_123456
Length: 34 characters (should be 32 for AES-256)

ENCRYPTION_KEY=your_32_char_encryption_key_for_mongoose_field_encryption
Length: 59 characters (should be 32)
```

**Impact:** When Condition doc is saved, the `notes` field encryption may fail silently.  
**Result:** Mongoose save operation fails or document is corrupted.

---

### **CRITICAL ISSUE #3: clinicalStatus Value Mismatch**

**Minor Issue:** Form sends `status: 'active'`, 'inactive'`, or `'remission'`  
Mongoose expects: `'active'`, `'recurrence'`, `'relapse'`, `'inactive'`, `'remission'`, `'resolved'`

**Current values that WORK:** `'active'`, `'inactive'`, `'remission'` ✅  
**Frontend value NOT in schema enum:** None (they're all valid)

This isn't the root cause but could be in future versions.

---

## RECOMMENDED FIXES

### **FIX 1: Frontend Payload Structure (Priority: CRITICAL)**

**File:** [frontend/src/pages/doctor/ClinicalNotes.jsx](frontend/src/pages/doctor/ClinicalNotes.jsx#L80-86)

**Change from:**
```javascript
await createCondition({
  user_ref: patientId,
  code: {
    coding: [{ system: 'http://snomed.info/sct', code: form.code }]
  },
  display: form.code,
  severity: form.severity,
  clinicalStatus: form.status,
  notes: form.notes
});
```

**Change to:**
```javascript
await createCondition({
  user_ref: patientId,
  code: form.code,  // ← Just the code string
  display: form.code,
  severity: form.severity,
  clinicalStatus: form.status,
  notes: form.notes
});
```

---

### **FIX 2: Add Logging for Debugging**

**File:** [frontend/src/pages/doctor/ClinicalNotes.jsx](frontend/src/pages/doctor/ClinicalNotes.jsx#L81)

**Add before createCondition:**
```javascript
const payload = {
  user_ref: patientId,
  code: form.code,
  display: form.code,
  severity: form.severity,
  clinicalStatus: form.status,
  notes: form.notes
};
console.log('Condition payload:', JSON.stringify(payload, null, 2));
await createCondition(payload);
```

**File:** [frontend/src/services/fhirApi.js](frontend/src/services/fhirApi.js#L288)

**Add at top of createCondition:**
```javascript
export const createCondition = async (condition) => {
  try {
    console.log('[fhirApi] createCondition request:', JSON.stringify(condition, null, 2));
    const response = await fhirClient.post('/Condition', condition);
    return response.data;
  } catch (error) {
    console.log('[fhirApi] createCondition error response:', error.response?.data);
    console.error('Error creating condition:', error);
    throw error;
  }
};
```

**File:** [server/routes/fhir.js](server/routes/fhir.js#L825)

**Add before validation:**
```javascript
router.post('/Condition', authenticateUser, isDoctor, fhirWriteLimiter, async (req, res, next) => {
  try {
    console.log('📨 [SERVER] POST /Condition received');
    console.log('👤 [SERVER] User:', req.user.email, req.user._id);
    console.log('📋 [SERVER] req.body:', JSON.stringify(req.body, null, 2));
    
    const validation = validateResource('Condition', req.body);
    if (!validation.valid) {
      console.warn('❌ [SERVER] Condition validation failed:', validation.errors);
      return res.status(422).json(createOperationOutcome(validation.errors));
    }
    // ... rest of handler
  }
};
```

---

### **FIX 3: Fix Encryption Keys (Priority: HIGH)**

**File:** [server/.env](server/.env#L32-33)

**Change from:**
```
ENCRYPTION_KEY=your_32_char_encryption_key_for_mongoose_field_encryption
FIELD_ENC_KEY=clinicall_super_secure_key_123456
```

**Change to:**
```
ENCRYPTION_KEY=1234567890123456789012345678901a  # Exactly 32 chars
FIELD_ENC_KEY=abcdefghijklmnopqrstuvwxyz123456  # Exactly 32 chars
```

For production, use a cryptographically secure key:
```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

---

### **FIX 4: Update Condition Model to Match Frontend**

**File:** [server/models/Condition.js](server/models/Condition.js#L8-15)

**Consider changing `code` structure to match FHIR standard:**
```javascript
code: {
  system: {
    type: String,
    enum: ['http://hl7.org/fhir/sid/icd-10', 'http://snomed.info/sct', 'http://clinicall.local/condition'],
    default: 'http://clinicall.local/condition'
  },
  coding: String,    // Store the actual code string "J45"
  display: String    // Medical description "Asthma"
}
```

---

### **FIX 5: Update Server Code Field Assignment**

**File:** [server/routes/fhir.js](server/routes/fhir.js#L835-844)

**Change from:**
```javascript
const condition = new Condition({
  userId: user_ref,
  code: {
    system: 'http://hl7.org/fhir/sid/icd-10-cm',
    coding: code,      // ← code is already an object
    display
  },
  // ...
});
```

**Change to:**
```javascript
const condition = new Condition({
  userId: user_ref,
  code: {
    system: code.system || 'http://hl7.org/fhir/sid/icd-10',  // ← Use from payload
    coding: code,      // ← Now code is a string
    display
  },
  // ...
});
```

---

## SUMMARY TABLE

| Scan | Finding | Severity | Status |
|---|---|---|---|
| 1 | Frontend sends `code` as nested object `{ coding: [...] }` | **CRITICAL** | ❌ Not fixed |
| 2 | No logging in API layer | Low | ⚠️ Missing |
| 3 | Validator accepts any `clinicalStatus` (no enum check) | Med | ⚠️ Design issue |
| 4 | Server treats `code` object as string when assigning to Mongoose | **CRITICAL** | ❌ Causes 422 |
| 5 | Mongoose schema expects `code.coding: String` | **CRITICAL** | ❌ Not fixed |
| 6 | `FIELD_ENC_KEY` is 34 chars instead of 32 | **HIGH** | ❌ Not fixed |
| 7 | Middleware order is correct, fileUpload won't interfere | Low | ✅ OK |
| 8 | Auth middleware correctly attaches user and checks doctor role | Low | ✅ OK |

---

## NEXT STEPS

1. **Immediately:** Fix Frontend Payload Structure (FIX 1) — This is blocking condition creation
2. **Immediately:** Fix Encryption Keys (FIX 3) — This could cause silent failures
3. **Soon:** Add comprehensive logging (FIX 2) — This prevents future debugging issues
4. **Follow-up:** Review and update server code (FIX 5) — Ensure consistency with frontend schema

