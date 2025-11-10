import { useEffect, useRef, useCallback, useState } from 'react';
import { giteaService } from '../services/gitea';
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
  triggerSave: (customMessage?: string) => Promise<void>;
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
 * @param options - Configuration options
 */
export function useAutoSave(
  deck: Deck | null,
  isDirty: boolean,
  owner: string | undefined,
  repo: string | undefined,
  path: string | undefined,
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

  /**
   * Performs the actual save operation to Gitea
   */
  const performSave = useCallback(
    async (customMessage?: string) => {
      if (!deck || !owner || !repo || !path) {
        return;
      }

      setStatus((prev) => ({ ...prev, isSaving: true, error: null }));

      try {
        const content = JSON.stringify(deck, null, 2);
        
        // Generate auto-save message if not provided
        const message = customMessage || generateAutoSaveMessage(deck);

        await giteaService.createOrUpdateFile(
          owner,
          repo,
          path,
          content,
          message
        );

        setStatus({
          isSaving: false,
          lastSaved: new Date(),
          error: null,
        });

        // Update last saved deck reference
        lastDeckRef.current = content;

        onSaveSuccess?.();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setStatus((prev) => ({
          ...prev,
          isSaving: false,
          error: errorMessage,
        }));

        onSaveError?.(error instanceof Error ? error : new Error(errorMessage));
      }
    },
    [deck, owner, repo, path, onSaveSuccess, onSaveError]
  );

  /**
   * Triggers an immediate save, bypassing the debounce timer
   */
  const triggerSave = useCallback(
    async (customMessage?: string) => {
      // Clear any pending auto-save
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }

      await performSave(customMessage);
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

    // Set new timer
    saveTimerRef.current = setTimeout(() => {
      performSave();
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
 * Generates a descriptive auto-save commit message based on deck changes
 */
function generateAutoSaveMessage(deck: Deck): string {
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
