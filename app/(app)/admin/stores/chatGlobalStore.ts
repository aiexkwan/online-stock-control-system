/**
 * Chat Global Store - 使用 Zustand 管理聊天全局狀態
 *
 * 採用 Zustand 管理跨組件共享的狀態：
 * - 用戶偏好設置（useStreaming, showSuggestions等）
 * - 查詢快取和歷史記錄
 * - 跨會話的持久化狀態
 *
 * 職責分離：
 * - 全局設定管理
 * - 查詢歷史跨會話共享
 * - 用戶偏好持久化
 * - 性能指標統計
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ChatMessage } from '../types/ai-response';

// 查詢統計接口
export interface QueryStats {
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  averageResponseTime: number;
  lastQueryTime: string | null;
}

// 快取項目接口
export interface CachedQuery {
  id: string;
  query: string;
  response: string;
  timestamp: string;
  cacheLevel: 'L1' | 'L2' | 'L3';
  responseTime: number;
}

// 用戶偏好設置
export interface ChatPreferences {
  useStreaming: boolean;
  showSuggestions: boolean;
  autoSave: boolean;
  theme: 'light' | 'dark' | 'system';
  language: 'zh-TW' | 'en';
  maxHistoryItems: number;
  enableNotifications: boolean;
  enableAnalytics: boolean;
}

// Zustand Store 狀態接口
interface ChatGlobalState {
  // 用戶偏好
  preferences: ChatPreferences;

  // 查詢歷史（跨會話共享）
  queryHistory: string[];

  // 快取查詢
  cachedQueries: CachedQuery[];

  // 查詢統計
  stats: QueryStats;

  // 活躍會話
  activeSessions: Set<string>;

  // 全局設定
  globalSettings: {
    maxCacheSize: number;
    cacheExpiryMinutes: number;
    enablePerformanceTracking: boolean;
  };
}

// Zustand Store 動作接口
interface ChatGlobalActions {
  // 偏好設置動作
  updatePreferences: (updates: Partial<ChatPreferences>) => void;
  resetPreferences: () => void;
  toggleStreaming: () => void;
  toggleSuggestions: () => void;

  // 查詢歷史動作
  addToHistory: (query: string) => void;
  removeFromHistory: (query: string) => void;
  clearHistory: () => void;
  getRecentHistory: (limit?: number) => string[];

  // 快取管理動作
  addToCache: (cache: Omit<CachedQuery, 'id' | 'timestamp'>) => void;
  getCachedQuery: (query: string) => CachedQuery | null;
  clearCache: () => void;
  cleanExpiredCache: () => void;

  // 統計動作
  updateStats: (updates: Partial<QueryStats>) => void;
  incrementQueryCount: (success: boolean, responseTime?: number) => void;
  resetStats: () => void;

  // 會話管理
  addSession: (sessionId: string) => void;
  removeSession: (sessionId: string) => void;
  clearSessions: () => void;

  // 全局設定
  updateGlobalSettings: (updates: Partial<ChatGlobalState['globalSettings']>) => void;

  // 工具函數
  exportData: () => string;
  importData: (data: string) => boolean;
}

// 完整的 Store 類型
type ChatGlobalStore = ChatGlobalState & ChatGlobalActions;

// 默認偏好設置
const defaultPreferences: ChatPreferences = {
  useStreaming: true,
  showSuggestions: true,
  autoSave: true,
  theme: 'system',
  language: 'zh-TW',
  maxHistoryItems: 50,
  enableNotifications: true,
  enableAnalytics: true,
};

// 默認統計
const defaultStats: QueryStats = {
  totalQueries: 0,
  successfulQueries: 0,
  failedQueries: 0,
  averageResponseTime: 0,
  lastQueryTime: null,
};

// 默認全局設定
const defaultGlobalSettings = {
  maxCacheSize: 100,
  cacheExpiryMinutes: 60,
  enablePerformanceTracking: true,
};

/**
 * 聊天全局狀態 Store
 * 使用 Zustand + persist 中間件實現持久化
 */
