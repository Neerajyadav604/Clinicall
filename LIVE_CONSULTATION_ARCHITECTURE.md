# Live Consultation Architecture Diagrams

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CLINICALL LIVE CONSULTATION                         │
└─────────────────────────────────────────────────────────────────────────────┘

                              FRONTEND (React.js)
        ┌──────────────────────────────────────────────────────────┐
        │                                                            │
        │  ┌─────────────────────────────────────────────────────┐ │
        │  │  ConsultationPage.js                                │ │
        │  │  - Route: /consultation/:appointmentId             │ │
        │  │  - Detects user role (doctor/patient)             │ │
        │  │  - Renders role-specific component                │ │
        │  └─────┬───────────────────────────────────────────────┘ │
        │        │                                                   │
        │  ┌─────▼─────────────────┐  ┌──────────────────────────┐ │
        │  │ DoctorConsultation    │  │ PatientLiveView          │ │
        │  │ Panel.js              │  │                          │ │
        │  │                       │  │ - Listen to socket       │ │
        │  │ - Start/end session   │  │ - Display real-time      │ │
        │  │ - Add medical records │  │   records               │ │
        │  │ - Control & monitoring│  │ - End session option    │ │
        │  └─────┬─────────────────┘  └──────────┬───────────────┘ │
        │        │                               │                 │
        │        └──────────────┬──────────────────┘                │
        │                       │                                    │
        │  ┌────────────────────▼─────────────────────────────────┐ │
        │  │  Chat.jsx (Real-time Messaging)                      │ │
        │  │  - Send/receive messages                             │ │
        │  │  - File upload support                               │ │
        │  │  - Typing indicators                                 │ │
        │  └────────────────────┬─────────────────────────────────┘ │
        │                       │                                    │
        │  ┌────────────────────▼─────────────────────────────────┐ │
        │  │  Socket Manager (socketManager.js)                   │ │
        │  │  - Global socket connection lifecycle                │ │
        │  │  - Single connection per app                         │ │
        │  │  - Auto-reconnect logic                              │ │
        │  └────────────────────┬─────────────────────────────────┘ │
        │                       │                                    │
        └───────────────────────┼────────────────────────────────────┘
                                │
                    ┌───────────▼──────────┐
                    │   Socket.IO Client   │
                    │ (/socket.io/socket.  │
                    │  io.min.js)          │
                    │                      │
                    │ WebSocket + Polling  │
                    └───────────┬──────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
          ┌─────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐
          │ WebSocket  │ │ Long Polling│ │ Reconnect │
          │ (Primary)  │ │ (Fallback)  │ │ Handler   │
          └─────┬──────┘ └─────┬──────┘ └─────┬──────┘
                │              │              │
                └──────────────┬──────────────┘
                               │
                ┌──────────────▼──────────────┐
                │                             │
                │  HTTP/TCP Network Layer     │
                │  (localhost:4000 or prod)   │
                │                             │
                └──────────────┬──────────────┘
                               │
        ┌──────────────────────▼───────────────────────┐
        │                                               │
        │            BACKEND (Node.js + Express)       │
        │                                               │
        │  ┌─────────────────────────────────────────┐ │
        │  │  Socket.IO Server (server/index.js)     │ │
        │  │  - Auth middleware (JWT verification)   │ │
        │  │  - Room management                      │ │
        │  │  - Event handlers                       │ │
        │  └─────┬──────────────────────┬────────────┘ │
        │        │                      │              │
        │  ┌─────▼────────┐  ┌──────────▼──────────┐   │
        │  │ Chat Events  │  │ Consultation Events │   │
        │  │              │  │                     │   │
        │  │ - send_msg   │  │ - join_consultation │   │
        │  │ - typing     │  │ - leave_consultation│   │
        │  │ - read       │  │ - user_in_consult..│   │
        │  │ - join_chat  │  │ - new_record_added │   │
        │  └──────┬───────┘  └────────┬─────────────┘   │
        │         │                   │                 │
        │  ┌──────▼──────▼────────────▼──────────────┐  │
        │  │ REST API Endpoints                     │  │
        │  │ (server/routes/consultation.routes.js) │  │
        │  │                                        │  │
        │  │ POST   /consultation/start/:apptId    │  │
        │  │ PUT    /consultation/end/:sessionId   │  │
        │  │ POST   /consultation/record/:sesId    │  │
        │  │ GET    /consultation/records/:sesId   │  │
        │  │ GET    /consultation/active/:apptId   │  │
        │  │ GET    /consultation/history          │  │
        │  │ GET    /consultation/download/:recId  │  │
        │  └──────┬──────────────────────────────────┘  │
        │         │                                     │
        │  ┌──────▼──────────────────────────────────┐  │
        │  │ Controllers                            │  │
        │  │ (consultationController.js)            │  │
        │  │                                        │  │
        │  │ - startSession()                      │  │
        │  │ - endSession()                        │  │
        │  │ - addMedicalRecord()                  │  │
        │  │ - getSessionRecords()                 │  │
        │  │ - downloadRecord()                    │  │
        │  └──────┬──────────────────────────────────┘  │
        │         │                                     │
        │  ┌──────▼──────────────────────────────────┐  │
        │  │ MongoDB Collections                    │  │
        │  │                                        │  │
        │  │ - ConsultationSession                 │  │
        │  │ - MedicalRecord                       │  │
        │  │ - ChatMessage                         │  │
        │  │ - Appointment (extended)              │  │
        │  └──────────────────────────────────────────┘  │
        │                                                │
        └────────────────────────────────────────────────┘
