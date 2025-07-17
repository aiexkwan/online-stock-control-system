'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface OrderCacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface UseOrderCacheOptions {
  defaultTTL?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache size
  onEvict?: (key: string, value: any) => void;
}

export function useOrderCache<T = any>(options: UseOrderCacheOptions = {}) {
  const {
    defaultTTL = 5 * 60 * 1000, // 5 minutes default
    maxSize = 100,
    onEvict,
  } = options;

  const cache = useRef<Map<string, OrderCacheItem<T>>>(new Map());
  const [cacheSize, setCacheSize] = useState(0);

  // Clean up expired entries
  const cleanupExpired = useCallback(() => {
    const now = Date.now();
    const keysToDelete: string[] = [];

    cache.current.forEach((item, key) => {
      if (now > item.timestamp + item.ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => {
      const value = cache.current.get(key);
      cache.current.delete(key);
      if (onEvict && value) {
        onEvict(key, value.data);
      }
    });

    if (keysToDelete.length > 0) {
      setCacheSize(cache.current.size);
    }
  }, [onEvict]);

  // Evict oldest entries if cache exceeds max size
  const evictOldest = useCallback(() => {
    if (cache.current.size <= maxSize) return;

    const sortedEntries = Array.from(cache.current.entries()).sort(
      (a, b) => a[1].timestamp - b[1].timestamp
    );

    const entriesToEvict = sortedEntries.slice(0, cache.current.size - maxSize);

    entriesToEvict.forEach(([key, value]) => {
      cache.current.delete(key);
      if (onEvict) {
        onEvict(key, value.data);
      }
    });

    setCacheSize(cache.current.size);
  }, [maxSize, onEvict]);

  // Get item from cache
  const get = useCallback(
    (key: string): T | null => {
      cleanupExpired();

      const item = cache.current.get(key);
      if (!item) return null;

      const now = Date.now();
      if (now > item.timestamp + item.ttl) {
        cache.current.delete(key);
        setCacheSize(cache.current.size);
        return null;
      }

      return item.data;
    },
    [cleanupExpired]
  );

  // Set item in cache
  const set = useCallback(
    (key: string, data: T, ttl?: number) => {
      const item: OrderCacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttl || defaultTTL,
      };

      cache.current.set(key, item);
      evictOldest();
      setCacheSize(cache.current.size);
    },
    [defaultTTL, evictOldest]
  );

  // Check if key exists and is valid
  const has = useCallback(
    (key: string): boolean => {
      const item = get(key);
      return item !== null;
    },
    [get]
  );

  // Remove item from cache
  const remove = useCallback((key: string) => {
    const deleted = cache.current.delete(key);
    if (deleted) {
      setCacheSize(cache.current.size);
    }
    return deleted;
  }, []);

  // Clear entire cache
  const clear = useCallback(() => {
    cache.current.clear();
    setCacheSize(0);
  }, []);

  // Get all valid cached keys
  const keys = useCallback((): string[] => {
    cleanupExpired();
    return Array.from(cache.current.keys());
  }, [cleanupExpired]);

  // Get cache statistics
  const getStats = useCallback(() => {
    cleanupExpired();

    const validEntries = Array.from(cache.current.values());
    const totalSize = validEntries.reduce((acc, item) => {
      return acc + JSON.stringify(item.data).length;
    }, 0);

    return {
      size: cache.current.size,
      maxSize,
      totalBytes: totalSize,
      hitRate: 0, // Can be calculated if we track hits/misses
      keys: Array.from(cache.current.keys()),
    };
  }, [cleanupExpired, maxSize]);

  // Batch get multiple items
  const batchGet = useCallback(
    (keys: string[]): Map<string, T> => {
      const results = new Map<string, T>();

      keys.forEach(key => {
        const value = get(key);
        if (value !== null) {
          results.set(key, value);
        }
      });

      return results;
    },
    [get]
  );

  // Batch set multiple items
  const batchSet = useCallback(
    (entries: Array<{ key: string; data: T; ttl?: number }>) => {
      entries.forEach(({ key, data, ttl }) => {
        set(key, data, ttl);
      });
    },
    [set]
  );

  // Preload data with a fetcher function
  const preload = useCallback(
    async (key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T> => {
      // Check if already cached
      const cached = get(key);
      if (cached !== null) {
        return cached;
      }

      // Fetch and cache
      try {
        const data = await fetcher();
        set(key, data, ttl);
        return data;
      } catch (error) {
        console.error(`Failed to preload cache for key: ${key}`, error);
        throw error;
      }
    },
    [get, set]
  );

  // Auto cleanup expired entries periodically
  useEffect(() => {
    const interval = setInterval(cleanupExpired, 60000); // Every minute
    return () => clearInterval(interval);
  }, [cleanupExpired]);

  return {
    get,
    set,
    has,
    remove,
    clear,
    keys,
    getStats,
    batchGet,
    batchSet,
    preload,
    cacheSize,
  };
}

// Specific hook for order data caching
export function useOrderDataCache() {
  return useOrderCache({
    defaultTTL: 10 * 60 * 1000, // 10 minutes for order data
    maxSize: 50,
    onEvict: (key, value) => {
      (process.env.NODE_ENV as string) !== 'production' &&
        (process.env.NODE_ENV as string) !== 'production' &&
        console.log(`[OrderCache] Evicted order: ${key}`);
    },
  });
}

// Specific hook for order summaries caching
export function useOrderSummariesCache() {
  return useOrderCache({
    defaultTTL: 5 * 60 * 1000, // 5 minutes for summaries
    maxSize: 200,
    onEvict: (key, value) => {
      (process.env.NODE_ENV as string) !== 'production' &&
        (process.env.NODE_ENV as string) !== 'production' &&
        console.log(`[OrderCache] Evicted summary: ${key}`);
    },
  });
}
