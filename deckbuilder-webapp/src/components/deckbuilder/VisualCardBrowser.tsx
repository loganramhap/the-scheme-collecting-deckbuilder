import React, { useState, useMemo } from 'react';
import { Card, RiftboundCard } from '../../types/card';
import { CardFilters as CardFiltersType } from '../../types/filters';
import { DeckCard } from '../../types/deck';
import { CardFilters } from './CardFilters';
import { CardGrid } from './CardGrid';
import { useCardFiltering } from '../../hooks/useCardFiltering';
import { getMainDeckCards, getRuneCards, getBattlefieldCards } from '../../utils/riftboundCardTypes';
import { filterByDomains } from '../../utils/domainFiltering';
import './VisualCardBrowser.css';

type CardTypeTab = 'main' | 'runes' | 'battlefields';

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
  legendDomains?: string[];
  activeTab?: CardTypeTab;
  onTabChange?: (tab: CardTypeTab) => void;
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
  legendDomains = [],
  activeTab: externalActiveTab,
  onTabChange,
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState<CardTypeTab>('main');
  
  // Use external tab if provided, otherwise use internal state
  const activeTab = externalActiveTab !== undefined ? externalActiveTab : internalActiveTab;
  
  // Handle tab change
  const handleTabChange = (tab: CardTypeTab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalActiveTab(tab);
    }
  };
  
  // Filter cards by type based on active tab (only for Riftbound)
  const cardsByType = useMemo(() => {
    if (gameType !== 'riftbound') {
      return cards;
    }
    
    const riftboundCards = cards as RiftboundCard[];
    
    switch (activeTab) {
      case 'runes':
        return getRuneCards(riftboundCards);
      case 'battlefields':
        return getBattlefieldCards(riftboundCards);
      case 'main':
      default:
        return getMainDeckCards(riftboundCards);
    }
  }, [cards, activeTab, gameType]);
  
  // Apply domain filtering only to Main Deck tab for Riftbound
  const domainFilteredCards = useMemo(() => {
    if (gameType !== 'riftbound' || activeTab !== 'main') {
      return cardsByType;
    }
    
    return filterByDomains(cardsByType as RiftboundCard[], legendDomains);
  }, [cardsByType, activeTab, gameType, legendDomains]);
  
  // Use memoized filtering on the domain-filtered cards
  const filteredCards = useCardFiltering(domainFilteredCards, filters);

  return (
    <div className="visual-card-browser">
      <div className="browser-main">
        <div className="browser-header">
          <h3>Card Pool</h3>
          {gameType === 'riftbound' && (
            <div style={{ 
              display: 'flex', 
              gap: '10px', 
              marginTop: '10px',
              borderBottom: '1px solid #333'
            }}>
              <button
                onClick={() => handleTabChange('main')}
                style={{
                  padding: '8px 16px',
                  background: activeTab === 'main' ? '#4caf50' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'main' ? '2px solid #4caf50' : '2px solid transparent',
                  color: activeTab === 'main' ? '#fff' : '#999',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: activeTab === 'main' ? 'bold' : 'normal',
                }}
              >
                Main Deck
              </button>
              <button
                onClick={() => handleTabChange('runes')}
                style={{
                  padding: '8px 16px',
                  background: activeTab === 'runes' ? '#ff9800' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'runes' ? '2px solid #ff9800' : '2px solid transparent',
                  color: activeTab === 'runes' ? '#fff' : '#999',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: activeTab === 'runes' ? 'bold' : 'normal',
                }}
              >
                Runes
              </button>
              <button
                onClick={() => handleTabChange('battlefields')}
                style={{
                  padding: '8px 16px',
                  background: activeTab === 'battlefields' ? '#2196f3' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'battlefields' ? '2px solid #2196f3' : '2px solid transparent',
                  color: activeTab === 'battlefields' ? '#fff' : '#999',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: activeTab === 'battlefields' ? 'bold' : 'normal',
                }}
              >
                Battlefields
              </button>
            </div>
          )}
          <span className="card-count">
            {filteredCards.length} of {domainFilteredCards.length} cards
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
