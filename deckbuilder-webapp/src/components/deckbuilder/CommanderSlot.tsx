import React, { useState } from 'react';
import { useDrop } from 'react-dnd';
import { DeckCard } from '../../types/deck';
import { MTGCard } from '../../types/card';
import { CardImage } from './CardImage';
import { DND_ITEM_TYPES, DragItem } from '../../types/dnd';
import Modal from '../Modal';

interface CommanderSlotProps {
  commander: DeckCard | null;
  onCommanderSelect: (card: DeckCard) => void;
  availableCards: MTGCard[];
}

export const CommanderSlot: React.FC<CommanderSlotProps> = ({
  commander,
  onCommanderSelect,
  availableCards,
}) => {
  const [showModal, setShowModal] = useState(false);

  // Filter only legendary creatures that can be commanders
  const commanderCards = availableCards.filter(card => {
    const typeLine = card.type_line.toLowerCase();
    return typeLine.includes('legendary') && typeLine.includes('creature');
  });

  const handleSelectCommander = (card: MTGCard) => {
    onCommanderSelect({
      id: card.id,
      count: 1,
      name: card.name,
      image_url: card.image_uris?.normal,
    });
    setShowModal(false);
  };

  // Setup drop zone for Commander slot
  const [{ isOver, canDrop }, drop] = useDrop<DragItem, void, { isOver: boolean; canDrop: boolean }>(() => ({
    accept: DND_ITEM_TYPES.CARD,
    canDrop: (item) => {
      const card = item.card as MTGCard;
      const typeLine = card.type_line?.toLowerCase() || '';
      return typeLine.includes('legendary') && typeLine.includes('creature');
    },
    drop: (item) => {
      const card = item.card as MTGCard;
      handleSelectCommander(card);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [availableCards]);

  const isActive = isOver && canDrop;
  const isInvalid = isOver && !canDrop;

  return (
    <div className="commander-slot">
      <h3 style={{ marginTop: 0, marginBottom: '10px', fontSize: '16px' }}>Commander</h3>
      
      <div
        ref={drop}
        onClick={() => setShowModal(true)}
        style={{
          width: '100%',
          aspectRatio: '5/7',
          background: commander ? 'transparent' : '#2a2a2a',
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
          if (!commander && !isOver) e.currentTarget.style.borderColor = '#888';
        }}
        onMouseLeave={(e) => {
          if (!commander && !isOver) e.currentTarget.style.borderColor = '#555';
        }}
      >
        {commander ? (
          <CardImage
            card={{
              id: commander.id,
              name: commander.name || commander.id,
              image_uris: commander.image_url ? {
                small: commander.image_url,
                normal: commander.image_url,
                large: commander.image_url,
              } : undefined,
            } as MTGCard}
          />
        ) : (
          <div style={{ textAlign: 'center', color: '#888', padding: '10px' }}>
            <div style={{ fontSize: '32px', marginBottom: '5px' }}>⚔️</div>
            <div style={{ fontSize: '12px' }}>Click to select Commander</div>
          </div>
        )}
      </div>

      {commander && (
        <div style={{ 
          marginTop: '8px', 
          fontSize: '14px', 
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          {commander.name || commander.id}
        </div>
      )}

      {/* Commander Selection Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Select Commander">
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '15px',
          maxHeight: '500px',
          overflowY: 'auto',
          padding: '10px'
        }}>
          {commanderCards.map(card => (
            <div
              key={card.id}
              onClick={() => handleSelectCommander(card)}
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
        
        {commanderCards.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
            No legendary creatures available
          </div>
        )}
      </Modal>
    </div>
  );
};
