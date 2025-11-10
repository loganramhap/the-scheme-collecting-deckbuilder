# DeckBuilder Documentation

Complete documentation for the DeckBuilder system.

## Quick Links

- [Setup Guide](SETUP.md) - Installation and configuration
- [Architecture](ARCHITECTURE.md) - System design and components
- [Usage Guide](USAGE.md) - How to use DeckBuilder
- [API Reference](API.md) - API endpoints and integration

## What is DeckBuilder?

DeckBuilder is a Git-powered deck management system for trading card games. It combines the power of version control with an intuitive deck building interface.

### Key Features

- **Version Control**: Every deck edit is a commit with full history
- **Branching**: Create deck variants without affecting the original
- **Pull Requests**: Collaborate on decks with review workflow
- **Forking**: Copy and modify others' decks
- **Multi-User**: Personal and organization repositories
- **Multi-Game**: Support for MTG and Riftbound
- **Validation**: Format legality checking
- **Card Search**: Integration with Scryfall and custom databases

## System Components

### 1. Gitea Backend
Self-hosted Git server that stores all deck data and handles version control.

**Technology**: Go-based Git server  
**Port**: 3000  
**Documentation**: [Gitea Docs](https://docs.gitea.io/)

### 2. Web Application
React-based frontend for deck building and management.

**Technology**: React + TypeScript + Vite  
**Port**: 5173  
**Documentation**: [Web App README](../deckbuilder-webapp/README.md)

### 3. Gitea Plugin (Optional)
Enhances Gitea's UI for viewing deck files.

**Technology**: Go + HTML/JS  
**Port**: 8080  
**Documentation**: [Plugin README](../gitea-deck-plugin/README.md)

### 4. Backend API (Optional)
Proxy service for OAuth and validation.

**Technology**: Node.js + Express  
**Port**: 3001  
**Documentation**: [API README](../deckbuilder-api/README.md)

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js 18+
- Go 1.21+ (for plugin)

### Quick Start

1. **Start Gitea**:
```bash
docker-compose up -d
```

2. **Setup Web App**:
```bash
cd deckbuilder-webapp
npm install
cp .env.example .env
# Edit .env with OAuth credentials
npm run dev
```

3. **Access Application**:
- Gitea: http://localhost:3000
- Web App: http://localhost:5173

See [Setup Guide](SETUP.md) for detailed instructions.

## Use Cases

### Personal Deck Collection
- Store all your decks in one place
- Track changes over time
- Test different versions
- Never lose a deck list

### Team Collaboration
- Share decks with teammates
- Review and approve changes
- Maintain tournament-ready lists
- Coordinate deck choices

### Community Deck Database
- Public repository of decks
- Community contributions via PRs
- Deck ratings and comments
- Format-specific collections

### Tournament Management
- Official tournament decklists
- Version control for banned lists
- Historical deck data
- Player deck submissions

## Deck File Format

Decks are stored as JSON files:

```json
{
  "game": "mtg",
  "format": "commander",
  "name": "Deck Name",
  "cards": [
    {
      "id": "card-id",
      "count": 1,
      "name": "Card Name"
    }
  ],
  "metadata": {
    "author": "username",
    "created": "2025-11-10",
    "description": "Deck description"
  }
}
```

See [examples](../examples/) for complete deck files.

## Workflow Examples

### Creating a New Deck
1. Sign in to web app
2. Navigate to your repository
3. Click "New Deck"
4. Search and add cards
5. Validate deck
6. Commit with message

### Testing Deck Variants
1. Open existing deck
2. Create new branch (e.g., "budget-version")
3. Modify cards
4. Commit changes
5. Compare branches
6. Merge if satisfied

### Collaborating on a Deck
1. Fork teammate's deck
2. Make improvements
3. Create pull request
4. Teammate reviews changes
5. Discuss in PR comments
6. Merge when approved

## Supported Games

### Magic: The Gathering
- Card data from Scryfall API
- Formats: Commander, Modern, Standard, Legacy, Vintage
- Legality checking
- Mana curve analysis

### Riftbound
- Custom card database
- Formats: Ranked, Casual, Draft
- Faction restrictions
- Rank requirements

## Architecture Highlights

### Data Storage
- Decks stored as JSON in Git repositories
- Full version history preserved
- Efficient storage with Git compression
- Easy backup and migration

### Authentication
- OAuth 2.0 with Gitea
- Secure token-based API access
- No passwords stored in web app
- Automatic token refresh

### Scalability
- Stateless web app (CDN-friendly)
- Horizontal scaling possible
- Caching at multiple levels
- Efficient Git operations

## Development

### Project Structure
```
/
├── deckbuilder-webapp/    # React web app
├── gitea-deck-plugin/     # Gitea plugin
├── deckbuilder-api/       # Backend API
├── docs/                  # Documentation
├── examples/              # Example decks
└── docker-compose.yml     # Gitea deployment
```

### Contributing
1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

### Testing
- Unit tests for validation logic
- Integration tests for API
- E2E tests for web app
- Manual testing checklist

## Deployment

### Development
- Local Docker Compose setup
- Hot reload for web app
- Debug logging enabled

### Production
- HTTPS with reverse proxy
- PostgreSQL for Gitea
- CDN for static assets
- Monitoring and logging

See [Setup Guide](SETUP.md) for deployment instructions.

## Troubleshooting

### Common Issues

**OAuth not working**
- Verify redirect URI matches exactly
- Check client ID and secret
- Ensure Gitea is accessible

**Cards not loading**
- Check Scryfall API status
- Verify network connectivity
- Check browser console for errors

**Deck won't save**
- Verify write permissions
- Check commit message is not empty
- Ensure valid JSON format

See [Usage Guide](USAGE.md) for more troubleshooting tips.

## Resources

### External Documentation
- [Gitea Documentation](https://docs.gitea.io/)
- [Scryfall API](https://scryfall.com/docs/api)
- [React Documentation](https://react.dev/)
- [Git Documentation](https://git-scm.com/doc)

### Community
- GitHub Issues for bug reports
- Discussions for feature requests
- Discord for community chat
- Wiki for community guides

## Roadmap

### Planned Features
- [ ] Real-time collaboration
- [ ] Deck statistics and analytics
- [ ] Mobile apps (iOS/Android)
- [ ] Offline support
- [ ] Deck recommendations
- [ ] Tournament management
- [ ] Deck pricing integration
- [ ] Card collection tracking

### Future Games
- [ ] Pokémon TCG
- [ ] Yu-Gi-Oh!
- [ ] Flesh and Blood
- [ ] Custom game support

## License

This project is open source. See LICENSE file for details.

## Support

- Documentation: This folder
- Issues: GitHub Issues
- Email: support@deckbuilder.example
- Discord: discord.gg/deckbuilder
