import React from 'react';
import { useDrag } from 'react-dnd';
import { Card } from '../../types/card';
import { DND_ITEM_TYPES, DragItem, DragSourceZone } from '../../types/dnd';
import { CardImage } from './CardImage';
import './DraggableCard.css';

interface DraggableCardProps {
  card: Card;
  sourceZone: DragSourceZone;
  children?: React.ReactNode;
  onClick?: () => void;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseMove?: (e: React.MouseEvent) => void;
  onMouseLeave?: () => void;
}

export const DraggableCard: React.FC<DraggableCardProps> = React.memo(({
  card,
  sourceZone,
  children,
  onClick,
  onMouseEnter,
  onMouseMove,
  onMouseLeave,
}) => {
  const [{ isDragging }, drag] = useDrag<DragItem, void, { isDragging: boolean }>(() => ({
    type: DND_ITEM_TYPES.CARD,
    item: {
      type: DND_ITEM_TYPES.CARD,
      card,
      sourceZone,
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [card.id, sourceZone]); // Only depend on card ID, not entire card object

  return (
    <div
      ref={drag}
      className={`draggable-card ${isDragging ? 'dragging' : ''}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab',
      }}
    >
      <CardImage card={card} />
      {children}
    </div>
  );
});
