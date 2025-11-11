# Riftbound Builder Fixes Needed

## Issues Identified

### 1. Runes Not Auto-Populating
**Problem:** When a Legend is selected, the rune deck should automatically populate with 12 runes matching the Legend's domains, but it's showing as empty.

**Root Cause:** No logic exists to auto-populate runes when Legend is selected.

**Fix Required:**
- When Legend is selected, automatically add 6 runes of each domain the Legend has
- For single-domain Legends: add 12 runes of that domain
- For dual-domain Legends: add 6 runes of each domain

### 2. Domain Filtering Only Shows One Domain
**Problem:** "Hand of Noxus" has TWO domains (likely Fury + another), but only Fury cards are showing.

**Root Cause:** 
- `extractLegendDomain()` returns a single string, not an array
- `filterByDomain()` only checks for single domain match
- Legends can have multiple domains (e.g., "Fury, Body")

**Fix Required:**
- Change `legendDomain` from `string | null` to `string[] | null`
- Update `extractLegendDomain()` to parse comma-separated domains or array
- Update `filterByDomain()` to check if card's domain is in ANY of the Legend's domains

### 3. Right-Side Filters Not Working
**Problem:** The filter panel on the right isn't filtering cards properly with Riot API data.

**Root Cause:**
- Filters are looking for fields that don't match Riot API structure
- Card type names from API don't match filter constants
- Rarity names from API don't match filter constants

**Fix Required:**
- Update `RIFTBOUND_CARD_TYPES` constant to match Riot API types
- Update `RIFTBOUND_RARITIES` constant to match Riot API rarities
- Ensure card filtering logic uses correct field names

## Detailed Fixes

### Fix 1: Support Multiple Domains

```typescript
// src/utils/domainFiltering.ts

/**
 * Extract domains from a legend card
 * Legends can have multiple domains (e.g., "Fury, Body")
 */
export function extractLegendDomains(legendCard: RiftboundCard | undefined): string[] {
  if (!legendCard) {
    return [];
  }
  
  // If domain is an array, return it
  if (Array.isArray(legendCard.domain)) {
    return legendCard.domain;
  }
  
  // If domain is a string, split by comma
  if (typeof legendCard.domain === 'string') {
    return legendCard.domain
      .split(',')
      .map(d => d.trim())
      .filter(d => d.length > 0);
  }
  
  return [];
}

/**
 * Filter Riftbound cards based on the Legend's domains
 * Cards must match at least ONE of the Legend's domains
 */
export function filterByDomains(
  cards: RiftboundCard[], 
  legendDomains: string[]
): RiftboundCard[] {
  // If no domains are active (no legend selected), return all cards
  if (legendDomains.length === 0) {
    return cards;
  }
  
  return cards.filter(card => {
    // Cards with no domain are available to all
    if (!card.domain) {
      return true;
    }
    
    // Get card's domains (could be array or comma-separated string)
    const cardDomains = Array.isArray(card.domain)
      ? card.domain
      : card.domain.split(',').map(d => d.trim());
    
    // Colorless domain cards are always legal
    if (cardDomains.includes('Colorless')) {
      return true;
    }
    
    // Card must have at least ONE domain that matches the legend's domains
    return cardDomains.some(cardDomain => legendDomains.includes(cardDomain));
  });
}
```

### Fix 2: Auto-Populate Runes

