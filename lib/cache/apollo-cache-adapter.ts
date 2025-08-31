/**
 * Apollo Cache Adapter
 * Implements cache interface using Apollo Client's InMemoryCache
 * Supports serverless deployment (Vercel, Netlify, etc.)
 */

import { makeVar, ReactiveVar } from '@apollo/client';
import { CacheAdapter, CacheStats, CacheMetrics } from './base-cache-adapter';

// Store reactive variables for different cache namespaces
const cacheVars = new Map<string, ReactiveVar<StorageData>>();

// localStorage key prefix
const STORAGE_PREFIX = 'pennine_cache_';

interface CacheOptions {
  ttl?: number;
  tags?: string[];
}

interface CachedItem<T = unknown> {
  value: T;
  expiry: number | null;
  createdAt: number;
  tags?: string[];
}

interface StorageData {
  [key: string]: CachedItem<unknown>;
}

export class ApolloCacheAdapter implements CacheAdapter {
  private namespace: string;
  private defaultTTL: number;
  private persistToStorage: boolean;
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    errors: 0,
    avgResponseTime: 0,
    lastError: null,
    lastErrorTime: null,
  };
  private responseTimes: number[] = [];

  constructor(
    namespace: string = 'default',
    options: { defaultTTL?: number; persist?: boolean } = {}
  ) {
    this.namespace = namespace;
    this.defaultTTL = options.defaultTTL || 3600; // 1 hour default
    this.persistToStorage = options.persist || false;

    // Initialize reactive variable for this namespace if not exists
    if (!cacheVars.has(namespace)) {
      const initialData = this.loadFromStorage();
      cacheVars.set(namespace, makeVar(initialData));
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();
    try {
      const cacheVar = cacheVars.get(this.namespace);
      if (!cacheVar) return null;

      const cache = cacheVar();
      const item = cache[key];

      if (!item) {
        this.metrics.misses++;
        return null;
      }

      // Check if expired
      if (item.expiry && Date.now() > item.expiry) {
        await this.delete(key);
        this.metrics.misses++;
        return null;
      }

      this.metrics.hits++;
      this.updateMetrics(Date.now() - startTime);
      return item.value as T;
    } catch (error: unknown) {
      console.error(`[ApolloCacheAdapter] Error getting key ${key}:`, error);
      this.recordError(error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const startTime = Date.now();
    try {
      const cacheVar = cacheVars.get(this.namespace);
      if (!cacheVar) return;

      // Use ttlSeconds or default TTL
      const ttl = ttlSeconds || this.defaultTTL;

      const expiry = ttl > 0 ? Date.now() + ttl * 1000 : null;

      const cache = cacheVar();
      const newCache: StorageData = {
        ...cache,
        [key]: {
          value,
          expiry,
          createdAt: Date.now(),
          tags: undefined,
        },
      };

      // Update reactive variable
      cacheVar(newCache);

      // Persist to localStorage if enabled
      if (this.persistToStorage) {
        this.saveToStorage(newCache);
      }

      this.updateMetrics(Date.now() - startTime);
    } catch (error: unknown) {
      console.error(`[ApolloCacheAdapter] Error setting key ${key}:`, error);
      this.recordError(error);
    }
  }

  // Optional overload method for extended options
  async setWithOptions<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const startTime = Date.now();
    try {
      const cacheVar = cacheVars.get(this.namespace);
      if (!cacheVar) return;

      const ttl = options?.ttl || this.defaultTTL;
      const expiry = ttl > 0 ? Date.now() + ttl * 1000 : null;

      const cache = cacheVar();
      const newCache: StorageData = {
        ...cache,
        [key]: {
          value,
          expiry,
          createdAt: Date.now(),
          tags: options?.tags,
        },
      };

      // Update reactive variable
      cacheVar(newCache);

      // Persist to localStorage if enabled
      if (this.persistToStorage) {
        this.saveToStorage(newCache);
      }

      this.updateMetrics(Date.now() - startTime);
    } catch (error: unknown) {
      console.error(`[ApolloCacheAdapter] Error setting key ${key}:`, error);
      this.recordError(error);
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const cacheVar = cacheVars.get(this.namespace);
      if (!cacheVar) return false;

      const cache = cacheVar();
      const exists = key in cache;

      if (!exists) return false;

      const { [key]: _, ...rest } = cache;
      const newCache: StorageData = rest;

      // Update reactive variable
      cacheVar(newCache);

      // Update localStorage if enabled
      if (this.persistToStorage) {
        this.saveToStorage(newCache);
      }

      return true;
    } catch (error: unknown) {
      console.error(`[ApolloCacheAdapter] Error deleting key ${key}:`, error);
      this.recordError(error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  async expire(key: string, seconds: number): Promise<void> {
    try {
      const cacheVar = cacheVars.get(this.namespace);
      if (!cacheVar) return;

      const cache = cacheVar();
      const item = cache[key];

      if (item) {
        const newCache: StorageData = {
          ...cache,
          [key]: {
            ...item,
            expiry: Date.now() + seconds * 1000,
          },
        };

        cacheVar(newCache);

        if (this.persistToStorage) {
          this.saveToStorage(newCache);
        }
      }
    } catch (error: unknown) {
      console.error(`[ApolloCacheAdapter] Error expiring key ${key}:`, error);
    }
  }

  async clear(): Promise<void> {
    try {
      const cacheVar = cacheVars.get(this.namespace);
      if (!cacheVar) return;

      cacheVar({});

      if (this.persistToStorage) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(this.getStorageKey());
        }
      }
    } catch (error: unknown) {
      console.error('[ApolloCacheAdapter] Error clearing cache:', error);
    }
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    const results = await Promise.all(keys.map(key => this.get<T>(key)));
    return results;
  }

  async mset<T>(items: Array<{ key: string; value: T; ttl?: number }>): Promise<void> {
    await Promise.all(items.map(item => this.set(item.key, item.value, item.ttl)));
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      const cacheVar = cacheVars.get(this.namespace);
      if (!cacheVar) return [];

      const cache = cacheVar();
      const allKeys = Object.keys(cache);

      // Simple pattern matching (supports * wildcard)
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return allKeys.filter(key => regex.test(key));
    } catch (error: unknown) {
      console.error('[ApolloCacheAdapter] Error getting keys:', error);
      return [];
    }
  }

  // Watch for changes to a specific key
  watch<T>(key: string, callback: (value: T | null) => void): () => void {
    const cacheVar = cacheVars.get(this.namespace);
    if (!cacheVar) return () => {};

    // Create a subscription to the reactive variable
    let previousValue: T | null = null;

    const unsubscribe = cacheVar.onNextChange(cache => {
      const item = cache[key];
      const currentValue = (item?.value as T) || null;

      if (currentValue !== previousValue) {
        previousValue = currentValue;
        callback(currentValue);
      }
    });

    return unsubscribe;
  }

  // Get reactive variable for this namespace (useful for React hooks)
  getReactiveVar() {
    return cacheVars.get(this.namespace);
  }

  // Private methods
  private getStorageKey(): string {
    return `${STORAGE_PREFIX}${this.namespace}`;
  }

  private loadFromStorage(): StorageData {
    if (typeof window === 'undefined' || !this.persistToStorage) {
      return {};
    }

    try {
      const stored = localStorage.getItem(this.getStorageKey());
      if (!stored) return {};

      const _data = JSON.parse(stored) as StorageData;

      // Clean up expired items
      const now = Date.now();
      const cleaned: StorageData = {};

      for (const [key, item] of Object.entries(_data)) {
        const { expiry } = item as CachedItem<unknown>;
        if (!expiry || now <= expiry) {
          cleaned[key] = item;
        }
      }

      return cleaned;
    } catch (error: unknown) {
      console.error('[ApolloCacheAdapter] Error loading from storage:', error);
      return {};
    }
  }

  private saveToStorage(data: StorageData): void {
    if (typeof window === 'undefined' || !this.persistToStorage) {
      return;
    }

    try {
      localStorage.setItem(this.getStorageKey(), JSON.stringify(data));
    } catch (error: unknown) {
      console.error('[ApolloCacheAdapter] Error saving to storage:', error);
    }
  }

  // Implement required CacheAdapter methods
  async has(key: string): Promise<boolean> {
    return await this.exists(key);
  }

  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.keys(pattern);
      await Promise.all(keys.map(key => this.delete(key)));
      return keys.length;
    } catch (error: unknown) {
      console.error('[ApolloCacheAdapter] Error invalidating pattern:', error);
      return 0;
    }
  }

  async getSize(): Promise<number> {
    try {
      const cacheVar = cacheVars.get(this.namespace);
      if (!cacheVar) return 0;

      const cache = cacheVar();
      return Object.keys(cache).length;
    } catch (error: unknown) {
      console.error('[ApolloCacheAdapter] Error getting size:', error);
      return 0;
    }
  }

  async getStats(): Promise<CacheStats> {
    const size = await this.getSize();
    const hitRate =
      this.metrics.hits + this.metrics.misses > 0
        ? (this.metrics.hits / (this.metrics.hits + this.metrics.misses)) * 100
        : 0;

    return {
      memory: `${size} items`,
      connections: 1, // Always 1 for Apollo cache
      operations: this.metrics.hits + this.metrics.misses + this.metrics.errors,
      hitRate,
    };
  }

  async ping(): Promise<boolean> {
    try {
      const cacheVar = cacheVars.get(this.namespace);
      return !!cacheVar;
    } catch {
      return false;
    }
  }

  async disconnect(): Promise<void> {
    // Clear cache and remove from map
    await this.clear();
    cacheVars.delete(this.namespace);
  }

  getMetrics(): CacheMetrics & { hitRate: number; totalRequests: number } {
    const totalRequests = this.metrics.hits + this.metrics.misses;
    const hitRate = totalRequests > 0 ? this.metrics.hits / totalRequests : 0;

    return {
      ...this.metrics,
      hitRate,
      totalRequests,
    };
  }

  // Optional lock methods (not needed for Apollo, but can be simulated)
  async acquireLock(lockKey: string, ttlSeconds: number = 30): Promise<string | null> {
    const lockValue = Math.random().toString(36).substring(7);
    const fullKey = `lock:${lockKey}`;

    const existing = await this.get<string>(fullKey);
    if (existing) return null;

    await this.set(fullKey, lockValue, ttlSeconds);
    return lockValue;
  }

  async releaseLock(lockKey: string, lockValue: string): Promise<boolean> {
    const fullKey = `lock:${lockKey}`;
    const current = await this.get<string>(fullKey);

    if (current === lockValue) {
      await this.delete(fullKey);
      return true;
    }

    return false;
  }

  // Update metrics
  private updateMetrics(responseTime: number): void {
    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > 100) {
      this.responseTimes.shift();
    }

    this.metrics.avgResponseTime =
      this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
  }

  private recordError(error: unknown): void {
    this.metrics.errors++;
    this.metrics.lastError = error instanceof Error ? error.message : String(error);
    this.metrics.lastErrorTime = new Date();
  }
}

// Factory function
export function createApolloCacheAdapter(
  namespace: string,
  options?: { defaultTTL?: number; persist?: boolean }
): ApolloCacheAdapter {
  return new ApolloCacheAdapter(namespace, options);
}
