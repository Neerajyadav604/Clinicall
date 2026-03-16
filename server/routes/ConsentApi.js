/**
 * Simplified Consent API
 * Works independently without loading the large FHIR module
 */
const express = require('express');
const router = express.Router();
const { authenticateUser, isDoctor } = require('../middleware/authMiddleware');
const { fhirReadLimiter, fhirWriteLimiter } = require('../middleware/rateLimiter');

// Models
const ConsentRequest = require('../models/ConsentRequest');
const User = require('../models/User');
const Consent = require('../models/Consent');

/**
 * POST /consent/request
 * Doctor requests consent from patient
 */
router.post('/request', authenticateUser, isDoctor, fhirWriteLimiter, async (req, res, next) => {
  // Use stdout for immediate visibility
  process.stdout.write('\n\n🔔 [CONSENT API] ===== REQUEST HIT! =====\n');
  process.stdout.write('⏰ [CONSENT API] Timestamp: ' + new Date().toISOString() + '\n');
  process.stdout.write('📍 [CONSENT API] Path: POST /api/v1/consent/request\n');
  
  try {
    const { patientId, resourceTypes, message, appointmentId } = req.body;
    const doctorId = req.user._id;

    process.stdout.write('📋 [CONSENT API] Request Body:\n');
    process.stdout.write('   patientId: ' + patientId + '\n');
    process.stdout.write('   doctorId: ' + doctorId + '\n');
    process.stdout.write('   appointmentId: ' + (appointmentId || 'none') + '\n');
    process.stdout.write('   resourceTypes: ' + JSON.stringify(resourceTypes) + '\n');
    process.stdout.write('   message: ' + (message || 'none') + '\n');

    // Validate required fields
    if (!patientId || !resourceTypes || !Array.isArray(resourceTypes) || resourceTypes.length === 0) {
      process.stdout.write('❌ [CONSENT API] Validation FAILED - missing patientId or resourceTypes\n');
      console.warn('⚠️ Validation failed: missing patientId or resourceTypes');
      return res.status(400).json({
        success: false,
        message: 'patientId and resourceTypes array are required'
      });
    }

    // Validate resource types
    const validResourceTypes = [
      'Condition', 'Observation', 'AllergyIntolerance', 'MedicationRequest',
      'DiagnosticReport', 'Procedure', 'Immunization', 'DocumentReference'
    ];
    const invalidTypes = resourceTypes.filter(rt => !validResourceTypes.includes(rt));
    if (invalidTypes.length > 0) {
      process.stdout.write('❌ [CONSENT API] Invalid resource types: ' + JSON.stringify(invalidTypes) + '\n');
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

    // Create consent request
    console.log('💾 Creating ConsentRequest...');
    const consentPayload = {
      doctor_ref: doctorId,
      patient_ref: patientId,
      appointment_ref: appointmentId || null,
      resourceTypes: resourceTypes,
      message: message || '',
      status: 'pending',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };

    console.log('📋 Consent Payload:');
    console.log('   doctor_ref:', doctorId, 'Type:', typeof doctorId);
    console.log('   patient_ref:', patientId, 'Type:', typeof patientId);
    console.log('   status:', 'pending');

    let newConsentRequest;
    try {
      newConsentRequest = await ConsentRequest.create(consentPayload);
    } catch (createErr) {
      if (createErr && createErr.message === 'next is not a function') {
        // Fallback: bypass model middleware if a plugin/hook is misconfigured.
        const insertResult = await ConsentRequest.collection.insertOne({
          ...consentPayload,
          createdAt: new Date()
        });
        newConsentRequest = { ...consentPayload, _id: insertResult.insertedId };
      } else {
        throw createErr;
      }
    }

    console.log('✅ ConsentRequest created successfully:');
    console.log('   ID:', newConsentRequest._id);
    console.log('   Patient Ref:', newConsentRequest.patient_ref);
    console.log('   Doctor Ref:', newConsentRequest.doctor_ref);
    console.log('   Status:', newConsentRequest.status);

    // Create a notification for the patient and send email (non-blocking)
    setImmediate(async () => {
      try {
        // 1. Create notification in database
        const { sendNotification } = require('../utils/sendNotification');
        await sendNotification({
          recipient: patientId,
          type: 'CONSENT_REQUEST',
          title: `Consent Request from Dr. ${doctor.fullName || 'Doctor'}`,
          message: `Dr. ${doctor.fullName} is requesting access to your ${resourceTypes.join(', ')} records.`
        });
        console.log('✅ Notification created for patient');

        // 2. Send email notification
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
        console.error('❌ Failed to send email or notification:', emailErr.message);
      }
    });

    // Return success response
    process.stdout.write('✅ [CONSENT API] ConsentRequest created successfully\n');
    process.stdout.write('   ID: ' + newConsentRequest._id + '\n');
    process.stdout.write('   Status: pending\n');
    process.stdout.write('   Expires: ' + newConsentRequest.expiresAt + '\n');
    process.stdout.write('🔔 [CONSENT API] Sending 201 response...\n\n');
    
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
    process.stdout.write('❌ [CONSENT API] ERROR in POST /consent/request\n');
    process.stdout.write('   Message: ' + err.message + '\n');
    process.stdout.write('   Stack: ' + err.stack + '\n\n');
    console.error('❌ ConsentRequest ERROR:', err.message);
    console.error('   Stack:', err.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to create consent request',
      error: err.message
    });
  }
});

