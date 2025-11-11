import type { Deck, DeckCard } from '../types/deck';
import type { DeckDiff } from '../types/versioning';

// Threshold for using Web Worker (number of cards)
const LARGE_DECK_THRESHOLD = 100;

/**
 * Service for calculating differences between deck versions
 */
class DeckDiffService {
  private worker: Worker | null = null;

  /**
   * Get or create Web Worker instance
   */
  private getWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(
        new URL('../workers/deckDiff.worker.ts', import.meta.url),
        { type: 'module' }
      );
    }
    return this.worker;
  }

  /**
   * Check if deck is large enough to warrant Web Worker
   */
  private isLargeDeck(deck: Deck): boolean {
    const totalCards = deck.cards.reduce((sum, card) => sum + card.count, 0);
    return totalCards >= LARGE_DECK_THRESHOLD;
  }

  /**
   * Calculate differences between two decks using Web Worker for large decks
   * @param oldDeck - The original deck version
   * @param newDeck - The new deck version
   * @returns Promise resolving to DeckDiff object containing all changes
   */
  async calculateDiffAsync(oldDeck: Deck, newDeck: Deck): Promise<DeckDiff> {
    // Use Web Worker for large decks
    if (this.isLargeDeck(oldDeck) || this.isLargeDeck(newDeck)) {
      return new Promise((resolve, reject) => {
        const worker = this.getWorker();

        const handleMessage = (event: MessageEvent) => {
          const response = event.data;

          if (response.type === 'diffResult') {
            worker.removeEventListener('message', handleMessage);
            resolve(response.diff);
          } else if (response.type === 'error') {
            worker.removeEventListener('message', handleMessage);
            reject(new Error(response.error));
          }
        };

        worker.addEventListener('message', handleMessage);

        worker.postMessage({
          type: 'calculateDiff',
          oldDeck,
          newDeck,
        });

        // Timeout after 30 seconds
        setTimeout(() => {
          worker.removeEventListener('message', handleMessage);
          reject(new Error('Diff calculation timeout'));
        }, 30000);
      });
    }

    // Use synchronous calculation for small decks
    return Promise.resolve(this.calculateDiff(oldDeck, newDeck));
  }

  /**
   * Calculate differences between two decks (synchronous)
   * @param oldDeck - The original deck version
   * @param newDeck - The new deck version
   * @returns DeckDiff object containing all changes
   */
  calculateDiff(oldDeck: Deck, newDeck: Deck): DeckDiff {
    const diff: DeckDiff = {
      added: [],
      removed: [],
      modified: [],
      specialSlots: {},
    };

    // Create maps for efficient lookup
    const oldCardsMap = new Map<string, DeckCard>();
    const newCardsMap = new Map<string, DeckCard>();

    // Build maps from main deck cards
    oldDeck.cards.forEach(card => oldCardsMap.set(card.id, card));
    newDeck.cards.forEach(card => newCardsMap.set(card.id, card));

    // Find added and modified cards
    newDeck.cards.forEach(newCard => {
      const oldCard = oldCardsMap.get(newCard.id);
      
      if (!oldCard) {
        // Card was added
        diff.added.push(newCard);
      } else if (oldCard.count !== newCard.count) {
        // Card count was modified
        diff.modified.push({
          card: newCard,
          oldCount: oldCard.count,
          newCount: newCard.count,
        });
      }
    });

    // Find removed cards
    oldDeck.cards.forEach(oldCard => {
      if (!newCardsMap.has(oldCard.id)) {
        diff.removed.push(oldCard);
      }
    });

    // Check special slots (commander, legend, battlefield)
    this.checkSpecialSlot(oldDeck.commander, newDeck.commander, diff, 'commander');
    this.checkSpecialSlot(oldDeck.legend, newDeck.legend, diff, 'legend');
    this.checkSpecialSlot(oldDeck.battlefield, newDeck.battlefield, diff, 'battlefield');

    return diff;
  }

  /**
   * Helper method to check if a special slot has changed
   */
  private checkSpecialSlot(
    oldCard: DeckCard | undefined,
    newCard: DeckCard | undefined,
    diff: DeckDiff,
    slotName: 'commander' | 'legend' | 'battlefield'
  ): void {
    const oldSlot = oldCard || null;
    const newSlot = newCard || null;

    // Check if the slot changed
    if (oldSlot?.id !== newSlot?.id) {
      diff.specialSlots[slotName] = {
        old: oldSlot,
        new: newSlot,
      };
    }
  }

  /**
   * Detect merge conflicts between three deck versions
   * @param baseDeck - The common ancestor deck
   * @param sourceDeck - The source branch deck
   * @param targetDeck - The target branch deck
   * @returns DeckDiff object containing conflicts
   */
  detectConflicts(baseDeck: Deck, sourceDeck: Deck, targetDeck: Deck): DeckDiff {
    const conflicts: DeckDiff = {
      added: [],
      removed: [],
      modified: [],
      specialSlots: {},
    };

    // Calculate diffs from base to each branch
    const sourceDiff = this.calculateDiff(baseDeck, sourceDeck);
    const targetDiff = this.calculateDiff(baseDeck, targetDeck);

    // Create maps for efficient conflict detection
    const sourceChangedIds = new Set<string>();
    const targetChangedIds = new Set<string>();

    // Track all changed card IDs in source
    sourceDiff.added.forEach(card => sourceChangedIds.add(card.id));
    sourceDiff.removed.forEach(card => sourceChangedIds.add(card.id));
    sourceDiff.modified.forEach(mod => sourceChangedIds.add(mod.card.id));

    // Track all changed card IDs in target
    targetDiff.added.forEach(card => targetChangedIds.add(card.id));
    targetDiff.removed.forEach(card => targetChangedIds.add(card.id));
    targetDiff.modified.forEach(mod => targetChangedIds.add(mod.card.id));

    // Find cards that were modified in both branches
    const conflictingIds = new Set<string>();
    sourceChangedIds.forEach(id => {
      if (targetChangedIds.has(id)) {
        conflictingIds.add(id);
      }
    });

    // Build conflict diff for cards changed in both branches
    const sourceCardsMap = new Map<string, DeckCard>();
    const targetCardsMap = new Map<string, DeckCard>();
    
    sourceDeck.cards.forEach(card => sourceCardsMap.set(card.id, card));
    targetDeck.cards.forEach(card => targetCardsMap.set(card.id, card));

    conflictingIds.forEach(id => {
      const sourceCard = sourceCardsMap.get(id);
      const targetCard = targetCardsMap.get(id);

      if (sourceCard && targetCard) {
        // Both branches have the card but with different counts
        if (sourceCard.count !== targetCard.count) {
          conflicts.modified.push({
            card: sourceCard,
            oldCount: targetCard.count,
            newCount: sourceCard.count,
          });
        }
      } else if (sourceCard && !targetCard) {
        // Source added/kept, target removed
        conflicts.added.push(sourceCard);
      } else if (!sourceCard && targetCard) {
        // Source removed, target added/kept
        conflicts.removed.push(targetCard);
      }
    });

    // Check for special slot conflicts
    this.checkSpecialSlotConflict(
      baseDeck.commander,
      sourceDeck.commander,
      targetDeck.commander,
      conflicts,
      'commander'
    );
    this.checkSpecialSlotConflict(
      baseDeck.legend,
      sourceDeck.legend,
      targetDeck.legend,
      conflicts,
      'legend'
    );
    this.checkSpecialSlotConflict(
      baseDeck.battlefield,
      sourceDeck.battlefield,
      targetDeck.battlefield,
      conflicts,
      'battlefield'
    );

    return conflicts;
  }

  /**
   * Helper method to check if a special slot has conflicting changes
   */
  private checkSpecialSlotConflict(
    baseCard: DeckCard | undefined,
    sourceCard: DeckCard | undefined,
    targetCard: DeckCard | undefined,
    conflicts: DeckDiff,
    slotName: 'commander' | 'legend' | 'battlefield'
  ): void {
    const baseSlot = baseCard || null;
    const sourceSlot = sourceCard || null;
    const targetSlot = targetCard || null;

    // Check if both branches changed the slot differently
    const sourceChanged = baseSlot?.id !== sourceSlot?.id;
    const targetChanged = baseSlot?.id !== targetSlot?.id;

    if (sourceChanged && targetChanged && sourceSlot?.id !== targetSlot?.id) {
      // Both branches changed the slot to different cards - conflict!
      conflicts.specialSlots[slotName] = {
        old: targetSlot,
        new: sourceSlot,
      };
    }
  }

  /**
   * Apply a diff to a deck
   * @param deck - The deck to apply changes to
   * @param diff - The diff to apply
   * @returns A new deck with the diff applied
   */
  applyDiff(deck: Deck, diff: DeckDiff): Deck {
    // Create a deep copy of the deck
    const newDeck: Deck = JSON.parse(JSON.stringify(deck));

    // Create a map of current cards for efficient lookup
    const cardsMap = new Map<string, DeckCard>();
    newDeck.cards.forEach(card => cardsMap.set(card.id, card));

    // Apply removals
    diff.removed.forEach(card => {
      cardsMap.delete(card.id);
    });

    // Apply additions
    diff.added.forEach(card => {
      cardsMap.set(card.id, { ...card });
    });

    // Apply modifications
    diff.modified.forEach(mod => {
      const existingCard = cardsMap.get(mod.card.id);
      if (existingCard) {
        existingCard.count = mod.newCount;
      } else {
        // Card doesn't exist, add it with new count
        cardsMap.set(mod.card.id, { ...mod.card, count: mod.newCount });
      }
    });

    // Update the cards array
    newDeck.cards = Array.from(cardsMap.values());

    // Apply special slot changes
    if (diff.specialSlots.commander) {
      newDeck.commander = diff.specialSlots.commander.new || undefined;
    }
    if (diff.specialSlots.legend) {
      newDeck.legend = diff.specialSlots.legend.new || undefined;
    }
    if (diff.specialSlots.battlefield) {
      newDeck.battlefield = diff.specialSlots.battlefield.new || undefined;
    }

    return newDeck;
  }

  /**
   * Generate human-readable summary of changes
   * @param diff - The diff to summarize
   * @returns A human-readable string describing the changes
   */
  summarizeChanges(diff: DeckDiff): string {
    const parts: string[] = [];

    // Summarize card changes
    if (diff.added.length > 0) {
      const totalAdded = diff.added.reduce((sum, card) => sum + card.count, 0);
      parts.push(`Added ${totalAdded} card${totalAdded !== 1 ? 's' : ''}`);
    }

    if (diff.removed.length > 0) {
      const totalRemoved = diff.removed.reduce((sum, card) => sum + card.count, 0);
      parts.push(`Removed ${totalRemoved} card${totalRemoved !== 1 ? 's' : ''}`);
    }

    if (diff.modified.length > 0) {
      parts.push(`Modified ${diff.modified.length} card${diff.modified.length !== 1 ? 's' : ''}`);
    }

    // Summarize special slot changes
    const specialSlotChanges: string[] = [];
    
    if (diff.specialSlots.commander) {
      const { old, new: newCard } = diff.specialSlots.commander;
      if (!old && newCard) {
        specialSlotChanges.push(`Set commander to ${newCard.name || newCard.id}`);
      } else if (old && !newCard) {
        specialSlotChanges.push('Removed commander');
      } else if (old && newCard) {
        specialSlotChanges.push(`Changed commander from ${old.name || old.id} to ${newCard.name || newCard.id}`);
      }
    }

    if (diff.specialSlots.legend) {
      const { old, new: newCard } = diff.specialSlots.legend;
      if (!old && newCard) {
        specialSlotChanges.push(`Set legend to ${newCard.name || newCard.id}`);
      } else if (old && !newCard) {
        specialSlotChanges.push('Removed legend');
      } else if (old && newCard) {
        specialSlotChanges.push(`Changed legend from ${old.name || old.id} to ${newCard.name || newCard.id}`);
      }
    }

    if (diff.specialSlots.battlefield) {
      const { old, new: newCard } = diff.specialSlots.battlefield;
      if (!old && newCard) {
        specialSlotChanges.push(`Set battlefield to ${newCard.name || newCard.id}`);
      } else if (old && !newCard) {
        specialSlotChanges.push('Removed battlefield');
      } else if (old && newCard) {
        specialSlotChanges.push(`Changed battlefield from ${old.name || old.id} to ${newCard.name || newCard.id}`);
      }
    }

    if (specialSlotChanges.length > 0) {
      parts.push(...specialSlotChanges);
    }

    // Return summary or default message
    if (parts.length === 0) {
      return 'No changes';
    }

    return parts.join(', ');
  }

  /**
   * Cleanup Web Worker resources
   */
  cleanup(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

export const deckDiffService = new DeckDiffService();
