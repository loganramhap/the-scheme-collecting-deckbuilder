import express from 'express';
import axios from 'axios';

const router = express.Router();
const GITEA_URL = process.env.GITEA_URL || 'http://localhost:3000';

// OAuth token exchange
router.post('/token', async (req, res) => {
  const { code, client_id, client_secret, redirect_uri } = req.body;

  try {
    const response = await axios.post(`${GITEA_URL}/login/oauth/access_token`, {
      client_id,
      client_secret,
      code,
      grant_type: 'authorization_code',
      redirect_uri,
    });

    res.json(response.data);
  } catch (error) {
    console.error('Token exchange failed:', error.response?.data || error.message);
    res.status(500).json({ error: 'Token exchange failed' });
  }
});

// Verify token and get user info
router.get('/verify', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const response = await axios.get(`${GITEA_URL}/api/v1/user`, {
      headers: { Authorization: `token ${token}` },
    });

    res.json(response.data);
  } catch (error) {
    console.error('Token verification failed:', error.response?.data || error.message);
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
