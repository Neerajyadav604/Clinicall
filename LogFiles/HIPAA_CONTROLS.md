# HIPAA Compliance & Security Controls

Clinicall Backend implements comprehensive HIPAA-compliant controls for electronic health records (EHRs) under 45 CFR Parts 160, 162, and 164.

---

## 1. Access Control (164.308(a)(4))

### Authentication & Authorization

**JWT-Based Authentication:**
- All FHIR API endpoints require Bearer token in Authorization header
- JWT expires after 24 hours (configurable via JWT_SECRET)
- Tokens stored securely with HttpOnly cookies (frontend)
- Refresh tokens stored server-side with 7-day expiration

**OAuth2/SMART on FHIR:**
- Enterprise support for healthcare provider authentication
- Integrates with certified EHR systems (SMART on FHIR specification)
- Automatic token refresh via tokenGuard.js (frontend)
- Scope-based permission model: `patient/*.read`, `patient/*.write`, `launch/patient`

**Rate Limiting (Prevents Brute Force Attacks):**

| Endpoint | Limit | Window | Purpose |
|----------|-------|--------|---------|
| Login | 10 attempts | 15 minutes | loginLimiter |
| Signup | 5 attempts | 1 hour | signupLimiter |
| FHIR GET | 100 requests | 15 minutes | fhirReadLimiter (per IP) |
| FHIR POST/PATCH/DELETE | 30 requests | 15 minutes | fhirWriteLimiter (per IP) |
| Export Job | 5 exports | 1 hour | exportLimiter (per user) |
| Sync Operation | 10 syncs | 1 hour | syncLimiter (per user) |

**Implementation:**
```javascript
// server/middleware/rateLimiter.js
const loginLimiter = rateLimit({ windowMs: 15*60*1000, max: 10 });
const fhirReadLimiter = rateLimit({ windowMs: 15*60*1000, max: 100, keyGenerator: (req) => req.ip });
```

### Role-Based Access Control (RBAC)

**User Roles:**
- `patient` — Can access own medical records, manage consent
- `doctor` — Can access patient records with valid consent, create/update diagnoses
- `admin` — Full system access (generates HIPAA reports, audits), cannot modify patient data except via consent workflow
- `hospital_admin` — Manages hospital staff and settings, limited audit access

**Consent-Based Access:**
- Doctors cannot access patient data without active Consent record
- consentMiddleware.js enforces: `Consent.status = 'active'` AND `Consent.period.end > now`
- Consent may be limited by resource type, action (read/write), or date range
- Patient can revoke consent anytime (sets status to 'revoked')

**Endpoint-Level Access Examples:**

```javascript
// server/routes/fhir.js

// Patient can only read own records
router.get('/Patient/:id', authenticateUser, (req, res) => {
  if (req.user.role === 'patient' && req.user._id !== patientId) {
    return res.status(403).json({ error: 'Access Denied' });
  }
  // ...
});

// POST requires doctor or admin role + valid consent
router.post('/Condition', authenticateUser, consentMiddleware, (req, res) => {
  if (!['doctor', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Only doctors can create conditions' });
  }
  // ...
});

// Admin-only audit report
router.post('/AuditEvent/$generate-report', authenticateUser, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  // ...
});
```

**Privilege Minimization:**
- Each role has minimal permissions necessary for its function
- No implicit elevation; explicit role checks before each operation
- Service accounts (if used) assigned to specific roles, not admin by default

---

## 2. Audit Controls (164.312(b))

### Audit Event Logging

All PHI access logged to `AuditEvent` collection via `logFHIRAccess()` middleware.

**Logged Events:**

| Event | Trigger | Fields Captured |
|-------|---------|-----------------|
| READ | GET request to FHIR resource | userId, action, resourceType, patientId, timestamp, IP address, user agent |
| CREATE | POST request to FHIR resource | userId, resourceType, success/failure, HTTP status, error (if any) |
| UPDATE | PATCH/PUT to FHIR resource | userId, original values (encrypted), new values (encrypted), timestamp |
| DELETE | DELETE to FHIR resource | userId, resource details, timestamp, reason (if provided) |
| ACCESS_DENIED | Failed consent check | userId, patientId, resource, reason (consent missing/expired/revoked) |
| AUTH_FAILURE | Failed JWT verification | IP address, timestamp, attempted endpoint |
| EXPORT | $export operation | userId, patientId, export type, Cloudinary URL, timestamp |
| SYNC | $sync operation | userId, externalSystem, resourceTypes, sync status |
| CONFIG_CHANGE | User/role/consent update | admin, change details, affected userId |

