/**
 * Custom error class for Riot API errors
 * Provides structured error information for better error handling and user feedback
 */
export class RiotAPIError extends Error {
  public readonly statusCode: number;
  public readonly retryAfter?: number;
  public readonly userMessage: string;
  public readonly isRecoverable: boolean;

  constructor(
    statusCode: number,
    message: string,
    userMessage: string,
    isRecoverable: boolean = true,
    retryAfter?: number
  ) {
    super(message);
    this.name = 'RiotAPIError';
    this.statusCode = statusCode;
    this.userMessage = userMessage;
    this.isRecoverable = isRecoverable;
    this.retryAfter = retryAfter;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (typeof (Error as any).captureStackTrace === 'function') {
      (Error as any).captureStackTrace(this, RiotAPIError);
    }
  }

  /**
   * Create a RiotAPIError from an HTTP response
   */
  static async fromResponse(response: Response): Promise<RiotAPIError> {
    const statusCode = response.status;
    
    // Handle 429 Rate Limit
    if (statusCode === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const retrySeconds = retryAfter ? parseInt(retryAfter, 10) : undefined;
      
      return new RiotAPIError(
        429,
        `Rate limited. Retry after ${retrySeconds || 'unknown'} seconds.`,
        retrySeconds
          ? `Too many requests. Please wait ${retrySeconds} seconds before trying again.`
          : 'Too many requests. Please wait a moment before trying again.',
        true,
        retrySeconds
      );
    }

    // Handle 401 Unauthorized
    if (statusCode === 401) {
      return new RiotAPIError(
        401,
        'Unauthorized: Invalid API key',
        'Your API key is invalid. Please check your configuration and ensure you have a valid Riot Games API key.',
        false
      );
    }

    // Handle 403 Forbidden
    if (statusCode === 403) {
      return new RiotAPIError(
        403,
        'Forbidden: API key expired or lacks permissions',
        'Your API key has expired or does not have permission to access this resource. Please generate a new API key.',
        false
      );
    }

    // Handle 404 Not Found
    if (statusCode === 404) {
      return new RiotAPIError(
        404,
        'Not Found: API endpoint does not exist',
        'The requested API endpoint was not found. This may indicate an outdated application version.',
        false
      );
    }

    // Handle 500+ Server Errors
    if (statusCode >= 500) {
      return new RiotAPIError(
        statusCode,
        `Server error: ${statusCode}`,
        'The Riot Games API is currently experiencing issues. Your cached data will be used instead.',
        true
      );
    }

    // Handle other client errors (400-499)
    if (statusCode >= 400 && statusCode < 500) {
      return new RiotAPIError(
        statusCode,
        `Client error: ${statusCode}`,
        `Request failed with error code ${statusCode}. Please try again later.`,
        true
      );
    }

    // Generic error
    return new RiotAPIError(
      statusCode,
      `HTTP error: ${statusCode}`,
      `An unexpected error occurred (${statusCode}). Please try again later.`,
      true
    );
  }

  /**
   * Get a user-friendly error message with actionable advice
   */
  getUserFriendlyMessage(): string {
    return this.userMessage;
  }

  /**
   * Check if the error is recoverable (can retry or use cache)
   */
  canRecover(): boolean {
    return this.isRecoverable;
  }

  /**
   * Get retry delay in seconds if applicable
   */
  getRetryDelay(): number | undefined {
    return this.retryAfter;
  }
}
