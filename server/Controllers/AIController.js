const axios = require("axios");
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

/**
 * Internal helper: call the Python ML microservice.
 * Returns { ok: true, data: ... } on success.
 * Returns { ok: false, mlServiceDown: true } if ML is unreachable.
 * Never throws - always catches and returns gracefully.
 */
const callML = async (endpoint, data = {}, method = "post") => {
  try {
    const config = { timeout: 15000 };
    let response;
    if (method === "get") {
      response = await axios.get(
        `${ML_SERVICE_URL}${endpoint}`,
        { ...config, params: data }
      );
    } else {
      response = await axios.post(
        `${ML_SERVICE_URL}${endpoint}`,
        data,
        config
      );
    }
    return { ok: true, data: response.data };
  } catch (err) {
    console.warn(`[ML] Service unreachable at ${endpoint}:`, err.message);
    return { ok: false, mlServiceDown: true };
  }
};

const aiService = require('../services/ai.service');
const SymptomAnalysis = require('../models/SymptomAnalysis');
const Condition = require("../models/Condition");
const Observation = require("../models/Observation");
const MedicationRequest = require("../models/MedicationRequest");
const AllergyIntolerance = require("../models/AllergyIntolerance");
const Doctor = require("../models/Doctor");
const DoctorProfile = require("../models/DoctorProfile");

/**
 * POST /api/v1/ai/symptoms/predict
 * Receives symptom list from frontend, calls Python ML service,
 * saves prediction to MongoDB for audit, returns top-3 diseases.
 * @param {import("express").Request} req Express request object
 * @param {import("express").Response} res Express response object
 * @returns {Promise<void>}
 */
exports.predictSymptoms = async (req, res) => {
  try {
    const { symptoms } = req.body;

    if (!symptoms || !Array.isArray(symptoms)) {
      return res.status(400).json({
        success: false,
        message: "symptoms must be an array of strings"
      });
    }
    if (symptoms.length === 0) {
      return res.status(400).json({
        success: false,
        message: "symptoms array cannot be empty"
      });
    }
    if (symptoms.length > 20) {
      return res.status(400).json({
        success: false,
        message: "maximum 20 symptoms allowed"
      });
    }

    const cleanedSymptoms = symptoms
      .map((symptom) => String(symptom).trim().toLowerCase())
      .filter((symptom) => symptom.length > 0);

    if (cleanedSymptoms.length === 0) {
      return res.status(400).json({
        success: false,
        message: "no valid symptoms after sanitization"
      });
    }

    const mlResult = await callML(
      "/ml/symptoms/predict",
      { symptoms: cleanedSymptoms }
    );

    if (!mlResult.ok) {
      return res.status(503).json({
        success: false,
        mlServiceDown: true,
        message: "AI features temporarily unavailable. Please try again later."
      });
    }

    const {
      predictions,
      recommended_specialization,
      symptoms_used,
      symptoms_unknown
    } = mlResult.data;

    try {
      const topPrediction = Array.isArray(predictions) && predictions.length > 0
        ? predictions[0]
        : null;
      const topDisease = topPrediction?.disease || "";
      const urgency = ["Heart Attack"].includes(topDisease)
        ? "Emergency"
        : ["Dengue", "Pneumonia", "Malaria", "Typhoid", "Tuberculosis"].includes(topDisease)
          ? "Medium"
          : "Low";

      const analysisDoc = new SymptomAnalysis({
        userId: req.user._id,
        symptoms: JSON.stringify(cleanedSymptoms),
        urgency,
        recommendedDoctors: []
      });

      analysisDoc.set("predictions", predictions || [], { strict: false });
      analysisDoc.set("recommendedSpecialization", recommended_specialization, { strict: false });
      analysisDoc.set("symptomsUnknown", symptoms_unknown || [], { strict: false });

      await analysisDoc.save();
    } catch (dbErr) {
      console.warn("[AI] Failed to save SymptomAnalysis:", dbErr.message);
    }

    return res.status(200).json({
      success: true,
      predictions,
      recommended_specialization,
      symptoms_used,
      symptoms_unknown: symptoms_unknown || []
    });

  } catch (err) {
    console.error("[AI] predictSymptoms error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV !== "production" ? err.message : undefined
    });
  }
};

