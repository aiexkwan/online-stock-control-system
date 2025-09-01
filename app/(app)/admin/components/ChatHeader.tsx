'use client';

import React, { memo, useCallback } from 'react';
import { Brain, Database, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cardTextStyles } from '@/lib/card-system/theme';
import { usePerformanceMonitor } from '../utils/performanceMonitor';

export interface ChatHeaderProps {
  /** 是否啟用串流模式 */
  useStreaming: boolean;
  /** 串流模式變更回調 */
  onStreamingToggle: () => void;
  /** 自定義className */
  className?: string;
  /** 標題文字 */
  title?: string;
  /** 描述文字 */
  description?: string;
}

/**
 * 優化的 ChatHeader 組件 - 聊天界面頭部
 *
 * 職責：
 * - 高效顯示聊天界面標題和描述（使用 React.memo）
 * - 提供串流模式切換功能（優化事件處理）
 * - 顯示狀態指示器
 * - 保持 Glassmorphic 設計風格
 * - 優化重渲染性能
 */
export const ChatHeader: React.FC<ChatHeaderProps> = memo(
  ({
    useStreaming,
    onStreamingToggle,
    className,
    title = 'Chat with Database',
    description = 'Ask questions about your data',
  }) => {
    const { endRenderMeasure } = usePerformanceMonitor('ChatHeader');

    // 優化：使用 useCallback 避免重新創建事件處理器
    const handleStreamingToggle = useCallback(() => {
      onStreamingToggle();
    }, [onStreamingToggle]);

    // 記錄渲染性能
    React.useEffect(() => {
      endRenderMeasure({
        useStreaming,
        title,
        description,
        className,
      });
    });

    return (
      <div className={cn('mb-4 flex items-center justify-between', className)}>
        {/* 左側：標題區域 */}
        <div className='flex items-center gap-3'>
          <div className='relative'>
            <Database className='h-6 w-6 text-purple-400' />
            <Sparkles className='absolute -right-1 -top-1 h-3 w-3 text-yellow-400' />
          </div>
          <div>
            <h3 className={cn(cardTextStyles.title, 'text-white')}>{title}</h3>
            <p className={cn(cardTextStyles.labelSmall, 'text-slate-400')}>{description}</p>
          </div>
        </div>

        {/* 右側：控制區域 */}
        <div className='flex items-center gap-2'>
          <button
            onClick={handleStreamingToggle}
            className={cn(
              cardTextStyles.labelSmall,
              'text-slate-400 transition-colors hover:text-purple-400'
            )}
            title={useStreaming ? 'Streaming enabled' : 'Streaming disabled'}
          >
            {useStreaming ? '⚡ Fast' : '🐢 Normal'}
          </button>
          <Brain className='h-5 w-5 animate-pulse text-purple-400' />
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // 自定義比較函數 - 避免不必要的重渲染
    return (
      prevProps.useStreaming === nextProps.useStreaming &&
      prevProps.className === nextProps.className &&
      prevProps.title === nextProps.title &&
      prevProps.description === nextProps.description &&
      prevProps.onStreamingToggle === nextProps.onStreamingToggle
    );
  }
);

ChatHeader.displayName = 'ChatHeader';

export default ChatHeader;
