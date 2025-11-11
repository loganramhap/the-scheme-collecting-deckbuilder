/**
 * Tests for Web Worker diff calculation
 * Note: These tests verify the worker can be instantiated and responds correctly
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Deck } from '../../types/deck';

describe('DeckDiff Web Worker', () => {
  let worker: Worker;

  beforeEach(() => {
    // Create worker instance
    worker = new Worker(
      new URL('../deckDiff.worker.ts', import.meta.url),
      { type: 'module' }
    );
  });

  afterEach(() => {
    // Clean up worker
    if (worker) {
      worker.terminate();
    }
  });

  it('should calculate diff for two decks', async () => {
    const oldDeck: Deck = {
      id: 'test-deck',
      name: 'Test Deck',
      game: 'riftbound',
      cards: [
        { id: 'card1', name: 'Card 1', count: 2 },
        { id: 'card2', name: 'Card 2', count: 1 },
      ],
    };

    const newDeck: Deck = {
      id: 'test-deck',
      name: 'Test Deck',
      game: 'riftbound',
      cards: [
        { id: 'card1', name: 'Card 1', count: 3 }, // Modified
        { id: 'card3', name: 'Card 3', count: 1 }, // Added
      ],
    };

    const result = await new Promise((resolve, reject) => {
      worker.addEventListener('message', (event) => {
        if (event.data.type === 'diffResult') {
          resolve(event.data.diff);
        } else if (event.data.type === 'error') {
          reject(new Error(event.data.error));
        }
      });

      worker.postMessage({
        type: 'calculateDiff',
        oldDeck,
        newDeck,
      });

      // Timeout after 5 seconds
      setTimeout(() => reject(new Error('Worker timeout')), 5000);
    });

    expect(result).toBeDefined();
    expect(result).toHaveProperty('added');
    expect(result).toHaveProperty('removed');
    expect(result).toHaveProperty('modified');
  });

  it('should handle empty decks', async () => {
    const oldDeck: Deck = {
      id: 'test-deck',
      name: 'Test Deck',
      game: 'riftbound',
      cards: [],
    };

    const newDeck: Deck = {
      id: 'test-deck',
      name: 'Test Deck',
      game: 'riftbound',
      cards: [],
    };

    const result = await new Promise((resolve, reject) => {
      worker.addEventListener('message', (event) => {
        if (event.data.type === 'diffResult') {
          resolve(event.data.diff);
        } else if (event.data.type === 'error') {
          reject(new Error(event.data.error));
        }
      });

      worker.postMessage({
        type: 'calculateDiff',
        oldDeck,
        newDeck,
      });

      setTimeout(() => reject(new Error('Worker timeout')), 5000);
    });

    expect(result).toBeDefined();
    expect(result).toHaveProperty('added');
    expect(result).toHaveProperty('removed');
    expect(result).toHaveProperty('modified');
  });
});
