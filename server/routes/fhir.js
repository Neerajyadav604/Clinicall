const express = require('express');
const router = express.Router();
const { authenticateUser, isDoctor } = require('../middleware/authMiddleware');
const { AppError } = require('../middleware/errorHandler');
// Removed old import - use logFHIRAccess instead
const {
  toFhirPatient,
  toFhirPractitioner,
  toFhirOrganization,
  toFhirEncounter,
  toFhirCondition,
  toFhirObservation,
  toFhirAllergyIntolerance,
  toFhirMedication,
  toFhirMedicationRequest,
  toFhirDiagnosticReport,
  toFhirProcedure,
  toFhirImmunization,
  toFhirDocumentReference,
  toFhirConsent,
  toFhirAuditEvent
} = require('../utils/fhirTransformer');
const { searchCodeSystem } = require('../utils/fhirCodeLookup');

// Models
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const Doctor = require('../models/Doctor');
const DoctorProfile = require('../models/DoctorProfile');
const Hospital = require('../models/Hospital');
const Appointment = require('../models/Appointment');
const Condition = require('../models/Condition');
const Observation = require('../models/Observation');
const AllergyIntolerance = require('../models/AllergyIntolerance');
const Medication = require('../models/Medication');
const MedicationRequest = require('../models/MedicationRequest');
const DiagnosticReport = require('../models/DiagnosticReport');
const Procedure = require('../models/Procedure');
const Immunization = require('../models/Immunization');
const ExportJob = require('../models/ExportJob');
const Consent = require('../models/Consent');
const ConsentRequest = require('../models/ConsentRequest');
const AuditEvent = require('../models/AuditEvent');
const DocumentReference = require('../models/DocumentReference');

// Utilities & Middleware
const { exportPatientData } = require('../utils/fhirExporter');
const consentMiddleware = require('../middleware/consentMiddleware');
const { logFHIRAccess, generateHIPAAReport } = require('../middleware/auditLogger');
const { fhirReadLimiter, fhirWriteLimiter, exportLimiter, syncLimiter } = require('../middleware/rateLimiter');
const { validateResource, createOperationOutcome } = require('../utils/fhirValidator');
const mailSender = require('../utils/mailSender');
const generateConsentApprovedEmail = require('../utils/emailTemplates/consentApprovedEmail');
const requirePayment = require('../middleware/requirePayment');

const normalizePatientQueryId = (value) => {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  if (raw.startsWith('Patient/')) {
    return raw.split('/')[1] || null;
  }

  return raw;
};

/**
 * FHIR R4 Capability Statement (Metadata)
 * Returns server capabilities and conformance
 */
router.get('/metadata', (req, res) => {
  const metadata = {
    resourceType: 'CapabilityStatement',
    status: 'active',
    kind: 'instance',
    instantiates: ['http://hl7.org/fhir/CapabilityStatement/base'],
    date: new Date(),
    publisher: 'Clinicall Healthcare',
    description: 'FHIR R4 Capability Statement for Clinicall EHR',
    kind: 'instance',
    software: {
      name: 'Clinicall EHR',
      version: '1.0.0'
    },
    implementation: {
      description: 'Clinicall Electronic Health Records System',
      url: 'http://clinicall.local'
    },
    fhirVersion: '4.0.1',
    format: ['application/fhir+json', 'application/fhir+xml'],
    rest: [
      {
        mode: 'server',
        security: {
          cors: true,
          service: [
            {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/restful-security-service',
                  code: 'OAuth'
                }
              ]
            }
          ],
          description: 'JWT Bearer Token'
        },
        resource: [
          {
            type: 'Patient',
            interaction: [
              { code: 'read' },
              { code: 'search-type' }
            ],
            searchParam: [
              { name: 'name', type: 'string' },
              { name: '_id', type: 'token' }
            ]
          },
          {
            type: 'Practitioner',
            interaction: [
              { code: 'read' },
              { code: 'search-type' }
            ],
            searchParam: [
              { name: 'name', type: 'string' },
              { name: '_id', type: 'token' }
            ]
          },
          {
            type: 'Organization',
            interaction: [
              { code: 'read' }
            ]
          },
          {
            type: 'Encounter',
            interaction: [
              { code: 'read' }
            ]
          },
          {
            type: 'Condition',
            interaction: [
              { code: 'read' },
              { code: 'search-type' }
            ]
          },
          {
            type: 'Observation',
            interaction: [
              { code: 'read' },
              { code: 'search-type' }
            ]
          },
          {
            type: 'AllergyIntolerance',
            interaction: [
              { code: 'read' },
              { code: 'search-type' }
            ]
          },
          {
            type: 'Medication',
            interaction: [
              { code: 'read' },
              { code: 'create' }
            ]
          },
          {
            type: 'MedicationRequest',
            interaction: [
              { code: 'read' },
              { code: 'search-type' },
              { code: 'create' }
            ]
          },
          {
            type: 'DiagnosticReport',
            interaction: [
              { code: 'read' },
              { code: 'search-type' },
              { code: 'create' }
            ]
          },
          {
            type: 'Procedure',
            interaction: [
              { code: 'read' },
              { code: 'search-type' }
            ]
          },
          {
            type: 'Immunization',
            interaction: [
              { code: 'read' },
              { code: 'search-type' }
            ]
          }
        ]
      }
    ]
  };

  res.set('Content-Type', 'application/fhir+json');
  res.json(metadata);
});

/**
 * GET /Patient/:id
 * Fetch a patient by ID and return as FHIR Patient resource
 */
