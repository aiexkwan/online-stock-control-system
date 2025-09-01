/**
 * 建議系統狀態管理 Hook - useSuggestionState
 *
 * 職責：管理建議系統的完整狀態
 * - 整合現有的suggestionService
 * - 上下文感知和個人化邏輯
 * - 建議快取和預載機制
 * - 動態建議更新
 *
 * 設計理念：
 * - 智能建議生成和管理
 * - 個人化推薦算法
 * - 高效的快取和預載策略
 * - 用戶行為學習和優化
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useChatHistory, useChatStats } from '../stores/chatGlobalStore';
import { useSuggestionService } from '../context/ServiceContext';
import type { ChatMessage } from '../types/ai-response';

// 建議類型定義
export interface Suggestion {
  id: string;
  content: string;
  category: string;
  priority: number;
  relevance: number;
  usage_count: number;
  last_used?: Date;
  context?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

// 建議類別定義
export interface SuggestionCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  priority: number;
  enabled: boolean;
  suggestions: Suggestion[];
}

// 建議上下文
export interface SuggestionContext {
  lastMessage?: ChatMessage;
  messageHistory: ChatMessage[];
  sessionId?: string;
  currentCategory?: string;
  userBehavior?: {
    preferredCategories: string[];
    commonQueries: string[];
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  };
}

// 建議配置
export interface SuggestionConfig {
  enableContextual: boolean;
  enablePersonalization: boolean;
  enablePreloading: boolean;
  maxSuggestions: number;
  maxCategories: number;
  cacheSize: number;
  refreshInterval: number; // 分鐘
  relevanceThreshold: number; // 0-1
}

// 建議統計
export interface SuggestionStats {
  totalSuggestions: number;
  usedSuggestions: number;
  unusedSuggestions: number;
  usageRate: number;
  popularSuggestions: Suggestion[];
  categoriesUsage: Record<string, number>;
  avgRelevance: number;
  lastUpdated: Date;
}

// Hook 選項
export interface UseSuggestionStateOptions {
  sessionId?: string;
  config?: Partial<SuggestionConfig>;
  onSuggestionUsed?: (suggestion: Suggestion) => void;
  onSuggestionGenerated?: (suggestions: Suggestion[]) => void;
  enableAnalytics?: boolean;
}

// Hook 返回值
export interface UseSuggestionStateReturn {
  // === 核心狀態 ===
  suggestions: Suggestion[];
  categories: SuggestionCategory[];
  currentCategory: string | null;
  isLoading: boolean;
  error: string | null;

  // === 上下文相關 ===
  contextualSuggestions: Suggestion[];
  personalizedSuggestions: Suggestion[];

  // === 類別管理 ===
  setCurrentCategory: (categoryId: string | null) => void;
  getCategory: (categoryId: string) => SuggestionCategory | undefined;
  getCategorySuggestions: (categoryId: string) => Suggestion[];
  toggleCategoryEnabled: (categoryId: string) => void;

  // === 建議管理 ===
  generateSuggestions: (context?: Partial<SuggestionContext>) => Promise<void>;
  addSuggestion: (suggestion: Omit<Suggestion, 'id'>) => void;
  updateSuggestion: (id: string, updates: Partial<Suggestion>) => void;
  removeSuggestion: (id: string) => void;
  clearSuggestions: () => void;

  // === 建議使用 ===
  useSuggestion: (id: string) => Suggestion | undefined;
  recordSuggestionUsage: (suggestionId: string) => void;
  getSuggestionUsageHistory: (suggestionId: string) => Date[];

  // === 搜索和篩選 ===
  searchSuggestions: (query: string) => Suggestion[];
  filterSuggestions: (filter: {
    category?: string;
    tags?: string[];
    minRelevance?: number;
    minUsage?: number;
  }) => Suggestion[];

  // === 排序 ===
  sortSuggestions: (
    suggestions: Suggestion[],
    sortBy: 'relevance' | 'priority' | 'usage' | 'recent'
  ) => Suggestion[];

  // === 個人化 ===
  learnFromUserBehavior: (message: ChatMessage) => void;
  getPersonalizedRecommendations: (limit?: number) => Suggestion[];
  updateUserPreferences: (preferences: Partial<SuggestionContext['userBehavior']>) => void;

  // === 快取管理 ===
  preloadSuggestions: (context: Partial<SuggestionContext>) => Promise<void>;
  clearCache: () => void;
  getCacheStats: () => { size: number; hitRate: number };

  // === 配置管理 ===
  config: SuggestionConfig;
  updateConfig: (updates: Partial<SuggestionConfig>) => void;
  resetConfig: () => void;

  // === 統計和分析 ===
  stats: SuggestionStats;
  refreshStats: () => void;
  exportStats: () => string;

  // === 工具方法 ===
  refresh: () => void;
  cleanup: () => void;
  reset: () => void;
}

/**
 * 默認建議配置
 */
