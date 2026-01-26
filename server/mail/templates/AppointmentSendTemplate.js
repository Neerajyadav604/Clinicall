
const appointmentsendTemplate = ( username, doctorname, appointmentDate,appointmentTime,reason,email,contact) => {
	return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Appointment Request - CliniCall</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07); overflow: hidden;">
                    
                    <!-- Header with Logo Space -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                            <img src="https://i.ibb.co/KjhpBDBf/Chat-GPT-Image-Jan-3-2026-01-04-19-PM.png" alt="CliniCall Logo" style="max-width: 180px; height: auto; margin-bottom: 20px; display: block; margin-left: auto; margin-right: auto;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">New Appointment Request</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 50px 40px;">
                            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                                Dear <strong style="color: #1a202c;">Dr. ${doctorname}</strong>,
                            </p>
                            
                            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
                                You have received a new appointment request from a patient. Please review the details below and confirm or decline the appointment at your earliest convenience.
                            </p>
                            
                            <!-- Patient Information Box -->
                            <div style="background-color: #f7fafc; border-left: 4px solid #667eea; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                                <h3 style="color: #1a202c; font-size: 18px; margin: 0 0 20px 0; font-weight: 600;">Patient Information</h3>
                                
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td style="padding: 8px 0;">
                                            <p style="color: #718096; font-size: 14px; margin: 0; font-weight: 600;">Patient Name</p>
                                            <p style="color: #1a202c; font-size: 16px; margin: 4px 0 0 0;">${username}</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0;">
                                            <p style="color: #718096; font-size: 14px; margin: 0; font-weight: 600;">Contact Number</p>
                                            <p style="color: #1a202c; font-size: 16px; margin: 4px 0 0 0;">${contact}</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0;">
                                            <p style="color: #718096; font-size: 14px; margin: 0; font-weight: 600;">Email</p>
                                            <p style="color: #1a202c; font-size: 16px; margin: 4px 0 0 0;">${email}</p>
                                        </td>
                                    </tr>
                                    
                                </table>
                            </div>
                            
                            <!-- Appointment Details Box -->
                            <div style="background-color: #fef5e7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
                                <h3 style="color: #1a202c; font-size: 18px; margin: 0 0 20px 0; font-weight: 600;">Appointment Details</h3>
                                
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td style="padding: 8px 0;">
                                            <p style="color: #78350f; font-size: 14px; margin: 0; font-weight: 600;">Requested Date & Time</p>
                                            <p style="color: #1a202c; font-size: 16px; margin: 4px 0 0 0; font-weight: 600;">${appointmentDate} at ${appointmentTime}</p>
                                        </td>
                                    </tr>
                                   
                                    <tr>
                                        <td style="padding: 8px 0;">
                                            <p style="color: #78350f; font-size: 14px; margin: 0; font-weight: 600;">Reason for Visit</p>
                                            <p style="color: #1a202c; font-size: 16px; margin: 4px 0 0 0;">${reason}</p>
                                        </td>
                                    </tr>

                                </table>
                            </div>
                            
                            <!-- Action Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="YOUR_DASHBOARD_LINK" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                                            View in Dashboard
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <div style="background-color: #eff6ff; border-radius: 8px; padding: 20px; margin-top: 24px;">
                                <p style="color: #1e40af; font-size: 14px; line-height: 1.6; margin: 0;">
                                    <strong>Note:</strong> The patient is waiting for your confirmation. Please respond within 24 hours to maintain a good patient experience.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f7fafc; padding: 30px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="color: #718096; font-size: 14px; margin: 0 0 12px 0;">
                                Questions? Contact support at <a href="mailto:support@clinicall.com" style="color: #667eea; text-decoration: none;">support@clinicall.com</a>
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

 module.exports = appointmentsendTemplate;