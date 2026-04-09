// ─────────────────────────────────────────────────────────────────────────────
// REST endpoint:   GET /api/v1/consultation/video-token/:appointmentId
// Socket events:   Registered via registerVideoCallSocket(io)
//
// HOW TO PLUG IN (server/index.js):
//
//   const videoCallRoutes = require('./routes/videoCall.routes');
//   const { registerVideoCallSocket } = require('./routes/videoCall.routes');
//
//   app.use("/api/v1", videoCallRoutes.router);
//
//   // Inside io.on("connection", (socket) => { ... }) — ADD THIS LINE:
//   registerVideoCallSocket(io, socket);
// ─────────────────────────────────────────────────────────────────────────────

const express = require("express");
const router  = express.Router();
const { authenticateUser } = require("../middleware/authMiddleware");
const { generateJitsiToken } = require("../utils/jitsiToken");
const Appointment = require("../models/Appointment");

// ── In-memory active video calls tracker ─────────────────────────────────────
// Key: appointmentId  Value: { startedBy, startedAt, participants: Set }
// NOTE: Replace with Redis if you run multiple server instances
const activeVideoCalls = new Map();

// ─────────────────────────────────────────────────────────────────────────────
// REST: GET /api/v1/consultation/video-token/:appointmentId
// Returns a signed JaaS JWT. Only appointment participants can get a token.
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  "/consultation/video-token/:appointmentId",
  authenticateUser,  // your existing middleware — sets req.user
  async (req, res) => {
    const FUNC = "[🎥 VideoCall Token]";
    const startTime = Date.now();
    console.log(`\n${'='.repeat(100)}`);
    console.log(`${FUNC} ⏱️  TOKEN ENDPOINT HIT`);
    console.log(`${FUNC} ═══════════════════════════════════════════════════════════════════════════════════════`);
    
    try {
      const { appointmentId } = req.params;
      
      console.log(`${FUNC} [1/7] REQUEST DETAILS:`);
      console.log(`${FUNC}   - appointmentId: "${appointmentId}"`);
      console.log(`${FUNC}   - requester: ${req.user?._id} (${req.user?.email})`);
      console.log(`${FUNC}   - requester role: ${req.user?.role}`);
      console.log(`${FUNC}   - IP: ${req.ip}`);
      console.log(`${FUNC}   - Timestamp: ${new Date().toISOString()}`);

      console.log(`${FUNC} [2/7] ENV CONFIG CHECK:`);
      console.log(`${FUNC}   - JAAS_APP_ID: ${process.env.JAAS_APP_ID ? '✅ SET' : '❌ MISSING'}`);
      console.log(`${FUNC}   - JAAS_KID: ${process.env.JAAS_KID ? '✅ SET' : '❌ MISSING'}`);
      console.log(`${FUNC}   - JAAS_PRIVATE_KEY: ${process.env.JAAS_PRIVATE_KEY ? '✅ SET (length: ' + process.env.JAAS_PRIVATE_KEY.length + ')' : '❌ MISSING'}`);
      
      if (!process.env.JAAS_APP_ID || !process.env.JAAS_KID || !process.env.JAAS_PRIVATE_KEY) {
        console.error(`${FUNC} ❌ CRITICAL: Missing Jitsi credentials in environment variables`);
        return res.status(500).json({
          success: false,
          message: "Video call service not configured",
          debug: { missing: !process.env.JAAS_APP_ID ? 'JAAS_APP_ID' : !process.env.JAAS_KID ? 'JAAS_KID' : 'JAAS_PRIVATE_KEY' }
        });
      }

      console.log(`${FUNC} [3/7] APPOINTMENT LOOKUP:`);
      const appointment = await Appointment.findById(appointmentId);
      console.log(`${FUNC}   - Found: ${appointment ? '✅ YES' : '❌ NO'}`);
      
      if (!appointment) {
        console.error(`${FUNC} ❌ Appointment not found for ID: ${appointmentId}`);
        return res.status(404).json({
          success: false,
          message: "Appointment not found",
          debug: { appointmentId, searched: appointmentId }
        });
      }

      console.log(`${FUNC}   - Appointment Status: ${appointment.status}`);
      console.log(`${FUNC}   - Payment Status: ${appointment.paymentStatus}`);
      console.log(`${FUNC}   - Consultation Status: ${appointment.consultationStatus}`);
      console.log(`${FUNC}   - Patient (userId): ${appointment.userId}`);
      console.log(`${FUNC}   - Doctor (doctorId): ${appointment.doctorId}`);
      console.log(`${FUNC}   - Appointment Date: ${appointment.appointmentDate}`);
      console.log(`${FUNC}   - Appointment Time: ${appointment.appointmentTime}`);
      console.log(`${FUNC}   - Created: ${appointment.createdAt}`);

      console.log(`${FUNC} [4/7] PARTICIPANT VERIFICATION:`);
      const userId = req.user._id.toString();
      const isPatient = appointment.userId?.toString() === userId;
      const isDoctor = appointment.doctorId?.toString() === userId;
      console.log(`${FUNC}   - Requester ID: ${userId}`);
      console.log(`${FUNC}   - Is Patient: ${isPatient ? '✅ YES' : '❌ NO'}`);
      console.log(`${FUNC}   - Is Doctor: ${isDoctor ? '✅ YES' : '❌ NO'}`);
      
      if (!isPatient && !isDoctor) {
        console.error(`${FUNC} ❌ ACCESS DENIED: User ${userId} is neither patient nor doctor`);
        return res.status(403).json({
          success: false,
          message: "Access denied. Only appointment participants can join video calls.",
          debug: { userId, scheduledPatient: appointment.userId, scheduledDoctor: appointment.doctorId }
        });
      }

      console.log(`${FUNC} [5/7] ELIGIBILITY CHECK:`);
      const isPaid = appointment.paymentStatus === "paid";
      const isScheduled = appointment.status === "SCHEDULED";
      console.log(`${FUNC}   - Payment Status "paid": ${isPaid ? '✅ YES' : `❌ NO (actual: ${appointment.paymentStatus})`}`);
      console.log(`${FUNC}   - Appointment Status "SCHEDULED": ${isScheduled ? '✅ YES' : `❌ NO (actual: ${appointment.status})`}`);

      if (!isPaid || !isScheduled) {
        console.error(`${FUNC} ❌ INELIGIBLE: Payment=${appointment.paymentStatus}, Status=${appointment.status}`);
        return res.status(403).json({
          success: false,
          message: "Video call is only available for scheduled and paid appointments",
          debug: {
            paymentStatus: appointment.paymentStatus,
            appointmentStatus: appointment.status,
            expectedPayment: "paid",
            expectedStatus: "SCHEDULED"
          }
        });
      }

      console.log(`${FUNC} [6/7] TOKEN GENERATION:`);
      try {
        const jitsiData = generateJitsiToken(req.user, appointmentId);
        console.log(`${FUNC}   - Token Generated: ✅ YES`);
        console.log(`${FUNC}   - Room Name: ${jitsiData.roomName}`);
        console.log(`${FUNC}   - Domain: ${jitsiData.domain}`);
        console.log(`${FUNC}   - Token Expiry: ${jitsiData.expiresAt ? new Date(jitsiData.expiresAt).toISOString() : 'N/A'}`);

        console.log(`${FUNC} [7/7] SUCCESS RESPONSE:`);
        const duration = Date.now() - startTime;
        console.log(`${FUNC}   - Duration: ${duration}ms`);
        console.log(`${FUNC} ${'='.repeat(100)}\n`);

        return res.json({
          success:  true,
          token:    jitsiData.token,
          roomName: jitsiData.roomName,
          fullRoom: jitsiData.fullRoom,
          domain:   jitsiData.domain,
          expiresAt: jitsiData.expiresAt,
        });
      } catch (tokenErr) {
        console.error(`${FUNC} ❌ Token generation failed:`, tokenErr.message);
        throw tokenErr;
      }
    } catch (err) {
      const duration = Date.now() - startTime;
      console.error(`${FUNC} ❌ UNHANDLED ERROR (${duration}ms):`);
      console.error(`${FUNC}   - Error Type: ${err.constructor.name}`);
      console.error(`${FUNC}   - Message: ${err.message}`);
      console.error(`${FUNC}   - Stack: ${err.stack}`);
      console.error(`${FUNC} ${'='.repeat(100)}\n`);
      return res.status(500).json({
        success: false,
        message: err.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// SOCKET.IO: Video call signaling events
// Call inside io.on("connection", (socket) => { registerVideoCallSocket(io, socket) })
// ─────────────────────────────────────────────────────────────────────────────
const registerVideoCallSocket = (io, socket) => {

  // ── call:video:start — doctor or patient initiates a call ────────────────
  socket.on("call:video:start", async ({ appointmentId }) => {
    const FUNC = "[🎥 Socket call:video:start]";
    console.log(`\n${FUNC} ⏱️  EVENT RECEIVED`);
    console.log(`${FUNC} ═══════════════════════════════════════════════════════════════════════════════════════`);
    
    try {
      console.log(`${FUNC} [1/6] INITIATOR INFO:`);
      console.log(`${FUNC}   - Socket ID: ${socket.id}`);
      console.log(`${FUNC}   - User ID: ${socket.user?._id}`);
      console.log(`${FUNC}   - User Name: ${socket.user?.fullName}`);
      console.log(`${FUNC}   - User Role: ${socket.user?.role}`);
      console.log(`${FUNC}   - Appointment ID: "${appointmentId}"`);
      
      console.log(`${FUNC} [2/6] APPOINTMENT LOOKUP:`);
      const appointment = await Appointment.findById(appointmentId).populate('doctorId', 'fullName image');
      
      if (!appointment) {
        console.error(`${FUNC} ❌ Appointment not found: ${appointmentId}`);
        socket.emit("error", "Appointment not found");
        return;
      }
      
      console.log(`${FUNC}   - ✅ Found`);
      console.log(`${FUNC}   - Patient: ${appointment.userId}`);
      console.log(`${FUNC}   - Doctor: ${appointment.doctorId?._id} (${appointment.doctorId?.fullName})`);
      console.log(`${FUNC}   - Status: ${appointment.status}`);
      console.log(`${FUNC}   - Payment: ${appointment.paymentStatus}`);

      console.log(`${FUNC} [3/6] PARTICIPANT VERIFICATION:`);
      const userId = socket.user._id.toString();
      const isPatient = appointment.userId?.toString() === userId;
      const isDoctor = appointment.doctorId?._id?.toString() === userId;
      
      console.log(`${FUNC}   - Initiator is Patient: ${isPatient ? '✅ YES' : '❌ NO'}`);
      console.log(`${FUNC}   - Initiator is Doctor: ${isDoctor ? '✅ YES' : '❌ NO'}`);
      
      if (!isPatient && !isDoctor) {
        console.error(`${FUNC} ❌ ACCESS DENIED: User ${userId} not in appointment`);
        socket.emit("error", "Access denied. You are not part of this appointment.");
        return;
      }

      console.log(`${FUNC} [4/6] ACTIVE CALL TRACKER UPDATE:`);
      const existingCall = activeVideoCalls.get(appointmentId);
      if (existingCall) {
        console.warn(`${FUNC} ⚠️  Call already active (started at ${new Date(existingCall.startedAt).toISOString()})`);
      }
      
      activeVideoCalls.set(appointmentId, {
        startedBy:    userId,
        startedAt:    Date.now(),
        participants: new Set([userId]),
      });
      console.log(`${FUNC}   - ✅ Call registered in activeVideoCalls`);
      console.log(`${FUNC}   - Total active calls: ${activeVideoCalls.size}`);

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

      console.log(`${FUNC} [5/6] NOTIFICATIONS BROADCAST:`);
      
      // Scenario 1: Chat room notification
      console.log(`${FUNC}   - Notifying chat room: chat_${appointmentId}`);
      socket.to(`chat_${appointmentId}`).emit("call:video:incoming", callPayload);
      console.log(`${FUNC}     ✅ Broadcast to chat room`);

      // Scenario 2: Personal room notification to other participant
      const doctorId = appointment.doctorId?._id?.toString() || appointment.doctorId?.toString();
      const patientId = appointment.userId?.toString();
      const otherPersonId = userId === patientId ? doctorId : patientId;
      
      console.log(`${FUNC}   - Patient ID: ${patientId}`);
      console.log(`${FUNC}   - Doctor ID: ${doctorId}`);
      console.log(`${FUNC}   - Initiating user: ${userId}`);
      console.log(`${FUNC}   - Other participant: ${otherPersonId}`);
      
      if (otherPersonId) {
        console.log(`${FUNC}   - Notifying other participant's personal room: ${otherPersonId}`);
        socket.to(otherPersonId).emit("call:video:incoming", callPayload);
        console.log(`${FUNC}     ✅ Broadcast to personal room`);
      } else {
        console.warn(`${FUNC} ⚠️  Could not determine other participant ID`);
      }

      console.log(`${FUNC} [6/6] CONFIRMATION TO INITIATOR:`);
      socket.emit("call:video:started", { appointmentId });
      console.log(`${FUNC}   - ✅ Sent "call:video:started" to initiator`);
      console.log(`${FUNC} ${'='.repeat(100)}\n`);
      
    } catch (err) {
      const FUNC_ERR = `${FUNC} ❌ ERROR`;
      console.error(`${FUNC_ERR}:`);
      console.error(`${FUNC_ERR}   - Type: ${err.constructor.name}`);
      console.error(`${FUNC_ERR}   - Message: ${err.message}`);
      console.error(`${FUNC_ERR}   - Stack: ${err.stack}`);
      socket.emit("error", "Failed to start video call: " + err.message);
    }
  });

  // ── call:video:join — other participant accepts and joins ─────────────────
  socket.on("call:video:join", ({ appointmentId }) => {
    const FUNC = "[🎥 Socket call:video:join]";
    console.log(`\n${FUNC} PARTICIPANT JOINING`);
    console.log(`${FUNC} Socket ID: ${socket.id}`);
    console.log(`${FUNC} User: ${socket.user?.fullName} (${socket.user?._id})`);
    console.log(`${FUNC} Appointment: ${appointmentId}`);
    
    const call = activeVideoCalls.get(appointmentId);
    if (call) {
      const participantsBefore = call.participants.size;
      call.participants.add(socket.user._id.toString());
      console.log(`${FUNC} - ✅ Added to participants`);
      console.log(`${FUNC} - Participants: ${participantsBefore} → ${call.participants.size}`);
      console.log(`${FUNC} - Participant list: [${Array.from(call.participants).join(', ')}]`);
      
      io.to(`chat_${appointmentId}`).emit("call:video:participant_joined", {
        userId:           socket.user._id,
        name:             socket.user.fullName,
        participantCount: call.participants.size,
      });
      console.log(`${FUNC} - Broadcasted participant_joined event\n`);
    } else {
      console.warn(`${FUNC} ⚠️  No active call found for appointment ${appointmentId}\n`);
    }
  });

  // ── call:video:decline — other participant declines ───────────────────────
  socket.on("call:video:decline", ({ appointmentId }) => {
    const FUNC = "[🎥 Socket call:video:decline]";
    console.log(`\n${FUNC} CALL DECLINED`);
    console.log(`${FUNC} Declined by: ${socket.user?.fullName} (${socket.user?._id})`);
    console.log(`${FUNC} Appointment: ${appointmentId}`);
    
    socket.to(`chat_${appointmentId}`).emit("call:video:declined", {
      declinedBy: socket.user.fullName,
    });
    console.log(`${FUNC} - ✅ Decline notification sent`);
    
    const hadCall = activeVideoCalls.has(appointmentId);
    activeVideoCalls.delete(appointmentId);
    console.log(`${FUNC} - ✅ Call removed from tracker (was active: ${hadCall})\n`);
  });

  // ── call:video:leave — individual leaves (call may continue) ─────────────
  socket.on("call:video:leave", ({ appointmentId }) => {
    const FUNC = "[🎥 Socket call:video:leave]";
    console.log(`\n${FUNC} PARTICIPANT LEAVING`);
    console.log(`${FUNC} Left by: ${socket.user?.fullName} (${socket.user?._id})`);
    console.log(`${FUNC} Appointment: ${appointmentId}`);
    
    const call = activeVideoCalls.get(appointmentId);
    if (call) {
      const participantsBefore = call.participants.size;
      call.participants.delete(socket.user._id.toString());
      console.log(`${FUNC} - Participants: ${participantsBefore} → ${call.participants.size}`);
      
      io.to(`chat_${appointmentId}`).emit("call:video:participant_left", {
        userId:           socket.user._id,
        participantCount: call.participants.size,
      });
      console.log(`${FUNC} - ✅ Participant_left event broadcast`);
      
      // Auto-end if everyone left
      if (call.participants.size === 0) {
        activeVideoCalls.delete(appointmentId);
        console.log(`${FUNC} - ℹ️  All participants left, ending call`);
        io.to(`chat_${appointmentId}`).emit("call:video:ended", {
          duration: Math.floor((Date.now() - call.startedAt) / 1000),
        });
        console.log(`${FUNC} - ✅ Call ended (duration: ${Math.floor((Date.now() - call.startedAt) / 1000)}s)\n`);
      } else {
        console.log(`${FUNC} - ℹ️  Other participants still in call\n`);
      }
    } else {
      console.warn(`${FUNC} ⚠️  No active call found for appointment ${appointmentId}\n`);
    }
  });

  // ── call:video:end — doctor ends for everyone ─────────────────────────────
  socket.on("call:video:end", ({ appointmentId }) => {
    const FUNC = "[🎥 Socket call:video:end]";
    console.log(`\n${FUNC} CALL END REQUEST`);
    console.log(`${FUNC} Ended by: ${socket.user?.fullName} (${socket.user?._id}, role: ${socket.user?.role})`);
    console.log(`${FUNC} Appointment: ${appointmentId}`);
    
    const call = activeVideoCalls.get(appointmentId);
    if (!call) {
      console.warn(`${FUNC} ⚠️  No active call found\n`);
      return;
    }

    const isInitiator = call.startedBy === socket.user._id.toString();
    const isDoctor    = socket.user.role === "doctor";
    
    console.log(`${FUNC} - Is Initiator: ${isInitiator}`);
    console.log(`${FUNC} - Is Doctor: ${isDoctor}`);
    console.log(`${FUNC} - Can End Call: ${isInitiator || isDoctor}`);

    if (isInitiator || isDoctor) {
      const duration = Math.floor((Date.now() - call.startedAt) / 1000);
      io.to(`chat_${appointmentId}`).emit("call:video:ended", {
        endedBy:  socket.user.fullName,
        duration: duration,
      });
      console.log(`${FUNC} - ✅ Call ended broadcast sent (duration: ${duration}s)`);
      activeVideoCalls.delete(appointmentId);
      console.log(`${FUNC} - ✅ Call removed from tracker\n`);
    } else {
      console.warn(`${FUNC} ⚠️  Only doctor or initiator can end call\n`);
    }
  });
};

module.exports = { router, registerVideoCallSocket };
