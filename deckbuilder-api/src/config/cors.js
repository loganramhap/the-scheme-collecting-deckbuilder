/**
 * CORS Configuration
 * Configures Cross-Origin Resource Sharing for the API
 */

/**
 * Get CORS configuration based on environment
 * @returns {Object} CORS configuration object
 */
export function getCorsConfig() {
  const isProduction = process.env.NODE_ENV === 'production';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  
  // In production, restrict to specific domain
  // In development, allow localhost
  const allowedOrigins = isProduction
    ? ['https://zauniteworkshop.com', 'https://www.zauniteworkshop.com']
    : [frontendUrl, 'http://localhost:5173', 'http://localhost:3000'];
  
  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked request from origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // Allow cookies to be sent
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Set-Cookie'],
    maxAge: 86400, // Cache preflight requests for 24 hours
  };
}

/**
 * Validate CORS configuration
 * @throws {Error} If configuration is invalid
 */
export function validateCorsConfig() {
  const frontendUrl = process.env.FRONTEND_URL;
  
  if (!frontendUrl) {
    throw new Error('FRONTEND_URL environment variable is required');
  }
  
  if (!frontendUrl.startsWith('http://') && !frontendUrl.startsWith('https://')) {
    throw new Error('FRONTEND_URL must be a valid HTTP(S) URL');
  }
  
  console.log(`✅ CORS configured for: ${frontendUrl}`);
}

export default {
  getCorsConfig,
  validateCorsConfig,
};