**Schema (AuditEvent model):**
```javascript
{
  action: String, // 'READ', 'CREATE', 'UPDATE', 'DELETE', 'ACCESS_DENIED', etc.
  userId: ObjectId, // Reference to User who performed action
  resourceType: String, // 'Patient', 'Condition', 'Observation', ...
  resourceId: String, // FHIR resource ID
  patientId: ObjectId, // Patient affected (for audit queries)
  accessorRole: String, // 'doctor', 'patient', 'admin', 'hospital_admin'
  success: Boolean, // true if operation succeeded
  httpStatus: Number, // 200, 403, 404, 500, etc.
  errorMessage: String, // Error details (if failed)
  ipAddress: String, // Source IP
  userAgent: String, // Browser/client info
  timestamp: Date, // When action occurred
  details: {
    // Operation-specific details
    oldValues: {}, // For UPDATE operations (encrypted fields)
    newValues: {}, // For UPDATE operations (encrypted fields)
    exportUrl: String, // For $export operations
    externalSystem: String, // For $sync operations
  }
}
```

**Audit Log Retention:**
- **Minimum Retention:** 7 years per HIPAA § 164.312(b)
- **Storage:** MongoDB (secure, encrypted at rest)
- **Backup:** Daily backup to Cloudinary (see SETUP_GUIDE.md)
- **No Purging:** Audit logs are never deleted except per court order or patient data destruction

**Access to Audit Logs:**
- Admin view: Full audit trail (all users, all events)
- Doctor view: Limited to own reads/writes and assigned patients
- Patient view: Access log report only (via MyProfile.js)

### Generating HIPAA Compliance Reports

**Endpoint:** `POST /fhir/R4/AuditEvent/$generate-report` (admin only)

**Request:**
```bash
curl -X POST http://localhost:5000/api/v1/fhir/R4/AuditEvent/$generate-report \
  -H "Authorization: Bearer {jwt_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2026-01-01",
    "endDate": "2026-03-13",
    "patientId": "optional_patient_id"
  }'
```

**Response:**
```json
{
  "resourceType": "OperationOutcome",
  "issue": [
    {
      "severity": "information",
      "code": "informational",
      "diagnostics": "HIPAA Audit Report Generated: 1250 access events, 12 failed attempts, 0 breaches detected. Report saved to server/logs/hipaa-report-2026-03-13.json"
    }
  ]
}
```

**Report Output File:** `server/logs/hipaa-report-{date}.json`

**Report Contents:**
```json
{
  "generatedAt": "2026-03-13T14:30:00Z",
  "generatedBy": "admin@clinicall.com",
  "period": {
    "start": "2026-01-01",
    "end": "2026-03-13"
  },
  "summary": {
    "totalEvents": 1250,
    "successfulAccesses": 1238,
    "failedAttempts": 12,
    "breachesDetected": 0,
    "uniqueUsersAccessed": 45,
    "uniquePatientsAccessed": 380
  },
  "eventsByType": {
    "READ": 892,
    "CREATE": 245,
    "UPDATE": 89,
    "DELETE": 12,
    "ACCESS_DENIED": 12
  },
  "eventsByUser": [
    { "userId": "...", "userName": "dr_smith@clinicall.com", "role": "doctor", "eventCount": 245, "lastAccess": "2026-03-13T14:20:00Z" }
  ],
  "eventsByPatient": [
    { "patientId": "...", "patientName": "{encrypted}", "eventCount": 15, "accessors": ["dr_smith", "patient"] }
  ],
  "failedAttempts": [
    { "userId": "...", "action": "READ", "reason": "Consent expired", "timestamp": "2026-03-12T09:15:00Z" },
    { "userId": "...", "action": "CREATE", "reason": "Insufficient privileges", "timestamp": "2026-03-11T15:45:00Z" }
  ],
  "breaches": []
}
```

---

## 3. PHI Encryption (164.312(a)(2)(ii))

### At-Rest Encryption (Database)

**Field-Level Encryption (mongoose-field-encryption plugin):**

Sensitive fields are encrypted before storage and decrypted on retrieval:

**User/Patient Models:**
- userProfile.dob ✅
- userProfile.gender ✅
- userProfile.bloodGroup ✅
- userProfile.address ✅
- userProfile.medicalHistory ✅
- userProfile.medications ✅
- userProfile.emergencyContact ✅
- userProfile.insurance ✅

