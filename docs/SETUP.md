# DeckBuilder Setup Guide

Complete setup instructions for deploying the DeckBuilder system.

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ and npm
- Go 1.21+ (for Gitea plugin)
- Git

## Step 1: Deploy Gitea

1. Start Gitea with Docker Compose:
```bash
docker-compose up -d
```

2. Access Gitea at `http://localhost:3000`

3. Complete initial setup:
   - Create admin account
   - Configure site settings

4. Create OAuth application:
   - Go to Settings → Applications
   - Click "Create OAuth2 Application"
   - Name: "DeckBuilder"
   - Redirect URI: `http://localhost:5173/auth/callback`
   - Save client ID and secret

## Step 2: Configure Web App

1. Navigate to web app:
```bash
cd deckbuilder-webapp
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Edit `.env` with your OAuth credentials:
```
VITE_GITEA_URL=http://localhost:3000
VITE_GITEA_CLIENT_ID=<your_client_id>
VITE_GITEA_CLIENT_SECRET=<your_client_secret>
VITE_REDIRECT_URI=http://localhost:5173/auth/callback
```

5. Start development server:
```bash
npm run dev
```

6. Access at `http://localhost:5173`

## Step 3: Build Gitea Plugin (Optional)

1. Navigate to plugin directory:
```bash
cd gitea-deck-plugin
```

2. Build plugin:
```bash
go build -o deck-plugin
```

3. Run plugin:
```bash
./deck-plugin
```

4. Access viewer at `http://localhost:8080/viewer/`

## Step 4: Setup Backend API (Required for Riot Sign-On)

The backend API is **required** for Riot Sign-On authentication. Users sign in with their Riot Games accounts, and Gitea accounts are automatically provisioned.

### Quick Setup

For detailed Riot Sign-On configuration, see [RIOT_SIGN_ON_SETUP.md](RIOT_SIGN_ON_SETUP.md).

### Basic Configuration

1. Navigate to API directory:
```bash
cd deckbuilder-api
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure Riot OAuth:
   - Visit [Riot Developer Portal](https://developer.riotgames.com/)
   - Create a new application
   - Set redirect URI to `http://localhost:5173/auth/callback`
   - Copy client ID and secret

5. Get Gitea admin token:
   - Log in to Gitea as admin
   - Go to Settings → Applications
   - Click "Generate New Token"
   - Name it "DeckBuilder API"
   - Select all permissions (especially `admin:user`)
   - Copy the generated token

6. Set up AWS DynamoDB:
   - Create two tables: `deckbuilder-users` and `deckbuilder-sessions`
   - Get AWS access key and secret
   - See [RIOT_SIGN_ON_SETUP.md](RIOT_SIGN_ON_SETUP.md) for detailed instructions

7. Edit `.env` with all required values:
```bash
# Riot OAuth
RIOT_CLIENT_ID=<your_riot_client_id>
RIOT_CLIENT_SECRET=<your_riot_client_secret>
RIOT_REDIRECT_URI=http://localhost:5173/auth/callback

# Session & Security (generate secure random strings)
SESSION_SECRET=<generate_32_char_random_string>
ENCRYPTION_KEY=<generate_32_char_random_string>

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your_aws_access_key>
AWS_SECRET_ACCESS_KEY=<your_aws_secret_key>
DYNAMODB_USERS_TABLE=deckbuilder-users
DYNAMODB_SESSIONS_TABLE=deckbuilder-sessions

# Gitea
GITEA_URL=http://localhost:3000
GITEA_ADMIN_TOKEN=<paste_admin_token_here>

# Other
PORT=3001
FRONTEND_URL=http://localhost:5173
```

8. Update web app `.env` to include API URL:
```bash
cd ../deckbuilder-webapp
```

Edit `.env`:
```
VITE_API_URL=http://localhost:3001/api
```

9. Start API server:
```bash
cd ../deckbuilder-api
npm run dev
```

The server will validate all environment variables on startup. If any are missing or invalid, you'll see detailed error messages.

**Note**: The API server must be running for authentication to work. Users sign in with Riot Games accounts, and Gitea accounts are automatically created for deck storage.

## Step 5: First Login

1. Open web app at `http://localhost:5173`
2. Click "Sign in with Riot Games"
3. Sign in with your Riot account
4. Authorize the application
5. A Gitea account will be automatically created
6. Create your first deck repository

## Production Deployment

### Gitea
- Use PostgreSQL for production database
- Configure HTTPS with reverse proxy (Nginx/Caddy)
- Set up backups for Git repositories

### Web App
- Build for production: `npm run build`
- Deploy to:
  - Cloudflare Pages
  - Vercel
  - Netlify
  - Self-hosted Nginx

### Backend API
- Deploy to Node.js server or serverless platform
- Use environment variables for secrets
- Enable CORS for your domain

### Gitea Plugin
- Build for production
- Run as systemd service
- Configure reverse proxy to route deck viewer requests

## Troubleshooting

### OAuth errors
- Verify redirect URI matches exactly
- Check client ID and secret
- Ensure Gitea is accessible from web app

### CORS issues
- Configure Gitea to allow CORS from web app domain
- Use backend API as proxy

### Card search not working
- Check Scryfall API rate limits
- Verify network connectivity
- Use backend API for caching

## Next Steps

- Create deck templates
- Set up organizations for shared decks
- Configure webhooks for validation
- Import existing deck collections
