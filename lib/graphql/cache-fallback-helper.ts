import { logger } from '../logger';
import { redisCacheAdapter } from './redis-cache-adapter';

/**
 * 🧠 通用緩存 Fallback 工具函數
 * 實施建議方案2: cache miss 就 fetch 並自動緩存
 */

export interface CacheFallbackOptions {
  ttlSeconds?: number;
  forceRefresh?: boolean;
  silent?: boolean; // 靜默模式，不記錄 cache miss 日誌
}

/**
 * 智能緩存獲取：cache miss 時自動 fetch 並緩存
 */
export async function getCachedWithFallback<T>(
  key: string,
  fallbackFn: () => Promise<T>,
  options: CacheFallbackOptions = {}
): Promise<T | null> {
  const { ttlSeconds = 300, forceRefresh = false, silent = false } = options;

  try {
    // 如果不是強制刷新，先嘗試從緩存獲取
    if (!forceRefresh) {
      const cached = await redisCacheAdapter.get<T>(key);
      if (cached !== null) {
        if (!silent) {
          logger.debug(`Cache hit for key: ${key}`);
        }
        return cached;
      }
    }

    // 🌟 方案1: Cache miss 或強制刷新 - 正常行為，不記錄錯誤
    if (!silent) {
      const reason = forceRefresh ? 'forced refresh' : 'cache miss';
      logger.info(`Fetching fresh data for key ${key} (${reason})`);
    }

    // 🧠 方案2: 執行 fallback 函數獲取新數據
    const freshData = await fallbackFn();

    if (freshData !== null && freshData !== undefined) {
      // 自動緩存新數據
      await redisCacheAdapter.set(key, freshData, ttlSeconds);
      if (!silent) {
        logger.info(`Fresh data cached for key: ${key} (TTL: ${ttlSeconds}s)`);
      }
      return freshData;
    }

    if (!silent) {
      logger.warn(`Fallback function returned null/undefined for key: ${key}`);
    }
    return null;
  } catch (error) {
    // 只記錄真正的系統錯誤
    logger.error(`Cache fallback error for key ${key}:`, error);
    return null;
  }
}

/**
 * 批量緩存 fallback
 */
export async function batchGetCachedWithFallback<T>(
  keyFallbackPairs: Array<{
    key: string;
    fallback: () => Promise<T>;
    ttlSeconds?: number;
  }>,
  options: { silent?: boolean; concurrency?: number } = {}
): Promise<Array<{ key: string; data: T | null }>> {
  const { silent = false, concurrency = 5 } = options;

  const results: Array<{ key: string; data: T | null }> = [];

  // 分批處理以避免過載
  for (let i = 0; i < keyFallbackPairs.length; i += concurrency) {
    const batch = keyFallbackPairs.slice(i, i + concurrency);

    const batchPromises = batch.map(async ({ key, fallback, ttlSeconds }) => {
      const data = await getCachedWithFallback(key, fallback, { ttlSeconds, silent });
      return { key, data };
    });

    const batchResults = await Promise.allSettled(batchPromises);

    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        const key = batch[index].key;
        logger.error(`Batch cache fallback failed for key ${key}:`, result.reason);
        results.push({ key, data: null });
      }
    });
  }

  return results;
}

/**
 * 預熱多個緩存鍵
 */
export async function warmupCacheKeys(
  warmupSpecs: Array<{
    key: string;
    dataSource: () => Promise<any>;
    ttlSeconds: number;
    priority?: 'high' | 'medium' | 'low';
  }>
): Promise<void> {
  // 按優先級排序
  const sorted = warmupSpecs.sort((a, b) => {
    const priorities = { high: 3, medium: 2, low: 1 };
    return (priorities[b.priority || 'medium'] || 2) - (priorities[a.priority || 'medium'] || 2);
  });

  logger.info(`Starting cache warmup for ${sorted.length} keys`);

  for (const spec of sorted) {
    try {
      await getCachedWithFallback(spec.key, spec.dataSource, {
        ttlSeconds: spec.ttlSeconds,
        silent: true,
      });
    } catch (error) {
      logger.error(`Failed to warmup cache key ${spec.key}:`, error);
    }
  }

  logger.info(`Cache warmup completed for ${sorted.length} keys`);
}

/**
 * 條件緩存刷新 - 只在數據過期或滿足條件時刷新
 */
export async function conditionalCacheRefresh<T>(
  key: string,
  condition: () => Promise<boolean>,
  fallbackFn: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T | null> {
  try {
    // 檢查條件是否滿足
    const shouldRefresh = await condition();

    if (shouldRefresh) {
      logger.info(`Condition met, refreshing cache for key: ${key}`);
      return await getCachedWithFallback(key, fallbackFn, {
        ttlSeconds,
        forceRefresh: true,
        silent: false,
      });
    }

    // 條件不滿足，嘗試從緩存獲取
    return await getCachedWithFallback(key, fallbackFn, { ttlSeconds });
  } catch (error) {
    logger.error(`Conditional cache refresh error for key ${key}:`, error);
    return null;
  }
}
