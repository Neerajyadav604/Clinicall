const {instance}=require('../config/razorpay')
const Payment = require("../models/Payment");
const Appointment = require("../models/Appointment")
const doctorProfile = require("../models/DoctorProfile")
const crypto = require("crypto");
require("dotenv").config()
exports.createOrder = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    if (process.env.NODE_ENV === 'development') {
      console.log("💰 createOrder called with appointmentId:", appointmentId);
    }

    const appointment = await Appointment.findById(appointmentId)
      .populate("doctorId");

    if (process.env.NODE_ENV === 'development') {
      console.log("📋 Appointment found:", appointment ? "Yes" : "No");
    }

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
    }

    if (appointment.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const doctorId = appointment.doctorId._id;

    // ✅ SECURITY: Fetch and verify the consultation fee from doctor profile
    let doctorprofile = await doctorProfile.findOne({ doctorId: doctorId });

    if (!doctorprofile) {
      return res.status(400).json({
        success: false,
        message: "Doctor profile not found. Cannot determine consultation fee."
      });
    }

    let amount = doctorprofile.consultationFee;

    // Verify amount is valid and matches contracted fee
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Doctor has not set a valid consultation fee"
      });
    }

    // ✅ Ensure amount is in valid integer range (prevent float issues in Razorpay)
    amount = Math.round(Number(amount));
    if (amount > 999999) {
      return res.status(400).json({
        success: false,
        message: "Consultation fee exceeds maximum allowed amount"
      });
    }

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: `receipt_${appointmentId}`
    };

    if (process.env.NODE_ENV === 'development') {
      console.log("🔧 Razorpay options:", options);
      console.log("💳 Razorpay instance:", instance ? "Initialized" : "NOT initialized");
    }

    const order = await instance.orders.create(options);
    
    if (process.env.NODE_ENV === 'development') {
      console.log("✅ Order created:", order.id);
    }

   const paymentcreated =  await Payment.create({
      user: req.user.id,
      appointment: appointmentId,
      razorpayOrderId: order.id,
      amount,
      status: "created"
    });
   if (process.env.NODE_ENV === 'development') {
     console.log("Payment Created", paymentcreated);
   }
    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY,
      order:order,
      
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("❌ Payment error:", error.message);
      console.error("🔍 Full error:", error);
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

   
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed"
      });
    }

   
    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: "paid"
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found"
      });
    }

    // ✅ SECURITY: Verify appointment update succeeded before confirming payment
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      payment.appointment,
      {
        paymentStatus: "paid",
        consultationStatus: "active",
        paidAt: new Date(),
        consultationMode: "online",
        isChatEnabled: true
      },
      { new: true }
    );

    if (!updatedAppointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found or could not be updated"
      });
    }

    res.status(200).json({
      success: true,
      message: "Payment verified & appointment confirmed",
      appointmentId: payment.appointment,
      consultationMode: "online"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
