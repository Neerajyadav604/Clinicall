const express = require("express");
const router = express.Router();
const Doctor = require("../models/Doctor");
const DoctorProfile = require("../models/DoctorProfile");

/**
 * Middleware: allow only localhost requests.
 * The ML service (localhost:8000) calls this internally.
 */
const localhostOnly = (req, res, next) => {
  const ip =
    req.ip ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    "";
  const allowed = ["127.0.0.1", "::1", "::ffff:127.0.0.1", "localhost"];
  if (allowed.some((address) => ip.includes(address))) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: "Forbidden: internal endpoint only",
  });
};

/**
 * GET /api/v1/internal/doctors-for-ml
 * Returns all verified doctors with DoctorProfile data.
 * Used by ML service Module 2 (Doctor Recommender).
 * No JWT auth - localhost only.
 */
router.get("/internal/doctors-for-ml", localhostOnly, async (req, res) => {
  try {
    const doctors = await Doctor.find({ verified: true })
      .populate("user", "fullName email")
      .lean();

    const profiles = await DoctorProfile.find().lean();
    const profileMap = {};
    profiles.forEach((profile) => {
      profileMap[String(profile.doctorId)] = profile;
    });

    const result = doctors.map((doctor) => ({
      id: String(doctor._id),
      name: doctor.user?.fullName || "Unknown",
      email: doctor.user?.email || "",
      specialization: doctor.specialization || "General Physician",
      experience: profileMap[String(doctor._id)]?.experience || 0,
      rating: profileMap[String(doctor._id)]?.rating || 0,
      consultationFee: profileMap[String(doctor._id)]?.consultationFee || 0,
      totalAppointments: 0,
    }));

    return res.status(200).json({
      success: true,
      count: result.length,
      doctors: result,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;
