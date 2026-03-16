const express = require("express");
const router = express.Router();
const multer = require("multer");

const {
  startSession,
  endSession,
  addMedicalRecord,
  getSessionRecords,
  getSessionHistory,
  downloadRecord,
  getActiveSession,
} = require("../Controllers/consultationController");

const { authenticateUser, isDoctor } = require("../middleware/authMiddleware");

// ============================================
// MULTER CONFIGURATION FOR FILE UPLOADS
// ============================================
const storage = multer.memoryStorage(); // Store in memory for now
const fileFilter = (req, file, cb) => {
  // Only allow certain file types
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(file.originalname.toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, or PDF files are allowed"));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// ✅ FIX 7: Multer error handler middleware to catch file upload errors
const multerErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        message: "File too large. Maximum size is 10MB",
      });
    }
    if (err.code === "FILE_TOO_LARGE") {
      return res.status(413).json({
        success: false,
        message: "File too large. Maximum size is 10MB",
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
// DOCTOR ROUTES (Requires isDoctor middleware)
// ============================================

/**
 * Start consultation session
 * POST /api/v1/consultation/start/:appointmentId
 * Only doctor can start a session
 */
router.post(
  "/consultation/start/:appointmentId",
  authenticateUser,
  isDoctor,
  startSession
);

/**
 * End consultation session
 * PUT /api/v1/consultation/end/:sessionId
 * Doctor or patient can end a session
 */
router.put(
  "/consultation/end/:sessionId",
  authenticateUser,
  endSession
);

/**
 * Add medical record to session
 * POST /api/v1/consultation/record/:sessionId
 * Only doctor can add records
 * Supports file attachment (max 10MB)
 */
router.post(
  "/consultation/record/:sessionId",
  authenticateUser,
  isDoctor,
  upload.single("attachmentFile"),
  multerErrorHandler,
  addMedicalRecord
);

/**
 * Get all records for a session
 * GET /api/v1/consultation/records/:sessionId
 * Both doctor and patient can view
 */
router.get(
  "/consultation/records/:sessionId",
  authenticateUser,
  getSessionRecords
);

// ============================================
// PATIENT ROUTES (Requires authenticateUser only)
// ============================================

/**
 * Get patient's consultation history
 * GET /api/v1/consultation/history
 * Patient views all past sessions and records
 */
router.get(
  "/consultation/history",
  authenticateUser,
  getSessionHistory
);

/**
 * Download a record for PDF generation
 * GET /api/v1/consultation/download/:recordId
 * Patient/Doctor can download their records
 */
router.get(
  "/consultation/download/:recordId",
  authenticateUser,
  downloadRecord
);

/**
 * Get active session for appointment
 * GET /api/v1/consultation/active/:appointmentId
 * Check if session is currently active
 */
router.get(
  "/consultation/active/:appointmentId",
  authenticateUser,
  getActiveSession
);

module.exports = router;
