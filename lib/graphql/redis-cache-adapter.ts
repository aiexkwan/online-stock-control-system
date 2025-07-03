import Redis from 'ioredis';
import { logger } from '../logger';
import { createRedisClient, getRedisClient } from '../redis';
import EventEmitter from 'events';

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

export class RedisCacheAdapter extends EventEmitter implements CacheAdapter {
  private redis: Redis.Redis | Redis.Cluster;
  private keyPrefix: string;
  private isCluster: boolean;
  private healthCheckTimer?: NodeJS.Timeout;
  private metrics = {
    hits: 0,
    misses: 0,
    errors: 0,
    avgResponseTime: 0,
    lastError: null as string | null,
    lastErrorTime: null as Date | null,
  };
  private responseTimes: number[] = [];

  constructor(config: RedisConfig) {
    super();
    this.keyPrefix = config.keyPrefix || 'oscs:cache:';
    this.isCluster = !!config.cluster;

    if (config.cluster) {
      // Redis Cluster 配置
      this.redis = new Redis.Cluster(config.cluster.nodes, {
        enableOfflineQueue: false,
        retryDelayOnFailover: 1000,
        maxRetriesPerRequest: 3,
        ...config.cluster.options,
      });
    } else {
      // 單機 Redis 配置
      this.redis = new Redis({
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

    this.setupEventListeners();
    this.startHealthCheck();
  }

  private setupEventListeners(): void {
    this.redis.on('connect', () => {
      logger.info('Redis connected successfully');
      this.emit('connected');
    });

    this.redis.on('error', (error) => {
      logger.error('Redis connection error:', error);
      this.metrics.errors++;
      this.metrics.lastError = error.message;
      this.metrics.lastErrorTime = new Date();
      this.emit('error', error);
    });

    this.redis.on('close', () => {
      logger.warn('Redis connection closed');
      this.emit('disconnected');
    });

    this.redis.on('reconnecting', () => {
      logger.info('Redis reconnecting...');
      this.emit('reconnecting');
    });
  }
  
  private startHealthCheck(): void {
    this.healthCheckTimer = setInterval(async () => {
      try {
        const healthy = await this.ping();
        if (!healthy) {
          this.emit('unhealthy', { timestamp: new Date() });
        }
      } catch (error) {
        logger.error('Health check failed:', error);
      }
    }, 30000); // 每30秒檢查一次
  }
  
  private updateMetrics(responseTime: number, hit?: boolean): void {
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

  private getKey(key: string): string {
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
        // 🌟 方案1: Cache miss 不記錄為錯誤，這是正常行為
        logger.debug(`Cache miss for key: ${key} (normal during warmup or first access)`);
        return null;
      }
      
      return JSON.parse(value) as T;
    } catch (error) {
      this.metrics.errors++;
      // 區分錯誤類型：連接錯誤 vs 解析錯誤
      if (error.message?.includes('Connection')) {
        logger.error(`Redis connection error for key ${key}:`, error);
      } else {
        logger.warn(`Redis get error for key ${key} (possibly empty cache):`, error.message);
      }
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      const redisKey = this.getKey(key);

      if (ttlSeconds) {
        await this.redis.setex(redisKey, ttlSeconds, serializedValue);
      } else {
        await this.redis.set(redisKey, serializedValue);
      }
    } catch (error) {
      logger.error(`Redis set error for key ${key}:`, error);
      throw error;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const result = await this.redis.del(this.getKey(key));
      return result > 0;
    } catch (error) {
      logger.error(`Redis delete error for key ${key}:`, error);
      return false;
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(this.getKey(key));
      return result === 1;
    } catch (error) {
      logger.error(`Redis exists error for key ${key}:`, error);
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      if (this.isCluster) {
        // Cluster 模式需要遍歷所有節點
        const nodes = (this.redis as Redis.Cluster).nodes('master');
        await Promise.all(
          nodes.map(node => node.flushdb())
        );
      } else {
        await (this.redis as Redis.Redis).flushdb();
      }
    } catch (error) {
      logger.error('Redis clear error:', error);
      throw error;
    }
  }

  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const searchPattern = this.getKey(pattern);
      const keys = await this.redis.keys(searchPattern);
      
      if (keys.length === 0) return 0;

      if (this.isCluster) {
        // Cluster 模式需要分批處理
        const pipeline = (this.redis as Redis.Cluster).pipeline();
        keys.forEach(key => pipeline.del(key));
        await pipeline.exec();
      } else {
        await (this.redis as Redis.Redis).del(...keys);
      }

      return keys.length;
    } catch (error) {
      logger.error(`Redis pattern invalidation error for ${pattern}:`, error);
      return 0;
    }
  }

