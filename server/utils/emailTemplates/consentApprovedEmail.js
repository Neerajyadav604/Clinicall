/**
 * Generate HTML for consent approved email to doctor
 * @param {Object} params - Email parameters
 * @param {string} params.doctorName - Doctor's name
 * @param {string} params.patientName - Patient's name
 * @param {Array<string>} params.resourceTypes - FHIR resource types approved
 * @param {Date} params.expiryDate - Consent expiry date
 * @param {string} params.patientId - Patient's ID
 * @param {string} params.appUrl - Base application URL
 * @returns {string} HTML email body
 */
function generateConsentApprovedEmail({
  doctorName,
  patientName,
  resourceTypes,
  expiryDate,
  patientId,
  appUrl,
}) {
  // Map FHIR resource types to readable labels
  const resourceTypeLabels = {
    Condition: "Diagnoses",
    Observation: "Vital Signs & Lab Results",
    MedicationRequest: "Prescriptions",
    DiagnosticReport: "Lab Reports",
    Procedure: "Procedures",
    Immunization: "Immunizations",
    AllergyIntolerance: "Allergies",
    DocumentReference: "Documents",
  };

  // Convert resource types to readable labels
  const readableResourceTypes = resourceTypes
    .map((type) => resourceTypeLabels[type] || type)
    .filter(Boolean);

  // Format expiry date using plain JS
  const expiryDateFormatted = new Date(expiryDate).toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );

  const patientsUrl = `${appUrl}/doctor/patient/${patientId}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Consent Approved - Clinicall</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8f9fa;">
        <tr>
            <td align="center" padding="20px">
                <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header Bar -->
                    <tr>
                        <td style="background-color: #1e3a5f; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Clinicall</h1>
                            <p style="margin: 8px 0 0 0; color: #e0e7ff; font-size: 14px;">Consent Approved</p>
                        </td>
                    </tr>

                    <!-- Success Badge -->
                    <tr>
                        <td style="text-align: center; padding: 24px 24px 0;">
                            <div style="display: inline-block; background-color: #dcfce7; border-radius: 50%; width: 48px; height: 48px; line-height: 48px; color: #15803d; font-size: 24px; margin: 0 auto;">✓</div>
                        </td>
                    </tr>

                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 24px;">
                            <!-- Greeting -->
                            <p style="margin: 0 0 20px 0; text-align: center; color: #1f2937; font-size: 16px; line-height: 1.5;">
                                Hi <strong>Dr. ${doctorName}</strong>,
                            </p>

                            <!-- Summary -->
                            <p style="margin: 0 0 24px 0; text-align: center; color: #374151; font-size: 15px; line-height: 1.6;">
                                <strong>${patientName}</strong> has approved your consent request on Clinicall.
                            </p>

                            <!-- Approved Resources -->
                            <div style="margin: 0 0 24px 0;">
                                <p style="margin: 0 0 12px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: center;">You now have access to:</p>
                                <div style="display: flex; flex-wrap: wrap; gap: 8px; margin: 0; justify-content: center;">
                                    ${readableResourceTypes
                                      .map(
                                        (label) =>
                                          `<span style="display: inline-block; background-color: #dcfce7; color: #15803d; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 500;">${label}</span>`
                                      )
                                      .join("")}
                                </div>
                            </div>

                            <!-- Expiry Information -->
                            <div style="background-color: #fef3c7; border: 1px solid #fcd34d; padding: 16px; border-radius: 4px; margin: 24px 0;">
                                <p style="margin: 0; color: #b45309; font-size: 14px; line-height: 1.6;">
                                    <strong>📅 Access is valid until ${expiryDateFormatted}</strong><br/>
                                    Access will automatically expire on this date. You can request renewal at any time.
                                </p>
                            </div>

                            <!-- CTA Button -->
                            <div style="text-align: center; margin: 32px 0;">
                                <a href="${patientsUrl}" style="display: inline-block; background-color: #0891b2; color: #ffffff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 15px; transition: background-color 0.2s;">Open Patient Records</a>
                            </div>

                            <!-- Footer Note -->
                            <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; padding: 16px; border-radius: 4px; margin: 24px 0;">
                                <p style="margin: 0; color: #0369a1; font-size: 13px; line-height: 1.6;">
                                    This approval gives you access to ${patientName}'s medical records for treatment purposes. Always respect patient privacy and use this data responsibly.
                                </p>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px; text-align: center; border-top: 1px solid #e5e7eb; background-color: #f9fafb; border-radius: 0 0 8px 8px;">
                            <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.5;">
                                © Clinicall — Your health, your control
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `.trim();
}

module.exports = generateConsentApprovedEmail;
