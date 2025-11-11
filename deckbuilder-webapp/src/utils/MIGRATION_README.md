# Deck Migration Utility

This utility provides functions to migrate Riftbound decks from the old format to the new format.

## Overview

The Riftbound deck structure was updated to properly separate different card zones:

### Old Format
- All cards (including runes, battlefields, and legends) were in the `cards` array
- Single `battlefield` field for one battlefield card
- No separate `runeDeck` field

### New Format
- Main deck cards (40) in `cards` array (excludes runes, battlefields, legend)
- Runes (12) in `runeDeck` array
- Battlefields (3) in `battlefields` array
- Legend (1) in `legend` field

## Usage

### Basic Migration

```typescript
import { migrateRiftboundDeck } from './utils/deckMigration';
import { loadRiftboundCards } from './services/riftboundCards';

// Load all cards for type lookup
const allCards = await loadRiftboundCards();

// Migrate a deck
const result = migrateRiftboundDeck(oldDeck, allCards);

if (result.migrated) {
  console.log('Deck was migrated');
  console.log('Changes:', result.changes);
  
  // Use the migrated deck
  const migratedDeck = result.deck;
} else {
  console.log('Deck was already in new format');
}
```

### Check if Migration is Needed

```typescript
import { needsMigration } from './utils/deckMigration';

if (needsMigration(deck)) {
  // Perform migration
  const result = migrateRiftboundDeck(deck, allCards);
  // Save migrated deck
}
```

### Integration Example

```typescript
// In deck loading logic
async function loadDeck(deckName: string): Promise<Deck> {
  const deck = await giteaService.getDeck(username, deckName);
  
  // Check if migration is needed
  if (deck.game === 'riftbound' && needsMigration(deck)) {
    const allCards = await loadRiftboundCards();
    const result = migrateRiftboundDeck(deck, allCards);
    
    if (result.migrated) {
      console.log('Migrated deck:', result.changes);
      
      // Optionally save the migrated deck
      await giteaService.updateDeck(
        username,
        deckName,
        result.deck,
        'Migrate deck to new format'
      );
      
      return result.deck;
    }
  }
  
  return deck;
}
```

## Migration Logic

The migration function:

1. **Checks if migration is needed** - Skips if deck is already in new format
2. **Handles old battlefield field** - Converts single `battlefield` to `battlefields` array
3. **Separates cards by type**:
   - Basic Runes → `runeDeck`
   - Battlefields → `battlefields` (max 3)
   - Legends → `legend` (max 1)
   - Other cards → `cards` (main deck)
4. **Handles edge cases**:
   - Unknown cards stay in main deck with warning
   - Excess battlefields (>3) are not added with warning
   - Multiple legends - only first is set with warning
5. **Updates metadata** - Sets `updated` timestamp if migration occurred

## Return Value

```typescript
interface MigrationResult {
  deck: Deck;           // The migrated deck (or original if no migration)
  migrated: boolean;    // True if migration was performed
  changes: string[];    // Array of change descriptions for logging
}
```

## Testing

Run the test suite to verify migration behavior:

```typescript
import { runMigrationTests } from './utils/deckMigration.test';

// In browser console or during development
runMigrationTests();
```

Or in the browser console:
```javascript
window.runMigrationTests();
```

The test suite covers:
- Old battlefield field migration
- Runes in main deck
- Battlefields in main deck
- Legend in main deck
- Complete old format deck
- Already migrated deck (no changes)
- Non-Riftbound deck (no changes)
- Unknown cards handling
- needsMigration function
- Excess battlefields handling

## Notes

- Migration is **non-destructive** - original deck is not modified
- Migration is **idempotent** - running it multiple times has no effect
- Migration only affects Riftbound decks (`game: 'riftbound'`)
- Unknown cards are kept in main deck with a warning in the changes log
- The function requires all cards to be loaded for proper type identification
