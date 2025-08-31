/**
 * Memory Cache Adapter - 簡潔高效的內存緩存實現
 * 專家設計：遵循 KISS 原則，針對 30-40 用戶規模優化
 * Redis 移除 Phase 2.1 - 核心實現
 */

import { cacheLogger } from '../logger';
import { BaseCacheAdapter, CacheStats } from './base-cache-adapter';

interface CacheItem<T = unknown> {
  value: T;
  expireAt: number;
  createdAt: number;
  accessCount: number;
  lastAccess: number;
}

/**
 * 簡潔高效的 LRU + TTL 內存緩存適配器
 * 專家共識：適合小規模系統的最佳選擇
 */
export class MemoryCacheAdapter extends BaseCacheAdapter {
  private cache = new Map<string, CacheItem>();
  private maxSize: number;
  private defaultTTL: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(
    keyPrefix: string = 'oscs:cache:',
    maxSize: number = 200, // 專家建議：200項目足夠小規模系統
    defaultTTL: number = 300 // 專家建議：5分鐘默認TTL
  ) {
    super(keyPrefix);
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;

    // 啟動清理機制 - 每2分鐘清理過期項目
    this.startCleanupTimer();

    cacheLogger.info(
      {
        adapter: 'MemoryCache',
        maxSize,
        defaultTTL,
        keyPrefix,
      },
      'Memory cache adapter initialized - Redis 移除 Phase 2.1'
    );
  }

  /**
   * 獲取緩存值 (LRU 更新)
   */
  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();
    const fullKey = this.getKey(key);
    const item = this.cache.get(fullKey);

    if (!item) {
      this.updateMetrics(Date.now() - startTime, false);
      cacheLogger.debug(
        {
          operation: 'get',
          key: fullKey,
          hit: false,
          responseTime: Date.now() - startTime,
        },
        'Cache miss'
      );
      return null;
    }

    // 檢查過期
    if (Date.now() > item.expireAt) {
      this.cache.delete(fullKey);
      this.updateMetrics(Date.now() - startTime, false);
      cacheLogger.debug(
        {
          operation: 'get',
          key: fullKey,
          hit: false,
          expired: true,
          responseTime: Date.now() - startTime,
        },
        'Cache expired'
      );
      return null;
    }

    // 更新 LRU 統計
    item.accessCount++;
    item.lastAccess = Date.now();

    const responseTime = Date.now() - startTime;
    this.updateMetrics(responseTime, true);

    cacheLogger.debug(
      {
        operation: 'get',
        key: fullKey,
        hit: true,
        responseTime,
        accessCount: item.accessCount,
      },
      'Cache hit'
    );

