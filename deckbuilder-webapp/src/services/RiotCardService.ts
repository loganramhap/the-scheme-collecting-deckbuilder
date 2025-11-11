import { RiftboundCard } from '../types/card';
import { isValidAPIKeyFormat } from '../config/riot';
import { RiotAPIError } from './RiotAPIError';

/**
 * Service for fetching Riftbound card data from the Riot Games API
 */
export class RiftboundCardService {
  private apiKey: string;
  private cacheKey = 'riftbound_cards_cache';
  private cacheTimestampKey = 'riftbound_cards_timestamp';
  private cacheDuration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  constructor(apiKey: string) {
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error(
        'Riot API key is required. Please set VITE_RIOT_API_KEY in your .env file. ' +
        'Get your API key from: https://developer.riotgames.com/'
      );
    }

    if (!isValidAPIKeyFormat(apiKey)) {
      console.warn(
        'Riot API key format appears invalid. Expected format: RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
      );
    }

    this.apiKey = apiKey;
  }

  /**
   * Get cards from API or cache
   * @param forceRefresh - If true, bypass cache and fetch from API
   * @returns Array of Riftbound cards
   * @throws {RiotAPIError} When API fails and no cache is available
   */
  async getCards(forceRefresh = false): Promise<RiftboundCard[]> {
    // Check cache first unless force refresh
    if (!forceRefresh) {
      const cached = this.getCachedCards();
      if (cached) {
        return cached;
      }
    }

    try {
      // Fetch from API
      const cards = await this.fetchFromAPI();
      
      // Cache the results
      this.cacheCards(cards);
      
      return cards;
    } catch (error) {
      // Log the error for debugging
      if (error instanceof RiotAPIError) {
        console.error(`Riot API Error [${error.statusCode}]:`, error.message);
        
        // For recoverable errors, try to use cache
        if (error.canRecover()) {
          const cached = this.getCachedCards(true);
          if (cached) {
            console.warn('Using expired cache due to API error');
            return cached;
          }
        }
        
        // Re-throw the structured error
        throw error;
      }

      // Handle unexpected errors
      console.error('Unexpected error fetching from Riot API:', error);
      
      // Try cache as last resort
      const cached = this.getCachedCards(true);
      if (cached) {
        console.warn('Using expired cache due to unexpected error');
        return cached;
      }
      
      // No cache available, throw a generic error
      throw new RiotAPIError(
        0,
        'Failed to load card data and no cache available',
        'Unable to load card data. Please try refreshing or check your internet connection.',
        false
      );
    }
  }

  /**
   * Fetch card data from Riot Games API
   * @private
   * @throws {RiotAPIError} When API request fails with detailed error information
   */
  private async fetchFromAPI(): Promise<RiftboundCard[]> {
    try {
      const response = await fetch(
        'https://americas.api.riotgames.com/riftbound/content/v1/contents',
        {
          headers: {
            'X-Riot-Token': this.apiKey,
          },
        }
      );

      if (!response.ok) {
        // Create structured error from response
        throw await RiotAPIError.fromResponse(response);
      }

      const data = await response.json();
      return this.transformAPIResponse(data);
    } catch (error) {
      // If it's already a RiotAPIError, re-throw it
      if (error instanceof RiotAPIError) {
        throw error;
      }

      // Handle network errors or other fetch failures
      if (error instanceof TypeError) {
        throw new RiotAPIError(
          0,
          'Network error: Unable to reach Riot API',
          'Unable to connect to the Riot Games API. Please check your internet connection.',
          true
        );
      }

      // Handle JSON parsing errors
      if (error instanceof SyntaxError) {
        throw new RiotAPIError(
          0,
          'Invalid API response: Failed to parse JSON',
          'Received an invalid response from the API. Please try again later.',
          true
        );
      }

      // Re-throw unknown errors
      throw error;
    }
  }

  /**
   * Transform Riot API response format to application card format
   * @private
   */
  private transformAPIResponse(apiData: any): RiftboundCard[] {
    if (!apiData || !Array.isArray(apiData.cards)) {
      throw new Error('Invalid API response format');
    }

    return apiData.cards.map((card: any) => {
      // Create the card object with both original and normalized fields
      const transformedCard: RiftboundCard = {
        // Core fields from API
        id: card.id || card.cardId || '',
        name: card.name || '',
        card_number: card.cardNumber || card.number,
        game: 'Riftbound',
        set: card.set || card.setName,
        energy: card.cost || card.energy,
        might: card.might || card.attack || card.power,
        domain: card.domain || card.color,
        card_type: card.type || card.cardType,
        tags: card.tags ? (Array.isArray(card.tags) ? card.tags.join(', ') : card.tags) : undefined,
        ability: card.text || card.ability || card.abilityText,
        rarity: card.rarity,
        artist: card.artist,
        image_url: card.imageUrl || card.image_url || card.image,

        // Normalized fields for easier filtering
        type: this.normalizeType(card.type || card.cardType),
        cost: card.cost || card.energy,
        attack: card.might || card.attack || card.power,
        color: card.domain || card.color,
        text: card.text || card.ability || card.abilityText,
      };

      return transformedCard;
    });
  }

  /**
   * Normalize card type to lowercase for consistent filtering
   * @private
   */
  private normalizeType(type: string | undefined): string {
    if (!type) return 'unknown';
    return type.toLowerCase();
  }

  /**
   * Get cached cards if available and not expired
   * @param ignoreExpiry - If true, return cache even if expired
   * @private
   */
  private getCachedCards(ignoreExpiry = false): RiftboundCard[] | null {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      const timestamp = localStorage.getItem(this.cacheTimestampKey);

      if (!cached || !timestamp) {
        return null;
      }

      const age = Date.now() - parseInt(timestamp, 10);
      if (!ignoreExpiry && age > this.cacheDuration) {
        return null;
      }

      return JSON.parse(cached);
    } catch (error) {
      console.error('Failed to read cache:', error);
      return null;
    }
  }

  /**
   * Cache cards to localStorage
   * @private
   */
  private cacheCards(cards: RiftboundCard[]): void {
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify(cards));
      localStorage.setItem(this.cacheTimestampKey, Date.now().toString());
    } catch (error) {
      console.error('Failed to cache cards:', error);
    }
  }

  /**
   * Get the age of the current cache in milliseconds
   * @returns Cache age in milliseconds, or null if no cache exists
   */
  getCacheAge(): number | null {
    const timestamp = localStorage.getItem(this.cacheTimestampKey);
    if (!timestamp) return null;
    return Date.now() - parseInt(timestamp, 10);
  }

  /**
   * Clear the card cache
   */
  clearCache(): void {
    localStorage.removeItem(this.cacheKey);
    localStorage.removeItem(this.cacheTimestampKey);
  }

  /**
   * Check if cache exists and is valid
   */
  hasCachedData(): boolean {
    const cached = localStorage.getItem(this.cacheKey);
    const timestamp = localStorage.getItem(this.cacheTimestampKey);
    
    if (!cached || !timestamp) {
      return false;
    }

    const age = Date.now() - parseInt(timestamp, 10);
    return age <= this.cacheDuration;
  }
}
