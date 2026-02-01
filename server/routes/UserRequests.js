const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../middileware/authMiddleware");
const Appointment = require("../models/Appointment");
const User = require("../models/User");
const Doctor = require("../models/Doctor");

// ============================================
// USER APPOINTMENT/REQUEST ENDPOINTS
// ============================================

/**
 * GET /api/v1/user/appointments
 * Get all appointments for the logged-in user with optional status filter
 */
router.get("/user/appointments", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    // Build query
    let query = { userId };
    if (status && status !== "ALL") {
      query.approvalstatus = status;
    }

    // Fetch appointments with doctor details
    const appointments = await Appointment.find(query)
      .populate("doctorId", "fullName specialization image")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: appointments,
      count: appointments.length,
    });
  } catch (error) {
    console.error("Error fetching user appointments:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch appointments",
      error: error.message,
    });
  }
});

/**
 * GET /api/v1/user/appointments/stats
 * Get appointment statistics for user
 */
router.get("/user/appointments/stats", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = {
      total: await Appointment.countDocuments({ userId }),
      approved: await Appointment.countDocuments({
        userId,
        approvalstatus: "APPROVED",
      }),
      rejected: await Appointment.countDocuments({
        userId,
        approvalstatus: "REJECTED",
      }),
      pending: await Appointment.countDocuments({
        userId,
        approvalstatus: "PENDING",
      }),
    };

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching appointment statistics:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error: error.message,
    });
  }
});

/**
 * GET /api/v1/user/appointments/:appointmentId
 * Get a specific appointment
 */
router.get("/user/appointments/:appointmentId", authenticateUser, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.id;

    const appointment = await Appointment.findById(appointmentId)
      .populate("doctorId", "fullName specialization email contact image")
      .populate("userId", "fullName email contact");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Verify ownership
    if (appointment.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You cannot access this appointment",
      });
    }

    return res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    console.error("Error fetching appointment:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch appointment",
      error: error.message,
    });
  }
});

/**
 * PATCH /api/v1/user/appointments/:appointmentId/cancel
 * Cancel an appointment request
 */
router.patch("/user/appointments/:appointmentId/cancel", authenticateUser, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.id;
    const { cancellationReason } = req.body;

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Verify ownership
    if (appointment.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You cannot cancel this appointment",
      });
    }

    // Can only cancel pending appointments
    if (appointment.approvalstatus !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel ${appointment.approvalstatus} appointment`,
      });
    }

    appointment.approvalstatus = "CANCELLED";
    if (cancellationReason) {
      appointment.cancellationReason = cancellationReason;
    }

    await appointment.save();

    // Populate for response
    const updatedAppointment = await Appointment.findById(appointmentId)
      .populate("doctorId", "fullName specialization image");

    return res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully",
      data: updatedAppointment,
    });
  } catch (error) {
    console.error("Error canceling appointment:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to cancel appointment",
      error: error.message,
    });
  }
});

/**
 * PATCH /api/v1/user/appointments/:appointmentId/consultation-mode
 * Set consultation mode (online/offline) for approved appointment
 */
router.patch("/user/appointments/:appointmentId/consultation-mode", authenticateUser, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.id;
    const { consultationMode } = req.body;

    // Validate consultationMode
    if (!["online", "offline"].includes(consultationMode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid consultation mode. Must be 'online' or 'offline'",
      });
    }

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Verify ownership
    if (appointment.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You cannot modify this appointment",
      });
    }

    // Can only set mode for approved appointments
    if (appointment.approvalstatus !== "APPROVED") {
      return res.status(400).json({
        success: false,
        message: "Consultation mode can only be set for approved appointments",
      });
    }

    // If setting offline mode, no payment needed
    if (consultationMode === "offline") {
      appointment.consultationMode = "offline";
      appointment.paymentStatus = "unpaid"; // No payment for offline
      appointment.isChatEnabled = false;
    } else {
      // For online mode, payment will be required
      appointment.consultationMode = "online";
      // Payment status remains as is until payment is made
    }

    await appointment.save();

    const updatedAppointment = await Appointment.findById(appointmentId)
      .populate("doctorId", "fullName specialization image");

    return res.status(200).json({
      success: true,
      message: `Consultation mode set to ${consultationMode}`,
      data: updatedAppointment,
    });
  } catch (error) {
    console.error("Error setting consultation mode:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to set consultation mode",
      error: error.message,
    });
  }
});

/**
 * GET /api/v1/user/appointments/:appointmentId/chat-access
 * Verify if user can access chat for this appointment
 */
router.get("/user/appointments/:appointmentId/chat-access", authenticateUser, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.id;

    const appointment = await Appointment.findById(appointmentId)
      .populate("doctorId", "fullName specialization image");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
        canAccess: false,
      });
    }

    // Verify ownership
    if (appointment.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
        canAccess: false,
      });
    }

    // Check all conditions for chat access
    const canAccess =
      appointment.approvalstatus === "APPROVED" &&
      appointment.paymentStatus === "paid" &&
      appointment.consultationMode === "online";

    if (!canAccess) {
      return res.status(200).json({
        success: true,
        canAccess: false,
        appointment: {
          _id: appointment._id,
          approvalstatus: appointment.approvalstatus,
          paymentStatus: appointment.paymentStatus,
          consultationMode: appointment.consultationMode,
        },
        reason:
          appointment.approvalstatus !== "APPROVED"
            ? "Appointment not approved"
            : appointment.paymentStatus !== "paid"
            ? "Payment not completed"
            : "Consultation mode not set to online",
      });
    }

    return res.status(200).json({
      success: true,
      canAccess: true,
      appointment: {
        _id: appointment._id,
        doctorId: appointment.doctorId._id,
        doctorName: appointment.doctorId.fullName,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
      },
    });
  } catch (error) {
    console.error("Error checking chat access:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to check chat access",
      canAccess: false,
      error: error.message,
    });
  }
});

module.exports = router;
