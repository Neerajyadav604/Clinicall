// ============================================
// ENVIRONMENT SETUP (must be first)
// ============================================
const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '.env'),
  override: false,
});
process.env.SUPPRESS_DOTENV_LOG = 'true';

// ============================================
// STARTUP VERIFICATION
// ============================================
process.stdout.write('\n\n🚀 [STARTUP] Server process started at ' + new Date().toISOString() + '\n');
process.stdout.write('🔧 [STARTUP] Node version: ' + process.version + '\n');
process.stdout.write('📍 [STARTUP] Working directory: ' + process.cwd() + '\n');
process.stdout.write('✅ [STARTUP] Environment loaded\n');

// ============================================
// CORE NODE / FRAMEWORK IMPORTS
// ============================================
const http        = require("http");
const os          = require("os");
const EventEmitter = require('events');

const express     = require("express");
const socketIo    = require("socket.io");

// ============================================
// THIRD-PARTY MIDDLEWARE IMPORTS
// ============================================
const helmet          = require('helmet');
const cors            = require("cors");
const cookieParser    = require('cookie-parser');
const session         = require('express-session');
// ✅ FIX: Removed global fileUpload import - not needed, using multer in routes instead
// const fileUpload      = require("express-fileupload");
const mongoSanitize   = require('express-mongo-sanitize');
const { clean: xssClean } = require('xss-clean/lib/xss');

// ============================================
// INTERNAL CONFIG / UTILITY IMPORTS
// ============================================
const connectDb           = require('./config/Database');
const { connectCloudinary } = require('./config/Cloudinary');

// ============================================
// ROUTE IMPORTS
// ============================================
const Auth              = require("./routes/Auth");
const Doctor            = require("./routes/Doctor");
const UserRequests      = require("./routes/UserRequests");
const Payment           = require("./routes/Payment");
const Registration      = require("./routes/Registration");
const Admin             = require("./routes/Admin");
const Hospital          = require("./routes/Hospital");
const AI                = require("./routes/AI");
const NotificationRoutes = require("./routes/Notification");
const OAuth             = require("./routes/oauth");
const consultationRoutes = require("./routes/consultation.routes");

// ============================================
// APP & SERVER INIT
// ============================================
const app    = express();
const server = http.createServer(app);

const PORT      = process.env.PORT || 4000;
const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

// ============================================
// SOCKET.IO INIT
// ============================================
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

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// ✅ SECURITY: Generate nonce for CSP to replace unsafe-inline
const cspNonceGenerator = (req, res, next) => {
  const crypto = require('crypto');
  res.locals.nonce = crypto.randomBytes(16).toString('hex');
  next();
};
app.use(cspNonceGenerator);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // ✅ Use nonce for inline scripts instead of unsafe-inline
      scriptSrc:  ["'self'", (req, res) => `'nonce-${res.locals.nonce}'`],
      // ✅ Use nonce for inline styles instead of unsafe-inline
      styleSrc:   ["'self'", (req, res) => `'nonce-${res.locals.nonce}'`],
      imgSrc:     ["'self'", "data:", "https:", "https://res.cloudinary.com"],
      fontSrc:    ["'self'", "data:"],
      connectSrc: ["'self'", "https:"],
      frameSrc:   ["'self'"],
    },
  },
  crossOriginResourcePolicy: { policy: "same-site" },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

app.use(cors({
  origin: [
    'http://localhost:3000',    // React dev server
    'http://127.0.0.1:3000',   // Playwright sometimes uses 127.0.0.1
    process.env.CLIENT_URL,     // From .env if set
    process.env.FRONTEND_URL    // Alternative env var
  ].filter(Boolean),
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ============================================
// GENERAL MIDDLEWARE
// ============================================
// ✅ SECURITY: Session secret must be set, no fallback allowed
if (!process.env.SESSION_SECRET) {
  throw new Error('FATAL: SESSION_SECRET environment variable is required');
}

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 2 * 60 * 60 * 1000, // ✅ 2 hours (7200000ms)
  },
}));

// ✅ FIX: Removed global express-fileupload middleware
// It conflicts with multer in consultation routes
// Each route that needs file upload uses multer directly
// app.use(fileUpload({ useTempFiles: true, tempFileDir: os.tmpdir() }));

app.use(express.json({ type: ['application/json', 'application/fhir+json'] }));
app.use(cookieParser());

// ============================================
// SANITIZATION MIDDLEWARE
// ============================================

