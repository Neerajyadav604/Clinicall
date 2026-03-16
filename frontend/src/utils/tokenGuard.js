/**
 * Token Guard Utility
 * Checks JWT and FHIR OAuth tokens before FHIR API calls
 * Automatically refreshes expired tokens
 * Prevents unauthorized access to FHIR resources
 */

import { store } from '../store';
import { setAuthToken } from '../slices/authSession';
import { setFhirToken } from '../slices/fhirSlice';

/**
 * Check if a JWT token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if token is expired
 */
function isTokenExpired(token) {
  if (!token) return true;

  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const { exp } = JSON.parse(jsonPayload);
    if (!exp) return false;

    // Check if token expires in less than 5 minutes
    const now = Math.floor(Date.now() / 1000);
    return exp - now < 300; // 5 minutes buffer
  } catch (err) {
    console.error('Error checking token expiration:', err);
    return true;
  }
}

/**
 * Refresh JWT token
 */
async function refreshJWTToken() {
  try {
    const response = await fetch('/api/v1/auth/refresh-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include' // Include cookies
    });

    if (!response.ok) {
      throw new Error('Failed to refresh JWT token');
    }

    const { token } = await response.json();
    store.dispatch(setAuthToken(token));
    return token;
  } catch (err) {
    console.error('JWT refresh failed:', err);
    // Redirect to login if refresh fails
    window.location.href = '/login';
    return null;
  }
}

/**
 * Refresh FHIR OAuth token
 */
async function refreshFHIRToken() {
  try {
    const response = await fetch('/auth/fhir/refresh-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to refresh FHIR token');
    }

    const { accessToken, expiresAt } = await response.json();
    store.dispatch(setFhirToken({
      accessToken,
      expiresAt
    }));
    return accessToken;
  } catch (err) {
    console.error('FHIR token refresh failed:', err);
    // Prompt user to reconnect to FHIR server
    return null;
  }
}

/**
 * Guard function to check tokens before API call
 * Automatically refreshes if needed
 * @returns {object} { jwtToken, fhirToken, isValid }
 */
async function guardTokens() {
  const state = store.getState();
  const { token: jwtToken } = state.authSession || {};
  const { fhirToken } = state.fhir || {};

  let validJWTToken = jwtToken;
  let validFhirToken = fhirToken;
  let isValid = true;

  // Check and refresh JWT token
  if (isTokenExpired(jwtToken)) {
    console.log('🔄 JWT token expired, refreshing...');
    validJWTToken = await refreshJWTToken();
    if (!validJWTToken) {
      isValid = false;
    }
  }

  // Check and refresh FHIR token
  if (fhirToken && isTokenExpired(fhirToken)) {
    console.log('🔄 FHIR token expired, refreshing...');
    validFhirToken = await refreshFHIRToken();
    if (!validFhirToken) {
      console.warn('⚠️  FHIR token refresh failed');
      // Continue anyway - FHIR operations might still work
    }
  }

  return {
    jwtToken: validJWTToken,
    fhirToken: validFhirToken,
    isValid: isValid && validJWTToken
  };
}

/**
 * Wrap an async function with token guard
 * Usage: const result = await withTokenGuard(async (tokens) => { ... })
 */
export function withTokenGuard(asyncFn) {
  return async function guardedFn(...args) {
    const tokens = await guardTokens();
    if (!tokens.isValid) {
      throw new Error('Authentication failed: JWT token is not available');
    }
    return asyncFn(...args, tokens);
  };
}

export default {
  isTokenExpired,
  refreshJWTToken,
  refreshFHIRToken,
  guardTokens,
  withTokenGuard
};
