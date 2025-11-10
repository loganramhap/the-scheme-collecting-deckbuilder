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
  const validationWarnings: string[] = [];
  if (totalCards < 30) {
    validationWarnings.push(`Need ${30 - totalCards} more cards (minimum 30)`);
  } else if (totalCards > 40) {
    validationWarnings.push(`Remove ${totalCards - 40} cards (maximum 40)`);
  }
  
  if (!deck.legend) {
    validationWarnings.push('No Legend selected');
  }
  
  if (!deck.battlefield) {
    validationWarnings.push('No Battlefield selected');
  }

  return (
    <div className="riftbound-builder" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top section: Legend, Battlefield, and Rune Indicator */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr 1fr', 
        gap: '20px',
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
            color: '#f44336'
          }}>
            ⚠️ Deck Validation Warnings
          </div>
          <ul style={{ 
            margin: 0, 
            paddingLeft: '20px',
            color: '#ff9800'
          }}>
            {validationWarnings.map((warning, i) => (
              <li key={i}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Deck zone with card count */}
      <div style={{ 
        padding: '20px',
        background: '#1a1a1a',
        borderRadius: '8px'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '15px'
        }}>
          <h2 style={{ margin: 0 }}>Deck</h2>
          <div style={{ 
            fontSize: '18px', 
            fontWeight: 'bold',
            color: totalCards >= 30 && totalCards <= 40 ? '#4caf50' : '#f44336'
          }}>
            {totalCards} / 30-40 cards
          </div>
        </div>

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
