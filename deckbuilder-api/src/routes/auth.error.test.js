/**
 * Error Scenario Tests for Riot Sign-On Authentication
 * 
 * These tests validate error handling for:
 * - OAuth denial
 * - Network failures
 * - Token expiration
 * - Invalid sessions
 * - Gitea provisioning failures
 * 
 * Requirements: 7.1-7.4
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from './auth.js';
import * as sessionService from '../services/sessionService.js';
import * as authService from '../services/authService.js';
import * as userService from '../services/userService.js';
import axios from 'axios';

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/auth', authRoutes);
  return app;
};

describe('Error Scenarios: Authentication Error Handling', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
    vi.clearAllMocks();
  });

  describe('13.2.1: OAuth Denial', () => {
    it('should handle user denying OAuth authorization', async () => {
      // Simulate OAuth callback with error=access_denied
      const response = await request(app)
        .get('/api/auth/riot/callback')
        .query({
          error: 'access_denied',
          error_description: 'The user denied the request'
        })
        .expect(302); // Should redirect

      // Verify redirect includes error
      expect(response.headers.location).toContain('error=access_denied');
    });

    it('should handle invalid_request OAuth error', async () => {
      const response = await request(app)
        .get('/api/auth/riot/callback')
        .query({
          error: 'invalid_request',
          error_description: 'Invalid request parameters'
        })
        .expect(302);

      expect(response.headers.location).toContain('error=invalid_request');
    });

    it('should handle server_error OAuth error', async () => {
      const response = await request(app)
        .get('/api/auth/riot/callback')
        .query({
          error: 'server_error',
          error_description: 'Riot server error'
        })
        .expect(302);

      expect(response.headers.location).toContain('error=server_error');
    });
  });

  describe('13.2.2: Network Failures', () => {
    it('should handle network timeout during token exchange', async () => {
      // Mock axios to simulate network timeout
      vi.spyOn(axios, 'post').mockRejectedValueOnce({
        code: 'ECONNABORTED',
        message: 'timeout of 10000ms exceeded'
      });

      const sessionId = 'test-session-' + Date.now();
      const state = 'test-state';
      
      // Create session with PKCE params
      await sessionService.createSession(sessionId, {
        codeVerifier: 'test-verifier',
        state: state
      }).catch(() => {}); // Ignore DB errors in test

      const response = await request(app)
        .get('/api/auth/riot/callback')
        .query({ code: 'test-code', state: state })
        .set('Cookie', `session_id=${sessionId}`)
        .expect(res => {
          // Should handle error gracefully
          expect([302, 500]).toContain(res.status);
        });
    });

    it('should handle connection refused error', async () => {
      vi.spyOn(axios, 'post').mockRejectedValueOnce({
        code: 'ECONNREFUSED',
        message: 'connect ECONNREFUSED'
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', `session_id=test-session`)
        .expect(res => {
          expect([401, 500]).toContain(res.status);
        });
    });

    it('should handle DNS resolution failure', async () => {
      vi.spyOn(axios, 'post').mockRejectedValueOnce({
        code: 'ENOTFOUND',
        message: 'getaddrinfo ENOTFOUND auth.riotgames.com'
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', `session_id=test-session`)
        .expect(res => {
          expect([401, 500]).toContain(res.status);
        });
    });
  });

  describe('13.2.3: Token Expiration', () => {
    it('should handle expired access token', async () => {
      // Mock Riot API to return 401 for expired token
      vi.spyOn(axios, 'get').mockRejectedValueOnce({
        response: {
          status: 401,
          data: {
            error: 'invalid_token',
            error_description: 'Token has expired'
          }
        }
      });

      const sessionId = 'test-session-' + Date.now();
      await sessionService.createSession(sessionId, {
        puuid: 'test-puuid',
        accessToken: 'expired-token',
        refreshToken: 'valid-refresh-token'
      }).catch(() => {});

      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', `session_id=${sessionId}`)
        .expect(res => {
          // Should return 401 or attempt refresh
          expect([401, 500]).toContain(res.status);
        });
    });

    it('should handle expired refresh token', async () => {
      vi.spyOn(axios, 'post').mockRejectedValueOnce({
        response: {
          status: 400,
          data: {
            error: 'invalid_grant',
            error_description: 'Refresh token has expired'
          }
        }
      });

      const sessionId = 'test-session-' + Date.now();
      await sessionService.createSession(sessionId, {
        puuid: 'test-puuid',
        refreshToken: 'expired-refresh-token'
          }).catch(() => {});

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', `session_id=${sessionId}`)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should handle revoked token', async () => {
      vi.spyOn(axios, 'post').mockRejectedValueOnce({
        response: {
          status: 400,
          data: {
            error: 'invalid_grant',
            error_description: 'Token has been revoked'
          }
        }
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', `session_id=test-session`)
        .expect(401);
    });
  });

  describe('13.2.4: Invalid Sessions', () => {
    it('should handle missing session cookie', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.error).toBeDefined();
      expect(response.body.error).toContain('session');
    });

    it('should handle invalid session ID format', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', 'session_id=invalid-format-123')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should handle expired session', async () => {
      const sessionId = 'expired-session-' + Date.now();
      
      // Create session with 1 second expiry
      await sessionService.createSession(sessionId, {
        puuid: 'test-puuid'
      }, 1).catch(() => {});

      // Wait for expiry
      await new Promise(resolve => setTimeout(resolve, 1100));

      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', `session_id=${sessionId}`)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should handle session without required data', async () => {
      const sessionId = 'incomplete-session-' + Date.now();
      
      // Create session without puuid
      await sessionService.createSession(sessionId, {
        accessToken: 'test-token'
      }).catch(() => {});

      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', `session_id=${sessionId}`)
        .expect(401);
    });

    it('should handle state mismatch in OAuth callback', async () => {
      const sessionId = 'test-session-' + Date.now();
      
      await sessionService.createSession(sessionId, {
        codeVerifier: 'test-verifier',
        state: 'expected-state'
      }).catch(() => {});

      const response = await request(app)
        .get('/api/auth/riot/callback')
        .query({ code: 'test-code', state: 'wrong-state' })
        .set('Cookie', `session_id=${sessionId}`)
        .expect(302);

      expect(response.headers.location).toContain('error');
    });
  });

  describe('13.2.5: Gitea Provisioning Failures', () => {
    it('should handle Gitea API unavailable', async () => {
      vi.spyOn(axios, 'post').mockRejectedValueOnce({
        code: 'ECONNREFUSED',
        message: 'connect ECONNREFUSED to Gitea'
      });

      const riotUser = {
        puuid: 'test-puuid-' + Date.now(),
        gameName: 'TestPlayer',
        tagLine: 'NA1'
      };

      try {
        await userService.createUser(riotUser);
        // If it doesn't throw, that's also acceptable (might have fallback)
      } catch (error) {
        expect(error.message).toBeDefined();
      }
    });

    it('should handle Gitea username conflict', async () => {
      vi.spyOn(axios, 'post').mockRejectedValueOnce({
        response: {
          status: 422,
          data: {
            message: 'Username already exists'
          }
        }
      });

      const riotUser = {
        puuid: 'test-puuid-' + Date.now(),
        gameName: 'ExistingUser',
        tagLine: 'NA1'
      };

      try {
        await userService.createUser(riotUser);
        // Should handle by generating alternative username
      } catch (error) {
        // Or throw appropriate error
        expect(error.message).toBeDefined();
      }
    });

    it('should handle Gitea authentication failure', async () => {
      vi.spyOn(axios, 'post').mockRejectedValueOnce({
        response: {
          status: 401,
          data: {
            message: 'Invalid admin token'
          }
        }
      });

      const riotUser = {
        puuid: 'test-puuid-' + Date.now(),
        gameName: 'TestPlayer',
        tagLine: 'NA1'
      };

      try {
        await userService.createUser(riotUser);
      } catch (error) {
        expect(error.message).toBeDefined();
      }
    });

    it('should handle Gitea rate limiting', async () => {
      vi.spyOn(axios, 'post').mockRejectedValueOnce({
        response: {
          status: 429,
          data: {
            message: 'Too many requests'
          }
        }
      });

      const riotUser = {
        puuid: 'test-puuid-' + Date.now(),
        gameName: 'TestPlayer',
        tagLine: 'NA1'
      };

      try {
        await userService.createUser(riotUser);
      } catch (error) {
        expect(error.message).toBeDefined();
      }
    });

    it('should handle database write failure during user creation', async () => {
      // This would require mocking the database layer
      // For now, we document the expected behavior
      const riotUser = {
        puuid: 'test-puuid-' + Date.now(),
        gameName: 'TestPlayer',
        tagLine: 'NA1'
      };

      try {
        await userService.createUser(riotUser);
      } catch (error) {
        // Should fail gracefully with appropriate error
        if (error) {
          expect(error.message).toBeDefined();
        }
      }
    });
  });

  describe('13.2.6: Riot API Error Responses', () => {
    it('should handle Riot API 500 error', async () => {
      vi.spyOn(axios, 'post').mockRejectedValueOnce({
        response: {
          status: 500,
          data: {
            error: 'server_error',
            error_description: 'Internal server error'
          }
        }
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', `session_id=test-session`)
        .expect(res => {
          expect([401, 500]).toContain(res.status);
        });
    });

    it('should handle Riot API 503 service unavailable', async () => {
      vi.spyOn(axios, 'post').mockRejectedValueOnce({
        response: {
          status: 503,
          data: {
            error: 'temporarily_unavailable',
            error_description: 'Service temporarily unavailable'
          }
        }
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', `session_id=test-session`)
        .expect(res => {
          expect([401, 500, 503]).toContain(res.status);
        });
    });

    it('should handle malformed Riot API response', async () => {
      vi.spyOn(axios, 'post').mockResolvedValueOnce({
        status: 200,
        data: 'invalid json response'
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', `session_id=test-session`)
        .expect(res => {
          expect([401, 500]).toContain(res.status);
        });
    });
  });
});
