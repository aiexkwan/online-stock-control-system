/**
 * 訊息歷史管理 Hook - useMessageHistory
 *
 * 職責：專門管理聊天訊息的歷史記錄
 * - 智能訊息排序和篩選邏輯
 * - 訊息快取和持久化
 * - 長列表的記憶體優化
 * - 搜索和過濾功能
 *
 * 設計理念：
 * - 高效的訊息處理和查詢
 * - 記憶體友好的虛擬化支援
 * - 靈活的篩選和搜索機制
 * - 自動清理過期訊息
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useChatHistory, useChatStats } from '../stores/chatGlobalStore';
import type { ChatMessage } from '../types/ai-response';

// 訊息篩選選項
export interface MessageFilterOptions {
  // 基本篩選
  type?: 'user' | 'ai' | 'system';
  role?: 'user' | 'assistant' | 'system';

  // 時間篩選
  dateRange?: {
    start?: Date;
    end?: Date;
  };

  // 內容篩選
  searchTerm?: string;
  minLength?: number;
  maxLength?: number;

  // 會話篩選
  sessionId?: string;
  sessionIds?: string[];

  // 高級篩選
  hasAttachments?: boolean;
  isStarred?: boolean;
  tags?: string[];
}

// 訊息排序選項
export interface MessageSortOptions {
  field: 'timestamp' | 'relevance' | 'length';
  order: 'asc' | 'desc';
}

// 訊息分頁選項
export interface MessagePaginationOptions {
  page?: number;
  pageSize?: number;
  enableVirtualization?: boolean;
}

// 訊息歷史統計
export interface MessageHistoryStats {
  totalMessages: number;
  userMessages: number;
  aiMessages: number;
  avgMessageLength: number;
  totalSessions: number;
  avgMessagesPerSession: number;
  oldestMessage?: Date;
  newestMessage?: Date;
}

// Hook 選項
export interface UseMessageHistoryOptions {
  sessionId?: string;
  maxHistorySize?: number;
  enablePersistence?: boolean;
  enableSearch?: boolean;
  enableStats?: boolean;
  autoCleanup?: boolean;
  cleanupInterval?: number; // 分鐘
}

// Hook 返回值
export interface UseMessageHistoryReturn {
  // === 核心數據 ===
  messages: ChatMessage[];
  filteredMessages: ChatMessage[];
  totalCount: number;

  // === 篩選和搜索 ===
  filter: MessageFilterOptions;
  setFilter: (filter: Partial<MessageFilterOptions>) => void;
  clearFilter: () => void;
  searchMessages: (term: string) => ChatMessage[];

  // === 排序 ===
  sortOptions: MessageSortOptions;
  setSortOptions: (options: MessageSortOptions) => void;

  // === 分頁 ===
  pagination: MessagePaginationOptions & {
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  setPagination: (options: Partial<MessagePaginationOptions>) => void;
  nextPage: () => void;
  previousPage: () => void;

  // === 訊息管理 ===
  addMessage: (message: ChatMessage) => void;
  addMessages: (messages: ChatMessage[]) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  removeMessage: (id: string) => void;
  removeMessages: (ids: string[]) => void;
  clearMessages: () => void;

  // === 訊息操作 ===
  starMessage: (id: string) => void;
  unstarMessage: (id: string) => void;
  tagMessage: (id: string, tags: string[]) => void;
  findMessage: (id: string) => ChatMessage | undefined;

  // === 會話管理 ===
  getSessionMessages: (sessionId: string) => ChatMessage[];
  getAvailableSessions: () => string[];
  clearSession: (sessionId: string) => void;

  // === 導入導出 ===
  exportMessages: (format?: 'json' | 'csv') => string;
  importMessages: (data: string, format?: 'json' | 'csv') => boolean;

  // === 統計信息 ===
  stats: MessageHistoryStats;
  refreshStats: () => void;

  // === 工具方法 ===
  cleanup: () => void;
  optimizeMemory: () => void;
  isLoading: boolean;
}

/**
 * 訊息歷史管理 Hook
 *
 * 提供完整的訊息歷史管理功能，包括篩選、搜索、排序、分頁等
 *
 * 使用範例：
 * ```typescript
 * const history = useMessageHistory({
 *   sessionId: 'current-session',
 *   enableSearch: true,
 *   maxHistorySize: 1000
 * });
 *
 * // 添加訊息
 * history.addMessage(newMessage);
 *
 * // 搜索訊息
 * const results = history.searchMessages('database query');
 *
 * // 篩選特定類型的訊息
 * history.setFilter({ type: 'user', dateRange: { start: yesterday } });
 * ```
 */
