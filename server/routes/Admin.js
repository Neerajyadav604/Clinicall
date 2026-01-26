const express = require("express");
const router = express.Router();
const { authenticateUser, isadmin } = require("../middileware/authMiddleware");
const {
  // Dashboard
  getDoctorsCount,
  getPendingRegistrationsCount,
  getAppointmentsCount,
  // Doctor Registrations
  getDoctorRegistrations,
  approveDoctorRegistration,
  rejectDoctorRegistration,
  // Appointments
  getAllAppointments,
  approveAppointment,
  rejectAppointment,
  // Users
  getAllUsers,
  // Doctors
  getApprovedDoctors,
  getRejectedDoctors,
  // Email
  sendNotificationEmail,
} = require("../Controllers/AdminController");

// Apply authentication & admin check to all routes
router.use(authenticateUser);
router.use(isadmin);

// ============================================
// DASHBOARD STATS
// ============================================

router.get("/doctors/count", getDoctorsCount);
router.get("/registrations/pending/count", getPendingRegistrationsCount);
router.get("/appointments/count", getAppointmentsCount);

// ============================================
// DOCTOR REGISTRATIONS
// ============================================

router.get("/registrations", getDoctorRegistrations);
router.put("/registrations/:registrationId/approve", approveDoctorRegistration);
router.put("/registrations/:registrationId/reject", rejectDoctorRegistration);

// ============================================
// APPOINTMENTS
// ============================================

router.get("/appointments", getAllAppointments);
router.put("/appointments/:appointmentId/approve", approveAppointment);
router.put("/appointments/:appointmentId/reject", rejectAppointment);

// ============================================
// USERS
// ============================================

router.get("/users", getAllUsers);

// ============================================
// DOCTORS
// ============================================

router.get("/doctors/approved", getApprovedDoctors);
router.get("/doctors/rejected", getRejectedDoctors);

// ============================================
// EMAIL NOTIFICATIONS
// ============================================

router.post("/send-email", sendNotificationEmail);

module.exports = router;
