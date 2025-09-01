/**
 * Chat Query Hook - 使用 React Query 優化聊天API調用
 *
 * 採用 React Query 優化伺服器狀態管理：
 * - 改善串流處理和快取策略
 * - 實現智能重複請求去重
 * - 優化查詢無效化邏輯
 *
 * 職責分離：
 * - API調用管理
 * - 快取策略控制
 * - 錯誤處理和重試
 * - 背景更新和同步
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';
import { sendChatMessage, type ChatRequest, handleStandardResponse } from '../services/chatService';
import {
  processStreamResponse,
  createStreamingMessage,
  updateStreamingMessage,
} from '../utils/streamProcessor';
import { handleChatError } from '../utils/errorHandler';
import { useChatGlobalStore, useChatCache, useChatStats } from '../stores/chatGlobalStore';
import type { ChatMessage } from '../types/ai-response';

// Query Keys 常數
export const CHAT_QUERY_KEYS = {
  messages: (sessionId: string) => ['chat', 'messages', sessionId] as const,
  history: ['chat', 'history'] as const,
  suggestions: (context: string) => ['chat', 'suggestions', context] as const,
  cache: ['chat', 'cache'] as const,
} as const;

// 聊天查詢選項
export interface UseChatQueryOptions {
  sessionId: string;
  useStreaming?: boolean;
  enableCache?: boolean;
  enableOptimization?: boolean;
  onMessageAdded?: (message: ChatMessage) => void;
  onStreamingUpdate?: (messageId: string, content: string) => void;
  onError?: (error: Error) => void;
}

// 發送消息的輸入參數
export interface SendMessageInput {
  question: string;
  sessionId: string;
  useStreaming: boolean;
  features?: {
    enableCache?: boolean;
    enableOptimization?: boolean;
    enableAnalysis?: boolean;
  };
}

// 發送消息的響應類型
export interface SendMessageResponse {
  messageId: string;
  response: Response;
  cached: boolean;
  cacheLevel?: 'L1' | 'L2' | 'L3';
  responseTime: number;
}

/**
 * Chat Query Hook - React Query優化版聊天功能
 */
