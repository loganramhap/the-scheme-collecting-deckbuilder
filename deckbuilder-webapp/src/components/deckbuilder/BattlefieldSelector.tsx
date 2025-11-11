import React, { useState } from 'react';
import { useDrop } from 'react-dnd';
import { DeckCard } from '../../types/deck';
import { RiftboundCard } from '../../types/card';
import { CardImage } from './CardImage';
import { DND_ITEM_TYPES, DragItem } from '../../types/dnd';
import { isBattlefield, getBattlefieldCards } from '../../utils/riftboundCardTypes';
import Modal from '../Modal';

interface BattlefieldSelectorProps {
  battlefields: DeckCard[];
  onBattlefieldAdd: (card: DeckCard) => void;
  onBattlefieldRemove: (index: number) => void;
  availableCards: RiftboundCard[];
}

export const BattlefieldSelector: React.FC<BattlefieldSelectorProps> = ({
  battlefields,
  onBattlefieldAdd,
  onBattlefieldRemove,
  availableCards,
}) => {
  const [showModal, setShowModal] = useState(false);

  // Filter only Battlefield type cards
  const battlefieldCards = getBattlefieldCards(availableCards);

  // Check if battlefields are full
  const isBattlefieldsFull = battlefields.length >= 3;

  const handleSelectBattlefield = (card: RiftboundCard) => {
    // Check if we're at the limit
    if (isBattlefieldsFull) {
      alert('All battlefield slots are filled (3/3)');
      return;
    }

    onBattlefieldAdd({
      id: card.id,
      count: 1,
      name: card.name,
      image_url: card.image_url,
    });
    setShowModal(false);
  };

  const handleRemoveBattlefield = (index: number) => {
    onBattlefieldRemove(index);
  };

  const handleSlotClick = (index: number) => {
    if (index < battlefields.length) {
      // Slot has a battlefield - remove it
      handleRemoveBattlefield(index);
    } else {
      // Empty slot - open picker
      setShowModal(true);
    }
  };

  // Create drop zone for each slot
  const BattlefieldSlot: React.FC<{ index: number; battlefield: DeckCard | null }> = ({ index, battlefield }) => {
    const [{ isOver, canDrop }, drop] = useDrop<DragItem, void, { isOver: boolean; canDrop: boolean }>(() => ({
      accept: DND_ITEM_TYPES.CARD,
      canDrop: (item) => {
        const card = item.card as RiftboundCard;
        // Only accept Battlefield cards and only if slot is empty
        return isBattlefield(card) && !battlefield;
      },
      drop: (item) => {
        const card = item.card as RiftboundCard;
        handleSelectBattlefield(card);
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }), [battlefield, availableCards]);

    const isActive = isOver && canDrop;
    const isInvalid = isOver && !canDrop;

    return (
      <div
        ref={drop}
        onClick={() => handleSlotClick(index)}
        style={{
          width: '100%',
          aspectRatio: '5/7',
          background: battlefield ? 'transparent' : 'rgba(33, 150, 243, 0.05)',
          border: `2px ${battlefield ? 'solid' : 'dashed'} ${isActive ? '#4caf50' : isInvalid ? '#f44336' : battlefield ? '#2196f3' : 'rgba(33, 150, 243, 0.3)'}`,
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
          if (!battlefield && !isOver) e.currentTarget.style.borderColor = 'rgba(33, 150, 243, 0.6)';
        }}
        onMouseLeave={(e) => {
          if (!battlefield && !isOver) e.currentTarget.style.borderColor = 'rgba(33, 150, 243, 0.3)';
        }}
        title={battlefield ? `${battlefield.name || battlefield.id} - Click to remove` : 'Click to select Battlefield'}
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
          <div style={{ textAlign: 'center', color: '#2196f3', padding: '10px' }}>
            <div style={{ fontSize: '24px', marginBottom: '5px' }}>🏔️</div>
            <div style={{ fontSize: '10px', fontWeight: '500' }}>Slot {index + 1}</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="battlefield-selector" style={{ marginTop: '20px' }}>
      {/* Zone Header with Icon and Label */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '10px',
        paddingBottom: '8px',
        borderBottom: '2px solid #2196f3',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{ fontSize: '18px' }}>🏔️</span>
          <h3 style={{ 
            margin: 0, 
            fontSize: '16px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: '#2196f3',
          }}>
            Battlefields
          </h3>
        </div>
        <div style={{ 
          fontSize: '14px', 
          fontWeight: 'bold',
          color: battlefields.length === 3 ? '#4caf50' : '#2196f3',
          fontFamily: 'monospace',
        }}>
          {battlefields.length} / 3
        </div>
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '10px',
      }}>
        {[0, 1, 2].map(index => (
          <BattlefieldSlot
            key={index}
            index={index}
            battlefield={battlefields[index] || null}
          />
        ))}
      </div>

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
                cursor: isBattlefieldsFull ? 'not-allowed' : 'pointer',
                transition: 'transform 0.2s',
                opacity: isBattlefieldsFull ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isBattlefieldsFull) {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }
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
