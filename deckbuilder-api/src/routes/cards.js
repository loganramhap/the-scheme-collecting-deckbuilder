import express from 'express';
import { authenticateSession } from '../middleware/auth.js';
import { fetchRiftboundCards } from '../services/riotApiService.js';
import { getSession } from '../services/sessionService.js';

const router = express.Router();

/**
 * GET /api/cards/riftbound
 * Fetch Riftbound card data using the user's RSO access token
 * Requires authentication
 */
router.get('/riftbound', authenticateSession, async (req, res) => {
  try {
    // Get session to retrieve access token
    const sessionId = req.cookies.session_id;
    const session = await getSession(sessionId);

    if (!session || !session.accessToken) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'No valid access token found',
      });
    }

    // Fetch cards using the user's access token
    const cards = await fetchRiftboundCards(session.accessToken);

    res.json({
      success: true,
      cards,
      count: cards.length,
    });
  } catch (error) {
    console.error('Failed to fetch Riftbound cards:', error);

    // Handle token expiration
    if (error.isTokenError) {
      return res.status(401).json({
        error: 'TOKEN_EXPIRED',
        message: 'Access token expired. Please refresh your session.',
        shouldRefresh: true,
      });
    }

    // Handle rate limiting
    if (error.statusCode === 429) {
      return res.status(429).json({
        error: 'RATE_LIMITED',
        message: 'Too many requests. Please try again later.',
      });
    }

    // Handle other API errors
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        error: error.code || 'API_ERROR',
        message: error.message,
      });
    }

    // Generic error
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch card data',
    });
  }
});

/**
 * GET /api/cards/health
 * Health check endpoint for cards API
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'cards' });
});

export default router;
