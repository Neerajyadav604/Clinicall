# Live Consultation Feature - Complete Analysis

## Overview
The Clinicall Backend implements a **real-time live consultation system** that enables doctors and patients to interact during online appointments with instant message delivery, real-time medical record creation, and live updates using WebSocket technology.

---

## 1. REAL-TIME COMMUNICATION TECHNOLOGY

### Socket.IO Implementation
- **Technology**: Socket.IO (WebSockets with fallback to long-polling)
- **Server**: `server/index.js` (lines 59-80)
- **Configuration**:
  ```javascript
  const io = socketIo(server, {
    cors: {
      origin: clientUrl,
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],  // Fallback to polling if WebSocket unavailable
    allowEIO3: true,
  });
  ```

### Authentication & Authorization
- **Socket Middleware**: `server/index.js` (lines 680-715)
- **Flow**:
  1. Client passes JWT token in Socket handshake (`auth.token`)
  2. Server verifies token using `verifyAccessToken()`
  3. Validates user exists in database
  4. Checks if user is participant in appointment (doctor or patient)
  5. Attaches `socket.user` and `socket.appointmentId` for use in event handlers

---

## 2. MAIN FILES & COMPONENTS

### Backend Files

#### Routes & Controllers
| File | Purpose |
|------|---------|
| `server/routes/consultation.routes.js` | Defines all consultation REST API endpoints |
| `server/Controllers/consultationController.js` | Implements all consultation business logic |

#### Models
| File | Purpose |
|------|---------|
| `server/models/ConsultationSession.js` | Stores active consultation session state |
| `server/models/MedicalRecord.js` | Stores medical records created during consultation |
| `server/models/Appointment.js` | Extended with consultation-related fields |
| `server/models/ChatMessage.js` | Stores chat messages between doctor and patient |

#### Socket.IO Event Handlers (server/index.js)
- **Chat Events**: `join_chat`, `send_message`, `typing`, `read`
- **Consultation Events**: `join_consultation`, `leave_consultation`
- **Consent Events**: `requestConsent`
- **Notification Events**: `joinRoom` (user-specific notifications)

### Frontend Files

#### Pages
| File | Purpose |
|------|---------|
| `frontend/src/pages/ConsultationPage.js` | Main consultation page - router and role detection |
| `frontend/src/pages/Chat.jsx` | Real-time chat interface for doctor-patient messaging |
| `frontend/src/pages/MyRequests.jsx` | Patient appointment tracker with consultation mode selection |

#### Components
| File | Purpose |
|------|---------|
| `frontend/src/components/consultation/DoctorConsultationPanel.js` | Doctor's workspace to start session, add medical records |
| `frontend/src/components/consultation/PatientLiveView.js` | Patient's real-time view of medical records added by doctor |
| `frontend/src/components/consultation/RecordCard.js` | Individual medical record display component |
| `frontend/src/components/chat/ChatWidget.jsx` | Floating AI chat widget |

#### Services & Utilities
| File | Purpose |
|------|---------|
| `frontend/src/services/operations/consultationApi.js` | API client for consultation endpoints |
| `frontend/src/utils/socket.js` | Socket.IO client initialization |
| `frontend/src/utils/socketManager.js` | Global socket connection lifecycle management |
| `frontend/src/App.js` | Global socket.io connection setup |

---

## 3. LIVE CONSULTATION FLOW

### 3.1 Pre-Consultation Setup

#### Step 1: Patient Books Appointment
1. Patient searches for doctors and requests appointment
2. Doctor approves appointment request
3. Patient chooses consultation mode: **Online** or **Offline**

#### Step 2: Online Consultation Payment
1. Patient clicks "Pay for Online Consultation"
2. Razorpay payment gateway initiated via `initiatePayment()`
3. User completes payment
4. Backend verifies payment via `verifyPayment()`
5. Appointment status updated: `consultationStatus = "active"`
6. Field `isChatEnabled = true` set for appointment

### 3.2 Live Consultation Session

#### Step 1: Doctor Initiates Session
```
Route: POST /api/v1/consultation/start/:appointmentId
Middleware: authenticateUser, isDoctor
```

