# DeckBuilder - Git-Powered Deck Management

A full-featured multi-user deck builder for Magic: The Gathering and Riftbound, powered by Gitea version control.

## Architecture

- **Gitea Backend**: Self-hosted Git server for deck storage and version control
- **Web App**: React + TypeScript frontend with OAuth authentication
- **Gitea Plugin**: Go + React plugin for in-repo deck viewing/editing
- **Optional Proxy**: Node.js backend for OAuth and validation

## Features

- Multi-user support via Gitea OAuth
- Git-based version control (commits, branches, forks, PRs)
- Visual deck editor with card search
- Format legality checking and validation
- Deck diffing and PR workflow
- Support for MTG (via Scryfall) and Riftbound

## Quick Start

```bash
# Start Gitea instance
docker-compose up -d

# Install web app dependencies
cd deckbuilder-webapp
npm install
npm run dev

# Build Gitea plugin
cd ../gitea-deck-plugin
go build
```

See individual component READMEs for detailed setup instructions.

## Project Structure

```
/
├── gitea-deck-plugin/     # Gitea plugin (Go + React)
├── deckbuilder-webapp/    # Main web application (React + TS)
├── deckbuilder-api/       # Optional backend proxy (Node.js)
├── docker-compose.yml     # Gitea deployment
└── docs/                  # Documentation
```
