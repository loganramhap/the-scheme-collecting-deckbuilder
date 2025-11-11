# Error Handling and Loading States Guide

## Quick Reference for Developers

This guide shows how to use the loading and error handling components in the versioning system.

## Loading States

### Using the Spinner Component

```tsx
import { Spinner } from '../Spinner';

// Small spinner (16px)
<Spinner size="sm" />

// Medium spinner (24px) - default
<Spinner size="md" />

// Large spinner (40px)
<Spinner size="lg" />

// Custom color
<Spinner size="md" color="#10b981" />

// In a button
<button disabled={isLoading}>
  {isLoading && <Spinner size="sm" color="white" />}
  {isLoading ? 'Loading...' : 'Submit'}
</button>
```

### Using the LoadingOverlay Component

```tsx
import { LoadingOverlay } from '../LoadingOverlay';

// Relative overlay (within a container)
{isLoading && (
  <LoadingOverlay message="Loading data..." />
)}

// Full-screen overlay
{isLoading && (
  <LoadingOverlay message="Processing..." fullScreen />
)}
```

## Error Handling

### Using the ErrorDisplay Component

```tsx
import { ErrorDisplay } from '../ErrorDisplay';

// Full error display with retry
{error && (
  <ErrorDisplay
    error={error}
    onRetry={handleRetry}
    context="Data Loading"
  />
)}

// Compact error display (for toasts/notifications)
{error && (
  <ErrorDisplay
    error={error}
    onRetry={handleRetry}
    onDismiss={handleDismiss}
    context="Save Operation"
    compact
  />
)}

// Error without retry (for non-retryable errors)
{error && (
  <ErrorDisplay
    error={error}
    onDismiss={handleDismiss}
    context="Validation"
  />
)}
```

### Error Handling Utilities

```tsx
import {
  getErrorMessage,
  isNetworkError,
  isRetryableError,
  getErrorTitle,
} from '../../utils/errorHandling';

try {
  await someAsyncOperation();
} catch (error) {
  // Get user-friendly message
  const message = getErrorMessage(error);
  
  // Check if it's a network error
  if (isNetworkError(error)) {
    console.log('Network issue detected');
  }
  
  // Check if we should show retry button
  if (isRetryableError(error)) {
    setShowRetry(true);
  }
  
  // Get appropriate title
  const title = getErrorTitle(error);
  console.error(`${title}: ${message}`);
}
```

## Async Operations

### Using the useAsyncOperation Hook

```tsx
import { useAsyncOperation } from '../../hooks/useAsyncOperation';
import { useToast } from '../../hooks/useToast';

function MyComponent() {
  const { showToast } = useToast();
  
  const { execute, isLoading, error, retry } = useAsyncOperation(
    async (id: string) => {
      return await api.fetchData(id);
    },
    {
      successMessage: 'Data loaded successfully!',
      errorMessage: 'Failed to load data',
      showToast,
      onSuccess: (result) => {
        console.log('Success:', result);
      },
      onError: (error) => {
        console.error('Error:', error);
      },
    }
  );
  
  return (
    <div>
      <button onClick={() => execute('123')} disabled={isLoading}>
        {isLoading && <Spinner size="sm" color="white" />}
        Load Data
      </button>
      
      {error && (
        <ErrorDisplay
          error={error}
          onRetry={retry}
          context="Data Loading"
        />
      )}
    </div>
  );
}
```

## Network Status

### Using the useNetworkStatus Hook

```tsx
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

function MyComponent() {
  const { isOnline, wasOffline } = useNetworkStatus();
  
  return (
    <div>
      {!isOnline && (
        <div className="offline-warning">
          You are currently offline
        </div>
      )}
      
      {wasOffline && isOnline && (
        <div className="online-notification">
          Back online!
        </div>
      )}
    </div>
  );
}
```

### Using the NetworkStatusIndicator Component

```tsx
import { NetworkStatusIndicator } from '../NetworkStatusIndicator';

function App() {
  return (
    <div>
      <NetworkStatusIndicator />
      {/* Rest of your app */}
    </div>
  );
}
```

## Common Patterns

### Pattern 1: Simple Async Operation with Loading

```tsx
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<Error | null>(null);

const handleSubmit = async () => {
  setIsLoading(true);
  setError(null);
  
  try {
    await api.submitData(data);
    showToast('Success!', 'success');
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    setError(error);
    showToast(getErrorMessage(error), 'error');
  } finally {
    setIsLoading(false);
  }
};

return (
  <>
    <button onClick={handleSubmit} disabled={isLoading}>
      {isLoading && <Spinner size="sm" color="white" />}
      Submit
    </button>
    
    {error && (
      <ErrorDisplay
        error={error}
        onRetry={handleSubmit}
        onDismiss={() => setError(null)}
        compact
      />
    )}
  </>
);
```

### Pattern 2: Loading Overlay for Blocking Operations

```tsx
const [isLoading, setIsLoading] = useState(false);

const handleLongOperation = async () => {
  setIsLoading(true);
  try {
    await api.longRunningOperation();
  } finally {
    setIsLoading(false);
  }
};

return (
  <div style={{ position: 'relative' }}>
    {isLoading && <LoadingOverlay message="Processing..." />}
    
    <button onClick={handleLongOperation}>
      Start Operation
    </button>
  </div>
);
```

### Pattern 3: Error Display with Context

```tsx
const [error, setError] = useState<Error | null>(null);

const handleOperation = async () => {
  try {
    await api.operation();
  } catch (err) {
    setError(err instanceof Error ? err : new Error('Operation failed'));
  }
};

return (
  <>
    {error && (
      <ErrorDisplay
        error={error}
        onRetry={handleOperation}
        onDismiss={() => setError(null)}
        context="Branch Creation"
      />
    )}
  </>
);
```

## Best Practices

1. **Always show loading states** for async operations
2. **Use appropriate spinner sizes** (sm for buttons, md for content, lg for overlays)
3. **Provide context** in error messages
4. **Show retry buttons** for retryable errors
5. **Use LoadingOverlay** for blocking operations
6. **Handle network errors** gracefully
7. **Provide user feedback** with toast notifications
8. **Disable buttons** during loading to prevent duplicate submissions
9. **Clear errors** when retrying or dismissing
10. **Log errors** to console for debugging

## Error Types and When to Show Retry

### Show Retry Button:
- Network errors (no response from server)
- 5xx server errors
- Timeout errors
- 408 Request Timeout
- 429 Too Many Requests

### Don't Show Retry Button:
- 400 Bad Request (fix the request first)
- 401 Unauthorized (need to re-authenticate)
- 403 Forbidden (no permission)
- 404 Not Found (resource doesn't exist)
- 409 Conflict (need to resolve conflict)
- 422 Validation Error (fix validation issues)

Use `isRetryableError()` utility to automatically determine this.
