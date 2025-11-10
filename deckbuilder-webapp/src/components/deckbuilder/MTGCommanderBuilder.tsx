import React, { useMemo, useState } from 'react';
import { Deck, DeckCard } from '../../types/deck';
import { MTGCard, Card } from '../../types/card';
import { CardFilters } from '../../types/filters';
import { CommanderSlot } from './CommanderSlot';
import { ColorIdentityIndicator } from './ColorIdentityIndicator';
import { VisualCardBrowser } from './VisualCardBrowser';
import { DeckZone } from './DeckZone';
import { useDeckStore } from '../../store/deck';
import { filterByColorIdentity, extractColorIdentity } from '../../utils/colorIdentityFiltering';
import { validateCommanderDeck } from '../../utils/commanderValidation';

interface MTGCommanderBuilderProps {
  deck: Deck;
  onDeckUpdate: (deck: Deck) => void;
  availableCards: MTGCard[];
}

export const MTGCommanderBuilder: React.FC<MTGCommanderBuilderProps> = ({
  deck,
  onDeckUpdate: _onDeckUpdate,
  availableCards,
}) => {
  const { setCommander, updateColorIdentity, addCard, updateCardCount } = useDeckStore();
  
  // Card filtering state
  const [filters, setFilters] = useState<CardFilters>({
    types: [],
    minCost: null,
    maxCost: null,
    rarities: [],
    colors: [],
    searchQuery: '',
  });

  // Extract active color identity from commander
  const activeColorIdentity = useMemo(() => {
    return deck.colorIdentity || [];
  }, [deck.colorIdentity]);

  // Filter available cards based on color identity
  const filteredCards = useMemo(() => {
    return filterByColorIdentity(availableCards, activeColorIdentity);
  }, [availableCards, activeColorIdentity]);

  const handleCommanderSelect = (card: DeckCard) => {
    setCommander(card);
    
    // Extract color identity from the commander card
    const commanderCard = availableCards.find(c => c.id === card.id);
    const colorIdentity = extractColorIdentity(commanderCard);
    updateColorIdentity(colorIdentity);
  };

  const handleCardAdd = (card: Card) => {
    const mtgCard = card as MTGCard;
    addCard({
      id: mtgCard.id,
      count: 1,
      name: mtgCard.name,
      image_url: mtgCard.image_uris?.normal,
    });
  };

  const handleCardIncrement = (card: Card) => {
    const existingCard = deck.cards.find(c => c.id === card.id);
    if (existingCard) {
      // Check singleton rule (except for basic lands)
      const mtgCard = card as MTGCard;
      const isBasicLand = mtgCard.type_line.toLowerCase().includes('basic land');
      
      if (!isBasicLand && existingCard.count >= 1) {
        // Already at max for non-basic lands
        return;
      }
      
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

  // Validation using utility
  const validation = validateCommanderDeck(deck, availableCards);
  const validationWarnings = [...validation.errors, ...validation.warnings];

  return (
    <div className="mtg-commander-builder" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top section: Commander and Color Identity */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 2fr', 
        gap: '20px',
        padding: '20px',
        background: '#1a1a1a',
        borderRadius: '8px'
      }}>
        <CommanderSlot 
          commander={deck.commander || null} 
          onCommanderSelect={handleCommanderSelect}
          availableCards={availableCards}
        />
        
        <ColorIdentityIndicator colorIdentity={activeColorIdentity} />
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

      {/* Main deck zone with card count */}
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
          <h2 style={{ margin: 0 }}>Main Deck</h2>
          <div style={{ 
            fontSize: '18px', 
            fontWeight: 'bold',
            color: totalCards === 100 ? '#4caf50' : '#f44336'
          }}>
            {totalCards} / 100 cards
          </div>
        </div>

        {/* Visual Card Browser wrapped in DeckZone for drag and drop */}
        <DeckZone 
          onCardDrop={handleCardAdd}
          gameType="mtg"
          activeColorIdentity={activeColorIdentity}
        >
          <VisualCardBrowser 
            cards={filteredCards}
            onCardAdd={handleCardAdd}
            filters={filters}
            onFilterChange={setFilters}
            gameType="mtg"
            deckCards={deck.cards}
            onCardIncrement={handleCardIncrement}
            onCardDecrement={handleCardDecrement}
            maxCopiesPerCard={1}
          />
        </DeckZone>
      </div>
    </div>
  );
};
