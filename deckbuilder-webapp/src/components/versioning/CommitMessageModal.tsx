import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { CommitTemplates } from './CommitTemplates';
import { RecentMessages } from './RecentMessages';
import { CardChangeAnnotator } from './CardChangeAnnotator';
import { Spinner } from '../Spinner';
import type { CommitTemplate, DeckDiff, CardChangeAnnotation } from '../../types/versioning';
import {
  validateCommitMessage,
  extractPlaceholders,
  hasUnfilledPlaceholders,
} from '../../utils/commitMessageUtils';
import { deckDiffService } from '../../services/deckDiff';

interface CommitMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCommit: (message: string, annotations?: CardChangeAnnotation[]) => Promise<void>;
  suggestedMessage?: string;
  diff?: DeckDiff;
  recentMessages?: string[];
}

/**
 * Modal component for entering commit messages when saving deck changes
 * Based on Requirements 1.1, 1.2, 1.3, 9.4
 */
export const CommitMessageModal: React.FC<CommitMessageModalProps> = ({
  isOpen,
  onClose,
  onCommit,
  suggestedMessage = '',
  diff,
  recentMessages = [],
}) => {
  const [message, setMessage] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [annotations, setAnnotations] = useState<CardChangeAnnotation[]>([]);

  // Initialize message with suggested message when modal opens
  useEffect(() => {
    if (isOpen && suggestedMessage) {
      setMessage(suggestedMessage);
      setSelectedTemplateId(undefined);
    }
  }, [isOpen, suggestedMessage]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setMessage('');
      setSelectedTemplateId(undefined);
      setIsSubmitting(false);
      setError(undefined);
      setAnnotations([]);
    }
  }, [isOpen]);

  const handleTemplateSelect = (template: CommitTemplate) => {
    setSelectedTemplateId(template.id);
    
    // Check if template has placeholders
    const placeholders = extractPlaceholders(template.template);
    
    if (placeholders.length === 0) {
      // No placeholders, use template as-is
      setMessage(template.template);
    } else {
      // Has placeholders, show template with hints
      setMessage(template.template);
    }
    
    setError(undefined);
  };

  const handleRecentMessageSelect = (recentMessage: string) => {
    setMessage(recentMessage);
    setSelectedTemplateId(undefined);
    setError(undefined);
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    setError(undefined);
  };

  const handleCommit = async () => {
    // Validate message
    const validation = validateCommitMessage(message);
    
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    // Check for unfilled placeholders
    if (hasUnfilledPlaceholders(message)) {
      setError('Please fill in all placeholders (text in {curly braces})');
      return;
    }

    setIsSubmitting(true);
    setError(undefined);

    try {
      // Filter out annotations without reasons (optional annotations)
      const filledAnnotations = annotations.filter(a => a.reason && a.reason.trim());
      await onCommit(message.trim(), filledAnnotations.length > 0 ? filledAnnotations : undefined);
      // Modal will be closed by parent component
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to commit changes');
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleCommit();
    }
  };

  const charCount = message.length;
  const isValid = charCount >= 1 && charCount <= 500;
  const changesSummary = diff ? deckDiffService.summarizeChanges(diff) : null;
  
  // Calculate annotation summary
  const annotatedCount = annotations.filter(a => a.reason && a.reason.trim()).length;
  const totalChanges = diff ? (diff.added.length + diff.removed.length + diff.modified.length) : 0;

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title="Commit Changes">
      <div className="commit-message-modal">
        {/* Change preview */}
        {changesSummary && (
          <div className="changes-preview">
            <label className="changes-preview-label">Changes:</label>
            <div className="changes-preview-content">{changesSummary}</div>
            {annotatedCount > 0 && (
              <div className="annotation-summary">
                📝 {annotatedCount} of {totalChanges} changes annotated
              </div>
            )}
          </div>
        )}

        {/* Recent messages */}
        {recentMessages.length > 0 && (
          <RecentMessages
            messages={recentMessages}
            onSelectMessage={handleRecentMessageSelect}
          />
        )}

        {/* Templates */}
        <CommitTemplates
          onSelectTemplate={handleTemplateSelect}
          selectedTemplateId={selectedTemplateId}
        />

        {/* Card change annotations */}
        {diff && totalChanges > 0 && (
          <CardChangeAnnotator
            diff={diff}
            annotations={annotations}
            onAnnotationsChange={setAnnotations}
          />
        )}

        {/* Message input */}
        <div className="message-input-container">
          <label htmlFor="commit-message" className="message-label">
            Commit Message
          </label>
          
          <textarea
            id="commit-message"
            className={`message-textarea ${error ? 'error' : ''}`}
            value={message}
            onChange={handleMessageChange}
            onKeyDown={handleKeyDown}
            placeholder="Describe what changed and why..."
            rows={4}
            disabled={isSubmitting}
            autoFocus
          />

          {/* Character counter */}
          <div className="message-footer">
            <div className={`char-counter ${!isValid ? 'invalid' : ''}`}>
              {charCount} / 500 characters
            </div>
            
            {error && <div className="error-message">{error}</div>}
          </div>
        </div>

        {/* Action buttons */}
        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleCommit}
            disabled={!isValid || isSubmitting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            {isSubmitting && <Spinner size="sm" color="white" />}
            {isSubmitting ? 'Committing...' : 'Commit'}
          </button>
        </div>

        <style>{`
          .commit-message-modal {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }

          .changes-preview {
            padding: 0.75rem;
            background-color: #f3f4f6;
            border: 1px solid #e5e7eb;
            border-radius: 0.375rem;
          }

          .changes-preview-label {
            display: block;
            font-weight: 600;
            font-size: 0.875rem;
            color: #6b7280;
            margin-bottom: 0.25rem;
          }

          .changes-preview-content {
            font-size: 0.875rem;
            color: #374151;
          }

          .annotation-summary {
            margin-top: 0.5rem;
            padding-top: 0.5rem;
            border-top: 1px solid #e5e7eb;
            font-size: 0.75rem;
            color: #6b7280;
            font-weight: 500;
          }

          .message-input-container {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .message-label {
            font-weight: 600;
            color: #374151;
          }

          .message-textarea {
            width: 100%;
            padding: 0.75rem;
            font-size: 0.875rem;
            font-family: inherit;
            border: 1px solid #d1d5db;
            border-radius: 0.375rem;
            resize: vertical;
            min-height: 100px;
            transition: border-color 0.15s ease;
          }

          .message-textarea:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }

          .message-textarea.error {
            border-color: #ef4444;
          }

          .message-textarea.error:focus {
            border-color: #ef4444;
            box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
          }

          .message-textarea:disabled {
            background-color: #f9fafb;
            cursor: not-allowed;
          }

          .message-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 1rem;
          }

          .char-counter {
            font-size: 0.75rem;
            color: #6b7280;
          }

          .char-counter.invalid {
            color: #ef4444;
            font-weight: 600;
          }

          .error-message {
            font-size: 0.75rem;
            color: #ef4444;
            font-weight: 500;
          }

          .modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 0.75rem;
            margin-top: 0.5rem;
            padding-top: 1rem;
            border-top: 1px solid #e5e7eb;
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
      </div>
    </Modal>
  );
};
