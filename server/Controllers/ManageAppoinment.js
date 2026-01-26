const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require("../models/User")
const appointmentrequest = require('../mail/templates/AppointmentSendTemplate')
const appointmentapprovaltemplate = require('../mail/templates/appointmentapprovaltemplate')
const appointmentsendtemplate = require('../mail/templates/AppointmentSendTemplate')
const appointmentrejectiontemplate = require('../mail/templates/appointmentrejectiontemplate')


const mailSender = require('../utils/mailSender')

exports.requestAppointment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { doctorId } = req.params;
    const { appointmentDate, appointmentTime, reason } = req.body;

    if (!appointmentDate || !appointmentTime || !reason) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const doctorExists = await Doctor.findById(doctorId);
    if (!doctorExists) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    const existingAppointment = await Appointment.findOne({
      userId,
      doctorId,
      status: "NOT SCHEDULED",
      approvalstatus: "PENDING",
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: "Appointment request already sent",
      });
    }

    const appointment = await Appointment.create({
      userId,
      doctorId,
      appointmentDate,
      appointmentTime,
      reason,
      status: "NOT SCHEDULED",
      approvalstatus: "PENDING",
    });


    const user = await User.findById(userId);
    const doctor = await Doctor.findById(doctorId);



    const username = user.fullName;
    const doctorname = doctor.fullName;
    const contact = user.contact
    const email = user.email

    const specialization = doctor.specialization

    try {
      await mailSender(
        user.email,
        "Appointment Request Sent",
        appointmentrequest(
          username,
          doctorname,
          appointmentDate,
          appointmentTime,
          reason,
          specialization,

        )
      );
    } catch (mailErr) {
      console.error("Email failed but appointment created:", mailErr.message);
    }



    try {
      await mailSender(
        doctor.email,
        "Appointment Request Sent",
        appointmentsendtemplate(
          username,
          doctorname,
          appointmentDate,
          appointmentTime,
          reason,
          contact,
          email,

        )
      );
    } catch (mailErr) {
      console.error("Email failed but appointment created:", mailErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Appointment request sent successfully",
      appointment,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Cannot book appointment",
    });
  }
};





exports.approveAppointment = async (req, res) => {
  try {
    const user = req.user.id;
    const { appointmentId } = req.params;
    console.log("userId :", user)


    const doctor = await Doctor.findOne({ user: user })
    const doctorId = doctor._id

    console.log(doctorId)

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctorId: doctorId
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
    }

    appointment.status = "SCHEDULED";
    await appointment.save();

    appointment.approvalstatus = "APPROVED"
    await appointment.save();

    try {

      const user = await User.findById(user)
      const doctor = await Doctor.findById(doctorId)

      const username = user.fullName;
      const doctorname = doctor.fullName;
      const specialization = doctor.specialization
      const appointmentDate = appointment.appointmentDate;
      const appointmentTime = appointment.appointmentTime;
      const reason = appointment.reason;


      await mailSender(user.email, "Appointment Approval Notification", appointmentapprovaltemplate(username, doctorname, specialization, appointmentDate, appointmentTime, reason))


    } catch (err) {
      console.log(err)
    }



    return res.status(200).json({
      success: true,
      message: "Appointment approved",
      appointment
    });



  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Approval failed"
    });
  }
};


exports.rejectAppointment = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { appointmentId } = req.params;

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctor: doctorId
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
    }



    appointment.approvalstatus = "REJECTED"
    await appointment.save();


    try {


      const doctor = await Doctor.findById(doctorId)
      const appointment = await Appointment.findOne({ doctorId: doctorId })

      const appointmentuserId = appointment.userId;
      const user = await User.findById(appointmentuserId)


      const username = user.fullName;
      const doctorname = doctor.fullName;
      const specialization = doctor.specialization
      const appointmentDate = appointment.appointmentDate;
      const appointmentTime = appointment.appointmentTime;
      const reason = appointment.reason;


      await mailSender(user.email, "Appointment Approval Notification", appointmentapprovaltemplate(username, doctorname, specialization, appointmentDate, appointmentTime, reason))


    } catch (err) {
      console.log(err)
    }


    return res.status(200).json({
      success: true,
      message: "Appointment rejected",
      appointment
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Rejection failed"
    });
  }
};


