import { useState, useCallback } from 'react';
import { giteaService } from '../services/gitea';
import { deckDiffService } from '../services/deckDiff';
import type { Deck } from '../types/deck';
import type { DeckDiff } from '../types/versioning';

interface UseDeckDiffOptions {
  owner: string;
  repo: string;
  deckPath?: string;
}

interface UseDeckDiffResult {
  diff: DeckDiff | null;
  oldDeck: Deck | null;
  newDeck: Deck | null;
  isLoading: boolean;
  error: Error | null;
  calculateDiff: (oldSha: string, newSha: string) => Promise<void>;
  calculateDiffWithCurrent: (sha: string, currentDeck: Deck) => Promise<void>;
  reset: () => void;
}

/**
 * Hook to calculate diff between two deck versions
 * Based on Requirement 3.1
 */
export function useDeckDiff({
  owner,
  repo,
  deckPath = 'deck.json',
}: UseDeckDiffOptions): UseDeckDiffResult {
  const [diff, setDiff] = useState<DeckDiff | null>(null);
  const [oldDeck, setOldDeck] = useState<Deck | null>(null);
  const [newDeck, setNewDeck] = useState<Deck | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Calculate diff between two commits
   */
  const calculateDiff = useCallback(
    async (oldSha: string, newSha: string) => {
      setIsLoading(true);
      setError(null);
      setDiff(null);
      setOldDeck(null);
      setNewDeck(null);

      try {
        // Load both deck versions from Gitea
        const [oldDeckData, newDeckData] = await Promise.all([
          giteaService.getDeckAtCommit(owner, repo, oldSha, deckPath),
          giteaService.getDeckAtCommit(owner, repo, newSha, deckPath),
        ]);

        // Calculate differences using DeckDiffService (async for large decks)
        const calculatedDiff = await deckDiffService.calculateDiffAsync(oldDeckData, newDeckData);

        setOldDeck(oldDeckData);
        setNewDeck(newDeckData);
        setDiff(calculatedDiff);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to calculate diff');
        setError(error);
        console.error('Failed to calculate diff:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [owner, repo, deckPath]
  );

  /**
   * Calculate diff between a commit and the current deck state
   */
  const calculateDiffWithCurrent = useCallback(
    async (sha: string, currentDeck: Deck) => {
      setIsLoading(true);
      setError(null);
      setDiff(null);
      setOldDeck(null);
      setNewDeck(null);

      try {
        // Load the historical deck version from Gitea
        const historicalDeck = await giteaService.getDeckAtCommit(owner, repo, sha, deckPath);

        // Calculate differences using DeckDiffService (async for large decks)
        const calculatedDiff = await deckDiffService.calculateDiffAsync(historicalDeck, currentDeck);

        setOldDeck(historicalDeck);
        setNewDeck(currentDeck);
        setDiff(calculatedDiff);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to calculate diff');
        setError(error);
        console.error('Failed to calculate diff:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [owner, repo, deckPath]
  );

  /**
   * Reset the diff state
   */
  const reset = useCallback(() => {
    setDiff(null);
    setOldDeck(null);
    setNewDeck(null);
    setError(null);
  }, []);

  return {
    diff,
    oldDeck,
    newDeck,
    isLoading,
    error,
    calculateDiff,
    calculateDiffWithCurrent,
    reset,
  };
}
