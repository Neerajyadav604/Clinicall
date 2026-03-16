const AuditLog = require('../models/AuditLog');
const AuditEvent = require('../models/AuditEvent');
const fs = require('fs');
const path = require('path');

exports.log = async (actorId, action, target=null, metadata={}) => {
  try {
    await AuditLog.create({ actor: actorId, action, target, metadata });
  } catch (err) {
    console.error('Failed to write audit log', err);
  }
};

/**
 * Enhanced FHIR Access Logging (Phase 3)
 * Logs to MongoDB AuditEvent, AuditLog, and local file
 * @param {Object} options - Logging options
 */
exports.logFHIRAccess = async (options = {}) => {
  try {
    const {
      userId,
      role,
      action,
      resourceType,
      resourceId,
      patientId,
      ipAddress = 'unknown',
      userAgent = 'unknown',
      consentId = null,
      success = true,
      failureReason = null,
      successMessage = null,
    } = options;

    const timestamp = new Date();

    // 1. Log to MongoDB AuditEvent (FHIR-compliant)
    const auditEvent = new AuditEvent({
      type: {
        system: 'http://terminology.hl7.org/CodeSystem/audit-event-type',
        code: 'rest',
        display: 'RESTful Operation',
      },
      subtype: [
        {
          system: 'http://hl7.org/fhir/restful-interaction',
          code: action,
          display: action,
        },
      ],
      action: mapActionToAuditEventCode(action),
      recorded: timestamp,
      outcome: success ? '0' : '4',
      outcomeDesc: successMessage || failureReason || (success ? 'Success' : 'Failure'),
      agent: [
        {
          name: userId?.toString() || 'unknown',
          userId,
          userRole: role,
          requestor: true,
          network: {
            address: ipAddress,
            type: ipAddress.includes(':') ? 'IPv6' : 'IPv4',
          },
        },
      ],
      entity: resourceId ? [
        {
          reference: resourceId,
          referenceModel: resourceType,
          name: `${resourceType}/${resourceId}`,
        },
      ] : [],
      patientId,
      resourceType,
      resourceId,
      consentId,
    });

    await auditEvent.save();

    // 2. Log to MongoDB AuditLog (backwards compatibility)
    await AuditLog.create({
      actor: userId,
      action: `FHIR_${action}`,
      target: `${resourceType}:${resourceId}`,
      metadata: {
        resourceType,
        resourceId,
        patientId,
        role,
        ipAddress,
        userAgent,
        timestamp,
        consentId,
        success,
        failureReason,
        successMessage,
      },
    });

    // 3. Log to local NDJSON file for archival/export
    const logsDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const logEntry = {
      timestamp: timestamp.toISOString(),
      userId: userId?.toString() || 'unknown',
      role,
      action,
      resourceType,
      resourceId: resourceId?.toString() || null,
      patientId: patientId?.toString() || null,
      consentId: consentId?.toString() || null,
      ipAddress,
      userAgent,
      success,
      failureReason: failureReason || null,
      successMessage: successMessage || null,
    };

    const logFilePath = path.join(logsDir, 'fhir-audit.log');
    fs.appendFileSync(logFilePath, JSON.stringify(logEntry) + '\n', 'utf-8');

  } catch (err) {
    console.error('Error in logFHIRAccess:', err);
    // Don't throw - logging failures shouldn't crash the app
  }
};

/**
 * Map FHIR action string to AuditEvent action code
 */
const mapActionToAuditEventCode = (action) => {
  const actionMap = {
    'READ': 'R',
    'SEARCH': 'R',
    'CREATE': 'C',
    'UPDATE': 'U',
    'DELETE': 'D',
    'EXECUTE': 'E',
    'EXPORT': 'E',
    'CONSENT_GRANT': 'C',
    'CONSENT_REVOKE': 'D',
  };
  return actionMap[action] || 'E';
};

/**
 * Generate HIPAA-compliant audit report
 * @param {Object} options - Report options
 * @param {Date} options.startDate - Report start date
 * @param {Date} options.endDate - Report end date
 * @param {String} options.patientId - Optional patient ID filter
 * @returns {Object} HIPAA compliance report
 */
