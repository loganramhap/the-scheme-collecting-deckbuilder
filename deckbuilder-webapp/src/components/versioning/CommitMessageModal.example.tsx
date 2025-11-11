/**
 * Example usage of CommitMessageModal component
 * 
 * This file demonstrates how to integrate the CommitMessageModal
 * into your deck editor save flow.
 */

import React, { useState } from 'react';
import { CommitMessageModal } from './CommitMessageModal';
import { deckDiffService } from '../../services/deckDiff';
import type { Deck } from '../../types/deck';
import type { DeckDiff } from '../../types/versioning';

// Example: Using CommitMessageModal in a save button
export function SaveButtonExample() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDeck, setCurrentDeck] = useState<Deck | null>(null);
  const [previousDeck, setPreviousDeck] = useState<Deck | null>(null);
  const [diff, setDiff] = useState<DeckDiff | null>(null);

  // Load recent messages from localStorage
  const recentMessages = JSON.parse(
    localStorage.getItem('deckbuilder:recentCommitMessages') || '[]'
  );

  const handleSaveClick = () => {
    // Calculate diff between current and previous deck state
    if (currentDeck && previousDeck) {
      const calculatedDiff = deckDiffService.calculateDiff(previousDeck, currentDeck);
      setDiff(calculatedDiff);
      
      // Generate suggested message from diff
      const suggestedMessage = deckDiffService.summarizeChanges(calculatedDiff);
      
      // Open modal (you can pass suggestedMessage as prop)
      setIsModalOpen(true);
    }
  };

  const handleCommit = async (message: string) => {
    try {
      // Save deck to Gitea with commit message
      // await giteaService.saveDeck(owner, repo, deckName, currentDeck, message);
      
      // Save message to recent messages
      const updatedRecent = [message, ...recentMessages.slice(0, 4)];
      localStorage.setItem(
        'deckbuilder:recentCommitMessages',
        JSON.stringify(updatedRecent)
      );
      
      // Close modal
      setIsModalOpen(false);
      
      // Show success notification
      console.log('Deck saved successfully!');
    } catch (error) {
      console.error('Failed to save deck:', error);
      throw error; // Modal will display error
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <button onClick={handleSaveClick}>
        Save Deck
      </button>

      <CommitMessageModal
        isOpen={isModalOpen}
        onClose={handleClose}
        onCommit={handleCommit}
        suggestedMessage={diff ? deckDiffService.summarizeChanges(diff) : undefined}
        diff={diff || undefined}
        recentMessages={recentMessages}
      />
    </>
  );
}

// Example: Using with auto-save
export function AutoSaveExample() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAutoSave = async (deck: Deck, previousDeck: Deck) => {
    // Calculate diff
    const diff = deckDiffService.calculateDiff(previousDeck, deck);
    
    // Generate auto-save message
    const autoSaveMessage = `Auto-save: ${deckDiffService.summarizeChanges(diff)}`;
    
    // Save directly without modal
    // await giteaService.saveDeck(owner, repo, deckName, deck, autoSaveMessage, true);
    
    console.log('Auto-saved with message:', autoSaveMessage);
  };

  return (
    <div>
      {/* Auto-save happens in background */}
      <p>Auto-save enabled</p>
    </div>
  );
}

// Example: Keyboard shortcut integration
export function KeyboardShortcutExample() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        setIsModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div>
      <p>Press Ctrl+S (or Cmd+S) to save</p>
      
      <CommitMessageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCommit={async (message) => {
          console.log('Saving with message:', message);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}