```

---

## 2. Consultation Session Lifecycle

```
                    CONSULTATION SESSION LIFECYCLE
                    
PHASE 1: APPOINTMENT BOOKING & PREPARATION
┌─────────────────────────────────────────────────────┐
│ Patient searches for doctor                         │
│ Patient books appointment                           │
│ Doctor approves appointment                         │
│ Status: PENDING, consultationMode: unset           │
└────────────────────┬────────────────────────────────┘
                     │
PHASE 2: CONSULTATION MODE SELECTION
┌────────────────────▼────────────────────────────────┐
│ Patient views appointment in MyRequests             │
│ Patient clicks:                                     │
│   - "Visit Clinic" (offline) → Done               │
│   - "Start Live Consultation" (online)            │
│ consultationMode = "online"                        │
└────────────────────┬────────────────────────────────┘
                     │
PHASE 3: PAYMENT (FOR ONLINE ONLY)
┌────────────────────▼────────────────────────────────┐
│ Patient clicks "Pay for Online Consultation"       │
│ Razorpay payment modal opens                       │
│ Patient completes payment                          │
│ Backend: /verifyPayment                            │
│ Update:                                            │
│   - paymentStatus = "paid"                        │
│   - consultationStatus = "active"                 │
│   - isChatEnabled = true                          │
└────────────────────┬────────────────────────────────┘
                     │
PHASE 4: WAIT FOR DOCTOR (REAL-TIME)
┌────────────────────▼────────────────────────────────┐
│ Patient navigates to:                              │
│ /consultation/{appointmentId}                      │
│ Frontend detects PATIENT role                      │
│ Shows: "Waiting for doctor to start session..."   │
│ PatientLiveView listening to socket events         │
│ Status: waiting                                    │
└────────────────────┬────────────────────────────────┘
                     │
