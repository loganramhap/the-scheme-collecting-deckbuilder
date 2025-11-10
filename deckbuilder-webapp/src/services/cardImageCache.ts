import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface CachedImage {
  id: string;
  imageUrl: string;
  blob: Blob;
  timestamp: number;
  size: number;
}

interface CardImageCacheDB extends DBSchema {
  images: {
    key: string;
    value: CachedImage;
    indexes: { 'by-timestamp': number };
  };
  metadata: {
    key: string;
    value: { totalSize: number };
  };
}

class CardImageCache {
  private db: IDBPDatabase<CardImageCacheDB> | null = null;
  private readonly DB_NAME = 'card-image-cache';
  private readonly DB_VERSION = 1;
  private readonly MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
  private memoryCache: Map<string, string> = new Map();

  async init(): Promise<void> {
    if (this.db) return;

    this.db = await openDB<CardImageCacheDB>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        // Create images store
        const imageStore = db.createObjectStore('images', { keyPath: 'id' });
        imageStore.createIndex('by-timestamp', 'timestamp');

        // Create metadata store
        db.createObjectStore('metadata');
      },
    });

    // Initialize metadata if not exists
    const metadata = await this.db.get('metadata', 'cache-info');
    if (!metadata) {
      await this.db.put('metadata', { totalSize: 0 }, 'cache-info');
    }
  }

  async get(cardId: string): Promise<string | null> {
    // Check memory cache first
    if (this.memoryCache.has(cardId)) {
      return this.memoryCache.get(cardId)!;
    }

    await this.init();
    if (!this.db) return null;

    try {
      const cached = await this.db.get('images', cardId);
      if (!cached) return null;

      // Convert blob to object URL
      const objectUrl = URL.createObjectURL(cached.blob);
      this.memoryCache.set(cardId, objectUrl);

      // Update timestamp for LRU
      cached.timestamp = Date.now();
      await this.db.put('images', cached);

      return objectUrl;
    } catch (error) {
      console.error('Error retrieving from cache:', error);
      return null;
    }
  }

  async set(cardId: string, imageUrl: string): Promise<void> {
    await this.init();
    if (!this.db) return;

    try {
      // Fetch the image
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('Failed to fetch image');

      const blob = await response.blob();
      const size = blob.size;

      // Check if we need to evict old entries
      await this.ensureSpace(size);

      // Store in IndexedDB
      const cached: CachedImage = {
        id: cardId,
        imageUrl,
        blob,
        timestamp: Date.now(),
        size,
      };

      await this.db.put('images', cached);

      // Update total size
      const metadata = await this.db.get('metadata', 'cache-info');
      const newTotalSize = (metadata?.totalSize || 0) + size;
      await this.db.put('metadata', { totalSize: newTotalSize }, 'cache-info');

      // Add to memory cache
      const objectUrl = URL.createObjectURL(blob);
      this.memoryCache.set(cardId, objectUrl);
    } catch (error) {
      console.error('Error caching image:', error);
    }
  }

  private async ensureSpace(requiredSize: number): Promise<void> {
    if (!this.db) return;

    const metadata = await this.db.get('metadata', 'cache-info');
    let currentSize = metadata?.totalSize || 0;

    // If adding this image would exceed limit, evict oldest entries
    while (currentSize + requiredSize > this.MAX_CACHE_SIZE) {
      const oldestEntry = await this.getOldestEntry();
      if (!oldestEntry) break;

      await this.evict(oldestEntry.id);
      currentSize -= oldestEntry.size;
    }

    // Update metadata
    await this.db.put('metadata', { totalSize: currentSize }, 'cache-info');
  }

  private async getOldestEntry(): Promise<CachedImage | null> {
    if (!this.db) return null;

    const tx = this.db.transaction('images', 'readonly');
    const index = tx.store.index('by-timestamp');
    const cursor = await index.openCursor();

    return cursor ? cursor.value : null;
  }

  async evict(cardId: string): Promise<void> {
    if (!this.db) return;

    try {
      const cached = await this.db.get('images', cardId);
      if (!cached) return;

      // Remove from IndexedDB
      await this.db.delete('images', cardId);

      // Update total size
      const metadata = await this.db.get('metadata', 'cache-info');
      const newTotalSize = Math.max(0, (metadata?.totalSize || 0) - cached.size);
      await this.db.put('metadata', { totalSize: newTotalSize }, 'cache-info');

      // Remove from memory cache and revoke object URL
      const objectUrl = this.memoryCache.get(cardId);
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        this.memoryCache.delete(cardId);
      }
    } catch (error) {
      console.error('Error evicting from cache:', error);
    }
  }

  async clear(): Promise<void> {
    if (!this.db) return;

    try {
      // Revoke all object URLs
      this.memoryCache.forEach((url) => URL.revokeObjectURL(url));
      this.memoryCache.clear();

      // Clear IndexedDB
      await this.db.clear('images');
      await this.db.put('metadata', { totalSize: 0 }, 'cache-info');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  async getCacheSize(): Promise<number> {
    await this.init();
    if (!this.db) return 0;

    const metadata = await this.db.get('metadata', 'cache-info');
    return metadata?.totalSize || 0;
  }

  async getCacheInfo(): Promise<{ size: number; count: number; maxSize: number }> {
    await this.init();
    if (!this.db) return { size: 0, count: 0, maxSize: this.MAX_CACHE_SIZE };

    const metadata = await this.db.get('metadata', 'cache-info');
    const count = await this.db.count('images');

    return {
      size: metadata?.totalSize || 0,
      count,
      maxSize: this.MAX_CACHE_SIZE,
    };
  }
}

// Export singleton instance
export const cardImageCache = new CardImageCache();
