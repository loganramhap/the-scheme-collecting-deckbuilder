import { RiftboundCard } from '../types/card';

/**
 * Extract rune colors from a legend card
 */
export function extractRuneColors(legendCard: RiftboundCard | undefined): string[] {
  if (!legendCard || !legendCard.runeColors) {
    return [];
  }
  return legendCard.runeColors;
}

/**
 * Filter Riftbound cards based on active rune colors
 * Cards with no rune colors are available to all decks
 * Cards with rune colors must have at least one matching color
 */
export function filterByRuneColors(
  cards: RiftboundCard[], 
  activeColors: string[]
): RiftboundCard[] {
  // If no colors are active, return all cards
  if (activeColors.length === 0) {
    return cards;
  }
  
  return cards.filter(card => {
    // Cards with no rune colors are available to all
    if (!card.runeColors || card.runeColors.length === 0) {
      return true;
    }
    
    // Card must have at least one matching rune color
    return card.runeColors.some(color => 
      activeColors.includes(color)
    );
  });
}

/**
 * Check if a card is legal for the given rune colors
 */
export function isCardLegalForRuneColors(
  card: RiftboundCard,
  activeColors: string[]
): boolean {
  // If no colors are active, all cards are legal
  if (activeColors.length === 0) {
    return true;
  }
  
  // Cards with no rune colors are always legal
  if (!card.runeColors || card.runeColors.length === 0) {
    return true;
  }
  
  // Card must have at least one matching rune color
  return card.runeColors.some(color => 
    activeColors.includes(color)
  );
}

/**
 * Get all unique rune colors from a list of cards
 */
export function getAllRuneColors(cards: RiftboundCard[]): string[] {
  const colors = new Set<string>();
  
  cards.forEach(card => {
    if (card.runeColors) {
      card.runeColors.forEach(color => colors.add(color));
    }
  });
  
  return Array.from(colors).sort();
}
