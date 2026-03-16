# FHIR R4 API Quick Start Guide

## Base URL
```
http://localhost:4000/api/v1/fhir/R4
```

## Authentication
All requests require JWT Bearer token:
```javascript
headers: {
  Authorization: `Bearer ${token}`,
  Accept: 'application/fhir+json'
}
```

---

## API Endpoints

### 1. Server Capability (UNAUTH - Optional)
```
GET /metadata
```
Returns FHIR CapabilityStatement describing server capabilities.

**Response:** CapabilityStatement resource

---

### 2. Get Patient
```
GET /Patient/{id}
```
Fetch a patient resource by MongoDB ID.

**Parameters:**
- `id` (path) - Patient's MongoDB _id

**Response:** FHIR Patient resource

**Example:**
```javascript
const patient = await getPatient('507f1f77bcf86cd799439011');
// {
//   resourceType: "Patient",
//   id: "507f1f77bcf86cd799439011",
//   name: [{ family: "Smith", given: ["John"] }],
//   gender: "male",
//   birthDate: "1990-05-15",
//   ...
// }
```

---

### 3. Get Practitioner
```
GET /Practitioner/{id}
```
Fetch a doctor/practitioner resource by MongoDB ID.

**Parameters:**
- `id` (path) - Doctor's MongoDB _id

**Response:** FHIR Practitioner resource

---

### 4. Get Organization
```
GET /Organization/{id}
```
Fetch a hospital/organization resource by MongoDB ID.

**Parameters:**
- `id` (path) - Hospital's MongoDB _id

**Response:** FHIR Organization resource

---

### 5. Get Encounter
```
GET /Encounter/{id}
```
Fetch an appointment as FHIR Encounter resource.

**Parameters:**
- `id` (path) - Appointment's MongoDB _id

**Response:** FHIR Encounter resource

---

### 6. Search Conditions
```
GET /Condition?patient={patientId}
```
List all clinical diagnoses for a patient.

**Parameters:**
- `patient` (query) - Patient's MongoDB _id

**Response:** FHIR Bundle (searchset type) containing Condition resources

**Example:**
```javascript
const conditions = await getConditions('507f1f77bcf86cd799439011');
// {
//   resourceType: "Bundle",
//   type: "searchset",
//   total: 2,
//   entry: [
//     {
//       resource: {
//         resourceType: "Condition",
//         id: "...",
//         code: { display: "Type 2 Diabetes" },
//         clinicalStatus: { coding: [{ code: "active" }] },
//         severity: { coding: [{ code: "moderate" }] }
//       }
//     },
//     ...
//   ]
// }
```

---

### 7. Search Observations
```
GET /Observation?subject={patientId}[&category={category}]
```
List vitals, labs, and other observations.

**Parameters:**
- `subject` (query, required) - Patient's MongoDB _id
- `category` (query, optional) - Filter by category:
  - `vital-signs` - Blood pressure, temperature, etc.
  - `laboratory` - Lab results
  - `imaging` - X-rays, MRI, etc.
  - `survey` - Patient questionnaires
  - `procedure` - Procedure results
  - `therapy` - Therapy observations

**Response:** FHIR Bundle of Observation resources

**Example:**
```javascript
// Get all vital signs
const vitals = await getVitalSigns('507f1f77bcf86cd799439011');

// Or manually construct query
const labs = await fetch(
  'http://localhost:4000/api/v1/fhir/R4/Observation?subject=507f1f77bcf86cd799439011&category=laboratory',
  { headers: { Authorization: `Bearer ${token}` } }
).then(r => r.json());
```

---

### 8. Search Allergies
```
GET /AllergyIntolerance?patient={patientId}
```
List all allergies and intolerances for a patient.

**Parameters:**
- `patient` (query) - Patient's MongoDB _id

**Response:** FHIR Bundle of AllergyIntolerance resources

**Example:**
```javascript
const allergies = await getAllergies('507f1f77bcf86cd799439011');
// {
//   resourceType: "Bundle",
//   entry: [
//     {
//       resource: {
//         resourceType: "AllergyIntolerance",
//         id: "...",
//         substance: { display: "Penicillin" },
//         type: "allergy",
//         criticality: "high",
//         reaction: [
//           {
//             manifestation: ["anaphylaxis"],
//             severity: "severe"
//           }
//         ]
//       }
//     }
//   ]
// }
```

