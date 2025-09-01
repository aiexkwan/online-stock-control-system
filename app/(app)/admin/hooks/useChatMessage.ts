/**
 * Chat Message Hook - 集中管理聊天消息的狀態和操作
 *
 * 採用 React Query + Zustand 模式：
 * - 使用 React Query 處理 API 調用
 * - 使用 Zustand 管理本地狀態
 *
 * 職責分離：
 * - 消息發送邏輯
 * - 狀態管理
 * - 副作用處理
 */

import { useState, useCallback, useRef } from 'react';
import type { ChatMessage } from '../types/ai-response';
import { sendChatMessage, handleStandardResponse, type ChatRequest } from '../services/chatService';
import {
  processStreamResponse,
  createStreamingMessage,
  updateStreamingMessage,
} from '../utils/streamProcessor';
import { handleChatError } from '../utils/errorHandler';

export interface UseChatMessageOptions {
  sessionId: string;
  useStreaming: boolean;
  onMessageAdded?: (message: ChatMessage) => void;
}

export interface UseChatMessageReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  sendMessage: (question: string) => Promise<void>;
  addMessage: (message: ChatMessage) => void;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

/**
 * 聊天消息管理Hook
 */
export const useChatMessage = (options: UseChatMessageOptions): UseChatMessageReturn => {
  const { sessionId, useStreaming, onMessageAdded } = options;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      type: 'ai',
      content:
        'Hello! I can help you query the database. Ask me anything about your inventory, orders, or stock levels.',
      timestamp: new Date().toISOString(),
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * 添加消息到列表
   */
  const addMessage = useCallback(
    (message: ChatMessage) => {
      setMessages(prev => {
        const newMessages = [...prev, message];
        onMessageAdded?.(message);
        return newMessages;
      });
    },
    [onMessageAdded]
  );

  /**
   * 創建用戶消息
   */
  const createUserMessage = useCallback(
    (content: string): ChatMessage => ({
      id: `user_${Date.now()}`,
      role: 'user',
      type: 'user',
      content,
      timestamp: new Date().toISOString(),
    }),
    []
  );

  /**
   * 創建AI消息
   */
  const createAIMessage = useCallback(
    (content: string): ChatMessage => ({
      id: `ai_${Date.now()}`,
      role: 'assistant',
      type: 'ai',
      content,
      timestamp: new Date().toISOString(),
    }),
    []
  );

  /**
   * 處理串流響應
   */
  const handleStreamingResponse = useCallback(
    async (response: Response, streamingMessageId: string): Promise<void> => {
      // 添加占位符消息
      const placeholderMessage = createStreamingMessage(streamingMessageId);
      setMessages(prev => [...prev, placeholderMessage]);

      await processStreamResponse(response, {
        onChunkReceived: accumulatedContent => {
          setMessages(prev => updateStreamingMessage(prev, streamingMessageId, accumulatedContent));
        },
        onComplete: finalContent => {
          setMessages(prev => updateStreamingMessage(prev, streamingMessageId, finalContent));
        },
        onCacheHit: level => {
          console.log(`Cache hit: ${level}`);
        },
        onError: error => {
          throw new Error(error);
        },
      });
    },
    []
  );

  /**
   * 處理標準響應
   */
  const handleStandardResponseFlow = useCallback(
    async (response: Response): Promise<void> => {
      const result = await handleStandardResponse(response);
      const aiMessage = createAIMessage(result.answer);
      addMessage(aiMessage);
    },
    [addMessage, createAIMessage]
  );

  /**
   * 發送消息主函數
   */
  const sendMessage = useCallback(
    async (question: string): Promise<void> => {
      if (!question.trim() || isLoading) return;

      // 取消之前的請求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsLoading(true);

      try {
        // 添加用戶消息
        const userMessage = createUserMessage(question);
        addMessage(userMessage);

        // 準備請求
        const request: ChatRequest = {
          question,
          sessionId,
          stream: useStreaming,
          features: {
            enableCache: true,
            enableOptimization: true,
            enableAnalysis: false,
          },
        };

        // 發送請求
        const response = await sendChatMessage(request);

        // 處理響應
        if (useStreaming) {
          const streamingMessageId = `ai_streaming_${Date.now()}`;
          await handleStreamingResponse(response, streamingMessageId);
        } else {
          await handleStandardResponseFlow(response);
        }
      } catch (error) {
        // 處理錯誤
        const errorMessage = handleChatError(error, {
          action: 'sendMessage',
          details: { question, useStreaming },
        });
        addMessage(errorMessage);
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [
      isLoading,
      sessionId,
      useStreaming,
      createUserMessage,
      addMessage,
      handleStreamingResponse,
      handleStandardResponseFlow,
    ]
  );

  return {
    messages,
    isLoading,
    sendMessage,
    addMessage,
    setMessages,
  };
};
