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

// Riftbound specific filter options
export const RIFTBOUND_CARD_TYPES = [
  'Unit',
  'Spell',
  'Artifact',
  'Legend',
  'Battlefield',
];

export const RIFTBOUND_RARITIES = [
  'Common',
  'Rare',
  'Epic',
  'Legendary',
];

export const RIFTBOUND_FACTIONS = [
  'Neutral',
  'Order',
  'Chaos',
  'Nature',
  'Tech',
];
