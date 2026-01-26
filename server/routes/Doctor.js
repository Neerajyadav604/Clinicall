const express = require("express");
const router = express.Router();

const { authenticateUser, isDoctor } = require("../middileware/authMiddleware");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");

const {
  approveAppointment,
  rejectAppointment,
} = require("../Controllers/ManageAppoinment");

// ============================================
// DOCTOR PROFILE ENDPOINTS
// ============================================

/**
 * GET /api/v1/profile/me
 * Get current logged-in doctor's profile
 */


console.log("Doctor Routes Loaded")
router.get("/profile/me", authenticateUser, isDoctor, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("userId",userId)

    // Find doctor by user ID
    const doctor = await Doctor.findOne({ user: userId }).populate("user", "fullName email contact role");

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: doctor,
    });
  } catch (error) {
    console.error("Error fetching doctor profile:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch doctor profile",
      error: error.message,
    });
  }
});

// ============================================
// DOCTOR APPOINTMENTS ENDPOINTS
// ============================================

/**
 * GET /api/v1/appointments/doctor
 * Get all appointments for logged-in doctor
 */
router.get("/appointments/doctor", authenticateUser, isDoctor, async (req, res) => {
  try {
    const userId = req.user.id;

    // Find doctor by user ID
    const doctor = await Doctor.findOne({ user: userId });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // Get all appointments for this doctor
    const appointments = await Appointment.find({
      doctorId: doctor._id,
    })
      .populate("userId", "fullName email contact")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: appointments,
      count: appointments.length,
    });
  } catch (error) {
    console.error("Error fetching doctor appointments:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch appointments",
      error: error.message,
    });
  }
});

/**
 * GET /api/v1/appointments/doctor/stats
 * Get appointment statistics for doctor dashboard
 */
router.get("/appointments/doctor/stats", authenticateUser, isDoctor, async (req, res) => {
  try {
    const userId = req.user.id;

    // Find doctor by user ID
    const doctor = await Doctor.findOne({ user: userId });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    const doctorId = doctor._id;

    // Get counts by status
    const stats = {
      total: await Appointment.countDocuments({ doctorId }),
      pending: await Appointment.countDocuments({
        doctorId,
        approvalstatus: "PENDING",
      }),
      approved: await Appointment.countDocuments({
        doctorId,
        approvalstatus: "APPROVED",
      }),
      rejected: await Appointment.countDocuments({
        doctorId,
        approvalstatus: "REJECTED",
      }),
    };

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching doctor stats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch appointment statistics",
      error: error.message,
    });
  }
});

/**
 * PATCH /api/v1/appointments/:appointmentId/approve
 * Approve an appointment
 */
router.patch(
  "/appointments/:appointmentId/approve",
  authenticateUser,
  isDoctor,
  approveAppointment
);

/**
 * PATCH /api/v1/appointments/:appointmentId/reject
 * Reject an appointment
 */
router.patch(
  "/appointments/:appointmentId/reject",
  authenticateUser,
  isDoctor,
  rejectAppointment
);

// ============================================
// DOCTOR PROFILE UPDATE ENDPOINTS
// ============================================

/**
 * PUT /api/v1/profile/update
 * Update doctor's profile
 */
router.put("/profile/update", authenticateUser, isDoctor, async (req, res) => {
  try {
    const userId = req.user.id;
    const { fullName, email, contact, specialization, qualification, experienceYears, licenseNumber, hospitalName, documents, image } = req.body;

    // Find doctor by user ID
    let doctor = await Doctor.findOne({ user: userId });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    // Update allowed fields
    if (fullName) doctor.fullName = fullName;
    if (contact) doctor.contact = contact;
    if (specialization) doctor.specialization = specialization;
    if (qualification) doctor.qualification = qualification;
    if (experienceYears !== undefined) doctor.experienceYears = experienceYears;
    if (licenseNumber) doctor.licenseNumber = licenseNumber;
    if (hospitalName) doctor.hospitalName = hospitalName;
    if (documents) doctor.documents = documents;
    if (image) doctor.image = image;

    // Save updated doctor
    doctor = await doctor.save();

    // Populate user data
    doctor = await Doctor.findById(doctor._id).populate("user", "fullName email contact role");

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: doctor,
    });
  } catch (error) {
    console.error("Error updating doctor profile:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update doctor profile",
      error: error.message,
    });
  }
});

/**
 * POST /api/v1/profile/update-image
 * Upload doctor's profile image
 */
router.post("/profile/update-image", authenticateUser, isDoctor, async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if file exists
    if (!req.files || !req.files.image) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    const imageFile = req.files.image;

    // Validate file type
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedMimeTypes.includes(imageFile.mimetype)) {
      return res.status(400).json({
        success: false,
        message: "Invalid image format. Allowed: JPG, PNG, GIF, WebP",
      });
    }

    // Validate file size (5MB max)
    if (imageFile.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: "Image size should be less than 5MB",
      });
    }

    // Find doctor
    let doctor = await Doctor.findOne({ user: userId });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    // Convert file to base64 or upload to cloud service
    const base64Image = `data:${imageFile.mimetype};base64,${imageFile.data.toString("base64")}`;
    doctor.image = base64Image;

    // Save updated doctor
    doctor = await doctor.save();

    // Populate user data
    doctor = await Doctor.findById(doctor._id).populate("user", "fullName email contact role");

    return res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      data: doctor,
    });
  } catch (error) {
    console.error("Error uploading doctor profile image:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upload image",
      error: error.message,
    });
  }
});

module.exports = router;
