# Riot API Error Handling

This document describes the comprehensive error handling system for the Riot Games API integration.

## Overview

The error handling system provides:
- Structured error information with status codes
- User-friendly error messages
- Automatic fallback to cached data when possible
- Rate limit handling with retry delays
- Network error detection

## Error Types

### 1. Rate Limit (429)
**When it happens:** Too many API requests in a short time period

**User message:** "Too many requests. Please wait X seconds before trying again."

**Behavior:**
- Shows retry delay from API response
- Falls back to cached data
- Displays countdown timer in UI

### 2. Authentication Errors (401/403)
**When it happens:** Invalid, expired, or missing API key

**User message:** "Your API key is invalid/expired. Please check your configuration."

**Behavior:**
- Does not retry (non-recoverable)
- Falls back to local JSON database
- Prompts user to update API key

### 3. Server Errors (500+)
**When it happens:** Riot API service is down or experiencing issues

**User message:** "The Riot Games API is currently experiencing issues. Your cached data will be used instead."

**Behavior:**
- Falls back to cached data
- Allows retry after some time
- Shows warning instead of error

### 4. Network Errors
**When it happens:** No internet connection or DNS issues

**User message:** "Unable to connect to the Riot Games API. Please check your internet connection."

**Behavior:**
- Falls back to cached data
- Allows retry when connection restored
- Shows connection status

### 5. Invalid Response
**When it happens:** API returns malformed JSON or unexpected format

**User message:** "Received an invalid response from the API. Please try again later."

**Behavior:**
- Falls back to cached data
- Logs error for debugging
- Allows retry

## Usage Example

```typescript
import { RiftboundCardService } from './services/RiotCardService';
import { RiotAPIError } from './services/RiotAPIError';

const service = new RiftboundCardService(apiKey);

try {
  const cards = await service.getCards(true);
  console.log('Cards loaded successfully:', cards.length);
} catch (error) {
  if (error instanceof RiotAPIError) {
    // Get user-friendly message
    const message = error.getUserFriendlyMessage();
    
    // Check if error is recoverable
    if (error.canRecover()) {
      console.warn('Recoverable error:', message);
      // Show warning, use cached data
    } else {
      console.error('Non-recoverable error:', message);
      // Show error, prompt user action
    }
    
    // Handle rate limiting
    if (error.statusCode === 429) {
      const delay = error.getRetryDelay();
      console.log(`Rate limited. Retry after ${delay} seconds`);
    }
  }
}
```

## UI Integration

The `CardDataRefreshButton` component automatically handles all error types:

- **Warning state** (orange): Recoverable errors, using cached data
- **Error state** (red): Non-recoverable errors, user action needed
- **Retry countdown**: Shows remaining time for rate limits
- **Cache indicator**: Shows when using cached vs fresh data

## Testing Error Scenarios

### Test Rate Limiting
```typescript
// Make multiple rapid requests
for (let i = 0; i < 10; i++) {
  await service.getCards(true);
}
// Should trigger 429 after rate limit exceeded
```

### Test Invalid API Key
```typescript
// Use invalid key
const service = new RiftboundCardService('invalid-key');
await service.getCards(); // Should throw 401/403 error
```

### Test Network Error
```typescript
// Disconnect network, then try to fetch
await service.getCards(true); // Should show network error
```

## Fallback Strategy

1. **Primary**: Fetch from Riot API
2. **Fallback 1**: Use cached API data (even if expired)
3. **Fallback 2**: Use local JSON database
4. **Last Resort**: Show error, no data available

## Configuration

Set your API key in `.env`:
```
VITE_RIOT_API_KEY=RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_USE_RIOT_API=true
```

Get your API key from: https://developer.riotgames.com/

## Monitoring

All errors are logged to console with structured information:
- Error type and status code
- User-friendly message
- Technical details for debugging
- Fallback actions taken

Check browser console for detailed error logs when troubleshooting.
