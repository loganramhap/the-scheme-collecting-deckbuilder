# DeckBuilder Architecture

## System Overview

DeckBuilder is a Git-powered deck management system that uses Gitea as the backend for version control and collaboration.

## Components

### 1. Gitea (Backend)
- **Role**: Primary data store and version control system
- **Technology**: Self-hosted Git server
- **Responsibilities**:
  - Store deck files as JSON in repositories
  - Manage users and organizations
  - Handle branches, commits, and pull requests
  - Provide OAuth authentication
  - API for all Git operations

### 2. Web Application (Frontend)
- **Role**: Main user interface
- **Technology**: React + TypeScript + Vite
- **Responsibilities**:
  - User authentication via OAuth
  - Visual deck editor
  - Card search and autocomplete
  - Deck validation
  - Git operations (commit, branch, PR, fork)
  - Deck comparison and diff viewer

### 3. Gitea Plugin (Optional)
- **Role**: Enhanced in-repo deck viewing
- **Technology**: Go + HTML/JS
- **Responsibilities**:
  - Detect `.deck.json` files
  - Render visual deck viewer
  - Provide validation API
  - Link to web app for editing

### 4. Backend API (Optional)
- **Role**: Proxy and helper services
- **Technology**: Node.js + Express
- **Responsibilities**:
  - OAuth token exchange
  - User provisioning
  - Server-side validation
  - Card data caching

## Data Flow

### Authentication Flow
```
User → Web App → Gitea OAuth → Authorization
                              ↓
                         Access Token
                              ↓
                    Store in Web App State
                              ↓
                    Use for API Requests
```

### Deck Editing Flow
```
User → Web App → Fetch Deck (Gitea API)
                      ↓
                 Edit in Memory
                      ↓
                 Validate Locally
                      ↓
                 Commit (Gitea API)
                      ↓
                 Update Repository
```

### Pull Request Flow
```
User → Create Branch → Edit Deck → Commit
                                      ↓
                              Create PR (Gitea)
                                      ↓
                              Review Changes
                                      ↓
                              Merge PR
                                      ↓
                              Update Main Branch
```

## Data Model

### Repository Structure
```
user/decks/
├── decks/
│   ├── mtg/
│   │   ├── commander/
│   │   │   └── najeela.deck.json
│   │   └── modern/
│   │       └── burn.deck.json
│   └── riftbound/
│       └── ranked/
│           └── aggro.deck.json
└── README.md
```

### Deck File Schema
```json
{
  "game": "mtg" | "riftbound",
  "format": "commander" | "modern" | "standard" | ...,
  "name": "Deck Name",
  "cards": [
    {
      "id": "unique-card-id",
      "count": 1,
      "name": "Card Name",
      "image_url": "https://..."
    }
  ],
  "sideboard": [],
  "metadata": {
    "author": "username",
    "created": "2025-11-10",
    "updated": "2025-11-10",
    "description": "Deck description",
    "tags": ["competitive", "budget"]
  }
}
```

## Multi-User Model

### Personal Repositories
- Each user has `@username/decks` repository
- Private or public based on user preference
- Full control over branches and commits

### Organization Repositories
- Shared repositories like `@DeckHub/tournament`
- Multiple users with different permissions
- Collaborative deck building
- PR workflow for changes

### Collaboration Features
- **Fork**: Copy deck to your repository
- **Branch**: Create variant of deck
- **Pull Request**: Propose changes to original
- **Merge**: Integrate changes from PR

## Security

### Authentication
- OAuth 2.0 with Gitea
- Token-based API access
- Secure token storage in browser

### Authorization
- Repository-level permissions via Gitea
- Read/write access based on user role
- Organization membership controls

### Data Protection
- HTTPS for all communications
- Encrypted token storage
- No sensitive data in deck files

## Scalability

### Horizontal Scaling
- Web app: Static files, CDN-friendly
- Backend API: Stateless, load-balanced
- Gitea: Clustered deployment possible

### Caching Strategy
- Card data cached in browser
- API responses cached server-side
- Git objects cached by Gitea

### Performance Optimization
- Lazy loading of card images
- Pagination for large deck lists
- Debounced search queries
- Optimistic UI updates

## Integration Points

### External APIs
- **Scryfall**: MTG card data and images
- **Riftbound DB**: Custom card database
- **Gitea API**: All Git operations

### Webhooks
- Deck validation on commit
- Automated testing
- Notification systems
- CI/CD integration

## Future Enhancements

- Real-time collaboration
- Deck statistics and analytics
- Tournament management
- Deck recommendations
- Mobile applications
- Offline support
