const express = require("express");
const router = express.Router();
const multer = require("multer");

const { authenticateUser, isDoctor } = require("../middleware/authMiddleware");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");

const { approveAppointment, rejectAppointment } = require("../Controllers/ManageAppoinment");

// ============================================
// MULTER CONFIGURATION FOR PROFILE IMAGE UPLOADS
// ============================================
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  // Allow only image files
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (JPG, PNG, GIF, WebP) are allowed"));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// ✅ Multer error handler
const multerErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        message: "Image size should be less than 5MB",
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`,
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || "File upload failed",
    });
  }
  next();
};

// ============================================
// DOCTOR PROFILE ENDPOINTS
// ============================================

console.log("🔵 [DOCTOR.JS] Routes file is being loaded");
console.log("🔵 [DOCTOR.JS] authenticateUser middleware available:", typeof authenticateUser);
console.log("🔵 [DOCTOR.JS] isDoctor middleware available:", typeof isDoctor);
console.log("🔵 [DOCTOR.JS] Doctor model available:", typeof Doctor);
console.log("🔵 [DOCTOR.JS] Appointment model available:", typeof Appointment);

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
    const timestamp = new Date().toISOString();
    console.log(`\n${'='.repeat(80)}`);
    console.log(`[🏥 BACKEND APPOINTMENTS] ${timestamp}`);
    console.log(`[🏥 BACKEND APPOINTMENTS] ═══ INCOMING REQUEST ═══`);
    console.log(`[🏥 BACKEND APPOINTMENTS] User ID from auth middleware: ${userId}`);
    console.log(`[🏥 BACKEND APPOINTMENTS] User role: ${req.user.role}`);
    console.log(`[🏥 BACKEND APPOINTMENTS] Request headers:`, JSON.stringify(req.headers, null, 2));
    console.log(`[🏥 BACKEND APPOINTMENTS] Request method: ${req.method}`);
    console.log(`[🏥 BACKEND APPOINTMENTS] Request URL: ${req.originalUrl}`);
    
    console.log(`[🏥 BACKEND APPOINTMENTS] ═══ DATABASE QUERY ═══`);
    console.log(`[🏥 BACKEND APPOINTMENTS] Searching for doctor with user ID: ${userId}`);
    
    // Find doctor by user ID
    const doctor = await Doctor.findOne({ user: userId });

    if (!doctor) {
      console.log(`[🏥 BACKEND APPOINTMENTS] ❌ Doctor not found for userId: ${userId}`);
      console.log(`[🏥 BACKEND APPOINTMENTS] This means the Doctor record doesn't exist or is not linked to this user ID`);
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    console.log(`[🏥 BACKEND APPOINTMENTS] ✅ Doctor found successfully`);
    console.log(`[🏥 BACKEND APPOINTMENTS] Doctor ID: ${doctor._id}`);
    console.log(`[🏥 BACKEND APPOINTMENTS] Doctor name: ${doctor.fullName}`);
    console.log(`[🏥 BACKEND APPOINTMENTS] Doctor specialization: ${doctor.specialization}`);

    console.log(`[🏥 BACKEND APPOINTMENTS] ═══ FETCHING APPOINTMENTS ═══`);
    console.log(`[🏥 BACKEND APPOINTMENTS] Querying Appointment collection with doctorId: ${doctor._id}`);
    
    // Get all appointments for this doctor
    const appointments = await Appointment.find({
      doctorId: doctor._id,
    })
      .populate("userId", "fullName email contact")
      .sort({ createdAt: -1 });

    console.log(`[🏥 BACKEND APPOINTMENTS] ✅ Query completed successfully`);
    console.log(`[🏥 BACKEND APPOINTMENTS] Total appointments found: ${appointments.length}`);
    console.log(`[🏥 BACKEND APPOINTMENTS] Sample appointment (first):`, appointments[0] ? JSON.stringify(appointments[0], null, 2) : 'N/A');
    
    const responsePayload = {
      success: true,
      data: appointments,
      count: appointments.length,
    };
    
    console.log(`[🏥 BACKEND APPOINTMENTS] ═══ SENDING RESPONSE ═══`);
    console.log(`[🏥 BACKEND APPOINTMENTS] Response status: 200 OK`);
    console.log(`[🏥 BACKEND APPOINTMENTS] Response payload:`, JSON.stringify(responsePayload, null, 2));
    console.log(`${'='.repeat(80)}\n`);

    return res.status(200).json(responsePayload);
  } catch (error) {
    const timestamp = new Date().toISOString();
    console.error(`\n${'='.repeat(80)}`);
    console.error(`[🏥 BACKEND APPOINTMENTS] ${timestamp}`);
    console.error(`[🏥 BACKEND APPOINTMENTS] ❌ ERROR CAUGHT IN ROUTE HANDLER`);
    console.error(`[🏥 BACKEND APPOINTMENTS] Error occurred while processing request`);
    console.error(`[🏥 BACKEND APPOINTMENTS] Error Name: ${error.name}`);
    console.error(`[🏥 BACKEND APPOINTMENTS] Error Message: ${error.message}`);
    console.error(`[🏥 BACKEND APPOINTMENTS] Error Code: ${error.code}`);
    console.error(`[🏥 BACKEND APPOINTMENTS] Error Stack:`, error.stack);
    console.error(`[🏥 BACKEND APPOINTMENTS] Full Error Object:`, JSON.stringify(error, null, 2));
    console.error(`[🏥 BACKEND APPOINTMENTS] Request User ID: ${req.user?.id}`);
    console.error(`[🏥 BACKEND APPOINTMENTS] Request method: ${req.method}`);
    console.error(`[🏥 BACKEND APPOINTMENTS] Request URL: ${req.originalUrl}`);
    console.error(`${'='.repeat(80)}\n`);
    
    return res.status(500).json({
      success: false,
      message: "Failed to fetch appointments",
      error: error.message,
    });
  }
});

