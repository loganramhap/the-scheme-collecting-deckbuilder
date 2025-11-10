import { Deck, DeckCard, ValidationResult } from '../types/deck';
import { MTGCard } from '../types/card';
import { isCardLegalInColorIdentity } from './colorIdentityFiltering';

/**
 * Validate a Commander format deck
 */
export function validateCommanderDeck(
  deck: Deck,
  availableCards: MTGCard[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if commander is selected
  if (!deck.commander) {
    errors.push('No Commander selected');
  }

  // Check total card count (must be exactly 100)
  const totalCards = deck.cards.reduce((sum, card) => sum + card.count, 0);
  if (totalCards < 100) {
    warnings.push(`Need ${100 - totalCards} more cards (must be exactly 100)`);
  } else if (totalCards > 100) {
    errors.push(`Remove ${totalCards - 100} cards (must be exactly 100)`);
  }

  // Check singleton rule (1 copy per card except basic lands)
  const nonBasicDuplicates: DeckCard[] = [];
  deck.cards.forEach(deckCard => {
    const card = availableCards.find(c => c.id === deckCard.id);
    if (card) {
      const isBasicLand = card.type_line.toLowerCase().includes('basic land');
      if (!isBasicLand && deckCard.count > 1) {
        nonBasicDuplicates.push(deckCard);
      }
    }
  });

  if (nonBasicDuplicates.length > 0) {
    errors.push(
      `Singleton rule violated: ${nonBasicDuplicates.map(c => c.name || c.id).join(', ')}`
    );
  }

  // Check color identity compliance
  const commanderIdentity = deck.colorIdentity || [];
  const illegalCards: DeckCard[] = [];
  
  deck.cards.forEach(deckCard => {
    const card = availableCards.find(c => c.id === deckCard.id);
    if (card && !isCardLegalInColorIdentity(card, commanderIdentity)) {
      illegalCards.push(deckCard);
    }
  });

  if (illegalCards.length > 0) {
    errors.push(
      `Color identity violations: ${illegalCards.map(c => c.name || c.id).join(', ')}`
    );
  }

  return {
    valid: errors.length === 0 && warnings.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check if a card can be added to the deck (singleton rule)
 */
export function canAddCardCopy(
  card: MTGCard,
  currentCount: number
): boolean {
  // Basic lands can have unlimited copies
  const isBasicLand = card.type_line.toLowerCase().includes('basic land');
  if (isBasicLand) {
    return true;
  }

  // Non-basic cards can only have 1 copy
  return currentCount < 1;
}

/**
 * Get the maximum allowed copies for a card
 */
export function getMaxCopies(card: MTGCard): number {
  const isBasicLand = card.type_line.toLowerCase().includes('basic land');
  return isBasicLand ? 999 : 1;
}

/**
 * Check if a card is a valid commander
 */
export function isValidCommander(card: MTGCard): boolean {
  const typeLine = card.type_line.toLowerCase();
  
  // Must be a legendary creature
  if (!typeLine.includes('legendary') || !typeLine.includes('creature')) {
    return false;
  }

  // Check if legal in Commander format
  if (card.legalities && card.legalities.commander) {
    return card.legalities.commander === 'legal';
  }

  // If no legalities info, assume it's valid
  return true;
}
