import React, { useState, useRef, useEffect } from 'react';
import { useBranches } from '../../hooks/useBranches';
import { BranchCreationModal } from './BranchCreationModal';
import { MergePreviewDialog } from './MergePreviewDialog';
import { MergeConflictResolver } from './MergeConflictResolver';
import { giteaService } from '../../services/gitea';
import { versionControlService } from '../../services/versionControl';
import { Spinner } from '../Spinner';
import { ErrorDisplay } from '../ErrorDisplay';
import type { Deck } from '../../types/deck';
import type { DeckDiff } from '../../types/versioning';

interface BranchSelectorProps {
  owner: string;
  repo: string;
  currentBranch: string;
  onSwitch: (branchName: string) => Promise<void>;
  onCreateBranch?: () => void;
  onMergeComplete?: (targetBranch: string, commitSha?: string) => Promise<void>;
  hasUnsavedChanges: boolean;
  showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

/**
 * Dropdown component for switching between branches
 * Based on Requirements 6.1, 6.2, 6.3
 */
export const BranchSelector: React.FC<BranchSelectorProps> = ({
  owner,
  repo,
  currentBranch,
  onSwitch,
  onCreateBranch,
  onMergeComplete,
  hasUnsavedChanges,
  showToast,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const [confirmBranch, setConfirmBranch] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMergePreview, setShowMergePreview] = useState(false);
  const [showConflictResolver, setShowConflictResolver] = useState(false);
  const [mergeData, setMergeData] = useState<{
    diff: DeckDiff;
    conflicts: DeckDiff | null;
    sourceDeck: Deck;
    targetDeck: Deck;
    targetBranch: string;
  } | null>(null);
  const [isMerging, setIsMerging] = useState(false);
  const [mergeError, setMergeError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { branches, isLoading, error, refresh } = useBranches({
    owner,
    repo,
    enabled: true,
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setConfirmBranch(null);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    setSwitchError(null);
  };

  const handleBranchClick = (branchName: string) => {
    // Don't switch if already on this branch
    if (branchName === currentBranch) {
      setIsOpen(false);
      return;
    }

    // Show confirmation if there are unsaved changes
    if (hasUnsavedChanges) {
      setConfirmBranch(branchName);
    } else {
      performSwitch(branchName);
    }
  };

  const performSwitch = async (branchName: string) => {
    setIsSwitching(true);
    setSwitchError(null);

    try {
      await onSwitch(branchName);
      setIsOpen(false);
      setConfirmBranch(null);
      
      // Refresh branch list after successful switch
      await refresh();
    } catch (error) {
      console.error('Failed to switch branch:', error);
      setSwitchError(error instanceof Error ? error.message : 'Failed to switch branch');
    } finally {
      setIsSwitching(false);
    }
  };

  const handleConfirmSwitch = () => {
    if (confirmBranch) {
      performSwitch(confirmBranch);
    }
  };

  const handleCancelSwitch = () => {
    setConfirmBranch(null);
  };

  const handleCreateBranch = () => {
    setIsOpen(false);
    if (onCreateBranch) {
      onCreateBranch();
    } else {
      setShowCreateModal(true);
    }
  };

  const handleCreateBranchSubmit = async (branchName: string) => {
    try {
      // Create branch in Gitea
      await giteaService.createBranchFromRef(owner, repo, branchName, currentBranch);
      
      // Refresh branch list
      await refresh();
      
      // Close modal
      setShowCreateModal(false);
      
      // Switch to the new branch
      await performSwitch(branchName);
    } catch (error) {
      // Error will be handled by the modal
      throw error;
    }
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
  };

  const handleMergeClick = async () => {
    if (isMainBranch(currentBranch)) {
      setSwitchError('Cannot merge from main branch');
      if (showToast) {
        showToast('Cannot merge from main branch', 'error');
      }
      return;
    }

    if (hasUnsavedChanges) {
      setSwitchError('Please save or discard changes before merging');
      if (showToast) {
        showToast('Please save or discard changes before merging', 'error');
      }
      return;
    }

    setIsOpen(false);
    setIsMerging(true);
    setMergeError(null);

    try {
      // Preview the merge
      const targetBranch = 'main'; // Always merge into main for now
      const preview = await versionControlService.previewMerge(
        owner,
        repo,
        currentBranch,
        targetBranch
      );

      setMergeData({
        diff: preview.diff,
        conflicts: preview.conflicts,
        sourceDeck: preview.sourceDeck,
        targetDeck: preview.targetDeck,
        targetBranch,
      });

      // Show appropriate dialog based on conflicts
      if (preview.conflicts) {
        setShowConflictResolver(true);
      } else {
        setShowMergePreview(true);
      }
    } catch (error) {
      console.error('Failed to preview merge:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to preview merge';
      setMergeError(errorMessage);
      
      // Show error notification
      if (showToast) {
        showToast(`Failed to preview merge: ${errorMessage}`, 'error');
      }
    } finally {
      setIsMerging(false);
    }
  };

  const handleMergeConfirm = async (message: string) => {
    if (!mergeData) return;

    setIsMerging(true);
    setMergeError(null);

    try {
      // Perform the merge
      const result = await versionControlService.mergeBranch(
        owner,
        repo,
        currentBranch,
        mergeData.targetBranch,
        message
      );

      if (result.conflicts) {
        // This shouldn't happen since we already checked, but handle it
        setShowMergePreview(false);
        setShowConflictResolver(true);
      } else {
        // Merge successful
        const commitSha = result.commit?.sha;
        const shortSha = commitSha ? commitSha.substring(0, 7) : '';
        
        setShowMergePreview(false);
        setMergeData(null);

        // Show success notification with commit SHA
        if (showToast && commitSha) {
          showToast(
            `Successfully merged ${currentBranch} into ${mergeData.targetBranch}. Commit: ${shortSha}`,
            'success'
          );
        } else if (showToast) {
          showToast(
            `Successfully merged ${currentBranch} into ${mergeData.targetBranch}`,
            'success'
          );
        }

        // Switch to target branch
        if (onMergeComplete) {
          await onMergeComplete(mergeData.targetBranch, commitSha);
        } else {
          await performSwitch(mergeData.targetBranch);
        }
      }
    } catch (error) {
      console.error('Failed to merge:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to merge branches';
      setMergeError(errorMessage);
      
      // Show error notification
      if (showToast) {
        showToast(`Merge failed: ${errorMessage}`, 'error');
      }
    } finally {
      setIsMerging(false);
    }
  };

  const handleConflictResolve = async (resolvedDeck: Deck, mergeMessage: string) => {
    if (!mergeData) return;

    setIsMerging(true);
    setMergeError(null);

    try {
      // Complete the merge with resolved deck
      const commit = await versionControlService.completeMerge(
        owner,
        repo,
        mergeData.targetBranch,
        resolvedDeck,
        mergeMessage
      );

      const commitSha = commit?.sha;
      const shortSha = commitSha ? commitSha.substring(0, 7) : '';

      // Close conflict resolver
      setShowConflictResolver(false);
      setMergeData(null);

      // Show success notification with commit SHA
      if (showToast && commitSha) {
        showToast(
          `Successfully merged ${currentBranch} into ${mergeData.targetBranch} (conflicts resolved). Commit: ${shortSha}`,
          'success'
        );
      } else if (showToast) {
        showToast(
          `Successfully merged ${currentBranch} into ${mergeData.targetBranch} (conflicts resolved)`,
          'success'
        );
      }

      // Switch to target branch
      if (onMergeComplete) {
        await onMergeComplete(mergeData.targetBranch, commitSha);
      } else {
        await performSwitch(mergeData.targetBranch);
      }
    } catch (error) {
      console.error('Failed to complete merge:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete merge';
      setMergeError(errorMessage);
      
      // Show error notification
      if (showToast) {
        showToast(`Merge failed: ${errorMessage}`, 'error');
      }
      
      throw error; // Re-throw so the conflict resolver can handle it
    } finally {
      setIsMerging(false);
    }
  };

  const handleCloseMergePreview = () => {
    if (!isMerging) {
      setShowMergePreview(false);
      setMergeData(null);
      setMergeError(null);
    }
  };

  const handleCloseConflictResolver = () => {
    if (!isMerging) {
      setShowConflictResolver(false);
      setMergeData(null);
      setMergeError(null);
    }
  };

  const isMainBranch = (branchName: string): boolean => {
    return branchName === 'main' || branchName === 'master';
  };

  const getBranchIcon = (branchName: string): string => {
    return isMainBranch(branchName) ? '🏠' : '🌿';
  };

  return (
    <div className="branch-selector" ref={dropdownRef}>
      {/* Dropdown trigger button */}
      <button
        className={`branch-selector-button ${isOpen ? 'open' : ''} ${isMainBranch(currentBranch) ? 'main-branch' : ''}`}
        onClick={toggleDropdown}
        disabled={isSwitching}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="branch-icon">{getBranchIcon(currentBranch)}</span>
        <span className="branch-name">{currentBranch}</span>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="branch-dropdown">
          {/* Loading state */}
          {isLoading && (
            <div className="dropdown-loading">
              <Spinner size="sm" />
              <span>Loading branches...</span>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="dropdown-error">
              <ErrorDisplay
                error={error}
                onRetry={refresh}
                context="Branches"
                compact
              />
            </div>
          )}

          {/* Branch list */}
          {!isLoading && !error && (
            <>
              <div className="dropdown-section">
                <div className="dropdown-section-title">Branches</div>
                
                {branches.length === 0 ? (
                  <div className="dropdown-empty">No branches found</div>
                ) : (
                  <div className="branch-list">
                    {branches.map((branch) => {
                      const isCurrent = branch.name === currentBranch;
                      const isMain = isMainBranch(branch.name);

                      return (
                        <button
                          key={branch.name}
                          className={`branch-item ${isCurrent ? 'current' : ''} ${isMain ? 'main' : ''}`}
                          onClick={() => handleBranchClick(branch.name)}
                          disabled={isSwitching}
                        >
                          <span className="branch-item-icon">
                            {getBranchIcon(branch.name)}
                          </span>
                          <span className="branch-item-name">{branch.name}</span>
                          {isCurrent && (
                            <span className="branch-item-badge">Current</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Merge option for feature branches */}
              {!isMainBranch(currentBranch) && (
                <>
                  <div className="dropdown-divider" />
                  <button
                    className="branch-merge-button"
                    onClick={handleMergeClick}
                    disabled={isSwitching || isMerging}
                  >
                    <span className="merge-icon">⤴</span>
                    <span>{isMerging ? 'Preparing merge...' : 'Merge into main'}</span>
                  </button>
                </>
              )}

              {/* Create new branch option */}
              <div className="dropdown-divider" />
              <button
                className="branch-create-button"
                onClick={handleCreateBranch}
                disabled={isSwitching}
              >
                <span className="create-icon">+</span>
                <span>Create new branch</span>
              </button>
            </>
          )}

          {/* Switch error notification */}
          {switchError && (
            <div className="error-notification">
              <ErrorDisplay
                error={switchError}
                onDismiss={() => setSwitchError(null)}
                context="Branch Switch"
                compact
              />
            </div>
          )}

          {/* Merge error notification */}
          {mergeError && (
            <div className="error-notification">
              <ErrorDisplay
                error={mergeError}
                onDismiss={() => setMergeError(null)}
                context="Merge"
                compact
              />
            </div>
          )}
        </div>
      )}

      {/* Confirmation dialog for unsaved changes */}
      {confirmBranch && (
        <>
          <div className="confirm-backdrop" onClick={handleCancelSwitch} />
          <div className="confirm-dialog">
            <div className="confirm-header">
              <h3>Unsaved Changes</h3>
            </div>
            
            <div className="confirm-content">
              <p>
                You have unsaved changes in the current branch. Switching branches
                will discard these changes.
              </p>
              <p className="confirm-warning">
                Are you sure you want to switch to <strong>{confirmBranch}</strong>?
              </p>
            </div>

            <div className="confirm-actions">
              <button
                className="btn btn-secondary"
                onClick={handleCancelSwitch}
                disabled={isSwitching}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleConfirmSwitch}
                disabled={isSwitching}
              >
                {isSwitching ? 'Switching...' : 'Switch Branch'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Branch creation modal */}
      <BranchCreationModal
        isOpen={showCreateModal}
        onClose={handleCloseCreateModal}
        onCreateBranch={handleCreateBranchSubmit}
        existingBranches={branches.map((b) => b.name)}
        currentBranch={currentBranch}
      />

      {/* Merge preview dialog */}
      {mergeData && !mergeData.conflicts && (
        <MergePreviewDialog
          isOpen={showMergePreview}
          onClose={handleCloseMergePreview}
          onConfirm={handleMergeConfirm}
          sourceBranch={currentBranch}
          targetBranch={mergeData.targetBranch}
          diff={mergeData.diff}
          hasConflicts={false}
        />
      )}

      {/* Merge conflict resolver */}
      {mergeData && mergeData.conflicts && (
        <MergeConflictResolver
          isOpen={showConflictResolver}
          onClose={handleCloseConflictResolver}
          conflicts={mergeData.conflicts}
          sourceBranch={currentBranch}
          targetBranch={mergeData.targetBranch}
          sourceDeck={mergeData.sourceDeck}
          targetDeck={mergeData.targetDeck}
          onResolve={handleConflictResolve}
        />
      )}

      <style>{`
        .branch-selector {
          position: relative;
          display: inline-block;
        }

        .branch-selector-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background-color: #ffffff;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .branch-selector-button:hover:not(:disabled) {
          background-color: #f9fafb;
          border-color: #9ca3af;
        }

        .branch-selector-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .branch-selector-button.open {
          background-color: #f3f4f6;
          border-color: #3b82f6;
        }

        /* Style main branch button differently */
        .branch-selector-button.main-branch {
          background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
          border-color: #9ca3af;
        }

        .branch-selector-button.main-branch:hover:not(:disabled) {
          background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
          border-color: #6b7280;
        }

        .branch-selector-button.main-branch.open {
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          border-color: #3b82f6;
        }

        .branch-selector-button.main-branch .branch-name {
          color: #6366f1;
        }

        .branch-icon {
          font-size: 1rem;
          line-height: 1;
        }

        .branch-name {
          font-weight: 600;
          color: #111827;
        }

        .dropdown-arrow {
          font-size: 0.625rem;
          color: #6b7280;
          margin-left: 0.25rem;
        }

        .branch-dropdown {
          position: absolute;
          top: calc(100% + 0.25rem);
          left: 0;
          min-width: 250px;
          background-color: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          overflow: hidden;
          animation: slideDown 0.15s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dropdown-loading,
        .dropdown-error,
        .dropdown-empty {
          padding: 1.5rem;
          text-align: center;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .dropdown-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }

        .dropdown-error {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .dropdown-error p {
          margin: 0;
        }

        .dropdown-section {
          padding: 0.5rem 0;
        }

        .dropdown-section-title {
          padding: 0.5rem 1rem;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          color: #6b7280;
          letter-spacing: 0.05em;
        }

        .branch-list {
          display: flex;
          flex-direction: column;
        }

        .branch-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1rem;
          background: none;
          border: none;
          text-align: left;
          cursor: pointer;
          transition: background-color 0.15s ease;
          font-size: 0.875rem;
          color: #374151;
        }

        .branch-item:hover:not(:disabled) {
          background-color: #f3f4f6;
        }

        .branch-item:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .branch-item.current {
          background-color: #eff6ff;
          font-weight: 600;
        }

        .branch-item.current:hover {
          background-color: #dbeafe;
        }

        /* Style main branch items differently */
        .branch-item.main {
          background: linear-gradient(90deg, #f9fafb 0%, #ffffff 100%);
          border-left: 3px solid #6366f1;
          padding-left: calc(1rem - 3px);
        }

        .branch-item.main .branch-item-name {
          font-weight: 600;
          color: #6366f1;
        }

        .branch-item.main:hover:not(:disabled) {
          background: linear-gradient(90deg, #f3f4f6 0%, #f9fafb 100%);
        }

        .branch-item.main.current {
          background: linear-gradient(90deg, #eff6ff 0%, #f0f9ff 100%);
          border-left-color: #3b82f6;
        }

        .branch-item.main.current:hover {
          background: linear-gradient(90deg, #dbeafe 0%, #e0f2fe 100%);
        }

        .branch-item-icon {
          font-size: 1rem;
          line-height: 1;
        }

        .branch-item-name {
          flex: 1;
        }

        .branch-item-badge {
          font-size: 0.625rem;
          font-weight: 600;
          text-transform: uppercase;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          background-color: #3b82f6;
          color: white;
        }

        .dropdown-divider {
          height: 1px;
          background-color: #e5e7eb;
          margin: 0.25rem 0;
        }

        .branch-merge-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.75rem 1rem;
          background: none;
          border: none;
          text-align: left;
          cursor: pointer;
          transition: background-color 0.15s ease;
          font-size: 0.875rem;
          font-weight: 500;
          color: #10b981;
        }

        .branch-merge-button:hover:not(:disabled) {
          background-color: #ecfdf5;
        }

        .branch-merge-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .merge-icon {
          font-size: 1.25rem;
          font-weight: 600;
          line-height: 1;
        }

        .branch-create-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.75rem 1rem;
          background: none;
          border: none;
          text-align: left;
          cursor: pointer;
          transition: background-color 0.15s ease;
          font-size: 0.875rem;
          font-weight: 500;
          color: #3b82f6;
        }

        .branch-create-button:hover:not(:disabled) {
          background-color: #eff6ff;
        }

        .branch-create-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .create-icon {
          font-size: 1.25rem;
          font-weight: 600;
          line-height: 1;
        }

        .error-notification {
          position: absolute;
          bottom: -3rem;
          left: 0;
          right: 0;
          z-index: 1001;
          animation: slideDown 0.2s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .confirm-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 1100;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .confirm-dialog {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 90%;
          max-width: 450px;
          background-color: #ffffff;
          border-radius: 0.5rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          z-index: 1101;
          animation: slideUp 0.2s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translate(-50%, -45%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }

        .confirm-header {
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .confirm-header h3 {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
        }

        .confirm-content {
          padding: 1.5rem;
        }

        .confirm-content p {
          margin: 0 0 1rem 0;
          font-size: 0.875rem;
          color: #6b7280;
          line-height: 1.5;
        }

        .confirm-content p:last-child {
          margin-bottom: 0;
        }

        .confirm-warning {
          font-weight: 500;
          color: #374151;
        }

        .confirm-warning strong {
          color: #111827;
        }

        .confirm-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          border-top: 1px solid #e5e7eb;
          background-color: #f9fafb;
        }

        .btn {
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          border-radius: 0.375rem;
          border: none;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-sm {
          padding: 0.375rem 0.75rem;
          font-size: 0.75rem;
        }

        .btn-secondary {
          background-color: white;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .btn-secondary:hover:not(:disabled) {
          background-color: #f9fafb;
        }

        .btn-danger {
          background-color: #ef4444;
          color: white;
        }

        .btn-danger:hover:not(:disabled) {
          background-color: #dc2626;
        }

        .btn:active:not(:disabled) {
          transform: scale(0.98);
        }


      `}</style>
    </div>
  );
};
