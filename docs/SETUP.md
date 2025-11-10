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

## Step 4: Setup Backend API (Optional)

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

4. Edit `.env`:
```
PORT=3001
GITEA_URL=http://localhost:3000
GITEA_ADMIN_TOKEN=<admin_token>
GITEA_CLIENT_ID=<client_id>
GITEA_CLIENT_SECRET=<client_secret>
```

5. Get admin token from Gitea:
   - Settings → Applications → Generate New Token
   - Select all permissions
   - Copy token to `.env`

6. Start API server:
```bash
npm run dev
```

## Step 5: First Login

1. Open web app at `http://localhost:5173`
2. Click "Sign in with Gitea"
3. Authorize the application
4. Create your first deck repository

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
