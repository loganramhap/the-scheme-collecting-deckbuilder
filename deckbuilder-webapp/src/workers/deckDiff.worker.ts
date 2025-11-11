/**
 * Web Worker for calculating deck diffs on large decks
 * This offloads expensive diff calculations to a background thread
 */

import type { Deck, DeckCard } from '../types/deck';
import type { DeckDiff } from '../types/versioning';

// Message types
interface DiffRequest {
  type: 'calculateDiff';
  oldDeck: Deck;
  newDeck: Deck;
}

interface DiffResponse {
  type: 'diffResult';
  diff: DeckDiff;
}

interface ErrorResponse {
  type: 'error';
  error: string;
}

type WorkerMessage = DiffRequest;
type WorkerResponse = DiffResponse | ErrorResponse;

/**
 * Calculate differences between two decks
 * (Duplicated from deckDiff.ts to run in worker context)
 */
function calculateDiff(oldDeck: Deck, newDeck: Deck): DeckDiff {
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
  checkSpecialSlot(oldDeck.commander, newDeck.commander, diff, 'commander');
  checkSpecialSlot(oldDeck.legend, newDeck.legend, diff, 'legend');
  checkSpecialSlot(oldDeck.battlefield, newDeck.battlefield, diff, 'battlefield');

  return diff;
}

/**
 * Helper method to check if a special slot has changed
 */
function checkSpecialSlot(
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

// Listen for messages from the main thread
self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;

  try {
    if (message.type === 'calculateDiff') {
      const diff = calculateDiff(message.oldDeck, message.newDeck);
      
      const response: DiffResponse = {
        type: 'diffResult',
        diff,
      };
      
      self.postMessage(response);
    }
  } catch (error) {
    const errorResponse: ErrorResponse = {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error in worker',
    };
    
    self.postMessage(errorResponse);
  }
});

// Export empty object to make TypeScript happy
export {};
