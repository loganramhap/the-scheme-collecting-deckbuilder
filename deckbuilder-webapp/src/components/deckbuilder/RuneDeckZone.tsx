import React, { useState } from 'react';
import { useDrop } from 'react-dnd';
import { DeckCard } from '../../types/deck';
import { RiftboundCard } from '../../types/card';
import { CardImage } from './CardImage';
import { DND_ITEM_TYPES, DragItem } from '../../types/dnd';
import { isBasicRune, getRuneCards } from '../../utils/riftboundCardTypes';
import Modal from '../Modal';

interface RuneDeckZoneProps {
  runeDeck: DeckCard[];
  onRuneAdd: (card: DeckCard) => void;
  onRuneRemove: (cardId: string) => void;
  availableCards: RiftboundCard[];
}

export const RuneDeckZone: React.FC<RuneDeckZoneProps> = ({
  runeDeck,
  onRuneAdd,
  onRuneRemove,
  availableCards,
}) => {
  const [showModal, setShowModal] = useState(false);

  // Calculate total rune count
  const totalRuneCount = runeDeck.reduce((sum, card) => sum + card.count, 0);
  const isRuneDeckFull = totalRuneCount >= 12;

  // Filter only Basic Rune cards
  const runeCards = getRuneCards(availableCards);

  const handleSelectRune = (card: RiftboundCard) => {
    // Check if we're at the limit
    if (isRuneDeckFull) {
      alert('Rune deck is full (12/12)');
      return;
    }

    onRuneAdd({
      id: card.id,
      count: 1,
      name: card.name,
      image_url: card.image_url,
    });
    setShowModal(false);
  };

  const handleRemoveRune = (cardId: string) => {
    onRuneRemove(cardId);
  };

  // Setup drop zone for Rune Deck
  const [{ isOver, canDrop }, drop] = useDrop<DragItem, void, { isOver: boolean; canDrop: boolean }>(() => ({
    accept: DND_ITEM_TYPES.CARD,
    canDrop: (item) => {
      const card = item.card as RiftboundCard;
      // Only accept Basic Rune cards and only if not at limit
      return isBasicRune(card) && !isRuneDeckFull;
    },
    drop: (item) => {
      const card = item.card as RiftboundCard;
      handleSelectRune(card);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [availableCards, isRuneDeckFull]);

  const isActive = isOver && canDrop;
  const isInvalid = isOver && !canDrop;

  return (
    <div className="rune-deck-zone" style={{ marginTop: '20px' }}>
      {/* Zone Header with Icon and Label */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '10px',
        paddingBottom: '8px',
        borderBottom: '2px solid #ff9800',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{ fontSize: '18px' }}>✨</span>
          <h3 style={{ 
            margin: 0, 
            fontSize: '16px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: '#ff9800',
          }}>
            Rune Deck
          </h3>
        </div>
        <div style={{ 
          fontSize: '14px', 
          fontWeight: 'bold',
          color: totalRuneCount === 12 ? '#4caf50' : '#ff9800',
          fontFamily: 'monospace',
        }}>
          {totalRuneCount} / 12
        </div>
      </div>
      
      <div
        ref={drop}
        style={{
          minHeight: '120px',
          background: 'rgba(255, 152, 0, 0.05)',
          border: `2px dashed ${isActive ? '#4caf50' : isInvalid ? '#f44336' : 'rgba(255, 152, 0, 0.3)'}`,
          borderRadius: '8px',
          padding: '10px',
          transition: 'border-color 0.2s, background-color 0.2s',
          backgroundColor: isActive ? 'rgba(76, 175, 80, 0.1)' : isInvalid ? 'rgba(244, 67, 54, 0.1)' : 'rgba(255, 152, 0, 0.05)',
        }}
      >
        {runeDeck.length === 0 ? (
          <div 
            onClick={() => setShowModal(true)}
            style={{ 
              textAlign: 'center', 
              color: '#ff9800', 
              padding: '30px 10px',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ffb74d';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#ff9800';
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '5px' }}>✨</div>
            <div style={{ fontSize: '12px', fontWeight: '500' }}>Click to add runes or drag & drop</div>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
            gap: '8px'
          }}>
            {runeDeck.map(card => (
              <div
                key={card.id}
                style={{
                  position: 'relative',
                  cursor: 'pointer',
                }}
                onClick={() => handleRemoveRune(card.id)}
                title={`${card.name || card.id} (x${card.count}) - Click to remove`}
              >
                <CardImage
                  card={{
                    id: card.id,
                    name: card.name || card.id,
                    image_url: card.image_url,
                  } as RiftboundCard}
                />
                {card.count > 1 && (
                  <div style={{
                    position: 'absolute',
                    bottom: '2px',
                    right: '2px',
                    background: 'rgba(0, 0, 0, 0.8)',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 'bold',
                  }}>
                    {card.count}
                  </div>
                )}
              </div>
            ))}
            {/* Add button */}
            {!isRuneDeckFull && (
              <div
                onClick={() => setShowModal(true)}
                style={{
                  aspectRatio: '5/7',
                  background: 'rgba(255, 152, 0, 0.05)',
                  border: '2px dashed rgba(255, 152, 0, 0.3)',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 152, 0, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 152, 0, 0.3)';
                }}
              >
                <div style={{ fontSize: '24px', color: '#ff9800' }}>+</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rune Selection Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Select Rune">
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '15px',
          maxHeight: '500px',
          overflowY: 'auto',
          padding: '10px'
        }}>
          {runeCards.map(card => (
            <div
              key={card.id}
              onClick={() => handleSelectRune(card)}
              style={{
                cursor: isRuneDeckFull ? 'not-allowed' : 'pointer',
                transition: 'transform 0.2s',
                opacity: isRuneDeckFull ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isRuneDeckFull) {
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
        
        {runeCards.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
            No Rune cards available
          </div>
        )}
      </Modal>
    </div>
  );
};
