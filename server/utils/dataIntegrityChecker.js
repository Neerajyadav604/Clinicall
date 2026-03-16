/**
 * Data Integrity Checker
 * Runs daily at 2am to verify data consistency
 * Checks for orphaned references, expired consents, expired export jobs
 */

const fs = require('fs');
const path = require('path');
const Condition = require('../models/Condition');
const Observation = require('../models/Observation');
const MedicationRequest = require('../models/MedicationRequest');
const Consent = require('../models/Consent');
const ExportJob = require('../models/ExportJob');
const User = require('../models/User');
const logger = require('../config/logger');
const cloudinary = require('cloudinary').v2;

const logsDir = path.join(__dirname, '../logs');

/**
 * Check for orphaned references
 * Finds records whose user_ref points to non-existent User
 */
async function checkOrphanedReferences() {
  try {
    logger.info('🔍 Checking for orphaned references...', { action: 'INTEGRITY_CHECK_ORPHANED_START' });
    
    const orphanedIssues = [];
    const models = [
      { model: Condition, name: 'Condition' },
      { model: Observation, name: 'Observation' },
      { model: MedicationRequest, name: 'MedicationRequest' }
    ];

    for (const { model, name } of models) {
      try {
        const records = await model.find({}).select('_id user_ref userId');
        
        for (const record of records) {
          const userId = record.user_ref || record.userId;
          if (userId) {
            const user = await User.findById(userId);
            if (!user) {
              orphanedIssues.push({
                model: name,
                recordId: record._id,
                userId: userId,
                timestamp: new Date()
              });
              logger.warn('⚠️  Orphaned reference found', {
                model: name,
                recordId: record._id,
                userId: userId
              });
            }
          }
        }
      } catch (err) {
        logger.error(`Error checking ${name} for orphaned references`, { error: err.message });
      }
    }

    // Write to log file
    if (orphanedIssues.length > 0) {
      const logFile = path.join(logsDir, 'integrity.log');
      const logEntry = `\n[${new Date().toISOString()}] Orphaned References Found: ${orphanedIssues.length}\n${JSON.stringify(orphanedIssues, null, 2)}`;
      fs.appendFileSync(logFile, logEntry);
      logger.warn('📝 Orphaned references logged', { count: orphanedIssues.length });
    } else {
      logger.info('✅ No orphaned references found');
    }

    return orphanedIssues;
  } catch (err) {
    logger.error('❌ Orphaned reference check failed', {
      error: err.message,
      action: 'INTEGRITY_CHECK_ORPHANED_ERROR'
    });
  }
}

/**
 * Check for expired consents
 * Finds Consent records past period.end that still have status: active
 * Sets them to inactive and logs the change
 */
async function checkExpiredConsents() {
  try {
    logger.info('🔍 Checking for expired consents...', { action: 'INTEGRITY_CHECK_CONSENT_START' });
    
    const now = new Date();
    const expiredConsents = await Consent.find({
      'period.end': { $lt: now },
      status: 'active'
    });

    const updated = [];
    for (const consent of expiredConsents) {
      const oldStatus = consent.status;
      consent.status = 'inactive';
      await consent.save();
      
      updated.push({
        consentId: consent._id,
        patientId: consent.patient_ref,
        oldStatus: oldStatus,
        newStatus: 'inactive',
        expiredAt: consent.period.end,
        timestamp: new Date()
      });

      logger.info('✏️  Expired consent auto-deactivated', {
        consentId: consent._id,
        expiredAt: consent.period.end
      });
    }

    // Write to log file
    if (updated.length > 0) {
      const logFile = path.join(logsDir, 'integrity.log');
      const logEntry = `\n[${new Date().toISOString()}] Expired Consents Deactivated: ${updated.length}\n${JSON.stringify(updated, null, 2)}`;
      fs.appendFileSync(logFile, logEntry);
      logger.warn('📝 Deactivated consents logged', { count: updated.length });
    } else {
      logger.info('✅ No expired consents found');
    }

    return updated;
  } catch (err) {
    logger.error('❌ Expired consent check failed', {
      error: err.message,
      action: 'INTEGRITY_CHECK_CONSENT_ERROR'
    });
  }
}

