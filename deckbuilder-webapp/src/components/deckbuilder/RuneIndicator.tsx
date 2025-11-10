import React from 'react';

interface RuneIndicatorProps {
  activeRuneColors: string[];
}

// Map rune color names to visual colors
const RUNE_COLOR_MAP: Record<string, string> = {
  'red': '#e74c3c',
  'blue': '#3498db',
  'green': '#2ecc71',
  'black': '#34495e',
  'white': '#ecf0f1',
  'purple': '#9b59b6',
  'yellow': '#f1c40f',
  'orange': '#e67e22',
};

export const RuneIndicator: React.FC<RuneIndicatorProps> = ({
  activeRuneColors,
}) => {
  return (
    <div className="rune-indicator">
      <h3 style={{ marginTop: 0, marginBottom: '10px', fontSize: '16px' }}>Rune Colors</h3>
      
      <div style={{
        padding: '20px',
        background: '#2a2a2a',
        borderRadius: '8px',
        minHeight: '150px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        {activeRuneColors.length > 0 ? (
          <>
            <div style={{ 
              display: 'flex', 
              gap: '15px', 
              flexWrap: 'wrap',
              justifyContent: 'center',
              marginBottom: '15px'
            }}>
              {activeRuneColors.map(color => (
                <div
                  key={color}
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: RUNE_COLOR_MAP[color.toLowerCase()] || '#888',
                    border: '3px solid #fff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '20px',
                    color: color.toLowerCase() === 'white' ? '#000' : '#fff',
                  }}
                  title={color}
                >
                  {color.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
            
            <div style={{ 
              fontSize: '14px', 
              color: '#aaa',
              textAlign: 'center'
            }}>
              {activeRuneColors.length} {activeRuneColors.length === 1 ? 'color' : 'colors'} active
            </div>
            
            <div style={{ 
              fontSize: '12px', 
              color: '#888',
              marginTop: '10px',
              textAlign: 'center'
            }}>
              Only cards matching these rune colors can be added to your deck
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', color: '#888' }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>✨</div>
            <div style={{ fontSize: '14px' }}>No rune colors active</div>
            <div style={{ fontSize: '12px', marginTop: '5px' }}>
              Select a Legend to activate rune colors
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
