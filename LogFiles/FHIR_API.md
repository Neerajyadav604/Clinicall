# FHIR R4 API Documentation

## Overview

Clinicall Backend implements a FHIR R4-compliant REST API for secure electronic health record (EHR) data exchange. All endpoints require OAuth2/SMART on FHIR authentication and patient consent.

**API Base URL:** `http://localhost:5000/api/v1/fhir/R4`

**Authentication:** Bearer Token (JWT) + FHIR OAuth2 Token

---

## Authentication & Authorization

### OAuth2/SMART on FHIR Flow

1. **Initiate OAuth Launch**
   ```
   GET /auth/fhir/authorize
   ```
   Redirects user to EHR authorization endpoint with SMART launch parameters.

2. **Callback and Token Exchange**
   ```
   GET /auth/fhir/callback?code={auth_code}&state={state}
   ```
   Exchanges authorization code for access token.

3. **Use Access Token**
   ```
   Authorization: Bearer {access_token}
   ```
   Include JWT in `Authorization` header for all FHIR API requests.

### Token Requirements

- **JWT Token:** Obtained after user login via /api/v1/auth/login
- **FHIR OAuth Token:** Obtained via SMART on FHIR flow for healthcare provider integration
- **Auto-Refresh:** Tokens are automatically refreshed on expiration (handled by frontend tokenGuard.js)

### Consent Verification

All FHIR endpoints enforce patient consent middleware:
- Patient must have active (`status: 'active'`) Consent record
- Consent must not be expired (`period.end > now`)
- Doctor cannot access patient data without valid consent
- Admin users bypass consent checks for audit/compliance access only

---

## Endpoints by Resource Type

### Patient Resource

#### GET /fhir/R4/Patient/:id
**Get patient demographics**

- **Auth:** Required (JWT + FHIR OAuth)
- **Rate Limit:** 100 req/15min (fhirReadLimiter)
- **Response:**
  ```json
  {
    "resourceType": "Patient",
    "id": "{patient_id}",
    "name": [{ "use": "official", "text": "{encrypted}" }],
    "birthDate": "{encrypted}",
    "gender": "{encrypted}",
    "contact": [{ "relationship": [{ "coding": [{ "code": "emergency" }] }], "value": "{encrypted}" }],
    "address": [{ "text": "{encrypted}" }],
    "telecom": [{ "system": "phone", "value": "{encrypted}" }]
  }
  ```
- **Errors:** 403 (no consent), 404 (not found), 429 (rate limited)

#### GET /fhir/R4/Patient
**Search patients (admin only)**

- **Query Params:** `name`, `birthdate`, `phone`
- **Response:** Bundle of Patient resources
- **Rate Limit:** 100 req/15min
- **Auth:** Admin role required

#### POST /fhir/R4/Patient
**Create new patient**

- **Required Fields:** `name` (required), `gender`, `birthDate`, `address`, `telecom`
- **Request Body:**
  ```json
  {
    "resourceType": "Patient",
    "name": [{ "use": "official", "text": "Jane Doe" }],
    "birthDate": "1990-01-15",
    "gender": "female",
    "address": [{ "text": "123 Main St, City, State" }],
    "telecom": [{ "system": "phone", "value": "+1-555-0100" }]
  }
  ```
- **Response:** Created Patient with `id`
- **Rate Limit:** 30 req/15min (fhirWriteLimiter)
- **Validation:** fhirValidator checks required fields, date formats, reference formats
- **Error:** 422 (validation failure with OperationOutcome)

---

### Condition Resource

#### POST /fhir/R4/Condition
**Create/diagnose a new condition**

- **Required Fields:** `code`, `subject` (Patient ref), `clinicalStatus`
- **Request Body:**
  ```json
  {
    "resourceType": "Condition",
    "code": {
      "coding": [{ "system": "http://snomed.info/sct", "code": "44054006", "display": "Diabetes" }]
    },
    "subject": { "reference": "Patient/{patient_id}" },
    "clinicalStatus": { "coding": [{ "code": "active" }] },
    "recordedDate": "2026-03-13T10:30:00Z"
  }
  ```