**What happens:**
1. Doctor clicks "Start Session" button on ConsultationPage
2. Backend creates a `ConsultationSession` document
3. Appointment status updated to `consultationStatus = "active"`
4. Socket.IO emits `consultation_started` event to patient's room

**Output:**
```json
{
  "sessionId": "...",
  "appointmentId": "...",
  "doctorId": "...",
  "status": "active",
  "startedAt": "2024-03-16T10:00:00Z"
}
```

#### Step 2: Doctor & Patient Join Consultation Room
1. **Doctor** calls: `socket.emit("join_consultation", { appointmentId })`
2. **Patient** calls: `socket.emit("join_consultation", { appointmentId })`
3. Both join room: `consultation_{appointmentId}`
4. Server notifies room: `socket.to(roomId).emit("user_in_consultation", { userId, joinedAt })`

#### Step 3: Doctor Adds Medical Records During Session
```
Route: POST /api/v1/consultation/record/:sessionId
Middleware: authenticateUser, isDoctor
```

**Doctor submits form with:**
- `recordType`: "prescription" | "lab_report" | "diagnosis" | "vitals"
- `title`: Record title
- `content`: General content
- `medication`: (for prescriptions) { name, dosage, frequency, duration, instructions }
- `labTest`: (for labs) { testName, result, unit, referenceRange, status }
- `vitals`: (for vitals) { temperature, bloodPressure, heartRate, ... }
- `notes`: Optional notes

**Backend creates `MedicalRecord`:**
```javascript
const record = await MedicalRecord.create({
  sessionId,
  appointmentId,
  doctorId,
  userId,
  recordType,
  title,
  content,
  medication,
  labTest,
  vitals,
  notes
});
```

**Real-time Socket broadcast:**
```javascript
socket.emit("new_record_added", {
  id: record._id,
  recordType,
  title,
  content,
  medication,
  labTest,
  vitals,
  createdAt: record.createdAt
});
```

**Patient's side:**
- Listens to `new_record_added` event
- Automatically adds record to list without page refresh
- Records appear instantly in real-time

#### Step 4: Real-Time Chat During Consultation
1. Doctor initiates chat: `socket.emit("join_chat", { appointmentId })`
2. Patient joins: `socket.emit("join_chat", { appointmentId })`
3. Both join room: `chat_{appointmentId}`
4. Messages sent: `socket.emit("send_message", { appointmentId, message, senderRole, fileUrl })`
5. Server broadcasts: `io.to(roomId).emit("receive_message", messageData)`

**Message flow:**
```
Doctor types → send_message event → Server saves to ChatMessage DB 
→ Server broadcasts receive_message → Patient receives instantly
```

**Features:**
- ✅ File upload support (documents, images)
- ✅ Typing indicators
- ✅ Read receipts
- ✅ Message history on join
- ✅ File size limit: 10MB

#### Step 5: Session Ends
```
Route: PUT /api/v1/consultation/end/:sessionId
Middleware: authenticateUser
```

**Either doctor or patient can end:**
```javascript
const session = await ConsultationSession.findByIdAndUpdate(sessionId, {
  status: "completed",
  endedAt: new Date(),
  endedBy: userRole,
  duration: Math.floor((now - startedAt) / 1000)
});
```

**Socket broadcasts:**
```javascript
io.to(`consultation_${appointmentId}`).emit("consultation_ended", {
  sessionId,
  endedBy: userRole,
  endedAt: new Date()
});
```

---

## 4. USER ROLES & PERMISSIONS

### Doctor Role
| Action | Endpoint | Requirement |
|--------|----------|-------------|
| Start session | `POST /api/v1/consultation/start/:appointmentId` | `authenticateUser` + `isDoctor` |
| Add medical record | `POST /api/v1/consultation/record/:sessionId` | `authenticateUser` + `isDoctor` |
| End session | `PUT /api/v1/consultation/end/:sessionId` | `authenticateUser` (any user) |
| View records | `GET /api/v1/consultation/records/:sessionId` | `authenticateUser` |
| Send chat messages | Socket: `send_message` | Appointment participant + authenticated |

