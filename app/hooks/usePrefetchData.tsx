'use client';

import { useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/app/utils/supabase/client';

interface PrefetchOptions {
  enabled?: boolean;
  tables?: string[];
  queries?: Array<{
    table: string;
    select: string;
    filter?: Record<string, unknown>;
    limit?: number;
  }>;
  refreshInterval?: number;
}

/**
 * Data prefetching hook
 * 數據預取 Hook
 *
 * @deprecated This hook is deprecated. Please use Server Actions with proper caching strategies instead.
 * Consider using React Query/SWR for client-side caching with Server Actions.
 *
 * @example
 * ```typescript
 * // OLD (deprecated)
 * const { prefetchData, getPrefetchedData } = usePrefetchData(options);
 *
 * // NEW (recommended) - Use Server Actions with caching
 * import { unstable_cache } from 'next/cache';
 * import { getDataFromTable } from '@/app/actions/dataActions';
 *
 * const cachedGetData = unstable_cache(getDataFromTable, ['data-key'], {
 *   revalidate: 300 // 5 minutes
 * });
 * ```
 */
export const usePrefetchData = (options: PrefetchOptions = {}) => {
  const { enabled = true, tables = [], queries = [], refreshInterval = 0 } = options;

  const supabase = createClient();
  const prefetchedData = useRef<Map<string, unknown>>(new Map());
  const refreshTimer = useRef<NodeJS.Timeout>();

  // 預取資料
  const prefetchData = useCallback(async () => {
    if (!enabled) return;

    const promises = queries.map(async query => {
      try {
        // @types-migration:todo(phase3) [P2] 使用 Supabase 客戶端類型替代 any - Target: 2025-08 - Owner: @frontend-team
        const queryBuilder = supabase.from(query.table).select(query.select);

        // 應用過濾條件
        if (query.filter) {
          Object.entries(query.filter).forEach(([key, value]) => {
            // @types-migration:todo(phase3) [P2] 改進 filter 類型定義以避免 unknown - Target: 2025-08 - Owner: @frontend-team
            queryBuilder.eq(key, value as Parameters<typeof queryBuilder.eq>[1]);
          });
        }

        // 應用限制
        if (query.limit) {
          queryBuilder.limit(query.limit);
        }

        const { data, error } = await queryBuilder;

        if (!error && data) {
          const cacheKey = `${query.table}-${JSON.stringify(query.filter || {})}`;
          prefetchedData.current.set(cacheKey, data);
          (process.env.NODE_ENV as string) !== 'production' &&
            (process.env.NODE_ENV as string) !== 'production' &&
            console.log(`[Prefetch] 預取 ${query.table} 成功，${data.length} 筆資料`);
        }
      } catch (error) {
        console.error(`[Prefetch] 預取 ${query.table} 失敗:`, error);
      }
    });

    await Promise.all(promises);
  }, [enabled, queries, supabase]);

  // 獲取預取的資料
  const getPrefetchedData = useCallback((table: string, filter?: Record<string, unknown>) => {
    const cacheKey = `${table}-${JSON.stringify(filter || {})}`;
    return prefetchedData.current.get(cacheKey);
  }, []);

  // 初始化預取
  useEffect(() => {
    if (enabled) {
      prefetchData();

      // 設置定期刷新
      if (refreshInterval > 0) {
        refreshTimer.current = setInterval(() => {
          prefetchData();
        }, refreshInterval);
      }
    }

    return () => {
      if (refreshTimer.current) {
        clearInterval(refreshTimer.current);
      }
    };
  }, [enabled, prefetchData, refreshInterval]);

  return {
    prefetchData,
    getPrefetchedData,
    clearPrefetchedData: () => prefetchedData.current.clear(),
  };
};