- **Rate Limit:** 30 req/15min (fhirWriteLimiter)
- **PHI Fields (encrypted):** code.display, notes, evidence
- **Validation:** Patient reference must exist and match FHIR format

#### GET /fhir/R4/Condition/:id
**Retrieve condition**

#### PATCH /fhir/R4/Condition/:id
**Update condition status**

- **Allowed Updates:** `clinicalStatus`, `verificationStatus`, `note`
- **Rate Limit:** 30 req/15min (fhirWriteLimiter)

#### DELETE /fhir/R4/Condition/:id
**Soft-delete condition (archive)**

---

### Observation Resource (Test Results, Vital Signs)

#### POST /fhir/R4/Observation
**Create observation (lab result, vital sign)**

- **Required Fields:** `code`, `subject`, `value` (Quantity or CodeableConcept)
- **Request Body:**
  ```json
  {
    "resourceType": "Observation",
    "status": "final",
    "code": {
      "coding": [{ "system": "http://loinc.org", "code": "2085-9", "display": "Cholesterol [Mass/volume]" }]
    },
    "subject": { "reference": "Patient/{patient_id}" },
    "effectiveDateTime": "2026-03-13T10:30:00Z",
    "value": { "value": 195, "unit": "mg/dL" },
    "referenceRange": [{ "low": { "value": 125 }, "high": { "value": 200 } }]
  }
  ```
- **Rate Limit:** 30 req/15min (fhirWriteLimiter)
- **PHI Fields (encrypted):** value, interpretation, note

#### GET /fhir/R4/Observation/:id
**Get single observation**

#### GET /fhir/R4/Observation?subject=Patient/{id}
**Get all observations for patient**

- **Rate Limit:** 100 req/15min (fhirReadLimiter)

---

### AllergyIntolerance Resource

#### POST /fhir/R4/AllergyIntolerance
**Record allergy or intolerance**

- **Required Fields:** `type`, `category`, `substance` (CodeableConcept)
- **Request Body:**
  ```json
  {
    "resourceType": "AllergyIntolerance",
    "type": "allergy",
    "category": ["medication"],
    "substance": {
      "coding": [{ "system": "http://snomed.info/sct", "code": "372687004", "display": "Penicillin" }]
    },
    "clinicalStatus": { "coding": [{ "code": "active" }] },
    "verificationStatus": { "coding": [{ "code": "confirmed" }] },
    "reaction": [
      {
        "substance": { "coding": [{ "display": "Penicillin" }] },
        "manifestation": [{ "coding": [{ "code": "39579001", "display": "Anaphylaxis" }] }],
        "severity": "severe"
      }
    ]
  }
  ```
- **PHI Fields (encrypted):** substance, manifestation, note

#### GET /fhir/R4/AllergyIntolerance/:id
**Get allergy record**

---

### Medication & MedicationRequest Resources

#### POST /fhir/R4/Medication
**Create medication record**

- **Required Fields:** `code` (RxNorm or SNOMED)
- **Request Body:**
  ```json
  {
    "resourceType": "Medication",
    "code": {
      "coding": [{ "system": "http://www.nlm.nih.gov/research/umls/rxnorm", "code": "207106", "display": "Ibuprofen 200mg" }]
    },
    "status": "active"
  }
  ```

#### POST /fhir/R4/MedicationRequest
**Prescribe medication**

- **Required Fields:** `medication`, `subject` (Patient ref), `intent`
- **Request Body:**
  ```json
  {
    "resourceType": "MedicationRequest",
    "status": "active",
    "intent": "order",
    "medication": { "reference": "Medication/{med_id}" },
    "subject": { "reference": "Patient/{patient_id}" },
    "authoredOn": "2026-03-13T10:30:00Z",
    "dosageInstruction": [
      {
        "sequence": 1,
        "text": "Take 1 tablet by mouth twice daily",
        "timing": { "repeat": { "frequency": 2, "period": 1, "periodUnit": "d" } },
        "doseAndRate": [{ "doseQuantity": { "value": 200, "unit": "mg" } }]
      }
    ]
  }
  ```
