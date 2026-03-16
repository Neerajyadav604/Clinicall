# Clinicall Backend Architecture Reference

**Complete guide to schemas, middleware, Socket.IO setup, and route patterns**

---

## TABLE OF CONTENTS
1. [Appointment Model Schema](#1-appointment-model-schema)
2. [Socket.IO Server Setup](#2-socketio-server-setup)
3. [Auth Middleware](#3-auth-middleware)
4. [Route Files Index](#4-route-files-index)
5. [Sample Route Pattern](#5-sample-route-pattern)
6. [Middleware Stack Reference](#6-middleware-stack-reference)

---

## 1. APPOINTMENT MODEL SCHEMA

**Location:** `server/models/Appointment.js`

```javascript
const mongoose = require("mongoose");
const fieldEncryption = require('mongoose-field-encryption').fieldEncryption;

const AppointmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    appointmentDate: {
      type: Date,
      required: true,
    },
    appointmentTime: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["SCHEDULED", "COMPLETED", "NOT SCHEDULED"],
      default: "NOT SCHEDULED",
    },
    reason: {
      type: String,
    },
    
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },
    consultationStatus: {
      type: String,
      enum: ["locked", "active", "completed"],
      default: "locked",
    },
    paidAt: {
      type: Date,
      default: null,
    },
    approvalstatus:{
      type:String,
      enum:["APPROVED","REJECTED","PENDING","CANCELLED"],
      default:"PENDING"
    },
    cancellationReason:{
      type:String
    },
    consultationMode:{
      type:String,
      enum:["online","offline"],
      default:null
    },
    isChatEnabled:{
      type:Boolean,
      default:false
    }
  },
  {
    timestamps: true, // automatically adds createdAt & updatedAt
  }
);

// Encrypt sensitive fields
AppointmentSchema.plugin(fieldEncryption, {
  fields: ['reason', 'cancellationReason'],
  secret: process.env.FIELD_ENC_KEY || 'change_this_in_prod',
});

module.exports = mongoose.model("Appointment", AppointmentSchema);
```

### Appointment Status Diagram
```
NOT SCHEDULED → SCHEDULED → COMPLETED
             → SCHEDULED → NOT SCHEDULED (if user cancels)

approvalstatus: PENDING → APPROVED → COMPLETED
                       → REJECTED
                       → CANCELLED

paymentStatus: unpaid → paid → refunded

consultationStatus: locked → active → completed

consultationMode: online || offline
```

---

## 2. SOCKET.IO SERVER SETUP

**Location:** `server/index.js`

### Socket.IO Initialization
```javascript
const socketIo = require("socket.io");

const io = socketIo(server, {
  cors: {
    origin: clientUrl,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  allowEIO3: true,
});
app.set('io', io);
```

### Socket.IO Authentication Middleware
```javascript
io.use(async (socket, next) => {
  console.log('📍 [TRACE] Socket.IO auth middleware called');
  try {
    const token         = socket.handshake.auth.token;
    const appointmentId = socket.handshake.auth.appointmentId;

    if (!token) {
      return next(new Error("Authentication failed: token is required"));
    }

    const { verifyAccessToken } = require('./utils/token');
    const User = require('./models/User');

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (tokenErr) {
      return next(new Error("Authentication failed: invalid or expired token"));
    }

    const user = await User.findById(decoded.id).select('_id email role roles');
    if (!user) {
      return next(new Error("Authentication failed: user not found"));
    }

    socket.user = user;

    if (appointmentId) {
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return next(new Error("Appointment not found"));
      }

      const userId = user._id.toString();
      const isParticipant =
        appointment.userId?.toString()  === userId ||
        appointment.doctorId?.toString() === userId;

      if (!isParticipant) {
        return next(new Error("Access denied: you are not a participant in this appointment"));
      }

      socket.appointmentId = appointmentId;
      socket.appointment   = appointment;
    }

    next();
  } catch (error) {
    console.error("Socket authentication error:", error);
    next(new Error("Authentication failed"));
  }
});
```

### Socket.IO Event Handlers

#### 1. Join Personal Notification Room
```javascript
socket.on("joinRoom", (userId) => {
  if (!userId) return;
  const roomId = userId.toString();
  socket.join(roomId);
  console.log(`User ${roomId} joined room`);
});
```

#### 2. Join Chat Room
```javascript
socket.on("join_chat", ({ appointmentId }) => {
  const roomId = `chat_${appointmentId}`;
  socket.join(roomId);
  if (!activeChatRooms.has(roomId)) {
    activeChatRooms.set(roomId, { messages: [], participants: [] });
  }
  const chatRoom = activeChatRooms.get(roomId);
  chatRoom.participants.push(socket.id);
  socket.emit("chat_history", chatRoom.messages);
  socket.to(roomId).emit("user_joined", {
    message: "User joined the chat",
    timestamp: new Date(),
  });
});
```

#### 3. Send Message
```javascript
socket.on("send_message", async ({ appointmentId, message, senderRole, fileUrl }) => {
  const roomId = `chat_${appointmentId}`;
  const msgObj = {
    conversationId: appointmentId,
    from:           socket.user._id,
    to:             null,
    text:           message,
    fileUrl,
    read:           false,
  };

  const ChatMessage = require('./models/ChatMessage');
  const saved = await ChatMessage.create(msgObj);

  io.to(roomId).emit("receive_message", {
    id:         saved._id,
    senderId:   socket.user._id,
    senderRole,
    message,
    fileUrl,
    timestamp:  saved.createdAt,
  });
});
```

#### 4. Typing Indicator
```javascript
socket.on('typing', ({ appointmentId }) => {
  socket.to(`chat_${appointmentId}`).emit('typing', { from: socket.user._id });
});
```

#### 5. Read Receipt
```javascript
socket.on('read', async ({ appointmentId }) => {
  const ChatMessage = require('./models/ChatMessage');
  await ChatMessage.updateMany(
    { conversationId: appointmentId, to: socket.user._id, read: false },
    { read: true }
  );
  io.to(`chat_${appointmentId}`).emit('read', { appointmentId, reader: socket.user._id });
});
```

#### 6. Request Consent (from Doctor to Patient)
```javascript
socket.on('requestConsent', async (data) => {
  // data: { doctorId, patientId, appointmentId, resourceTypes, message }
  // Creates ConsentRequest
  // Sends notification to patient
  // Emits 'consentRequestReceived' to patient's room
  // Logs to audit trail
  // Sends email notification
});
```

#### 7. Disconnect
```javascript
socket.on("disconnect", () => {
  console.log("User disconnected:", socket.id);
  activeChatRooms.forEach((room, roomId) => {
    const index = room.participants.indexOf(socket.id);
    if (index > -1) room.participants.splice(index, 1);
    if (room.participants.length === 0) activeChatRooms.delete(roomId);
  });
});
```

---

## 3. AUTH MIDDLEWARE

**Location:** `server/middleware/authMiddleware.js`

### authenticateUser Middleware
```javascript
const { verifyAccessToken } = require('../utils/token');
const User = require("../models/User");

const authenticateUser = async (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`\n${'='.repeat(80)}`);
  console.log(`[🔐 AUTH MIDDLEWARE] ${timestamp}`);
  
  let token = null;

  // Extract token from Authorization header or cookies
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token || typeof token !== 'string' || !token.trim()) {
    console.error(`[🔐 AUTH MIDDLEWARE] ❌ No valid token provided`);
    return res.status(401).json({
      success: false,
      message: "No token provided. Please login.",
    });
  }

  // Validate JWT structure
  const jwtPattern = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
  
  if (!jwtPattern.test(token)) {
    console.error(`[🔐 AUTH MIDDLEWARE] ❌ Malformed token`);
    return res.status(401).json({
      success: false,
      message: "Malformed token",
    });
  }

  try {
    const decoded = verifyAccessToken(token);
    console.log(`[🔐 AUTH MIDDLEWARE] ✅ JWT verification successful`);
    
    const user = await User.findById(decoded.id);
    
    if (!user) {
      console.error(`[🔐 AUTH MIDDLEWARE] ❌ User not found in database`);
      return res.status(401).json({
        success: false,
        message: "User not found. Invalid token.",
      });
    }

    console.log(`[🔐 AUTH MIDDLEWARE] ✅ User found in database`);
    console.log(`${'='.repeat(80)}\n`);
    
    req.user = user;
    next();
  } catch (err) {
    console.error(`[🔐 AUTH MIDDLEWARE] ❌ ERROR: ${err.message}`);
    return res.status(401).json({
      success: false,
      message: "Authentication failed. Invalid token.",
    });
  }
};
```

### isadmin Middleware
```javascript
const isadmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    // Support both roles array (new schema) and role string (old schema)
    const userRoles = Array.isArray(req.user.roles)
      ? req.user.roles.map(r => r.toLowerCase())
      : [(req.user.role || "").toLowerCase()];

    if (!userRoles.includes("admin")) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admins only.",
      });
    }

    next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
```

### isDoctor Middleware
```javascript
const Doctor = require("../models/Doctor");

const isDoctor = async (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`\n${'='.repeat(80)}`);
  console.log(`[👨‍⚕️ DOCTOR-AUTH MIDDLEWARE] ${timestamp}`);
  
  try {
    if (!req.user) {
      console.error(`[👨‍⚕️ DOCTOR-AUTH MIDDLEWARE] ❌ No user found in request`);
      return res.status(401).json({
        success: false,
        message: "Not authenticated"
      });
    }

    // Support both roles array and role string
    const userRoles = Array.isArray(req.user.roles)
      ? req.user.roles.map(r => r.toLowerCase())
      : [(req.user.role || "").toLowerCase()];

    if (!userRoles.includes("doctor")) {
      console.error(`[👨‍⚕️ DOCTOR-AUTH MIDDLEWARE] ❌ User does not have 'doctor' role`);
      return res.status(403).json({
        success: false,
        message: "Access denied. Doctor only."
      });
    }

    // Fetch doctor profile
    const doctor = await Doctor.findOne({ user: req.user.id });

    if (!doctor) {
      console.error(`[👨‍⚕️ DOCTOR-AUTH MIDDLEWARE] ❌ Doctor profile not found`);
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found. Please complete your doctor registration."
      });
    }

    console.log(`[👨‍⚕️ DOCTOR-AUTH MIDDLEWARE] ✅ Doctor profile found`);
    console.log(`${'='.repeat(80)}\n`);

    // Attach doctor to request
    req.doctor = doctor;
    next();
  } catch (error) {
    console.error(`[👨‍⚕️ DOCTOR-AUTH MIDDLEWARE] ❌ ERROR: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Server error in doctor verification"
    });
  }
};
```

### Export
```javascript
module.exports = {
  authenticateUser,
  isadmin,
  isDoctor,
};
```

---

## 4. ROUTE FILES INDEX

**Location:** `server/routes/`

| File | Purpose | Authentication |
|------|---------|-----------------|
| `Admin.js` | Admin management endpoints | ✅ authenticateUser + isadmin |
| `AdminAnalytics.js` | Admin analytics & reporting | ✅ authenticateUser + isadmin |
| `AI.js` | AI-powered endpoints | ✅ authenticateUser |
| `Auth.js` | Authentication (signup, login, refresh) | ❌ None / Conditional |
| `ConsentApi.js` | Consent management | ✅ authenticateUser |
| `Doctor.js` | Doctor profile & appointment management | ✅ authenticateUser + isDoctor |
| `fhir.js` | FHIR API endpoints (medical records) | ✅ authenticateUser + consent middleware |
| `Hospital.js` | Hospital management | ✅ authenticateUser |
| `Notification.js` | Notification endpoints | ✅ authenticateUser |
| `oauth.js` | OAuth authentication | ❌ None |
| `Payment.js` | Payment processing | ✅ authenticateUser |
| `Registration.js` | User registration | ❌ None |
| `UserRequests.js` | User appointment requests | ✅ authenticateUser |

---

## 5. SAMPLE ROUTE PATTERN

**Location:** `server/routes/Auth.js`

```javascript
const express = require("express");
const router = express.Router();

const { signup, login, sendotp, doctorregistration, refresh, logout, getDoctorRegistrationStatus } = require("../Controllers/Auth");
const { authenticateUser, isDoctor  } = require("../middleware/authMiddleware");
const { loginLimiter, signupLimiter } = require('../middleware/rateLimiter');
const { signupValidation, loginValidation } = require('../middleware/validation');

const {
  getUserProfile,
  getDoctorProfile,
  updateUserProfile,
  updateDoctorProfile,
  updateuserDisplayPicture,
  updatedoctorDisplayPicture
} = require("../Controllers/Profile");

const { searchdoctors } = require("../Controllers/Displaydoctors");

const {
  requestAppointment,
  approveAppointment,
  rejectAppointment,
  getuserappointmentsrequeste,
  getuserappointmentsrequestefordoctor
} = require("../Controllers/ManageAppoinment");

const { createOrder, verifyPayment } = require("../Controllers/Payment");

// ============================================
// PAYMENT ROUTES
// ============================================
router.post("/create-order", authenticateUser, createOrder);
router.post("/verify-payment", authenticateUser, verifyPayment);

// ============================================
// AUTH ROUTES (No Authentication)
// ============================================
router.post("/signup", signupLimiter, signupValidation, signup);
router.post("/login", loginLimiter, loginValidation, login);
router.post("/sendotp", sendotp);
router.post('/refresh', refresh);
router.post('/logout', authenticateUser, logout);

// ============================================
// DOCTOR REGISTRATION ROUTES
// ============================================
router.post("/doctorregistration", authenticateUser, doctorregistration);
router.get("/doctorregistration/status", authenticateUser, getDoctorRegistrationStatus);
router.get("/doctor-registration/status", authenticateUser, getDoctorRegistrationStatus);

// ============================================
// USER PROFILE ROUTES
// ============================================
router.get("/userprofile", authenticateUser, getUserProfile);
router.put("/edituserProfile", authenticateUser, updateUserProfile);
router.put("/updateuserprofilepicture", authenticateUser, updateuserDisplayPicture);

// ============================================
// DOCTOR PROFILE ROUTES
// ============================================
router.get("/doctorprofile/:doctorId", getDoctorProfile);
router.put("/doctorprofile/:doctorId/editprofile", updateDoctorProfile);
router.put("/updatedoctorprofilepicture", authenticateUser, updatedoctorDisplayPicture);

// ============================================
// SEARCH ROUTES
// ============================================
router.post("/searchdoctors", authenticateUser, searchdoctors);

// ============================================
// APPOINTMENT ROUTES
// ============================================
router.post("/appointment/request/:doctorId", authenticateUser, requestAppointment);
router.get("/appointments/user", authenticateUser, getuserappointmentsrequeste);
router.get("/appointments/doctor/:doctorId", authenticateUser, getuserappointmentsrequestefordoctor);
router.put("/appointment/approve/:appointmentId", authenticateUser, isDoctor, approveAppointment);
router.put("/appointment/reject/:appointmentId", authenticateUser, isDoctor, rejectAppointment);

module.exports = router;
```

### Route Pattern Analysis

**Standard Pattern:**
```javascript
router.[METHOD]([path], [middleware1], [middleware2], [controller]);
```

**Examples:**

1. **No Authentication (Public)**
   ```javascript
   router.post("/signup", signupLimiter, signupValidation, signup);
   ```

2. **Authenticated User Only**
   ```javascript
   router.get("/userprofile", authenticateUser, getUserProfile);
   ```

3. **Doctor Only**
   ```javascript
   router.put("/appointment/approve/:appointmentId", authenticateUser, isDoctor, approveAppointment);
   ```

4. **Admin Only**
   ```javascript
   router.get("/admin/users", authenticateUser, isadmin, getAllUsers);
   ```

5. **With Validation & Rate Limiting**
   ```javascript
   router.post("/login", loginLimiter, loginValidation, login);
   ```

---

## 6. MIDDLEWARE STACK REFERENCE

### Global Middleware Order (from index.js)

```javascript
// 1. Security Headers
app.use(helmet({ ... }));

// 2. CORS
app.use(cors({ ... }));

// 3. Session Management
app.use(session({ ... }));

// 4. File Upload
app.use(fileUpload({ ... }));

// 5. Body Parser
app.use(express.json());

// 6. Cookie Parser
app.use(cookieParser());

// 7. Mongo Sanitization
app.use((req, res, next) => { mongoSanitize(...) });

// 8. XSS Protection
app.use((req, res, next) => { xssClean(...) });

// 9. Request Logging
app.use((req, res, next) => { console.log(...) });

// 10. Routes
app.use("/api/v1", Auth);
app.use("/api/v1", Doctor);
// ... etc

// 11. PHI Sanitizer
app.use(phiSanitizer);

// 12. Error Handler
app.use(errorHandler);
```

### Route-Level Middleware Stack

Typically used in order:
```javascript
[authenticateUser, isDoctor, isadmin, consentMiddleware, auditLogger]
```

**Common Combinations:**

| Use Case | Middleware Stack |
|----------|-----------------|
| Public endpoint | None |
| User endpoint | `authenticateUser` |
| Doctor endpoint | `authenticateUser`, `isDoctor` |
| Admin endpoint | `authenticateUser`, `isadmin` |
| Doctor accessing patient data | `authenticateUser`, `isDoctor`, `consentMiddleware` |
| FHIR endpoint | `authenticateUser`, `consentMiddleware`, `auditLogger` |

---

## KEY NAMING PATTERNS

### Controllers
- Location: `server/Controllers/[Feature].js`
- Pattern: `async function [action]Appointment(req, res) { ... }`
- Example: `requestAppointment`, `approveAppointment`, `rejectAppointment`

### Routes
- Location: `server/routes/[Feature].js`
- Pattern: `router.[METHOD]([path], [middleware], [controller])`
- Example: `POST /appointment/request/:doctorId`

### Models
- Location: `server/models/[Model].js`
- Pattern: `mongoose.model("ModelName", SchemaName)`
- Example: `Appointment`, `Doctor`, `User`, `ConsentRequest`

### Middleware
- Location: `server/middleware/[middleware].js`
- Pattern: `async (req, res, next) => { ... }`
- Example: `authenticateUser`, `isDoctor`, `consentMiddleware`

---

## ENVIRONMENT VARIABLES REFERENCED

```env
NODE_ENV=development|production
PORT=4000
CLIENT_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000
SESSION_SECRET=clinicall-session-secret
FIELD_ENC_KEY=your-encryption-key
JWT_SECRET=your-jwt-secret
REACT_APP_BASE_URL=http://localhost:3000
```

---

**Last Updated:** March 16, 2026