const defaultConfig: SuggestionConfig = {
  enableContextual: true,
  enablePersonalization: true,
  enablePreloading: true,
  maxSuggestions: 20,
  maxCategories: 8,
  cacheSize: 100,
  refreshInterval: 30,
  relevanceThreshold: 0.3,
};

/**
 * 默認建議類別
 */
const defaultCategories: SuggestionCategory[] = [
  {
    id: 'general',
    name: '一般查詢',
    description: '常見的資料庫查詢問題',
    icon: '💬',
    color: '#3B82F6',
    priority: 1,
    enabled: true,
    suggestions: [],
  },
  {
    id: 'inventory',
    name: '庫存管理',
    description: '庫存相關查詢',
    icon: '📦',
    color: '#10B981',
    priority: 2,
    enabled: true,
    suggestions: [],
  },
  {
    id: 'orders',
    name: '訂單管理',
    description: '訂單相關查詢',
    icon: '📋',
    color: '#F59E0B',
    priority: 3,
    enabled: true,
    suggestions: [],
  },
  {
    id: 'analytics',
    name: '數據分析',
    description: '報表和分析查詢',
    icon: '📊',
    color: '#8B5CF6',
    priority: 4,
    enabled: true,
    suggestions: [],
  },
  {
    id: 'troubleshooting',
    name: '故障排除',
    description: '系統問題診斷',
    icon: '🔧',
    color: '#EF4444',
    priority: 5,
    enabled: true,
    suggestions: [],
  },
];

/**
 * 建議系統狀態管理 Hook
 *
 * 提供完整的建議系統管理功能，包括生成、管理、個人化和分析
 *
 * 使用範例：
 * ```typescript
 * const suggestions = useSuggestionState({
 *   sessionId: 'current-session',
 *   enableAnalytics: true,
 *   onSuggestionUsed: (suggestion) => console.log('Used:', suggestion.content)
 * });
 *
 * // 生成上下文相關建議
 * await suggestions.generateSuggestions({
 *   lastMessage: lastUserMessage,
 *   messageHistory: chatHistory
 * });
 *
 * // 使用建議
 * const suggestion = suggestions.useSuggestion(suggestionId);
 * ```
 */
