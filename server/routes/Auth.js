const express = require("express");
const router = express.Router();
const multer = require("multer");

const { signup, login, sendotp, doctorregistration, refresh, logout, getDoctorRegistrationStatus } = require("../Controllers/Auth");
const { authenticateUser,isDoctor  } = require("../middleware/authMiddleware");
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

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files are allowed"));
      return;
    }
    cb(null, true);
  },
});

// ✅ Multer config for doctor registration (accepts PDFs + docs, not just images)
const docUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB for documents
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ];
    
    if (!file.mimetype || !allowedMimes.includes(file.mimetype)) {
      cb(new Error("Only PDF, DOC, DOCX, JPG, and PNG files are allowed"));
      return;
    }
    cb(null, true);
  },
});

// ✅ Multer error handler middleware - catches "Unexpected field" errors
const multerErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error("[DoctorReg] Multer Error:", {
      code: err.code,
      message: err.message,
      field: err.field,
      limit: err.limit,
    });
    
    if (err.code === 'UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: `Unexpected file field: "${err.field}". Expected fields: documents, attachments, or other file fields.`,
      });
    }
    
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `File size exceeds limit (max 10MB)`,
      });
    }
    
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: `Too many files. Max 10 files allowed.`,
      });
    }
    
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`,
    });
  }
  
  // Pass to next middleware if not a multer error
  next(err);
};

router.post("/create-order", authenticateUser, createOrder);
router.post("/verify-payment", authenticateUser, verifyPayment);

router.post("/signup", signupLimiter, signupValidation, signup);
router.post("/login", loginLimiter, loginValidation, login);
router.post("/sendotp", sendotp);
router.post('/refresh', refresh);
router.post('/logout', authenticateUser, logout);

// ✅ FIXED: Changed from .fields() to .any() to accept any file field names
// This prevents "Unexpected field" errors from frontend sending unexpected field names
router.post(
  "/doctorregistration", 
  authenticateUser, 
  docUpload.any(),
  multerErrorHandler,
  doctorregistration
);
router.get("/doctorregistration/status", authenticateUser, getDoctorRegistrationStatus);
router.get("/doctor-registration/status", authenticateUser, getDoctorRegistrationStatus);

router.get("/userprofile", authenticateUser, getUserProfile);
router.put("/edituserProfile", authenticateUser, updateUserProfile);
router.put("/updateuserprofilepicture", authenticateUser, upload.single("displayPicture"), updateuserDisplayPicture);

router.get("/doctorprofile/:doctorId", getDoctorProfile);
router.put("/doctorprofile/:doctorId/editprofile", updateDoctorProfile);
router.put("/updatedoctorprofilepicture", authenticateUser, upload.single("displayPicture"), updatedoctorDisplayPicture);

router.post("/searchdoctors", authenticateUser, searchdoctors);

router.post("/appointment/request/:doctorId", authenticateUser, requestAppointment);
router.get("/appointments/user", authenticateUser, getuserappointmentsrequeste);
router.get("/appointments/doctor/:doctorId", authenticateUser, getuserappointmentsrequestefordoctor);
router.put("/appointment/approve/:appointmentId", authenticateUser, isDoctor, approveAppointment);
router.put("/appointment/reject/:appointmentId", authenticateUser,isDoctor, rejectAppointment);

module.exports = router;
