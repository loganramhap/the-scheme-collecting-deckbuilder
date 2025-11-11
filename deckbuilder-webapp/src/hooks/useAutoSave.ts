import { useEffect, useRef, useCallback, useState } from 'react';
import { versionControlService } from '../services/versionControl';
import type { Deck } from '../types/deck';

export interface AutoSaveStatus {
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
}

export interface UseAutoSaveOptions {
  enabled?: boolean;
  debounceMs?: number;
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
}

export interface UseAutoSaveReturn {
  status: AutoSaveStatus;
  triggerSave: (customMessage?: string) => Promise<string | undefined>;
  resetTimer: () => void;
}

/**
 * Hook for auto-saving deck changes to Gitea with debouncing
 * 
 * @param deck - Current deck state
 * @param isDirty - Whether deck has unsaved changes
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param path - File path in repository
 * @param branch - Branch name (defaults to 'main')
 * @param options - Configuration options
 */
export function useAutoSave(
  deck: Deck | null,
  isDirty: boolean,
  owner: string | undefined,
  repo: string | undefined,
  path: string | undefined,
  branch: string = 'main',
  options: UseAutoSaveOptions = {}
): UseAutoSaveReturn {
  const {
    enabled = true,
    debounceMs = 30000, // 30 seconds default
    onSaveSuccess,
    onSaveError,
  } = options;

  const [status, setStatus] = useState<AutoSaveStatus>({
    isSaving: false,
    lastSaved: null,
    error: null,
  });

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDeckRef = useRef<string | null>(null);
  const previousDeckRef = useRef<Deck | null>(null);

  /**
   * Performs the actual save operation to Gitea
   * @param customMessage - Optional custom commit message
   * @param isManualSave - Whether this is a manual save (not auto-save)
   * @returns The commit SHA if successful
   */
  const performSave = useCallback(
    async (customMessage?: string, isManualSave: boolean = false): Promise<string | undefined> => {
      if (!deck || !owner || !repo || !path) {
        return undefined;
      }

      setStatus((prev) => ({ ...prev, isSaving: true, error: null }));

      try {
        const content = JSON.stringify(deck, null, 2);
        
        // Generate commit message with change details
        let message: string;
        const isAutoSave = !isManualSave && !customMessage;
        
        if (customMessage) {
          // Use custom message provided by user
          message = customMessage;
        } else if (isAutoSave && previousDeckRef.current) {
          // Generate auto-save message with diff details (async for large decks)
          message = await versionControlService.generateAutoSaveMessageAsync(previousDeckRef.current, deck);
        } else {
          // Fallback to basic auto-save message
          message = generateBasicAutoSaveMessage(deck);
        }

        // Use versionControlService to commit with proper metadata
        const commit = await versionControlService.commitDeck(
          owner,
          repo,
          branch,
          deck,
          message,
          isAutoSave,
          path
        );

        setStatus({
          isSaving: false,
          lastSaved: new Date(),
          error: null,
        });

        // Update references for next save
        lastDeckRef.current = content;
        previousDeckRef.current = JSON.parse(content) as Deck;

        onSaveSuccess?.();
        
        return commit.sha;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setStatus((prev) => ({
          ...prev,
          isSaving: false,
          error: errorMessage,
        }));

        onSaveError?.(error instanceof Error ? error : new Error(errorMessage));
        return undefined;
      }
    },
    [deck, owner, repo, path, branch, onSaveSuccess, onSaveError]
  );

  /**
   * Triggers an immediate save, bypassing the debounce timer
   * @param customMessage - Optional custom commit message
   * @returns The commit SHA if successful
   */
  const triggerSave = useCallback(
    async (customMessage?: string): Promise<string | undefined> => {
      // Clear any pending auto-save
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }

      // Manual saves are marked as such (not auto-save)
      return await performSave(customMessage, true);
    },
    [performSave]
  );

  /**
   * Resets the auto-save timer
   */
  const resetTimer = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  }, []);

  /**
   * Initialize previous deck reference when deck is first loaded
   */
  useEffect(() => {
    if (deck && !previousDeckRef.current) {
      previousDeckRef.current = JSON.parse(JSON.stringify(deck)) as Deck;
    }
  }, [deck]);

  /**
   * Auto-save effect - triggers save after debounce period when deck is dirty
   */
  useEffect(() => {
    if (!enabled || !isDirty || !deck || !owner || !repo || !path) {
      return;
    }

    // Check if deck actually changed (avoid saving if just marked dirty without changes)
    const currentDeckStr = JSON.stringify(deck, null, 2);
    if (currentDeckStr === lastDeckRef.current) {
      return;
    }

    // Clear existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // Set new timer for auto-save
    saveTimerRef.current = setTimeout(() => {
      // Auto-save without custom message (isManualSave = false)
      performSave(undefined, false);
    }, debounceMs);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [enabled, isDirty, deck, owner, repo, path, debounceMs, performSave]);

  return {
    status,
    triggerSave,
    resetTimer,
  };
}

/**
 * Generates a basic auto-save commit message (fallback when no previous deck state)
 */
function generateBasicAutoSaveMessage(deck: Deck): string {
  const totalCards = deck.cards.reduce((sum, card) => sum + card.count, 0);
  const timestamp = new Date().toLocaleTimeString();
  
  let message = `Auto-save: ${deck.name}`;
  
  // Add specific details based on game type
  if (deck.game === 'riftbound') {
    if (deck.legend) {
      message += ` (Legend: ${deck.legend.name || deck.legend.id})`;
    }
  } else if (deck.game === 'mtg' && deck.commander) {
    message += ` (Commander: ${deck.commander.name || deck.commander.id})`;
  }
  
  message += ` - ${totalCards} cards - ${timestamp}`;
  
  return message;
}
