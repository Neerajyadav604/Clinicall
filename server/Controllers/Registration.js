const mongoose = require('mongoose');
const DoctorRegistration = require('../models/DoctorRegistration')
const Doctor = require('../models/Doctor')
const DoctorProfile = require('../models/DoctorProfile')
const User = require("../models/User")
const { sendNotification } = require("../utils/sendNotification");


exports.getAllRegistrations = async (req, res) => {
  try {
    const doctors = await DoctorRegistration.find();

    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch registrations",
    });
  }
};




exports.Registrationapproved = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ SECURITY: Use atomic operation to prevent race condition in doctor approval
    // Start a session for multi-document transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1️⃣ Find and lock registration (within transaction)
      const registration = await DoctorRegistration.findById(id).session(session);
      if (!registration) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: "Registration not found",
        });
      }

      // ✅ Check if already approved (prevent duplicate processing)
      if (registration.verificationStatus === "APPROVED") {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: "This registration has already been approved",
        });
      }

      // 2️⃣ Find linked user (within transaction)
      const user = await User.findById(registration.user).session(session);
      if (!user) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // 3️⃣ Create Doctor record
      const doctor = await Doctor.create(
        [{
          user: user._id,
          fullName: registration.fullName,
          email: registration.email,
          contact: registration.contact,
          specialization: registration.specialization,
          experienceYears: registration.experienceYears,
          licenseNumber: registration.licenseNumber,
          hospitalName: registration.hospitalName,
          verificationStatus: "APPROVED",
          reviewedAt: new Date(),
        }],
        { session }
      );

      const createdDoctor = doctor[0];

      // 4️⃣ Create DoctorProfile using doctor._id
      const doctorProfile = await DoctorProfile.create(
        [{
          doctorId: createdDoctor._id,
          clinicAddress: null,
          availableDays: [],
          availableHours: { from: null, to: null },
          consultationFee: null,
          languages: [],
          bio: null,
        }],
        { session }
      );

      // 5️⃣ Update Doctor with profile reference
      createdDoctor.additionalDoctorDetails = [doctorProfile[0]._id];
      await createdDoctor.save({ session });

      // 6️⃣ Update User role(s) atomically - support both old and new schema
      if (Array.isArray(user.roles)) {
        if (!user.roles.includes("doctor")) {
          user.roles.push("doctor");
        }
      } else {
        // Migrate old schema to new
        user.roles = [user.role || "user", "doctor"];
      }
      user.role = "doctor";  // Ensure primary role is set
      await user.save({ session });

      // 7️⃣ Update registration status atomically
      registration.verificationStatus = "APPROVED";
      registration.reviewedAt = new Date();
      await registration.save({ session });

      // ✅ Commit transaction
      await session.commitTransaction();

      // 8️⃣ Send notification (after transaction succeeds, non-blocking)
      try {
        await sendNotification({
          recipient: user._id,
          type: "DOCTOR_APPROVED",
          title: "Doctor Application Approved 🎉",
          message:
            "Congratulations! Your doctor registration has been approved. You can now access your doctor dashboard.",
        });
      } catch (notifyErr) {
        if (process.env.NODE_ENV === 'development') {
          console.error("Failed to send approval notification:", notifyErr);
        }
      }

      return res.status(200).json({
        success: true,
        message: "Doctor approved successfully",
        doctor,
        doctorProfile,
      });
    } catch (transactionErr) {
      // Handle transaction errors and abort
      await session.abortTransaction();
      if (process.env.NODE_ENV === 'development') {
        console.error("Transaction error during doctor approval:", transactionErr);
      }
      return res.status(500).json({
        success: false,
        message: "Doctor approval failed",
        error: transactionErr.message,
      });
    } finally {
      // Always end the session
      await session.endSession();
    }
  } catch (error) {
    // Handle errors at the outer level (e.g., session creation failure)
    if (process.env.NODE_ENV === 'development') {
      console.error("Error in doctor approval:", error);
    }
    return res.status(500).json({
      success: false,
      message: "Doctor approval failed",
      error: error.message,
    });
  }
};


exports.Registrationrejected = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminRemarks } = req.body;

    const registration = await DoctorRegistration.findByIdAndUpdate(
      id,
      {
        verificationStatus: "REJECTED",
        adminRemarks: adminRemarks || "Registration rejected",
        reviewedAt: new Date(),
      },
      { new: true }
    );

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    try {
      await sendNotification({
        recipient: registration.user,
        type: "DOCTOR_REJECTED",
        title: "Doctor Application Rejected",
        message:
          "Your doctor registration was reviewed and rejected by admin. You may reapply with updated information.",
      });
    } catch (notifyErr) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Failed to send rejection notification:", notifyErr);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Doctor registration rejected",
    });
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error(err);
    }
    return res.status(500).json({
      success: false,
      message: "Cannot reject registration",
    });
  }
};

exports.deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    if (process.env.NODE_ENV === 'development') {
      console.log(id);
    }

   
    if ((req.user.role || "").toLowerCase() !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

   
    const doctor = await Doctor.findById(id);
    if (process.env.NODE_ENV === 'development') {
      console.log(doctor);
    }
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    
    if (doctor.additionalDoctorDetails?.length > 0) {
      await DoctorProfile.deleteMany({ _id: { $in: doctor.additionalDoctorDetails } });
    }

    
    if (doctor.user) {
      await User.findByIdAndUpdate(doctor.user, { role: "user" });
    }

    
    await Doctor.findByIdAndDelete(id);

    return res.status(200).json({ success: true, message: "Doctor deleted successfully" });
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error(err);
    }
    return res.status(500).json({ success: false, message: "Deletion failed" });
  }
};

