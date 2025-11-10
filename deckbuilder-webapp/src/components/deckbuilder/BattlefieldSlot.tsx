import React, { useState } from 'react';
import { useDrop } from 'react-dnd';
import { DeckCard } from '../../types/deck';
import { RiftboundCard } from '../../types/card';
import { CardImage } from './CardImage';
import { DND_ITEM_TYPES, DragItem } from '../../types/dnd';
import Modal from '../Modal';

interface BattlefieldSlotProps {
  battlefield: DeckCard | null;
  onBattlefieldSelect: (card: DeckCard) => void;
  availableCards: RiftboundCard[];
}

export const BattlefieldSlot: React.FC<BattlefieldSlotProps> = ({
  battlefield,
  onBattlefieldSelect,
  availableCards,
}) => {
  const [showModal, setShowModal] = useState(false);

  // Filter only Battlefield type cards
  const battlefieldCards = availableCards.filter(card => 
    card.type.toLowerCase() === 'battlefield'
  );

  const handleSelectBattlefield = (card: RiftboundCard) => {
    onBattlefieldSelect({
      id: card.id,
      count: 1,
      name: card.name,
      image_url: card.image_url,
    });
    setShowModal(false);
  };

  // Setup drop zone for Battlefield slot
  const [{ isOver, canDrop }, drop] = useDrop<DragItem, void, { isOver: boolean; canDrop: boolean }>(() => ({
    accept: DND_ITEM_TYPES.CARD,
    canDrop: (item) => {
      const card = item.card as RiftboundCard;
      return card.type?.toLowerCase() === 'battlefield';
    },
    drop: (item) => {
      const card = item.card as RiftboundCard;
      handleSelectBattlefield(card);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [availableCards]);

  const isActive = isOver && canDrop;
  const isInvalid = isOver && !canDrop;

  return (
    <div className="battlefield-slot">
      <h3 style={{ marginTop: 0, marginBottom: '10px', fontSize: '16px' }}>Battlefield</h3>
      
      <div
        ref={drop}
        onClick={() => setShowModal(true)}
        style={{
          width: '100%',
          aspectRatio: '5/7',
          background: battlefield ? 'transparent' : '#2a2a2a',
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
          if (!battlefield && !isOver) e.currentTarget.style.borderColor = '#888';
        }}
        onMouseLeave={(e) => {
          if (!battlefield && !isOver) e.currentTarget.style.borderColor = '#555';
        }}
      >
        {battlefield ? (
          <CardImage
            card={{
              id: battlefield.id,
              name: battlefield.name || battlefield.id,
              image_url: battlefield.image_url,
            } as RiftboundCard}
          />
        ) : (
          <div style={{ textAlign: 'center', color: '#888', padding: '10px' }}>
            <div style={{ fontSize: '32px', marginBottom: '5px' }}>🏔️</div>
            <div style={{ fontSize: '12px' }}>Click to select Battlefield</div>
          </div>
        )}
      </div>

      {battlefield && (
        <div style={{ 
          marginTop: '8px', 
          fontSize: '14px', 
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          {battlefield.name || battlefield.id}
        </div>
      )}

      {/* Battlefield Selection Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Select Battlefield">
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '15px',
            maxHeight: '500px',
            overflowY: 'auto',
            padding: '10px'
          }}>
            {battlefieldCards.map(card => (
              <div
                key={card.id}
                onClick={() => handleSelectBattlefield(card)}
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
          
          {battlefieldCards.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
              No Battlefield cards available
            </div>
          )}
        </Modal>
    </div>
  );
};
