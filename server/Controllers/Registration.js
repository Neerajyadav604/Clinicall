const DoctorRegistration = require('../models/DoctorRegistration')
const Doctor = require('../models/Doctor')
const DoctorProfile = require('../models/DoctorProfile')
const User = require("../models/User")


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

    // 1️⃣ Find registration
    const registration = await DoctorRegistration.findById(id);
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }
console.log(registration)
    // 2️⃣ Find linked user
    const user = await User.findById(registration.user);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
console.log(user._id)
    
const doctor = await Doctor.create({
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
});



// 2️⃣ Create DoctorProfile using doctor._id
const doctorProfile = await DoctorProfile.create({
  doctorId: doctor._id,
  clinicAddress: null,
  availableDays: [],
  availableHours: { from: null, to: null },
  consultationFee: null,
  languages: [],
  bio: null,
});

// 3️⃣ Update Doctor with profile reference
doctor.additionalDoctorDetails = [doctorProfile._id];
await doctor.save();
console.log(doctor)

    // 5️⃣ Update User role
    user.role = "doctor";
    await user.save();

    // 6️⃣ Update registration
    registration.verificationStatus = "APPROVED";
    registration.reviewedAt = new Date();
    await registration.save();

    return res.status(200).json({
      success: true,
      message: "Doctor approved successfully",
      doctor,
      doctorProfile,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Doctor approval failed",
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

    return res.status(200).json({
      success: true,
      message: "Doctor registration rejected",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Cannot reject registration",
    });
  }
};

exports.deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id)

   
    if ((req.user.role || "").toLowerCase() !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

   
    const doctor = await Doctor.findById(id);
    console.log(doctor)
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
    console.error(err);
    return res.status(500).json({ success: false, message: "Deletion failed" });
  }
};

