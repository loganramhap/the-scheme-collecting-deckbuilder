import React, { useState } from 'react';
import Modal from '../Modal';
import type { Deck } from '../../types/deck';
import type { AnnotatedCommit, DeckDiff, CardChangeAnnotation } from '../../types/versioning';
import { deckDiffService } from '../../services/deckDiff';

interface DiffViewerProps {
  isOpen: boolean;
  onClose: () => void;
  oldDeck: Deck;
  newDeck: Deck;
  oldCommit: AnnotatedCommit;
  newCommit: AnnotatedCommit;
}

type ViewMode = 'side-by-side' | 'unified';

/**
 * Component for displaying visual comparison of two deck versions
 * Based on Requirements 3.2, 3.3, 3.4, 3.5, 3.6, 11.5
 */
export const DiffViewer: React.FC<DiffViewerProps> = ({
  isOpen,
  onClose,
  oldDeck,
  newDeck,
  oldCommit,
  newCommit,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('side-by-side');
  const [showInlineAnnotations, setShowInlineAnnotations] = useState<boolean>(false);
  
  // Calculate diff between the two decks
  const diff = deckDiffService.calculateDiff(oldDeck, newDeck);
  
  // Get annotations from the new commit (most recent changes)
  const annotations = newCommit.cardAnnotations || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Compare Versions">
      <div className="diff-viewer">
        {/* Commit info header */}
        <div className="diff-header">
          <div className="commit-info">
            <div className="commit-label">Old Version</div>
            <div className="commit-sha">{oldCommit.sha.substring(0, 7)}</div>
            <div className="commit-message">{oldCommit.message}</div>
            <div className="commit-date">
              {new Date(oldCommit.author.date).toLocaleDateString()}
            </div>
          </div>
          <div className="commit-separator">→</div>
          <div className="commit-info">
            <div className="commit-label">New Version</div>
            <div className="commit-sha">{newCommit.sha.substring(0, 7)}</div>
            <div className="commit-message">{newCommit.message}</div>
            <div className="commit-date">
              {new Date(newCommit.author.date).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Summary statistics */}
        <div className="diff-summary">
          <div className="summary-stat added">
            <span className="stat-value">{diff.added.length}</span>
            <span className="stat-label">Added</span>
          </div>
          <div className="summary-stat removed">
            <span className="stat-value">{diff.removed.length}</span>
            <span className="stat-label">Removed</span>
          </div>
          <div className="summary-stat modified">
            <span className="stat-value">{diff.modified.length}</span>
            <span className="stat-label">Modified</span>
          </div>
        </div>

        {/* View toggle button */}
        <div className="view-controls">
          <button
            className={`view-toggle-btn ${viewMode === 'side-by-side' ? 'active' : ''}`}
            onClick={() => setViewMode('side-by-side')}
          >
            Side by Side
          </button>
          <button
            className={`view-toggle-btn ${viewMode === 'unified' ? 'active' : ''}`}
            onClick={() => setViewMode('unified')}
          >
            Unified
          </button>
          <button
            className={`view-toggle-btn annotation-toggle ${showInlineAnnotations ? 'active' : ''}`}
            onClick={() => setShowInlineAnnotations(!showInlineAnnotations)}
            title="Toggle inline annotations"
          >
            {showInlineAnnotations ? '📝 Hide Annotations' : '📝 Show Annotations'}
          </button>
        </div>

        {/* Diff content */}
        <div className="diff-content">
          {viewMode === 'side-by-side' ? (
            <SideBySideView 
              diff={diff} 
              annotations={annotations}
              showInlineAnnotations={showInlineAnnotations}
            />
          ) : (
            <UnifiedView 
              diff={diff}
              annotations={annotations}
              showInlineAnnotations={showInlineAnnotations}
            />
          )}
        </div>

        <style>{`
          .diff-viewer {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            max-height: 80vh;
            overflow: hidden;
          }

          .diff-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem;
            background-color: #f9fafb;
            border-radius: 0.5rem;
            border: 1px solid #e5e7eb;
          }

          .commit-info {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
          }

          .commit-label {
            font-size: 0.75rem;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
          }

          .commit-sha {
            font-family: 'Courier New', monospace;
            font-size: 0.875rem;
            font-weight: 600;
            color: #374151;
          }

          .commit-message {
            font-size: 0.875rem;
            color: #374151;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .commit-date {
            font-size: 0.75rem;
            color: #9ca3af;
          }

          .commit-separator {
            font-size: 1.5rem;
            color: #9ca3af;
            font-weight: bold;
          }

          .diff-summary {
            display: flex;
            gap: 1rem;
            padding: 1rem;
            background-color: #f9fafb;
            border-radius: 0.5rem;
            border: 1px solid #e5e7eb;
          }

          .summary-stat {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.25rem;
            padding: 0.75rem;
            border-radius: 0.375rem;
          }

          .summary-stat.added {
            background-color: #dcfce7;
            border: 1px solid #86efac;
          }

          .summary-stat.removed {
            background-color: #fee2e2;
            border: 1px solid #fca5a5;
          }

          .summary-stat.modified {
            background-color: #fef3c7;
            border: 1px solid #fcd34d;
          }

          .stat-value {
            font-size: 1.5rem;
            font-weight: 700;
          }

          .summary-stat.added .stat-value {
            color: #16a34a;
          }

          .summary-stat.removed .stat-value {
            color: #dc2626;
          }

          .summary-stat.modified .stat-value {
            color: #ca8a04;
          }

          .stat-label {
            font-size: 0.75rem;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
          }

          .view-controls {
            display: flex;
            gap: 0.5rem;
            padding: 0.5rem;
            background-color: #f3f4f6;
            border-radius: 0.5rem;
          }

          .view-toggle-btn {
            flex: 1;
            padding: 0.5rem 1rem;
            font-size: 0.875rem;
            font-weight: 500;
            background-color: white;
            color: #6b7280;
            border: 1px solid #d1d5db;
            border-radius: 0.375rem;
            cursor: pointer;
            transition: all 0.15s ease;
          }

          .view-toggle-btn:hover {
            background-color: #f9fafb;
            border-color: #9ca3af;
          }

          .view-toggle-btn.active {
            background-color: #3b82f6;
            color: white;
            border-color: #3b82f6;
          }

          .view-toggle-btn.annotation-toggle {
            flex: 0 0 auto;
            min-width: fit-content;
          }

          .view-toggle-btn.annotation-toggle.active {
            background-color: #8b5cf6;
            border-color: #8b5cf6;
          }

          .diff-content {
            flex: 1;
            overflow-y: auto;
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
            background-color: white;
          }
        `}</style>
      </div>
    </Modal>
  );
};

