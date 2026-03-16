// OAuth2/SMART on FHIR Configuration
// Supports Epic, Cerner, AWS HealthLake, and other FHIR servers

require('dotenv').config();

const oauthConfig = {
  // OAuth2 Client Credentials
  clientId: process.env.FHIR_CLIENT_ID || 'clinicall-client',
  clientSecret: process.env.FHIR_CLIENT_SECRET || '',
  
  // FHIR Server Configuration
  fhirServerUrl: process.env.FHIR_SERVER_URL || 'https://fhir.example.com',
  fhirServerDiscoveryUrl: process.env.FHIR_SERVER_DISCOVERY_URL || `${process.env.FHIR_SERVER_URL || 'https://fhir.example.com'}/.well-known/openid-configuration`,
  
  // Redirect URIs for OAuth2 callback
  redirectUri: process.env.OAUTH_REDIRECT_URI || `${process.env.SERVER_URL || 'http://localhost:5000'}/auth/fhir/callback`,
  
  // SMART on FHIR Scopes
  // patient/*.read — Read all patient resources
  // patient/*.write — Write all patient resources
  // launch/patient — Launched in patient context
  // openid, fhirUser — OpenID Connect
  scopes: [
    'launch/patient',           // Indicates SMART launch with patient context
    'patient/Patient.read',     // Read patient demographic data
    'patient/Observation.read', // Read observations (vitals, labs)
    'patient/Condition.read',   // Read conditions/diagnoses
    'patient/Medication.read',  // Read medications
    'patient/MedicationRequest.read', // Read medication orders
    'patient/AllergyIntolerance.read', // Read allergies
    'patient/DiagnosticReport.read',   // Read lab reports
    'patient/DocumentReference.read',  // Read clinical documents
    'patient/Procedure.read',   // Read procedures
    'patient/Immunization.read', // Read immunizations
    'openid',                    // OpenID Connect
    'fhirUser'                   // Get user info in token
  ],
  
  // Token Configuration
  tokenExpireIn: process.env.TOKEN_EXPIRE_IN || 3600, // 1 hour in seconds
  refreshTokenExpireIn: process.env.REFRESH_TOKEN_EXPIRE_IN || 604800, // 7 days
  
  // Response Type
  responseType: 'code',
  
  // Grant Type
  grantType: 'authorization_code',
  
  // State/PKCE for security
  usePKCE: true,
  
  // Session Configuration
  sessionSecret: process.env.SESSION_SECRET || 'clinicall-oauth-secret',
};

module.exports = oauthConfig;
