const Appointment = require("../models/Appointment");

const requirePayment = async (req, res, next) => {
  try {
    const appointmentId =
      req.params.appointmentId ||
      req.body.appointmentId ||
      req.query.appointmentId;

    if (!appointmentId) {
      return res.status(400).json({
        message: "appointmentId is required for payment-gated access",
        code: "APPOINTMENT_ID_REQUIRED",
      });
    }

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    if (appointment.paymentStatus !== "paid") {
      return res.status(403).json({
        message: "Payment required before consultation access",
        code: "PAYMENT_REQUIRED",
        paymentStatus: appointment.paymentStatus,
      });
    }
    if (appointment.consultationStatus !== "active") {
      return res.status(403).json({
        message: "Consultation not yet active",
        code: "CONSULTATION_LOCKED",
        consultationStatus: appointment.consultationStatus,
      });
    }
    req.appointment = appointment;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = requirePayment;
