const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const cloudinary = require("../config/Cloudinary");
const { logFHIRAccess } = require("../middleware/auditLogger");

// Models
const User = require("../models/User");
const UserProfile = require("../models/UserProfile");
const Condition = require("../models/Condition");
const Observation = require("../models/Observation");
const AllergyIntolerance = require("../models/AllergyIntolerance");
const MedicationRequest = require("../models/MedicationRequest");
const DiagnosticReport = require("../models/DiagnosticReport");
const Procedure = require("../models/Procedure");
const Immunization = require("../models/Immunization");
const Appointment = require("../models/Appointment");
const DocumentReference = require("../models/DocumentReference");

// Transformers
const {
  toFhirPatient,
  toFhirCondition,
  toFhirObservation,
  toFhirAllergyIntolerance,
  toFhirMedicationRequest,
  toFhirDiagnosticReport,
  toFhirProcedure,
  toFhirImmunization,
  toFhirDocumentReference,
} = require("./fhirTransformer");

/**
 * Generate NDJSON format for FHIR export
 * @param {Array} resources - Array of FHIR resources
 * @returns {String} NDJSON formatted string
 */
const generateNDJSON = (resources) => {
  return resources.map((resource) => JSON.stringify(resource)).join("\n");
};

/**
 * Upload file to Cloudinary
 * @param {String} filePath - Path to local file
 * @param {String} fileName - Name for the file on Cloudinary
 * @returns {Promise<String>} URL of uploaded file
 */
const uploadToCloudinary = async (filePath, fileName) => {
  return new Promise((resolve, reject) => {
    const upload_stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        public_id: `fhir-exports/${Date.now()}/${fileName}`,
        format: "ndjson",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );

    fs.createReadStream(filePath).pipe(upload_stream);
  });
};

/**
 * Export all FHIR data for a patient
 * @param {String} patientId - User ID of patient
 * @param {String} requestingUserId - User ID making the request
 * @param {Array} resourceTypes - Optional array of resource types to export (if not provided, exports all)
 * @returns {Promise<Object>} { outputUrls: { resourceType: url }, success: boolean, error: string }
 */
const exportPatientData = async (patientId, requestingUserId, resourceTypes = null) => {
  const tempDir = path.join(__dirname, "../../temp-exports");
  const sessionId = uuidv4();
  const sessionDir = path.join(tempDir, sessionId);
  const outputUrls = {};

  try {
    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    // Define all available resource types and their models/transformers
    const resourceMap = {
      Patient: {
        model: User,
        transformer: (doc) => doc && toFhirPatient(doc),
        query: { _id: patientId },
      },
      Condition: {
        model: Condition,
        transformer: toFhirCondition,
        query: { user_ref: patientId },
      },
      Observation: {
        model: Observation,
        transformer: toFhirObservation,
        query: { user_ref: patientId },
      },
      AllergyIntolerance: {
        model: AllergyIntolerance,
        transformer: toFhirAllergyIntolerance,
        query: { user_ref: patientId },
      },
      MedicationRequest: {
        model: MedicationRequest,
        transformer: toFhirMedicationRequest,
        query: { user_ref: patientId },
      },
      DiagnosticReport: {
        model: DiagnosticReport,
        transformer: toFhirDiagnosticReport,
        query: { user_ref: patientId },
      },
      Procedure: {
        model: Procedure,
        transformer: toFhirProcedure,
        query: { user_ref: patientId },
      },
      Immunization: {
        model: Immunization,
        transformer: toFhirImmunization,
        query: { user_ref: patientId },
      },
      Appointment: {
        model: Appointment,
        transformer: (doc) => ({
          resourceType: "Encounter",
          id: doc._id.toString(),
          status: doc.appointmentStatus || "arrived",
          type: [{ text: "Medical Appointment" }],
          subject: { reference: `Patient/${patientId}` },
          date: doc.appointmentDate,
          period: { start: doc.appointmentDate },
        }),
        query: { $or: [{ userId: patientId }, { doctorId: patientId }] },
      },
      DocumentReference: {
        model: DocumentReference,
        transformer: toFhirDocumentReference,
        query: { user_ref: patientId },
      },
    };

    // Determine which resources to export
    const resourcesToExport = resourceTypes
      ? Object.keys(resourceMap).filter((key) => resourceTypes.includes(key))
      : Object.keys(resourceMap);

    // Export each resource type
    for (const resourceType of resourcesToExport) {
      const { model, transformer, query } = resourceMap[resourceType];

      // Fetch all documents of this type
      const documents = await model.find(query).lean();

      // Transform to FHIR
      const fhirResources = documents
        .map(transformer)
        .filter((resource) => resource !== null && resource !== undefined);

      // Generate NDJSON
      if (fhirResources.length > 0) {
        const ndjson = generateNDJSON(fhirResources);
        const filePath = path.join(sessionDir, `${resourceType}.ndjson`);

        // Write to temp file
        fs.writeFileSync(filePath, ndjson, "utf-8");

        // Upload to Cloudinary
        const cloudinaryUrl = await uploadToCloudinary(filePath, `${resourceType}.ndjson`);
        outputUrls[resourceType] = cloudinaryUrl;
      }
    }

    // Log the export action
    await logFHIRAccess({
      userId: requestingUserId,
      role: "patient", // Assuming patients request their own exports
      action: "EXPORT",
      resourceType: "Patient",
      resourceId: patientId,
      patientId,
      success: true,
      successMessage: `Exported ${Object.keys(outputUrls).length} resource types`,
    });

    // Clean up temp files
    fs.rmSync(sessionDir, { recursive: true, force: true });

    return {
      success: true,
      outputUrls,
    };
  } catch (error) {
    console.error("Error during FHIR export:", error);

    // Log the failed export
    await logFHIRAccess({
      userId: requestingUserId,
      role: "patient",
      action: "EXPORT",
      resourceType: "Patient",
      resourceId: patientId,
      patientId,
      success: false,
      failureReason: error.message,
    });

    // Clean up temp files
    if (fs.existsSync(sessionDir)) {
      fs.rmSync(sessionDir, { recursive: true, force: true });
    }

    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = {
  exportPatientData,
  generateNDJSON,
  uploadToCloudinary,
};
