import React, { useEffect, useState } from 'react';
import { Card, MTGCard, RiftboundCard } from '../../types/card';
import { CardImage } from './CardImage';
import './CardPreview.css';

interface CardPreviewProps {
  card: Card | null;
  position: { x: number; y: number };
}

export const CardPreview: React.FC<CardPreviewProps> = React.memo(({ card, position }) => {
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  // Note: Escape key to close preview is handled by CardGrid component
  
  useEffect(() => {
    if (!card) return;

    // Adjust position to keep preview on screen
    const previewWidth = 320;
    const previewHeight = 500;
    const padding = 20;

    let x = position.x + padding;
    let y = position.y + padding;

    // Check if preview would go off right edge
    if (x + previewWidth > window.innerWidth) {
      x = position.x - previewWidth - padding;
    }

    // Check if preview would go off bottom edge
    if (y + previewHeight > window.innerHeight) {
      y = window.innerHeight - previewHeight - padding;
    }

    // Check if preview would go off top edge
    if (y < padding) {
      y = padding;
    }

    // Check if preview would go off left edge
    if (x < padding) {
      x = padding;
    }

    setAdjustedPosition({ x, y });
  }, [card, position]);

  if (!card) return null;

  const isMTGCard = 'mana_cost' in card;
  const isRiftboundCard = 'faction' in card;

  return (
    <div
      className="card-preview"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
      }}
    >
      <div className="card-preview-image">
        <CardImage card={card} size="large" />
      </div>
      
      <div className="card-preview-details">
        <h3 className="card-preview-name">{card.name}</h3>
        
        {isMTGCard && (
          <MTGCardDetails card={card as MTGCard} />
        )}
        
        {isRiftboundCard && (
          <RiftboundCardDetails card={card as RiftboundCard} />
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if card ID changes or position moves significantly
  const cardChanged = prevProps.card?.id !== nextProps.card?.id;
  const positionChanged = 
    Math.abs(prevProps.position.x - nextProps.position.x) > 10 ||
    Math.abs(prevProps.position.y - nextProps.position.y) > 10;
  
  return !cardChanged && !positionChanged;
});

const MTGCardDetails: React.FC<{ card: MTGCard }> = React.memo(({ card }) => (
  <>
    <div className="card-preview-row">
      <span className="card-preview-label">Mana Cost:</span>
      <span className="card-preview-value">{card.mana_cost || 'N/A'}</span>
    </div>
    <div className="card-preview-row">
      <span className="card-preview-label">Type:</span>
      <span className="card-preview-value">{card.type_line}</span>
    </div>
    {card.oracle_text && (
      <div className="card-preview-text">
        {card.oracle_text}
      </div>
    )}
    {card.colors && card.colors.length > 0 && (
      <div className="card-preview-row">
        <span className="card-preview-label">Colors:</span>
        <span className="card-preview-value">{card.colors.join(', ')}</span>
      </div>
    )}
  </>
));

const RiftboundCardDetails: React.FC<{ card: RiftboundCard }> = React.memo(({ card }) => (
  <>
    <div className="card-preview-row">
      <span className="card-preview-label">Cost:</span>
      <span className="card-preview-value">{card.cost}</span>
    </div>
    <div className="card-preview-row">
      <span className="card-preview-label">Type:</span>
      <span className="card-preview-value">{card.type}</span>
    </div>
    <div className="card-preview-row">
      <span className="card-preview-label">Faction:</span>
      <span className="card-preview-value">{card.faction}</span>
    </div>
    <div className="card-preview-row">
      <span className="card-preview-label">Rank:</span>
      <span className="card-preview-value">{card.rank}</span>
    </div>
    {card.attack !== undefined && card.health !== undefined && (
      <div className="card-preview-row">
        <span className="card-preview-label">Stats:</span>
        <span className="card-preview-value">{card.attack}/{card.health}</span>
      </div>
    )}
    {card.text && (
      <div className="card-preview-text">
        {card.text}
      </div>
    )}
  </>
));
