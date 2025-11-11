import React, { useState, useMemo } from 'react';
import Modal from '../Modal';
import { Spinner } from '../Spinner';
import type { Deck, DeckCard } from '../../types/deck';
import type { DeckDiff } from '../../types/versioning';
import { validateDeck } from '../../utils/deckValidation';

interface MergeConflictResolverProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: DeckDiff;
  sourceBranch: string;
  targetBranch: string;
  sourceDeck: Deck;
  targetDeck: Deck;
  onResolve: (resolvedDeck: Deck, mergeMessage: string) => Promise<void>;
}

type ResolutionChoice = 'source' | 'target' | 'both';

interface CardResolution {
  cardId: string;
  choice: ResolutionChoice;
}

/**
 * Component for resolving merge conflicts between branches
 * Based on Requirements 7.3, 7.4
 */
export const MergeConflictResolver: React.FC<MergeConflictResolverProps> = ({
  isOpen,
  onClose,
  conflicts,
  sourceBranch,
  targetBranch,
  sourceDeck,
  targetDeck,
  onResolve,
}) => {
  const [resolutions, setResolutions] = useState<Map<string, CardResolution>>(new Map());
  const [mergeMessage, setMergeMessage] = useState(`Merge ${sourceBranch} into ${targetBranch}`);
  const [isResolving, setIsResolving] = useState(false);

  // Initialize resolutions with default choices (target)
  useMemo(() => {
    const initialResolutions = new Map<string, CardResolution>();
    
    // For added cards (source has, target doesn't)
    conflicts.added.forEach(card => {
      initialResolutions.set(`added-${card.id}`, {
        cardId: card.id,
        choice: 'source',
      });
    });
    
    // For removed cards (target has, source doesn't)
    conflicts.removed.forEach(card => {
      initialResolutions.set(`removed-${card.id}`, {
        cardId: card.id,
        choice: 'target',
      });
    });
    
    // For modified cards (both have but different counts)
    conflicts.modified.forEach(mod => {
      initialResolutions.set(`modified-${mod.card.id}`, {
        cardId: mod.card.id,
        choice: 'source',
      });
    });
    
    // For special slots
    if (conflicts.specialSlots.commander) {
      initialResolutions.set('special-commander', {
        cardId: 'commander',
        choice: 'source',
      });
    }
    if (conflicts.specialSlots.legend) {
      initialResolutions.set('special-legend', {
        cardId: 'legend',
        choice: 'source',
      });
    }
    if (conflicts.specialSlots.battlefield) {
      initialResolutions.set('special-battlefield', {
        cardId: 'battlefield',
        choice: 'source',
      });
    }
    
    setResolutions(initialResolutions);
  }, [conflicts]);

  const handleResolutionChange = (key: string, choice: ResolutionChoice) => {
    setResolutions(prev => {
      const updated = new Map(prev);
      const existing = updated.get(key);
      if (existing) {
        updated.set(key, { ...existing, choice });
      }
      return updated;
    });
  };

  const handleResolve = async () => {
    setIsResolving(true);
    try {
      const resolvedDeck = buildResolvedDeck();
      await onResolve(resolvedDeck, mergeMessage);
    } catch (error) {
      console.error('Failed to resolve merge:', error);
    } finally {
      setIsResolving(false);
    }
  };

  const buildResolvedDeck = (): Deck => {
    // Start with target deck as base
    const resolvedDeck: Deck = JSON.parse(JSON.stringify(targetDeck));
    const cardsMap = new Map<string, DeckCard>();
    
    // Build initial cards map from target
    resolvedDeck.cards.forEach(card => cardsMap.set(card.id, card));

    // Apply resolutions for added cards
    conflicts.added.forEach(card => {
      const resolution = resolutions.get(`added-${card.id}`);
      if (resolution?.choice === 'source' || resolution?.choice === 'both') {
        cardsMap.set(card.id, { ...card });
      }
    });

    // Apply resolutions for removed cards
    conflicts.removed.forEach(card => {
      const resolution = resolutions.get(`removed-${card.id}`);
      if (resolution?.choice === 'source') {
        // Source removed it, so remove from target
        cardsMap.delete(card.id);
      }
      // If target or both, keep the card (it's already in cardsMap)
    });

    // Apply resolutions for modified cards
    conflicts.modified.forEach(mod => {
      const resolution = resolutions.get(`modified-${mod.card.id}`);
      const sourceCard = sourceDeck.cards.find(c => c.id === mod.card.id);
      const targetCard = targetDeck.cards.find(c => c.id === mod.card.id);
      
      if (resolution?.choice === 'source' && sourceCard) {
        cardsMap.set(mod.card.id, { ...sourceCard });
      } else if (resolution?.choice === 'target' && targetCard) {
        cardsMap.set(mod.card.id, { ...targetCard });
      } else if (resolution?.choice === 'both' && sourceCard && targetCard) {
        // For "both", use the higher count
        const maxCount = Math.max(sourceCard.count, targetCard.count);
        cardsMap.set(mod.card.id, { ...sourceCard, count: maxCount });
      }
    });

    // Update cards array
    resolvedDeck.cards = Array.from(cardsMap.values());

    // Apply special slot resolutions
    if (conflicts.specialSlots.commander) {
      const resolution = resolutions.get('special-commander');
      if (resolution?.choice === 'source') {
        resolvedDeck.commander = sourceDeck.commander;
      } else if (resolution?.choice === 'target') {
        resolvedDeck.commander = targetDeck.commander;
      }
    }

    if (conflicts.specialSlots.legend) {
      const resolution = resolutions.get('special-legend');
      if (resolution?.choice === 'source') {
        resolvedDeck.legend = sourceDeck.legend;
      } else if (resolution?.choice === 'target') {
        resolvedDeck.legend = targetDeck.legend;
      }
    }

    if (conflicts.specialSlots.battlefield) {
      const resolution = resolutions.get('special-battlefield');
      if (resolution?.choice === 'source') {
        resolvedDeck.battlefield = sourceDeck.battlefield;
      } else if (resolution?.choice === 'target') {
        resolvedDeck.battlefield = targetDeck.battlefield;
      }
    }

    return resolvedDeck;
  };

  // Calculate preview of resolved deck
  const previewDeck = useMemo(() => buildResolvedDeck(), [resolutions, sourceDeck, targetDeck, conflicts]);
  
  // Validate the preview deck
  const validation = useMemo(() => {
    const specialSlots: Record<string, any> = {};
    if (previewDeck.commander) specialSlots.commander = previewDeck.commander;
    if (previewDeck.legend) specialSlots.legend = previewDeck.legend;
    if (previewDeck.battlefield) specialSlots.battlefield = previewDeck.battlefield;
    
    return validateDeck(
      previewDeck.cards,
      previewDeck.game,
      previewDeck.format,
      specialSlots
    );
  }, [previewDeck]);

  const hasConflicts = conflicts.added.length > 0 || 
                       conflicts.removed.length > 0 || 
                       conflicts.modified.length > 0 ||
                       Object.keys(conflicts.specialSlots).length > 0;

  if (!hasConflicts) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Resolve Merge Conflicts">
      <div className="merge-conflict-resolver">
        {/* Header info */}
        <div className="merge-info">
          <div className="branch-info">
            <span className="branch-label">Merging:</span>
            <span className="branch-name source">{sourceBranch}</span>
            <span className="arrow">→</span>
            <span className="branch-name target">{targetBranch}</span>
          </div>
          <div className="conflict-count">
            {conflicts.added.length + conflicts.removed.length + conflicts.modified.length + 
             Object.keys(conflicts.specialSlots).length} conflict(s) to resolve
          </div>
        </div>

        {/* Conflict list */}
        <div className="conflicts-container">
          {/* Special slot conflicts */}
          {conflicts.specialSlots.commander && (
            <SpecialSlotConflict
              label="Commander"
              slotKey="special-commander"
              sourceCard={sourceDeck.commander}
              targetCard={targetDeck.commander}
              resolution={resolutions.get('special-commander')}
              onResolutionChange={handleResolutionChange}
            />
          )}

          {conflicts.specialSlots.legend && (
            <SpecialSlotConflict
              label="Legend"
              slotKey="special-legend"
              sourceCard={sourceDeck.legend}
              targetCard={targetDeck.legend}
              resolution={resolutions.get('special-legend')}
              onResolutionChange={handleResolutionChange}
            />
          )}

          {conflicts.specialSlots.battlefield && (
            <SpecialSlotConflict
              label="Battlefield"
              slotKey="special-battlefield"
              sourceCard={sourceDeck.battlefield}
              targetCard={targetDeck.battlefield}
              resolution={resolutions.get('special-battlefield')}
              onResolutionChange={handleResolutionChange}
            />
          )}

          {/* Card conflicts */}
          {conflicts.added.map(card => (
            <CardConflict
              key={`added-${card.id}`}
              conflictKey={`added-${card.id}`}
              card={card}
              conflictType="added"
              sourceBranch={sourceBranch}
              targetBranch={targetBranch}
              resolution={resolutions.get(`added-${card.id}`)}
              onResolutionChange={handleResolutionChange}
            />
          ))}

          {conflicts.removed.map(card => (
            <CardConflict
              key={`removed-${card.id}`}
              conflictKey={`removed-${card.id}`}
              card={card}
              conflictType="removed"
              sourceBranch={sourceBranch}
              targetBranch={targetBranch}
              resolution={resolutions.get(`removed-${card.id}`)}
              onResolutionChange={handleResolutionChange}
            />
          ))}

          {conflicts.modified.map(mod => (
            <ModifiedCardConflict
              key={`modified-${mod.card.id}`}
              conflictKey={`modified-${mod.card.id}`}
              card={mod.card}
              sourceCount={sourceDeck.cards.find(c => c.id === mod.card.id)?.count || 0}
              targetCount={targetDeck.cards.find(c => c.id === mod.card.id)?.count || 0}
              sourceBranch={sourceBranch}
              targetBranch={targetBranch}
              resolution={resolutions.get(`modified-${mod.card.id}`)}
              onResolutionChange={handleResolutionChange}
            />
          ))}
        </div>

        {/* Preview section */}
        <div className="preview-section">
          <h3 className="preview-title">Preview of Merged Deck</h3>
          <div className="preview-stats">
            <div className="stat">
              <span className="stat-label">Total Cards:</span>
              <span className="stat-value">{previewDeck.cards.length}</span>
            </div>
            {previewDeck.commander && (
              <div className="stat">
                <span className="stat-label">Commander:</span>
                <span className="stat-value">{previewDeck.commander.name || previewDeck.commander.id}</span>
              </div>
            )}
            {previewDeck.legend && (
              <div className="stat">
                <span className="stat-label">Legend:</span>
                <span className="stat-value">{previewDeck.legend.name || previewDeck.legend.id}</span>
              </div>
            )}
          </div>
        </div>

        {/* Validation warnings */}
        {(!validation.isValid || validation.warnings.length > 0) && (
          <div className="validation-section">
            {validation.errors.length > 0 && (
              <div className="validation-errors">
                <div className="validation-header error">⚠️ Errors</div>
                {validation.errors.map((error, idx) => (
                  <div key={idx} className="validation-message error">{error}</div>
                ))}
              </div>
            )}
            {validation.warnings.length > 0 && (
              <div className="validation-warnings">
                <div className="validation-header warning">⚠ Warnings</div>
                {validation.warnings.map((warning, idx) => (
                  <div key={idx} className="validation-message warning">{warning}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Merge message input */}
        <div className="merge-message-section">
          <label htmlFor="merge-message" className="merge-message-label">
            Merge Commit Message
          </label>
          <textarea
            id="merge-message"
            className="merge-message-input"
            value={mergeMessage}
            onChange={(e) => setMergeMessage(e.target.value)}
            placeholder="Describe this merge..."
            rows={3}
            maxLength={500}
          />
          <div className="character-count">
            {mergeMessage.length} / 500
          </div>
        </div>

        {/* Action buttons */}
        <div className="action-buttons">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isResolving}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleResolve}
            disabled={isResolving || !validation.isValid || mergeMessage.trim().length === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            {isResolving && <Spinner size="sm" color="white" />}
            {isResolving ? 'Resolving...' : 'Complete Merge'}
          </button>
        </div>

        <style>{`
          .merge-conflict-resolver {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            max-height: 80vh;
            overflow: hidden;
          }

          .merge-info {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            padding: 1rem;
            background-color: #fef3c7;
            border: 2px solid #fcd34d;
            border-radius: 0.5rem;
          }

          .branch-info {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.875rem;
          }

          .branch-label {
            font-weight: 600;
            color: #6b7280;
          }

          .branch-name {
            font-family: 'Courier New', monospace;
            font-weight: 600;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
          }

          .branch-name.source {
            background-color: #dbeafe;
            color: #1e40af;
          }

          .branch-name.target {
            background-color: #dcfce7;
            color: #166534;
          }

          .arrow {
            color: #9ca3af;
            font-weight: bold;
          }

          .conflict-count {
            font-size: 0.875rem;
            font-weight: 600;
            color: #92400e;
          }

          .conflicts-container {
            flex: 1;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 1rem;
            padding: 0.5rem;
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
            background-color: #f9fafb;
          }

          .preview-section {
            padding: 1rem;
            background-color: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 0.5rem;
          }

          .preview-title {
            font-size: 0.875rem;
            font-weight: 600;
            color: #374151;
            margin: 0 0 0.75rem 0;
          }

          .preview-stats {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
          }

          .stat {
            display: flex;
            gap: 0.5rem;
            font-size: 0.875rem;
          }

          .stat-label {
            font-weight: 600;
            color: #6b7280;
          }

          .stat-value {
            color: #374151;
          }

          .validation-section {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }

          .validation-errors,
          .validation-warnings {
            padding: 0.75rem;
            border-radius: 0.375rem;
          }

          .validation-errors {
            background-color: #fee2e2;
            border: 1px solid #fca5a5;
          }

          .validation-warnings {
            background-color: #fef3c7;
            border: 1px solid #fcd34d;
          }

          .validation-header {
            font-size: 0.875rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
          }

          .validation-header.error {
            color: #dc2626;
          }

          .validation-header.warning {
            color: #ca8a04;
          }

          .validation-message {
            font-size: 0.875rem;
            margin-bottom: 0.25rem;
          }

          .validation-message.error {
            color: #991b1b;
          }

          .validation-message.warning {
            color: #92400e;
          }

          .merge-message-section {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .merge-message-label {
            font-size: 0.875rem;
            font-weight: 600;
            color: #374151;
          }

          .merge-message-input {
            width: 100%;
            padding: 0.75rem;
            font-size: 0.875rem;
            font-family: inherit;
            border: 1px solid #d1d5db;
            border-radius: 0.375rem;
            resize: vertical;
          }

          .merge-message-input:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }

          .character-count {
            font-size: 0.75rem;
            color: #6b7280;
            text-align: right;
          }

          .action-buttons {
            display: flex;
            gap: 0.75rem;
            justify-content: flex-end;
          }

          .btn {
            padding: 0.625rem 1.25rem;
            font-size: 0.875rem;
            font-weight: 600;
            border: none;
            border-radius: 0.375rem;
            cursor: pointer;
            transition: all 0.15s ease;
          }

          .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .btn-secondary {
            background-color: #f3f4f6;
            color: #374151;
          }

          .btn-secondary:hover:not(:disabled) {
            background-color: #e5e7eb;
          }

          .btn-primary {
            background-color: #3b82f6;
            color: white;
          }

          .btn-primary:hover:not(:disabled) {
            background-color: #2563eb;
          }
        `}</style>
      </div>
    </Modal>
  );
};

/**
 * Component for displaying a card conflict with resolution options
 */
const CardConflict: React.FC<{
  conflictKey: string;
  card: DeckCard;
  conflictType: 'added' | 'removed';
  sourceBranch: string;
  targetBranch: string;
  resolution?: CardResolution;
  onResolutionChange: (key: string, choice: ResolutionChoice) => void;
}> = ({ conflictKey, card, conflictType, sourceBranch, targetBranch, resolution, onResolutionChange }) => {
  const getConflictDescription = () => {
    if (conflictType === 'added') {
      return `${sourceBranch} added this card, but it doesn't exist in ${targetBranch}`;
    } else {
      return `${sourceBranch} removed this card, but it still exists in ${targetBranch}`;
    }
  };

  return (
    <div className="card-conflict">
      <div className="conflict-header">
        <div className="conflict-type-badge">{conflictType}</div>
        <div className="card-name">{card.name || card.id}</div>
        <div className="card-count">{card.count}x</div>
      </div>

      {card.image_url && (
        <div className="card-image-preview">
          <img src={card.image_url} alt={card.name || card.id} loading="lazy" />
        </div>
      )}

      <div className="conflict-description">{getConflictDescription()}</div>

      <div className="resolution-options">
        <button
          className={`resolution-btn ${resolution?.choice === 'source' ? 'active' : ''}`}
          onClick={() => onResolutionChange(conflictKey, 'source')}
        >
          <div className="resolution-label">Keep {sourceBranch}</div>
          <div className="resolution-detail">
            {conflictType === 'added' ? 'Add this card' : 'Remove this card'}
          </div>
        </button>

        <button
          className={`resolution-btn ${resolution?.choice === 'target' ? 'active' : ''}`}
          onClick={() => onResolutionChange(conflictKey, 'target')}
        >
          <div className="resolution-label">Keep {targetBranch}</div>
          <div className="resolution-detail">
            {conflictType === 'added' ? "Don't add this card" : 'Keep this card'}
          </div>
        </button>

        {conflictType === 'added' && (
          <button
            className={`resolution-btn ${resolution?.choice === 'both' ? 'active' : ''}`}
            onClick={() => onResolutionChange(conflictKey, 'both')}
          >
            <div className="resolution-label">Keep Both</div>
            <div className="resolution-detail">Add to merged deck</div>
          </button>
        )}
      </div>

      <style>{`
        .card-conflict {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 1rem;
          background-color: white;
          border: 2px solid #fcd34d;
          border-radius: 0.5rem;
        }

        .conflict-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .conflict-type-badge {
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          background-color: #fef3c7;
          color: #92400e;
          border-radius: 0.25rem;
        }

        .card-name {
          flex: 1;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }

        .card-count {
          font-size: 0.875rem;
          font-weight: 600;
          color: #6b7280;
        }

        .card-image-preview {
          width: 100px;
          height: 140px;
          border-radius: 0.375rem;
          overflow: hidden;
          border: 1px solid #d1d5db;
        }

        .card-image-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .conflict-description {
          font-size: 0.875rem;
          color: #6b7280;
          font-style: italic;
        }

        .resolution-options {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .resolution-btn {
          flex: 1;
          min-width: 120px;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          padding: 0.75rem;
          background-color: #f9fafb;
          border: 2px solid #d1d5db;
          border-radius: 0.375rem;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .resolution-btn:hover {
          background-color: #f3f4f6;
          border-color: #9ca3af;
        }

        .resolution-btn.active {
          background-color: #dbeafe;
          border-color: #3b82f6;
        }

        .resolution-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }

        .resolution-detail {
          font-size: 0.75rem;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
};

/**
 * Component for displaying a modified card conflict with count differences
 */
const ModifiedCardConflict: React.FC<{
  conflictKey: string;
  card: DeckCard;
  sourceCount: number;
  targetCount: number;
  sourceBranch: string;
  targetBranch: string;
  resolution?: CardResolution;
  onResolutionChange: (key: string, choice: ResolutionChoice) => void;
}> = ({ conflictKey, card, sourceCount, targetCount, sourceBranch, targetBranch, resolution, onResolutionChange }) => {
  return (
    <div className="card-conflict modified">
      <div className="conflict-header">
        <div className="conflict-type-badge modified">modified</div>
        <div className="card-name">{card.name || card.id}</div>
      </div>

      {card.image_url && (
        <div className="card-image-preview">
          <img src={card.image_url} alt={card.name || card.id} loading="lazy" />
        </div>
      )}

      <div className="conflict-description">
        Both branches modified the count: {targetBranch} has {targetCount}x, {sourceBranch} has {sourceCount}x
      </div>

      <div className="resolution-options">
        <button
          className={`resolution-btn ${resolution?.choice === 'source' ? 'active' : ''}`}
          onClick={() => onResolutionChange(conflictKey, 'source')}
        >
          <div className="resolution-label">Keep {sourceBranch}</div>
          <div className="resolution-detail">Use {sourceCount}x</div>
        </button>

        <button
          className={`resolution-btn ${resolution?.choice === 'target' ? 'active' : ''}`}
          onClick={() => onResolutionChange(conflictKey, 'target')}
        >
          <div className="resolution-label">Keep {targetBranch}</div>
          <div className="resolution-detail">Use {targetCount}x</div>
        </button>

        <button
          className={`resolution-btn ${resolution?.choice === 'both' ? 'active' : ''}`}
          onClick={() => onResolutionChange(conflictKey, 'both')}
        >
          <div className="resolution-label">Keep Both</div>
          <div className="resolution-detail">Use {Math.max(sourceCount, targetCount)}x (higher)</div>
        </button>
      </div>

      <style>{`
        .card-conflict.modified {
          border-color: #fcd34d;
        }

        .conflict-type-badge.modified {
          background-color: #fef3c7;
          color: #92400e;
        }
      `}</style>
    </div>
  );
};

/**
 * Component for displaying special slot conflicts (commander, legend, battlefield)
 */
const SpecialSlotConflict: React.FC<{
  label: string;
  slotKey: string;
  sourceCard?: DeckCard;
  targetCard?: DeckCard;
  resolution?: CardResolution;
  onResolutionChange: (key: string, choice: ResolutionChoice) => void;
}> = ({ label, slotKey, sourceCard, targetCard, resolution, onResolutionChange }) => {
  return (
    <div className="special-slot-conflict">
      <div className="conflict-header">
        <div className="conflict-type-badge special">special slot</div>
        <div className="slot-label">{label}</div>
      </div>

      <div className="slot-comparison">
        <div className="slot-option">
          <div className="slot-option-label">Source</div>
          {sourceCard ? (
            <>
              {sourceCard.image_url && (
                <div className="slot-card-image">
                  <img src={sourceCard.image_url} alt={sourceCard.name || sourceCard.id} loading="lazy" />
                </div>
              )}
              <div className="slot-card-name">{sourceCard.name || sourceCard.id}</div>
            </>
          ) : (
            <div className="slot-empty">Empty</div>
          )}
        </div>

        <div className="slot-vs">vs</div>

        <div className="slot-option">
          <div className="slot-option-label">Target</div>
          {targetCard ? (
            <>
              {targetCard.image_url && (
                <div className="slot-card-image">
                  <img src={targetCard.image_url} alt={targetCard.name || targetCard.id} loading="lazy" />
                </div>
              )}
              <div className="slot-card-name">{targetCard.name || targetCard.id}</div>
            </>
          ) : (
            <div className="slot-empty">Empty</div>
          )}
        </div>
      </div>

      <div className="resolution-options">
        <button
          className={`resolution-btn ${resolution?.choice === 'source' ? 'active' : ''}`}
          onClick={() => onResolutionChange(slotKey, 'source')}
        >
          <div className="resolution-label">Keep Source</div>
          <div className="resolution-detail">
            {sourceCard ? sourceCard.name || sourceCard.id : 'Empty'}
          </div>
        </button>

        <button
          className={`resolution-btn ${resolution?.choice === 'target' ? 'active' : ''}`}
          onClick={() => onResolutionChange(slotKey, 'target')}
        >
          <div className="resolution-label">Keep Target</div>
          <div className="resolution-detail">
            {targetCard ? targetCard.name || targetCard.id : 'Empty'}
          </div>
        </button>
      </div>

      <style>{`
        .special-slot-conflict {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 1rem;
          background-color: white;
          border: 2px solid #c084fc;
          border-radius: 0.5rem;
        }

        .conflict-type-badge.special {
          background-color: #f3e8ff;
          color: #7e22ce;
        }

        .slot-label {
          flex: 1;
          font-size: 0.875rem;
          font-weight: 700;
          color: #374151;
          text-transform: uppercase;
        }

        .slot-comparison {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .slot-option {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background-color: #f9fafb;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
        }

        .slot-option-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
        }

        .slot-card-image {
          width: 80px;
          height: 112px;
          border-radius: 0.375rem;
          overflow: hidden;
          border: 1px solid #d1d5db;
        }

        .slot-card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .slot-card-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          text-align: center;
        }

        .slot-empty {
          padding: 2rem 1rem;
          font-size: 0.875rem;
          font-style: italic;
          color: #9ca3af;
        }

        .slot-vs {
          font-size: 1rem;
          font-weight: bold;
          color: #9ca3af;
        }
      `}</style>
    </div>
  );
};
