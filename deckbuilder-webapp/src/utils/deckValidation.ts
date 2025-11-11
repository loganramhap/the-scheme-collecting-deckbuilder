// Deck validation rules for different games and formats
import { Deck, DeckCard } from '../types/deck';
import { RiftboundCard } from '../types/card';
import { isBasicRune, isBattlefield, isLegend } from './riftboundCardTypes';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface DeckValidationRules {
  minSize: number;
  maxSize: number;
  excludeFromCount?: string[]; // Card types to exclude from deck size count
  requiredSlots?: string[]; // Required special slots (like commander)
}

// Game-specific validation rules
const VALIDATION_RULES: Record<string, Record<string, DeckValidationRules>> = {
  mtg: {
    commander: {
      minSize: 99,
      maxSize: 99,
      requiredSlots: ['commander'],
    },
    standard: {
      minSize: 60,
      maxSize: Infinity,
    },
    modern: {
      minSize: 60,
      maxSize: Infinity,
    },
    legacy: {
      minSize: 60,
      maxSize: Infinity,
    },
    vintage: {
      minSize: 60,
      maxSize: Infinity,
    },
    pauper: {
      minSize: 60,
      maxSize: Infinity,
    },
  },
  riftbound: {
    standard: {
      minSize: 40,
      maxSize: 40,
      excludeFromCount: ['legend', 'rune', 'battlefield'],
      requiredSlots: ['legend'],
    },
  },
};

