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
    console.log("[VideoCall Debug] Hit token route");
    console.log("[VideoCall Debug] appointmentId:", req.params.appointmentId);
    console.log("[VideoCall Debug] user:", req.user?._id, req.user?.role);
    console.log("[VideoCall Debug] JAAS_APP_ID:", process.env.JAAS_APP_ID ? "SET" : "MISSING");
    console.log("[VideoCall Debug] JAAS_KID:", process.env.JAAS_KID ? "SET" : "MISSING");
    console.log("[VideoCall Debug] JAAS_PRIVATE_KEY:", process.env.JAAS_PRIVATE_KEY ? "SET" : "MISSING");
    try {
      const { appointmentId } = req.params;

      // Verify appointment exists
      const appointment = await Appointment.findById(appointmentId);
      console.log("[VideoCall Debug] appointment found:", !!appointment);
      if (appointment) {
        console.log("[VideoCall Debug] paymentStatus:", appointment.paymentStatus);
        console.log("[VideoCall Debug] status:", appointment.status);
        console.log("[VideoCall Debug] userId:", appointment.userId?.toString());
        console.log("[VideoCall Debug] doctorId:", appointment.doctorId?.toString());
      }
      if (!appointment) {
        return res.status(404).json({ success: false, message: "Appointment not found" });
      }

      // Verify requester is a participant
      const userId = req.user._id.toString();
      const isParticipant =
        appointment.userId?.toString()   === userId ||
        appointment.doctorId?.toString() === userId;

      if (!isParticipant) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }

      // Only allow video calls for paid + scheduled + (active or locked) appointments
      const isEligible =
        appointment.paymentStatus === "paid" &&
        appointment.status === "SCHEDULED";

      if (!isEligible) {
        return res.status(403).json({
          success: false,
          message: "Video call is only available for scheduled and paid appointments",
        });
      }

      const jitsiData = generateJitsiToken(req.user, appointmentId);

      return res.json({
        success:  true,
        token:    jitsiData.token,
        roomName: jitsiData.roomName,
        fullRoom: jitsiData.fullRoom,
        domain:   jitsiData.domain,
      });
    } catch (err) {
      console.error("[VideoCall] Token generation error:", err);
      return res.status(500).json({ success: false, message: err.message, stack: process.env.NODE_ENV === 'development' ? err.stack : undefined });
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
    try {
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) return socket.emit("error", "Appointment not found");

      const userId = socket.user._id.toString();
      const isParticipant =
        appointment.userId?.toString()   === userId ||
        appointment.doctorId?.toString() === userId;

      if (!isParticipant) return socket.emit("error", "Access denied");

      // Track the call
      activeVideoCalls.set(appointmentId, {
        startedBy:    userId,
        startedAt:    Date.now(),
        participants: new Set([userId]),
      });

      // Notify the OTHER participant in the same chat room
      const chatRoom = `chat_${appointmentId}`;
      socket.to(chatRoom).emit("call:video:incoming", {
        appointmentId,
        calledBy: {
          id:     socket.user._id,
          name:   socket.user.fullName,
          role:   socket.user.role,
          avatar: socket.user.image || null,
        },
        startedAt: new Date().toISOString(),
      });

      socket.emit("call:video:started", { appointmentId });
      console.log(`[VideoCall] Started by ${socket.user.fullName} for appointment ${appointmentId}`);
    } catch (err) {
      console.error("[VideoCall] call:video:start error:", err.message);
      socket.emit("error", "Failed to start video call");
    }
  });

  // ── call:video:join — other participant accepts and joins ─────────────────
  socket.on("call:video:join", ({ appointmentId }) => {
    const call = activeVideoCalls.get(appointmentId);
    if (call) {
      call.participants.add(socket.user._id.toString());
      io.to(`chat_${appointmentId}`).emit("call:video:participant_joined", {
        userId:           socket.user._id,
        name:             socket.user.fullName,
        participantCount: call.participants.size,
      });
    }
  });

  // ── call:video:decline — other participant declines ───────────────────────
  socket.on("call:video:decline", ({ appointmentId }) => {
    socket.to(`chat_${appointmentId}`).emit("call:video:declined", {
      declinedBy: socket.user.fullName,
    });
    activeVideoCalls.delete(appointmentId);
  });

  // ── call:video:leave — individual leaves (call may continue) ─────────────
  socket.on("call:video:leave", ({ appointmentId }) => {
    const call = activeVideoCalls.get(appointmentId);
    if (call) {
      call.participants.delete(socket.user._id.toString());
      io.to(`chat_${appointmentId}`).emit("call:video:participant_left", {
        userId:           socket.user._id,
        participantCount: call.participants.size,
      });
      // Auto-end if everyone left
      if (call.participants.size === 0) {
        activeVideoCalls.delete(appointmentId);
        io.to(`chat_${appointmentId}`).emit("call:video:ended", {
          duration: Math.floor((Date.now() - call.startedAt) / 1000),
        });
      }
    }
  });

  // ── call:video:end — doctor ends for everyone ─────────────────────────────
  socket.on("call:video:end", ({ appointmentId }) => {
    const call = activeVideoCalls.get(appointmentId);
    if (!call) return;

    const isInitiator = call.startedBy === socket.user._id.toString();
    const isDoctor    = socket.user.role === "doctor";

    if (isInitiator || isDoctor) {
      io.to(`chat_${appointmentId}`).emit("call:video:ended", {
        endedBy:  socket.user.fullName,
        duration: Math.floor((Date.now() - call.startedAt) / 1000),
      });
      activeVideoCalls.delete(appointmentId);
      console.log(`[VideoCall] Ended for appointment ${appointmentId}`);
    }
  });
};

module.exports = { router, registerVideoCallSocket };
