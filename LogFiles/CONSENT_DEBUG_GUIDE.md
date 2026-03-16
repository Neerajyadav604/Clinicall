# Debug Guide: Consent Requests Not Appearing

## What We've Added

### 1. Enhanced Logging in ConsentApi.js
- **POST /consent/request**: Now logs when consent request is created with patient_ref and doctor_ref details
- **GET /consent/requests**: Now logs queries and results, including cases where no results are found

### 2. Enhanced Logging in fhirApi.js (Frontend)
- Logs the patientId and other data being sent to the API

### 3. Debug Endpoints (in ConsentApi.js)
- **GET /api/v1/consent/debug/all** - Lists ALL consent requests in database
- **GET /api/v1/consent/debug/patient/:patientId** - Lists all requests for a specific patient

### 4. Test Script
- **test-consent-requests.js** - Run this to check database state

## Steps to Debug

### Step 1: Check Server Logs
When you send a consent request from a doctor account, look at the server console and check for:
1. `🔔 Consent Request - REQUEST HIT!` - Endpoint was called
2. `📋 Consent Request - Received:` - What data was received
3. `✅ ConsentRequest created successfully:` - If this appears, the request was saved
4. `❌ ConsentRequest ERROR:` - If there's an error

### Step 2: Run Test Script
```bash
cd "Clinicall Backend"
node test-consent-requests.js
```

This will show:
- Total number of ConsentRequests in database
- All pending requests
- Details of each request (doctor, patient, status)

### Step 3: Use Debug Endpoints

**Check all consent requests:**
```
GET http://localhost:5000/api/v1/consent/debug/all
```

**Check requests for a specific patient (replace PATIENT_ID):**
```
GET http://localhost:5000/api/v1/consent/debug/patient/PATIENT_ID
```

Copy the patient ID from their profile URL: `/my-profile` or from the MongoDB database.

## Common Issues to Check

1. **PatientId is null/undefined**
   - Check browser console in frontend when doctor requests consent
   - The `patientId` should come from the URL: `/doctor/clinical-notes/:patientId`

2. **ConsentRequest not saved to database**
   - Look for `✅ ConsentRequest created successfully:` in server logs
   - If missing, the POST endpoint failed silently

3. **Patient_ref mismatch** 
   - The patient_ref field must match the patientId being queried
   - Check the debug endpoints to see what patient_ref values are stored

4. **Status is not 'pending'**
   - The query looks for `status: 'pending'`
   - Check debug endpoint output to see actual status values

## Next Steps

1. First, run the test script to see what's in the database
2. Send a test consent request and check the server logs
3. Use the debug endpoint to see updated results
4. Share the test script output and server logs for further investigation
