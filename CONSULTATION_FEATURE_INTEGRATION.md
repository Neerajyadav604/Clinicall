# Live Consultation Session Feature - Integration Guide

Complete integration steps for adding the Live Consultation Session feature to your Clinicall project.

---

## STEP 1: Install Dependencies

### Backend
No new dependencies required (already using Express, Mongoose, Socket.IO)

### Frontend
```bash
cd frontend
npm install jspdf
```

---

## STEP 2: Update Server Routes (server/index.js)

### Add consul1tation routes import at the top with other routes:

Find this section (around line where other routes are imported):
```javascript
const Auth = require("./routes/Auth");
const Doctor = require("./routes/Doctor");
// ... other imports
```

Add this line:
```javascript
const consultationRoutes = require("./routes/consultation.routes");
```

### Add consultation routes to Express app:

Find this section (around line where routes are registered):
```javascript
app.use("/api/v1", Auth);
app.use("/api/v1", Doctor);
// ... other route registrations
```

Add this line:
```javascript
app.use("/api/v1", consultationRoutes);
```

---

## STEP 3: Add Socket Events (server/index.js)

### Add consultation socket event handlers:

Find the Socket.IO event handlers section (look for `socket.on("join_chat", ...)`).

Add these new event handlers after the existing socket events:

```javascript
// ============================================
// CONSULTATION SOCKET EVENTS
// ============================================

/**
 * Join consultation room
 * Allows user to receive real-time updates during consultation
 */
socket.on("join_consultation", ({ appointmentId }) => {
  const roomId = `consultation_${appointmentId}`;
  socket.join(roomId);
  console.log(`User ${socket.id} joined consultation room: ${roomId}`);
  
  // Notify others that someone joined
  socket.to(roomId).emit("user_in_consultation", {
    userId: socket.user._id,
    joinedAt: new Date(),
  });
});

/**
 * Leave consultation room
 */
socket.on("leave_consultation", ({ appointmentId }) => {
  const roomId = `consultation_${appointmentId}`;
  socket.leave(roomId);
  console.log(`User ${socket.id} left consultation room: ${roomId}`);
});
```

**Note:** The framework already emits these socket events from the controller:
- `consultation_started` - emitted when doctor starts session
- `consultation_ended` - emitted when doctor or patient ends session
- `new_record_added` - emitted when doctor adds a medical record

---

## STEP 4: Update Frontend Routing

### Add ConsultationPage to your React Router (usually in src/App.js or src/index.js)

Find your route definitions:
```javascript
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ConsultationPage from "./pages/ConsultationPage";
// ... other imports
```

Add this route in your Routes:
```javascript
<Route path="/consultation/:appointmentId" element={<ConsultationPage />} />
```

### Example Route Setup:
```javascript
<Routes>
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/consultation/:appointmentId" element={<ConsultationPage />} />
  {/* other routes */}
</Routes>
```

---

## STEP 5: (Optional) Create Directory Structure

If directory doesn't exist, create it:
```bash
mkdir -p frontend/src/components/consultation
```

---

## STEP 6: Test the Feature

### Backend Testing

1. **Start the server:**
   ```bash
   cd server
   nodemon server.js
   ```

2. **Test console logs:**
   - Look for: `[👨‍⚕️ CONSULTATION]` prefix in server logs

### Frontend Testing

1. **Start frontend:**
   ```bash
   cd frontend
   npm start
   ```

2. **Doctor Flow:**
   - Navigate to `/consultation/{appointmentId}`
   - Should see "Start Session" button
   - Click button to start consultation
   - Add prescriptions/labs/vitals in forms
   - Records should emit to patient in real-time
   - Click "End Session" to finish

3. **Patient Flow:**
   - Navigate to `/consultation/{appointmentId}`
   - Should see "Waiting for doctor..." message
   - Once doctor starts session, "Active Consultation" shows
   - Medical records appear as doctor adds them (live Socket.IO updates)
   - Can end session

---

## STEP 7: Verify Models Are Created

The following model files have been created:
- ✅ `server/models/ConsultationSession.js`
- ✅ `server/models/MedicalRecord.js`

No migration needed - Mongoose will create collections on first write.

---

## API ENDPOINTS REFERENCE

All endpoints require authentication (`Authorization: Bearer {token}`)

### Doctor Routes

