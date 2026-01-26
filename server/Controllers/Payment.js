const {instance}=require('../config/razorpay')
const Payment = require("../models/Payment");
const Appointment = require("../models/Appointment")
const doctorProfile = require("../models/DoctorProfile")
const crypto = require("crypto");

exports.createOrder = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    
    const appointment = await Appointment.findById(appointmentId)
      .populate("doctorId");

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

   const doctorId = appointment.doctorId._id

   console.log(doctorId._id)

const doctorprofile = await doctorProfile.findOne({doctorId:doctorId})

console.log(doctorprofile)




   
    const amount = doctorprofile.consultationFee;

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

    const order = await instance.orders.create(options);

  
    await Payment.create({
      user: req.user.id,
      appointment: appointmentId,
      razorpayOrderId: order.id,
      amount,
      status: "created"
    });

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      order:order
    });
  } catch (error) {
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
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
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
       
      }
    );

    res.status(200).json({
      success: true,
      message: "Payment verified & appointment confirmed"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};