const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../middleware/authMiddleware");
const { createOrder, verifyPayment } = require("../Controllers/Payment");

// ============================================
// PAYMENT ROUTES
// ============================================

/**
 * POST /api/v1/createOrder
 * Create Razorpay order for appointment consultation payment
 */
router.post("/createOrder", authenticateUser, createOrder);

/**
 * POST /api/v1/verifyPayment
 * Verify Razorpay payment and update appointment
 */
router.post("/verifyPayment", authenticateUser, verifyPayment);

module.exports = router;
