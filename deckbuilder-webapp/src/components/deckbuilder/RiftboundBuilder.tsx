import React, { useMemo, useState } from 'react';
import { Deck, DeckCard } from '../../types/deck';
import { RiftboundCard, Card } from '../../types/card';
import { CardFilters } from '../../types/filters';
import { LegendSlot } from './LegendSlot';
import { BattlefieldSlot } from './BattlefieldSlot';
import { RuneIndicator } from './RuneIndicator';
import { VisualCardBrowser } from './VisualCardBrowser';
import { DeckZone } from './DeckZone';
import { useDeckStore } from '../../store/deck';
import { filterByRuneColors, extractRuneColors } from '../../utils/runeColorFiltering';

interface RiftboundBuilderProps {
  deck: Deck;
  onDeckUpdate: (deck: Deck) => void;
  availableCards: RiftboundCard[];
}

export const RiftboundBuilder: React.FC<RiftboundBuilderProps> = ({
  deck,
  onDeckUpdate: _onDeckUpdate,
  availableCards,
}) => {
  const { setLegend, setBattlefield, updateRuneColors, addCard, updateCardCount } = useDeckStore();
  
  // Card filtering state
  const [filters, setFilters] = useState<CardFilters>({
    types: [],
    minCost: null,
    maxCost: null,
    rarities: [],
    colors: [],
    searchQuery: '',
  });

  // Extract active rune colors from legend
  const activeRuneColors = useMemo(() => {
    return deck.runeColors || [];
  }, [deck.runeColors]);

  // Filter available cards based on rune colors
  const filteredCards = useMemo(() => {
    return filterByRuneColors(availableCards, activeRuneColors);
  }, [availableCards, activeRuneColors]);

  const handleLegendSelect = (card: DeckCard) => {
    setLegend(card);
    
    // Extract rune colors from the legend card
    const legendCard = availableCards.find(c => c.id === card.id);
    const runeColors = extractRuneColors(legendCard);
    updateRuneColors(runeColors);
  };

  const handleBattlefieldSelect = (card: DeckCard) => {
    setBattlefield(card);
  };

  const handleCardAdd = (card: Card) => {
    const riftboundCard = card as RiftboundCard;
    addCard({
      id: riftboundCard.id,
      count: 1,
      name: riftboundCard.name,
      image_url: riftboundCard.image_url,
    });
  };

  const handleCardIncrement = (card: Card) => {
    const existingCard = deck.cards.find(c => c.id === card.id);
    if (existingCard) {
      updateCardCount(card.id, existingCard.count + 1);
    } else {
      handleCardAdd(card);
    }
  };

  const handleCardDecrement = (card: Card) => {
    const existingCard = deck.cards.find(c => c.id === card.id);
    if (existingCard) {
      updateCardCount(card.id, existingCard.count - 1);
    }
  };

  const totalCards = deck.cards.reduce((sum, card) => sum + card.count, 0);

  // Validation warnings
  // Riftbound decks are 40 cards, not including the legend, 12 rune cards, and 3 battlefields
  const validationWarnings: string[] = [];
  if (totalCards < 40) {
    validationWarnings.push(`Need ${40 - totalCards} more cards (exactly 40 required)`);
  } else if (totalCards > 40) {
    validationWarnings.push(`Remove ${totalCards - 40} cards (exactly 40 required)`);
  }
  
  if (!deck.legend) {
    validationWarnings.push('No Legend selected');
  }
  
  if (!deck.battlefield) {
    validationWarnings.push('No Battlefield selected');
  }

  return (
    <div className="riftbound-builder" style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 120px)' }}>
      {/* Left sidebar: Legend, Battlefield, Rune Indicator, and Deck Stats */}
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        width: '320px',
        flexShrink: 0,
        overflowY: 'auto'
      }}>
        <div style={{ 
          padding: '20px',
          background: '#1a1a1a',
          borderRadius: '8px'
        }}>
          <LegendSlot 
            legend={deck.legend || null} 
            onLegendSelect={handleLegendSelect}
            availableCards={availableCards}
          />
          
          <BattlefieldSlot 
            battlefield={deck.battlefield || null} 
            onBattlefieldSelect={handleBattlefieldSelect}
            availableCards={filteredCards}
          />
          
          <RuneIndicator activeRuneColors={activeRuneColors} />
          
          {/* Card count */}
          <div style={{ 
            marginTop: '20px',
            padding: '15px',
            background: '#2a2a2a',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ 
              fontSize: '14px', 
              color: '#999',
              marginBottom: '5px'
            }}>
              Deck Size
            </div>
            <div style={{ 
              fontSize: '24px', 
              fontWeight: 'bold',
              color: totalCards === 40 ? '#4caf50' : '#f44336'
            }}>
              {totalCards} / 40
            </div>
          </div>
        </div>

        {/* Validation warnings */}
        {validationWarnings.length > 0 && (
          <div style={{
            padding: '15px',
            background: '#2a1a1a',
            border: '1px solid #d32f2f',
            borderRadius: '8px',
          }}>
            <div style={{ 
              fontWeight: 'bold', 
              marginBottom: '8px',
              color: '#f44336',
              fontSize: '14px'
            }}>
              ⚠️ Warnings
            </div>
            <ul style={{ 
              margin: 0, 
              paddingLeft: '20px',
              color: '#ff9800',
              fontSize: '13px'
            }}>
              {validationWarnings.map((warning, i) => (
                <li key={i}>{warning}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Main content area: Card Browser */}
      <div style={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        background: '#1a1a1a',
        borderRadius: '8px',
        padding: '20px',
        overflowY: 'auto'
      }}>
        <h2 style={{ margin: '0 0 20px 0' }}>Card Browser</h2>

        {/* Visual Card Browser wrapped in DeckZone for drag and drop */}
        <DeckZone 
          onCardDrop={handleCardAdd}
          gameType="riftbound"
          activeRuneColors={activeRuneColors}
        >
          <VisualCardBrowser 
            cards={filteredCards}
            onCardAdd={handleCardAdd}
            filters={filters}
            onFilterChange={setFilters}
            gameType="riftbound"
            deckCards={deck.cards}
            onCardIncrement={handleCardIncrement}
            onCardDecrement={handleCardDecrement}
            maxCopiesPerCard={4}
          />
        </DeckZone>
      </div>
    </div>
  );
};
