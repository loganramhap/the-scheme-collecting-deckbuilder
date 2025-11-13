import crypto from 'crypto';
import { TABLES, getItem, putItem, updateItem, deleteItem } from '../db/config.js';

/**
 * Session Service
 * Handles session management and httpOnly cookie operations
 */

// Session expiry duration (default 24 hours)
const SESSION_EXPIRY = parseInt(process.env.SESSION_EXPIRY || '86400', 10);

/**
 * Generate a secure session ID
 * @returns {string} UUID v4 session ID
 */
export function generateSessionId() {
  return crypto.randomUUID();
}

/**
 * Create a new session
 * @param {string} sessionId - Session ID
 * @param {Object} data - Session data
 * @returns {Promise<void>}
 */
export async function createSession(sessionId, data = {}) {
  try {
    const now = Date.now();
    const expiresAt = Math.floor(now / 1000) + SESSION_EXPIRY; // Unix timestamp in seconds
    
    const sessionRecord = {
      sessionId,
      data,
      expiresAt,
      createdAt: new Date(now).toISOString(),
    };
    
    await putItem(TABLES.SESSIONS, sessionRecord);
    console.log(`Session created: ${sessionId}`);
  } catch (error) {
    console.error('Error creating session:', error);
    throw new Error('Failed to create session');
  }
}

/**
 * Get session data
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object|null>} Session data or null if not found/expired
 */
export async function getSession(sessionId) {
  try {
    const session = await getItem(TABLES.SESSIONS, { sessionId });
    
    if (!session) {
      return null;
    }
    
    // Check if session is expired
    const now = Math.floor(Date.now() / 1000);
    if (session.expiresAt < now) {
      // Session expired, delete it
      await deleteSession(sessionId);
      return null;
    }
    
    return session.data;
  } catch (error) {
    console.error('Error getting session:', error);
    throw new Error('Failed to get session');
  }
}

/**
 * Update session data
 * @param {string} sessionId - Session ID
 * @param {Object} data - Partial session data to update
 * @returns {Promise<void>}
 */
export async function updateSession(sessionId, data) {
  try {
    // Get existing session
    const existingSession = await getItem(TABLES.SESSIONS, { sessionId });
    
    if (!existingSession) {
      throw new Error('Session not found');
    }
    
    // Merge new data with existing data
    const updatedData = {
      ...existingSession.data,
      ...data,
    };
    
    // Update session
    await updateItem(
      TABLES.SESSIONS,
      { sessionId },
      { data: updatedData }
    );
    
    console.log(`Session updated: ${sessionId}`);
  } catch (error) {
    console.error('Error updating session:', error);
    throw new Error('Failed to update session');
  }
}

/**
 * Delete a session
 * @param {string} sessionId - Session ID
 * @returns {Promise<void>}
 */
export async function deleteSession(sessionId) {
  try {
    await deleteItem(TABLES.SESSIONS, { sessionId });
    console.log(`Session deleted: ${sessionId}`);
  } catch (error) {
    console.error('Error deleting session:', error);
    throw new Error('Failed to delete session');
  }
}

/**
 * Validate session and return data
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object|null>} Session data or null if invalid
 */
export async function validateSession(sessionId) {
  if (!sessionId) {
    return null;
  }
  
  try {
    const sessionData = await getSession(sessionId);
    return sessionData;
  } catch (error) {
    console.error('Error validating session:', error);
    return null;
  }
}

/**
 * Set authentication cookies
 * @param {Object} res - Express response object
 * @param {Object} tokens - Token object with accessToken and refreshToken
 * @param {string} puuid - User PUUID
 * @param {string} sessionId - Session ID
 * @returns {void}
 */
export function setAuthCookies(res, tokens, puuid, sessionId) {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict',
    maxAge: SESSION_EXPIRY * 1000, // Convert to milliseconds
    path: '/',
  };
  
  // Set session ID cookie
  res.cookie('session_id', sessionId, cookieOptions);
  
  // Note: We store tokens in the session data, not as separate cookies
  // This is more secure as tokens are stored server-side
  console.log('Auth cookies set');
}

/**
 * Clear authentication cookies
 * @param {Object} res - Express response object
 * @returns {void}
 */
export function clearAuthCookies(res) {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  };
  
  res.clearCookie('session_id', cookieOptions);
  console.log('Auth cookies cleared');
}

/**
 * Get session ID from request cookies
 * @param {Object} req - Express request object
 * @returns {string|null} Session ID or null
 */
export function getSessionIdFromRequest(req) {
  return req.cookies?.sessionId || null;
}

/**
 * Extend session expiry
 * @param {string} sessionId - Session ID
 * @returns {Promise<void>}
 */
export async function extendSession(sessionId) {
  try {
    const now = Math.floor(Date.now() / 1000);
    const newExpiresAt = now + SESSION_EXPIRY;
    
    await updateItem(
      TABLES.SESSIONS,
      { sessionId },
      { expiresAt: newExpiresAt }
    );
    
    console.log(`Session extended: ${sessionId}`);
  } catch (error) {
    console.error('Error extending session:', error);
    throw new Error('Failed to extend session');
  }
}

/**
 * Clean up expired sessions (for background job)
 * @returns {Promise<number>} Number of sessions deleted
 */
export async function cleanupExpiredSessions() {
  // Note: DynamoDB TTL will automatically delete expired sessions
  // This function is provided for manual cleanup if needed
  console.log('Session cleanup is handled automatically by DynamoDB TTL');
  return 0;
}

// Default export with all methods
export default {
  generateSessionId,
  createSession,
  getSession,
  updateSession,
  deleteSession,
  validateSession,
  setAuthCookies,
  clearAuthCookies,
  getSessionIdFromRequest,
  extendSession,
  cleanupExpiredSessions,
};
