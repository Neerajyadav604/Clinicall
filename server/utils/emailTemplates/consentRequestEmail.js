/**
 * Generate HTML for consent request email to patient
 * @param {Object} params - Email parameters
 * @param {string} params.patientName - Patient's name
 * @param {string} params.doctorName - Doctor's name
 * @param {Array<string>} params.resourceTypes - FHIR resource types requested
 * @param {string} params.message - Optional message from doctor
 * @param {string} params.consentRequestId - Consent request ID
 * @param {string} params.appUrl - Base application URL (e.g., http://localhost:3000)
 * @returns {string} HTML email body
 */
function generateConsentRequestEmail({
  patientName,
  doctorName,
  resourceTypes,
  message,
  consentRequestId,
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

  const consentUrl = `${appUrl}/medical-records?tab=consent&section=pending`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Consent Request - Clinicall</title>
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
                            <p style="margin: 8px 0 0 0; color: #e0e7ff; font-size: 14px;">Healthcare Access Request</p>
                        </td>
                    </tr>

                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 32px 24px;">
                            <!-- Greeting -->
                            <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 16px; line-height: 1.5;">
                                Hi <strong>${patientName}</strong>,
                            </p>

                            <!-- Summary -->
                            <p style="margin: 0 0 24px 0; color: #374151; font-size: 15px; line-height: 1.6;">
                                <strong>Dr. ${doctorName}</strong> has requested access to your medical records on Clinicall.
                            </p>

                            <!-- Optional Message from Doctor -->
                            ${
                              message
                                ? `
                            <div style="background-color: #f3f4f6; border-left: 4px solid #9ca3af; padding: 16px; margin: 0 0 24px 0; border-radius: 4px;">
                                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Message from Dr. ${doctorName}:</p>
                                <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.5; white-space: pre-wrap;">${escapeHtml(
                                  message
                                )}</p>
                            </div>
                            `
                                : ""
                            }

                            <!-- Requested Resources -->
                            <div style="margin: 0 0 24px 0;">
                                <p style="margin: 0 0 12px 0; color: #1f2937; font-size: 14px; font-weight: 600;">Requested access to:</p>
                                <div style="display: flex; flex-wrap: wrap; gap: 8px; margin: 0;">
                                    ${readableResourceTypes
                                      .map(
                                        (label) =>
                                          `<span style="display: inline-block; background-color: #dbeafe; color: #0369a1; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 500;">${label}</span>`
                                      )
                                      .join("")}
                                </div>
                            </div>

                            <!-- CTA Button -->
                            <div style="text-align: center; margin: 32px 0;">
                                <a href="${consentUrl}" style="display: inline-block; background-color: #0891b2; color: #ffffff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 15px; transition: background-color 0.2s;">Review & Respond</a>
                            </div>

                            <!-- Alternative Link -->
                            <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 13px; line-height: 1.5;">
                                You can also go to <strong>My Profile → Medical Records → Privacy & Consent → Pending Requests</strong>
                            </p>

                            <!-- Footer Note -->
                            <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 16px; border-radius: 4px; margin: 24px 0;">
                                <p style="margin: 0; color: #1e40af; font-size: 13px; line-height: 1.6;">
                                    <strong>⏱️ This request will expire in 48 hours.</strong> You are in full control of your medical data. If you did not expect this request, you can safely ignore this email.
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

/**
 * Escape HTML special characters to prevent injection
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

module.exports = generateConsentRequestEmail;
