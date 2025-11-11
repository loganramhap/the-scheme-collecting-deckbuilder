import React, { useState } from 'react';
import { HistoryPanel } from './HistoryPanel';

/**
 * Example usage of the HistoryPanel component
 * 
 * This demonstrates how to integrate the history panel into a deck editor
 */
export function HistoryPanelExample() {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const handleCompare = (sha1: string, sha2: string) => {
    console.log('Compare commits:', sha1, sha2);
    // Open DiffViewer modal with these two commits
  };

  const handleRestore = (deck: any, commit: any) => {
    console.log('Restore commit:', commit.sha);
    console.log('Restored deck:', deck);
    // Load the restored deck into the editor
    // Mark deck as dirty so user can save
  };

  return (
    <div>
      {/* Deck editor content */}
      <div style={{ padding: '2rem' }}>
        <h1>Deck Editor</h1>
        
        {/* History button in header */}
        <button
          onClick={() => setIsHistoryOpen(true)}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
          }}
        >
          History
        </button>
      </div>

      {/* History panel */}
      <HistoryPanel
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        owner="username"
        repo="my-deck"
        branch="main"
        onCompare={handleCompare}
        onRestore={handleRestore}
      />
    </div>
  );
}
