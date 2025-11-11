export type GameType = 'mtg' | 'riftbound';

export interface DeckCard {
  id: string;
  count: number;
  name?: string;
  image_url?: string;
}

export interface DeckMetadata {
  author: string;
  created: string;
  updated?: string;
  description?: string;
  tags?: string[];
}

export interface Deck {
  game: GameType;
  format: string;
  name: string;
  cards: DeckCard[];
  sideboard?: DeckCard[];
  metadata: DeckMetadata;
  
  // MTG Commander-specific
  commander?: DeckCard;
  colorIdentity?: string[];
  
  // Riftbound-specific
  legend?: DeckCard;
  battlefield?: DeckCard; // Legacy field - use battlefields instead
  battlefields?: DeckCard[];
  runeDeck?: DeckCard[];
  legendDomain?: string;
  runeColors?: string[];
  
  // Legacy field
  featured_card?: DeckCard;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface DeckDiff {
  added: DeckCard[];
  removed: DeckCard[];
  modified: DeckCard[];
}
