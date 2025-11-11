import React from 'react';
import { useDrop } from 'react-dnd';
import { Card, RiftboundCard, MTGCard } from '../../types/card';
import { DND_ITEM_TYPES, DragItem } from '../../types/dnd';
import { isCardLegalForDomain } from '../../utils/domainFiltering';
import './DeckZone.css';

interface DeckZoneProps {
  onCardDrop: (card: Card) => void;
  children: React.ReactNode;
  gameType: 'mtg' | 'riftbound';
  legendDomain?: string | null;
  activeColorIdentity?: string[];
}

export const DeckZone: React.FC<DeckZoneProps> = ({
  onCardDrop,
  children,
  gameType,
  legendDomain = null,
  activeColorIdentity = [],
}) => {
  const [{ isOver, canDrop }, drop] = useDrop<DragItem, void, { isOver: boolean; canDrop: boolean }>(() => ({
    accept: DND_ITEM_TYPES.CARD,
    canDrop: (item) => {
      const card = item.card;
      
      // Don't allow dropping Legend, Battlefield, or Commander cards into main deck
      if (gameType === 'riftbound') {
        const riftboundCard = card as RiftboundCard;
        const cardType = riftboundCard.type?.toLowerCase() || '';
        
        if (cardType === 'legend' || cardType === 'battlefield') {
          return false;
        }
        
        // Check domain restrictions
        return isCardLegalForDomain(riftboundCard, legendDomain);
      } else if (gameType === 'mtg') {
        const mtgCard = card as MTGCard;
        const typeLine = mtgCard.type_line?.toLowerCase() || '';
        
        // Don't allow legendary creatures (commanders) in main deck via drag
        // (they should go to commander slot)
        if (typeLine.includes('legendary') && typeLine.includes('creature')) {
          return false;
        }
        
        // Check color identity restrictions
        if (activeColorIdentity.length > 0 && mtgCard.color_identity) {
          const isLegal = mtgCard.color_identity.every(color => 
            activeColorIdentity.includes(color)
          );
          return isLegal;
        }
      }
      
      return true;
    },
    drop: (item) => {
      onCardDrop(item.card);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [gameType, legendDomain, activeColorIdentity, onCardDrop]);

  const isActive = isOver && canDrop;
  const isInvalid = isOver && !canDrop;

  return (
    <div
      ref={drop}
      className={`deck-zone ${isActive ? 'deck-zone-active' : ''} ${isInvalid ? 'deck-zone-invalid' : ''}`}
      style={{
        minHeight: '200px',
        border: `2px dashed ${isActive ? '#4caf50' : isInvalid ? '#f44336' : 'transparent'}`,
        borderRadius: '8px',
        transition: 'border-color 0.2s, background-color 0.2s',
        backgroundColor: isActive ? 'rgba(76, 175, 80, 0.05)' : isInvalid ? 'rgba(244, 67, 54, 0.05)' : 'transparent',
      }}
    >
      {children}
    </div>
  );
};
