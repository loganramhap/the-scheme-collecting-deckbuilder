import React, { useState } from 'react';
import { Spinner } from '../Spinner';
import type { DeckDiff } from '../../types/versioning';
import { deckDiffService } from '../../services/deckDiff';

interface MergePreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (message: string) => Promise<void>;
  sourceBranch: string;
  targetBranch: string;
  diff: DeckDiff;
  hasConflicts: boolean;
}

/**
 * Dialog for previewing merge changes before confirming
 * Based on Requirement 7.2
 */
export const MergePreviewDialog: React.FC<MergePreviewDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  sourceBranch,
  targetBranch,
  diff,
  hasConflicts,
}) => {
  const [message, setMessage] = useState(`Merge ${sourceBranch} into ${targetBranch}`);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!message.trim()) {
      setError('Merge message is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onConfirm(message);
      // Dialog will be closed by parent component on success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to merge branches');
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!isSubmitting) {
      setMessage(`Merge ${sourceBranch} into ${targetBranch}`);
      setError(null);
      onClose();
    }
  };

  const summary = deckDiffService.summarizeChanges(diff);
  const totalAdded = diff.added.reduce((sum, card) => sum + card.count, 0);
  const totalRemoved = diff.removed.reduce((sum, card) => sum + card.count, 0);
  const totalModified = diff.modified.length;

  return (
    <>
      <div className="merge-preview-backdrop" onClick={handleCancel} />
      <div className="merge-preview-dialog">
        <div className="merge-preview-header">
          <h3>Merge Preview</h3>
          <button
            className="close-button"
            onClick={handleCancel}
            disabled={isSubmitting}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="merge-preview-content">
          {/* Branch info */}
          <div className="merge-info">
            <div className="merge-branches">
              <span className="branch-badge source">{sourceBranch}</span>
              <span className="merge-arrow">→</span>
              <span className="branch-badge target">{targetBranch}</span>
            </div>
          </div>

          {/* Conflict warning */}
          {hasConflicts && (
            <div className="conflict-warning">
              <span className="warning-icon">⚠️</span>
              <div>
                <strong>Conflicts Detected</strong>
                <p>This merge has conflicts that need to be resolved manually.</p>
              </div>
            </div>
          )}

          {/* Changes summary */}
          <div className="changes-summary">
            <h4>Changes Summary</h4>
            <p className="summary-text">{summary}</p>
            
            <div className="stats-grid">
              {totalAdded > 0 && (
                <div className="stat-item added">
                  <span className="stat-icon">+</span>
                  <span className="stat-value">{totalAdded}</span>
                  <span className="stat-label">Added</span>
                </div>
              )}
              
              {totalRemoved > 0 && (
                <div className="stat-item removed">
                  <span className="stat-icon">−</span>
                  <span className="stat-value">{totalRemoved}</span>
                  <span className="stat-label">Removed</span>
                </div>
              )}
              
              {totalModified > 0 && (
                <div className="stat-item modified">
                  <span className="stat-icon">~</span>
                  <span className="stat-value">{totalModified}</span>
                  <span className="stat-label">Modified</span>
                </div>
              )}
            </div>
          </div>

          {/* Detailed changes */}
          {!hasConflicts && (
            <div className="changes-details">
              {diff.added.length > 0 && (
                <div className="change-section">
                  <h5 className="change-title added">Added Cards</h5>
                  <ul className="card-list">
                    {diff.added.map((card) => (
                      <li key={card.id} className="card-item">
                        <span className="card-count">+{card.count}</span>
                        <span className="card-name">{card.name || card.id}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {diff.removed.length > 0 && (
                <div className="change-section">
                  <h5 className="change-title removed">Removed Cards</h5>
                  <ul className="card-list">
                    {diff.removed.map((card) => (
                      <li key={card.id} className="card-item">
                        <span className="card-count">−{card.count}</span>
                        <span className="card-name">{card.name || card.id}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {diff.modified.length > 0 && (
                <div className="change-section">
                  <h5 className="change-title modified">Modified Cards</h5>
                  <ul className="card-list">
                    {diff.modified.map((mod) => (
                      <li key={mod.card.id} className="card-item">
                        <span className="card-count">
                          {mod.oldCount} → {mod.newCount}
                        </span>
                        <span className="card-name">{mod.card.name || mod.card.id}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Merge message input */}
          <div className="merge-message-section">
            <label htmlFor="merge-message">
              <strong>Merge Message</strong>
            </label>
            <textarea
              id="merge-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe this merge..."
              rows={3}
              disabled={isSubmitting}
              className="merge-message-input"
            />
            <div className="message-hint">
              Describe why you're merging these changes
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="merge-preview-actions">
          <button
            className="btn btn-secondary"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={isSubmitting || hasConflicts}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            {isSubmitting && <Spinner size="sm" color="white" />}
            {isSubmitting ? 'Merging...' : hasConflicts ? 'Resolve Conflicts First' : 'Confirm Merge'}
          </button>
        </div>
      </div>

      <style>{`
        .merge-preview-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 1200;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .merge-preview-dialog {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 90%;
          max-width: 600px;
          max-height: 85vh;
          background-color: #ffffff;
          border-radius: 0.5rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          z-index: 1201;
          display: flex;
          flex-direction: column;
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

        .merge-preview-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .merge-preview-header h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 2rem;
          color: #6b7280;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.25rem;
          transition: all 0.15s ease;
        }

        .close-button:hover:not(:disabled) {
          background-color: #f3f4f6;
          color: #111827;
        }

        .close-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .merge-preview-content {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
        }

        .merge-info {
          margin-bottom: 1.5rem;
        }

        .merge-branches {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          justify-content: center;
        }

        .branch-badge {
          padding: 0.375rem 0.75rem;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .branch-badge.source {
          background-color: #dbeafe;
          color: #1e40af;
        }

        .branch-badge.target {
          background-color: #dcfce7;
          color: #166534;
        }

        .merge-arrow {
          font-size: 1.25rem;
          color: #6b7280;
        }

        .conflict-warning {
          display: flex;
          gap: 0.75rem;
          padding: 1rem;
          background-color: #fef3c7;
          border: 1px solid #fbbf24;
          border-radius: 0.375rem;
          margin-bottom: 1.5rem;
        }

        .warning-icon {
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .conflict-warning strong {
          display: block;
          color: #92400e;
          margin-bottom: 0.25rem;
        }

        .conflict-warning p {
          margin: 0;
          font-size: 0.875rem;
          color: #78350f;
        }

        .changes-summary {
          margin-bottom: 1.5rem;
        }

        .changes-summary h4 {
          margin: 0 0 0.75rem 0;
          font-size: 1rem;
          font-weight: 600;
          color: #111827;
        }

        .summary-text {
          margin: 0 0 1rem 0;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          gap: 0.75rem;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.75rem;
          border-radius: 0.375rem;
          gap: 0.25rem;
        }

        .stat-item.added {
          background-color: #dcfce7;
          color: #166534;
        }

        .stat-item.removed {
          background-color: #fee2e2;
          color: #991b1b;
        }

        .stat-item.modified {
          background-color: #fef3c7;
          color: #92400e;
        }

        .stat-icon {
          font-size: 1.25rem;
          font-weight: 700;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .stat-label {
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
        }

        .changes-details {
          margin-bottom: 1.5rem;
          max-height: 200px;
          overflow-y: auto;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          padding: 1rem;
        }

        .change-section {
          margin-bottom: 1rem;
        }

        .change-section:last-child {
          margin-bottom: 0;
        }

        .change-title {
          margin: 0 0 0.5rem 0;
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .change-title.added {
          color: #166534;
        }

        .change-title.removed {
          color: #991b1b;
        }

        .change-title.modified {
          color: #92400e;
        }

        .card-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .card-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.25rem 0;
          font-size: 0.875rem;
        }

        .card-count {
          font-weight: 600;
          font-family: monospace;
          min-width: 3rem;
        }

        .card-name {
          color: #374151;
        }

        .merge-message-section {
          margin-bottom: 1rem;
        }

        .merge-message-section label {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          color: #374151;
        }

        .merge-message-input {
          width: 100%;
          padding: 0.625rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          font-family: inherit;
          resize: vertical;
          transition: border-color 0.15s ease;
        }

        .merge-message-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .merge-message-input:disabled {
          background-color: #f3f4f6;
          cursor: not-allowed;
        }

        .message-hint {
          margin-top: 0.375rem;
          font-size: 0.75rem;
          color: #6b7280;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background-color: #fee2e2;
          border: 1px solid #fca5a5;
          border-radius: 0.375rem;
          color: #991b1b;
          font-size: 0.875rem;
        }

        .error-icon {
          font-size: 1rem;
          flex-shrink: 0;
        }

        .merge-preview-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          border-top: 1px solid #e5e7eb;
          background-color: #f9fafb;
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

        .btn-primary {
          background-color: #3b82f6;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #2563eb;
        }

        .btn:active:not(:disabled) {
          transform: scale(0.98);
        }
      `}</style>
    </>
  );
};