/**
 * Check for expired export jobs
 * Finds ExportJob records past expiresAt that still have Cloudinary URLs
 * Deletes the Cloudinary files and clears the URLs
 */
async function checkExpiredExportJobs() {
  try {
    logger.info('🔍 Checking for expired export jobs...', { action: 'INTEGRITY_CHECK_EXPORT_START' });
    
    const now = new Date();
    const expiredJobs = await ExportJob.find({
      expiresAt: { $lt: now },
      cloudinaryUrl: { $exists: true, $ne: null }
    });

    const cleaned = [];
    for (const job of expiredJobs) {
      try {
        // Extract public ID from Cloudinary URL
        // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{timestamp}/{public_id}
        if (job.cloudinaryUrl) {
          const urlParts = job.cloudinaryUrl.split('/');
          const publicId = urlParts[urlParts.length - 1]?.split('.')[0];
          
          if (publicId) {
            // Delete from Cloudinary
            try {
              await cloudinary.uploader.destroy(publicId);
              logger.info('🗑️  Expired export file deleted from Cloudinary', { publicId });
            } catch (cloudErr) {
              logger.warn('⚠️  Could not delete file from Cloudinary', { 
                publicId, 
                error: cloudErr.message 
              });
            }
          }

          // Clear URL from database
          job.cloudinaryUrl = null;
          job.status = 'expired';
          await job.save();

          cleaned.push({
            jobId: job._id,
            userId: job.requester_ref,
            expiredAt: job.expiresAt,
            timestamp: new Date()
          });

          logger.info('✏️  Expired export job cleaned up', {
            jobId: job._id
          });
        }
      } catch (err) {
        logger.error('Error cleaning expired export job', {
          jobId: job._id,
          error: err.message
        });
      }
    }

    // Write to log file
    if (cleaned.length > 0) {
      const logFile = path.join(logsDir, 'integrity.log');
      const logEntry = `\n[${new Date().toISOString()}] Expired Export Jobs Cleaned: ${cleaned.length}\n${JSON.stringify(cleaned, null, 2)}`;
      fs.appendFileSync(logFile, logEntry);
      logger.warn('📝 Cleaned export jobs logged', { count: cleaned.length });
    } else {
      logger.info('✅ No expired export jobs found');
    }

    return cleaned;
  } catch (err) {
    logger.error('❌ Expired export job check failed', {
      error: err.message,
      action: 'INTEGRITY_CHECK_EXPORT_ERROR'
    });
  }
}

/**
 * Run all integrity checks
 * Called daily at 2am
 */
async function runAllChecks() {
  try {
    logger.info('🔄 Starting daily integrity checks', { action: 'INTEGRITY_CHECK_ALL_START' });
    
    const results = {
      timestamp: new Date(),
      orphaned: await checkOrphanedReferences(),
      expiredConsents: await checkExpiredConsents(),
      expiredExports: await checkExpiredExportJobs()
    };

    logger.info('✅ Daily integrity checks complete', {
      orphanedCount: results.orphaned?.length || 0,
      expiredConsentsCount: results.expiredConsents?.length || 0,
      expiredExportsCount: results.expiredExports?.length || 0,
      action: 'INTEGRITY_CHECK_ALL_COMPLETE'
    });

    return results;
  } catch (err) {
    logger.error('❌ Daily integrity checks failed', {
      error: err.message,
      action: 'INTEGRITY_CHECK_ALL_ERROR'
    });
  }
}

module.exports = {
  checkOrphanedReferences,
  checkExpiredConsents,
  checkExpiredExportJobs,
  runAllChecks
};