    return item.value as T;
  }

  /**
   * 設置緩存值 (LRU 淘汰)
   */
  async set<T>(key: string, value: T, ttlSeconds: number = this.defaultTTL): Promise<void> {
    const startTime = Date.now();
    const fullKey = this.getKey(key);
    const now = Date.now();

    // 創建緩存項目
    const item: CacheItem<T> = {
      value,
      expireAt: now + ttlSeconds * 1000,
      createdAt: now,
      accessCount: 1,
      lastAccess: now,
    };

    // 檢查容量限制，實施 LRU 淘汰
    if (this.cache.size >= this.maxSize && !this.cache.has(fullKey)) {
      this.evictLRU();
    }

    this.cache.set(fullKey, item as CacheItem<unknown>);

    const responseTime = Date.now() - startTime;
    this.updateMetrics(responseTime);

    cacheLogger.debug(
      {
        operation: 'set',
        key: fullKey,
        ttl: ttlSeconds,
        size: JSON.stringify(value).length,
        responseTime,
        cacheSize: this.cache.size,
      },
      'Cache set'
    );
  }

  /**
   * 刪除緩存鍵
   */
  async delete(key: string): Promise<boolean> {
    const startTime = Date.now();
    const fullKey = this.getKey(key);
    const deleted = this.cache.delete(fullKey);

    const responseTime = Date.now() - startTime;
    this.updateMetrics(responseTime);

    cacheLogger.debug(
      {
        operation: 'delete',
        key: fullKey,
        deleted,
        responseTime,
        cacheSize: this.cache.size,
      },
      'Cache delete'
    );

    return deleted;
  }

  /**
   * 檢查鍵是否存在（不更新 LRU）
   */
  async has(key: string): Promise<boolean> {
    const fullKey = this.getKey(key);
    const item = this.cache.get(fullKey);

    if (!item) return false;

    // 檢查過期但不刪除
    return Date.now() <= item.expireAt;
  }

  /**
   * 清空所有緩存
   */
  async clear(): Promise<void> {
    const size = this.cache.size;
    this.cache.clear();

    cacheLogger.info(
      {
        operation: 'clear',
        itemsCleared: size,
      },
      'Memory cache cleared'
    );
  }

  /**
   * 模式失效緩存
   */
  async invalidatePattern(pattern: string): Promise<number> {
    const fullPattern = this.getKey(pattern);
    const regex = new RegExp(fullPattern.replace(/\*/g, '.*'));
    let deletedCount = 0;

    for (const key of Array.from(this.cache.keys())) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    cacheLogger.info(
      {
        operation: 'invalidatePattern',
        pattern: fullPattern,
        deletedCount,
        remainingSize: this.cache.size,
      },
      'Pattern invalidated'
    );

    return deletedCount;
  }

  /**
   * 獲取緩存大小
   */
  async getSize(): Promise<number> {
    return this.cache.size;
  }

  /**
   * 獲取緩存統計
   */
  async getStats(): Promise<CacheStats> {
    const now = Date.now();
    let totalMemory = 0;
    let _totalItems = 0;
    let _expiredItems = 0;

    // 計算內存使用和統計
    for (const [key, item] of Array.from(this.cache.entries())) {
      _totalItems++;
      if (now > item.expireAt) {
        _expiredItems++;
      }

      // 估算內存使用（簡單計算）
      totalMemory += key.length * 2; // UTF-16 字符
      totalMemory += JSON.stringify(item.value).length * 2;
      totalMemory += 64; // 元數據估算
    }

    return {
      memory: `${Math.round(totalMemory / 1024)} KB`,
      connections: 0, // 內存緩存無連接概念
      operations: this.metrics.hits + this.metrics.misses,
      hitRate: this.getMetrics().hitRate,
    };
  }

  /**
   * Ping 檢查 (內存緩存始終可用)
   */
  async ping(): Promise<boolean> {
    return true;
  }

  /**
   * 斷開連接 (清理定時器)
   */
  async disconnect(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    cacheLogger.info(
      {
        adapter: 'MemoryCache',
        finalSize: this.cache.size,
      },
      'Memory cache adapter disconnected'
    );
  }

  /**
   * LRU 淘汰最少使用的項目
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestAccess = Date.now();

    // 找到最久未訪問的項目
    for (const [key, item] of Array.from(this.cache.entries())) {
      if (item.lastAccess < oldestAccess) {
        oldestAccess = item.lastAccess;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      cacheLogger.debug(
        {
          operation: 'evictLRU',
          evictedKey: oldestKey,
          lastAccess: new Date(oldestAccess).toISOString(),
          cacheSize: this.cache.size,
        },
        'LRU eviction'
      );
    }
  }

  /**
   * 啟動清理定時器
   */
  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(
      () => {
        this.cleanupExpired();
      },
      2 * 60 * 1000
    ); // 每2分鐘清理一次
  }

  /**
   * 清理過期項目
   */
  private cleanupExpired(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, item] of Array.from(this.cache.entries())) {
      if (now > item.expireAt) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      cacheLogger.debug(
        {
          operation: 'cleanupExpired',
          cleanedCount,
          remainingSize: this.cache.size,
        },
        'Expired items cleaned up'
      );
    }
  }

  /**
   * 批量獲取
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    const startTime = Date.now();
    const results: (T | null)[] = [];

    for (const key of keys) {
      const result = await this.get<T>(key);
      results.push(result);
    }

    const responseTime = Date.now() - startTime;
    this.updateMetrics(responseTime);

    cacheLogger.debug(
      {
        operation: 'mget',
        keyCount: keys.length,
        responseTime,
      },
      'Batch get completed'
    );

    return results;
  }

  /**
   * 批量設置
   */
  async mset<T>(keyValuePairs: Array<{ key: string; value: T; ttl?: number }>): Promise<void> {
    const startTime = Date.now();

    for (const { key, value, ttl } of keyValuePairs) {
      await this.set(key, value, ttl);
    }

    const responseTime = Date.now() - startTime;
    this.updateMetrics(responseTime);

    cacheLogger.debug(
      {
        operation: 'mset',
        pairCount: keyValuePairs.length,
        responseTime,
      },
      'Batch set completed'
    );
  }

  /**
   * 獲取鎖 (簡化版，適用於單實例內存緩存)
   * Phase 2.1: 兼容接口，實際小規模系統不需要分佈式鎖
   */
  async acquireLock(lockKey: string, ttlSeconds: number = 60): Promise<string | null> {
    const fullKey = this.getKey(`lock:${lockKey}`);
    const lockValue = Math.random().toString(36).substring(2, 15);

    // 檢查鎖是否存在
    if (await this.has(fullKey)) {
      return null; // 鎖已存在
    }

    // 設置鎖
    await this.set(fullKey, { lockValue, acquired: Date.now() }, ttlSeconds);

    cacheLogger.debug(
      {
        operation: 'acquireLock',
        lockKey: fullKey,
        lockValue,
        ttl: ttlSeconds,
      },
      'Memory lock acquired'
    );

    return lockValue;
  }

  /**
   * 釋放鎖 (簡化版)
   */
  async releaseLock(lockKey: string, lockValue: string): Promise<boolean> {
    const fullKey = this.getKey(`lock:${lockKey}`);

    try {
      const lockData = await this.get<{ lockValue: string }>(fullKey);

      if (lockData && lockData.lockValue === lockValue) {
        const deleted = await this.delete(fullKey);

        cacheLogger.debug(
          {
            operation: 'releaseLock',
            lockKey: fullKey,
            released: deleted,
          },
          'Memory lock released'
        );

        return deleted;
      }

      return false; // 鎖值不匹配
    } catch (error) {
      cacheLogger.error(
        {
          operation: 'releaseLock',
          lockKey: fullKey,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        'Failed to release memory lock'
      );
      return false;
    }
  }
}

// 單例實例
let memoryCacheInstance: MemoryCacheAdapter | null = null;

/**
 * 獲取內存緩存適配器實例
 */
export function getMemoryCacheAdapter(): MemoryCacheAdapter {
  if (!memoryCacheInstance) {
    memoryCacheInstance = new MemoryCacheAdapter();
  }
  return memoryCacheInstance;
}

// 預設匯出
export default MemoryCacheAdapter;
