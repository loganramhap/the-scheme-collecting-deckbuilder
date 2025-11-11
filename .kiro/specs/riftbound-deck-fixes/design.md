# Design Document: Riftbound Deck Builder Fixes

## Overview

This design addresses three critical bugs in the Riftbound deck builder:
1. Runes incorrectly counted in the 40-card main deck
2. Missing battlefield selection (3 required)
3. Card filtering not working based on Legend's domain

The solution involves restructuring the deck data model, updating the filtering logic, and redesigning the UI layout to accommodate all deck zones.

## Architecture

### Updated Deck Data Model

```typescript
interface RiftboundDeck extends Deck {
  game: 'riftbound';
  
  // Special slots
  legend: DeckCard | null;           // 1 Legend card
  battlefields: DeckCard[];          // Exactly 3 Battlefield cards
  
  // Separate decks
  cards: DeckCard[];                 // Main deck (40 cards)
  runeDeck: DeckCard[];              // Rune deck (12 cards)
  
  // Metadata
  legendDomain?: string;             // Extracted from Legend card
}
```

### Card Type Identification

```typescript
interface RiftboundCard extends Card {
  card_type: string;  // "Unit", "Spell", "Gear", "Basic Rune", "Battlefield", "Legend", etc.
  domain: string;     // "Fury", "Calm", "Mind", "Body", "Order", "Colorless"
}

// Helper functions
function isBasicRune(card: RiftboundCard): boolean {
  return card.card_type === 'Basic Rune';
}

function isBattlefield(card: RiftboundCard): boolean {
  return card.card_type === 'Battlefield';
}

function isLegend(card: RiftboundCard): boolean {
  return card.card_type === 'Legend';
}
```

## Components and Interfaces

### 1. Updated RiftboundBuilder Component

**New Layout Structure:**

```
┌─────────────────────────────────────────────────────────┐
│  Legend Slot                                            │
│  [Card Image]                                           │
│  Domain: Fury                                           │
├─────────────────────────────────────────────────────────┤
│  Battlefields (2/3)                                     │
│  [Slot 1]  [Slot 2]  [Empty]                           │
├─────────────────────────────────────────────────────────┤
│  Main Deck: 35/40  │  Rune Deck: 8/12                  │
├─────────────────────────────────────────────────────────┤
│  Card Browser (filtered by Legend domain)              │
│  [Card Grid]                                            │
└─────────────────────────────────────────────────────────┘
```

**Updated State:**

```typescript
interface RiftboundBuilderState {
  legend: DeckCard | null;
  battlefields: DeckCard[];          // Max 3
  mainDeckCards: DeckCard[];         // Target 40
  runeDeckCards: DeckCard[];         // Target 12
  legendDomain: string | null;
}
```

### 2. BattlefieldSelector Component

**Purpose:** Allow selection of exactly 3 battlefield cards

**Props:**
```typescript
interface BattlefieldSelectorProps {
  battlefields: DeckCard[];
  onBattlefieldAdd: (card: DeckCard) => void;
  onBattlefieldRemove: (index: number) => void;
  availableCards: RiftboundCard[];
}
```

**Features:**
- 3 slots displayed horizontally
- Click empty slot to open battlefield picker modal
- Click filled slot to remove battlefield
- Visual indicator when all 3 slots filled

### 3. RuneDeckZone Component

**Purpose:** Manage the 12-card rune deck separately

**Props:**
```typescript
interface RuneDeckZoneProps {
  runeDeck: DeckCard[];
  onRuneAdd: (card: DeckCard) => void;
  onRuneRemove: (cardId: string) => void;
  availableRunes: RiftboundCard[];
}
```

**Features:**
- Display rune count (X/12)
- Show rune cards in a compact grid
- Filter card browser to show only Basic Rune cards
- Prevent adding more than 12 runes

### 4. Updated Card Filtering Logic

**Domain-Based Filtering:**

```typescript
function filterByDomain(
  cards: RiftboundCard[], 
  legendDomain: string | null
): RiftboundCard[] {
  if (!legendDomain) {
    return cards;
  }
  
  return cards.filter(card => {
    // Colorless cards are always legal
    if (card.domain === 'Colorless') {
      return true;
    }
    
    // Card must match legend's domain
    return card.domain === legendDomain;
  });
}
```

**Card Type Filtering:**

```typescript
function getMainDeckCards(cards: RiftboundCard[]): RiftboundCard[] {
  return cards.filter(card => 
    !isBasicRune(card) && 
    !isBattlefield(card) && 
    !isLegend(card)
  );
}

function getRuneCards(cards: RiftboundCard[]): RiftboundCard[] {
  return cards.filter(isBasicRune);
}

function getBattlefieldCards(cards: RiftboundCard[]): RiftboundCard[] {
  return cards.filter(isBattlefield);
}
```