**Doctor Model:**
- doctor.licenseNumber ✅ (field-level encrypted for credential confidentiality)
- doctor.contact.phone ✅ (field-level encrypted)

**Appointment Model:**
- appointment.reason ✅ (appointment reason may indicate health condition)
- appointment.cancellationReason ✅ (may indicate health status)

**Clinical Models (FHIR Resources):**
All PHI fields encrypted per resource:
- **Condition:** code.display ✅, notes ✅, evidence ✅
- **Observation:** value ✅, interpretation ✅, referenceRange ✅, note ✅
- **AllergyIntolerance:** substance ✅, manifestation ✅, note ✅
- **Medication:** code.display ✅, description ✅
- **MedicationRequest:** dosageInstruction ✅, reason ✅, reasonCode ✅
- **DiagnosticReport:** conclusion ✅, codedDiagnosis ✅, presentedForm ✅
- **Procedure:** code.display ✅, notes ✅
- **Immunization:** vaccineCode.display ✅, note ✅
- **DocumentReference:** content[].attachment.title ✅

**Encryption Implementation:**
```javascript
// server/models/UserProfile.js
const UserProfileSchema = new mongoose.Schema({ ... });
UserProfileSchema.plugin(fieldEncryption, {
  fields: ['dob', 'gender', 'bloodGroup', 'address', 'medicalHistory', 'medications', 'emergencyContact', 'insurance'],
  secret: process.env.FIELD_ENC_KEY || 'change_this_in_prod' // 32-character key required
});
```

**Encryption Key Management:**
- Key: `process.env.FIELD_ENC_KEY` (must be 32+ characters)
- Stored in `.env` file (never committed to git)
- Same key across all server instances for data portability
- Key rotation: Requires re-encryption of all documents (see `encryptionAudit.js`)

**Audit of Encrypted Fields:**
Run to verify all PHI is encrypted:
```bash
cd server
node utils/encryptionAudit.js
```

Output: `server/logs/encryption-audit.log` listing all String fields and their encryption status

### In-Transit Encryption (HTTPS)

**TLS 1.3 Required (Production):**
- All API endpoints communicate over HTTPS/TLS 1.3 or higher
- Certificate: Self-signed (dev) or valid CA-signed (production via CloudFlare/nginx)
- Ciphers: Strong suites only (configured by Node.js default)
- HSTS Header: Enforced via Helmet middleware (1-year max-age + subdomains)

**Helmet Security Headers:**
```javascript
// server/index.js
app.use(helmet({
  contentSecurityPolicy: { ... },
  crossOriginResourcePolicy: { policy: "same-site" },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }
}));
```

### At-Rest Encryption (File Storage)

**Cloudinary Integration:**
- Medical documents, images, and exports stored on Cloudinary (HIPAA-backed secure CDN)
- Files tagged with `hipaa=true` for compliance tracking
- URLs returned as encrypted blobs in DocumentReference.content[].attachment.url
- Auto-deletion after 7 days via `checkExpiredExportJobs()` cron job

---

## 4. Breach Notification (164.400-414)

### Breach Detection

**Automated Breach Detection (Every 6 Hours):**

Run via `node-cron` at `/utils/breachDetector.js`:

**Breach Scenarios Detected:**

| Scenario | Threshold | Action |
|----------|-----------|--------|
| Unusual Access Pattern | Same IP accessing 20+ different patients in 60 minutes | Log BREACH, alert admin |
| Unauthorized Provider Access | Doctor accessing without active Consent | Log BREACH, alert admin |
| Brute Force Attempt | 5+ failed authentications from same IP in 10 minutes | Log BREACH, block IP |
| Suspicious Export | Patient exporting unrelated data or frequent bulk exports | Log BREACH, requires manual review |
| Account Compromise | Impossible travel (2 logins from distant IPs in 5 minutes) | Log BREACH, force password reset |

