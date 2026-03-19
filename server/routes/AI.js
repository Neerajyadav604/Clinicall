const express = require('express');
const router = express.Router();
const { symptomAnalysis, chat } = require('../controllers/AIController');
const AIController = require('../controllers/AIController');
const { authenticateUser } = require('../middleware/authMiddleware');

router.post('/symptoms', authenticateUser, symptomAnalysis);
router.post('/chat', authenticateUser, chat);
/**
 * POST /api/v1/ai/symptoms/predict
 * Predict top-3 diseases from symptom list
 * Body: { symptoms: string[] }
 * Auth: JWT required
 */
router.post(
  '/symptoms/predict',
  authenticateUser,
  AIController.predictSymptoms
);

/**
 * GET /api/v1/ai/doctors/recommend
 * Get AI-ranked doctors for a predicted disease
 * Query: { disease: string, specialization: string }
 * Auth: JWT required
 */
router.get(
  "/doctors/recommend",
  authenticateUser,
  AIController.getDoctorRecommendations
);

/**
 * GET /api/v1/ai/records/summary/:patientId
 * Get AI-generated health summary for a patient
 * Param: patientId (MongoDB _id)
 * Auth: JWT required
 */
router.get(
  "/records/summary/:patientId",
  authenticateUser,
  AIController.summarizeRecords
);

/**
 * POST /api/v1/ai/drugs/check
 * Check drug interactions and allergy conflicts
 * Body: {
 *   medications: string[] (required, ≥1 item),
 *   allergies?: string[] (optional),
 *   patientId?: string (optional, to fetch active records)
 * }
 * Auth: JWT required
 * Response: {success: true, medications_checked, allergies_checked, patientId, interactions, allergy_conflicts, safe_combinations, overall_risk, summary}
 */
router.post(
  "/drugs/check",
  authenticateUser,
  AIController.checkDrugInteractions
);

module.exports = router;
