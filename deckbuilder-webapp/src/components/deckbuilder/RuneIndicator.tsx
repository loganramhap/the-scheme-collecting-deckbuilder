import React from 'react';

interface RuneIndicatorProps {
  legendDomain: string | null;
}

// Map domain names to visual colors
const DOMAIN_COLOR_MAP: Record<string, string> = {
  'Fury': '#e74c3c',
  'Calm': '#3498db',
  'Mind': '#9b59b6',
  'Body': '#2ecc71',
  'Order': '#f1c40f',
  'Colorless': '#95a5a6',
};

export const RuneIndicator: React.FC<RuneIndicatorProps> = ({
  legendDomain,
}) => {
  return (
    <div className="rune-indicator">
      <h3 style={{ marginTop: 0, marginBottom: '10px', fontSize: '16px' }}>Legend Domain</h3>
      
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
        {legendDomain ? (
          <>
            <div style={{ 
              display: 'flex', 
              gap: '15px', 
              flexWrap: 'wrap',
              justifyContent: 'center',
              marginBottom: '15px'
            }}>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: DOMAIN_COLOR_MAP[legendDomain] || '#888',
                  border: '3px solid #fff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '24px',
                  color: '#fff',
                }}
                title={legendDomain}
              >
                {legendDomain.charAt(0).toUpperCase()}
              </div>
            </div>
            
            <div style={{ 
              fontSize: '16px', 
              color: '#fff',
              textAlign: 'center',
              fontWeight: 'bold',
              marginBottom: '5px'
            }}>
              {legendDomain}
            </div>
            
            <div style={{ 
              fontSize: '12px', 
              color: '#888',
              marginTop: '10px',
              textAlign: 'center'
            }}>
              Only {legendDomain} and Colorless cards can be added to your deck
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', color: '#888' }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>✨</div>
            <div style={{ fontSize: '14px' }}>No domain active</div>
            <div style={{ fontSize: '12px', marginTop: '5px' }}>
              Select a Legend to activate a domain
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
