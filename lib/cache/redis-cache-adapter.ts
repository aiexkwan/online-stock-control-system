/**
 * Redis Cache Adapter - 高性能緩存實現
 * v1.8 系統優化 - Redis 緩存策略
 */

import Redis from 'ioredis';
import { BaseCacheAdapter, CacheStats } from './base-cache-adapter';
import { getRedisClient } from '../redis';
import { cacheLogger } from '../logger';

export class RedisCacheAdapter extends BaseCacheAdapter {
  private redis: Redis;

  constructor(keyPrefix: string = 'oscs:cache:', redisClient?: Redis) {
    super(keyPrefix);

    try {
      this.redis = redisClient || getRedisClient();
    } catch (error) {
      // 🔧 專家修復：Redis 初始化失敗時的優雅處理
      cacheLogger.warn(
        {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        'Redis 初始化失敗，將在操作時使用降級模式'
      );
      // 仍然設置 redis 實例，但後續操作會優雅失敗
      this.redis = redisClient || getRedisClient();
    }
  }

  /**
   * 獲取緩存值 (專家修復：優雅降級處理)
   */
  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();
    const fullKey = this.getKey(key);

    try {
      const result = await this.redis.get(fullKey);
      const responseTime = Date.now() - startTime;

      if (result) {
        this.updateMetrics(responseTime, true);
        const parsed = JSON.parse(result);

        cacheLogger.debug(
          {
            operation: 'get',
            key: fullKey,
            hit: true,
            responseTime,
          },
          'Cache hit'
        );

        return parsed;
      } else {
        this.updateMetrics(responseTime, false);

        cacheLogger.debug(
          {
            operation: 'get',
            key: fullKey,
            hit: false,
            responseTime,
          },
          'Cache miss'
        );

        return null;
      }
    } catch (error) {
      // 🔧 專家修復：優雅處理 Redis 連接失敗
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, false);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isConnectionError =
        errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes('connect') ||
        errorMessage.includes('timeout');

      if (isConnectionError) {
        cacheLogger.warn(
          {
            operation: 'get',
            key: fullKey,
            error: 'Redis connection unavailable',
            fallbackMode: true,
            responseTime,
          },
          'Redis 不可用，返回緩存未命中 (降級模式)'
        );
      } else {
        this.handleError('get', error);
      }

      // 返回 null 表示緩存未命中，讓調用方從數據庫獲取數據
      return null;
    }
  }

  /**
   * 設置緩存值 (專家修復：優雅降級處理)
   */
  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    const startTime = Date.now();
    const fullKey = this.getKey(key);

    try {
      const serialized = JSON.stringify(value);

      if (ttlSeconds > 0) {
        await this.redis.setex(fullKey, ttlSeconds, serialized);
      } else {
        await this.redis.set(fullKey, serialized);
      }

      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime);

      cacheLogger.debug(
        {
          operation: 'set',
          key: fullKey,
          ttl: ttlSeconds,
          size: serialized.length,
          responseTime,
        },
        'Cache set'
      );
    } catch (error) {
      // 🔧 專家修復：Redis 連接失敗時不拋出異常，只記錄警告
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isConnectionError =
        errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes('connect') ||
        errorMessage.includes('timeout');

      if (isConnectionError) {
        cacheLogger.warn(
          {
            operation: 'set',
            key: fullKey,
            error: 'Redis connection unavailable',
            fallbackMode: true,
            responseTime,
            ttl: ttlSeconds,
          },
          'Redis 不可用，緩存操作跳過 (降級模式)'
        );
        // 不拋出錯誤，讓系統繼續運行而不緩存
        return;
      } else {
        this.handleError('set', error);
        throw error; // 其他錯誤仍然拋出
      }
    }
  }

  /**
   * 刪除緩存鍵
   */
  async delete(key: string): Promise<boolean> {
    const startTime = Date.now();
    const fullKey = this.getKey(key);

    try {
      const result = await this.redis.del(fullKey);
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime);

      cacheLogger.debug(
        {
          operation: 'delete',
          key: fullKey,
          deleted: result > 0,
          responseTime,
        },
        'Cache delete'
      );

      return result > 0;
    } catch (error) {
      this.handleError('delete', error);
      return false;
    }
  }

  /**
   * 檢查鍵是否存在
   */
  async has(key: string): Promise<boolean> {
    const startTime = Date.now();
    const fullKey = this.getKey(key);

    try {
      const result = await this.redis.exists(fullKey);
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime);

      return result === 1;
    } catch (error) {
      this.handleError('has', error);
      return false;
    }
  }

  /**
   * 清空所有緩存
   */
  async clear(): Promise<void> {
    try {
      const pattern = this.getKey('*');
      const keys = await this.redis.keys(pattern);

      if (keys.length > 0) {
        await this.redis.del(...keys);
      }

      cacheLogger.info(
        {
          operation: 'clear',
          keysDeleted: keys.length,
        },
        'Cache cleared'
      );
    } catch (error) {
      this.handleError('clear', error);
      throw error;
    }
  }

  /**
   * 根據模式失效緩存
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const fullPattern = this.getKey(pattern);
      const keys = await this.redis.keys(fullPattern);

      if (keys.length > 0) {
        await this.redis.del(...keys);
      }

      cacheLogger.info(
        {
          operation: 'invalidatePattern',
          pattern: fullPattern,
          keysDeleted: keys.length,
        },
        'Pattern invalidated'
      );

      return keys.length;
    } catch (error) {
      this.handleError('invalidatePattern', error);
      return 0;
    }
  }

  /**
   * 獲取緩存大小
   */
  async getSize(): Promise<number> {
    try {
      const pattern = this.getKey('*');
      const keys = await this.redis.keys(pattern);
      return keys.length;
    } catch (error) {
      this.handleError('getSize', error);
      return 0;
    }
  }

  /**
   * 獲取緩存統計
   */
  async getStats(): Promise<CacheStats> {
    try {
      const info = await this.redis.info('memory');
      const connections = await this.redis.info('clients');
      const commands = await this.redis.info('stats');

      // 解析 Redis INFO 回應
      const memoryMatch = info.match(/used_memory_human:(.+)/);
      const connectionsMatch = connections.match(/connected_clients:(\d+)/);
      const commandsMatch = commands.match(/total_commands_processed:(\d+)/);

      return {
        memory: memoryMatch ? memoryMatch[1].trim() : 'unknown',
        connections: connectionsMatch ? parseInt(connectionsMatch[1]) : 0,
        operations: commandsMatch ? parseInt(commandsMatch[1]) : 0,
        hitRate: this.getMetrics().hitRate,
      };
    } catch (error) {
      this.handleError('getStats', error);
      return {
        memory: 'error',
        connections: 0,
        operations: 0,
        hitRate: 0,
      };
    }
  }

  /**
   * 檢查連接狀態
   */
  async ping(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      this.handleError('ping', error);
      return false;
    }
  }

  /**
   * 斷開連接
   */
  async disconnect(): Promise<void> {
    try {
      await this.redis.quit();
      cacheLogger.info('Redis cache adapter disconnected');
    } catch (error) {
      this.handleError('disconnect', error);
    }
  }

  /**
   * 批量獲取
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    const startTime = Date.now();
    const fullKeys = keys.map(key => this.getKey(key));

    try {
      const results = await this.redis.mget(...fullKeys);
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime);

      return results.map((result: string | null) => {
        if (result) {
          this.metrics.hits++;
          return JSON.parse(result);
        } else {
          this.metrics.misses++;
          return null;
        }
      });
    } catch (error) {
      this.handleError('mget', error);
      return keys.map(() => null);
    }
  }

  /**
   * 批量設置
   */
  async mset<T>(keyValuePairs: Array<{ key: string; value: T; ttl?: number }>): Promise<void> {
    const startTime = Date.now();

    try {
      // 使用 pipeline 批量執行
      const pipeline = this.redis.pipeline();

      for (const { key, value, ttl = 300 } of keyValuePairs) {
        const fullKey = this.getKey(key);
        const serialized = JSON.stringify(value);

        if (ttl > 0) {
          pipeline.setex(fullKey, ttl, serialized);
        } else {
          pipeline.set(fullKey, serialized);
        }
      }

      await pipeline.exec();

      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime);

      cacheLogger.debug(
        {
          operation: 'mset',
          count: keyValuePairs.length,
          responseTime,
        },
        'Batch cache set'
      );
    } catch (error) {
      this.handleError('mset', error);
      throw error;
    }
  }

  /**
   * 獲取鎖
   */
  async acquireLock(lockKey: string, ttlSeconds: number = 60): Promise<string | null> {
    const fullKey = this.getKey(`lock:${lockKey}`);
    const lockValue = Math.random().toString(36).substring(2, 15);

    try {
      const result = await this.redis.set(fullKey, lockValue, 'EX', ttlSeconds, 'NX');

      if (result === 'OK') {
        cacheLogger.debug(
          {
            operation: 'acquireLock',
            lockKey: fullKey,
            lockValue,
            ttl: ttlSeconds,
          },
          'Lock acquired'
        );

        return lockValue;
      }

      return null;
    } catch (error) {
      this.handleError('acquireLock', error);
      return null;
    }
  }

  /**
   * 釋放鎖
   */
  async releaseLock(lockKey: string, lockValue: string): Promise<boolean> {
    const fullKey = this.getKey(`lock:${lockKey}`);

    try {
      // 使用 Lua 腳本確保原子性
      const script = `
        if redis.call("GET", KEYS[1]) == ARGV[1] then
          return redis.call("DEL", KEYS[1])
        else
          return 0
        end
      `;

      const result = await this.redis.eval(script, 1, fullKey, lockValue);

      cacheLogger.debug(
        {
          operation: 'releaseLock',
          lockKey: fullKey,
          released: result === 1,
        },
        'Lock release attempted'
      );

      return result === 1;
    } catch (error) {
      this.handleError('releaseLock', error);
      return false;
    }
  }
}

// 單例實例
let redisCacheInstance: RedisCacheAdapter | null = null;

/**
 * 獲取 Redis 緩存適配器實例
 */
export function getRedisCacheAdapter(): RedisCacheAdapter {
  if (!redisCacheInstance) {
    redisCacheInstance = new RedisCacheAdapter();
  }
  return redisCacheInstance;
}

// 預設匯出
export default RedisCacheAdapter;
