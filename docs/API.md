# DeckBuilder API Reference

## Authentication

The deck builder uses Riot Sign-On (RSO) for authentication. Users sign in with their Riot Games accounts, and Gitea accounts are automatically provisioned for deck storage.

### Authentication Flow

1. User clicks "Sign in with Riot Games"
2. Frontend calls `/api/auth/riot/init` to get authorization URL
3. User is redirected to Riot's authorization page
4. After authorization, Riot redirects to `/auth/callback` with code
5. Frontend sends code to `/api/auth/riot/callback`
6. Backend exchanges code for tokens and creates session
7. User is authenticated with httpOnly cookies

## Backend API Endpoints

### Base URL
```
http://localhost:3001/api
```

### Authentication Endpoints

#### Initialize OAuth Flow
```http
GET /api/auth/riot/init
```

Generates PKCE parameters and returns Riot authorization URL.

**Response:**
```json
{
  "authorizationUrl": "https://auth.riotgames.com/authorize?client_id=...&redirect_uri=...&response_type=code&scope=openid&code_challenge=...&code_challenge_method=S256&state=...",
  "state": "random-state-string"
}
```

**Usage:**
```javascript
const response = await fetch('http://localhost:3001/api/auth/riot/init');
const { authorizationUrl } = await response.json();
window.location.href = authorizationUrl;
```

#### Handle OAuth Callback
```http
GET /api/auth/riot/callback?code={code}&state={state}
```

Exchanges authorization code for tokens, fetches user info, and creates/links Gitea account.

**Query Parameters:**
- `code` (required): Authorization code from Riot
- `state` (required): State parameter for CSRF protection

**Response:**
```json
{
  "success": true,
  "user": {
    "puuid": "abc123...",
    "gameName": "PlayerName",
    "tagLine": "NA1",
    "giteaUsername": "playername-na1"
  }
}
```

**Cookies Set:**
- `sessionId`: Session identifier (httpOnly, secure)
- `accessToken`: Riot access token (httpOnly, secure)
- `refreshToken`: Riot refresh token (httpOnly, secure)

**Error Response:**
```json
{
  "error": "invalid_state",
  "message": "State parameter mismatch"
}
```

#### Get Current User
```http
GET /api/auth/me
```

Returns currently authenticated user information.

**Headers:**
```
Cookie: sessionId=...
```

**Response:**
```json
{
  "user": {
    "puuid": "abc123...",
    "gameName": "PlayerName",
    "tagLine": "NA1",
    "giteaUsername": "playername-na1",
    "summonerIcon": 1234
  }
}
```

**Error Response (401):**
```json
{
  "error": "unauthorized",
  "message": "No active session"
}
```

#### Refresh Access Token
```http
POST /api/auth/refresh
```

Refreshes the access token using the refresh token.

**Headers:**
```
Cookie: refreshToken=...
```

**Response:**
```json
{
  "success": true
}
```

**Cookies Updated:**
- `accessToken`: New access token
- `refreshToken`: New refresh token (if rotated)

**Error Response (401):**
```json
{
  "error": "refresh_failed",
  "message": "Invalid or expired refresh token"
}
```

#### Logout
```http
POST /api/auth/logout
```

Revokes tokens with Riot and clears session.

**Headers:**
```
Cookie: sessionId=...; accessToken=...
```

**Response:**
```json
{
  "success": true
}
```

**Cookies Cleared:**
- `sessionId`
- `accessToken`
- `refreshToken`

### Card Data Endpoints

#### Get Riftbound Cards
```http
GET /api/cards/riftbound
```

Returns all Riftbound cards from the database.

**Response:**
```json
{
  "cards": [
    {
      "id": "card-001",
      "name": "Card Name",
      "type": "Unit",
      "cost": 3,
      "attack": 2,
      "health": 3,
      "rarity": "Common",
      "faction": "Demacia",
      "description": "Card text...",
      "imageUrl": "https://..."
    }
  ],
  "count": 150,
  "lastUpdated": "2024-01-01T00:00:00.000Z"
}
```

#### Refresh Card Data
```http
POST /api/cards/riftbound/refresh
```

Triggers a refresh of Riftbound card data from the source.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "cardsUpdated": 150,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Health Check

#### Check API Health
```http
GET /api/health
```

