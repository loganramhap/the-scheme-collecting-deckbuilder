# DeckBuilder - Git-Powered Deck Management

A full-featured multi-user deck builder for Magic: The Gathering and Riftbound, powered by Gitea version control.

## Architecture

- **Gitea Backend**: Self-hosted Git server for deck storage and version control
- **Web App**: React + TypeScript frontend with OAuth authentication
- **Gitea Plugin**: Go + React plugin for in-repo deck viewing/editing
- **Optional Proxy**: Node.js backend for OAuth and validation

## Features

- **Multi-user support** with seamless account creation
- **Git-based version control** (commits, branches, forks, PRs)
- **Visual deck editor** with card search and filtering
- **Format legality checking** and validation
- **Deck diffing** and PR workflow
- **Multi-game support**: MTG (via Scryfall) and Riftbound
- **User-friendly interface** that hides Git complexity

## Quick Start

```bash
# 1. Start Gitea instance
docker-compose up -d

# 2. Setup backend API (required for Riot Sign-On authentication)
cd deckbuilder-api
npm install
cp .env.example .env
# Edit .env and configure:
#   - Riot OAuth credentials (RIOT_CLIENT_ID, RIOT_CLIENT_SECRET)
#   - AWS credentials and DynamoDB table names
#   - Session secrets (SESSION_SECRET, ENCRYPTION_KEY)
#   - Gitea admin token (GITEA_ADMIN_TOKEN)
# See deckbuilder-api/README.md for detailed configuration
npm run dev

# 3. Install and run web app
cd ../deckbuilder-webapp
npm install
cp .env.example .env
# Edit .env with backend API URL (VITE_API_URL)
npm run dev

# 4. Access at http://localhost:5173
```

See [docs/SETUP.md](docs/SETUP.md) for detailed setup instructions.

**Note**: The backend API is required for Riot Sign-On authentication. Users sign in with their Riot Games accounts, and Gitea accounts are automatically provisioned.

## Project Structure

```
/
├── gitea-deck-plugin/     # Gitea plugin (Go + React)
├── deckbuilder-webapp/    # Main web application (React + TS)
├── deckbuilder-api/       # Optional backend proxy (Node.js)
├── docker-compose.yml     # Gitea deployment
└── docs/                  # Documentation
```