// Mongo sanitize — skip req.query (getter-only in newer Node/Express)
// allowDots: true preserves ICD-10 codes like "J06.9"
app.use((req, res, next) => {
  if (req.body)   req.body   = mongoSanitize.sanitize(req.body,   { allowDots: true });
  if (req.params) req.params = mongoSanitize.sanitize(req.params, { allowDots: true });
  next();
});

// XSS clean — mutate req.query in-place to avoid getter-only TypeError
app.use((req, res, next) => {
  if (req.body)   req.body   = xssClean(req.body);
  if (req.params) req.params = xssClean(req.params);
  if (req.query) {
    const cleaned = xssClean(req.query);
    Object.assign(req.query, cleaned);
  }
  next();
});

// ============================================
// REQUEST LOGGING MIDDLEWARE
// ============================================
app.use((req, res, next) => {
  if (req.path.includes('/fhir/') && req.method === 'POST') {
    console.log('📨 FHIR POST:', req.path);
  }
  next();
});

// ============================================
// EXTERNAL SERVICES
// ============================================
connectCloudinary();
console.log('✅ [STARTUP] Cloudinary connected');

// ============================================
// DATABASE READINESS SYSTEM
// ============================================
const dbReadyEmitter = new EventEmitter();
let dbReady = false;
let dbError = null;

// Attempt DB connection in the background
(async () => {
  try {
    process.stdout.write("✅ [STARTUP] Attempting DB connection...\n");
    await connectDb();
    dbReady = true;
    dbError = null;
    process.stdout.write('\n✅ [STARTUP] Database connected successfully\n\n');
    dbReadyEmitter.emit('ready');
  } catch (err) {
    dbReady = false;
    dbError = err.message;
    process.stderr.write("❌ [STARTUP] Database connection failed: " + err.message + "\n");
    process.stderr.write("    FHIR and dependent routes will return 503 until DB is ready\n");
    setTimeout(() => {
      process.stdout.write("🔄 [STARTUP] Retrying database connection...\n");
      dbReadyEmitter.emit('retry');
    }, 10000);
  }
})();

// Helper: wait for DB to be ready (with timeout)
const waitForDb = (timeoutMs = 30000) => {
  return new Promise((resolve, reject) => {
    if (dbReady) { resolve(); return; }

    const timeout = setTimeout(() => {
      reject(new Error('Database connection timeout'));
    }, timeoutMs);

    const onReady = () => {
      clearTimeout(timeout);
      dbReadyEmitter.removeListener('ready', onReady);
      resolve();
    };

    dbReadyEmitter.once('ready', onReady);
  });
};

// ============================================
// ROOT ROUTE
// ============================================
app.get("/", (req, res) => {
  res.send("Hello Express!");
});

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================
app.get('/health', (req, res) => {
  const health = {
    status:   dbReady ? 'healthy'      : 'degraded',
    timestamp: new Date().toISOString(),
    database: dbReady ? 'connected'    : 'disconnected',
    fhir:     dbReady ? 'ready'        : 'waiting-for-db',
  };
  if (dbError) health.dbError = dbError;
  res.status(dbReady ? 200 : 503).json(health);
});
console.log('✅ [STARTUP] Health check endpoint registered at /health');

// ============================================
// STATIC FILE SERVING FOR UPLOADS
// ============================================
// ✅ FIX: Serve uploaded medical records and other files
const uploadsDir = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));
console.log('✅ [STARTUP] Static file serving configured for:', uploadsDir);

// ============================================
// STANDARD ROUTES (no DB guard required)
// ============================================
app.use("/api/v1",               Auth);
app.use("/api/v1",               Doctor);
app.use("/api/v1",               UserRequests);
app.use("/api/v1",               Payment);
app.use("/api/v1",               Registration);
app.use("/api/v1",               NotificationRoutes);
app.use("/api/v1",               consultationRoutes);
app.use("/api/v1",               Hospital);
app.use("/api/v1/admin",         Admin);
app.use("/api/v1/admin/analytics", require('./routes/AdminAnalytics'));
app.use("/api/v1/ai",            AI);
app.use("/api/v1/consent",       require('./routes/ConsentApi'));
app.use("/auth/fhir",            OAuth);
console.log('✅ [STARTUP] Standard routes loaded');

// ============================================
// FHIR ROUTE — ASYNC REGISTRATION
// ============================================
let fhirRouteLoaded = false;
let fhirRoute       = null;