---

### 9. Get Everything ($everything operation)
```
GET /Patient/{id}/$everything
```
Comprehensive record of everything known about a patient.  
Returns patient + conditions + observations + allergies + encounters.

**Parameters:**
- `id` (path) - Patient's MongoDB _id

**Response:** FHIR Bundle containing all patient resources

**Example:**
```javascript
const everything = await getPatientEverything('507f1f77bcf86cd799439011');
// {
//   resourceType: "Bundle",
//   type: "searchset",
//   total: 8,
//   entry: [
//     { resource: { resourceType: "Patient", ... } },
//     { resource: { resourceType: "Condition", ... } },
//     { resource: { resourceType: "Condition", ... } },
//     { resource: { resourceType: "Observation", ... } },
//     { resource: { resourceType: "AllergyIntolerance", ... } },
//     { resource: { resourceType: "Encounter", ... } },
//     ...
//   ]
// }
```

---

## Error Responses

All FHIR errors return OperationOutcome format (HTTP 4xx/5xx):

```json
{
  "resourceType": "OperationOutcome",
  "issue": [
    {
      "severity": "error",
      "code": "not-found",
      "details": {
        "text": "Patient not found"
      }
    }
  ]
}
```

**Common Status Codes:**
- `200 OK` - Resource found
- `400 Bad Request` - Missing required parameters
- `401 Unauthorized` - Invalid or missing token
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Frontend Integration

### Using the FHIR Service

```javascript
import {
  getPatient,
  getConditions,
  getObservations,
  getVitalSigns,
  getLabResults,
  getAllergies,
  getPatientEverything
} from '../services/fhirApi';

// In a React component:
useEffect(() => {
  const loadPatientData = async () => {
    try {
      const patient = await getPatient(patientId);
      const conditions = await getConditions(patientId);
      const vitals = await getVitalSigns(patientId);
      
      setPatient(patient);
      setConditions(conditions.entry.map(e => e.resource));
      setVitals(vitals.entry.map(e => e.resource));
    } catch (error) {
      console.error('Error fetching FHIR data:', error);
    }
  };
  
  loadPatientData();
}, [patientId]);
```

### Using Redux

```javascript
import { useDispatch, useSelector } from 'react-redux';
import {
  setConditions,
  setAllergies,
  setConditionsLoading
} from '../slices/fhirSlice';
import { getConditions, getAllergies } from '../services/fhirApi';

const MyComponent = ({ patientId }) => {
  const dispatch = useDispatch();
  const { conditions, allergies, conditionsLoading } = useSelector(
    state => state.fhir
  );
  
  useEffect(() => {
    const loadData = async () => {
      dispatch(setConditionsLoading(true));
      const result = await getConditions(patientId);
      dispatch(setConditions(result.entry.map(e => e.resource)));
      dispatch(setConditionsLoading(false));
    };
    
    loadData();
  }, [patientId, dispatch]);
  
  if (conditionsLoading) return <div>Loading...</div>;
  
  return (
    <div>
      {conditions.length > 0 ? (
        conditions.map(cond => (
          <div key={cond.id}>
            {cond.code?.display || 'Unknown Condition'}
          </div>
        ))
      ) : (
        <p>No conditions recorded</p>
      )}
    </div>
  );
};
```

---

## Data Structure Examples

### Patient Resource
```json
{
  "resourceType": "Patient",
  "id": "507f1f77bcf86cd799439011",
  "identifier": [
    {
      "system": "http://clinicall.local/patient",
      "value": "507f1f77bcf86cd799439011"
    }
  ],
  "name": [
    {
      "use": "official",
      "text": "John Smith",
      "family": "Smith",
      "given": ["John"]
    }
  ],
  "telecom": [
    {
      "system": "email",
      "value": "john@example.com",
      "use": "home"
    },
    {
      "system": "phone",
      "value": "+1234567890",
      "use": "mobile"
    }
  ],
  "birthDate": "1990-05-15",
  "gender": "male",
  "address": [
    {
      "use": "home",
      "text": "123 Main St, New York, NY 10001",
      "city": "New York",
      "state": "NY",
      "postalCode": "10001"
    }
  ],
  "contact": [
    {
      "relationship": [
        {
          "coding": [
            {
              "system": "http://terminology.hl7.org/CodeSystem/v2-0131",
              "code": "N",
              "display": "Emergency Contact"
            }
          ]
        }
      ],
      "telecom": [
        {
          "system": "phone",
          "value": "+1234567891"
        }
      ]
    }
  ]
}
```

