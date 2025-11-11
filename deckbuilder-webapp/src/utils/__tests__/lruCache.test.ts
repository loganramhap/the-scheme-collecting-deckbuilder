import { describe, it, expect } from 'vitest';
import { LRUCache } from '../lruCache';

describe('LRUCache', () => {
  it('should store and retrieve values', () => {
    const cache = new LRUCache<string, number>(3);
    
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    
    expect(cache.get('a')).toBe(1);
    expect(cache.get('b')).toBe(2);
    expect(cache.get('c')).toBe(3);
  });

  it('should return undefined for non-existent keys', () => {
    const cache = new LRUCache<string, number>(3);
    
    expect(cache.get('nonexistent')).toBeUndefined();
  });

  it('should evict least recently used item when capacity is exceeded', () => {
    const cache = new LRUCache<string, number>(3);
    
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    
    // Add a 4th item, should evict 'a' (least recently used)
    cache.set('d', 4);
    
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBe(2);
    expect(cache.get('c')).toBe(3);
    expect(cache.get('d')).toBe(4);
  });

  it('should update LRU order when accessing items', () => {
    const cache = new LRUCache<string, number>(3);
    
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    
    // Access 'a' to make it most recently used
    cache.get('a');
    
    // Add a 4th item, should evict 'b' (now least recently used)
    cache.set('d', 4);
    
    expect(cache.get('a')).toBe(1);
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('c')).toBe(3);
    expect(cache.get('d')).toBe(4);
  });

  it('should update existing keys without increasing size', () => {
    const cache = new LRUCache<string, number>(3);
    
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    
    expect(cache.size).toBe(3);
    
    // Update existing key
    cache.set('b', 20);
    
    expect(cache.size).toBe(3);
    expect(cache.get('b')).toBe(20);
  });

  it('should clear all items', () => {
    const cache = new LRUCache<string, number>(3);
    
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    
    expect(cache.size).toBe(3);
    
    cache.clear();
    
    expect(cache.size).toBe(0);
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('c')).toBeUndefined();
  });

  it('should delete specific keys', () => {
    const cache = new LRUCache<string, number>(3);
    
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    
    const deleted = cache.delete('b');
    
    expect(deleted).toBe(true);
    expect(cache.size).toBe(2);
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('a')).toBe(1);
    expect(cache.get('c')).toBe(3);
  });

  it('should return false when deleting non-existent key', () => {
    const cache = new LRUCache<string, number>(3);
    
    cache.set('a', 1);
    
    const deleted = cache.delete('nonexistent');
    
    expect(deleted).toBe(false);
    expect(cache.size).toBe(1);
  });

  it('should check if key exists', () => {
    const cache = new LRUCache<string, number>(3);
    
    cache.set('a', 1);
    
    expect(cache.has('a')).toBe(true);
    expect(cache.has('b')).toBe(false);
  });

  it('should return all keys in LRU order', () => {
    const cache = new LRUCache<string, number>(3);
    
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    
    // Access 'a' to make it most recently used
    cache.get('a');
    
    const keys = cache.keys();
    
    // Keys should be in order: b (oldest), c, a (newest)
    expect(keys).toEqual(['b', 'c', 'a']);
  });
});
