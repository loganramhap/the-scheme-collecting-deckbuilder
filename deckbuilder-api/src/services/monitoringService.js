/**
 * Monitoring Service
 * 
 * Provides logging, metrics tracking, and alerting for authentication events
 */

class MonitoringService {
  constructor() {
    this.metrics = {
      authAttempts: 0,
      authSuccesses: 0,
      authFailures: 0,
      tokenRefreshes: 0,
      tokenRefreshFailures: 0,
      newUserRegistrations: 0,
      giteaProvisioningFailures: 0,
      sessionCreations: 0,
      logouts: 0
    };

    this.recentErrors = [];
    this.maxRecentErrors = 100;
  }

  /**
   * Log authentication attempt
   */
  logAuthAttempt(data) {
    this.metrics.authAttempts++;
    this._log('info', 'AUTH_ATTEMPT', {
      timestamp: new Date().toISOString(),
      ip: data.ip,
      userAgent: data.userAgent,
      ...data
    });
  }

  /**
   * Log successful authentication
   */
  logAuthSuccess(data) {
    this.metrics.authSuccesses++;
    this._log('info', 'AUTH_SUCCESS', {
      timestamp: new Date().toISOString(),
      puuid: data.puuid,
      gameName: data.gameName,
      tagLine: data.tagLine,
      isNewUser: data.isNewUser,
      ip: data.ip
    });
  }

  /**
   * Log authentication failure
   */
  logAuthFailure(data) {
    this.metrics.authFailures++;
    this._log('error', 'AUTH_FAILURE', {
      timestamp: new Date().toISOString(),
      reason: data.reason,
      error: data.error?.message,
      ip: data.ip,
      userAgent: data.userAgent
    });

    this._addRecentError({
      type: 'AUTH_FAILURE',
      reason: data.reason,
      timestamp: new Date().toISOString()
    });

    // Check if we should alert
    this._checkAuthFailureRate();
  }

  /**
   * Log token refresh
   */
  logTokenRefresh(data) {
    this.metrics.tokenRefreshes++;
    this._log('info', 'TOKEN_REFRESH', {
      timestamp: new Date().toISOString(),
      puuid: data.puuid,
      success: true
    });
  }