exports.getuserappointmentsrequeste = async (req, res) => {

  try {

    const userId = req.user.id;

    const appointmentsrequested = await Appointment.find({
      userId: userId,
      approvalstatus: "APPROVED",
      status: "SCHEDULED"

    }).populate("doctorId");

    if (appointmentsrequested.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No Appointment Request Found"

      })
    }


    return res.status(200).json({
      success: true,
      message: "Appointment Requestes Found successfully",
      requestes: appointmentsrequested
    })


  } catch (err) {

    console.log(err)
    return res.status(500).json({
      success: false,
      message: "Cannot find Appointments Requested"
    })
  }
}

exports.getuserappointmentsrequestefordoctor = async (req, res) => {

  try {

    const { doctorId } = req.params;

    const appointmentsrequested = await Appointment.find({
      doctorId: doctorId,
      approvalstatus: "PENDING",
      status: "NOT SCHEDULED"

    }).populate("userId");

    if (appointmentsrequested.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No Appointment Request Found"

      })
    }


    return res.status(200).json({
      success: true,
      message: "Appointment Requestes Found successfully",
      requestes: appointmentsrequested
    })


  } catch (err) {

    console.log(err)
    return res.status(500).json({
      success: false,
      message: "Cannot find Appointments Requested"
    })
  }
}


exports.appointmentCompleted = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findOneAndUpdate(
      {
        _id: appointmentId,
        approvalStatus: "APPROVED",
        status: "SCHEDULED"
      },
      {
        status: "COMPLETED"
      },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found or already completed"
      });
    }

    res.status(200).json({
      success: true,
      message: "Appointment completed successfully",
      data: appointment
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



exports.getAppointmentDetails = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.id;

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      user: userId
    })
      .populate("doctor", `
      fullName
      qualification
      specialization
      experience
      hospitalName
      contact
    `);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
    }

    res.status(200).json({
      success: true,
      data: appointment
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



exports.appointmentcompletion = async (req, res) => {

  try {

    const { appointmentId } = req.params;

    const appointment = await Appointment.findByIdAndUpdate(appointmentId, {
      status: "COMPLETED"
    },
      { new: true }
    )





    return res.status(200).json({
      success: true,
      message: "Appointment Completed Successfully"
    })

} catch (err) {
    console.log(err)
  }
}

// ============================================
// DOCTOR DASHBOARD ENDPOINTS
// ============================================

/**
 * Get all appointments for a specific doctor
 * Used by doctor dashboard to fetch all doctor's appointments
 */
exports.getDoctorAppointments = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find doctor by user ID
    const doctor = await Doctor.findOne({ user: userId });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // Get all appointments for this doctor
    const appointments = await Appointment.find({
      doctorId: doctor._id,
    })
      .populate("userId", "fullName email contact")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: appointments,
      count: appointments.length,
    });
  } catch (error) {
    console.error("Error fetching doctor appointments:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch appointments",
      error: error.message,
    });
  }
};

/**
 * Get appointment statistics for doctor dashboard
 * Returns counts by appointment status
 */
exports.getDoctorAppointmentStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find doctor by user ID
    const doctor = await Doctor.findOne({ user: userId });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    const doctorId = doctor._id;

    // Get counts by status
    const stats = {
      total: await Appointment.countDocuments({ doctorId }),
      pending: await Appointment.countDocuments({
        doctorId,
        approvalstatus: "PENDING",
      }),
      approved: await Appointment.countDocuments({
        doctorId,
        approvalstatus: "APPROVED",
      }),
      rejected: await Appointment.countDocuments({
        doctorId,
        approvalstatus: "REJECTED",
      }),
    };

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching doctor stats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch appointment statistics",
      error: error.message,
    });
  }
};







