/**
 * Utility functions for error handling
 */

/**
 * Extract a user-friendly error message from an error object
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (typeof error === 'object' && error !== null) {
    // Check for common error response formats
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }
    
    if ('error' in error && typeof error.error === 'string') {
      return error.error;
    }
    
    // Check for HTTP response errors
    if ('response' in error) {
      const response = (error as any).response;
      if (response && response.data) {
        if (typeof response.data === 'string') {
          return response.data;
        }
        if (response.data.message) {
          return response.data.message;
        }
        if (response.data.error) {
          return response.data.error;
        }
      }
      
      // Use status text if available
      if (response && response.statusText) {
        return `${response.status}: ${response.statusText}`;
      }
    }
  }
  
  return 'An unknown error occurred';
}

/**
 * Check if an error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('econnrefused') ||
      message.includes('enotfound') ||
      message.includes('fetch') ||
      message.includes('connection')
    );
  }
  
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as any).response;
    // No response means network error
    return !response;
  }
  
  return false;
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  // Network errors are retryable
  if (isNetworkError(error)) {
    return true;
  }
  
  // HTTP 5xx errors (server errors) are retryable
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as any).response;
    if (response && response.status >= 500 && response.status < 600) {
      return true;
    }
  }
  
  // 408 Request Timeout is retryable
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as any).response;
    if (response && response.status === 408) {
      return true;
    }
  }
  
  // 429 Too Many Requests is retryable (with backoff)
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as any).response;
    if (response && response.status === 429) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get a user-friendly error title based on error type
 */
export function getErrorTitle(error: unknown): string {
  if (isNetworkError(error)) {
    return 'Network Error';
  }
  
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as any).response;
    if (response) {
      if (response.status === 401) return 'Authentication Required';
      if (response.status === 403) return 'Permission Denied';
      if (response.status === 404) return 'Not Found';
      if (response.status === 409) return 'Conflict';
      if (response.status === 429) return 'Too Many Requests';
      if (response.status >= 500) return 'Server Error';
    }
  }
  
  return 'Error';
}

/**
 * Format error for logging
 */
export function formatErrorForLogging(error: unknown, context?: string): string {
  const message = getErrorMessage(error);
  const title = getErrorTitle(error);
  const contextStr = context ? `[${context}] ` : '';
  
  let details = '';
  if (error instanceof Error && error.stack) {
    details = `\nStack: ${error.stack}`;
  }
  
  return `${contextStr}${title}: ${message}${details}`;
}
