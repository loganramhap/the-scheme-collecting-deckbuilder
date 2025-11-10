# DeckBuilder Web Application

React + TypeScript web application for building and managing decks with Git version control.

## Features

- Gitea OAuth authentication
- Visual deck editor with card search
- Deck validation and legality checking
- Git operations (commits, branches, PRs, forks)
- Support for MTG (Scryfall API) and Riftbound

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` and set:
- `VITE_GITEA_URL`: Your Gitea instance URL
- `VITE_GITEA_CLIENT_ID`: OAuth application client ID
- `VITE_GITEA_CLIENT_SECRET`: OAuth application client secret

3. Create OAuth application in Gitea:
   - Go to Settings → Applications → Create OAuth2 Application
   - Set redirect URI to `http://localhost:5173/auth/callback`
   - Copy client ID and secret to `.env`

4. Start development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

## Project Structure

```
src/
├── components/       # React components
├── pages/           # Page components
├── services/        # API services (Gitea, cards, validation)
├── store/           # Zustand state management
├── types/           # TypeScript type definitions
├── App.tsx          # Main app component
└── main.tsx         # Entry point
```

## Usage

1. Sign in with your Gitea account
2. Create or select a repository
3. Browse and edit decks
4. Commit changes with messages
5. Create branches for deck variants
6. Open pull requests to merge changes
7. Fork decks from other users

## Deck File Format

Decks are stored as JSON files with `.deck.json` extension:

```json
{
  "game": "mtg",
  "format": "commander",
  "name": "My Deck",
  "cards": [
    { "id": "card-id", "count": 1, "name": "Card Name" }
  ],
  "sideboard": [],
  "metadata": {
    "author": "username",
    "created": "2025-11-10",
    "description": "Deck description"
  }
}
```
