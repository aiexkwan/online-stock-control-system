/**
 * Cache Factory - 智能緩存適配器工廠
 * Redis 移除 Phase 2.1 - 配置自適應切換
 * 專家設計：支持 Redis → Memory 平滑遷移
 */

import { CacheAdapter } from './base-cache-adapter';
// import { RedisCacheAdapter } from './redis-cache-adapter'; // Removed - migrating to Apollo Cache
import { MemoryCacheAdapter } from './memory-cache-adapter';
import { ApolloCacheAdapter } from './apollo-cache-adapter';
import { cacheLogger } from '../logger';

export type CacheType = 'redis' | 'memory' | 'apollo' | 'auto';

export interface CacheDecisionFactors {
  hasRedisUrl: boolean;
  isProduction: boolean;
  isVercel: boolean;
  expectedUsers: number;
  maxConcurrent: number;
  needsDistributedLock: boolean;
  needsPubSub: boolean;
  needsPersistence: boolean;
}

export interface CacheConfig {
  type: CacheType;
  redis?: {
    url?: string;
    host?: string;
    port?: number;
    password?: string;
  };
  memory?: {
    maxSize?: number;
    ttl?: number;
  };
}

/**
 * 緩存工廠類 - 智能選擇緩存實現
 */
class CacheFactory {
  private static instance: CacheAdapter | null = null;
  private static config: CacheConfig | null = null;

  /**
   * 創建緩存適配器實例
   */
  static createCacheAdapter(config?: CacheConfig): CacheAdapter {
    const finalConfig = config || this.getDefaultConfig();
    this.config = finalConfig;

    const cacheType = this.determineCacheType(finalConfig);

    switch (cacheType) {
      case 'apollo':
        return this.createApolloCache(finalConfig.memory);
      case 'memory':
        return this.createMemoryCache(finalConfig.memory);
      default:
        // Redis is deprecated, fallback to Apollo
        return this.createApolloCache(finalConfig.memory);
    }
  }

  /**
   * 獲取緩存適配器單例
   */
  static getCacheAdapter(): CacheAdapter {
    if (!this.instance) {
      this.instance = this.createCacheAdapter();
    }
    return this.instance;
  }

  /**
   * 重置緩存實例 (用於測試或配置變更)
   */
  static resetInstance(): void {
    if (this.instance) {
      this.instance.disconnect();
      this.instance = null;
      this.config = null;
    }
  }

  /**
   * 智能判斷緩存類型
   * Phase 3: Migration to Apollo Cache for serverless compatibility
   */
  private static determineCacheType(config: CacheConfig): CacheType {
    // Phase 3: Redis deprecated - migrate to Apollo
    if (config.type === 'redis') {
      cacheLogger.info(
        {
          reason: 'redis_deprecated',
          type: 'apollo',
          originalRequest: 'redis',
          migration: 'serverless_compatibility',
        },
        'Redis deprecated - using Apollo Cache for serverless compatibility'
      );
      return 'apollo';
    }

    // Explicit Apollo type
    if (config.type === 'apollo') {
      cacheLogger.info(
        { reason: 'explicit_config', type: 'apollo' },
        'Using Apollo cache - explicit configuration'
      );
      return 'apollo';
    }

    // Explicit memory type
    if (config.type === 'memory') {
      cacheLogger.info(
        { reason: 'explicit_config', type: 'memory' },
        'Using memory cache - explicit configuration'
      );
      return 'memory';
    }

    // Auto mode - default to Apollo for serverless compatibility
    if (config.type === 'auto') {
      cacheLogger.info(
        {
          reason: 'auto_apollo',
          type: 'apollo',
          benefits: ['serverless_compatible', 'persistent_storage', 'reactive_updates', 'graphql_integration'],
          phase: '3_apollo_migration',
        },
        'Auto-selected Apollo cache - optimal for serverless deployment'
      );
      return 'apollo';
    }

    // Default fallback to Apollo
    cacheLogger.info(
      {
        configType: config.type,
        fallback: 'apollo',
        reason: 'default_apollo',
      },
      'Using Apollo cache - default strategy for serverless'
    );
    return 'apollo';
  }

  /**
   * 判斷是否應該使用內存緩存
   * 專家邏輯：小規模系統優先使用內存緩存
   */
  private static shouldUseMemoryCache(): boolean {
    // 專家決策標準
    const factors = {
      // 環境檢測
      hasRedisUrl: !!process.env.REDIS_URL,
      isProduction: process.env.NODE_ENV === 'production',
      isVercel: !!process.env.VERCEL,

      // 系統規模檢測 (來自專家分析)
      expectedUsers: 40, // 最大預期用戶數
      maxConcurrent: 5, // 最大併發用戶數

      // 性能需求
      needsDistributedLock: false, // 當前系統不需要分佈式鎖
      needsPubSub: false, // 當前系統不需要 pub/sub
      needsPersistence: false, // 緩存持久化非必需
    };

    // 專家決策邏輯
    const memoryScore = this.calculateMemoryCacheScore(factors);
    const redisScore = this.calculateRedisCacheScore(factors);

    cacheLogger.debug(
      {
        factors,
        memoryScore,
        redisScore,
        decision: memoryScore > redisScore ? 'memory' : 'redis',
      },
      'Cache type decision calculation'
    );

    return memoryScore > redisScore;
  }

