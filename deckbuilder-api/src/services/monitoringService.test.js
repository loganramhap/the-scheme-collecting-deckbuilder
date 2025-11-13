import { describe, it, expect, beforeEach } from 'vitest';
import monitoringService from './monitoringService.js';

describe('MonitoringService', () => {
  beforeEach(() => {
    // Reset metrics before each test
    monitoringService.resetMetrics();
  });

  describe('Authentication Logging', () => {
    it('should log authentication attempts', () => {
      monitoringService.logAuthAttempt({
        ip: '127.0.0.1',
        userAgent: 'Test Browser'
      });

      const metrics = monitoringService.getMetrics();
      expect(metrics.authAttempts).toBe(1);
    });

    it('should log successful authentication', () => {
      monitoringService.logAuthSuccess({
        puuid: 'test-puuid',
        gameName: 'TestPlayer',
        tagLine: 'NA1',
        isNewUser: false,
        ip: '127.0.0.1'
      });

      const metrics = monitoringService.getMetrics();
      expect(metrics.authSuccesses).toBe(1);
    });

    it('should log authentication failures', () => {
      monitoringService.logAuthFailure({
        reason: 'Invalid credentials',
        ip: '127.0.0.1',
        userAgent: 'Test Browser'
      });

      const metrics = monitoringService.getMetrics();
      expect(metrics.authFailures).toBe(1);
      
      const errors = monitoringService.getRecentErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe('AUTH_FAILURE');
    });

    it('should calculate success rate correctly', () => {
      monitoringService.logAuthAttempt({ ip: '127.0.0.1' });
      monitoringService.logAuthSuccess({ puuid: 'test', gameName: 'Test', tagLine: 'NA1', ip: '127.0.0.1' });
      
      monitoringService.logAuthAttempt({ ip: '127.0.0.1' });
      monitoringService.logAuthFailure({ reason: 'Test', ip: '127.0.0.1' });

      const metrics = monitoringService.getMetrics();
      expect(metrics.successRate).toBe('50.00%');
    });
  });

  describe('Token Management Logging', () => {
    it('should log token refreshes', () => {
      monitoringService.logTokenRefresh({
        puuid: 'test-puuid'
      });

      const metrics = monitoringService.getMetrics();
      expect(metrics.tokenRefreshes).toBe(1);
    });

    it('should log token refresh failures', () => {
      monitoringService.logTokenRefreshFailure({
        puuid: 'test-puuid',
        reason: 'Invalid refresh token'
      });

      const metrics = monitoringService.getMetrics();
      expect(metrics.tokenRefreshFailures).toBe(1);
      
      const errors = monitoringService.getRecentErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe('TOKEN_REFRESH_FAILURE');
    });

    it('should calculate token refresh success rate', () => {
      monitoringService.logTokenRefresh({ puuid: 'test' });
      monitoringService.logTokenRefresh({ puuid: 'test' });
      monitoringService.logTokenRefreshFailure({ puuid: 'test', reason: 'Test' });

      const metrics = monitoringService.getMetrics();
      expect(metrics.tokenRefreshSuccessRate).toBe('66.67%');
    });
  });

  describe('User Registration Logging', () => {
    it('should log new user registrations', () => {
      monitoringService.logNewUserRegistration({
        puuid: 'new-user-puuid',
        gameName: 'NewPlayer',
        tagLine: 'NA1',
        giteaUsername: 'newplayer-na1'
      });

      const metrics = monitoringService.getMetrics();
      expect(metrics.newUserRegistrations).toBe(1);
    });

    it('should log Gitea provisioning failures', () => {
      monitoringService.logGiteaProvisioningFailure({
        puuid: 'test-puuid',
        gameName: 'TestPlayer',
        reason: 'Username already exists'
      });

      const metrics = monitoringService.getMetrics();
      expect(metrics.giteaProvisioningFailures).toBe(1);
      
      const errors = monitoringService.getRecentErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe('GITEA_PROVISIONING_FAILURE');
    });
  });

  describe('Session Management Logging', () => {
    it('should log session creations', () => {
      monitoringService.logSessionCreation({
        sessionId: 'test-session-id',
        puuid: 'test-puuid'
      });

      const metrics = monitoringService.getMetrics();
      expect(metrics.sessionCreations).toBe(1);
    });

    it('should log logouts', () => {
      monitoringService.logLogout({
        puuid: 'test-puuid',
        sessionId: 'test-session-id'
      });

      const metrics = monitoringService.getMetrics();
      expect(metrics.logouts).toBe(1);
    });
  });

  describe('Error Tracking', () => {
    it('should track recent errors', () => {
      monitoringService.logAuthFailure({ reason: 'Error 1', ip: '127.0.0.1' });
      monitoringService.logAuthFailure({ reason: 'Error 2', ip: '127.0.0.1' });
      monitoringService.logTokenRefreshFailure({ puuid: 'test', reason: 'Error 3' });

      const errors = monitoringService.getRecentErrors();
      expect(errors).toHaveLength(3);
    });

    it('should limit recent errors to max size', () => {
      // Add more than maxRecentErrors (100)
      for (let i = 0; i < 150; i++) {
        monitoringService.logAuthFailure({ reason: `Error ${i}`, ip: '127.0.0.1' });
      }

      const errors = monitoringService.getRecentErrors();
      expect(errors.length).toBeLessThanOrEqual(100);
    });

    it('should return limited number of recent errors', () => {
      for (let i = 0; i < 50; i++) {
        monitoringService.logAuthFailure({ reason: `Error ${i}`, ip: '127.0.0.1' });
      }

      const errors = monitoringService.getRecentErrors(10);
      expect(errors).toHaveLength(10);
    });
  });

  describe('OAuth Error Logging', () => {
    it('should log OAuth errors', () => {
      monitoringService.logOAuthError({
        error: 'access_denied',
        errorDescription: 'User denied authorization',
        state: 'test-state',
        ip: '127.0.0.1'
      });

      const errors = monitoringService.getRecentErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe('OAUTH_ERROR');
      expect(errors[0].error).toBe('access_denied');
    });
  });

  describe('Rate Limiting Logging', () => {
    it('should log rate limit hits', () => {
      monitoringService.logRateLimitHit({
        ip: '127.0.0.1',
        endpoint: '/api/auth/riot/callback',
        limit: 10
      });

      // Rate limit hits don't increment metrics, but are logged
      // This test just ensures no errors are thrown
      expect(true).toBe(true);
    });
  });

  describe('PKCE Validation Logging', () => {
    it('should log PKCE validation failures', () => {
      monitoringService.logPKCEValidationFailure({
        reason: 'State mismatch',
        sessionId: 'test-session',
        ip: '127.0.0.1'
      });

      const errors = monitoringService.getRecentErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe('PKCE_VALIDATION_FAILURE');
    });
  });

  describe('Health Status', () => {
    it('should return healthy status with few errors', () => {
      monitoringService.logAuthSuccess({ puuid: 'test', gameName: 'Test', tagLine: 'NA1', ip: '127.0.0.1' });

      const health = monitoringService.getHealthStatus();
      expect(health.status).toBe('healthy');
      expect(health.metrics).toBeDefined();
      expect(health.recentFailures).toBe(0);
    });

    it('should return degraded status with many errors', () => {
      // Add more than 20 recent errors
      for (let i = 0; i < 25; i++) {
        monitoringService.logAuthFailure({ reason: `Error ${i}`, ip: '127.0.0.1' });
      }

      const health = monitoringService.getHealthStatus();
      expect(health.status).toBe('degraded');
      expect(health.recentFailures).toBeGreaterThan(20);
    });
  });

  describe('Metrics Reset', () => {
    it('should reset all metrics', () => {
      monitoringService.logAuthAttempt({ ip: '127.0.0.1' });
      monitoringService.logAuthSuccess({ puuid: 'test', gameName: 'Test', tagLine: 'NA1', ip: '127.0.0.1' });
      monitoringService.logTokenRefresh({ puuid: 'test' });

      monitoringService.resetMetrics();

      const metrics = monitoringService.getMetrics();
      expect(metrics.authAttempts).toBe(0);
      expect(metrics.authSuccesses).toBe(0);
      expect(metrics.tokenRefreshes).toBe(0);
      
      const errors = monitoringService.getRecentErrors();
      expect(errors).toHaveLength(0);
    });
  });
});
