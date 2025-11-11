import { useState, useEffect, useCallback, useRef } from 'react';
import { giteaService } from '../services/gitea';
import type { DeckCommit } from '../types/versioning';

interface UseCommitHistoryOptions {
  owner: string;
  repo: string;
  branch?: string;
  perPage?: number;
  enabled?: boolean;
}

interface UseCommitHistoryResult {
  commits: DeckCommit[];
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  invalidateCache: () => void;
}

// Cache structure: key = "owner/repo/branch", value = { commits, timestamp }
interface CacheEntry {
  commits: DeckCommit[];
  timestamp: number;
  page: number;
}

const commitCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Clear all commit history caches
 * Exported for use by cache manager
 */
export function clearCommitHistoryCache(): void {
  commitCache.clear();
}

/**
 * Clear commit history cache for a specific repository
 * @param owner Repository owner
 * @param repo Repository name
 */
export function clearRepositoryCommitCache(owner: string, repo: string): void {
  const keysToDelete: string[] = [];
  commitCache.forEach((_, key) => {
    if (key.startsWith(`${owner}/${repo}/`)) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach(key => commitCache.delete(key));
}

/**
 * Hook to fetch and manage commit history from Gitea
 * Implements pagination, infinite scroll, caching, and error handling
 * Based on Requirements 2.5
 */
export function useCommitHistory({
  owner,
  repo,
  branch = 'main',
  perPage = 20,
  enabled = true,
}: UseCommitHistoryOptions): UseCommitHistoryResult {
  const [commits, setCommits] = useState<DeckCommit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Use ref to track if we're currently fetching to prevent duplicate requests
  const isFetchingRef = useRef(false);
  
  const cacheKey = `${owner}/${repo}/${branch}`;

  /**
   * Invalidate cache for this repository/branch
   */
  const invalidateCache = useCallback(() => {
    commitCache.delete(cacheKey);
  }, [cacheKey]);

  /**
   * Check if cache is valid
   */
  const isCacheValid = useCallback((entry: CacheEntry): boolean => {
    const now = Date.now();
    return now - entry.timestamp < CACHE_TTL;
  }, []);

  /**
   * Fetch commits for a specific page
   */
  const fetchCommits = useCallback(
    async (page: number): Promise<DeckCommit[]> => {
      if (!enabled) {
        return [];
      }

      try {
        const fetchedCommits = await giteaService.getCommitHistory(
          owner,
          repo,
          branch,
          page,
          perPage
        );
        return fetchedCommits;
      } catch (err) {
        throw err instanceof Error ? err : new Error('Failed to fetch commit history');
      }
    },
    [owner, repo, branch, perPage, enabled]
  );

  /**
   * Load initial commits or from cache
   */
  const loadInitialCommits = useCallback(async () => {
    if (!enabled || isFetchingRef.current) {
      return;
    }

    // Check cache first
    const cached = commitCache.get(cacheKey);
    if (cached && isCacheValid(cached)) {
      setCommits(cached.commits);
      setCurrentPage(cached.page);
      setHasMore(cached.commits.length >= perPage * cached.page);
      setError(null);
      return;
    }

    // Fetch from API
    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const fetchedCommits = await fetchCommits(1);
      
      setCommits(fetchedCommits);
      setCurrentPage(1);
      setHasMore(fetchedCommits.length >= perPage);
      
      // Update cache
      commitCache.set(cacheKey, {
        commits: fetchedCommits,
        timestamp: Date.now(),
        page: 1,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load commit history');
      setError(error);
      setCommits([]);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [enabled, cacheKey, isCacheValid, fetchCommits, perPage]);

  /**
   * Load more commits (for infinite scroll)
   */
  const loadMore = useCallback(async () => {
    if (!enabled || !hasMore || isLoading || isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const nextPage = currentPage + 1;
      const fetchedCommits = await fetchCommits(nextPage);
      
      if (fetchedCommits.length === 0) {
        setHasMore(false);
      } else {
        const updatedCommits = [...commits, ...fetchedCommits];
        setCommits(updatedCommits);
        setCurrentPage(nextPage);
        setHasMore(fetchedCommits.length >= perPage);
        
        // Update cache with all commits
        commitCache.set(cacheKey, {
          commits: updatedCommits,
          timestamp: Date.now(),
          page: nextPage,
        });
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load more commits');
      setError(error);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [enabled, hasMore, isLoading, currentPage, commits, fetchCommits, perPage, cacheKey]);

  /**
   * Refresh commits (invalidate cache and reload)
   */
  const refresh = useCallback(async () => {
    invalidateCache();
    setCurrentPage(1);
    setHasMore(true);
    await loadInitialCommits();
  }, [invalidateCache, loadInitialCommits]);

  // Load initial commits on mount or when dependencies change
  useEffect(() => {
    loadInitialCommits();
  }, [loadInitialCommits]);

  return {
    commits,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh,
    invalidateCache,
  };
}
