# Visual Deck Builder Design

## Overview

The Visual Deck Builder transforms the current text-based deck editing experience into a rich, visual interface with game-specific features. The design focuses on creating dedicated UI components for Riftbound (Legend, Battlefield, Deck, Runes) and MTG Commander (Commander slot, color identity filtering) while maintaining the existing Git-based version control.

## Architecture

### Component Structure

```
DeckEditor (Enhanced)
├── DeckHeader (existing - deck name, format, stats)
├── GameSpecificBuilder (new)
│   ├── RiftboundBuilder
│   │   ├── LegendSlot
│   │   ├── BattlefieldSlot
│   │   ├── DeckZone
│   │   └── RuneIndicator
│   └── MTGCommanderBuilder
│       ├── CommanderSlot
│       ├── ColorIdentityIndicator
│       └── MainDeckZone
├── VisualCardBrowser (new)
│   ├── CardGrid
│   ├── CardFilters
│   ├── CardPreview
│   └── QuickAddControls
├── DeckStatistics (enhanced)
│   ├── CardCountDisplay
│   ├── ColorDistribution
│   └── ValidationWarnings
└── AutoSaveIndicator (new)
```

### Data Flow

```
User Action → Component State → Deck Store → Auto-save Timer → Gitea API → Git Commit
                                      ↓
                              Card Filtering Logic
                                      ↓
                              Visual Card Grid Update
```

## Components and Interfaces

### 1. GameSpecificBuilder Component

**Purpose**: Renders the appropriate deck building interface based on game type

**Props**:
```typescript
interface GameSpecificBuilderProps {
  deck: Deck;
  onDeckUpdate: (deck: Deck) => void;
  availableCards: Card[];
}
```

**Behavior**:
- Detects `deck.game` and renders either `RiftboundBuilder` or `MTGCommanderBuilder`
- Passes filtered card pool to child components
- Manages drag-and-drop context for card movement

### 2. RiftboundBuilder Component

**Layout**:
```
┌─────────────────────────────────────────┐
│  Legend Slot    │  Battlefield Slot     │
│  [Card Image]   │  [Card Image]         │
│                 │                       │
│  Rune Colors: ⚫🔴🔵                    │
├─────────────────────────────────────────┤
│  Deck (35/40)                           │
│  ┌──┬──┬──┬──┬──┐                      │
│  │  ││  ││  ││  ││  │ (card grid)      │
│  └──┴──┴──┴──┴──┘                      │
└─────────────────────────────────────────┘
```

**State**:
```typescript
interface RiftboundBuilderState {
  legend: DeckCard | null;
  battlefield: DeckCard | null;
  deckCards: DeckCard[];
  activeRuneColors: string[];
}
```

**Key Features**:
- Legend selection updates `activeRuneColors`
- Card pool filters based on `activeRuneColors`
- Visual rune color indicators (colored circles)
- Drag-and-drop between zones

### 3. VisualCardBrowser Component

**Layout**:
```
┌─────────────────────────────────────────┐
│  Filters: [Type▾] [Cost▾] [Rarity▾]    │
│  Search: [____________] 🔍              │
├─────────────────────────────────────────┤
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐   │
│  │img │ │img │ │img │ │img │ │img │   │
│  │ +1 │ │ +1 │ │ +1 │ │ +1 │ │ +1 │   │
│  └────┘ └────┘ └────┘ └────┘ └────┘   │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐   │
│  │img │ │img │ │img │ │img │ │img │   │
│  │ +1 │ │ +1 │ │ +1 │ │ +1 │ │ +1 │   │
│  └────┘ └────┘ └────┘ └────┘ └────┘   │
└─────────────────────────────────────────┘
```

**Props**:
```typescript
interface VisualCardBrowserProps {
  cards: Card[];
  onCardAdd: (card: Card) => void;
  filters: CardFilters;
  onFilterChange: (filters: CardFilters) => void;
}
```

**Features**:
- Grid layout with card images (200x280px)
- Hover to enlarge preview
- Click to add card
- Quick-add +/- buttons overlay
- Lazy loading with IntersectionObserver
- Virtual scrolling for performance

### 4. CardGrid Component

**Implementation**:
```typescript
interface CardGridProps {
  cards: Card[];
  onCardClick: (card: Card) => void;
  deckCards: DeckCard[];
}

// Uses react-window for virtual scrolling
// Card images loaded via Scryfall API or local cache
```

**Card Display**:
- Image with loading skeleton
- Card count badge (if in deck)
- Quick-add overlay on hover
- Drag handle for drag-and-drop

### 5. AutoSaveManager Hook

**Purpose**: Manages automatic saving with debouncing

```typescript
interface AutoSaveHook {
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  triggerSave: () => Promise<void>;
}

const useAutoSave = (deck: Deck, delay: number = 30000) => {
  // Debounces changes
  // Auto-commits after 30 seconds of inactivity
  // Shows save status indicator
}
```

## Data Models

### Enhanced Deck Type

