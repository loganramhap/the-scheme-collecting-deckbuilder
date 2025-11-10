import { MTGCard } from '../types/card';

/**
 * Extract color identity from an MTG card
 * Color identity includes all colors in the mana cost and rules text
 */
export function extractColorIdentity(card: MTGCard | undefined): string[] {
  if (!card) return [];
  
  // Use the card's color_identity field if available
  if (card.color_identity && Array.isArray(card.color_identity)) {
    return card.color_identity;
  }
  
  // Fallback: use colors field
  if (card.colors && Array.isArray(card.colors)) {
    return card.colors;
  }
  
  return [];
}

/**
 * Filter MTG cards by commander's color identity
 * A card is legal if all of its color identity symbols are in the commander's color identity
 */
export function filterByColorIdentity(
  cards: MTGCard[],
  commanderIdentity: string[]
): MTGCard[] {
  // If no commander selected, show all cards
  if (commanderIdentity.length === 0) {
    return cards;
  }
  
  return cards.filter(card => {
    const cardIdentity = extractColorIdentity(card);
    
    // Colorless cards are always legal
    if (cardIdentity.length === 0) {
      return true;
    }
    
    // All colors in the card's identity must be in the commander's identity
    return cardIdentity.every(color => commanderIdentity.includes(color));
  });
}

/**
 * Check if a card is legal in a commander deck based on color identity
 */
export function isCardLegalInColorIdentity(
  card: MTGCard,
  commanderIdentity: string[]
): boolean {
  // If no commander, all cards are legal
  if (commanderIdentity.length === 0) {
    return true;
  }
  
  const cardIdentity = extractColorIdentity(card);
  
  // Colorless cards are always legal
  if (cardIdentity.length === 0) {
    return true;
  }
  
  // All colors in the card's identity must be in the commander's identity
  return cardIdentity.every(color => commanderIdentity.includes(color));
}

/**
 * Get a human-readable description of color identity
 */
export function getColorIdentityDescription(colorIdentity: string[]): string {
  if (colorIdentity.length === 0) {
    return 'Colorless';
  }
  
  const colorNames: Record<string, string> = {
    W: 'White',
    U: 'Blue',
    B: 'Black',
    R: 'Red',
    G: 'Green',
  };
  
  const names = colorIdentity.map(c => colorNames[c] || c);
  
  if (names.length === 1) {
    return names[0];
  }
  
  if (names.length === 2) {
    return `${names[0]} and ${names[1]}`;
  }
  
  return names.slice(0, -1).join(', ') + ', and ' + names[names.length - 1];
}