exports.generateHIPAAReport = async (options = {}) => {
  try {
    const { startDate, endDate, patientId } = options;
    
    const query = {
      timestamp: {
        $gte: startDate,
        $lte: endDate
      }
    };

    if (patientId) {
      query.patientId = patientId;
    }

    // Query audit events
    const auditEvents = await AuditEvent.find(query).lean();

    // Build report
    const report = {
      generatedAt: new Date(),
      reportPeriod: {
        start: startDate,
        end: endDate
      },
      patientIdFilter: patientId || 'all',
      totalAccesses: auditEvents.length,
      
      // Breakdown by action type
      breakdownByAction: {},
      
      // Breakdown by actor role
      breakdownByRole: {},
      
      // Failed access attempts (potential breaches)
      failedAccesses: [],
      
      // Accesses outside consent period
      accessesOutsideConsent: [],
      
      // Unique accessors
      uniqueAccessors: new Set(),
      
      // Unique patients accessed
      uniquePatientsAccessed: new Set()
    };

    for (const event of auditEvents) {
      const action = event.action || 'UNKNOWN';
      const role = event.agent?.[0]?.userRole || 'unknown';
      const userId = event.agent?.[0]?.userId?.toString() || 'unknown';

      // Count by action
      report.breakdownByAction[action] = (report.breakdownByAction[action] || 0) + 1;

      // Count by role
      report.breakdownByRole[role] = (report.breakdownByRole[role] || 0) + 1;

      // Track accessors
      report.uniqueAccessors.add(userId);

      // Track patients
      if (event.patientId) {
        report.uniquePatientsAccessed.add(event.patientId.toString());
      }

      // Flag failed accesses
      if (event.outcome !== '0' && event.outcome !== 'success') {
        report.failedAccesses.push({
          timestamp: event.recorded,
          actor: userId,
          action: action,
          reason: event.outcomeDesc,
          ipAddress: event.agent?.[0]?.network?.address
        });
      }

      // Check for accesses outside consent (if consent check metadata exists)
      if (event.metadata?.consentCheck === false) {
        report.accessesOutsideConsent.push({
          timestamp: event.recorded,
          actor: userId,
          patient: event.patientId,
          resourceType: event.resourceType
        });
      }
    }

    // Convert Sets to Arrays
    report.uniqueAccessors = Array.from(report.uniqueAccessors);
    report.uniquePatientsAccessed = Array.from(report.uniquePatientsAccessed);
    report.uniqueAccessorCount = report.uniqueAccessors.length;
    report.uniquePatientsCount = report.uniquePatientsAccessed.length;

    // Write to log file
    const logsDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const reportFileName = `hipaa-report-${new Date().toISOString().split('T')[0]}.json`;
    const reportPath = path.join(logsDir, reportFileName);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    return report;
  } catch (err) {
    console.error('Error generating HIPAA report:', err);
    throw err;
  }
};

/**
 * Generate HIPAA-Compliant Audit Report (Phase 5)
 * Queries AuditEvent collection and generates aggregated report
 * @param {Object} options - Report options
 * @returns {Object} HIPAA audit report
 */
exports.generateHIPAAReport = async (options = {}) => {
  try {
    const { startDate, endDate, patientId } = options;

    // Build filter
    const filter = {};
    if (startDate || endDate) {
      filter.recorded = {};
      if (startDate) filter.recorded.$gte = new Date(startDate);
      if (endDate) filter.recorded.$lte = new Date(endDate);
    }
    if (patientId) {
      filter.patientId = patientId;
    }

    // Query audit events
    const auditEvents = await AuditEvent.find(filter).lean().exec();

    // Build breakdown by action
    const byAction = {};
    const byRole = {};
    let failedAttempts = 0;
    const failedAccessAttempts = [];

    auditEvents.forEach(event => {
      // Count by action
      const action = event.subtype?.[0]?.code || event.action || 'UNKNOWN';
      byAction[action] = (byAction[action] || 0) + 1;

      // Count by role
      const role = event.agent?.[0]?.userRole || 'UNKNOWN';
      byRole[role] = (byRole[role] || 0) + 1;

      // Track failed attempts
      if (event.outcome === '4' || event.outcome !== '0') {
        failedAttempts++;
        failedAccessAttempts.push({
          timestamp: event.recorded,
          userId: event.agent?.[0]?.name,
          action: action,
          resource: event.entity?.[0]?.name,
          reason: event.outcomeDesc
        });
      }
    });

    // Check for out-of-consent access
    const outOfConsentAccess = [];
    for (const event of auditEvents) {
      // If no consentId but accessing patient data, flag it
      if (!event.consentId && event.patientId && event.resourceType !== 'Consent') {
        const hasConsent = await AuditEvent.findOne({
          patientId: event.patientId,
          'agent.userId': event.agent?.[0]?.userId,
          action: 'CONSENT_GRANT',
          recorded: { $lt: event.recorded }
        }).exec();

        if (!hasConsent) {
          outOfConsentAccess.push({
            timestamp: event.recorded,
            accessor: event.agent?.[0]?.name,
            patient: event.patientId,
            resource: event.entity?.[0]?.name,
            severity: 'HIGH'
          });
        }
      }
    }

    // Generate report
    const report = {
      generatedAt: new Date().toISOString(),
      period: {
        start: startDate || null,
        end: endDate || null
      },
      patientId: patientId || null,
      summary: {
        totalAccesses: auditEvents.length,
        failedAccesses: failedAttempts,
        uniqueAccessors: new Set(auditEvents.map(e => e.agent?.[0]?.name)).size,
        outOfConsentAccesses: outOfConsentAccess.length
      },
      breakdownByAction: byAction,
      breakdownByRole: byRole,
      failedAccessAttempts: failedAccessAttempts.slice(0, 100), // Limit to 100
      potentialBreaches: outOfConsentAccess
    };

    return report;
  } catch (err) {
    console.error('Error generating HIPAA report:', err);
    throw err;
  }
};
