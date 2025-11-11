import { giteaService } from './gitea';
import { deckDiffService } from './deckDiff';
import type { Deck } from '../types/deck';
import type { DeckCommit, DeckDiff } from '../types/versioning';

/**
 * Service for version control operations on decks
 */
class VersionControlService {
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000;

  /**
   * Retry a function with exponential backoff
   * @param fn Function to retry
   * @param retries Number of retries remaining
   * @returns Result of the function
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    retries: number = this.MAX_RETRIES
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries <= 0) {
        throw error;
      }

      // Check if error is retryable (network errors, 5xx errors)
      const isRetryable = this.isRetryableError(error);
      if (!isRetryable) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = this.RETRY_DELAY_MS * Math.pow(2, this.MAX_RETRIES - retries);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Retry
      return this.retryWithBackoff(fn, retries - 1);
    }
  }

  /**
   * Check if an error is retryable
   * @param error Error to check
   * @returns True if the error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (!error) return false;

    // Network errors
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('econnrefused') ||
        message.includes('enotfound')
      ) {
        return true;
      }
    }

    // HTTP 5xx errors (server errors)
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const response = (error as any).response;
      if (response && response.status >= 500 && response.status < 600) {
        return true;
      }
    }

    return false;
  }

  /**
   * Generate auto-save commit message based on deck changes
   * @param diff Diff between old and new deck versions
   * @returns Formatted auto-save commit message
   */
  generateAutoSaveMessage(diff: DeckDiff): string {
    const summary = deckDiffService.summarizeChanges(diff);
    
    // If no changes detected, return generic message
    if (summary === 'No changes') {
      return 'Auto-save: Deck updated';
    }

    // Format as "Auto-save: [summary]"
    return `Auto-save: ${summary}`;
  }

  /**
   * Generate auto-save commit message asynchronously (for large decks)
   * @param oldDeck Previous deck state
   * @param newDeck New deck state
   * @returns Formatted auto-save commit message
   */
  async generateAutoSaveMessageAsync(oldDeck: Deck, newDeck: Deck): Promise<string> {
    const diff = await deckDiffService.calculateDiffAsync(oldDeck, newDeck);
    return this.generateAutoSaveMessage(diff);
  }

