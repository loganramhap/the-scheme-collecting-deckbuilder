import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { validateEnvironment, getEnv, getRequiredEnv } from './validateEnv.js';

describe('Environment Validation', () => {
  let originalEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('validateEnvironment', () => {
    it('should throw error when required variables are missing', () => {
      // Clear all environment variables
      process.env = {};

      expect(() => validateEnvironment()).toThrow('Missing required environment variables');
    });

    it('should pass when all required variables are set', () => {
      // Set all required variables
      process.env = {
        RIOT_CLIENT_ID: 'test_client_id',
        RIOT_CLIENT_SECRET: 'test_client_secret',
        RIOT_REDIRECT_URI: 'http://localhost:5173/auth/callback',
        RIOT_AUTHORIZATION_URL: 'https://auth.riotgames.com/authorize',
        RIOT_TOKEN_URL: 'https://auth.riotgames.com/token',
        RIOT_USERINFO_URL: 'https://auth.riotgames.com/userinfo',
        RIOT_REVOKE_URL: 'https://auth.riotgames.com/revoke',
        SESSION_SECRET: 'test_session_secret_at_least_32_chars_long',
        SESSION_EXPIRY: '86400',
        ENCRYPTION_KEY: 'test_encryption_key_at_least_32_chars',
        GITEA_URL: 'http://localhost:3000',
        GITEA_ADMIN_TOKEN: 'test_admin_token',
        AWS_REGION: 'us-east-1',
        AWS_ACCESS_KEY_ID: 'test_access_key',
        AWS_SECRET_ACCESS_KEY: 'test_secret_key',
        DYNAMODB_USERS_TABLE: 'test-users',
        DYNAMODB_SESSIONS_TABLE: 'test-sessions',
        FRONTEND_URL: 'http://localhost:5173',
      };

      expect(() => validateEnvironment()).not.toThrow();
    });

    it('should warn about placeholder values', () => {
      process.env = {
        RIOT_CLIENT_ID: 'your_riot_client_id',
        RIOT_CLIENT_SECRET: 'test_client_secret',
        RIOT_REDIRECT_URI: 'http://localhost:5173/auth/callback',
        RIOT_AUTHORIZATION_URL: 'https://auth.riotgames.com/authorize',
        RIOT_TOKEN_URL: 'https://auth.riotgames.com/token',
        RIOT_USERINFO_URL: 'https://auth.riotgames.com/userinfo',
        RIOT_REVOKE_URL: 'https://auth.riotgames.com/revoke',
        SESSION_SECRET: 'test_session_secret_at_least_32_chars_long',
        SESSION_EXPIRY: '86400',
        ENCRYPTION_KEY: 'test_encryption_key_at_least_32_chars',
        GITEA_URL: 'http://localhost:3000',
        GITEA_ADMIN_TOKEN: 'test_admin_token',
        AWS_REGION: 'us-east-1',
        AWS_ACCESS_KEY_ID: 'test_access_key',
        AWS_SECRET_ACCESS_KEY: 'test_secret_key',
        DYNAMODB_USERS_TABLE: 'test-users',
        DYNAMODB_SESSIONS_TABLE: 'test-sessions',
        FRONTEND_URL: 'http://localhost:5173',
      };

      // Should not throw but will log warnings
      expect(() => validateEnvironment()).not.toThrow();
    });
  });

  describe('getEnv', () => {
    it('should return environment variable value', () => {
      process.env.TEST_VAR = 'test_value';
      expect(getEnv('TEST_VAR')).toBe('test_value');
    });

    it('should return default value when variable is not set', () => {
      expect(getEnv('NONEXISTENT_VAR', 'default')).toBe('default');
    });

    it('should return empty string when no default provided', () => {
      expect(getEnv('NONEXISTENT_VAR')).toBe('');
    });
  });

  describe('getRequiredEnv', () => {
    it('should return environment variable value', () => {
      process.env.TEST_VAR = 'test_value';
      expect(getRequiredEnv('TEST_VAR')).toBe('test_value');
    });

    it('should throw error when variable is not set', () => {
      expect(() => getRequiredEnv('NONEXISTENT_VAR')).toThrow(
        'Required environment variable NONEXISTENT_VAR is not set'
      );
    });
  });
});