- **Rate Limit:** 30 req/15min (fhirWriteLimiter)

#### GET /fhir/R4/MedicationRequest/:id
**Get prescription**

#### PATCH /fhir/R4/MedicationRequest/:id
**Update prescription (status, dosage)**

---

### DiagnosticReport Resource

#### POST /fhir/R4/DiagnosticReport
**Create diagnostic report (test panel results)**

- **Required Fields:** `code`, `status`, `subject`
- **Request Body:**
  ```json
  {
    "resourceType": "DiagnosticReport",
    "status": "final",
    "code": {
      "coding": [{ "system": "http://loinc.org", "code": "24323-8", "display": "Comprehensive metabolic panel" }]
    },
    "subject": { "reference": "Patient/{patient_id}" },
    "effectiveDateTime": "2026-03-13T10:30:00Z",
    "result": [{ "reference": "Observation/{obs_id}" }],
    "conclusion": "All values within normal range"
  }
  ```
- **PHI Fields (encrypted):** conclusion, codedDiagnosis

#### GET /fhir/R4/DiagnosticReport/:id
**Get diagnostic report**

---

### Procedure Resource

#### POST /fhir/R4/Procedure
**Record surgical/medical procedure**

- **Required Fields:** `code`, `status`, `subject`
- **Request Body:**
  ```json
  {
    "resourceType": "Procedure",
    "status": "completed",
    "code": {
      "coding": [{ "system": "http://snomed.info/sct", "code": "17744000", "display": "Lipid panel" }]
    },
    "subject": { "reference": "Patient/{patient_id}" },
    "performedDateTime": "2026-03-13T10:30:00Z",
    "performer": [{ "actor": { "reference": "Practitioner/{doctor_id}" } }]
  }
  ```

---

### Immunization Resource

#### POST /fhir/R4/Immunization
**Record vaccine administration**

- **Required Fields:** `vaccineCode`, `status`, `patient`
- **Request Body:**
  ```json
  {
    "resourceType": "Immunization",
    "status": "completed",
    "vaccineCode": {
      "coding": [{ "system": "http://hl7.org/fhir/sid/cvx", "code": "207", "display": "COVID-19, mRNA, LNP-S, PF, 30 mcg/0.3mL dose" }]
    },
    "patient": { "reference": "Patient/{patient_id}" },
    "occurrenceDateTime": "2026-03-13T10:30:00Z",
    "performer": [{ "actor": { "reference": "Practitioner/{doctor_id}" } }],
    "site": { "coding": [{ "code": "LA", "display": "Left arm" }] }
  }
  ```

---

### DocumentReference Resource

#### POST /fhir/R4/DocumentReference
**Upload patient document (scans, reports, imaging)**

- **Request Body:**
  ```json
  {
    "resourceType": "DocumentReference",
    "status": "current",
    "type": {
      "coding": [{ "system": "http://loinc.org", "code": "18842-5", "display": "Discharge summary" }]
    },
    "subject": { "reference": "Patient/{patient_id}" },
    "date": "2026-03-13T10:30:00Z",
    "author": [{ "reference": "Practitioner/{doctor_id}" }],
    "content": [
      {
        "attachment": {
          "contentType": "application/pdf",
          "url": "https://res.cloudinary.com/...",
          "title": "Discharge Summary"
        }
      }
    ]
  }
  ```
- **File Upload:** Via Cloudinary (see SETUP_GUIDE.md)

#### GET /fhir/R4/DocumentReference/:id
**Get document reference**

#### DELETE /fhir/R4/DocumentReference/:id
**Delete document (removes Cloudinary file)**

---

### Consent Resource

#### POST /fhir/R4/Consent
**Create patient consent**