  async getSize(): Promise<number> {
    try {
      if (this.isCluster) {
        const nodes = (this.redis as Redis.Cluster).nodes('master');
        const sizes = await Promise.all(
          nodes.map(node => node.dbsize())
        );
        return sizes.reduce((total, size) => total + size, 0);
      } else {
        return await (this.redis as Redis.Redis).dbsize();
      }
    } catch (error) {
      logger.error('Redis size error:', error);
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
      const info = await this.redis.info('memory', 'stats', 'clients');
      const lines = info.split('\r\n');
      
      const stats: any = {};
      lines.forEach(line => {
        const [key, value] = line.split(':');
        if (key && value) {
          stats[key] = value;
        }
      });

      return {
        memory: stats.used_memory_human || '0B',
        connections: parseInt(stats.connected_clients || '0'),
        operations: parseInt(stats.total_commands_processed || '0'),
        hitRate: stats.keyspace_hits && stats.keyspace_misses ? 
          (parseInt(stats.keyspace_hits) / 
           (parseInt(stats.keyspace_hits) + parseInt(stats.keyspace_misses))) * 100 : 
          undefined
      };
    } catch (error) {
      logger.error('Redis stats error:', error);
      return {
        memory: 'Error',
        connections: 0,
        operations: 0
      };
    }
  }

  async ping(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis ping error:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.healthCheckTimer) {
        clearInterval(this.healthCheckTimer);
      }
      await this.redis.quit();
    } catch (error) {
      logger.error('Redis disconnect error:', error);
      this.redis.disconnect();
    }
  }
  
  // 監控功能：獲取詳細指標
  getMetrics() {
    const hitRate = this.metrics.hits + this.metrics.misses > 0
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

  // 高級功能：分佈式鎖
  async acquireLock(lockKey: string, ttlSeconds: number = 30): Promise<string | null> {
    const lockValue = `${Date.now()}-${Math.random()}`;
    const key = this.getKey(`lock:${lockKey}`);

    try {
      const result = await this.redis.set(key, lockValue, 'EX', ttlSeconds, 'NX');
      return result === 'OK' ? lockValue : null;
    } catch (error) {
      logger.error(`Lock acquisition error for ${lockKey}:`, error);
      return null;
    }
  }

  async releaseLock(lockKey: string, lockValue: string): Promise<boolean> {
    const key = this.getKey(`lock:${lockKey}`);
    
    // Lua 腳本確保原子性
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
      logger.error(`Lock release error for ${lockKey}:`, error);
      return false;
    }
  }

  // 批量操作
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const redisKeys = keys.map(key => this.getKey(key));
      const values = await this.redis.mget(...redisKeys);
      
      return values.map(value => {
        if (value === null) return null;
        try {
          return JSON.parse(value) as T;
        } catch {
          return null;
        }
      });
    } catch (error) {
      logger.error('Redis mget error:', error);
      return keys.map(() => null);
    }
  }

  async mset<T>(keyValuePairs: Array<{ key: string; value: T; ttl?: number }>): Promise<void> {
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
    } catch (error) {
      logger.error('Redis mset error:', error);
      throw error;
    }
  }
}

// Upstash Redis 適配器 - 針對 Vercel 和 Upstash 優化
class UpstashRedisCacheAdapter extends EventEmitter implements CacheAdapter {
  private redis: Redis;
  private keyPrefix: string;

  constructor(config: RedisConfig) {
    super();
    this.keyPrefix = config.keyPrefix || 'oscs:cache:';
    
    // 使用統一的 Redis 客戶端（支援 Upstash）
    this.redis = createRedisClient({
      url: process.env.REDIS_URL,
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db,
      tls: true, // Upstash 需要 TLS
    });
    
    // 設置監控
    this.setupMonitoring();
  }
  