PHASE 5: DOCTOR INITIATES SESSION
┌────────────────────▼────────────────────────────────┐
│ Doctor navigates to:                               │
│ /consultation/{appointmentId}                      │
│ Frontend detects DOCTOR role                       │
│ Shows DoctorConsultationPanel                      │
│ Doctor clicks "Start Session"                      │
│                                                     │
│ Backend:                                            │
│ POST /api/v1/consultation/start/:appointmentId    │
│   → Create ConsultationSession document            │
│   → Set session.status = "active"                 │
│   → Set appointment.consultationStatus = "active"  │
│   → Emit: "consultation_started" via Socket       │
│                                                     │
│ Session created with:                              │
│   - sessionId (unique ID)                          │
│   - appointmentId                                  │
│   - doctorId                                       │
│   - userId (patient)                               │
│   - startedAt (timestamp)                          │
│   - status: "active"                               │
└────────────────────┬────────────────────────────────┘
                     │
PHASE 6: BOTH USER JOIN CONSULTATION ROOM (SOCKET)
┌────────────────────▼────────────────────────────────┐
│ Doctor:                                             │
│   socket.emit("join_consultation", {                │
│     appointmentId: "..."                            │
│   })                                                │
│                                                     │
│ Patient (receives "consultation_started"):         │
│   socket.emit("join_consultation", {                │
│     appointmentId: "..."                            │
│   })                                                │
│                                                     │
│ Both join room: consultation_{appointmentId}      │
│                                                     │
│ Server emits: "user_in_consultation"               │
│   → Both receive notification of other joining     │
└────────────────────┬────────────────────────────────┘
                     │
PHASE 7: ACTIVE CONSULTATION (REAL-TIME UPDATES)
┌────────────────────▼────────────────────────────────┐
│ PARALLEL HAPPENING:                                │
│                                                     │
│ 1. MEDICAL RECORDS (Doctor Creates)                │
│    Doctor submits: Prescription | Lab | Vitals    │
│    POST /api/v1/consultation/record/:sessionId    │
│      → Backend creates MedicalRecord                │
│      → Socket emits: "new_record_added"            │
│      → Patient receives INSTANTLY                  │
│                                                     │
│ 2. CHAT MESSAGES (Both Participate)                │
│    Either sends: socket.emit("send_message")      │
│      → Backend saves ChatMessage                    │
│      → Socket broadcasts: "receive_message"        │
│      → Other receives INSTANTLY                    │
│                                                     │
│ 3. CHAT FILES (Both Can Share)                     │
│    Upload file → Cloudinary → Get URL             │
│    Send as message with fileUrl                    │
│                                                     │
│ Session running: Real-time duration counter       │
│ Status: "active"                                   │
└────────────────────┬────────────────────────────────┘
                     │
PHASE 8: SESSION ENDS
┌────────────────────▼────────────────────────────────┐
│ Either doctor or patient:                          │
│ Clicks "End Session"                               │
│                                                     │
│ Backend:                                            │
│ PUT /api/v1/consultation/end/:sessionId            │
│   → Update ConsultationSession:                    │
│       - status = "completed"                       │
│       - endedAt = now                              │
│       - endedBy = "doctor" or "patient"           │
│       - duration = (endedAt - startedAt) / 1000   │
│   → Emit: "consultation_ended" via Socket         │
│                                                     │
│ Frontend:                                           │
│   → Both receive end notification                  │
│   → Redirect to /my-requests (patient)            │
│   → Redirect to /doctor/appointments (doctor)     │
└────────────────────┬────────────────────────────────┘
                     │
PHASE 9: POST-CONSULTATION
┌────────────────────▼────────────────────────────────┐
│ All records persisted in MongoDB                   │
│ Patient can:                                        │
│   - View entire consultation history               │
│   - Download individual records as PDF             │
│   - Batch export all records                       │
│                                                     │
│ Doctor can:                                        │
│   - View consultation analytics                    │
│   - Export records for medical audit               │
│   - Mark consultation complete                     │
│                                                     │
│ Status: "completed"                                │
└─────────────────────────────────────────────────────┘
```

---

## 3. Real-Time Data Flow During Active Session

```
                REAL-TIME DATA FLOW (SOCKET.IO)
                