router.get('/Patient/:id', authenticateUser, fhirReadLimiter, async (req, res, next) => {
  try {
    const patientId = req.params.id;

    // Log FHIR access
    await logFHIRAccess({
      userId: req.user._id,
      role: req.user.role,
      action: 'READ',
      resourceType: 'Patient',
      resourceId: patientId,
      patientId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      success: true
    });

    // Fetch user and profile
    const user = await User.findById(patientId);
    if (!user) {
      return next(new AppError('Patient not found', 404));
    }

    const userProfile = await UserProfile.findOne({ userId: patientId });

    const fhirPatient = toFhirPatient(user, userProfile);

    res.set('Content-Type', 'application/fhir+json');
    res.json(fhirPatient);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /Practitioner/:id
 * Fetch a practitioner by ID and return as FHIR Practitioner resource
 */
router.get('/Practitioner/:id', authenticateUser, fhirReadLimiter, async (req, res, next) => {
  try {
    const practitionerId = req.params.id;

    // Log FHIR access
    await logFHIRAccess({
      userId: req.user._id,
      role: req.user.role,
      action: 'READ',
      resourceType: 'Practitioner',
      resourceId: practitionerId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      success: true
    });

    const doctor = await Doctor.findById(practitionerId);
    if (!doctor) {
      return next(new AppError('Practitioner not found', 404));
    }

    const doctorProfile = await DoctorProfile.findOne({ doctorId: practitionerId });

    const fhirPractitioner = toFhirPractitioner(doctor, doctorProfile);

    res.set('Content-Type', 'application/fhir+json');
    res.json(fhirPractitioner);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /Organization/:id
 * Fetch an organization (hospital) by ID and return as FHIR Organization resource
 */
router.get('/Organization/:id', authenticateUser, fhirReadLimiter, async (req, res, next) => {
  try {
    const orgId = req.params.id;

    // Log FHIR access
    await logFHIRAccess({
      userId: req.user._id,
      role: req.user.role,
      action: 'READ',
      resourceType: 'Organization',
      resourceId: orgId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      success: true
    });

    const hospital = await Hospital.findById(orgId);
    if (!hospital) {
      return next(new AppError('Organization not found', 404));
    }

    const fhirOrganization = toFhirOrganization(hospital);

    res.set('Content-Type', 'application/fhir+json');
    res.json(fhirOrganization);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /Encounter/:id
 * Fetch an encounter (appointment) by ID and return as FHIR Encounter resource
 */
router.get('/Encounter/:id', authenticateUser, fhirReadLimiter, async (req, res, next) => {
  try {
    const encounterId = req.params.id;

    // Log FHIR access
    await logFHIRAccess({
      userId: req.user._id,
      role: req.user.role,
      action: 'READ',
      resourceType: 'Encounter',
      resourceId: encounterId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      success: true
    });

    const appointment = await Appointment.findById(encounterId)
      .populate('userId')
      .populate('doctorId');

    if (!appointment) {
      return next(new AppError('Encounter not found', 404));
    }

    const fhirEncounter = toFhirEncounter(appointment, appointment.userId, appointment.doctorId);

    res.set('Content-Type', 'application/fhir+json');
    res.json(fhirEncounter);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /Condition
 * Search conditions by patient (userId)
 * Query: ?patient=userId or ?subject=userId
 */
router.get('/Condition', authenticateUser, fhirReadLimiter, consentMiddleware, requirePayment, async (req, res, next) => {
  try {
    const patientId = normalizePatientQueryId(req.query.patient || req.query.subject);

    if (!patientId) {
      return next(new AppError('patient or subject parameter required', 400));
    }

    // Log FHIR access
    await logFHIRAccess({
      userId: req.user._id,
      role: req.user.role,
      action: 'SEARCH',
      resourceType: 'Condition',
      resourceId: patientId,
      patientId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      success: true
    });

    // Build filter - include appointmentId if provided
    const filter = { userId: patientId, clinicalStatus: { $ne: 'resolved' } };
    if (req.query.appointmentId) {
      filter.appointmentId = req.query.appointmentId;
    }
    const conditions = await Condition.find(filter);

    const bundle = {
      resourceType: 'Bundle',
      type: 'searchset',
      total: conditions.length,
      entry: conditions.map(cond => ({
        resource: {
          resourceType: 'Condition',
          id: cond._id.toString(),
          code: cond.code,
          subject: { reference: `Patient/${cond.userId}` },
          clinicalStatus: { coding: [{ code: cond.clinicalStatus }] },
          verificationStatus: { coding: [{ code: cond.verificationStatus }] },
          severity: { coding: [{ code: cond.severity }] },
          notes: cond.notes,
          onsetDate: cond.onsetDate,
          recordedDate: cond.recordedDate
        }
      }))
    };

    res.set('Content-Type', 'application/fhir+json');
    res.json(bundle);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /Observation
 * Search observations by patient
 * Query: ?subject=userId&category=vital-signs (optional)
 */
router.get('/Observation', authenticateUser, consentMiddleware, requirePayment, async (req, res, next) => {
  try {
    const patientId = req.query.subject;
    const category = req.query.category;

    if (!patientId) {
      return next(new AppError('subject parameter required', 400));
    }

    // Log FHIR access
    await logFHIRAccess({
      userId: req.user._id,
      role: req.user.role,
      action: 'SEARCH',
      resourceType: 'Observation',
      resourceId: patientId,
      patientId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      success: true
    });

    const query = { userId: patientId, status: { $ne: 'cancelled' } };
    if (category) query.category = category;
    if (req.query.appointmentId) query.appointmentId = req.query.appointmentId;

    const observations = await Observation.find(query).sort({ effectiveDate: -1 }).limit(100);

    const bundle = {
      resourceType: 'Bundle',
      type: 'searchset',
      total: observations.length,
      entry: observations.map(obs => ({
        resource: {
          resourceType: 'Observation',
          id: obs._id.toString(),
          category: obs.category,
          code: obs.code,
          subject: { reference: `Patient/${obs.userId}` },
          status: obs.status,
          effectiveDateTime: obs.effectiveDate,
          value: obs.value,
          referenceRange: obs.referenceRange,
          interpretation: [{ coding: [{ code: obs.interpretation }] }]
        }
      }))
    };

    res.set('Content-Type', 'application/fhir+json');
    res.json(bundle);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /AllergyIntolerance
 * Search allergies by patient
 * Query: ?patient=userId
 */
router.get('/AllergyIntolerance', authenticateUser, consentMiddleware, async (req, res, next) => {
  try {
    const patientId = req.query.patient;

    if (!patientId) {
      return next(new AppError('patient parameter required', 400));
    }

    // Log FHIR access
    await logFHIRAccess({
      userId: req.user._id,
      role: req.user.role,
      action: 'SEARCH',
      resourceType: 'AllergyIntolerance',
      resourceId: patientId,
      patientId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      success: true
    });

    const allergies = await AllergyIntolerance.find({
      userId: patientId,
      clinicalStatus: { $in: ['active', 'confirmed'] }
    });

    const bundle = {
      resourceType: 'Bundle',
      type: 'searchset',
      total: allergies.length,
      entry: allergies.map(allergy => ({
        resource: {
          resourceType: 'AllergyIntolerance',
          id: allergy._id.toString(),
          type: allergy.type,
          category: [allergy.category],
          substance: allergy.substance,
          patient: { reference: `Patient/${allergy.userId}` },
          clinicalStatus: { coding: [{ code: allergy.clinicalStatus }] },
          verificationStatus: { coding: [{ code: allergy.verificationStatus }] },
          criticality: allergy.criticality,
          reaction: allergy.reaction,
          recordedDate: allergy.recordedDate
        }
      }))
    };

    res.set('Content-Type', 'application/fhir+json');
    res.json(bundle);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /Patient/:id/$everything
 * Comprehensive record of everything known about a patient
 * Returns Patient + all related Conditions, Observations, Allergies, Encounters
 */
router.get('/Patient/:id/\\$everything', authenticateUser, async (req, res, next) => {
  try {
    const patientId = req.params.id;

    // Log FHIR access
    await logFHIRAccess({
      userId: req.user._id,
      role: req.user.role,
      action: 'EVERYTHING',
      resourceType: 'Patient',
      resourceId: patientId,
      patientId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      success: true
    });

    // Fetch patient data
    const user = await User.findById(patientId);
    if (!user) {
      return next(new AppError('Patient not found', 404));
    }

    const userProfile = await UserProfile.findOne({ userId: patientId });
    const conditions = await Condition.find({ userId: patientId });
    const observations = await Observation.find({ userId: patientId });
    const allergies = await AllergyIntolerance.find({ userId: patientId });
    const encounters = await Appointment.find({ userId: patientId })
      .populate('doctorId')
      .populate('userId');

    // Build comprehensive bundle
    const entries = [];

    // Add Patient resource
    entries.push({
      resource: toFhirPatient(user, userProfile)
    });

    // Add Conditions
    conditions.forEach(cond => {
      entries.push({
        resource: {
          resourceType: 'Condition',
          id: cond._id.toString(),
          code: cond.code,
          subject: { reference: `Patient/${cond.userId}` },
          clinicalStatus: { coding: [{ code: cond.clinicalStatus }] },
          verificationStatus: { coding: [{ code: cond.verificationStatus }] },
          severity: { coding: [{ code: cond.severity }] },
          onsetDate: cond.onsetDate,
          recordedDate: cond.recordedDate
        }
      });
    });

    // Add Observations
    observations.forEach(obs => {
      entries.push({
        resource: {
          resourceType: 'Observation',
          id: obs._id.toString(),
          category: obs.category,
          code: obs.code,
          subject: { reference: `Patient/${obs.userId}` },
          status: obs.status,
          effectiveDateTime: obs.effectiveDate,
          value: obs.value,
          interpretation: [{ coding: [{ code: obs.interpretation }] }]
        }
      });
    });

    // Add AllergyIntolerances
    allergies.forEach(allergy => {
      entries.push({
        resource: {
          resourceType: 'AllergyIntolerance',
          id: allergy._id.toString(),
          type: allergy.type,
          category: [allergy.category],
          substance: allergy.substance,
          patient: { reference: `Patient/${allergy.userId}` },
          clinicalStatus: { coding: [{ code: allergy.clinicalStatus }] },
          criticality: allergy.criticality
        }
      });
    });

    // Add Encounters
    encounters.forEach(enc => {
      entries.push({
        resource: toFhirEncounter(enc, enc.userId, enc.doctorId)
      });
    });

    const bundle = {
      resourceType: 'Bundle',
      type: 'searchset',
      total: entries.length,
      entry: entries
    };

    res.set('Content-Type', 'application/fhir+json');
    res.json(bundle);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /MedicationRequest
 * Search medication requests by patient
 * Query: ?patient=userId&status=active (optional)
 */
router.get('/MedicationRequest', authenticateUser, consentMiddleware, requirePayment, async (req, res, next) => {
  try {
    const patientId = req.query.patient;
    const status = req.query.status;

    if (!patientId) {
      return next(new AppError('patient parameter required', 400));
    }

    const query = { user_ref: patientId };
    if (status) query.status = status;
    if (req.query.appointmentId) query.appointment_ref = req.query.appointmentId;

    const requests = await MedicationRequest.find(query)
      .populate('medication_ref')
      .populate('doctor_ref')
      .sort({ authoredOn: -1 });

    const bundle = {
      resourceType: 'Bundle',
      type: 'searchset',
      total: requests.length,
      entry: requests.map(req => ({
        resource: toFhirMedicationRequest(req, req.medication_ref)
      }))
    };

    res.set('Content-Type', 'application/fhir+json');
    res.json(bundle);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /DiagnosticReport
 * Search diagnostic reports by patient
 * Query: ?patient=userId&date=YYYY-MM-DD (optional)
 */
router.get('/DiagnosticReport', authenticateUser, consentMiddleware, requirePayment, async (req, res, next) => {
  try {
    const patientId = req.query.patient;
    const date = req.query.date;

    if (!patientId) {
      return next(new AppError('patient parameter required', 400));
    }

    const query = { user_ref: patientId };
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.effectiveDate = { $gte: startDate, $lt: endDate };
    }
    if (req.query.appointmentId) {
      query.appointment_ref = req.query.appointmentId;
    }

    const reports = await DiagnosticReport.find(query).sort({ issued: -1 });

    const bundle = {
      resourceType: 'Bundle',
      type: 'searchset',
      total: reports.length,
      entry: reports.map(report => ({
        resource: toFhirDiagnosticReport(report)
      }))
    };

    res.set('Content-Type', 'application/fhir+json');
    res.json(bundle);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /Procedure
 * Search procedures by patient
 * Query: ?patient=userId
 */
router.get('/Procedure', authenticateUser, consentMiddleware, async (req, res, next) => {
  try {
    const patientId = req.query.patient;

    if (!patientId) {
      return next(new AppError('patient parameter required', 400));
    }

    const procedures = await Procedure.find({ user_ref: patientId }).sort({ performedDate: -1 });

    const bundle = {
      resourceType: 'Bundle',
      type: 'searchset',
      total: procedures.length,
      entry: procedures.map(proc => ({
        resource: toFhirProcedure(proc)
      }))
    };

    res.set('Content-Type', 'application/fhir+json');
    res.json(bundle);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /Immunization
 * Search immunizations by patient
 * Query: ?patient=userId
 */
router.get('/Immunization', authenticateUser, consentMiddleware, async (req, res, next) => {
  try {
    const patientId = req.query.patient;

    if (!patientId) {
      return next(new AppError('patient parameter required', 400));
    }

    const immunizations = await Immunization.find({ user_ref: patientId }).sort({ occurrenceDate: -1 });

    const bundle = {
      resourceType: 'Bundle',
      type: 'searchset',
      total: immunizations.length,
      entry: immunizations.map(imm => ({
        resource: toFhirImmunization(imm)
      }))
    };

    res.set('Content-Type', 'application/fhir+json');
    res.json(bundle);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /CodeSystem
 * Search code system lookup tables
 * Query: ?system=icd10|loinc|snomed&query=searchTerm
 */
router.get('/CodeSystem', async (req, res, next) => {
  try {
    const { system, query } = req.query;

    if (!system || !query) {
      return next(new AppError('system and query parameters required', 400));
    }

    const results = searchCodeSystem(system, query);

    const valueSet = {
      resourceType: 'ValueSet',
      status: 'active',
      compose: {
        include: [
          {
            system,
            concept: results.map(r => ({
              code: r.code,
              display: r.display
            }))
          }
        ]
      },
      expansion: {
        contains: results.map(r => ({
          system: r.system,
          code: r.code,
          display: r.display
        }))
      }
    };

    res.set('Content-Type', 'application/fhir+json');
    res.json(valueSet);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /Condition
 * Doctor creates a new condition for a patient
 * Requires: doctor authentication
 */
router.post('/Condition', authenticateUser, isDoctor, fhirWriteLimiter, requirePayment, async (req, res, next) => {
  try {
    console.log('========== [POST /Condition] START ==========');
    console.log('📨 [POST /Condition] Received request');
    console.log('   Authenticated user:', req.user?.email, '| User ID:', req.user?._id);
    console.log('   Request body:', JSON.stringify(req.body, null, 2));

    // Validate FHIR resource before processing
    console.log('🔍 [POST /Condition] Starting validation...');
    const validation = validateResource('Condition', req.body);
    console.log('   Validation result:', { valid: validation.valid, errors: validation.errors });
    
    if (!validation.valid) {
      console.warn('❌ [POST /Condition] Validation FAILED');
      console.warn('   Validation errors:', validation.errors);
      return res.status(422).json(createOperationOutcome(validation.errors));
    }
    
    console.log('✅ [POST /Condition] Validation PASSED');

    const { user_ref, code, display, clinicalStatus, verificationStatus, severity, notes } = req.body;
    console.log('📋 [POST /Condition] Extracted fields:');
    console.log('   user_ref:', user_ref);
    console.log('   code:', code);
    console.log('   display:', display);
    console.log('   clinicalStatus:', clinicalStatus);
    console.log('   severity:', severity);

    if (!user_ref || !code || !display) {
      console.error('❌ [POST /Condition] Missing required fields');
      return next(new AppError('user_ref, code, and display are required', 400));
    }

    // ✅ FIX: Parse FHIR reference format "Patient/507f..." to extract just the ID
    console.log('🔧 [POST /Condition] Parsing FHIR reference...');
    const extractIdFromReference = (ref) => {
      console.log('   Extracting ID from:', ref);
      if (!ref) {
        console.log('   Reference is null/empty');
        return null;
      }
      if (ref.includes('/')) {
        const parts = ref.split('/');
        const extractedId = parts[parts.length - 1];
        console.log('   Found "/" in reference, extracted ID:', extractedId);
        return extractedId;
      }
      console.log('   No "/" found, using ref as-is');
      return ref;
    };
    
    const userId = extractIdFromReference(user_ref);
    console.log('   Final userId:', userId);

    // Normalize code to string (may come as string directly or nested in object)
    console.log('🔧 [POST /Condition] Normalizing code...');
    const codeString = typeof code === 'string' ? code : (code?.code || code?.coding || '');
    console.log('   Normalized code:', codeString);

    console.log('🏗️ [POST /Condition] Creating Condition document...');
    const condition = new Condition({
      userId: userId,
      code: {
        system: 'http://hl7.org/fhir/sid/icd-10',
        coding: codeString,
        display
      },
      clinicalStatus: (clinicalStatus || 'active').toLowerCase(),
      verificationStatus: (verificationStatus || 'confirmed').toLowerCase(),
      severity: severity ? severity.toLowerCase() : undefined,
      notes,
      recordedBy: req.user._id,
      recordedDate: new Date()
    });
    console.log('   Condition object created:', {
      userId: condition.userId,
      code: condition.code,
      clinicalStatus: condition.clinicalStatus,
      recordedBy: condition.recordedBy
    });

    console.log('💾 [POST /Condition] Saving to database...');
    try {
      await condition.save();
      console.log('✅ [POST /Condition] Saved successfully, ID:', condition._id);
    } catch (saveError) {
      console.error('❌ [POST /Condition] Database save FAILED');
      console.error('   Error type:', saveError.constructor.name);
      console.error('   Error message:', saveError.message);
      console.error('   Error details:', saveError);
      
      // Handle Mongoose validation errors
      if (saveError.name === 'ValidationError') {
        const validationErrors = Object.values(saveError.errors)
          .map(err => err.message)
          .join('; ');
        console.error('   Mongoose validation error:', validationErrors);
        return res.status(422).json(createOperationOutcome([validationErrors]));
      }
      
      throw saveError;
    }

    // Log FHIR write access for audit trail
    console.log('📝 [POST /Condition] Logging FHIR access...');
    try {
      await logFHIRAccess({
        userId: req.user._id,
        role: req.user.role,
        action: 'CREATE',
        resourceType: 'Condition',
        resourceId: condition._id,
        patientId: user_ref,
        ipAddress: req.ip,
        success: true
      });
      console.log('✅ [POST /Condition] FHIR access logged');
    } catch (auditError) {
      console.warn('⚠️ [POST /Condition] Audit logging failed (non-critical):', auditError.message);
    }

    // Trigger Socket.io notification to patient
    console.log('📡 [POST /Condition] Sending Socket.io notification...');
    const io = req.app.get('io');
    if (io) {
      io.to(user_ref).emit('newClinicalData', {
        type: 'Condition',
        resourceId: condition._id.toString(),
        display: `New condition recorded: ${display}`
      });
      console.log('✅ [POST /Condition] Socket.io notification sent');
    } else {
      console.warn('⚠️ [POST /Condition] Socket.io not available');
    }

    console.log('🔄 [POST /Condition] Converting to FHIR format...');
    const fhirCondition = toFhirCondition(condition);
    console.log('✅ [POST /Condition] FHIR conversion complete');

    res.set('Content-Type', 'application/fhir+json');
    console.log('✅ [POST /Condition] Sending 201 Created response');
    console.log('========== [POST /Condition] END (SUCCESS) ==========');
    res.status(201).json(fhirCondition);
  } catch (err) {
    console.error('========== [POST /Condition] EXCEPTION CAUGHT ==========');
    console.error('❌ [POST /Condition] Error type:', err.constructor.name);
    console.error('❌ [POST /Condition] Error message:', err.message);
    console.error('❌ [POST /Condition] Error stack:', err.stack);
    console.error('❌ [POST /Condition] Full error object:', err);
    console.error('========== [POST /Condition] END (ERROR) ==========');
    next(err);
  }
});

/**
 * POST /Observation
 * Doctor creates a new observation (vital, lab result)
 * Requires: doctor authentication
 */
router.post('/Observation', authenticateUser, isDoctor, fhirWriteLimiter, requirePayment, async (req, res, next) => {
  try {
    console.log('\n========== [POST /Observation] ========== START ==========');
    console.log('[POST /Observation] [STEP 1/10] Request received');
    console.log('   User ID:', req.user._id);
    console.log('   User Email:', req.user.email);
    console.log('   User Role:', req.user.role);
    console.log('   Request Body:', JSON.stringify(req.body, null, 2));

    // Validate FHIR resource before processing
    console.log('[POST /Observation] [STEP 2/10] Validating FHIR resource...');
    const validation = validateResource('Observation', req.body);
    console.log('[POST /Observation] [STEP 2/10] Validation result:', validation.valid);
    if (!validation.valid) {
      console.error('[POST /Observation] ❌ Validation failed. Errors:', validation.errors);
      return res.status(422).json(createOperationOutcome(validation.errors));
    }
    console.log('[POST /Observation] [STEP 2/10] ✅ Validation passed');

    const { user_ref, code, display, value, unit, effectiveDate, category, status, interpretation } = req.body;

    console.log('[POST /Observation] [STEP 3/10] Extracting fields from request...');
    console.log('   user_ref:', user_ref);
    console.log('   code:', code);
    console.log('   value:', value);
    console.log('   unit:', unit);

    if (!user_ref || !code || (value === undefined && value !== 0)) {
      const missingFields = [];
      if (!user_ref) missingFields.push('user_ref');
      if (!code) missingFields.push('code');
      if (value === undefined && value !== 0) missingFields.push('value');
      console.error('[POST /Observation] ❌ Missing required fields:', missingFields);
      return next(new AppError(`Missing required fields: ${missingFields.join(', ')}`, 400));
    }

    // ✅ FIX: Parse FHIR reference format "Patient/507f..." to extract just the ID
    console.log('[POST /Observation] [STEP 4/10] Parsing FHIR reference...');
    const extractIdFromReference = (ref) => {
      console.log('[POST /Observation] [extractIdFromReference] Input:', ref);
      if (!ref) {
        console.log('[POST /Observation] [extractIdFromReference] Null/empty ref');
        return null;
      }
      if (ref.includes('/')) {
        const parts = ref.split('/');
        console.log('[POST /Observation] [extractIdFromReference] Split parts:', parts);
        const extractedId = parts[parts.length - 1];
        console.log('[POST /Observation] [extractIdFromReference] Extracted ID:', extractedId);
        return extractedId;
      }
      console.log('[POST /Observation] [extractIdFromReference] No "/" found, returning as-is');
      return ref;
    };
    
    const userId = extractIdFromReference(user_ref);
    console.log('[POST /Observation] [STEP 4/10] ✅ Parsed FHIR reference. User ID:', userId);

    // Normalize code to string (may come as string directly or nested in object)
    console.log('[POST /Observation] [STEP 5/10] Normalizing code...');
    const codeString = typeof code === 'string' ? code : (code?.code || code?.coding || '');
    console.log('[POST /Observation] [STEP 5/10] ✅ Normalized code:', codeString);

    // Normalize value handling - accept number directly or nested in object
    console.log('[POST /Observation] [STEP 6/10] Normalizing value...');
    let normalizedValue;
    if (typeof value === 'number') {
      // Direct numeric value
      normalizedValue = {
        quantity: {
          value: value,
          unit: unit || undefined,
          code: code   // Use code as unit code if available
        }
      };
      console.log('[POST /Observation] [STEP 6/10] Value is number. Normalized to quantity');
    } else if (typeof value === 'object' && value?.quantity) {
      // Already in quantity format
      normalizedValue = value;
      console.log('[POST /Observation] [STEP 6/10] Value is already in quantity format');
    } else if (typeof value === 'object' && value?.value !== undefined) {
      // Value is number inside object
      normalizedValue = {
        quantity: {
          value: value.value,
          unit: value.unit || unit || undefined,
          code: value.code || undefined
        }
      };
      console.log('[POST /Observation] [STEP 6/10] Value is object with value property');
    } else if (typeof value === 'string') {
      // String value
      normalizedValue = { string: value };
      console.log('[POST /Observation] [STEP 6/10] Value is string');
    } else {
      // Fallback
      normalizedValue = value;
      console.log('[POST /Observation] [STEP 6/10] Using value as-is (fallback)');
    }
    console.log('[POST /Observation] [STEP 6/10] ✅ Normalized value:', JSON.stringify(normalizedValue));

    console.log('[POST /Observation] [STEP 7/10] Creating Observation object...');
    const observation = new Observation({
      userId: userId,
      category: category ? category.toLowerCase() : 'vital-signs',
      code: {
        system: 'http://loinc.org',
        coding: codeString,    // Now contains string value "8480-6" instead of object
        display: display || codeString
      },
      status: status ? status.toLowerCase() : 'final',
      value: normalizedValue,
      effectiveDate: effectiveDate || new Date(),
      interpretation: interpretation ? interpretation.toLowerCase() : undefined,
      performer: req.user._id
    });
    console.log('[POST /Observation] [STEP 7/10] ✅ Observation object created:', observation._id);

    console.log('[POST /Observation] [STEP 8/10] Saving to database...');
    try {
      await observation.save();
      console.log('[POST /Observation] [STEP 8/10] ✅ Saved successfully. ID:', observation._id);
    } catch (saveError) {
      console.error('[POST /Observation] [STEP 8/10] ❌ Database save failed');
      console.error('   Error name:', saveError.name);
      console.error('   Error message:', saveError.message);
      console.error('   Error details:', saveError);
      throw saveError;
    }

    // Log FHIR write access for audit trail
    console.log('[POST /Observation] [STEP 9/10] Logging FHIR access for audit trail...');
    try {
      await logFHIRAccess({
        userId: req.user._id,
        role: req.user.role,
        action: 'CREATE',
        resourceType: 'Observation',
        resourceId: observation._id,
        patientId: user_ref,
        ipAddress: req.ip,
        success: true
      });
      console.log('[POST /Observation] [STEP 9/10] ✅ Audit log created');
    } catch (auditError) {
      console.error('[POST /Observation] [STEP 9/10] ⚠️  Audit logging failed (non-blocking):', auditError.message);
    }

    // Trigger Socket.io notification to patient
    console.log('[POST /Observation] [STEP 10/10] Sending Socket.io notification...');
    const io = req.app.get('io');
    if (io) {
      io.to(user_ref).emit('newClinicalData', {
        type: 'Observation',
        resourceId: observation._id.toString(),
        display: `New observation recorded: ${display || codeString}`
      });
      console.log('[POST /Observation] [STEP 10/10] ✅ Socket.io notification sent');
    } else {
      console.log('[POST /Observation] [STEP 10/10] ⚠️  Socket.io not available');
    }

    console.log('[POST /Observation] Sending FHIR response...');
    res.set('Content-Type', 'application/fhir+json');
    res.status(201).json(toFhirObservation(observation));
    console.log('[POST /Observation] ========== END (SUCCESS) ==========\n');
  } catch (err) {
    console.error('\n[POST /Observation] ========== END (ERROR) ==========');
    console.error('[POST /Observation] ❌ Exception caught:');
    console.error('   Error type:', err.constructor.name);
    console.error('   Error message:', err.message);
    console.error('   Error stack:', err.stack);
    console.error('   Full error object:', err);
    next(err);
  }
});

/**
 * POST /MedicationRequest
 * Doctor prescribes a medication
 * Requires: doctor authentication
 */
router.post('/MedicationRequest', authenticateUser, isDoctor, fhirWriteLimiter, requirePayment, async (req, res, next) => {
  try {
    console.log('\n========== [POST /MedicationRequest] ========== START ==========');
    console.log('[POST /MedicationRequest] [STEP 1/9] Request received');
    console.log('   User ID:', req.user._id);
    console.log('   User Email:', req.user.email);
    console.log('   User Role:', req.user.role);
    console.log('   Request Body:', JSON.stringify(req.body, null, 2));

    // Validate FHIR resource before processing
    console.log('[POST /MedicationRequest] [STEP 2/9] Validating FHIR resource...');
    const validation = validateResource('MedicationRequest', req.body);
    console.log('[POST /MedicationRequest] [STEP 2/9] Validation result:', validation.valid);
    if (!validation.valid) {
      console.error('[POST /MedicationRequest] ❌ Validation failed. Errors:', validation.errors);
      return res.status(422).json(createOperationOutcome(validation.errors));
    }
    console.log('[POST /MedicationRequest] [STEP 2/9] ✅ Validation passed');

    const {
      user_ref,
      medication_ref,
      subject,
      medication,
      medicationCodeableConcept,
      medicationReference,
      dosageInstruction,
      status,
      intent,
      note,
      authoredOn
    } = req.body;

    console.log('[POST /MedicationRequest] [STEP 3/9] Extracting fields from request...');
    console.log('   user_ref:', user_ref);
    console.log('   medication_ref:', medication_ref);
    console.log('   dosageInstruction:', dosageInstruction);

    if (!user_ref && !subject) {
      const missingFields = [];
      if (!user_ref && !subject) missingFields.push('user_ref or subject');
      if (!medication_ref && !medicationReference && !medication && !medicationCodeableConcept) {
        missingFields.push('medication_ref or medication/medicationCodeableConcept');
      }
      console.error('[POST /MedicationRequest] ❌ Missing required fields:', missingFields);
      return next(new AppError(`Missing required fields: ${missingFields.join(', ')}`, 400));
    }

    // ✅ FIX: Parse FHIR reference format to extract IDs
    console.log('[POST /MedicationRequest] [STEP 4/9] Parsing FHIR references...');
    const extractIdFromReference = (ref) => {
      console.log('[POST /MedicationRequest] [extractIdFromReference] Input:', ref);
      if (!ref) {
        console.log('[POST /MedicationRequest] [extractIdFromReference] Null/empty ref');
        return null;
      }
      if (ref.includes('/')) {
        const parts = ref.split('/');
        console.log('[POST /MedicationRequest] [extractIdFromReference] Split parts:', parts);
        const extractedId = parts[parts.length - 1];
        console.log('[POST /MedicationRequest] [extractIdFromReference] Extracted ID:', extractedId);
        return extractedId;
      }
      console.log('[POST /MedicationRequest] [extractIdFromReference] No "/" found, returning as-is');
      return ref;
    };
    
    const subjectRef = typeof subject === 'string' ? subject : subject?.reference;
    const userId = extractIdFromReference(user_ref || subjectRef);
    const medicationRef = medication_ref || (typeof medicationReference === 'string' ? medicationReference : medicationReference?.reference);
    let medicationId = extractIdFromReference(medicationRef);
    console.log('[POST /MedicationRequest] [STEP 4/9] ✅ Parsed FHIR references');
    console.log('   User ID:', userId);
    console.log('   Medication ID:', medicationId);

    // If medication_ref is missing, attempt to create a Medication from CodeableConcept/text
    if (!medicationId) {
      const medicationText =
        medication?.text ||
        medication?.display ||
        medicationCodeableConcept?.text ||
        medicationCodeableConcept?.coding?.[0]?.display ||
        null;

      if (!medicationText) {
        console.error('[POST /MedicationRequest] ❌ Unable to derive medication text');
        return next(new AppError('Medication name is required', 400));
      }

      const medicationCode = String(medicationText)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 50);

      console.log('[POST /MedicationRequest] [STEP 4.5/9] Creating Medication document...');
      const medicationDoc = new Medication({
        code: medicationCode || 'unknown',
        display: medicationText,
        user_ref: userId
      });
      try {
        await medicationDoc.save();
        medicationId = medicationDoc._id;
        console.log('[POST /MedicationRequest] [STEP 4.5/9] ✅ Medication created:', medicationId);
      } catch (medSaveError) {
        console.error('[POST /MedicationRequest] [STEP 4.5/9] ❌ Medication save failed:', medSaveError.message);
        throw medSaveError;
      }
    }

    // Normalize dosageInstruction to match schema (object, not array)
    const normalizeDosageInstruction = (input) => {
      if (!input) return {};
      const item = Array.isArray(input) ? input[0] : input;

      const doseQuantity =
        item?.doseQuantity ||
        item?.doseAndRate?.[0]?.doseQuantity ||
        item?.dose;
      const frequencyValue = item?.timing?.repeat?.frequency;
      const periodUnit = item?.timing?.repeat?.periodUnit;
      const routeDisplay =
        typeof item?.route === 'string'
          ? item.route
          : item?.route?.coding?.[0]?.display || item?.route?.display;

      const frequencyUnitMap = {
        d: 'per-day',
        day: 'per-day',
        wk: 'per-week',
        week: 'per-week',
        mo: 'per-month',
        month: 'per-month',
        h: 'per-hour',
        hour: 'per-hour'
      };

      const normalized = {
        text: item?.text
      };

      if (doseQuantity?.value != null) {
        normalized.dose = {
          value: doseQuantity.value,
          unit: doseQuantity.unit
        };
      }

      if (frequencyValue != null) {
        normalized.frequency = {
          value: frequencyValue,
          unit: frequencyUnitMap[periodUnit] || 'per-day'
        };
      }

      if (routeDisplay) {
        normalized.route = routeDisplay.toLowerCase();
      }

      return normalized;
    };

    const normalizedDosageInstruction = normalizeDosageInstruction(dosageInstruction);
    const normalizedNote = Array.isArray(note) ? note[0]?.text || '' : note;

    console.log('[POST /MedicationRequest] [STEP 5/9] Creating MedicationRequest object...');
    const request = new MedicationRequest({
      medication_ref: medicationId,
      user_ref: userId,
      doctor_ref: req.user._id,
      status: status || 'active',
      intent: intent || 'order',
      dosageInstruction: normalizedDosageInstruction || {},
      authoredOn:
        authoredOn && !isNaN(new Date(authoredOn).getTime())
          ? new Date(authoredOn)
          : new Date(),
      note: normalizedNote
    });
    console.log('[POST /MedicationRequest] [STEP 5/9] ✅ MedicationRequest object created:', request._id);

    console.log('[POST /MedicationRequest] [STEP 6/9] Saving to database...');
    try {
      await request.save();
      console.log('[POST /MedicationRequest] [STEP 6/9] ✅ Saved successfully. ID:', request._id);
    } catch (saveError) {
      console.error('[POST /MedicationRequest] [STEP 6/9] ❌ Database save failed');
      console.error('   Error name:', saveError.name);
      console.error('   Error message:', saveError.message);
      console.error('   Error details:', saveError);
      throw saveError;
    }

    console.log('[POST /MedicationRequest] [STEP 7/9] Populating medication reference...');
    try {
      await request.populate('medication_ref');
      console.log('[POST /MedicationRequest] [STEP 7/9] ✅ Populated medication_ref');
    } catch (populateError) {
      console.error('[POST /MedicationRequest] [STEP 7/9] ⚠️  Populate failed (non-blocking):', populateError.message);
    }

    // Log FHIR write access for audit trail
    console.log('[POST /MedicationRequest] [STEP 8/9] Logging FHIR access for audit trail...');
    try {
      await logFHIRAccess({
        userId: req.user._id,
        role: req.user.role,
        action: 'CREATE',
        resourceType: 'MedicationRequest',
        resourceId: request._id,
        patientId: user_ref,
        ipAddress: req.ip,
        success: true
      });
      console.log('[POST /MedicationRequest] [STEP 8/9] ✅ Audit log created');
    } catch (auditError) {
      console.error('[POST /MedicationRequest] [STEP 8/9] ⚠️  Audit logging failed (non-blocking):', auditError.message);
    }

    // Trigger Socket.io notification
    console.log('[POST /MedicationRequest] [STEP 9/9] Sending Socket.io notification...');
    const io = req.app.get('io');
    if (io) {
      io.to(user_ref).emit('newClinicalData', {
        type: 'MedicationRequest',
        resourceId: request._id.toString(),
        display: `New prescription issued`
      });
      console.log('[POST /MedicationRequest] [STEP 9/9] ✅ Socket.io notification sent');
    } else {
      console.log('[POST /MedicationRequest] [STEP 9/9] ⚠️  Socket.io not available');
    }

    console.log('[POST /MedicationRequest] Sending FHIR response...');
    res.set('Content-Type', 'application/fhir+json');
    res.status(201).json(toFhirMedicationRequest(request, request.medication_ref));
    console.log('[POST /MedicationRequest] ========== END (SUCCESS) ==========\n');
  } catch (err) {
    console.error('\n[POST /MedicationRequest] ========== END (ERROR) ==========');
    console.error('[POST /MedicationRequest] ❌ Exception caught:');
    console.error('   Error type:', err.constructor.name);
    console.error('   Error message:', err.message);
    console.error('   Error stack:', err.stack);
    console.error('   Full error object:', err);
    next(err);
  }
});

/**
 * POST /DiagnosticReport
 * Doctor creates a diagnostic report with optional attachment
 * Requires: doctor authentication, multipart/form-data if attachment
 */
router.post('/DiagnosticReport', authenticateUser, isDoctor, fhirWriteLimiter, requirePayment, async (req, res, next) => {
  try {
    console.log('\n========== [POST /DiagnosticReport] ========== START ==========');
    console.log('[POST /DiagnosticReport] [STEP 1/10] Request received');
    console.log('   User ID:', req.user._id);
    console.log('   User Email:', req.user.email);
    console.log('   User Role:', req.user.role);
    console.log('   Request Body:', JSON.stringify(req.body, null, 2));
    console.log('   Has attachment file:', req.files && req.files.attachment ? 'Yes' : 'No');

    const parseMaybeJson = (value) => {
      if (typeof value !== 'string') return value;
      const trimmed = value.trim();
      if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return value;
      try {
        return JSON.parse(trimmed);
      } catch (err) {
        return value;
      }
    };

    const normalizeDiagnosticReportPayload = (body) => {
      const normalized = { ...body };
      normalized.code = parseMaybeJson(normalized.code);
      normalized.subject = parseMaybeJson(normalized.subject);
      normalized.performer = parseMaybeJson(normalized.performer);
      normalized.result = parseMaybeJson(normalized.result);
      return normalized;
    };

    const normalizedBody = normalizeDiagnosticReportPayload(req.body);

    // Validate FHIR resource before processing
    console.log('[POST /DiagnosticReport] [STEP 2/10] Validating FHIR resource...');
    const validation = validateResource('DiagnosticReport', normalizedBody);
    console.log('[POST /DiagnosticReport] [STEP 2/10] Validation result:', validation.valid);
    if (!validation.valid) {
      console.error('[POST /DiagnosticReport] ❌ Validation failed. Errors:', validation.errors);
      return res.status(422).json(createOperationOutcome(validation.errors));
    }
    console.log('[POST /DiagnosticReport] [STEP 2/10] ✅ Validation passed');

    const {
      user_ref,
      subject,
      performer,
      code,
      display,
      status,
      effectiveDate,
      effectiveDateTime,
      issued,
      result,
      conclusion
    } = normalizedBody;

    console.log('[POST /DiagnosticReport] [STEP 3/10] Extracting fields from request...');
    console.log('   user_ref:', user_ref);
    console.log('   code:', code);
    console.log('   display:', display);
    console.log('   status:', status);

    const subjectRef = typeof subject === 'string' ? subject : subject?.reference;
    const performerRef = Array.isArray(performer)
      ? performer[0]?.reference
      : (typeof performer === 'string' ? performer : performer?.reference);

    const codeString = typeof code === 'string'
      ? code
      : (code?.coding?.[0]?.code || code?.code);
    const displayText = display || code?.coding?.[0]?.display || code?.text;

    if (!user_ref && !subjectRef || !codeString || !displayText) {
      const missingFields = [];
      if (!user_ref && !subjectRef) missingFields.push('user_ref or subject');
      if (!codeString) missingFields.push('code');
      if (!displayText) missingFields.push('display');
      console.error('[POST /DiagnosticReport] ❌ Missing required fields:', missingFields);
      return next(new AppError(`Missing required fields: ${missingFields.join(', ')}`, 400));
    }

    // ✅ FIX: Parse FHIR reference format "Patient/507f..." to extract just the ID
    console.log('[POST /DiagnosticReport] [STEP 4/10] Parsing FHIR reference...');
    const extractIdFromReference = (ref) => {
      console.log('[POST /DiagnosticReport] [extractIdFromReference] Input:', ref);
      if (!ref) {
        console.log('[POST /DiagnosticReport] [extractIdFromReference] Null/empty ref');
        return null;
      }
      if (ref.includes('/')) {
        const parts = ref.split('/');
        console.log('[POST /DiagnosticReport] [extractIdFromReference] Split parts:', parts);
        const extractedId = parts[parts.length - 1];
        console.log('[POST /DiagnosticReport] [extractIdFromReference] Extracted ID:', extractedId);
        return extractedId;
      }
      console.log('[POST /DiagnosticReport] [extractIdFromReference] No "/" found, returning as-is');
      return ref;
    };
    
    const userId = extractIdFromReference(user_ref || subjectRef);
    console.log('[POST /DiagnosticReport] [STEP 4/10] ✅ Parsed FHIR reference. User ID:', userId);

    console.log('[POST /DiagnosticReport] [STEP 5/10] Creating DiagnosticReport object...');
    const effectiveDateValue = effectiveDateTime || effectiveDate || new Date();
    const issuedDate = issued && !isNaN(new Date(issued).getTime()) ? new Date(issued) : new Date();

    const report = new DiagnosticReport({
      user_ref: userId,
      doctor_ref: req.user._id,
      code: codeString,
      display: displayText,
      status: status || 'final',
      effectiveDate: effectiveDateValue,
      issued: issuedDate,
      result: Array.isArray(result)
        ? result.map(r => extractIdFromReference(r?.reference || r)).filter(Boolean)
        : [],
      conclusion
    });
    console.log('[POST /DiagnosticReport] [STEP 5/10] ✅ DiagnosticReport object created:', report._id);

    // Handle attachment if file uploaded
    console.log('[POST /DiagnosticReport] [STEP 6/10] Checking for file attachment...');
    if (req.files && req.files.attachment) {
      console.log('[POST /DiagnosticReport] [STEP 6/10] Processing uploaded file...');
      console.log('   File name:', req.files.attachment.name);
      console.log('   File size:', req.files.attachment.size);
      console.log('   File type:', req.files.attachment.mimetype);
      try {
        const uploader = require('../utils/ImageUploader');
        const uploadedUrl = await uploader.uploadFile(req.files.attachment);
        report.attachment = {
          url: uploadedUrl,
          contentType: req.files.attachment.mimetype,
          title: display
        };
        console.log('[POST /DiagnosticReport] [STEP 6/10] ✅ File uploaded successfully. URL:', uploadedUrl);
      } catch (uploadError) {
        console.error('[POST /DiagnosticReport] [STEP 6/10] ❌ File upload failed');
        console.error('   Error:', uploadError.message);
        throw uploadError;
      }
    } else {
      console.log('[POST /DiagnosticReport] [STEP 6/10] ℹ️  No file attachment included');
    }

    console.log('[POST /DiagnosticReport] [STEP 7/10] Saving to database...');
    try {
      await report.save();
      console.log('[POST /DiagnosticReport] [STEP 7/10] ✅ Saved successfully. ID:', report._id);
    } catch (saveError) {
      console.error('[POST /DiagnosticReport] [STEP 7/10] ❌ Database save failed');
      console.error('   Error name:', saveError.name);
      console.error('   Error message:', saveError.message);
      console.error('   Error details:', saveError);
      throw saveError;
    }

    // Log FHIR write access for audit trail
    console.log('[POST /DiagnosticReport] [STEP 8/10] Logging FHIR access for audit trail...');
    try {
      await logFHIRAccess({
        userId: req.user._id,
        role: req.user.role,
        action: 'CREATE',
        resourceType: 'DiagnosticReport',
        resourceId: report._id,
        patientId: user_ref,
        ipAddress: req.ip,
        success: true
      });
      console.log('[POST /DiagnosticReport] [STEP 8/10] ✅ Audit log created');
    } catch (auditError) {
      console.error('[POST /DiagnosticReport] [STEP 8/10] ⚠️  Audit logging failed (non-blocking):', auditError.message);
    }

    // Trigger Socket.io notification
    console.log('[POST /DiagnosticReport] [STEP 9/10] Sending Socket.io notification...');
    const io = req.app.get('io');
    if (io) {
      io.to(user_ref).emit('newClinicalData', {
        type: 'DiagnosticReport',
        resourceId: report._id.toString(),
        display: `New report: ${display}`
      });
      console.log('[POST /DiagnosticReport] [STEP 9/10] ✅ Socket.io notification sent');
    } else {
      console.log('[POST /DiagnosticReport] [STEP 9/10] ⚠️  Socket.io not available');
    }

    console.log('[POST /DiagnosticReport] [STEP 10/10] Sending FHIR response...');
    res.set('Content-Type', 'application/fhir+json');
    res.status(201).json(toFhirDiagnosticReport(report));
    console.log('[POST /DiagnosticReport] ========== END (SUCCESS) ==========\n');
  } catch (err) {
    console.error('\n[POST /DiagnosticReport] ========== END (ERROR) ==========');
    console.error('[POST /DiagnosticReport] ❌ Exception caught:');
    console.error('   Error type:', err.constructor.name);
    console.error('   Error message:', err.message);
    console.error('   Error stack:', err.stack);
    console.error('   Full error object:', err);
    next(err);
  }
});

// ==================== PHASE 3: EXPORT, CONSENT & AUDIT ====================

/**
 * GET /Patient/:id/$export
 * Kick off async FHIR bulk export job
 * Returns: 202 Accepted with Content-Location header
 */
router.get('/Patient/:id/\\$export', authenticateUser, exportLimiter, async (req, res, next) => {
  try {
    const patientId = req.params.id;
    const { _since, _type } = req.query;
    
    // Validate patient access: patient can export their own, admin can export any
    if (req.user._id.toString() !== patientId && req.user.role !== 'admin') {
      return res.status(403).json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'forbidden',
          details: { text: 'Can only export your own data' }
        }]
      });
    }

    // Parse resource types to export
    const resourceTypes = _type ? _type.split(',').map(t => t.trim()) : null;

    // Create export job record
    const exportJob = new ExportJob({
      user_ref: patientId,
      requestedBy_ref: req.user._id,
      status: 'pending',
      resourceTypes: resourceTypes || []
    });
    await exportJob.save();

    // Process export asynchronously (don't block response)
    setImmediate(async () => {
      try {
        exportJob.status = 'in-progress';
        exportJob.startedAt = new Date();
        await exportJob.save();

        const { success, outputUrls, error } = await exportPatientData(
          patientId,
          req.user._id,
          resourceTypes
        );

        if (success) {
          exportJob.status = 'completed';
          exportJob.completedAt = new Date();
          exportJob.outputUrls = new Map(Object.entries(outputUrls));
        } else {
          exportJob.status = 'failed';
          exportJob.errorMessage = error;
        }
        await exportJob.save();
      } catch (err) {
        console.error('Error processing export:', err);
        exportJob.status = 'failed';
        exportJob.errorMessage = err.message;
        await exportJob.save();
      }
    });

    // Log the export request
    await logFHIRAccess({
      userId: req.user._id,
      role: req.user.role,
      action: 'EXPORT',
      resourceType: 'Patient',
      resourceId: patientId,
      patientId,
      success: true,
      successMessage: `Export job ${exportJob._id} created`
    });

    // Return 202 Accepted with Content-Location
    res.status(202);
    res.set('Content-Location', `/fhir/R4/$export-status/${exportJob._id}`);
    res.set('Content-Type', 'application/fhir+json');
    res.json({
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'information',
        code: 'processing',
        details: { text: `Export job ${exportJob._id} is processing` }
      }]
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /$export-status/:jobId
 * Poll export job status
 * Returns: 202 if running, 200 with URLs if complete, 500 if failed
 */
router.get('/\\$export-status/:jobId', authenticateUser, async (req, res, next) => {
  try {
    const job = await ExportJob.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'not-found',
          details: { text: 'Export job not found' }
        }]
      });
    }

    // Check access: patient/admin can check their own jobs
    if (req.user._id.toString() !== job.user_ref.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'forbidden',
          details: { text: 'Cannot access this export job' }
        }]
      });
    }

    if (job.status === 'in-progress') {
      return res.status(202).json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'information',
          code: 'processing',
          details: { text: 'Export is still being processed' }
        }]
      });
    }

    if (job.status === 'failed') {
      return res.status(500).json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'fatal',
          code: 'exception',
          details: { text: `Export failed: ${job.errorMessage}` }
        }]
      });
    }

    // Success: return URLs
    res.status(200);
    res.set('Content-Type', 'application/fhir+json');
    res.json({
      resourceType: 'Bundle',
      type: 'searchset',
      total: job.outputUrls.size,
      entry: Array.from(job.outputUrls.entries()).map(([resourceType, url]) => ({
        resource: {
          resourceType: 'Binary',
          contentType: 'application/fhir+ndjson',
          data: url
        }
      }))
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /$export-status/:jobId
 * Cancel pending export job
 */
router.delete('/\\$export-status/:jobId', authenticateUser, async (req, res, next) => {
  try {
    const job = await ExportJob.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'not-found',
          details: { text: 'Export job not found' }
        }]
      });
    }

    if (job.status !== 'pending' && job.status !== 'in-progress') {
      return res.status(400).json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'invalid',
          details: { text: `Cannot cancel export with status ${job.status}` }
        }]
      });
    }

    await ExportJob.deleteOne({ _id: req.params.jobId });

    res.status(202).json({
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'information',
        code: 'processing',
        details: { text: 'Export job cancelled' }
      }]
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /Consent
 * Patient grants consent to a doctor/hospital for specific resources
 */
router.post('/Consent', authenticateUser, fhirWriteLimiter, async (req, res, next) => {
  try {
    // Validate FHIR resource before processing
    const validation = validateResource('Consent', req.body);
    if (!validation.valid) {
      return res.status(422).json(createOperationOutcome(validation.errors));
    }

    const { grantedTo_ref, grantedToType, resourceTypes, purpose, period } = req.body;

    if (!grantedTo_ref || !resourceTypes || !purpose) {
      return next(new AppError('grantedTo_ref, resourceTypes, and purpose are required', 400));
    }

    const consent = new Consent({
      patient_ref: req.user._id,
      grantedTo_ref,
      grantedToType: grantedToType || 'doctor',
      resourceTypes,
      purpose,
      period: period || { start: new Date() },
      status: 'active'
    });

    await consent.save();

    // Log consent grant
    await logFHIRAccess({
      userId: req.user._id,
      role: req.user.role,
      action: 'CONSENT_GRANT',
      resourceType: 'Consent',
      resourceId: consent._id,
      consentId: consent._id,
      success: true
    });

    // Socket.io notification to the doctor/org about new consent
    const io = req.app.get('io');
    if (io) {
      io.to(grantedTo_ref.toString()).emit('newConsent', {
        consentId: consent._id,
        patientId: req.user._id,
        resourceTypes,
        period
      });
    }

    res.set('Content-Type', 'application/fhir+json');
    res.status(201).json(toFhirConsent(consent));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /Consent
 * List consents for a patient
 * Patients see their own, doctors see consents granted to them
 */
router.get('/Consent', authenticateUser, async (req, res, next) => {
  try {
    const patientId = req.query.patient;
    let query = {};

    if (req.user.role === 'doctor' || req.user.role === 'hospital') {
      // Doctor sees consents granted to them
      query = { grantedTo_ref: req.user._id, status: 'active' };
    } else {
      // Patient (or admin) sees their consents
      const patient = patientId || req.user._id;
      query = { patient_ref: patient };
    }

    const consents = await Consent.find(query);
    const fhirConsents = consents.map(toFhirConsent);

    res.set('Content-Type', 'application/fhir+json');
    res.status(200).json({
      resourceType: 'Bundle',
      type: 'searchset',
      total: fhirConsents.length,
      entry: fhirConsents.map(consent => ({
        resource: consent
      }))
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /Consent/:id
 * Patient revokes a consent
 */
router.delete('/Consent/:id', authenticateUser, async (req, res, next) => {
  try {
    const consent = await Consent.findById(req.params.id);
    if (!consent) {
      return res.status(404).json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'not-found',
          details: { text: 'Consent not found' }
        }]
      });
    }

    // Only the patient who granted consent can revoke it
    if (consent.patient_ref.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'forbidden',
          details: { text: 'Only the consenting patient can revoke this consent' }
        }]
      });
    }

    consent.status = 'inactive';
    consent.revokedAt = new Date();
    await consent.save();

    // Log consent revocation
    await logFHIRAccess({
      userId: req.user._id,
      role: req.user.role,
      action: 'CONSENT_REVOKE',
      resourceType: 'Consent',
      resourceId: consent._id,
      consentId: consent._id,
      success: true
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /Consent/:id
 * Patient updates consent period or resource types
 */
router.patch('/Consent/:id', authenticateUser, async (req, res, next) => {
  try {
    const consent = await Consent.findById(req.params.id);
    if (!consent) {
      return res.status(404).json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'not-found',
          details: { text: 'Consent not found' }
        }]
      });
    }

    // Only the patient who granted consent can update it
    if (consent.patient_ref.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'forbidden',
          details: { text: 'Only the consenting patient can update this consent' }
        }]
      });
    }

    // Update fields
    if (req.body.resourceTypes) consent.resourceTypes = req.body.resourceTypes;
    if (req.body.period) consent.period = req.body.period;
    if (req.body.status) consent.status = req.body.status;

    await consent.save();

    res.set('Content-Type', 'application/fhir+json');
    res.status(200).json(toFhirConsent(consent));
  } catch (err) {
    next(err);
  }
});

/**
 * POST /DocumentReference
 * Doctor uploads a document
 */
router.post('/DocumentReference', authenticateUser, isDoctor, fhirWriteLimiter, async (req, res, next) => {
  try {
    // Validate FHIR resource before processing
    const validation = validateResource('DocumentReference', req.body);
    if (!validation.valid) {
      return res.status(422).json(createOperationOutcome(validation.errors));
    }

    const { user_ref, type, display, status, docStatus, description } = req.body;

    if (!user_ref || !type || !display) {
      return next(new AppError('user_ref, type, and display are required', 400));
    }

    const doc = new DocumentReference({
      user_ref,
      doctor_ref: req.user._id,
      type: {
        code: type,
        display
      },
      status: status || 'current',
      docStatus: docStatus || 'final',
      date: new Date(),
      description
    });

    // Handle file upload if present
    if (req.files && req.files.document) {
      const { uploadDocumentToCloudinary } = require('../utils/ImageUploader');
      const result = await uploadDocumentToCloudinary(req.files.document, 'fhir-documents');
      doc.content = [{
        attachment: {
          contentType: req.files.document.mimetype,
          url: result.secure_url,
          title: display,
          size: req.files.document.size,
          hash: result.public_id
        }
      }];
    }

    await doc.save();

    // Log document creation
    await logFHIRAccess({
      userId: req.user._id,
      role: req.user.role,
      action: 'CREATE',
      resourceType: 'DocumentReference',
      resourceId: doc._id,
      patientId: user_ref,
      success: true
    });

    // Socket.io notification
    const io = req.app.get('io');
    if (io) {
      io.to(user_ref).emit('newClinicalData', {
        type: 'DocumentReference',
        resourceId: doc._id.toString(),
        display: `New document: ${display}`
      });
    }

    res.set('Content-Type', 'application/fhir+json');
    res.status(201).json(toFhirDocumentReference(doc));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /DocumentReference
 * List documents for a patient with optional filters
 * Requires: consentMiddleware for non-patient access
 */
router.get('/DocumentReference', authenticateUser, consentMiddleware, async (req, res, next) => {
  try {
    const patientId = normalizePatientQueryId(req.query.patient);
    const { type, date } = req.query;

    if (!patientId) {
      return next(new AppError('patient parameter is required', 400));
    }

    let query = { user_ref: patientId };
    if (type) query['type.code'] = type;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.date = { $gte: startDate, $lt: endDate };
    }

    const documents = await DocumentReference.find(query);
    const fhirDocs = documents.map(toFhirDocumentReference);

    res.set('Content-Type', 'application/fhir+json');
    res.status(200).json({
      resourceType: 'Bundle',
      type: 'searchset',
      total: fhirDocs.length,
      entry: fhirDocs.map(doc => ({
        resource: doc
      }))
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /DocumentReference/:id
 * Doctor or admin soft-deletes (marks as entered-in-error)
 */
router.delete('/DocumentReference/:id', authenticateUser, async (req, res, next) => {
  try {
    const doc = await DocumentReference.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'not-found',
          details: { text: 'DocumentReference not found' }
        }]
      });
    }

    // Only doctor who created it or admin can delete
    if (doc.doctor_ref.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'forbidden',
          details: { text: 'Cannot delete this document' }
        }]
      });
    }

    doc.status = 'entered-in-error';
    await doc.save();

    // Log deletion
    await logFHIRAccess({
      userId: req.user._id,
      role: req.user.role,
      action: 'DELETE',
      resourceType: 'DocumentReference',
      resourceId: doc._id,
      patientId: doc.user_ref,
      success: true
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

/**
 * GET /AuditEvent
 * Query audit log 
 * Users can only view their own audit events
 * Admins can view any audit events
 */
router.get('/AuditEvent', authenticateUser, async (req, res, next) => {
  try {
    const { patient, date, action } = req.query;
    let query = {};

    console.log(`[AUDIT] Fetching AuditEvents for user: ${req.user._id}, role: ${req.user.role}`);

    // Users can only view their own audit events
    // Admins can view any audit events
    if (req.user.role === 'user') {
      query.patientId = req.user._id;
      console.log(`[AUDIT] User role - filtering by patientId: ${req.user._id}`);
    } else if (!['admin', 'hospital_admin'].includes(req.user.role)) {
      console.log(`[AUDIT] Access denied - role: ${req.user.role}`);
      return res.status(403).json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'forbidden',
          details: { text: 'Insufficient permissions to query audit events' }
        }]
      });
    }

    // Apply additional filters if provided and user is admin
    if (['admin', 'hospital_admin'].includes(req.user.role)) {
      if (patient) {
        query.patientId = patient;
        console.log(`[AUDIT] Admin filtering by patient: ${patient}`);
      }
      if (action) query.action = action;
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.recorded = { $gte: startDate, $lt: endDate };
    }

    console.log(`[AUDIT] Query object:`, query);
    const events = await AuditEvent.find(query).sort({ recorded: -1 }).limit(1000);
    console.log(`[AUDIT] Found ${events.length} audit events`);
    
    const fhirEvents = events.map(toFhirAuditEvent);

    res.set('Content-Type', 'application/fhir+json');
    res.status(200).json({
      resourceType: 'Bundle',
      type: 'searchset',
      total: fhirEvents.length,
      entry: fhirEvents.map(event => ({
        resource: event
      }))
    });
  } catch (err) {
    console.error(`[AUDIT] Error fetching AuditEvents:`, err);
    next(err);
  }
});

// ============================================
// BIDIRECTIONAL SYNC ENDPOINTS
// ============================================

/**
 * POST /Patient/:id/$sync
 * Initiate manual sync from external FHIR server
 * Async operation - returns immediately with sync job status
 * @param id - Patient ID
 * @param direction - Sync direction: 'in' (pull), 'out' (push), 'both' (bidirectional)
 * @returns {OperationOutcome} with sync job reference
 */
router.post('/Patient/:id/\\$sync', authenticateUser, syncLimiter, async (req, res, next) => {
  try {
    const FhirSyncEngine = require('../utils/fhirSyncEngine');
    const SyncLog = require('../models/SyncLog');
    const patientId = req.params.id;
    const { direction = 'both' } = req.body;

    // Verify user is the patient or authorized
    const patient = await User.findById(patientId);
    if (!patient || (req.user.id !== patientId && req.user.role !== 'admin')) {
      throw new AppError('Unauthorized', 403);
    }

    // Get FHIR auth from session
    const fhirAuth = req.session?.fhirAuth;
    if (!fhirAuth?.accessToken) {
      return res.status(401).json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'unauthorized',
          diagnostics: 'No FHIR OAuth token. Connect to FHIR server first.',
        }]
      });
    }

    // Get external patient ID from launch context
    const externalPatientId = fhirAuth.launchContext?.patientId;
    if (!externalPatientId) {
      return res.status(400).json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'invalid',
          diagnostics: 'Cannot determine patient ID in external FHIR server',
        }]
      });
    }

    // Initiate sync asynchronously
    FhirSyncEngine.initiateSyncJob(
      patientId,
      externalPatientId,
      {
        ...fhirAuth,
        serverUrl: process.env.FHIR_SERVER_URL,
      },
      direction,
      req.user.id
    ).catch(error => {
      console.error('Async sync job failed:', error.message);
    });

    // Log sync initiation
    const syncJob = await SyncLog.create({
      patientId,
      externalPatientId,
      direction,
      resourceType: 'Patient',
      status: 'pending',
      triggeredBy: 'manual',
    });

    logFHIRAccess({
      userId: req.user.id,
      resourceType: 'Patient',
      resourceId: patientId,
      action: 'SYNC_INITIATED',
      status: 'success',
    });

    // Return 202 Accepted
    res.status(202).json({
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'information',
        code: 'processing',
        diagnostics: `Sync initiated with job ID: ${syncJob._id}`,
      }],
      meta: {
        syncJobId: syncJob._id.toString(),
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /Patient/:id/$sync-status
 * Check status of sync operation
 * @param id - Patient ID
 * @param jobId - Sync job ID (optional; defaults to latest)
 * @returns {OperationOutcome} with sync status and progress
 */
router.get('/Patient/:id/\\$sync-status', authenticateUser, async (req, res, next) => {
  try {
    const SyncLog = require('../models/SyncLog');
    const patientId = req.params.id;
    const { jobId } = req.query;

    // Verify user is the patient or authorized
    const patient = await User.findById(patientId);
    if (!patient || (req.user.id !== patientId && req.user.role !== 'admin')) {
      throw new AppError('Unauthorized', 403);
    }

    let syncJob;
    if (jobId) {
      syncJob = await SyncLog.findById(jobId);
    } else {
      syncJob = await SyncLog.findOne({ patientId }).sort({ createdAt: -1 });
    }

    if (!syncJob) {
      return res.status(404).json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'not-found',
          diagnostics: 'Sync job not found',
        }]
      });
    }

    logFHIRAccess({
      userId: req.user.id,
      resourceType: 'Patient',
      resourceId: patientId,
      action: 'SYNC_STATUS_CHECK',
      status: 'success',
    });

    res.status(200).json({
      resourceType: 'OperationOutcome',
      issue: [{
        severity: syncJob.status === 'failed' ? 'error' : 'information',
        code: syncJob.status,
        diagnostics: syncJob.errorMessage || `Sync ${syncJob.status}`,
      }],
      meta: {
        syncJobId: syncJob._id.toString(),
        status: syncJob.status,
        syncedAt: syncJob.syncedAt,
        direction: syncJob.direction,
        conflictResolution: syncJob.conflictResolution,
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /Patient/:id/$diff
 * Show what differs between local and external EHR
 * Useful for doctors to review before syncing
 * @param id - Patient ID
 * @returns {Bundle} with conflicts and differences
 */
router.get('/Patient/:id/\\$diff', authenticateUser, async (req, res, next) => {
  try {
    const FhirSyncEngine = require('../utils/fhirSyncEngine');
    const ExternalFhirClient = require('../utils/externalFhirClient');
    const patientId = req.params.id;

    // Verify user is authorized (doctor or patient)
    const patient = await User.findById(patientId);
    if (!patient || (req.user.id !== patientId && req.user.role !== 'doctor' && req.user.role !== 'admin')) {
      throw new AppError('Unauthorized', 403);
    }

    // Get FHIR auth from session
    const fhirAuth = req.session?.fhirAuth;
    if (!fhirAuth?.accessToken) {
      return res.status(401).json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'unauthorized',
          diagnostics: 'No FHIR OAuth token',
        }]
      });
    }

    const externalPatientId = fhirAuth.launchContext?.patientId;
    if (!externalPatientId) {
      return res.status(400).json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'invalid',
          diagnostics: 'Cannot determine external patient ID',
        }]
      });
    }

    const externalClient = new ExternalFhirClient(
      process.env.FHIR_SERVER_URL,
      fhirAuth.accessToken,
      fhirAuth.refreshToken
    );

    const conflicts = await FhirSyncEngine.findConflicts(patientId, externalPatientId, externalClient);

    logFHIRAccess({
      userId: req.user.id,
      resourceType: 'Patient',
      resourceId: patientId,
      action: 'SYNC_DIFF_CHECK',
      status: 'success',
    });

    res.status(200).json({
      resourceType: 'Bundle',
      type: 'searchset',
      total: conflicts.length,
      entry: conflicts.map(conflict => ({
        resource: {
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'warning',
            code: 'conflict',
            diagnostics: `${conflict.resourceType} differs between systems`,
            details: conflict.differences,
            meta: {
              conflictType: 'data_mismatch',
              localId: conflict.localId.toString(),
              externalId: conflict.externalId,
            }
          }]
        }
      }))
    });
  } catch (err) {
    next(err);
  }
});

/**
 * HIPAA Audit Report Generation
 * POST /fhir/R4/AuditEvent/$generate-report
 * Admin and hospital_admin only
 */
router.post('/AuditEvent/$generate-report', authenticateUser, async (req, res, next) => {
  try {
    // Check if user is admin or hospital_admin
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'hospital_admin')) {
      return res.status(403).json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'forbidden',
          diagnostics: 'Only admins can generate HIPAA reports'
        }]
      });
    }

    // Validate req.body exists and is an object
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'required',
          details: { text: 'Request body must be a valid JSON object' }
        }]
      });
    }

    const { startDate, endDate, patientId } = req.body;

    // Validate dates
    if (!startDate || !endDate) {
      return res.status(400).json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'required',
          diagnostics: 'startDate and endDate are required'
        }]
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'invalid',
          diagnostics: 'Invalid date format'
        }]
      });
    }

    // Generate report
    const report = await generateHIPAAReport({
      startDate: start,
      endDate: end,
      patientId: patientId || null
    });

    // Log the report generation
    await logFHIRAccess({
      userId: req.user.id,
      role: req.user.role,
      action: 'HIPAA_REPORT',
      resourceType: 'AuditEvent',
      ipAddress: req.ip,
      success: true,
      successMessage: `HIPAA report generated for ${reportduration} days`
    });

    // Email report to the admin
    try {
      const mailSender = require('../utils/mailSender');
      await sendEmail({
        to: req.user.email,
        subject: `HIPAA Compliance Audit Report - ${new Date().toISOString().split('T')[0]}`,
        attachments: [{
          filename: `hipaa-report-${new Date().toISOString().split('T')[0]}.json`,
          content: JSON.stringify(report, null, 2)
        }],
        html: `
          <h2>HIPAA Compliance Audit Report</h2>
          <p>Report Period: ${startDate} to ${endDate}</p>
          <p>Total Accesses: ${report.totalAccesses}</p>
          <p>Unique Accessors: ${report.uniqueAccessorCount}</p>
          <p>Unique Patients: ${report.uniquePatientsCount}</p>
          <p>Failed Access Attempts: ${report.failedAccesses.length}</p>
          <p>Accesses Outside Consent: ${report.accessesOutsideConsent.length}</p>
          <p>See attached JSON file for detailed report.</p>
        `
      });
    } catch (emailErr) {
      console.error('Failed to email report:', emailErr.message);
    }

    res.status(200).json({
      resourceType: 'Bundle',
      type: 'document',
      entry: [{
        resource: {
          resourceType: 'Document',
          type: 'hipaa-audit-report',
          data: report
        }
      }]
    });

  } catch (err) {
    next(err);
  }
});

