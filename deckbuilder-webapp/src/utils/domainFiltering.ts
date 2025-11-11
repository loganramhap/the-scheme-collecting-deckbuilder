import { RiftboundCard } from '../types/card';

/**
 * Extract domain from a legend card
 * The domain determines which cards are legal in the deck
 */
export function extractLegendDomain(legendCard: RiftboundCard | undefined): string | null {
  if (!legendCard) {
    return null;
  }
  
  // Return the domain field from the card
  return legendCard.domain || null;
}

/**
 * Filter Riftbound cards based on the Legend's domain
 * Cards with Colorless domain are available to all decks
 * Cards with a specific domain must match the Legend's domain
 */
export function filterByDomain(
  cards: RiftboundCard[], 
  legendDomain: string | null
): RiftboundCard[] {
  // If no domain is active (no legend selected), return all cards
  if (!legendDomain) {
    return cards;
  }
  
  return cards.filter(card => {
    // Cards with no domain are available to all
    if (!card.domain) {
      return true;
    }
    
    // Colorless domain cards are always legal
    if (card.domain === 'Colorless') {
      return true;
    }
    
    // Card must match the legend's domain
    return card.domain === legendDomain;
  });
}

/**
 * Check if a card is legal for the given domain
 */
export function isCardLegalForDomain(
  card: RiftboundCard,
  legendDomain: string | null
): boolean {
  // If no domain is active, all cards are legal
  if (!legendDomain) {
    return true;
  }
  
  // Cards with no domain are always legal
  if (!card.domain) {
    return true;
  }
  
  // Colorless domain cards are always legal
  if (card.domain === 'Colorless') {
    return true;
  }
  
  // Card must match the legend's domain
  return card.domain === legendDomain;
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