### Patient Role
| Action | Endpoint | Requirement |
|--------|----------|-------------|
| Request online consultation | UI flow | Appointment created + payment verified |
| View live records | `GET /api/v1/consultation/records/:sessionId` | `authenticateUser` + appointment participant |
| End session | `PUT /api/v1/consultation/end/:sessionId` | `authenticateUser` (any user) |
| Send chat messages | Socket: `send_message` | Appointment participant + authenticated |
| Download records | `GET /api/v1/consultation/download/:recordId` | `authenticateUser` |

### Admin Role
- Can view all consultations (audit)
- Can generate reports
- Can manage hospital-wide consultation settings

---

## 5. DATA MODELS

### ConsultationSession Schema
```javascript
{
  appointmentId: ObjectId,          // Reference to appointment
  doctorId: ObjectId,               // Doctor conducting session
  userId: ObjectId,                 // Patient
  status: "active" | "completed",   // Session state
  startedAt: Date,                  // When session started
  endedAt: Date,                    // When session ended (null if active)
  endedBy: "doctor" | "patient",    // Who ended the session
  duration: Number,                 // Duration in seconds
  notes: String,                    // Session notes
  timestamps: true                  // createdAt, updatedAt
}
```

### MedicalRecord Schema
```javascript
{
  sessionId: ObjectId,              // Reference to consultation session
  appointmentId: ObjectId,          // Reference to appointment
  doctorId: ObjectId,               // Doctor who created record
  userId: ObjectId,                 // Patient
  recordType: "prescription" | "lab_report" | "diagnosis" | "vitals",
  title: String,                    // Record title
  content: String,                  // General content
  
  // For prescriptions
  medication: {
    name: String,
    dosage: String,
    frequency: String,
    duration: String,
    instructions: String
  },
  
  // For lab reports
  labTest: {
    testName: String,
    result: String,
    unit: String,
    referenceRange: String,
    status: "normal" | "abnormal" | "critical"
  },
  
  // For vitals
  vitals: {
    temperature: String,
    bloodPressure: String,
    heartRate: String,
    respiratoryRate: String,
    oxygenSaturation: String,
    weight: String,
    height: String
  },
  
  notes: String,                    // Diagnosis notes
  attachmentUrl: String,            // File attachment
  timestamps: true
}
```

### ChatMessage Schema
```javascript
{
  conversationId: ObjectId,         // Appointment ID
  from: ObjectId,                   // Sender user ID
  to: ObjectId | null,              // Recipient (null = broadcast to room)
  text: String,                     // Message content
  fileUrl: String,                  // Attached file URL
  read: Boolean,                    // Read status
  timestamps: true
}
```

---

## 6. API ENDPOINTS

### Consultation Endpoints

#### Start Consultation Session
```
POST /api/v1/consultation/start/:appointmentId
Auth: authenticateUser, isDoctor
Response:
{
  success: true,
  data: {
    sessionId: "...",
    appointmentId: "...",
    doctorId: "...",
    status: "active",
    startedAt: "..."
  }
}
```

#### Add Medical Record
```
POST /api/v1/consultation/record/:sessionId
Auth: authenticateUser, isDoctor
Body: {
  recordType: "prescription" | "lab_report" | "diagnosis" | "vitals",
  title: "...",
  content: "...",
  medication?: { ... },
  labTest?: { ... },
  vitals?: { ... },
  notes?: "..."
}
```

#### Get Session Records
```
GET /api/v1/consultation/records/:sessionId
Auth: authenticateUser
Response: {
  success: true,
  data: {
    records: [ ... ]
  }
}
```

#### End Consultation Session
```
PUT /api/v1/consultation/end/:sessionId
Auth: authenticateUser
Response: {
  success: true,
  data: {
    sessionId: "...",
    status: "completed",
    duration: 1200
  }
}
```

#### Get Active Session
```
GET /api/v1/consultation/active/:appointmentId
Auth: authenticateUser
Response: {
  success: true,
  data: {
    isActive: true,
    sessionId: "...",
    startedAt: "..."
  }
}
```

#### Get Consultation History
```
GET /api/v1/consultation/history
Auth: authenticateUser
Response: {
  success: true,
  data: {
    sessions: [ ... ]
  }
}
```

#### Download Record
```
GET /api/v1/consultation/download/:recordId
Auth: authenticateUser
Response: PDF binary data
```

---