export const useMessageHistory = (
  options: UseMessageHistoryOptions = {}
): UseMessageHistoryReturn => {
  const {
    sessionId,
    maxHistorySize = 1000,
    enablePersistence = true,
    enableSearch = true,
    enableStats = true,
    autoCleanup = true,
    cleanupInterval = 60, // 60分鐘
  } = options;

  // === 狀態管理 ===
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [filter, setFilterState] = useState<MessageFilterOptions>({});
  const [sortOptions, setSortOptions] = useState<MessageSortOptions>({
    field: 'timestamp',
    order: 'desc',
  });
  const [pagination, setPaginationState] = useState<MessagePaginationOptions>({
    page: 1,
    pageSize: 50,
    enableVirtualization: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [starredMessages] = useState<Set<string>>(new Set());
  const [messageTags] = useState<Map<string, string[]>>(new Map());

  const cleanupTimerRef = useRef<NodeJS.Timeout | null>(null);
  const searchIndexRef = useRef<Map<string, ChatMessage[]>>(new Map());

  // === 整合全局狀態 ===
  const { history: globalHistory, addToHistory } = useChatHistory();
  const { stats: globalStats } = useChatStats();

  // === 輔助函數 ===

  /**
   * 計算相關性評分
   */
  const calculateRelevanceScore = useCallback(
    (message: ChatMessage, searchTerm: string): number => {
      const content =
        typeof message.content === 'string'
          ? message.content.toLowerCase()
          : JSON.stringify(message.content).toLowerCase();

      const term = searchTerm.toLowerCase();
      let score = 0;

      // 完全匹配加分
      if (content.includes(term)) {
        score += 10;
      }

      // 單詞匹配加分
      const words = term.split(' ');
      words.forEach(word => {
        if (content.includes(word)) {
          score += 1;
        }
      });

      // 位置加分（越前面越重要）
      const firstIndex = content.indexOf(term);
      if (firstIndex !== -1) {
        score += Math.max(0, 5 - firstIndex / 10);
      }

      return score;
    },
    []
  );

  // === 訊息篩選邏輯 ===
  const filteredMessages = useMemo(() => {
    let result = [...messages];

    // 基本篩選
    if (filter.type) {
      result = result.filter(msg => msg.type === filter.type);
    }

    if (filter.role) {
      result = result.filter(msg => msg.role === filter.role);
    }

    // 會話篩選
    if (filter.sessionId) {
      result = result.filter(msg => (msg as any).sessionId === filter.sessionId);
    }

    if (filter.sessionIds && filter.sessionIds.length > 0) {
      result = result.filter(msg => filter.sessionIds!.includes((msg as any).sessionId || ''));
    }

    // 時間篩選
    if (filter.dateRange) {
      const { start, end } = filter.dateRange;
      result = result.filter(msg => {
        const msgDate = new Date(msg.timestamp);
        if (start && msgDate < start) return false;
        if (end && msgDate > end) return false;
        return true;
      });
    }

    // 內容篩選
    if (filter.searchTerm && enableSearch) {
      const term = filter.searchTerm.toLowerCase();
      result = result.filter(msg => {
        const content =
          typeof msg.content === 'string'
            ? msg.content.toLowerCase()
            : JSON.stringify(msg.content).toLowerCase();
        return content.includes(term);
      });
    }

    if (filter.minLength) {
      result = result.filter(msg => {
        const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
        return content.length >= filter.minLength!;
      });
    }

    if (filter.maxLength) {
      result = result.filter(msg => {
        const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
        return content.length <= filter.maxLength!;
      });
    }

    // 高級篩選
    if (filter.isStarred !== undefined) {
      result = result.filter(msg => starredMessages.has(msg.id) === filter.isStarred);
    }

    if (filter.tags && filter.tags.length > 0) {
      result = result.filter(msg => {
        const msgTags = messageTags.get(msg.id) || [];
        return filter.tags!.some(tag => msgTags.includes(tag));
      });
    }

    return result;
  }, [messages, filter, enableSearch, starredMessages, messageTags]);

  // === 訊息排序邏輯 ===
  const sortedMessages = useMemo(() => {
    const result = [...filteredMessages];

    result.sort((a, b) => {
      let comparison = 0;

      switch (sortOptions.field) {
        case 'timestamp':
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          break;

        case 'length':
          const aLength =
            typeof a.content === 'string' ? a.content.length : JSON.stringify(a.content).length;
          const bLength =
            typeof b.content === 'string' ? b.content.length : JSON.stringify(b.content).length;
          comparison = aLength - bLength;
          break;

        case 'relevance':
          // 簡單的相關性評分（可以根據需要改進）
          if (filter.searchTerm) {
            const aScore = calculateRelevanceScore(a, filter.searchTerm);
            const bScore = calculateRelevanceScore(b, filter.searchTerm);
            comparison = bScore - aScore; // 高相關性在前
          } else {
            comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          }
          break;

        default:
          comparison = 0;
      }

      return sortOptions.order === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [filteredMessages, sortOptions, filter.searchTerm, calculateRelevanceScore]);

  // === 分頁邏輯 ===
  const paginatedMessages = useMemo(() => {
    if (!pagination.pageSize) return sortedMessages;

    const startIndex = ((pagination.page || 1) - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;

    return sortedMessages.slice(startIndex, endIndex);
  }, [sortedMessages, pagination.page, pagination.pageSize]);

  const paginationInfo = useMemo(() => {
    const totalPages = pagination.pageSize
      ? Math.ceil(sortedMessages.length / pagination.pageSize)
      : 1;
    const currentPage = pagination.page || 1;

    return {
      ...pagination,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    };
  }, [sortedMessages.length, pagination]);

  // === 統計信息 ===
  const stats = useMemo((): MessageHistoryStats => {
    if (!enableStats) {
      return {
        totalMessages: 0,
        userMessages: 0,
        aiMessages: 0,
        avgMessageLength: 0,
        totalSessions: 0,
        avgMessagesPerSession: 0,
      };
    }

    const userMessages = messages.filter(msg => msg.type === 'user');
    const aiMessages = messages.filter(msg => msg.type === 'ai');

    const totalLength = messages.reduce((sum, msg) => {
      const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
      return sum + content.length;
    }, 0);

    const sessions = new Set(messages.map(msg => (msg as any).sessionId).filter(Boolean));

    const timestamps = messages.map(msg => new Date(msg.timestamp));
    const oldestMessage =
      timestamps.length > 0 ? new Date(Math.min(...timestamps.map(d => d.getTime()))) : undefined;
    const newestMessage =
      timestamps.length > 0 ? new Date(Math.max(...timestamps.map(d => d.getTime()))) : undefined;

    return {
      totalMessages: messages.length,
      userMessages: userMessages.length,
      aiMessages: aiMessages.length,
      avgMessageLength: messages.length > 0 ? totalLength / messages.length : 0,
      totalSessions: sessions.size,
      avgMessagesPerSession: sessions.size > 0 ? messages.length / sessions.size : 0,
      oldestMessage,
      newestMessage,
    };
  }, [messages, enableStats]);

  /**
   * 搜索索引更新
   */
  const updateSearchIndex = useCallback(() => {
    if (!enableSearch) return;

    searchIndexRef.current.clear();

    messages.forEach(message => {
      const content =
        typeof message.content === 'string'
          ? message.content.toLowerCase()
          : JSON.stringify(message.content).toLowerCase();

      // 簡單的分詞索引
      const words = content.split(/\s+/);
      words.forEach(word => {
        if (word.length > 2) {
          // 忽略太短的詞
          const existing = searchIndexRef.current.get(word) || [];
          if (!existing.find(msg => msg.id === message.id)) {
            existing.push(message);
            searchIndexRef.current.set(word, existing);
          }
        }
      });
    });
  }, [messages, enableSearch]);

  // 更新搜索索引
  useEffect(() => {
    updateSearchIndex();
  }, [updateSearchIndex]);

  // === 核心方法 ===

  /**
   * 設置篩選條件
   */
  const setFilter = useCallback((newFilter: Partial<MessageFilterOptions>) => {
    setFilterState(prev => ({ ...prev, ...newFilter }));
    setPaginationState(prev => ({ ...prev, page: 1 })); // 重置到第一頁
  }, []);

  /**
   * 清除篩選條件
   */
  const clearFilter = useCallback(() => {
    setFilterState({});
    setPaginationState(prev => ({ ...prev, page: 1 }));
  }, []);

  /**
   * 搜索訊息
   */
  const searchMessages = useCallback(
    (term: string): ChatMessage[] => {
      if (!enableSearch || !term.trim()) return [];

      const results: ChatMessage[] = [];
      const added = new Set<string>();

      // 使用搜索索引快速查找
      const words = term.toLowerCase().split(/\s+/);
      words.forEach(word => {
        const indexResults = searchIndexRef.current.get(word) || [];
        indexResults.forEach(msg => {
          if (!added.has(msg.id)) {
            results.push(msg);
            added.add(msg.id);
          }
        });
      });

      // 按相關性排序
      results.sort((a, b) => calculateRelevanceScore(b, term) - calculateRelevanceScore(a, term));

      return results;
    },
    [enableSearch, calculateRelevanceScore]
  );

  /**
   * 添加訊息
   */
  const addMessage = useCallback(
    (message: ChatMessage) => {
      setMessages(prev => {
        const newMessages = [...prev, message];

        // 檢查最大歷史大小
        if (newMessages.length > maxHistorySize) {
          return newMessages.slice(-maxHistorySize);
        }

        return newMessages;
      });

      // 同步到全局歷史（如果是用戶消息）
      if (message.type === 'user' && typeof message.content === 'string') {
        addToHistory(message.content);
      }
    },
    [maxHistorySize, addToHistory]
  );

  /**
   * 批量添加訊息
   */
  const addMessages = useCallback(
    (newMessages: ChatMessage[]) => {
      setMessages(prev => {
        const combined = [...prev, ...newMessages];

        // 檢查最大歷史大小
        if (combined.length > maxHistorySize) {
          return combined.slice(-maxHistorySize);
        }

        return combined;
      });

      // 同步用戶消息到全局歷史
      newMessages
        .filter(msg => msg.type === 'user' && typeof msg.content === 'string')
        .forEach(msg => addToHistory(msg.content as string));
    },
    [maxHistorySize, addToHistory]
  );

  /**
   * 更新訊息
   */
  const updateMessage = useCallback((id: string, updates: Partial<ChatMessage>) => {
    setMessages(prev => prev.map(msg => (msg.id === id ? { ...msg, ...updates } : msg)));
  }, []);

  /**
   * 刪除訊息
   */
  const removeMessage = useCallback(
    (id: string) => {
      setMessages(prev => prev.filter(msg => msg.id !== id));
      starredMessages.delete(id);
      messageTags.delete(id);
    },
    [starredMessages, messageTags]
  );

  /**
   * 批量刪除訊息
   */
  const removeMessages = useCallback(
    (ids: string[]) => {
      const idSet = new Set(ids);
      setMessages(prev => prev.filter(msg => !idSet.has(msg.id)));
      ids.forEach(id => {
        starredMessages.delete(id);
        messageTags.delete(id);
      });
    },
    [starredMessages, messageTags]
  );

  /**
   * 清空訊息
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    starredMessages.clear();
    messageTags.clear();
  }, [starredMessages, messageTags]);

  /**
   * 標記/取消標記訊息
   */
  const starMessage = useCallback(
    (id: string) => {
      starredMessages.add(id);
    },
    [starredMessages]
  );

  const unstarMessage = useCallback(
    (id: string) => {
      starredMessages.delete(id);
    },
    [starredMessages]
  );

  /**
   * 為訊息添加標籤
   */
  const tagMessage = useCallback(
    (id: string, tags: string[]) => {
      messageTags.set(id, tags);
    },
    [messageTags]
  );

  /**
   * 查找訊息
   */
  const findMessage = useCallback(
    (id: string): ChatMessage | undefined => {
      return messages.find(msg => msg.id === id);
    },
    [messages]
  );

  /**
   * 獲取特定會話的訊息
   */
  const getSessionMessages = useCallback(
    (targetSessionId: string): ChatMessage[] => {
      return messages.filter(msg => (msg as any).sessionId === targetSessionId);
    },
    [messages]
  );

  /**
   * 獲取可用的會話ID列表
   */
  const getAvailableSessions = useCallback((): string[] => {
    const sessions = new Set<string>();
    messages.forEach(msg => {
      const sessionId = (msg as any).sessionId;
      if (sessionId) {
        sessions.add(sessionId);
      }
    });
    return Array.from(sessions);
  }, [messages]);

  /**
   * 清除特定會話的訊息
   */
  const clearSession = useCallback((targetSessionId: string) => {
    setMessages(prev => prev.filter(msg => (msg as any).sessionId !== targetSessionId));
  }, []);

  /**
   * 導出訊息
   */
  const exportMessages = useCallback(
    (format: 'json' | 'csv' = 'json'): string => {
      if (format === 'json') {
        return JSON.stringify(
          {
            messages: paginatedMessages,
            exportedAt: new Date().toISOString(),
            stats,
          },
          null,
          2
        );
      } else {
        // CSV 格式
        const headers = ['ID', 'Type', 'Role', 'Content', 'Timestamp'];
        const rows = paginatedMessages.map(msg => [
          msg.id,
          msg.type,
          msg.role,
          typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
          msg.timestamp,
        ]);

        return [headers, ...rows]
          .map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
          .join('\n');
      }
    },
    [paginatedMessages, stats]
  );

  /**
   * 導入訊息
   */
  const importMessages = useCallback(
    (data: string, format: 'json' | 'csv' = 'json'): boolean => {
      try {
        if (format === 'json') {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed.messages)) {
            addMessages(parsed.messages);
            return true;
          }
        } else {
          // CSV 解析 (簡化實現)
          const lines = data.split('\n');
          if (lines.length < 2) return false;

          const messages = lines
            .slice(1)
            .map(line => {
              const cells = line
                .split(',')
                .map(cell => cell.replace(/^"(.*)"$/, '$1').replace(/""/g, '"'));
              return {
                id: cells[0],
                type: cells[1] as 'user' | 'ai',
                role: cells[2] as 'user' | 'assistant',
                content: cells[3],
                timestamp: cells[4],
              };
            })
            .filter(msg => msg.id);

          if (messages.length > 0) {
            addMessages(messages as ChatMessage[]);
            return true;
          }
        }
        return false;
      } catch {
        return false;
      }
    },
    [addMessages]
  );

  /**
   * 分頁控制
   */
  const setPagination = useCallback((newPagination: Partial<MessagePaginationOptions>) => {
    setPaginationState(prev => ({ ...prev, ...newPagination }));
  }, []);

  const nextPage = useCallback(() => {
    if (paginationInfo.hasNextPage) {
      setPaginationState(prev => ({ ...prev, page: (prev.page || 1) + 1 }));
    }
  }, [paginationInfo.hasNextPage]);

  const previousPage = useCallback(() => {
    if (paginationInfo.hasPreviousPage) {
      setPaginationState(prev => ({ ...prev, page: Math.max(1, (prev.page || 1) - 1) }));
    }
  }, [paginationInfo.hasPreviousPage]);

  /**
   * 刷新統計
   */
  const refreshStats = useCallback(() => {
    // 統計信息會自動通過 useMemo 重新計算
    // 這個方法可以用來觸發強制更新或清理快取
  }, []);

  /**
   * 記憶體優化
   */
  const optimizeMemory = useCallback(() => {
    // 清理搜索索引
    searchIndexRef.current.clear();

    // 重新構建索引
    updateSearchIndex();

    // 清理過期的訊息標記
    const existingIds = new Set(messages.map(msg => msg.id));
    Array.from(starredMessages).forEach(id => {
      if (!existingIds.has(id)) {
        starredMessages.delete(id);
      }
    });

    Array.from(messageTags.keys()).forEach(id => {
      if (!existingIds.has(id)) {
        messageTags.delete(id);
      }
    });
  }, [messages, starredMessages, messageTags, updateSearchIndex]);

  /**
   * 自動清理過期訊息
   */
  const performAutoCleanup = useCallback(() => {
    if (!autoCleanup) return;

    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - cleanupInterval);

    const validMessages = messages.filter(msg => new Date(msg.timestamp) > cutoffTime);

    if (validMessages.length !== messages.length) {
      setMessages(validMessages);
    }
  }, [autoCleanup, cleanupInterval, messages]);

  /**
   * 清理方法
   */
  const cleanup = useCallback(() => {
    if (cleanupTimerRef.current) {
      clearInterval(cleanupTimerRef.current);
      cleanupTimerRef.current = null;
    }

    searchIndexRef.current.clear();
    starredMessages.clear();
    messageTags.clear();
  }, [starredMessages, messageTags]);

  // === 副作用管理 ===

  // 設置自動清理定時器
  useEffect(() => {
    if (autoCleanup && cleanupInterval > 0) {
      cleanupTimerRef.current = setInterval(
        performAutoCleanup,
        cleanupInterval * 60 * 1000 // 轉換為毫秒
      );

      return () => {
        if (cleanupTimerRef.current) {
          clearInterval(cleanupTimerRef.current);
          cleanupTimerRef.current = null;
        }
      };
    }
  }, [autoCleanup, cleanupInterval, performAutoCleanup]);

  // 組件卸載時清理
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // === 返回介面 ===
  return {
    // === 核心數據 ===
    messages: paginatedMessages,
    filteredMessages: sortedMessages,
    totalCount: filteredMessages.length,

    // === 篩選和搜索 ===
    filter,
    setFilter,
    clearFilter,
    searchMessages,

    // === 排序 ===
    sortOptions,
    setSortOptions,

    // === 分頁 ===
    pagination: paginationInfo,
    setPagination,
    nextPage,
    previousPage,

    // === 訊息管理 ===
    addMessage,
    addMessages,
    updateMessage,
    removeMessage,
    removeMessages,
    clearMessages,

    // === 訊息操作 ===
    starMessage,
    unstarMessage,
    tagMessage,
    findMessage,

    // === 會話管理 ===
    getSessionMessages,
    getAvailableSessions,
    clearSession,

    // === 導入導出 ===
    exportMessages,
    importMessages,

    // === 統計信息 ===
    stats,
    refreshStats,

    // === 工具方法 ===
    cleanup,
    optimizeMemory,
    isLoading,
  };
};
