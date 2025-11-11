import React, { useState, useEffect } from 'react';
import { Spinner } from '../Spinner';

interface BranchCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateBranch: (branchName: string) => Promise<void>;
  existingBranches: string[];
  currentBranch: string;
}

/**
 * Modal for creating a new Git branch
 * Based on Requirements 5.1, 5.2, 5.3, 5.4, 5.5
 */
export const BranchCreationModal: React.FC<BranchCreationModalProps> = ({
  isOpen,
  onClose,
  onCreateBranch,
  existingBranches,
  currentBranch,
}) => {
  const [branchName, setBranchName] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setBranchName('');
      setValidationError(null);
      setCreateError(null);
      setIsCreating(false);
    }
  }, [isOpen]);

  // Validate branch name follows Git conventions
  const validateBranchName = (name: string): string | null => {
    // Empty name
    if (!name || name.trim().length === 0) {
      return 'Branch name cannot be empty';
    }

    // Trim the name for validation
    const trimmedName = name.trim();

    // Check length (Git has a limit, but we'll use a reasonable one)
    if (trimmedName.length > 100) {
      return 'Branch name is too long (max 100 characters)';
    }

    // Check for spaces
    if (/\s/.test(trimmedName)) {
      return 'Branch name cannot contain spaces';
    }

    // Check for invalid characters
    // Git branch names cannot contain: ~, ^, :, \, ?, *, [, @{, .., //
    if (/[~^:\\?*\[\]@{}]/.test(trimmedName)) {
      return 'Branch name contains invalid characters (~^:\\?*[]@{})';
    }

    // Cannot start with a dot or hyphen
    if (/^[.-]/.test(trimmedName)) {
      return 'Branch name cannot start with a dot or hyphen';
    }

    // Cannot end with a dot or slash
    if (/[./]$/.test(trimmedName)) {
      return 'Branch name cannot end with a dot or slash';
    }

    // Cannot contain consecutive dots
    if (/\.\./.test(trimmedName)) {
      return 'Branch name cannot contain consecutive dots (..)';
    }

    // Cannot contain double slashes
    if (/\/\//.test(trimmedName)) {
      return 'Branch name cannot contain double slashes (//)';
    }

    // Check for duplicate branch names (case-insensitive)
    const lowerName = trimmedName.toLowerCase();
    const isDuplicate = existingBranches.some(
      (existing) => existing.toLowerCase() === lowerName
    );
    if (isDuplicate) {
      return 'A branch with this name already exists';
    }

    return null;
  };

  // Handle input change with real-time validation
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBranchName(value);
    
    // Clear create error when user starts typing
    if (createError) {
      setCreateError(null);
    }

    // Validate on change
    const error = validateBranchName(value);
    setValidationError(error);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Final validation
    const error = validateBranchName(branchName);
    if (error) {
      setValidationError(error);
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      await onCreateBranch(branchName.trim());
      // Success - modal will be closed by parent
    } catch (error) {
      console.error('Failed to create branch:', error);
      setCreateError(
        error instanceof Error ? error.message : 'Failed to create branch'
      );
      setIsCreating(false);
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isCreating) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, isCreating, onClose]);

  if (!isOpen) {
    return null;
  }

  const isValid = branchName.trim().length > 0 && !validationError;

  return (
    <>
      <div className="modal-backdrop" onClick={isCreating ? undefined : onClose} />
      
      <div className="branch-creation-modal">
        <div className="modal-header">
          <h2>Create New Branch</h2>
          <button
            className="close-button"
            onClick={onClose}
            disabled={isCreating}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-content">
            <p className="modal-description">
              Create a new branch from <strong>{currentBranch}</strong> to work on
              deck variants without affecting the main version.
            </p>

            <div className="form-group">
              <label htmlFor="branch-name">Branch Name</label>
              <input
                id="branch-name"
                type="text"
                className={`form-input ${validationError ? 'error' : ''}`}
                value={branchName}
                onChange={handleInputChange}
                placeholder="e.g., aggro-variant, budget-version"
                disabled={isCreating}
                autoFocus
                autoComplete="off"
              />
              
              {validationError && (
                <div className="validation-error">
                  <span className="error-icon">⚠</span>
                  <span>{validationError}</span>
                </div>
              )}

              <div className="input-hint">
                Use lowercase letters, numbers, hyphens, and slashes. No spaces or
                special characters.
              </div>
            </div>

            {createError && (
              <div className="create-error">
                <span className="error-icon">✕</span>
                <span>{createError}</span>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!isValid || isCreating}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              {isCreating && <Spinner size="sm" color="white" />}
              {isCreating ? 'Creating...' : 'Create Branch'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .modal-backdrop {
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

        .branch-creation-modal {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 90%;
          max-width: 500px;
          background-color: #ffffff;
          border-radius: 0.5rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
                      0 10px 10px -5px rgba(0, 0, 0, 0.04);
          z-index: 1201;
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

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 2rem;
          line-height: 1;
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

        .modal-content {
          padding: 1.5rem;
        }

        .modal-description {
          margin: 0 0 1.5rem 0;
          font-size: 0.875rem;
          color: #6b7280;
          line-height: 1.5;
        }

        .modal-description strong {
          color: #111827;
          font-weight: 600;
        }

        .form-group {
          margin-bottom: 0;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
        }

        .form-input {
          width: 100%;
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          transition: all 0.15s ease;
          font-family: inherit;
        }

        .form-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-input.error {
          border-color: #ef4444;
        }

        .form-input.error:focus {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }

        .form-input:disabled {
          background-color: #f9fafb;
          cursor: not-allowed;
        }

        .validation-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.5rem;
          padding: 0.5rem 0.75rem;
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 0.375rem;
          font-size: 0.8125rem;
          color: #991b1b;
        }

        .error-icon {
          font-size: 1rem;
          line-height: 1;
        }

        .input-hint {
          margin-top: 0.5rem;
          font-size: 0.75rem;
          color: #6b7280;
          line-height: 1.4;
        }

        .create-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1rem;
          padding: 0.75rem 1rem;
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          color: #991b1b;
        }

        .modal-footer {
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
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn:active:not(:disabled) {
          transform: scale(0.98);
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

        .spinner-small {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};
