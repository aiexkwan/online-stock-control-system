import { useCallback, useRef, useEffect } from 'react';
import { createClient } from '@/app/utils/supabase/client';

interface PalletInfo {
  plt_num: string;
  product_code: string;
  product_qty: number;
  plt_remark?: string | null;
  current_plt_loc?: string | null;
  series?: string;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface PalletCacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache size
  preloadPatterns?: string[]; // Patterns to preload
  enableBackgroundRefresh?: boolean;
}

export const usePalletCache = (options: PalletCacheOptions = {}) => {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes default
    maxSize = 100,
    preloadPatterns = [],
    enableBackgroundRefresh = true
  } = options;

  const cache = useRef<Map<string, CacheEntry<PalletInfo>>>(new Map());
  const supabase = createClient();
  const refreshTimer = useRef<NodeJS.Timeout>();

  // 從快取中獲取資料
  const getFromCache = useCallback((key: string): PalletInfo | null => {
    const entry = cache.current.get(key);
    if (!entry) return null;

    // 檢查是否過期
    if (Date.now() > entry.expiresAt) {
      cache.current.delete(key);
      return null;
    }

    return entry.data;
  }, []);

  // 設置快取
  const setCache = useCallback((key: string, data: PalletInfo) => {
    // 如果快取已滿，移除最舊的項目
    if (cache.current.size >= maxSize) {
      const oldestKey = Array.from(cache.current.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
      cache.current.delete(oldestKey);
    }

    cache.current.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl
    });
  }, [ttl, maxSize]);

  // 批量預加載托盤資料
  const preloadPallets = useCallback(async (patterns: string[]) => {
    try {
      const promises = patterns.map(async (pattern) => {
        // 預加載最近使用的托盤（基於歷史記錄）
        const { data: recentPallets } = await supabase
          .from('record_history')
          .select('plt_num')
          .like('plt_num', `${pattern}%`)
          .order('time', { ascending: false })
          .limit(10);

        if (recentPallets && recentPallets.length > 0) {
          const uniquePalletNums = [...new Set(recentPallets.map(p => p.plt_num))];
          
          // 批量查詢托盤資訊
          const { data: palletInfos } = await supabase
            .from('record_palletinfo')
            .select('plt_num, product_code, product_qty, plt_remark, series')
            .in('plt_num', uniquePalletNums);

          if (palletInfos) {
            // 獲取每個托盤的最新位置
            for (const pallet of palletInfos) {
              const { data: locationData } = await supabase
                .from('record_history')
                .select('loc')
                .eq('plt_num', pallet.plt_num)
                .order('time', { ascending: false })
                .limit(1);

              const palletWithLocation: PalletInfo = {
                ...pallet,
                current_plt_loc: locationData?.[0]?.loc || 'Await'
              };

              // 快取托盤號和系列號
              setCache(pallet.plt_num, palletWithLocation);
              if (pallet.series) {
                setCache(pallet.series, palletWithLocation);
              }
            }
          }
        }
      });

      await Promise.all(promises);
      console.log('[PalletCache] 預加載完成，快取大小:', cache.current.size);
    } catch (error) {
      console.error('[PalletCache] 預加載失敗:', error);
    }
  }, [supabase, setCache]);

  // 查詢托盤資訊（帶快取）
  const searchPalletWithCache = useCallback(async (
    searchType: 'series' | 'pallet_num',
    searchValue: string,
    useOptimizedQuery: boolean = false
  ): Promise<PalletInfo | null> => {
    const cacheKey = searchValue.trim();
    
    // 先檢查快取
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      console.log('[PalletCache] 快取命中:', cacheKey);
      return cachedData;
    }

    // 如果快取未命中，從資料庫查詢
    try {
      let palletData;

      if (searchType === 'series') {
        const { data } = await supabase
          .from('record_palletinfo')
          .select('plt_num, product_code, product_qty, plt_remark, series')
          .eq('series', cacheKey)
          .single();
        palletData = data;
      } else {
        const { data } = await supabase
          .from('record_palletinfo')
          .select('plt_num, product_code, product_qty, plt_remark, series')
          .eq('plt_num', cacheKey)
          .single();
        palletData = data;
      }

      if (!palletData) return null;

      // 獲取最新位置
      const { data: historyData } = await supabase
        .from('record_history')
        .select('loc')
        .eq('plt_num', palletData.plt_num)
        .order('time', { ascending: false })
        .limit(1);

      const palletInfo: PalletInfo = {
        ...palletData,
        current_plt_loc: historyData?.[0]?.loc || 'Await'
      };

      // 更新快取
      setCache(palletInfo.plt_num, palletInfo);
      if (palletInfo.series) {
        setCache(palletInfo.series, palletInfo);
      }

      return palletInfo;
    } catch (error) {
      console.error('[PalletCache] 查詢失敗:', error);
      return null;
    }
  }, [supabase, getFromCache, setCache]);

  // 清理過期快取
  const cleanupExpiredCache = useCallback(() => {
    const now = Date.now();
    for (const [key, entry] of cache.current.entries()) {
      if (now > entry.expiresAt) {
        cache.current.delete(key);
      }
    }
  }, []);

  // 背景刷新快取
  const refreshCache = useCallback(async () => {
    const keysToRefresh: string[] = [];
    const now = Date.now();

    // 找出即將過期的項目（在 TTL 的 20% 時間內）
    for (const [key, entry] of cache.current.entries()) {
      const timeUntilExpiry = entry.expiresAt - now;
      if (timeUntilExpiry < ttl * 0.2 && timeUntilExpiry > 0) {
        keysToRefresh.push(key);
      }
    }

    // 批量刷新
    if (keysToRefresh.length > 0) {
      console.log('[PalletCache] 背景刷新:', keysToRefresh.length, '個項目');
      
      const { data: palletInfos } = await supabase
        .from('record_palletinfo')
        .select('plt_num, product_code, product_qty, plt_remark, series')
        .or(keysToRefresh.map(k => `plt_num.eq.${k},series.eq.${k}`).join(','));

      if (palletInfos) {
        for (const pallet of palletInfos) {
          const { data: locationData } = await supabase
            .from('record_history')
            .select('loc')
            .eq('plt_num', pallet.plt_num)
            .order('time', { ascending: false })
            .limit(1);

          const palletWithLocation: PalletInfo = {
            ...pallet,
            current_plt_loc: locationData?.[0]?.loc || 'Await'
          };

          setCache(pallet.plt_num, palletWithLocation);
          if (pallet.series) {
            setCache(pallet.series, palletWithLocation);
          }
        }
      }
    }
  }, [supabase, ttl, setCache]);

  // 初始化
  useEffect(() => {
    // 預加載資料
    if (preloadPatterns.length > 0) {
      preloadPallets(preloadPatterns);
    }

    // 設置定期清理和刷新
    const cleanupInterval = setInterval(() => {
      cleanupExpiredCache();
    }, 60000); // 每分鐘清理一次

    if (enableBackgroundRefresh) {
      refreshTimer.current = setInterval(() => {
        refreshCache();
      }, 30000); // 每30秒刷新一次
    }

    return () => {
      clearInterval(cleanupInterval);
      if (refreshTimer.current) {
        clearInterval(refreshTimer.current);
      }
    };
  }, [preloadPatterns, preloadPallets, cleanupExpiredCache, refreshCache, enableBackgroundRefresh]);

  // 手動使快取失效
  const invalidateCache = useCallback((key?: string) => {
    if (key) {
      cache.current.delete(key);
    } else {
      cache.current.clear();
    }
  }, []);

  // 獲取快取統計
  const getCacheStats = useCallback(() => {
    return {
      size: cache.current.size,
      maxSize,
      hitRate: 0, // 可以添加命中率統計
      items: Array.from(cache.current.entries()).map(([key, entry]) => ({
        key,
        timestamp: new Date(entry.timestamp).toISOString(),
        expiresAt: new Date(entry.expiresAt).toISOString()
      }))
    };
  }, [maxSize]);

  return {
    searchPalletWithCache,
    preloadPallets,
    invalidateCache,
    getCacheStats,
    getFromCache,
    setCache
  };
};