/**
 * GET /consent/requests?patient={id}
 * Get pending consent requests for a patient
 */
router.get('/requests', authenticateUser, fhirReadLimiter, async (req, res) => {
  try {
    const { patient } = req.query;
    const userId = req.user._id;

    if (!patient) {
      return res.status(400).json({
        success: false,
        message: 'patient parameter is required'
      });
    }

    console.log('🔍 [Fetch Consent Requests] Query params:');
    console.log('   Patient ID from query:', patient, 'Type:', typeof patient);
    console.log('   Authenticated user ID:', userId.toString());

    const requests = await ConsentRequest.find({
      patient_ref: patient,
      status: 'pending'
    }).populate('doctor_ref', 'fullName email');

    console.log('📊 [Fetch Consent Requests] Found:', requests.length, 'pending requests');
    if (requests.length > 0) {
      console.log('   First request:', {
        id: requests[0]._id,
        patient_ref: requests[0].patient_ref,
        doctor_ref: requests[0].doctor_ref,
        status: requests[0].status
      });
    } else {
      // Debug: Check if there are any requests at all for this patient (any status)
      const allRequests = await ConsentRequest.find({
        patient_ref: patient
      });
      console.log('⚠️  No pending requests found, but found', allRequests.length, 'total requests for this patient');
      if (allRequests.length > 0) {
        console.log('   Statuses:', allRequests.map(r => r.status).join(', '));
      }
    }

    res.status(200).json({
      success: true,
      data: requests
    });
  } catch (err) {
    console.error('❌ Error fetching consent requests:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch consent requests',
      error: err.message
    });
  }
});

/**
 * POST /consent/approve/{requestId}
 * Patient approves a consent request
 */
router.post('/approve/:requestId', authenticateUser, fhirWriteLimiter, async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const consentRequest = await ConsentRequest.findById(requestId);
    if (!consentRequest) {
      return res.status(404).json({
        success: false,
        message: 'Consent request not found'
      });
    }

    // Verify patient is the one approving
    if (consentRequest.patient_ref.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only approve your own consent requests'
      });
    }

    // Create consent record (match Consent schema)
    const consentPayload = {
      patient_ref: consentRequest.patient_ref,
      grantedTo_ref: consentRequest.doctor_ref,
      grantedToType: 'doctor',
      appointment_ref: consentRequest.appointment_ref || null,
      resourceTypes: consentRequest.resourceTypes,
      purpose: 'treatment',
      status: 'active',
      period: {
        start: new Date(),
        end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
      }
    };
    console.log('🧾 Consent payload:', consentPayload);
    const consent = await Consent.create(consentPayload);

    // Update consent request status
    consentRequest.status = 'approved';
    await consentRequest.save();

    console.log('✅ Consent approved:', consent._id);

    // Create notification for doctor (bell icon)
    try {
      const { sendNotification } = require('../utils/sendNotification');
      await sendNotification({
        recipient: consentRequest.doctor_ref,
        type: 'CONSENT_GRANTED',
        title: 'Consent Approved',
        message: `${req.user?.fullName || req.user?.name || 'Patient'} approved your consent request.`
      });
    } catch (notifyErr) {
      console.error('❌ Failed to create consent approval notification:', notifyErr.message);
    }

    // Emit Socket.io event to doctor's personal room
    const io = req.app.get('io');
    if (io) {
      io.to(consentRequest.doctor_ref.toString()).emit('consentGranted', {
        patientId: consentRequest.patient_ref,
        patientName: req.user?.fullName || req.user?.name || 'Patient',
        resourceTypes: consentRequest.resourceTypes,
        consentId: consent._id
      });
    }

    res.status(200).json({
      success: true,
      message: 'Consent approved successfully',
      data: consent
    });
  } catch (err) {
    console.error('❌ Error approving consent:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to approve consent',
      error: err.message
    });
  }
});

/**
 * POST /consent/reject/{requestId}
 * Patient rejects a consent request
 */
