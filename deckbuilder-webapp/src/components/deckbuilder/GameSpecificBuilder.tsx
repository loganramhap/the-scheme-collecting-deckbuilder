import React from 'react';
import { Deck } from '../../types/deck';
import { Card, MTGCard, RiftboundCard } from '../../types/card';
import { RiftboundBuilder } from './RiftboundBuilder';
import { MTGCommanderBuilder } from './MTGCommanderBuilder';

interface GameSpecificBuilderProps {
  deck: Deck;
  onDeckUpdate: (deck: Deck) => void;
  availableCards: Card[];
}

export const GameSpecificBuilder: React.FC<GameSpecificBuilderProps> = ({
  deck,
  onDeckUpdate,
  availableCards,
}) => {
  // Route to appropriate builder based on game type
  if (deck.game === 'riftbound') {
    return (
      <RiftboundBuilder
        deck={deck}
        onDeckUpdate={onDeckUpdate}
        availableCards={availableCards as RiftboundCard[]}
      />
    );
  }
  
  if (deck.game === 'mtg') {
    return (
      <MTGCommanderBuilder
        deck={deck}
        onDeckUpdate={onDeckUpdate}
        availableCards={availableCards as MTGCard[]}
      />
    );
  }
  
  // Fallback for unknown game types
  return (
    <div className="game-specific-builder">
      <p>Unsupported game type: {deck.game}</p>
    </div>
  );
};
