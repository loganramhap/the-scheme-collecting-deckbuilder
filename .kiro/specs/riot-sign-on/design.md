# Design Document - Riot Sign-On Integration

## Overview

This document describes the technical design for implementing Riot Sign-On (RSO) as the primary authentication method for the Zaunite Workshop deck builder. The design follows OAuth 2.0 with PKCE (Proof Key for Code Exchange) for secure authentication, integrates with Riot's APIs, and maintains backward compatibility with the existing Gitea-based deck storage system.

## Architecture

### High-Level Flow

```
┌─────────┐         ┌──────────┐         ┌─────────┐         ┌────────┐
│ Browser │◄───────►│ Frontend │◄───────►│ Backend │◄───────►│  Riot  │
│         │         │  (React) │         │ (Node)  │         │  APIs  │
└─────────┘         └──────────┘         └─────────┘         └────────┘
                                               │
                                               ▼
                                          ┌─────────┐
                                          │  Gitea  │
                                          │ Storage │
                                          └─────────┘
```

### Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Riot
    participant Gitea

    User->>Frontend: Click "Sign in with Riot"
    Frontend->>Backend: GET /auth/riot/init
    Backend->>Backend: Generate PKCE code_verifier & challenge
    Backend->>Backend: Store code_verifier in session
    Backend->>Frontend: Return authorization URL
    Frontend->>Riot: Redirect to authorization URL
    User->>Riot: Authorize application
    Riot->>Frontend: Redirect to callback with code
    Frontend->>Backend: GET /auth/riot/callback?code=xxx
    Backend->>Riot: POST /token (exchange code for tokens)
    Riot->>Backend: Return access_token & refresh_token
    Backend->>Riot: GET /userinfo (fetch user profile)
    Riot->>Backend: Return PUUID, game name, tag
    Backend->>Backend: Check if user exists in database
    alt New User
        Backend->>Gitea: Create new account
        Backend->>Backend: Store PUUID → Gitea mapping
    else Existing User
        Backend->>Backend: Load Gitea credentials
    end
    Backend->>Backend: Set httpOnly cookies with tokens
    Backend->>Frontend: Redirect to dashboard
    Frontend->>User: Show authenticated UI
```

## Components and Interfaces

### 1. Frontend Components

#### 1.1 Login Page (`src/pages/Login.tsx`)

**Purpose:** Display RSO login button and handle OAuth redirect

**Changes:**
- Replace username/password form with "Sign in with Riot Games" button
- Add Riot Games branding and styling
- Handle OAuth callback errors
- Show loading state during authentication

**Interface:**
```typescript
interface LoginPageProps {}

interface LoginPageState {
  loading: boolean;
  error: string | null;
}
```

#### 1.2 Auth Callback Handler (`src/pages/AuthCallback.tsx`)

**Purpose:** Handle OAuth callback and complete authentication

**Changes:**
- Extract authorization code from URL
- Send code to backend
- Handle success/error states
- Redirect to dashboard on success

**Interface:**
```typescript
interface AuthCallbackProps {}

interface AuthCallbackState {
  status: 'processing' | 'success' | 'error';
  error?: string;
}
```

#### 1.3 Auth Store (`src/store/auth.ts`)

**Purpose:** Manage authentication state

**Changes:**
- Replace Gitea token with RSO user data
- Store Riot user profile (PUUID, game name, tag)
- Remove token from localStorage (use httpOnly cookies)
- Add methods for RSO-specific operations

**Interface:**
```typescript
interface RiotUser {
  puuid: string;
  gameName: string;
  tagLine: string;
  summonerIcon?: number;
}

interface AuthState {
  user: RiotUser | null;
  isAuthenticated: boolean;
  giteaUsername: string | null; // For backend operations
  login: () => void; // Initiates RSO flow
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}
```

### 2. Backend Services

#### 2.1 Auth Service (`backend/src/services/authService.ts`)

**Purpose:** Handle RSO OAuth flow and token management

**Responsibilities:**
- Generate PKCE parameters
- Exchange authorization codes for tokens
- Refresh access tokens
- Revoke tokens on logout
- Fetch user profile from Riot

**Interface:**
```typescript
interface PKCEParams {
  codeVerifier: string;
  codeChallenge: string;
  state: string;
}