export const useChatGlobalStore = create<ChatGlobalStore>()(
  persist(
    (set, get) => ({
      // 初始狀態
      preferences: defaultPreferences,
      queryHistory: [],
      cachedQueries: [],
      stats: defaultStats,
      activeSessions: new Set<string>(),
      globalSettings: defaultGlobalSettings,

      // 偏好設置動作
      updatePreferences: updates => {
        set(state => ({
          preferences: { ...state.preferences, ...updates },
        }));
      },

      resetPreferences: () => {
        set({ preferences: defaultPreferences });
      },

      toggleStreaming: () => {
        set(state => ({
          preferences: {
            ...state.preferences,
            useStreaming: !state.preferences.useStreaming,
          },
        }));
      },

      toggleSuggestions: () => {
        set(state => ({
          preferences: {
            ...state.preferences,
            showSuggestions: !state.preferences.showSuggestions,
          },
        }));
      },

      // 查詢歷史動作
      addToHistory: query => {
        if (!query.trim()) return;

        set(state => {
          const filtered = state.queryHistory.filter(q => q !== query);
          const updated = [query, ...filtered];
          const limited = updated.slice(0, state.preferences.maxHistoryItems);

          return { queryHistory: limited };
        });
      },

      removeFromHistory: query => {
        set(state => ({
          queryHistory: state.queryHistory.filter(q => q !== query),
        }));
      },

      clearHistory: () => {
        set({ queryHistory: [] });
      },

      getRecentHistory: (limit = 10) => {
        const { queryHistory } = get();
        return queryHistory.slice(0, limit);
      },

      // 快取管理動作
      addToCache: cache => {
        const newCache: CachedQuery = {
          ...cache,
          id: `cache_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
        };

        set(state => {
          // 檢查是否已存在相同查詢
          const filtered = state.cachedQueries.filter(c => c.query !== cache.query);
          const updated = [newCache, ...filtered];
          const limited = updated.slice(0, state.globalSettings.maxCacheSize);

          return { cachedQueries: limited };
        });
      },

      getCachedQuery: query => {
        const { cachedQueries, globalSettings } = get();
        const now = new Date();
        const expiryTime = globalSettings.cacheExpiryMinutes * 60 * 1000;

        return (
          cachedQueries.find(cache => {
            if (cache.query !== query) return false;

            const cacheTime = new Date(cache.timestamp);
            const isExpired = now.getTime() - cacheTime.getTime() > expiryTime;

            return !isExpired;
          }) || null
        );
      },

      clearCache: () => {
        set({ cachedQueries: [] });
      },

      cleanExpiredCache: () => {
        const { cachedQueries, globalSettings } = get();
        const now = new Date();
        const expiryTime = globalSettings.cacheExpiryMinutes * 60 * 1000;

        const validCaches = cachedQueries.filter(cache => {
          const cacheTime = new Date(cache.timestamp);
          return now.getTime() - cacheTime.getTime() <= expiryTime;
        });

        set({ cachedQueries: validCaches });
      },

      // 統計動作
      updateStats: updates => {
        set(state => ({
          stats: { ...state.stats, ...updates },
        }));
      },

      incrementQueryCount: (success, responseTime = 0) => {
        set(state => {
          const newTotalQueries = state.stats.totalQueries + 1;
          const newSuccessfulQueries = state.stats.successfulQueries + (success ? 1 : 0);
          const newFailedQueries = state.stats.failedQueries + (success ? 0 : 1);

          // 計算新的平均響應時間
          let newAverageResponseTime = state.stats.averageResponseTime;
          if (success && responseTime > 0) {
            newAverageResponseTime =
              (state.stats.averageResponseTime * state.stats.successfulQueries + responseTime) /
              newSuccessfulQueries;
          }

          return {
            stats: {
              totalQueries: newTotalQueries,
              successfulQueries: newSuccessfulQueries,
              failedQueries: newFailedQueries,
              averageResponseTime: newAverageResponseTime,
              lastQueryTime: new Date().toISOString(),
            },
          };
        });
      },

      resetStats: () => {
        set({ stats: defaultStats });
      },

      // 會話管理
      addSession: sessionId => {
        set(state => ({
          activeSessions: new Set([...state.activeSessions, sessionId]),
        }));
      },

      removeSession: sessionId => {
        set(state => {
          const newSessions = new Set(state.activeSessions);
          newSessions.delete(sessionId);
          return { activeSessions: newSessions };
        });
      },

      clearSessions: () => {
        set({ activeSessions: new Set<string>() });
      },

      // 全局設定
      updateGlobalSettings: updates => {
        set(state => ({
          globalSettings: { ...state.globalSettings, ...updates },
        }));
      },

      // 工具函數
      exportData: () => {
        const state = get();
        const exportData = {
          preferences: state.preferences,
          queryHistory: state.queryHistory,
          stats: state.stats,
          globalSettings: state.globalSettings,
          exportedAt: new Date().toISOString(),
        };
        return JSON.stringify(exportData, null, 2);
      },

      importData: data => {
        try {
          const parsed = JSON.parse(data);

          // 驗證數據結構
          if (typeof parsed !== 'object' || !parsed.preferences) {
            return false;
          }

          set(state => ({
            preferences: { ...state.preferences, ...parsed.preferences },
            queryHistory: Array.isArray(parsed.queryHistory)
              ? parsed.queryHistory
              : state.queryHistory,
            stats:
              typeof parsed.stats === 'object' ? { ...state.stats, ...parsed.stats } : state.stats,
            globalSettings:
              typeof parsed.globalSettings === 'object'
                ? { ...state.globalSettings, ...parsed.globalSettings }
                : state.globalSettings,
          }));

          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'chat-global-store',
      storage: createJSONStorage(() => localStorage),
      // Zustand persist v4+ 不再需要手動序列化Set類型
      // 在partialize中處理不支持的類型
      // 部分持久化，不保存會話狀態
      partialize: state => ({
        preferences: state.preferences,
        queryHistory: state.queryHistory,
        cachedQueries: state.cachedQueries,
        stats: state.stats,
        globalSettings: state.globalSettings,
        // activeSessions 不持久化
      }),
    }
  )
);

// 便捷的選擇器函數
export const useChatPreferences = () => useChatGlobalStore(state => state.preferences);
export const useChatHistory = () =>
  useChatGlobalStore(state => ({
    history: state.queryHistory,
    addToHistory: state.addToHistory,
    clearHistory: state.clearHistory,
    getRecentHistory: state.getRecentHistory,
  }));
export const useChatCache = () =>
  useChatGlobalStore(state => ({
    cachedQueries: state.cachedQueries,
    addToCache: state.addToCache,
    getCachedQuery: state.getCachedQuery,
    clearCache: state.clearCache,
    cleanExpiredCache: state.cleanExpiredCache,
  }));
export const useChatStats = () =>
  useChatGlobalStore(state => ({
    stats: state.stats,
    incrementQueryCount: state.incrementQueryCount,
    updateStats: state.updateStats,
    resetStats: state.resetStats,
  }));