/**
 * Side-by-side view showing old and new deck versions
 */
const SideBySideView: React.FC<{
  diff: DeckDiff;
  annotations: CardChangeAnnotation[];
  showInlineAnnotations: boolean;
}> = ({ diff, annotations, showInlineAnnotations }) => {
  // Helper to find annotation for a card
  const findAnnotation = (cardId: string, cardName: string): CardChangeAnnotation | undefined => {
    return annotations.find(
      (a) => a.cardId === cardId || a.cardName === cardName
    );
  };
  return (
    <div className="side-by-side-view">
      {/* Special slots section */}
      {(diff.specialSlots.commander || diff.specialSlots.legend || diff.specialSlots.battlefield) && (
        <div className="special-slots-section">
          <h3 className="section-title">Special Slots</h3>
          
          {diff.specialSlots.commander && (
            <SpecialSlotDiff
              label="Commander"
              oldCard={diff.specialSlots.commander.old}
              newCard={diff.specialSlots.commander.new}
            />
          )}
          
          {diff.specialSlots.legend && (
            <SpecialSlotDiff
              label="Legend"
              oldCard={diff.specialSlots.legend.old}
              newCard={diff.specialSlots.legend.new}
            />
          )}
          
          {diff.specialSlots.battlefield && (
            <SpecialSlotDiff
              label="Battlefield"
              oldCard={diff.specialSlots.battlefield.old}
              newCard={diff.specialSlots.battlefield.new}
            />
          )}
        </div>
      )}

      {/* Main deck changes */}
      <div className="deck-changes-section">
        <h3 className="section-title">Deck Changes</h3>
        
        <div className="side-by-side-columns">
          <div className="column old-column">
            <div className="column-header">Old Version</div>
            <div className="column-content">
              {/* Removed cards */}
              {diff.removed.map((card) => (
                <CardDiffItem
                  key={`removed-${card.id}`}
                  card={card}
                  changeType="removed"
                  annotation={findAnnotation(card.id, card.name || card.id)}
                  showInlineAnnotation={showInlineAnnotations}
                />
              ))}
              
              {/* Modified cards (old count) */}
              {diff.modified.map((mod) => (
                <CardDiffItem
                  key={`modified-old-${mod.card.id}`}
                  card={{ ...mod.card, count: mod.oldCount }}
                  changeType="modified"
                  annotation={findAnnotation(mod.card.id, mod.card.name || mod.card.id)}
                  showInlineAnnotation={showInlineAnnotations}
                />
              ))}
            </div>
          </div>

          <div className="column new-column">
            <div className="column-header">New Version</div>
            <div className="column-content">
              {/* Added cards */}
              {diff.added.map((card) => (
                <CardDiffItem
                  key={`added-${card.id}`}
                  card={card}
                  changeType="added"
                  annotation={findAnnotation(card.id, card.name || card.id)}
                  showInlineAnnotation={showInlineAnnotations}
                />
              ))}
              
              {/* Modified cards (new count) */}
              {diff.modified.map((mod) => (
                <CardDiffItem
                  key={`modified-new-${mod.card.id}`}
                  card={{ ...mod.card, count: mod.newCount }}
                  changeType="modified"
                  annotation={findAnnotation(mod.card.id, mod.card.name || mod.card.id)}
                  showInlineAnnotation={showInlineAnnotations}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .side-by-side-view {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          padding: 1rem;
        }

        .special-slots-section,
        .deck-changes-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .section-title {
          font-size: 1rem;
          font-weight: 600;
          color: #374151;
          margin: 0;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #e5e7eb;
        }

        .side-by-side-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .column {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .column-header {
          font-size: 0.875rem;
          font-weight: 600;
          color: #6b7280;
          padding: 0.5rem;
          background-color: #f9fafb;
          border-radius: 0.375rem;
          text-align: center;
        }

        .column-content {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
      `}</style>
    </div>
  );
};

/**
 * Unified view showing all changes in a single list
 */
const UnifiedView: React.FC<{
  diff: DeckDiff;
  annotations: CardChangeAnnotation[];
  showInlineAnnotations: boolean;
}> = ({ diff, annotations, showInlineAnnotations }) => {
  // Helper to find annotation for a card
  const findAnnotation = (cardId: string, cardName: string): CardChangeAnnotation | undefined => {
    return annotations.find(
      (a) => a.cardId === cardId || a.cardName === cardName
    );
  };
  return (
    <div className="unified-view">
      {/* Special slots section */}
      {(diff.specialSlots.commander || diff.specialSlots.legend || diff.specialSlots.battlefield) && (
        <div className="special-slots-section">
          <h3 className="section-title">Special Slots</h3>
          
          {diff.specialSlots.commander && (
            <SpecialSlotDiff
              label="Commander"
              oldCard={diff.specialSlots.commander.old}
              newCard={diff.specialSlots.commander.new}
            />
          )}
          
          {diff.specialSlots.legend && (
            <SpecialSlotDiff
              label="Legend"
              oldCard={diff.specialSlots.legend.old}
              newCard={diff.specialSlots.legend.new}
            />
          )}
          
          {diff.specialSlots.battlefield && (
            <SpecialSlotDiff
              label="Battlefield"
              oldCard={diff.specialSlots.battlefield.old}
              newCard={diff.specialSlots.battlefield.new}
            />
          )}
        </div>
      )}

      {/* Main deck changes */}
      <div className="deck-changes-section">
        <h3 className="section-title">Deck Changes</h3>
        
        <div className="unified-list">
          {/* Added cards */}
          {diff.added.map((card) => (
            <CardDiffItem
              key={`added-${card.id}`}
              card={card}
              changeType="added"
              annotation={findAnnotation(card.id, card.name || card.id)}
              showInlineAnnotation={showInlineAnnotations}
            />
          ))}
          
          {/* Removed cards */}
          {diff.removed.map((card) => (
            <CardDiffItem
              key={`removed-${card.id}`}
              card={card}
              changeType="removed"
              annotation={findAnnotation(card.id, card.name || card.id)}
              showInlineAnnotation={showInlineAnnotations}
            />
          ))}
          
          {/* Modified cards */}
          {diff.modified.map((mod) => (
            <CardDiffItem
              key={`modified-${mod.card.id}`}
              card={mod.card}
              changeType="modified"
              oldCount={mod.oldCount}
              newCount={mod.newCount}
              annotation={findAnnotation(mod.card.id, mod.card.name || mod.card.id)}
              showInlineAnnotation={showInlineAnnotations}
            />
          ))}
        </div>
      </div>

      <style>{`
        .unified-view {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          padding: 1rem;
        }

        .unified-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
      `}</style>
    </div>
  );
};

/**
 * Helper function to determine annotation category from reason text
 * Used for color-coding annotations by category
 */
const getAnnotationCategory = (reason: string): string => {
  const lowerReason = reason.toLowerCase();
  
  // Testing keywords
  if (lowerReason.includes('test') || lowerReason.includes('trying')) {
    return 'testing';
  }
  
  // Meta keywords
  if (lowerReason.includes('meta') || lowerReason.includes('counter') || lowerReason.includes('popular')) {
    return 'meta';
  }
  
  // Performance keywords
  if (lowerReason.includes('underperform') || lowerReason.includes('overperform') || 
      lowerReason.includes('win rate') || lowerReason.includes('performed')) {
    return 'performance';
  }
  
  // Synergy keywords
  if (lowerReason.includes('synergy') || lowerReason.includes('combo') || 
      lowerReason.includes('theme') || lowerReason.includes('tribal')) {
    return 'synergy';
  }
  
  // Cost keywords
  if (lowerReason.includes('mana') || lowerReason.includes('curve') || 
      lowerReason.includes('budget') || lowerReason.includes('cost') || 
      lowerReason.includes('efficient')) {
    return 'cost';
  }
  
  return 'custom';
};

/**
 * Component for displaying a single card in the diff view
 * Handles styling for added (green), removed (red), and modified (yellow) cards
 * Requirement 11.5: Display annotations with icons and tooltips
 */
const CardDiffItem: React.FC<{
  card: import('../../types/deck').DeckCard;
  changeType: 'added' | 'removed' | 'modified';
  oldCount?: number;
  newCount?: number;
  annotation?: CardChangeAnnotation;
  showInlineAnnotation?: boolean;
}> = ({ card, changeType, oldCount, newCount, annotation, showInlineAnnotation }) => {
  const getChangeIcon = () => {
    switch (changeType) {
      case 'added':
        return '+';
      case 'removed':
        return '-';
      case 'modified':
        return '~';
    }
  };

  const getCountDisplay = () => {
    if (changeType === 'modified' && oldCount !== undefined && newCount !== undefined) {
      return `${oldCount} → ${newCount}`;
    }
    return `${card.count}x`;
  };

  const getCategoryColor = (category?: string): string => {
    switch (category) {
      case 'testing':
        return '#3b82f6'; // blue
      case 'meta':
        return '#8b5cf6'; // purple
      case 'performance':
        return '#ef4444'; // red
      case 'synergy':
        return '#10b981'; // green
      case 'cost':
        return '#f59e0b'; // amber
      default:
        return '#6b7280'; // gray
    }
  };

  const hasAnnotation = annotation && annotation.reason;

  return (
    <div className={`card-diff-item ${changeType}`}>
      <div className="change-indicator">{getChangeIcon()}</div>
      
      {/* Card image */}
      {card.image_url && (
        <div className="card-image-container">
          <img
            src={card.image_url}
            alt={card.name || card.id}
            className="card-image"
            loading="lazy"
          />
        </div>
      )}
      
      <div className="card-info">
        <div className="card-name-row">
          <div className="card-name">{card.name || card.id}</div>
          {/* Annotation icon - Requirement 11.5 */}
          {hasAnnotation && (
            <div 
              className="annotation-icon"
              style={{ backgroundColor: getCategoryColor(annotation.reason ? getAnnotationCategory(annotation.reason) : undefined) }}
              title={annotation.reason}
            >
              📝
            </div>
          )}
        </div>
        <div className="card-count">{getCountDisplay()}</div>
        {/* Inline annotation display - Requirement 11.5 */}
        {hasAnnotation && showInlineAnnotation && (
          <div 
            className="inline-annotation"
            style={{ borderLeftColor: getCategoryColor(getAnnotationCategory(annotation.reason!)) }}
          >
            {annotation.reason}
          </div>
        )}
      </div>

      <style>{`
        .card-diff-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          border-radius: 0.375rem;
          border: 2px solid;
          transition: all 0.15s ease;
        }

        .card-diff-item.added {
          background-color: #dcfce7;
          border-color: #86efac;
        }

        .card-diff-item.removed {
          background-color: #fee2e2;
          border-color: #fca5a5;
        }

        .card-diff-item.modified {
          background-color: #fef3c7;
          border-color: #fcd34d;
        }

        .card-diff-item:hover {
          transform: translateX(4px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .change-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 1.5rem;
          height: 1.5rem;
          font-weight: 700;
          font-size: 1.125rem;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .card-diff-item.added .change-indicator {
          background-color: #16a34a;
          color: white;
        }

        .card-diff-item.removed .change-indicator {
          background-color: #dc2626;
          color: white;
        }

        .card-diff-item.modified .change-indicator {
          background-color: #ca8a04;
          color: white;
        }

        .card-image-container {
          width: 3rem;
          height: 4.2rem;
          flex-shrink: 0;
          border-radius: 0.25rem;
          overflow: hidden;
          background-color: #f3f4f6;
          border: 1px solid #d1d5db;
        }

        .card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .card-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          min-width: 0;
        }

        .card-name-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .card-name {
          flex: 1;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .annotation-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 1.5rem;
          height: 1.5rem;
          border-radius: 50%;
          font-size: 0.75rem;
          flex-shrink: 0;
          cursor: help;
          transition: transform 0.15s ease;
        }

        .annotation-icon:hover {
          transform: scale(1.2);
        }

        .card-count {
          font-size: 0.75rem;
          font-weight: 500;
          color: #6b7280;
        }

        .card-diff-item.modified .card-count {
          font-weight: 600;
          color: #ca8a04;
        }

        .inline-annotation {
          margin-top: 0.25rem;
          padding: 0.5rem;
          padding-left: 0.75rem;
          font-size: 0.75rem;
          font-style: italic;
          color: #4b5563;
          background-color: rgba(255, 255, 255, 0.5);
          border-left: 3px solid;
          border-radius: 0.25rem;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
};

/**
 * Component for displaying special slot changes (commander, legend, battlefield)
 */
const SpecialSlotDiff: React.FC<{
  label: string;
  oldCard: import('../../types/deck').DeckCard | null;
  newCard: import('../../types/deck').DeckCard | null;
}> = ({ label, oldCard, newCard }) => {
  const getChangeType = (): 'added' | 'removed' | 'changed' => {
    if (!oldCard && newCard) return 'added';
    if (oldCard && !newCard) return 'removed';
    return 'changed';
  };

  const changeType = getChangeType();

  return (
    <div className={`special-slot-diff ${changeType}`}>
      <div className="slot-label">{label}</div>
      
      <div className="slot-comparison">
        {/* Old card */}
        <div className="slot-card old-card">
          {oldCard ? (
            <>
              {oldCard.image_url && (
                <div className="slot-card-image-container">
                  <img
                    src={oldCard.image_url}
                    alt={oldCard.name || oldCard.id}
                    className="slot-card-image"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="slot-card-name">{oldCard.name || oldCard.id}</div>
            </>
          ) : (
            <div className="slot-empty">Empty</div>
          )}
        </div>

        {/* Arrow indicator */}
        <div className="slot-arrow">→</div>

        {/* New card */}
        <div className="slot-card new-card">
          {newCard ? (
            <>
              {newCard.image_url && (
                <div className="slot-card-image-container">
                  <img
                    src={newCard.image_url}
                    alt={newCard.name || newCard.id}
                    className="slot-card-image"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="slot-card-name">{newCard.name || newCard.id}</div>
            </>
          ) : (
            <div className="slot-empty">Empty</div>
          )}
        </div>
      </div>

      <style>{`
        .special-slot-diff {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 1rem;
          border-radius: 0.5rem;
          border: 2px solid;
        }

        .special-slot-diff.added {
          background-color: #dcfce7;
          border-color: #86efac;
        }

        .special-slot-diff.removed {
          background-color: #fee2e2;
          border-color: #fca5a5;
        }

        .special-slot-diff.changed {
          background-color: #fef3c7;
          border-color: #fcd34d;
        }

        .slot-label {
          font-size: 0.875rem;
          font-weight: 700;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .slot-comparison {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .slot-card {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background-color: white;
          border-radius: 0.375rem;
          border: 1px solid #d1d5db;
        }

        .slot-card.old-card {
          opacity: 0.7;
        }

        .slot-card.new-card {
          border-width: 2px;
          border-color: #3b82f6;
        }

        .slot-card-image-container {
          width: 4rem;
          height: 5.6rem;
          flex-shrink: 0;
          border-radius: 0.375rem;
          overflow: hidden;
          background-color: #f3f4f6;
          border: 1px solid #d1d5db;
        }

        .slot-card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .slot-card-name {
          flex: 1;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }

        .slot-empty {
          flex: 1;
          text-align: center;
          font-size: 0.875rem;
          font-style: italic;
          color: #9ca3af;
        }

        .slot-arrow {
          font-size: 1.5rem;
          font-weight: bold;
          color: #6b7280;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
};
