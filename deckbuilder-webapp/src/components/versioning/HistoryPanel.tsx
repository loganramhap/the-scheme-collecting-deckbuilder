import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useCommitHistory } from '../../hooks/useCommitHistory';
import { useDeckDiff } from '../../hooks/useDeckDiff';
import { useArrowKeyNavigation } from '../../hooks/useKeyboardShortcuts';
import { DiffViewer } from './DiffViewer';
import { RestoreConfirmationDialog } from './RestoreConfirmationDialog';
import { VersionTimeline } from './VersionTimeline';
import { versionControlService } from '../../services/versionControl';
import { deckDiffService } from '../../services/deckDiff';
import { Spinner } from '../Spinner';
import { LoadingOverlay } from '../LoadingOverlay';
import { ErrorDisplay } from '../ErrorDisplay';
import type { Deck } from '../../types/deck';
import type { DeckCommit, DeckDiff } from '../../types/versioning';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  owner: string;
  repo: string;
  branch?: string;
  currentDeck?: Deck;
  onCompare?: (sha1: string, sha2: string) => void;
  onRestore?: (deck: Deck, commit: DeckCommit) => void;
}

/**
 * Sliding panel component that displays commit history
 * Based on Requirements 2.1, 2.2, 2.3, 2.4, 8.5
 */
