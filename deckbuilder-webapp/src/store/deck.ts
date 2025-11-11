import { create } from 'zustand';
import type { Deck, DeckCard } from '../types/deck';
import type { DeckCommit } from '../types/versioning';

interface DeckState {
  currentDeck: Deck | null;
  isDirty: boolean;
  restoredFromCommit: DeckCommit | null;
  setDeck: (deck: Deck, markDirty?: boolean) => void;
  setRestoredDeck: (deck: Deck, commit: DeckCommit) => void;
  addCard: (card: DeckCard) => void;
  removeCard: (cardId: string) => void;
  updateCardCount: (cardId: string, count: number) => void;
  setLegend: (card: DeckCard | null) => void;
  setBattlefield: (card: DeckCard | null) => void; // Legacy - use addBattlefield/removeBattlefield
  addBattlefield: (card: DeckCard) => void;
  removeBattlefield: (index: number) => void;
  setCommander: (card: DeckCard | null) => void;
  updateRuneColors: (colors: string[]) => void;
  updateColorIdentity: (colors: string[]) => void;
  addRune: (card: DeckCard) => void;
  removeRune: (cardId: string) => void;
  updateRuneCount: (cardId: string, count: number) => void;
  clearDeck: () => void;
  markClean: () => void;
}

export const useDeckStore = create<DeckState>((set) => ({
  currentDeck: null,
  isDirty: false,
  restoredFromCommit: null,

  setDeck: (deck, markDirty = false) => set({ currentDeck: deck, isDirty: markDirty, restoredFromCommit: null }),

  setRestoredDeck: (deck, commit) => set({ currentDeck: deck, isDirty: true, restoredFromCommit: commit }),

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

  addBattlefield: (card) =>
    set((state) => {
      if (!state.currentDeck) return state;
      
      const battlefields = state.currentDeck.battlefields || [];
      
      // Enforce 3-battlefield limit
      if (battlefields.length >= 3) {
        console.warn('Cannot add more than 3 battlefields');
        return state;
      }
      
      return {
        currentDeck: {
          ...state.currentDeck,
          battlefields: [...battlefields, card],
        },
        isDirty: true,
      };
    }),

  removeBattlefield: (index) =>
    set((state) => {
      if (!state.currentDeck) return state;
      
      const battlefields = state.currentDeck.battlefields || [];
      
      if (index < 0 || index >= battlefields.length) {
        console.warn('Invalid battlefield index');
        return state;
      }
      
      return {
        currentDeck: {
          ...state.currentDeck,
          battlefields: battlefields.filter((_, i) => i !== index),
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

  addRune: (card) =>
    set((state) => {
      if (!state.currentDeck) return state;
      
      const runeDeck = state.currentDeck.runeDeck || [];
      const existingRune = runeDeck.find(c => c.id === card.id);
      
      if (existingRune) {
        return {
          currentDeck: {
            ...state.currentDeck,
            runeDeck: runeDeck.map(c =>
              c.id === card.id ? { ...c, count: c.count + card.count } : c
            ),
          },
          isDirty: true,
        };
      }
      
      return {
        currentDeck: {
          ...state.currentDeck,
          runeDeck: [...runeDeck, card],
        },
        isDirty: true,
      };
    }),

  removeRune: (cardId) =>
    set((state) => {
      if (!state.currentDeck) return state;
      
      const runeDeck = state.currentDeck.runeDeck || [];
      
      return {
        currentDeck: {
          ...state.currentDeck,
          runeDeck: runeDeck.filter(c => c.id !== cardId),
        },
        isDirty: true,
      };
    }),

  updateRuneCount: (cardId, count) =>
    set((state) => {
      if (!state.currentDeck) return state;
      
      const runeDeck = state.currentDeck.runeDeck || [];
      
      if (count <= 0) {
        return {
          currentDeck: {
            ...state.currentDeck,
            runeDeck: runeDeck.filter(c => c.id !== cardId),
          },
          isDirty: true,
        };
      }
      
      return {
        currentDeck: {
          ...state.currentDeck,
          runeDeck: runeDeck.map(c =>
            c.id === cardId ? { ...c, count } : c
          ),
        },
        isDirty: true,
      };
    }),

  clearDeck: () => set({ currentDeck: null, isDirty: false, restoredFromCommit: null }),

  markClean: () => set({ isDirty: false, restoredFromCommit: null }),
}));
