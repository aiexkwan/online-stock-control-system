// Base cache adapter with shared functionality
import { EventEmitter } from 'events';
import { cacheLogger } from '../logger';

export interface CacheAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  has(key: string): Promise<boolean>;
  clear(): Promise<void>;
  invalidatePattern(pattern: string): Promise<number>;
  getSize(): Promise<number>;
  getStats(): Promise<CacheStats>;
  ping(): Promise<boolean>;
  disconnect(): Promise<void>;
  acquireLock?(lockKey: string, ttlSeconds?: number): Promise<string | null>;
  releaseLock?(lockKey: string, lockValue: string): Promise<boolean>;
  mget?<T>(keys: string[]): Promise<(T | null)[]>;
  mset?<T>(keyValuePairs: Array<{ key: string; value: T; ttl?: number }>): Promise<void>;
}

export interface CacheStats {
  memory: string;
  connections: number;
  operations: number;
  hitRate?: number;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  errors: number;
  avgResponseTime: number;
  lastError: string | null;
  lastErrorTime: Date | null;
}

export abstract class BaseCacheAdapter extends EventEmitter implements CacheAdapter {
  protected keyPrefix: string;
  protected metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    errors: 0,
    avgResponseTime: 0,
    lastError: null,
    lastErrorTime: null,
  };
  protected responseTimes: number[] = [];

  constructor(keyPrefix: string = 'oscs:cache:') {
    super();
    this.keyPrefix = keyPrefix;
  }

  protected getKey(key: string): string {
    return `${this.keyPrefix}${key}`;
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

  protected handleError(operation: string, error: unknown): void {
    this.metrics.errors++;
    // Strategy 4: unknown + type narrowing - 安全類型轉換錯誤訊息
    this.metrics.lastError = error instanceof Error ? error.message : String(error);
    this.metrics.lastErrorTime = new Date();

    cacheLogger.error(
      {
        adapter: 'BaseCache',
        operation,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        metrics: this.metrics,
      },
      `Cache ${operation} error`
    );
  }

  getMetrics(): CacheMetrics & { hitRate: number; totalRequests: number } {
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

  resetMetrics(): void {
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

  // Abstract methods to be implemented by subclasses
  abstract get<T>(key: string): Promise<T | null>;
  abstract set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  abstract delete(key: string): Promise<boolean>;
  abstract has(key: string): Promise<boolean>;
  abstract clear(): Promise<void>;
  abstract invalidatePattern(pattern: string): Promise<number>;
  abstract getSize(): Promise<number>;
  abstract getStats(): Promise<CacheStats>;
  abstract ping(): Promise<boolean>;
  abstract disconnect(): Promise<void>;
}