  /**
   * Log token refresh failure
   */
  logTokenRefreshFailure(data) {
    this.metrics.tokenRefreshFailures++;
    this._log('error', 'TOKEN_REFRESH_FAILURE', {
      timestamp: new Date().toISOString(),
      puuid: data.puuid,
      reason: data.reason,
      error: data.error?.message
    });

    this._addRecentError({
      type: 'TOKEN_REFRESH_FAILURE',
      reason: data.reason,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log new user registration
   */
  logNewUserRegistration(data) {
    this.metrics.newUserRegistrations++;
    this._log('info', 'NEW_USER_REGISTRATION', {
      timestamp: new Date().toISOString(),
      puuid: data.puuid,
      gameName: data.gameName,
      tagLine: data.tagLine,
      giteaUsername: data.giteaUsername
    });
  }

  /**
   * Log Gitea provisioning failure
   */
  logGiteaProvisioningFailure(data) {
    this.metrics.giteaProvisioningFailures++;
    this._log('error', 'GITEA_PROVISIONING_FAILURE', {
      timestamp: new Date().toISOString(),
      puuid: data.puuid,
      gameName: data.gameName,
      reason: data.reason,
      error: data.error?.message
    });

    this._addRecentError({
      type: 'GITEA_PROVISIONING_FAILURE',
      reason: data.reason,
      timestamp: new Date().toISOString()
    });

    // Alert on provisioning failures
    this._alertGiteaProvisioningFailure(data);
  }

  /**
   * Log session creation
   */
  logSessionCreation(data) {
    this.metrics.sessionCreations++;
    this._log('info', 'SESSION_CREATION', {
      timestamp: new Date().toISOString(),
      sessionId: data.sessionId,
      puuid: data.puuid
    });
  }

  /**
   * Log logout
   */
  logLogout(data) {
    this.metrics.logouts++;
    this._log('info', 'LOGOUT', {
      timestamp: new Date().toISOString(),
      puuid: data.puuid,
      sessionId: data.sessionId
    });
  }

  /**
   * Log OAuth error
   */
  logOAuthError(data) {
    this._log('error', 'OAUTH_ERROR', {
      timestamp: new Date().toISOString(),
      error: data.error,
      errorDescription: data.errorDescription,
      state: data.state,
      ip: data.ip
    });

    this._addRecentError({
      type: 'OAUTH_ERROR',
      error: data.error,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log rate limit hit
   */
  logRateLimitHit(data) {
    this._log('warn', 'RATE_LIMIT_HIT', {
      timestamp: new Date().toISOString(),
      ip: data.ip,
      endpoint: data.endpoint,
      limit: data.limit
    });
  }

  /**
   * Log PKCE validation failure
   */
  logPKCEValidationFailure(data) {
    this._log('error', 'PKCE_VALIDATION_FAILURE', {
      timestamp: new Date().toISOString(),
      reason: data.reason,
      sessionId: data.sessionId,
      ip: data.ip
    });

    this._addRecentError({
      type: 'PKCE_VALIDATION_FAILURE',
      reason: data.reason,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    const successRate = this.metrics.authAttempts > 0
      ? (this.metrics.authSuccesses / this.metrics.authAttempts * 100).toFixed(2)
      : 0;

    const tokenRefreshSuccessRate = this.metrics.tokenRefreshes + this.metrics.tokenRefreshFailures > 0
      ? (this.metrics.tokenRefreshes / (this.metrics.tokenRefreshes + this.metrics.tokenRefreshFailures) * 100).toFixed(2)
      : 0;

    return {
      ...this.metrics,
      successRate: `${successRate}%`,
      tokenRefreshSuccessRate: `${tokenRefreshSuccessRate}%`,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit = 20) {
    return this.recentErrors.slice(-limit);
  }

  /**
   * Reset metrics (for testing or periodic reset)
   */
  resetMetrics() {
    Object.keys(this.metrics).forEach(key => {
      this.metrics[key] = 0;
    });
    this.recentErrors = [];
  }

  /**
   * Internal logging method
   */
  _log(level, event, data) {
    const logEntry = {
      level,
      event,
      ...data
    };

    // Console logging with color coding
    const colors = {
      info: '\x1b[36m',    // Cyan
      warn: '\x1b[33m',    // Yellow
      error: '\x1b[31m',   // Red
      reset: '\x1b[0m'
    };

    const color = colors[level] || colors.reset;
    console.log(`${color}[${level.toUpperCase()}] ${event}${colors.reset}`, JSON.stringify(data, null, 2));

    // In production, you would send this to a logging service like:
    // - CloudWatch Logs
    // - Datadog
    // - Splunk
    // - ELK Stack
    // Example: await cloudwatch.putLogEvents(logEntry);
  }

  /**
   * Add error to recent errors list
   */
  _addRecentError(error) {
    this.recentErrors.push(error);
    if (this.recentErrors.length > this.maxRecentErrors) {
      this.recentErrors.shift();
    }
  }

  /**
   * Check authentication failure rate and alert if too high
   */
  _checkAuthFailureRate() {
    const recentAuthFailures = this.recentErrors.filter(
      e => e.type === 'AUTH_FAILURE' &&
      new Date(e.timestamp) > new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
    ).length;

    // Alert if more than 10 failures in 5 minutes
    if (recentAuthFailures > 10) {
      this._alert('HIGH_AUTH_FAILURE_RATE', {
        failureCount: recentAuthFailures,
        timeWindow: '5 minutes',
        message: 'High authentication failure rate detected'
      });
    }
  }

  /**
   * Alert on Gitea provisioning failure
   */
  _alertGiteaProvisioningFailure(data) {
    this._alert('GITEA_PROVISIONING_FAILURE', {
      puuid: data.puuid,
      gameName: data.gameName,
      reason: data.reason,
      message: 'Failed to provision Gitea account for new user'
    });
  }

  /**
   * Send alert (placeholder for actual alerting system)
   */
  _alert(alertType, data) {
    const alert = {
      type: alertType,
      severity: 'high',
      timestamp: new Date().toISOString(),
      ...data
    };

    // Console alert
    console.error('\x1b[41m\x1b[37m[ALERT]\x1b[0m', JSON.stringify(alert, null, 2));

    // In production, you would send this to an alerting service like:
    // - PagerDuty
    // - Opsgenie
    // - AWS SNS
    // - Slack webhook
    // - Email
    // Example: await pagerduty.triggerIncident(alert);
  }

  /**
   * Health check for monitoring service
   */
  getHealthStatus() {
    const recentFailures = this.recentErrors.filter(
      e => new Date(e.timestamp) > new Date(Date.now() - 5 * 60 * 1000)
    ).length;

    const status = recentFailures > 20 ? 'degraded' : 'healthy';

    return {
      status,
      metrics: this.getMetrics(),
      recentFailures,
      timestamp: new Date().toISOString()
    };
  }
}

// Singleton instance
const monitoringService = new MonitoringService();

module.exports = monitoringService;