/**
 * GET /api/v1/appointments/:appointmentId
 * Get appointment details for doctor
 */
router.get("/appointments/:appointmentId", authenticateUser, isDoctor, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.id;

    const doctor = await Doctor.findOne({ user: userId });
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    const appointment = await Appointment.findById(appointmentId)
      .populate("userId", "fullName email contact");

    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    if (appointment.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    return res.status(200).json({ success: true, data: appointment });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/v1/appointments/doctor/stats
 * Get appointment statistics for doctor dashboard
 */
router.get("/appointments/doctor/stats", authenticateUser, isDoctor, async (req, res) => {
  try {
    const userId = req.user.id;
    const timestamp = new Date().toISOString();
    console.log(`\n${'='.repeat(80)}`);
    console.log(`[📊 BACKEND STATS] ${timestamp}`);
    console.log(`[📊 BACKEND STATS] ═══ INCOMING REQUEST ═══`);
    console.log(`[📊 BACKEND STATS] User ID from auth middleware: ${userId}`);
    console.log(`[📊 BACKEND STATS] User role: ${req.user.role}`);

    // Find doctor by user ID
    const doctor = await Doctor.findOne({ user: userId });

    if (!doctor) {
      console.log(`[📊 BACKEND STATS] ❌ Doctor not found for userId: ${userId}`);
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    console.log(`[📊 BACKEND STATS] ✅ Doctor found successfully`);
    console.log(`[📊 BACKEND STATS] Doctor ID: ${doctor._id}`);

    const doctorId = doctor._id;

    console.log(`[📊 BACKEND STATS] ═══ QUERYING APPOINTMENT COUNTS ═══`);

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

    console.log(`[📊 BACKEND STATS] ✅ Appointment counts retrieved`);
    console.log(`[📊 BACKEND STATS] Total appointments: ${stats.total}`);
    console.log(`[📊 BACKEND STATS] Pending appointments: ${stats.pending}`);
    console.log(`[📊 BACKEND STATS] Approved appointments: ${stats.approved}`);
    console.log(`[📊 BACKEND STATS] Rejected appointments: ${stats.rejected}`);

    const responsePayload = {
      success: true,
      data: stats,
    };
    
    console.log(`[📊 BACKEND STATS] ═══ SENDING RESPONSE ═══`);
    console.log(`[📊 BACKEND STATS] Response status: 200 OK`);
    console.log(`[📊 BACKEND STATS] Response payload:`, JSON.stringify(responsePayload, null, 2));
    console.log(`${'='.repeat(80)}\n`);

    return res.status(200).json(responsePayload);
  } catch (error) {
    const timestamp = new Date().toISOString();
    console.error(`\n${'='.repeat(80)}`);
    console.error(`[📊 BACKEND STATS] ${timestamp}`);
    console.error(`[📊 BACKEND STATS] ❌ ERROR CAUGHT IN ROUTE HANDLER`);
    console.error(`[📊 BACKEND STATS] Error Name: ${error.name}`);
    console.error(`[📊 BACKEND STATS] Error Message: ${error.message}`);
    console.error(`[📊 BACKEND STATS] Error Code: ${error.code}`);
    console.error(`[📊 BACKEND STATS] Error Stack:`, error.stack);
    console.error(`[📊 BACKEND STATS] Full Error Object:`, JSON.stringify(error, null, 2));
    console.error(`[📊 BACKEND STATS] Request User ID: ${req.user?.id}`);
    console.error(`${'='.repeat(80)}\n`);
    
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

/**
 * GET /api/v1/appointments/:appointmentId/chat-access
 * Verify if doctor can access chat for this appointment
 */
router.get("/appointments/:appointmentId/chat-access", authenticateUser, isDoctor, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.id;

    // Find doctor by user ID
    const doctor = await Doctor.findOne({ user: userId });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
        canAccess: false,
      });
    }

    const appointment = await Appointment.findById(appointmentId)
      .populate("userId", "fullName email contact");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
        canAccess: false,
      });
    }
console.log("data :",appointment.doctorId.toString() !== doctor._id.toString())
    // Verify doctor owns this appointment
    if (appointment.doctorId.toString() !== doctor._id.toString()) {
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
      appointment.consultationStatus === "active" &&
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
          consultationStatus: appointment.consultationStatus,
        },
        reason:
          appointment.approvalstatus !== "APPROVED"
            ? "Appointment not approved"
            : appointment.paymentStatus !== "paid"
            ? "Payment not completed"
            : appointment.consultationStatus !== "active"
            ? "Consultation not active"
            : "Consultation mode not set to online",
      });
    }

    return res.status(200).json({
      success: true,
      canAccess: true,
      appointment: {
        _id: appointment._id,
        userId: appointment.userId._id,
        userName: appointment.userId.fullName,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
      },
    });
  } catch (error) {
    console.error("Error checking doctor chat access:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to check chat access",
      canAccess: false,
      error: error.message,
    });
  }
});

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
 * Upload doctor's profile image using Cloudinary
 */
