import { RiftboundCard } from '../types/card';
import { shouldUseRiotAPI, RIOT_API_KEY } from '../config/riot';
import { RiftboundCardService } from './RiotCardService';

// Cache for loaded cards
let cardsCache: RiftboundCard[] | null = null;

// Riot API service instance (lazy initialized)
let riotCardService: RiftboundCardService | null = null;

/**
 * Load Riftbound cards from JSON file (fallback method)
 */
async function loadCardsFromJSON(): Promise<RiftboundCard[]> {
  try {
    // Try to load from local data file
    const response = await fetch('/data/riftbound-cards.json');
    
    if (!response.ok) {
      console.warn('Riftbound cards data file not found, using empty set');
      return [];
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to load Riftbound cards from JSON:', error);
    return [];
  }
}

/**
 * Load Riftbound cards from Riot API or JSON file
 * Implements automatic fallback from API to JSON on error
 * @param forceRefresh - If true, bypass cache and fetch fresh data
 * @param onProgress - Optional callback for loading progress updates
 */
export async function loadRiftboundCards(
  forceRefresh = false,
  onProgress?: (message: string) => void
): Promise<RiftboundCard[]> {
  // Return cached cards if available and not forcing refresh
  if (cardsCache && !forceRefresh) {
    onProgress?.('Using cached card data');
    return cardsCache;
  }

  // Try Riot API first if feature flag is enabled
  if (shouldUseRiotAPI()) {
    try {
      onProgress?.('Connecting to Riot API...');
      console.log('[Card Loading] Attempting to load from Riot API...');
      
      // Initialize Riot API service if needed
      if (!riotCardService && RIOT_API_KEY) {
        riotCardService = new RiftboundCardService(RIOT_API_KEY);
      }
      
      if (riotCardService) {
        onProgress?.('Fetching card data from Riot API...');
        const cards = await riotCardService.getCards(forceRefresh);
        console.log(`[Card Loading] Successfully loaded ${cards.length} cards from Riot API`);
        onProgress?.(`Loaded ${cards.length} cards from Riot API`);
        cardsCache = cards;
        return cards;
      }
    } catch (error) {
      console.error('[Card Loading] Failed to load from Riot API, falling back to JSON:', error);
      onProgress?.('API failed, loading from local database...');
      // Continue to fallback
    }
  }

  // Fallback to JSON file
  onProgress?.('Loading from local card database...');
  console.log('[Card Loading] Loading from JSON file...');
  const cards = await loadCardsFromJSON();
  console.log(`[Card Loading] Loaded ${cards.length} cards from JSON file`);
  onProgress?.(`Loaded ${cards.length} cards from local database`);
  cardsCache = cards;
  return cards;
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

/**
 * Get the Riot API service instance
 * @returns RiotCardService instance or null if not initialized
 */
export function getRiotCardService(): RiftboundCardService | null {
  return riotCardService;
}

/**
 * Check if cards are currently loaded from API or JSON
 * @returns 'api' if using Riot API, 'json' if using JSON file, 'none' if no cards loaded
 */
export function getCardSource(): 'api' | 'json' | 'none' {
  if (!cardsCache) return 'none';
  
  if (shouldUseRiotAPI() && riotCardService?.hasCachedData()) {
    return 'api';
  }
  
  return 'json';
}
