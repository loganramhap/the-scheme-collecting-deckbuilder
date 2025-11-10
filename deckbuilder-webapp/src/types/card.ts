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
  cost: number;
  faction: string;
  rank: string;
  type: string;
  runeColors?: string[]; // Rune colors for Riftbound cards
  text?: string;
  attack?: number;
  health?: number;
  image_url?: string;
}

export type Card = MTGCard | RiftboundCard;