### Condition Resource
```json
{
  "resourceType": "Condition",
  "id": "607f1f77bcf86cd799439022",
  "code": {
    "system": "http://hl7.org/fhir/sid/icd-10",
    "coding": "E11.9",
    "display": "Type 2 Diabetes Mellitus"
  },
  "subject": {
    "reference": "Patient/507f1f77bcf86cd799439011"
  },
  "clinicalStatus": {
    "coding": [
      {
        "code": "active"
      }
    ]
  },
  "severity": {
    "coding": [
      {
        "code": "moderate"
      }
    ]
  },
  "onsetDate": "2020-01-15",
  "recordedDate": "2026-03-13T10:30:00Z"
}
```

### Observation Resource (Vital Signs)
```json
{
  "resourceType": "Observation",
  "id": "707f1f77bcf86cd799439033",
  "category": "vital-signs",
  "code": {
    "system": "http://loinc.org",
    "coding": "8480-6",
    "display": "Systolic Blood Pressure"
  },
  "subject": {
    "reference": "Patient/507f1f77bcf86cd799439011"
  },
  "status": "final",
  "effectiveDateTime": "2026-03-13T09:30:00Z",
  "value": {
    "quantity": {
      "value": 130,
      "unit": "mmHg",
      "code": "mm[Hg]"
    }
  },
  "referenceRange": {
    "low": 100,
    "high": 140,
    "unit": "mmHg",
    "text": "Normal range"
  },
  "interpretation": [
    {
      "coding": [
        {
          "code": "normal"
        }
      ]
    }
  ]
}
```

### AllergyIntolerance Resource
```json
{
  "resourceType": "AllergyIntolerance",
  "id": "807f1f77bcf86cd799439044",
  "type": "allergy",
  "category": ["medication"],
  "substance": {
    "code": "7980",
    "display": "Penicillin G",
    "system": "http://www.nlm.nih.gov/research/umls/rxnorm"
  },
  "patient": {
    "reference": "Patient/507f1f77bcf86cd799439011"
  },
  "clinicalStatus": {
    "coding": [
      {
        "code": "active"
      }
    ]
  },
  "verificationStatus": {
    "coding": [
      {
        "code": "confirmed"
      }
    ]
  },
  "criticality": "high",
  "reaction": [
    {
      "manifestation": ["anaphylaxis"],
      "severity": "severe",
      "onset": "2015-06-12T10:30:00Z"
    }
  ]
}
```

---

## Troubleshooting

### "Patient not found" (404)
- Check patient ID is valid MongoDB ObjectId
- Verify patient exists in database: `db.users.findById(id)`

### "No token provided" (401)
- Ensure Authorization header includes Bearer token
- Check token is not expired: `getTokenExpiryMs(token)`

### Empty Bundle (0 results)
- Clinical models may be empty (no conditions/observations created yet)
- Create test data in MongoDB CLI:
  ```javascript
  db.conditions.insertOne({
    userId: ObjectId("507f1f77bcf86cd799439011"),
    code: { display: "Hypertension", coding: "I10" },
    clinicalStatus: "active"
  })
  ```

### "OperationOutcome" error instead of expected resource
- Check FHIR route is registered: Look for `/fhir/R4` in server logs
- Verify MongoDB connection working: `db.conditions.count()`

---

## Next Steps

### Phase 2 Tasks
1. **Create Clinical Data:**
   - Add POST `/Condition` endpoint
   - Add CREATE/UPDATE Observation endpoint
   - Add allergy recording UI

2. **Enhance Search:**
   - Add date range filtering
   - Add code/coding search
   - Add pagination

3. **Add More Resources:**
   - Medication model
   - MedicationRequest (prescriptions)
   - DiagnosticReport (test results)

4. **External Integration:**
   - Connect to external FHIR servers (Epic, Cerner)
   - Sync patient data bi-directionally
   - Implement OAuth2/SMART on FHIR

---

**For more info, see:** `PHASE_1_IMPLEMENTATION_SUMMARY.md`
