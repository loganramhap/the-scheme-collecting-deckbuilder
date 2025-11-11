import React from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

/**
 * Component that displays network status warnings
 */
export const NetworkStatusIndicator: React.FC = () => {
  const { isOnline, wasOffline } = useNetworkStatus();

  if (isOnline && !wasOffline) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        animation: 'slideDown 0.3s ease',
      }}
    >
      {!isOnline && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#fef3c7',
            color: '#92400e',
            border: '1px solid #fbbf24',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>⚠️</span>
          <span>You are currently offline. Some features may not work.</span>
        </div>
      )}

      {isOnline && wasOffline && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#dcfce7',
            color: '#166534',
            border: '1px solid #86efac',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>✓</span>
          <span>Back online!</span>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
      `}</style>
    </div>
  );
};
