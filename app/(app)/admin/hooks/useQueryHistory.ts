/**
 * Query History Hook - 管理查詢歷史記錄
 *
 * 職責分離：
 * - 查詢歷史管理
 * - 本地存儲同步
 * - 歷史記錄更新邏輯
 */

import { useState, useCallback } from 'react';

export interface UseQueryHistoryOptions {
  maxItems?: number;
  storageKey?: string;
}

export interface UseQueryHistoryReturn {
  recentQueries: string[];
  addQuery: (query: string) => void;
  clearHistory: () => void;
}

/**
 * 查詢歷史管理Hook
 */
export const useQueryHistory = (options: UseQueryHistoryOptions = {}): UseQueryHistoryReturn => {
  const { maxItems = 10, storageKey = 'chatbot-recent-queries' } = options;

  const [recentQueries, setRecentQueries] = useState<string[]>(() => {
    // 從本地存儲加載歷史記錄
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(storageKey);
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  /**
   * 添加新查詢到歷史記錄
   */
  const addQuery = useCallback(
    (query: string) => {
      if (!query.trim()) return;

      setRecentQueries(prev => {
        // 移除重複項並添加到開頭
        const updated = [query, ...prev.filter(q => q !== query)];

        // 限制數量
        const limited = updated.slice(0, maxItems);

        // 保存到本地存儲
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(storageKey, JSON.stringify(limited));
          } catch (error) {
            console.warn('Failed to save query history:', error);
          }
        }

        return limited;
      });
    },
    [maxItems, storageKey]
  );

  /**
   * 清除歷史記錄
   */
  const clearHistory = useCallback(() => {
    setRecentQueries([]);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(storageKey);
      } catch (error) {
        console.warn('Failed to clear query history:', error);
      }
    }
  }, [storageKey]);

  return {
    recentQueries,
    addQuery,
    clearHistory,
  };
};