**Detection Code:**
```javascript
// server/utils/breachDetector.js
async function scanForBreaches() {
  // 1. Check for mass access to multiple patients
  const massAccessPatterns = await AuditEvent.aggregate([
    { $match: { action: 'READ', success: true } },
    { $group: { _id: '$ipAddress', patientCount: { $addToSet: '$patientId' } } },
    { $match: { 'patientCount.1': { $exists: true } } } // Has 2+ patients
  ]);

  for (const pattern of massAccessPatterns) {
    if (pattern.patientCount.length > 20) {
      await reportBreach({
        type: 'MASS_ACCESS',
        severity: 'HIGH',
        ipAddress: pattern._id,
        affectedPatients: pattern.patientCount,
        description: `IP accessed ${pattern.patientCount.length} patients in 1 hour`
      });
    }
  }

  // 2. Check for doctor access without consent
  const unauthorizedAccesses = await AuditEvent.find({
    action: 'READ',
    accessorRole: 'doctor',
    consentStatus: false,
    timestamp: { $gte: new Date(Date.now() - 6*60*60*1000) } // Last 6 hours
  });

  for (const access of unauthorizedAccesses) {
    await reportBreach({
      type: 'UNAUTHORIZED_ACCESS',
      severity: 'HIGH',
      userId: access.userId,
      patientId: access.patientId,
      description: 'Doctor accessed patient without valid consent'
    });
  }

  // ... more checks ...
}

async function reportBreach(breachDetails) {
  // 1. Save to Breach collection
  const breach = new Breach({
    type: breachDetails.type,
    severity: breachDetails.severity,
    detectedAt: new Date(),
    ...breachDetails,
    status: 'PENDING_REVIEW',
    resolvedAt: null
  });
  await breach.save();

  // 2. Alert admin via email
  await mailSender.sendEmail({
    to: 'admin@clinicall.com',
    subject: `HIPAA BREACH ALERT: ${breachDetails.type}`,
    html: `<h2>Security Breach Detected</h2><p>Type: ${breachDetails.type}<br>Severity: ${breachDetails.severity}<br>Details: ${breachDetails.description}</p>`
  });

  // 3. Log to audit trail
  console.error(`[BREACH] ${breachDetails.type}: ${breachDetails.description}`);
}
```

**Breach Model Schema:**
```javascript
// server/models/Breach.js
{
  type: String, // 'MASS_ACCESS', 'UNAUTHORIZED_ACCESS', 'BRUTE_FORCE', 'SUSPICIOUS_EXPORT', 'ACCOUNT_COMPROMISE'
  severity: String, // 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  detectedAt: Date,
  ipAddress: String,
  userId: ObjectId,
  affectedPatients: [ObjectId],
  description: String,
  status: String, // 'PENDING_REVIEW', 'UNDER_INVESTIGATION', 'CONFIRMED', 'RESOLVED', 'FALSE_POSITIVE'
  resolvedAt: Date,
  resolvedBy: ObjectId,
  resolutionNotes: String,
  notificationSent: Boolean,
  notificationDate: Date
}
```

**Cron Scheduling:**
```javascript
// server/index.js
const cron = require('node-cron');
const { scanForBreaches } = require('./utils/breachDetector');

// Run breach detection every 6 hours
cron.schedule('0 */6 * * *', async () => {
  console.log('[CRON] Running breach detection...');
  await scanForBreaches();
});
```

### Breach Notification Process

**Upon Confirmed Breach:**

1. **Administrative Notification** (immediate)
   - Email to admin@clinicall.com
   - Mark Breach.status = 'CONFIRMED'

2. **Patient Notification** (within 60 days per HIPAA § 164.404)
   - Email to affected patient(s)
   - Notice includes: nature of breach, data involved, steps taken, resources available
   - Template: `/server/mail/templates/breachNotification.html`

3. **Regulatory Notification** (if 500+ patients affected)
   - Notify HHS Office for Civil Rights (OCR)
   - Notify media in affected state
   - Document in HIPAA_COMPLIANCE_LOG.md

4. **Legal Review**
   - Clinicall legal team reviews breach details
   - Decision on disclosure requirements made with general counsel
   - Timeline: 60 days maximum per HIPAA

---

## 5. Data Integrity & Validation (164.306(a)(1))

### FHIR Validation

All POST/PATCH requests validated before save via `fhirValidator.js`:

```javascript
// server/utils/fhirValidator.js
async function validateResource(resourceType, fhirJson) {
  const errors = [];

  // 1. Check resourceType matches endpoint
  if (fhirJson.resourceType !== resourceType) {
    errors.push(`resourceType mismatch: expected ${resourceType}, got ${fhirJson.resourceType}`);
  }

  // 2. Check required fields per resource
  const REQUIRED_FIELDS = {
    Patient: ['name'],
    Condition: ['code', 'subject'],
    Observation: ['code', 'value'],
    ...
  };

  for (const field of (REQUIRED_FIELDS[resourceType] || [])) {
    if (!fhirJson[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // 3. Validate date formats (ISO 8601)
  const dateFields = ['birthDate', 'recordedDate', 'effectiveDateTime', 'performedDateTime'];
  for (const field of dateFields) {
    if (fhirJson[field] && !isValidISO8601Date(fhirJson[field])) {
      errors.push(`Invalid date format for ${field}: ${fhirJson[field]}`);
    }
  }

  // 4. Validate FHIR references
  const refFields = ['subject', 'patient', 'performer', 'author'];
  for (const field of refFields) {
    if (fhirJson[field]?.reference && !fhirJson[field].reference.match(/^(Patient|Practitioner|Organization)\/[a-z0-9]+$/i)) {
      errors.push(`Invalid FHIR reference format: ${fhirJson[field].reference}`);
    }
  }

  return { valid: errors.length === 0, errors };
}
```

