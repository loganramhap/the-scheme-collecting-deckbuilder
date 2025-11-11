import type { AnnotationTemplate } from '../types/versioning';

/**
 * Default annotation templates for card changes
 * Based on Requirement 11.7
 */
export const DEFAULT_ANNOTATION_TEMPLATES: AnnotationTemplate[] = [
  // Testing category
  {
    id: 'testing-new-card',
    label: 'Testing',
    reason: 'Testing this card',
    category: 'testing',
  },
  {
    id: 'testing-replacement',
    label: 'Testing replacement',
    reason: 'Testing as replacement',
    category: 'testing',
  },

  // Meta category
  {
    id: 'meta-shift',
    label: 'Meta shift',
    reason: 'Adapting to meta shift',
    category: 'meta',
  },
  {
    id: 'meta-counter',
    label: 'Counter strategy',
    reason: 'Counter to popular deck',
    category: 'meta',
  },

  // Performance category
  {
    id: 'performance-underperforming',
    label: 'Underperforming',
    reason: 'Card underperformed in testing',
    category: 'performance',
  },
  {
    id: 'performance-overperforming',
    label: 'Strong performer',
    reason: 'Card performed well in testing',
    category: 'performance',
  },
  {
    id: 'performance-win-rate',
    label: 'Win rate improvement',
    reason: 'Improving win rate',
    category: 'performance',
  },

  // Synergy category
  {
    id: 'synergy-combo',
    label: 'Combo piece',
    reason: 'Part of combo strategy',
    category: 'synergy',
  },
  {
    id: 'synergy-theme',
    label: 'Theme synergy',
    reason: 'Better fits deck theme',
    category: 'synergy',
  },
  {
    id: 'synergy-tribal',
    label: 'Tribal synergy',
    reason: 'Tribal synergy',
    category: 'synergy',
  },

  // Cost category
  {
    id: 'cost-mana-curve',
    label: 'Mana curve',
    reason: 'Mana curve adjustment',
    category: 'cost',
  },
  {
    id: 'cost-budget',
    label: 'Budget constraint',
    reason: 'Budget optimization',
    category: 'cost',
  },
  {
    id: 'cost-efficiency',
    label: 'Cost efficiency',
    reason: 'More cost-efficient option',
    category: 'cost',
  },
];

/**
 * Maximum length for card annotation reasons
 * Based on Requirement 11.3
 */
export const ANNOTATION_MAX_LENGTH = 200;

/**
 * LocalStorage key for custom annotation templates
 */
export const CUSTOM_ANNOTATION_TEMPLATES_KEY = 'deckbuilder:customAnnotationTemplates';
