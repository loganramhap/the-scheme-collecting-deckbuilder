# DeckBuilder Usage Guide

## Getting Started

### 1. Sign In
- Open the web app at `http://localhost:5173`
- Click "Sign in with Gitea"
- Authorize the application
- You'll be redirected to the dashboard

### 2. Create Your First Repository
- Click "Create Deck Repo" on the dashboard
- A new repository named "decks" will be created
- This is your personal deck collection

## Managing Decks

### Creating a New Deck

1. Navigate to your repository
2. Create a new file in the `decks/` folder
3. Name it with `.deck.json` extension (e.g., `my-deck.deck.json`)
4. Use this template:

```json
{
  "game": "mtg",
  "format": "commander",
  "name": "My Awesome Deck",
  "cards": [],
  "sideboard": [],
  "metadata": {
    "author": "your-username",
    "created": "2025-11-10",
    "description": "Deck description here"
  }
}
```

### Editing a Deck

1. Click on a deck from your deck list
2. Use the card search to find cards
3. Click "Add" to add cards to your deck
4. Adjust quantities with +/- buttons
5. Remove cards with the × button
6. Enter a commit message
7. Click "Commit Changes" to save

### Validating a Deck

1. Open a deck in the editor
2. Click "Validate Deck"
3. Review errors and warnings
4. Fix any issues
5. Validate again until deck is legal

## Version Control

### Creating Branches

Branches let you create deck variants without affecting the main version.

1. Go to your repository in Gitea
2. Click "Branches" → "New Branch"
3. Name it (e.g., "budget-version", "competitive")
4. Edit the deck in that branch
5. Switch between branches to compare

### Committing Changes

Every deck edit creates a commit:

1. Make changes to your deck
2. Enter a descriptive commit message
   - Good: "Added more removal spells"
   - Bad: "update"
3. Click "Commit Changes"
4. View commit history in Gitea

### Creating Pull Requests

Use PRs to merge changes between branches or propose changes to others' decks.

1. Navigate to "Pull Requests" for a repository
2. Click "New Pull Request"
3. Select source branch (your changes)
4. Select target branch (where to merge)
5. Add title and description
6. Click "Create Pull Request"
7. Review changes
8. Click "Merge" when ready

### Forking Decks

Fork someone else's deck to your account:

1. Find a deck you like in another user's repository
2. Click "Fork" in Gitea
3. The deck is copied to your account
4. Make your own modifications
5. Optionally create a PR to contribute back

## Collaboration

### Working with Organizations

Organizations allow teams to share decks:

1. Create an organization in Gitea
2. Add members with appropriate permissions
3. Create a deck repository in the org
4. All members can view/edit based on permissions

### Sharing Decks

**Public Repository:**
- Anyone can view your decks
- Share the repository URL
- Others can fork and modify

**Private Repository:**
- Only you and collaborators can access
- Add collaborators in repository settings
- Good for testing unreleased decks

### Reviewing Changes

When someone creates a PR:

1. Go to the PR page
2. Review the deck changes
3. Add comments if needed
4. Test the deck if possible
5. Approve and merge, or request changes

## Card Search

### MTG Cards (Scryfall)

Search syntax:
- `"Lightning Bolt"` - Exact name
- `t:creature` - Type search
- `c:red` - Color search
- `cmc=3` - Mana cost
- `f:commander` - Format legal

### Riftbound Cards

Search by:
- Card name
- Faction
- Card type
- Rank

## Deck Formats

### Magic: The Gathering

Supported formats:
- **Commander**: 100 cards, singleton (except basics)
- **Modern**: 60+ cards, 4-of limit
- **Standard**: 60+ cards, 4-of limit
- **Legacy**: 60+ cards, 4-of limit
- **Vintage**: 60+ cards, restricted list

### Riftbound

Supported formats:
- **Ranked**: 30-40 cards, faction restrictions
- **Casual**: Flexible rules
- **Draft**: Limited format

## Tips and Best Practices

### Commit Messages
- Be descriptive: "Added 3 counterspells for control matchup"
- Reference cards: "Replaced Sol Ring with Arcane Signet"
- Note reasoning: "Testing faster mana curve"

### Branch Naming
- `budget` - Budget version of deck
- `competitive` - Optimized for competition
- `test-<feature>` - Testing specific cards
- `v2`, `v3` - Version iterations

### Deck Organization
```
decks/
├── mtg/
│   ├── commander/
│   ├── modern/
│   └── standard/
└── riftbound/
    ├── ranked/
    └── casual/
```

### Metadata Tags
Use tags for easy filtering:
- `competitive`, `casual`, `budget`
- `aggro`, `control`, `combo`, `midrange`
- `tested`, `theory`, `wip`

## Troubleshooting

### Deck Won't Save
- Check commit message is not empty
- Verify you have write access to repository
- Ensure deck JSON is valid

### Card Search Not Working
- Check internet connection
- Verify Scryfall API is accessible
- Try simpler search terms

### Validation Errors
- Read error messages carefully
- Check format-specific rules
- Verify card legality in format

### OAuth Issues
- Clear browser cache and cookies
- Re-authorize the application
- Check OAuth credentials in .env

## Advanced Features

### Deck Comparison

Compare two versions:
1. Go to repository in Gitea
2. Click "Compare"
3. Select two branches or commits
4. View added/removed cards

### Batch Operations

Edit multiple decks:
1. Clone repository locally
2. Edit JSON files with text editor
3. Commit all changes at once
4. Push to Gitea

### API Integration

Use Gitea API directly:
```bash
# Get deck content
curl -H "Authorization: token YOUR_TOKEN" \
  http://localhost:3000/api/v1/repos/user/decks/contents/decks/my-deck.deck.json

# Update deck
curl -X POST -H "Authorization: token YOUR_TOKEN" \
  -d '{"content":"base64_encoded_json","message":"Update deck"}' \
  http://localhost:3000/api/v1/repos/user/decks/contents/decks/my-deck.deck.json
```

## Keyboard Shortcuts

- `Ctrl+S` - Save deck (commit)
- `Ctrl+F` - Focus search
- `Esc` - Clear search results
- `+` / `-` - Adjust card count

## Mobile Usage

The web app is responsive:
- Touch-friendly buttons
- Swipe to navigate
- Mobile-optimized card search
- Works on tablets and phones
