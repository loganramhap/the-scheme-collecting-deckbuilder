# Riot Sign-On Authentication Endpoints

This document describes the Riot OAuth authentication endpoints implemented for the Zaunite Workshop deck builder.

## Endpoints

### 1. Initialize OAuth Flow
**GET** `/api/auth/riot/init`

Initiates the Riot OAuth flow by generating PKCE parameters and returning the authorization URL.

**Response:**
```json
{
  "authorizationUrl": "https://auth.riotgames.com/authorize?...",
  "state": "random-state-string"
}
```

**Process:**
1. Generates PKCE code_verifier and code_challenge
2. Generates random state parameter
3. Stores code_verifier and state in session
4. Sets session cookie
5. Returns authorization URL for redirect

### 2. Handle OAuth Callback
**GET** `/api/auth/riot/callback?code=xxx&state=yyy`

Handles the OAuth callback from Riot, exchanges the authorization code for tokens, and creates/updates user account.

**Query Parameters:**
- `code`: Authorization code from Riot
- `state`: State parameter for CSRF protection

**Response:**
```json
{
  "success": true,
  "user": {
    "puuid": "...",
    "gameName": "PlayerName",
    "tagLine": "NA1",
    "giteaUsername": "playername-na1"
  }
}
```

**Process:**
1. Validates state parameter against session
2. Exchanges authorization code for access/refresh tokens
3. Fetches user info from Riot API
4. Checks if user exists or creates new user with Gitea account
5. Updates session with user data and tokens
6. Sets httpOnly authentication cookies

### 3. Refresh Access Token
**POST** `/api/auth/refresh`

Refreshes the access token using the refresh token stored in the session.

**Response:**
```json
{
  "success": true
}
```

**Process:**
1. Reads refresh token from session
2. Requests new access token from Riot
3. Updates session with new tokens
4. Updates authentication cookies

### 4. Logout
**POST** `/api/auth/logout`

Logs out the user by revoking tokens and clearing session.

**Response:**
```json
{
  "success": true
}
```

**Process:**
1. Retrieves access token from session
2. Revokes tokens with Riot API
3. Deletes session from database
4. Clears authentication cookies

### 5. Get Current User
**GET** `/api/auth/me`

Returns the currently authenticated user's information.

**Response:**
```json
{
  "user": {
    "puuid": "...",
    "gameName": "PlayerName",
    "tagLine": "NA1",
    "giteaUsername": "playername-na1",
    "summonerIcon": 123
  }
}
```

**Process:**
1. Validates session from cookie
2. Retrieves user data from database
3. Returns user information

## Authentication Middleware

### authenticateRequest
Basic authentication middleware that validates the session cookie.

**Usage:**
```javascript
import { authenticateRequest } from '../middleware/auth.js';

router.get('/protected', authenticateRequest, (req, res) => {
  // req.session contains session data
  // req.sessionId contains session ID
});
```

### authenticateWithRefresh
Advanced authentication middleware that automatically refreshes expired tokens.

**Usage:**
```javascript
import { authenticateWithRefresh } from '../middleware/auth.js';

router.get('/protected', authenticateWithRefresh, (req, res) => {
  // Tokens are automatically refreshed if needed
});
```

### optionalAuth
Optional authentication middleware that attaches session data if available but doesn't require authentication.

**Usage:**
```javascript
import { optionalAuth } from '../middleware/auth.js';

router.get('/public', optionalAuth, (req, res) => {
  // req.session is null if not authenticated
});
```

### checkSessionExpiry
Middleware to check if session is expired and needs refresh.

## Security Features

1. **PKCE (Proof Key for Code Exchange)**: Protects against authorization code interception
2. **State Parameter**: Prevents CSRF attacks
3. **httpOnly Cookies**: Prevents XSS attacks by making tokens inaccessible to JavaScript
4. **Secure Cookies**: Ensures cookies are only sent over HTTPS in production
5. **SameSite Cookies**: Prevents CSRF attacks
6. **Token Encryption**: Gitea passwords are encrypted using AES-256-GCM
7. **Session Expiry**: Sessions automatically expire after 24 hours

## Environment Variables

Required environment variables:

```bash
# Riot OAuth
RIOT_CLIENT_ID=your_riot_client_id
RIOT_CLIENT_SECRET=your_riot_client_secret
RIOT_REDIRECT_URI=http://localhost:5173/auth/callback
RIOT_AUTHORIZATION_URL=https://auth.riotgames.com/authorize
RIOT_TOKEN_URL=https://auth.riotgames.com/token
RIOT_USERINFO_URL=https://auth.riotgames.com/userinfo
RIOT_REVOKE_URL=https://auth.riotgames.com/revoke

# Frontend
FRONTEND_URL=http://localhost:5173

# Session
SESSION_SECRET=your_session_secret_here
SESSION_EXPIRY=86400

# Encryption
ENCRYPTION_KEY=your_encryption_key_here
```

## Testing

Integration tests are available in `src/routes/auth.test.js`. Run tests with:

```bash
npm test -- src/routes/auth.test.js
```

Tests cover:
- PKCE parameter generation
- Authorization URL building
- Session ID generation
- Username sanitization
- Password generation and encryption
- Token refresh validation
- Callback flow validation
