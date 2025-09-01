'use client';

import React, { useRef, useEffect, memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, Database, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cardTextStyles } from '@/lib/card-system/theme';
import type { ChatMessage } from '../types/ai-response';
import { AIResponseRenderer } from './AIResponseRenderer';
import { usePerformanceMonitor } from '../utils/performanceMonitor';
import { useMemoryCleanup } from '../hooks/useMemoryCleanup';

export interface ChatMessagesProps {
  /** 消息列表 */
  messages: ChatMessage[];
  /** 是否正在載入 */
  isLoading: boolean;
  /** 重試回調函數 */
  onRetry?: () => void;
  /** 自定義className */
  className?: string;
}

/**
 * 優化的聊天消息組件 - 使用 React.memo 防止不必要重渲染
 */
const ChatMessageComponent: React.FC<{
  message: ChatMessage;
  onRetry?: () => void;
}> = memo(
  ({ message, onRetry }) => {
    const { endRenderMeasure } = usePerformanceMonitor('ChatMessageComponent');
    const isUser = message.type === 'user';
    const isError = message.type === 'error';

    // 記錄渲染性能
    useEffect(() => {
      endRenderMeasure({
        messageId: message.id,
        messageType: message.type,
        isUser,
        isError,
        hasRetry: Boolean(onRetry),
      });
    });

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn('flex w-full gap-3', isUser ? 'justify-end' : 'justify-start')}
      >
        {!isUser && (
          <div className='flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20'>
            {isError ? (
              <AlertCircle className='h-4 w-4 text-red-400' />
            ) : (
              <Database className='h-4 w-4 text-purple-400' />
            )}
          </div>
        )}

        <div
          className={cn(
            'max-w-[70%] rounded-lg px-4 py-2',
            isUser
              ? 'bg-purple-500/20 text-white'
              : isError
                ? 'bg-red-500/10 text-red-400'
                : 'bg-slate-800/50 text-slate-200'
          )}
        >
          <div className={cn(cardTextStyles.body)}>
            <AIResponseRenderer content={message.content} onRetry={onRetry} />
          </div>
        </div>

        {isUser && (
          <div className='flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20'>
            <MessageCircle className='h-4 w-4 text-purple-400' />
          </div>
        )}
      </motion.div>
    );
  },
  (prevProps, nextProps) => {
    // 自定義比較函數 - 只有當實際相關的 props 改變時才重渲染
    return (
      prevProps.message.id === nextProps.message.id &&
      prevProps.message.content === nextProps.message.content &&
      prevProps.message.type === nextProps.message.type &&
      prevProps.message.timestamp === nextProps.message.timestamp &&
      prevProps.onRetry === nextProps.onRetry
    );
  }
);

ChatMessageComponent.displayName = 'ChatMessageComponent';

/**
 * 優化的 ChatMessages 組件 - 聊天消息列表
 *
 * 職責：
 * - 高效渲染所有聊天消息（使用 React.memo）
 * - 管理消息列表滾動（優化滾動性能）
 * - 處理載入狀態顯示
 * - 提供消息重試功能
 * - 維持 Framer Motion 動畫效果
 * - 支援大型消息列表（虛擬化準備）
 */
export const ChatMessages: React.FC<ChatMessagesProps> = memo(
  ({ messages, isLoading, onRetry, className }) => {
    const { endRenderMeasure } = usePerformanceMonitor('ChatMessages');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // 記憶體清理管理
    const memoryCleanup = useMemoryCleanup({
      componentName: 'ChatMessages',
      enableMonitoring: true,
      enableDebug: process.env.NODE_ENV === 'development',
    });

    // 優化：自動滾動到底部（使用 useCallback 避免重新創建）
    const scrollToBottom = useCallback(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    // 優化：只在消息真正變化時才滾動
    useEffect(() => {
      scrollToBottom();

      // 註冊滾動相關清理（如果有的話）
      memoryCleanup.registerCleanup(() => {
        // 清理任何滾動相關的事件或資源
      }, 'scroll-cleanup');
    }, [messages.length, scrollToBottom, memoryCleanup]); // 只依賴消息數量變化

    // 記錄渲染性能
    useEffect(() => {
      endRenderMeasure({
        messageCount: messages.length,
        isLoading,
        hasRetry: Boolean(onRetry),
        className,
      });
    });

    // 優化：計算是否需要虛擬化（超過100條消息時）
    const shouldVirtualize = messages.length > 100;

    // 如果消息太多，只顯示最近的消息（簡單的優化策略）
    const displayMessages = shouldVirtualize
      ? messages.slice(-50) // 只顯示最近50條消息
      : messages;

    return (
      <div
        ref={containerRef}
        className={cn(
          'flex-1 overflow-hidden rounded-lg bg-white/5 p-4 backdrop-blur-sm',
          className
        )}
      >
        <div className='h-full space-y-4 overflow-y-auto pr-2'>
          {shouldVirtualize && (
            <div className='py-2 text-center text-xs text-slate-500'>
              顯示最近 {displayMessages.length} 條消息（共 {messages.length} 條）
            </div>
          )}

          {displayMessages.map(message => (
            <ChatMessageComponent key={message.id} message={message} onRetry={onRetry} />
          ))}

          {isLoading && (
            <div className='flex items-center gap-2 text-sm text-slate-400'>
              <Loader2 className='h-4 w-4 animate-spin' />
              <span>Thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // 自定義比較函數 - 避免不必要的重渲染
    return (
      prevProps.messages.length === nextProps.messages.length &&
      prevProps.messages.every(
        (msg, index) =>
          msg.id === nextProps.messages[index]?.id &&
          msg.content === nextProps.messages[index]?.content &&
          msg.timestamp === nextProps.messages[index]?.timestamp
      ) &&
      prevProps.isLoading === nextProps.isLoading &&
      prevProps.onRetry === nextProps.onRetry &&
      prevProps.className === nextProps.className
    );
  }
);

ChatMessages.displayName = 'ChatMessages';

export default ChatMessages;