```
POST   /api/v1/consultation/start/:appointmentId
  - Requires: authenticateUser + isDoctor
  - Starts a new consultation session

PUT    /api/v1/consultation/end/:sessionId
  - Requires: authenticateUser
  - Ends a consultation session (doctor or patient can end)

POST   /api/v1/consultation/record/:sessionId
  - Requires: authenticateUser + isDoctor
  - Adds prescription/lab/diagnosis/vitals to session
  - Body: { recordType, title, content, medication?, labTest?, vitals?, notes? }

GET    /api/v1/consultation/records/:sessionId
  - Requires: authenticateUser
  - Gets all records for a session
```

### Patient Routes

```
GET    /api/v1/consultation/history
  - Requires: authenticateUser
  - Gets all completed consultation sessions with records

GET    /api/v1/consultation/download/:recordId
  - Requires: authenticateUser
  - Gets record data for PDF generation

GET    /api/v1/consultation/active/:appointmentId
  - Requires: authenticateUser
  - Checks if session is currently active
```

---

## SOCKET EVENTS REFERENCE

### Client → Server

```javascript
// Join consultation room
socket.emit("join_consultation", { appointmentId })

// Leave consultation room
socket.emit("leave_consultation", { appointmentId })
```

### Server → Client (Listen for these)

```javascript
// When doctor starts session
socket.on("consultation_started", (data))
  // data: { sessionId, doctorId, startedAt, appointmentId }

// When doctor or patient ends session
socket.on("consultation_ended", (data))
  // data: { sessionId, endedAt, endedBy, duration }

// When doctor adds a medical record (real-time)
socket.on("new_record_added", (record))
  // record: { recordId, recordType, title, content, createdAt, ... }

// When user joins consultation
socket.on("user_in_consultation", (data))
  // data: { userId, joinedAt }
```

---

## FEATURES INCLUDED

✅ **Session Management**
- Doctor starts/ends consultation
- Patient can end session
- Auto-track session duration
- Lock session to authorized participants only

✅ **Medical Records**
- Prescriptions with dosage/frequency/instructions
- Lab reports with test results and reference ranges
- Vitals (temperature, BP, HR, O2 sat, weight, height)
- Diagnosis/notes with clinical observations

✅ **Real-Time Updates**
- Socket.IO live record delivery to patient
- Instant notification when new records added
- Live session status indicators

✅ **Patient History**
- View all past consultation sessions
- Expandable/collapsible session details
- All records grouped by session

✅ **PDF Download**
- Download individual records as PDF
- Pre-formatted with medical record styling
- Includes timestamp and doctor metadata

✅ **Role-Based Access**
- Doctor: Can start session, add records, end session
- Patient: Can view records live, view history, end session, download PDFs
- Middleware enforces all permissions

---

## TROUBLESHOOTING

### Issue: Socket events not emitting
**Solution:** Verify socket room name is exactly `consultation_${appointmentId}`

### Issue: Middleware error "Doctor profile not found"
**Solution:** Ensure doctor completed registration and has a Doctor profile

### Issue: Appointment doesn't exist or user not authorized
**Solution:** Verify appointmentId is valid and user is doctor or patient in that appointment

### Issue: Records not appearing live
**Solution:** 
1. Check browser console for Socket.IO errors
2. Verify token is valid in localStorage
3. Check server logs for socket auth errors

### Issue: PDF download not working
**Solution:** Ensure jsPDF is installed (`npm install jspdf`)

---

## FILE LOCATIONS SUMMARY

### Backend Files Created
- `server/models/ConsultationSession.js` - Session tracking
- `server/models/MedicalRecord.js` - Medical records storage
- `server/Controllers/consultationController.js` - Business logic
- `server/routes/consultation.routes.js` - API endpoints

### Frontend Files Created
- `frontend/src/pages/ConsultationPage.js` - Main page
- `frontend/src/components/consultation/DoctorConsultationPanel.js` - Doctor UI
- `frontend/src/components/consultation/PatientLiveView.js` - Patient live view
- `frontend/src/components/consultation/SessionHistory.js` - Past sessions
- `frontend/src/components/consultation/RecordCard.js` - Record display

### Modified Files (requires manual edits)
- `server/index.js` - Add routes & socket events
- Frontend Router Config (App.js or index.js) - Add route

---

## NEXT STEPS

1. ✅ Copy all created files to correct locations
2. ✅ Install jsPDF: `npm install jspdf` (frontend)
3. ✅ Update server/index.js with routes & socket events
4. ✅ Update frontend routing to include ConsultationPage
5. ✅ Test doctor → patient consultation flow
6. ✅ Test PDF generation
7. ✅ Verify socket.io real-time updates working

---

**Last Updated:** March 16, 2026
