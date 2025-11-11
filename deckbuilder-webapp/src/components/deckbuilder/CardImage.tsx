import React, { useState } from 'react';
import { Card } from '../../types/card';
import { useCardImage } from '../../hooks/useCardImage';
import './CardImage.css';

interface CardImageProps {
  card: Card;
  size?: 'small' | 'normal' | 'large';
  className?: string;
}

export const CardImage: React.FC<CardImageProps> = React.memo(({ 
  card, 
  size = 'normal',
  className = '' 
}) => {
  const { imageUrl, isLoading, error, retry } = useCardImage(card);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Check if this is a battlefield card (horizontal layout)
  const isBattlefield = 'type' in card && 
    (card.type?.toLowerCase() === 'battlefield' || 
     ('card_type' in card && (card as any).card_type?.toLowerCase() === 'battlefield'));

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoaded(true);
    setImageError(true);
  };

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageLoaded(false);
    setImageError(false);
    retry();
  };

  return (
    <div className={`card-image-container card-image-${size} ${isBattlefield ? 'card-image-battlefield' : ''} ${className}`}>
      {/* Loading skeleton */}
      {(isLoading || !imageLoaded) && !imageError && (
        <div className="card-image-skeleton">
          <div className="skeleton-shimmer"></div>
        </div>
      )}

      {/* Actual image */}
      {imageUrl && !error && !imageError && (
        <img
          src={imageUrl}
          alt={card.name}
          className={`card-image ${imageLoaded ? 'card-image-loaded' : 'card-image-loading'}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
        />
      )}

      {/* Error fallback with retry */}
      {(error || imageError) && imageLoaded && (
        <div className="card-image-error">
          <div className="card-image-error-icon">🖼️</div>
          <div className="card-image-error-text">{card.name}</div>
          <button 
            className="card-image-retry-button"
            onClick={handleRetry}
            title="Retry loading image"
          >
            ↻ Retry
          </button>
        </div>
      )}
    </div>
  );
});
