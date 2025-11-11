/**
 * Central cache manager for clearing all caches
 * Used primarily on logout to ensure clean state
 */

import { clearCommitHistoryCache, clearRepositoryCommitCache } from '../hooks/useCommitHistory';
import { clearBranchCache, clearRepositoryBranchCache } from '../hooks/useBranches';
import { giteaService } from '../services/gitea';

/**
 * Clear all application caches
 * Should be called on logout or when a full cache reset is needed
 */
export function clearAllCaches(): void {
  // Clear commit history cache
  clearCommitHistoryCache();
  
  // Clear branch cache
  clearBranchCache();
  
  // Clear deck version cache (LRU cache in gitea service)
  giteaService.clearDeckVersionCache();
}

/**
 * Clear caches for a specific repository
 * @param owner Repository owner
 * @param repo Repository name
 */
export function clearRepositoryCaches(owner: string, repo: string): void {
  // Clear commit history cache for this repository
  clearRepositoryCommitCache(owner, repo);
  
  // Clear branch cache for this repository
  clearRepositoryBranchCache(owner, repo);
  
  // Note: Deck version cache is LRU and will naturally evict old entries
  // We don't have a per-repository clear for it, but it's limited to 10 items
}
