const { getDoctorSpecialties } = require('../services/phi3.service');
const aiService = require('../services/ai.service');
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

    let doctors = await Doctor.find({
      specialization: { 
        $in: specialties.map(s => new RegExp(`^${s}$`, "i")) 
      }
    });

    // if symptoms or analysis present, compute ranking
    if (req.body.symptoms) {
      const historyData = await Appointment.find({ user: userId }).sort({appointmentDate:-1}).limit(5);
      const historyText = historyData.map(a=>a.reason||'').join('\n');
      const analysis = await aiService.analyzeSymptoms(req.body.symptoms, historyText);
      // reorder doctors by score if available
      const ranked = analysis.doctors.map(d=>d.doctor._id.toString());
      if (ranked.length) {
        doctors.sort((a,b)=>{
          const ai = ranked.indexOf(a._id.toString());
          const bi = ranked.indexOf(b._id.toString());
          return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
        });
      }
      res.locals.aiUrgency = analysis.urgency;
    }

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

    const payload = { success: true, doctors: doctorsWithStatus };
    if (res.locals.aiUrgency) payload.urgency = res.locals.aiUrgency;
    if (aiResult) payload.aiResult = aiResult;
    res.json(payload);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI processing failed" });
  }
};
