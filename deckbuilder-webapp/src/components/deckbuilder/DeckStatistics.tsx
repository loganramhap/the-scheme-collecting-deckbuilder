import React, { useMemo } from 'react';
import { Deck } from '../../types/deck';
import { MTGCard, RiftboundCard } from '../../types/card';
import { ColorDistributionChart } from './ColorDistributionChart';
import './DeckStatistics.css';

interface DeckStatisticsProps {
  deck: Deck;
  validationWarnings?: string[];
  availableCards?: (MTGCard | RiftboundCard)[];
}

export const DeckStatistics: React.FC<DeckStatisticsProps> = ({ deck, validationWarnings = [], availableCards = [] }) => {
  // Calculate total card count
  const totalCards = useMemo(() => {
    return deck.cards.reduce((sum, card) => sum + card.count, 0);
  }, [deck.cards]);

  // Determine format requirements based on game type and format
  const formatRequirements = useMemo(() => {
    if (deck.game === 'riftbound') {
      return {
        min: 30,
        max: 40,
        label: '30-40 cards',
      };
    } else if (deck.game === 'mtg' && deck.format.toLowerCase().includes('commander')) {
      return {
        min: 100,
        max: 100,
        label: '100 cards',
      };
    } else if (deck.game === 'mtg') {
      return {
        min: 60,
        max: null,
        label: '60+ cards',
      };
    }
    return {
      min: 0,
      max: null,
      label: 'No limit',
    };
  }, [deck.game, deck.format]);

  // Calculate progress percentage
  const progress = useMemo(() => {
    if (formatRequirements.max) {
      return Math.min((totalCards / formatRequirements.max) * 100, 100);
    } else if (formatRequirements.min) {
      return Math.min((totalCards / formatRequirements.min) * 100, 100);
    }
    return 0;
  }, [totalCards, formatRequirements]);

  // Determine status color
  const statusColor = useMemo(() => {
    if (formatRequirements.max && totalCards > formatRequirements.max) {
      return '#f44336'; // Red - over limit
    } else if (totalCards < formatRequirements.min) {
      return '#ff9800'; // Orange - under minimum
    } else if (formatRequirements.max && totalCards === formatRequirements.max) {
      return '#4caf50'; // Green - exact match
    } else if (totalCards >= formatRequirements.min) {
      return '#4caf50'; // Green - within range
    }
    return '#9e9e9e'; // Gray - default
  }, [totalCards, formatRequirements]);

  return (
    <div className="deck-statistics">
      <div className="deck-statistics-header">
        <h3>Deck Statistics</h3>
      </div>

      {/* Card Count Display */}
      <div className="card-count-section">
        <div className="card-count-display">
          <span className="card-count-label">Total Cards:</span>
          <span className="card-count-value" style={{ color: statusColor }}>
            {totalCards}
          </span>
          <span className="card-count-requirement">
            / {formatRequirements.label}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill" 
            style={{ 
              width: `${progress}%`,
              backgroundColor: statusColor,
            }}
          />
        </div>

        {/* Progress percentage text */}
        <div className="progress-text">
          {formatRequirements.max ? (
            <span>{Math.round(progress)}% complete</span>
          ) : (
            <span>
              {totalCards >= formatRequirements.min ? '✓ Minimum met' : `Need ${formatRequirements.min - totalCards} more`}
            </span>
          )}
        </div>
      </div>

      {/* Validation Warnings */}
      {validationWarnings.length > 0 && (
        <div className="validation-warnings">
          <div className="validation-warnings-header">
            <span className="warning-icon">⚠️</span>
            <span>Validation Issues</span>
          </div>
          <ul className="validation-warnings-list">
            {validationWarnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Color Distribution Chart */}
      {availableCards.length > 0 && deck.cards.length > 0 && (
        <div className="color-distribution-section">
          <ColorDistributionChart deck={deck} availableCards={availableCards} />
        </div>
      )}

      {/* Additional deck info */}
      <div className="deck-info-section">
        {deck.commander && (
          <div className="deck-info-item">
            <span className="info-label">Commander:</span>
            <span className="info-value">{deck.commander.name || 'Selected'}</span>
          </div>
        )}
        {deck.legend && (
          <div className="deck-info-item">
            <span className="info-label">Legend:</span>
            <span className="info-value">{deck.legend.name || 'Selected'}</span>
          </div>
        )}
        {deck.battlefield && (
          <div className="deck-info-item">
            <span className="info-label">Battlefield:</span>
            <span className="info-value">{deck.battlefield.name || 'Selected'}</span>
          </div>
        )}
      </div>
    </div>
  );
};
