import React from 'react';
import { DeckCard } from '../../types/deck';
import { RiftboundCard } from '../../types/card';
import { isBasicRune, isBattlefield, isLegend } from '../../utils/riftboundCardTypes';

interface DeckStatisticsProps {
  mainDeckCards: DeckCard[];
  runeDeck: DeckCard[];
  battlefields: DeckCard[];
  availableCards: RiftboundCard[];
}

interface ZoneStats {
  current: number;
  target: number;
  label: string;
  color: string;
  icon: string;
}

export const DeckStatistics: React.FC<DeckStatisticsProps> = ({
  mainDeckCards,
  runeDeck,
  battlefields,
  availableCards,
}) => {
  // Calculate main deck count (excluding Basic Runes, Battlefields, and Legends)
  const mainDeckCount = mainDeckCards.reduce((sum, card) => {
    const fullCard = availableCards.find(c => c.id === card.id);
    if (!fullCard) {
      return sum + card.count;
    }
    
    if (isBasicRune(fullCard) || isBattlefield(fullCard) || isLegend(fullCard)) {
      return sum;
    }
    
    return sum + card.count;
  }, 0);

  // Calculate rune deck count
  const runeDeckCount = runeDeck.reduce((sum, card) => sum + card.count, 0);

  // Battlefield count
  const battlefieldCount = battlefields.length;

  // Define zone statistics
  const zones: ZoneStats[] = [
    {
      current: mainDeckCount,
      target: 40,
      label: 'Main Deck',
      color: '#4caf50',
      icon: '🃏',
    },
    {
      current: runeDeckCount,
      target: 12,
      label: 'Rune Deck',
      color: '#ff9800',
      icon: '✨',
    },
    {
      current: battlefieldCount,
      target: 3,
      label: 'Battlefields',
      color: '#2196f3',
      icon: '🏔️',
    },
  ];

  const getStatusColor = (current: number, target: number, baseColor: string): string => {
    if (current === target) return '#4caf50'; // Green when complete
    if (current > target) return '#f44336'; // Red when over
    return baseColor; // Base color when under
  };

  return (
    <div style={{
      padding: '16px',
      background: '#1a1a1a',
      borderRadius: '8px',
      border: '1px solid #2a2a2a',
    }}>
      <h3 style={{ 
        margin: '0 0 12px 0', 
        fontSize: '14px',
        color: '#fff',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}>
        Deck Progress
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {zones.map((zone) => {
          const statusColor = getStatusColor(zone.current, zone.target, zone.color);
          const percentage = Math.min((zone.current / zone.target) * 100, 100);

          return (
            <div key={zone.label}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '5px',
              }}>
                <div style={{ 
                  fontSize: '12px',
                  color: '#aaa',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontWeight: '500',
                }}>
                  <span style={{ fontSize: '14px' }}>{zone.icon}</span>
                  <span>{zone.label}</span>
                </div>
                <div style={{
                  fontSize: '13px',
                  fontWeight: 'bold',
                  color: statusColor,
                  fontFamily: 'monospace',
                }}>
                  {zone.current} / {zone.target}
                </div>
              </div>

              {/* Progress bar */}
              <div style={{
                width: '100%',
                height: '6px',
                background: '#2a2a2a',
                borderRadius: '3px',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${percentage}%`,
                  height: '100%',
                  background: statusColor,
                  transition: 'width 0.3s ease, background-color 0.3s ease',
                  borderRadius: '3px',
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
