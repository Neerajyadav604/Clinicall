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

module.exports = router;
