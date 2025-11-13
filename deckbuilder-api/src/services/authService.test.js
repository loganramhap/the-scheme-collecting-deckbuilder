import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import axios from 'axios';
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  generatePKCEParams,
  exchangeCodeForTokens,
  refreshAccessToken,
  revokeToken,
  getUserInfo,
  getAuthorizationUrl,
} from './authService.js';

// Mock axios
vi.mock('axios');

describe('PKCE Utility Functions', () => {
  describe('generateCodeVerifier', () => {
    it('should generate a code verifier of correct length', () => {
      const verifier = generateCodeVerifier();
      expect(verifier).toBeDefined();
      expect(verifier.length).toBeGreaterThanOrEqual(43);
      expect(verifier.length).toBeLessThanOrEqual(128);
    });

    it('should generate unique code verifiers', () => {
      const verifier1 = generateCodeVerifier();
      const verifier2 = generateCodeVerifier();
      expect(verifier1).not.toBe(verifier2);
    });

    it('should only contain base64url characters', () => {
      const verifier = generateCodeVerifier();
      expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/);
    });
  });

  describe('generateCodeChallenge', () => {
    it('should generate a valid SHA-256 hash', () => {
      const verifier = 'test-verifier-123';
      const challenge = generateCodeChallenge(verifier);
      
      // Manually compute expected hash
      const expectedHash = crypto
        .createHash('sha256')
        .update(verifier)
        .digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      
      expect(challenge).toBe(expectedHash);
    });

    it('should only contain base64url characters', () => {
      const verifier = generateCodeVerifier();
      const challenge = generateCodeChallenge(verifier);
      expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('should produce consistent results for same input', () => {
      const verifier = 'consistent-verifier';
      const challenge1 = generateCodeChallenge(verifier);
      const challenge2 = generateCodeChallenge(verifier);
      expect(challenge1).toBe(challenge2);
    });
  });

  describe('generateState', () => {
    it('should generate a state parameter', () => {
      const state = generateState();
      expect(state).toBeDefined();
      expect(state.length).toBeGreaterThan(0);
    });

    it('should generate unique state parameters', () => {
      const state1 = generateState();
      const state2 = generateState();
      expect(state1).not.toBe(state2);
    });

    it('should only contain base64url characters', () => {
      const state = generateState();
      expect(state).toMatch(/^[A-Za-z0-9_-]+$/);
    });
  });

  describe('generatePKCEParams', () => {
    it('should generate all required PKCE parameters', () => {
      const params = generatePKCEParams();
      expect(params).toHaveProperty('codeVerifier');
      expect(params).toHaveProperty('codeChallenge');
      expect(params).toHaveProperty('state');
    });

    it('should generate valid code challenge from verifier', () => {
      const params = generatePKCEParams();
      const expectedChallenge = generateCodeChallenge(params.codeVerifier);
      expect(params.codeChallenge).toBe(expectedChallenge);
    });
  });
});

describe('OAuth Token Exchange Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up environment variables
    process.env.RIOT_CLIENT_ID = 'test-client-id';
    process.env.RIOT_CLIENT_SECRET = 'test-client-secret';
    process.env.RIOT_REDIRECT_URI = 'http://localhost:3000/callback';
    process.env.RIOT_TOKEN_URL = 'https://auth.riotgames.com/token';
  });

  describe('exchangeCodeForTokens', () => {
    it('should successfully exchange code for tokens', async () => {
      const mockResponse = {
        data: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 3600,
          token_type: 'Bearer',
          scope: 'openid',
        },
      };

      axios.post.mockResolvedValueOnce(mockResponse);

      const result = await exchangeCodeForTokens('auth-code', 'code-verifier');

      expect(result).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
        scope: 'openid',
      });

      expect(axios.post).toHaveBeenCalledWith(
        'https://auth.riotgames.com/token',
        expect.any(String),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })
      );
    });

    it('should handle token exchange errors', async () => {
      axios.post.mockRejectedValueOnce({
        response: {
          data: { error: 'invalid_grant' },
        },
      });

      await expect(
        exchangeCodeForTokens('invalid-code', 'code-verifier')
      ).rejects.toThrow('Token exchange failed');
    });
  });

  describe('refreshAccessToken', () => {
    it('should successfully refresh access token', async () => {
      const mockResponse = {
        data: {
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 3600,
          token_type: 'Bearer',
          scope: 'openid',
        },
      };

      axios.post.mockResolvedValueOnce(mockResponse);

      const result = await refreshAccessToken('old-refresh-token');

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
        scope: 'openid',
      });
    });

    it('should handle refresh token errors', async () => {
      axios.post.mockRejectedValueOnce({
        response: {
          data: { error: 'invalid_token' },
        },
      });

      await expect(
        refreshAccessToken('invalid-refresh-token')
      ).rejects.toThrow('Token refresh failed');
    });
  });

  describe('revokeToken', () => {
    it('should successfully revoke token', async () => {
      axios.post.mockResolvedValueOnce({ data: {} });

      await expect(revokeToken('access-token')).resolves.not.toThrow();
    });

    it('should not throw on revocation failure', async () => {
      axios.post.mockRejectedValueOnce(new Error('Network error'));

      // Should not throw even if revocation fails
      await expect(revokeToken('access-token')).resolves.not.toThrow();
    });
  });
});

