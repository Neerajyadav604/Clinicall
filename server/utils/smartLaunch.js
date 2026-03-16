// SMART on FHIR Launch Handler
// Handles both standalone and EHR-launched flows

const oauthConfig = require('../config/oauth');

/**
 * Handles SMART launch initialization
 * Supports two flows:
 * 1. Standalone launch: User initiates from your app
 * 2. EHR launch: User launched from within Epic/Cerner
 */
class SmartLaunch {
  /**
   * Generate PKCE code verifier and challenge
   * Used for secure OAuth2 flow
   */
  static generatePKCE() {
    const crypto = require('crypto');
    const codeVerifier = crypto
      .randomBytes(32)
      .toString('base64url')
      .replace(/[^a-zA-Z0-9._-]/g, '');
    
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url')
      .replace(/[^a-zA-Z0-9._-]/g, '');
    
    return { codeVerifier, codeChallenge };
  }

  /**
   * Initialize SMART launch flow
   * @param {Object} req - Express request object
   * @param {string} launchContext - Optional launch parameter from EHR
   * @param {string} ehr_launch_identifier - Optional EHR-specific launch param
   * @returns {Object} Launch context with auth URL to redirect to
   */
  static initiateLaunch(req, launchContext = null, ehr_launch_identifier = null) {
    const { codeVerifier, codeChallenge } = this.generatePKCE();
    const state = require('crypto').randomBytes(16).toString('hex');

    // Store in session for callback verification
    if (!req.session) req.session = {};
    req.session.oauth = {
      state,
      codeVerifier,
      launchContext: launchContext || null,
      launchIdentifier: ehr_launch_identifier || null,
      timestamp: Date.now(),
    };

    return {
      state,
      codeVerifier,
      codeChallenge,
      launchContext,
      ehr_launch_identifier,
    };
  }

  /**
   * Extract launch context from launch parameter or EHR session
   * This is called after OAuth2 callback to determine patient/practitioner context
   * @param {Object} idToken - Decoded ID token from OAuth2 response
   * @param {string} launchContext - Launch parameter value
   * @returns {Object} Launch context with patient and practitioner IDs
   */
  static extractLaunchContext(idToken, launchContext) {
    const context = {
      patientId: null,
      practitionerId: null,
      launchMode: 'standalone', // or 'ehr_launch'
      scope: '',
      needsPatientSelector: false,
    };

    if (idToken) {
      // Extract patient context from 'patient' claim
      if (idToken.patient) {
        context.patientId = idToken.patient.split('/')[1]; // Extract ID from "Patient/12345"
        context.launchMode = 'ehr_launch';
      }

      // Extract practitioner context from 'fhirUser' claim
      if (idToken.fhirUser) {
        const fhirUserMatch = idToken.fhirUser.match(/(Practitioner|Patient)\/(.+)/);
        if (fhirUserMatch) {
          if (fhirUserMatch[1] === 'Practitioner') {
            context.practitionerId = fhirUserMatch[2];
          } else if (fhirUserMatch[1] === 'Patient') {
            context.patientId = fhirUserMatch[2];
          }
        }
      }

      // Include scopes from token
      if (idToken.scope) {
        context.scope = idToken.scope;
      }
    }

    // If no patient context in token, might need patient selector UI
    if (!context.patientId) {
      context.needsPatientSelector = true;
    }

    return context;
  }

  /**
   * Validate OAuth state parameter
   * Prevents CSRF attacks
   * @param {Object} req - Express request
   * @param {string} returnedState - State returned from OAuth2 provider
   * @returns {boolean} True if state is valid
   */
  static validateState(req, returnedState) {
    if (!req.session || !req.session.oauth) {
      return false;
    }
    const storedState = req.session.oauth.state;
    return storedState === returnedState;
  }

  /**
   * Store FHIR access token in session
   * Called after successful OAuth2 token exchange
   * @param {Object} req - Express request
   * @param {Object} tokenSet - OpenID Connect token response
   * @param {Object} launchContext - Extracted launch context
   */
  static storeFhirToken(req, tokenSet, launchContext) {
    if (!req.session) req.session = {};

    req.session.fhirAuth = {
      accessToken: tokenSet.access_token,
      refreshToken: tokenSet.refresh_token,
      idToken: tokenSet.id_token,
      expiresAt: tokenSet.expires_at || Date.now() / 1000 + tokenSet.expires_in,
      scopes: tokenSet.scope ? tokenSet.scope.split(' ') : oauthConfig.scopes,
      launchContext,
      obtainedAt: Date.now(),
    };
  }

  /**
   * Check if FHIR token is expired
   * @param {Object} fhirAuth - FHIR auth session object
   * @returns {boolean} True if token is expired
   */
  static isTokenExpired(fhirAuth) {
    if (!fhirAuth || !fhirAuth.expiresAt) return true;
    return Date.now() / 1000 > fhirAuth.expiresAt - 60; // 60 second buffer
  }

  /**
   * Clear FHIR authentication from session
   * Called on logout
   * @param {Object} req - Express request
   */
  static clearFhirAuth(req) {
    if (req.session) {
      delete req.session.fhirAuth;
      delete req.session.oauth;
    }
  }
}

module.exports = SmartLaunch;
