import React from 'react';
import { ValidationResult } from '../../utils/deckValidation';

interface ValidationPanelProps {
  validationResult: ValidationResult;
}

interface ValidationItem {
  message: string;
  type: 'error' | 'warning' | 'success';
  icon: string;
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({ validationResult }) => {
  const { isValid, errors, warnings } = validationResult;

  // Build list of all validation items with severity
  const validationItems: ValidationItem[] = [];

  // Add errors (highest severity - red)
  errors.forEach(error => {
    validationItems.push({
      message: error,
      type: 'error',
      icon: '❌',
    });
  });

  // Add warnings (medium severity - orange)
  warnings.forEach(warning => {
    validationItems.push({
      message: warning,
      type: 'warning',
      icon: '⚠️',
    });
  });

  // Add success indicator when deck is valid
  if (isValid) {
    validationItems.push({
      message: 'Deck is valid and ready to play!',
      type: 'success',
      icon: '✅',
    });
  }

  // Determine panel background and border color based on validation state
  const getPanelStyle = () => {
    if (isValid) {
      return {
        background: 'linear-gradient(135deg, #1a2a1a 0%, #1a1a1a 100%)',
        border: '2px solid #4caf50',
        boxShadow: '0 0 20px rgba(76, 175, 80, 0.2)',
      };
    }
    
    if (errors.length > 0) {
      return {
        background: 'linear-gradient(135deg, #2a1a1a 0%, #1a1a1a 100%)',
        border: '2px solid #f44336',
        boxShadow: '0 0 20px rgba(244, 67, 54, 0.2)',
      };
    }
    
    return {
      background: 'linear-gradient(135deg, #2a2a1a 0%, #1a1a1a 100%)',
      border: '2px solid #ff9800',
      boxShadow: '0 0 20px rgba(255, 152, 0, 0.2)',
    };
  };

  // Get color for each validation item type
  const getItemColor = (type: 'error' | 'warning' | 'success') => {
    switch (type) {
      case 'error':
        return '#f44336'; // Red
      case 'warning':
        return '#ff9800'; // Orange
      case 'success':
        return '#4caf50'; // Green
    }
  };

  // Get background color for each validation item
  const getItemBackground = (type: 'error' | 'warning' | 'success') => {
    switch (type) {
      case 'error':
        return 'rgba(244, 67, 54, 0.1)';
      case 'warning':
        return 'rgba(255, 152, 0, 0.1)';
      case 'success':
        return 'rgba(76, 175, 80, 0.1)';
    }
  };

  return (
    <div
      style={{
        padding: '16px',
        borderRadius: '8px',
        transition: 'all 0.3s ease',
        ...getPanelStyle(),
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: validationItems.length > 0 ? '12px' : '0',
        }}
      >
        <div
          style={{
            fontSize: '18px',
          }}
        >
          {isValid ? '✅' : errors.length > 0 ? '❌' : '⚠️'}
        </div>
        <h3
          style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: isValid ? '#4caf50' : errors.length > 0 ? '#f44336' : '#ff9800',
          }}
        >
          {isValid ? 'Deck Valid' : 'Validation'}
        </h3>
      </div>

      {/* Validation items list */}
      {validationItems.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {validationItems.map((item, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '10px',
                background: getItemBackground(item.type),
                border: `1px solid ${getItemColor(item.type)}`,
                borderRadius: '6px',
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  fontSize: '14px',
                  flexShrink: 0,
                  marginTop: '1px',
                }}
              >
                {item.icon}
              </div>
              <div
                style={{
                  fontSize: '12px',
                  lineHeight: '1.4',
                  color: item.type === 'success' ? '#81c784' : item.type === 'error' ? '#ff8a80' : '#ffb74d',
                  flex: 1,
                }}
              >
                {item.message}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary footer for invalid decks */}
      {!isValid && (
        <div
          style={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '11px',
            color: '#999',
            textAlign: 'center',
          }}
        >
          {errors.length > 0 && (
            <div>
              {errors.length} error{errors.length !== 1 ? 's' : ''} must be fixed
              {warnings.length > 0 && `, ${warnings.length} warning${warnings.length !== 1 ? 's' : ''}`}
            </div>
          )}
          {errors.length === 0 && warnings.length > 0 && (
            <div>{warnings.length} warning{warnings.length !== 1 ? 's' : ''}</div>
          )}
        </div>
      )}
    </div>
  );
};