Returns health status of the API and connected services.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "dynamodb": "connected",
    "gitea": "connected",
    "riot": "reachable"
  },
  "version": "1.0.0"
}
```

## Gitea API Integration

The web app uses Gitea's REST API for all Git operations.

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication
All requests require an OAuth token:
```
Authorization: token YOUR_ACCESS_TOKEN
```

## User Operations

### Get Current User
```http
GET /user
```

Response:
```json
{
  "id": 1,
  "username": "user",
  "email": "user@example.com",
  "avatar_url": "https://..."
}
```

### Get User Repositories
```http
GET /users/{username}/repos
```

## Repository Operations

### Create Repository
```http
POST /user/repos
```

Body:
```json
{
  "name": "decks",
  "description": "My deck collection",
  "private": false,
  "auto_init": true
}
```

### Get Repository Contents
```http
GET /repos/{owner}/{repo}/contents/{path}?ref={branch}
```

Response:
```json
{
  "name": "deck.deck.json",
  "path": "decks/deck.deck.json",
  "sha": "abc123",
  "size": 1234,
  "content": "base64_encoded_content",
  "encoding": "base64"
}
```

### Create/Update File
```http
POST /repos/{owner}/{repo}/contents/{path}
```

Body:
```json
{
  "content": "base64_encoded_content",
  "message": "Commit message",
  "branch": "main",
  "sha": "existing_file_sha"
}
```

## Branch Operations

### List Branches
```http
GET /repos/{owner}/{repo}/branches
```

### Create Branch
```http
POST /repos/{owner}/{repo}/branches
```

Body:
```json
{
  "new_branch_name": "feature-branch",
  "old_branch_name": "main"
}
```

### Delete Branch
```http
DELETE /repos/{owner}/{repo}/branches/{branch}
```

## Commit Operations

### List Commits
```http
GET /repos/{owner}/{repo}/commits?sha={branch}&page={page}&limit={limit}
```

### Get Single Commit
```http
GET /repos/{owner}/{repo}/commits/{sha}
```

### Compare Commits
```http
GET /repos/{owner}/{repo}/compare/{base}...{head}
```

Response:
```json
{
  "commits": [...],
  "files": [
    {
      "filename": "deck.deck.json",
      "status": "modified",
      "additions": 5,
      "deletions": 2
    }
  ]
}
```

## Pull Request Operations

### List Pull Requests
```http
GET /repos/{owner}/{repo}/pulls?state={open|closed|all}
```

### Create Pull Request
```http
POST /repos/{owner}/{repo}/pulls
```

Body:
```json
{
  "title": "Update deck",
  "body": "Added new cards",
  "head": "feature-branch",
  "base": "main"
}
```

### Get Pull Request
```http
GET /repos/{owner}/{repo}/pulls/{index}
```

### Merge Pull Request
```http
POST /repos/{owner}/{repo}/pulls/{index}/merge
```

Body:
```json
{
  "Do": "merge",
  "MergeMessageField": "Merge pull request",
  "MergeTitleField": "Merge #123"
}
```

### Get Pull Request Files
```http
GET /repos/{owner}/{repo}/pulls/{index}/files
```

## Fork Operations

### Fork Repository
```http
POST /repos/{owner}/{repo}/forks
```

Body:
```json
{
  "organization": "optional-org-name"
}
```

### List Forks
```http
GET /repos/{owner}/{repo}/forks
```

## Organization Operations

### List User Organizations
```http
GET /user/orgs
```

### Get Organization
```http
GET /orgs/{org}
```

### List Organization Repositories
```http
GET /orgs/{org}/repos
```

## Scryfall API (MTG Cards)

### Base URL
```
https://api.scryfall.com
```

### Search Cards
```http
GET /cards/search?q={query}
```

Query examples:
- `q=lightning bolt` - Name search
- `q=t:creature c:red` - Type and color
- `q=f:commander` - Format legal

Response:
```json
{
  "data": [
    {
      "id": "card-id",
      "name": "Card Name",
      "mana_cost": "{R}",
      "type_line": "Instant",
      "oracle_text": "...",
      "legalities": {
        "commander": "legal",
        "modern": "legal"
      },
      "image_uris": {
        "small": "https://...",
        "normal": "https://...",
        "large": "https://..."
      }
    }
  ]
}
```

### Get Card by ID
```http
GET /cards/{id}
```

### Get Card by Name
```http
GET /cards/named?exact={name}
```

### Autocomplete
```http
GET /cards/autocomplete?q={partial_name}
```

## DeckBuilder Backend API

### Base URL
```
http://localhost:3001/api
```

### OAuth Token Exchange
```http
POST /auth/token
```

Body:
```json
{
  "code": "oauth_code",
  "client_id": "...",
  "client_secret": "...",
  "redirect_uri": "..."
}
```

### Verify Token
```http
GET /auth/verify
Authorization: Bearer {token}
```

### Provision User
```http
POST /provision/user
```

Body:
```json
{
  "username": "newuser",
  "email": "user@example.com",
  "password": "secure_password"
}
```

### Check User Exists
```http
GET /provision/user/{username}
```

### Validate MTG Deck
```http
POST /validation/mtg
```

Body:
```json
{
  "deck": {
    "game": "mtg",
    "format": "commander",
    "cards": [...]
  }
}
```

Response:
```json
{
  "valid": true,
  "errors": [],
  "warnings": []
}
```

### Validate Riftbound Deck
```http
POST /validation/riftbound
```

## Rate Limits

### Backend API (Authentication Endpoints)
- **Limit**: 10 requests per minute per IP address
- **Applies to**: `/api/auth/*` endpoints
- **Response**: 429 Too Many Requests
- **Headers**:
  - `X-RateLimit-Limit`: Maximum requests per window
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Time when limit resets (Unix timestamp)

**Example Response (429):**
```json
{
  "error": "too_many_requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 45
}
```

### Riot API
- **OAuth endpoints**: Rate limited by Riot (typically 100 requests per minute)
- **User info endpoint**: Rate limited by Riot
- **Automatic retry**: Backend implements exponential backoff

### Gitea
- Default: 5000 requests per hour per token
- Configurable in Gitea settings

### Scryfall
- 10 requests per second
- Bulk data available for caching

## Error Handling

### Common HTTP Status Codes

- `200 OK` - Success
- `201 Created` - Resource created
- `204 No Content` - Success, no response body
- `400 Bad Request` - Invalid request
- `401 Unauthorized` - Invalid or missing authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., file exists)
- `422 Unprocessable Entity` - Validation error
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error
- `502 Bad Gateway` - Upstream service (Riot, Gitea) unavailable
- `503 Service Unavailable` - Service temporarily unavailable

### Error Response Format

```json
{
  "error": "error_code",
  "message": "Human-readable error description",
  "details": {
    "field": "Additional context"
  }
}
```

### Authentication Errors

#### 401 Unauthorized - No Session
```json
{
  "error": "unauthorized",
  "message": "No active session. Please sign in."
}
```

**Solution**: Redirect user to login page

#### 401 Unauthorized - Session Expired
```json
{
  "error": "session_expired",
  "message": "Your session has expired. Please sign in again."
}
```

**Solution**: Clear local state and redirect to login

#### 401 Unauthorized - Token Refresh Failed
```json
{
  "error": "refresh_failed",
  "message": "Unable to refresh access token. Please sign in again."
}
```

**Solution**: Clear session and redirect to login

#### 403 Forbidden - Invalid State
```json
{
  "error": "invalid_state",
  "message": "State parameter mismatch. Possible CSRF attack."
}
```

**Solution**: Restart OAuth flow from beginning

### OAuth Errors

#### 400 Bad Request - Authorization Denied
```json
{
  "error": "access_denied",
  "message": "User denied authorization"
}
```

**Solution**: Show message explaining authorization is required

#### 400 Bad Request - Invalid Code
```json
{
  "error": "invalid_code",
  "message": "Authorization code is invalid or expired"
}
```

**Solution**: Restart OAuth flow

#### 502 Bad Gateway - Riot API Error
```json
{
  "error": "riot_api_error",
  "message": "Unable to communicate with Riot API",
  "details": {
    "statusCode": 503,
    "retryAfter": 60
  }
}
```

**Solution**: Show error message and retry button

### Gitea Provisioning Errors

#### 500 Internal Server Error - Provisioning Failed
```json
{
  "error": "gitea_provisioning_failed",
  "message": "Unable to create Gitea account",
  "details": {
    "reason": "Username already exists"
  }
}
```

**Solution**: Contact administrator or retry with different username

### Rate Limiting Errors

#### 429 Too Many Requests
```json
{
  "error": "too_many_requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 45
}
```

**Solution**: Wait for `retryAfter` seconds before retrying

## Webhooks

Configure webhooks in Gitea to trigger on:
- Push events (deck updates)
- Pull request events
- Branch creation/deletion

Webhook payload includes:
- Repository information
- Commit details
- Changed files
- User information

Use webhooks for:
- Automated validation
- Deck statistics
- Notifications
- CI/CD pipelines
