import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { Card } from '../../types/card';
import { DeckCard } from '../../types/deck';
import { DraggableCard } from './DraggableCard';
import { CardPreview } from './CardPreview';
import { QuickAddControls } from './QuickAddControls';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import './CardGrid.css';

interface CardGridProps {
  cards: Card[];
  onCardClick: (card: Card) => void;
  deckCards: DeckCard[];
  onCardIncrement?: (card: Card) => void;
  onCardDecrement?: (card: Card) => void;
  maxCopiesPerCard?: number;
}

export const CardGrid: React.FC<CardGridProps> = ({
  cards,
  onCardClick,
  deckCards,
  onCardIncrement,
  onCardDecrement,
  maxCopiesPerCard = 4,
}) => {
  const [hoveredCard, setHoveredCard] = useState<Card | null>(null);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [focusedByKeyboard, setFocusedByKeyboard] = useState(false);

  // Calculate grid dimensions with responsive sizing
  const [dimensions, setDimensions] = useState(() => {
    if (typeof window === 'undefined') return { cardWidth: 200, cardHeight: 320, gap: 16 };
    
    const width = window.innerWidth;
    if (width < 640) {
      // Mobile: smaller cards
      return { cardWidth: 140, cardHeight: 220, gap: 12 };
    } else if (width < 1024) {
      // Tablet: medium cards
      return { cardWidth: 170, cardHeight: 270, gap: 14 };
    } else {
      // Desktop: full size cards
      return { cardWidth: 200, cardHeight: 320, gap: 16 };
    }
  });

  const { cardWidth, cardHeight, gap } = dimensions;
  const columnWidth = cardWidth + gap;
  const rowHeight = cardHeight + gap;

  // Update dimensions on window resize
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setDimensions({ cardWidth: 140, cardHeight: 220, gap: 12 });
      } else if (width < 1024) {
        setDimensions({ cardWidth: 170, cardHeight: 270, gap: 14 });
      } else {
        setDimensions({ cardWidth: 200, cardHeight: 320, gap: 16 });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Measure actual container width
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Calculate columns based on actual container width
  const columnCount = Math.max(1, Math.floor(containerWidth / columnWidth));
  const rowCount = Math.ceil(cards.length / columnCount);

  // Get card count in deck
  const getCardCount = useCallback((cardId: string): number => {
    const deckCard = deckCards.find(dc => dc.id === cardId);
    return deckCard?.count || 0;
  }, [deckCards]);

  // Handle card hover
  const handleCardHover = useCallback((card: Card | null, event?: React.MouseEvent) => {
    setHoveredCard(card);
    if (event && card) {
      setPreviewPosition({ x: event.clientX, y: event.clientY });
    }
  }, []);

  // Handle card increment
  const handleIncrement = useCallback((card: Card, event: React.MouseEvent) => {
    event.stopPropagation();
    onCardIncrement?.(card);
  }, [onCardIncrement]);

  // Handle card decrement
  const handleDecrement = useCallback((card: Card, event: React.MouseEvent) => {
    event.stopPropagation();
    onCardDecrement?.(card);
  }, [onCardDecrement]);

  // Keyboard shortcuts for card grid navigation
  useKeyboardShortcuts([
    {
      key: 'ArrowRight',
      description: 'Navigate to next card',
      handler: () => {
        if (cards.length === 0) return;
        setFocusedByKeyboard(true);
        setSelectedIndex(prev => {
          const next = prev < cards.length - 1 ? prev + 1 : prev;
          if (next !== prev && cards[next]) {
            setHoveredCard(cards[next]);
          }
          return next;
        });
      },
    },
    {
      key: 'ArrowLeft',
      description: 'Navigate to previous card',
      handler: () => {
        if (cards.length === 0) return;
        setFocusedByKeyboard(true);
        setSelectedIndex(prev => {
          const next = prev > 0 ? prev - 1 : prev;
          if (next !== prev && cards[next]) {
            setHoveredCard(cards[next]);
          }
          return next;
        });
      },
    },
    {
      key: 'ArrowDown',
      description: 'Navigate down in grid',
      handler: () => {
        if (cards.length === 0) return;
        setFocusedByKeyboard(true);
        setSelectedIndex(prev => {
          const next = Math.min(prev + columnCount, cards.length - 1);
          if (next !== prev && cards[next]) {
            setHoveredCard(cards[next]);
          }
          return next;
        });
      },
    },
    {
      key: 'ArrowUp',
      description: 'Navigate up in grid',
      handler: () => {
        if (cards.length === 0) return;
        setFocusedByKeyboard(true);
        setSelectedIndex(prev => {
          const next = Math.max(prev - columnCount, 0);
          if (next !== prev && cards[next]) {
            setHoveredCard(cards[next]);
          }
          return next;
        });
      },
    },
    {
      key: 'Enter',
      description: 'Add selected card',
      handler: () => {
        if (selectedIndex >= 0 && selectedIndex < cards.length) {
          onCardClick(cards[selectedIndex]);
        }
      },
    },
    {
      key: 'Escape',
      description: 'Clear selection',
      handler: () => {
        setSelectedIndex(-1);
        setHoveredCard(null);
        setFocusedByKeyboard(false);
      },
    },
  ], cards.length > 0);

  // Cell renderer for react-window
  const Cell = useCallback(({ columnIndex, rowIndex, style }: any) => {
    const index = rowIndex * columnCount + columnIndex;
    if (index >= cards.length) return null;

    const card = cards[index];
    const currentCount = getCardCount(card.id);

    const isSelected = index === selectedIndex && focusedByKeyboard;

    return (
      <div style={style}>
        <div 
          className={`card-grid-item ${isSelected ? 'card-grid-item-selected' : ''}`}
          style={{
            outline: isSelected ? '3px solid #0066cc' : 'none',
            outlineOffset: '2px',
          }}
        >
          <DraggableCard
            card={card}
            sourceZone="pool"
            onClick={() => {
              setFocusedByKeyboard(false);
              onCardClick(card);
            }}
            onMouseEnter={(e) => {
              setFocusedByKeyboard(false);
              handleCardHover(card, e);
            }}
            onMouseMove={(e) => setPreviewPosition({ x: e.clientX, y: e.clientY })}
            onMouseLeave={() => handleCardHover(null)}
          >
            {(onCardIncrement || onCardDecrement) && (
              <QuickAddControls
                card={card}
                currentCount={currentCount}
                maxCount={maxCopiesPerCard}
                onIncrement={(e) => handleIncrement(card, e)}
                onDecrement={(e) => handleDecrement(card, e)}
              />
            )}
          </DraggableCard>
        </div>
      </div>
    );
  }, [cards, columnCount, getCardCount, onCardClick, handleCardHover, handleIncrement, handleDecrement, onCardIncrement, onCardDecrement, maxCopiesPerCard, selectedIndex, focusedByKeyboard]);

  // Memoize grid to prevent unnecessary re-renders
  const gridElement = useMemo(() => (
    <Grid
      columnCount={columnCount}
      columnWidth={columnWidth}
      height={Math.min(800, rowCount * rowHeight)}
      rowCount={rowCount}
      rowHeight={rowHeight}
      width={containerWidth}
      className="card-grid-window"
    >
      {Cell}
    </Grid>
  ), [columnCount, columnWidth, rowCount, rowHeight, containerWidth, Cell]);

  if (cards.length === 0) {
    return (
      <div className="card-grid-empty">
        <div style={{ fontSize: '48px', marginBottom: '10px', opacity: 0.5 }}>🔍</div>
        <p>No cards found. Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <div className="card-grid-container" ref={containerRef}>
      {gridElement}
      <CardPreview card={hoveredCard} position={previewPosition} />
    </div>
  );
};