export const useChatQuery = (options: UseChatQueryOptions) => {
  const {
    sessionId,
    useStreaming = true,
    enableCache = true,
    enableOptimization = true,
    onMessageAdded,
    onStreamingUpdate,
    onError,
  } = options;

  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);

  // 全局狀態
  const { getCachedQuery, addToCache } = useChatCache();
  const { incrementQueryCount } = useChatStats();

  /**
   * 發送聊天消息的 Mutation
   */
  const sendMessageMutation = useMutation<SendMessageResponse, Error, SendMessageInput>({
    mutationFn: async (input): Promise<SendMessageResponse> => {
      const startTime = Date.now();

      // 取消之前的請求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      // 檢查快取
      let cachedResult = null;
      if (enableCache) {
        cachedResult = getCachedQuery(input.question);
        if (cachedResult) {
          // 模擬Response物件以保持介面一致性
          const mockResponse = new Response(cachedResult.response, {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });

          const responseTime = Date.now() - startTime;
          return {
            messageId: `cached_${Date.now()}`,
            response: mockResponse,
            cached: true,
            cacheLevel: cachedResult.cacheLevel,
            responseTime,
          };
        }
      }

      // 準備請求
      const request: ChatRequest = {
        question: input.question,
        sessionId: input.sessionId,
        stream: input.useStreaming,
        features: {
          enableCache: enableCache,
          enableOptimization: enableOptimization,
          enableAnalysis: false,
          ...input.features,
        },
      };

      // 發送請求
      const response = await sendChatMessage(request);
      const responseTime = Date.now() - startTime;

      return {
        messageId: `msg_${Date.now()}`,
        response,
        cached: false,
        responseTime,
      };
    },

    onSuccess: (data, variables) => {
      // 更新統計
      incrementQueryCount(true, data.responseTime);

      // 如果不是快取結果，添加到快取
      if (!data.cached && enableCache) {
        // 這裡需要根據實際響應內容決定如何快取
        // 暫時跳過，會在處理響應後再快取
      }

      // 使查詢快取失效以觸發重新獲取
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.messages(variables.sessionId),
      });
    },

    onError: (error, variables) => {
      // 更新統計
      incrementQueryCount(false);

      // 調用錯誤處理
      onError?.(error);

      console.error('Chat message failed:', error);
    },

    // React Query 選項
    retry: (failureCount, error) => {
      // 對於網路錯誤重試最多2次
      if (error.name === 'AbortError') return false;
      return failureCount < 2;
    },

    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  /**
   * 查詢聊天歷史的 Query
   */
  const chatHistoryQuery = useQuery({
    queryKey: CHAT_QUERY_KEYS.history,
    queryFn: async () => {
      const { getRecentHistory } = useChatGlobalStore.getState();
      return getRecentHistory(20);
    },
    staleTime: 5 * 60 * 1000, // 5分鐘
    gcTime: 10 * 60 * 1000, // 10分鐘
    refetchOnWindowFocus: false,
  });

  /**
   * 處理串流響應
   */
  const processStreamingResponse = useCallback(
    async (response: Response, messageId: string, originalQuestion: string): Promise<string> => {
      let finalContent = '';

      await processStreamResponse(response, {
        onChunkReceived: accumulatedContent => {
          finalContent = accumulatedContent;
          onStreamingUpdate?.(messageId, accumulatedContent);
        },
        onComplete: content => {
          finalContent = content;

          // 添加到快取
          if (enableCache) {
            addToCache({
              query: originalQuestion,
              response: content,
              cacheLevel: 'L1',
              responseTime: 0, // 會在外部設置
            });
          }
        },
        onCacheHit: level => {
          console.log(`Stream cache hit: ${level}`);
        },
        onError: error => {
          throw new Error(error);
        },
      });

      return finalContent;
    },
    [enableCache, addToCache, onStreamingUpdate]
  );

  /**
   * 處理標準響應
   */
  const processStandardResponse = useCallback(
    async (response: Response, originalQuestion: string): Promise<string> => {
      const result = await handleStandardResponse(response);

      // 添加到快取
      if (enableCache) {
        addToCache({
          query: originalQuestion,
          response: result.answer,
          cacheLevel: 'L1',
          responseTime: 0, // 會在外部設置
        });
      }

      return result.answer;
    },
    [enableCache, addToCache]
  );

  /**
   * 發送消息的便捷函數
   */
  const sendMessage = useCallback(
    async (
      question: string,
      options: {
        streaming?: boolean;
        onSuccess?: (response: string, messageId: string) => void;
        onError?: (error: Error) => void;
      } = {}
    ) => {
      const { streaming = useStreaming, onSuccess, onError: optionOnError } = options;

      try {
        const result = await sendMessageMutation.mutateAsync({
          question,
          sessionId,
          useStreaming: streaming,
          features: {
            enableCache,
            enableOptimization,
            enableAnalysis: false,
          },
        });

        let finalResponse: string;

        if (streaming) {
          finalResponse = await processStreamingResponse(
            result.response,
            result.messageId,
            question
          );
        } else {
          finalResponse = await processStandardResponse(result.response, question);
        }

        onSuccess?.(finalResponse, result.messageId);
        return finalResponse;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error('Unknown error');
        optionOnError?.(errorObj);
        throw errorObj;
      }
    },
    [
      sessionId,
      useStreaming,
      enableCache,
      enableOptimization,
      sendMessageMutation,
      processStreamingResponse,
      processStandardResponse,
    ]
  );

  /**
   * 預取建議
   */
  const prefetchSuggestions = useCallback(
    async (context: string) => {
      return queryClient.prefetchQuery({
        queryKey: CHAT_QUERY_KEYS.suggestions(context),
        queryFn: async () => {
          // 這裡可以實現建議預取邏輯
          // 暫時返回空數組
          return [];
        },
        staleTime: 2 * 60 * 1000, // 2分鐘
      });
    },
    [queryClient]
  );

  /**
   * 清理函數
   */
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * 重試上次失敗的請求
   */
  const retryLastRequest = useCallback(() => {
    sendMessageMutation.reset();
  }, [sendMessageMutation]);

  return {
    // 主要功能
    sendMessage,

    // React Query 狀態
    isLoading: sendMessageMutation.isPending,
    isError: sendMessageMutation.isError,
    error: sendMessageMutation.error,
    isSuccess: sendMessageMutation.isSuccess,

    // 歷史記錄
    chatHistory: chatHistoryQuery.data || [],
    isHistoryLoading: chatHistoryQuery.isLoading,

    // 工具函數
    cleanup,
    retryLastRequest,
    prefetchSuggestions,

    // React Query 物件（供高級使用）
    sendMessageMutation,
    chatHistoryQuery,
    queryClient,
  };
};

/**
 * 快取管理相關的 Hook
 */
export const useChatQueryCache = (sessionId: string) => {
  const queryClient = useQueryClient();

  const invalidateMessages = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: CHAT_QUERY_KEYS.messages(sessionId),
    });
  }, [queryClient, sessionId]);

  const prefetchMessages = useCallback(() => {
    return queryClient.prefetchQuery({
      queryKey: CHAT_QUERY_KEYS.messages(sessionId),
      queryFn: () => [],
      staleTime: 30000,
    });
  }, [queryClient, sessionId]);

  const clearCache = useCallback(() => {
    queryClient.removeQueries({
      queryKey: CHAT_QUERY_KEYS.messages(sessionId),
    });
  }, [queryClient, sessionId]);

  const getCachedData = useCallback(() => {
    return queryClient.getQueryData(CHAT_QUERY_KEYS.messages(sessionId));
  }, [queryClient, sessionId]);

  return {
    invalidateMessages,
    prefetchMessages,
    clearCache,
    getCachedData,
  };
};
