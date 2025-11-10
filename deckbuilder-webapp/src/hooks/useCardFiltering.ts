import { useMemo } from 'react';
import { Card } from '../types/card';
import { CardFilters } from '../types/filters';
import { filterCards } from '../utils/cardFiltering';

/**
 * Custom hook that provides memoized card filtering
 * Only recalculates when cards or filters change
 */
export function useCardFiltering(cards: Card[], filters: CardFilters): Card[] {
  return useMemo(() => {
    return filterCards(cards, filters);
  }, [cards, filters]);
}

/**
 * Hook that provides filtered cards with additional metadata
 */
export function useCardFilteringWithStats(cards: Card[], filters: CardFilters) {
  return useMemo(() => {
    const filteredCards = filterCards(cards, filters);
    
    return {
      cards: filteredCards,
      totalCount: cards.length,
      filteredCount: filteredCards.length,
      hasFilters: (
        filters.types.length > 0 ||
        filters.rarities.length > 0 ||
        filters.colors.length > 0 ||
        filters.minCost !== null ||
        filters.maxCost !== null ||
        filters.searchQuery.length > 0
      ),
    };
  }, [cards, filters]);
}
