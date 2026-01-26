const appointmentrejectiontemplate = (username,doctorname,specialization,appointmentDate,appointmentTime,reason)=>{
    return ` <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Appointment Update - CliniCall</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07); overflow: hidden;">
                    
                    <!-- Header with Logo Space -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #64748b 0%, #475569 100%); padding: 40px 30px; text-align: center;">
                            <img src="YOUR_LOGO_URL_HERE" alt="CliniCall Logo" style="max-width: 180px; height: auto; margin-bottom: 20px; display: block; margin-left: auto; margin-right: auto;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">Appointment Update</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 50px 40px;">
                            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                                Hi <strong style="color: #1a202c;">${username}</strong>,
                            </p>
                            
                            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
                                We regret to inform you that your appointment request with <strong style="color: #1a202c;">DOCTOR_NAME</strong> could not be confirmed at this time.
                            </p>
                            
                            <!-- Status Badge -->
                            <div style="text-align: center; margin-bottom: 32px;">
                                <span style="display: inline-block; background-color: #fee2e2; color: #991b1b; padding: 10px 24px; border-radius: 20px; font-size: 14px; font-weight: 600;">
                                    ✕ Status: Declined
                                </span>
                            </div>
                            
                            <!-- Appointment Details Box -->
                            <div style="background-color: #f8fafc; border: 2px solid #cbd5e1; border-radius: 12px; padding: 28px; margin-bottom: 32px;">
                                <h3 style="color: #475569; font-size: 18px; margin: 0 0 20px 0; font-weight: 600; text-align: center;">Requested Appointment Details</h3>
                                
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                            <p style="color: #475569; font-size: 14px; margin: 0; font-weight: 600;">Doctor</p>
                                            <p style="color: #1a202c; font-size: 16px; margin: 4px 0 0 0;">${doctorname}</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                            <p style="color: #475569; font-size: 14px; margin: 0; font-weight: 600;">Specialization</p>
                                            <p style="color: #1a202c; font-size: 16px; margin: 4px 0 0 0;">${specialization}</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                            <p style="color: #475569; font-size: 14px; margin: 0; font-weight: 600;">Date & Time</p>
                                            <p style="color: #1a202c; font-size: 16px; margin: 4px 0 0 0;">${appointmentDate} at ${appointmentTime}</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px 0;">
                                            <p style="color: #475569; font-size: 14px; margin: 0; font-weight: 600;">Reason for Visit</p>
                                            <p style="color: #1a202c; font-size: 16px; margin: 4px 0 0 0;">${reason}</p>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            
                          
                           
                            
                            <!-- Next Steps -->
                            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 20px; margin-bottom: 32px;">
                                <h4 style="color: #1e40af; font-size: 16px; margin: 0 0 12px 0; font-weight: 600;">What You Can Do</h4>
                                <ul style="color: #1e40af; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                                    <li>Request a different date or time with the same doctor</li>
                                    <li>Book an appointment with another available doctor</li>
                                    <li>Contact our support team for assistance in finding a suitable alternative</li>
                                </ul>
                            </div>
                            
                            <!-- Action Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="YOUR_BOOKING_LINK" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                                            Book Another Appointment
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0; text-align: center;">
                                We apologize for any inconvenience and appreciate your understanding.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f7fafc; padding: 30px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="color: #718096; font-size: 14px; margin: 0 0 12px 0;">
                                Need help finding an appointment? Contact us at <a href="mailto:support@clinicall.com" style="color: #667eea; text-decoration: none;">support@clinicall.com</a>
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
</html>   `
}

module.exports = appointmentrejectiontemplate