router.post('/reject/:requestId', authenticateUser, fhirWriteLimiter, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;
    const userId = req.user._id;

    const consentRequest = await ConsentRequest.findById(requestId);
    if (!consentRequest) {
      return res.status(404).json({
        success: false,
        message: 'Consent request not found'
      });
    }

    // Verify patient is the one rejecting
    if (consentRequest.patient_ref.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only reject your own consent requests'
      });
    }

    // Update consent request status
    consentRequest.status = 'rejected';
    consentRequest.rejectionReason = reason || '';
    await consentRequest.save();

    console.log('✅ Consent rejected:', requestId);

    res.status(200).json({
      success: true,
      message: 'Consent request rejected'
    });
  } catch (err) {
    console.error('❌ Error rejecting consent:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to reject consent',
      error: err.message
    });
  }
});

/**
 * GET /consent/active?doctor={id}&appointment={id}
 * Get active consents for a doctor, optionally filtered by appointment
 */
router.get('/active', authenticateUser, fhirReadLimiter, async (req, res) => {
  try {
    const doctorId = req.user._id;
    const { appointment } = req.query;

    // Build query filter
    const query = {
      grantedTo_ref: doctorId,
      status: 'active',
      $or: [
        { 'period.end': { $gt: new Date() } },
        { 'period.end': { $exists: false } },
        { 'period.end': null }
      ]
    };

    // If appointmentId is provided, filter by it
    if (appointment) {
      query.appointment_ref = appointment;
    }

    const consents = await Consent.find(query).populate('patient_ref', 'fullName email');

    res.status(200).json({
      success: true,
      data: consents
    });
  } catch (err) {
    console.error('❌ Error fetching active consents:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active consents',
      error: err.message
    });
  }
});

/**
 * DEBUG: GET /consent/debug/all
 * Fetch ALL consent requests in database (for debugging only)
 */
router.get('/debug/all', authenticateUser, async (req, res) => {
  try {
    const allRequests = await ConsentRequest.find({})
      .populate('doctor_ref', 'fullName email')
      .populate('patient_ref', 'fullName email');

    console.log('📊 [DEBUG] Total ConsentRequests in DB:', allRequests.length);
    
    res.status(200).json({
      success: true,
      totalCount: allRequests.length,
      data: allRequests.map(req => ({
        id: req._id,
        doctorId: req.doctor_ref?._id,
        doctorName: req.doctor_ref?.fullName,
        patientId: req.patient_ref?._id,
        patientName: req.patient_ref?.fullName,
        resourceTypes: req.resourceTypes,
        status: req.status,
        createdAt: req.createdAt,
        expiresAt: req.expiresAt
      }))
    });
  } catch (err) {
    console.error('❌ Error fetching all consent requests:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch consent requests',
      error: err.message
    });
  }
});

/**
 * DEBUG: GET /consent/debug/patient/:patientId
 * Fetch consent requests for a specific patient (debugging)
 */
router.get('/debug/patient/:patientId', authenticateUser, async (req, res) => {
  try {
    const { patientId } = req.params;

    console.log('🔍 [DEBUG] Searching for patient:', patientId, 'Type:', typeof patientId);

    // Try multiple query approaches
    const requests1 = await ConsentRequest.find({ patient_ref: patientId })
      .populate('doctor_ref', 'fullName email');
    
    const requests2 = await ConsentRequest.find({ patient_ref: { $eq: patientId } })
      .populate('doctor_ref', 'fullName email');
    
    // Convert to ObjectId and try
    let requests3 = [];
    try {
      const mongoose = require('mongoose');
      const oid = new mongoose.Types.ObjectId(patientId);
      requests3 = await ConsentRequest.find({ patient_ref: oid })
        .populate('doctor_ref', 'fullName email');
    } catch (e) {
      console.log('Could not convert to ObjectId:', e.message);
    }

    console.log('📊 [DEBUG] Query results:');
    console.log('   Direct query:', requests1.length, 'results');
    console.log('   $eq query:', requests2.length, 'results');
    console.log('   ObjectId query:', requests3.length, 'results');

    const allResults = [...requests1];
    const allResults1 = allResults.filter(r => r.patient_ref._id.toString() === patientId || r.patient_ref._id.toString() === patientId.toString());
    
    res.status(200).json({
      success: true,
      patientId,
      found: allResults.length,
      data: allResults.map(req => ({
        id: req._id,
        doctorId: req.doctor_ref?._id,
        doctorName: req.doctor_ref?.fullName,
        patientId: req.patient_ref?._id,
        patientIdString: req.patient_ref?._id?.toString(),
        resourceTypes: req.resourceTypes,
        status: req.status,
        createdAt: req.createdAt
      }))
    });
  } catch (err) {
    console.error('❌ Error in debug endpoint:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch consent requests',
      error: err.message
    });
  }
});

module.exports = router;
