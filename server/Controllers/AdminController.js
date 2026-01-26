const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const DoctorRegistration = require("../models/DoctorRegistration");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const appointmentapprovaltemplate = require("../mail/templates/appointmentapprovaltemplate");
const appointmentrejectiontemplate = require("../mail/templates/appointmentrejectiontemplate");

// ============================================
// DASHBOARD STATS
// ============================================

exports.getDoctorsCount = async (req, res) => {
  try {
    const count = await Doctor.countDocuments({
      verificationStatus: "APPROVED",
    });
    return res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    console.error("Error fetching doctors count:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch doctors count",
      error: error.message,
    });
  }
};

exports.getPendingRegistrationsCount = async (req, res) => {
  try {
    const count = await DoctorRegistration.countDocuments({
      verificationStatus: "PENDING",
    });
    return res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    console.error("Error fetching pending registrations count:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch pending registrations count",
      error: error.message,
    });
  }
};

exports.getAppointmentsCount = async (req, res) => {
  try {
    const totalCount = await Appointment.countDocuments();
    const pendingCount = await Appointment.countDocuments({
      approvalstatus: "PENDING",
    });

    return res.status(200).json({
      success: true,
      count: totalCount,
      pendingCount,
    });
  } catch (error) {
    console.error("Error fetching appointments count:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch appointments count",
      error: error.message,
    });
  }
};

// ============================================
// DOCTOR REGISTRATIONS MANAGEMENT
// ============================================

exports.getDoctorRegistrations = async (req, res) => {
  try {
    const { status } = req.query;

    let query = {};
    if (status) {
      query.verificationStatus = status;
    }

    const registrations = await DoctorRegistration.find(query)
      .populate("user")
      .sort({ submittedAt: -1 });

    return res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations,
    });
  } catch (error) {
    console.error("Error fetching doctor registrations:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch doctor registrations",
      error: error.message,
    });
  }
};

exports.approveDoctorRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { adminRemarks } = req.body;

    const registration = await DoctorRegistration.findByIdAndUpdate(
      registrationId,
      {
        verificationStatus: "APPROVED",
        adminRemarks,
        reviewedAt: new Date(),
      },
      { new: true }
    ).populate("user");

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    // Create Doctor record from approved registration
    try {
      const existingDoctor = await Doctor.findOne({ user: registration.user._id });
      
      if (!existingDoctor) {
        const newDoctor = await Doctor.create({
          user: registration.user._id,
          fullName: registration.fullName,
          email: registration.email,
          contact: registration.contact,
          specialization: registration.specialization,
          qualification: registration.qualification,
          experienceYears: registration.experienceYears,
          licenseNumber: registration.licenseNumber,
          hospitalName: registration.hospitalName,
          documents: registration.documents || [],
          verificationStatus: "APPROVED",
          role: "doctor",
        });

        console.log("Doctor record created:", newDoctor._id);
      }
    } catch (doctorError) {
      console.error("Error creating doctor record:", doctorError);
      // Continue with email even if doctor creation fails
    }

    // Send approval email
    try {
      await mailSender(
        registration.email,
        "Doctor Registration Approved",
        appointmentapprovaltemplate(
          registration.fullName,
          registration.specialization
        )
      );
    } catch (emailError) {
      console.error("Error sending approval email:", emailError);
    }

    return res.status(200).json({
      success: true,
      message: "Doctor registration approved successfully",
      data: registration,
    });
  } catch (error) {
    console.error("Error approving doctor registration:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to approve doctor registration",
      error: error.message,
    });
  }
};

exports.rejectDoctorRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { adminRemarks } = req.body;

    const registration = await DoctorRegistration.findByIdAndUpdate(
      registrationId,
      {
        verificationStatus: "REJECTED",
        adminRemarks: adminRemarks || "Application rejected by admin",
        reviewedAt: new Date(),
      },
      { new: true }
    ).populate("user");

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    // Send rejection email
    try {
      await mailSender(
        registration.email,
        "Doctor Registration Rejected",
        appointmentrejectiontemplate(registration.fullName, adminRemarks)
      );
    } catch (emailError) {
      console.error("Error sending rejection email:", emailError);
    }

    return res.status(200).json({
      success: true,
      message: "Doctor registration rejected successfully",
      data: registration,
    });
  } catch (error) {
    console.error("Error rejecting doctor registration:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reject doctor registration",
      error: error.message,
    });
  }
};

// ============================================
// APPOINTMENTS MANAGEMENT
// ============================================