SCENARIO: Doctor adds a prescription while patient is waiting

DOCTOR SIDE (Frontend)                 SERVER                 PATIENT SIDE (Frontend)
═════════════════════════════════════════════════════════════════════════════════

1. Doctor fills form:
   - Record Type: "prescription"       
   - Medication: {                     
       name: "Aspirin",
       dosage: "500mg",
       frequency: "2x daily",
       duration: "7 days",
       instructions: "Take with meal"
     }
   - Title: "Aspirin for Headache"
   - Content: "Standard OTC pain relief"
   
2. Clicks "Add Record"                 
                                       
   HTTP POST                           
   /api/v1/consultation/record        
   /{sessionId}                        
        │                             
        ├──────────────────────────────►  Backend Receives
                                          Request Handler:
                                          addMedicalRecord()
                                          
                                          1. Validates:
                                             - sessionId exists
                                             - User is doctor
                                             - Session is active
                                             
                                          2. Creates document:
                                             MedicalRecord {
                                               sessionId: "...",
                                               recordType: "prescription",
                                               title: "Aspirin for Headache",
                                               medication: {
                                                 name: "Aspirin",
                                                 dosage: "500mg",
                                                 frequency: "2x daily",
                                                 duration: "7 days",
                                                 instructions: "..."
                                               },
                                               createdAt: now
                                             }
                                             
                                          3. Broadcasts via Socket.IO
        Frontend receives                 io.to(
        HTTP 201 (Created)                  "consultation_{appointmentId}"
        Response:                          ).emit(
        {                                    "new_record_added",
          success: true,                     {
          data: {                              id: record._id,
            recordId: "...",                   recordType: "prescription",
            createdAt: now                     title: "Aspirin for Headache",
          }                                    medication: {...},
        }                                      createdAt: now
                                            }
        ▼                                )                           ◄── Backend Emits
   Update local UI:                                                     via Socket.IO
   - Show success message
   - Add to records list
   - Clear form                                                    4. Patient's socket
   - Hide form (optional)                                            listens:
        │                                                          socket.on(
        │                                                            "new_record_added",
        │                                                            (record) => {
        │                                                              setRecords(prev =>
        │                                                                [record, ...prev]
        │                                                              )
        │                                                            }
        │                                                          )
        │                                                            │
        │                                                            ▼
        │                                                         Frontend receives
        │                                                         INSTANTLY (< 100ms
        │                                                         typical)
        │                                                         
        │                                                         Record appears:
        │                                                         ┌─────────────────┐
        │                                                         │ Aspirin for     │
        │                                                         │ Headache        │
        │                                                         │                 │
        │                                                         │ 500mg, 2x daily │
        │                                                         │ 7 days          │
        │                                                         │ Take with meal  │
        │                                                         └─────────────────┘
        │                                                         
        │                                                         NO PAGE REFRESH
        │                                                         NO POLLING
        │                                                         INSTANT UPDATE!
        │
        └── Both doctors & patients working in sync via WebSocket
```

---

## 4. Socket.IO Room Architecture

```
                    SOCKET.IO ROOM ARCHITECTURE
                    
CONNECTION LAYER
┌──────────────────────────────────────────────────────┐
│ Each client connects with:                           │
│ - token (JWT for auth)                              │
│ - appointmentId (optional)                           │
│                                                      │
│ io.use(async (socket, next) => {                    │
│   verify token + user + appointment participation   │
│   socket.user = user                                │
│   socket.appointmentId = appointmentId              │
│ })                                                   │
└──────────────────────────────────────────────────────┘

