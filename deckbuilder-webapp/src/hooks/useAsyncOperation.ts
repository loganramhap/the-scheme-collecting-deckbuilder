import { useState, useCallback } from 'react';
import { getErrorMessage } from '../utils/errorHandling';

interface UseAsyncOperationOptions {
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
  showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
  successMessage?: string;
  errorMessage?: string;
}

interface UseAsyncOperationResult<T> {
  execute: (...args: any[]) => Promise<T | undefined>;
  isLoading: boolean;
  error: Error | null;
  reset: () => void;
  retry: () => Promise<T | undefined>;
}

/**
 * Hook for handling async operations with loading states, error handling, and toast notifications
 */
export function useAsyncOperation<T = any>(
  operation: (...args: any[]) => Promise<T>,
  options: UseAsyncOperationOptions = {}
): UseAsyncOperationResult<T> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastArgs, setLastArgs] = useState<any[]>([]);

  const execute = useCallback(
    async (...args: any[]): Promise<T | undefined> => {
      setIsLoading(true);
      setError(null);
      setLastArgs(args);

      try {
        const result = await operation(...args);
        
        // Call success callback
        if (options.onSuccess) {
          options.onSuccess(result);
        }
        
        // Show success toast if message provided
        if (options.successMessage && options.showToast) {
          options.showToast(options.successMessage, 'success');
        }
        
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(getErrorMessage(err));
        setError(error);
        
        // Call error callback
        if (options.onError) {
          options.onError(error);
        }
        
        // Show error toast
        if (options.showToast) {
          const message = options.errorMessage || getErrorMessage(error);
          options.showToast(message, 'error');
        }
        
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [operation, options]
  );

  const retry = useCallback(async (): Promise<T | undefined> => {
    if (lastArgs.length === 0) {
      throw new Error('No previous operation to retry');
    }
    return execute(...lastArgs);
  }, [execute, lastArgs]);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setLastArgs([]);
  }, []);

  return {
    execute,
    isLoading,
    error,
    reset,
    retry,
  };
}
