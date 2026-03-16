// OAuth2/SMART on FHIR Routes
// Handles OAuth login, token exchange, refresh, and logout
// Mounts at /auth/fhir (separate from existing JWT auth at /api/v1/auth/login)

const express = require('express');
const router = express.Router();
const { Issuer } = require('openid-client');
const crypto = require('crypto');

const oauthConfig = require('../config/oauth');
const SmartLaunch = require('../utils/smartLaunch');
const ExternalFhirClient = require('../utils/externalFhirClient');
const User = require('../models/User');

// Store OAuth client instances per server
const oauthClients = new Map();

/**
 * Initialize OpenID Connect client for FHIR server
 * Discovers endpoints from FHIR server's .well-known/openid-configuration
 */
async function getOAuthClient() {
  const cacheKey = oauthConfig.fhirServerUrl;

  if (oauthClients.has(cacheKey)) {
    return oauthClients.get(cacheKey);
  }

  try {
    // Discover OAuth2 endpoints from FHIR server
    const issuer = await Issuer.discover(oauthConfig.fhirServerDiscoveryUrl);

    const client = new issuer.Client({
      client_id: oauthConfig.clientId,
      client_secret: oauthConfig.clientSecret,
      redirect_uris: [oauthConfig.redirectUri],
      response_types: ['code'],
    });

    oauthClients.set(cacheKey, client);
    return client;
  } catch (error) {
    console.error('Failed to initialize OAuth client:', error.message);
    throw new Error('OAuth client initialization failed. Ensure FHIR server is accessible.');
  }
}

/**
 * POST /auth/fhir/launch
 * Initiate SMART launch flow (standalone or EHR-initiated)
 * 
 * Query params:
 * - launch (optional): Launch context from EHR
 * - ehr (optional): EHR launch identifier
 * 
 * Returns: Redirect to FHIR server's authorization endpoint
 */
router.get('/launch', async (req, res) => {
  try {
    const { launch, ehr } = req.query;

    // Initialize SMART launch
    const launchContext = SmartLaunch.initiateLaunch(req, launch, ehr);

    // Get OAuth client
    const client = await getOAuthClient();

    // Generate authorization URL
    const authorizationUrl = client.authorizationUrl({
      scope: oauthConfig.scopes.join(' '),
      state: launchContext.state,
      code_challenge: launchContext.codeChallenge,
      code_challenge_method: 'S256',
      launch: launch || undefined, // Include launch context if provided
      aud: oauthConfig.fhirServerUrl, // FHIR server as target audience
    });

    // Redirect to FHIR server's auth endpoint
    res.redirect(authorizationUrl);
  } catch (error) {
    console.error('Launch initiation failed:', error.message);
    res.status(500).json({
      error: 'Launch failed',
      message: error.message,
    });
  }
});

/**
 * GET /auth/fhir/callback
 * OAuth2 callback endpoint
 * Exchanges authorization code for access token
 * 
 * Query params:
 * - code: Authorization code from FHIR server
 * - state: State value to verify (CSRF protection)
 * - error (optional): Error if auth failed
 * 
 * Returns: Redirect to frontend with token or error
 */
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;

    // Check for OAuth errors
    if (error) {
      throw new Error(`OAuth error: ${error} - ${error_description || 'Unknown error'}`);
    }

    // Validate state (CSRF protection)
    if (!SmartLaunch.validateState(req, state)) {
      throw new Error('State validation failed. Possible CSRF attack.');
    }

    // Get OAuth client
    const client = await getOAuthClient();

    // Exchange authorization code for tokens
    const tokenSet = await client.callback(oauthConfig.redirectUri, { code, state }, {
      code_verifier: req.session.oauth.codeVerifier,
    });

    // Decode ID token to extract launch context
    const idToken = tokenSet.claims();
    const launchContext = SmartLaunch.extractLaunchContext(idToken, req.session.oauth.launchContext);

    // Store FHIR auth in session
    SmartLaunch.storeFhirToken(req, tokenSet, launchContext);

    // Get or create user account
    let user = await User.findOne({ externalId: idToken.fhirUser });

    if (!user) {
      // Create new user if doesn't exist
      user = await User.create({
        name: idToken.name || 'FHIR User',
        email: idToken.email || `${crypto.randomBytes(8).toString('hex')}@fhir.local`,
        fhirUserId: idToken.fhirUser,
        externalId: idToken.fhirUser,
        role: 'patient', // Default to patient, can be updated based on fhirUser
      });
    }

    // Redirect to frontend auth success page
    const redirectUrl = new URL(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/fhir-auth-success`);
    redirectUrl.searchParams.append('success', 'true');
    redirectUrl.searchParams.append('userId', user._id.toString());
    redirectUrl.searchParams.append('patientId', launchContext.patientId || '');

    res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('OAuth callback failed:', error.message);

    // Redirect to error page
    const errorUrl = new URL(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/fhir-auth-error`);
    errorUrl.searchParams.append('error', error.message);

    res.redirect(errorUrl.toString());
  }
});

