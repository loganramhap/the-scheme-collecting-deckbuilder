import React, { useState } from 'react';
import { MergeConflictResolver } from './MergeConflictResolver';
import type { Deck } from '../../types/deck';
import type { DeckDiff } from '../../types/versioning';

/**
 * Example usage of MergeConflictResolver component
 * 
 * This demonstrates how to use the merge conflict resolver when merging branches
 */
export const MergeConflictResolverExample: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Example source deck (feature branch)
  const sourceDeck: Deck = {
    game: 'riftbound',
    format: 'standard',
    name: 'My Feature Deck',
    cards: [
      { id: 'card-1', count: 3, name: 'Fire Bolt', image_url: '/images/fire-bolt.jpg' },
      { id: 'card-2', count: 2, name: 'Ice Shield', image_url: '/images/ice-shield.jpg' },
      { id: 'card-3', count: 4, name: 'Lightning Strike', image_url: '/images/lightning.jpg' },
    ],
    legend: {
      id: 'legend-1',
      count: 1,
      name: 'Pyromancer',
      image_url: '/images/pyromancer.jpg',
    },
    metadata: {
      author: 'player1',
      created: '2024-01-01T00:00:00Z',
    },
  };

  // Example target deck (main branch)
  const targetDeck: Deck = {
    game: 'riftbound',
    format: 'standard',
    name: 'My Main Deck',
    cards: [
      { id: 'card-1', count: 2, name: 'Fire Bolt', image_url: '/images/fire-bolt.jpg' },
      { id: 'card-2', count: 3, name: 'Ice Shield', image_url: '/images/ice-shield.jpg' },
      { id: 'card-4', count: 2, name: 'Earth Wall', image_url: '/images/earth-wall.jpg' },
    ],
    legend: {
      id: 'legend-2',
      count: 1,
      name: 'Elementalist',
      image_url: '/images/elementalist.jpg',
    },
    metadata: {
      author: 'player1',
      created: '2024-01-01T00:00:00Z',
    },
  };

  // Example conflicts detected between the two decks
  const conflicts: DeckDiff = {
    added: [
      // card-3 exists in source but not in target
      { id: 'card-3', count: 4, name: 'Lightning Strike', image_url: '/images/lightning.jpg' },
    ],
    removed: [
      // card-4 exists in target but not in source
      { id: 'card-4', count: 2, name: 'Earth Wall', image_url: '/images/earth-wall.jpg' },
    ],
    modified: [
      // card-1 has different counts in both branches
      {
        card: { id: 'card-1', count: 3, name: 'Fire Bolt', image_url: '/images/fire-bolt.jpg' },
        oldCount: 2, // target count
        newCount: 3, // source count
      },
      // card-2 has different counts in both branches
      {
        card: { id: 'card-2', count: 2, name: 'Ice Shield', image_url: '/images/ice-shield.jpg' },
        oldCount: 3, // target count
        newCount: 2, // source count
      },
    ],
    specialSlots: {
      // Legend changed in both branches
      legend: {
        old: { id: 'legend-2', count: 1, name: 'Elementalist', image_url: '/images/elementalist.jpg' },
        new: { id: 'legend-1', count: 1, name: 'Pyromancer', image_url: '/images/pyromancer.jpg' },
      },
    },
  };

  const handleResolve = async (resolvedDeck: Deck, mergeMessage: string) => {
    console.log('Merge resolved!');
    console.log('Resolved deck:', resolvedDeck);
    console.log('Merge message:', mergeMessage);
    
    // In a real implementation, you would:
    // 1. Save the resolved deck to the target branch
    // 2. Create a merge commit with the message
    // 3. Update the UI to reflect the merge
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsOpen(false);
    alert('Merge completed successfully!');
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Merge Conflict Resolver Example</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <h2>Scenario</h2>
        <p>
          You're merging a feature branch into main. Both branches have made changes to the same cards,
          resulting in conflicts that need to be resolved.
        </p>
        
        <h3>Conflicts:</h3>
        <ul>
          <li>Lightning Strike: Added in feature branch</li>
          <li>Earth Wall: Removed in feature branch (exists in main)</li>
          <li>Fire Bolt: Count changed (2 in main, 3 in feature)</li>
          <li>Ice Shield: Count changed (3 in main, 2 in feature)</li>
          <li>Legend: Changed from Elementalist to Pyromancer</li>
        </ul>
      </div>

      <button
        onClick={() => setIsOpen(true)}
        style={{
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          fontWeight: 600,
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '0.375rem',
          cursor: 'pointer',
        }}
      >
        Open Merge Conflict Resolver
      </button>

      <MergeConflictResolver
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        conflicts={conflicts}
        sourceBranch="feature/new-cards"
        targetBranch="main"
        sourceDeck={sourceDeck}
        targetDeck={targetDeck}
        onResolve={handleResolve}
      />

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem' }}>
        <h3>How to use:</h3>
        <ol>
          <li>Click the button above to open the conflict resolver</li>
          <li>Review each conflict and choose how to resolve it:
            <ul>
              <li><strong>Keep Source:</strong> Use the version from the feature branch</li>
              <li><strong>Keep Target:</strong> Use the version from the main branch</li>
              <li><strong>Keep Both:</strong> Include both versions (for added cards) or use the higher count (for modified cards)</li>
            </ul>
          </li>
          <li>Review the preview of the merged deck</li>
          <li>Check for any validation warnings or errors</li>
          <li>Enter a merge commit message</li>
          <li>Click "Complete Merge" to finalize</li>
        </ol>
      </div>
    </div>
  );
};