// Load FHIR module in background without blocking the main thread
const loadFhirRouteAsync = () => {
  process.stdout.write('⚙️  [STARTUP] Pre-loading FHIR route in background...\n');

  setTimeout(() => {
    try {
      process.stdout.write('⏳ [STARTUP] Parsing FHIR route module...\n');
      const loadStart = Date.now();
      fhirRoute = require('./routes/fhir');
      process.stdout.write(`✅ [STARTUP] FHIR route parsed successfully (${Date.now() - loadStart}ms)\n`);
      fhirRouteLoaded = true;
    } catch (err) {
      process.stdout.write('❌ [CRITICAL] Failed to load FHIR route:\n');
      process.stdout.write('   Error: ' + err.message + '\n');
    }
  }, 100);
};

// Register FHIR route once both DB and module are ready
const registerFhirRoute = () => {
  if (fhirRouteLoaded && fhirRoute) {
    try {
      const fhirDbReadyMiddleware = (req, res, next) => {
        if (!dbReady) {
          return res.status(503).json({
            resourceType: 'OperationOutcome',
            issue: [{
              severity:    'error',
              code:        'unavailable',
              diagnostics: 'Database connection not ready. Please try again in a few seconds.',
            }],
          });
        }
        next();
      };

      app.use("/api/v1/fhir/R4", fhirDbReadyMiddleware, fhirRoute);
      process.stdout.write('✅ [SUCCESS] FHIR route registered at /api/v1/fhir/R4\n');
    } catch (err) {
      process.stdout.write('❌ [CRITICAL] Failed to register FHIR route: ' + err.message + '\n');
    }
    return;
  }

  // Module not ready yet — retry
  process.stdout.write('⏳ [STARTUP] Waiting for FHIR route to finish loading...\n');
  setTimeout(registerFhirRoute, 500);
};

// Kick off FHIR loading immediately
loadFhirRouteAsync();

// Register once DB emits 'ready'
dbReadyEmitter.on('ready', () => {
  console.log('🎉 [STARTUP] Database is ready - scheduling FHIR route registration...');
  registerFhirRoute();
});

// Edge-case: DB was already ready synchronously
if (dbReady) {
  console.log('📍 [TRACE] Database was already ready - scheduling FHIR immediately');
  registerFhirRoute();
} else {
  console.log('⏳ [STARTUP] Waiting for database connection before registering FHIR...');
}

// ============================================
// PHI SANITIZER MIDDLEWARE (after routes, before error handler)
// ============================================
console.log('📍 [TRACE] Requiring phiSanitizer...');
const phiSanitizer = require('./middleware/phiSanitizer');
console.log('📍 [TRACE] phiSanitizer loaded');
app.use(phiSanitizer);

// ============================================
// GLOBAL ERROR HANDLER
// ============================================
console.log('📍 [TRACE] Requiring errorHandler...');
const errorHandler = require('./middleware/errorHandler');
console.log('📍 [TRACE] errorHandler loaded');
app.use(errorHandler);

// ============================================
// SOCKET.IO — AUTH MIDDLEWARE
// ============================================
console.log('📍 [TRACE] Initializing Socket.IO...');

const Appointment    = require("./models/Appointment");
const activeChatRooms = new Map();

console.log('📍 [TRACE] Appointment model loaded');
console.log('📍 [TRACE] Registering Socket.IO middleware...');