  /**
   * 計算內存緩存得分
   */
  private static calculateMemoryCacheScore(factors: CacheDecisionFactors): number {
    let score = 0;

    // 小規模系統優勢 (專家共識)
    if (factors.expectedUsers <= 50) score += 30;
    if (factors.maxConcurrent <= 10) score += 25;

    // 簡化部署優勢 (KISS 原則)
    score += 20; // 無外部依賴
    score += 15; // 部署簡單

    // 性能優勢
    score += 10; // 低延遲 (1-3ms vs 10-50ms)

    return score;
  }

  /**
   * 計算 Redis 緩存得分
   */
  private static calculateRedisCacheScore(factors: CacheDecisionFactors): number {
    let score = 0;

    // 大規模系統優勢
    if (factors.expectedUsers > 100) score += 30;
    if (factors.maxConcurrent > 20) score += 25;

    // 高級功能需求
    if (factors.needsDistributedLock) score += 20;
    if (factors.needsPubSub) score += 15;
    if (factors.needsPersistence) score += 15;

    // 現有配置
    if (factors.hasRedisUrl) score += 10;

    return score;
  }

  /**
   * 創建 Apollo 緩存適配器
   */
  private static createApolloCache(config?: CacheConfig['memory']): CacheAdapter {
    const apolloConfig = {
      defaultTTL: config?.ttl || 300, // 5 minutes default
      persist: true, // Enable localStorage persistence
    };

    return new ApolloCacheAdapter('oscs:cache', apolloConfig);
  }

  /**
   * 創建內存緩存適配器
   */
  private static createMemoryCache(config?: CacheConfig['memory']): CacheAdapter {
    const memoryConfig = {
      maxSize: config?.maxSize || 200, // 專家建議：200項目
      ttl: config?.ttl || 300, // 專家建議：5分鐘TTL
    };

    return new MemoryCacheAdapter('oscs:cache:', memoryConfig.maxSize, memoryConfig.ttl);
  }

  /**
   * 創建 Redis 緩存適配器
   * Phase 2.1: 暫時禁用 Redis，直接使用 MemoryCache
   */
  private static createRedisCache(config?: CacheConfig['redis']): CacheAdapter {
    // Phase 2.1 緊急修復：暫時禁用 Redis 創建避免 DNS 模組問題
    cacheLogger.info(
      {
        reason: 'phase_2_1_redis_disabled',
        fallback: 'memory',
        issue: 'dns_module_client_build_error',
        phase: '2.1_redis_removal',
      },
      'Redis cache disabled in Phase 2.1 - using memory cache (DNS module fix)'
    );

    // 直接降級到內存緩存
    return this.createMemoryCache({
      maxSize: config ? 200 : undefined,
      ttl: config ? 300 : undefined,
    });

    // TODO: Phase 2.2 - 重新啟用 Redis 支援（使用動態導入）
    /*
    try {
      return new RedisCacheAdapter('oscs:cache:');
    } catch (error) {
      cacheLogger.warn(
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          fallback: 'memory',
        },
        'Redis cache creation failed, falling back to memory cache'
      );

      return this.createMemoryCache(config as unknown);
    }
    */
  }

  /**
   * 獲取默認配置
   */
  private static getDefaultConfig(): CacheConfig {
    // Phase 2.1 默認策略：環境變數控制，默認自動選擇
    const cacheType = (process.env.CACHE_TYPE as CacheType) || 'auto';

    return {
      type: cacheType,
      redis: {
        url: process.env.REDIS_URL,
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      },
      memory: {
        maxSize: parseInt(process.env.CACHE_MEMORY_MAX_SIZE || '200'),
        ttl: parseInt(process.env.CACHE_MEMORY_TTL || '300'),
      },
    };
  }

  /**
   * 獲取當前配置信息
   */
  static getCurrentConfig(): CacheConfig | null {
    return this.config;
  }

  /**
   * 獲取緩存類型
   * Phase 2.1: 簡化類型檢測，只支援 MemoryCache
   */
  static getCurrentCacheType(): string {
    if (!this.instance) return 'none';

    if (this.instance instanceof MemoryCacheAdapter) {
      return 'memory';
    }
    // Phase 2.1: Redis 檢查暫時移除
    // else if (this.instance instanceof RedisCacheAdapter) {
    //   return 'redis';
    // }

    // Phase 2.1: 所有實例都應該是 MemoryCache
    return 'memory_fallback';
  }
}

// 便捷導出函數
export function getCacheAdapter(): CacheAdapter {
  return CacheFactory.getCacheAdapter();
}

export function createCacheAdapter(config?: CacheConfig): CacheAdapter {
  return CacheFactory.createCacheAdapter(config);
}

export function resetCacheInstance(): void {
  CacheFactory.resetInstance();
}

export function getCurrentCacheType(): string {
  return CacheFactory.getCurrentCacheType();
}

export function getCurrentCacheConfig(): CacheConfig | null {
  return CacheFactory.getCurrentConfig();
}

// 導出工廠類
export { CacheFactory };