interface RiotTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

interface RiotUserInfo {
  puuid: string;
  gameName: string;
  tagLine: string;
}

class AuthService {
  generatePKCE(): PKCEParams;
  getAuthorizationUrl(codeChallenge: string, state: string): string;
  exchangeCodeForTokens(code: string, codeVerifier: string): Promise<RiotTokens>;
  refreshAccessToken(refreshToken: string): Promise<RiotTokens>;
  getUserInfo(accessToken: string): Promise<RiotUserInfo>;
  revokeTokens(accessToken: string): Promise<void>;
}
```

#### 2.2 User Service (`backend/src/services/userService.ts`)

**Purpose:** Manage user accounts and Gitea provisioning

**Responsibilities:**
- Check if user exists by PUUID
- Create new Gitea accounts
- Store PUUID → Gitea username mappings
- Retrieve user data

**Interface:**
```typescript
interface UserRecord {
  puuid: string;
  giteaUsername: string;
  giteaPassword: string; // Encrypted
  gameName: string;
  tagLine: string;
  createdAt: Date;
  lastLogin: Date;
}

class UserService {
  findUserByPuuid(puuid: string): Promise<UserRecord | null>;
  createUser(riotUser: RiotUserInfo): Promise<UserRecord>;
  provisionGiteaAccount(username: string, email: string, password: string): Promise<void>;
  updateLastLogin(puuid: string): Promise<void>;
  linkExistingGiteaAccount(puuid: string, giteaUsername: string, giteaPassword: string): Promise<void>;
}
```

#### 2.3 Session Service (`backend/src/services/sessionService.ts`)

**Purpose:** Manage user sessions and cookies

**Responsibilities:**
- Store session data (code_verifier, state)
- Set httpOnly cookies
- Validate sessions
- Clear sessions on logout

**Interface:**
```typescript
interface SessionData {
  codeVerifier?: string;
  state?: string;
  puuid?: string;
  accessToken?: string;
  refreshToken?: string;
  giteaUsername?: string;
}

class SessionService {
  createSession(sessionId: string, data: SessionData): Promise<void>;
  getSession(sessionId: string): Promise<SessionData | null>;
  updateSession(sessionId: string, data: Partial<SessionData>): Promise<void>;
  deleteSession(sessionId: string): Promise<void>;
  setAuthCookies(res: Response, tokens: RiotTokens, puuid: string): void;
  clearAuthCookies(res: Response): void;
}
```

### 3. Backend API Endpoints

#### 3.1 Initialize OAuth Flow

```
GET /api/auth/riot/init
```

**Response:**
```json
{
  "authorizationUrl": "https://auth.riotgames.com/authorize?...",
  "state": "random-state-string"
}
```

**Process:**
1. Generate PKCE code_verifier and code_challenge
2. Generate random state parameter
3. Store code_verifier and state in session
4. Build authorization URL with parameters
5. Return URL to frontend

#### 3.2 Handle OAuth Callback

```
GET /api/auth/riot/callback?code=xxx&state=yyy
```

**Response:**
```json
{
  "success": true,
  "user": {
    "puuid": "...",
    "gameName": "PlayerName",
    "tagLine": "NA1"
  }
}
```

**Process:**
1. Validate state parameter
2. Retrieve code_verifier from session
3. Exchange authorization code for tokens
4. Fetch user info from Riot
5. Check if user exists in database
6. If new user: provision Gitea account
7. Store tokens in httpOnly cookies
8. Return user data

#### 3.3 Refresh Token

```
POST /api/auth/refresh
```

**Response:**
```json
{
  "success": true
}
```

**Process:**
1. Read refresh_token from cookie
2. Request new access token from Riot
3. Update cookies with new tokens
4. Return success

#### 3.4 Logout

```
POST /api/auth/logout
```

**Response:**
```json
{
  "success": true
}
```

**Process:**
1. Read access_token from cookie
2. Revoke tokens with Riot
3. Clear session
4. Clear cookies
5. Return success

#### 3.5 Get Current User

```
GET /api/auth/me
```

**Response:**
```json
{
  "user": {
    "puuid": "...",
    "gameName": "PlayerName",
    "tagLine": "NA1",
    "giteaUsername": "playername-na1"
  }
}
```

**Process:**
1. Read session from cookie
2. Validate session
3. Return user data

### 4. Database Schema

#### 4.1 Users Table

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  puuid VARCHAR(78) UNIQUE NOT NULL,
  gitea_username VARCHAR(255) UNIQUE NOT NULL,
  gitea_password_encrypted TEXT NOT NULL,
  game_name VARCHAR(255) NOT NULL,
  tag_line VARCHAR(255) NOT NULL,
  summoner_icon INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_puuid (puuid),
  INDEX idx_gitea_username (gitea_username)
);
```

