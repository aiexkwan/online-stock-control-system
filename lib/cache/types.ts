/**
 * Cache Types
 * Common interfaces for cache adapters
 */

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
}

export interface CacheAdapter {
  // Basic operations
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  expire(key: string, seconds: number): Promise<void>;
  clear(): Promise<void>;

  // Batch operations
  mget<T>(keys: string[]): Promise<(T | null)[]>;
  mset(items: Array<{ key: string; value: unknown; ttl?: number }>): Promise<void>;

  // Pattern operations
  keys(pattern: string): Promise<string[]>;

  // Optional: Watch for changes
  watch?<T>(key: string, callback: (value: T | null) => void): () => void;
}

export interface CacheConfig {
  adapter: 'memory' | 'redis' | 'apollo';
  options?: {
    defaultTTL?: number;
    maxSize?: number;
    persist?: boolean;
    redisUrl?: string;
  };
}

export interface CachedItem<T = unknown> {
  value: T;
  expiry: number | null;
  createdAt: number;
  tags?: string[];
}