export const useSuggestionState = (
  options: UseSuggestionStateOptions = {}
): UseSuggestionStateReturn => {
  const {
    sessionId,
    config: optionConfig = {},
    onSuggestionUsed,
    onSuggestionGenerated,
    enableAnalytics = true,
  } = options;

  // === 狀態管理 ===
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [categories, setCategories] = useState<SuggestionCategory[]>(defaultCategories);
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<SuggestionConfig>({
    ...defaultConfig,
    ...optionConfig,
  });

  const [userBehavior, setUserBehavior] = useState<SuggestionContext['userBehavior']>({
    preferredCategories: [],
    commonQueries: [],
    timeOfDay: getCurrentTimeOfDay(),
  });

  // === Refs ===
  const cacheRef = useRef<Map<string, Suggestion[]>>(new Map());
  const usageHistoryRef = useRef<Map<string, Date[]>>(new Map());
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cacheStatsRef = useRef({ hits: 0, misses: 0 });

  // === 服務整合 ===
  const suggestionService = useSuggestionService();
  const { history, getRecentHistory } = useChatHistory();
  const { stats: globalStats } = useChatStats();

  // === 輔助函數 ===

  /**
   * 獲取當前時段
   */
  function getCurrentTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }

  /**
   * 計算建議相關性評分
   */
  const calculateRelevance = useCallback(
    (suggestion: Suggestion, context: SuggestionContext): number => {
      let relevance = suggestion.relevance || 0.5;

      // 上下文相關性
      if (context.lastMessage && suggestion.content) {
        const lastContent =
          typeof context.lastMessage.content === 'string'
            ? context.lastMessage.content.toLowerCase()
            : '';
        const suggestionContent = suggestion.content.toLowerCase();

        // 關鍵詞匹配
        const commonWords = lastContent
          .split(' ')
          .filter(word => word.length > 2)
          .filter(word => suggestionContent.includes(word));

        relevance += commonWords.length * 0.1;
      }

      // 類別匹配
      if (context.currentCategory === suggestion.category) {
        relevance += 0.2;
      }

      // 用戶偏好
      if (context.userBehavior?.preferredCategories.includes(suggestion.category)) {
        relevance += 0.15;
      }

      // 使用頻率
      const usageBonus = Math.min(suggestion.usage_count * 0.05, 0.3);
      relevance += usageBonus;

      // 時效性
      if (suggestion.last_used) {
        const daysSinceUsed = (Date.now() - suggestion.last_used.getTime()) / (1000 * 60 * 60 * 24);
        const freshness = Math.max(0, 1 - daysSinceUsed / 30); // 30天衰減
        relevance += freshness * 0.1;
      }

      return Math.min(1, Math.max(0, relevance));
    },
    []
  );

  /**
   * 生成建議ID
   */
  const generateSuggestionId = useCallback((): string => {
    return `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // === 核心方法 ===

  /**
   * 生成建議
   */
  const generateSuggestions = useCallback(
    async (context: Partial<SuggestionContext> = {}): Promise<void> => {
      if (isLoading) return;

      setIsLoading(true);
      setError(null);

      try {
        const fullContext: SuggestionContext = {
          messageHistory: [],
          userBehavior,
          sessionId,
          currentCategory,
          ...context,
        };

        // 檢查快取
        const cacheKey = JSON.stringify({
          lastMessage: fullContext.lastMessage?.id,
          category: fullContext.currentCategory,
          userPrefs: fullContext.userBehavior?.preferredCategories,
        });

        if (config.enablePreloading && cacheRef.current.has(cacheKey)) {
          cacheStatsRef.current.hits++;
          const cachedSuggestions = cacheRef.current.get(cacheKey)!;
          setSuggestions(cachedSuggestions);
          onSuggestionGenerated?.(cachedSuggestions);
          return;
        }

        cacheStatsRef.current.misses++;

        // 使用建議服務生成
        const serviceSuggestions = suggestionService.generateContextualSuggestions(fullContext);

        // 轉換為內部格式並計算相關性（serviceSuggestions是string[]）
        let newSuggestions: Suggestion[] = serviceSuggestions.map((content, index) => ({
          id: generateSuggestionId(),
          content: content,
          category: fullContext.currentCategory || 'general',
          priority: index + 1,
          relevance: 0.5,
          usage_count: 0,
          tags: [],
          metadata: {},
        }));

        // 計算相關性評分
        newSuggestions = newSuggestions.map(suggestion => ({
          ...suggestion,
          relevance: calculateRelevance(suggestion, fullContext),
        }));

        // 篩選低相關性建議
        newSuggestions = newSuggestions.filter(
          suggestion => suggestion.relevance >= config.relevanceThreshold
        );

        // 限制數量
        newSuggestions = newSuggestions
          .sort((a, b) => b.relevance - a.relevance)
          .slice(0, config.maxSuggestions);

        // 更新狀態
        setSuggestions(newSuggestions);

        // 更新快取
        if (config.enablePreloading && cacheRef.current.size < config.cacheSize) {
          cacheRef.current.set(cacheKey, newSuggestions);
        }

        // 觸發回調
        onSuggestionGenerated?.(newSuggestions);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '生成建議失敗';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [
      isLoading,
      userBehavior,
      sessionId,
      currentCategory,
      config,
      suggestionService,
      calculateRelevance,
      generateSuggestionId,
      onSuggestionGenerated,
    ]
  );

  /**
   * 添加建議
   */
  const addSuggestion = useCallback(
    (suggestionData: Omit<Suggestion, 'id'>) => {
      const newSuggestion: Suggestion = {
        ...suggestionData,
        id: generateSuggestionId(),
      };

      setSuggestions(prev => [newSuggestion, ...prev].slice(0, config.maxSuggestions));

      // 更新對應類別
      setCategories(prev =>
        prev.map(category => {
          if (category.id === newSuggestion.category) {
            return {
              ...category,
              suggestions: [newSuggestion, ...category.suggestions],
            };
          }
          return category;
        })
      );
    },
    [generateSuggestionId, config.maxSuggestions]
  );

  /**
   * 更新建議
   */
  const updateSuggestion = useCallback((id: string, updates: Partial<Suggestion>) => {
    setSuggestions(prev =>
      prev.map(suggestion => (suggestion.id === id ? { ...suggestion, ...updates } : suggestion))
    );

    setCategories(prev =>
      prev.map(category => ({
        ...category,
        suggestions: category.suggestions.map(suggestion =>
          suggestion.id === id ? { ...suggestion, ...updates } : suggestion
        ),
      }))
    );
  }, []);

  /**
   * 刪除建議
   */
  const removeSuggestion = useCallback((id: string) => {
    setSuggestions(prev => prev.filter(suggestion => suggestion.id !== id));

    setCategories(prev =>
      prev.map(category => ({
        ...category,
        suggestions: category.suggestions.filter(suggestion => suggestion.id !== id),
      }))
    );

    // 清理使用記錄
    usageHistoryRef.current.delete(id);
  }, []);

  /**
   * 清空建議
   */
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setCategories(prev =>
      prev.map(category => ({
        ...category,
        suggestions: [],
      }))
    );
  }, []);

  /**
   * 記錄建議使用
   */
  const recordSuggestionUsage = useCallback(
    (suggestionId: string) => {
      const now = new Date();

      // 更新建議使用計數
      updateSuggestion(suggestionId, {
        usage_count: suggestions.find(s => s.id === suggestionId)?.usage_count || 0 + 1,
        last_used: now,
      });

      // 記錄使用歷史
      const history = usageHistoryRef.current.get(suggestionId) || [];
      history.push(now);
      usageHistoryRef.current.set(suggestionId, history.slice(-100)); // 保留最近100次

      // 使用 suggestion service 記錄
      const suggestion = suggestions.find(s => s.id === suggestionId);
      if (suggestion) {
        suggestionService.recordSuggestionUsage(suggestion.content);
      }
    },
    [suggestions, updateSuggestion, suggestionService]
  );

  /**
   * 使用建議
   */
  const useSuggestion = useCallback(
    (id: string): Suggestion | undefined => {
      const suggestion = suggestions.find(s => s.id === id);
      if (!suggestion) return undefined;

      // 記錄使用
      recordSuggestionUsage(id);

      // 觸發回調
      onSuggestionUsed?.(suggestion);

      return suggestion;
    },
    [suggestions, recordSuggestionUsage, onSuggestionUsed]
  );

  /**
   * 獲取建議使用歷史
   */
  const getSuggestionUsageHistory = useCallback((suggestionId: string): Date[] => {
    return usageHistoryRef.current.get(suggestionId) || [];
  }, []);

  /**
   * 搜索建議
   */
  const searchSuggestions = useCallback(
    (query: string): Suggestion[] => {
      if (!query.trim()) return suggestions;

      const searchTerm = query.toLowerCase();
      return suggestions.filter(
        suggestion =>
          suggestion.content.toLowerCase().includes(searchTerm) ||
          suggestion.category.toLowerCase().includes(searchTerm) ||
          suggestion.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    },
    [suggestions]
  );

  /**
   * 篩選建議
   */
  const filterSuggestions = useCallback(
    (filter: {
      category?: string;
      tags?: string[];
      minRelevance?: number;
      minUsage?: number;
    }): Suggestion[] => {
      return suggestions.filter(suggestion => {
        if (filter.category && suggestion.category !== filter.category) return false;
        if (filter.minRelevance && suggestion.relevance < filter.minRelevance) return false;
        if (filter.minUsage && suggestion.usage_count < filter.minUsage) return false;
        if (filter.tags && filter.tags.length > 0) {
          const suggestionTags = suggestion.tags || [];
          if (!filter.tags.some(tag => suggestionTags.includes(tag))) return false;
        }
        return true;
      });
    },
    [suggestions]
  );

  /**
   * 排序建議
   */
  const sortSuggestions = useCallback(
    (
      suggestionList: Suggestion[],
      sortBy: 'relevance' | 'priority' | 'usage' | 'recent'
    ): Suggestion[] => {
      return [...suggestionList].sort((a, b) => {
        switch (sortBy) {
          case 'relevance':
            return b.relevance - a.relevance;
          case 'priority':
            return a.priority - b.priority;
          case 'usage':
            return b.usage_count - a.usage_count;
          case 'recent':
            const aTime = a.last_used?.getTime() || 0;
            const bTime = b.last_used?.getTime() || 0;
            return bTime - aTime;
          default:
            return 0;
        }
      });
    },
    []
  );

  /**
   * 從用戶行為學習
   */
  const learnFromUserBehavior = useCallback(
    (message: ChatMessage) => {
      if (!config.enablePersonalization) return;

      const content = typeof message.content === 'string' ? message.content : '';
      if (!content.trim()) return;

      setUserBehavior(prev => ({
        ...prev,
        commonQueries: [content, ...prev.commonQueries.filter(q => q !== content)].slice(0, 50), // 保留最近50個查詢
        timeOfDay: getCurrentTimeOfDay(),
      }));

      // 分析查詢內容以推測偏好類別
      const categoryKeywords = {
        inventory: ['庫存', '存貨', '商品', '產品', '數量'],
        orders: ['訂單', '出貨', '配送', '客戶'],
        analytics: ['報表', '分析', '統計', '數據'],
        troubleshooting: ['錯誤', '問題', '故障', '修復'],
      };

      Object.entries(categoryKeywords).forEach(([category, keywords]) => {
        if (keywords.some(keyword => content.includes(keyword))) {
          setUserBehavior(prev => ({
            ...prev,
            preferredCategories: [
              category,
              ...prev.preferredCategories.filter(c => c !== category),
            ].slice(0, 5), // 保留前5個偏好類別
          }));
        }
      });
    },
    [config.enablePersonalization]
  );

  /**
   * 獲取個人化推薦
   */
  const getPersonalizedRecommendations = useCallback(
    (limit = 10): Suggestion[] => {
      if (!config.enablePersonalization) return [];

      // 基於用戶偏好類別推薦
      const preferredSuggestions = suggestions.filter(suggestion =>
        userBehavior.preferredCategories.includes(suggestion.category)
      );

      // 基於常用查詢推薦
      const contextSuggestions = suggestions.filter(suggestion => {
        return userBehavior.commonQueries.some(query => {
          const queryWords = query.toLowerCase().split(' ');
          const suggestionWords = suggestion.content.toLowerCase().split(' ');
          return queryWords.some(word => suggestionWords.includes(word));
        });
      });

      // 合併並去重
      const combined = [...preferredSuggestions, ...contextSuggestions];
      const unique = Array.from(new Map(combined.map(s => [s.id, s])).values());

      // 按相關性排序並限制數量
      return sortSuggestions(unique, 'relevance').slice(0, limit);
    },
    [config.enablePersonalization, suggestions, userBehavior, sortSuggestions]
  );

  /**
   * 更新用戶偏好
   */
  const updateUserPreferences = useCallback(
    (preferences: Partial<SuggestionContext['userBehavior']>) => {
      setUserBehavior(prev => ({ ...prev, ...preferences }));
    },
    []
  );

  /**
   * 預載建議
   */
  const preloadSuggestions = useCallback(
    async (context: Partial<SuggestionContext>): Promise<void> => {
      if (!config.enablePreloading) return;

      const cacheKey = JSON.stringify({
        lastMessage: context.lastMessage?.id,
        category: context.currentCategory,
        userPrefs: context.userBehavior?.preferredCategories,
      });

      if (cacheRef.current.has(cacheKey)) return;

      // 在背景中生成建議
      try {
        const fullContext = {
          messageHistory: [],
          userBehavior,
          sessionId,
          ...context,
        };

        const serviceSuggestions = suggestionService.generateContextualSuggestions(fullContext);

        const preloadedSuggestions: Suggestion[] = serviceSuggestions.map((content, index) => ({
          id: generateSuggestionId(),
          content: content,
          category: context.currentCategory || 'general',
          priority: index + 1,
          relevance: calculateRelevance(
            {
              id: '',
              content: content,
              category: context.currentCategory || 'general',
              priority: index + 1,
              relevance: 0.5,
              usage_count: 0,
            },
            fullContext
          ),
          usage_count: 0,
          tags: [],
          metadata: {},
        }));

        if (cacheRef.current.size < config.cacheSize) {
          cacheRef.current.set(cacheKey, preloadedSuggestions);
        }
      } catch (error) {
        // 預載失敗不影響主要功能
        console.warn('Preloading suggestions failed:', error);
      }
    },
    [
      config.enablePreloading,
      config.cacheSize,
      userBehavior,
      sessionId,
      suggestionService,
      generateSuggestionId,
      calculateRelevance,
    ]
  );

  // === 計算衍生狀態 ===

  /**
   * 上下文相關建議
   */
  const contextualSuggestions = useMemo(() => {
    return suggestions.filter(suggestion => suggestion.relevance > 0.6);
  }, [suggestions]);

  /**
   * 個人化建議
   */
  const personalizedSuggestions = useMemo(() => {
    return getPersonalizedRecommendations(config.maxSuggestions);
  }, [getPersonalizedRecommendations, config.maxSuggestions]);

  /**
   * 類別管理方法
   */
  const getCategory = useCallback(
    (categoryId: string): SuggestionCategory | undefined => {
      return categories.find(cat => cat.id === categoryId);
    },
    [categories]
  );

  const getCategorySuggestions = useCallback(
    (categoryId: string): Suggestion[] => {
      return suggestions.filter(suggestion => suggestion.category === categoryId);
    },
    [suggestions]
  );

  const toggleCategoryEnabled = useCallback((categoryId: string) => {
    setCategories(prev =>
      prev.map(category =>
        category.id === categoryId ? { ...category, enabled: !category.enabled } : category
      )
    );
  }, []);

  /**
   * 快取統計
   */
  const getCacheStats = useCallback(() => {
    const totalRequests = cacheStatsRef.current.hits + cacheStatsRef.current.misses;
    const hitRate = totalRequests > 0 ? cacheStatsRef.current.hits / totalRequests : 0;

    return {
      size: cacheRef.current.size,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }, []);

  /**
   * 清除快取
   */
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
    cacheStatsRef.current = { hits: 0, misses: 0 };
  }, []);

  /**
   * 配置管理
   */
  const updateConfig = useCallback((updates: Partial<SuggestionConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const resetConfig = useCallback(() => {
    setConfig({ ...defaultConfig, ...optionConfig });
  }, [optionConfig]);

  /**
   * 統計信息
   */
  const stats = useMemo((): SuggestionStats => {
    const usedSuggestions = suggestions.filter(s => s.usage_count > 0);
    const unusedSuggestions = suggestions.filter(s => s.usage_count === 0);
    const totalUsage = suggestions.reduce((sum, s) => sum + s.usage_count, 0);
    const avgRelevance =
      suggestions.length > 0
        ? suggestions.reduce((sum, s) => sum + s.relevance, 0) / suggestions.length
        : 0;

    const categoriesUsage: Record<string, number> = {};
    suggestions.forEach(suggestion => {
      categoriesUsage[suggestion.category] =
        (categoriesUsage[suggestion.category] || 0) + suggestion.usage_count;
    });

    const popularSuggestions = sortSuggestions([...suggestions], 'usage').slice(0, 5);

    return {
      totalSuggestions: suggestions.length,
      usedSuggestions: usedSuggestions.length,
      unusedSuggestions: unusedSuggestions.length,
      usageRate: suggestions.length > 0 ? usedSuggestions.length / suggestions.length : 0,
      popularSuggestions,
      categoriesUsage,
      avgRelevance,
      lastUpdated: new Date(),
    };
  }, [suggestions, sortSuggestions]);

  const refreshStats = useCallback(() => {
    // 統計信息會自動通過 useMemo 重新計算
  }, []);

  const exportStats = useCallback(() => {
    return JSON.stringify(
      {
        stats,
        userBehavior,
        cacheStats: getCacheStats(),
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    );
  }, [stats, userBehavior, getCacheStats]);

  /**
   * 工具方法
   */
  const refresh = useCallback(() => {
    generateSuggestions();
  }, [generateSuggestions]);

  const cleanup = useCallback(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    cacheRef.current.clear();
    usageHistoryRef.current.clear();
  }, []);

  const reset = useCallback(() => {
    setSuggestions([]);
    setCategories(defaultCategories);
    setCurrentCategory(null);
    setError(null);
    setUserBehavior({
      preferredCategories: [],
      commonQueries: [],
      timeOfDay: getCurrentTimeOfDay(),
    });
    clearCache();
  }, [clearCache]);

  // === 副作用管理 ===

  // 自動刷新定時器
  useEffect(() => {
    if (config.refreshInterval > 0) {
      refreshTimerRef.current = setInterval(refresh, config.refreshInterval * 60 * 1000);

      return () => {
        if (refreshTimerRef.current) {
          clearInterval(refreshTimerRef.current);
        }
      };
    }
  }, [config.refreshInterval, refresh]);

  // 組件卸載清理
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // === 返回介面 ===
  return {
    // === 核心狀態 ===
    suggestions,
    categories,
    currentCategory,
    isLoading,
    error,

    // === 上下文相關 ===
    contextualSuggestions,
    personalizedSuggestions,

    // === 類別管理 ===
    setCurrentCategory,
    getCategory,
    getCategorySuggestions,
    toggleCategoryEnabled,

    // === 建議管理 ===
    generateSuggestions,
    addSuggestion,
    updateSuggestion,
    removeSuggestion,
    clearSuggestions,

    // === 建議使用 ===
    useSuggestion,
    recordSuggestionUsage,
    getSuggestionUsageHistory,

    // === 搜索和篩選 ===
    searchSuggestions,
    filterSuggestions,

    // === 排序 ===
    sortSuggestions,

    // === 個人化 ===
    learnFromUserBehavior,
    getPersonalizedRecommendations,
    updateUserPreferences,

    // === 快取管理 ===
    preloadSuggestions,
    clearCache,
    getCacheStats,

    // === 配置管理 ===
    config,
    updateConfig,
    resetConfig,

    // === 統計和分析 ===
    stats,
    refreshStats,
    exportStats,

    // === 工具方法 ===
    refresh,
    cleanup,
    reset,
  };
};
