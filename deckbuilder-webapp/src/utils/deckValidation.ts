// Deck validation rules for different games and formats

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
