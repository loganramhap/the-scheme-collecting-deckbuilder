import axios from 'axios';

/**
 * Riot API Service
 * Handles authenticated requests to Riot APIs with rate limiting, retry logic, and caching
 */

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  maxRequests: 20, // Max requests per window
  windowMs: 1000, // 1 second window
  retryAfterMs: 1000, // Wait time after hitting rate limit
};

// Request tracking for rate limiting
const requestQueue = [];

// Response cache
const responseCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes default TTL

/**
 * RiotApiService class for making authenticated Riot API requests
 */
export class RiotApiService {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.baseUrl = 'https://americas.api.riotgames.com';
  }

  /**
   * Make an authenticated GET request to Riot API
   * @param {string} endpoint - API endpoint path
   * @param {Object} options - Request options
   * @param {boolean} options.useCache - Whether to use cached response (default: true)
   * @param {number} options.cacheTtl - Cache TTL in milliseconds (default: 5 minutes)
   * @param {number} options.maxRetries - Maximum retry attempts (default: 3)
   * @returns {Promise<any>} API response data
   */
  async get(endpoint, options = {}) {
    const {
      useCache = true,
      cacheTtl = CACHE_TTL,
      maxRetries = 3,
    } = options;

    // Check cache first
    if (useCache) {
      const cached = this.getCachedResponse(endpoint);
      if (cached) {
        return cached;
      }
    }

    // Wait for rate limit if needed
    await this.waitForRateLimit();

    // Make request with retry logic
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.makeRequest('GET', endpoint);
        
        // Cache successful response
        if (useCache) {
          this.cacheResponse(endpoint, response.data, cacheTtl);
        }

        return response.data;
      } catch (error) {
        lastError = error;

        // Handle rate limiting
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'];
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : RATE_LIMIT_CONFIG.retryAfterMs;
          
          console.warn(`Rate limited. Waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}`);
          await this.sleep(waitTime);
          continue;
        }

        // Handle token expiration (401)
        if (error.response?.status === 401) {
          throw new RiotApiError(
            401,
            'UNAUTHORIZED',
            'Access token expired or invalid',
            true // isTokenError
          );
        }

        // Handle server errors (5xx) - retry
        if (error.response?.status >= 500) {
          if (attempt < maxRetries) {
            const backoffTime = Math.pow(2, attempt) * 1000; // Exponential backoff
            console.warn(`Server error. Retrying in ${backoffTime}ms (${attempt + 1}/${maxRetries})`);
            await this.sleep(backoffTime);
            continue;
          }
        }

        // Handle network errors - retry
        if (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
          if (attempt < maxRetries) {
            const backoffTime = Math.pow(2, attempt) * 1000;
            console.warn(`Network error. Retrying in ${backoffTime}ms (${attempt + 1}/${maxRetries})`);
            await this.sleep(backoffTime);
            continue;
          }
        }

        // For other errors, don't retry
        break;
      }
    }

    // All retries exhausted
    throw this.handleError(lastError);
  }

  /**
   * Make the actual HTTP request
   * @private
   */
  async makeRequest(method, endpoint) {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Track request for rate limiting
    this.trackRequest();

    return await axios({
      method,
      url,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 second timeout
    });
  }

  /**
   * Wait if rate limit is reached
   * @private
   */
  async waitForRateLimit() {
    const now = Date.now();
    
    // Remove old requests outside the window
    while (requestQueue.length > 0 && requestQueue[0] < now - RATE_LIMIT_CONFIG.windowMs) {
      requestQueue.shift();
    }

    // If we're at the limit, wait
    if (requestQueue.length >= RATE_LIMIT_CONFIG.maxRequests) {
      const oldestRequest = requestQueue[0];
      const waitTime = RATE_LIMIT_CONFIG.windowMs - (now - oldestRequest);
      
      if (waitTime > 0) {
        console.log(`Rate limit reached. Waiting ${waitTime}ms`);
        await this.sleep(waitTime);
        return this.waitForRateLimit(); // Recursive check after waiting
      }
    }
  }

  /**
   * Track a request for rate limiting
   * @private
   */
  trackRequest() {
    requestQueue.push(Date.now());
  }

  /**
   * Get cached response if available and not expired
   * @private
   */
  getCachedResponse(endpoint) {
    const cached = responseCache.get(endpoint);
    if (!cached) return null;

    const { data, expiresAt } = cached;
    if (Date.now() > expiresAt) {
      responseCache.delete(endpoint);
      return null;
    }

    return data;
  }

  /**
   * Cache a response
   * @private
   */
  cacheResponse(endpoint, data, ttl) {
    responseCache.set(endpoint, {
      data,
      expiresAt: Date.now() + ttl,
    });
  }

  /**
   * Clear all cached responses
   */
  clearCache() {
    responseCache.clear();
  }

  /**
   * Clear cache for specific endpoint
   */
  clearCacheForEndpoint(endpoint) {
    responseCache.delete(endpoint);
  }

  /**
   * Handle and transform errors
   * @private
   */
  handleError(error) {
    if (error instanceof RiotApiError) {
      return error;
    }

    if (error.response) {
      // HTTP error response
      const status = error.response.status;
      const data = error.response.data;

      return new RiotApiError(
        status,
        data?.error || 'API_ERROR',
        data?.message || error.message,
        status === 401 || status === 403
      );
    }

    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new RiotApiError(
        0,
        'TIMEOUT',
        'Request timed out',
        false
      );
    }

    if (error.code === 'ENOTFOUND') {
      return new RiotApiError(
        0,
        'NETWORK_ERROR',
        'Unable to reach Riot API',
        false
      );
    }

    return new RiotApiError(
      0,
      'UNKNOWN_ERROR',
      error.message || 'An unknown error occurred',
      false
    );
  }

  /**
   * Sleep helper
   * @private
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Custom error class for Riot API errors
 */
export class RiotApiError extends Error {
  constructor(statusCode, code, message, isTokenError = false) {
    super(message);
    this.name = 'RiotApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.isTokenError = isTokenError;
  }

  /**
   * Check if this error is recoverable
   */
  isRecoverable() {
    // Rate limits and server errors are recoverable
    return this.statusCode === 429 || this.statusCode >= 500;
  }
}

/**
 * Create a RiotApiService instance with an access token
 * @param {string} accessToken - User's RSO access token
 * @returns {RiotApiService}
 */
export function createRiotApiService(accessToken) {
  if (!accessToken) {
    throw new Error('Access token is required to create RiotApiService');
  }
  return new RiotApiService(accessToken);
}

/**
 * Fetch Riftbound card data using authenticated request
 * @param {string} accessToken - User's RSO access token
 * @returns {Promise<Array>} Array of card data
 */
export async function fetchRiftboundCards(accessToken) {
  const service = createRiotApiService(accessToken);
  
  try {
    const response = await service.get('/riftbound/content/v1/contents', {
      useCache: true,
      cacheTtl: 24 * 60 * 60 * 1000, // 24 hours for card data
    });

    return response.cards || [];
  } catch (error) {
    console.error('Failed to fetch Riftbound cards:', error);
    throw error;
  }
}

export default {
  RiotApiService,
  RiotApiError,
  createRiotApiService,
  fetchRiftboundCards,
};
