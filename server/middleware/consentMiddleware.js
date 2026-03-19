const Consent = require("../models/Consent");

const normalizePatientId = (value) => {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  if (raw.startsWith("Patient/")) {
    return raw.split("/")[1] || null;
  }

  return raw;
};

const getNormalizedRoles = (user, fallbackRole) => {
  if (Array.isArray(user?.roles) && user.roles.length > 0) {
    return user.roles
      .filter((role) => typeof role === "string" && role.trim())
      .map((role) => role.toLowerCase());
  }

  if (typeof user?.role === "string" && user.role.trim()) {
    return [user.role.toLowerCase()];
  }

  if (typeof fallbackRole === "string" && fallbackRole.trim()) {
    return [fallbackRole.toLowerCase()];
  }

  return [];
};

const getPatientIdsFromAuthContext = (req) => {
  const ids = new Set();

  const addCandidate = (value) => {
    const normalized = normalizePatientId(value);
    if (normalized) {
      ids.add(normalized);
    }
  };

  addCandidate(req.user?._id);
  addCandidate(req.user?.id);
  addCandidate(req.userId);
  addCandidate(req.auth?.tokenSubjectId);
  addCandidate(req.auth?.patientId);

  if (req.auth?.fhirUser) {
    addCandidate(req.auth.fhirUser);
  }

  return ids;
};

const getPatientIdsFromTokenClaims = (req) => {
  const ids = new Set();

  const addCandidate = (value) => {
    const normalized = normalizePatientId(value);
    if (normalized) {
      ids.add(normalized);
    }
  };

  addCandidate(req.auth?.patientId);
  addCandidate(req.auth?.fhirUser);

  return ids;
};

const hasReadScopeForResource = (scopes, resourceType) => {
  if (!Array.isArray(scopes) || !resourceType) return false;

  const acceptedScopes = new Set([
    `patient/${resourceType}.read`,
    `patient/*.read`,
    "patient/read",
    `user/${resourceType}.read`,
    `user/*.read`,
    "user/read",
    `system/${resourceType}.read`,
    `system/*.read`,
    "system/read",
  ]);

  return scopes.some((scope) => acceptedScopes.has(scope));
};

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
    const patientId = normalizePatientId(
      req.query.patient || req.query.subject || req.params.id
    );
    if (!patientId) {
      // If no patient param, this might not be a patient-specific query - continue
      return next();
    }

    // Get requestor info from JWT (should be in req.user or req.userId)
    const requestorId = req.user?._id || req.user?.id || req.userId;
    const requestorRoles = getNormalizedRoles(req.user, req.userRole);
    const patientIdsFromAuth = getPatientIdsFromAuthContext(req);
    const patientIdsFromTokenClaims = getPatientIdsFromTokenClaims(req);
    const resourceType = req.params.resourceType || extractResourceTypeFromPath(req.path);

    if (patientIdsFromAuth.has(patientId)) {
      req.consentCheckPassed = true;
      return next();
    }

    if (
      patientIdsFromTokenClaims.has(patientId) &&
      hasReadScopeForResource(req.auth?.scopes, resourceType)
    ) {
      req.consentCheckPassed = true;
      return next();
    }

    // Rule 1: If requestor is the patient, always allow
    if (requestorId && requestorId.toString() === patientId.toString()) {
      req.consentCheckPassed = true;
      return next();
    }

    // Rule 2: If requestor is admin or hospital_admin, always allow
    if (requestorRoles.some((role) => ["admin", "hospital_admin"].includes(role))) {
      req.consentCheckPassed = true;
      return next();
    }

    // Rule 3: If requestor is a doctor/practitioner, check consent
    if (requestorRoles.some((role) => ["doctor", "hospital", "practitioner"].includes(role))) {
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
