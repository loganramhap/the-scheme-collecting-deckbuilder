/**
 * Riot Games API Configuration
 * 
 * This file contains configuration for the Riot Games API integration.
 * The API key should be set in the .env file as VITE_RIOT_API_KEY.
 * 
 * Get your API key from: https://developer.riotgames.com/
 */

/**
 * Riot Games API key from environment variables
 */
export const RIOT_API_KEY = import.meta.env.VITE_RIOT_API_KEY as string | undefined;

/**
 * Riot Games API base URL for Americas region
 */
export const RIOT_API_BASE_URL = 'https://americas.api.riotgames.com';

/**
 * Riftbound content API endpoint
 */
export const RIFTBOUND_CONTENT_ENDPOINT = '/riftbound/content/v1/contents';

/**
 * Cache duration for card data (24 hours in milliseconds)
 */
export const CARD_CACHE_DURATION = 24 * 60 * 60 * 1000;

/**
 * Feature flag to enable/disable Riot API usage
 * Set VITE_USE_RIOT_API=true in .env to enable API loading
 * Defaults to false (uses JSON file fallback)
 */
export const USE_RIOT_API = import.meta.env.VITE_USE_RIOT_API === 'true';

/**
 * Check if Riot API is configured
 * @returns true if API key is present
 */
export function isRiotAPIConfigured(): boolean {
  return !!RIOT_API_KEY && RIOT_API_KEY.trim().length > 0;
}

/**
 * Check if Riot API should be used for loading cards
 * @returns true if feature flag is enabled and API is configured
 */
export function shouldUseRiotAPI(): boolean {
  return USE_RIOT_API && isRiotAPIConfigured();
}

/**
 * Validate Riot API key format
 * @param apiKey - The API key to validate
 * @returns true if the API key appears to be in valid format
 */
export function isValidAPIKeyFormat(apiKey: string | undefined): boolean {
  if (!apiKey) return false;
  
  // Riot API keys typically start with "RGAPI-" followed by UUID-like format
  const riotKeyPattern = /^RGAPI-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
  return riotKeyPattern.test(apiKey);
}

/**
 * Get warning message if API is not configured
 * @returns Warning message or null if configured
 */
export function getAPIConfigWarning(): string | null {
  if (!RIOT_API_KEY) {
    return 'Riot API key not configured. Card data will not update automatically. Add VITE_RIOT_API_KEY to your .env file.';
  }
  
  if (!isValidAPIKeyFormat(RIOT_API_KEY)) {
    return 'Riot API key format appears invalid. Please check your VITE_RIOT_API_KEY in .env file.';
  }
  
  return null;
}

// Log warning if API is not configured (only in development)
if (import.meta.env.DEV) {
  const warning = getAPIConfigWarning();
  if (warning) {
    console.warn(`[Riot API Config] ${warning}`);
  }
}
