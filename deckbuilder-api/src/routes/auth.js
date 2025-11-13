import express from 'express';
import authService from '../services/authService.js';
import sessionService from '../services/sessionService.js';
import userService from '../services/userService.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import monitoringService from '../services/monitoringService.js';

const router = express.Router();

// Apply rate limiting to all auth routes
router.use(authRateLimiter);

// Initialize Riot OAuth flow
router.get('/riot/init', async (req, res) => {
  try {
    // Generate PKCE parameters
    const pkceParams = authService.generatePKCE();
    
    // Generate session ID
    const sessionId = authService.generateSessionId();
    
    // Store code_verifier and state in session
    await sessionService.createSession(sessionId, {
      codeVerifier: pkceParams.codeVerifier,
      state: pkceParams.state,
    });
    
    // Set session cookie
    res.cookie('session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000, // 10 minutes for OAuth flow
    });
    
    // Build authorization URL
    const authorizationUrl = authService.getAuthorizationUrl(
      pkceParams.codeChallenge,
      pkceParams.state
    );
    
    res.json({
      authorizationUrl,
      state: pkceParams.state,
    });
  } catch (error) {
    console.error('Failed to initialize OAuth flow:', error);
    res.status(500).json({ error: 'Failed to initialize authentication' });
  }
});

