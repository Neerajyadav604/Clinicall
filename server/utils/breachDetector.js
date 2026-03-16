/**
 * Breach Detection Utility
 * Scans for suspicious patterns indicating HIPAA breaches
 * Scheduled to run every 6 hours via node-cron
 */

const AuditEvent = require('../models/AuditEvent');
const Breach = require('../models/Breach');
const ExportJob = require('../models/ExportJob');
const User = require('../models/User');
const Consent = require('../models/Consent');
const logger = require('../config/logger');
const { sendEmail } = require('./mailSender');

/**
 * Scan for breach patterns
 * Returns array of detected breaches
 */
async function scanForBreaches() {
  try {
    logger.info('🔍 Starting breach detection scan', { action: 'BREACH_SCAN_START' });
    const detectedBreaches = [];
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    // Pattern 1: Same IP accessing 20+ different patient records in under 1 hour
    const ipAccessCounts = await AuditEvent.aggregate([
      {
        $match: {
          'entity.details[0].reference': { $regex: 'Patient/' },
          timestamp: { $gte: oneHourAgo },
          outcome: 'success'
        }
      },
      {
        $group: {
          _id: '$ipAddress',
          patientIds: { $addToSet: '$entity.details[0].reference' },
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          count: { $gte: 20 }
        }
      }
    ]);

    for (const access of ipAccessCounts) {
      if (access.patientIds && access.patientIds.length >= 20) {
        detectedBreaches.push({
          type: 'mass_export',
          severity: 'critical',
          ipAddress: access._id,
          affectedPatients: access.patientIds.map(ref => ref.split('/')[1]),
          description: `Mass patient access detected: ${access.count} accesses from IP ${access._id} in 1 hour`
        });
        logger.warn('🚨 Critical: Mass access pattern detected', {
          ipAddress: access._id,
          accessCount: access.count,
          patientCount: access.patientIds.length
        });
      }
    }

    // Pattern 2: Doctor accessing patient records with no active consent
    const doctorAccesses = await AuditEvent.find({
      'agent.role': 'doctor',
      'entity.details[0].reference': { $regex: 'Patient/' },
      timestamp: { $gte: oneHourAgo },
      outcome: 'success'
    }).select('agent userId entity timestamp');

    for (const audit of doctorAccesses) {
      const patientId = audit.entity?.details?.[0]?.reference?.split('/')[1];
      if (patientId) {
        const hasConsent = await Consent.findOne({
          patient_ref: patientId,
          performer_ref: audit.agent?.who,
          'period.start': { $lte: new Date() },
          'period.end': { $gte: new Date() },
          status: 'active'
        });

        if (!hasConsent) {
          detectedBreaches.push({
            type: 'no_consent_access',
            severity: 'high',
            ipAddress: audit.iPAddress || 'unknown',
            userId_ref: audit.agent?.who,
            affectedPatients: [patientId],
            description: `Doctor accessed patient records without active consent: ${patientId}`
          });
          logger.warn('⚠️  High: Unconsented access detected', {
            doctorId: audit.agent?.who,
            patientId: patientId
          });
        }
      }
    }

    // Pattern 3: Repeated failed access attempts (more than 5 in 10 minutes)
    const failedAttempts = await AuditEvent.aggregate([
      {
        $match: {
          timestamp: { $gte: tenMinutesAgo },
          outcome: 'failure'
        }
      },
      {
        $group: {
          _id: {
            ipAddress: '$ipAddress',
            userId: '$agent.who'
          },
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          count: { $gte: 5 }
        }
      }
    ]);

    for (const attempt of failedAttempts) {
      detectedBreaches.push({
        type: 'repeated_failure',
        severity: 'medium',
        ipAddress: attempt._id.ipAddress,
        userId_ref: attempt._id.userId,
        affectedPatients: [],
        description: `Repeated failed access attempts: ${attempt.count} failures in 10 minutes from ${attempt._id.ipAddress}`
      });
      logger.warn('⚠️  Medium: Repeated failures detected', {
        ipAddress: attempt._id.ipAddress,
        failureCount: attempt.count
      });
    }

    // Pattern 4: Export jobs requested for patients without relationship
    const exports = await ExportJob.find({
      createdAt: { $gte: oneHourAgo }
    }).populate('requester_ref').populate('patient_ref');

    for (const exportJob of exports) {
      if (exportJob.requester_ref && exportJob.patient_ref) {
        const hasRelationship = await checkUserRelationship(
          exportJob.requester_ref._id,
          exportJob.patient_ref._id
        );

        if (!hasRelationship) {
          detectedBreaches.push({
            type: 'unauthorized_access',
            severity: 'high',
            userId_ref: exportJob.requester_ref._id,
            affectedPatients: [exportJob.patient_ref._id],
            description: `Unrelated user requested export: User ${exportJob.requester_ref._id} exported patient ${exportJob.patient_ref._id}`
          });
          logger.warn('⚠️  High: Unrelated access attempted', {
            userId: exportJob.requester_ref._id,
            patientId: exportJob.patient_ref._id
          });
        }
      }
    }

    // Report all detected breaches
    for (const breachDetails of detectedBreaches) {
      await reportBreach(breachDetails);
    }

    logger.info('✅ Breach scan complete', {
      breachesDetected: detectedBreaches.length
    });

    return detectedBreaches;
  } catch (err) {
    logger.error('❌ Breach detection failed', {
      error: err.message,
      stack: err.stack,
      action: 'BREACH_SCAN_ERROR'
    });
    throw err;
  }
}