router.post("/profile/update-image", authenticateUser, isDoctor, upload.single("image"), multerErrorHandler, async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if file exists (multer stores in req.file, not req.files)
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    const imageFile = req.file;

    // Validate file type (multer already does this, but double-check)
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedMimeTypes.includes(imageFile.mimetype)) {
      return res.status(400).json({
        success: false,
        message: "Invalid image format. Allowed: JPG, PNG, GIF, WebP",
      });
    }

    // Validate file size (multer already limits to 5MB, but double-check)
    if (imageFile.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: "Image size should be less than 5MB",
      });
    }

    // Find doctor by user ID
    let doctor = await Doctor.findOne({ user: userId });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    // Upload to Cloudinary (convert buffer to stream)
    const { uploadImageToCloudinary } = require('../utils/ImageUploader');
    const uploadedImage = await uploadImageToCloudinary(
      imageFile,
      process.env.FOLDER_NAME,
      1000,
      1000
    );

    if (!uploadedImage || !uploadedImage.secure_url) {
      return res.status(500).json({
        success: false,
        message: "Failed to upload image to Cloudinary",
      });
    }

    // Save Cloudinary URL to doctor image field
    doctor.image = uploadedImage.secure_url;
    doctor = await doctor.save();

    // Populate user data for complete response
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
