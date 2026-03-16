const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const DoctorRegistration = require("../models/DoctorRegistration");
const User = require("../models/User");
const Payment = require("../models/Payment");
const Hospital = require("../models/Hospital");
const HospitalRegistration = require("../models/HospitalRegistration");
const mailSender = require("../utils/mailSender");
const appointmentapprovaltemplate = require("../mail/templates/appointmentapprovaltemplate");
const appointmentrejectiontemplate = require("../mail/templates/appointmentrejectiontemplate");
const { log: auditLog } = require('../middleware/auditLogger');
const { sendNotification } = require("../utils/sendNotification");

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
    if (process.env.NODE_ENV === 'development') {
      console.error("Error fetching doctors count:", error);
    }
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
    if (process.env.NODE_ENV === 'development') {
      console.error("Error fetching pending registrations count:", error);
    }
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
    if (process.env.NODE_ENV === 'development') {
      console.error("Error fetching appointments count:", error);
    }
    return res.status(500).json({
      success: false,
      message: "Failed to fetch appointments count",
      error: error.message,
    });
  }
};

// ============================================
// OVERVIEW STATS
// ============================================

exports.getAdminStats = async (req, res) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const [
      totalUsers,
      totalDoctors,
      totalAppointments,
      pendingRegistrations,
      newUsersThisMonth,
      appointmentsToday,
      revenueAgg,
      approvedRegs,
      rejectedRegs,
      responseAgg,
      recentRegistrations,
      recentAppointments,
      totalHospitals,
      totalClinics,
      pendingEntityApplications,
    ] = await Promise.all([
      User.countDocuments({ $or: [{ roles: "user" }, { role: "user" }] }),
      User.countDocuments({ $or: [{ roles: "doctor" }, { role: "doctor" }] }),
      Appointment.countDocuments(),
      DoctorRegistration.countDocuments({ verificationStatus: "PENDING" }),
      User.countDocuments({ $or: [{ roles: "user" }, { role: "user" }], createdAt: { $gte: startOfMonth } }),
      Appointment.countDocuments({ appointmentDate: { $gte: startOfDay, $lte: endOfDay } }),
      Payment.aggregate([
        { $match: { status: "paid" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      DoctorRegistration.countDocuments({ verificationStatus: "APPROVED" }),
      DoctorRegistration.countDocuments({ verificationStatus: "REJECTED" }),
      DoctorRegistration.aggregate([
        { $match: { reviewedAt: { $ne: null } } },
        { $project: { responseMs: { $subtract: ["$reviewedAt", "$submittedAt"] } } },
        { $group: { _id: null, avgMs: { $avg: "$responseMs" } } },
      ]),
      DoctorRegistration.find()
        .select("fullName email verificationStatus submittedAt")
        .sort({ submittedAt: -1 })
        .limit(5),
      Appointment.find()
        .select("approvalstatus appointmentDate appointmentTime createdAt")
        .populate("userId", "fullName")
        .populate("doctorId", "fullName")
        .sort({ createdAt: -1 })
        .limit(5),
      Hospital.countDocuments({ status: "approved", isClinic: false }),
      Hospital.countDocuments({ status: "approved", isClinic: true }),
      HospitalRegistration.countDocuments({ status: "pending" }),
    ]);

    const totalRevenue = revenueAgg?.[0]?.total || 0;
    const reviewedTotal = approvedRegs + rejectedRegs;
    const approvalRate = reviewedTotal ? Math.round((approvedRegs / reviewedTotal) * 100) : 0;
    const avgResponseHours = responseAgg?.[0]?.avgMs ? responseAgg[0].avgMs / (1000 * 60 * 60) : null;

    const recentActivities = [
      ...recentRegistrations.map((reg) => ({
        type: "registration",
        title:
          reg.verificationStatus === "APPROVED"
            ? "Doctor registration approved"
            : reg.verificationStatus === "REJECTED"
            ? "Doctor registration rejected"
            : "New doctor registration",
        detail: reg.fullName,
        timestamp: reg.submittedAt,
      })),
      ...recentAppointments.map((apt) => ({
        type: "appointment",
        title:
          apt.approvalstatus === "APPROVED"
            ? "Appointment approved"
            : apt.approvalstatus === "REJECTED"
            ? "Appointment rejected"
            : apt.approvalstatus === "CANCELLED"
            ? "Appointment cancelled"
            : "Appointment requested",
        detail: `${apt.userId?.fullName || "Patient"} with ${apt.doctorId?.fullName || "Doctor"}`,
        timestamp: apt.createdAt || apt.appointmentDate,
      })),
    ]
      .filter((item) => item.timestamp)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5);

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalDoctors,
        totalAppointments,
        pendingRegistrations,
        totalRevenue,
        newUsersThisMonth,
        appointmentsToday,
        approvalRate,
        avgResponseHours,
        systemStatus: "operational",
        recentActivities,
        totalHospitals,
        totalClinics,
        pendingEntityApplications,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Error fetching admin stats:", error);
    }
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin stats",
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
    if (process.env.NODE_ENV === 'development') {
      console.error("Error fetching doctor registrations:", error);
    }
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

    // audit log
    await auditLog(req.user.id, 'APPROVE_DOCTOR_REG', `registration:${registrationId}`, { adminRemarks });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    // Block approval if doctor applied to a hospital/clinic and it hasn't been approved yet
    if (registration.hospital) {
      if (registration.hospitalStatus !== "approved_hospital") {
        return res.status(400).json({
          success: false,
          message: "This doctor has not been approved by the hospital/clinic yet.",
        });
      }
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
          $or: [{ roles: "doctor" }, { role: "doctor" }],
        });

        if (process.env.NODE_ENV === 'development') {
          console.log("Doctor record created:", newDoctor._id);
        }

        // Add doctor to hospital if applicable
        if (registration.hospital) {
          try {
            await Hospital.findByIdAndUpdate(
              registration.hospital,
              { $push: { doctors: newDoctor._id } }
            );
          } catch (hospErr) {
            if (process.env.NODE_ENV === 'development') {
              console.error("Error adding doctor to hospital:", hospErr);
            }
          }
        }
      }
    } catch (doctorError) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error creating doctor record:", doctorError);
      }
      // Continue with email even if doctor creation fails
    }

    // Ensure user role is updated to doctor - keep both role and roles in sync
    try {
      const user = await User.findById(registration.user._id);
      if (user) {
        if (!Array.isArray(user.roles)) {
          user.roles = [user.role || "user"];
        }
        if (!user.roles.includes("doctor")) {
          user.roles.push("doctor");
        }
        // Keep the singular role field in sync (priority: admin > doctor > user)
        const rolesPriority = ["admin", "hospital_admin", "doctor", "user"];
        user.role = rolesPriority.find(r => user.roles.includes(r)) || "user";
        await user.save();
      }
    } catch (userUpdateError) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error updating user role to doctor:", userUpdateError);
      }
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
      if (process.env.NODE_ENV === 'development') {
        console.error("Error sending approval email:", emailError);
      }
    }

    try {
      await sendNotification({
        recipient: registration.user._id,
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
      message: "Doctor registration approved successfully",
      data: registration,
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Error approving doctor registration:", error);
    }
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

    await auditLog(req.user.id, 'REJECT_DOCTOR_REG', `registration:${registrationId}`, { adminRemarks });

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
      if (process.env.NODE_ENV === 'development') {
        console.error("Error sending rejection email:", emailError);
      }
    }

    try {
      await sendNotification({
        recipient: registration.user._id,
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
      message: "Doctor registration rejected successfully",
      data: registration,
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Error rejecting doctor registration:", error);
    }
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
    if (process.env.NODE_ENV === 'development') {
      console.error("Error fetching appointments:", error);
    }
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

    await auditLog(req.user.id, 'APPROVE_APPOINTMENT', `appointment:${appointmentId}`)
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
      if (process.env.NODE_ENV === 'development') {
        console.error("Error sending approval email:", emailError);
      }
    }

    try {
      await sendNotification({
        recipient: appointment.userId._id,
        type: "APPOINTMENT_BOOKED",
        title: "Appointment Confirmed ✅",
        message: `Your appointment with Dr. ${appointment.doctorId.fullName} is confirmed for ${new Date(
          appointment.appointmentDate
        ).toLocaleDateString()} at ${appointment.appointmentTime}.`,
      });
    } catch (notifyErr) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Failed to send appointment approval notification:", notifyErr);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Appointment approved successfully",
      data: appointment,
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Error approving appointment:", error);
    }
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

    await auditLog(req.user.id, 'REJECT_APPOINTMENT', `appointment:${appointmentId}`, { reason });

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
      if (process.env.NODE_ENV === 'development') {
        console.error("Error sending rejection email:", emailError);
      }
    }

    try {
      await sendNotification({
        recipient: appointment.userId._id,
        type: "APPOINTMENT_CANCELLED",
        title: "Appointment Cancelled",
        message: `Your appointment with Dr. ${appointment.doctorId.fullName} on ${new Date(
          appointment.appointmentDate
        ).toLocaleDateString()} has been cancelled.`,
      });
    } catch (notifyErr) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Failed to send appointment cancellation notification:", notifyErr);
      }
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
      // Support both old (role) and new (roles array) schema
      query.$or = [{ role: role }, { roles: role }];
    }

    const users = await User.find(query)
      .select("fullName email contact role roles createdAt")
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
