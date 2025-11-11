import { useState, useEffect } from 'react';
import { cardImageCache } from '../services/cardImageCache';
import { Card, MTGCard, RiftboundCard } from '../types/card';

interface UseCardImageResult {
  imageUrl: string | null;
  isLoading: boolean;
  error: Error | null;
  retry: () => void;
}

/**
 * Hook that loads card images from cache or network
 * Automatically caches fetched images for future use
 */
export function useCardImage(card: Card | null): UseCardImageResult {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  const loadImage = async (isMounted: { current: boolean }) => {
    setIsLoading(true);
    setError(null);

    try {
      // Determine the image URL based on card type
      const sourceUrl = getCardImageUrl(card!);
      
      if (!sourceUrl) {
        throw new Error('No image URL available for this card');
      }

      // For Riftbound cards, use direct URL without caching (CORS issues)
      const isRiftbound = 'image_url' in card! && !('image_uris' in card!);
      
      if (isRiftbound) {
        if (isMounted.current) {
          setImageUrl(sourceUrl);
          setIsLoading(false);
        }
        return;
      }

      // For MTG cards, use caching
      // Try to get from cache first
      const cachedUrl = await cardImageCache.get(card!.id);
      
      if (cachedUrl && isMounted.current) {
        setImageUrl(cachedUrl);
        setIsLoading(false);
        return;
      }

      // Cache the image (this will fetch it)
      await cardImageCache.set(card!.id, sourceUrl);

      // Get the cached version (as object URL)
      const newCachedUrl = await cardImageCache.get(card!.id);
      
      if (isMounted.current) {
        setImageUrl(newCachedUrl);
        setIsLoading(false);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err : new Error('Failed to load image'));
        setIsLoading(false);
        
        // Fallback to direct URL if caching fails
        const fallbackUrl = getCardImageUrl(card!);
        if (fallbackUrl) {
          setImageUrl(fallbackUrl);
        }
      }
    }
  };

  useEffect(() => {
    if (!card) {
      setImageUrl(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const isMounted = { current: true };
    loadImage(isMounted);

    // Cleanup function
    return () => {
      isMounted.current = false;
    };
  }, [card?.id, retryCount]); // Re-run if card ID changes or retry is triggered

  const retry = () => {
    if (card) {
      setRetryCount(prev => prev + 1);
    }
  };

  return { imageUrl, isLoading, error, retry };
}

/**
 * Helper function to extract image URL from different card types
 */
function getCardImageUrl(card: Card): string | null {
  // Check if it's an MTG card
  if ('image_uris' in card) {
    const mtgCard = card as MTGCard;
    return mtgCard.image_uris?.normal || mtgCard.image_uris?.large || mtgCard.image_uris?.small || null;
  }
  
  // Check if it's a Riftbound card
  if ('image_url' in card) {
    const riftboundCard = card as RiftboundCard;
    return riftboundCard.image_url || null;
  }

  return null;
}

/**
 * Hook variant that accepts a card ID and image URL directly
 * Useful when you already have the image URL and just want caching
 */
export function useCardImageById(cardId: string | null, imageUrl: string | null): UseCardImageResult {
  const [cachedUrl, setCachedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  useEffect(() => {
    if (!cardId || !imageUrl) {
      setCachedUrl(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;

    const loadImage = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Try to get from cache first
        const cached = await cardImageCache.get(cardId);
        
        if (cached && isMounted) {
          setCachedUrl(cached);
          setIsLoading(false);
          return;
        }

        // Cache the image
        await cardImageCache.set(cardId, imageUrl);

        // Get the cached version
        const newCached = await cardImageCache.get(cardId);
        
        if (isMounted) {
          setCachedUrl(newCached);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load image'));
          setIsLoading(false);
          // Fallback to original URL
          setCachedUrl(imageUrl);
        }
      }
    };

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [cardId, imageUrl, retryCount]);

  const retry = () => {
    if (cardId && imageUrl) {
      setRetryCount(prev => prev + 1);
    }
  };

  return { imageUrl: cachedUrl, isLoading, error, retry };
}
