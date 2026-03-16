const Consent = require("../models/Consent");

/**
 * Middleware to check if requester has consent to access patient's FHIR resource
 * Rules:
 * - If requester is the patient → always allow
 * - If requester is admin or hospital_admin → always allow
 * - If requester is doctor/practitioner → require active consent covering this resource type
 * - If consent exists but expired → auto-deactivate and deny
 */
const consentMiddleware = async (req, res, next) => {
  try {
    // Determine the patient we're querying for
    const patientId = req.query.patient || req.query.subject || req.params.id;
    if (!patientId) {
      // If no patient param, this might not be a patient-specific query - continue
      return next();
    }

    // Get requestor info from JWT (should be in req.user or req.userId)
    const requestorId = req.user?._id || req.userId;
    const requestorRole = req.user?.role || req.userRole;

    // Rule 1: If requestor is the patient, always allow
    if (requestorId.toString() === patientId.toString()) {
      req.consentCheckPassed = true;
      return next();
    }

    // Rule 2: If requestor is admin or hospital_admin, always allow
    if (["admin", "hospital_admin"].includes(requestorRole)) {
      req.consentCheckPassed = true;
      return next();
    }

    // Rule 3: If requestor is a doctor/practitioner, check consent
    if (["doctor", "hospital"].includes(requestorRole)) {
      // Determine the resource type being accessed
      const resourceType = req.params.resourceType || extractResourceTypeFromPath(req.path);

      // Query for active consent from patient to this doctor covering this resource
      const consent = await Consent.findOne({
        patient_ref: patientId,
        grantedTo_ref: requestorId,
        status: "active",
        "resourceTypes": resourceType,
      });

      if (!consent) {
        // No consent found
        return res.status(403).json({
          resourceType: "OperationOutcome",
          issue: [
            {
              severity: "error",
              code: "forbidden",
              details: {
                text: "Access denied: No active consent for this resource from the patient",
              },
            },
          ],
        });
      }

      // Check if consent has expired
      if (consent.period?.end && new Date(consent.period.end) < new Date()) {
        // Consent has expired - deactivate it
        await Consent.updateOne({ _id: consent._id }, { status: "inactive" });

        return res.status(403).json({
          resourceType: "OperationOutcome",
          issue: [
            {
              severity: "error",
              code: "forbidden",
              details: {
                text: "Access denied: Consent has expired",
              },
            },
          ],
        });
      }

      // Consent is valid and active
      req.consent = consent;
      req.consentCheckPassed = true;
      return next();
    }

    // For other roles, deny by default
    return res.status(403).json({
      resourceType: "OperationOutcome",
      issue: [
        {
          severity: "error",
          code: "forbidden",
          details: {
            text: "Access denied: Insufficient permissions",
          },
        },
      ],
    });
  } catch (error) {
    console.error("Error in consentMiddleware:", error);
    return res.status(500).json({
      resourceType: "OperationOutcome",
      issue: [
        {
          severity: "fatal",
          code: "exception",
          details: {
            text: "Internal server error while checking consent",
          },
        },
      ],
    });
  }
};

/**
 * Helper to extract resource type from FHIR path
 * e.g., /fhir/R4/Condition -> "Condition"
 */
const extractResourceTypeFromPath = (path) => {
  const parts = path.split("/").filter((p) => p);
  // Look for FHIR resource type (capitalized, not /fhir /R4, etc.)
  for (const part of parts) {
    if (
      part[0] === part[0].toUpperCase() &&
      ![
        "fhir",
        "R4",
        "R3",
        "DSTU2",
        "metadata",
        "$export",
        "$export-status",
      ].includes(part) &&
      !part.startsWith("$")
    ) {
      return part;
    }
  }
  return null;
};

module.exports = consentMiddleware;
