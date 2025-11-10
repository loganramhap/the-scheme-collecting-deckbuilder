import React from 'react';

interface ColorIdentityIndicatorProps {
  colorIdentity: string[];
}

// MTG color mapping
const COLOR_INFO: Record<string, { name: string; symbol: string; color: string }> = {
  W: { name: 'White', symbol: '☀️', color: '#F0E68C' },
  U: { name: 'Blue', symbol: '💧', color: '#0E68AB' },
  B: { name: 'Black', symbol: '💀', color: '#150B00' },
  R: { name: 'Red', symbol: '🔥', color: '#D3202A' },
  G: { name: 'Green', symbol: '🌲', color: '#00733E' },
};

export const ColorIdentityIndicator: React.FC<ColorIdentityIndicatorProps> = ({
  colorIdentity,
}) => {
  return (
    <div className="color-identity-indicator">
      <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '16px' }}>
        Color Identity
      </h3>
      
      {colorIdentity.length === 0 ? (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: '#888',
          background: '#2a2a2a',
          borderRadius: '8px',
          border: '2px dashed #555',
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚪</div>
          <div style={{ fontSize: '14px' }}>Colorless</div>
          <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.7 }}>
            Select a commander to see color identity
          </div>
        </div>
      ) : (
        <div>
          <div style={{
            display: 'flex',
            gap: '15px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            padding: '20px',
            background: '#2a2a2a',
            borderRadius: '8px',
            border: '2px solid #555',
          }}>
            {colorIdentity.map(color => {
              const info = COLOR_INFO[color];
              if (!info) return null;
              
              return (
                <div
                  key={color}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: info.color,
                      border: '3px solid #fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '28px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    }}
                  >
                    {info.symbol}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#fff',
                  }}>
                    {info.name}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div style={{
            marginTop: '15px',
            padding: '12px',
            background: '#1a1a1a',
            borderRadius: '6px',
            fontSize: '13px',
            color: '#aaa',
            textAlign: 'center',
          }}>
            <strong>Active Colors:</strong> {colorIdentity.join(', ')}
            <br />
            <span style={{ fontSize: '11px', opacity: 0.8 }}>
              Only cards matching these colors can be added to your deck
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
