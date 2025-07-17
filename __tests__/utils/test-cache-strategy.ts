/**
 * 測試結果緩存策略
 * 智能緩存測試數據和結果，提升測試執行速度
 */

import { createHash } from 'crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import * as path from 'path';

export interface CacheConfig {
  enabled: boolean;
  directory: string;
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum cache size in MB
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  hash: string;
  version: string;
}

export interface CacheStats {
  hits: number;
  misses: number;
  writes: number;
  errors: number;
  size: number; // Current cache size in bytes
}

export class TestCacheStrategy {
  private static instance: TestCacheStrategy;
  private config: CacheConfig;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    writes: 0,
    errors: 0,
    size: 0,
  };

  protected constructor(config: CacheConfig) {
    this.config = config;
    this.ensureCacheDirectory();
  }

  static getInstance(config?: Partial<CacheConfig>): TestCacheStrategy {
    if (!TestCacheStrategy.instance) {
      const defaultConfig: CacheConfig = {
        enabled: process.env.JEST_CACHE_ENABLED !== 'false',
        directory: path.join(process.cwd(), '.jest-cache', 'test-data'),
        ttl: 24 * 60 * 60 * 1000, // 24 hours
        maxSize: 100, // 100 MB
      };
      TestCacheStrategy.instance = new TestCacheStrategy({
        ...defaultConfig,
        ...config,
      });
    }
    return TestCacheStrategy.instance;
  }

  private ensureCacheDirectory(): void {
    if (!existsSync(this.config.directory)) {
      mkdirSync(this.config.directory, { recursive: true });
    }
  }

  private generateCacheKey(key: string, params?: any): string {
    const input = JSON.stringify({ key, params, version: '1.0' });
    return createHash('md5').update(input).digest('hex');
  }

  private getCacheFilePath(cacheKey: string): string {
    return path.join(this.config.directory, `${cacheKey}.json`);
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > this.config.ttl;
  }

  async get<T>(key: string, params?: any): Promise<T | null> {
    if (!this.config.enabled) return null;

    try {
      const cacheKey = this.generateCacheKey(key, params);
      const filePath = this.getCacheFilePath(cacheKey);

      if (!existsSync(filePath)) {
        this.stats.misses++;
        return null;
      }

      const content = readFileSync(filePath, 'utf-8');
      const entry: CacheEntry<T> = JSON.parse(content);

      if (this.isExpired(entry)) {
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;
      return entry.data;
    } catch (error) {
      this.stats.errors++;
      console.warn('Cache read error:', error);
      return null;
    }
  }

  async set<T>(key: string, data: T, params?: any): Promise<void> {
    if (!this.config.enabled) return;

    try {
      const cacheKey = this.generateCacheKey(key, params);
      const filePath = this.getCacheFilePath(cacheKey);

      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        hash: cacheKey,
        version: '1.0',
      };

      writeFileSync(filePath, JSON.stringify(entry, null, 2));
      this.stats.writes++;
    } catch (error) {
      this.stats.errors++;
      console.warn('Cache write error:', error);
    }
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    params?: any
  ): Promise<T> {
    const cached = await this.get<T>(key, params);
    if (cached !== null) {
      return cached;
    }

    const data = await factory();
    await this.set(key, data, params);
    return data;
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      writes: 0,
      errors: 0,
      size: 0,
    };
  }

  clear(): void {
    // Implementation for clearing cache would go here
    this.resetStats();
  }
}

// 特定緩存類型
export class SupabaseRpcCache extends TestCacheStrategy {
  constructor(config?: Partial<CacheConfig>) {
    const defaultConfig: CacheConfig = {
      enabled: process.env.JEST_CACHE_ENABLED !== 'false',
      directory: path.join(process.cwd(), '.jest-cache', 'rpc-data'),
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      maxSize: 100, // 100 MB
    };
    super({ ...defaultConfig, ...config });
  }

  async cacheRpcCall(
    functionName: string,
    params: any,
    result: any
  ): Promise<void> {
    await this.set(`rpc:${functionName}`, result, params);
  }

  async getCachedRpcCall(
    functionName: string,
    params: any
  ): Promise<any | null> {
    return this.get(`rpc:${functionName}`, params);
  }
}

export class WidgetDataCache extends TestCacheStrategy {
  constructor(config?: Partial<CacheConfig>) {
    const defaultConfig: CacheConfig = {
      enabled: process.env.JEST_CACHE_ENABLED !== 'false',
      directory: path.join(process.cwd(), '.jest-cache', 'widget-data'),
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      maxSize: 100, // 100 MB
    };
    super({ ...defaultConfig, ...config });
  }

  async cacheWidgetData(
    widgetId: string,
    timeframe: string,
    data: any
  ): Promise<void> {
    await this.set(`widget:${widgetId}`, data, { timeframe });
  }

  async getCachedWidgetData(
    widgetId: string,
    timeframe: string
  ): Promise<any | null> {
    return this.get(`widget:${widgetId}`, { timeframe });
  }
}

export class FileSystemCache extends TestCacheStrategy {
  constructor(config?: Partial<CacheConfig>) {
    const defaultConfig: CacheConfig = {
      enabled: process.env.JEST_CACHE_ENABLED !== 'false',
      directory: path.join(process.cwd(), '.jest-cache', 'file-data'),
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      maxSize: 100, // 100 MB
    };
    super({ ...defaultConfig, ...config });
  }

  async cacheFileRead(filePath: string, content: string): Promise<void> {
    await this.set(`file:${filePath}`, content);
  }

  async getCachedFileRead(filePath: string): Promise<string | null> {
    return this.get(`file:${filePath}`);
  }
}

// 導出便利函數
export function createTestCache(type: 'rpc' | 'widget' | 'file' | 'default' = 'default') {
  switch (type) {
    case 'rpc':
      return new SupabaseRpcCache();
    case 'widget':
      return new WidgetDataCache();
    case 'file':
      return new FileSystemCache();
    default:
      return TestCacheStrategy.getInstance();
  }
}

// Jest helper 函數
export function withCache<T extends (...args: any[]) => any>(
  fn: T,
  cacheKey: string,
  cacheType: 'rpc' | 'widget' | 'file' | 'default' = 'default'
): T {
  const cache = createTestCache(cacheType);
  
  return (async (...args: any[]) => {
    const cached = await cache.get(cacheKey, args);
    if (cached !== null) {
      return cached;
    }

    const result = await fn(...args);
    await cache.set(cacheKey, result, args);
    return result;
  }) as T;
}

// 緩存裝飾器
export function CacheResult(
  key: string,
  ttl?: number,
  cacheType: 'rpc' | 'widget' | 'file' | 'default' = 'default'
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const cache = createTestCache(cacheType);
    
    descriptor.value = async function (...args: any[]) {
      const cached = await cache.get(key, args);
      if (cached !== null) {
        return cached;
      }

      const result = await method.apply(this, args);
      await cache.set(key, result, args);
      return result;
    };
  };
}

// 緩存統計報告
export function generateCacheReport(): string {
  const cache = TestCacheStrategy.getInstance();
  const stats = cache.getStats();
  const hitRate = stats.hits / (stats.hits + stats.misses) * 100;

  return `
Cache Performance Report:
========================
Hits: ${stats.hits}
Misses: ${stats.misses}
Hit Rate: ${hitRate.toFixed(2)}%
Writes: ${stats.writes}
Errors: ${stats.errors}
Cache Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB
  `.trim();
}