## Data Flow

### Legend Selection Flow

```
User selects Legend
    ↓
Extract Legend's Domain from card data
    ↓
Update legendDomain in state
    ↓
Filter available cards by domain
    ↓
Update card browser display
```

### Card Addition Flow

```
User clicks card in browser
    ↓
Check card type
    ↓
├─ Basic Rune? → Add to runeDeck (if < 12)
├─ Battlefield? → Add to battlefields (if < 3)
└─ Other? → Add to mainDeckCards
    ↓
Update deck state
    ↓
Trigger validation
```

## Validation Logic

### Updated Validation Rules

```typescript
interface DeckValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

function validateRiftboundDeck(deck: RiftboundDeck): DeckValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Legend validation
  if (!deck.legend) {
    errors.push('No Legend selected');
  }
  
  // Battlefield validation
  if (deck.battlefields.length < 3) {
    errors.push(`Need ${3 - deck.battlefields.length} more Battlefields (3 required)`);
  } else if (deck.battlefields.length > 3) {
    errors.push(`Remove ${deck.battlefields.length - 3} Battlefields (exactly 3 required)`);
  }
  
  // Rune deck validation
  const runeCount = deck.runeDeck.reduce((sum, card) => sum + card.count, 0);
  if (runeCount < 12) {
    errors.push(`Need ${12 - runeCount} more Runes (12 required)`);
  } else if (runeCount > 12) {
    errors.push(`Remove ${runeCount - 12} Runes (exactly 12 required)`);
  }
  
  // Main deck validation
  const mainDeckCount = deck.cards.reduce((sum, card) => sum + card.count, 0);
  if (mainDeckCount < 40) {
    errors.push(`Need ${40 - mainDeckCount} more cards (40 required)`);
  } else if (mainDeckCount > 40) {
    errors.push(`Remove ${mainDeckCount - 40} cards (exactly 40 required)`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
```

## Migration Strategy

### Handling Existing Decks

```typescript
function migrateRiftboundDeck(oldDeck: Deck): RiftboundDeck {
  const newDeck: RiftboundDeck = {
    ...oldDeck,
    battlefields: oldDeck.battlefield ? [oldDeck.battlefield] : [],
    runeDeck: [],
    cards: []
  };
  
  // Separate cards by type
  oldDeck.cards.forEach(card => {
    const fullCard = findCardById(card.id);
    
    if (isBasicRune(fullCard)) {
      newDeck.runeDeck.push(card);
    } else if (isBattlefield(fullCard)) {
      if (newDeck.battlefields.length < 3) {
        newDeck.battlefields.push(card);
      }
    } else {
      newDeck.cards.push(card);
    }
  });
  
  return newDeck;
}
```

## UI Updates

### Updated RiftboundBuilder Layout

**Left Sidebar:**
- Legend slot (large)
- Battlefield slots (3 horizontal)
- Deck statistics panel
- Validation warnings

**Main Area:**
- Card browser with tabs:
  - "Main Deck" (filtered by domain)
  - "Runes" (Basic Rune cards only)
  - "Battlefields" (Battlefield cards only)

**Right Sidebar (optional):**
- Current deck list
- Rune deck list
- Selected battlefields

### Visual Indicators

```typescript
// Color coding for deck zones
const ZONE_COLORS = {
  legend: '#9c27b0',      // Purple
  battlefield: '#2196f3', // Blue
  mainDeck: '#4caf50',    // Green
  runeDeck: '#ff9800'     // Orange
};
```

## Error Handling

### Invalid Card Additions

