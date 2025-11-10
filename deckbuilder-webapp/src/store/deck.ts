import { create } from 'zustand';
import type { Deck, DeckCard } from '../types/deck';

interface DeckState {
  currentDeck: Deck | null;
  isDirty: boolean;
  setDeck: (deck: Deck) => void;
  addCard: (card: DeckCard) => void;
  removeCard: (cardId: string) => void;
  updateCardCount: (cardId: string, count: number) => void;
  clearDeck: () => void;
  markClean: () => void;
}

export const useDeckStore = create<DeckState>((set) => ({
  currentDeck: null,
  isDirty: false,

  setDeck: (deck) => set({ currentDeck: deck, isDirty: false }),

  addCard: (card) =>
    set((state) => {
      if (!state.currentDeck) return state;
      
      const existingCard = state.currentDeck.cards.find(c => c.id === card.id);
      
      if (existingCard) {
        return {
          currentDeck: {
            ...state.currentDeck,
            cards: state.currentDeck.cards.map(c =>
              c.id === card.id ? { ...c, count: c.count + card.count } : c
            ),
          },
          isDirty: true,
        };
      }
      
      return {
        currentDeck: {
          ...state.currentDeck,
          cards: [...state.currentDeck.cards, card],
        },
        isDirty: true,
      };
    }),

  removeCard: (cardId) =>
    set((state) => {
      if (!state.currentDeck) return state;
      
      return {
        currentDeck: {
          ...state.currentDeck,
          cards: state.currentDeck.cards.filter(c => c.id !== cardId),
        },
        isDirty: true,
      };
    }),

  updateCardCount: (cardId, count) =>
    set((state) => {
      if (!state.currentDeck) return state;
      
      if (count <= 0) {
        return {
          currentDeck: {
            ...state.currentDeck,
            cards: state.currentDeck.cards.filter(c => c.id !== cardId),
          },
          isDirty: true,
        };
      }
      
      return {
        currentDeck: {
          ...state.currentDeck,
          cards: state.currentDeck.cards.map(c =>
            c.id === cardId ? { ...c, count } : c
          ),
        },
        isDirty: true,
      };
    }),

  clearDeck: () => set({ currentDeck: null, isDirty: false }),

  markClean: () => set({ isDirty: false }),
}));