ROOM ARCHITECTURE
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  APPOINTMENT #1 (e.g., "507f1f77bcf86cd799439011")            │
│  ├─ Consultation Room: consultation_507f1f77bcf86cd799439011  │
│  │   └─ Users: [doctor@hospital.com, patient@email.com]       │
│  │     └─ Events: join_consultation, new_record_added, ...    │
│  │                                                              │
│  └─ Chat Room: chat_507f1f77bcf86cd799439011                  │
│      └─ Users: [doctor@hospital.com, patient@email.com]       │
│        └─ Events: send_message, typing, read, ...             │
│                                                                  │
│  APPOINTMENT #2 (e.g., "507f1f77bcf86cd799439012")            │
│  ├─ Consultation Room: consultation_507f1f77bcf86cd799439012  │
│  │   └─ Users: [doctor2@hospital.com, patient2@email.com]     │
│  │                                                              │
│  └─ Chat Room: chat_507f1f77bcf86cd799439012                  │
│      └─ Users: [doctor2@hospital.com, patient2@email.com]     │
│                                                                  │
│  NOTIFICATION ROOMS (User-specific)                            │
│  ├─ User Room: "507f1f77bcf86cd799439011"  (Doctor ID)        │
│  │ └─ Events: consentRequestReceived, appointmentApproved...  │
│  │                                                              │
│  └─ User Room: "507f1f77bcf86cd799439015"  (Patient ID)       │
│    └─ Events: appointmentStatusChanged, ...                   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

EVENT FLOW
┌─────────────────────────────────────────────────────────┐
│ Doctor Socket                Server i.o           Patient Socket │
│                                                                  │
│ socket.emit(                                                     │
│   "join_consultation",       roomId =                            │
│   { appointmentId }          consultation_apptId               │
│ )                            socket.join(roomId)              │
│                                    │                            │
│ socket.emit(                       │                            │
│   "send_message",                  ├──► socket.to(roomId).   │
│   { appointmentId, .. }            │    emit("send_message")  │
│ )                                  │         │                 │
│                            ChatMessage.create()  │                │
│                            Save to DB             │                │
│                                    │              │                │
│ socket.emit(                       │              │                │
│   "new_record_added",              ├──► socket.to(roomId).   │
│   { recordType, ... }              │    emit("new_record_..") │
│ )                                  │         │                 │
│                            MedicalRecord.create() │                │
│                            Broadcast to room      ▼                │
│                                                 Receive events    │
│                                                 Update state      │
│                                                 Re-render UI     │
│                                                 (NO page reload)  │
│                                                                  │
└─────────────────────────────────────────────────────────┘

BENEFITS OF ROOM-BASED ARCHITECTURE:
✓ Multiple concurrent consultations
✓ Isolated message broadcasts
✓ Efficient resource usage
✓ Scalable to thousands of users
✓ Natural data segregation (by appointmentId)
```

---

## 5. Database Schema Relationships

```
                    DATABASE SCHEMA RELATIONSHIPS
                    
┌──────────────────────────────────────────────────────────────────┐
│                        MONGODB COLLECTIONS                        │
└──────────────────────────────────────────────────────────────────┘

    USERS
    ┌─────────────────┐
    │ _id (ObjectId)  │◄──────────┐
    │ email           │           │
    │ fullName        │           │
    │ role: "doctor"  │           │
    │   or "patient"  │           │
    │ roles: [...]    │           │
    │ profile         │           │
    └─────────────────┘           │
            ▲                      │
            │                      │
            │ refs                 │ refs
            │                      │
    ┌───────┴──────────────────────┴──────┐
    │                                      │
