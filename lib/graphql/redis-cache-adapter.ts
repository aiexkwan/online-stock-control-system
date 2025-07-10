import IORedis, { Cluster } from 'ioredis';
type Redis = IORedis;
import { cacheLogger } from '../logger';
import { createRedisClient, getRedisClient } from '../redis';
import EventEmitter from 'events';
import { isDevelopment } from '@/lib/utils/env';

// 緩存適配器接口
export interface CacheAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  has(key: string): Promise<boolean>;
  clear(): Promise<void>;
  invalidatePattern(pattern: string): Promise<number>;
  getSize(): Promise<number>;
  getStats(): Promise<{
    memory: string;
    connections: number;
    operations: number;
    hitRate?: number;
  }>;
  ping(): Promise<boolean>;
  disconnect(): Promise<void>;
  acquireLock?(lockKey: string, ttlSeconds?: number): Promise<string | null>;
  releaseLock?(lockKey: string, lockValue: string): Promise<boolean>;
  mget?<T>(keys: string[]): Promise<(T | null)[]>;
  mset?<T>(keyValuePairs: Array<{ key: string; value: T; ttl?: number }>): Promise<void>;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  connectTimeout?: number;
  maxRetriesPerRequest?: number;
  cluster?: {
    nodes: Array<{ host: string; port: number }>;
    options?: any;
  };
}

// 基礎 Redis 緩存適配器 - 包含所有共用邏輯
abstract class BaseRedisCacheAdapter extends EventEmitter implements CacheAdapter {
  protected redis: Redis | Cluster;
  protected keyPrefix: string;
  protected healthCheckTimer?: NodeJS.Timeout;
  protected metrics = {
    hits: 0,
    misses: 0,
    errors: 0,
    avgResponseTime: 0,
    lastError: null as string | null,
    lastErrorTime: null as Date | null,
  };
  protected responseTimes: number[] = [];

  constructor(redis: Redis | Cluster, keyPrefix: string = 'oscs:cache:') {
    super();
    this.redis = redis;
    this.keyPrefix = keyPrefix;
    this.setupEventListeners();
    this.startHealthCheck();
  }

  protected abstract getErrorPrefix(): string;

  protected setupEventListeners(): void {
    this.redis.on('connect', () => {
      cacheLogger.info({
        adapter: this.getErrorPrefix(),
        event: 'connected',
        keyPrefix: this.keyPrefix,
      }, 'Cache adapter connected successfully');
      this.emit('connected');
    });

    this.redis.on('error', (error: Error) => {
      cacheLogger.error({
        adapter: this.getErrorPrefix(),
        event: 'error',
        error: error.message,
        stack: error.stack,
        metrics: this.metrics,
      }, 'Cache connection error');
      this.metrics.errors++;
      this.metrics.lastError = error.message;
      this.metrics.lastErrorTime = new Date();
      this.emit('error', error);
    });

    this.redis.on('close', () => {
      cacheLogger.warn({
        adapter: this.getErrorPrefix(),
        event: 'disconnected',
        keyPrefix: this.keyPrefix,
      }, 'Cache connection closed');
      this.emit('disconnected');
    });

    this.redis.on('reconnecting', () => {
      cacheLogger.info({
        adapter: this.getErrorPrefix(),
        event: 'reconnecting',
        retryCount: this.metrics.errors,
      }, 'Cache adapter reconnecting');
      this.emit('reconnecting');
    });
  }

  protected startHealthCheck(): void {
    this.healthCheckTimer = setInterval(async () => {
      try {
        const healthy = await this.ping();
        if (!healthy) {
          this.emit('unhealthy', { timestamp: new Date() });
        }
      } catch (error) {
        cacheLogger.error({
          adapter: this.getErrorPrefix(),
          operation: 'healthCheck',
          error: error instanceof Error ? error.message : 'Unknown error',
        }, 'Health check failed');
      }
    }, 30000); // 每30秒檢查一次
  }

  protected updateMetrics(responseTime: number, hit?: boolean): void {
    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift();
    }

    this.metrics.avgResponseTime =
      this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;