#### 4.2 Sessions Table

```sql
CREATE TABLE sessions (
  session_id VARCHAR(255) PRIMARY KEY,
  data JSONB NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_expires_at (expires_at)
);
```

## Data Models

### Frontend Models

```typescript
// src/types/auth.ts
export interface RiotUser {
  puuid: string;
  gameName: string;
  tagLine: string;
  summonerIcon?: number;
}

export interface AuthState {
  user: RiotUser | null;
  isAuthenticated: boolean;
  giteaUsername: string | null;
}
```

### Backend Models

```typescript
// backend/src/types/auth.ts
export interface RiotTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface RiotUserInfoResponse {
  puuid: string;
  game_name: string;
  tag_line: string;
}

export interface UserRecord {
  id: number;
  puuid: string;
  giteaUsername: string;
  giteaPasswordEncrypted: string;
  gameName: string;
  tagLine: string;
  summonerIcon?: number;
  createdAt: Date;
  lastLogin: Date;
}
```

## Error Handling

### Frontend Error Handling

1. **OAuth Errors**: Display user-friendly messages for common OAuth errors
   - `access_denied`: "You need to authorize the application to continue"
   - `invalid_request`: "Something went wrong. Please try again"
   - Network errors: "Cannot connect to server. Please check your connection"

2. **Session Expiry**: Automatically redirect to login when session expires

3. **API Errors**: Show toast notifications for API failures with retry options

### Backend Error Handling

1. **OAuth Errors**: Log detailed errors, return generic messages to frontend
2. **Gitea Provisioning Errors**: Retry with exponential backoff, alert on failure
3. **Database Errors**: Log and return 500 status with generic message
4. **Token Refresh Errors**: Clear session and require re-authentication

### Error Logging

```typescript
interface ErrorLog {
  timestamp: Date;
  level: 'error' | 'warn' | 'info';
  service: string;
  message: string;
  stack?: string;
  userId?: string;
  metadata?: Record<string, any>;
}
```

## Security Considerations

### 1. PKCE Implementation

- Use SHA-256 for code_challenge
- Generate cryptographically secure random code_verifier (43-128 characters)
- Store code_verifier server-side only
- Validate code_verifier during token exchange

### 2. State Parameter

- Generate cryptographically secure random state
- Store state in session
- Validate state on callback to prevent CSRF

### 3. Token Storage

- Store tokens in httpOnly cookies (not accessible to JavaScript)
- Use Secure flag for HTTPS-only transmission
- Use SameSite=Strict to prevent CSRF
- Encrypt refresh tokens before storing in database

### 4. Session Management

- Use secure session IDs (UUID v4)
- Set session expiration (24 hours)
- Clean up expired sessions regularly
- Invalidate sessions on logout

### 5. Gitea Credentials

- Generate strong random passwords (32 characters)
- Encrypt passwords using AES-256-GCM before storing
- Never expose Gitea passwords to frontend
- Use Gitea tokens for API operations (not passwords)

### 6. Rate Limiting

- Implement rate limiting on auth endpoints
- Limit: 10 requests per minute per IP
- Return 429 status when limit exceeded