exports.symptomAnalysis = async (req, res, next) => {
  try {
    const { symptoms } = req.body;
    if (!symptoms) return res.status(400).json({ success: false, message: 'Symptoms required' });
    // gather patient history from past EHR or appointments
    const historyData = await SymptomAnalysis.find({ userId: req.user.id }).sort({createdAt: -1}).limit(5);
    const historyText = historyData.map(h=>h.symptoms).join('\n');
    const analysis = await aiService.analyzeSymptoms(symptoms, historyText);
    // persist
    await SymptomAnalysis.create({ userId: req.user.id, symptoms, urgency: analysis.urgency, recommendedDoctors: analysis.doctors.map(d=>({doctorId:d.doctor._id, score:d.score})) });
    res.json({ success: true, analysis });
  } catch (err) {
    next(err);
  }
};

exports.chat = async (req, res, next) => {
  try {
    const { message } = req.body;
    const context = req.body.context || '';
    const reply = await aiService.chatbot(message, context);
    res.json({ success: true, reply });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/ai/doctors/recommend
 * Fetch all verified doctors from MongoDB, send to ML service
 * with predicted disease, return ranked doctor list.
 * @query {string} disease - Predicted disease name
 * @query {string} specialization - Recommended specialization
 */
exports.getDoctorRecommendations = async (req, res) => {
  try {
    const { disease = "Unknown", specialization = "General Physician" }
      = req.query;

    // Fetch verified doctors with profiles from MongoDB
    const doctors = await Doctor
      .find({ verified: true })
      .populate("user", "fullName email")
      .lean();

    const profiles = await DoctorProfile.find().lean();
    const profileMap = {};
    profiles.forEach(p => {
      profileMap[String(p.doctorId)] = p;
    });

    // Build doctor list for ML service
    const doctorList = doctors.map(d => ({
      id:              String(d._id),
      name:            d.user?.fullName || "Unknown",
      specialization:  d.specialization || "General Physician",
      experience:      profileMap[String(d._id)]?.experience      || 0,
      rating:          profileMap[String(d._id)]?.rating          || 0,
      consultationFee: profileMap[String(d._id)]?.consultationFee || 0,
      totalAppointments: 0
    }));

    if (doctorList.length === 0) {
      return res.status(200).json({
        success: true,
        recommended_doctors: [],
        total_doctors_evaluated: 0,
        message: "No verified doctors found"
      });
    }

    // Call ML service
    const mlResult = await callML("/ml/doctor/recommend", {
      predicted_disease:          disease,
      recommended_specialization: specialization,
      doctors:                    doctorList
    });

    if (!mlResult.ok) {
      return res.status(503).json({
        success: false,
        mlServiceDown: true,
        message: "AI features temporarily unavailable."
      });
    }

    return res.status(200).json({
      success: true,
      ...mlResult.data
    });

  } catch (err) {
    console.error("[AI] getDoctorRecommendations error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV !== "production"
               ? err.message : undefined
    });
  }
};

/**
 * GET /api/v1/ai/records/summary/:patientId
 * Fetch patient FHIR records from MongoDB, send to ML service,
 * return plain-English summary with risk flags.
 * @param {string} patientId - MongoDB user _id of the patient
 */
exports.summarizeRecords = async (req, res) => {
  try {
    const patientId = req.params.patientId || String(req.user._id);
    const subjectRef = `Patient/${patientId}`;
    const patientRef = `Patient/${patientId}`;

    // Fetch all FHIR records in parallel
    const [conditions, observations, medications, allergyDocs] =
      await Promise.all([
        Condition.find({
          "subject.reference": subjectRef
        }).lean(),

        Observation.find({
          "subject.reference": subjectRef
        }).lean(),

        MedicationRequest.find({
          "subject.reference": subjectRef
        }).lean(),

        AllergyIntolerance.find({
          "patient.reference": patientRef
        }).lean(),
      ]);

    // Map to ML service payload format
    const conditionPayload = conditions.map(c => ({
      code:    c.code?.coding?.[0]?.code    || "",
      display: c.code?.coding?.[0]?.display
               || c.code?.text              || "Unknown Condition",
      date:    c.recordedDate
               ? new Date(c.recordedDate).toISOString().split("T")[0]
               : null
    }));

    const observationPayload = observations.map(o => ({
      type:  o.category?.[0]?.coding?.[0]?.code || "general",
      code:  o.code?.text
             || o.code?.coding?.[0]?.display    || "Unknown",
      value: o.valueQuantity?.value             || 0,
      unit:  o.valueQuantity?.unit              || "",
      date:  o.effectiveDateTime
             ? new Date(o.effectiveDateTime)
                 .toISOString().split("T")[0]
             : null
    }));

    const medicationPayload = medications.map(m => ({
      name:   m.medicationCodeableConcept?.text
              || m.medicationCodeableConcept?.coding?.[0]?.display
              || "Unknown Drug",
      status: m.status || "unknown",
      dosage: m.dosageInstruction?.[0]?.text || null
    }));

    const allergyPayload = allergyDocs.map(a =>
      a.code?.text
      || a.code?.coding?.[0]?.display
      || ""
    ).filter(Boolean);

    // Call ML service
    const mlResult = await callML("/ml/records/summarize", {
      patient_id:   patientId,
      conditions:   conditionPayload,
      observations: observationPayload,
      medications:  medicationPayload,
      allergies:    allergyPayload
    });

    if (!mlResult.ok) {
      return res.status(503).json({
        success: false,
        mlServiceDown: true,
        message: "AI features temporarily unavailable."
      });
    }

    return res.status(200).json({
      success: true,
      patientId,
      record_counts: {
        conditions:   conditions.length,
        observations: observations.length,
        medications:  medications.length,
        allergies:    allergyDocs.length
      },
      ...mlResult.data
    });

  } catch (err) {
    console.error("[AI] summarizeRecords error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV !== "production"
               ? err.message : undefined
    });
  }
};

