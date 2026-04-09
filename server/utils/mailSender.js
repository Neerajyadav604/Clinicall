const nodemailer = require("nodemailer");
require("dotenv").config();

const mailSender = async (email, title, body) => {
    try{
        // ✅ Check if required environment variables are set
        if (!process.env.MAIL_HOST || !process.env.MAIL_USER || !process.env.MAIL_PASS) {
            console.error("❌ MAIL SERVICE ERROR: Missing email configuration variables", {
                has_mail_host: !!process.env.MAIL_HOST,
                has_mail_user: !!process.env.MAIL_USER,
                has_mail_pass: !!process.env.MAIL_PASS
            });
            throw new Error("Email service not configured. Missing MAIL_HOST, MAIL_USER, or MAIL_PASS environment variables.");
        }

        console.log(`📧 Creating transporter for ${process.env.MAIL_USER} on ${process.env.MAIL_HOST}`);
        
        let transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: 587,
            secure: false, // true for 465, false for other ports
            auth:{
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            }
        })

        console.log(`📧 Sending email to ${email} with subject: ${title}`);
        
        let info = await transporter.sendMail({
            from: `Clinicall <${process.env.MAIL_USER}>`,
            to: `${email}`,
            subject: `${title}`,
            html: `${body}`,
        })
        console.log("✅ Email sent successfully: ", info.response);
        return info;
    }
    catch(error) {
        console.error("❌ Error occurred while sending email:", {
            message: error.message,
            code: error.code,
            stack: error.stack,
            recipient: email,
            timestamp: new Date().toISOString()
        });
        throw error;
    }
}


module.exports = mailSender;