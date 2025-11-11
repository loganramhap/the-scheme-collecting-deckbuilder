import { useState, useEffect, useCallback, useRef } from 'react';
import { giteaService } from '../services/gitea';
import type { DeckBranch } from '../types/versioning';

interface UseBranchesOptions {
  owner: string;
  repo: string;
  enabled?: boolean;
}

interface UseBranchesResult {
  branches: DeckBranch[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  invalidateCache: () => void;
}

// Cache structure: key = "owner/repo", value = { branches, timestamp }
interface CacheEntry {
  branches: DeckBranch[];
  timestamp: number;
}

const branchCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Clear all branch caches
 * Exported for use by cache manager
 */
export function clearBranchCache(): void {
  branchCache.clear();
}

/**
 * Clear branch cache for a specific repository
 * @param owner Repository owner
 * @param repo Repository name
 */
export function clearRepositoryBranchCache(owner: string, repo: string): void {
  const cacheKey = `${owner}/${repo}`;
  branchCache.delete(cacheKey);
}

/**
 * Hook to fetch and manage branch list from Gitea
 * Implements caching with invalidation and error handling
 * Based on Requirements 5.4, 6.5
 */
export function useBranches({
  owner,
  repo,
  enabled = true,
}: UseBranchesOptions): UseBranchesResult {
  const [branches, setBranches] = useState<DeckBranch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Use ref to track if we're currently fetching to prevent duplicate requests
  const isFetchingRef = useRef(false);
  
  const cacheKey = `${owner}/${repo}`;

  /**
   * Invalidate cache for this repository
   */
  const invalidateCache = useCallback(() => {
    branchCache.delete(cacheKey);
  }, [cacheKey]);

  /**
   * Check if cache is valid
   */
  const isCacheValid = useCallback((entry: CacheEntry): boolean => {
    const now = Date.now();
    return now - entry.timestamp < CACHE_TTL;
  }, []);

  /**
   * Fetch branches from Gitea API
   */
  const fetchBranches = useCallback(async (): Promise<DeckBranch[]> => {
    if (!enabled) {
      return [];
    }

    try {
      const fetchedBranches = await giteaService.listBranches(owner, repo);
      return fetchedBranches;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to fetch branches');
    }
  }, [owner, repo, enabled]);

  /**
   * Load branches from cache or API
   */
  const loadBranches = useCallback(async () => {
    if (!enabled || isFetchingRef.current) {
      return;
    }

    // Check cache first
    const cached = branchCache.get(cacheKey);
    if (cached && isCacheValid(cached)) {
      setBranches(cached.branches);
      setError(null);
      return;
    }

    // Fetch from API
    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const fetchedBranches = await fetchBranches();
      
      setBranches(fetchedBranches);
      
      // Update cache
      branchCache.set(cacheKey, {
        branches: fetchedBranches,
        timestamp: Date.now(),
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load branches');
      setError(error);
      setBranches([]);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [enabled, cacheKey, isCacheValid, fetchBranches]);

  /**
   * Refresh branches (invalidate cache and reload)
   */
  const refresh = useCallback(async () => {
    invalidateCache();
    await loadBranches();
  }, [invalidateCache, loadBranches]);

  // Load branches on mount or when dependencies change
  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  return {
    branches,
    isLoading,
    error,
    refresh,
    invalidateCache,
  };
}