io.use(async (socket, next) => {
  console.log('📍 [TRACE] Socket.IO auth middleware called');
  try {
    const token         = socket.handshake.auth.token;
    const appointmentId = socket.handshake.auth.appointmentId;

    if (!token || typeof token !== 'string') {
      return next(new Error("Authentication failed: token is required and must be a string"));
    }

    // ✅ SECURITY: Validate JWT format before attempting verification
    // JWT format: header.payload.signature (3 parts separated by dots)
    const parts = token.split('.');
    if (parts.length !== 3 || parts.some(part => !part)) {
      return next(new Error("Authentication failed: invalid token format"));
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

// ============================================
// SOCKET.IO — EVENT HANDLERS
// ============================================

// ✅ SECURITY: Helper function to mask sensitive data in logs
const maskSensitiveData = (str) => {
  if (!str || typeof str !== 'string') return str;
  // Mask ObjectId-like strings (24 hex chars)
  return str.replace(/[0-9a-f]{24}/gi, (match) => 'xxx' + match.slice(-3));
};
io.on("connection", (socket) => {
  // ✅ SECURITY: Don't log full socket.id, just indicate connection
  console.log("🔌 Client connected");

  // --- Authenticate for specific appointment ---
  socket.on("authenticate_appointment", async ({ appointmentId }) => {
    try {
      if (!appointmentId) {
        return socket.emit("error", "Appointment ID is required");
      }

      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return socket.emit("error", "Appointment not found");
      }

      const userId = socket.user._id.toString();
      const isParticipant =
        appointment.userId?.toString()  === userId ||
        appointment.doctorId?.toString() === userId;

      if (!isParticipant) {
        return socket.emit("error", "Access denied: you are not a participant in this appointment");
      }

      // Set appointment context on socket
      socket.appointmentId = appointmentId;
      socket.appointment = appointment;
      
      console.log("✅ Socket authenticated for appointment");
      socket.emit("appointment_authenticated", { success: true });
    } catch (error) {
      console.error("Error authenticating appointment:", error);
      socket.emit("error", "Failed to authenticate appointment");
    }
  });

  // --- Personal notification room ---
  socket.on("joinRoom", (userId) => {
    if (!userId) return;
    const roomId = userId.toString();
    socket.join(roomId);
    // ✅ SECURITY: Don't log userId/roomId directly
    console.log("📢 Client joined notification room");
  });

  // --- Chat room ---
  socket.on("join_chat", ({ appointmentId }) => {
    try {
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

      // ✅ SECURITY: Don't log appointment IDs or socket details
      console.log("💬 Client joined chat room");
    } catch (error) {
      console.error("Error joining chat:", error);
      socket.emit("error", "Failed to join chat");
    }
  });

  // --- Send message ---
  socket.on("send_message", async ({ appointmentId, message, senderRole, fileUrl }) => {
    try {
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

      // ✅ SECURITY: Don't log message content, appointmentId, or user IDs
      console.log("📤 Message sent in chat");
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("error", "Failed to send message");
    }
  });

  // --- Typing indicator ---
  socket.on('typing', ({ appointmentId }) => {
    // ✅ SECURITY: Don't log appointmentId or user IDs
    socket.to(`chat_${appointmentId}`).emit('typing', { from: socket.user._id });
  });

  // --- Read receipt ---
  socket.on('read', async ({ appointmentId }) => {
    try {
      const ChatMessage = require('./models/ChatMessage');
      await ChatMessage.updateMany(
        { conversationId: appointmentId, to: socket.user._id, read: false },
        { read: true }
      );
      io.to(`chat_${appointmentId}`).emit('read', { appointmentId, reader: socket.user._id });
    } catch (err) {
      console.error('Error updating read status', err);
    }
  });

  // --- Consent request ---
  socket.on('requestConsent', async (data) => {
    // ✅ SECURITY: Removed detailed logging with sensitive IDs, emails, and personal information
    if (process.env.NODE_ENV === 'development') {
      console.log('[SOCKET] requestConsent event received');
    }

    try {
      const ConsentRequest              = require('./models/ConsentRequest');
      const User                        = require('./models/User');
      const mailSender                  = require('./utils/mailSender');
      const generateConsentRequestEmail = require('./utils/emailTemplates/consentRequestEmail');
      const { logFHIRAccess }           = require('./middleware/auditLogger');
      const { sendNotification }        = require('./utils/sendNotification');

      // 1. Save ConsentRequest
      const savedRequest = await ConsentRequest.create({
        doctor_ref:      data.doctorId,
        patient_ref:     data.patientId,
        appointment_ref: data.appointmentId || null,
        resourceTypes:   data.resourceTypes,
        message:         data.message || '',
        status:          'pending',
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('[SOCKET] ConsentRequest created');
      }

      // 2. Fetch patient and doctor
      const patient = await User.findById(data.patientId).select('email fullName');
      const doctor  = await User.findById(data.doctorId).select('fullName');

      if (!patient || !doctor) {
        console.error('[SOCKET] Patient or doctor not found in requestConsent');
        return;
      }

      // 3. Notify patient
      await sendNotification({
        recipient: data.patientId,
        type:      'CONSENT_REQUEST',
        title:     `Consent Request from Dr. ${doctor.fullName || 'Doctor'}`,
        message:   `Dr. ${doctor.fullName} is requesting access to your ${data.resourceTypes.join(', ')} records.`,
      });

      // 4. Emit to patient's socket room
      io.to(data.patientId.toString()).emit('consentRequestReceived', {
        requestId:     savedRequest._id,
        doctorId:      data.doctorId,
        doctorName:    doctor.fullName,
        resourceTypes: data.resourceTypes,
        message:       data.message,
        appointmentId: data.appointmentId,
        createdAt:     savedRequest.createdAt,
      });

      // 5. Audit log
      await logFHIRAccess({
        userId:       data.doctorId,
        role:         'doctor',
        action:       'CONSENT_REQUEST',
        resourceType: 'Consent',
        resourceId:   savedRequest._id,
        patientId:    data.patientId,
        ipAddress:    socket.handshake.address,
        userAgent:    socket.handshake.headers['user-agent'],
        success:      true,
      });

      // 6. Send email (non-fatal)
      try {
        await mailSender(
          patient.email,
          `Dr. ${doctor.fullName} is requesting access to your medical records`,
          generateConsentRequestEmail({
            patientName:      patient.fullName,
            doctorName:       doctor.fullName,
            resourceTypes:    data.resourceTypes,
            message:          data.message,
            consentRequestId: savedRequest._id,
            appUrl:           process.env.REACT_APP_BASE_URL,
          })
        );
        
        if (process.env.NODE_ENV === 'development') {
          console.log('[SOCKET] Email sent successfully');
        }

        // 7. Audit log email send
        await logFHIRAccess({
          userId:       data.doctorId,
          role:         'doctor',
          action:       'CONSENT_REQUEST_EMAIL',
          resourceType: 'Consent',
          resourceId:   savedRequest._id,
          patientId:    data.patientId,
          ipAddress:    socket.handshake.address,
          userAgent:    socket.handshake.headers['user-agent'],
          success:      true,
        });
      } catch (emailErr) {
        // ✅ SECURITY: Don't log email error details
        console.error('[SOCKET] Consent request email send failed (non-fatal)');
      }

    } catch (err) {
      // ✅ SECURITY: Log error but WITHOUT sensitive user data or stack traces that could expose internals
      console.error('[SOCKET] requestConsent handler error:', {
        errorType: err.constructor.name,
        message: err.message,
        // Don't log: stack trace, data received, user IDs, socket IDs, or full error object
      });
    }
  });

  // ============================================
  // CONSULTATION SESSION SOCKET EVENTS
  // ============================================

  /**
   * Join consultation room
   * Allows user to receive real-time updates during consultation
   */
  socket.on("join_consultation", ({ appointmentId }) => {
    const roomId = `consultation_${appointmentId}`;
    socket.join(roomId);
    // ✅ SECURITY: Don't log appointmentId, socket.id, or full room identifier
    if (process.env.NODE_ENV === 'development') {
      console.log('[CONSULTATION] Client joined consultation room');
    }
    
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
    // ✅ SECURITY: Don't log appointmentId, socket.id, or full room identifier
    if (process.env.NODE_ENV === 'development') {
      console.log('[CONSULTATION] Client left consultation room');
    }
  });

  // --- Disconnect ---
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    activeChatRooms.forEach((room, roomId) => {
      const index = room.participants.indexOf(socket.id);
      if (index > -1) room.participants.splice(index, 1);
      if (room.participants.length === 0) activeChatRooms.delete(roomId);
    });
  });

  // --- Socket error ---
  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });
});

