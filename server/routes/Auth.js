const express = require("express");
const router = express.Router();

const { signup, login, sendotp, doctorregistration } = require("../Controllers/Auth");
const { authenticateUser,isDoctor  } = require("../middileware/authMiddleware");



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


router.post("/create-order", authenticateUser, createOrder);
router.post("/verify-payment", authenticateUser, verifyPayment);

router.post("/signup", signup);
router.post("/login", login);
router.post("/sendotp", sendotp);

router.post("/doctorregistration", authenticateUser, doctorregistration);

router.get("/userprofile", authenticateUser, getUserProfile);
router.put("/edituserProfile", authenticateUser, updateUserProfile);
router.put("/updateuserprofilepicture", authenticateUser, updateuserDisplayPicture);

router.get("/doctorprofile/:doctorId", getDoctorProfile);
router.put("/doctorprofile/:doctorId/editprofile", updateDoctorProfile);
router.put("/updatedoctorprofilepicture", authenticateUser, updatedoctorDisplayPicture);

router.post("/searchdoctors", authenticateUser, searchdoctors);

router.post("/appointment/request/:doctorId", authenticateUser, requestAppointment);
router.get("/appointments/user", authenticateUser, getuserappointmentsrequeste);
router.get("/appointments/doctor/:doctorId", authenticateUser, getuserappointmentsrequestefordoctor);
router.put("/appointment/approve/:appointmentId", authenticateUser, isDoctor, approveAppointment);
router.put("/appointment/reject/:appointmentId", authenticateUser,isDoctor, rejectAppointment);

module.exports = router;
