import React, { useState } from 'react';
import { useDrop } from 'react-dnd';
import { DeckCard } from '../../types/deck';
import { RiftboundCard } from '../../types/card';
import { CardImage } from './CardImage';
import { DND_ITEM_TYPES, DragItem } from '../../types/dnd';
import Modal from '../Modal';

interface LegendSlotProps {
  legend: DeckCard | null;
  onLegendSelect: (card: DeckCard) => void;
  availableCards: RiftboundCard[];
}

export const LegendSlot: React.FC<LegendSlotProps> = ({
  legend,
  onLegendSelect,
  availableCards,
}) => {
  const [showModal, setShowModal] = useState(false);

  // Filter only Legend type cards
  const legendCards = availableCards.filter(card => 
    card.type.toLowerCase() === 'legend'
  );

  const handleSelectLegend = (card: RiftboundCard) => {
    onLegendSelect({
      id: card.id,
      count: 1,
      name: card.name,
      image_url: card.image_url,
    });
    setShowModal(false);
  };

  // Setup drop zone for Legend slot
  const [{ isOver, canDrop }, drop] = useDrop<DragItem, void, { isOver: boolean; canDrop: boolean }>(() => ({
    accept: DND_ITEM_TYPES.CARD,
    canDrop: (item) => {
      const card = item.card as RiftboundCard;
      return card.type?.toLowerCase() === 'legend';
    },
    drop: (item) => {
      const card = item.card as RiftboundCard;
      handleSelectLegend(card);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [availableCards]);

  const isActive = isOver && canDrop;
  const isInvalid = isOver && !canDrop;

  return (
    <div className="legend-slot">
      <h3 style={{ marginTop: 0, marginBottom: '10px', fontSize: '16px' }}>Legend</h3>
      
      <div
        ref={drop}
        onClick={() => setShowModal(true)}
        style={{
          width: '100%',
          aspectRatio: '5/7',
          background: legend ? 'transparent' : '#2a2a2a',
          border: `2px dashed ${isActive ? '#4caf50' : isInvalid ? '#f44336' : '#555'}`,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          overflow: 'hidden',
          transition: 'border-color 0.2s, background-color 0.2s',
          backgroundColor: isActive ? 'rgba(76, 175, 80, 0.1)' : isInvalid ? 'rgba(244, 67, 54, 0.1)' : undefined,
        }}
        onMouseEnter={(e) => {
          if (!legend && !isOver) e.currentTarget.style.borderColor = '#888';
        }}
        onMouseLeave={(e) => {
          if (!legend && !isOver) e.currentTarget.style.borderColor = '#555';
        }}
      >
        {legend ? (
          <CardImage
            card={{
              id: legend.id,
              name: legend.name || legend.id,
              image_url: legend.image_url,
            } as RiftboundCard}
          />
        ) : (
          <div style={{ textAlign: 'center', color: '#888', padding: '10px' }}>
            <div style={{ fontSize: '32px', marginBottom: '5px' }}>👑</div>
            <div style={{ fontSize: '12px' }}>Click to select Legend</div>
          </div>
        )}
      </div>

      {legend && (
        <div style={{ 
          marginTop: '8px', 
          fontSize: '14px', 
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          {legend.name || legend.id}
        </div>
      )}

      {/* Legend Selection Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Select Legend">
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '15px',
            maxHeight: '500px',
            overflowY: 'auto',
            padding: '10px'
          }}>
            {legendCards.map(card => (
              <div
                key={card.id}
                onClick={() => handleSelectLegend(card)}
                style={{
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <CardImage card={card} />
                <div style={{ 
                  marginTop: '5px', 
                  fontSize: '12px', 
                  textAlign: 'center',
                  fontWeight: 'bold'
                }}>
                  {card.name}
                </div>
              </div>
            ))}
          </div>
          
          {legendCards.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
              No Legend cards available
            </div>
          )}
        </Modal>
    </div>
  );
};
