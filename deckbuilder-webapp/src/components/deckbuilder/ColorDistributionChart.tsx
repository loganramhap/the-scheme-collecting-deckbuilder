import React, { useMemo } from 'react';
import { Deck } from '../../types/deck';
import { MTGCard, RiftboundCard } from '../../types/card';
import './ColorDistributionChart.css';

interface ColorDistributionChartProps {
  deck: Deck;
  availableCards: (MTGCard | RiftboundCard)[];
}

interface ColorData {
  color: string;
  count: number;
  percentage: number;
  label: string;
  displayColor: string;
}

export const ColorDistributionChart: React.FC<ColorDistributionChartProps> = ({ deck, availableCards }) => {
  // Calculate color distribution based on game type
  const colorDistribution = useMemo(() => {
    const colorCounts: Record<string, number> = {};
    let totalColoredCards = 0;

    deck.cards.forEach(deckCard => {
      const card = availableCards.find(c => c.id === deckCard.id);
      if (!card) return;

      if (deck.game === 'mtg') {
        const mtgCard = card as MTGCard;
        const colors = mtgCard.colors || [];
        
        if (colors.length === 0) {
          // Colorless
          colorCounts['C'] = (colorCounts['C'] || 0) + deckCard.count;
        } else {
          colors.forEach(color => {
            colorCounts[color] = (colorCounts[color] || 0) + deckCard.count;
            totalColoredCards += deckCard.count;
          });
        }
      } else if (deck.game === 'riftbound') {
        const riftboundCard = card as RiftboundCard;
        const runeColors = riftboundCard.runeColors || [];
        
        if (runeColors.length === 0) {
          // Neutral
          colorCounts['Neutral'] = (colorCounts['Neutral'] || 0) + deckCard.count;
        } else {
          runeColors.forEach(color => {
            colorCounts[color] = (colorCounts[color] || 0) + deckCard.count;
            totalColoredCards += deckCard.count;
          });
        }
      }
    });

    // Calculate percentages
    const totalCards = deck.cards.reduce((sum, card) => sum + card.count, 0);
    const distribution: ColorData[] = Object.entries(colorCounts).map(([color, count]) => ({
      color,
      count,
      percentage: totalCards > 0 ? (count / totalCards) * 100 : 0,
      label: getColorLabel(color, deck.game),
      displayColor: getColorDisplay(color, deck.game),
    }));

    // Sort by count descending
    return distribution.sort((a, b) => b.count - a.count);
  }, [deck, availableCards]);

  if (colorDistribution.length === 0) {
    return (
      <div className="color-distribution-chart">
        <div className="chart-header">
          <h4>Color Distribution</h4>
        </div>
        <div className="no-data">No cards in deck</div>
      </div>
    );
  }

  return (
    <div className="color-distribution-chart">
      <div className="chart-header">
        <h4>{deck.game === 'mtg' ? 'Mana Color Distribution' : 'Rune Color Distribution'}</h4>
      </div>

      {/* Bar Chart */}
      <div className="bar-chart">
        {colorDistribution.map((data) => (
          <div key={data.color} className="bar-chart-row">
            <div className="bar-label">
              <span 
                className="color-indicator" 
                style={{ backgroundColor: data.displayColor }}
              />
              <span className="color-name">{data.label}</span>
            </div>
            <div className="bar-container">
              <div 
                className="bar-fill" 
                style={{ 
                  width: `${data.percentage}%`,
                  backgroundColor: data.displayColor,
                }}
              />
            </div>
            <div className="bar-stats">
              <span className="card-count">{data.count}</span>
              <span className="percentage">{data.percentage.toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="distribution-summary">
        <div className="summary-item">
          <span className="summary-label">Total Colors:</span>
          <span className="summary-value">{colorDistribution.length}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Most Common:</span>
          <span className="summary-value">{colorDistribution[0]?.label || 'N/A'}</span>
        </div>
      </div>
    </div>
  );
};

// Helper function to get color label
function getColorLabel(color: string, gameType: string): string {
  if (gameType === 'mtg') {
    const mtgColors: Record<string, string> = {
      'W': 'White',
      'U': 'Blue',
      'B': 'Black',
      'R': 'Red',
      'G': 'Green',
      'C': 'Colorless',
    };
    return mtgColors[color] || color;
  } else {
    // Riftbound - capitalize first letter
    return color.charAt(0).toUpperCase() + color.slice(1);
  }
}

// Helper function to get display color
function getColorDisplay(color: string, gameType: string): string {
  if (gameType === 'mtg') {
    const mtgColors: Record<string, string> = {
      'W': '#f0f0c0',
      'U': '#0066cc',
      'B': '#1a1a1a',
      'R': '#cc3333',
      'G': '#00aa44',
      'C': '#999999',
    };
    return mtgColors[color] || '#666666';
  } else {
    // Riftbound rune colors
    const riftboundColors: Record<string, string> = {
      'Red': '#cc3333',
      'Blue': '#0066cc',
      'Green': '#00aa44',
      'Yellow': '#ffcc00',
      'Purple': '#9933cc',
      'Black': '#1a1a1a',
      'White': '#f0f0f0',
      'Neutral': '#999999',
    };
    return riftboundColors[color] || '#666666';
  }
}