- **Request Body:**
  ```json
  {
    "resourceType": "Consent",
    "status": "active",
    "scope": {
      "coding": [{ "code": "patient-privacy" }]
    },
    "patient": { "reference": "Patient/{patient_id}" },
    "dateTime": "2026-03-13T10:30:00Z",
    "performer": [{ "reference": "Patient/{patient_id}" }],
    "organization": [{ "reference": "Organization/clinicall" }],
    "sourceAttachment": { "title": "Privacy Consent Form" },
    "provision": [
      {
        "type": "permit",
        "actor": [{ "role": { "coding": [{ "code": "PRCP" }] }, "reference": { "reference": "Practitioner/{doctor_id}" } }],
        "action": [{ "coding": [{ "code": "access" }] }],
        "securityLabel": [{ "coding": [{ "code": "PHI" }] }]
      }
    ],
    "period": {
      "start": "2026-03-13",
      "end": "2027-03-13"
    }
  }
  ```

#### GET /fhir/R4/Consent/:id
**Get consent record**

---

### AuditEvent Resource

#### GET /fhir/R4/AuditEvent
**Query audit logs (admin only)**

- **Query Params:** `entity`, `agent`, `date`, `outcome`
- **Rate Limit:** 100 req/15min (fhirReadLimiter)
- **Response:** Bundle of AuditEvent resources

#### POST /fhir/R4/AuditEvent/$generate-report
**Generate HIPAA audit compliance report**

- **Auth:** Admin role required
- **Query Params:** `startDate`, `endDate`, `patientId` (optional)
- **Request Body:**
  ```json
  {
    "startDate": "2026-01-01",
    "endDate": "2026-03-13",
    "patientId": "{patient_id_optional}"
  }
  ```
- **Response:** OperationOutcome with report summary
  ```json
  {
    "resourceType": "OperationOutcome",
    "issue": [
      {
        "severity": "information",
        "code": "informational",
        "diagnostics": "HIPAA Audit Report Generated: 125 access events, 3 failed attempts, 0 breaches detected. Report saved to server/logs/"
      }
    ]
  }
  ```
- **Output File:** `server/logs/hipaa-report-{date}.json` with full details

---

### Patient Export Operations

#### GET /fhir/R4/Patient/:id/$export
**Export patient's complete medical record**

- **Auth:** Patient or authorized provider (requires consent)
- **Rate Limit:** 5 exports/hour per user (exportLimiter)
- **Response:** ExportJob record with Cloudinary download URL
- **Expiration:** Export files expire in 7 days (auto-cleanup via dataIntegrityChecker)
- **Format:** ZIP containing all resources as FHIR JSON

---

### Patient Synchronization

#### POST /fhir/R4/Patient/:id/$sync
**Sync patient data with external EHR (SMART on FHIR)**

- **Auth:** Doctor with active consent
- **Rate Limit:** 10 syncs/hour per user (syncLimiter)
- **Request Body:**
  ```json
  {
    "externalSystem": "http://external-ehr.com",
    "resourceTypes": ["Patient", "Condition", "Observation", "MedicationRequest"]
  }
  ```
- **Response:** SyncLog record with sync status and count
- **Uses:** fhirSyncEngine.js to pull data from external FHIR server

---

## Error Responses

### OperationOutcome Format

All errors return FHIR-standard OperationOutcome:

```json
{
  "resourceType": "OperationOutcome",
  "issue": [
    {
      "severity": "error",
      "code": "business-rule",
      "diagnostics": "Consent required: Patient must grant consent for this access"
    }
  ]
}
```

### Common Error Codes

| HTTP | Code | Meaning |
|------|------|---------|
| 400 | invalid | Malformed request |
| 403 | forbidden | Access denied (missing consent, insufficient permissions) |
| 404 | not-found | Resource not found |
| 422 | business-rule | Validation error (see diagnostics) |
| 429 | throttled | Rate limit exceeded |
| 500 | exception | Server error |

### Rate Limit Headers

