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
- `VITE_API_URL`: Backend API URL (default: `http://localhost:3001/api`)
- `VITE_GITEA_URL`: Your Gitea instance URL (for deck storage)
- `VITE_RIOT_API_KEY`: (Optional) Riot Games API key for Riftbound card updates
- `VITE_USE_RIOT_API`: (Optional) Set to `true` to enable Riot API for card loading

**Note**: Authentication is now handled via Riot Sign-On through the backend API. The old Gitea OAuth variables (`VITE_GITEA_CLIENT_ID`, `VITE_GITEA_CLIENT_SECRET`) are no longer used for authentication but are kept for backward compatibility.

3. Ensure backend API is running:
   - The backend API must be configured and running for authentication to work
   - See `deckbuilder-api/README.md` for backend setup instructions
   - Backend handles Riot OAuth flow and Gitea account provisioning

4. Start development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

## Riot Games API Configuration (Riftbound)

To enable automatic card data updates for Riftbound, you need to configure a Riot Games API key:

### Getting Your API Key

1. Visit the [Riot Developer Portal](https://developer.riotgames.com/)
2. Sign in with your Riot Games account
3. Register your application (if needed)
4. Generate an API key

### Configuration

Add your API key to the `.env` file:

```bash
VITE_RIOT_API_KEY=RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### API Key Format

Riot API keys follow this format:
- Prefix: `RGAPI-`
- Followed by: UUID-like string (8-4-4-4-12 hexadecimal characters)
- Example: `RGAPI-12345678-1234-1234-1234-123456789abc`

### Behavior

- **With API Key**: Card data automatically updates from Riot's official API
- **Without API Key**: Application falls back to cached/static card data
- **Cache Duration**: Card data is cached for 24 hours to minimize API calls
- **Manual Refresh**: Users can manually refresh card data via the UI

### Troubleshooting

If you encounter API errors:

1. **401/403 Errors**: Check that your API key is valid and not expired
2. **429 Rate Limit**: You've exceeded the API rate limit; wait before retrying
3. **500+ Errors**: Riot API service is temporarily unavailable; cached data will be used

The application will display warnings in the console if:
- API key is not configured
- API key format appears invalid
- API requests fail (with fallback to cache)

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
