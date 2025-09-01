/**
 * 統一聊天狀態管理 Hook - useChatState
 *
 * 職責：統一管理所有聊天相關狀態，整合三大狀態管理系統：
 * - useChatReducer: 本地複雜狀態管理
 * - chatGlobalStore: 全局共享狀態
 * - useChatQuery: 伺服器狀態優化
 *
 * 設計理念：
 * - 統一狀態訪問介面，簡化組件邏輯
 * - 協調各個狀態管理系統間的同步
 * - 提供清晰的狀態更新和訪問方法
 * - 支援性能優化和記憶體管理
 */

import { useEffect, useCallback, useMemo, useRef } from 'react';
import { useChatReducer, type UseChatReducerReturn } from './useChatReducer';
import { useChatQuery, type UseChatQueryOptions } from './useChatQuery';
import {
  useChatGlobalStore,
  useChatPreferences,
  useChatHistory,
  useChatStats,
} from '../stores/chatGlobalStore';
import { useMemoryCleanup } from './useMemoryCleanup';
import type { ChatMessage } from '../types/ai-response';

// 統一聊天狀態選項
export interface UseChatStateOptions {
  sessionId?: string;
  initialMessages?: ChatMessage[];
  enableStreaming?: boolean;
  enableCache?: boolean;
  enableOptimization?: boolean;
  autoSync?: boolean; // 是否自動同步狀態
  onError?: (error: Error) => void;
  onMessageAdded?: (message: ChatMessage) => void;
  onStreamingUpdate?: (messageId: string, content: string) => void;
}

// 統一聊天狀態返回值
export interface UseChatStateReturn {
  // === 核心狀態 ===
  // 本地狀態 (來自 useChatReducer)
  messages: ChatMessage[];
  input: string;
  isLoading: boolean;
  error: string | null;
  showSuggestions: boolean;
  selectedCategory: string | null;
  sessionId: string;
  lastUserMessage: ChatMessage | null;

  // 全局偏好 (來自 chatGlobalStore)
  useStreaming: boolean;
  preferences: ReturnType<typeof useChatPreferences>;

  // 查詢歷史 (來自 chatGlobalStore)
  recentQueries: string[];

  // === 狀態更新方法 ===
  // 輸入管理
  setInput: (value: string) => void;
  clearInput: () => void;

  // UI 狀態管理
  setShowSuggestions: (show: boolean) => void;
  toggleSuggestions: () => void;
  setSelectedCategory: (category: string | null) => void;

  // 訊息管理
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, content: any) => void;
  setMessages: (messages: ChatMessage[]) => void;

  // 全局偏好管理
  toggleStreaming: () => void;
  updatePreferences: (updates: any) => void;

  // 查詢歷史管理
  addToHistory: (query: string) => void;
  clearHistory: () => void;

  // === 行為方法 ===
  // 消息發送
  sendMessage: (question?: string, options?: any) => Promise<string>;

  // 會話管理
  resetSession: (newSessionId?: string) => void;

  // 錯誤處理
  clearError: () => void;
  retryLastRequest: () => void;

  // === 工具方法 ===
  // 狀態同步
  syncState: () => void;
  isStateReady: boolean;

  // 性能工具
  cleanup: () => void;

  // === 原始Hook訪問 (高級使用) ===
  reducerHook: UseChatReducerReturn;
  queryHook: ReturnType<typeof useChatQuery>;
  globalStore: typeof useChatGlobalStore;
}

/**
 * 統一聊天狀態管理 Hook
 *
 * 此Hook整合了三個狀態管理系統，提供統一的狀態訪問介面：
 * 1. 本地複雜狀態 (useChatReducer)
 * 2. 全局共享狀態 (chatGlobalStore)
 * 3. 伺服器狀態優化 (useChatQuery)
 *
 * 使用範例：
 * ```typescript
 * const chat = useChatState({
 *   sessionId: 'my-session',
 *   enableStreaming: true,
 *   onMessageAdded: (message) => console.log('New message:', message)
 * });
 *
 * // 發送消息
 * await chat.sendMessage('Hello AI');
 *
 * // 管理UI狀態
 * chat.toggleSuggestions();
 * chat.setInput('New input');
 * ```
 */
