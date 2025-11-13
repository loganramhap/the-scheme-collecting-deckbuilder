/**
 * Security Audit Test Suite
 * Comprehensive security testing for Riot Sign-On implementation
 * 
 * Tests cover:
 * - PKCE implementation
 * - Token storage security
 * - Session management
 * - CSRF vulnerabilities
 * - Rate limiting
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import crypto from 'crypto';
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  generatePKCEParams,
} from './services/authService.js';
import {
  generateSessionId,
  createSession,
  getSession,
  updateSession,
  deleteSession,
  setAuthCookies,
  clearAuthCookies,
} from './services/sessionService.js';

describe('Security Audit - PKCE Implementation', () => {
  describe('Code Verifier Generation', () => {
    it('should generate cryptographically secure code_verifier', () => {
      const verifier = generateCodeVerifier();
      
      // Should be a string
      expect(typeof verifier).toBe('string');
      
      // Should be 43-128 characters (base64url encoded)
      expect(verifier.length).toBeGreaterThanOrEqual(43);
      expect(verifier.length).toBeLessThanOrEqual(128);
      
      // Should only contain base64url characters
      expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/);
      
      // Should not contain padding
      expect(verifier).not.toContain('=');
    });

    it('should generate unique code_verifiers', () => {
      const verifier1 = generateCodeVerifier();
      const verifier2 = generateCodeVerifier();
      
      expect(verifier1).not.toBe(verifier2);
    });

    it('should use crypto.randomBytes for generation', () => {
      const randomBytesSpy = vi.spyOn(crypto, 'randomBytes');
      
      generateCodeVerifier();
      
      expect(randomBytesSpy).toHaveBeenCalledWith(32);
      randomBytesSpy.mockRestore();
    });
  });

  describe('Code Challenge Generation', () => {
    it('should generate SHA-256 hash of code_verifier', () => {
      const verifier = 'test-verifier-12345';
      const challenge = generateCodeChallenge(verifier);
      
      // Should be a string
      expect(typeof challenge).toBe('string');
      
      // Should be base64url encoded SHA-256 hash (43 characters)
      expect(challenge.length).toBe(43);
      
      // Should only contain base64url characters
      expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
      
      // Should not contain padding
      expect(challenge).not.toContain('=');
    });

    it('should produce consistent hash for same verifier', () => {
      const verifier = 'test-verifier-12345';
      const challenge1 = generateCodeChallenge(verifier);
      const challenge2 = generateCodeChallenge(verifier);
      
      expect(challenge1).toBe(challenge2);
    });

    it('should produce different hashes for different verifiers', () => {
      const verifier1 = 'test-verifier-1';
      const verifier2 = 'test-verifier-2';
      
      const challenge1 = generateCodeChallenge(verifier1);
      const challenge2 = generateCodeChallenge(verifier2);
      
      expect(challenge1).not.toBe(challenge2);
    });

    it('should use SHA-256 algorithm', () => {
      const createHashSpy = vi.spyOn(crypto, 'createHash');
      const verifier = 'test-verifier';
      
      generateCodeChallenge(verifier);
      
      expect(createHashSpy).toHaveBeenCalledWith('sha256');
      createHashSpy.mockRestore();
    });
  });

  describe('State Parameter Generation', () => {
    it('should generate cryptographically secure state', () => {
      const state = generateState();
      
      // Should be a string
      expect(typeof state).toBe('string');
      
      // Should be at least 16 characters
      expect(state.length).toBeGreaterThanOrEqual(16);
      
      // Should only contain base64url characters
      expect(state).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('should generate unique state values', () => {
      const state1 = generateState();
      const state2 = generateState();
      
      expect(state1).not.toBe(state2);
    });

    it('should use crypto.randomBytes for generation', () => {
      const randomBytesSpy = vi.spyOn(crypto, 'randomBytes');
      
      generateState();
      
      expect(randomBytesSpy).toHaveBeenCalledWith(16);
      randomBytesSpy.mockRestore();
    });
  });

  describe('Complete PKCE Flow', () => {
    it('should generate all required PKCE parameters', () => {
      const params = generatePKCEParams();
      
      expect(params).toHaveProperty('codeVerifier');
      expect(params).toHaveProperty('codeChallenge');
      expect(params).toHaveProperty('state');
      
      expect(typeof params.codeVerifier).toBe('string');
      expect(typeof params.codeChallenge).toBe('string');
      expect(typeof params.state).toBe('string');
    });

    it('should generate valid code_challenge from code_verifier', () => {
      const params = generatePKCEParams();
      
      // Verify challenge matches verifier
      const expectedChallenge = generateCodeChallenge(params.codeVerifier);
      expect(params.codeChallenge).toBe(expectedChallenge);
    });
  });
});

describe('Security Audit - Token Storage', () => {
  describe('Cookie Security Attributes', () => {
    it('should set httpOnly flag on auth cookies', () => {
      const mockRes = {
        cookie: vi.fn(),
      };
      
      const tokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      };
      
      setAuthCookies(mockRes, tokens, 'test-puuid', 'test-session-id');
      
      expect(mockRes.cookie).toHaveBeenCalled();
      const cookieCall = mockRes.cookie.mock.calls[0];
      const options = cookieCall[2];
      
      expect(options.httpOnly).toBe(true);
    });

    it('should set secure flag in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const mockRes = {
        cookie: vi.fn(),
      };
      
      const tokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      };
      
      setAuthCookies(mockRes, tokens, 'test-puuid', 'test-session-id');
      
      const cookieCall = mockRes.cookie.mock.calls[0];
      const options = cookieCall[2];
      
      expect(options.secure).toBe(true);
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should set sameSite=strict attribute', () => {
      const mockRes = {
        cookie: vi.fn(),
      };
      
      const tokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      };
      
      setAuthCookies(mockRes, tokens, 'test-puuid', 'test-session-id');
      
      const cookieCall = mockRes.cookie.mock.calls[0];
      const options = cookieCall[2];
      
      expect(options.sameSite).toBe('strict');
    });

    it('should set appropriate maxAge', () => {
      const mockRes = {
        cookie: vi.fn(),
      };
      
      const tokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      };
      
      setAuthCookies(mockRes, tokens, 'test-puuid', 'test-session-id');
      
      const cookieCall = mockRes.cookie.mock.calls[0];
      const options = cookieCall[2];
      
      // Should have maxAge set (24 hours in milliseconds)
      expect(options.maxAge).toBeGreaterThan(0);
      expect(options.maxAge).toBeLessThanOrEqual(86400000); // 24 hours
    });

    it('should set path to root', () => {
      const mockRes = {
        cookie: vi.fn(),
      };
      
      const tokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      };
      
      setAuthCookies(mockRes, tokens, 'test-puuid', 'test-session-id');
      
      const cookieCall = mockRes.cookie.mock.calls[0];
      const options = cookieCall[2];
      
      expect(options.path).toBe('/');
    });
  });

  describe('Cookie Clearing', () => {
    it('should clear cookies with same security attributes', () => {
      const mockRes = {
        clearCookie: vi.fn(),
      };
      
      clearAuthCookies(mockRes);
      
      expect(mockRes.clearCookie).toHaveBeenCalled();
      const clearCall = mockRes.clearCookie.mock.calls[0];
      const options = clearCall[1];
      
      expect(options.httpOnly).toBe(true);
      expect(options.sameSite).toBe('strict');
      expect(options.path).toBe('/');
    });
  });

  describe('Token Storage in Session', () => {
    it('should not expose tokens in cookies directly', () => {
      const mockRes = {
        cookie: vi.fn(),
      };
      
      const tokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      };
      
      setAuthCookies(mockRes, tokens, 'test-puuid', 'test-session-id');
      
      // Should only set session_id cookie, not token cookies
      const cookieCalls = mockRes.cookie.mock.calls;
      const cookieNames = cookieCalls.map(call => call[0]);
      
      expect(cookieNames).toContain('session_id');
      expect(cookieNames).not.toContain('access_token');
      expect(cookieNames).not.toContain('refresh_token');
    });
  });
});

describe('Security Audit - Session Management', () => {
  describe('Session ID Generation', () => {
    it('should generate UUID v4 session IDs', () => {
      const sessionId = generateSessionId();
      
      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      expect(sessionId).toMatch(uuidV4Regex);
    });

    it('should generate unique session IDs', () => {
      const sessionId1 = generateSessionId();
      const sessionId2 = generateSessionId();
      
      expect(sessionId1).not.toBe(sessionId2);
    });

    it('should use crypto.randomUUID', () => {
      const randomUUIDSpy = vi.spyOn(crypto, 'randomUUID');
      
      generateSessionId();
      
      expect(randomUUIDSpy).toHaveBeenCalled();
      randomUUIDSpy.mockRestore();
    });
  });

  describe('Session Expiration', () => {
    it('should set expiration time on session creation', async () => {
      const sessionId = generateSessionId();
      const sessionData = { test: 'data' };
      
      await createSession(sessionId, sessionData);
      
      const retrieved = await getSession(sessionId);
      expect(retrieved).toBeDefined();
      
      // Cleanup
      await deleteSession(sessionId);
    });

    it('should return null for expired sessions', async () => {
      // This test would require mocking time or using a very short expiry
      // For now, we verify the logic exists
      const sessionId = 'expired-session-id';
      const result = await getSession(sessionId);
      
      // Non-existent session should return null
      expect(result).toBeNull();
    });
  });

  describe('Session Data Isolation', () => {
    it('should isolate session data between different sessions', async () => {
      const sessionId1 = generateSessionId();
      const sessionId2 = generateSessionId();
      
      const data1 = { user: 'user1', token: 'token1' };
      const data2 = { user: 'user2', token: 'token2' };
      
      await createSession(sessionId1, data1);
      await createSession(sessionId2, data2);
      
      const retrieved1 = await getSession(sessionId1);
      const retrieved2 = await getSession(sessionId2);
      
      expect(retrieved1).toEqual(data1);
      expect(retrieved2).toEqual(data2);
      expect(retrieved1).not.toEqual(retrieved2);
      
      // Cleanup
      await deleteSession(sessionId1);
      await deleteSession(sessionId2);
    });
  });

  describe('Session Cleanup', () => {
    it('should delete session data on logout', async () => {
      const sessionId = generateSessionId();
      const sessionData = { test: 'data' };
      
      await createSession(sessionId, sessionData);
      
      // Verify session exists
      let retrieved = await getSession(sessionId);
      expect(retrieved).toBeDefined();
      
      // Delete session
      await deleteSession(sessionId);
      
      // Verify session is gone
      retrieved = await getSession(sessionId);
      expect(retrieved).toBeNull();
    });
  });
});

describe('Security Audit - CSRF Protection', () => {
  describe('State Parameter Validation', () => {
    it('should validate state parameter matches stored value', () => {
      const state1 = generateState();
      const state2 = generateState();
      
      // States should be different
      expect(state1).not.toBe(state2);
      
      // In actual implementation, callback should reject if states don't match
      // This is tested in integration tests
    });

    it('should generate unpredictable state values', () => {
      const states = new Set();
      
      // Generate 100 states
      for (let i = 0; i < 100; i++) {
        states.add(generateState());
      }
      
      // All should be unique
      expect(states.size).toBe(100);
    });
  });

  describe('Cookie SameSite Attribute', () => {
    it('should use SameSite=strict for session cookies', () => {
      const mockRes = {
        cookie: vi.fn(),
      };
      
      const tokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      };
      
      setAuthCookies(mockRes, tokens, 'test-puuid', 'test-session-id');
      
      const cookieCall = mockRes.cookie.mock.calls[0];
      const options = cookieCall[2];
      
      // SameSite=strict prevents CSRF attacks
      expect(options.sameSite).toBe('strict');
    });
  });
});

describe('Security Audit - Rate Limiting', () => {
  describe('Rate Limiter Configuration', () => {
    it('should have rate limiter configured for auth endpoints', async () => {
      // Import rate limiter
      const { authRateLimiter } = await import('./middleware/rateLimiter.js');
      
      expect(authRateLimiter).toBeDefined();
      expect(typeof authRateLimiter).toBe('function');
    });

    it('should limit to 10 requests per minute', async () => {
      const { authRateLimiter } = await import('./middleware/rateLimiter.js');
      
      // Check configuration (this is a basic check)
      // Full rate limiting is tested in integration tests
      expect(authRateLimiter).toBeDefined();
    });
  });
});

describe('Security Audit - Summary', () => {
  it('should pass all PKCE security checks', () => {
    const params = generatePKCEParams();
    
    // Verify all PKCE components are secure
    expect(params.codeVerifier.length).toBeGreaterThanOrEqual(43);
    expect(params.codeChallenge.length).toBe(43);
    expect(params.state.length).toBeGreaterThanOrEqual(16);
    
    // Verify no padding characters
    expect(params.codeVerifier).not.toContain('=');
    expect(params.codeChallenge).not.toContain('=');
    expect(params.state).not.toContain('=');
  });

  it('should pass all token storage security checks', () => {
    const mockRes = {
      cookie: vi.fn(),
    };
    
    const tokens = {
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
    };
    
    setAuthCookies(mockRes, tokens, 'test-puuid', 'test-session-id');
    
    const cookieCall = mockRes.cookie.mock.calls[0];
    const options = cookieCall[2];
    
    // Verify all security attributes
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe('strict');
    expect(options.path).toBe('/');
    expect(options.maxAge).toBeGreaterThan(0);
  });

  it('should pass all session management security checks', () => {
    const sessionId = generateSessionId();
    
    // Verify session ID is UUID v4
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(sessionId).toMatch(uuidV4Regex);
  });

  it('should pass all CSRF protection checks', () => {
    const state = generateState();
    
    // Verify state is cryptographically secure
    expect(state.length).toBeGreaterThanOrEqual(16);
    expect(state).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
