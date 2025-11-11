import React, { useState } from 'react';
import { MergePreviewDialog } from './MergePreviewDialog';
import type { DeckDiff } from '../../types/versioning';

/**
 * Example usage of MergePreviewDialog component
 */
export const MergePreviewDialogExample: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Example diff with changes
  const exampleDiff: DeckDiff = {
    added: [
      {
        id: 'card-1',
        name: 'Lightning Bolt',
        count: 4,
        image_url: 'https://example.com/lightning-bolt.jpg',
      },
      {
        id: 'card-2',
        name: 'Counterspell',
        count: 2,
        image_url: 'https://example.com/counterspell.jpg',
      },
    ],
    removed: [
      {
        id: 'card-3',
        name: 'Cancel',
        count: 2,
        image_url: 'https://example.com/cancel.jpg',
      },
    ],
    modified: [
      {
        card: {
          id: 'card-4',
          name: 'Island',
          count: 20,
          image_url: 'https://example.com/island.jpg',
        },
        oldCount: 18,
        newCount: 20,
      },
    ],
    specialSlots: {},
  };

  // Example diff with conflicts
  const conflictDiff: DeckDiff = {
    added: [
      {
        id: 'card-5',
        name: 'Shock',
        count: 4,
        image_url: 'https://example.com/shock.jpg',
      },
    ],
    removed: [],
    modified: [
      {
        card: {
          id: 'card-6',
          name: 'Mountain',
          count: 22,
          image_url: 'https://example.com/mountain.jpg',
        },
        oldCount: 20,
        newCount: 22,
      },
    ],
    specialSlots: {
      commander: {
        old: {
          id: 'commander-1',
          name: 'Krenko, Mob Boss',
          count: 1,
          image_url: 'https://example.com/krenko.jpg',
        },
        new: {
          id: 'commander-2',
          name: 'Purphoros, God of the Forge',
          count: 1,
          image_url: 'https://example.com/purphoros.jpg',
        },
      },
    },
  };

  const handleConfirm = async (message: string) => {
    console.log('Merge confirmed with message:', message);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsOpen(false);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Merge Preview Dialog Examples</h1>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <button
          onClick={() => setIsOpen(true)}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Show Merge Preview (No Conflicts)
        </button>
      </div>

      <MergePreviewDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleConfirm}
        sourceBranch="feature/new-cards"
        targetBranch="main"
        diff={exampleDiff}
        hasConflicts={false}
      />

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem' }}>
        <h2>Usage</h2>
        <pre style={{ fontSize: '0.875rem', overflow: 'auto' }}>
{`import { MergePreviewDialog } from './MergePreviewDialog';

<MergePreviewDialog
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onConfirm={async (message) => {
    // Perform merge with the provided message
    await mergeBranches(message);
  }}
  sourceBranch="feature/new-cards"
  targetBranch="main"
  diff={calculatedDiff}
  hasConflicts={false}
/>`}
        </pre>
      </div>
    </div>
  );
};
