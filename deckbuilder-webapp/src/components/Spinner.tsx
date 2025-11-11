import React from 'react';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

/**
 * Reusable spinner component for loading states
 */
export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = '#3b82f6',
  className = '',
}) => {
  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 40,
  };

  const borderWidth = {
    sm: 2,
    md: 3,
    lg: 4,
  };

  const spinnerSize = sizeMap[size];
  const borderSize = borderWidth[size];

  return (
    <div
      className={`spinner ${className}`}
      style={{
        width: `${spinnerSize}px`,
        height: `${spinnerSize}px`,
        border: `${borderSize}px solid #e5e7eb`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    >
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
