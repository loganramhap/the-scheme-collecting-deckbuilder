import React from 'react';
import Modal from '../Modal';
import { Spinner } from '../Spinner';
import type { DeckCommit, DeckDiff } from '../../types/versioning';

interface RestoreConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  commit: DeckCommit;
  diff?: DeckDiff;
  isLoading?: boolean;
}

/**
 * Confirmation dialog for restoring a deck to a previous version
 * Based on Requirements 4.1, 4.2
 */
export const RestoreConfirmationDialog: React.FC<RestoreConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  commit,
  diff,
  isLoading = false,
}) => {
  const getShortSha = (sha: string): string => {
    return sha.substring(0, 7);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Restore Deck Version">
      <div className="restore-confirmation-content">
        {/* Warning message */}
        <div className="warning-box">
          <div className="warning-icon">⚠️</div>
          <div className="warning-text">
            <strong>Warning:</strong> This will replace your current deck with the selected version.
            Any unsaved changes will be lost. You'll need to save after restoration to commit the changes.
          </div>
        </div>

        {/* Commit details */}
        <div className="commit-details">
          <h3>Restoring to:</h3>
          <div className="commit-info">
            <div className="commit-info-row">
              <span className="label">Commit:</span>
              <span className="value monospace">{getShortSha(commit.sha)}</span>
            </div>
            <div className="commit-info-row">
              <span className="label">Message:</span>
              <span className="value">{commit.message}</span>
            </div>
            <div className="commit-info-row">
              <span className="label">Author:</span>
              <span className="value">{commit.author.name}</span>
            </div>
            <div className="commit-info-row">
              <span className="label">Date:</span>
              <span className="value">{formatDate(commit.author.date)}</span>
            </div>
          </div>
        </div>

        {/* Diff preview (if available) */}
        {diff && (
          <div className="diff-preview">
            <h3>Changes Preview:</h3>
            <div className="diff-summary">
              {diff.added.length > 0 && (
                <div className="diff-stat added">
                  <span className="diff-count">+{diff.added.length}</span>
                  <span className="diff-label">cards will be added</span>
                </div>
              )}
              {diff.removed.length > 0 && (
                <div className="diff-stat removed">
                  <span className="diff-count">-{diff.removed.length}</span>
                  <span className="diff-label">cards will be removed</span>
                </div>
              )}
              {diff.modified.length > 0 && (
                <div className="diff-stat modified">
                  <span className="diff-count">~{diff.modified.length}</span>
                  <span className="diff-label">cards will be modified</span>
                </div>
              )}
              {diff.added.length === 0 && diff.removed.length === 0 && diff.modified.length === 0 && (
                <div className="diff-stat no-changes">
                  <span className="diff-label">No changes detected</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="action-buttons">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            {isLoading && <Spinner size="sm" color="white" />}
            {isLoading ? 'Restoring...' : 'Restore Version'}
          </button>
        </div>

        <style>{`
          .restore-confirmation-content {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
          }

          .warning-box {
            display: flex;
            gap: 1rem;
            padding: 1rem;
            background-color: #fef3c7;
            border: 1px solid #fbbf24;
            border-radius: 0.5rem;
          }

          .warning-icon {
            font-size: 1.5rem;
            flex-shrink: 0;
          }

          .warning-text {
            font-size: 0.875rem;
            color: #92400e;
            line-height: 1.5;
          }

          .warning-text strong {
            display: block;
            margin-bottom: 0.25rem;
            color: #78350f;
          }

          .commit-details h3,
          .diff-preview h3 {
            margin: 0 0 0.75rem 0;
            font-size: 1rem;
            font-weight: 600;
            color: #111827;
          }

          .commit-info {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            padding: 1rem;
            background-color: #f9fafb;
            border-radius: 0.5rem;
          }

          .commit-info-row {
            display: flex;
            gap: 0.75rem;
            font-size: 0.875rem;
          }

          .commit-info-row .label {
            font-weight: 600;
            color: #6b7280;
            min-width: 80px;
          }

          .commit-info-row .value {
            color: #111827;
            flex: 1;
          }

          .monospace {
            font-family: 'Courier New', monospace;
            background-color: #e5e7eb;
            padding: 0.125rem 0.375rem;
            border-radius: 0.25rem;
          }

          .diff-preview {
            padding: 1rem;
            background-color: #f9fafb;
            border-radius: 0.5rem;
          }

          .diff-summary {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .diff-stat {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem;
            border-radius: 0.375rem;
            font-size: 0.875rem;
          }

          .diff-stat.added {
            background-color: #dcfce7;
            color: #166534;
          }

          .diff-stat.removed {
            background-color: #fee2e2;
            color: #991b1b;
          }

          .diff-stat.modified {
            background-color: #fef3c7;
            color: #92400e;
          }

          .diff-stat.no-changes {
            background-color: #f3f4f6;
            color: #6b7280;
            justify-content: center;
          }

          .diff-count {
            font-weight: 700;
            font-size: 1rem;
          }

          .diff-label {
            font-weight: 500;
          }

          .action-buttons {
            display: flex;
            gap: 0.75rem;
            justify-content: flex-end;
            margin-top: 0.5rem;
          }

          .btn {
            padding: 0.625rem 1.25rem;
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

          .btn-secondary {
            background-color: white;
            color: #374151;
            border: 1px solid #d1d5db;
          }

          .btn-secondary:hover:not(:disabled) {
            background-color: #f9fafb;
          }

          .btn-danger {
            background-color: #dc2626;
            color: white;
          }

          .btn-danger:hover:not(:disabled) {
            background-color: #b91c1c;
          }

          .btn:active:not(:disabled) {
            transform: scale(0.98);
          }
        `}</style>
      </div>
    </Modal>
  );
};
