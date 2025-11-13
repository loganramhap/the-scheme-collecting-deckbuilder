import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
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
} from './sessionService.js';
import * as dbConfig from '../db/config.js';

// Mock dependencies
vi.mock('../db/config.js', () => ({
  TABLES: {
    USERS: 'test-users-table',
    SESSIONS: 'test-sessions-table',
  },
  getItem: vi.fn(),
  putItem: vi.fn(),
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
}));

describe('Session Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SESSION_EXPIRY = '86400'; // 24 hours
  });

  describe('generateSessionId', () => {
    it('should generate a valid UUID', () => {
      const sessionId = generateSessionId();

      expect(sessionId).toBeDefined();
      expect(sessionId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('should generate unique session IDs', () => {
      const sessionId1 = generateSessionId();
      const sessionId2 = generateSessionId();

      expect(sessionId1).not.toBe(sessionId2);
    });
  });

  describe('createSession', () => {
    it('should create a new session', async () => {
      dbConfig.putItem.mockResolvedValueOnce({});

      const sessionId = 'test-session-id';
      const data = { userId: 'test-user', accessToken: 'token' };

      await createSession(sessionId, data);

      expect(dbConfig.putItem).toHaveBeenCalledWith(
        'test-sessions-table',
        expect.objectContaining({
          sessionId,
          data,
          expiresAt: expect.any(Number),
          createdAt: expect.any(String),
        })
      );
    });

    it('should create session with empty data if not provided', async () => {
      dbConfig.putItem.mockResolvedValueOnce({});

      const sessionId = 'test-session-id';

      await createSession(sessionId);

      expect(dbConfig.putItem).toHaveBeenCalledWith(
        'test-sessions-table',
        expect.objectContaining({
          sessionId,
          data: {},
        })
      );
    });

    it('should set correct expiration time', async () => {
      dbConfig.putItem.mockResolvedValueOnce({});

      const sessionId = 'test-session-id';
      const beforeTime = Math.floor(Date.now() / 1000) + 86400;

      await createSession(sessionId, {});

      const afterTime = Math.floor(Date.now() / 1000) + 86400;
      const callArgs = dbConfig.putItem.mock.calls[0][1];

      expect(callArgs.expiresAt).toBeGreaterThanOrEqual(beforeTime);
      expect(callArgs.expiresAt).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('getSession', () => {
    it('should retrieve valid session', async () => {
      const sessionData = { userId: 'test-user' };
      const futureExpiry = Math.floor(Date.now() / 1000) + 3600;

      dbConfig.getItem.mockResolvedValueOnce({
        sessionId: 'test-session-id',
        data: sessionData,
        expiresAt: futureExpiry,
      });

      const result = await getSession('test-session-id');

      expect(result).toEqual(sessionData);
    });

    it('should return null for non-existent session', async () => {
      dbConfig.getItem.mockResolvedValueOnce(null);

      const result = await getSession('nonexistent-session');

      expect(result).toBeNull();
    });

    it('should delete and return null for expired session', async () => {
      const pastExpiry = Math.floor(Date.now() / 1000) - 3600;

      dbConfig.getItem.mockResolvedValueOnce({
        sessionId: 'expired-session',
        data: { userId: 'test-user' },
        expiresAt: pastExpiry,
      });
      dbConfig.deleteItem.mockResolvedValueOnce({});

      const result = await getSession('expired-session');

      expect(result).toBeNull();
      expect(dbConfig.deleteItem).toHaveBeenCalledWith('test-sessions-table', {
        sessionId: 'expired-session',
      });
    });
  });

  describe('updateSession', () => {
    it('should update session data', async () => {
      const existingData = { userId: 'test-user', count: 1 };
      const newData = { count: 2, newField: 'value' };

      dbConfig.getItem.mockResolvedValueOnce({
        sessionId: 'test-session-id',
        data: existingData,
      });
      dbConfig.updateItem.mockResolvedValueOnce({});

      await updateSession('test-session-id', newData);

      expect(dbConfig.updateItem).toHaveBeenCalledWith(
        'test-sessions-table',
        { sessionId: 'test-session-id' },
        {
          data: {
            userId: 'test-user',
            count: 2,
            newField: 'value',
          },
        }
      );
    });

    it('should throw error if session not found', async () => {
      dbConfig.getItem.mockResolvedValueOnce(null);

      await expect(
        updateSession('nonexistent-session', { data: 'value' })
      ).rejects.toThrow('Failed to update session');
    });
  });

  describe('deleteSession', () => {
    it('should delete session', async () => {
      dbConfig.deleteItem.mockResolvedValueOnce({});

      await deleteSession('test-session-id');

      expect(dbConfig.deleteItem).toHaveBeenCalledWith('test-sessions-table', {
        sessionId: 'test-session-id',
      });
    });
  });

  describe('validateSession', () => {
    it('should validate and return session data', async () => {
      const sessionData = { userId: 'test-user' };
      const futureExpiry = Math.floor(Date.now() / 1000) + 3600;

      dbConfig.getItem.mockResolvedValueOnce({
        sessionId: 'test-session-id',
        data: sessionData,
        expiresAt: futureExpiry,
      });

      const result = await validateSession('test-session-id');

      expect(result).toEqual(sessionData);
    });

    it('should return null for invalid session ID', async () => {
      const result = await validateSession(null);

      expect(result).toBeNull();
    });

    it('should return null for expired session', async () => {
      const pastExpiry = Math.floor(Date.now() / 1000) - 3600;

      dbConfig.getItem.mockResolvedValueOnce({
        sessionId: 'expired-session',
        data: { userId: 'test-user' },
        expiresAt: pastExpiry,
      });
      dbConfig.deleteItem.mockResolvedValueOnce({});

      const result = await validateSession('expired-session');

      expect(result).toBeNull();
    });
  });

  describe('setAuthCookies', () => {
    it('should set session cookie with correct options', () => {
      const mockRes = {
        cookie: vi.fn(),
      };

      const tokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      setAuthCookies(mockRes, tokens, 'test-session-id');

      expect(mockRes.cookie).toHaveBeenCalledWith(
        'sessionId',
        'test-session-id',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
          path: '/',
          maxAge: 86400000,
        })
      );
    });

    it('should set secure flag in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const mockRes = {
        cookie: vi.fn(),
      };

      setAuthCookies(mockRes, {}, 'test-session-id');

      expect(mockRes.cookie).toHaveBeenCalledWith(
        'sessionId',
        'test-session-id',
        expect.objectContaining({
          secure: true,
        })
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('clearAuthCookies', () => {
    it('should clear session cookie', () => {
      const mockRes = {
        clearCookie: vi.fn(),
      };

      clearAuthCookies(mockRes);

      expect(mockRes.clearCookie).toHaveBeenCalledWith(
        'sessionId',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
          path: '/',
        })
      );
    });
  });

  describe('getSessionIdFromRequest', () => {
    it('should extract session ID from cookies', () => {
      const mockReq = {
        cookies: {
          sessionId: 'test-session-id',
        },
      };

      const result = getSessionIdFromRequest(mockReq);

      expect(result).toBe('test-session-id');
    });

    it('should return null if no cookies', () => {
      const mockReq = {};

      const result = getSessionIdFromRequest(mockReq);

      expect(result).toBeNull();
    });

    it('should return null if session ID not in cookies', () => {
      const mockReq = {
        cookies: {
          otherCookie: 'value',
        },
      };

      const result = getSessionIdFromRequest(mockReq);

      expect(result).toBeNull();
    });
  });

  describe('extendSession', () => {
    it('should extend session expiry', async () => {
      dbConfig.updateItem.mockResolvedValueOnce({});

      const beforeTime = Math.floor(Date.now() / 1000) + 86400;

      await extendSession('test-session-id');

      const afterTime = Math.floor(Date.now() / 1000) + 86400;
      const callArgs = dbConfig.updateItem.mock.calls[0][2];

      expect(callArgs.expiresAt).toBeGreaterThanOrEqual(beforeTime);
      expect(callArgs.expiresAt).toBeLessThanOrEqual(afterTime);
    });
  });
});