// ============================================
// SCHEDULED JOBS (deferred)
// ============================================
console.log('ℹ️  [STARTUP] Cron/scheduled jobs deferred (disabled for startup speed)');

// ============================================
// START SERVER
// ============================================
console.log(`⏳ [STARTUP] Server initializing on port ${PORT}...`);
server.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🚀========================================`);
  console.log(`✅✅✅  SERVER RUNNING ON PORT ${PORT}  ✅✅✅`);
  console.log(`🚀========================================\n`);
});

server.on('error', (err) => {
  console.error(`❌ [STARTUP] Server error: ${err.message}`);
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  }
  process.exit(1);
});

// ============================================
// GLOBAL PROCESS ERROR HANDLERS
// ============================================
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ [ERROR] Unhandled Promise Rejection');
  console.error('   Promise:', promise);
  console.error('   Reason:',  reason);
  if (reason instanceof Error) console.error('   Stack:', reason.stack);
});

process.on('uncaughtException', (error) => {
  console.error('❌ [CRITICAL] Uncaught Exception:');
  console.error('   Message:', error.message);
  console.error('   Stack:',   error.stack);
  console.error('\n❌ SERVER IS SHUTTING DOWN DUE TO UNCAUGHT EXCEPTION');
  console.error('   Please check logs and restart the server.\n');
  process.exit(1);
});

process.on('warning', (warning) => {
  console.warn('⚠️  [WARNING] Node.js Warning:');
  console.warn('   Name:',    warning.name);
  console.warn('   Message:', warning.message);
  if (warning.stack) console.warn('   Stack:', warning.stack);
});