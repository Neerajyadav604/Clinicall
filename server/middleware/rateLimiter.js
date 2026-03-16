const rateLimit = require('express-rate-limit');

exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: 'Too many login attempts, please try again later.' }
});

exports.signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: { success: false, message: 'Too many signup attempts, please try again later.' }
});

// ============================================
// PHASE 5: FHIR-SPECIFIC RATE LIMITERS
// ============================================

/**
 * FHIR Read Limiter — 100 requests per 15 minutes per IP
 * Applied to all FHIR GET endpoints
 */
exports.fhirReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  keyGenerator: (req, res) => {
    return req.ip || req.connection.remoteAddress;
  },
  message: {
    success: false,
    message: 'Too many read requests. Please wait before trying again.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * FHIR Write Limiter — 30 requests per 15 minutes per IP (production)
 * In development mode, allows 500 requests per 15 minutes for testing
 * Applied to all FHIR POST/PATCH/DELETE endpoints
 */
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
exports.fhirWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 500 : 30, // 500 requests in dev, 30 in production
  keyGenerator: (req, res) => {
    return req.ip || req.connection.remoteAddress;
  },
  message: {
    success: false,
    message: isDevelopment 
      ? 'Rate limit exceeded (dev: 500 per 15 min)' 
      : 'Too many write requests. Please wait before trying again.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Export Limiter — 5 export jobs per hour per authenticated user
 * Applied to GET /fhir/R4/Patient/:id/$export
 * Per authenticated userId, not per IP
 */
exports.exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  keyGenerator: (req, res) => {
    // Use userId if authenticated, otherwise use IP
    return req.user?.id || req.ip || req.connection.remoteAddress;
  },
  message: {
    success: false,
    message: 'Export limit exceeded. Maximum 5 exports per hour.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req, res) => {
    // Only apply to authenticated users
    return !req.user?.id;
  }
});

/**
 * Sync Limiter — 10 sync operations per hour per authenticated user
 * Applied to POST /fhir/R4/Patient/:id/$sync
 * Per authenticated userId, not per IP
 */
exports.syncLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  keyGenerator: (req, res) => {
    // Use userId if authenticated, otherwise use IP
    return req.user?.id || req.ip || req.connection.remoteAddress;
  },
  message: {
    success: false,
    message: 'Sync limit exceeded. Maximum 10 syncs per hour.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req, res) => {
    // Only apply to authenticated users
    return !req.user?.id;
  }
});
