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


OTPSchema.pre("save", async function () {
	console.log("New document saved to database");

	
	if (this.isNew) {
		await sendVerificationEmail(this.email, this.otp);
	}
	
});

const OTP = mongoose.model("OTP", OTPSchema);

module.exports = OTP;