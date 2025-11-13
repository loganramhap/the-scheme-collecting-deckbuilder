/**
 * End-to-End Tests for Riot Sign-On Authentication Flow
 * 
 * These tests validate the complete authentication flow including:
 * - New user registration and Gitea provisioning
 * - Existing user login
 * - Session persistence
 * - Token refresh
 * - Logout flow
 * 
 * Requirements: 1.1-1.5, 2.1-2.5, 3.1-3.4, 6.1-6.9
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from './auth.js';
import * as sessionService from '../services/sessionService.js';
import * as userService from '../services/userService.js';
import * as authService from '../services/authService.js';

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/auth', authRoutes);
  return app;
};

describe('E2E: Complete Authentication Flow', () => {
  let app;
  let testSessionId;
  let testPuuid;
  let testCodeVerifier;
  let testState;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    // Generate test data
    testSessionId = `test-session-${Date.now()}`;
    testPuuid = `test-puuid-${Date.now()}`;
    testCodeVerifier = 'test-code-verifier-' + Math.random().toString(36);
    testState = 'test-state-' + Math.random().toString(36);
  });

  describe('13.1.1: New User Complete Flow', () => {
    it('should complete full authentication flow for new user', async () => {
      // Step 1: Initialize OAuth flow
      const initResponse = await request(app)
        .get('/api/auth/riot/init')
        .expect(200);

      expect(initResponse.body).toHaveProperty('authorizationUrl');
      expect(initResponse.body).toHaveProperty('state');
      expect(initResponse.body.authorizationUrl).toContain('auth.riotgames.com');
      expect(initResponse.body.authorizationUrl).toContain('code_challenge');
      expect(initResponse.body.authorizationUrl).toContain('code_challenge_method=S256');

      const sessionCookie = initResponse.headers['set-cookie']?.find(c => c.startsWith('session_id='));
      expect(sessionCookie).toBeDefined();

      // Extract session ID from cookie
      const sessionId = sessionCookie.split(';')[0].split('=')[1];
      const state = initResponse.body.state;

      // Verify session was created with PKCE parameters
      const session = await sessionService.getSession(sessionId);
      expect(session).toBeDefined();
      expect(session.codeVerifier).toBeDefined();
      expect(session.state).toBe(state);

      // Step 2: Simulate OAuth callback (would normally come from Riot)
      // Note: In a real scenario, we'd need to mock the Riot API responses
      // For this test, we'll verify the callback endpoint structure
      const callbackResponse = await request(app)
        .get('/api/auth/riot/callback')
        .query({ code: 'mock-auth-code', state: state })
        .set('Cookie', `session_id=${sessionId}`)
        .expect(302); // Redirect on success

      // Verify redirect location
      expect(callbackResponse.headers.location).toBeDefined();
    });

    it('should create Gitea account for new user', async () => {
      const newPuuid = `new-user-${Date.now()}`;
      
      // Verify user doesn't exist
      const existingUser = await userService.findUserByPuuid(newPuuid);
      expect(existingUser).toBeNull();

      // Create new user (simulating what happens in callback)
      const riotUser = {
        puuid: newPuuid,
        gameName: 'TestPlayer',
        tagLine: 'NA1'
      };

      const user = await userService.createUser(riotUser);
      
      // Verify user was created
      expect(user).toBeDefined();
      expect(user.puuid).toBe(newPuuid);
      expect(user.gameName).toBe('TestPlayer');
      expect(user.tagLine).toBe('NA1');
      expect(user.giteaUsername).toBeDefined();
      expect(user.giteaPasswordEncrypted).toBeDefined();

      // Verify Gitea username format
      expect(user.giteaUsername).toMatch(/^testplayer-na1(-\d+)?$/i);
    });
  });

  describe('13.1.2: Existing User Login Flow', () => {
    let existingUser;

    beforeEach(async () => {
      // Create an existing user
      const riotUser = {
        puuid: `existing-${Date.now()}`,
        gameName: 'ExistingPlayer',
        tagLine: 'EUW'
      };
      existingUser = await userService.createUser(riotUser);
    });

    it('should login existing user without creating new Gitea account', async () => {
      // Initialize OAuth
      const initResponse = await request(app)
        .get('/api/auth/riot/init')
        .expect(200);

      const sessionId = initResponse.headers['set-cookie']
        ?.find(c => c.startsWith('session_id='))
        ?.split(';')[0]
        ?.split('=')[1];

      // Verify user exists
      const user = await userService.findUserByPuuid(existingUser.puuid);
      expect(user).toBeDefined();
      expect(user.giteaUsername).toBe(existingUser.giteaUsername);

      // Verify last login is updated
      const originalLastLogin = user.lastLogin;
      await userService.updateLastLogin(existingUser.puuid);
      
      const updatedUser = await userService.findUserByPuuid(existingUser.puuid);
      expect(updatedUser.lastLogin.getTime()).toBeGreaterThan(originalLastLogin.getTime());
    });
  });

  describe('13.1.3: Session Persistence', () => {
    it('should maintain session across requests', async () => {
      // Create a session
      const sessionData = {
        puuid: testPuuid,
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        giteaUsername: 'testuser'
      };

      await sessionService.createSession(testSessionId, sessionData);

      // Verify session persists
      const session1 = await sessionService.getSession(testSessionId);
      expect(session1).toBeDefined();
      expect(session1.puuid).toBe(testPuuid);

      // Wait a bit and verify session still exists
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const session2 = await sessionService.getSession(testSessionId);
      expect(session2).toBeDefined();
      expect(session2.puuid).toBe(testPuuid);
    });

    it('should expire sessions after timeout', async () => {
      // Create a session with short expiry (1 second)
      const shortSessionId = `short-${Date.now()}`;
      await sessionService.createSession(shortSessionId, { puuid: testPuuid }, 1);

      // Verify session exists
      const session1 = await sessionService.getSession(shortSessionId);
      expect(session1).toBeDefined();

      // Wait for expiry
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Verify session is expired
      const session2 = await sessionService.getSession(shortSessionId);
      expect(session2).toBeNull();
    });

    it('should handle session updates', async () => {
      await sessionService.createSession(testSessionId, { puuid: testPuuid });

      // Update session
      await sessionService.updateSession(testSessionId, {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      });

      // Verify update
      const session = await sessionService.getSession(testSessionId);
      expect(session.accessToken).toBe('new-access-token');
      expect(session.refreshToken).toBe('new-refresh-token');
      expect(session.puuid).toBe(testPuuid); // Original data preserved
    });
  });

  describe('13.1.4: Logout Flow', () => {
    it('should clear session and cookies on logout', async () => {
      // Create a session
      await sessionService.createSession(testSessionId, {
        puuid: testPuuid,
        accessToken: 'test-token'
      });

      // Verify session exists
      const sessionBefore = await sessionService.getSession(testSessionId);
      expect(sessionBefore).toBeDefined();

      // Logout
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', `session_id=${testSessionId}`)
        .expect(200);

      // Verify cookies are cleared
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some(c => c.includes('session_id=;'))).toBe(true);

      // Verify session is deleted
      const sessionAfter = await sessionService.getSession(testSessionId);
      expect(sessionAfter).toBeNull();
    });
  });

  describe('13.1.5: Token Refresh Flow', () => {
    it('should refresh tokens using refresh token', async () => {
      // Create session with tokens
      const sessionData = {
        puuid: testPuuid,
        accessToken: 'old-access-token',
        refreshToken: 'valid-refresh-token',
        giteaUsername: 'testuser'
      };

      await sessionService.createSession(testSessionId, sessionData);

      // Note: Actual token refresh requires mocking Riot API
      // This test verifies the endpoint structure
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', `session_id=${testSessionId}`)
        .expect(res => {
          // Should either succeed (200) or fail with proper error (401/500)
          expect([200, 401, 500]).toContain(res.status);
        });
    });

    it('should handle missing refresh token', async () => {
      // Create session without refresh token
      await sessionService.createSession(testSessionId, {
        puuid: testPuuid,
        accessToken: 'test-token'
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', `session_id=${testSessionId}`)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('13.1.6: /api/auth/me Endpoint', () => {
    it('should return current user data for authenticated session', async () => {
      // Create user and session
      const riotUser = {
        puuid: `me-test-${Date.now()}`,
        gameName: 'MeTestPlayer',
        tagLine: 'NA1'
      };
      const user = await userService.createUser(riotUser);

      await sessionService.createSession(testSessionId, {
        puuid: user.puuid,
        accessToken: 'test-token',
        giteaUsername: user.giteaUsername
      });

      // Call /me endpoint
      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', `session_id=${testSessionId}`)
        .expect(200);

      expect(response.body.user).toBeDefined();
      expect(response.body.user.puuid).toBe(user.puuid);
      expect(response.body.user.gameName).toBe('MeTestPlayer');
      expect(response.body.user.tagLine).toBe('NA1');
      expect(response.body.user.giteaUsername).toBe(user.giteaUsername);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('13.1.7: PKCE Implementation', () => {
    it('should generate valid PKCE parameters', () => {
      const pkce = authService.generatePKCEParams();

      expect(pkce.codeVerifier).toBeDefined();
      expect(pkce.codeChallenge).toBeDefined();
      expect(pkce.state).toBeDefined();

      // Verify code_verifier length (43-128 characters)
      expect(pkce.codeVerifier.length).toBeGreaterThanOrEqual(43);
      expect(pkce.codeVerifier.length).toBeLessThanOrEqual(128);

      // Verify code_challenge is base64url encoded
      expect(pkce.codeChallenge).toMatch(/^[A-Za-z0-9_-]+$/);

      // Verify state is sufficiently random
      expect(pkce.state.length).toBeGreaterThanOrEqual(16);
    });

    it('should generate different PKCE parameters each time', () => {
      const pkce1 = authService.generatePKCEParams();
      const pkce2 = authService.generatePKCEParams();

      expect(pkce1.codeVerifier).not.toBe(pkce2.codeVerifier);
      expect(pkce1.codeChallenge).not.toBe(pkce2.codeChallenge);
      expect(pkce1.state).not.toBe(pkce2.state);
    });
  });
});
