export interface CardFilters {
  types: string[];
  minCost: number | null;
  maxCost: number | null;
  rarities: string[];
  colors: string[];
  searchQuery: string;
}

export const DEFAULT_FILTERS: CardFilters = {
  types: [],
  minCost: null,
  maxCost: null,
  rarities: [],
  colors: [],
  searchQuery: '',
};

// MTG specific filter options
export const MTG_CARD_TYPES = [
  'Creature',
  'Instant',
  'Sorcery',
  'Enchantment',
  'Artifact',
  'Planeswalker',
  'Land',
];

export const MTG_RARITIES = [
  'common',
  'uncommon',
  'rare',
  'mythic',
];

export const MTG_COLORS = [
  { code: 'W', name: 'White' },
  { code: 'U', name: 'Blue' },
  { code: 'B', name: 'Black' },
  { code: 'R', name: 'Red' },
  { code: 'G', name: 'Green' },
];

// Riftbound specific filter options (based on Riot API data)
export const RIFTBOUND_CARD_TYPES = [
  'Unit',
  'Champion Unit',
  'Token Unit',
  'Spell',
  'Signature Spell',
  'Gear',
  'Basic Rune',
  'Battlefield',
  'Legend',
];

export const RIFTBOUND_RARITIES = [
  'Common',
  'Uncommon',
  'Rare',
  'Epic',
  'Legendary',
  'Showcase',
];

// Riftbound Domains (not factions)
export const RIFTBOUND_DOMAINS = [
  { code: 'Fury', name: 'Fury', color: '#ff5722' },
  { code: 'Calm', name: 'Calm', color: '#2196f3' },
  { code: 'Mind', name: 'Mind', color: '#9c27b0' },
  { code: 'Body', name: 'Body', color: '#ff9800' },
  { code: 'Order', name: 'Order', color: '#ffc107' },
  { code: 'Colorless', name: 'Colorless', color: '#757575' },
];

// Keep for backward compatibility but deprecated
export const RIFTBOUND_FACTIONS = RIFTBOUND_DOMAINS.map(d => d.code);