  /**
   * Switch to a different branch and load its deck state
   * @param owner Repository owner
   * @param repo Repository name
   * @param branchName Branch to switch to
   * @param deckPath Path to deck file (defaults to 'deck.json')
   * @returns The deck from the specified branch
   */
  async switchBranch(
    owner: string,
    repo: string,
    branchName: string,
    deckPath: string = 'deck.json'
  ): Promise<Deck> {
    return this.retryWithBackoff(async () => {
      try {
        // Get the file content from the specified branch
        const fileContent = await giteaService.getFileContent(owner, repo, deckPath, branchName);
        
        // Decode the base64 content
        const decodedContent = decodeURIComponent(escape(atob(fileContent.content)));
        const deck = JSON.parse(decodedContent) as Deck;
        
        return deck;
      } catch (error) {
        if (error instanceof Error && error.message.includes('404')) {
          throw new Error(`Deck file not found in branch ${branchName}`);
        }
        throw new Error(`Failed to switch to branch ${branchName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  }

  /**
   * Commit current deck state with message
   * @param owner Repository owner
   * @param repo Repository name
   * @param branch Branch name
   * @param deck Deck to commit
   * @param message Commit message
   * @param _isAutoSave Whether this is an auto-save commit (tracked via message format)
   * @param deckPath Path to deck file (defaults to 'deck.json')
   * @returns The created commit
   */
  async commitDeck(
    owner: string,
    repo: string,
    branch: string,
    deck: Deck,
    message: string,
    _isAutoSave: boolean = false,
    deckPath: string = 'deck.json'
  ): Promise<DeckCommit> {
    return this.retryWithBackoff(async () => {
      try {
        // Get the current file SHA if it exists
        let currentSha: string | undefined;
        try {
          const fileContent = await giteaService.getFileContent(owner, repo, deckPath, branch);
          currentSha = fileContent.sha;
        } catch (error) {
          // File doesn't exist yet, that's okay
          currentSha = undefined;
        }

        // Serialize deck to JSON
        const deckJson = JSON.stringify(deck, null, 2);

        // Create or update the file
        await giteaService.createOrUpdateFile(
          owner,
          repo,
          deckPath,
          deckJson,
          message,
          branch,
          currentSha
        );

        // Fetch the latest commit to return
        const commits = await giteaService.getCommitHistory(owner, repo, branch, 1, 1);
        
        if (commits.length === 0) {
          throw new Error('Failed to retrieve commit after save');
        }

        return commits[0];
      } catch (error) {
        // Handle specific error cases
        if (error instanceof Error) {
          if (error.message.includes('409') || error.message.includes('conflict')) {
            throw new Error('Commit conflict: The file has been modified by another user. Please refresh and try again.');
          }
          if (error.message.includes('401') || error.message.includes('403')) {
            throw new Error('Permission denied: You do not have access to commit to this repository.');
          }
          if (error.message.includes('404')) {
            throw new Error('Repository or branch not found. Please check that the repository exists.');
          }
        }
        throw new Error(`Failed to commit deck: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  }

  /**
   * Restore deck to a specific commit version
   * @param owner Repository owner
   * @param repo Repository name
   * @param sha Commit SHA to restore from
   * @param deckPath Path to deck file (defaults to 'deck.json')
   * @returns The deck at the specified commit
   */
  async restoreDeckVersion(
    owner: string,
    repo: string,
    sha: string,
    deckPath: string = 'deck.json'
  ): Promise<Deck> {
    return this.retryWithBackoff(async () => {
      try {
        // Get the deck state at the specified commit
        const deck = await giteaService.getDeckAtCommit(owner, repo, sha, deckPath);
        return deck;
      } catch (error) {
        if (error instanceof Error && error.message.includes('404')) {
          throw new Error(`Deck file not found at commit ${sha.substring(0, 7)}`);
        }
        throw new Error(`Failed to restore deck version: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  }

  /**
   * Generate restoration commit message
   * @param sha Commit SHA that was restored
   * @param originalMessage Original commit message
   * @returns Formatted restoration commit message
   */
  generateRestorationMessage(sha: string, originalMessage: string): string {
    const shortSha = sha.substring(0, 7);
    return `Restore version from ${shortSha}: ${originalMessage}`;
  }

  /**
   * Merge a source branch into a target branch
   * @param owner Repository owner
   * @param repo Repository name
   * @param sourceBranch Source branch to merge from
   * @param targetBranch Target branch to merge into
   * @param message Merge commit message
   * @param deckPath Path to deck file (defaults to 'deck.json')
   * @returns Object containing merge result and any conflicts
   */
  async mergeBranch(
    owner: string,
    repo: string,
    sourceBranch: string,
    targetBranch: string,
    message: string,
    deckPath: string = 'deck.json'
  ): Promise<{
    commit: DeckCommit;
    conflicts: DeckDiff | null;
    mergedDeck: Deck;
  }> {
    return this.retryWithBackoff(async () => {
      try {
        // Get the deck states from both branches
        const sourceDeck = await giteaService.getDeckAtCommit(owner, repo, sourceBranch, deckPath);
        const targetDeck = await giteaService.getDeckAtCommit(owner, repo, targetBranch, deckPath);

        // Find the common ancestor (base) commit
        // For simplicity, we'll use the target branch's current state as the base
        // In a real implementation, you'd find the merge-base commit
        const baseDeck = targetDeck;

        // Detect conflicts
        const conflicts = deckDiffService.detectConflicts(baseDeck, sourceDeck, targetDeck);

        // Check if there are any conflicts
        const hasConflicts = 
          conflicts.added.length > 0 ||
          conflicts.removed.length > 0 ||
          conflicts.modified.length > 0 ||
          Object.keys(conflicts.specialSlots).length > 0;

        if (hasConflicts) {
          // Return conflicts for user resolution
          return {
            commit: null as any, // Will be created after conflict resolution
            conflicts,
            mergedDeck: sourceDeck, // Provide source deck as starting point
          };
        }

        // No conflicts - perform automatic merge
        // Calculate the diff from target to source
        const diff = deckDiffService.calculateDiff(targetDeck, sourceDeck);
        
        // Apply the diff to create the merged deck
        const mergedDeck = deckDiffService.applyDiff(targetDeck, diff);

        // Commit the merged deck to the target branch
        const commit = await this.commitDeck(
          owner,
          repo,
          targetBranch,
          mergedDeck,
          message,
          false,
          deckPath
        );

        return {
          commit,
          conflicts: null,
          mergedDeck,
        };
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('404')) {
            throw new Error('Branch or deck file not found');
          }
          if (error.message.includes('401') || error.message.includes('403')) {
            throw new Error('Permission denied: You do not have access to merge branches');
          }
        }
        throw new Error(`Failed to merge branches: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  }

  /**
   * Complete a merge after conflicts have been resolved
   * @param owner Repository owner
   * @param repo Repository name
   * @param targetBranch Target branch to commit to
   * @param resolvedDeck The deck with conflicts resolved
   * @param message Merge commit message
   * @param deckPath Path to deck file (defaults to 'deck.json')
   * @returns The merge commit
   */
  async completeMerge(
    owner: string,
    repo: string,
    targetBranch: string,
    resolvedDeck: Deck,
    message: string,
    deckPath: string = 'deck.json'
  ): Promise<DeckCommit> {
    return this.retryWithBackoff(async () => {
      try {
        // Commit the resolved deck to the target branch
        const commit = await this.commitDeck(
          owner,
          repo,
          targetBranch,
          resolvedDeck,
          message,
          false,
          deckPath
        );

        return commit;
      } catch (error) {
        throw new Error(`Failed to complete merge: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  }

  /**
   * Preview changes that would be applied by a merge
   * @param owner Repository owner
   * @param repo Repository name
   * @param sourceBranch Source branch to merge from
   * @param targetBranch Target branch to merge into
   * @param deckPath Path to deck file (defaults to 'deck.json')
   * @returns Diff showing what would change
   */
  async previewMerge(
    owner: string,
    repo: string,
    sourceBranch: string,
    targetBranch: string,
    deckPath: string = 'deck.json'
  ): Promise<{
    diff: DeckDiff;
    conflicts: DeckDiff | null;
    sourceDeck: Deck;
    targetDeck: Deck;
  }> {
    return this.retryWithBackoff(async () => {
      try {
        // Get the deck states from both branches
        const sourceDeck = await giteaService.getDeckAtCommit(owner, repo, sourceBranch, deckPath);
        const targetDeck = await giteaService.getDeckAtCommit(owner, repo, targetBranch, deckPath);

        // Calculate the diff
        const diff = deckDiffService.calculateDiff(targetDeck, sourceDeck);

        // Detect conflicts (using target as base for simplicity)
        const conflicts = deckDiffService.detectConflicts(targetDeck, sourceDeck, targetDeck);
        
        const hasConflicts = 
          conflicts.added.length > 0 ||
          conflicts.removed.length > 0 ||
          conflicts.modified.length > 0 ||
          Object.keys(conflicts.specialSlots).length > 0;

        return {
          diff,
          conflicts: hasConflicts ? conflicts : null,
          sourceDeck,
          targetDeck,
        };
      } catch (error) {
        throw new Error(`Failed to preview merge: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  }
}

export const versionControlService = new VersionControlService();