## 7. SOCKET.IO EVENTS

### Chat Events

#### Client → Server
```javascript
socket.emit("join_chat", { appointmentId })
socket.emit("send_message", { appointmentId, message, senderRole, fileUrl })
socket.emit("typing", { appointmentId })
socket.emit("read", { appointmentId })
```

#### Server → Client (Broadcast)
```javascript
socket.emit("chat_history", messages)                    // On join
socket.to(roomId).emit("user_joined", { message, timestamp })
socket.to(roomId).emit("receive_message", { id, senderId, senderRole, message, fileUrl, timestamp })
socket.to(roomId).emit("typing", { from })
socket.to(roomId).emit("read", { appointmentId, reader })
```

### Consultation Events

#### Client → Server
```javascript
socket.emit("join_consultation", { appointmentId })
socket.emit("leave_consultation", { appointmentId })
```

#### Server → Client
```javascript
socket.to(roomId).emit("user_in_consultation", { userId, joinedAt })
socket.to(roomId).emit("new_record_added", { id, recordType, title, ... })
socket.to(roomId).emit("consultation_started", { sessionId, doctorId, startedAt })
socket.to(roomId).emit("consultation_ended", { sessionId, endedBy, endedAt })
```

### Notification Events

#### Client → Server
```javascript
socket.emit("joinRoom", userId)                         // Join user-specific notification room
```

#### Server → Client
```javascript
socket.to(userId).emit("consentRequestReceived", { requestId, doctorId, ... })
```

---

## 8. INTEGRATION FLOW DIAGRAM

```
PATIENT SIDE                    SERVER                      DOCTOR SIDE
================================================================================

1. Book Appointment
   └─→ Request                 Appointment Created
                                      ↓
2. Choose ONLINE Mode
   └─→ Set consultationMode   appointment.consultationMode = "online"
                                      ↓
3. Pay (Razorpay)
   └─→ verifyPayment          ✓ Payment verified
                                      ↓
4. Navigate to /consultation  consultationStatus = "active"
   └─→ Waiting for doctor      isChatEnabled = true
                                      ↓
                          DOCTOR INITIATES
                                      ↓
                              POST /api/v1/consultation/start
                                      ↓
                          ConsultationSession created
                                      ↓
                          Socket.IO "consultation_started"
                                      ↓
5. Join room       ←─────── join_consultation event ─────→ Join room
   socket.emit      consultation_{appointmentId}           socket.emit
                                      ↓
6. Listen:                   DOCTOR ADDS RECORDS              Add form
   new_record_added      POST /api/v1/consultation/record
   ↓                                   ↓
   Instant update        MedicalRecord created
   (no page reload!)              ↓
                        Socket.IO "new_record_added"
                                      ↓
7. Also chat via         Chat runs on same socket
   send_message          join_chat room: chat_{appointmentId}
8. End Session            PUT /api/v1/consultation/end
                                      ↓
                        Socket.IO "consultation_ended"
                                      ↓
9. View records           GET /api/v1/consultation/records
   (persisted in DB)      All records saved for future reference
```

---

## 9. KEY FEATURES

### Real-Time Updates
- ✅ Medical records appear instantly (no page refresh needed)
- ✅ Socket.IO WebSocket with fallback to long-polling
- ✅ Sub-second latency for message/record delivery

### Chat Functionality
- ✅ Real-time text messaging
- ✅ File upload (10MB limit)
- ✅ Image preview in chat
- ✅ File download support
- ✅ Typing indicators
- ✅ Read receipts
- ✅ Message history on join

### Medical Records
- ✅ Multiple record types: Prescriptions, Labs, Vitals, Diagnoses
- ✅ Structured data for each type
- ✅ PDF download for records
- ✅ Session-based organization
- ✅ Persistent storage in MongoDB

### Security & Access Control
- ✅ JWT token-based authentication
- ✅ Socket.IO handshake verification
- ✅ Participant validation (doctor/patient only)
- ✅ Role-based access (doctors add records, patients view)
- ✅ PHI sanitization middleware
- ✅ Audit logging for all actions

### Payment Integration
- ✅ Razorpay integration for online consultations
- ✅ Payment verification before enabling chat
- ✅ Offline consultation option available

