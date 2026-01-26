
const otpTemplate = (otp) => {
	return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - CliniCall</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07); overflow: hidden;">
                    
                    <!-- Header with Logo Space -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                            <!-- LOGO SPACE - Replace the src with your logo URL -->
                            <img src="https://i.ibb.co/KjhpBDBf/Chat-GPT-Image-Jan-3-2026-01-04-19-PM.png" alt="CliniCall Logo" style="max-width: 180px; height: auto; margin-bottom: 20px; display: block; margin-left: auto; margin-right: auto;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">Verify Your Email</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 50px 40px;">
                            <h2 style="color: #1a202c; font-size: 22px; margin: 0 0 16px 0; font-weight: 600;">Welcome to CliniCall!</h2>
                            
                            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                                Thank you for creating an account with CliniCall. To get started with managing your appointments, please verify your email address using the code below.
                            </p>
                            
                            <!-- OTP Code Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                                <tr>
                                    <td align="center">
                                        <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border: 2px dashed #667eea; border-radius: 12px; padding: 24px; display: inline-block;">
                                            <p style="color: #718096; font-size: 14px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Your Verification Code</p>
                                            <p style="color: #667eea; font-size: 42px; font-weight: 700; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                                                ${otp}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 24px 0 0 0; text-align: center;">
                                Enter this code in the verification page to complete your registration.
                            </p>
                            
                            <div style="border-top: 1px solid #e2e8f0; padding-top: 24px; margin-top: 32px;">
                                <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 0 0 12px 0;">
                                    <strong style="color: #4a5568;">Security Note:</strong> This verification code will expire in 10 minutes for your security.
                                </p>
                                <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 0;">
                                    If you didn't create an account with CliniCall, you can safely ignore this email.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f7fafc; padding: 30px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="color: #718096; font-size: 14px; margin: 0 0 12px 0;">
                                Need help? Contact our support team at <a href="mailto:support@clinicall.com" style="color: #667eea; text-decoration: none;">support@clinicall.com</a>
                            </p>
                            <p style="color: #a0aec0; font-size: 12px; margin: 0;">
                                © 2025 CliniCall. All rights reserved.
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`}

 module.exports = otpTemplate;