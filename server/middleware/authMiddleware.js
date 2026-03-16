const { verifyAccessToken } = require('../utils/token');
const User = require("../models/User");
const Doctor = require("../models/Doctor");

const authenticateUser = async (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`\n${'='.repeat(80)}`);
  console.log(`[🔐 AUTH MIDDLEWARE] ${timestamp}`);
  console.log(`[🔐 AUTH MIDDLEWARE] ═══ INCOMING REQUEST ═══`);
  console.log(`[🔐 AUTH MIDDLEWARE] Method: ${req.method}`);
  console.log(`[🔐 AUTH MIDDLEWARE] Path: ${req.path}`);
  console.log(`[🔐 AUTH MIDDLEWARE] Original URL: ${req.originalUrl}`);
  console.log(`[🔐 AUTH MIDDLEWARE] IP Address: ${req.ip || req.connection.remoteAddress}`);
  
  let token = null;

  console.log(`[🔐 AUTH MIDDLEWARE] ═══ TOKEN EXTRACTION ═══`);
  
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // ✅ SECURITY: Check that Authorization header has both "Bearer" and token parts
    const parts = req.headers.authorization.split(" ");
    if (parts.length !== 2) {
      console.error(`[🔐 AUTH MIDDLEWARE] ❌ Malformed Authorization header: expected 'Bearer <token>'`);
      console.log(`${'='.repeat(80)}\n`);
      return res.status(401).json({
        success: false,
        message: "Malformed Authorization header. Expected format: 'Bearer <token>'",
      });
    }
    token = parts[1];
    console.log(`[🔐 AUTH MIDDLEWARE] Token extracted from Authorization header`);
    console.log(`[🔐 AUTH MIDDLEWARE] Token length: ${token ? token.length : 0}`);
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
    console.log(`[🔐 AUTH MIDDLEWARE] Token extracted from cookies`);
    console.log(`[🔐 AUTH MIDDLEWARE] Token length: ${token ? token.length : 0}`);
  } else {
    console.log(`[🔐 AUTH MIDDLEWARE] No Authorization header found`);
    console.log(`[🔐 AUTH MIDDLEWARE] Checking cookies...`);
    console.log(`[🔐 AUTH MIDDLEWARE] Cookies present: ${Object.keys(req.cookies || {}).length > 0}`);
    console.log(`[🔐 AUTH MIDDLEWARE] Cookie keys: ${Object.keys(req.cookies || {}).join(', ')}`);
  }

  if (!token || typeof token !== 'string' || !token.trim()) {
    console.error(`[🔐 AUTH MIDDLEWARE] ❌ No valid token provided`);
    console.error(`[🔐 AUTH MIDDLEWARE] Token type: ${typeof token}`);
    console.error(`[🔐 AUTH MIDDLEWARE] Token value: ${token}`);
    console.log(`${'='.repeat(80)}\n`);
    return res.status(401).json({
      success: false,
      message: "No token provided. Please login.",
    });
  }

  // simple structural check before calling jwt.verify
  const jwtPattern = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
  
  console.log(`[🔐 AUTH MIDDLEWARE] ═══ TOKEN VALIDATION ═══`);
  console.log(`[🔐 AUTH MIDDLEWARE] JWT pattern check: ${jwtPattern.test(token) ? 'PASSED' : 'FAILED'}`);
  
  if (!jwtPattern.test(token)) {
    console.error(`[🔐 AUTH MIDDLEWARE] ❌ Malformed token - doesn't match JWT pattern`);
    console.error(`[🔐 AUTH MIDDLEWARE] Token sample: ${token.substring(0, 50)}...`);
    console.log(`${'='.repeat(80)}\n`);
    return res.status(401).json({
      success: false,
      message: "Malformed token",
    });
  }

  try {
    console.log(`[🔐 AUTH MIDDLEWARE] ═══ JWT VERIFICATION ═══`);
    console.log(`[🔐 AUTH MIDDLEWARE] Verifying JWT token...`);
    
    const decoded = verifyAccessToken(token);
    
    console.log(`[🔐 AUTH MIDDLEWARE] ✅ JWT verification successful`);
    console.log(`[🔐 AUTH MIDDLEWARE] Decoded user ID: ${decoded.id}`);
    console.log(`[🔐 AUTH MIDDLEWARE] Decoded email: ${decoded.email}`);
    console.log(`[🔐 AUTH MIDDLEWARE] Decoded role: ${decoded.role}`);
    
    console.log(`[🔐 AUTH MIDDLEWARE] ═══ DATABASE LOOKUP ═══`);
    console.log(`[🔐 AUTH MIDDLEWARE] Looking up user in database with ID: ${decoded.id}`);
    
    const user = await User.findById(decoded.id);
    
    if (!user) {
      console.error(`[🔐 AUTH MIDDLEWARE] ❌ User not found in database`);
      console.error(`[🔐 AUTH MIDDLEWARE] User ID searched: ${decoded.id}`);
      console.log(`${'='.repeat(80)}\n`);
      return res.status(401).json({
        success: false,
        message: "User not found. Invalid token.",
      });
    }

    console.log(`[🔐 AUTH MIDDLEWARE] ✅ User found in database`);
    console.log(`[🔐 AUTH MIDDLEWARE] User email: ${user.email}`);
    console.log(`[🔐 AUTH MIDDLEWARE] User role: ${user.role}`);
    console.log(`[🔐 AUTH MIDDLEWARE] User status: ${user.status || 'N/A'}`);
    console.log(`[🔐 AUTH MIDDLEWARE] ═══ MIDDLEWARE PASSED ═══`);
    console.log(`[🔐 AUTH MIDDLEWARE] Setting req.user and calling next()`);
    console.log(`${'='.repeat(80)}\n`);
    
    req.user = user;
    next();
  } catch (err) {
    const timestamp = new Date().toISOString();
    console.error(`\n${'='.repeat(80)}`);
    console.error(`[🔐 AUTH MIDDLEWARE] ${timestamp}`);
    console.error(`[🔐 AUTH MIDDLEWARE] ❌ ERROR IN AUTHENTICATION`);
    console.error(`[🔐 AUTH MIDDLEWARE] Error type: ${err.constructor.name}`);
    console.error(`[🔐 AUTH MIDDLEWARE] Error message: ${err.message}`);
    console.error(`[🔐 AUTH MIDDLEWARE] Error code: ${err.code}`);
    console.error(`[🔐 AUTH MIDDLEWARE] Error details:`, {
      name: err.name,
      message: err.message,
      expiredAt: err.expiredAt,
      date: err.date,
    });
    console.error(`[🔐 AUTH MIDDLEWARE] Full error stack:`, err.stack);
    console.error(`[🔐 AUTH MIDDLEWARE] Request path: ${req.path}`);
    console.error(`[🔐 AUTH MIDDLEWARE] Request method: ${req.method}`);
    console.error(`${'='.repeat(80)}\n`);
    
    if (process.env.NODE_ENV !== 'production') {
      console.debug('JWT verification failure:', err.message);
    }
    return res.status(401).json({
      success: false,
      message: "Authentication failed. Invalid token.",
    });
  }
};

const isadmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    // Support both roles array (new schema) and role string (old schema)
    const userRoles = Array.isArray(req.user.roles)
      ? req.user.roles.map(r => r.toLowerCase())
      : [(req.user.role || "").toLowerCase()];

    if (!userRoles.includes("admin")) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admins only.",
      });
    }

    next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};





const isDoctor = async (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`\n${'='.repeat(80)}`);
  console.log(`[👨‍⚕️ DOCTOR-AUTH MIDDLEWARE] ${timestamp}`);
  console.log(`[👨‍⚕️ DOCTOR-AUTH MIDDLEWARE] ═══ DOCTOR ROLE CHECK ═══`);
  console.log(`[👨‍⚕️ DOCTOR-AUTH MIDDLEWARE] Request path: ${req.path}`);
  console.log(`[👨‍⚕️ DOCTOR-AUTH MIDDLEWARE] Request method: ${req.method}`);
  
  try {
    if (!req.user) {
      console.error(`[👨‍⚕️ DOCTOR-AUTH MIDDLEWARE] ❌ No user found in request`);
      console.error(`[👨‍⚕️ DOCTOR-AUTH MIDDLEWARE] req.user is: ${req.user}`);
      console.log(`${'='.repeat(80)}\n`);
      return res.status(401).json({
        success: false,
        message: "Not authenticated"
      });
    }

    console.log(`[👨‍⚕️ DOCTOR-AUTH MIDDLEWARE] ✅ User found in request`);
    console.log(`[👨‍⚕️ DOCTOR-AUTH MIDDLEWARE] User ID: ${req.user.id}`);
    console.log(`[👨‍⚕️ DOCTOR-AUTH MIDDLEWARE] User email: ${req.user.email}`);
    console.log(`[👨‍⚕️ DOCTOR-AUTH MIDDLEWARE] User role (raw): ${req.user.role}`);
    console.log(`[👨‍⚕️ DOCTOR-AUTH MIDDLEWARE] User roles (array): ${JSON.stringify(req.user.roles)}`);

    // Support both roles array (new schema) and role string (old schema)
    const userRoles = Array.isArray(req.user.roles)
      ? req.user.roles.map(r => r.toLowerCase())
      : [(req.user.role || "").toLowerCase()];

    console.log(`[👨‍⚕️ DOCTOR-AUTH MIDDLEWARE] ═══ ROLE VALIDATION ═══`);
    console.log(`[👨‍⚕️ DOCTOR-AUTH MIDDLEWARE] Normalized roles: ${JSON.stringify(userRoles)}`);
    console.log(`[👨‍⚕️ DOCTOR-AUTH MIDDLEWARE] Looking for 'doctor' role in: ${JSON.stringify(userRoles)}`);
    console.log(`[👨‍⚕️ DOCTOR-AUTH MIDDLEWARE] Has 'doctor' role: ${userRoles.includes("doctor")}`);

    if (!userRoles.includes("doctor")) {
      console.error(`[👨‍⚕️ DOCTOR-AUTH MIDDLEWARE] ❌ User does not have 'doctor' role`);
      console.error(`[👨‍⚕️ DOCTOR-AUTH MIDDLEWARE] User roles: ${JSON.stringify(userRoles)}`);
      console.error(`[👨‍⚕️ DOCTOR-AUTH MIDDLEWARE] User email: ${req.user.email}`);
      console.log(`${'='.repeat(80)}\n`);
      return res.status(403).json({
        success: false,
        message: "Access denied. Doctor only."
      });
    }

    console.log(`[👨‍⚕️ DOCTOR-AUTH MIDDLEWARE] ✅ User has 'doctor' role`);
    console.log(`[👨‍⚕️ DOCTOR-AUTH MIDDLEWARE] ═══ DOCTOR PROFILE LOOKUP ═══`);
    console.log(`[👨‍⚕️ DOCTOR-AUTH MIDDLEWARE] Searching for Doctor profile with user ID: ${req.user.id}`);

    const doctor = await Doctor.findOne({ user: req.user.id });

    if (!doctor) {
      console.error(`[👨‍⚕️ DOCTOR-AUTH MIDDLEWARE] ❌ Doctor profile not found in database`);
      console.error(`[👨‍⚕️ DOCTOR-AUTH MIDDLEWARE] User ID: ${req.user.id}`);
      console.error(`[👨‍⚕️ DOCTOR-AUTH MIDDLEWARE] User email: ${req.user.email}`);
      console.log(`${'='.repeat(80)}\n`);
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found. Please complete your doctor registration."
      });
    }

    console.log(`[👨‍⚕️ DOCTOR-AUTH MIDDLEWARE] ✅ Doctor profile found`);
    console.log(`[👨‍⚕️ DOCTOR-AUTH MIDDLEWARE] Doctor ID: ${doctor._id}`);
    console.log(`[👨‍⚕️ DOCTOR-AUTH MIDDLEWARE] Doctor name: ${doctor.fullName}`);
    console.log(`[👨‍⚕️ DOCTOR-AUTH MIDDLEWARE] Doctor specialization: ${doctor.specialization}`);
    console.log(`[👨‍⚕️ DOCTOR-AUTH MIDDLEWARE] ═══ MIDDLEWARE PASSED ═══`);
    console.log(`[👨‍⚕️ DOCTOR-AUTH MIDDLEWARE] Attaching doctor to request and calling next()`);
    console.log(`${'='.repeat(80)}\n`);

    // Attach doctor to request
    req.doctor = doctor;

    next();
  } catch (error) {
    const timestamp = new Date().toISOString();
    console.error(`\n${'='.repeat(80)}`);
    console.error(`[👨‍⚕️ DOCTOR-AUTH MIDDLEWARE] ${timestamp}`);
    console.error(`[👨‍⚕️ DOCTOR-AUTH MIDDLEWARE] ❌ ERROR IN DOCTOR AUTHENTICATION`);
    console.error(`[👨‍⚕️ DOCTOR-AUTH MIDDLEWARE] Error type: ${error.constructor.name}`);
    console.error(`[👨‍⚕️ DOCTOR-AUTH MIDDLEWARE] Error message: ${error.message}`);
    console.error(`[👨‍⚕️ DOCTOR-AUTH MIDDLEWARE] Error stack:`, error.stack);
    console.error(`[👨‍⚕️ DOCTOR-AUTH MIDDLEWARE] Full error object:`, error);
    console.error(`[👨‍⚕️ DOCTOR-AUTH MIDDLEWARE] Request path: ${req.path}`);
    console.error(`[👨‍⚕️ DOCTOR-AUTH MIDDLEWARE] User ID: ${req.user?.id}`);
    console.error(`[👨‍⚕️ DOCTOR-AUTH MIDDLEWARE] User email: ${req.user?.email}`);
    console.error(`${'='.repeat(80)}\n`);
    
    return res.status(500).json({
      success: false,
      message: "Server error in doctor verification"
    });
  }
};








module.exports = {
  authenticateUser,
  isadmin,
  isDoctor,
};
