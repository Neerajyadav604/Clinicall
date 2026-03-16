/**
 * Production-Grade Logger Configuration
 * Uses winston with daily rotation
 * Never logs raw PHI - redacts sensitive data
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// PHI redaction patterns (same as phiSanitizer)
const PHI_PATTERNS = {
  patientName: /\b[A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g,
  dob: /\b\d{1,2}\/\d{1,2}\/\d{4}\b|\b\d{4}-\d{1,2}-\d{1,2}\b/g,
  phone: /\b(?:\+?1[-.\s]?)?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})\b/g,
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  mrn: /(?:MRN|Medical Record|Patient ID)[:\s]+(\d+)/gi,
  icd10: /\b[A-Z]\d{2}(?:\.\d{1,2})?\b/g,
  address: /\d+\s+(?:North|South|East|West)?\s*\w+\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd)/gi
};

/**
 * Redact PHI from a string
 */
function redactPHI(text) {
  if (typeof text !== 'string') return text;

  let redacted = text;
  redacted = redacted.replace(PHI_PATTERNS.patientName, '[PATIENT_NAME]');
  redacted = redacted.replace(PHI_PATTERNS.dob, '[DOB]');
  redacted = redacted.replace(PHI_PATTERNS.phone, '[PHONE]');
  redacted = redacted.replace(PHI_PATTERNS.email, '[EMAIL]');
  redacted = redacted.replace(PHI_PATTERNS.ssn, '[SSN]');
  redacted = redacted.replace(PHI_PATTERNS.mrn, 'MRN: [REDACTED]');
  redacted = redacted.replace(PHI_PATTERNS.icd10, '[ICD10_CODE]');
  redacted = redacted.replace(PHI_PATTERNS.address, '[ADDRESS]');
  
  return redacted;
}

/**
 * Sanitize log message
 */
function sanitizeLogMessage(message) {
  if (typeof message === 'string') {
    return redactPHI(message);
  }
  if (typeof message === 'object') {
    const sanitized = {};
    for (const key in message) {
      if (typeof message[key] === 'string') {
        sanitized[key] = redactPHI(message[key]);
      } else if (typeof message[key] === 'object') {
        sanitized[key] = sanitizeLogMessage(message[key]);
      } else {
        sanitized[key] = message[key];
      }
    }
    return sanitized;
  }
  return message;
}

/**
 * Custom format for JSON logging (production)
 */
const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    // Sanitize message and metadata
    const sanitized = sanitizeLogMessage(message);
    const sanitizedMeta = sanitizeLogMessage(meta);

    return JSON.stringify({
      timestamp,
      level,
      message: sanitized,
      ...sanitizedMeta
    });
  })
);

/**
 * Custom format for console logging (development)
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const sanitized = sanitizeLogMessage(message);
    const metaStr = Object.keys(meta).length ? JSON.stringify(sanitizeLogMessage(meta)) : '';
    return `${timestamp} [${level}] ${sanitized} ${metaStr}`;
  })
);

// Ensure logs directory exists (non-blocking)
const logsDir = path.join(__dirname, '../logs');
// Try to create dir async without blocking startup
fs.promises.mkdir(logsDir, { recursive: true }).catch(err => {
  // Silently ignore errors - DailyRotateFile will handle directory creation
  if (process.env.DEBUG) console.error('Logger dir creation:', err.message);
});

// Transport: Daily rotating file for all logs
const dailyRotateFileTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'app-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '50m',
  maxDays: 30,
  format: jsonFormat
});

// Transport: Daily rotating file for errors only
const errorFileTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'errors-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '50m',
  maxDays: 30,
  level: 'error',
  format: jsonFormat
});

// Create logger based on environment
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'clinicall-backend' }
});

if (process.env.NODE_ENV === 'production') {
  // Production: Log to rotating files only
  logger.add(dailyRotateFileTransport);
  logger.add(errorFileTransport);
} else {
  // Development: Log to console with colors
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: 'debug'
  }));
  
  // Also add file logging in development
  logger.add(dailyRotateFileTransport);
}

/**
 * Disable console.log in production, replace with logger
 */
if (process.env.NODE_ENV === 'production') {
  console.log = (...args) => {
    logger.info(args.join(' '));
  };
  console.warn = (...args) => {
    logger.warn(args.join(' '));
  };
  console.error = (...args) => {
    logger.error(args.join(' '));
  };
}

module.exports = logger;
