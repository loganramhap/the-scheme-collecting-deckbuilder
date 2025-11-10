import React from 'react';
import { Card } from '../../types/card';
import './QuickAddControls.css';

interface QuickAddControlsProps {
  card: Card;
  currentCount: number;
  maxCount: number;
  onIncrement: (event: React.MouseEvent) => void;
  onDecrement: (event: React.MouseEvent) => void;
}

export const QuickAddControls: React.FC<QuickAddControlsProps> = React.memo(({
  card: _card,
  currentCount,
  maxCount,
  onIncrement,
  onDecrement,
}) => {
  const canIncrement = currentCount < maxCount;
  const canDecrement = currentCount > 0;

  return (
    <div className="quick-add-controls">
      {/* Card count badge */}
      {currentCount > 0 && (
        <div className="quick-add-count-badge">
          {currentCount}
        </div>
      )}

      {/* Control buttons */}
      <div className="quick-add-buttons">
        <button
          className={`quick-add-btn quick-add-decrement ${!canDecrement ? 'disabled' : ''}`}
          onClick={onDecrement}
          disabled={!canDecrement}
          aria-label="Remove one copy"
          title="Remove one copy"
        >
          −
        </button>
        
        <button
          className={`quick-add-btn quick-add-increment ${!canIncrement ? 'disabled' : ''}`}
          onClick={onIncrement}
          disabled={!canIncrement}
          aria-label="Add one copy"
          title={canIncrement ? 'Add one copy' : `Maximum ${maxCount} copies reached`}
        >
          +
        </button>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.currentCount === nextProps.currentCount &&
    prevProps.maxCount === nextProps.maxCount
  );
});
