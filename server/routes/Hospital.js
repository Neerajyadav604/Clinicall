const express = require("express");
const router = express.Router();
const { authenticateUser, isadmin } = require("../middleware/authMiddleware");
const {
  submitHospitalRegistration,
  getRegistrationStatus,
  getAllHospitals,
  getHospitalById,
  getHospitalDoctors,
  approveHospitalRegistration,
  rejectHospitalRegistration,
  getAllHospitalRegistrations,
  getHospitalRegistrationById,
  getAllApprovedHospitalsAdmin,
  suspendHospital,
  getHospitalDoctorApplications,
  approveHospitalDoctorApplication,
  rejectHospitalDoctorApplication,
} = require("../Controllers/HospitalController");

// ─────────────────────────────────────────────
// PUBLIC ROUTES
// ─────────────────────────────────────────────
router.get("/hospitals",        getAllHospitals);
router.get("/hospitals/:id",    getHospitalById);
router.get("/hospitals/:id/doctors", getHospitalDoctors);

// ─────────────────────────────────────────────
// AUTHENTICATED USER ROUTES
// ─────────────────────────────────────────────
router.post("/hospital-registration",        authenticateUser, submitHospitalRegistration);
router.get("/hospital-registration/status",  authenticateUser, getRegistrationStatus);

// ─────────────────────────────────────────────
// HOSPITAL / CLINIC ADMIN ROUTES
// ─────────────────────────────────────────────
router.get("/hospital/doctor-registrations",             authenticateUser, getHospitalDoctorApplications);
router.post("/hospital/doctor-registrations/:id/approve", authenticateUser, approveHospitalDoctorApplication);
router.post("/hospital/doctor-registrations/:id/reject",  authenticateUser, rejectHospitalDoctorApplication);

// ─────────────────────────────────────────────
// PLATFORM ADMIN ROUTES
// ─────────────────────────────────────────────
router.get("/admin/hospital-registrations",             authenticateUser, isadmin, getAllHospitalRegistrations);
router.get("/admin/hospital-registrations/:id",         authenticateUser, isadmin, getHospitalRegistrationById);
router.post("/admin/hospital-registrations/:id/approve", authenticateUser, isadmin, approveHospitalRegistration);
router.post("/admin/hospital-registrations/:id/reject",  authenticateUser, isadmin, rejectHospitalRegistration);
router.get("/admin/hospitals",                          authenticateUser, isadmin, getAllApprovedHospitalsAdmin);
router.patch("/admin/hospitals/:id/suspend",            authenticateUser, isadmin, suspendHospital);

module.exports = router;