```typescript
// src/components/deckbuilder/RiftboundBuilder.tsx

const handleLegendSelect = (card: DeckCard) => {
  setLegend(card);
  
  // Auto-populate runes based on Legend's domains
  const legendCard = availableCards.find(c => c.id === card.id);
  if (legendCard) {
    const domains = extractLegendDomains(legendCard);
    autoPopulateRunes(domains);
  }
};

const autoPopulateRunes = (domains: string[]) => {
  // Clear existing runes
  const currentRunes = deck.runeDeck || [];
  currentRunes.forEach(rune => {
    removeRune(rune.id);
  });
  
  // Get all available runes
  const allRunes = availableCards.filter(isBasicRune);
  
  if (domains.length === 0) {
    return; // No domains, don't add runes
  }
  
  if (domains.length === 1) {
    // Single domain: add 12 runes of that domain
    const domainRunes = allRunes.filter(rune => 
      rune.domain === domains[0] || rune.name.includes(domains[0])
    );
    
    if (domainRunes.length > 0) {
      const runeToAdd = domainRunes[0];
      addRune({
        id: runeToAdd.id,
        count: 12,
        name: runeToAdd.name,
        image_url: runeToAdd.image_url,
      });
    }
  } else if (domains.length === 2) {
    // Dual domain: add 6 runes of each domain
    domains.forEach(domain => {
      const domainRunes = allRunes.filter(rune => 
        rune.domain === domain || rune.name.includes(domain)
      );
      
      if (domainRunes.length > 0) {
        const runeToAdd = domainRunes[0];
        addRune({
          id: runeToAdd.id,
          count: 6,
          name: runeToAdd.name,
          image_url: runeToAdd.image_url,
        });
      }
    });
  }
};
```

### Fix 3: Update Filter Constants

```typescript
// src/types/filters.ts

// Update to match Riot API card types
export const RIFTBOUND_CARD_TYPES = [
  'Unit',
  'Spell',
  'Gear',
  'Basic Rune',
  'Battlefield',
  'Legend',
  'Champion Unit',
  'Token Unit',
  'Signature Spell',
];

// Update to match Riot API rarities
export const RIFTBOUND_RARITIES = [
  'Common',
  'Uncommon',
  'Rare',
  'Epic',
  'Legendary',
  'Showcase', // Special rarity for alternate art
];

// Domains (not factions)
export const RIFTBOUND_DOMAINS = [
  'Fury',
  'Calm',
  'Mind',
  'Body',
  'Order',
  'Colorless',
];
```

### Fix 4: Update Card Filtering Logic

```typescript
// src/utils/cardFiltering.ts

export function applyFilters(
  cards: RiftboundCard[],
  filters: CardFilters
): RiftboundCard[] {
  return cards.filter(card => {
    // Search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesName = card.name.toLowerCase().includes(query);
      const matchesText = card.ability?.toLowerCase().includes(query) || false;
      if (!matchesName && !matchesText) {
        return false;
      }
    }
    
    // Card type filter
    if (filters.types.length > 0) {
      // Match against card_type field from API
      if (!filters.types.includes(card.card_type)) {
        return false;
      }
    }
    
    // Cost range filter
    if (filters.minCost !== null && (card.energy || 0) < filters.minCost) {
      return false;
    }
    if (filters.maxCost !== null && (card.energy || 0) > filters.maxCost) {
      return false;
    }
    
    // Rarity filter
    if (filters.rarities.length > 0) {
      if (!filters.rarities.includes(card.rarity)) {
        return false;
      }
    }
    
    // Domain filter (using colors array for domains)
    if (filters.colors.length > 0) {
      const cardDomains = Array.isArray(card.domain)
        ? card.domain
        : [card.domain];
      
      const hasMatchingDomain = cardDomains.some(domain => 
        filters.colors.includes(domain)
      );
      
      if (!hasMatchingDomain) {
        return false;
      }
    }
    
    return true;
  });
}
```

## Implementation Priority

1. **Fix domain extraction** (multiple domains) - CRITICAL
2. **Fix domain filtering** (show cards from all Legend domains) - CRITICAL  
3. **Auto-populate runes** - HIGH
4. **Update filter constants** - HIGH
5. **Fix filter logic** - MEDIUM

## Testing Checklist

- [ ] Select "Hand of Noxus" - should show cards from BOTH domains
- [ ] Select any Legend - runes should auto-populate (12 total)
- [ ] Use type filter - should filter correctly
- [ ] Use rarity filter - should filter correctly
- [ ] Use cost range filter - should filter correctly
- [ ] Search by name - should work
