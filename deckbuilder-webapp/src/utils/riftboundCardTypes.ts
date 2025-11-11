import { RiftboundCard } from '../types/card';

/**
 * Check if a card is a Basic Rune
 * Basic Runes go in the separate 12-card Rune Deck
 */
export function isBasicRune(card: RiftboundCard): boolean {
  return card.card_type === 'Basic Rune';
}

/**
 * Check if a card is a Battlefield
 * Exactly 3 Battlefields are required per deck
 */
export function isBattlefield(card: RiftboundCard): boolean {
  return card.card_type === 'Battlefield';
}

/**
 * Check if a card is a Legend
 * Exactly 1 Legend is required per deck
 */
export function isLegend(card: RiftboundCard): boolean {
  return card.card_type === 'Legend';
}

/**
 * Filter cards to get only main deck cards
 * Excludes Basic Runes, Battlefields, and Legends
 */
export function getMainDeckCards(cards: RiftboundCard[]): RiftboundCard[] {
  return cards.filter(card => 
    !isBasicRune(card) && 
    !isBattlefield(card) && 
    !isLegend(card)
  );
}

/**
 * Filter cards to get only Basic Rune cards
 */
export function getRuneCards(cards: RiftboundCard[]): RiftboundCard[] {
  return cards.filter(isBasicRune);
}

/**
 * Filter cards to get only Battlefield cards
 */
export function getBattlefieldCards(cards: RiftboundCard[]): RiftboundCard[] {
  return cards.filter(isBattlefield);
}
