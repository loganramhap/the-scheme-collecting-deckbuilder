import React from 'react';
import { Card } from '../../types/card';
import { CardFilters as CardFiltersType } from '../../types/filters';
import { DeckCard } from '../../types/deck';
import { CardFilters } from './CardFilters';
import { CardGrid } from './CardGrid';
import { useCardFiltering } from '../../hooks/useCardFiltering';
import './VisualCardBrowser.css';

interface VisualCardBrowserProps {
  cards: Card[];
  onCardAdd: (card: Card) => void;
  filters: CardFiltersType;
  onFilterChange: (filters: CardFiltersType) => void;
  gameType: 'mtg' | 'riftbound';
  deckCards: DeckCard[];
  onCardIncrement?: (card: Card) => void;
  onCardDecrement?: (card: Card) => void;
  maxCopiesPerCard?: number;
}

export const VisualCardBrowser: React.FC<VisualCardBrowserProps> = ({
  cards,
  onCardAdd,
  filters,
  onFilterChange,
  gameType,
  deckCards,
  onCardIncrement,
  onCardDecrement,
  maxCopiesPerCard = 4,
}) => {
  // Use memoized filtering
  const filteredCards = useCardFiltering(cards, filters);

  return (
    <div className="visual-card-browser">
      <div className="browser-main">
        <div className="browser-header">
          <h3>Card Pool</h3>
          <span className="card-count">
            {filteredCards.length} of {cards.length} cards
          </span>
        </div>
        <CardGrid
          cards={filteredCards}
          onCardClick={onCardAdd}
          deckCards={deckCards}
          onCardIncrement={onCardIncrement}
          onCardDecrement={onCardDecrement}
          maxCopiesPerCard={maxCopiesPerCard}
        />
      </div>
      <div className="browser-sidebar">
        <CardFilters
          filters={filters}
          onFilterChange={onFilterChange}
          gameType={gameType}
        />
      </div>
    </div>
  );
};
