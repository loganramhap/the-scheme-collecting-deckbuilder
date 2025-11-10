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

Edit `.env` and set:
- `GITEA_URL`: Your Gitea instance URL
- `GITEA_ADMIN_TOKEN`: Admin API token for user provisioning
- `GITEA_CLIENT_ID`: OAuth client ID
- `GITEA_CLIENT_SECRET`: OAuth client secret

3. Start server:
```bash
npm run dev
```

## API Endpoints

### Authentication

**POST /api/auth/token**
Exchange OAuth code for access token.

Request:
```json
{
  "code": "oauth_code",
  "client_id": "...",
  "client_secret": "...",
  "redirect_uri": "..."
}
```

**GET /api/auth/verify**
Verify token and get user info.

Headers: `Authorization: Bearer <token>`

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
