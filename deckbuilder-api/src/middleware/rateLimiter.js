import rateLimit from 'express-rate-limit';
import monitoringService from '../services/monitoringService.js';

/**
 * Rate Limiter Middleware
 * Implements rate limiting on authentication endpoints to prevent abuse
 */

/**
 * Rate limiter for authentication endpoints
 * Limits to 10 requests per minute per IP address
 */
export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    error: 'Too many authentication requests from this IP, please try again later.',
    retryAfter: 60,
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    const ip = req.ip || req.connection.remoteAddress;
    console.warn(`Rate limit exceeded for IP: ${ip} on ${req.path}`);
    
    // Log rate limit hit to monitoring service
    monitoringService.logRateLimitHit({
      ip,
      endpoint: req.path,
      limit: 10
    });
    
    res.status(429).json({
      error: 'Too many authentication requests from this IP, please try again later.',
      retryAfter: 60,
    });
  },
  // Skip rate limiting for health checks and non-auth endpoints
  skip: (req) => {
    return req.path === '/health' || req.path.includes('/metrics');
  },
});

/**
 * General API rate limiter (more permissive)
 * Limits to 100 requests per minute per IP address
 */
export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`General rate limit exceeded for IP: ${req.ip} on ${req.path}`);
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: 60,
    });
  },
  skip: (req) => {
    return req.path === '/health';
  },
});

export default {
  authRateLimiter,
  generalRateLimiter,
};
