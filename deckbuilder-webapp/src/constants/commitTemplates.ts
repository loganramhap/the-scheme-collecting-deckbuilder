import type { CommitTemplate } from '../types/versioning';

/**
 * Default commit message templates for deck changes
 * Based on Requirement 9.1, 9.2
 */
export const DEFAULT_COMMIT_TEMPLATES: CommitTemplate[] = [
  // Testing category
  {
    id: 'testing-new-card',
    label: 'Testing new card',
    template: 'Testing new card: {cardName}',
    category: 'testing',
  },
  {
    id: 'testing-card-swap',
    label: 'Testing card swap',
    template: 'Testing {newCard} in place of {oldCard}',
    category: 'testing',
  },
  {
    id: 'testing-strategy',
    label: 'Testing new strategy',
    template: 'Testing new strategy: {strategyDescription}',
    category: 'testing',
  },

  // Optimization category
  {
    id: 'optimization-mana-curve',
    label: 'Mana curve adjustment',
    template: 'Mana curve adjustment',
    category: 'optimization',
  },
  {
    id: 'optimization-removed-underperforming',
    label: 'Removed underperforming cards',
    template: 'Removed underperforming cards',
    category: 'optimization',
  },
  {
    id: 'optimization-consistency',
    label: 'Improving consistency',
    template: 'Improving deck consistency',
    category: 'optimization',
  },
  {
    id: 'optimization-synergy',
    label: 'Adding synergy',
    template: 'Adding synergy with {cardOrTheme}',
    category: 'optimization',
  },

  // Meta category
  {
    id: 'meta-adaptation',
    label: 'Meta adaptation',
    template: 'Meta adaptation',
    category: 'meta',
  },
  {
    id: 'meta-counter',
    label: 'Adding counter to meta deck',
    template: 'Adding counter to {metaDeck}',
    category: 'meta',
  },
  {
    id: 'meta-sideboard',
    label: 'Sideboard adjustment',
    template: 'Sideboard adjustment for {matchup}',
    category: 'meta',
  },

  // Custom category
  {
    id: 'custom-initial',
    label: 'Initial deck creation',
    template: 'Initial deck creation',
    category: 'custom',
  },
  {
    id: 'custom-major-revision',
    label: 'Major revision',
    template: 'Major revision: {description}',
    category: 'custom',
  },
  {
    id: 'custom-budget',
    label: 'Budget optimization',
    template: 'Budget optimization',
    category: 'custom',
  },
];

/**
 * Maximum number of recent custom messages to store
 * Based on Requirement 9.5
 */
export const MAX_RECENT_MESSAGES = 5;

/**
 * LocalStorage key for recent commit messages
 */
export const RECENT_MESSAGES_STORAGE_KEY = 'deckbuilder:recentCommitMessages';

/**
 * Commit message validation constraints
 * Based on Requirement 1.2
 */
export const COMMIT_MESSAGE_MIN_LENGTH = 1;
export const COMMIT_MESSAGE_MAX_LENGTH = 500;