// Handle Riot OAuth callback
router.get('/riot/callback', async (req, res) => {
  const { code, state, error: oauthError, error_description } = req.query;
  const sessionId = req.cookies?.session_id;
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('user-agent');
  
  // Log authentication attempt
  monitoringService.logAuthAttempt({ ip, userAgent });
  
  // Handle OAuth errors (user denied, etc.)
  if (oauthError) {
    monitoringService.logOAuthError({
      error: oauthError,
      errorDescription: error_description,
      state,
      ip
    });
    return res.status(400).json({ 
      error: oauthError,
      message: error_description || 'OAuth authorization failed'
    });
  }
  
  if (!code || !state) {
    monitoringService.logAuthFailure({
      reason: 'Missing code or state parameter',
      ip,
      userAgent
    });
    return res.status(400).json({ error: 'Missing code or state parameter' });
  }
  
  if (!sessionId) {
    monitoringService.logAuthFailure({
      reason: 'No session found',
      ip,
      userAgent
    });
    return res.status(400).json({ error: 'No session found' });
  }
  
  try {
    // Retrieve session data
    const sessionData = await sessionService.getSession(sessionId);
    
    if (!sessionData) {
      monitoringService.logAuthFailure({
        reason: 'Invalid session',
        ip,
        userAgent
      });
      return res.status(400).json({ error: 'Invalid session' });
    }
    
    // Validate state parameter
    if (sessionData.state !== state) {
      monitoringService.logPKCEValidationFailure({
        reason: 'State parameter mismatch',
        sessionId,
        ip
      });
      return res.status(400).json({ error: 'Invalid state parameter' });
    }
    
    // Exchange code for tokens
    const tokens = await authService.exchangeCodeForTokens(
      code,
      sessionData.codeVerifier
    );
    
    // Fetch user info from Riot
    const riotUser = await authService.getUserInfo(tokens.accessToken);
    
    // Check if user exists or create new user
    let user = await userService.findUserByPuuid(riotUser.puuid);
    const isNewUser = !user;
    
    if (!user) {
      // Create new user and provision Gitea account
      try {
        user = await userService.createUser(riotUser);
        monitoringService.logNewUserRegistration({
          puuid: user.puuid,
          gameName: user.gameName,
          tagLine: user.tagLine,
          giteaUsername: user.giteaUsername
        });
      } catch (provisionError) {
        monitoringService.logGiteaProvisioningFailure({
          puuid: riotUser.puuid,
          gameName: riotUser.gameName,
          reason: provisionError.message,
          error: provisionError
        });
        throw provisionError;
      }
    } else {
      // Update last login
      await userService.updateLastLogin(riotUser.puuid);
    }
    
    // Update session with user data and tokens
    await sessionService.updateSession(sessionId, {
      puuid: user.puuid,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      giteaUsername: user.giteaUsername,
    });
    
    // Log session creation
    monitoringService.logSessionCreation({
      sessionId,
      puuid: user.puuid
    });
    
    // Set auth cookies with longer expiration
    sessionService.setAuthCookies(res, tokens, user.puuid, sessionId);
    
    // Log successful authentication
    monitoringService.logAuthSuccess({
      puuid: user.puuid,
      gameName: user.gameName,
      tagLine: user.tagLine,
      isNewUser,
      ip
    });
    
    res.json({
      success: true,
      user: {
        puuid: user.puuid,
        gameName: user.gameName,
        tagLine: user.tagLine,
        giteaUsername: user.giteaUsername,
      },
    });
  } catch (error) {
    console.error('OAuth callback failed:', error);
    monitoringService.logAuthFailure({
      reason: 'Token exchange or user creation failed',
      error,
      ip,
      userAgent
    });
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Refresh access token
router.post('/refresh', async (req, res) => {
  const sessionId = req.cookies?.session_id;
  
  if (!sessionId) {
    return res.status(401).json({ error: 'No session found' });
  }
  
  try {
    // Retrieve session data
    const sessionData = await sessionService.getSession(sessionId);
    
    if (!sessionData || !sessionData.refreshToken) {
      monitoringService.logTokenRefreshFailure({
        puuid: sessionData?.puuid,
        reason: 'Invalid session or missing refresh token'
      });
      return res.status(401).json({ error: 'Invalid session' });
    }
    
    // Refresh access token
    const tokens = await authService.refreshAccessToken(sessionData.refreshToken);
    
    // Update session with new tokens
    await sessionService.updateSession(sessionId, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
    
    // Update auth cookies
    sessionService.setAuthCookies(res, tokens, sessionData.puuid, sessionId);
    
    // Log successful token refresh
    monitoringService.logTokenRefresh({
      puuid: sessionData.puuid
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Token refresh failed:', error);
    
    // Log token refresh failure
    const sessionData = await sessionService.getSession(sessionId).catch(() => null);
    monitoringService.logTokenRefreshFailure({
      puuid: sessionData?.puuid,
      reason: error.message,
      error
    });
    
    // Clear session on refresh failure
    if (sessionId) {
      await sessionService.deleteSession(sessionId);
      sessionService.clearAuthCookies(res);
    }
    
    res.status(401).json({ error: 'Token refresh failed' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  const sessionId = req.cookies?.session_id;
  
  if (!sessionId) {
    return res.json({ success: true });
  }
  
  try {
    // Retrieve session data
    const sessionData = await sessionService.getSession(sessionId);
    
    if (sessionData?.accessToken) {
      // Revoke tokens with Riot
      try {
        await authService.revokeTokens(sessionData.accessToken);
      } catch (error) {
        console.error('Token revocation failed:', error);
        // Continue with logout even if revocation fails
      }
    }
    
    // Log logout
    if (sessionData?.puuid) {
      monitoringService.logLogout({
        puuid: sessionData.puuid,
        sessionId
      });
    }
    
    // Delete session
    await sessionService.deleteSession(sessionId);
    
    // Clear cookies
    sessionService.clearAuthCookies(res);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Logout failed:', error);
    
    // Clear cookies even on error
    sessionService.clearAuthCookies(res);
    
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  const sessionId = req.cookies?.session_id;
  
  if (!sessionId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    // Retrieve session data
    const sessionData = await sessionService.getSession(sessionId);
    
    if (!sessionData || !sessionData.puuid) {
      return res.status(401).json({ error: 'Invalid session' });
    }
    
    // Get user data
    const user = await userService.findUserByPuuid(sessionData.puuid);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    res.json({
      user: {
        puuid: user.puuid,
        gameName: user.gameName,
        tagLine: user.tagLine,
        giteaUsername: user.giteaUsername,
        summonerIcon: user.summonerIcon,
      },
    });
  } catch (error) {
    console.error('Failed to get current user:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

// Get authentication metrics (admin only - add auth middleware in production)
router.get('/metrics', async (req, res) => {
  try {
    const metrics = monitoringService.getMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Failed to get metrics:', error);
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// Get recent errors (admin only - add auth middleware in production)
router.get('/metrics/errors', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const errors = monitoringService.getRecentErrors(limit);
    res.json({ errors, count: errors.length });
  } catch (error) {
    console.error('Failed to get recent errors:', error);
    res.status(500).json({ error: 'Failed to get errors' });
  }
});

// Get monitoring health status
router.get('/metrics/health', async (req, res) => {
  try {
    const health = monitoringService.getHealthStatus();
    res.json(health);
  } catch (error) {
    console.error('Failed to get health status:', error);
    res.status(500).json({ error: 'Failed to get health status' });
  }
});

export default router;