┌───▼──────────────────┐     ┌────────────▼─────────┐
│   APPOINTMENTS       │     │   CONSULTATION       │
│                      │     │   SESSIONS           │
│ _id (ObjectId)       │     │                      │
│ userId ──────────────┼────►│ _id (ObjectId)       │
│ doctorId ───────────────┬─►│ appointmentId        │
│ appointmentDate      │  │ │ doctorId             │
│ appointmentTime      │  │ │ userId (patient)     │
│ consultationMode     │  │ │ status: "active"     │
│ consultationStatus   │  │ │         "completed"  │
│ isChatEnabled        │  │ │ startedAt            │
│ paymentStatus        │  │ │ endedAt              │
│ reasonForVisit       │  │ │ duration (seconds)   │
│ medicalHistory       │  │ │ endedBy: "doctor"    │
│ medications          │  │ │         "patient"    │
│ createdAt            │  │ │                      │
│ updatedAt            │  │ │ timestamps           │
└──────────┬───────────┘  │ └─┬────────────────────┘
           │              │   │
           │              │   │ one-to-many
           │ one-to-many  │   │
           │              │   │
         ┌─▼──────────────▼───▼────────┐
         │    MEDICAL RECORDS          │
         │                             │
         │ _id (ObjectId)              │
         │ sessionId ──────────────────┼────► to ConsultationSession
         │ appointmentId ──────────────┼────► to Appointment
         │ doctorId                    │
         │ userId (patient)            │
         │ recordType:                 │
         │   "prescription"            │
         │   "lab_report"              │
         │   "diagnosis"               │
         │   "vitals"                  │
         │                             │
         │ title                       │
         │ content                     │
         │ medication: {               │
         │   name, dosage, frequency   │
         │   duration, instructions    │
         │ }                           │
         │ labTest: {                  │
         │   testName, result, unit    │
         │   referenceRange, status    │
         │ }                           │
         │ vitals: {                   │
         │   temperature, heartRate    │
         │   bloodPressure, weight...  │
         │ }                           │
         │ notes                       │
         │ attachmentUrl               │
         │ timestamps                  │
         └──────────────────────────────┘
                  ▲
                  │ many
                  │
        ┌─────────┴───────────┐
        │                     │
    ┌───▼──────────────┐  ┌──▼────────────┐
    │  CHAT MESSAGES   │  │   (OTHER)    │
    │                  │  │   RECORDS     │
    │ _id (ObjectId)   │  │               │
    │ conversationId ──┼─►to Appointment │
    │ from ────────────┼─►to User (sender)
    │ to               │  │ (null = room) │
    │ text             │  │               │
    │ fileUrl          │  │ AuditEvent    │
    │ read: boolean    │  │ ConsentRequest│
    │ timestamps       │  │ ExportJob     │
    └──────────────────┘  │ ... etc       │
                          └───────────────┘

QUERY EXAMPLES:

1. Get all records for a consultation:
   MedicalRecord.find({ sessionId: sessionId })

2. Get all messages in a consultation chat:
   ChatMessage.find({ conversationId: appointmentId })

3. Get active sessions for a doctor:
   ConsultationSession.find({ 
     doctorId: doctorId,
     status: "active"
   })

4. Get patient's consultation history:
   ConsultationSession.find({ 
     userId: patientId,
     status: "completed"
   }).sort({ endedAt: -1 })

5. Verify if user is participant in appointment:
   Appointment.findById(appointmentId).select("userId doctorId")
   then compare with socket.user._id
```

---

## 6. State Management Flow (React Frontend)

```
                REACT STATE MANAGEMENT FLOW
                
┌──────────────────────────────────────────────────────────┐
│              ConsultationPage.js                         │
│         (Parent Component - Route Handler)               │
│                                                          │
│ State:                                                   │
│ - userRole: "doctor" | "patient" | null                │
│ - sessionId: string | null                              │
│ - activeSession: session object | null                  │
│ - loading: boolean                                       │
│ - error: string | null                                  │
│ - appointment: appointment object | null                │
│                                                          │
│ Effect Hooks:                                            │
│ 1. useEffect([appointmentId]) →                         │
│    Fetch appointment + determine user role              │
│    Then render appropriate child                         │
└─────────────────┬──────────────────────────────────────┘
                  │
        ┌─────────┴──────────┐
        │                    │
