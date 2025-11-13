import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import crypto from 'crypto';
import {
  findUserByPuuid,
  findUserByGiteaUsername,
  generateGiteaUsername,
  generateSecurePassword,
  encryptPassword,
  decryptPassword,
  provisionGiteaAccount,
  createUser,
  updateLastLogin,
  linkExistingGiteaAccount,
} from './userService.js';
import * as dbConfig from '../db/config.js';

// Mock dependencies
vi.mock('axios');
vi.mock('../db/config.js', () => ({
  TABLES: {
    USERS: 'test-users-table',
    SESSIONS: 'test-sessions-table',
  },
  getItem: vi.fn(),
  putItem: vi.fn(),
  updateItem: vi.fn(),
  queryItems: vi.fn(),
}));

describe('User Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    process.env.GITEA_URL = 'http://localhost:3000';
    process.env.GITEA_ADMIN_TOKEN = 'test-admin-token';
  });

  describe('findUserByPuuid', () => {
    it('should find user by PUUID', async () => {
      const mockUser = {
        puuid: 'test-puuid',
        giteaUsername: 'testuser-na1',
        gameName: 'TestUser',
        tagLine: 'NA1',
      };

      dbConfig.getItem.mockResolvedValueOnce(mockUser);

      const result = await findUserByPuuid('test-puuid');

      expect(result).toEqual(mockUser);
      expect(dbConfig.getItem).toHaveBeenCalledWith('test-users-table', {
        puuid: 'test-puuid',
      });
    });

    it('should return null if user not found', async () => {
      dbConfig.getItem.mockResolvedValueOnce(null);

      const result = await findUserByPuuid('nonexistent-puuid');

      expect(result).toBeNull();
    });
  });

  describe('findUserByGiteaUsername', () => {
    it('should find user by Gitea username', async () => {
      const mockUser = {
        puuid: 'test-puuid',
        giteaUsername: 'testuser-na1',
        gameName: 'TestUser',
        tagLine: 'NA1',
      };

      dbConfig.queryItems.mockResolvedValueOnce([mockUser]);

      const result = await findUserByGiteaUsername('testuser-na1');

      expect(result).toEqual(mockUser);
      expect(dbConfig.queryItems).toHaveBeenCalledWith('test-users-table', {
        IndexName: 'GiteaUsernameIndex',
        KeyConditionExpression: 'giteaUsername = :username',
        ExpressionAttributeValues: {
          ':username': 'testuser-na1',
        },
      });
    });

    it('should return null if user not found', async () => {
      dbConfig.queryItems.mockResolvedValueOnce([]);

      const result = await findUserByGiteaUsername('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('generateGiteaUsername', () => {
    it('should generate username from game name and tag', async () => {
      dbConfig.queryItems.mockResolvedValueOnce([]);

      const username = await generateGiteaUsername('TestPlayer', 'NA1');

      expect(username).toBe('testplayer-na1');
    });

    it('should sanitize special characters', async () => {
      dbConfig.queryItems.mockResolvedValueOnce([]);

      const username = await generateGiteaUsername('Test@Player#123', 'NA-1');

      expect(username).toBe('test-player-123-na1');
    });

    it('should handle spaces in game name', async () => {
      dbConfig.queryItems.mockResolvedValueOnce([]);

      const username = await generateGiteaUsername('Test Player', 'EUW');

      expect(username).toBe('test-player-euw');
    });

    it('should add suffix if username exists', async () => {
      // First call returns existing user, second call returns null
      dbConfig.queryItems
        .mockResolvedValueOnce([{ giteaUsername: 'testplayer-na1' }])
        .mockResolvedValueOnce([]);

      const username = await generateGiteaUsername('TestPlayer', 'NA1');

      expect(username).toBe('testplayer-na1-1');
    });

    it('should truncate long usernames', async () => {
      dbConfig.queryItems.mockResolvedValueOnce([]);

      const longName = 'VeryLongPlayerNameThatExceedsTheLimit';
      const username = await generateGiteaUsername(longName, 'NA1');

      expect(username.length).toBeLessThanOrEqual(39);
    });
  });

  describe('generateSecurePassword', () => {
    it('should generate password of default length', () => {
      const password = generateSecurePassword();

      expect(password).toBeDefined();
      expect(password.length).toBe(32);
    });

    it('should generate password of specified length', () => {
      const password = generateSecurePassword(16);

      expect(password.length).toBe(16);
    });

    it('should generate unique passwords', () => {
      const password1 = generateSecurePassword();
      const password2 = generateSecurePassword();

      expect(password1).not.toBe(password2);
    });

    it('should only contain valid characters', () => {
      const password = generateSecurePassword();
      const validChars = /^[A-Za-z0-9!@#$%^&*]+$/;

      expect(password).toMatch(validChars);
    });
  });

  describe('encryptPassword and decryptPassword', () => {
    it('should encrypt and decrypt password correctly', () => {
      const originalPassword = 'MySecurePassword123!';

      const encrypted = encryptPassword(originalPassword);
      const decrypted = decryptPassword(encrypted);

      expect(decrypted).toBe(originalPassword);
    });

    it('should produce different encrypted values for same password', () => {
      const password = 'TestPassword123';

      const encrypted1 = encryptPassword(password);
      const encrypted2 = encryptPassword(password);

      // Should be different due to random IV
      expect(encrypted1).not.toBe(encrypted2);

      // But both should decrypt to same value
      expect(decryptPassword(encrypted1)).toBe(password);
      expect(decryptPassword(encrypted2)).toBe(password);
    });

    it('should throw error if encryption key is invalid', () => {
      process.env.ENCRYPTION_KEY = 'invalid-key';

      expect(() => encryptPassword('password')).toThrow();
    });

    it('should throw error if encrypted format is invalid', () => {
      expect(() => decryptPassword('invalid-format')).toThrow();
    });
  });

  describe('provisionGiteaAccount', () => {
    it('should successfully provision Gitea account', async () => {
      axios.post.mockResolvedValueOnce({ data: { id: 1 } });

      await expect(
        provisionGiteaAccount('testuser', 'password123', 'test@example.com')
      ).resolves.not.toThrow();

      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/admin/users',
        expect.objectContaining({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'token test-admin-token',
          }),
        })
      );
    });

    it('should use placeholder email if not provided', async () => {
      axios.post.mockResolvedValueOnce({ data: { id: 1 } });

      await provisionGiteaAccount('testuser', 'password123');

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          email: 'testuser@zauniteworkshop.local',
        }),
        expect.any(Object)
      );
    });

    it('should handle existing user gracefully', async () => {
      axios.post.mockRejectedValueOnce({
        response: { status: 422, data: { message: 'User already exists' } },
      });

      await expect(
        provisionGiteaAccount('existinguser', 'password123')
      ).resolves.not.toThrow();
    });

    it('should throw error after max retries', async () => {
      axios.post.mockRejectedValue({
        response: { status: 500, data: { message: 'Server error' } },
      });

      await expect(
        provisionGiteaAccount('testuser', 'password123')
      ).rejects.toThrow('Failed to provision Gitea account');
    }, 10000); // Increase timeout to 10 seconds for retry logic
  });

  describe('createUser', () => {
    it('should create new user with Gitea provisioning', async () => {
      const riotUser = {
        puuid: 'new-puuid',
        gameName: 'NewPlayer',
        tagLine: 'NA1',
      };

      dbConfig.getItem.mockResolvedValueOnce(null); // User doesn't exist
      dbConfig.queryItems.mockResolvedValueOnce([]); // Username available
      axios.post.mockResolvedValueOnce({ data: { id: 1 } }); // Gitea success
      dbConfig.putItem.mockResolvedValueOnce({});

      const result = await createUser(riotUser);

      expect(result).toHaveProperty('puuid', 'new-puuid');
      expect(result).toHaveProperty('giteaUsername');
      expect(result).toHaveProperty('giteaPasswordEncrypted');
      expect(result).toHaveProperty('gameName', 'NewPlayer');
      expect(result).toHaveProperty('tagLine', 'NA1');
      expect(dbConfig.putItem).toHaveBeenCalled();
    });

    it('should throw error if user already exists', async () => {
      const riotUser = {
        puuid: 'existing-puuid',
        gameName: 'ExistingPlayer',
        tagLine: 'NA1',
      };

      dbConfig.getItem.mockResolvedValueOnce({ puuid: 'existing-puuid' });

      await expect(createUser(riotUser)).rejects.toThrow('User already exists');
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login timestamp', async () => {
      const mockUpdatedUser = {
        puuid: 'test-puuid',
        lastLogin: new Date().toISOString(),
      };

      dbConfig.updateItem.mockResolvedValueOnce(mockUpdatedUser);

      const result = await updateLastLogin('test-puuid');

      expect(result).toEqual(mockUpdatedUser);
      expect(dbConfig.updateItem).toHaveBeenCalledWith(
        'test-users-table',
        { puuid: 'test-puuid' },
        expect.objectContaining({
          lastLogin: expect.any(String),
        })
      );
    });
  });

  describe('linkExistingGiteaAccount', () => {
    it('should link existing Gitea account to Riot account', async () => {
      dbConfig.getItem.mockResolvedValueOnce(null); // User doesn't exist
      dbConfig.putItem.mockResolvedValueOnce({});

      const result = await linkExistingGiteaAccount(
        'riot-puuid',
        'existing-gitea-user',
        'gitea-password',
        'PlayerName',
        'NA1'
      );

      expect(result).toHaveProperty('puuid', 'riot-puuid');
      expect(result).toHaveProperty('giteaUsername', 'existing-gitea-user');
      expect(result).toHaveProperty('giteaPasswordEncrypted');
      expect(dbConfig.putItem).toHaveBeenCalled();
    });

    it('should throw error if user already linked', async () => {
      dbConfig.getItem.mockResolvedValueOnce({ puuid: 'riot-puuid' });

      await expect(
        linkExistingGiteaAccount(
          'riot-puuid',
          'existing-gitea-user',
          'gitea-password',
          'PlayerName',
          'NA1'
        )
      ).rejects.toThrow('User already linked');
    });
  });
});
