'use client';

import React, { memo, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { cardTextStyles } from '@/lib/card-system/theme';
import { Button } from '@/components/ui/button';
import { Search, Calendar, Database } from 'lucide-react';
import { SuggestionCategories } from './SuggestionCategories';
import { QuickActions } from './QuickActions';
import { usePerformanceMonitor } from '../utils/performanceMonitor';

export interface QuerySuggestionsProps {
  /** 是否顯示建議 */
  showSuggestions: boolean;
  /** 消息數量 */
  messageCount: number;
  /** 最近查詢列表 */
  recentQueries: string[];
  /** 上下文建議列表 */
  contextualSuggestions: string[];
  /** 選中的分類 */
  selectedCategory: string | null;
  /** 分類選擇回調 */
  onCategorySelect: (category: string | null) => void;
  /** 建議顯示切換回調 */
  onToggleSuggestions: () => void;
  /** 發送消息回調 */
  onSendMessage: (message: string) => void;
  /** 自定義className */
  className?: string;
}

/**
 * 優化的 QuerySuggestions 組件 - 查詢建議主組件
 *
 * 職責：
 * - 高效管理所有建議展示邏輯（使用 React.memo 和 useMemo）
 * - 實現建議分類和動態加載（懶加載優化）
 * - 保持上下文感知功能
 * - 協調子組件之間的交互
 * - 優化大型建議列表的渲染性能
 */
export const QuerySuggestions: React.FC<QuerySuggestionsProps> = memo(
  ({
    showSuggestions,
    messageCount,
    recentQueries,
    contextualSuggestions,
    selectedCategory,
    onCategorySelect,
    onToggleSuggestions,
    onSendMessage,
    className,
  }) => {
    const { endRenderMeasure } = usePerformanceMonitor('QuerySuggestions');

    // 優化：創建穩定的回調函數
    const handleSendMessage = useCallback(
      (message: string) => {
        onSendMessage(message);
      },
      [onSendMessage]
    );

    const handleCategorySelect = useCallback(
      (category: string | null) => {
        onCategorySelect(category);
      },
      [onCategorySelect]
    );

    const handleToggleSuggestions = useCallback(() => {
      onToggleSuggestions();
    }, [onToggleSuggestions]);

    // 優化：使用 useMemo 緩存複雜的計算
    const displayRecentQueries = useMemo(() => {
      return recentQueries.slice(0, 3); // 只顯示前3個，提升性能
    }, [recentQueries]);

    const displayContextualSuggestions = useMemo(() => {
      return contextualSuggestions.slice(0, 5); // 限制數量，避免過多渲染
    }, [contextualSuggestions]);

    // 優化：判斷是否顯示初次對話界面
    const shouldShowFullInterface = useMemo(() => {
      return showSuggestions && messageCount === 1;
    }, [showSuggestions, messageCount]);

    // 優化：判斷是否顯示多輪對話界面
    const shouldShowToggleInterface = useMemo(() => {
      return messageCount > 1;
    }, [messageCount]);

    // 記錄渲染性能
    React.useEffect(() => {
      endRenderMeasure({
        showSuggestions,
        messageCount,
        recentQueriesCount: recentQueries.length,
        contextualSuggestionsCount: contextualSuggestions.length,
        selectedCategory,
        className,
      });
    });
    // 初次對話時的完整建議界面
    if (shouldShowFullInterface) {
      return (
        <div className={cn('mt-4 max-h-96 space-y-4 overflow-y-auto', className)}>
          {/* Recent Queries */}
          {displayRecentQueries.length > 0 && (
            <div className='rounded-lg border-none bg-white/5 p-4 backdrop-blur-sm'>
              <h3 className='mb-3 flex items-center gap-2 text-sm font-medium text-slate-300'>
                <Calendar className='h-4 w-4' />
                Recent Queries
              </h3>
              <div className='space-y-1'>
                {displayRecentQueries.map((query, index) => (
                  <Button
                    key={`recent-${index}-${query}`}
                    variant='ghost'
                    size='sm'
                    onClick={() => handleSendMessage(query)}
                    className='w-full justify-start rounded border-none bg-white/10 text-left text-white transition-all hover:bg-white/20'
                  >
                    <Search className='mr-2 h-3 w-3 opacity-50' />
                    {query}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Contextual Suggestions */}
          {displayContextualSuggestions.length > 0 && (
            <div className='rounded-lg border-none bg-white/5 p-4 backdrop-blur-sm'>
              <h3 className='mb-3 flex items-center gap-2 text-sm font-medium text-blue-300'>
                <Database className='h-4 w-4' />
                Related Queries
              </h3>
              <div className='space-y-1'>
                {displayContextualSuggestions.map((query, index) => (
                  <Button
                    key={`contextual-${index}-${query}`}
                    variant='ghost'
                    size='sm'
                    onClick={() => handleSendMessage(query)}
                    className='w-full justify-start rounded border-none bg-white/10 text-left text-white transition-all hover:bg-white/15'
                  >
                    {query}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Category Suggestions */}
          <SuggestionCategories
            selectedCategory={selectedCategory}
            onCategorySelect={handleCategorySelect}
            onSendMessage={handleSendMessage}
          />

          {/* Quick Actions */}
          <QuickActions onSendMessage={handleSendMessage} />
        </div>
      );
    }

    // 多輪對話時的建議切換控制
    if (shouldShowToggleInterface) {
      return (
        <>
          <div className='mt-2 flex justify-center'>
            <Button
              variant='ghost'
              size='sm'
              onClick={handleToggleSuggestions}
              className={cn(cardTextStyles.labelSmall, 'text-slate-400 hover:text-purple-400')}
            >
              {showSuggestions ? (
                <>
                  <span className='mr-1'>↑</span>
                  Hide Suggestions
                </>
              ) : (
                <>
                  <span className='mr-1'>↓</span>
                  Show Suggestions
                </>
              )}
            </Button>
          </div>

          {/* Enhanced Query Suggestions for existing conversations */}
          {showSuggestions && (
            <div className='mt-2 max-h-48 space-y-2 overflow-y-auto'>
              <QuickActions onSendMessage={handleSendMessage} variant='compact' />
            </div>
          )}
        </>
      );
    }

    return null;
  },
  (prevProps, nextProps) => {
    // 自定義比較函數 - 避免不必要的重渲染
    return (
      prevProps.showSuggestions === nextProps.showSuggestions &&
      prevProps.messageCount === nextProps.messageCount &&
      prevProps.selectedCategory === nextProps.selectedCategory &&
      prevProps.className === nextProps.className &&
      // 淺層比較陣列
      prevProps.recentQueries.length === nextProps.recentQueries.length &&
      prevProps.recentQueries.every((query, index) => query === nextProps.recentQueries[index]) &&
      prevProps.contextualSuggestions.length === nextProps.contextualSuggestions.length &&
      prevProps.contextualSuggestions.every(
        (query, index) => query === nextProps.contextualSuggestions[index]
      ) &&
      // 比較回調函數（假設它們是穩定的）
      prevProps.onCategorySelect === nextProps.onCategorySelect &&
      prevProps.onToggleSuggestions === nextProps.onToggleSuggestions &&
      prevProps.onSendMessage === nextProps.onSendMessage
    );
  }
);

QuerySuggestions.displayName = 'QuerySuggestions';

export default QuerySuggestions;
