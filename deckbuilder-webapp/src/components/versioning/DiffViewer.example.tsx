/**
 * Example usage of the DiffViewer component
 * 
 * This component displays a visual comparison between two deck versions,
 * showing added (green), removed (red), and modified (yellow) cards.
 */

import React, { useState } from 'react';
import { DiffViewer } from './DiffViewer';
import type { Deck } from '../../types/deck';
import type { DeckCommit } from '../../types/versioning';

export const DiffViewerExample: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Example old deck version
  const oldDeck: Deck = {
    game: 'mtg',
    format: 'commander',
    name: 'My Commander Deck',
    cards: [
      { id: 'card-1', count: 1, name: 'Lightning Bolt' },
      { id: 'card-2', count: 2, name: 'Counterspell' },
      { id: 'card-3', count: 1, name: 'Sol Ring' },
    ],
    commander: { id: 'commander-1', count: 1, name: 'Atraxa' },
    metadata: {
      author: 'player1',
      created: '2024-01-01T00:00:00Z',
    },
  };

  // Example new deck version
  const newDeck: Deck = {
    game: 'mtg',
    format: 'commander',
    name: 'My Commander Deck',
    cards: [
      { id: 'card-2', count: 3, name: 'Counterspell' }, // Modified count
      { id: 'card-3', count: 1, name: 'Sol Ring' },
      { id: 'card-4', count: 1, name: 'Mana Crypt' }, // Added
    ],
    commander: { id: 'commander-2', count: 1, name: 'Thrasios' }, // Changed
    metadata: {
      author: 'player1',
      created: '2024-01-01T00:00:00Z',
      updated: '2024-01-02T00:00:00Z',
    },
  };

  // Example commit info
  const oldCommit: DeckCommit = {
    sha: 'abc123def456',
    message: 'Initial deck build',
    author: {
      name: 'Player One',
      email: 'player1@example.com',
      date: '2024-01-01T00:00:00Z',
    },
    committer: {
      name: 'Player One',
      email: 'player1@example.com',
      date: '2024-01-01T00:00:00Z',
    },
    parents: [],
    isAutoSave: false,
  };

  const newCommit: DeckCommit = {
    sha: 'def456ghi789',
    message: 'Swapped commander and adjusted counterspells',
    author: {
      name: 'Player One',
      email: 'player1@example.com',
      date: '2024-01-02T00:00:00Z',
    },
    committer: {
      name: 'Player One',
      email: 'player1@example.com',
      date: '2024-01-02T00:00:00Z',
    },
    parents: ['abc123def456'],
    isAutoSave: false,
  };

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>
        Compare Versions
      </button>

      <DiffViewer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        oldDeck={oldDeck}
        newDeck={newDeck}
        oldCommit={oldCommit}
        newCommit={newCommit}
      />
    </div>
  );
};

/**
 * Usage in HistoryPanel:
 * 
 * const handleCompare = async (sha1: string, sha2: string) => {
 *   const [deck1, deck2] = await Promise.all([
 *     versionControlService.getDeckAtCommit(owner, repo, sha1),
 *     versionControlService.getDeckAtCommit(owner, repo, sha2),
 *   ]);
 *   
 *   const [commit1, commit2] = commits.filter(c => 
 *     c.sha === sha1 || c.sha === sha2
 *   );
 *   
 *   setDiffViewerState({
 *     isOpen: true,
 *     oldDeck: deck1,
 *     newDeck: deck2,
 *     oldCommit: commit1,
 *     newCommit: commit2,
 *   });
 * };
 */
