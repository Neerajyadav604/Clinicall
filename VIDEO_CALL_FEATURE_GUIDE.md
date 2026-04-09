# Complete Video Call Feature Documentation

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Initiating a Video Call](#initiating-a-video-call)
3. [Receiving a Video Call](#receiving-a-video-call)
4. [Token Generation](#token-generation)
5. [Socket Events](#socket-events)
6. [Data Models](#data-models)
7. [Common Failure Points](#common-failure-points)
8. [Testing Checklist](#testing-checklist)

---

## Architecture Overview

### Technology Stack
- **Video Backend**: Jitsi as a Service (JaaS) / 8x8.vc
- **Real-time Signaling**: Socket.io over WebSocket
- **JWT Authentication**: RS256 signed tokens for Jitsi
- **REST Endpoint**: `GET /api/v1/consultation/video-token/:appointmentId`
- **Frontend State Management**: React hooks (useVideoCall)

### Key Components

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Chat.jsx (Chat page)                                               │
│    ├── useVideoCall(appointmentId) hook                             │
│    │   ├── State: callState, jitsiData, incomingCall               │
│    │   ├── Methods: startCall(), acceptCall(), declineCall()       │
│    │   └── Socket listeners for call events                        │
│    ├── ChatHeader (Video call button)                              │
│    ├── VideoCallModal (Jitsi iframe container)                     │
│    └── IncomingCallBanner (Notify other participant)               │
│                                                                       │
│  Communication via:                                                  │
│    ├── REST: /consultation/video-token/:appointmentId (GET)        │
│    ├── WebSocket: socket.emit/on events                            │
│    └── localStorage: token for auth                                │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                    ▼                       ▼
            ┌──────────────┐         ┌──────────────┐
            │ Jitsi (8x8)  │         │  Node Server │
            │   External   │         │    (Socket)  │
            │   Service    │         │              │
            └──────────────┘         └──────────────┘
```

---

## Initiating a Video Call

### Step 1: User Clicks "Video Call" Button

**File**: `frontend/src/pages/Chat.jsx` (Lines 160-165)

```javascript
<button onClick={onStartCall} className="...">
  <svg>...</svg>
  Video Call
</button>
```

**Triggered State**:
```javascript
const { startCall } = useVideoCall(appointmentId);
// When clicked: startCall()
```

### Step 2: startCall() Function

**File**: `frontend/src/hooks/useVideoCall.js` (Lines 122-165)

```javascript
const startCall = useCallback(async () => {
  setCallState("calling");  // UI shows "Connecting..." badge
  
  // 1. Fetch JWT token from server
  const data = await fetchJitsiToken();
  
  if (!data) {
    setCallState("idle");
    return;
  }
  
  // 2. Emit socket event to notify other participant
  socket.emit("call:video:start", { appointmentId });
  
  // 3. Set Jitsi data and start call timer
  setJitsiData(data);
  setCallState("in-call");
  startTimer();
}, [appointmentId]);
```

### Step 3: Fetch Jitsi Token

**File**: `frontend/src/hooks/useVideoCall.js` (Lines 30-100)

```javascript
const fetchJitsiToken = useCallback(async () => {
  try {
    const token = localStorage.getItem("token");  // Auth token
    const base = process.env.REACT_APP_API_BASE_URL;
    const url = `${base}/consultation/video-token/${appointmentId}`;
    
    // Send to backend with Authorization header
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (res.status === 401) {
      handleUnauthorized();
      return null;
    }
    
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.message);
    }
    
    return data;  // { token, fullRoom, domain, expiresAt }
  } catch (err) {
    setError(err.message);
    return null;
  }
}, [appointmentId]);
```

**Key Data Returned**:
```javascript
{
  success: true,
  token: "eyJhbGc...",      // Signed JWT for Jitsi
  roomName: "appointment-{appointmentId}",
  fullRoom: "{appId}/appointment-{appointmentId}",
  domain: "8x8.vc",
  expiresAt: 1717944000000
}
```

### Step 4: Backend Token Endpoint

**File**: `server/routes/videoCall.routes.js` (Lines 28-152)

#### 4a. Authentication Check
```javascript
router.get(
  "/consultation/video-token/:appointmentId",
  authenticateUser,  // Middleware: sets req.user from JWT
  async (req, res) => {
    
    // Logs: REQUEST DETAILS, ENV CONFIG CHECK
    console.log(`[🎥 VideoCall Token] Requester: ${req.user._id}`);
```

#### 4b. Appointment Lookup with Population
```javascript
// FIX: Populate doctorId to get the Doctor document with user reference
const appointment = await Appointment.findById(appointmentId)
  .populate('doctorId', 'user fullName email');

if (!appointment) {
  return res.status(404).json({ success: false, message: "Appointment not found" });
}
```

#### 4c. Participant Verification
```javascript
// Get requesting user ID
const userId = req.user._id.toString();

// Check if patient
const isPatient = appointment.userId?.toString() === userId;

// Check if doctor (FIX: Access Doctor.user field)
const isDoctor = appointment.doctorId?.user?._id?.toString() === userId 
              || appointment.doctorId?.user?.toString() === userId;

console.log(`[video-token] isDoctor: ${isDoctor}, isPatient: ${isPatient}`);

if (!isPatient && !isDoctor) {
  return res.status(403).json({ 
    success: false, 
    message: "Access denied"
  });
}
```

#### 4d. Eligibility Check
```javascript
const isPaid = appointment.paymentStatus === "paid";
const isScheduled = appointment.status === "SCHEDULED";

if (!isPaid || !isScheduled) {
  return res.status(403).json({
    success: false,
    message: "Video call only available for scheduled and paid appointments"
  });
}
```

#### 4e. Token Generation
```javascript
// FIX: Pass isDoctor flag to generator
const jitsiData = generateJitsiToken(req.user, appointmentId, isDoctor);

// ✅ Token now has correct moderator flag and user identity
console.log(`[video-token] moderator flag: ${isDoctor}`);
```

### Step 5: Token Generation

**File**: `server/utils/jitsiToken.js` (Lines 20-77)

```javascript
const generateJitsiToken = (user, appointmentId, isDoctor = false) => {
  const appId = process.env.JAAS_APP_ID;
  const kid = process.env.JAAS_KID;
  const privateKey = Buffer.from(process.env.JAAS_PRIVATE_KEY, "base64").toString("utf8");
  
  // Room locked to this appointment
  const roomName = `appointment-${appointmentId}`;
  
  // FIX: Use isDoctor flag (not just role check)
  const isModerator = isDoctor !== false ? isDoctor : (user.role === "doctor");
  
  const now = Math.floor(Date.now() / 1000);
  
  const payload = {
    iss: "chat",
    aud: "jitsi",
    iat: now,
    exp: now + 3600,  // 1 hour expiry
    sub: appId,
    room: roomName,    // Restricts token to this room only
    context: {
      user: {
        id:        user._id.toString(),          // ✅ Correct user ID
        name:      user.fullName || "User",      // ✅ Actual name
        email:     user.email || "",
        avatar:    user.image || "",
        moderator: isModerator,                   // ✅ Correct flag
      },
      features: {
        livestreaming:   false,
        recording:       false,
        "outbound-call": false,
        transcription:   false,
      },
    },
  };
  
  // Sign with RS256 algorithm
  const token = jwt.sign(payload, privateKey, {
    algorithm: "RS256",
    header: { kid, alg: "RS256" },
  });
  
  return {
    token,
    roomName,
    domain: "8x8.vc",
    fullRoom: `${appId}/${roomName}`,
  };
};
```

**Token Structure**:
```
HEADER: { kid: "...", alg: "RS256" }

PAYLOAD: {
  "iss": "chat",
  "aud": "jitsi",
  "iat": 1717840000,
  "exp": 1717843600,
  "sub": "vpaas-magic-cookie-xxxx",
  "room": "appointment-60d5ec5f5e1c8a2b0c3d4e5f",
  "context": {
    "user": {
      "id": "507f1f77bcf86cd799439011",           // Caller's ID
      "name": "Dr. John Smith",                   // Caller's name
      "moderator": true/false                     // Doctor or Patient
    }
  }
}

SIGNATURE: RS256_SIGNATURE
```

### Step 6: Emit Socket Event

**File**: `frontend/src/hooks/useVideoCall.js` (Lines 150-152)

```javascript
// Notify other participant through Socket.io
socket.emit("call:video:start", { appointmentId });
```

---

## Receiving a Video Call

### Step 1: Server Receives "call:video:start" Event

**File**: `server/routes/videoCall.routes.js` (Lines 182-290)

```javascript
socket.on("call:video:start", async ({ appointmentId }) => {
  try {
    // [1/6] Log initiator info
    console.log(`[call:video:start] Initiator: ${socket.user.fullName} (${socket.user.role})`);
    
    // [2/6] Lookup appointment
    const appointment = await Appointment.findById(appointmentId)
      .populate('doctorId', 'fullName image');
    
    if (!appointment) {
      socket.emit("error", "Appointment not found");
      return;
    }
    
    // [3/6] Verify initiator is participant
    const userId = socket.user._id.toString();
    const isPatient = appointment.userId?.toString() === userId;
    const isDoctor = appointment.doctorId?._id?.toString() === userId;
    
    if (!isPatient && !isDoctor) {
      socket.emit("error", "Access denied");
      return;
    }
    
    // [4/6] Register active call
    activeVideoCalls.set(appointmentId, {
      startedBy: userId,
      startedAt: Date.now(),
      participants: new Set([userId]),
    });
    
    // [5/6] BUILD CALL PAYLOAD
    const callPayload = {
      appointmentId,
      calledBy: {
        id:     socket.user._id,
        name:   socket.user.fullName,
        role:   socket.user.role,
        avatar: socket.user.image || null,
      },
      startedAt: new Date().toISOString(),
    };
    
    // [6/6] BROADCAST NOTIFICATIONS
    // To everyone in chat room
    socket.to(`chat_${appointmentId}`).emit("call:video:incoming", callPayload);
    
    // To other participant's personal notification room
    const otherPersonId = userId === patientId ? doctorId : patientId;
    const otherPersonNotificationRoom = `notification_${otherPersonId}`;
    io.to(otherPersonNotificationRoom).emit("call:video:incoming", callPayload);
    
    socket.emit("call:video:started", { appointmentId });
  } catch (err) {
    socket.emit("error", "Failed to start call: " + err.message);
  }
});
```

### Step 2: Other Participant Receives Event

**File**: `frontend/src/hooks/useVideoCall.js` (Lines 233-257)

```javascript
const onIncoming = (data) => {
  console.log(`[call:video:incoming] EVENT RECEIVED ✅`);
  console.log(`  - Caller: ${data.calledBy?.name}`);
  console.log(`  - Appointment: ${data.appointmentId}`);
  console.log(`  - Current State: ${callState}`);
  
  // CONDITION 1: Must be idle
  if (callState !== "idle") {
    console.log(`  ℹ️ Ignoring: not idle (${callState})`);
    return;
  }
  
  // CONDITION 2: Must be correct appointment
  if (data.appointmentId !== appointmentId) {
    console.log(`  ℹ️ Ignoring: wrong appointment`);
    return;
  }
  
  console.log(`  ✅ Showing incoming call banner`);
  setIncomingCall(data);
  setCallState("incoming");
};

socket.on("call:video:incoming", onIncoming);
```

### Step 3: Show Incoming Call Banner

**File**: `frontend/src/components/consultation/IncomingCallBanner.jsx` (Lines 14-120)

```javascript
export default function IncomingCallBanner({ incomingCall, onAccept, onDecline }) {
  // Generate Web Audio ringtone (two-tone medical ring)
  const ring = () => {
    const ctx = new AudioContext();
    
    // 880Hz and 1100Hz alternating tones
    [880, 1100].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.linearRampToValueAtTime(0.18, ...);
      osc.start(...);
      osc.stop(...);
    });
    
    // Repeat every 2.5 seconds
    setTimeout(ring, 2500);
  };
  
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6">
        {/* Avatar with ringing animation */}
        <div className="relative flex-shrink-0">
          <img src={calledBy?.avatar} className="w-14 h-14 rounded-full" />
          <div className="animate-pulse border-2 border-blue-500" />
        </div>
        
        {/* Caller info */}
        <p className="font-semibold text-gray-900">{calledBy?.name}</p>
        <p className="text-sm text-gray-500">
          {isDoctor ? "Dr. · " : ""}Incoming video call…
        </p>
        
        {/* Actions */}
        <button onClick={onDecline} className="w-11 h-11 bg-red-100 rounded-full">
          {/* Decline icon */}
        </button>
        <button onClick={onAccept} className="w-11 h-11 bg-green-500 rounded-full">
          {/* Accept icon */}
        </button>
      </div>
    </div>
  );
}
```

### Step 4: Other Participant Accepts Call

**File**: `frontend/src/hooks/useVideoCall.js` (Lines 167-180)

```javascript
const acceptCall = useCallback(async () => {
  console.log(`[acceptCall] Fetching token...`);
  
  # Same as startCall:
  setCallState("calling");
  const data = await fetchJitsiToken();
  
  if (!data) {
    setCallState("incoming");
    return;
  }
  
  // Emit join event
  socket.emit("call:video:join", { appointmentId });
  
  // Show video
  setJitsiData(data);
  setCallState("in-call");
  startTimer();
}, [appointmentId]);
```

---

## Socket Events

### Event: `authenticate_appointment`

**Who sends**: Frontend (Chat.jsx) after connection
**What it does**: Authenticates socket for a specific appointment
**Location**: `server/index.js` (Lines 498-545)

```javascript
socket.on("authenticate_appointment", async ({ appointmentId }) => {
  // Verify user is patient or doctor of this appointment
  // Join personal notification room: notification_${userId}
  socket.emit("appointment_authenticated", { success: true });
});
```

### Event: `join_chat`

**Who sends**: Frontend (Chat.jsx) after authentication
**What it does**: Joins the chat room for messages
**Location**: `server/index.js` (Lines 562-595)

```javascript
socket.on("join_chat", ({ appointmentId }) => {
  socket.join(`chat_${appointmentId}`);
  // Load chat history
  socket.emit("chat_history", messages);
});
```

### Event: `call:video:start`

**Who sends**: Frontend (useVideoCall hook) - call initiator
**What it happens**: Broadcasts incoming call notification
**Location**: `server/routes/videoCall.routes.js` (Lines 183-290)

**Broadcasts TO**:
- `chat_${appointmentId}` - everyone in chat
- `notification_${otherParticipantId}` - other participant

### Event: `call:video:incoming`

**Who sends**: Backend (Socket.io broadcast)
**Who receives**: Other participant
**Payload**:
```javascript
{
  appointmentId,
  calledBy: {
    id:     "...",      // Initiator's user ID
    name:   "Dr. Smith",
    role:   "doctor",
    avatar: "https://..."
  },
  startedAt: "2024-06-08T10:30:00Z"
}
```

### Event: `call:video:join`

**Who sends**: Frontend (useVideoCall hook) - when accepting call
**What it does**: Tracks participant joining
**Location**: `server/routes/videoCall.routes.js` (Lines 292-310)

```javascript
socket.on("call:video:join", ({ appointmentId }) => {
  const call = activeVideoCalls.get(appointmentId);
  if (call) {
    call.participants.add(socket.user._id);
    io.to(`chat_${appointmentId}`).emit("call:video:participant_joined", {
      userId: socket.user._id,
      participantCount: call.participants.size,
    });
  }
});
```

### Event: `call:video:decline`

**Who sends**: Frontend - when rejecting call
**Location**: `server/routes/videoCall.routes.js` (Lines 312-323)

```javascript
socket.on("call:video:decline", ({ appointmentId }) => {
  socket.to(`chat_${appointmentId}`).emit("call:video:declined", {
    declinedBy: socket.user.fullName,
  });
  activeVideoCalls.delete(appointmentId);
});
```

### Event: `call:video:leave`

**Who sends**: Frontend - when user hangs up
**Location**: `server/routes/videoCall.routes.js` (Lines 325-345)

```javascript
socket.on("call:video:leave", ({ appointmentId }) => {
  const call = activeVideoCalls.get(appointmentId);
  if (call) {
    call.participants.delete(socket.user._id);
    io.to(`chat_${appointmentId}`).emit("call:video:participant_left", {
      participantCount: call.participants.size,
    });
  }
});
```

---

## Data Models

### Appointment Schema

**File**: `server/models/Appointment.js`

```javascript
{
  userId: {
    type: ObjectId,
    ref: "User",           // ✅ Patient
    required: true,
  },
  doctorId: {
    type: ObjectId,
    ref: "Doctor",         // ⚠️ References DOCTOR model, not User
    required: true,
  },
  appointmentDate: Date,
  appointmentTime: String,
  status: {
    enum: ["SCHEDULED", "COMPLETED", "NOT SCHEDULED"],
    default: "NOT SCHEDULED",
  },
  paymentStatus: {
    enum: ["unpaid", "paid", "refunded"],
    default: "unpaid",
  },
  consultationStatus: {
    enum: ["locked", "active", "completed"],
    default: "locked",
  },
  isChatEnabled: Boolean,
}
```

### Doctor Schema

**File**: `server/models/Doctor.js`

```javascript
{
  user: {
    type: ObjectId,
    ref: "User",           // ✅ Doctor's User account
    required: true,
  },
  fullName: String,
  email: String,
  contact: String,
  specialization: String,
  qualification: String,
  experienceYears: Number,
  licenseNumber: String,
  hospitalName: String,
  consultationFee: Number,
  image: String,
  // ... other fields
}
```

### Why This Matters

When you call:
```javascript
appointment.userId           // Returns: ObjectId of User (patient)
appointment.doctorId         // Returns: ObjectId of Doctor (NOT User!)
appointment.doctorId.user    // Returns: ObjectId of User (doctor) ✅
```

**The Fix**: Always populate doctorId and access `.user` field:
```javascript
const appointment = await Appointment.findById(appointmentId)
  .populate('doctorId', 'user fullName email');

const doctorUserId = appointment.doctorId.user._id;  // ✅ Correct
```

---

## Common Failure Points

### ❌ 1. `appointmentId` Mismatch in Event

**Symptom**: Banner appears but never goes away, or appears for wrong call

**Code** (`frontend/src/hooks/useVideoCall.js`):
```javascript
if (data.appointmentId !== appointmentId) {
  // IGNORING because appointmentIds don't match
  return;
}
```

**Causes**:
- Browser console shows different appointmentIds
- User in wrong chat room
- Multiple tabs/windows with different appointments

**Fix**: Check browser console for:
```
[🎥 useVideoCall:socketListeners]
  - Expected Appointment ID: 60d5ec5f5e1c8a2b0c3d4e5f
  - Received Appointment ID: 60d5ec5f5e1c8a2b0c3d4e5g
  - IDs Match: false
```

---

### ❌ 2. `call:video:incoming` Event Not Received

**Symptom**: No banner, no error in console

**Potential Causes**:

**A. Socket not in notification room**
- Socket didn't authenticate with `authenticate_appointment`
- Backend didn't execute: `socket.join(`notification_${userId}`)`

**Check**:
```javascript
// Backend logs should show
[🔐 Socket Auth] ✅ Joined personal notification room: notification_507f1f77bcf86cd799439011

// If not in logs, authentication failed
```

**B. Socket disconnected or not connected**
- Check if socket is connected before emitting
- Network connectivity issue

**Check**:
```javascript
// Frontend should show
CacheEventListeners] USER_ID: 507f1f77bcf86cd799439011
[useVideoCall:socketListeners] Registering socket event listeners
```

**C. Server using wrong room name**
- Check what room server is broadcasting to

**Server-side log**:
```
[call:video:start] NOTIFICATIONS BROADCAST:
  - Notifying other participant's personal room: notification_507f1f77bcf86cd799439011
  ✅ Broadcast to personal notification room
```

---

### ❌ 3. Token Generation Fails (401/403)

**Symptom**: "Access denied" toast, console shows auth error

**Causes**:

**A. Doctor not identified correctly**
```javascript
// Before fix:
const isDoctor = appointment.doctorId?.toString() === userId;  // WRONG!
// doctorId is Doctor ObjectId, not User ObjectId

// After fix:
const isDoctor = appointment.doctorId?.user?._id?.toString() === userId;  // ✅
```

**Check backend logs**:
```
[🎥 VideoCall Token] Participant verification:
  - User ID: 507f1f77bcf86cd799439011
  - Patient ID (from appt): 507f1f77bcf86cd799439012
  - Doctor User ID (from appt): 507f1f77bcf86cd799439011
  - Is Doctor: ✅ YES
```

**B. Appointment not paid/scheduled**
```javascript
if (!isPaid || !isScheduled) {
  return res.status(403).json({
    message: "Video call only available for scheduled and paid appointments"
  });
}
```

**Check backend logs**:
```
[video-token] Eligibility Check:
  - Payment Status "paid": ❌ NO (actual: unpaid)
  - Appointment Status "SCHEDULED": ❌ NO (actual: NOT SCHEDULED)
```

**Fix**: Payment and status must be:
```javascript
paymentStatus: "paid",
status: "SCHEDULED"
```

**C. User not authenticated**
- Auth token expired or invalid
- Check: `Authorization: Bearer ${token}` header

---

### ❌ 4. Display Name Shows "User" Instead of Name

**Symptom**: Banner shows "User" instead of "Dr. John Smith"

**Cause**: Jitsi token not extracting name correctly

**Code** (`frontend/src/pages/Chat.jsx`):
```javascript
// Before fix - stale localStorage token
const payload = JSON.parse(atob(token.split('.')[1]));
setDisplayName(payload.fullName || payload.name || "User");

// After fix - use Jitsi token with correct user data
useEffect(() => {
  if (jitsiData?.token) {
    const jitsiPayload = JSON.parse(atob(jitsiData.token.split('.')[1]));
    setDisplayName(jitsiPayload.context?.user?.name || "User");
  }
}, [jitsiData?.token]);
```

**Check**:
```javascript
// Inspect jitsiData token
const payload = JSON.parse(atob(jitsiData.token.split('.')[1]));
console.log(payload.context.user);
// Should show: { id: "...", name: "Dr. Smith", moderator: true/false }
```

---

### ❌ 5. Banner Appears But Accept/Decline Buttons Don't Work

**Symptom**: Buttons click but nothing happens

**Cause**: `acceptCall` or `declineCall` not implemented

**Check** (`frontend/src/pages/Chat.jsx`):
```javascript
<IncomingCallBanner
  incomingCall={incomingCall}
  onAccept={acceptCall}        // ✅ Must be function
  onDecline={declineCall}       // ✅ Must be function
/>
```

**Make sure these functions exist**:
```javascript
const { acceptCall, declineCall } = useVideoCall(appointmentId);

// acceptCall: Fetches token, emits join event
// declineCall: Emits decline event
```

---

### ❌ 6. No Audio Ringtone

**Symptom**: Banner appears but no sound

**Cause**: Web Audio API creation failed

**Code** (`frontend/src/components/consultation/IncomingCallBanner.jsx`):
```javascript
useEffect(() => {
  if (!incomingCall) return;
  
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) {
    console.warn("AudioContext not supported");
    return;  // Silent mode
  }
  
  const ctx = new AudioContext();
  // ... create ringtone
}, [incomingCall]);
```

**Check browser console**:
- Look for "AudioContext" errors
- Some browsers require user gesture to play sound
- Check browser permissions for microphone access

---

### ❌ 7. Jitsi Iframe Won't Load

**Symptom**: Black screen, no video

**Causes**:

**A. External script not loaded**
```javascript
// Loads from CDN: https://8x8.vc/external_api.js
script.src = "https://8x8.vc/external_api.js";
```

**Check**:
```javascript
console.log(typeof window.JitsiMeetExternalAPI);  // Should be "function"
```

**B. Token expired**
```javascript
const exp = now + 60 * 60;  // 1 hour expiry
// If request delayed > 1 hour, token will be invalid
```

**Check backend logs**:
```
[video-token] Token Expiry: 2024-06-08T11:30:00Z
```

**C. Network error connecting to Jitsi**
```javascript
errorOccurred: (err) => {
  console.error("Jitsi error:", err);
}
```

**Check browser console**:
- CORS errors - check 8x8.vc configuration
- Domain not whitelisted - add domain to Jitsi config

---

### ❌ 8. "call:video:started" Not Received

**Symptom**: Initiator never leaves "calling" state, stuck on "Connecting..."

**Cause**: Backend didn't emit confirmation

**Code** (`server/routes/videoCall.routes.js`):
```javascript
socket.emit("call:video:started", { appointmentId });
```

**Check backend logs**:
```
[call:video:start] CONFIRMATION TO INITIATOR:
  - ✅ Sent "call:video:started" to initiator
```

If not present, check error handling:
```
[call:video:start] ❌ ERROR:
  - Type: ReferenceError
  - Message: activeVideoCalls is not defined
```

---

## Testing Checklist

### Pre-Call Setup
- [ ] Two users have appointment with `status: "SCHEDULED"` and `paymentStatus: "paid"`
- [ ] One is patient (userId), one is doctor (doctorId in Doctor model)
- [ ] Both logged in with valid JWT tokens
- [ ] Both have browser console open (look for logs)

### Initiator (Person Starting Call)
- [ ] In Chat.jsx page for appointment
- [ ] Socket connected (green indicator)
- [ ] "Video Call" button visible in header
- [ ] **Click "Video Call" button**
  - [ ] Console shows: `[startCall]`
  - [ ] UI shows "Connecting..." badge
  - [ ] Console shows: `[fetchJitsiToken] TOKEN FETCH INITIATED`
  - [ ] Console shows: Backend sends 200 response with token
  - [ ] Jitsi iframe loads (black screen with controls)

### Recipient (Receiving Call)
- [ ] In Chat.jsx page for same appointment
- [ ] Socket connected
- [ ] **Should see IncomingCallBanner appear**
  - [ ] Shows caller's name and avatar
  - [ ] Shows ringing animation (pulsing circle)
  - [ ] Plays ringtone (two-tone medical ring)
  - [ ] Console shows: `EVENT: "call:video:incoming" RECEIVED ✅`

### Accept Call (Recipient)
- [ ] **Click green "Accept" button**
  - [ ] Console shows: `[acceptCall]`
  - [ ] Banner disappears
  - [ ] Jitsi iframe loads on recipient side
  - [ ] Both see each other's video/audio
  - [ ] Console shows: `call:video:participant_joined`

### Drop Call
- [ ] **Initiator or Recipient clicks hang-up**
  - [ ] Jitsi iframe closes
  - [ ] Both see "Call Ended" message
  - [ ] Console shows: `call:video:ended`

### Testing Decline Call (Optional)
- [ ] Recipient gets call notification
- [ ] **Click red "Decline" button**
  - [ ] Banner disappears
  - [ ] Initiator sees: "User declined the call"
  - [ ] Console shows: `call:video:declined`
  - [ ] Initiator returns to "idle" state

---

## Environment Variables Required

Add to `.env`:
```
JAAS_APP_ID=vpaas-magic-cookie-xxxxxxxxxxxxxxxx
JAAS_KID=vpaas-magic-cookie-xxxxxxxxxxxxxxxx/xxxxxxxx
JAAS_PRIVATE_KEY=<BASE64_ENCODED_RSA_PRIVATE_KEY>

REACT_APP_API_BASE_URL=http://localhost:4000/api/v1
```

---

## Debugging Tips

### 1. Check All Console Logs

Search for `[🎥` in browser and server console:
```
[🎥 VideoCall Token]
[🎥 Socket call:video:start]
[🎥 useVideoCall:fetchJitsiToken]
[🎥 useVideoCall:socketListeners]
[🎥 VideoCallModal:Jitsi]
```

### 2. Verify Socket Rooms

Backend:
```javascript
console.log(`[DEBUG] Socket ${socket.id} in rooms:`, socket.rooms);
```

Should show:
```
Socket xxxxx in rooms: {
  "xxxxx": true,  // Default room (own socket ID)
  "notification_507f1f77...": true,
  "chat_60d5ec5f...": true (if in chat)
}
```

### 3. Network Tab

Check network requests:
- `GET /api/v1/consultation/video-token/{appointmentId}` - should be 200
- Response body should have `token` field

### 4. Check Jitsi JWT Claims

Decode token at [jwt.io](https://jwt.io):
```javascript
// Paste token in "Encoded" section (left)
// Right side shows:
{
  "context": {
    "user": {
      "id": "...",
      "name": "Dr. Smith",
      "moderator": true
    }
  },
  "room": "appointment-60d5ec5f..."
}
```

### 5. Test Socket Emission Manually

Browser console:
```javascript
socket.emit("call:video:start", { appointmentId: "60d5ec5f5e1c8a2b0c3d4e5f" });

// Check server logs for response
```

---

## Summary

**For video calls to work, ensure**:

1. ✅ **Authentication**: User is patient or doctor in appointment (via `appointment.doctorId.user._id`)
2. ✅ **Payment & Status**: `paymentStatus === "paid"` and `status === "SCHEDULED"`
3. ✅ **Token Generation**: Backend generates correct JWT with `moderator: isDoctor`
4. ✅ **Socket Events**:
   - `authenticate_appointment` → socket joins `notification_${userId}`
   - `call:video:start` → broadcasts to both chat and notification rooms
   - `call:video:incoming` → recipient sees banner
5. ✅ **Jitsi Integration**: Token valid, room name matches, SDK loads
6. ✅ **Display Name**: Extracted from Jitsi token payload
7. ✅ **Socket Rooms**: Both sockets in correct rooms before call starts

**Most Common Issue**: Doctor ID comparison fails because `appointment.doctorId` references Doctor model, not User. **Always populate and access: `.doctorId.user._id`**