All rate-limited responses include:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 75
X-RateLimit-Reset: 1678881600
```

---

## Data Integrity & Encryption

### Encrypted Fields (PHI)

The following fields are encrypted at rest using `mongoose-field-encryption`:

**Patient/User Models:**
- dob, gender, bloodGroup, address, phone, email, emergencyContact, insurance

**Clinical Models:**
- Condition: diagnosis code, notes
- Observation: value, interpretation
- Medication: code, description
- MedicationRequest: dosage instructions, reason
- Procedure: code, notes
- Immunization: vaccine code, notes
- DiagnosticReport: conclusion, findings

**Access Pattern:**
- Fields are decrypted on read (automatic via Mongoose plugin)
- Fields are encrypted on save (automatic via plugin)
- Encryption key: `process.env.FIELD_ENC_KEY` (must match between backend instances)

### Validation Rules

All POST/PATCH requests validate against:
1. **FHIR R4 Schema** — Required fields per resource type
2. **Date Format** — ISO 8601 (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ)
3. **Reference Format** — ResourceType/id or full URL
4. **Code System** — Must map to SNOMED, LOINC, ICD-10, RxNorm, CVX, etc.

---

## Data Retention & Cleanup

| Resource | Retention | Auto-Cleanup |
|----------|-----------|--------------|
| AuditEvent | 7 years | Manual (compliance requirement) |
| Consent | Until revoked | checkExpiredConsents() daily at 2am |
| ExportJob | 7 days | checkExpiredExportJobs() daily at 2am |
| Breach records | 6 years | Manual (must retain for audit) |

---

## FHIR Terminology Systems

Clinicall supports the following code systems:

| System | URL | Usage |
|--------|-----|-------|
| SNOMED CT | http://snomed.info/sct | Clinical diagnoses, observations |
| LOINC | http://loinc.org | Lab codes, vital signs |
| ICD-10 | http://hl7.org/fhir/sid/icd-10 | Diagnoses (billing) |
| RxNorm | http://www.nlm.nih.gov/research/umls/rxnorm | Medications |
| CVX | http://hl7.org/fhir/sid/cvx | Vaccines |
| FHIR CodeSystems | http://terminology.hl7.org/CodeSystem/* | Status, relationship codes |

---

## Example Workflows

### Complete Patient Creation & Diagnosis Workflow

1. **Create Patient**
   ```
   POST /fhir/R4/Patient
   { name, birthDate, gender, address, telecom }
   → Returns Patient/{id}
   ```

2. **Create Consent**
   ```
   POST /fhir/R4/Consent
   { patient: Patient/{id}, performer: Patient/{id}, period }
   → Returns Consent/{id}
   ```

3. **Create Condition**
   ```
   POST /fhir/R4/Condition
   { code, subject: Patient/{id}, clinicalStatus }
   → Returns Condition/{id}
   ```

4. **Create Observations**
   ```
   POST /fhir/R4/Observation
   { code, subject: Patient/{id}, value, effectiveDateTime }
   → Returns Observation/{id}
   ```

5. **Create Diagnostic Report**
   ```
   POST /fhir/R4/DiagnosticReport
   { code, subject: Patient/{id}, result: [Observation/{ids}] }
   → Returns DiagnosticReport/{id}
   ```

6. **Export Complete Record**
   ```
   GET /fhir/R4/Patient/{id}/$export
   → Returns ExportJob with Cloudinary ZIP URL
   ```

---

## Support & Troubleshooting

- **Auth Errors:** Verify JWT and FHIR OAuth tokens in Authorization header
- **Validation Errors:** Check response OperationOutcome.issue[].diagnostics for details
- **Rate Limiting:** Wait for X-RateLimit-Reset timestamp
- **Consent Issues:** Verify Consent.status = "active" and period.end > now
- **Documentation:** See HIPAA_CONTROLS.md for compliance details

---

**Last Updated:** March 13, 2026
**API Version:** 1.0.0
**FHIR Version:** R4 (4.0.1)
