import { RiftboundCard } from '../types/card';

/**
 * Extract domains from a legend card
 * Legends can have multiple domains (e.g., "Fury, Body")
 * The domains determine which cards are legal in the deck
 */
export function extractLegendDomains(legendCard: RiftboundCard | undefined): string[] {
  if (!legendCard) {
    return [];
  }
  
  // If domain is an array, return it
  if (Array.isArray(legendCard.domain)) {
    return legendCard.domain;
  }
  
  // If domain is a string, split by comma
  if (typeof legendCard.domain === 'string') {
    return legendCard.domain
      .split(',')
      .map(d => d.trim())
      .filter(d => d.length > 0);
  }
  
  return [];
}

/**
 * @deprecated Use extractLegendDomains instead
 * Extract domain from a legend card (returns first domain only)
 */
export function extractLegendDomain(legendCard: RiftboundCard | undefined): string | null {
  const domains = extractLegendDomains(legendCard);
  return domains.length > 0 ? domains[0] : null;
}

/**
 * Filter Riftbound cards based on the Legend's domains
 * Cards with Colorless domain are available to all decks
 * Cards must match at least ONE of the Legend's domains
 */
export function filterByDomains(
  cards: RiftboundCard[], 
  legendDomains: string[]
): RiftboundCard[] {
  // If no domains are active (no legend selected), return all cards
  if (legendDomains.length === 0) {
    return cards;
  }
  
  return cards.filter(card => {
    // Cards with no domain are available to all
    if (!card.domain) {
      return true;
    }
    
    // Get card's domains (could be array or comma-separated string)
    const cardDomains = Array.isArray(card.domain)
      ? card.domain
      : typeof card.domain === 'string'
      ? card.domain.split(',').map(d => d.trim())
      : [];
    
    // Colorless domain cards are always legal
    if (cardDomains.includes('Colorless')) {
      return true;
    }
    
    // Card must have at least ONE domain that matches the legend's domains
    return cardDomains.some(cardDomain => legendDomains.includes(cardDomain));
  });
}

/**
 * @deprecated Use filterByDomains instead
 * Filter Riftbound cards based on the Legend's domain (single domain only)
 */
export function filterByDomain(
  cards: RiftboundCard[], 
  legendDomain: string | null
): RiftboundCard[] {
  return filterByDomains(cards, legendDomain ? [legendDomain] : []);
}

/**
 * Check if a card is legal for the given domains
 */
export function isCardLegalForDomains(
  card: RiftboundCard,
  legendDomains: string[]
): boolean {
  // If no domains are active, all cards are legal
  if (legendDomains.length === 0) {
    return true;
  }
  
  // Cards with no domain are always legal
  if (!card.domain) {
    return true;
  }
  
  // Get card's domains
  const cardDomains = Array.isArray(card.domain)
    ? card.domain
    : typeof card.domain === 'string'
    ? card.domain.split(',').map(d => d.trim())
    : [];
  
  // Colorless domain cards are always legal
  if (cardDomains.includes('Colorless')) {
    return true;
  }
  
  // Card must have at least ONE domain that matches the legend's domains
  return cardDomains.some(cardDomain => legendDomains.includes(cardDomain));
}

/**
 * @deprecated Use isCardLegalForDomains instead
 */
export function isCardLegalForDomain(
  card: RiftboundCard,
  legendDomain: string | null
): boolean {
  return isCardLegalForDomains(card, legendDomain ? [legendDomain] : []);
}

/**
 * Get all unique domains from a list of cards
 */
export function getAllDomains(cards: RiftboundCard[]): string[] {
  const domains = new Set<string>();
  
  cards.forEach(card => {
    if (card.domain) {
      domains.add(card.domain);
    }
  });
  
  return Array.from(domains).sort();
}
