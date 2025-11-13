# Authentication Store - Riot Sign-On

This document describes the updated authentication store that uses Riot Sign-On (RSO) instead of the previous Gitea-based authentication.

## Overview

The auth store has been migrated from storing Gitea tokens in localStorage to using Riot Sign-On with httpOnly cookies for secure token management.

## Key Changes

### 1. Token Storage
- **Before**: Tokens stored in localStorage (vulnerable to XSS)
- **After**: Tokens stored in httpOnly cookies on the backend (secure)

### 2. User Data
- **Before**: GiteaUser with username, email, avatar
- **After**: RiotUser with PUUID, gameName, tagLine, summonerIcon

### 3. Authentication Flow
- **Before**: Direct login with Gitea token
- **After**: OAuth 2.0 flow with PKCE via Riot Games

## Files Created/Modified

### New Files
- `src/types/riot.ts` - RiotUser and AuthState type definitions
- `src/services/authApi.ts` - API client for backend auth endpoints
- `src/store/auth.test.ts` - Manual tests for auth store

### Modified Files
- `src/store/auth.ts` - Updated to use RSO instead of Gitea auth
- `src/types/index.ts` - Added exports for Riot types

## Usage

### Login
```typescript
import { useAuthStore } from './store/auth';

function LoginButton() {
  const login = useAuthStore(state => state.login);
  
  return (
    <button onClick={login}>
      Sign in with Riot Games
    </button>
  );
}
```

The `login()` method initiates the OAuth flow by:
1. Calling `/api/auth/riot/init` to get the authorization URL
2. Redirecting the user to Riot's authorization page
3. User authorizes and is redirected back to `/auth/callback`

### Logout
```typescript
import { useAuthStore } from './store/auth';

function LogoutButton() {
  const logout = useAuthStore(state => state.logout);
  
  return (
    <button onClick={async () => {
      await logout();
      // User is logged out, state is cleared
    }}>
      Logout
    </button>
  );
}
```

### Refresh Authentication
```typescript
import { useAuthStore } from './store/auth';
import { useEffect } from 'react';

function App() {
  const refreshAuth = useAuthStore(state => state.refreshAuth);
  
  useEffect(() => {
    // On app load, check if user has valid session
    refreshAuth().catch(() => {
      // No valid session, user needs to login
    });
  }, [refreshAuth]);
  
  return <div>...</div>;
}
```

### Access User Data
```typescript
import { useAuthStore } from './store/auth';

function UserProfile() {
  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const giteaUsername = useAuthStore(state => state.giteaUsername);
  
  if (!isAuthenticated || !user) {
    return <div>Not logged in</div>;
  }
  
  return (
    <div>
      <h1>{user.gameName}#{user.tagLine}</h1>
      <p>PUUID: {user.puuid}</p>
      <p>Gitea: {giteaUsername}</p>
      {user.summonerIcon && (
        <img src={`/summoner-icons/${user.summonerIcon}.png`} alt="Icon" />
      )}
    </div>
  );
}
```

## State Structure

```typescript
interface AuthState {
  // Current authenticated Riot user
  user: RiotUser | null;
  
  // Whether user is authenticated
  isAuthenticated: boolean;
  
  // Gitea username for deck storage operations
  giteaUsername: string | null;
  
  // Initiates OAuth flow (redirects to Riot)
  login: () => void;
  
  // Logs out user and clears session
  logout: () => Promise<void>;
  
  // Refreshes auth state from backend
  refreshAuth: () => Promise<void>;
}
```

## RiotUser Type

```typescript
interface RiotUser {
  // Player Universally Unique Identifier
  puuid: string;
  
  // In-game name (e.g., "PlayerName")
  gameName: string;
  
  // Tag line (e.g., "NA1")
  tagLine: string;
  
  // Optional summoner icon ID
  summonerIcon?: number;
}
```

## Security Features

1. **httpOnly Cookies**: Tokens are stored in httpOnly cookies, making them inaccessible to JavaScript and preventing XSS attacks

2. **PKCE**: OAuth flow uses Proof Key for Code Exchange to prevent authorization code interception

3. **State Parameter**: CSRF protection via state parameter validation

4. **No localStorage**: Sensitive tokens are never stored in localStorage

5. **Automatic Refresh**: Backend can automatically refresh expired tokens

## Testing

Run manual tests in the browser console:

```javascript
// Load the test file and run tests
window.runAuthStoreTests();
```

Tests verify:
- Initial state structure
- Method signatures (login, logout, refreshAuth)
- State updates
- Logout clears state
- RiotUser type structure
- No localStorage usage

## Backend API Endpoints

The auth store communicates with these backend endpoints:

- `GET /api/auth/riot/init` - Initialize OAuth flow
- `GET /api/auth/riot/callback` - Handle OAuth callback
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout and revoke tokens

All requests include credentials (cookies) via `withCredentials: true`.

## Environment Variables

Required in `.env`:

```bash
VITE_API_URL=http://localhost:3001
```

## Migration Notes

### For Existing Users

Existing users with Gitea accounts will need to:
1. Sign in with Riot Games
2. Their Riot account will be linked to their existing Gitea account
3. All existing decks will remain accessible

### For New Users

New users will:
1. Sign in with Riot Games
2. A Gitea account will be automatically provisioned
3. They can immediately start creating decks

## Next Steps

After implementing this auth store, you'll need to:

1. Update the Login page to use the new `login()` method
2. Implement the AuthCallback page to handle OAuth redirects
3. Update navigation/UI components to display Riot user info
4. Add `refreshAuth()` call on app initialization
5. Update protected routes to check `isAuthenticated`
