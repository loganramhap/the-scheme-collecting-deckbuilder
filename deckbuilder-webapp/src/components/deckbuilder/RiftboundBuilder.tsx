import React, { useMemo, useState } from 'react';
import { Deck, DeckCard } from '../../types/deck';
import { RiftboundCard, Card } from '../../types/card';
import { CardFilters } from '../../types/filters';
import { LegendSlot } from './LegendSlot';
import { BattlefieldSelector } from './BattlefieldSelector';
import { RuneDeckZone } from './RuneDeckZone';
import { VisualCardBrowser } from './VisualCardBrowser';
import { DeckZone } from './DeckZone';
import { DeckStatistics } from './DeckStatistics';
import { ValidationPanel } from './ValidationPanel';
import { CardDataRefreshButton } from '../CardDataRefreshButton';
import { useDeckStore } from '../../store/deck';
import { extractLegendDomains } from '../../utils/domainFiltering';
import { isBasicRune, isBattlefield, isLegend } from '../../utils/riftboundCardTypes';
import { validateRiftboundDeckComprehensive } from '../../utils/deckValidation';

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
  const { 
    setLegend, 
    addCard, 
    addRune, 
    removeRune,
    updateCardCount, 
    updateRuneCount,
    addBattlefield,
    removeBattlefield
  } = useDeckStore();
  
  // Track active tab for card browser
  const [activeCardTab, setActiveCardTab] = useState<'main' | 'runes' | 'battlefields'>('main');
  
  // Card filtering state
  const [filters, setFilters] = useState<CardFilters>({
    types: [],
    minCost: null,
    maxCost: null,
    rarities: [],
    colors: [],
    searchQuery: '',
  });

  // Extract legend's domains (can be multiple)
  const legendDomains = useMemo(() => {
    if (!deck.legend) {
      return [];
    }
    const legendCard = availableCards.find(c => c.id === deck.legend?.id);
    return extractLegendDomains(legendCard);
  }, [deck.legend, availableCards]);

  // Auto-populate runes when Legend is selected
  const autoPopulateRunes = (domains: string[]) => {
    if (domains.length === 0) {
      return; // No domains, don't add runes
    }
    
    // Clear existing runes first
    const currentRunes = deck.runeDeck || [];
    currentRunes.forEach(rune => {
      removeRune(rune.id);
    });
    
    // Get all available runes
    const allRunes = availableCards.filter(isBasicRune);
    
    if (domains.length === 1) {
      // Single domain: add 12 runes of that domain
      const domainRunes = allRunes.filter(rune => {
        const runeDomain = Array.isArray(rune.domain) ? rune.domain[0] : rune.domain;
        return runeDomain === domains[0] || rune.name.toLowerCase().includes(domains[0].toLowerCase());
      });
      
      if (domainRunes.length > 0) {
        const runeToAdd = domainRunes[0];
        addRune({
          id: runeToAdd.id,
          count: 12,
          name: runeToAdd.name,
          image_url: runeToAdd.image_url,
        });
      }
    } else if (domains.length >= 2) {
      // Multi-domain: add 6 runes of each domain (up to 2 domains)
      const domainsToUse = domains.slice(0, 2); // Use first 2 domains
      domainsToUse.forEach(domain => {
        const domainRunes = allRunes.filter(rune => {
          const runeDomain = Array.isArray(rune.domain) ? rune.domain[0] : rune.domain;
          return runeDomain === domain || rune.name.toLowerCase().includes(domain.toLowerCase());
        });
        
        if (domainRunes.length > 0) {
          const runeToAdd = domainRunes[0];
          addRune({
            id: runeToAdd.id,
            count: 6,
            name: runeToAdd.name,
            image_url: runeToAdd.image_url,
          });
        }
      });
    }
  };

  const handleLegendSelect = (card: DeckCard) => {
    setLegend(card);
    
    // Auto-populate runes based on Legend's domains
    const legendCard = availableCards.find(c => c.id === card.id);
    if (legendCard) {
      const domains = extractLegendDomains(legendCard);
      autoPopulateRunes(domains);
    }
  };

  const handleCardAdd = (card: Card) => {
    const riftboundCard = card as RiftboundCard;
    const deckCard: DeckCard = {
      id: riftboundCard.id,
      count: 1,
      name: riftboundCard.name,
      image_url: riftboundCard.image_url,
    };
    
    // Route cards to correct zone based on card type
    if (isBasicRune(riftboundCard)) {
      // Check if rune deck is full
      const currentRuneCount = (deck.runeDeck || []).reduce((sum, c) => sum + c.count, 0);
      if (currentRuneCount >= 12) {
        alert('Rune deck is full (12/12). Remove a rune before adding more.');
        return;
      }
      addRune(deckCard);
    } else if (isBattlefield(riftboundCard)) {
      // Check if all battlefield slots are filled
      const currentBattlefieldCount = (deck.battlefields || []).length;
      if (currentBattlefieldCount >= 3) {
        alert('All battlefield slots are filled (3/3). Remove a battlefield before adding more.');
        return;
      }
      addBattlefield(deckCard);
    } else if (isLegend(riftboundCard)) {
      // Legends should be selected through the LegendSlot component, not added to main deck
      alert('Legends cannot be added to the main deck. Use the Legend slot at the top to select your Legend.');
      return;
    } else {
      // Add to main deck
      addCard(deckCard);
    }
  };

  const handleCardIncrement = (card: Card) => {
    const riftboundCard = card as RiftboundCard;
    
    // Route based on card type
    if (isBasicRune(riftboundCard)) {
      const existingRune = deck.runeDeck?.find(c => c.id === card.id);
      if (existingRune) {
        // Check if adding would exceed limit
        const currentRuneCount = (deck.runeDeck || []).reduce((sum, c) => sum + c.count, 0);
        if (currentRuneCount >= 12) {
          alert('Rune deck is full (12/12). Remove a rune before adding more.');
          return;
        }
        updateRuneCount(card.id, existingRune.count + 1);
      } else {
        handleCardAdd(card);
      }
    } else if (isBattlefield(riftboundCard)) {
      // Battlefields don't have counts, they're unique slots
      alert('Battlefields are unique slots. You can have up to 3 different battlefields.');
      return;
    } else if (isLegend(riftboundCard)) {
      alert('Legends cannot be added to the main deck. Use the Legend slot at the top to select your Legend.');
      return;
    } else {
      const existingCard = deck.cards.find(c => c.id === card.id);
      if (existingCard) {
        updateCardCount(card.id, existingCard.count + 1);
      } else {
        handleCardAdd(card);
      }
    }
  };

  const handleCardDecrement = (card: Card) => {
    const riftboundCard = card as RiftboundCard;
    
    // Route based on card type
    if (isBasicRune(riftboundCard)) {
      const existingRune = deck.runeDeck?.find(c => c.id === card.id);
      if (existingRune) {
        updateRuneCount(card.id, existingRune.count - 1);
      }
    } else if (isBattlefield(riftboundCard)) {
      // Battlefields don't have counts, they're removed through BattlefieldSelector
      alert('Battlefields are removed by clicking the X button on the battlefield slot.');
      return;
    } else if (isLegend(riftboundCard)) {
      // Legends are managed through LegendSlot
      return;
    } else {
      const existingCard = deck.cards.find(c => c.id === card.id);
      if (existingCard) {
        updateCardCount(card.id, existingCard.count - 1);
      }
    }
  };

  // Comprehensive deck validation
  const validationResult = useMemo(() => {
    return validateRiftboundDeckComprehensive(deck, availableCards);
  }, [deck, availableCards]);

  // Get the appropriate deck cards based on active tab
  const currentDeckCards = useMemo(() => {
    switch (activeCardTab) {
      case 'runes':
        return deck.runeDeck || [];
      case 'battlefields':
        return deck.battlefields || [];
      case 'main':
      default:
        return deck.cards;
    }
  }, [activeCardTab, deck.cards, deck.runeDeck, deck.battlefields]);

  return (
    <div className="riftbound-builder" style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 120px)', overflow: 'hidden' }}>
      {/* Left sidebar: Legend, Battlefields, Runes, and Deck Stats */}
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '300px',
        flexShrink: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        paddingRight: '8px'
      }}>
        {/* Legend and Special Zones */}
        <div style={{ 
          padding: '20px',
          background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(30, 30, 30, 0.95) 100%)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        }}>
          <LegendSlot 
            legend={deck.legend || null} 
            onLegendSelect={handleLegendSelect}
            availableCards={availableCards}
          />
          
          <BattlefieldSelector
            battlefields={deck.battlefields || []}
            onBattlefieldAdd={addBattlefield}
            onBattlefieldRemove={removeBattlefield}
            availableCards={availableCards}
          />
          
          <RuneDeckZone
            runeDeck={deck.runeDeck || []}
            onRuneAdd={addRune}
            onRuneRemove={removeRune}
            onRuneCountChange={updateRuneCount}
            availableCards={availableCards}
          />
        </div>
        
        {/* Deck Statistics */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(30, 30, 30, 0.95) 100%)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        }}>
          <DeckStatistics
            mainDeckCards={deck.cards}
            runeDeck={deck.runeDeck || []}
            battlefields={deck.battlefields || []}
            availableCards={availableCards}
          />
        </div>

        {/* Validation Panel */}
        <ValidationPanel validationResult={validationResult} />
      </div>

      {/* Main content area: Card Browser */}
      <div style={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(30, 30, 30, 0.95) 100%)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      }}>
        {/* Zone Header for Main Deck */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '16px 20px',
          borderBottom: '2px solid #4caf50',
          background: 'rgba(76, 175, 80, 0.05)',
        }}>
          <span style={{ fontSize: '20px' }}>🃏</span>
          <h2 style={{ 
            margin: 0, 
            fontSize: '18px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: '#4caf50',
          }}>
            Main Deck Cards
          </h2>
          {legendDomains.length > 0 && (
            <span style={{
              padding: '4px 12px',
              background: 'rgba(156, 39, 176, 0.2)',
              border: '1px solid #9c27b0',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600',
              color: '#9c27b0',
              textTransform: 'uppercase',
            }}>
              {legendDomains.join(' + ')} Domain{legendDomains.length > 1 ? 's' : ''}
            </span>
          )}
          <div style={{ marginLeft: 'auto' }}>
            <CardDataRefreshButton />
          </div>
        </div>
        
        {/* Visual Card Browser wrapped in DeckZone for drag and drop */}
        <DeckZone 
          onCardDrop={handleCardAdd}
          gameType="riftbound"
          legendDomains={legendDomains}
        >
          <VisualCardBrowser 
            cards={availableCards}
            onCardAdd={handleCardAdd}
            filters={filters}
            onFilterChange={setFilters}
            gameType="riftbound"
            deckCards={currentDeckCards}
            onCardIncrement={handleCardIncrement}
            onCardDecrement={handleCardDecrement}
            maxCopiesPerCard={4}
            legendDomains={legendDomains}
            activeTab={activeCardTab}
            onTabChange={setActiveCardTab}
          />
        </DeckZone>
      </div>
    </div>
  );
};
