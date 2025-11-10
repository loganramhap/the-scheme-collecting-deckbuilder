import express from 'express';
import axios from 'axios';

const router = express.Router();
const GITEA_URL = process.env.GITEA_URL || 'http://localhost:3000';
const ADMIN_TOKEN = process.env.GITEA_ADMIN_TOKEN;

// Auto-provision user account
router.post('/user', async (req, res) => {
  const { username, email, password } = req.body;

  if (!ADMIN_TOKEN) {
    return res.status(500).json({ error: 'Admin token not configured' });
  }

  try {
    // Create user
    const userResponse = await axios.post(
      `${GITEA_URL}/api/v1/admin/users`,
      {
        username,
        email,
        password,
        must_change_password: false,
        send_notify: false,
      },
      {
        headers: { Authorization: `token ${ADMIN_TOKEN}` },
      }
    );

    // Don't create a "decks" repo - we'll create one repo per deck instead

    res.json({
      success: true,
      user: userResponse.data,
    });
  } catch (error) {
    console.error('User provisioning failed:', error.response?.data || error.message);
    
    const status = error.response?.status;
    const giteaError = error.response?.data?.message || '';
    
    // Handle specific Gitea errors
    if (status === 422) {
      // Parse Gitea's error message for specific issues
      if (giteaError.includes('username') || giteaError.includes('already exists')) {
        return res.status(409).json({ error: 'Username already taken' });
      }
      if (giteaError.includes('email')) {
        return res.status(400).json({ error: 'Invalid email address' });
      }
      if (giteaError.includes('password')) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }
      return res.status(400).json({ error: 'Invalid username, email, or password format' });
    }
    
    if (status === 403) {
      return res.status(500).json({ error: 'Server configuration error: insufficient permissions' });
    }
    
    // Return Gitea's error message if available
    if (giteaError) {
      return res.status(500).json({ error: `Account creation failed: ${giteaError}` });
    }
    
    res.status(500).json({ error: 'Account creation failed. Please try again.' });
  }
});

// Check if user exists
router.get('/user/:username', async (req, res) => {
  const { username } = req.params;

  try {
    const response = await axios.get(`${GITEA_URL}/api/v1/users/${username}`);
    res.json({ exists: true, user: response.data });
  } catch (error) {
    if (error.response?.status === 404) {
      return res.json({ exists: false });
    }
    res.status(500).json({ error: 'Failed to check user' });
  }
});

export default router;