```typescript
function handleCardAdd(card: RiftboundCard, zone: DeckZone) {
  // Check domain legality
  if (zone === 'mainDeck' && legendDomain && card.domain !== 'Colorless') {
    if (card.domain !== legendDomain) {
      showError(`${card.name} is not legal with your Legend's domain (${legendDomain})`);
      return;
    }
  }
  
  // Check zone capacity
  if (zone === 'runeDeck' && getRuneCount() >= 12) {
    showError('Rune deck is full (12/12)');
    return;
  }
  
  if (zone === 'battlefield' && battlefields.length >= 3) {
    showError('All battlefield slots are filled (3/3)');
    return;
  }
  
  // Add card
  addCardToZone(card, zone);
}
```

## Testing Strategy

### Unit Tests

- `filterByDomain()` with various domain combinations
- `validateRiftboundDeck()` with valid and invalid decks
- `migrateRiftboundDeck()` with old deck formats
- Card type identification functions

### Integration Tests

- Legend selection updates card filtering
- Adding cards to correct zones based on type
- Validation updates when cards added/removed
- Battlefield selection limits

### E2E Tests

- Build complete legal Riftbound deck
- Attempt to add illegal cards (wrong domain)
- Fill all deck zones to capacity
- Save and reload deck with all zones

## Performance Considerations

- Cache filtered card lists by domain
- Memoize validation results
- Lazy load battlefield picker modal
- Virtual scrolling for large card lists

## Accessibility

- Keyboard navigation between deck zones
- Screen reader announcements for validation errors
- Clear labels for all deck zones
- Focus management when opening modals

## Deck Tagging Fix

### Current Issue

The deck tagging system in Dashboard.tsx attempts to save tags but the changes are not persisted to Gitea. Tags are added to the deck metadata in memory but not committed to the repository.

### Root Cause

The `handleAddTag` and `handleRemoveTag` functions update the deck object and call `giteaService.updateDeck()`, but this only updates the file content without creating a Git commit. The changes exist in the working directory but are never committed.

### Solution

```typescript
async function handleAddTag(deckName: string, tag: string) {
  try {
    // Load current deck
    const deck = await giteaService.getDeck(username, deckName);
    
    // Update tags
    if (!deck.metadata.tags) {
      deck.metadata.tags = [];
    }
    if (!deck.metadata.tags.includes(tag.trim())) {
      deck.metadata.tags.push(tag.trim());
    }
    
    // Save with commit
    await giteaService.updateDeck(
      username,
      deckName,
      deck,
      `Add tag: ${tag.trim()}`  // Commit message
    );
    
    // Update local state
    setDeckMetadata({
      ...deckMetadata,
      [deckName]: {
        ...deckMetadata[deckName],
        tags: deck.metadata.tags,
      },
    });
    
    setNewTag('');
  } catch (error) {
    console.error('Failed to add tag:', error);
    alert('Failed to add tag. Please try again.');
  }
}
```

### Updated Gitea Service

The `updateDeck` method needs to accept an optional commit message parameter:

```typescript
async updateDeck(
  owner: string,
  repo: string,
  deck: Deck,
  commitMessage?: string
): Promise<void> {
  const message = commitMessage || 'Update deck';
  
  // Get current file SHA
  const currentFile = await this.getDeckFile(owner, repo);
  
  // Update file with commit
  await this.api.put(
    `/repos/${owner}/${repo}/contents/deck.json`,
    {
      message,
      content: btoa(JSON.stringify(deck, null, 2)),
      sha: currentFile.sha,
    }
  );
}
```

### Tag Display Fix

Ensure tags are properly displayed in the deck list by checking the metadata structure:

```typescript
// In Dashboard.tsx
{meta?.tags && meta.tags.length > 0 && meta.tags.map((tag, i) => (
  <span
    key={i}
    style={{
      padding: '2px 8px',
      background: '#2a2a2a',
      borderRadius: '12px',
      fontSize: '11px',
      color: '#999',
    }}
  >
    {tag}
  </span>
))}
```

## Riot Games API Integration

### API Endpoint

```
GET https://americas.api.riotgames.com/riftbound/content/v1/contents
```

**Authentication:** Requires `X-Riot-Token` header with valid API key

**Response Structure:**
```json
{
  "version": "1.0.0",
  "cards": [
    {
      "id": "OGN-001",
      "name": "Blazing Scorcher",
      "type": "Unit",
      "domain": "Fury",
      "cost": 5,
      "might": 5,
      "text": "[Accelerate] (You may pay 1 EnergyFury...)",
      "rarity": "Common",
      "set": "Origins",
      "imageUrl": "https://..."
    }
  ],
  "legends": [...],
  "battlefields": [...]
}
```

### Card Service Implementation

```typescript
class RiftboundCardService {
  private apiKey: string;
  private cacheKey = 'riftbound_cards_cache';
  private cacheTimestampKey = 'riftbound_cards_timestamp';
  private cacheDuration = 24 * 60 * 60 * 1000; // 24 hours

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getCards(forceRefresh = false): Promise<RiftboundCard[]> {
    // Check cache first
    if (!forceRefresh) {
      const cached = this.getCachedCards();
      if (cached) {
        return cached;
      }
    }

    try {
      // Fetch from API
      const cards = await this.fetchFromAPI();
      
      // Cache the results
      this.cacheCards(cards);
      
      return cards;
    } catch (error) {
      console.error('Failed to fetch from Riot API:', error);
      
      // Fallback to cache even if expired
      const cached = this.getCachedCards(true);
      if (cached) {
        console.warn('Using expired cache due to API error');
        return cached;
      }
      
      throw new Error('Failed to load card data and no cache available');
    }
  }

