const { getDoctorSpecialties } = require('../services/phi3.service');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');

exports.searchdoctors = async (req, res) => {
  try {
    const { query } = req.body;
    const userId = req.user.id

    console.log("query :",query, "userId :",userId)

    if (!query || !userId) {
      return res.status(400).json({ error: "Query and userId are required" });
    }

    const aiResult = await getDoctorSpecialties(query);

    const specialtiesSet = new Set();
    if (aiResult.conditions && Array.isArray(aiResult.conditions)) {
      aiResult.conditions.forEach(cond => {
        cond.primarySpecialty?.forEach(s => specialtiesSet.add(s));
        cond.relatedSubspecialties?.forEach(s => specialtiesSet.add(s));
      });
    }

    const specialties = Array.from(specialtiesSet);

    if (specialties.length === 0) {
      return res.json({ success: true, doctors: [], aiResult });
    }

    const doctors = await Doctor.find({
      specialization: { 
        $in: specialties.map(s => new RegExp(`^${s}$`, "i")) 
      }
    });

    const appointments = await Appointment.find({
      user: userId,
      doctor: { $in: doctors.map(d => d._id) }
    });

    const doctorsWithStatus = doctors.map(doc => {
      const appointment = appointments.find(
        a => a.doc.toString() === doc._id.toString()
      );

      let buttonStatus = "Request Appointment";

      if (appointment) {
        switch (appointment.approvalstatus) {
          case "PENDING":
            buttonStatus = "Request Sent";
            break;
          case "APPROVED":
            buttonStatus = "Rqueste Accepted";
            break;
          case "REJECTED":
            buttonStatus = "Request Again";
            break;
        }
      }

      return {
        ...doc.toObject(),
        buttonStatus
      };
    });

    res.json({
      success: true,
      doctors: doctorsWithStatus,
      aiResult
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI processing failed" });
  }
};