---

## 10. TECHNICAL STACK

| Layer | Technology |
|-------|-----------|
| **Real-time Communication** | Socket.IO (WebSocket + Long Polling) |
| **Backend Framework** | Node.js + Express.js |
| **Database** | MongoDB + Mongoose |
| **Frontend Framework** | React.js |
| **Socket Client** | socket.io-client |
| **HTTP Client** | Axios |
| **Authentication** | JWT (JSON Web Tokens) |
| **File Upload** | Cloudinary + express-fileupload |
| **Payment Gateway** | Razorpay |
| **Security** | Helmet, XSS-clean, Mongo-sanitize |

---

## 11. DEPLOYMENT & ENVIRONMENT

### Required Environment Variables
```env
# Backend
PORT=4000
CLIENT_URL=http://localhost:3000
DATABASE_URL=mongodb://...
JWT_SECRET=...
CLOUDINARY_KEY=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...

# Frontend
REACT_APP_API_BASE_URL=http://localhost:4000
REACT_APP_SOCKET_URL=http://localhost:4000
```

### Socket.IO Transport Fallback
- **Primary**: WebSocket (lowest latency)
- **Fallback**: Long Polling (for restricted networks)
- **Auto-reconnection**: Up to 5 attempts with exponential backoff

---

## 12. TESTING THE FEATURE

### Start the Servers
```bash
# Backend
cd server
nodemon server.js

# Frontend
cd frontend
npm start
```

### Test Flow
1. **Register Doctor** account
2. **Register Patient** account
3. **Patient** searches and books appointment with doctor
4. **Doctor** approves appointment
5. **Patient** chooses "Online Consultation", completes payment
6. **Doctor** navigates to `/consultation/{appointmentId}`
7. **Doctor** clicks "Start Session"
8. **Patient** sees "Active Consultation" appears
9. **Doctor** adds prescription/labs/vitals
10. **Patient** sees records appear in real-time
11. Both can chat simultaneously
12. **Doctor** ends session

### Console Logs (Verify Real-Time)
```
Server: [👨‍⚕️ CONSULTATION SOCKET] User joined consultation room: consultation_...
Frontend: 📡 [Chat] Registering socket listeners
Frontend: New record received: { recordType: "prescription", ... }
```

---

## 13. KNOWN LIMITATIONS & FUTURE IMPROVEMENTS

### Current Limitations
- Single-file downloads (no batch export)
- No video/audio call (chat-only)
- No screen sharing
- Records not integrated with FHIR yet
- No consultation scheduling reminders

### Future Improvements
- [ ] WebRTC for video/audio calls
- [ ] Screen sharing for remote diagnosis
- [ ] FHIR integration for medical records
- [ ] Consultation scheduling & reminders
- [ ] Batch PDF export of all records
- [ ] Session recording (with consent)
- [ ] Multi-party consultations (referrals)
- [ ] Timeline view of session events
- [ ] Prescription refill requests

---

## 14. TROUBLESHOOTING

### Socket Connection Issues
**Problem**: "Socket not connected" error
**Solution**:
1. Check `App.js` socket initialization runs on login
2. Verify token is valid and not expired
3. Check server logs for auth errors
4. Ensure CORS origin in `server/index.js` matches client URL

### Records Not Appearing
**Problem**: Patient doesn't see records added by doctor
**Solution**:
1. Verify both are in same consultation room
2. Check `join_consultation` event fired on both sides
3. Verify session is "active" (check activeSession state)
4. Check server logs for `new_record_added` broadcast

### Payment Issues
**Problem**: Chat locked after payment completion
**Solution**:
1. Check `appointmentId` in URL matches payment
2. Verify `isChatEnabled` set to true in Appointment model
3. Check Payment verification response
4. Clear browser cache and retry

---

## Summary

The Clinicall live consultation feature is a **production-ready, real-time system** that:
- Uses **Socket.IO** for instant, bidirectional communication
- Provides **role-based access** (doctor/patient)
- **Persists data** in MongoDB for records & history
- **Integrates payments** (Razorpay) for online consultations
- **Includes chat** for synchronous communication
- **Handles security** with JWT tokens and sanitization
- **Scales** with socket room-based architecture
