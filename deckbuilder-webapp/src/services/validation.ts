import type { Deck, ValidationResult } from '../types/deck';
import type { MTGCard } from '../types/card';
import { cardService } from './cards';

class ValidationService {
  async validateMTGDeck(deck: Deck): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic deck size validation
    const totalCards = deck.cards.reduce((sum, card) => sum + card.count, 0);
    
    if (deck.format === 'commander') {
      if (totalCards !== 100) {
        errors.push(`Commander decks must have exactly 100 cards. Current: ${totalCards}`);
      }
    } else if (deck.format === 'standard' || deck.format === 'modern') {
      if (totalCards < 60) {
        errors.push(`${deck.format} decks must have at least 60 cards. Current: ${totalCards}`);
      }
    }

    // Check card legality
    for (const deckCard of deck.cards) {
      try {
        const card = await cardService.getMTGCard(deckCard.id);
        const legality = card.legalities[deck.format];
        
        if (legality === 'banned') {
          errors.push(`${card.name} is banned in ${deck.format}`);
        } else if (legality === 'not_legal') {
          errors.push(`${card.name} is not legal in ${deck.format}`);
        } else if (legality === 'restricted' && deckCard.count > 1) {
          errors.push(`${card.name} is restricted to 1 copy in ${deck.format}`);
        }

        // Check copy limits (except for basic lands and commander)
        if (deck.format !== 'commander' && deckCard.count > 4 && !this.isBasicLand(card)) {
          errors.push(`${card.name}: Maximum 4 copies allowed (found ${deckCard.count})`);
        }
      } catch (error) {
        warnings.push(`Could not validate card: ${deckCard.id}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  validateRiftboundDeck(deck: Deck): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const totalCards = deck.cards.reduce((sum, card) => sum + card.count, 0);

    // Riftbound deck size rules: 30-40 cards
    if (totalCards < 30) {
      errors.push(`Riftbound decks must have at least 30 cards. Current: ${totalCards}`);
    } else if (totalCards > 40) {
      errors.push(`Riftbound decks cannot have more than 40 cards. Current: ${totalCards}`);
    }

    // Check if legend is set
    if (!deck.legend) {
      warnings.push('No Legend selected. A Legend is recommended for Riftbound decks.');
    }

    // Check if battlefield is set
    if (!deck.battlefield) {
      warnings.push('No Battlefield selected. A Battlefield is recommended for Riftbound decks.');
    }

    // Validate rune color legality
    const activeRuneColors = deck.runeColors || [];
    
    if (activeRuneColors.length > 0) {
      for (const deckCard of deck.cards) {
        const card = cardService.getRiftboundCard(deckCard.id);
        if (card && card.runeColors && card.runeColors.length > 0) {
          // Check if card has at least one matching rune color
          const hasMatchingColor = card.runeColors.some(color => 
            activeRuneColors.includes(color)
          );
          
          if (!hasMatchingColor) {
            errors.push(
              `${card.name} has rune colors [${card.runeColors.join(', ')}] which don't match your Legend's colors [${activeRuneColors.join(', ')}]`
            );
          }
        }
      }
    }

    // Check faction restrictions (optional - depends on game rules)
    const factions = new Set<string>();
    for (const deckCard of deck.cards) {
      const card = cardService.getRiftboundCard(deckCard.id);
      if (card) {
        factions.add(card.faction);
      }
    }

    if (factions.size > 2) {
      warnings.push(`Your deck contains cards from ${factions.size} factions. Consider limiting to 2 factions for better synergy.`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private isBasicLand(card: MTGCard): boolean {
    const basicLands = ['Plains', 'Island', 'Swamp', 'Mountain', 'Forest', 'Wastes'];
    return basicLands.includes(card.name);
  }
}

export const validationService = new ValidationService();
