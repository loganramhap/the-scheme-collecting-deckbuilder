/**
 * LRU (Least Recently Used) Cache implementation
 * Automatically evicts the least recently used items when capacity is reached
 */
export class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, V>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  /**
   * Get a value from the cache
   * Moves the item to the end (most recently used)
   */
  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined;
    }

    // Move to end (most recently used)
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    
    return value;
  }

  /**
   * Set a value in the cache
   * Evicts the least recently used item if capacity is reached
   */
  set(key: K, value: V): void {
    // If key exists, delete it first to update position
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Add to end (most recently used)
    this.cache.set(key, value);

    // Evict least recently used if over capacity
    if (this.cache.size > this.capacity) {
      this.evictLRU();
    }
  }

  /**
   * Check if a key exists in the cache
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }

  /**
   * Delete a specific key from the cache
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all items from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get the current size of the cache
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Get all keys in the cache (in LRU order)
   */
  keys(): K[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Evict the least recently used item
   * @returns The evicted key, or undefined if cache is empty
   */
  private evictLRU(): K | undefined {
    const firstKey = this.cache.keys().next().value as K | undefined;
    if (firstKey !== undefined) {
      this.cache.delete(firstKey);
    }
    return firstKey;
  }
}