export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  isOpen,
  onClose,
  owner,
  repo,
  branch = 'main',
  currentDeck,
  onCompare,
  onRestore,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
  const [selectedCommits, setSelectedCommits] = useState<string[]>([]);
  const [focusedCommitIndex, setFocusedCommitIndex] = useState<number>(-1);
  const [isDiffViewerOpen, setIsDiffViewerOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [restoreCommit, setRestoreCommit] = useState<DeckCommit | null>(null);
  const [restoreDiff, setRestoreDiff] = useState<DeckDiff | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const commitRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const {
    commits,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh,
  } = useCommitHistory({
    owner,
    repo,
    branch,
    perPage: 20,
    enabled: isOpen,
  });

  const {
    diff,
    oldDeck,
    newDeck,
    isLoading: isDiffLoading,
    error: diffError,
    calculateDiff,
    calculateDiffWithCurrent,
    reset: resetDiff,
  } = useDeckDiff({
    owner,
    repo,
  });

  // Reset selected commits and diff when panel closes
  useEffect(() => {
    if (!isOpen) {
      setViewMode('list');
      setSelectedCommits([]);
      setFocusedCommitIndex(-1);
      setIsDiffViewerOpen(false);
      setIsRestoreDialogOpen(false);
      setRestoreCommit(null);
      setRestoreDiff(null);
      setRestoreError(null);
      resetDiff();
    } else {
      // When panel opens, focus first commit
      if (commits.length > 0) {
        setFocusedCommitIndex(0);
      }
    }
  }, [isOpen, resetDiff, commits.length]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (!isOpen || !hasMore || isLoading) {
      return;
    }

    const options = {
      root: scrollContainerRef.current,
      rootMargin: '100px',
      threshold: 0.1,
    };

    observerRef.current = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isLoading) {
        loadMore();
      }
    }, options);

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isOpen, hasMore, isLoading, loadMore]);

  const handleCommitClick = useCallback((sha: string) => {
    setSelectedCommits((prev) => {
      if (prev.includes(sha)) {
        // Deselect
        return prev.filter((s) => s !== sha);
      } else if (prev.length < 2) {
        // Select (max 2)
        return [...prev, sha];
      } else {
        // Replace oldest selection
        return [prev[1], sha];
      }
    });
  }, []);

  const handleCompare = useCallback(async () => {
    if (selectedCommits.length === 2) {
      // Call the onCompare callback if provided (for backwards compatibility)
      if (onCompare) {
        onCompare(selectedCommits[0], selectedCommits[1]);
      }
      
      // Calculate diff and open DiffViewer
      await calculateDiff(selectedCommits[0], selectedCommits[1]);
      setIsDiffViewerOpen(true);
    }
  }, [selectedCommits, onCompare, calculateDiff]);

  const handleCompareWithCurrent = useCallback(async (sha: string) => {
    if (!currentDeck) {
      console.error('Cannot compare with current: no current deck available');
      return;
    }

    // Set selected commits to show the comparison (historical SHA and 'current')
    setSelectedCommits([sha, 'current']);

    // Calculate diff between historical version and current deck
    await calculateDiffWithCurrent(sha, currentDeck);
    setIsDiffViewerOpen(true);
  }, [currentDeck, calculateDiffWithCurrent]);

  const handleCloseDiffViewer = useCallback(() => {
    setIsDiffViewerOpen(false);
    resetDiff();
  }, [resetDiff]);

  const handleRestore = useCallback(async (sha: string) => {
    // Find the commit to restore
    const commit = commits.find(c => c.sha === sha);
    if (!commit) {
      console.error('Commit not found:', sha);
      return;
    }

    setRestoreCommit(commit);
    setRestoreError(null);

    // Calculate diff if current deck is available
    if (currentDeck) {
      try {
        const historicalDeck = await versionControlService.restoreDeckVersion(owner, repo, sha);
        const diff = deckDiffService.calculateDiff(currentDeck, historicalDeck);
        setRestoreDiff(diff);
      } catch (error) {
        console.error('Failed to calculate restore diff:', error);
        setRestoreDiff(null);
      }
    }

    // Open confirmation dialog
    setIsRestoreDialogOpen(true);
  }, [commits, currentDeck, owner, repo]);

  const handleConfirmRestore = useCallback(async () => {
    if (!restoreCommit || !onRestore) {
      return;
    }

    setIsRestoring(true);
    setRestoreError(null);

    try {
      // Load the historical deck state
      const historicalDeck = await versionControlService.restoreDeckVersion(
        owner,
        repo,
        restoreCommit.sha
      );

      // Call the onRestore callback with the deck and commit info
      onRestore(historicalDeck, restoreCommit);

      // Close the dialog
      setIsRestoreDialogOpen(false);
      setRestoreCommit(null);
      setRestoreDiff(null);
    } catch (error) {
      console.error('Failed to restore deck:', error);
      setRestoreError(error instanceof Error ? error.message : 'Failed to restore deck version');
    } finally {
      setIsRestoring(false);
    }
  }, [restoreCommit, onRestore, owner, repo]);

  const handleCancelRestore = useCallback(() => {
    setIsRestoreDialogOpen(false);
    setRestoreCommit(null);
    setRestoreDiff(null);
    setRestoreError(null);
  }, []);

  // Handle arrow key navigation in list view
  const handleFocusChange = useCallback((newIndex: number) => {
    setFocusedCommitIndex(newIndex);
    
    // Scroll the focused commit into view
    const commitElement = commitRefs.current.get(newIndex);
    if (commitElement && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const elementTop = commitElement.offsetTop;
      const elementBottom = elementTop + commitElement.offsetHeight;
      const containerTop = container.scrollTop;
      const containerBottom = containerTop + container.clientHeight;

      // Scroll if element is not fully visible
      if (elementTop < containerTop) {
        container.scrollTop = elementTop - 20; // 20px padding
      } else if (elementBottom > containerBottom) {
        container.scrollTop = elementBottom - container.clientHeight + 20;
      }
    }
  }, []);

  // Handle Escape key to close panel and Enter to select commit
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Close diff viewer if open, otherwise close panel
        if (isDiffViewerOpen) {
          event.preventDefault();
          handleCloseDiffViewer();
        } else if (isRestoreDialogOpen) {
          event.preventDefault();
          handleCancelRestore();
        } else {
          event.preventDefault();
          onClose();
        }
      } else if (event.key === 'Enter' && focusedCommitIndex >= 0 && focusedCommitIndex < commits.length) {
        // Select the focused commit on Enter
        event.preventDefault();
        const commit = commits[focusedCommitIndex];
        handleCommitClick(commit.sha);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isDiffViewerOpen, isRestoreDialogOpen, focusedCommitIndex, commits, onClose, handleCloseDiffViewer, handleCancelRestore, handleCommitClick]);

  // Use arrow key navigation hook for list view
  useArrowKeyNavigation(
    commits,
    focusedCommitIndex,
    handleFocusChange,
    isOpen && viewMode === 'list' && !isDiffViewerOpen && !isRestoreDialogOpen
  );

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getAvatarUrl = (email: string): string => {
    // Generate a simple avatar based on email hash
    const hash = email.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    const hue = Math.abs(hash) % 360;
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='hsl(${hue}, 60%25, 60%25)'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='sans-serif' font-size='18' font-weight='bold'%3E${email.charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E`;
  };

  const getShortSha = (sha: string): string => {
    return sha.substring(0, 7);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div className="history-panel-backdrop" onClick={onClose} />

      {/* Sliding Panel */}
      <div className={`history-panel ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="history-panel-header">
          <h2 className="history-panel-title">Commit History</h2>
          <div className="history-panel-header-actions">
            {/* View toggle */}
            <div className="view-toggle">
              <button
                className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                aria-label="List view"
                title="List view"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <rect x="2" y="3" width="12" height="2" rx="1" />
                  <rect x="2" y="7" width="12" height="2" rx="1" />
                  <rect x="2" y="11" width="12" height="2" rx="1" />
                </svg>
              </button>
              <button
                className={`view-toggle-btn ${viewMode === 'timeline' ? 'active' : ''}`}
                onClick={() => setViewMode('timeline')}
                aria-label="Timeline view"
                title="Timeline view"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <circle cx="8" cy="3" r="2" />
                  <circle cx="8" cy="8" r="2" />
                  <circle cx="8" cy="13" r="2" />
                  <line x1="8" y1="5" x2="8" y2="6" stroke="currentColor" strokeWidth="2" />
                  <line x1="8" y1="10" x2="8" y2="11" stroke="currentColor" strokeWidth="2" />
                </svg>
              </button>
            </div>
            <button
              className="history-panel-close"
              onClick={onClose}
              aria-label="Close history panel"
            >
              ×
            </button>
          </div>
        </div>

        {/* Compare button (shown when 2 commits selected) */}
        {selectedCommits.length === 2 && onCompare && (
          <div className="history-panel-actions">
            <button
              className="btn btn-primary btn-compare"
              onClick={handleCompare}
            >
              Compare Selected Commits
            </button>
          </div>
        )}

        {/* Content - List or Timeline view */}
        <div className="history-panel-content" ref={scrollContainerRef}>
          {error && (
            <ErrorDisplay
              error={error}
              onRetry={refresh}
              context="Commit History"
            />
          )}

          {!error && commits.length === 0 && !isLoading && (
            <div className="history-panel-empty">
              <p>No commits yet</p>
            </div>
          )}

          {/* Timeline View */}
          {viewMode === 'timeline' && !error && commits.length > 0 && (
            <div className="timeline-view-wrapper">
              <VersionTimeline
                commits={commits}
                currentCommit={selectedCommits[0]}
                selectedCommits={selectedCommits}
                onSelectCommit={handleCommitClick}
              />
              {selectedCommits.length > 0 && (
                <div className="timeline-selection-info">
                  <p>
                    {selectedCommits.length === 1 
                      ? '1 commit selected' 
                      : `${selectedCommits.length} commits selected`}
                  </p>
                  {selectedCommits.length === 2 && (
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={handleCompare}
                    >
                      Compare Selected
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && commits.map((commit, index) => {
            const isSelected = selectedCommits.includes(commit.sha);
            const isFocused = focusedCommitIndex === index;
            const isAutoSave = commit.isAutoSave;

            return (
              <div
                key={commit.sha}
                ref={(el) => {
                  if (el) {
                    commitRefs.current.set(index, el);
                  } else {
                    commitRefs.current.delete(index);
                  }
                }}
                className={`commit-item ${isAutoSave ? 'auto-save' : ''} ${isSelected ? 'selected' : ''} ${isFocused ? 'focused' : ''}`}
                onClick={() => {
                  setFocusedCommitIndex(index);
                  handleCommitClick(commit.sha);
                }}
              >
                {/* Avatar */}
                <div className="commit-avatar">
                  <img
                    src={getAvatarUrl(commit.author.email)}
                    alt={commit.author.name}
                  />
                </div>

                {/* Content */}
                <div className="commit-content">
                  <div className="commit-header">
                    <span className="commit-message">{commit.message}</span>
                    {isAutoSave && (
                      <span className="commit-badge">Auto-save</span>
                    )}
                  </div>

                  <div className="commit-meta">
                    <span className="commit-author">{commit.author.name}</span>
                    <span className="commit-separator">•</span>
                    <span className="commit-date">{formatDate(commit.author.date)}</span>
                    <span className="commit-separator">•</span>
                    <span className="commit-sha">{getShortSha(commit.sha)}</span>
                  </div>

                  {commit.changesSummary && (
                    <div className="commit-changes">
                      {commit.changesSummary.cardsAdded > 0 && (
                        <span className="change-stat added">
                          +{commit.changesSummary.cardsAdded}
                        </span>
                      )}
                      {commit.changesSummary.cardsRemoved > 0 && (
                        <span className="change-stat removed">
                          -{commit.changesSummary.cardsRemoved}
                        </span>
                      )}
                      {commit.changesSummary.cardsModified > 0 && (
                        <span className="change-stat modified">
                          ~{commit.changesSummary.cardsModified}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="commit-actions">
                  {currentDeck && (
                    <button
                      className="btn btn-sm btn-compare-current"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCompareWithCurrent(commit.sha);
                      }}
                      title="Compare with current version"
                    >
                      Compare
                    </button>
                  )}
                  {onRestore && (
                    <button
                      className="btn btn-sm btn-restore"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestore(commit.sha);
                      }}
                      title="Restore this version"
                    >
                      Restore
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Loading indicator */}
          {isLoading && (
            <div className="history-panel-loading">
              <Spinner size="md" />
              <span>Loading commits...</span>
            </div>
          )}

          {/* Infinite scroll sentinel - only for list view */}
          {viewMode === 'list' && hasMore && !isLoading && <div ref={sentinelRef} style={{ height: '1px' }} />}
        </div>

        {/* Diff loading indicator */}
        {isDiffLoading && (
          <LoadingOverlay message="Loading comparison..." fullScreen />
        )}

        {/* Diff error notification */}
        {diffError && (
          <div className="error-toast">
            <ErrorDisplay
              error={diffError}
              onDismiss={resetDiff}
              context="Comparison"
              compact
            />
          </div>
        )}

        {/* Restore error notification */}
        {restoreError && (
          <div className="error-toast">
            <ErrorDisplay
              error={restoreError}
              onDismiss={() => setRestoreError(null)}
              context="Restore"
              compact
            />
          </div>
        )}

        <style>{`
          .history-panel-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 999;
            animation: fadeIn 0.2s ease;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          .history-panel {
            position: fixed;
            top: 0;
            right: 0;
            bottom: 0;
            width: 450px;
            max-width: 90vw;
            background-color: #ffffff;
            box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            display: flex;
            flex-direction: column;
            transform: translateX(100%);
            transition: transform 0.3s ease;
          }

          .history-panel.open {
            transform: translateX(0);
          }

          .history-panel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem;
            border-bottom: 1px solid #e5e7eb;
            background-color: #f9fafb;
          }

          .history-panel-title {
            margin: 0;
            font-size: 1.25rem;
            font-weight: 600;
            color: #111827;
          }

          .history-panel-header-actions {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }

          .view-toggle {
            display: flex;
            background-color: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 0.375rem;
            padding: 0.125rem;
          }

          .view-toggle-btn {
            background: none;
            border: none;
            color: #6b7280;
            cursor: pointer;
            padding: 0.375rem 0.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 0.25rem;
            transition: all 0.15s ease;
          }

          .view-toggle-btn:hover {
            background-color: #f3f4f6;
            color: #374151;
          }

          .view-toggle-btn.active {
            background-color: #3b82f6;
            color: #ffffff;
          }

          .view-toggle-btn svg {
            display: block;
          }

          .history-panel-close {
            background: none;
            border: none;
            color: #6b7280;
            font-size: 2rem;
            cursor: pointer;
            padding: 0;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 0.375rem;
            transition: all 0.15s ease;
          }

          .history-panel-close:hover {
            background-color: #e5e7eb;
            color: #111827;
          }

          .history-panel-actions {
            padding: 1rem 1.5rem;
            border-bottom: 1px solid #e5e7eb;
            background-color: #f0f9ff;
          }

          .btn-compare {
            width: 100%;
          }

          .history-panel-content {
            flex: 1;
            overflow-y: auto;
            padding: 1rem;
          }

          .timeline-view-wrapper {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            height: 100%;
          }

          .timeline-selection-info {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.75rem 1rem;
            background-color: #f0f9ff;
            border: 1px solid #bfdbfe;
            border-radius: 0.5rem;
            margin-top: auto;
          }

          .timeline-selection-info p {
            margin: 0;
            font-size: 0.875rem;
            color: #1e40af;
            font-weight: 500;
          }

          .history-panel-error,
          .history-panel-empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 3rem 1.5rem;
            text-align: center;
            color: #6b7280;
          }

          .history-panel-error p,
          .history-panel-empty p {
            margin: 0 0 1rem 0;
            font-size: 0.875rem;
          }

          .commit-item {
            display: flex;
            gap: 0.75rem;
            padding: 1rem;
            border: 2px solid transparent;
            border-radius: 0.5rem;
            margin-bottom: 0.75rem;
            cursor: pointer;
            transition: all 0.15s ease;
            background-color: #ffffff;
          }

          .commit-item:hover {
            background-color: #f9fafb;
            border-color: #e5e7eb;
          }

          .commit-item.selected {
            background-color: #eff6ff;
            border-color: #3b82f6;
          }

          .commit-item.auto-save {
            background-color: #fefce8;
          }

          .commit-item.auto-save:hover {
            background-color: #fef9c3;
          }

          .commit-item.auto-save.selected {
            background-color: #fef3c7;
            border-color: #f59e0b;
          }

          .commit-item.focused {
            outline: 2px solid #3b82f6;
            outline-offset: -2px;
          }

          .commit-item.focused:not(.selected) {
            background-color: #f0f9ff;
          }

          .commit-avatar {
            flex-shrink: 0;
          }

          .commit-avatar img {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: block;
          }

          .commit-content {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 0.375rem;
          }

          .commit-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .commit-message {
            font-weight: 500;
            color: #111827;
            font-size: 0.875rem;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            flex: 1;
          }

          .commit-badge {
            flex-shrink: 0;
            font-size: 0.625rem;
            font-weight: 600;
            text-transform: uppercase;
            padding: 0.125rem 0.375rem;
            border-radius: 0.25rem;
            background-color: #fbbf24;
            color: #78350f;
          }

          .commit-meta {
            display: flex;
            align-items: center;
            gap: 0.375rem;
            font-size: 0.75rem;
            color: #6b7280;
          }

          .commit-author {
            font-weight: 500;
          }

          .commit-separator {
            color: #d1d5db;
          }

          .commit-sha {
            font-family: 'Courier New', monospace;
            background-color: #f3f4f6;
            padding: 0.125rem 0.25rem;
            border-radius: 0.25rem;
          }

          .commit-changes {
            display: flex;
            gap: 0.5rem;
            font-size: 0.75rem;
            font-weight: 600;
          }

          .change-stat {
            padding: 0.125rem 0.375rem;
            border-radius: 0.25rem;
          }

          .change-stat.added {
            background-color: #dcfce7;
            color: #166534;
          }

          .change-stat.removed {
            background-color: #fee2e2;
            color: #991b1b;
          }

          .change-stat.modified {
            background-color: #fef3c7;
            color: #92400e;
          }

          .commit-actions {
            flex-shrink: 0;
            display: flex;
            align-items: center;
            gap: 0.5rem;
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

          .btn-primary {
            background-color: #3b82f6;
            color: white;
          }

          .btn-primary:hover:not(:disabled) {
            background-color: #2563eb;
          }

          .btn-compare-current {
            background-color: #3b82f6;
            color: white;
          }

          .btn-compare-current:hover:not(:disabled) {
            background-color: #2563eb;
          }

          .btn-restore {
            background-color: #10b981;
            color: white;
          }

          .btn-restore:hover:not(:disabled) {
            background-color: #059669;
          }

          .btn:active:not(:disabled) {
            transform: scale(0.98);
          }

          .history-panel-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            gap: 0.75rem;
            color: #6b7280;
            font-size: 0.875rem;
          }



          /* Scrollbar styling */
          .history-panel-content::-webkit-scrollbar {
            width: 8px;
          }

          .history-panel-content::-webkit-scrollbar-track {
            background: #f3f4f6;
          }

          .history-panel-content::-webkit-scrollbar-thumb {
            background: #d1d5db;
            border-radius: 4px;
          }

          .history-panel-content::-webkit-scrollbar-thumb:hover {
            background: #9ca3af;
          }



          /* Error toast */
          .error-toast {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            z-index: 1001;
            max-width: 400px;
            animation: slideInRight 0.3s ease;
          }

          @keyframes slideInRight {
            from {
              opacity: 0;
              transform: translateX(100%);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}</style>
      </div>

      {/* RestoreConfirmationDialog */}
      {isRestoreDialogOpen && restoreCommit && (
        <RestoreConfirmationDialog
          isOpen={isRestoreDialogOpen}
          onClose={handleCancelRestore}
          onConfirm={handleConfirmRestore}
          commit={restoreCommit}
          diff={restoreDiff || undefined}
          isLoading={isRestoring}
        />
      )}

      {/* DiffViewer Modal */}
      {isDiffViewerOpen && diff && oldDeck && newDeck && (() => {
        const oldCommit = commits.find(c => c.sha === selectedCommits[0]) || commits[0];
        const newCommit = selectedCommits[1] === 'current'
          ? {
              sha: 'current',
              message: 'Current working version',
              author: {
                name: 'You',
                email: '',
                date: new Date().toISOString(),
              },
              committer: {
                name: 'You',
                email: '',
                date: new Date().toISOString(),
              },
              parents: [],
              isAutoSave: false,
            }
          : commits.find(c => c.sha === selectedCommits[1]) || commits[0];

        return (
          <DiffViewer
            isOpen={isDiffViewerOpen}
            onClose={handleCloseDiffViewer}
            oldDeck={oldDeck}
            newDeck={newDeck}
            oldCommit={oldCommit}
            newCommit={newCommit}
          />
        );
      })()}
    </>
  );
};