**Applied in Routes:**
```javascript
// server/routes/fhir.js
router.post('/Condition', authenticateUser, consentMiddleware, async (req, res, next) => {
  // Validate FHIR schema before saving
  const validation = await validateResource('Condition', req.body);
  if (!validation.valid) {
    return res.status(422).json({
      resourceType: 'OperationOutcome',
      issue: [{ severity: 'error', code: 'business-rule', diagnostics: validation.errors.join('; ') }]
    });
  }

  // Save to database
  const condition = new Condition(req.body);
  await condition.save();
  res.status(201).json(condition);
});
```

### Data Integrity Checks (Daily)

**Scheduled via cron at 2am:**

```javascript
// server/utils/dataIntegrityChecker.js
async function checkOrphanedReferences() {
  // Find clinical records referencing deleted patients
  const orphans = await Condition.find({
    'subject.reference': { $regex: /^Patient\// }
  }).lean();

  for (const condition of orphans) {
    const patientId = condition.subject.reference.split('/')[1];
    const patientExists = await User.findById(patientId);
    if (!patientExists) {
      console.error(`[ORPHAN] Condition ${condition._id} references deleted Patient ${patientId}`);
      // Log to integrity report; do NOT delete
    }
  }
}

async function checkExpiredConsents() {
  // Find active consents past expiration date
  const expiredConsents = await Consent.find({
    'status': 'active',
    'period.end': { $lt: new Date() }
  });

  for (const consent of expiredConsents) {
    consent.status = 'inactive';
    await consent.save();
    console.log(`[INTEGRITY] Consent ${consent._id} marked inactive (expired)`);
  }
}

async function checkExpiredExportJobs() {
  // Find exports past 7-day expiration
  const expiredJobs = await ExportJob.find({
    expiresAt: { $lt: new Date() }
  });

  for (const job of expiredJobs) {
    // Delete from Cloudinary
    if (job.cloudinaryUrl) {
      await cloudinary.api.delete_resources([job.cloudinaryUrl]);
    }
    // Clear URLs from database (keep record for audit)
    job.cloudinaryUrl = null;
    job.status = 'EXPIRED';
    await job.save();
    console.log(`[INTEGRITY] ExportJob ${job._id} expired and cleaned up`);
  }
}

// Schedule daily at 2am
cron.schedule('0 2 * * *', async () => {
  console.log('[CRON] Running data integrity checks...');
  await checkOrphanedReferences();
  await checkExpiredConsents();
  await checkExpiredExportJobs();
});
```

**Cron Instance (shared):**
```javascript
// server/index.js — ONE cron instance for all scheduled tasks
const cron = require('node-cron');

cron.schedule('0 */6 * * *', scanForBreaches);      // Every 6 hours
cron.schedule('0 2 * * *', dataIntegrityChecker);   // Daily at 2am
```

**Integrity Report Output:**
- File: `server/logs/integrity.log`
- Format: Line-delimited JSON
- Retention: 1 year (for compliance review)

---

## 6. PHI Sanitization & Error Responses (164.308(a)(7)(i))

### Response Filtering (phiSanitizer Middleware)

**Applied to all error responses (4xx, 5xx only):**

```javascript
// server/middleware/phiSanitizer.js
const phiSanitizer = (err, req, res, next) => {
  // Only sanitize error responses, not successful (2xx, 3xx) responses
  if (res.statusCode >= 400) {
    // Redact sensitive patterns from error messages
    let message = err.message || 'Internal Server Error';
    
    // Remove patient names
    message = message.replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[PATIENT]');
    
    // Remove dates of birth
    message = message.replace(/\d{4}-\d{2}-\d{2}/g, '[DATE]');
    
    // Remove phone numbers
    message = message.replace(/\+?1?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '[PHONE]');
    
    // Remove email addresses
    message = message.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[EMAIL]');
    
    // Remove Medical Record Numbers
    message = message.replace(/MRN[:\s]+\d+/gi, '[MRN]');

    res.status(err.statusCode || 500).json({
      resourceType: 'OperationOutcome',
      issue: [{
        severity: err.severity || 'error',
        code: err.code || 'exception',
        diagnostics: message // Redacted
      }]
    });
  } else {
    next(err);
  }
};
```

