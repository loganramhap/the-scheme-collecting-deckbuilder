export interface MTGCard {
  id: string;
  name: string;
  mana_cost?: string;
  cmc: number;
  type_line: string;
  oracle_text?: string;
  colors?: string[];
  color_identity?: string[];
  legalities: Record<string, string>;
  image_uris?: {
    small: string;
    normal: string;
    large: string;
  };
}

export interface RiftboundCard {
  id: string;
  name: string;
  card_number?: string; // Card number from the set (e.g., "OGN-001/298")
  game?: string; // "Riftbound"
  set?: string; // Set name (e.g., "Origins")
  energy?: number; // Energy cost
  might?: number; // Might/Attack value
  domain?: string; // Domain/Color (e.g., "Fury", "Cunning", "Harmony")
  card_type?: string; // Card type (e.g., "Unit", "Spell", "Rune", "Battlefield", "Legend")
  tags?: string; // Tags/subtypes (e.g., "Dragon, Noxus")
  ability?: string; // Card ability text
  rarity?: string; // Rarity (e.g., "Common", "Rare", "Epic", "Legendary")
  artist?: string; // Artist name
  image_url?: string; // Image URL
  
  // Normalized/computed fields for easier filtering
  type: string; // Normalized type: unit, spell, rune, battlefield, legend
  cost?: number; // Alias for energy
  attack?: number; // Alias for might
  color?: string; // Alias for domain
  text?: string; // Alias for ability
  
  // Legacy fields
  subtype?: string;
  health?: number;
  flavor?: string;
  faction?: string;
  rank?: string;
  runeColors?: string[];
}

export type Card = MTGCard | RiftboundCard;