/**
 * Check drug interactions and conflicts
 *
 * Request body:
 * - medications: string[] (required, ≥1 item)
 * - allergies: string[] (optional)
 * - patientId: string (optional, for fetching active records)
 *
 * If patientId is provided:
 *   - Fetches active MedicationRequest documents
 *   - Fetches AllergyIntolerance documents
 *   - Merges submitted medications with active medications
 *   - Uses existing allergies from DB if not overridden
 *
 * Response: {success: true, medications_checked, allergies_checked, patientId, ...mlResult}
 */
exports.checkDrugInteractions = async (req, res) => {
  try {
    const { medications, allergies = [], patientId } = req.body;

    // Validate medications
    if (!Array.isArray(medications) || medications.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Medications array required with at least 1 item"
      });
    }

    let medsToCheck = [...medications];
    let allergiesToCheck = [...allergies];

    // If patientId provided, fetch active records from MongoDB
    if (patientId) {
      try {
        // Fetch active medications
        const activeMeds = await MedicationRequest.find({
          subject: patientId,
          status: { $in: ["active", "on-hold"] }
        });

        const existingMeds = activeMeds
          .map(m =>
            m.medicationCodeableConcept?.text ||
            m.medicationCodeableConcept?.coding?.[0]?.display ||
            ""
          )
          .filter(Boolean);

        // Merge with submitted medications (case-insensitive deduplication)
        const lowerMeds = medsToCheck.map(m => m.toLowerCase());
        existingMeds.forEach(med => {
          if (!lowerMeds.includes(med.toLowerCase())) {
            medsToCheck.push(med);
          }
        });

        // Fetch allergies only if not overridden in request
        if (allergies.length === 0) {
          const allergyDocs = await AllergyIntolerance.find({
            patient: patientId
          });

          allergiesToCheck = allergyDocs
            .map(a =>
              a.code?.text ||
              a.code?.coding?.[0]?.display ||
              ""
            )
            .filter(Boolean);
        }
      } catch (dbErr) {
        // Log but continue with submitted data if DB fetch fails
        console.error("[AI] Error fetching patient records:", dbErr.message);
      }
    }

    // Require at least one medication
    if (medsToCheck.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No medications to check"
      });
    }

    // Call ML service
    const mlResult = await callML("/ml/drugs/interactions", {
      medications: medsToCheck,
      allergies: allergiesToCheck
    });

    if (!mlResult.ok) {
      return res.status(503).json({
        success: false,
        mlServiceDown: true,
        message: "Drug interaction checker temporarily unavailable."
      });
    }

    return res.status(200).json({
      success: true,
      medications_checked: medsToCheck,
      allergies_checked: allergiesToCheck,
      patientId: patientId || null,
      ...mlResult.data
    });

  } catch (err) {
    console.error("[AI] checkDrugInteractions error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV !== "production"
               ? err.message : undefined
    });
  }
};
