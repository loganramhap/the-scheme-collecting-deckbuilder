import React, { useState } from 'react';
import { BranchCreationModal } from './BranchCreationModal';

/**
 * Example usage of BranchCreationModal component
 */
export const BranchCreationModalExample: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createdBranches, setCreatedBranches] = useState<string[]>([
    'main',
    'feature/aggro-variant',
    'feature/budget-version',
  ]);
  const [currentBranch] = useState('main');

  const handleCreateBranch = async (branchName: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Simulate random failure (20% chance)
    if (Math.random() < 0.2) {
      throw new Error('Failed to create branch: Network error');
    }

    // Add to created branches
    setCreatedBranches([...createdBranches, branchName]);
    
    // Close modal
    setIsModalOpen(false);
    
    console.log('Branch created:', branchName);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Branch Creation Modal Example</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <h2>Current Branch: {currentBranch}</h2>
        <h3>Existing Branches:</h3>
        <ul>
          {createdBranches.map((branch) => (
            <li key={branch}>{branch}</li>
          ))}
        </ul>
      </div>

      <button
        onClick={() => setIsModalOpen(true)}
        style={{
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '0.375rem',
          cursor: 'pointer',
        }}
      >
        Create New Branch
      </button>

      <BranchCreationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateBranch={handleCreateBranch}
        existingBranches={createdBranches}
        currentBranch={currentBranch}
      />

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem' }}>
        <h3>Try these branch names:</h3>
        <ul>
          <li><strong>Valid:</strong> feature/new-cards, aggro-variant, budget-version-2</li>
          <li><strong>Invalid (spaces):</strong> my branch name</li>
          <li><strong>Invalid (special chars):</strong> feature@test, branch:name</li>
          <li><strong>Invalid (duplicate):</strong> main, feature/aggro-variant</li>
          <li><strong>Invalid (starts with dot):</strong> .hidden-branch</li>
          <li><strong>Invalid (consecutive dots):</strong> feature..test</li>
        </ul>
      </div>
    </div>
  );
};
