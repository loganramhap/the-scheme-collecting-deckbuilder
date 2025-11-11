import React, { useState } from 'react';
import { BranchSelector } from './BranchSelector';

/**
 * Example usage of BranchSelector component
 * 
 * This example demonstrates:
 * - Basic branch selector integration
 * - Handling branch switching
 * - Managing unsaved changes warning
 * - Creating new branches
 */
export const BranchSelectorExample: React.FC = () => {
  const [currentBranch, setCurrentBranch] = useState('main');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Repository info (would come from props or context in real app)
  const owner = 'example-user';
  const repo = 'my-deck';

  /**
   * Handle branch switching
   * This would typically load the deck from the new branch
   */
  const handleBranchSwitch = async (branchName: string) => {
    console.log(`Switching to branch: ${branchName}`);
    
    // Simulate loading deck from new branch
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update current branch
    setCurrentBranch(branchName);
    
    // Clear unsaved changes flag
    setHasUnsavedChanges(false);
    
    // In a real app, you would load the deck from the new branch:
    // const newDeck = await versionControlService.switchBranch(owner, repo, branchName);
    // setDeck(newDeck);
    
    console.log(`Successfully switched to ${branchName}`);
  };

  /**
   * Handle create new branch
   * This would typically open a modal to get the branch name
   */
  const handleCreateBranch = () => {
    console.log('Opening create branch dialog...');
    
    // In a real app, you would open a modal here:
    // setIsCreateBranchModalOpen(true);
    
    alert('Create branch modal would open here');
  };

  /**
   * Simulate making changes to the deck
   */
  const handleMakeChanges = () => {
    setHasUnsavedChanges(true);
    console.log('Deck modified - unsaved changes flag set');
  };

  /**
   * Simulate saving changes
   */
  const handleSave = () => {
    setHasUnsavedChanges(false);
    console.log('Changes saved - unsaved changes flag cleared');
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>BranchSelector Example</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <h2>Current State</h2>
        <p>
          <strong>Current Branch:</strong> {currentBranch}
        </p>
        <p>
          <strong>Unsaved Changes:</strong> {hasUnsavedChanges ? 'Yes' : 'No'}
        </p>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2>Branch Selector</h2>
        <BranchSelector
          owner={owner}
          repo={repo}
          currentBranch={currentBranch}
          onSwitch={handleBranchSwitch}
          onCreateBranch={handleCreateBranch}
          hasUnsavedChanges={hasUnsavedChanges}
        />
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2>Actions</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={handleMakeChanges}
            disabled={hasUnsavedChanges}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: hasUnsavedChanges ? '#d1d5db' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: hasUnsavedChanges ? 'not-allowed' : 'pointer',
            }}
          >
            Make Changes
          </button>
          
          <button
            onClick={handleSave}
            disabled={!hasUnsavedChanges}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: !hasUnsavedChanges ? '#d1d5db' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: !hasUnsavedChanges ? 'not-allowed' : 'pointer',
            }}
          >
            Save Changes
          </button>
        </div>
      </div>

      <div>
        <h2>Usage Notes</h2>
        <ul>
          <li>Click the branch selector to see available branches</li>
          <li>Current branch is highlighted with a "Current" badge</li>
          <li>Main/master branches have a 🏠 icon, feature branches have a 🌿 icon</li>
          <li>Click "Create new branch" to create a new branch</li>
          <li>If you have unsaved changes, you'll see a confirmation dialog when switching</li>
          <li>Try making changes and then switching branches to see the warning</li>
        </ul>
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem' }}>
        <h3>Integration Example</h3>
        <pre style={{ fontSize: '0.875rem', overflow: 'auto' }}>
{`import { BranchSelector } from './components/versioning/BranchSelector';

function DeckEditor() {
  const [currentBranch, setCurrentBranch] = useState('main');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleBranchSwitch = async (branchName: string) => {
    // Load deck from new branch
    const newDeck = await versionControlService.switchBranch(
      owner,
      repo,
      branchName
    );
    setDeck(newDeck);
    setCurrentBranch(branchName);
    setHasUnsavedChanges(false);
  };

  const handleCreateBranch = () => {
    setIsCreateBranchModalOpen(true);
  };

  return (
    <div className="deck-editor-header">
      <BranchSelector
        owner={owner}
        repo={repo}
        currentBranch={currentBranch}
        onSwitch={handleBranchSwitch}
        onCreateBranch={handleCreateBranch}
        hasUnsavedChanges={hasUnsavedChanges}
      />
    </div>
  );
}`}
        </pre>
      </div>
    </div>
  );
};
