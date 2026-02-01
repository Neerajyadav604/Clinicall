const {instance}=require('../config/razorpay')
const Payment = require("../models/Payment");
const Appointment = require("../models/Appointment")
const doctorProfile = require("../models/DoctorProfile")
const crypto = require("crypto");
require("dotenv").config()
exports.createOrder = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    console.log("💰 createOrder called with appointmentId:", appointmentId);

    const appointment = await Appointment.findById(appointmentId)
      .populate("doctorId");

    console.log("📋 Appointment found:", appointment ? "Yes" : "No");

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

    // Try to get doctor profile with consultation fee
    let doctorprofile = await doctorProfile.findOne({ doctorId: doctorId });

    // Default consultation fee if profile doesn't exist
    let amount = 500; // Default fee in INR

    if (doctorprofile && doctorprofile.consultationFee) {
      amount = doctorprofile.consultationFee;
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid consultation fee"
      });
    }

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: `receipt_${appointmentId}`
    };

    console.log("🔧 Razorpay options:", options);
    console.log("💳 Razorpay instance:", instance ? "Initialized" : "NOT initialized");

    const order = await instance.orders.create(options);
    
    console.log("✅ Order created:", order.id);

   const paymentcreated =  await Payment.create({
      user: req.user.id,
      appointment: appointmentId,
      razorpayOrderId: order.id,
      amount,
      status: "created"
    });
 console.log("Payment Created", paymentcreated)
    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY,
      order:order,
      
    });
  } catch (error) {
    console.error("❌ Payment error:", error.message);
    console.error("🔍 Full error:", error);
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

   
    await Appointment.findByIdAndUpdate(
      payment.appointment,
      {
        paymentStatus: "paid",
        consultationMode: "online",
        isChatEnabled: true
      }
    );

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