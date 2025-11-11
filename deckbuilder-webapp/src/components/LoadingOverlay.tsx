import React from 'react';
import { Spinner } from './Spinner';

export interface LoadingOverlayProps {
  message?: string;
  fullScreen?: boolean;
}

/**
 * Loading overlay component for async operations
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = 'Loading...',
  fullScreen = false,
}) => {
  return (
    <div
      className="loading-overlay"
      style={{
        position: fullScreen ? 'fixed' : 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: fullScreen ? 9998 : 100,
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        className="loading-content"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          padding: '2rem',
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
      >
        <Spinner size="lg" />
        <span
          style={{
            color: '#374151',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          {message}
        </span>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};