    if (hit !== undefined) {
      if (hit) {
        this.metrics.hits++;
      } else {
        this.metrics.misses++;
      }
    }
  }

  protected getKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();
    try {
      const value = await this.redis.get(this.getKey(key));
      const responseTime = Date.now() - startTime;

      const hit = value !== null;
      this.updateMetrics(responseTime, hit);

      if (value === null) {
        cacheLogger.debug({
          adapter: this.getErrorPrefix(),
          operation: 'get',
          key,
          result: 'miss',
          responseTime,
        }, 'Cache miss (normal during warmup or first access)');
        return null;
      }
      
      cacheLogger.debug({
        adapter: this.getErrorPrefix(),
        operation: 'get',
        key,
        result: 'hit',
        responseTime,
        size: value.length,
      }, 'Cache hit');

      return JSON.parse(value) as T;
    } catch (error) {
      this.metrics.errors++;
      const isConnectionError = error.message?.includes('Connection');
      
      const logLevel = isConnectionError ? 'error' : 'warn';
      cacheLogger[logLevel]({
        adapter: this.getErrorPrefix(),
        operation: 'get',
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
        isConnectionError,
        metrics: this.metrics,
      }, isConnectionError ? 'Cache connection error' : 'Cache get error');
      
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const startTime = Date.now();
    
    try {
      const serializedValue = JSON.stringify(value);
      const redisKey = this.getKey(key);

      if (ttlSeconds) {
        await this.redis.setex(redisKey, ttlSeconds, serializedValue);
      } else {
        await this.redis.set(redisKey, serializedValue);
      }
      
      const responseTime = Date.now() - startTime;
      cacheLogger.debug({
        adapter: this.getErrorPrefix(),
        operation: 'set',
        key,
        ttl: ttlSeconds,
        size: serializedValue.length,
        responseTime,
      }, 'Cache set successful');
      
    } catch (error) {
      cacheLogger.error({
        adapter: this.getErrorPrefix(),
        operation: 'set',
        key,
        ttl: ttlSeconds,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      }, 'Cache set error');
      throw error;
    }
  }

  async delete(key: string): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      const result = await this.redis.del(this.getKey(key));
      const success = result > 0;
      
      cacheLogger.debug({
        adapter: this.getErrorPrefix(),
        operation: 'delete',
        key,
        success,
        responseTime: Date.now() - startTime,
      }, success ? 'Cache key deleted' : 'Cache key not found');
      
      return success;
    } catch (error) {
      cacheLogger.error({
        adapter: this.getErrorPrefix(),
        operation: 'delete',
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      }, 'Cache delete error');
      return false;
    }
  }

  async has(key: string): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      const result = await this.redis.exists(this.getKey(key));
      const exists = result === 1;
      
      cacheLogger.debug({
        adapter: this.getErrorPrefix(),
        operation: 'has',
        key,
        exists,
        responseTime: Date.now() - startTime,
      }, 'Cache key existence check');
      
      return exists;
    } catch (error) {
      cacheLogger.error({
        adapter: this.getErrorPrefix(),
        operation: 'has',
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      }, 'Cache has error');
      return false;
    }
  }

  async clear(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const keys = await this.redis.keys(`${this.keyPrefix}*`);
      
      if (keys.length > 0) {
        const pipeline = this.redis.pipeline();
        keys.forEach((key: string) => pipeline.del(key));
        await pipeline.exec();
      }
      
      cacheLogger.info({
        adapter: this.getErrorPrefix(),
        operation: 'clear',
        keysCleared: keys.length,
        responseTime: Date.now() - startTime,
      }, 'Cache cleared');
      
    } catch (error) {
      cacheLogger.error({
        adapter: this.getErrorPrefix(),
        operation: 'clear',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      }, 'Cache clear error');
      throw error;
    }
  }

  async invalidatePattern(pattern: string): Promise<number> {
    const startTime = Date.now();
    
    try {
      const keys = await this.redis.keys(`${this.keyPrefix}${pattern}`);
      if (keys.length === 0) {
        cacheLogger.debug({
          adapter: this.getErrorPrefix(),
          operation: 'invalidatePattern',
          pattern,
          keysFound: 0,
        }, 'No keys matched pattern');
        return 0;
      }

      const pipeline = this.redis.pipeline();
      keys.forEach((key: string) => pipeline.del(key));
      await pipeline.exec();
      
      cacheLogger.info({
        adapter: this.getErrorPrefix(),
        operation: 'invalidatePattern',
        pattern,
        keysInvalidated: keys.length,
        responseTime: Date.now() - startTime,
      }, 'Pattern invalidation successful');
      
      return keys.length;
    } catch (error) {
      cacheLogger.error({
        adapter: this.getErrorPrefix(),
        operation: 'invalidatePattern',
        pattern,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      }, 'Pattern invalidation error');
      return 0;
    }
  }

  async getSize(): Promise<number> {
    const startTime = Date.now();
    
    try {
      const keys = await this.redis.keys(`${this.keyPrefix}*`);
      
      cacheLogger.debug({
        adapter: this.getErrorPrefix(),
        operation: 'getSize',
        size: keys.length,
        responseTime: Date.now() - startTime,
      }, 'Cache size retrieved');
      
      return keys.length;
    } catch (error) {
      cacheLogger.error({
        adapter: this.getErrorPrefix(),
        operation: 'getSize',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      }, 'Get cache size error');
      return 0;
    }
  }

  async getStats(): Promise<{
    memory: string;
    connections: number;
    operations: number;
    hitRate?: number;
  }> {
    try {
      const info = await this.redis.info('memory');
      const memoryUsed = info.match(/used_memory_human:(\S+)/);
      const connections = info.match(/connected_clients:(\d+)/);

      const hitRate =
        this.metrics.hits + this.metrics.misses > 0
          ? (this.metrics.hits / (this.metrics.hits + this.metrics.misses)) * 100
          : 0;

      return {
        memory: memoryUsed ? memoryUsed[1] : 'Unknown',
        connections: connections ? parseInt(connections[1]) : 0,
        operations: this.metrics.hits + this.metrics.misses,
        hitRate,
      };
    } catch (error) {
      cacheLogger.error({
        adapter: this.getErrorPrefix(),
        operation: 'getStats',
        error: error instanceof Error ? error.message : 'Unknown error',
      }, 'Get cache stats error');
      return {
        memory: 'Error',
        connections: 0,
        operations: 0,
      };
    }
  }

  async ping(): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      const result = await this.redis.ping();
      const success = result === 'PONG';
      
      cacheLogger.debug({
        adapter: this.getErrorPrefix(),
        operation: 'ping',
        success,
        responseTime: Date.now() - startTime,
      }, 'Cache ping');
      
      return success;
    } catch (error) {
      cacheLogger.error({
        adapter: this.getErrorPrefix(),
        operation: 'ping',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      }, 'Cache ping error');
      return false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.healthCheckTimer) {
        clearInterval(this.healthCheckTimer);
      }
      await this.redis.quit();
      
      cacheLogger.info({
        adapter: this.getErrorPrefix(),
        operation: 'disconnect',
      }, 'Cache adapter disconnected gracefully');
      
    } catch (error) {
      cacheLogger.error({
        adapter: this.getErrorPrefix(),
        operation: 'disconnect',
        error: error instanceof Error ? error.message : 'Unknown error',
      }, 'Cache disconnect error, forcing disconnect');
      this.redis.disconnect();
    }
  }

  // 高級功能：分佈式鎖
  async acquireLock(lockKey: string, ttlSeconds: number = 30): Promise<string | null> {
    const lockValue = `${Date.now()}-${Math.random()}`;
    const key = this.getKey(`lock:${lockKey}`);

    try {
      const result = await this.redis.set(key, lockValue, 'EX', ttlSeconds, 'NX');
      return result === 'OK' ? lockValue : null;
    } catch (error) {
      cacheLogger.error({
        adapter: this.getErrorPrefix(),
        operation: 'acquireLock',
        lockKey,
        ttl: ttlSeconds,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, 'Lock acquisition error');
      return null;
    }
  }

  async releaseLock(lockKey: string, lockValue: string): Promise<boolean> {
    const key = this.getKey(`lock:${lockKey}`);

    const luaScript = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    try {
      const result = await this.redis.eval(luaScript, 1, key, lockValue);
      return result === 1;
    } catch (error) {
      cacheLogger.error({
        adapter: this.getErrorPrefix(),
        operation: 'releaseLock',
        lockKey,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, 'Lock release error');
      return false;
    }
  }

  // 批量操作
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    const startTime = Date.now();
    
    try {
      const redisKeys = keys.map(key => this.getKey(key));
      const values = await this.redis.mget(...redisKeys);
      
      const hits = values.filter((v: any) => v !== null).length;
      const responseTime = Date.now() - startTime;
      
      cacheLogger.debug({
        adapter: this.getErrorPrefix(),
        operation: 'mget',
        keyCount: keys.length,
        hits,
        misses: keys.length - hits,
        responseTime,
      }, 'Batch get completed');

      return values.map((value: any) => {
        if (value === null) return null;
        try {
          return JSON.parse(value) as T;
        } catch {
          return null;
        }
      });
    } catch (error) {
      cacheLogger.error({
        adapter: this.getErrorPrefix(),
        operation: 'mget',
        keyCount: keys.length,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, 'Batch get error');
      return keys.map(() => null);
    }
  }

  async mset<T>(keyValuePairs: Array<{ key: string; value: T; ttl?: number }>): Promise<void> {
    const startTime = Date.now();
    
    try {
      if (keyValuePairs.length === 0) return;

      const pipeline = this.redis.pipeline();

      keyValuePairs.forEach(({ key, value, ttl }) => {
        const redisKey = this.getKey(key);
        const serializedValue = JSON.stringify(value);

        if (ttl) {
          pipeline.setex(redisKey, ttl, serializedValue);
        } else {
          pipeline.set(redisKey, serializedValue);
        }
      });

      await pipeline.exec();
      
      cacheLogger.debug({
        adapter: this.getErrorPrefix(),
        operation: 'mset',
        keyCount: keyValuePairs.length,
        responseTime: Date.now() - startTime,
      }, 'Batch set completed');
    } catch (error) {
      cacheLogger.error({
        adapter: this.getErrorPrefix(),
        operation: 'mset',
        keyCount: keyValuePairs.length,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, 'Batch set error');
      throw error;
    }
  }

  // 監控功能：獲取詳細指標
  getMetrics() {
    const hitRate =
      this.metrics.hits + this.metrics.misses > 0
        ? (this.metrics.hits / (this.metrics.hits + this.metrics.misses)) * 100
        : 0;

    return {
      ...this.metrics,
      hitRate,
      totalRequests: this.metrics.hits + this.metrics.misses,
    };
  }

  // 監控功能：重置指標
  resetMetrics() {
    this.metrics = {
      hits: 0,
      misses: 0,
      errors: 0,
      avgResponseTime: 0,
      lastError: null,
      lastErrorTime: null,
    };
    this.responseTimes = [];
  }

  // Redis-specific methods for distributed operations
  async eval(script: string, keys: string[]): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Convert keys array to proper format for eval
      const numKeys = keys.length;
      const allArgs = [script, numKeys, ...keys];
      
      const result = await (this.redis as any).eval(...allArgs);
      
      cacheLogger.debug({
        adapter: this.getErrorPrefix(),
        operation: 'eval',
        duration: Date.now() - startTime,
      }, 'Redis eval executed');
      
      return result;
    } catch (error) {
      cacheLogger.error({
        adapter: this.getErrorPrefix(),
        operation: 'eval',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      }, 'Redis eval error');
      throw error;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    const startTime = Date.now();
    
    try {
      const fullPattern = `${this.keyPrefix}${pattern}`;
      const result = await this.redis.keys(fullPattern);
      
      // Remove prefix from results
      const keys = result.map((key: string) => key.replace(this.keyPrefix, ''));
      
      cacheLogger.debug({
        adapter: this.getErrorPrefix(),
        operation: 'keys',
        pattern,
        count: keys.length,
        duration: Date.now() - startTime,
      }, 'Redis keys query');
      
      return keys;
    } catch (error) {
      cacheLogger.error({
        adapter: this.getErrorPrefix(),
        operation: 'keys',
        pattern,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      }, 'Redis keys error');
      return [];
    }
  }
}

// 標準 Redis 緩存適配器
export class RedisCacheAdapter extends BaseRedisCacheAdapter {
  private isCluster: boolean;

  constructor(config: RedisConfig) {
    let redis: Redis | Cluster;
    const isCluster = !!config.cluster;

    if (config.cluster) {
      // Redis Cluster 配置
      redis = new Cluster(config.cluster.nodes, {
        enableOfflineQueue: false,
        retryDelayOnFailover: 1000,
        maxRetriesPerRequest: 3,
        ...config.cluster.options,
      });
    } else {
      // 單機 Redis 配置
      redis = new IORedis({
        host: config.host,
        port: config.port,
        password: config.password,
        db: config.db || 0,
        connectTimeout: config.connectTimeout || 5000,
        maxRetriesPerRequest: config.maxRetriesPerRequest || 3,
        retryDelayOnFailover: 1000,
        enableOfflineQueue: false,
        lazyConnect: true,
      });
    }

    super(redis, config.keyPrefix);
    this.isCluster = isCluster;
  }

  protected getErrorPrefix(): string {
    return 'Redis';
  }
}

// Upstash Redis 適配器 - 針對 Vercel 和 Upstash 優化
export class UpstashRedisCacheAdapter extends BaseRedisCacheAdapter {
  constructor(config: RedisConfig) {
    // 使用統一的 Redis 客戶端（支援 Upstash）
    const redis = createRedisClient({
      url: process.env.REDIS_URL,
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db,
      tls: true, // Upstash 需要 TLS
    });

    super(redis, config.keyPrefix);
  }

  protected getErrorPrefix(): string {
    return 'Upstash Redis';
  }

  protected setupEventListeners(): void {
    // Upstash 不支持標準的 Redis 事件
    // 但我們仍然可以監控錯誤
  }
}

// 內存緩存適配器 - 用於開發環境回退
export class MemoryCacheAdapter implements CacheAdapter {
  private cache: Map<string, { value: any; expiry?: number }> = new Map();

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) return null;

    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const expiry = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.cache.set(key, { value, expiry });
  }

  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  async has(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async invalidatePattern(pattern: string): Promise<number> {
    let count = 0;
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  async getSize(): Promise<number> {
    // 清理過期項目
    for (const [key, item] of this.cache.entries()) {
      if (item.expiry && Date.now() > item.expiry) {
        this.cache.delete(key);
      }
    }
    return this.cache.size;
  }

  async getStats(): Promise<{
    memory: string;
    connections: number;
    operations: number;
    hitRate?: number;
  }> {
    return {
      memory: `${((this.cache.size * 100) / 1024).toFixed(1)}KB`,
      connections: 1,
      operations: this.cache.size,
    };
  }

  async ping(): Promise<boolean> {
    return true;
  }

  async disconnect(): Promise<void> {
    // No-op for memory cache
  }

  async acquireLock(lockKey: string, ttlSeconds: number = 30): Promise<string | null> {
    const lockValue = `${Date.now()}-${Math.random()}`;
    const existing = this.cache.get(`lock:${lockKey}`);

    if (existing && (!existing.expiry || Date.now() < existing.expiry)) {
      return null; // Lock already exists
    }

    await this.set(`lock:${lockKey}`, lockValue, ttlSeconds);
    return lockValue;
  }

  async releaseLock(lockKey: string, lockValue: string): Promise<boolean> {
    const existing = await this.get(`lock:${lockKey}`);
    if (existing === lockValue) {
      return await this.delete(`lock:${lockKey}`);
    }
    return false;
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    return Promise.all(keys.map(key => this.get<T>(key)));
  }

  async mset<T>(keyValuePairs: Array<{ key: string; value: T; ttl?: number }>): Promise<void> {
    for (const { key, value, ttl } of keyValuePairs) {
      await this.set(key, value, ttl);
    }
  }
}

// 故障轉移緩存適配器
export class FailoverCacheAdapter extends EventEmitter implements CacheAdapter {
  private primary: CacheAdapter;
  private fallback: CacheAdapter;
  private isPrimaryHealthy: boolean = true;
  private retryCount: number = 0;
  private maxRetries: number = 3;

  constructor(primary: CacheAdapter, fallback: CacheAdapter) {
    super();
    this.primary = primary;
    this.fallback = fallback;

    // 監聽主緩存的健康狀態
    if (primary instanceof EventEmitter) {
      primary.on('error', () => this.handlePrimaryError());
      primary.on('disconnected', () => this.handlePrimaryError());
      primary.on('connected', () => this.handlePrimaryRecovery());
    }
  }

  private handlePrimaryError() {
    this.retryCount++;
    if (this.retryCount >= this.maxRetries && this.isPrimaryHealthy) {
      this.isPrimaryHealthy = false;
      cacheLogger.warn({
        adapter: 'FailoverCache',
        event: 'failover',
        from: 'primary',
        to: 'fallback',
        retryCount: this.retryCount,
      }, 'Primary cache failed, switching to fallback cache');
      this.emit('failover', { from: 'primary', to: 'fallback' });
    }
  }

  private handlePrimaryRecovery() {
    if (!this.isPrimaryHealthy) {
      this.isPrimaryHealthy = true;
      this.retryCount = 0;
      cacheLogger.info({
        adapter: 'FailoverCache',
        event: 'recovery',
        from: 'fallback',
        to: 'primary',
      }, 'Primary cache recovered, switching back');
      this.emit('recovery', { from: 'fallback', to: 'primary' });
    }
  }

  private get activeAdapter(): CacheAdapter {
    return this.isPrimaryHealthy ? this.primary : this.fallback;
  }

  // 實現所有 CacheAdapter 方法，使用 activeAdapter
  async get<T>(key: string): Promise<T | null> {
    return this.activeAdapter.get<T>(key);
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    return this.activeAdapter.set(key, value, ttlSeconds);
  }

  async delete(key: string): Promise<boolean> {
    return this.activeAdapter.delete(key);
  }

  async has(key: string): Promise<boolean> {
    return this.activeAdapter.has(key);
  }

  async clear(): Promise<void> {
    return this.activeAdapter.clear();
  }

  async invalidatePattern(pattern: string): Promise<number> {
    return this.activeAdapter.invalidatePattern(pattern);
  }

  async getSize(): Promise<number> {
    return this.activeAdapter.getSize();
  }

  async getStats(): Promise<any> {
    const stats = await this.activeAdapter.getStats();
    return {
      ...stats,
      isPrimaryActive: this.isPrimaryHealthy,
      failoverActive: !this.isPrimaryHealthy,
    };
  }

  async ping(): Promise<boolean> {
    return this.activeAdapter.ping();
  }

  async disconnect(): Promise<void> {
    await Promise.all([this.primary.disconnect(), this.fallback.disconnect()]);
  }

  async acquireLock(lockKey: string, ttlSeconds?: number): Promise<string | null> {
    if (this.activeAdapter.acquireLock) {
      return this.activeAdapter.acquireLock(lockKey, ttlSeconds);
    }
    return null;
  }

  async releaseLock(lockKey: string, lockValue: string): Promise<boolean> {
    if (this.activeAdapter.releaseLock) {
      return this.activeAdapter.releaseLock(lockKey, lockValue);
    }
    return false;
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (this.activeAdapter.mget) {
      return this.activeAdapter.mget<T>(keys);
    }
    return Promise.all(keys.map(key => this.activeAdapter.get<T>(key)));
  }

  async mset<T>(keyValuePairs: Array<{ key: string; value: T; ttl?: number }>): Promise<void> {
    if (this.activeAdapter.mset) {
      return this.activeAdapter.mset(keyValuePairs);
    }
    for (const { key, value, ttl } of keyValuePairs) {
      await this.activeAdapter.set(key, value, ttl);
    }
  }
}

// 工廠函數：創建合適的緩存適配器
export function createCacheAdapter(config?: RedisConfig): CacheAdapter {
  // 開發環境使用內存緩存
  if (isDevelopment() && !config) {
    cacheLogger.info({
      adapter: 'Factory',
      environment: 'development',
      type: 'MemoryCache',
    }, 'Using memory cache adapter for development');
    return new MemoryCacheAdapter();
  }

  // 生產環境使用 Redis 或 Upstash
  if (process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL?.includes('upstash')) {
    cacheLogger.info({
      adapter: 'Factory',
      environment: process.env.NODE_ENV,
      type: 'UpstashRedis',
    }, 'Using Upstash Redis cache adapter');
    return new UpstashRedisCacheAdapter(config || {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    });
  }

  // 標準 Redis
  if (config || process.env.REDIS_HOST) {
    cacheLogger.info({
      adapter: 'Factory',
      environment: process.env.NODE_ENV,
      type: 'StandardRedis',
      host: config?.host || process.env.REDIS_HOST || 'localhost',
      port: config?.port || parseInt(process.env.REDIS_PORT || '6379'),
    }, 'Using standard Redis cache adapter');
    return new RedisCacheAdapter(config || {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    });
  }

  // 默認使用內存緩存
  cacheLogger.warn({
    adapter: 'Factory',
    environment: process.env.NODE_ENV,
    type: 'MemoryCache',
    reason: 'no_redis_config',
  }, 'No Redis configuration found, using memory cache adapter');
  return new MemoryCacheAdapter();
}

// 創建帶故障轉移的緩存適配器
export function createFailoverCacheAdapter(primaryConfig?: RedisConfig): CacheAdapter {
  const primary = primaryConfig ? new RedisCacheAdapter(primaryConfig) : createCacheAdapter();
  const fallback = new MemoryCacheAdapter();
  
  return new FailoverCacheAdapter(primary, fallback);
}