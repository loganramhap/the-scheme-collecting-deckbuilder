import React from 'react';
import { VersionTimeline } from './VersionTimeline';
import type { DeckCommit, DeckBranch } from '../../types/versioning';

/**
 * Example usage of VersionTimeline component
 */
export const VersionTimelineExample: React.FC = () => {
  // Mock commit data
  const mockCommits: DeckCommit[] = [
    {
      sha: 'abc123def456',
      message: 'Added powerful removal spells',
      author: {
        name: 'John Doe',
        email: 'john@example.com',
        date: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
      },
      committer: {
        name: 'John Doe',
        email: 'john@example.com',
        date: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
      parents: ['def456ghi789'],
      isAutoSave: false,
      changesSummary: {
        cardsAdded: 3,
        cardsRemoved: 2,
        cardsModified: 1,
      },
    },
    {
      sha: 'def456ghi789',
      message: 'Auto-save: Updated mana curve',
      author: {
        name: 'John Doe',
        email: 'john@example.com',
        date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      },
      committer: {
        name: 'John Doe',
        email: 'john@example.com',
        date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      },
      parents: ['ghi789jkl012'],
      isAutoSave: true,
      changesSummary: {
        cardsAdded: 1,
        cardsRemoved: 1,
        cardsModified: 0,
      },
    },
    {
      sha: 'ghi789jkl012',
      message: 'Merged feature/aggro-variant into main',
      author: {
        name: 'Jane Smith',
        email: 'jane@example.com',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      },
      committer: {
        name: 'Jane Smith',
        email: 'jane@example.com',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      },
      parents: ['jkl012mno345', 'xyz789abc123'], // Multiple parents = merge commit
      isAutoSave: false,
      changesSummary: {
        cardsAdded: 5,
        cardsRemoved: 3,
        cardsModified: 2,
      },
    },
    {
      sha: 'jkl012mno345',
      message: 'Testing new card: Lightning Bolt',
      author: {
        name: 'John Doe',
        email: 'john@example.com',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
      },
      committer: {
        name: 'John Doe',
        email: 'john@example.com',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      },
      parents: ['mno345pqr678'],
      isAutoSave: false,
      changesSummary: {
        cardsAdded: 1,
        cardsRemoved: 0,
        cardsModified: 0,
      },
    },
    {
      sha: 'mno345pqr678',
      message: 'Initial deck creation',
      author: {
        name: 'John Doe',
        email: 'john@example.com',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days ago
      },
      committer: {
        name: 'John Doe',
        email: 'john@example.com',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
      },
      parents: [],
      isAutoSave: false,
      changesSummary: {
        cardsAdded: 60,
        cardsRemoved: 0,
        cardsModified: 0,
      },
    },
  ];

  const mockBranches: DeckBranch[] = [
    {
      name: 'main',
      commit: {
        sha: 'abc123def456',
        message: 'Added powerful removal spells',
        date: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
      protected: true,
    },
    {
      name: 'feature/aggro-variant',
      commit: {
        sha: 'xyz789abc123',
        message: 'Aggressive creature package',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      },
      protected: false,
    },
  ];

  const handleSelectCommit = (sha: string) => {
    console.log('Selected commit:', sha);
    alert(`Selected commit: ${sha.substring(0, 7)}`);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem' }}>VersionTimeline Component Examples</h1>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Basic Timeline</h2>
        <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
          Displays commit history with nodes and connecting lines. Hover over nodes to see details.
        </p>
        <VersionTimeline
          commits={mockCommits}
          branches={mockBranches}
          onSelectCommit={handleSelectCommit}
        />
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Timeline with Current Commit Highlighted</h2>
        <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
          The current commit is highlighted with a ring around the node.
        </p>
        <VersionTimeline
          commits={mockCommits}
          branches={mockBranches}
          currentCommit="def456ghi789"
          onSelectCommit={handleSelectCommit}
        />
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Empty Timeline</h2>
        <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
          Shows a message when there are no commits.
        </p>
        <VersionTimeline
          commits={[]}
          onSelectCommit={handleSelectCommit}
        />
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Features</h2>
        <ul style={{ color: '#6b7280', lineHeight: '1.8' }}>
          <li>✓ SVG-based timeline visualization</li>
          <li>✓ Nodes for each commit with branch-specific colors</li>
          <li>✓ Lines connecting commits</li>
          <li>✓ Branch divergence visualization</li>
          <li>✓ Special diamond icon for merge commits</li>
          <li>✓ Hover tooltips showing commit details</li>
          <li>✓ Click handler to navigate to version</li>
          <li>✓ Current commit highlighting with ring</li>
          <li>✓ Auto-save badge in tooltips</li>
          <li>✓ Change statistics display</li>
        </ul>
      </section>
    </div>
  );
};
