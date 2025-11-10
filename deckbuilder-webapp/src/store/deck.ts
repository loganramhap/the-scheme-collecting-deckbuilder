import { create } from 'zustand';
import type { Deck, DeckCard } from '../types/deck';

interface DeckState {
  currentDeck: Deck | null;
  isDirty: boolean;
  setDeck: (deck: Deck) => void;
  addCard: (card: DeckCard) => void;
  removeCard: (cardId: string) => void;
  updateCardCount: (cardId: string, count: number) => void;
  setLegend: (card: DeckCard | null) => void;
  setBattlefield: (card: DeckCard | null) => void;
  setCommander: (card: DeckCard | null) => void;
  updateRuneColors: (colors: string[]) => void;
  updateColorIdentity: (colors: string[]) => void;
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

  setLegend: (card) =>
    set((state) => {
      if (!state.currentDeck) return state;
      return {
        currentDeck: {
          ...state.currentDeck,
          legend: card || undefined,
        },
        isDirty: true,
      };
    }),

  setBattlefield: (card) =>
    set((state) => {
      if (!state.currentDeck) return state;
      return {
        currentDeck: {
          ...state.currentDeck,
          battlefield: card || undefined,
        },
        isDirty: true,
      };
    }),

  setCommander: (card) =>
    set((state) => {
      if (!state.currentDeck) return state;
      return {
        currentDeck: {
          ...state.currentDeck,
          commander: card || undefined,
        },
        isDirty: true,
      };
    }),

  updateRuneColors: (colors) =>
    set((state) => {
      if (!state.currentDeck) return state;
      return {
        currentDeck: {
          ...state.currentDeck,
          runeColors: colors,
        },
        isDirty: true,
      };
    }),

  updateColorIdentity: (colors) =>
    set((state) => {
      if (!state.currentDeck) return state;
      return {
        currentDeck: {
          ...state.currentDeck,
          colorIdentity: colors,
        },
        isDirty: true,
      };
    }),

  clearDeck: () => set({ currentDeck: null, isDirty: false }),

  markClean: () => set({ isDirty: false }),
}));