  private metrics = {
    hits: 0,
    misses: 0,
    errors: 0,
    avgResponseTime: 0,
  };
  private responseTimes: number[] = [];
  
  private setupMonitoring(): void {
    // Upstash 不支持事件，但我們可以追蹤指標
  }
  
  private updateMetrics(responseTime: number, hit?: boolean): void {
    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > 100) {
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

  private getKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();
    try {
      const value = await this.redis.get(this.getKey(key));
      const responseTime = Date.now() - startTime;
      
      const hit = value !== null;
      this.updateMetrics(responseTime, hit);
      
      if (value === null) return null;
      
      return JSON.parse(value) as T;
    } catch (error) {
      this.metrics.errors++;
      logger.error(`Upstash Redis get error for key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      const redisKey = this.getKey(key);

      if (ttlSeconds) {
        await this.redis.setex(redisKey, ttlSeconds, serializedValue);
      } else {
        await this.redis.set(redisKey, serializedValue);
      }
    } catch (error) {
      logger.error(`Upstash Redis set error for key ${key}:`, error);
      throw error;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const result = await this.redis.del(this.getKey(key));
      return result > 0;
    } catch (error) {
      logger.error(`Upstash Redis delete error for key ${key}:`, error);
      return false;
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(this.getKey(key));
      return result === 1;
    } catch (error) {
      logger.error(`Upstash Redis exists error for key ${key}:`, error);
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      await this.redis.flushdb();
    } catch (error) {
      logger.error('Upstash Redis clear error:', error);
      throw error;
    }
  }

  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const searchPattern = this.getKey(pattern);
      const keys = await this.redis.keys(searchPattern);
      
      if (keys.length === 0) return 0;
      
      await this.redis.del(...keys);
      return keys.length;
    } catch (error) {
      logger.error(`Upstash Redis pattern invalidation error for ${pattern}:`, error);
      return 0;
    }
  }

  async getSize(): Promise<number> {
    try {
      return await this.redis.dbsize();
    } catch (error) {
      logger.error('Upstash Redis size error:', error);
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
      const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
      const memory = memoryMatch ? memoryMatch[1].trim() : 'Unknown';

      return {
        memory,
        connections: 1, // Upstash 為 serverless
        operations: await this.getSize(),
      };
    } catch (error) {
      logger.error('Upstash Redis stats error:', error);
      return {
        memory: 'Unknown',
        connections: 0,
        operations: 0,
      };
    }
  }

  async ping(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Upstash Redis ping error:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.redis.quit();
    } catch (error) {
      logger.error('Upstash Redis disconnect error:', error);
    }
  }

  async acquireLock(lockKey: string, ttlSeconds: number = 30): Promise<string | null> {
    const lockValue = `${Date.now()}-${Math.random()}`;
    const key = this.getKey(`lock:${lockKey}`);

    try {
      const result = await this.redis.set(key, lockValue, 'EX', ttlSeconds, 'NX');
      return result === 'OK' ? lockValue : null;
    } catch (error) {
      logger.error(`Upstash Redis lock acquire error for ${lockKey}:`, error);
      return null;
    }
  }

  async releaseLock(lockKey: string, lockValue: string): Promise<boolean> {
    const key = this.getKey(`lock:${lockKey}`);
    
    const luaScript = `
      if redis.call("GET", KEYS[1]) == ARGV[1] then
        return redis.call("DEL", KEYS[1])
      else
        return 0
      end
    `;

    try {
      const result = await this.redis.eval(luaScript, 1, key, lockValue);
      return result === 1;
    } catch (error) {
      logger.error(`Upstash Redis lock release error for ${lockKey}:`, error);
      return false;
    }
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const redisKeys = keys.map(key => this.getKey(key));
      const values = await this.redis.mget(...redisKeys);
      
      return values.map(value => {
        if (value === null) return null;
        try {
          return JSON.parse(value) as T;
        } catch {
          return null;
        }
      });
    } catch (error) {
      logger.error('Upstash Redis mget error:', error);
      return keys.map(() => null);
    }
  }

  async mset<T>(keyValuePairs: Array<{ key: string; value: T; ttl?: number }>): Promise<void> {
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
    } catch (error) {
      logger.error('Upstash Redis mset error:', error);
      throw error;
    }
  }
}

// 內存緩存適配器 - 用於開發環境回退
class MemoryCacheAdapter implements CacheAdapter {
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
    const expiry = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : undefined;
    this.cache.set(key, { value, expiry });
  }

  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  async has(key: string): Promise<boolean> {
    return this.cache.has(key);
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
    return this.cache.size;
  }

  async getStats(): Promise<{
    memory: string;
    connections: number;
    operations: number;
    hitRate?: number;
  }> {
    return {
      memory: `${(this.cache.size * 100 / 1024).toFixed(1)}KB`,
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

// 內存緩存包裝器：添加故障轉移功能
class FailoverCacheAdapter extends EventEmitter implements CacheAdapter {
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
      logger.warn('主緩存失敗，切換到備用緩存');
      this.emit('failover', { from: 'primary', to: 'fallback' });
    }
  }
  
  private handlePrimaryRecovery() {
    if (!this.isPrimaryHealthy) {
      this.isPrimaryHealthy = true;
      this.retryCount = 0;
      logger.info('主緩存恢復，切換回主緩存');
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
    await Promise.all([
      this.primary.disconnect(),
      this.fallback.disconnect(),
    ]);
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
    return Promise.all(keys.map(key => this.get<T>(key)));
  }
  
  async mset<T>(keyValuePairs: Array<{ key: string; value: T; ttl?: number }>): Promise<void> {
    if (this.activeAdapter.mset) {
      return this.activeAdapter.mset(keyValuePairs);
    }
    await Promise.all(
      keyValuePairs.map(({ key, value, ttl }) => 
        this.set(key, value, ttl)
      )
    );
  }
}

// 工廠函數：創建緩存適配器（優雅降級，支援 Upstash）
export function createRedisCacheAdapter(config?: Partial<RedisConfig>): CacheAdapter {
  // 在開發環境中，如果沒有明確啟用 Redis，則使用內存緩存
  if (process.env.NODE_ENV === 'development' && !process.env.ENABLE_REDIS && !process.env.REDIS_URL) {
    logger.info('Using memory cache adapter for development (Redis disabled)');
    return new MemoryCacheAdapter();
  }

  // 如果有 REDIS_URL（Upstash/Vercel 模式），優先使用
  if (process.env.REDIS_URL) {
    try {
      // 從 REDIS_URL 解析配置
      const url = new URL(process.env.REDIS_URL);
      const upstashConfig: RedisConfig = {
        host: url.hostname,
        port: parseInt(url.port) || 6379,
        password: url.password || undefined,
        db: parseInt(url.pathname.slice(1)) || 0,
        keyPrefix: process.env.REDIS_KEY_PREFIX || 'oscs:cache:',
        connectTimeout: 10000,
        maxRetriesPerRequest: 3,
      };

      logger.info('Using Upstash Redis configuration from REDIS_URL');
      return new UpstashRedisCacheAdapter(upstashConfig);
    } catch (error) {
      logger.error('Failed to parse REDIS_URL, falling back to default config:', error);
    }
  }

  const defaultConfig: RedisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'oscs:cache:',
    connectTimeout: 5000,
    maxRetriesPerRequest: 3,
  };

  // 如果配置了 Redis Cluster
  if (process.env.REDIS_CLUSTER_NODES) {
    const nodes = process.env.REDIS_CLUSTER_NODES.split(',').map(node => {
      const [host, port] = node.split(':');
      return { host, port: parseInt(port) };
    });
    
    defaultConfig.cluster = {
      nodes,
      options: {
        password: process.env.REDIS_PASSWORD,
      }
    };
  }

  try {
    const redisAdapter = new RedisCacheAdapter({ ...defaultConfig, ...config });
    
    // 如果啟用故障轉移，創建 FailoverCacheAdapter
    if (process.env.ENABLE_CACHE_FAILOVER === 'true') {
      const memoryAdapter = new MemoryCacheAdapter();
      logger.info('啟用緩存故障轉移功能');
      return new FailoverCacheAdapter(redisAdapter, memoryAdapter);
    }
    
    return redisAdapter;
  } catch (error) {
    logger.warn('Failed to create Redis adapter, falling back to memory cache:', error);
    return new MemoryCacheAdapter();
  }
}

// 全局緩存實例（支持優雅降級）
export const redisCacheAdapter = createRedisCacheAdapter(); 