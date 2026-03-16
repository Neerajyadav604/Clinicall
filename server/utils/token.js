const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/RefreshToken');

// ensure required signing secrets are present early to avoid runtime surprises
const { JWT_SECRET, REFRESH_TOKEN_SECRET } = process.env;
if (!JWT_SECRET || !REFRESH_TOKEN_SECRET) {
  // eslint-disable-next-line no-console
  console.error('FATAL: JWT_SECRET and/or REFRESH_TOKEN_SECRET not set in environment');
  // throw synchronously so application initialization fails fast
  throw new Error('Missing JWT configuration; check environment variables');
}

// Standard: backwards compatible with existing code
exports.signAccessToken = (userId, role, fhirClaims = null) => {
  // ✅ SECURITY: Validate role against allowlist to prevent arbitrary role injection
  const VALID_ROLES = ['user', 'admin', 'doctor', 'hospital_admin'];
  const normalizedRole = String(role).toLowerCase();
  
  if (!VALID_ROLES.includes(normalizedRole)) {
    throw new Error(`Invalid role "${role}". Allowed roles: ${VALID_ROLES.join(', ')}`);
  }
  
  const payload = { id: userId, role: normalizedRole };
  
  // Add FHIR-specific claims if provided
  if (fhirClaims) {
    if (fhirClaims.fhirUser) payload.fhirUser = fhirClaims.fhirUser; // e.g. "Patient/123"
    if (fhirClaims.patientId) payload.patientId = fhirClaims.patientId; // MongoDB _id
    if (fhirClaims.scopes) payload.scope = fhirClaims.scopes; // FHIR scopes: "launch/patient patient/read"
  }
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' }); // ✅ Changed from 15m to 2 hours
};

exports.signRefreshToken = async (userId) => {
  const token = jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
  const expiresAt = new Date(Date.now() + 7*24*60*60*1000);
  const rt = await RefreshToken.create({ user: userId, token, expiresAt });
  return rt;
};

exports.verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

exports.verifyRefreshToken = async (token) => {
  const payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  const stored = await RefreshToken.findOne({ token, revoked: false });
  if (!stored) throw new Error('Refresh token not found or revoked');
  if (stored.expiresAt < Date.now()) throw new Error('Refresh token expired');
  return payload;
};

exports.revokeRefreshToken = async (token) => {
  await RefreshToken.findOneAndUpdate({ token }, { revoked: true });
};
