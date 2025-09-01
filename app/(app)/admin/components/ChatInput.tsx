'use client';

import React, { useRef, memo, useCallback, useMemo } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePerformanceMonitor } from '../utils/performanceMonitor';
import { useMemoryCleanup } from '../hooks/useMemoryCleanup';

export interface ChatInputProps {
  /** 輸入框的值 */
  value: string;
  /** 值變更回調 */
  onChange: (value: string) => void;
  /** 發送消息回調 */
  onSend: (message?: string) => void;
  /** 是否禁用（載入中） */
  disabled?: boolean;
  /** 是否正在載入 */
  isLoading?: boolean;
  /** 佔位符文字 */
  placeholder?: string;
  /** 自定義className */
  className?: string;
  /** 自動聚焦 */
  autoFocus?: boolean;
}

/**
 * 優化的 ChatInput 組件 - 聊天輸入框
 *
 * 職責：
 * - 高效處理用戶輸入和驗證（使用 React.memo 和 useCallback）
 * - 提供快捷鍵支援 (Enter發送)
 * - 管理輸入框狀態和聚焦
 * - 顯示載入狀態
 * - 維持響應式設計
 * - 優化事件處理器性能
 */
export const ChatInput: React.FC<ChatInputProps> = memo(
  ({
    value,
    onChange,
    onSend,
    disabled = false,
    isLoading = false,
    placeholder = 'Ask a question about your data...',
    className,
    autoFocus = false,
  }) => {
    const { endRenderMeasure } = usePerformanceMonitor('ChatInput');
    const inputRef = useRef<HTMLInputElement>(null);

    // 記憶體清理管理
    const memoryCleanup = useMemoryCleanup({
      componentName: 'ChatInput',
      enableMonitoring: true,
      enableDebug: process.env.NODE_ENV === 'development',
    });

    // 優化：使用 useCallback 避免重新創建事件處理器
    const handleKeyPress = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          if (value.trim() && !disabled) {
            onSend();
          }
        }
      },
      [value, disabled, onSend]
    );

    const handleSendClick = useCallback(() => {
      if (value.trim() && !disabled) {
        onSend();
      }
    }, [value, disabled, onSend]);

    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
      },
      [onChange]
    );

    // 優化：使用 useMemo 緩存計算結果
    const computedStates = useMemo(
      () => ({
        isDisabled: disabled || isLoading,
        canSend: value.trim() && !(disabled || isLoading),
        hasValue: Boolean(value.trim()),
      }),
      [disabled, isLoading, value]
    );

    // 記錄渲染性能
    React.useEffect(() => {
      endRenderMeasure({
        value: value.length,
        disabled,
        isLoading,
        autoFocus,
        canSend: computedStates.canSend,
        className,
      });
    });

    return (
      <div className={cn('mt-4 flex gap-2', className)}>
        <input
          ref={inputRef}
          type='text'
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          placeholder={placeholder}
          disabled={computedStates.isDisabled}
          autoFocus={autoFocus}
          className='flex-1 rounded-lg bg-white/10 px-4 py-2 text-sm text-white placeholder-slate-400 outline-none backdrop-blur-sm transition-colors focus:bg-white/20 disabled:opacity-50'
        />
        <button
          onClick={handleSendClick}
          disabled={!computedStates.canSend}
          className='rounded-lg bg-purple-500/20 p-2 text-purple-400 transition-colors hover:bg-purple-500/30 disabled:opacity-50'
          title={computedStates.canSend ? 'Send message' : 'Enter a message to send'}
        >
          {isLoading ? <Loader2 className='h-5 w-5 animate-spin' /> : <Send className='h-5 w-5' />}
        </button>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // 自定義比較函數 - 避免不必要的重渲染
    return (
      prevProps.value === nextProps.value &&
      prevProps.disabled === nextProps.disabled &&
      prevProps.isLoading === nextProps.isLoading &&
      prevProps.placeholder === nextProps.placeholder &&
      prevProps.className === nextProps.className &&
      prevProps.autoFocus === nextProps.autoFocus &&
      prevProps.onChange === nextProps.onChange &&
      prevProps.onSend === nextProps.onSend
    );
  }
);

ChatInput.displayName = 'ChatInput';

export default ChatInput;