exports.getAllAppointments = async (req, res) => {
  try {
    const { status } = req.query;

    let query = {};
    if (status) {
      query.approvalstatus = status;
    }

    const appointments = await Appointment.find(query)
      .populate("userId", "fullName email")
      .populate("doctorId", "fullName specialization")
      .sort({ appointmentDate: -1 });

    // Format response to match frontend expectations
    const formattedAppointments = appointments.map((apt) => ({
      _id: apt._id,
      patientName: apt.userId?.fullName || "Unknown",
      patientEmail: apt.userId?.email || "N/A",
      doctorName: apt.doctorId?.fullName || "Unknown",
      specialization: apt.doctorId?.specialization || "N/A",
      appointmentDate: apt.appointmentDate,
      appointmentTime: apt.appointmentTime,
      status: apt.status,
      approvalstatus: apt.approvalstatus,
      reason: apt.reason,
      createdAt: apt.createdAt,
    }));

    return res.status(200).json({
      success: true,
      count: formattedAppointments.length,
      data: formattedAppointments,
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch appointments",
      error: error.message,
    });
  }
};

exports.approveAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { approvalstatus: "APPROVED" },
      { new: true }
    )
      .populate("userId", "fullName email")
      .populate("doctorId", "fullName email");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Send approval email to patient
    try {
      await mailSender(
        appointment.userId.email,
        "Appointment Approved",
        appointmentapprovaltemplate(
          appointment.userId.fullName,
          appointment.doctorId.fullName,
          appointment.appointmentDate,
          appointment.appointmentTime
        )
      );
    } catch (emailError) {
      console.error("Error sending approval email:", emailError);
    }

    return res.status(200).json({
      success: true,
      message: "Appointment approved successfully",
      data: appointment,
    });
  } catch (error) {
    console.error("Error approving appointment:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to approve appointment",
      error: error.message,
    });
  }
};

exports.rejectAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { reason } = req.body;

    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      {
        approvalstatus: "REJECTED",
        status: "NOT SCHEDULED",
      },
      { new: true }
    )
      .populate("userId", "fullName email")
      .populate("doctorId", "fullName email");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Send rejection email to patient
    try {
      await mailSender(
        appointment.userId.email,
        "Appointment Cancelled",
        appointmentrejectiontemplate(appointment.userId.fullName, reason)
      );
    } catch (emailError) {
      console.error("Error sending rejection email:", emailError);
    }

    return res.status(200).json({
      success: true,
      message: "Appointment rejected successfully",
      data: appointment,
    });
  } catch (error) {
    console.error("Error rejecting appointment:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reject appointment",
      error: error.message,
    });
  }
};

// ============================================
// USERS MANAGEMENT
// ============================================

exports.getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;

    let query = {};
    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select("fullName email contact role createdAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

// ============================================
// APPROVED DOCTORS
// ============================================

exports.getApprovedDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({
      verificationStatus: "APPROVED",
    })
      .populate("user", "email contact")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors,
    });
  } catch (error) {
    console.error("Error fetching approved doctors:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch approved doctors",
      error: error.message,
    });
  }
};

// ============================================
// REJECTED DOCTORS
// ============================================

exports.getRejectedDoctors = async (req, res) => {
  try {
    const doctors = await DoctorRegistration.find({
      verificationStatus: "REJECTED",
    })
      .populate("user", "email contact")
      .sort({ reviewedAt: -1 });

    return res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors,
    });
  } catch (error) {
    console.error("Error fetching rejected doctors:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch rejected doctors",
      error: error.message,
    });
  }
};

// ============================================
// SEND NOTIFICATION EMAIL
// ============================================

exports.sendNotificationEmail = async (req, res) => {
  try {
    const { email, status, doctorName, templateType } = req.body;

    if (!email || !status) {
      return res.status(400).json({
        success: false,
        message: "Email and status are required",
      });
    }

    let emailTemplate;
    let subject;

    if (templateType === "doctorRegistration") {
      if (status === "approved") {
        subject = "Doctor Registration Approved - ClinicAll";
        emailTemplate = appointmentapprovaltemplate(doctorName, status);
      } else if (status === "rejected") {
        subject = "Doctor Registration Rejected - ClinicAll";
        emailTemplate = appointmentrejectiontemplate(doctorName, "Application rejected");
      }
    } else if (templateType === "appointment") {
      if (status === "approved") {
        subject = "Appointment Confirmed - ClinicAll";
        emailTemplate = appointmentapprovaltemplate(doctorName, status);
      } else if (status === "rejected") {
        subject = "Appointment Cancelled - ClinicAll";
        emailTemplate = appointmentrejectiontemplate(doctorName, "Appointment cancelled");
      }
    }

    if (!emailTemplate) {
      return res.status(400).json({
        success: false,
        message: "Invalid template type or status",
      });
    }

    await mailSender(email, subject, emailTemplate);

    return res.status(200).json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send email",
      error: error.message,
    });
  }
};
