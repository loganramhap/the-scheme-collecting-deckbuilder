import { Deck } from '../types/deck';
import { RiftboundCard } from '../types/card';
import { isBasicRune, isBattlefield, isLegend } from './riftboundCardTypes';

/**
 * Migration result with logging information
 */
export interface MigrationResult {
  deck: Deck;
  migrated: boolean;
  changes: string[];
}

/**
 * Migrate a Riftbound deck from old format to new format
 * 
 * Old format:
 * - All cards in `cards` array (including runes and battlefields)
 * - Single `battlefield` field (optional)
 * - No `runeDeck` field
 * - No `battlefields` array
 * 
 * New format:
 * - Main deck cards in `cards` array (excludes runes, battlefields, legend)
 * - Runes in `runeDeck` array (12 cards)
 * - Battlefields in `battlefields` array (3 cards)
 * - Legend in `legend` field (1 card)
 * 
 * @param deck - The deck to migrate
 * @param allCards - All available Riftbound cards for type lookup
 * @returns Migration result with the migrated deck and change log
 */
export function migrateRiftboundDeck(
  deck: Deck,
  allCards: RiftboundCard[]
): MigrationResult {
  // Only migrate Riftbound decks
  if (deck.game !== 'riftbound') {
    return {
      deck,
      migrated: false,
      changes: []
    };
  }

  const changes: string[] = [];
  let needsMigration = false;

  // Check if deck needs migration
  // A deck needs migration if it has the old structure
  const hasOldBattlefieldField = deck.battlefield !== undefined && !deck.battlefields;
  const hasNoRuneDeck = !deck.runeDeck || deck.runeDeck.length === 0;
  const hasCardsInMainDeck = deck.cards && deck.cards.length > 0;

  if (!hasOldBattlefieldField && !hasNoRuneDeck) {
    // Deck already in new format
    return {
      deck,
      migrated: false,
      changes: []
    };
  }

  // Create a card lookup map for fast access
  const cardMap = new Map<string, RiftboundCard>();
  allCards.forEach(card => {
    cardMap.set(card.id, card);
  });

  // Initialize new deck structure
  const migratedDeck: Deck = {
    ...deck,
    battlefields: deck.battlefields || [],
    runeDeck: deck.runeDeck || [],
    cards: []
  };

  // Handle old battlefield field (single card)
  if (hasOldBattlefieldField && deck.battlefield) {
    migratedDeck.battlefields = [deck.battlefield];
    changes.push(`Migrated single battlefield to battlefields array`);
    needsMigration = true;
    
    // Remove old field
    delete migratedDeck.battlefield;
  }

  // Separate existing cards into correct zones by type
  if (hasCardsInMainDeck) {
    deck.cards.forEach(deckCard => {
      const fullCard = cardMap.get(deckCard.id);
      
      if (!fullCard) {
        // Card not found in database, keep in main deck
        migratedDeck.cards.push(deckCard);
        changes.push(`Warning: Card ${deckCard.id} not found in database, kept in main deck`);
        return;
      }

      if (isBasicRune(fullCard)) {
        // Move to rune deck
        migratedDeck.runeDeck!.push(deckCard);
        changes.push(`Moved ${fullCard.name} (${deckCard.count}x) to rune deck`);
        needsMigration = true;
      } else if (isBattlefield(fullCard)) {
        // Move to battlefields (up to 3)
        if (migratedDeck.battlefields!.length < 3) {
          migratedDeck.battlefields!.push(deckCard);
          changes.push(`Moved ${fullCard.name} to battlefields`);
          needsMigration = true;
        } else {
          changes.push(`Warning: Battlefield ${fullCard.name} not added (already have 3)`);
        }
      } else if (isLegend(fullCard)) {
        // Set as legend (only if not already set)
        if (!migratedDeck.legend) {
          migratedDeck.legend = deckCard;
          changes.push(`Set ${fullCard.name} as legend`);
          needsMigration = true;
        } else {
          changes.push(`Warning: Legend ${fullCard.name} not set (already have a legend)`);
        }
      } else {
        // Keep in main deck
        migratedDeck.cards.push(deckCard);
      }
    });
  }

  // Update metadata timestamp if migration occurred
  if (needsMigration) {
    migratedDeck.metadata = {
      ...migratedDeck.metadata,
      updated: new Date().toISOString()
    };
    changes.push(`Updated deck timestamp`);
  }

  return {
    deck: migratedDeck,
    migrated: needsMigration,
    changes
  };
}

/**
 * Check if a deck needs migration
 * 
 * @param deck - The deck to check
 * @returns True if the deck needs migration
 */
export function needsMigration(deck: Deck): boolean {
  if (deck.game !== 'riftbound') {
    return false;
  }

  // Check for old format indicators
  const hasOldBattlefieldField = deck.battlefield !== undefined && !deck.battlefields;
  const hasNoRuneDeck = !deck.runeDeck || deck.runeDeck.length === 0;
  const hasCardsInMainDeck = deck.cards && deck.cards.length > 0;

  return hasOldBattlefieldField || (hasNoRuneDeck && hasCardsInMainDeck);
}