describe('Riot User Info Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RIOT_USERINFO_URL = 'https://auth.riotgames.com/userinfo';
  });

  describe('getUserInfo', () => {
    it('should successfully fetch user info', async () => {
      const mockResponse = {
        data: {
          puuid: 'test-puuid-123',
          game_name: 'TestPlayer',
          tag_line: 'NA1',
        },
      };

      axios.get.mockResolvedValueOnce(mockResponse);

      const result = await getUserInfo('access-token');

      expect(result).toEqual({
        puuid: 'test-puuid-123',
        gameName: 'TestPlayer',
        tagLine: 'NA1',
      });

      expect(axios.get).toHaveBeenCalledWith(
        'https://auth.riotgames.com/userinfo',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer access-token',
          },
        })
      );
    });

    it('should handle alternative field names', async () => {
      const mockResponse = {
        data: {
          puuid: 'test-puuid-456',
          gameName: 'AltPlayer',
          tagLine: 'EUW',
        },
      };

      axios.get.mockResolvedValueOnce(mockResponse);

      const result = await getUserInfo('access-token');

      expect(result).toEqual({
        puuid: 'test-puuid-456',
        gameName: 'AltPlayer',
        tagLine: 'EUW',
      });
    });

    it('should handle 401 unauthorized errors', async () => {
      axios.get.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { error: 'unauthorized' },
        },
      });

      await expect(getUserInfo('invalid-token')).rejects.toThrow(
        'Invalid or expired access token'
      );
    });

    it('should handle 429 rate limit errors', async () => {
      axios.get.mockRejectedValueOnce({
        response: {
          status: 429,
          data: { error: 'rate_limit_exceeded' },
        },
      });

      await expect(getUserInfo('access-token')).rejects.toThrow(
        'Rate limit exceeded'
      );
    });

    it('should handle generic errors', async () => {
      axios.get.mockRejectedValueOnce({
        response: {
          status: 500,
          data: { error: 'server_error' },
        },
      });

      await expect(getUserInfo('access-token')).rejects.toThrow(
        'Failed to fetch user info'
      );
    });
  });

  describe('getAuthorizationUrl', () => {
    it('should build correct authorization URL', () => {
      // Set environment variables before calling the function
      const originalClientId = process.env.RIOT_CLIENT_ID;
      const originalRedirectUri = process.env.RIOT_REDIRECT_URI;
      const originalAuthUrl = process.env.RIOT_AUTHORIZATION_URL;
      
      process.env.RIOT_AUTHORIZATION_URL = 'https://auth.riotgames.com/authorize';
      process.env.RIOT_CLIENT_ID = 'test-client-id';
      process.env.RIOT_REDIRECT_URI = 'http://localhost:3000/callback';

      const codeChallenge = 'test-challenge';
      const state = 'test-state';

      const url = getAuthorizationUrl(codeChallenge, state);

      expect(url).toContain('https://auth.riotgames.com/authorize');
      expect(url).toContain('client_id=test-client-id');
      expect(url).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback');
      expect(url).toContain('response_type=code');
      expect(url).toContain('scope=openid');
      expect(url).toContain('code_challenge=test-challenge');
      expect(url).toContain('code_challenge_method=S256');
      expect(url).toContain('state=test-state');
      
      // Restore original values
      process.env.RIOT_CLIENT_ID = originalClientId;
      process.env.RIOT_REDIRECT_URI = originalRedirectUri;
      process.env.RIOT_AUTHORIZATION_URL = originalAuthUrl;
    });

    it('should properly encode URL parameters', () => {
      const originalClientId = process.env.RIOT_CLIENT_ID;
      const originalRedirectUri = process.env.RIOT_REDIRECT_URI;
      
      process.env.RIOT_CLIENT_ID = 'test-client-id';
      process.env.RIOT_REDIRECT_URI = 'http://localhost:3000/callback';

      const codeChallenge = 'challenge-with-special_chars';
      const state = 'state+with/special=chars';

      const url = getAuthorizationUrl(codeChallenge, state);

      expect(url).toContain(encodeURIComponent(state));
      
      // Restore original values
      process.env.RIOT_CLIENT_ID = originalClientId;
      process.env.RIOT_REDIRECT_URI = originalRedirectUri;
    });
  });
});
