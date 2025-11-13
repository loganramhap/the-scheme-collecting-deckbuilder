# DeckBuilder API

Optional Node.js backend proxy for OAuth handling, user provisioning, and validation.

## Features

- OAuth token exchange proxy
- Automatic Gitea user provisioning
- Server-side deck validation
- Card data caching (future)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
```

Edit `.env` and set the required variables:

### Riot OAuth Configuration (Required)
- `RIOT_CLIENT_ID`: Your Riot OAuth client ID
- `RIOT_CLIENT_SECRET`: Your Riot OAuth client secret
- `RIOT_REDIRECT_URI`: OAuth callback URL (e.g., `http://localhost:5173/auth/callback`)
- `RIOT_AUTHORIZATION_URL`: `https://auth.riotgames.com/authorize`
- `RIOT_TOKEN_URL`: `https://auth.riotgames.com/token`
- `RIOT_USERINFO_URL`: `https://auth.riotgames.com/userinfo`
- `RIOT_REVOKE_URL`: `https://auth.riotgames.com/revoke`

To get Riot OAuth credentials:
1. Visit the [Riot Developer Portal](https://developer.riotgames.com/)
2. Create a new application
3. Set the redirect URI to match your frontend callback URL
4. Copy the client ID and secret to your `.env` file

### Session & Security (Required)
- `SESSION_SECRET`: Random string for session encryption (min 32 characters)
- `SESSION_EXPIRY`: Session duration in seconds (default: 86400 = 24 hours)
- `ENCRYPTION_KEY`: Random string for data encryption (min 32 characters)

Generate secure random strings:
```bash
# On Linux/Mac
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### AWS Configuration (Required)
- `AWS_REGION`: AWS region (e.g., `us-east-1`)
- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
- `DYNAMODB_USERS_TABLE`: DynamoDB table name for users (default: `deckbuilder-users`)
- `DYNAMODB_SESSIONS_TABLE`: DynamoDB table name for sessions (default: `deckbuilder-sessions`)

### Gitea Configuration (Required)
- `GITEA_URL`: Your Gitea instance URL
- `GITEA_ADMIN_TOKEN`: Admin API token for user provisioning

### Other Settings
- `PORT`: Server port (default: 3001)
- `FRONTEND_URL`: Frontend URL for CORS (default: `http://localhost:5173`)

3. Start server:
```bash
npm run dev
```

The server will validate all required environment variables on startup and display any configuration issues.

## API Endpoints

### Authentication

**GET /api/auth/riot/init**
Initialize Riot Sign-On flow. Returns authorization URL with PKCE parameters.

Response:
```json
{
  "authorizationUrl": "https://auth.riotgames.com/authorize?...",
  "state": "random-state-string"
}
```

**GET /api/auth/riot/callback**
Handle OAuth callback after user authorization.

Query params: `code`, `state`

Response:
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

**POST /api/auth/refresh**
Refresh access token using refresh token from cookie.

Response:
```json
{
  "success": true
}
```

**POST /api/auth/logout**
Logout user and revoke tokens.

Response:
```json
{
  "success": true
}
```

**GET /api/auth/me**
Get current authenticated user.

Response:
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

### User Provisioning

**POST /api/provision/user**
Create new Gitea user and personal deck repo.

Request:
```json
{
  "username": "newuser",
  "email": "user@example.com",
  "password": "securepass"
}
```

**GET /api/provision/user/:username**
Check if user exists.

### Validation

**POST /api/validation/mtg**
Validate MTG deck.

Request:
```json
{
  "deck": { /* deck object */ }
}
```

**POST /api/validation/riftbound**
Validate Riftbound deck.

## Usage

The API can be used as:
1. OAuth proxy to keep client secrets secure
2. User provisioning service for new signups
3. Server-side validation for webhooks/CI

## Deployment

Deploy to:
- Node.js server
- Cloudflare Workers (with modifications)
- Vercel/Netlify serverless functions
