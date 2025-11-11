import React, { useState, useEffect } from 'react';
import { getRiotCardService, getCardSource } from '../services/riftboundCards';
import { shouldUseRiotAPI } from '../config/riot';
import { RiotAPIError } from '../services/RiotAPIError';

interface CardDataRefreshButtonProps {
  onRefreshComplete?: (success: boolean, message: string) => void;
}

/**
 * Button component for refreshing card data from Riot API
 * Displays last update timestamp and loading state
 */
export const CardDataRefreshButton: React.FC<CardDataRefreshButtonProps> = ({
  onRefreshComplete,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [cacheAge, setCacheAge] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'warning' | 'error' | null>(null);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);

  // Get Riot API service
  const riotService = getRiotCardService();
  const cardSource = getCardSource();
  const isAPIEnabled = shouldUseRiotAPI();

  // Load cache timestamp on mount
  useEffect(() => {
    if (riotService) {
      const age = riotService.getCacheAge();
      if (age !== null) {
        setCacheAge(age);
        setLastUpdate(new Date(Date.now() - age));
      }
    }
  }, [riotService]);

  // Update cache age every minute
  useEffect(() => {
    const interval = setInterval(() => {
      if (riotService) {
        const age = riotService.getCacheAge();
        if (age !== null) {
          setCacheAge(age);
          setLastUpdate(new Date(Date.now() - age));
        }
      }
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [riotService]);

  const handleRefresh = async () => {
    if (!riotService) {
      const message = 'Riot API is not configured. Please set VITE_RIOT_API_KEY in your .env file.';
      setError(message);
      setErrorType('error');
      onRefreshComplete?.(false, message);
      return;
    }

    setIsRefreshing(true);
    setError(null);
    setErrorType(null);
    setRetryAfter(null);

    try {
      // Force refresh from API
      await riotService.getCards(true);
      
      // Update cache age
      const age = riotService.getCacheAge();
      if (age !== null) {
        setCacheAge(age);
        setLastUpdate(new Date(Date.now() - age));
      }

      const message = 'Card data updated successfully!';
      onRefreshComplete?.(true, message);
      
      // Reload the page to apply new card data
      window.location.reload();
    } catch (err) {
      // Handle RiotAPIError with detailed information
      if (err instanceof RiotAPIError) {
        const userMessage = err.getUserFriendlyMessage();
        setError(userMessage);
        
        // Set error type based on recoverability
        setErrorType(err.canRecover() ? 'warning' : 'error');
        
        // Store retry delay if rate limited
        if (err.statusCode === 429 && err.getRetryDelay()) {
          setRetryAfter(err.getRetryDelay()!);
        }
        
        onRefreshComplete?.(false, userMessage);
      } else {
        // Handle generic errors
        const errorMessage = err instanceof Error ? err.message : 'Failed to update card data';
        setError(errorMessage);
        setErrorType('error');
        onRefreshComplete?.(false, errorMessage);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatCacheAge = (ageMs: number): string => {
    const hours = Math.floor(ageMs / (1000 * 60 * 60));
    const minutes = Math.floor((ageMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else {
      return 'just now';
    }
  };

  // Don't show button if API is not enabled
  if (!isAPIEnabled) {
    return null;
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '8px 12px',
      background: 'rgba(33, 150, 243, 0.1)',
      border: '1px solid rgba(33, 150, 243, 0.3)',
      borderRadius: '8px',
    }}>
      <button
        onClick={handleRefresh}
        disabled={isRefreshing || !riotService}
        style={{
          padding: '6px 16px',
          background: isRefreshing 
            ? 'rgba(156, 39, 176, 0.3)' 
            : 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: '600',
          cursor: isRefreshing || !riotService ? 'not-allowed' : 'pointer',
          opacity: isRefreshing || !riotService ? 0.6 : 1,
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
        onMouseEnter={(e) => {
          if (!isRefreshing && riotService) {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(33, 150, 243, 0.3)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {isRefreshing ? (
          <>
            <span style={{
              display: 'inline-block',
              width: '12px',
              height: '12px',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderTopColor: '#fff',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            Updating...
          </>
        ) : (
          <>
            <span>🔄</span>
            Refresh Cards
          </>
        )}
      </button>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        fontSize: '11px',
        color: '#999',
      }}>
        {lastUpdate && cacheAge !== null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#2196f3' }}>⏱</span>
            <span>Updated {formatCacheAge(cacheAge)}</span>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: cardSource === 'api' ? '#4caf50' : '#ff9800' }}>
            {cardSource === 'api' ? '✓' : '📁'}
          </span>
          <span>
            {cardSource === 'api' ? 'Using Riot API' : 'Using local database'}
          </span>
        </div>
      </div>

      {error && (
        <div style={{
          marginLeft: 'auto',
          padding: '8px 12px',
          background: errorType === 'error' 
            ? 'rgba(244, 67, 54, 0.1)' 
            : 'rgba(255, 152, 0, 0.1)',
          border: errorType === 'error'
            ? '1px solid rgba(244, 67, 54, 0.3)'
            : '1px solid rgba(255, 152, 0, 0.3)',
          borderRadius: '6px',
          fontSize: '12px',
          color: errorType === 'error' ? '#f44336' : '#ff9800',
          maxWidth: '300px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: '6px',
            fontWeight: '500',
          }}>
            <span>{errorType === 'error' ? '❌' : '⚠️'}</span>
            <span style={{ flex: 1 }}>{error}</span>
          </div>
          {retryAfter && (
            <div style={{
              fontSize: '10px',
              opacity: 0.8,
              paddingLeft: '20px',
            }}>
              Please wait {retryAfter} seconds before retrying.
            </div>
          )}
          {errorType === 'warning' && (
            <div style={{
              fontSize: '10px',
              opacity: 0.8,
              paddingLeft: '20px',
            }}>
              Using cached data instead.
            </div>
          )}
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};