```typescript
interface Deck {
  game: 'mtg' | 'riftbound';
  format: string;
  name: string;
  
  // Riftbound-specific
  legend?: DeckCard;
  battlefield?: DeckCard;
  runeColors?: string[];
  
  // MTG-specific
  commander?: DeckCard;
  colorIdentity?: string[];
  
  // Common
  cards: DeckCard[];
  sideboard?: DeckCard[];
  metadata: DeckMetadata;
}
```

### Card Filter State

```typescript
interface CardFilters {
  types: string[];
  minCost: number;
  maxCost: number;
  rarities: string[];
  colors: string[];
  searchQuery: string;
}
```

### Card Cache Entry

```typescript
interface CachedCard {
  id: string;
  imageUrl: string;
  timestamp: number;
  data: Card;
}
```

## Card Filtering Logic

### Riftbound Rune Color Filtering

```typescript
function filterByRuneColors(cards: RiftboundCard[], activeColors: string[]): RiftboundCard[] {
  if (activeColors.length === 0) return cards;
  
  return cards.filter(card => {
    // Card must have at least one matching rune color
    return card.runeColors.some(color => activeColors.includes(color));
  });
}
```

### MTG Color Identity Filtering

```typescript
function filterByColorIdentity(cards: MTGCard[], commanderIdentity: string[]): MTGCard[] {
  if (commanderIdentity.length === 0) return cards;
  
  return cards.filter(card => {
    // All card colors must be in commander's identity
    return card.color_identity.every(color => commanderIdentity.includes(color));
  });
}
```

## Image Caching Strategy

### Browser Cache Implementation

```typescript
class CardImageCache {
  private cache: Map<string, CachedCard>;
  private maxSize: number = 50 * 1024 * 1024; // 50MB
  
  async get(cardId: string): Promise<string | null> {
    // Check memory cache
    // Check IndexedDB
    // Return null if not found
  }
  
  async set(cardId: string, imageUrl: string, data: Card): Promise<void> {
    // Store in memory cache
    // Store in IndexedDB
    // Evict oldest if over size limit
  }
}
```

### Image Loading Strategy

1. Check cache first
2. If not cached, show skeleton loader
3. Load from Scryfall/API
4. Cache the result
5. Display image with fade-in animation

## Drag and Drop Implementation

### Using react-dnd

```typescript
interface DragItem {
  type: 'CARD';
  card: Card;
  sourceZone: 'pool' | 'legend' | 'battlefield' | 'deck';
}

// Drop zones accept cards based on rules
const legendSlot = useDrop({
  accept: 'CARD',
  canDrop: (item) => item.card.type === 'Legend',
  drop: (item) => handleLegendSelect(item.card)
});
```

## Error Handling

### Validation Errors

Display inline warnings for:
- Deck size violations (< 30 or > 40 for Riftbound)
- Color identity violations (MTG)
- Rune color mismatches (Riftbound)
- Singleton violations (Commander)

### Network Errors

- Retry failed image loads
- Queue saves if offline
- Show connection status indicator

## Testing Strategy

### Unit Tests

- Card filtering logic
- Rune color extraction
- Color identity validation
- Cache eviction logic

### Integration Tests

- Drag and drop between zones
- Auto-save functionality
- Card search and filtering
- Image loading and caching

### E2E Tests

- Complete deck building flow
- Legend selection → card filtering
- Commander selection → color filtering
- Save and reload deck

## Performance Considerations

### Optimization Strategies

1. **Virtual Scrolling**: Use react-window for card grid (handles 1000+ cards)
2. **Image Lazy Loading**: Load images as they enter viewport
3. **Debounced Search**: Wait 300ms after typing before filtering
4. **Memoization**: Cache filtered card lists
5. **Web Workers**: Run filtering logic in background thread for large card pools

### Performance Targets

- Initial load: < 2 seconds
- Card grid render: < 100ms for 50 cards
- Filter update: < 50ms
- Image load: < 500ms (cached), < 2s (network)
- Auto-save: < 1 second

## Accessibility

- Keyboard navigation for card grid
- ARIA labels for all interactive elements
- Screen reader support for card details
- High contrast mode support
- Focus indicators for drag-and-drop

## Migration Path

### Phase 1: Core Visual Components
- Implement VisualCardBrowser
- Add image caching
- Basic drag-and-drop

### Phase 2: Game-Specific Features
- RiftboundBuilder with zones
- MTG CommanderBuilder
- Color/rune filtering

### Phase 3: Polish
- Auto-save
- Advanced filters
- Performance optimization
- Accessibility improvements

## Open Questions

1. Should we support custom card images for Riftbound?
2. How to handle very large card pools (1000+ cards)?
3. Should we add deck import/export from other formats?
4. Do we need offline support for the deck builder?

## Dependencies

### New Libraries

- `react-window`: Virtual scrolling for card grid
- `react-dnd`: Drag and drop functionality
- `idb`: IndexedDB wrapper for caching
- `react-intersection-observer`: Lazy loading images

### API Integrations

- Scryfall API: MTG card images and data
- Riftbound Card DB: Custom card database (JSON file or API)

## Success Metrics

- Time to build a deck: < 5 minutes (vs 15+ minutes with text interface)
- User satisfaction: 90%+ prefer visual interface
- Error rate: < 5% invalid decks created
- Performance: 60fps during interactions
