import axios, { AxiosError, AxiosInstance } from 'axios';
import { getErrorMessage } from './errorHandling';

const GITEA_URL = import.meta.env.VITE_GITEA_URL || 'http://localhost:3000';

/**
 * Create an axios instance with error handling interceptors
 */
export function createAxiosInstance(): AxiosInstance {
  const instance = axios.create({
    baseURL: GITEA_URL,
    timeout: 30000, // 30 second timeout
  });

  // Request interceptor
  instance.interceptors.request.use(
    (config) => {
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling
  instance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error: AxiosError) => {
      // Handle network errors
      if (!error.response) {
        // Network error (no response from server)
        const networkError = new Error(
          'Network error: Unable to connect to the server. Please check your internet connection.'
        );
        (networkError as any).isNetworkError = true;
        (networkError as any).originalError = error;
        return Promise.reject(networkError);
      }

      // Handle HTTP errors
      const status = error.response.status;
      const data = error.response.data;

      let errorMessage = getErrorMessage(data);

      // Provide more specific error messages based on status code
      switch (status) {
        case 400:
          errorMessage = `Bad request: ${errorMessage}`;
          break;
        case 401:
          errorMessage = 'Authentication required. Please log in again.';
          break;
        case 403:
          errorMessage = 'Permission denied. You do not have access to this resource.';
          break;
        case 404:
          errorMessage = 'Resource not found.';
          break;
        case 409:
          errorMessage = `Conflict: ${errorMessage}`;
          break;
        case 422:
          errorMessage = `Validation error: ${errorMessage}`;
          break;
        case 429:
          errorMessage = 'Too many requests. Please wait a moment and try again.';
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = `Request failed: ${errorMessage}`;
      }

      const enhancedError = new Error(errorMessage);
      (enhancedError as any).status = status;
      (enhancedError as any).response = error.response;
      (enhancedError as any).originalError = error;

      return Promise.reject(enhancedError);
    }
  );

  return instance;
}

/**
 * Default axios instance for Gitea API calls
 */
export const giteaAxios = createAxiosInstance();
