import React, { useState, useEffect } from 'react';
import type { CardChangeAnnotation, AnnotationTemplate, DeckDiff } from '../../types/versioning';
import { ANNOTATION_MAX_LENGTH } from '../../constants/annotationTemplates';
import { useAnnotationTemplates } from '../../hooks/useAnnotationTemplates';

interface CardChangeAnnotatorProps {
  diff: DeckDiff;
  annotations: CardChangeAnnotation[];
  onAnnotationsChange: (annotations: CardChangeAnnotation[]) => void;
}

/**
 * Component to annotate individual card changes with reasons
 * Based on Requirements 11.1, 11.2, 11.3, 11.7, 11.8
 */
export const CardChangeAnnotator: React.FC<CardChangeAnnotatorProps> = ({
  diff,
  annotations,
  onAnnotationsChange,
}) => {
  const { templates } = useAnnotationTemplates();
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [bulkReason, setBulkReason] = useState('');
  const [showBulkAnnotator, setShowBulkAnnotator] = useState(false);

  // Initialize annotations from diff
  useEffect(() => {
    const initialAnnotations: CardChangeAnnotation[] = [];

    // Add annotations for added cards
    diff.added.forEach((card) => {
      const existing = annotations.find((a) => a.cardId === card.id && a.changeType === 'added');
      initialAnnotations.push(
        existing || {
          cardId: card.id,
          cardName: card.name || card.id,
          changeType: 'added',
          reason: '',
        }
      );
    });

    // Add annotations for removed cards
    diff.removed.forEach((card) => {
      const existing = annotations.find((a) => a.cardId === card.id && a.changeType === 'removed');
      initialAnnotations.push(
        existing || {
          cardId: card.id,
          cardName: card.name || card.id,
          changeType: 'removed',
          reason: '',
        }
      );
    });

    // Add annotations for modified cards
    diff.modified.forEach((mod) => {
      const existing = annotations.find((a) => a.cardId === mod.card.id && a.changeType === 'modified');
      initialAnnotations.push(
        existing || {
          cardId: mod.card.id,
          cardName: mod.card.name || mod.card.id,
          changeType: 'modified',
          reason: '',
          oldCount: mod.oldCount,
          newCount: mod.newCount,
        }
      );
    });

    onAnnotationsChange(initialAnnotations);
  }, [diff]); // Only run when diff changes

  const handleReasonChange = (cardId: string, changeType: string, reason: string) => {
    const updatedAnnotations = annotations.map((annotation) =>
      annotation.cardId === cardId && annotation.changeType === changeType
        ? { ...annotation, reason: reason.slice(0, ANNOTATION_MAX_LENGTH) }
        : annotation
    );
    onAnnotationsChange(updatedAnnotations);
  };

  const handleTemplateSelect = (cardId: string, changeType: string, template: AnnotationTemplate) => {
    handleReasonChange(cardId, changeType, template.reason);
  };

  const handleCardSelect = (cardId: string, changeType: string) => {
    const key = `${cardId}-${changeType}`;
    const newSelected = new Set(selectedCards);
    
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    
    setSelectedCards(newSelected);
  };

  const handleBulkAnnotate = () => {
    if (selectedCards.size === 0 || !bulkReason.trim()) {
      return;
    }

    const updatedAnnotations = annotations.map((annotation) => {
      const key = `${annotation.cardId}-${annotation.changeType}`;
      if (selectedCards.has(key)) {
        return { ...annotation, reason: bulkReason.slice(0, ANNOTATION_MAX_LENGTH) };
      }
      return annotation;
    });

    onAnnotationsChange(updatedAnnotations);
    setSelectedCards(new Set());
    setBulkReason('');
    setShowBulkAnnotator(false);
  };

  const handleBulkTemplateSelect = (template: AnnotationTemplate) => {
    setBulkReason(template.reason);
  };

  const getAnnotation = (cardId: string, changeType: string): CardChangeAnnotation | undefined => {
    return annotations.find((a) => a.cardId === cardId && a.changeType === changeType);
  };

  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, AnnotationTemplate[]>);

  const categoryLabels: Record<string, string> = {
    testing: 'Testing',
    meta: 'Meta',
    performance: 'Performance',
    synergy: 'Synergy',
    cost: 'Cost',
  };

  const changeTypeColors = {
    added: '#10b981',
    removed: '#ef4444',
    modified: '#f59e0b',
  };

  const totalChanges = diff.added.length + diff.removed.length + diff.modified.length;

  if (totalChanges === 0) {
    return null;
  }

  return (
    <div className="card-change-annotator">
      <div className="annotator-header">
        <label className="annotator-label">
          Card Changes ({totalChanges})
        </label>
        
        {totalChanges > 1 && (
          <button
            type="button"
            className="btn-bulk-annotate"
            onClick={() => setShowBulkAnnotator(!showBulkAnnotator)}
          >
            {showBulkAnnotator ? 'Hide' : 'Show'} Bulk Annotate
          </button>
        )}
      </div>

      <p className="annotator-description">
        Add optional reasons for individual card changes (max {ANNOTATION_MAX_LENGTH} characters each)
      </p>

      {/* Bulk annotation section */}
      {showBulkAnnotator && (
        <div className="bulk-annotator">
          <div className="bulk-annotator-header">
            <h4>Bulk Annotate ({selectedCards.size} selected)</h4>
            {selectedCards.size > 0 && (
              <button
                type="button"
                className="btn-clear-selection"
                onClick={() => setSelectedCards(new Set())}
              >
                Clear Selection
              </button>
            )}
          </div>

          <div className="bulk-templates">
            {Object.entries(groupedTemplates).map(([category, templates]) => (
              <div key={category} className="template-group">
                <span className="template-group-label">{categoryLabels[category]}:</span>
                {templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    className="template-chip"
                    onClick={() => handleBulkTemplateSelect(template)}
                    disabled={selectedCards.size === 0}
                  >
                    {template.label}
                  </button>
                ))}
              </div>
            ))}
          </div>

          <div className="bulk-input-container">
            <textarea
              className="bulk-reason-input"
              value={bulkReason}
              onChange={(e) => setBulkReason(e.target.value.slice(0, ANNOTATION_MAX_LENGTH))}
              placeholder="Enter reason for selected cards..."
              rows={2}
              disabled={selectedCards.size === 0}
            />
            <div className="bulk-input-footer">
              <span className="char-counter">
                {bulkReason.length} / {ANNOTATION_MAX_LENGTH}
              </span>
              <button
                type="button"
                className="btn-apply-bulk"
                onClick={handleBulkAnnotate}
                disabled={selectedCards.size === 0 || !bulkReason.trim()}
              >
                Apply to {selectedCards.size} card{selectedCards.size !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card list */}
      <div className="card-changes-list">
        {/* Added cards */}
        {diff.added.length > 0 && (
          <div className="change-group">
            <h4 className="change-group-title" style={{ color: changeTypeColors.added }}>
              Added ({diff.added.length})
            </h4>
            {diff.added.map((card) => {
              const annotation = getAnnotation(card.id, 'added');
              const key = `${card.id}-added`;
              const isSelected = selectedCards.has(key);
              
              return (
                <CardAnnotationItem
                  key={key}
                  card={card}
                  changeType="added"
                  annotation={annotation}
                  isSelected={isSelected}
                  showBulkSelect={showBulkAnnotator}
                  onReasonChange={handleReasonChange}
                  onTemplateSelect={handleTemplateSelect}
                  onSelect={handleCardSelect}
                  templates={groupedTemplates}
                  categoryLabels={categoryLabels}
                />
              );
            })}
          </div>
        )}

        {/* Removed cards */}
        {diff.removed.length > 0 && (
          <div className="change-group">
            <h4 className="change-group-title" style={{ color: changeTypeColors.removed }}>
              Removed ({diff.removed.length})
            </h4>
            {diff.removed.map((card) => {
              const annotation = getAnnotation(card.id, 'removed');
              const key = `${card.id}-removed`;
              const isSelected = selectedCards.has(key);
              
              return (
                <CardAnnotationItem
                  key={key}
                  card={card}
                  changeType="removed"
                  annotation={annotation}
                  isSelected={isSelected}
                  showBulkSelect={showBulkAnnotator}
                  onReasonChange={handleReasonChange}
                  onTemplateSelect={handleTemplateSelect}
                  onSelect={handleCardSelect}
                  templates={groupedTemplates}
                  categoryLabels={categoryLabels}
                />
              );
            })}
          </div>
        )}

        {/* Modified cards */}
        {diff.modified.length > 0 && (
          <div className="change-group">
            <h4 className="change-group-title" style={{ color: changeTypeColors.modified }}>
              Modified ({diff.modified.length})
            </h4>
            {diff.modified.map((mod) => {
              const annotation = getAnnotation(mod.card.id, 'modified');
              const key = `${mod.card.id}-modified`;
              const isSelected = selectedCards.has(key);
              
              return (
                <CardAnnotationItem
                  key={key}
                  card={mod.card}
                  changeType="modified"
                  annotation={annotation}
                  isSelected={isSelected}
                  showBulkSelect={showBulkAnnotator}
                  onReasonChange={handleReasonChange}
                  onTemplateSelect={handleTemplateSelect}
                  onSelect={handleCardSelect}
                  templates={groupedTemplates}
                  categoryLabels={categoryLabels}
                  oldCount={mod.oldCount}
                  newCount={mod.newCount}
                />
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .card-change-annotator {
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1rem;
          background-color: #f9fafb;
        }

        .annotator-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .annotator-label {
          font-weight: 600;
          color: #374151;
          font-size: 0.875rem;
        }

        .annotator-description {
          font-size: 0.75rem;
          color: #6b7280;
          margin: 0 0 1rem 0;
        }

        .btn-bulk-annotate {
          padding: 0.375rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 500;
          background-color: #3b82f6;
          color: white;
          border: none;
          border-radius: 0.375rem;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }

        .btn-bulk-annotate:hover {
          background-color: #2563eb;
        }

        .bulk-annotator {
          background-color: white;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          padding: 0.75rem;
          margin-bottom: 1rem;
        }

        .bulk-annotator-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .bulk-annotator-header h4 {
          margin: 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }

        .btn-clear-selection {
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
          background-color: transparent;
          color: #6b7280;
          border: 1px solid #d1d5db;
          border-radius: 0.25rem;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-clear-selection:hover {
          background-color: #f3f4f6;
          color: #374151;
        }

        .bulk-templates {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .template-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .template-group-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #6b7280;
          min-width: 80px;
        }

        .template-chip {
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
          background-color: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          border-radius: 0.25rem;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .template-chip:hover:not(:disabled) {
          background-color: #e5e7eb;
          border-color: #9ca3af;
        }

        .template-chip:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .bulk-input-container {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .bulk-reason-input {
          width: 100%;
          padding: 0.5rem;
          font-size: 0.875rem;
          font-family: inherit;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          resize: vertical;
        }

        .bulk-reason-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .bulk-reason-input:disabled {
          background-color: #f9fafb;
          cursor: not-allowed;
        }

        .bulk-input-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .char-counter {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .btn-apply-bulk {
          padding: 0.375rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 500;
          background-color: #10b981;
          color: white;
          border: none;
          border-radius: 0.375rem;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }

        .btn-apply-bulk:hover:not(:disabled) {
          background-color: #059669;
        }

        .btn-apply-bulk:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .card-changes-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .change-group {
          background-color: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          padding: 0.75rem;
        }

        .change-group-title {
          margin: 0 0 0.75rem 0;
          font-size: 0.875rem;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

interface CardAnnotationItemProps {
  card: any;
  changeType: 'added' | 'removed' | 'modified';
  annotation?: CardChangeAnnotation;
  isSelected: boolean;
  showBulkSelect: boolean;
  onReasonChange: (cardId: string, changeType: string, reason: string) => void;
  onTemplateSelect: (cardId: string, changeType: string, template: AnnotationTemplate) => void;
  onSelect: (cardId: string, changeType: string) => void;
  templates: Record<string, AnnotationTemplate[]>;
  categoryLabels: Record<string, string>;
  oldCount?: number;
  newCount?: number;
}

const CardAnnotationItem: React.FC<CardAnnotationItemProps> = ({
  card,
  changeType,
  annotation,
  isSelected,
  showBulkSelect,
  onReasonChange,
  onTemplateSelect,
  onSelect,
  templates,
  categoryLabels,
  oldCount,
  newCount,
}) => {
  const [showTemplates, setShowTemplates] = useState(false);
  const reason = annotation?.reason || '';

  const handleReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onReasonChange(card.id, changeType, e.target.value);
  };

  const handleTemplateClick = (template: AnnotationTemplate) => {
    onTemplateSelect(card.id, changeType, template);
    setShowTemplates(false);
  };

  return (
    <div className={`card-annotation-item ${isSelected ? 'selected' : ''}`}>
      <div className="card-annotation-header">
        {showBulkSelect && (
          <input
            type="checkbox"
            className="card-select-checkbox"
            checked={isSelected}
            onChange={() => onSelect(card.id, changeType)}
          />
        )}
        
        {card.image_url && (
          <img
            src={card.image_url}
            alt={card.name || card.id}
            className="card-thumbnail"
            loading="lazy"
          />
        )}
        
        <div className="card-info">
          <div className="card-name">{card.name || card.id}</div>
          {changeType === 'modified' && oldCount !== undefined && newCount !== undefined && (
            <div className="card-count-change">
              {oldCount} → {newCount}
            </div>
          )}
        </div>

        <button
          type="button"
          className="btn-toggle-templates"
          onClick={() => setShowTemplates(!showTemplates)}
          title="Quick templates"
        >
          {showTemplates ? '−' : '+'}
        </button>
      </div>

      {showTemplates && (
        <div className="card-templates">
          {Object.entries(templates).map(([category, categoryTemplates]) => (
            <div key={category} className="card-template-group">
              <span className="card-template-label">{categoryLabels[category]}:</span>
              {categoryTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  className="card-template-chip"
                  onClick={() => handleTemplateClick(template)}
                >
                  {template.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="card-annotation-input">
        <textarea
          className="reason-input"
          value={reason}
          onChange={handleReasonChange}
          placeholder="Optional: Why this change?"
          rows={2}
        />
        <div className="reason-char-counter">
          {reason.length} / {ANNOTATION_MAX_LENGTH}
        </div>
      </div>

      <style>{`
        .card-annotation-item {
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          padding: 0.75rem;
          background-color: #ffffff;
          transition: all 0.15s ease;
        }

        .card-annotation-item.selected {
          border-color: #3b82f6;
          background-color: #eff6ff;
        }

        .card-annotation-item:not(:last-child) {
          margin-bottom: 0.75rem;
        }

        .card-annotation-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }

        .card-select-checkbox {
          width: 1rem;
          height: 1rem;
          cursor: pointer;
        }

        .card-thumbnail {
          width: 40px;
          height: 56px;
          object-fit: cover;
          border-radius: 0.25rem;
          border: 1px solid #e5e7eb;
        }

        .card-info {
          flex: 1;
          min-width: 0;
        }

        .card-name {
          font-weight: 500;
          font-size: 0.875rem;
          color: #374151;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .card-count-change {
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 0.125rem;
        }

        .btn-toggle-templates {
          width: 1.5rem;
          height: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          border-radius: 0.25rem;
          cursor: pointer;
          font-size: 1rem;
          font-weight: bold;
          transition: all 0.15s ease;
        }

        .btn-toggle-templates:hover {
          background-color: #e5e7eb;
        }

        .card-templates {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          padding: 0.5rem;
          background-color: #f9fafb;
          border-radius: 0.25rem;
        }

        .card-template-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .card-template-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #6b7280;
          min-width: 70px;
        }

        .card-template-chip {
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
          background-color: white;
          color: #374151;
          border: 1px solid #d1d5db;
          border-radius: 0.25rem;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .card-template-chip:hover {
          background-color: #f3f4f6;
          border-color: #9ca3af;
        }

        .card-annotation-input {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .reason-input {
          width: 100%;
          padding: 0.5rem;
          font-size: 0.875rem;
          font-family: inherit;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          resize: vertical;
          min-height: 60px;
        }

        .reason-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .reason-input::placeholder {
          color: #9ca3af;
        }

        .reason-char-counter {
          font-size: 0.75rem;
          color: #6b7280;
          text-align: right;
        }
      `}</style>
    </div>
  );
};