┌───────▼────────────────┐ ┌─▼─────────────────────────┐
│ DoctorConsultationPanel│ │ PatientLiveView           │
│                        │ │                           │
│ State:                 │ │ State:                    │
│ - recordType: "..."    │ │ - records: []             │
│ - title: string        │ │ - loading: boolean        │
│ - content: string      │ │ - message: string         │
│ - medication: {}       │ │ - sessionDuration: number │
│ - labTest: {}          │ │ - socket: io object       │
│ - vitals: {}           │ │                           │
│ - notes: string        │ │ Effects:                  │
│ - loading: boolean     │ │ 1. Connect socket         │
│ - message: string      │ │ 2. Listen to events:      │
│ - sessionDuration: num │ │    - new_record_added     │
│ - socket: io object    │ │    - consultation_ended   │
│ - activeSession: obj   │ │ 3. Session timer          │
│                        │ │ 4. Fetch records on mount │
│ Effects:               │ │                           │
│ 1. Connect socket      │ │ Event Listeners:          │
│ 2. Session timer       │ │ socket.on(                │
│    when activeSession  │ │   "new_record_added",     │
│                        │ │   (record) => {           │
│ Event Handlers:        │ │     setRecords(          │
│ - handleStartSession   │ │       prev =>             │
│ - handleEndSession     │ │       [record, ...prev]   │
│ - handleAddRecord      │ │     )                     │
│   (doctor fills form)  │ │   }                       │
│                        │ │ )                         │
│ Forms:                 │ │                           │
│ ✓ Record Type Selector │ │ Handlers:                 │
│ ✓ Prescription Form    │ │ - handleEndSession       │
│ ✓ Lab Report Form      │ │ - fetchRecords           │
│ ✓ Vitals Form          │ │                           │
│                        │ │ Rendering:               │
└─────────┬──────────────┘ │ - RecordCard for each    │
          │                │   medical record         │
          │ socket.emit    │ - Session status display │
          │ "add_record"   │                          │
          │                └──────────────────────────┘
          │
    ┌─────▼──────────────────────────────────────────┐
    │ Chat.jsx (Shared Component)                    │
    │                                                │
    │ State:                                         │
    │ - messages: []                                │
    │ - appointmentDetails: object | null           │
    │ - loading: boolean                            │
    │ - isConnected: boolean                        │
    │ - messageInput: string                        │
    │ - accessDenied: boolean                       │
    │                                                │
    │ Effects:                                       │
    │ 1. useEffect([appointmentId]) →              │
    │    Verify chat access                        │
    │    Register socket listeners                 │
    │                                               │
    │ Socket Event Listeners:                       │
    │ socket.on("connect")                         │
    │ socket.on("disconnect")                      │
    │ socket.on("receive_message")                 │
    │   → setMessages(prev => [...prev, data])     │
    │ socket.on("chat_history")                    │
    │   → setMessages(history)                     │
    │ socket.on("error")                           │
    │                                               │
    │ Event Handlers:                               │
    │ - handleSendMessage                          │
    │   socket.emit("send_message", {...})         │
    │ - handleFileUpload                           │
    │   Upload → Socket send_message               │
    │                                               │
    │ Rendering:                                    │
    │ - MessageBubble for each message             │
    │ - File preview (images inline)               │
    │ - Message input form                         │
    │ - Connection status indicator                │
    └─────────────────────────────────────────────┘

DATA FLOW OVERVIEW:

   socket.emit() ─────────► (emit to server)
   socket.on() ◄────────── (listen for events)
   setMessages() ─────────► Trigger re-render
   re-render ─────────────► Display updates

NO PAGE REFRESH NEEDED!
All updates via Socket.IO from AppLevel (App.js)
Individual components register/unregister listeners
```

---

## 7. Authentication & Authorization Flow

```
                    AUTHENTICATION & AUTHORIZATION
                    
┌─────────────────────────────────────────────────────────────┐
│                   JWT TOKEN FLOW                            │
└─────────────────────────────────────────────────────────────┘

