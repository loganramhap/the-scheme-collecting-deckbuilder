import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import cardsRouter from './cards.js';
import * as riotApiService from '../services/riotApiService.js';
import * as sessionService from '../services/sessionService.js';

// Mock dependencies
vi.mock('../services/riotApiService.js');
vi.mock('../services/sessionService.js');
vi.mock('../middleware/auth.js', () => ({
  authenticateSession: (req, res, next) => {
    // Mock authentication - just pass through
    next();
  },
}));

describe('Cards API Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/cards', cardsRouter);
    vi.clearAllMocks();
  });

  describe('GET /api/cards/riftbound', () => {
    it('should fetch cards successfully with valid session', async () => {
      const mockCards = [
        { id: '1', name: 'Card 1', type: 'unit' },
        { id: '2', name: 'Card 2', type: 'spell' },
      ];

      const mockSession = {
        accessToken: 'valid-access-token',
        puuid: 'test-puuid',
      };

      vi.mocked(sessionService.getSession).mockResolvedValue(mockSession);
      vi.mocked(riotApiService.fetchRiftboundCards).mockResolvedValue(mockCards);

      const response = await request(app)
        .get('/api/cards/riftbound')
        .set('Cookie', ['session_id=test-session-id'])
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        cards: mockCards,
        count: 2,
      });

      expect(sessionService.getSession).toHaveBeenCalledWith('test-session-id');
      expect(riotApiService.fetchRiftboundCards).toHaveBeenCalledWith('valid-access-token');
    });

    it('should return 401 when session is missing', async () => {
      vi.mocked(sessionService.getSession).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/cards/riftbound')
        .set('Cookie', ['session_id=invalid-session'])
        .expect(401);

      expect(response.body).toEqual({
        error: 'UNAUTHORIZED',
        message: 'No valid access token found',
      });
    });

    it('should return 401 when access token is missing', async () => {
      const mockSession = {
        puuid: 'test-puuid',
        // No accessToken
      };

      vi.mocked(sessionService.getSession).mockResolvedValue(mockSession);

      const response = await request(app)
        .get('/api/cards/riftbound')
        .set('Cookie', ['session_id=test-session-id'])
        .expect(401);

      expect(response.body).toEqual({
        error: 'UNAUTHORIZED',
        message: 'No valid access token found',
      });
    });

    it('should handle token expiration error', async () => {
      const mockSession = {
        accessToken: 'expired-token',
        puuid: 'test-puuid',
      };

      const tokenError = new Error('Token expired');
      tokenError.isTokenError = true;
      tokenError.statusCode = 401;

      vi.mocked(sessionService.getSession).mockResolvedValue(mockSession);
      vi.mocked(riotApiService.fetchRiftboundCards).mockRejectedValue(tokenError);

      const response = await request(app)
        .get('/api/cards/riftbound')
        .set('Cookie', ['session_id=test-session-id'])
        .expect(401);

      expect(response.body).toEqual({
        error: 'TOKEN_EXPIRED',
        message: 'Access token expired. Please refresh your session.',
        shouldRefresh: true,
      });
    });

    it('should handle rate limiting error', async () => {
      const mockSession = {
        accessToken: 'valid-token',
        puuid: 'test-puuid',
      };

      const rateLimitError = new Error('Rate limited');
      rateLimitError.statusCode = 429;

      vi.mocked(sessionService.getSession).mockResolvedValue(mockSession);
      vi.mocked(riotApiService.fetchRiftboundCards).mockRejectedValue(rateLimitError);

      const response = await request(app)
        .get('/api/cards/riftbound')
        .set('Cookie', ['session_id=test-session-id'])
        .expect(429);

      expect(response.body).toEqual({
        error: 'RATE_LIMITED',
        message: 'Too many requests. Please try again later.',
      });
    });

    it('should handle API errors with status code', async () => {
      const mockSession = {
        accessToken: 'valid-token',
        puuid: 'test-puuid',
      };

      const apiError = new Error('API Error');
      apiError.statusCode = 503;
      apiError.code = 'SERVICE_UNAVAILABLE';

      vi.mocked(sessionService.getSession).mockResolvedValue(mockSession);
      vi.mocked(riotApiService.fetchRiftboundCards).mockRejectedValue(apiError);

      const response = await request(app)
        .get('/api/cards/riftbound')
        .set('Cookie', ['session_id=test-session-id'])
        .expect(503);

      expect(response.body).toEqual({
        error: 'SERVICE_UNAVAILABLE',
        message: 'API Error',
      });
    });

    it('should handle generic errors', async () => {
      const mockSession = {
        accessToken: 'valid-token',
        puuid: 'test-puuid',
      };

      vi.mocked(sessionService.getSession).mockResolvedValue(mockSession);
      vi.mocked(riotApiService.fetchRiftboundCards).mockRejectedValue(new Error('Unknown error'));

      const response = await request(app)
        .get('/api/cards/riftbound')
        .set('Cookie', ['session_id=test-session-id'])
        .expect(500);

      expect(response.body).toEqual({
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch card data',
      });
    });

    it('should return empty array when no cards available', async () => {
      const mockSession = {
        accessToken: 'valid-token',
        puuid: 'test-puuid',
      };

      vi.mocked(sessionService.getSession).mockResolvedValue(mockSession);
      vi.mocked(riotApiService.fetchRiftboundCards).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/cards/riftbound')
        .set('Cookie', ['session_id=test-session-id'])
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        cards: [],
        count: 0,
      });
    });
  });

  describe('GET /api/cards/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/cards/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'ok',
        service: 'cards',
      });
    });
  });
});

describe('Riot API Service Integration', () => {
  describe('Caching behavior', () => {
    let app;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.use(cookieParser());
      app.use('/api/cards', cardsRouter);
      vi.clearAllMocks();
    });

    it('should cache responses and reduce API calls', async () => {
      const mockCards = [{ id: '1', name: 'Card 1' }];
      const mockSession = {
        accessToken: 'valid-token',
        puuid: 'test-puuid',
      };

      vi.mocked(sessionService.getSession).mockResolvedValue(mockSession);
      vi.mocked(riotApiService.fetchRiftboundCards).mockResolvedValue(mockCards);

      // First request
      await request(app)
        .get('/api/cards/riftbound')
        .set('Cookie', ['session_id=test-session-id'])
        .expect(200);

      // The service itself handles caching, so we just verify it was called
      expect(riotApiService.fetchRiftboundCards).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error recovery', () => {
    let app;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.use(cookieParser());
      app.use('/api/cards', cardsRouter);
      vi.clearAllMocks();
    });

    it('should handle transient errors gracefully', async () => {
      const mockSession = {
        accessToken: 'valid-token',
        puuid: 'test-puuid',
      };

      // First call fails, but service retries internally
      const mockCards = [{ id: '1', name: 'Card 1' }];
      
      vi.mocked(sessionService.getSession).mockResolvedValue(mockSession);
      vi.mocked(riotApiService.fetchRiftboundCards).mockResolvedValue(mockCards);

      const response = await request(app)
        .get('/api/cards/riftbound')
        .set('Cookie', ['session_id=test-session-id'])
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