## Testing Strategy

### Unit Tests

1. **Auth Service Tests**
   - PKCE generation and validation
   - Token exchange logic
   - Token refresh logic
   - User info fetching

2. **User Service Tests**
   - User creation
   - Gitea provisioning
   - Username generation
   - Password encryption/decryption

3. **Session Service Tests**
   - Session creation and retrieval
   - Cookie setting and clearing
   - Session expiration

### Integration Tests

1. **OAuth Flow Tests**
   - Complete authentication flow
   - Callback handling
   - Error scenarios

2. **API Endpoint Tests**
   - All auth endpoints
   - Authentication middleware
   - Error responses

3. **Database Tests**
   - User CRUD operations
   - Session management
   - Data integrity

### End-to-End Tests

1. **User Journey Tests**
   - New user sign-up flow
   - Existing user login
   - Session persistence
   - Logout flow

2. **Error Scenario Tests**
   - OAuth denial
   - Network failures
   - Token expiration
   - Invalid sessions

## Migration Strategy

### Phase 1: Parallel Authentication (Week 1)

- Implement RSO alongside existing Gitea auth
- Add "Sign in with Riot" button below existing form
- Allow users to try RSO without removing old auth
- Monitor for issues

### Phase 2: Encourage Migration (Week 2)

- Show banner encouraging users to link Riot account
- Provide one-click migration for existing users
- Track migration rate

### Phase 3: RSO as Primary (Week 3)

- Make RSO the default/only option
- Hide Gitea auth UI
- Maintain backend support for unmigrated users

### Phase 4: Cleanup (Week 4)

- Remove Gitea auth code from frontend
- Archive old authentication endpoints
- Update documentation

## Configuration

### Environment Variables

```bash
# Riot OAuth
RIOT_CLIENT_ID=your_client_id
RIOT_CLIENT_SECRET=your_client_secret
RIOT_REDIRECT_URI=https://zauniteworkshop.com/auth/callback
RIOT_AUTHORIZATION_URL=https://auth.riotgames.com/authorize
RIOT_TOKEN_URL=https://auth.riotgames.com/token
RIOT_USERINFO_URL=https://auth.riotgames.com/userinfo

# Session
SESSION_SECRET=your_session_secret
SESSION_EXPIRY=86400 # 24 hours

# Encryption
ENCRYPTION_KEY=your_encryption_key

# Gitea
GITEA_URL=http://localhost:3000
GITEA_ADMIN_TOKEN=your_admin_token

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/deckbuilder
```

## Performance Considerations

1. **Token Caching**: Cache valid access tokens to avoid unnecessary refreshes
2. **Database Indexing**: Index puuid and giteaUsername for fast lookups
3. **Session Cleanup**: Run background job to clean expired sessions
4. **Connection Pooling**: Use connection pooling for database and HTTP requests

## Monitoring and Observability

### Metrics to Track

1. **Authentication Metrics**
   - Login success/failure rate
   - Token refresh rate
   - Session duration
   - OAuth errors

2. **User Metrics**
   - New user registrations
   - Active users
   - Migration rate

3. **Performance Metrics**
   - Auth endpoint response times
   - Token exchange latency
   - Database query times

### Logging

- Log all authentication events (login, logout, token refresh)
- Log OAuth errors with sanitized details
- Log Gitea provisioning events
- Use structured logging (JSON format)

## Rollback Plan

If critical issues arise:

1. **Immediate**: Disable RSO login button, show maintenance message
2. **Short-term**: Re-enable Gitea authentication
3. **Investigation**: Review logs, identify root cause
4. **Fix**: Deploy hotfix
5. **Re-enable**: Gradually re-enable RSO with monitoring

## Future Enhancements

1. **Social Features**: Show friends' decks, compare collections
2. **Summoner Integration**: Display summoner stats, match history
3. **Account Linking**: Link multiple Riot accounts
4. **Regional Support**: Handle different Riot regions properly
5. **Mobile App**: Extend RSO to mobile applications
