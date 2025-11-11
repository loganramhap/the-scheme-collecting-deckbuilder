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
  type: string; // unit, spell, rune, battlefield, legend
  subtype?: string; // warrior, mage, etc.
  cost?: number;
  attack?: number;
  health?: number;
  rarity?: string; // common, rare, epic, legendary
  color?: string; // red, blue, green, etc.
  text?: string;
  flavor?: string;
  image_url?: string;
  set?: string;
  faction?: string; // Legacy field
  rank?: string; // Legacy field
  runeColors?: string[]; // For rune cards
}

export type Card = MTGCard | RiftboundCard;
