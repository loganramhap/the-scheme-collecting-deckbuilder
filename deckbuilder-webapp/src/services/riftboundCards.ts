import { RiftboundCard } from '../types/card';

// Cache for loaded cards
let cardsCache: RiftboundCard[] | null = null;

/**
 * Load Riftbound cards from the data file
 */
export async function loadRiftboundCards(): Promise<RiftboundCard[]> {
  if (cardsCache) {
    return cardsCache;
  }

  try {
    // Try to load from local data file
    const response = await fetch('/data/riftbound-cards.json');
    
    if (!response.ok) {
      console.warn('Riftbound cards data file not found, using empty set');
      return [];
    }
    
    const data = await response.json();
    cardsCache = data;
    return data;
  } catch (error) {
    console.error('Failed to load Riftbound cards:', error);
    return [];
  }
}

/**
 * Search Riftbound cards by name
 */
export function searchRiftboundCards(
  cards: RiftboundCard[],
  query: string
): RiftboundCard[] {
  const lowerQuery = query.toLowerCase();
  return cards.filter(card =>
    card.name.toLowerCase().includes(lowerQuery) ||
    card.text?.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Filter Riftbound cards by type
 */
export function filterByType(
  cards: RiftboundCard[],
  type: string
): RiftboundCard[] {
  return cards.filter(card => card.type.toLowerCase() === type.toLowerCase());
}

/**
 * Filter Riftbound cards by color
 */
export function filterByColor(
  cards: RiftboundCard[],
  color: string
): RiftboundCard[] {
  return cards.filter(card => card.color?.toLowerCase() === color.toLowerCase());
}

/**
 * Get all unique card types
 */
export function getCardTypes(cards: RiftboundCard[]): string[] {
  const types = new Set(
    cards
      .map(card => card.type || card.card_type)
      .filter((type): type is string => type !== undefined && type !== '')
  );
  return Array.from(types).sort();
}

/**
 * Get all unique colors/domains
 */
export function getColors(cards: RiftboundCard[]): string[] {
  const colors = new Set(
    cards
      .map(card => card.color || card.domain)
      .filter((color): color is string => color !== undefined && color !== '')
  );
  return Array.from(colors).sort();
}

/**
 * Get all unique rarities
 */
export function getRarities(cards: RiftboundCard[]): string[] {
  const rarities = new Set(
    cards
      .map(card => card.rarity)
      .filter((rarity): rarity is string => rarity !== undefined && rarity !== '')
  );
  return Array.from(rarities).sort();
}

/**
 * Get all unique sets
 */
export function getSets(cards: RiftboundCard[]): string[] {
  const sets = new Set(
    cards
      .map(card => card.set)
      .filter((set): set is string => set !== undefined && set !== '')
  );
  return Array.from(sets).sort();
}

/**
 * Get energy cost range
 */
export function getEnergyCostRange(cards: RiftboundCard[]): { min: number; max: number } {
  const costs = cards
    .map(card => card.energy || card.cost)
    .filter((cost): cost is number => cost !== undefined);
  
  if (costs.length === 0) {
    return { min: 0, max: 10 };
  }
  
  return {
    min: Math.min(...costs),
    max: Math.max(...costs)
  };
}

/**
 * Get all filter options from cards
 */
export function getFilterOptions(cards: RiftboundCard[]) {
  return {
    types: getCardTypes(cards),
    colors: getColors(cards),
    rarities: getRarities(cards),
    sets: getSets(cards),
    energyCostRange: getEnergyCostRange(cards)
  };
}

/**
 * Clear the cards cache (useful for testing or reloading)
 */
export function clearCache(): void {
  cardsCache = null;
}
