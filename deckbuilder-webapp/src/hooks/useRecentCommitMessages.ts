import { useState, useEffect, useCallback } from 'react';
import {
  RECENT_MESSAGES_STORAGE_KEY,
  MAX_RECENT_MESSAGES,
} from '../constants/commitTemplates';

/**
 * Hook to manage recent commit messages in localStorage
 * Based on Requirement 9.5
 */
export function useRecentCommitMessages() {
  const [recentMessages, setRecentMessages] = useState<string[]>([]);

  // Load recent messages from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_MESSAGES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentMessages(parsed.slice(0, MAX_RECENT_MESSAGES));
        }
      }
    } catch (error) {
      console.error('Failed to load recent commit messages:', error);
    }
  }, []);

  /**
   * Add a new message to recent messages
   * Deduplicates and maintains max limit
   */
  const addRecentMessage = useCallback((message: string) => {
    const trimmed = message.trim();
    
    // Don't add empty messages or auto-save messages
    if (!trimmed || trimmed.startsWith('Auto-save:')) {
      return;
    }

    setRecentMessages((prev) => {
      // Remove duplicate if it exists
      const filtered = prev.filter((msg) => msg !== trimmed);
      
      // Add to front and limit to MAX_RECENT_MESSAGES
      const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_MESSAGES);
      
      // Save to localStorage
      try {
        localStorage.setItem(RECENT_MESSAGES_STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save recent commit messages:', error);
      }
      
      return updated;
    });
  }, []);

  /**
   * Clear all recent messages
   */
  const clearRecentMessages = useCallback(() => {
    setRecentMessages([]);
    try {
      localStorage.removeItem(RECENT_MESSAGES_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear recent commit messages:', error);
    }
  }, []);

  return {
    recentMessages,
    addRecentMessage,
    clearRecentMessages,
  };
}
