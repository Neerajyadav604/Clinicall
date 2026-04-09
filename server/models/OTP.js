const mongoose = require("mongoose");
const otpTemplate = require("../mail/templates/emailVerificationTemplate")
const mailSender = require("../utils/mailSender");
const OTPSchema = new mongoose.Schema({
	email: {
		type: String,
		required: true,
	},
	otp: {
		type: String,
		required: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
		expires: 60 * 5, 
	},
});


async function sendVerificationEmail(email, otp) {
	
	try {
		const mailResponse = await mailSender(
			email,
			"Verification Email",
			otpTemplate(otp)
		);
		console.log("Email sent successfully: ", mailResponse.response);
	} catch (error) {
		console.log("Error occurred while sending email: ", error);
		throw error;
	}
}


// ✅ CORRECT: Async pattern - NO next() parameter
OTPSchema.pre("save", async function () {
	console.log("[OTP Pre-Save] New document being saved");

	// ✅ Only send email for NEW documents
	if (this.isNew) {
		try {
			await sendVerificationEmail(this.email, this.otp);
			console.log(`✅ OTP email sent successfully to ${this.email}`);
			// ← No next() call - async hook returns promise automatically
		} catch (error) {
			console.error(`❌ CRITICAL: Failed to send OTP email to ${this.email}`, {
				error: error.message,
				code: error.code,
				stack: error.stack,
				timestamp: new Date().toISOString(),
			});
			// ← Don't call next(error) - throw instead
			throw error; // Mongoose catches and rejects the promise
		}
	}
	// ← No else needed - hook completes successfully if not new
});

const OTP = mongoose.model("OTP", OTPSchema);

module.exports = OTP;