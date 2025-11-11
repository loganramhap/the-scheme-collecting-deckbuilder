import type { DeckCard, Deck } from './deck';

/**
 * Represents a Git commit for a deck
 */
export interface DeckCommit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string; // ISO 8601 timestamp
  };
  committer: {
    name: string;
    email: string;
    date: string; // ISO 8601 timestamp
  };
  parents: string[]; // Parent commit SHAs
  isAutoSave: boolean; // Auto-save vs manual save
  changesSummary?: {
    cardsAdded: number;
    cardsRemoved: number;
    cardsModified: number;
  };
}

/**
 * Represents a Git branch for a deck
 */
export interface DeckBranch {
  name: string;
  commit: {
    sha: string;
    message: string;
    date: string;
  };
  protected: boolean; // Is this the main branch?
}

/**
 * Represents differences between two deck versions
 */
export interface DeckDiff {
  added: DeckCard[];
  removed: DeckCard[];
  modified: Array<{
    card: DeckCard;
    oldCount: number;
    newCount: number;
  }>;
  specialSlots: {
    commander?: {
      old: DeckCard | null;
      new: DeckCard | null;
    };
    legend?: {
      old: DeckCard | null;
      new: DeckCard | null;
    };
    battlefield?: {
      old: DeckCard | null;
      new: DeckCard | null;
    };
  };
}

/**
 * Represents a commit message template
 */
export interface CommitTemplate {
  id: string;
  label: string;
  template: string; // Template with placeholders
  category: 'testing' | 'optimization' | 'meta' | 'custom';
}
