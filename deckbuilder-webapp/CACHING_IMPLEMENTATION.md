# Caching Strategy Implementation

This document describes the caching strategy implemented for the deck versioning system.

## Overview

The caching strategy improves performance by reducing redundant API calls to Gitea for frequently accessed data. Three types of caches are implemented:

1. **Commit History Cache** - Caches commit lists per repository/branch
2. **Branch List Cache** - Caches branch lists per repository
3. **Deck Version Cache (LRU)** - Caches deck content at specific commits

## Implementation Details

### 1. Commit History Cache

**Location:** `src/hooks/useCommitHistory.ts`

- **Type:** Map-based cache with TTL (Time To Live)
- **TTL:** 5 minutes
- **Key Format:** `owner/repo/branch`
- **Features:**
  - Automatic invalidation after TTL expires
  - Manual invalidation via `invalidateCache()` method
  - Pagination support (caches all loaded pages)
  - Export functions for cache clearing:
    - `clearCommitHistoryCache()` - Clear all commit caches
    - `clearRepositoryCommitCache(owner, repo)` - Clear specific repository

### 2. Branch List Cache

**Location:** `src/hooks/useBranches.ts`

- **Type:** Map-based cache with TTL
- **TTL:** 5 minutes
- **Key Format:** `owner/repo`
- **Features:**
  - Automatic invalidation after TTL expires
  - Manual invalidation via `invalidateCache()` method
  - Export functions for cache clearing:
    - `clearBranchCache()` - Clear all branch caches
    - `clearRepositoryBranchCache(owner, repo)` - Clear specific repository

### 3. Deck Version Cache (LRU)

**Location:** `src/services/gitea.ts` and `src/utils/lruCache.ts`

- **Type:** LRU (Least Recently Used) Cache
- **Capacity:** 10 deck versions maximum
- **Key Format:** `owner/repo/sha/deckPath`
- **Features:**
  - Automatic eviction of least recently used items when capacity is reached
  - No TTL (relies on LRU eviction policy)
  - Integrated into `getDeckAtCommit()` method
  - Export function for cache clearing:
    - `giteaService.clearDeckVersionCache()` - Clear all deck versions

**LRU Cache Implementation:**
- Custom `LRUCache<K, V>` class in `src/utils/lruCache.ts`
- Uses JavaScript Map for O(1) access
- Automatically moves accessed items to end (most recently used)
- Evicts oldest item when capacity exceeded

## Cache Manager

**Location:** `src/utils/cacheManager.ts`

Central utility for managing all caches:

```typescript
// Clear all caches (used on logout)
clearAllCaches()

// Clear caches for specific repository
clearRepositoryCaches(owner, repo)
```

## Integration with Logout

**Location:** `src/store/auth.ts`

The `logout()` function now calls `clearAllCaches()` to ensure:
- No stale data persists between user sessions
- Memory is freed
- Privacy is maintained (no cached data from previous user)

## Usage Examples

### Manual Cache Invalidation

```typescript
// In a component using useCommitHistory
const { invalidateCache, refresh } = useCommitHistory({ owner, repo, branch });

// After making a commit
await versionControlService.commitDeck(...);
invalidateCache(); // Clear cache
await refresh(); // Reload fresh data
```

### Repository-Specific Cache Clearing

```typescript
import { clearRepositoryCaches } from '../utils/cacheManager';

// After deleting a repository or major changes
clearRepositoryCaches('owner', 'repo-name');
```

### Full Cache Reset

```typescript
import { clearAllCaches } from '../utils/cacheManager';

// On logout (automatic) or manual reset
clearAllCaches();
```

## Performance Benefits

1. **Reduced API Calls:** Commit history and branch lists are cached for 5 minutes
2. **Faster Navigation:** Deck versions are cached, making history browsing instant
3. **Bandwidth Savings:** Fewer network requests, especially for large deck files
4. **Better UX:** Instant response for cached data

## Memory Management

- **Commit/Branch Caches:** Grow unbounded but expire after 5 minutes
- **Deck Version Cache:** Limited to 10 items via LRU eviction
- **Logout Cleanup:** All caches cleared on logout

## Future Enhancements

Potential improvements for the caching strategy:

1. **Configurable TTL:** Allow users to adjust cache duration
2. **Cache Size Limits:** Add max size limits to commit/branch caches
3. **Persistent Cache:** Store cache in IndexedDB for cross-session persistence
4. **Smart Invalidation:** Automatically invalidate related caches on mutations
5. **Cache Statistics:** Track hit/miss rates for optimization
6. **Compression:** Compress cached deck data to reduce memory usage
