const appointmentapprovaltemplate =(username,doctorname,specialization,appointmentDate,appointmentTime,reason)=>{
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Appointment Confirmed - CliniCall</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07); overflow: hidden;">
                    
                    <!-- Header with Logo Space -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
                            <img src="YOUR_LOGO_URL_HERE" alt="CliniCall Logo" style="max-width: 180px; height: auto; margin-bottom: 20px; display: block; margin-left: auto; margin-right: auto;">
                            <div style="background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; width: 80px; height: 80px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                                <span style="font-size: 48px; line-height: 1;">✓</span>
                            </div>
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">Appointment Confirmed!</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 50px 40px;">
                            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                                Hi <strong style="color: #1a202c;">${username}</strong>,
                            </p>
                            
                            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
                                Great news! Your appointment has been confirmed by <strong style="color: #1a202c;">${doctorname}</strong>. We look forward to seeing you soon.
                            </p>
                            
                            <!-- Status Badge -->
                            <div style="text-align: center; margin-bottom: 32px;">
                                <span style="display: inline-block; background-color: #d1fae5; color: #065f46; padding: 10px 24px; border-radius: 20px; font-size: 14px; font-weight: 600;">
                                    ✓ Status: Confirmed
                                </span>
                            </div>
                            
                            <!-- Appointment Details Box -->
                            <div style="background-color: #f0fdf4; border: 2px solid #10b981; border-radius: 12px; padding: 28px; margin-bottom: 32px;">
                                <h3 style="color: #065f46; font-size: 18px; margin: 0 0 20px 0; font-weight: 600; text-align: center;">Your Appointment Details</h3>
                                
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td style="padding: 12px 0; border-bottom: 1px solid #bbf7d0;">
                                            <p style="color: #065f46; font-size: 14px; margin: 0; font-weight: 600;">Doctor</p>
                                            <p style="color: #1a202c; font-size: 16px; margin: 4px 0 0 0;">${doctorname}</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px 0; border-bottom: 1px solid #bbf7d0;">
                                            <p style="color: #065f46; font-size: 14px; margin: 0; font-weight: 600;">Specialization</p>
                                            <p style="color: #1a202c; font-size: 16px; margin: 4px 0 0 0;">${specialization}</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px 0; border-bottom: 1px solid #bbf7d0;">
                                            <p style="color: #065f46; font-size: 14px; margin: 0; font-weight: 600;">Date & Time</p>
                                            <p style="color: #1a202c; font-size: 18px; margin: 4px 0 0 0; font-weight: 600;">${appointmentDate} at ${appointmentTime}</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px 0;">
                                            <p style="color: #065f46; font-size: 14px; margin: 0; font-weight: 600;">Reason for Visit</p>
                                            <p style="color: #1a202c; font-size: 16px; margin: 4px 0 0 0;">${reason}</p>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            
                            <!-- Important Information -->
                            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 20px; margin-bottom: 32px;">
                                <h4 style="color: #1e40af; font-size: 16px; margin: 0 0 12px 0; font-weight: 600;">Before Your Appointment</h4>
                                <ul style="color: #1e40af; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                                    <li>Please arrive 10 minutes early for in-person appointments</li>
                                    <li>Bring any relevant medical records or prescriptions</li>
                                    <li>Have your insurance information ready</li>
                                    <li>Prepare a list of questions or concerns to discuss</li>
                                </ul>
                            </div>
                            
                            <!-- Action Buttons -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                               
                                <tr>
                                    <td align="center">
                                        <a href="YOUR_DASHBOARD_LINK" style="display: inline-block; background-color: transparent; color: #667eea; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; border: 2px solid #667eea;">
                                            View My Appointments
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; margin-top: 24px; text-align: center;">
                                <p style="color: #92400e; font-size: 14px; line-height: 1.6; margin: 0;">
                                    <strong>Need to reschedule or cancel?</strong><br>
                                    Please contact us at least 24 hours in advance.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f7fafc; padding: 30px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="color: #718096; font-size: 14px; margin: 0 0 12px 0;">
                                Questions or need assistance? Contact us at <a href="mailto:support@clinicall.com" style="color: #667eea; text-decoration: none;">support@clinicall.com</a>
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
</html>`
}

module.exports = appointmentapprovaltemplate