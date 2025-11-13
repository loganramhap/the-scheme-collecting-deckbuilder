import sessionService from '../services/sessionService.js';
import authService from '../services/authService.js';

/**
 * Authentication Middleware
 * Validates session cookies and handles automatic token refresh
 */

/**
 * Middleware to validate session and authenticate requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export async function authenticateRequest(req, res, next) {
  const sessionId = req.cookies?.session_id;
  
  if (!sessionId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    // Get session data
    const sessionData = await sessionService.getSession(sessionId);
    
    if (!sessionData || !sessionData.puuid) {
      return res.status(401).json({ error: 'Invalid session' });
    }
    
    // Attach session data to request
    req.session = sessionData;
    req.sessionId = sessionId;
    
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Middleware to validate session and automatically refresh expired tokens
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export async function authenticateWithRefresh(req, res, next) {
  const sessionId = req.cookies?.session_id;
  
  if (!sessionId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    // Get session data
    const sessionData = await sessionService.getSession(sessionId);
    
    if (!sessionData || !sessionData.puuid) {
      return res.status(401).json({ error: 'Invalid session' });
    }
    
    // Check if access token is expired (simplified check)
    // In production, you'd want to decode the JWT and check expiry
    // For now, we'll attempt to refresh if the token is missing
    if (!sessionData.accessToken && sessionData.refreshToken) {
      try {
        // Attempt to refresh token
        const tokens = await authService.refreshAccessToken(sessionData.refreshToken);
        
        // Update session with new tokens
        await sessionService.updateSession(sessionId, {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        });
        
        // Update cookies
        sessionService.setAuthCookies(res, tokens, sessionData.puuid, sessionId);
        
        // Update session data in request
        sessionData.accessToken = tokens.accessToken;
        sessionData.refreshToken = tokens.refreshToken;
        
        console.log('Token automatically refreshed');
      } catch (refreshError) {
        console.error('Automatic token refresh failed:', refreshError);
        
        // Clear session on refresh failure
        await sessionService.deleteSession(sessionId);
        sessionService.clearAuthCookies(res);
        
        return res.status(401).json({ 
          error: 'Session expired',
          requiresReauth: true,
        });
      }
    }
    
    // Attach session data to request
    req.session = sessionData;
    req.sessionId = sessionId;
    
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Optional authentication middleware
 * Attaches session data if available but doesn't require authentication
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export async function optionalAuth(req, res, next) {
  const sessionId = req.cookies?.session_id;
  
  if (!sessionId) {
    req.session = null;
    req.sessionId = null;
    return next();
  }
  
  try {
    const sessionData = await sessionService.getSession(sessionId);
    
    if (sessionData && sessionData.puuid) {
      req.session = sessionData;
      req.sessionId = sessionId;
    } else {
      req.session = null;
      req.sessionId = null;
    }
    
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    req.session = null;
    req.sessionId = null;
    next();
  }
}

/**
 * Middleware to check if session is expired and needs refresh
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export async function checkSessionExpiry(req, res, next) {
  const sessionId = req.cookies?.session_id;
  
  if (!sessionId) {
    return next();
  }
  
  try {
    const sessionData = await sessionService.getSession(sessionId);
    
    // If session is null, it's expired
    if (!sessionData) {
      sessionService.clearAuthCookies(res);
      return res.status(401).json({ 
        error: 'Session expired',
        requiresReauth: true,
      });
    }
    
    next();
  } catch (error) {
    console.error('Session expiry check error:', error);
    next();
  }
}

export default {
  authenticateRequest,
  authenticateWithRefresh,
  optionalAuth,
  checkSessionExpiry,
};
