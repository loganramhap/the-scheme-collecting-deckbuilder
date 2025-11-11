import { useRef, useCallback } from 'react';
import type { Deck } from '../types/deck';
import type { DeckDiff } from '../types/versioning';

// Threshold for using Web Worker (number of cards)
const LARGE_DECK_THRESHOLD = 100;

interface DiffResponse {
  type: 'diffResult';
  diff: DeckDiff;
}

interface ErrorResponse {
  type: 'error';
  error: string;
}

type WorkerResponse = DiffResponse | ErrorResponse;

/**
 * Hook to calculate diffs using Web Workers for large decks
 * Falls back to synchronous calculation for small decks
 */
export function useWebWorkerDiff() {
  const workerRef = useRef<Worker | null>(null);

  /**
   * Initialize worker if not already created
   */
  const getWorker = useCallback((): Worker => {
    if (!workerRef.current) {
      // Create worker from the worker file
      workerRef.current = new Worker(
        new URL('../workers/deckDiff.worker.ts', import.meta.url),
        { type: 'module' }
      );
    }
    return workerRef.current;
  }, []);

  /**
   * Calculate diff using Web Worker for large decks
   */
  const calculateDiffAsync = useCallback(
    (oldDeck: Deck, newDeck: Deck): Promise<DeckDiff> => {
      return new Promise((resolve, reject) => {
        const worker = getWorker();

        // Set up message handler
        const handleMessage = (event: MessageEvent<WorkerResponse>) => {
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

        // Send diff request to worker
        worker.postMessage({
          type: 'calculateDiff',
          oldDeck,
          newDeck,
        });

        // Set timeout to prevent hanging
        setTimeout(() => {
          worker.removeEventListener('message', handleMessage);
          reject(new Error('Worker timeout'));
        }, 30000); // 30 second timeout
      });
    },
    [getWorker]
  );

  /**
   * Determine if deck is large enough to warrant Web Worker
   */
  const isLargeDeck = useCallback((deck: Deck): boolean => {
    const totalCards = deck.cards.reduce((sum, card) => sum + card.count, 0);
    return totalCards >= LARGE_DECK_THRESHOLD;
  }, []);

  /**
   * Cleanup worker on unmount
   */
  const cleanup = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  }, []);

  return {
    calculateDiffAsync,
    isLargeDeck,
    cleanup,
  };
}
