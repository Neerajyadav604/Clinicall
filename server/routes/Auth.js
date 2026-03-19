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


router.post("/create-order", authenticateUser, createOrder);
router.post("/verify-payment", authenticateUser, verifyPayment);

router.post("/signup", signupLimiter, signupValidation, signup);
router.post("/login", loginLimiter, loginValidation, login);
router.post("/sendotp", sendotp);
router.post('/refresh', refresh);
router.post('/logout', authenticateUser, logout);

router.post("/doctorregistration", authenticateUser, doctorregistration);
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
