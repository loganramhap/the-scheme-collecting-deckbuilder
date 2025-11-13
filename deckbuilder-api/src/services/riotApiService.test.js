import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import { RiotApiService, RiotApiError, createRiotApiService, fetchRiftboundCards } from './riotApiService.js';

// Mock axios
vi.mock('axios');

describe('RiotApiService', () => {
  let service;
  const mockAccessToken = 'mock-access-token';

  beforeEach(() => {
    service = new RiotApiService(mockAccessToken);
    service.clearCache();
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should include Bearer token in request headers', async () => {
      axios.mockResolvedValueOnce({
        data: { result: 'success' },
      });

      await service.get('/test/endpoint');

      expect(axios).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockAccessToken}`,
          }),
        })
      );
    });

    it('should throw RiotApiError with isTokenError=true on 401', async () => {
      axios.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { error: 'Unauthorized' },
        },
      });

      await expect(service.get('/test/endpoint')).rejects.toThrow(RiotApiError);
      
      try {
        await service.get('/test/endpoint');
      } catch (error) {
        expect(error.isTokenError).toBe(true);
        expect(error.statusCode).toBe(401);
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should wait when rate limit is reached', async () => {
      const sleepSpy = vi.spyOn(service, 'sleep').mockResolvedValue();
      
      // Fill up the request queue
      for (let i = 0; i < 20; i++) {
        service.trackRequest();
      }

      axios.mockResolvedValueOnce({
        data: { result: 'success' },
      });

      await service.get('/test/endpoint');

      expect(sleepSpy).toHaveBeenCalled();
    });

    it('should retry after 429 rate limit response', async () => {
      const sleepSpy = vi.spyOn(service, 'sleep').mockResolvedValue();
      
      // First call returns 429, second succeeds
      axios
        .mockRejectedValueOnce({
          response: {
            status: 429,
            headers: { 'retry-after': '1' },
          },
        })
        .mockResolvedValueOnce({
          data: { result: 'success' },
        });

      const result = await service.get('/test/endpoint');

      expect(result).toEqual({ result: 'success' });
      expect(sleepSpy).toHaveBeenCalledWith(1000);
      expect(axios).toHaveBeenCalledTimes(2);
    });
  });

  describe('Retry Logic', () => {
    it('should retry on server errors (5xx)', async () => {
      const sleepSpy = vi.spyOn(service, 'sleep').mockResolvedValue();
      
      // First call returns 500, second succeeds
      axios
        .mockRejectedValueOnce({
          response: {
            status: 500,
            data: { error: 'Internal Server Error' },
          },
        })
        .mockResolvedValueOnce({
          data: { result: 'success' },
        });

      const result = await service.get('/test/endpoint');

      expect(result).toEqual({ result: 'success' });
      expect(sleepSpy).toHaveBeenCalled();
      expect(axios).toHaveBeenCalledTimes(2);
    });

    it('should retry on network errors', async () => {
      const sleepSpy = vi.spyOn(service, 'sleep').mockResolvedValue();
      
      // First call has network error, second succeeds
      axios
        .mockRejectedValueOnce({
          code: 'ENOTFOUND',
          message: 'Network error',
        })
        .mockResolvedValueOnce({
          data: { result: 'success' },
        });

      const result = await service.get('/test/endpoint');

      expect(result).toEqual({ result: 'success' });
      expect(sleepSpy).toHaveBeenCalled();
      expect(axios).toHaveBeenCalledTimes(2);
    });

    it('should use exponential backoff for retries', async () => {
      const sleepSpy = vi.spyOn(service, 'sleep').mockResolvedValue();
      
      // Multiple failures then success
      axios
        .mockRejectedValueOnce({
          response: { status: 500 },
        })
        .mockRejectedValueOnce({
          response: { status: 500 },
        })
        .mockResolvedValueOnce({
          data: { result: 'success' },
        });

      await service.get('/test/endpoint');

      // Check exponential backoff: 1000ms, 2000ms
      expect(sleepSpy).toHaveBeenNthCalledWith(1, 1000);
      expect(sleepSpy).toHaveBeenNthCalledWith(2, 2000);
    });

    it('should throw error after max retries exhausted', async () => {
      vi.spyOn(service, 'sleep').mockResolvedValue();
      
      // All calls fail
      axios.mockRejectedValue({
        response: {
          status: 500,
          data: { error: 'Server Error' },
        },
      });

      await expect(service.get('/test/endpoint', { maxRetries: 2 })).rejects.toThrow(RiotApiError);
      
      // Should try initial + 2 retries = 3 times
      expect(axios).toHaveBeenCalledTimes(3);
    });

    it('should not retry on client errors (4xx except 429)', async () => {
      axios.mockRejectedValueOnce({
        response: {
          status: 404,
          data: { error: 'Not Found' },
        },
      });

      await expect(service.get('/test/endpoint')).rejects.toThrow(RiotApiError);
      
      // Should only try once
      expect(axios).toHaveBeenCalledTimes(1);
    });
  });

  describe('Caching', () => {
    it('should cache successful responses', async () => {
      axios.mockResolvedValueOnce({
        data: { result: 'success' },
      });

      // First call
      const result1 = await service.get('/test/endpoint');
      
      // Second call should use cache
      const result2 = await service.get('/test/endpoint');

      expect(result1).toEqual({ result: 'success' });
      expect(result2).toEqual({ result: 'success' });
      expect(axios).toHaveBeenCalledTimes(1); // Only called once
    });

    it('should bypass cache when useCache=false', async () => {
      axios.mockResolvedValue({
        data: { result: 'success' },
      });

      // First call
      await service.get('/test/endpoint');
      
      // Second call with useCache=false
      await service.get('/test/endpoint', { useCache: false });

      expect(axios).toHaveBeenCalledTimes(2);
    });

    it('should expire cache after TTL', async () => {
      axios.mockResolvedValue({
        data: { result: 'success' },
      });

      // First call with short TTL
      await service.get('/test/endpoint', { cacheTtl: 100 });
      
      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Second call should hit API again
      await service.get('/test/endpoint');

      expect(axios).toHaveBeenCalledTimes(2);
    });

    it('should clear all cache', async () => {
      axios.mockResolvedValue({
        data: { result: 'success' },
      });

      await service.get('/test/endpoint');
      service.clearCache();
      await service.get('/test/endpoint');

      expect(axios).toHaveBeenCalledTimes(2);
    });

    it('should clear cache for specific endpoint', async () => {
      axios.mockResolvedValue({
        data: { result: 'success' },
      });

      await service.get('/endpoint1');
      await service.get('/endpoint2');
      
      service.clearCacheForEndpoint('/endpoint1');
      
      await service.get('/endpoint1');
      await service.get('/endpoint2');

      // endpoint1 called twice, endpoint2 called once
      expect(axios).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error Handling', () => {
    it('should handle timeout errors', async () => {
      axios.mockRejectedValueOnce({
        code: 'ETIMEDOUT',
        message: 'Timeout',
      });

      await expect(service.get('/test/endpoint', { maxRetries: 0 })).rejects.toThrow(RiotApiError);
      
      try {
        await service.get('/test/endpoint', { maxRetries: 0 });
      } catch (error) {
        expect(error.code).toBe('TIMEOUT');
      }
    });

    it('should handle network errors', async () => {
      axios.mockRejectedValueOnce({
        code: 'ENOTFOUND',
        message: 'Network error',
      });

      await expect(service.get('/test/endpoint', { maxRetries: 0 })).rejects.toThrow(RiotApiError);
      
      try {
        await service.get('/test/endpoint', { maxRetries: 0 });
      } catch (error) {
        expect(error.code).toBe('NETWORK_ERROR');
      }
    });

    it('should handle unknown errors', async () => {
      axios.mockRejectedValueOnce(new Error('Unknown error'));

      await expect(service.get('/test/endpoint', { maxRetries: 0 })).rejects.toThrow(RiotApiError);
      
      try {
        await service.get('/test/endpoint', { maxRetries: 0 });
      } catch (error) {
        expect(error.code).toBe('UNKNOWN_ERROR');
      }
    });
  });
});

describe('RiotApiError', () => {
  it('should create error with correct properties', () => {
    const error = new RiotApiError(404, 'NOT_FOUND', 'Resource not found', false);

    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.message).toBe('Resource not found');
    expect(error.isTokenError).toBe(false);
  });

  it('should identify recoverable errors', () => {
    const rateLimitError = new RiotApiError(429, 'RATE_LIMIT', 'Rate limited');
    const serverError = new RiotApiError(500, 'SERVER_ERROR', 'Server error');
    const clientError = new RiotApiError(404, 'NOT_FOUND', 'Not found');

    expect(rateLimitError.isRecoverable()).toBe(true);
    expect(serverError.isRecoverable()).toBe(true);
    expect(clientError.isRecoverable()).toBe(false);
  });
});

describe('createRiotApiService', () => {
  it('should create service with access token', () => {
    const service = createRiotApiService('test-token');
    expect(service).toBeInstanceOf(RiotApiService);
    expect(service.accessToken).toBe('test-token');
  });

  it('should throw error without access token', () => {
    expect(() => createRiotApiService()).toThrow('Access token is required');
  });
});

describe('fetchRiftboundCards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch and return card data', async () => {
    const mockCards = [
      { id: '1', name: 'Card 1' },
      { id: '2', name: 'Card 2' },
    ];

    axios.mockResolvedValueOnce({
      data: { cards: mockCards },
    });

    const result = await fetchRiftboundCards('test-token');

    expect(result).toEqual(mockCards);
    expect(axios).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringContaining('/riftbound/content/v1/contents'),
      })
    );
  });

  it('should return empty array if no cards in response', async () => {
    axios.mockResolvedValueOnce({
      data: {},
    });

    const result = await fetchRiftboundCards('test-token');

    expect(result).toEqual([]);
  });

  it('should throw error on API failure', async () => {
    axios.mockRejectedValueOnce({
      response: {
        status: 500,
        data: { error: 'Server Error' },
      },
    });

    await expect(fetchRiftboundCards('test-token')).rejects.toThrow();
  });
});
