import crypto from 'crypto';
import axios from 'axios';

/**
 * PKCE Utility Functions
 */

/**
 * Generate a cryptographically secure code_verifier
 * @returns {string} A random string of 43-128 characters
 */
export function generateCodeVerifier() {
  // Generate 32 random bytes and convert to base64url
  // This produces a 43-character string
  return base64URLEncode(crypto.randomBytes(32));
}

/**
 * Generate SHA-256 code_challenge from code_verifier
 * @param {string} codeVerifier - The code verifier
 * @returns {string} The base64url-encoded SHA-256 hash
 */
export function generateCodeChallenge(codeVerifier) {
  const hash = crypto.createHash('sha256').update(codeVerifier).digest();
  return base64URLEncode(hash);
}

/**
 * Generate a secure random state parameter
 * @returns {string} A random state string
 */
export function generateState() {
  // Generate 16 random bytes for state parameter
  return base64URLEncode(crypto.randomBytes(16));
}

/**
 * Generate complete PKCE parameters
 * @returns {Object} Object containing codeVerifier, codeChallenge, and state
 */
export function generatePKCEParams() {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state = generateState();

  return {
    codeVerifier,
    codeChallenge,
    state,
  };
}

/**
 * Helper function to convert buffer to base64url encoding
 * @param {Buffer} buffer - The buffer to encode
 * @returns {string} Base64url-encoded string
 */
function base64URLEncode(buffer) {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * OAuth Token Exchange Functions
 */

/**
 * Exchange authorization code for access and refresh tokens
 * @param {string} code - Authorization code from OAuth callback
 * @param {string} codeVerifier - The code verifier used in PKCE
 * @returns {Promise<Object>} Token response with access_token, refresh_token, expires_in
 */
export async function exchangeCodeForTokens(code, codeVerifier) {
  const RIOT_TOKEN_URL = process.env.RIOT_TOKEN_URL || 'https://auth.riotgames.com/token';
  const RIOT_CLIENT_ID = process.env.RIOT_CLIENT_ID;
  const RIOT_CLIENT_SECRET = process.env.RIOT_CLIENT_SECRET;
  const RIOT_REDIRECT_URI = process.env.RIOT_REDIRECT_URI;

  try {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: RIOT_REDIRECT_URI,
      client_id: RIOT_CLIENT_ID,
      client_secret: RIOT_CLIENT_SECRET,
      code_verifier: codeVerifier,
    });

    const response = await axios.post(RIOT_TOKEN_URL, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 10000, // 10 second timeout
    });

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
      tokenType: response.data.token_type,
      scope: response.data.scope,
    };
  } catch (error) {
    console.error('Token exchange failed:', error.response?.data || error.message);
    
    // Retry logic for network errors
    if (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND') {
      console.log('Retrying token exchange...');
      await sleep(1000);
      return exchangeCodeForTokens(code, codeVerifier);
    }

    throw new Error(`Token exchange failed: ${error.response?.data?.error || error.message}`);
  }
}

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - The refresh token
 * @returns {Promise<Object>} New token response
 */
export async function refreshAccessToken(refreshToken) {
  const RIOT_TOKEN_URL = process.env.RIOT_TOKEN_URL || 'https://auth.riotgames.com/token';
  const RIOT_CLIENT_ID = process.env.RIOT_CLIENT_ID;
  const RIOT_CLIENT_SECRET = process.env.RIOT_CLIENT_SECRET;

  try {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: RIOT_CLIENT_ID,
      client_secret: RIOT_CLIENT_SECRET,
    });

    const response = await axios.post(RIOT_TOKEN_URL, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 10000,
    });

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
      tokenType: response.data.token_type,
      scope: response.data.scope,
    };
  } catch (error) {
    console.error('Token refresh failed:', error.response?.data || error.message);
    
    // Retry logic for network errors
    if (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND') {
      console.log('Retrying token refresh...');
      await sleep(1000);
      return refreshAccessToken(refreshToken);
    }

    throw new Error(`Token refresh failed: ${error.response?.data?.error || error.message}`);
  }
}

/**
 * Revoke access token on logout
 * @param {string} accessToken - The access token to revoke
 * @returns {Promise<void>}
 */
export async function revokeToken(accessToken) {
  const RIOT_TOKEN_URL = process.env.RIOT_TOKEN_URL || 'https://auth.riotgames.com/token';
  const RIOT_CLIENT_ID = process.env.RIOT_CLIENT_ID;
  const RIOT_CLIENT_SECRET = process.env.RIOT_CLIENT_SECRET;

  try {
    // Note: Riot's token revocation endpoint may vary
    // This is a placeholder implementation
    const params = new URLSearchParams({
      token: accessToken,
      client_id: RIOT_CLIENT_ID,
      client_secret: RIOT_CLIENT_SECRET,
    });

    await axios.post(`${RIOT_TOKEN_URL}/revoke`, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 5000,
    });

    console.log('Token revoked successfully');
  } catch (error) {
    // Log but don't throw - revocation failure shouldn't block logout
    console.error('Token revocation failed:', error.response?.data || error.message);
  }
}

/**
 * Riot User Info Functions
 */

/**
 * Fetch user profile from Riot API
 * @param {string} accessToken - The access token
 * @returns {Promise<Object>} User info with puuid, gameName, tagLine
 */
export async function getUserInfo(accessToken) {
  const RIOT_USERINFO_URL = process.env.RIOT_USERINFO_URL || 'https://auth.riotgames.com/userinfo';

  try {
    const response = await axios.get(RIOT_USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      timeout: 10000,
    });

    return {
      puuid: response.data.puuid,
      gameName: response.data.game_name || response.data.gameName,
      tagLine: response.data.tag_line || response.data.tagLine,
    };
  } catch (error) {
    console.error('Failed to fetch user info:', error.response?.data || error.message);
    
    // Retry logic for network errors
    if (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND') {
      console.log('Retrying user info fetch...');
      await sleep(1000);
      return getUserInfo(accessToken);
    }

    // Handle specific API errors
    if (error.response?.status === 401) {
      throw new Error('Invalid or expired access token');
    }

    if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    throw new Error(`Failed to fetch user info: ${error.response?.data?.error || error.message}`);
  }
}

/**
 * Build authorization URL for OAuth flow
 * @param {string} codeChallenge - The PKCE code challenge
 * @param {string} state - The state parameter
 * @returns {string} The authorization URL
 */
export function getAuthorizationUrl(codeChallenge, state) {
  const authUrl = process.env.RIOT_AUTHORIZATION_URL || 'https://auth.riotgames.com/authorize';
  const RIOT_CLIENT_ID = process.env.RIOT_CLIENT_ID;
  const RIOT_REDIRECT_URI = process.env.RIOT_REDIRECT_URI;
  
  const params = new URLSearchParams({
    client_id: RIOT_CLIENT_ID,
    redirect_uri: RIOT_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid', // Adjust scopes as needed
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
  });

  return `${authUrl}?${params.toString()}`;
}

/**
 * Generate a unique session ID
 * @returns {string} A UUID v4 session ID
 */
export function generateSessionId() {
  return crypto.randomUUID();
}

/**
 * Helper function to sleep for a specified duration
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Default export with all methods
export default {
  generatePKCE: generatePKCEParams,
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  generateSessionId,
  exchangeCodeForTokens,
  refreshAccessToken,
  revokeTokens: revokeToken,
  getUserInfo,
  getAuthorizationUrl,
};