/**
 * Example of integrating MergeConflictResolver into a branch merge workflow
 */
export const BranchMergeWorkflowExample: React.FC = () => {
  const [showResolver, setShowResolver] = useState(false);
  const [conflicts, setConflicts] = useState<DeckDiff | null>(null);

  const handleMergeBranch = async (sourceBranch: string, targetBranch: string) => {
    // Step 1: Fetch both deck versions
    // const sourceDeck = await fetchDeck(sourceBranch);
    // const targetDeck = await fetchDeck(targetBranch);
    // const baseDeck = await fetchCommonAncestor(sourceBranch, targetBranch);

    // Step 2: Detect conflicts using deckDiffService
    // const detectedConflicts = deckDiffService.detectConflicts(baseDeck, sourceDeck, targetDeck);

    // Step 3: If conflicts exist, show resolver
    // if (hasConflicts(detectedConflicts)) {
    //   setConflicts(detectedConflicts);
    //   setShowResolver(true);
    // } else {
    //   // No conflicts, perform automatic merge
    //   await performAutoMerge(sourceDeck, targetDeck);
    // }

    console.log('Merge initiated:', sourceBranch, '→', targetBranch);
  };

  const handleResolveConflicts = async (resolvedDeck: Deck, mergeMessage: string) => {
    // Step 4: Save the resolved deck and create merge commit
    // await saveDeck(resolvedDeck, targetBranch);
    // await createMergeCommit(sourceBranch, targetBranch, mergeMessage);
    
    console.log('Conflicts resolved and merged');
    setShowResolver(false);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Branch Merge Workflow</h1>
      
      <button onClick={() => handleMergeBranch('feature/test', 'main')}>
        Merge feature/test into main
      </button>

      {conflicts && (
        <MergeConflictResolver
          isOpen={showResolver}
          onClose={() => setShowResolver(false)}
          conflicts={conflicts}
          sourceBranch="feature/test"
          targetBranch="main"
          sourceDeck={{} as Deck} // Replace with actual deck
          targetDeck={{} as Deck} // Replace with actual deck
          onResolve={handleResolveConflicts}
        />
      )}
    </div>
  );
};