/**
 * POST /auth/fhir/refresh
 * Refresh expired FHIR access token
 * 
 * Body:
 * - refreshToken: Refresh token from initial OAuth flow
 * 
 * Returns: New token set
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    // Get OAuth client
    const client = await getOAuthClient();

    // Refresh the token
    const tokenSet = await client.refresh(refreshToken);

    // Update session
    SmartLaunch.storeFhirToken(req, tokenSet, req.session.fhirAuth?.launchContext);

    res.json({
      success: true,
      accessToken: tokenSet.access_token,
      expiresIn: tokenSet.expires_in,
      expiresAt: tokenSet.expires_at,
    });
  } catch (error) {
    console.error('Token refresh failed:', error.message);
    res.status(401).json({
      error: 'Token refresh failed',
      message: error.message,
    });
  }
});

/**
 * GET /auth/fhir/logout
 * Logout from FHIR OAuth session
 * Revokes access token and clears session
 * 
 * Returns: Redirect to frontend logout page
 */
router.get('/logout', async (req, res) => {
  try {
    const fhirAuth = req.session?.fhirAuth;

    if (fhirAuth?.accessToken) {
      try {
        // Get OAuth client
        const client = await getOAuthClient();

        // Revoke the access token (if supported by FHIR server)
        if (client.revocationEndpoint) {
          await client.revoke(fhirAuth.accessToken);
        }
      } catch (error) {
        // Token revocation is optional, log but don't fail
        console.warn('Token revocation failed (non-critical):', error.message);
      }
    }

    // Clear FHIR auth from session
    SmartLaunch.clearFhirAuth(req);

    // Redirect to frontend logout page
    const logoutUrl = new URL(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/logout`);
    logoutUrl.searchParams.append('reason', 'FHIR OAuth logout');

    res.redirect(logoutUrl.toString());
  } catch (error) {
    console.error('Logout failed:', error.message);
    res.status(500).json({
      error: 'Logout failed',
      message: error.message,
    });
  }
});

/**
 * GET /auth/fhir/status
 * Get current FHIR OAuth connection status
 * Useful for frontend to check if connected
 * 
 * Returns: Connection status, scopes, server info
 */
router.get('/status', (req, res) => {
  try {
    const fhirAuth = req.session?.fhirAuth;

    if (!fhirAuth) {
      return res.json({
        connected: false,
        message: 'No FHIR connection established',
      });
    }

    const isExpired = SmartLaunch.isTokenExpired(fhirAuth);

    res.json({
      connected: !isExpired,
      externalServer: oauthConfig.fhirServerUrl,
      expiresAt: new Date(fhirAuth.expiresAt * 1000).toISOString(),
      scopes: fhirAuth.scopes,
      launchContext: fhirAuth.launchContext,
      tokenExpired: isExpired,
    });
  } catch (error) {
    console.error('Status check failed:', error.message);
    res.status(500).json({
      error: 'Status check failed',
      message: error.message,
    });
  }
});

module.exports = router;