/**
 * POST /ConsentRequest
 * Doctor requests consent from patient for specific resources
 * Body: { patientId, resourceTypes: [], message: "" }
 */
router.post('/ConsentRequest', authenticateUser, fhirWriteLimiter, async (req, res, next) => {
  console.log('🔔 ConsentRequest POST endpoint - REQUEST HIT!');
  try {
    // Validate req.body exists and is an object
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'required',
          details: { text: 'Request body must be a valid JSON object' }
        }]
      });
    }

    const { patientId, resourceTypes, message } = req.body;
    const doctorId = req.user._id;

    console.log('📋 ConsentRequest - Received request:', { patientId, resourceTypes, message, doctorId });

    // Validate required fields
    if (!patientId || !resourceTypes || !Array.isArray(resourceTypes) || resourceTypes.length === 0) {
      console.warn('⚠️ ConsentRequest validation failed: missing patientId or resourceTypes');
      return res.status(400).json({
        success: false,
        message: 'patientId and resourceTypes array are required'
      });
    }

    // Validate resource types
    const validResourceTypes = ['Condition', 'Observation', 'AllergyIntolerance', 'MedicationRequest', 'DiagnosticReport', 'Procedure', 'Immunization', 'DocumentReference'];
    const invalidTypes = resourceTypes.filter(rt => !validResourceTypes.includes(rt));
    if (invalidTypes.length > 0) {
      console.warn('⚠️ Invalid resource types:', invalidTypes);
      return res.status(400).json({
        success: false,
        message: `Invalid resource types: ${invalidTypes.join(', ')}`
      });
    }

    // Check if patient exists
    const patient = await User.findById(patientId);
    if (!patient) {
      console.warn('⚠️ Patient not found:', patientId);
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Check if doctor exists
    const doctor = await User.findById(doctorId);
    if (!doctor) {
      console.warn('⚠️ Doctor not found:', doctorId);
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Create consent request in database
    console.log('💾 Creating ConsentRequest...');
    const newConsentRequest = await ConsentRequest.create({
      doctor_ref: doctorId,
      patient_ref: patientId,
      resourceTypes: resourceTypes,
      message: message || '',
      status: 'pending',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });

    console.log('✅ ConsentRequest created:', newConsentRequest._id);

    // Send email notification to patient (non-blocking)
    setImmediate(async () => {
      try {
        const mailSender = require('../utils/mailSender');
        const emailTemplate = `
          <h2>Consent Request from ${doctor.fullName || 'Your Doctor'}</h2>
          <p>Dear ${patient.fullName},</p>
          <p>Dr. ${doctor.fullName || 'A healthcare provider'} is requesting access to your medical records for the following resources:</p>
          <ul>
            ${resourceTypes.map(rt => `<li>${rt}</li>`).join('')}
          </ul>
          ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
          <p>Please log in to your Clinicall account to approve or deny this request.</p>
          <p>This request will expire in 30 days.</p>
        `;

        console.log('📧 Sending consent request email to:', patient.email);
        await mailSender(patient.email, 'Consent Request from Your Doctor', emailTemplate);
        console.log('✅ Email sent successfully');
      } catch (emailErr) {
        console.error('❌ Failed to send consent request email:', emailErr.message);
        // Don't fail the entire request if email fails
      }
    });

    // Return success response immediately
    res.status(201).json({
      success: true,
      message: 'Consent request sent successfully',
      data: {
        requestId: newConsentRequest._id,
        patientId,
        resourceTypes,
        status: 'pending',
        expiresAt: newConsentRequest.expiresAt
      }
    });
  } catch (err) {
    console.error('❌ ConsentRequest ERROR DETAILS:');
    console.error('   Error Message:', err.message);
    console.error('   Error Type:', err.constructor.name);
    console.error('   Stack Trace:', err.stack);
    console.error('   Request Body:', JSON.stringify(req.body, null, 2));
    console.error('   User ID:', req.user ? req.user._id : 'No user');
    console.error('   Full Error Object:', err);
    next(err);
  }
});

