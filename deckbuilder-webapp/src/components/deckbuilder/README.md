# Card Filtering System

## Overview

The card filtering system provides a comprehensive UI and logic for filtering cards by type, cost, rarity, colors/factions, and search query. It includes debounced search, memoized filtering for performance, and game-specific filter options.

## Components

### CardFilters

A UI component that displays filter controls including:
- Search input with 300ms debouncing
- Card type filter chips
- Cost range inputs (min/max)
- Rarity filter chips
- Color/faction filter chips (game-specific)
- Active filter count display
- Clear all filters button

**Usage:**

```tsx
import { CardFilters } from './components/deckbuilder';
import { CardFilters as CardFiltersType, DEFAULT_FILTERS } from './types/filters';

const [filters, setFilters] = useState<CardFiltersType>(DEFAULT_FILTERS);

<CardFilters
  filters={filters}
  onFilterChange={setFilters}
  gameType="mtg" // or "riftbound"
/>
```

### VisualCardBrowser

Combines CardFilters and CardGrid with memoized filtering.

**Usage:**

```tsx
import { VisualCardBrowser } from './components/deckbuilder';

<VisualCardBrowser
  cards={allCards}
  onCardAdd={handleCardAdd}
  filters={filters}
  onFilterChange={setFilters}
  gameType="mtg"
  deckCards={currentDeck}
  onCardIncrement={handleIncrement}
  onCardDecrement={handleDecrement}
  maxCopiesPerCard={4}
/>
```

## Utilities

### filterCards

Main filtering function that applies all filters to a card array.

```tsx
import { filterCards } from './utils/cardFiltering';

const filtered = filterCards(allCards, filters);
```

### useCardFiltering

Custom hook with memoization for optimal performance.

```tsx
import { useCardFiltering } from './hooks/useCardFiltering';

const filteredCards = useCardFiltering(allCards, filters);
```

### useCardFilteringWithStats

Hook that provides filtered cards plus metadata.

```tsx
import { useCardFilteringWithStats } from './hooks/useCardFiltering';

const { cards, totalCount, filteredCount, hasFilters } = 
  useCardFilteringWithStats(allCards, filters);
```

## Filter Types

### CardFilters Interface

```typescript
interface CardFilters {
  types: string[];           // Card types to include
  minCost: number | null;    // Minimum mana/resource cost
  maxCost: number | null;    // Maximum mana/resource cost
  rarities: string[];        // Rarities to include
  colors: string[];          // Colors/factions to include
  searchQuery: string;       // Text search query
}
```

## Game-Specific Options

### MTG
- Types: Creature, Instant, Sorcery, Enchantment, Artifact, Planeswalker, Land
- Rarities: common, uncommon, rare, mythic
- Colors: W (White), U (Blue), B (Black), R (Red), G (Green)

### Riftbound
- Types: Unit, Spell, Artifact, Legend, Battlefield
- Rarities: Common, Rare, Epic, Legendary
- Factions: Neutral, Order, Chaos, Nature, Tech

## Performance

- Search input is debounced by 300ms to avoid excessive filtering
- Filtering logic is memoized using `useMemo` to prevent unnecessary recalculations
- Only recalculates when cards or filters change
- Optimized for large card pools (1000+ cards)

## Requirements Satisfied

This implementation satisfies requirements 9.1-9.5:
- ✅ 9.1: Filter controls for type, cost, and rarity
- ✅ 9.2: Filters update card grid in real-time
- ✅ 9.3: Display number of matching cards
- ✅ 9.4: Real-time search by card name
- ✅ 9.5: Multiple simultaneous filters supported