export function validateDeck(
  cards: any[],
  game: string,
  format: string,
  specialSlots?: Record<string, any>
): ValidationResult {
  // For Riftbound, always use standard format regardless of what's specified
  const actualFormat = game === 'riftbound' ? 'standard' : format;
  const rules = VALIDATION_RULES[game]?.[actualFormat];
  
  if (!rules) {
    return {
      isValid: true,
      errors: [],
      warnings: [`No validation rules found for ${game} ${actualFormat}`],
    };
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  // Count cards (excluding special types for Riftbound)
  let deckSize = cards.length;
  if (rules.excludeFromCount) {
    deckSize = cards.filter(card => 
      !rules.excludeFromCount!.includes(card.type?.toLowerCase() || '')
    ).length;
  }

  // Check deck size
  if (deckSize < rules.minSize) {
    errors.push(`Deck must have at least ${rules.minSize} cards (currently ${deckSize})`);
  }
  if (deckSize > rules.maxSize) {
    errors.push(`Deck cannot have more than ${rules.maxSize} cards (currently ${deckSize})`);
  }

  // Check required slots
  if (rules.requiredSlots) {
    for (const slot of rules.requiredSlots) {
      if (!specialSlots?.[slot]) {
        errors.push(`${slot.charAt(0).toUpperCase() + slot.slice(1)} is required`);
      }
    }
  }

  // Game-specific validations
  if (game === 'riftbound') {
    validateRiftboundDeck(cards, specialSlots, errors, warnings);
  } else if (game === 'mtg') {
    validateMTGDeck(cards, format, specialSlots, errors, warnings);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

function validateRiftboundDeck(
  cards: any[],
  specialSlots: Record<string, any> | undefined,
  errors: string[],
  _warnings: string[]
) {
  // Count specific card types
  const runes = cards.filter(card => card.type?.toLowerCase() === 'rune');
  const battlefields = cards.filter(card => card.type?.toLowerCase() === 'battlefield');
  
  // Riftbound specific rules
  if (runes.length !== 12) {
    errors.push(`Riftbound decks must have exactly 12 rune cards (currently ${runes.length})`);
  }
  
  if (battlefields.length !== 3) {
    errors.push(`Riftbound decks must have exactly 3 battlefield cards (currently ${battlefields.length})`);
  }
  
  if (!specialSlots?.legend) {
    errors.push('Riftbound decks must have a legend');
  }

  // Check for card count limits (max 3 of any card)
  const cardCounts = new Map<string, number>();
  cards.forEach(card => {
    if (card.name) {
      cardCounts.set(card.name, (cardCounts.get(card.name) || 0) + 1);
    }
  });
  
  for (const [cardName, count] of cardCounts) {
    if (count > 3) {
      errors.push(`${cardName} appears ${count} times (Riftbound allows maximum 3 copies of each card)`);
    }
  }
}

function validateMTGDeck(
  cards: any[],
  format: string,
  specialSlots: Record<string, any> | undefined,
  errors: string[],
  _warnings: string[]
) {
  if (format === 'commander') {
    if (!specialSlots?.commander) {
      errors.push('Commander decks must have a commander');
    }
    
    // Check for duplicate cards (except basic lands)
    const cardCounts = new Map<string, number>();
    cards.forEach(card => {
      if (!card.name?.includes('Basic Land')) {
        cardCounts.set(card.name, (cardCounts.get(card.name) || 0) + 1);
      }
    });
    
    for (const [cardName, count] of cardCounts) {
      if (count > 1) {
        errors.push(`${cardName} appears ${count} times (Commander allows only 1 copy of each card except basic lands)`);
      }
    }
  }
}

export function getDeckSizeInfo(game: string, format: string): string {
  const rules = VALIDATION_RULES[game]?.[format];
  if (!rules) return 'Unknown format';
  
  if (game === 'riftbound') {
    return '40 cards + 1 legend + 12 runes + 3 battlefields';
  }
  
  if (rules.minSize === rules.maxSize) {
    return `Exactly ${rules.minSize} cards`;
  }
  
  return `At least ${rules.minSize} cards`;
}

/**
 * Comprehensive validation for Riftbound decks
 * Validates all deck requirements according to Riftbound rules
 */
export function validateRiftboundDeckComprehensive(
  deck: Deck,
  availableCards: RiftboundCard[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 13.1: Validate exactly 1 Legend selected
  if (!deck.legend) {
    errors.push('No Legend selected (exactly 1 required)');
  }

  // 13.2: Validate exactly 3 Battlefields selected
  const battlefieldCount = (deck.battlefields || []).length;
  if (battlefieldCount === 0) {
    errors.push('No Battlefields selected (exactly 3 required)');
  } else if (battlefieldCount < 3) {
    errors.push(`Need ${3 - battlefieldCount} more Battlefield${3 - battlefieldCount > 1 ? 's' : ''} (exactly 3 required)`);
  } else if (battlefieldCount > 3) {
    errors.push(`Remove ${battlefieldCount - 3} Battlefield${battlefieldCount - 3 > 1 ? 's' : ''} (exactly 3 required)`);
  }

  // 13.3: Validate exactly 12 Runes selected
  const runeCount = (deck.runeDeck || []).reduce((sum, card) => sum + card.count, 0);
  if (runeCount === 0) {
    errors.push('No Runes selected (exactly 12 required)');
  } else if (runeCount < 12) {
    errors.push(`Need ${12 - runeCount} more Rune${12 - runeCount > 1 ? 's' : ''} (exactly 12 required)`);
  } else if (runeCount > 12) {
    errors.push(`Remove ${runeCount - 12} Rune${runeCount - 12 > 1 ? 's' : ''} (exactly 12 required)`);
  }

  // 13.4: Validate exactly 40 main deck cards
  // Calculate main deck count (excluding Basic Runes, Battlefields, and Legends)
  const mainDeckCount = deck.cards.reduce((sum, card) => {
    const fullCard = availableCards.find(c => c.id === card.id);
    if (!fullCard) {
      // If card not found, include it in count
      return sum + card.count;
    }
    
    // Exclude Basic Runes, Battlefields, and Legends from main deck count
    if (isBasicRune(fullCard) || isBattlefield(fullCard) || isLegend(fullCard)) {
      return sum;
    }
    
    return sum + card.count;
  }, 0);

  if (mainDeckCount === 0) {
    errors.push('No main deck cards selected (exactly 40 required)');
  } else if (mainDeckCount < 40) {
    errors.push(`Need ${40 - mainDeckCount} more main deck card${40 - mainDeckCount > 1 ? 's' : ''} (exactly 40 required)`);
  } else if (mainDeckCount > 40) {
    errors.push(`Remove ${mainDeckCount - 40} main deck card${mainDeckCount - 40 > 1 ? 's' : ''} (exactly 40 required)`);
  }

  // Additional validation: Check for card count limits (max 4 of any card in main deck)
  const cardCounts = new Map<string, number>();
  deck.cards.forEach(card => {
    const fullCard = availableCards.find(c => c.id === card.id);
    if (fullCard && !isBasicRune(fullCard) && !isBattlefield(fullCard) && !isLegend(fullCard)) {
      const currentCount = cardCounts.get(card.name || card.id) || 0;
      cardCounts.set(card.name || card.id, currentCount + card.count);
    }
  });

  for (const [cardName, count] of cardCounts) {
    if (count > 4) {
      warnings.push(`${cardName} appears ${count} times (maximum 4 copies recommended)`);
    }
  }

  // Check rune deck for duplicates (each rune should appear max 4 times)
  const runeCounts = new Map<string, number>();
  (deck.runeDeck || []).forEach(card => {
    const currentCount = runeCounts.get(card.name || card.id) || 0;
    runeCounts.set(card.name || card.id, currentCount + card.count);
  });

  for (const [cardName, count] of runeCounts) {
    if (count > 4) {
      warnings.push(`${cardName} appears ${count} times in Rune Deck (maximum 4 copies recommended)`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
