'use client';

import React, { useRef, useMemo, useEffect, useCallback } from 'react';
import { SpecialCard } from '@/lib/card-system/EnhancedGlassmorphicCard';
import { cn } from '@/lib/utils';
import { useAuthState } from '@/app/(auth)/main-login/context/AuthContext';
// 引入統一的狀態管理Hooks
import { useChatState } from '../hooks/useChatState';
import { useMessageHistory } from '../hooks/useMessageHistory';
import { useSuggestionState } from '../hooks/useSuggestionState';
import type { ChatbotCardProps } from '../types/ai-response';
// 引入性能監控工具
import { usePerformanceMonitor, useMemoryMonitor } from '../utils/performanceMonitor';
// 引入記憶體管理工具
import { useMemoryCleanup } from '../hooks/useMemoryCleanup';

// 導入新的組件
import { ChatHeader } from '../components/ChatHeader';
import { ChatMessages } from '../components/ChatMessages';
import { ChatInput } from '../components/ChatInput';
import { QuerySuggestions } from '../components/QuerySuggestions';
import MemoryDashboard from '../components/MemoryDashboard';

// 導入依賴注入相關
import {
  ServiceProvider,
  useSuggestionService,
  useMessageFormatter,
} from '../context/ServiceContext';

// Internal ChatbotCard Component with dependency injection
function ChatbotCardInternal({ className }: ChatbotCardProps) {
  const { user } = useAuthState();
  const inputRef = useRef<HTMLInputElement>(null);

  // 性能監控
  const { startRenderMeasure, endRenderMeasure } = usePerformanceMonitor('ChatbotCardInternal');
  useMemoryMonitor('ChatbotCardInternal');

  // 記憶體清理管理
  const memoryCleanup = useMemoryCleanup({
    componentName: 'ChatbotCardInternal',
    enableMonitoring: true,
    enableDebug: process.env.NODE_ENV === 'development',
  });

  // 開始渲染測量
  startRenderMeasure();

  // 使用統一的聊天狀態管理
  const chat = useChatState({
    sessionId: `session_${Date.now()}`,
    enableStreaming: true,
    enableCache: true,
    enableOptimization: true,
    autoSync: true,
    onError: error => {
      console.error('Chat error:', error);
      // 註冊錯誤清理
      memoryCleanup.registerCleanup(() => {
        // 清理錯誤狀態相關資源
      }, 'error-cleanup');
    },
    onMessageAdded: message => {
      console.log('Message added:', message.id);
    },
    onStreamingUpdate: (messageId, content) => {
      console.log('Streaming update:', messageId);
    },
  });

  // 使用訊息歷史管理
  const messageHistory = useMessageHistory({
    sessionId: chat.sessionId,
    enableSearch: true,
    enableStats: true,
    maxHistorySize: 1000,
  });

  // 使用建議狀態管理
  const suggestions = useSuggestionState({
    sessionId: chat.sessionId,
    enableAnalytics: true,
    onSuggestionUsed: suggestion => {
      console.log('Suggestion used:', suggestion.content);
    },
    onSuggestionGenerated: suggestions => {
      console.log('Generated suggestions:', suggestions.length);
    },
  });

  // 使用依賴注入的服務（保持兼容性）
  const suggestionService = useSuggestionService();
  const messageFormatter = useMessageFormatter();

  // 優化：生成上下文感知建議（使用統一的建議系統）
  const contextualSuggestions = useMemo(() => {
    // 只有當用戶消息實際變化時才重新計算
    const lastMessage = chat.messages.filter(m => m.type === 'user').pop();
    const lastMessageContent = lastMessage?.content || '';
    const categoryChanged = chat.selectedCategory;

    // 避免頻繁的建議生成
    if (!lastMessage && chat.messages.length === 0) {
      return [];
    }

    // 生成建議並轉換格式以保持兼容性
    suggestions.generateSuggestions({
      lastMessage,
      messageHistory: chat.messages,
      currentCategory: chat.selectedCategory,
    });

    // 轉換為字串數組以保持與QuerySuggestions組件的兼容性
    return suggestions.contextualSuggestions.map(suggestion => suggestion.content);
  }, [chat.messages, chat.selectedCategory, suggestions]);

  // 同步訊息到歷史管理
  useEffect(() => {
    if (chat.messages.length > 0) {
      const latestMessage = chat.messages[chat.messages.length - 1];
      messageHistory.addMessage(latestMessage);
    }
  }, [chat.messages, messageHistory]);

  /**
   * 優化：處理消息發送 - 使用統一狀態管理系統並優化性能
   */
  const handleSendMessage = useCallback(
    async (question?: string) => {
      const messageToSend = question || chat.input.trim();
      if (!messageToSend || chat.isLoading) return;

      try {
        // 使用統一的聊天狀態發送消息
        await chat.sendMessage(messageToSend, {
          streaming: chat.useStreaming,
          onSuccess: (responseContent, messageId) => {
            // 記錄建議使用（如果消息來自建議）
            if (question) {
              const usedSuggestion = suggestions.suggestions.find(s => s.content === question);
              if (usedSuggestion) {
                suggestions.recordSuggestionUsage(usedSuggestion.id);
              }
            }

            // 從用戶行為學習
            const userMessage = chat.messages.find(
              m => m.type === 'user' && m.content === messageToSend
            );
            if (userMessage) {
              suggestions.learnFromUserBehavior(userMessage);
            }
          },
          onError: error => {
            console.error('Message sending failed:', error);
          },
        });
      } catch (error) {
        console.error('Message sending failed:', error);
      }

      // 重新聚焦輸入框
      inputRef.current?.focus();
    },
    [chat, suggestions]
  );

  // 優化：重試回調函數
  const handleRetry = useCallback(() => {
    if (chat.lastUserMessage && typeof chat.lastUserMessage.content === 'string') {
      handleSendMessage(chat.lastUserMessage.content);
    }
  }, [chat.lastUserMessage, handleSendMessage]);

  // 優化：類別選擇回調函數
  const handleCategorySelect = useCallback(
    (category: string | null) => {
      chat.setSelectedCategory(category);
    },
    [chat]
  );

  // 優化：建議顯示切換回調函數
  const handleToggleSuggestions = useCallback(() => {
    chat.setShowSuggestions(!chat.showSuggestions);
  }, [chat]);

  // 優化：串流切換回調函數
  const handleStreamingToggle = useCallback(() => {
    chat.toggleStreaming();
  }, [chat]);

  // 優化：輸入變更回調函數
  const handleInputChange = useCallback(
    (value: string) => {
      chat.setInput(value);
    },
    [chat]
  );

  // 註冊關鍵組件生命週期清理
  useEffect(() => {
    // 註冊聊天狀態清理
    memoryCleanup.registerCleanup(() => {
      chat.cleanup();
    }, 'chat-state-cleanup');

    // 註冊消息歷史清理
    memoryCleanup.registerCleanup(() => {
      // messageHistory 相關清理
    }, 'message-history-cleanup');

    // 註冊建議系統清理
    memoryCleanup.registerCleanup(() => {
      // suggestions 相關清理
    }, 'suggestions-cleanup');

    return () => {
      // 組件卸載時的額外清理
      chat.cleanup();
    };
  }, [chat, memoryCleanup]);

  // 完成渲染測量並記錄性能指標
  useEffect(() => {
    endRenderMeasure({
      className,
      messagesCount: chat.messages.length,
      isLoading: chat.isLoading,
      showSuggestions: chat.showSuggestions,
      selectedCategory: chat.selectedCategory,
      suggestionsCount: contextualSuggestions.length,
    });
  });

  return (
    <SpecialCard
      className={cn('flex h-full flex-col', className)}
      variant='glass'
      borderGlow='hover'
      padding='base'
    >
      {/* Header */}
      <ChatHeader useStreaming={chat.useStreaming} onStreamingToggle={handleStreamingToggle} />

      {/* Messages Container */}
      <ChatMessages messages={chat.messages} isLoading={chat.isLoading} onRetry={handleRetry} />

      {/* Query Suggestions */}
      <QuerySuggestions
        showSuggestions={chat.showSuggestions}
        messageCount={chat.messages.length}
        recentQueries={chat.recentQueries}
        contextualSuggestions={contextualSuggestions}
        selectedCategory={chat.selectedCategory}
        onCategorySelect={handleCategorySelect}
        onToggleSuggestions={handleToggleSuggestions}
        onSendMessage={handleSendMessage}
      />

      {/* Input Area */}
      <ChatInput
        value={chat.input}
        onChange={handleInputChange}
        onSend={handleSendMessage}
        disabled={chat.isLoading}
        isLoading={chat.isLoading}
        autoFocus={false}
      />
    </SpecialCard>
  );
}

// Main ChatbotCard Component with Service Provider wrapper
export default function ChatbotCard(props: ChatbotCardProps) {
  return (
    <>
      <ServiceProvider
        config={{
          environment: process.env.NODE_ENV === 'development' ? 'development' : 'production',
          enableMocking: process.env.NODE_ENV === 'test',
          logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
        }}
        enableDevTools={process.env.NODE_ENV === 'development'}
        onError={error => {
          console.error('Service error in ChatbotCard:', error);
        }}
        onServiceRecovery={serviceName => {
          console.log(`Service ${serviceName} recovered in ChatbotCard`);
        }}
      >
        <ChatbotCardInternal {...props} />
      </ServiceProvider>

      {/* 開發環境記憶體監控儀表板 */}
      <MemoryDashboard visible={process.env.NODE_ENV === 'development'} position='bottom-right' />
    </>
  );
}
