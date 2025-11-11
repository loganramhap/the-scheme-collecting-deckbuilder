import type { CommitTemplate } from '../types/versioning';

/**
 * Placeholder pattern for template strings
 * Matches {placeholderName}
 */
const PLACEHOLDER_PATTERN = /\{([^}]+)\}/g;

/**
 * Extract placeholder names from a template string
 * @param template - Template string with placeholders like {cardName}
 * @returns Array of placeholder names
 */
export function extractPlaceholders(template: string): string[] {
  const placeholders: string[] = [];
  let match;
  
  while ((match = PLACEHOLDER_PATTERN.exec(template)) !== null) {
    placeholders.push(match[1]);
  }
  
  return placeholders;
}

/**
 * Replace placeholders in a template with actual values
 * Based on Requirement 9.3
 * 
 * @param template - Template string with placeholders
 * @param values - Object mapping placeholder names to values
 * @returns String with placeholders replaced
 * 
 * @example
 * replacePlaceholders('Testing new card: {cardName}', { cardName: 'Lightning Bolt' })
 * // Returns: 'Testing new card: Lightning Bolt'
 */
export function replacePlaceholders(
  template: string,
  values: Record<string, string>
): string {
  return template.replace(PLACEHOLDER_PATTERN, (match, placeholderName) => {
    return values[placeholderName] || match;
  });
}

/**
 * Check if a template has unfilled placeholders
 * @param message - Message to check
 * @returns true if message contains placeholders
 */
export function hasUnfilledPlaceholders(message: string): boolean {
  return PLACEHOLDER_PATTERN.test(message);
}

/**
 * Get a user-friendly prompt for a placeholder
 * @param placeholderName - Name of the placeholder
 * @returns User-friendly prompt text
 */
export function getPlaceholderPrompt(placeholderName: string): string {
  const prompts: Record<string, string> = {
    cardName: 'Card name',
    newCard: 'New card',
    oldCard: 'Old card',
    strategyDescription: 'Strategy description',
    cardOrTheme: 'Card or theme',
    metaDeck: 'Meta deck name',
    matchup: 'Matchup',
    description: 'Description',
  };
  
  return prompts[placeholderName] || placeholderName;
}

/**
 * Validate a commit message
 * Based on Requirement 1.2
 * 
 * @param message - Commit message to validate
 * @param minLength - Minimum length (default: 1)
 * @param maxLength - Maximum length (default: 500)
 * @returns Validation result with error message if invalid
 */
export function validateCommitMessage(
  message: string,
  minLength: number = 1,
  maxLength: number = 500
): { valid: boolean; error?: string } {
  const trimmed = message.trim();
  
  if (trimmed.length < minLength) {
    return {
      valid: false,
      error: `Commit message must be at least ${minLength} character${minLength > 1 ? 's' : ''}`,
    };
  }
  
  if (trimmed.length > maxLength) {
    return {
      valid: false,
      error: `Commit message must be at most ${maxLength} characters`,
    };
  }
  
  return { valid: true };
}

/**
 * Format a template for display, showing placeholder hints
 * @param template - Template string
 * @returns Formatted template with placeholder hints
 */
export function formatTemplatePreview(template: string): string {
  return template.replace(PLACEHOLDER_PATTERN, (match, placeholderName) => {
    return `[${getPlaceholderPrompt(placeholderName)}]`;
  });
}
