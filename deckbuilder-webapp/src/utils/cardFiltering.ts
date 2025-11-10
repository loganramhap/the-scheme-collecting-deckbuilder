import { Card, MTGCard, RiftboundCard } from '../types/card';
import { CardFilters } from '../types/filters';

/**
 * Check if a card is an MTG card
 */
function isMTGCard(card: Card): card is MTGCard {
  return 'mana_cost' in card || 'cmc' in card;
}

/**
 * Check if a card is a Riftbound card
 */
function isRiftboundCard(card: Card): card is RiftboundCard {
  return 'faction' in card && 'rank' in card;
}

/**
 * Extract card types from type_line (MTG) or type (Riftbound)
 */
function getCardTypes(card: Card): string[] {
  if (isMTGCard(card)) {
    // MTG type_line format: "Legendary Creature — Human Wizard"
    const typeLine = card.type_line.toLowerCase();
    const types: string[] = [];
    
    if (typeLine.includes('creature')) types.push('Creature');
    if (typeLine.includes('instant')) types.push('Instant');
    if (typeLine.includes('sorcery')) types.push('Sorcery');
    if (typeLine.includes('enchantment')) types.push('Enchantment');
    if (typeLine.includes('artifact')) types.push('Artifact');
    if (typeLine.includes('planeswalker')) types.push('Planeswalker');
    if (typeLine.includes('land')) types.push('Land');
    
    return types;
  } else if (isRiftboundCard(card)) {
    return [card.type];
  }
  
  return [];
}

/**
 * Get card cost (cmc for MTG, cost for Riftbound)
 */
function getCardCost(card: Card): number {
  if (isMTGCard(card)) {
    return card.cmc;
  } else if (isRiftboundCard(card)) {
    return card.cost;
  }
  return 0;
}

/**
 * Get card rarity
 */
function getCardRarity(card: Card): string | null {
  if (isMTGCard(card)) {
    // MTG cards have rarity in legalities or we need to fetch it
    // For now, return null as it's not in the current type definition
    return null;
  } else if (isRiftboundCard(card)) {
    return card.rank;
  }
  return null;
}

/**
 * Check if card matches type filter
 */
function matchesTypeFilter(card: Card, typeFilters: string[]): boolean {
  if (typeFilters.length === 0) return true;
  
  const cardTypes = getCardTypes(card);
  return typeFilters.some(filter => cardTypes.includes(filter));
}

/**
 * Check if card matches cost filter
 */
function matchesCostFilter(card: Card, minCost: number | null, maxCost: number | null): boolean {
  const cost = getCardCost(card);
  
  if (minCost !== null && cost < minCost) return false;
  if (maxCost !== null && cost > maxCost) return false;
  
  return true;
}

/**
 * Check if card matches rarity filter
 */
function matchesRarityFilter(card: Card, rarityFilters: string[]): boolean {
  if (rarityFilters.length === 0) return true;
  
  const rarity = getCardRarity(card);
  if (!rarity) return true; // If rarity is unknown, include the card
  
  return rarityFilters.some(filter => 
    rarity.toLowerCase() === filter.toLowerCase()
  );
}

/**
 * Check if card matches color/faction filter
 */
function matchesColorFilter(card: Card, colorFilters: string[]): boolean {
  if (colorFilters.length === 0) return true;
  
  if (isMTGCard(card)) {
    // MTG: Check if card's colors match any of the selected colors
    const cardColors = card.colors || [];
    if (cardColors.length === 0) return true; // Colorless cards pass
    
    return cardColors.some(color => colorFilters.includes(color));
  } else if (isRiftboundCard(card)) {
    // Riftbound: Check faction
    return colorFilters.includes(card.faction);
  }
  
  return true;
}

/**
 * Check if card matches search query
 */
function matchesSearchQuery(card: Card, query: string): boolean {
  if (!query) return true;
  
  const lowerQuery = query.toLowerCase();
  const cardName = card.name.toLowerCase();
  
  if (cardName.includes(lowerQuery)) return true;
  
  // Also search in oracle text for MTG cards
  if (isMTGCard(card) && card.oracle_text) {
    if (card.oracle_text.toLowerCase().includes(lowerQuery)) return true;
  }
  
  // Search in text for Riftbound cards
  if (isRiftboundCard(card) && card.text) {
    if (card.text.toLowerCase().includes(lowerQuery)) return true;
  }
  
  return false;
}

/**
 * Main filtering function that applies all filters to a card array
 * Uses memoization-friendly approach - returns new array only if filters match
 */
export function filterCards(cards: Card[], filters: CardFilters): Card[] {
  return cards.filter(card => {
    // Apply all filters
    if (!matchesTypeFilter(card, filters.types)) return false;
    if (!matchesCostFilter(card, filters.minCost, filters.maxCost)) return false;
    if (!matchesRarityFilter(card, filters.rarities)) return false;
    if (!matchesColorFilter(card, filters.colors)) return false;
    if (!matchesSearchQuery(card, filters.searchQuery)) return false;
    
    return true;
  });
}

/**
 * Get count of cards matching filters (useful for displaying filter results)
 */
export function getFilteredCardCount(cards: Card[], filters: CardFilters): number {
  return filterCards(cards, filters).length;
}

/**
 * Check if any filters are active
 */
export function hasActiveFilters(filters: CardFilters): boolean {
  return (
    filters.types.length > 0 ||
    filters.rarities.length > 0 ||
    filters.colors.length > 0 ||
    filters.minCost !== null ||
    filters.maxCost !== null ||
    filters.searchQuery.length > 0
  );
}