LOGIN
├─ User submits credentials
├─ Backend: POST /api/v1/login
├─ Verify password
├─ Generate JWT token:
│  {
│    id: user._id,
│    email: user.email,
│    role: user.role,
│    roles: [user.roles],
│    iat: Date.now(),
│    exp: Date.now() + 24hours
│  }
├─ Return token in response
│
└─ Frontend: localStorage.setItem("token", token)


SOCKET.IO CONNECTION
├─ App.js detects login (token + user in Redux)
├─ Calls: connectSocket(token) from socketManager.js
├─ Socket.IO handshake:
│  ```
│  const socket = io(baseURL, {
│    auth: { token },
│    transports: ["websocket", "polling"]
│  });
│  ```
│
├─ Server receives connection
├─ Socket Auth Middleware (io.use):
│  1. Extract token from socket.handshake.auth.token
│  2. Call verifyAccessToken(token)
│     - Decrypt JWT
│     - Check expiration
│     - Return decoded { id, email, role, ... }
│  3. Fetch User from database
│     User.findById(decoded.id)
│  4. Attach socket.user = user
│  5. If appointmentId provided:
│     - Fetch Appointment
│     - Verify both are participants
│       (appointmentId.userId === socket.user._id OR
│        appointmentId.doctorId === socket.user._id)
│     - Attach socket.appointment = appointment
│  6. Call next() to allow connection
│
└─ Socket is now authenticated + authorized


REST API AUTHORIZATION
├─ For each request:
│
├─ Browser includes:
│  Authorization: Bearer {token}
│  (localStorage.getItem("token"))
│
├─ Server middleware: authenticateUser
│  1. Extract token from Authorization header
│  2. Call verifyAccessToken(token)
│  3. Fetch user from decoded.id
│  4. Attach req.user = user
│  5. Call next()
│
├─ Role-Based Authorization:
│  For isDoctor middleware:
│    if (!req.user.roles.includes("doctor"))
│      return 403 Forbidden
│
│  For isPatient middleware:
│    if (!req.user.roles.includes("patient"))
│      return 403 Forbidden
│
├─ Appointment Verification:
│  For access to specific appointment:
│    const apt = await Appointment.findById(appointmentId)
│    if (apt.doctorId !== req.user._id &&
│        apt.userId !== req.user._id)
│      return 403 Access Denied
│
└─ If all pass → Proceed to route handler


TOKEN REFRESH
├─ Token expires after 24 hours
├─ On expiration:
│  1. Socket connection terminates
│  2. HTTP requests return 401 Unauthorized
│  3. Frontend catch (error.response.status === 401)
│  4. Call handleUnauthorized()
│     - Clear localStorage
│     - Redirect to /login
│     - User must log in again
│
└─ (Optional: Implement refresh tokens for seamless re-login)


LOGOUT
├─ Frontend: localStorage.removeItem("token")
├─ Redux: Clear auth state (token, user)
├─ App.js useEffect detects token gone
├─ Calls: disconnectSocket()
│  ├─ if (socket.connected) socket.disconnect()
│  └─ Connection closes cleanly
│
└─ User logged out
```

---

## Summary Comparison

| Aspect | Technology | Purpose |
|--------|-----------|---------|
| **Real-Time Comms** | Socket.IO | Instant message/record delivery |
| **Room Isolation** | Socket.IO Rooms | Separate consultations don't interfere |
| **Authentication** | JWT + Socket Middleware | Secure connection validation |
| **Data Persistence** | MongoDB | Store records for history |
| **REST API** | Express.js Routes | Traditional CRUD operations |
| **Frontend Updates** | React State + Socket Listeners | Real-time UI without polling |
| **File Storage** | Cloudinary | Store chat attachments |
| **Payments** | Razorpay | Online consultation payments |

---

This architecture ensures **real-time, secure, scalable consultations** with seamless doctor-patient interaction!
