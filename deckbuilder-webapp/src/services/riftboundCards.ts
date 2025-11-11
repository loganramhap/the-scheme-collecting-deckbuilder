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
  const types = new Set(cards.map(card => card.type));
  return Array.from(types).sort();
}

/**
 * Get all unique colors
 */
export function getColors(cards: RiftboundCard[]): string[] {
  const colors = new Set(
    cards
      .map(card => card.color)
      .filter((color): color is string => color !== undefined)
  );
  return Array.from(colors).sort();
}

/**
 * Clear the cards cache (useful for testing or reloading)
 */
export function clearCache(): void {
  cardsCache = null;
}