export const useChatState = (options: UseChatStateOptions = {}): UseChatStateReturn => {
  const {
    sessionId: initialSessionId,
    initialMessages,
    enableStreaming = true,
    enableCache = true,
    enableOptimization = true,
    autoSync = true,
    onError,
    onMessageAdded,
    onStreamingUpdate,
  } = options;

  const sessionId = initialSessionId || `session_${Date.now()}`;
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 記憶體清理管理
  const memoryCleanup = useMemoryCleanup({
    componentName: 'useChatState',
    enableMonitoring: enableOptimization,
    enableDebug: process.env.NODE_ENV === 'development',
  });

  // === 整合三大狀態管理系統 ===

  // 1. 本地複雜狀態管理 (useChatReducer)
  const reducerHook = useChatReducer({
    sessionId,
    initialMessages,
  });

  // 2. 全局共享狀態 (chatGlobalStore)
  const preferences = useChatPreferences();
  const { addToHistory, clearHistory, getRecentHistory } = useChatHistory();
  const { updatePreferences, toggleStreaming } = useChatGlobalStore();

  // 3. 伺服器狀態優化 (useChatQuery)
  const queryOptions: UseChatQueryOptions = useMemo(
    () => ({
      sessionId,
      useStreaming: preferences.useStreaming,
      enableCache,
      enableOptimization,
      onMessageAdded: message => {
        reducerHook.addMessage(message);
        onMessageAdded?.(message);
      },
      onStreamingUpdate: (messageId, content) => {
        reducerHook.updateMessage(messageId, content);
        onStreamingUpdate?.(messageId, content);
      },
      onError: error => {
        reducerHook.setError(error.message);
        onError?.(error);
      },
    }),
    [
      sessionId,
      preferences.useStreaming,
      enableCache,
      enableOptimization,
      reducerHook,
      onMessageAdded,
      onStreamingUpdate,
      onError,
    ]
  );

  const queryHook = useChatQuery(queryOptions);

  // === 狀態同步邏輯 ===

  /**
   * 同步各個狀態管理系統的狀態
   */
  const syncState = useCallback(() => {
    // 同步 loading 狀態
    if (reducerHook.state.isLoading !== queryHook.isLoading) {
      reducerHook.setLoading(queryHook.isLoading);
    }

    // 同步錯誤狀態
    if (queryHook.isError && queryHook.error && !reducerHook.state.error) {
      reducerHook.setError(queryHook.error.message);
    }

    // 清除已解決的錯誤
    if (!queryHook.isError && reducerHook.state.error) {
      reducerHook.clearError();
    }
  }, [reducerHook, queryHook.isLoading, queryHook.isError, queryHook.error]);

  // 自動狀態同步
  useEffect(() => {
    if (autoSync) {
      syncState();
    }
  }, [autoSync, syncState]);

  // 定期狀態同步 (可選) - 使用記憶體清理管理定時器
  useEffect(() => {
    if (autoSync) {
      const timer = memoryCleanup.createTimer(
        () => {
          syncState();
        },
        1000,
        'interval'
      );

      // 定時器會自動由 memoryCleanup 管理清理
    }
  }, [autoSync, syncState, memoryCleanup]);

  // === 增強的業務邏輯方法 ===

  /**
   * 增強的發送消息方法
   * 整合了所有狀態管理系統的邏輯
   */
  const sendMessage = useCallback(
    async (question?: string, options: any = {}): Promise<string> => {
      const messageToSend = question || reducerHook.state.input.trim();
      if (!messageToSend || reducerHook.state.isLoading) {
        return '';
      }

      // 創建並添加用戶消息
      const userMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        role: 'user' as const,
        type: 'user' as const,
        content: messageToSend,
        timestamp: new Date().toISOString(),
      };

      // 更新本地狀態
      reducerHook.addMessage(userMessage);
      reducerHook.clearInput();
      reducerHook.setShowSuggestions(false);

      // 添加到全局歷史
      addToHistory(messageToSend);

      try {
        // 使用統一的查詢Hook發送消息
        const response = await queryHook.sendMessage(messageToSend, {
          streaming: preferences.useStreaming,
          onSuccess: (responseContent, messageId) => {
            // AI回應消息會通過 queryHook 的回調自動添加
          },
          onError: error => {
            reducerHook.setError(error.message);
            onError?.(error);
          },
          ...options,
        });

        return response;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        reducerHook.setError(errorMessage);
        throw error;
      }
    },
    [reducerHook, addToHistory, queryHook, preferences.useStreaming, onError]
  );

  /**
   * 增強的會話重置方法
   */
  const resetSession = useCallback(
    (newSessionId?: string) => {
      // 重置本地狀態
      reducerHook.resetSession(newSessionId);

      // 清理查詢快取
      queryHook.cleanup();

      // 觸發狀態同步
      if (autoSync) {
        setTimeout(syncState, 0);
      }
    },
    [reducerHook, queryHook, autoSync, syncState]
  );

  /**
   * 統一的清理方法 - 整合記憶體清理管理
   */
  const cleanup = useCallback(() => {
    // 清理查詢
    queryHook.cleanup();

    // 使用記憶體清理管理器清理所有資源
    memoryCleanup.cleanupNow();

    // 清理定期同步（備用清理，通常已被 memoryCleanup 處理）
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }

    // 清除錯誤狀態
    reducerHook.clearError();
  }, [queryHook, memoryCleanup, reducerHook]);

  // === 計算衍生狀態 ===

  // 獲取最近查詢記錄
  const recentQueries = useMemo(() => {
    return getRecentHistory(10);
  }, [getRecentHistory]);

  // 檢查狀態就緒狀態
  const isStateReady = useMemo(() => {
    return !queryHook.isLoading && !reducerHook.state.isLoading;
  }, [queryHook.isLoading, reducerHook.state.isLoading]);

  // === 清理副作用 ===
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // === 返回統一介面 ===
  return {
    // === 核心狀態 ===
    // 本地狀態
    messages: reducerHook.state.messages,
    input: reducerHook.state.input,
    isLoading: reducerHook.state.isLoading,
    error: reducerHook.state.error,
    showSuggestions: reducerHook.state.showSuggestions,
    selectedCategory: reducerHook.state.selectedCategory,
    sessionId: reducerHook.state.sessionId,
    lastUserMessage: reducerHook.state.lastUserMessage,

    // 全局狀態
    useStreaming: preferences.useStreaming,
    preferences,

    // 查詢歷史
    recentQueries,

    // === 狀態更新方法 ===
    // 輸入管理
    setInput: reducerHook.setInput,
    clearInput: reducerHook.clearInput,

    // UI 狀態管理
    setShowSuggestions: reducerHook.setShowSuggestions,
    toggleSuggestions: reducerHook.toggleSuggestions,
    setSelectedCategory: reducerHook.setSelectedCategory,

    // 訊息管理
    addMessage: reducerHook.addMessage,
    updateMessage: reducerHook.updateMessage,
    setMessages: reducerHook.setMessages,

    // 全局偏好管理
    toggleStreaming,
    updatePreferences,

    // 查詢歷史管理
    addToHistory,
    clearHistory,

    // === 行為方法 ===
    sendMessage,
    resetSession,

    // 錯誤處理
    clearError: reducerHook.clearError,
    retryLastRequest: queryHook.retryLastRequest,

    // === 工具方法 ===
    syncState,
    isStateReady,
    cleanup,

    // === 原始Hook訪問 ===
    reducerHook,
    queryHook,
    globalStore: useChatGlobalStore,
  };
};

/**
 * 輕量級聊天狀態 Hook
 * 僅包含基本狀態，適合簡單場景
 */
export const useChatStateLite = (sessionId?: string) => {
  const fullState = useChatState({
    sessionId,
    enableCache: false,
    enableOptimization: false,
    autoSync: false,
  });

  return {
    messages: fullState.messages,
    input: fullState.input,
    isLoading: fullState.isLoading,
    error: fullState.error,
    setInput: fullState.setInput,
    sendMessage: fullState.sendMessage,
    clearError: fullState.clearError,
  };
};