/**
 * GET /ConsentRequest?patient={id}
 * Get pending consent requests for a patient
 */
router.get('/ConsentRequest', authenticateUser, fhirReadLimiter, async (req, res, next) => {
  try {
    const patientId = req.query.patient;

    if (!patientId) {
      return res.status(400).json(
        createOperationOutcome(['patient parameter is required'])
      );
    }

    // Only patients can view their own pending consent requests
    if (req.user._id.toString() !== patientId) {
      return res.status(403).json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'forbidden',
          details: { text: 'Cannot access other patient\'s consent requests' }
        }]
      });
    }

    const requests = await ConsentRequest.find({
      patient_ref: patientId,
      status: 'pending'
    }).populate('doctor_ref', 'name');

    res.set('Content-Type', 'application/fhir+json');
    res.status(200).json({
      resourceType: 'Bundle',
      type: 'searchset',
      total: requests.length,
      entry: requests.map(req => ({
        resource: {
          resourceType: 'ConsentRequest',
          id: req._id.toString(),
          doctor: req.doctor_ref.name,
          doctorId: req.doctor_ref._id.toString(),
          resourceTypes: req.resourceTypes,
          message: req.message,
          status: req.status,
          createdAt: req.createdAt,
          expiresAt: req.expiresAt
        }
      }))
    });
  } catch (err) {
    console.error('❌ GET ConsentRequest ERROR DETAILS:');
    console.error('   Error Message:', err.message);
    console.error('   Error Type:', err.constructor.name);
    console.error('   Stack Trace:', err.stack);
    console.error('   Query Parameters:', JSON.stringify(req.query, null, 2));
    console.error('   User ID:', req.user ? req.user._id : 'No user');
    console.error('   Full Error Object:', err);
    next(err);
  }
});