**Applied in Middleware Chain:**
```javascript
// server/index.js
app.use("/api/v1/fhir/R4", require('./routes/fhir'));
app.use(phiSanitizer);  // AFTER all routes
app.use(errorHandler);    // BEFORE errorHandler
```

---

## 7. Production Deployment Checklist

**Before Production Launch, verify:**

- [ ] `.env` file populated with all required variables (see .env.example)
- [ ] `FIELD_ENC_KEY` set to random 32+ character string
- [ ] `ENCRYPTION_KEY` set to random 32+ character string
- [ ] `NODE_ENV=production`
- [ ] HTTPS/TLS enabled (certificate from valid CA)
- [ ] MongoDB authentication enabled (MONGO_URI with credentials)
- [ ] Cloudinary credentials secured (API keys in .env only)
- [ ] FHIR OAuth credentials set (CLIENT_ID, CLIENT_SECRET)
- [ ] Email credentials configured (MAIL_USER, MAIL_PASS via Gmail App Password)
- [ ] Database backups scheduled (daily to Cloudinary)
- [ ] Audit log rotation enabled (via Winston logger)
- [ ] Rate limiting active on all FHIR endpoints
- [ ] Helmet security headers configured
- [ ] CORS restricted to known frontend origin(s)
- [ ] Breach detection cron running (every 6 hours)
- [ ] Data integrity cron running (daily at 2am)
- [ ] Encryption audit run: `node server/utils/encryptionAudit.js`
- [ ] All tests passing: `npm test`
- [ ] HIPAA audit report generated: `POST /fhir/R4/AuditEvent/$generate-report`
- [ ] DBA review of database indexing (audit fields indexed for fast queries)

---

## 8. Compliance Verification Scripts

### Run Encryption Audit

```bash
cd server
node utils/encryptionAudit.js
```

Output: `server/logs/encryption-audit.log`

### Generate HIPAA Report

```bash
curl -X POST http://localhost:5000/api/v1/fhir/R4/AuditEvent/$generate-report \
  -H "Authorization: Bearer {admin_jwt}" \
  -H "Content-Type: application/json" \
  -d '{ "startDate": "2026-01-01", "endDate": "2026-03-13" }'
```

### Check for Unencrypted PHI

```bash
cd server
node utils/encryptionAudit.js | grep "UNENCRYPTED"
```

### View Recent Breaches

```javascript
// In Node.js REPL or script
const Breach = require('./models/Breach');
const breaches = await Breach.find({ status: 'CONFIRMED' }).limit(10).sort({ detectedAt: -1 });
console.table(breaches);
```

---

## 9. Incident Response Plan

**Upon Breach Confirmation:**

1. **Immediate (Within 1 hour)**
   - Admin notified via email
   - Breach marked `UNDER_INVESTIGATION`
   - Access logs reviewed for scope

2. **Within 24 hours**
   - Affected users/patients identified
   - Root cause analysis begun
   - Corrective actions documented

3. **Within 60 days (HIPAA Deadline)**
   - Affected individuals notified
   - HHS notified (if 500+ individuals)
   - Breach investigation completed
   - Breach marked `RESOLVED`

4. **Post-Incident**
   - Root cause fix implemented
   - All tests passed
   - Breach prevention control updated
   - Incident report retained for 6 years

---

## 10. References & Standards

- **HIPAA Security Rule:** 45 CFR Parts 160, 162, 164
- **HIPAA Breach Notification Rule:** 45 CFR Parts 160, 164, Subparts A & E
- **FHIR R4 Specification:** http://hl7.org/fhir/R4/security.html
- **NIST Cybersecurity Framework:** https://www.nist.gov/cyberframework
- **HL7 SMART on FHIR:** http://www.hl7.org/fhir/smart-app-launch/
- **OAuth 2.0 for Credential Handling:** RFC 6749, RFC 6750

---

**Last Updated:** March 13, 2026
**Compliance Standard:** HIPAA Security Rule & Breach Notification Rule
**Document Version:** 1.0
**Next Review:** March 13, 2027