/**
 * Report a detected breach
 */
async function reportBreach(breachDetails) {
  try {
    // Create breach record
    const breach = new Breach({
      ...breachDetails,
      status: 'detected'
    });
    await breach.save();

    logger.warn('📋 Breach recorded in database', {
      breachId: breach._id,
      type: breach.type,
      severity: breach.severity
    });

    // Email admin
    try {
      const admins = await User.find({ role: 'admin' }).select('email');
      for (const admin of admins) {
        await sendEmail({
          to: admin.email,
          subject: `🚨 HIPAA Breach Detected - ${breachDetails.severity.toUpperCase()}`,
          html: `
            <h2>HIPAA Breach Alert</h2>
            <p><strong>Type:</strong> ${breachDetails.type}</p>
            <p><strong>Severity:</strong> ${breachDetails.severity}</p>
            <p><strong>Detected:</strong> ${new Date().toISOString()}</p>
            <p><strong>Description:</strong> ${breachDetails.description}</p>
            <p><strong>IP Address:</strong> ${breachDetails.ipAddress || 'N/A'}</p>
            <p><strong>Affected Patients:</strong> ${breachDetails.affectedPatients?.length || 0}</p>
            <p>Please investigate immediately at: /admin/breaches</p>
          `
        });
      }
      logger.info('📧 Breach notification emailed to admins', { type: breachDetails.type });
    } catch (emailErr) {
      logger.error('⚠️  Failed to email breach alert', { error: emailErr.message });
    }

    return breach;
  } catch (err) {
    logger.error('❌ Failed to report breach', {
      error: err.message,
      breachType: breachDetails.type
    });
    throw err;
  }
}

/**
 * Check if user has any relationship with patient
 * (doctor-patient, hospital-patient, emergency contact, etc)
 */
async function checkUserRelationship(userId, patientId) {
  try {
    const Doctor = require('../models/Doctor');
    const Appointment = require('../models/Appointment');

    // Check if user is a doctor with appointment to this patient
    const appointment = await Appointment.findOne({
      $or: [
        { userId: patientId, doctorId: userId },
        { userId: userId, doctorId: patientId }
      ]
    });

    if (appointment) return true;

    // Check if user is a hospital admin of patient's hospital
    const userObj = await User.findById(userId).select('role');
    if (userObj?.role === 'hospital_admin') {
      const Hospital = require('../models/Hospital');
      const hospital = await Hospital.findOne({
        admin_ref: userId,
        doctors: { $in: [patientId] }
      });
      if (hospital) return true;
    }

    return false;
  } catch (err) {
    logger.error('⚠️  Error checking user relationship', { error: err.message });
    return false;
  }
}

module.exports = {
  scanForBreaches,
  reportBreach,
  checkUserRelationship
};