  private async fetchFromAPI(): Promise<RiftboundCard[]> {
    const response = await fetch(
      'https://americas.api.riotgames.com/riftbound/content/v1/contents',
      {
        headers: {
          'X-Riot-Token': this.apiKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    return this.transformAPIResponse(data);
  }

  private transformAPIResponse(apiData: any): RiftboundCard[] {
    // Transform Riot API format to our card format
    return apiData.cards.map((card: any) => ({
      id: card.id,
      name: card.name,
      card_type: card.type,
      domain: card.domain,
      energy: card.cost,
      might: card.might,
      ability: card.text,
      rarity: card.rarity,
      set: card.set,
      image_url: card.imageUrl,
      tags: card.tags || [],
    }));
  }

  private getCachedCards(ignoreExpiry = false): RiftboundCard[] | null {
    const cached = localStorage.getItem(this.cacheKey);
    const timestamp = localStorage.getItem(this.cacheTimestampKey);

    if (!cached || !timestamp) {
      return null;
    }

    const age = Date.now() - parseInt(timestamp);
    if (!ignoreExpiry && age > this.cacheDuration) {
      return null;
    }

    return JSON.parse(cached);
  }

  private cacheCards(cards: RiftboundCard[]): void {
    localStorage.setItem(this.cacheKey, JSON.stringify(cards));
    localStorage.setItem(this.cacheTimestampKey, Date.now().toString());
  }

  getCacheAge(): number | null {
    const timestamp = localStorage.getItem(this.cacheTimestampKey);
    if (!timestamp) return null;
    return Date.now() - parseInt(timestamp);
  }

  clearCache(): void {
    localStorage.removeItem(this.cacheKey);
    localStorage.removeItem(this.cacheTimestampKey);
  }
}
```

### API Key Configuration

Store API key in environment variables:

```typescript
// .env
VITE_RIOT_API_KEY=RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

```typescript
// src/config/riot.ts
export const RIOT_API_KEY = import.meta.env.VITE_RIOT_API_KEY;

if (!RIOT_API_KEY) {
  console.warn('Riot API key not configured. Card data will not update automatically.');
}
```

### UI Components

**Card Refresh Button:**

```typescript
function CardDataRefreshButton() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await cardService.getCards(true); // Force refresh
      setLastUpdate(new Date());
      alert('Card data updated successfully!');
    } catch (error) {
      alert('Failed to update card data. Using cached version.');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div>
      <button onClick={handleRefresh} disabled={isRefreshing}>
        {isRefreshing ? 'Updating...' : 'Refresh Card Data'}
      </button>
      {lastUpdate && (
        <span style={{ fontSize: '12px', color: '#999' }}>
          Last updated: {lastUpdate.toLocaleString()}
        </span>
      )}
    </div>
  );
}
```

### Error Handling

```typescript
// Handle API rate limits
if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After');
  throw new Error(`Rate limited. Retry after ${retryAfter} seconds.`);
}

// Handle authentication errors
if (response.status === 401 || response.status === 403) {
  throw new Error('Invalid or expired API key. Please check your configuration.');
}

// Handle service unavailable
if (response.status >= 500) {
  throw new Error('Riot API is currently unavailable. Using cached data.');
}
```

### Migration Strategy

1. Keep CSV as fallback for development/testing
2. Implement API service alongside existing CSV loader
3. Add feature flag to switch between CSV and API
4. Gradually migrate to API-only once stable

```typescript
const USE_RIOT_API = import.meta.env.VITE_USE_RIOT_API === 'true';

async function loadCards(): Promise<RiftboundCard[]> {
  if (USE_RIOT_API && RIOT_API_KEY) {
    try {
      return await riotCardService.getCards();
    } catch (error) {
      console.error('Failed to load from API, falling back to CSV');
    }
  }
  
  // Fallback to CSV
  return await loadCardsFromCSV();
}
```

## Success Metrics

- Main deck count excludes runes and battlefields
- Card filtering works correctly for all domains
- All 3 battlefield slots functional
- Validation accurately reflects Riftbound rules
- Deck tags persist after page reload
- Tag changes create Git commits
- Card data updates automatically from Riot API
- Cache reduces API calls to < 1 per day per user
- No regression in existing functionality