/**
 * POST /ConsentRequest/:requestId/respond
 * Patient responds to a consent request (approve/reject)
 */
router.post('/ConsentRequest/:requestId/respond', authenticateUser, fhirWriteLimiter, async (req, res, next) => {
  try {
    const { action } = req.body; // 'approve' or 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json(
        createOperationOutcome(['action must be "approve" or "reject"'])
      );
    }

    const consentRequest = await ConsentRequest.findById(req.params.requestId);

    if (!consentRequest) {
      return res.status(404).json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'not-found',
          details: { text: 'ConsentRequest not found' }
        }]
      });
    }

    // Verify the patient is responding to their own request
    if (consentRequest.patient_ref.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'forbidden',
          details: { text: 'Only the consenting patient can respond to this request' }
        }]
      });
    }

    if (action === 'approve') {
      // Create a Consent document using existing consent creation logic
      const consent = new Consent({
        patient_ref: req.user._id,
        grantedTo_ref: consentRequest.doctor_ref,
        grantedToType: 'doctor',
        resourceTypes: consentRequest.resourceTypes,
        purpose: 'treatment',
        period: {
          start: new Date(),
          end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        },
        status: 'active'
      });

      await consent.save();

      // Update ConsentRequest status
      consentRequest.status = 'approved';
      consentRequest.respondedAt = new Date();
      await consentRequest.save();

      // Log consent grant
      await logFHIRAccess({
        userId: req.user._id,
        role: req.user.role,
        action: 'CONSENT_GRANT',
        resourceType: 'Consent',
        resourceId: consent._id,
        consentId: consent._id,
        success: true
      });

      // Emit Socket.io to doctor's room
      const io = req.app.get('io');
      if (io) {
        io.to(consentRequest.doctor_ref.toString()).emit('consentGranted', {
          patientId: req.user._id,
          patientName: req.user.name,
          resourceTypes: consentRequest.resourceTypes,
          consentId: consent._id
        });
      }

      // Send approval email to doctor (non-blocking)
      try {
        const doctor = await User.findById(consentRequest.doctor_ref).select('email name');
        const patient = await User.findById(req.user._id).select('name');
        await mailSender(
          doctor.email,
          `${patient.name} has granted you access to their medical records`,
          generateConsentApprovedEmail({
            doctorName: doctor.name,
            patientName: patient.name,
            resourceTypes: consentRequest.resourceTypes,
            expiryDate: consent.period.end,
            patientId: req.user._id,
            appUrl: process.env.REACT_APP_BASE_URL
          })
        );
      } catch (emailErr) {
        console.error('Consent approved email failed (non-fatal):', emailErr.message);
      }

      res.set('Content-Type', 'application/fhir+json');
      res.status(200).json({
        resourceType: 'ConsentRequest',
        id: consentRequest._id.toString(),
        status: consentRequest.status,
        respondedAt: consentRequest.respondedAt,
        consentId: consent._id.toString()
      });

    } else if (action === 'reject') {
      // Reject the consent request
      consentRequest.status = 'rejected';
      consentRequest.respondedAt = new Date();
      await consentRequest.save();

      // Log consent rejection
      await logFHIRAccess({
        userId: req.user._id,
        role: req.user.role,
        action: 'CONSENT_REVOKE',
        resourceType: 'Consent',
        resourceId: consentRequest._id,
        success: true
      });

      // Emit Socket.io to doctor's room
      const io = req.app.get('io');
      if (io) {
        io.to(consentRequest.doctor_ref.toString()).emit('consentRejected', {
          patientId: req.user._id,
          message: 'Patient declined the consent request'
        });
      }

      res.set('Content-Type', 'application/fhir+json');
      res.status(200).json({
        resourceType: 'ConsentRequest',
        id: consentRequest._id.toString(),
        status: consentRequest.status,
        respondedAt: consentRequest.respondedAt
      });
    }

  } catch (err) {
    console.error('❌ POST /ConsentRequest/respond ERROR DETAILS:');
    console.error('   Error Message:', err.message);
    console.error('   Error Type:', err.constructor.name);
    console.error('   Stack Trace:', err.stack);
    console.error('   Request Body:', JSON.stringify(req.body, null, 2));
    console.error('   Request Params:', JSON.stringify(req.params, null, 2));
    console.error('   User ID:', req.user ? req.user._id : 'No user');
    console.error('   Full Error Object:', err);
    next(err);
  }
});

module.exports = router;
