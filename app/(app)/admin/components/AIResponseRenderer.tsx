'use client';

import React, { memo, useMemo, useCallback } from 'react';
import { AlertCircle, RefreshCw, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cardTextStyles } from '@/lib/card-system/theme';
import { Button } from '@/components/ui/button';
import type {
  AIResponse,
  AIListItem,
  AITableRow,
  EnhancedError,
  ChatMessageContent,
} from '../types/ai-response';
import {
  isEnhancedError,
  isAIResponse,
  isAIListItemArray,
  isAITableRowArray,
  safeParseAIResponse,
} from '../types/ai-response';
import { usePerformanceMonitor } from '../utils/performanceMonitor';

export interface AIResponseRendererProps {
  /** 消息內容 */
  content: ChatMessageContent;
  /** 重試回調函數 */
  onRetry?: () => void;
  /** 自定義className */
  className?: string;
}

/**
 * 優化的列表項組件 - 使用 memo 避免重複渲染
 */
const ListItem = memo<{ item: AIListItem; index: number }>(
  ({ item, index }) => (
    <div className='flex items-start gap-2'>
      {item.rank && (
        <span className='min-w-[24px] font-semibold text-purple-400'>{item.rank}.</span>
      )}
      <div className='flex-1'>
        <span className={cn(cardTextStyles.body, 'font-semibold')}>{item.label}</span>
        {item.value && (
          <span className='ml-2 text-purple-300'>
            - {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
            {item.unit && ` ${item.unit}`}
          </span>
        )}
        {item.description && (
          <p className={cn(cardTextStyles.labelSmall, 'mt-1 text-slate-400')}>{item.description}</p>
        )}
      </div>
    </div>
  ),
  (prevProps, nextProps) => {
    const prevItem = prevProps.item;
    const nextItem = nextProps.item;
    return (
      prevItem.label === nextItem.label &&
      prevItem.value === nextItem.value &&
      prevItem.unit === nextItem.unit &&
      prevItem.description === nextItem.description &&
      prevItem.rank === nextItem.rank &&
      prevProps.index === nextProps.index
    );
  }
);

ListItem.displayName = 'ListItem';

/**
 * 優化的渲染列表類型的AI回應
 */
const renderListResponse = (response: AIResponse): React.ReactNode => {
  if (!isAIListItemArray(response.data)) {
    return <div className='text-red-400'>Invalid list data format</div>;
  }

  const listData = response.data as AIListItem[];

  return (
    <div className='space-y-3'>
      {response.summary && <p className={cn(cardTextStyles.body, 'mb-2')}>{response.summary}</p>}
      <div className='space-y-2'>
        {listData.map((item, index) => (
          <ListItem key={`${item.label}-${index}`} item={item} index={index} />
        ))}
      </div>
      {response.conclusion && (
        <p className={cn(cardTextStyles.body, 'mt-3 border-t border-slate-700/50 pt-2')}>
          {response.conclusion}
        </p>
      )}
    </div>
  );
};

/**
 * 渲染表格類型的AI回應
 */
const renderTableResponse = (response: AIResponse): React.ReactNode => {
  if (!isAITableRowArray(response.data)) {
    return <div className='text-red-400'>Invalid table data format</div>;
  }

  const tableData = response.data as AITableRow[];
  const columns = response.columns || [];

  return (
    <div className='space-y-3'>
      {response.summary && <p className={cn(cardTextStyles.body, 'mb-2')}>{response.summary}</p>}
      <div className='overflow-x-auto'>
        <table className='w-full text-xs'>
          <thead>
            <tr className='border-b border-slate-700/50'>
              {columns.map(col => (
                <th
                  key={col.key}
                  className={cn(
                    'px-2 py-1 text-slate-400',
                    col.align === 'right' ? 'text-right' : 'text-left'
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, idx) => (
              <tr key={idx} className='border-b border-slate-700/30'>
                {columns.map(col => (
                  <td
                    key={col.key}
                    className={cn('px-2 py-1', col.align === 'right' ? 'text-right' : 'text-left')}
                  >
                    {col.type === 'number' && typeof row[col.key] === 'number'
                      ? (row[col.key] as number).toLocaleString()
                      : String(row[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {response.conclusion && (
        <p className={cn(cardTextStyles.body, 'mt-3')}>{response.conclusion}</p>
      )}
    </div>
  );
};

/**
 * 渲染單值類型的AI回應
 */
const renderSingleResponse = (response: AIResponse): React.ReactNode => (
  <div className='space-y-2'>
    {response.summary && <p className={cn(cardTextStyles.body)}>{response.summary}</p>}
    <div className='text-2xl font-bold text-purple-400'>{String(response.data)}</div>
    {response.conclusion && (
      <p className={cn(cardTextStyles.body, 'text-slate-400')}>{response.conclusion}</p>
    )}
  </div>
);

/**
 * 渲染空回應類型的AI回應
 */
const renderEmptyResponse = (response: AIResponse): React.ReactNode => (
  <div className='py-4 text-center'>
    <AlertCircle className='mx-auto mb-2 h-8 w-8 text-slate-500' />
    <p className={cn(cardTextStyles.body, 'text-slate-400')}>
      {response.summary || 'No data found'}
    </p>
    {response.conclusion && (
      <p className={cn(cardTextStyles.labelSmall, 'mt-2 text-slate-500')}>{response.conclusion}</p>
    )}
  </div>
);

/**
 * 渲染摘要類型的AI回應
 */
const renderSummaryResponse = (response: AIResponse): React.ReactNode => (
  <div className='space-y-2'>
    {response.summary && <p className={cn(cardTextStyles.body)}>{response.summary}</p>}
    {response.data && (
      <p className={cn(cardTextStyles.body)}>
        {typeof response.data === 'string'
          ? response.data
          : typeof response.data === 'number'
            ? response.data.toString()
            : typeof response.data === 'object' && response.data !== null
              ? JSON.stringify(response.data)
              : String(response.data)}
      </p>
    )}
    {response.conclusion && (
      <p className={cn(cardTextStyles.body, 'mt-2 text-slate-400')}>{response.conclusion}</p>
    )}
  </div>
);

/**
 * 根據AI回應類型渲染對應的內容
 */
const renderAIResponse = (response: AIResponse): React.ReactNode => {
  switch (response.type) {
    case 'list':
      return renderListResponse(response);
    case 'table':
      return renderTableResponse(response);
    case 'single':
      return renderSingleResponse(response);
    case 'empty':
      return renderEmptyResponse(response);
    case 'summary':
    default:
      return renderSummaryResponse(response);
  }
};

/**
 * 增強錯誤顯示組件
 */
const EnhancedErrorDisplay: React.FC<{
  error: EnhancedError;
  onRetry: () => void;
}> = ({ error, onRetry }) => {
  return (
    <div className='space-y-3'>
      <div className='flex items-start gap-3'>
        <AlertCircle className='mt-0.5 h-5 w-5 flex-shrink-0 text-red-400' />
        <div className='flex-1'>
          <h4 className={cn(cardTextStyles.body, 'font-semibold text-red-400')}>{error.message}</h4>
          {error.details && <p className='mt-1 text-sm text-slate-400'>{error.details}</p>}
        </div>
      </div>

      {error.alternatives && error.alternatives.length > 0 && (
        <div className='rounded-lg bg-white/5 p-3 backdrop-blur-sm'>
          <p className='mb-2 text-sm text-slate-300'>Did you mean:</p>
          <div className='flex flex-wrap gap-2'>
            {error.alternatives.map((alt, i) => (
              <code
                key={i}
                className='rounded bg-white/10 px-2 py-1 text-xs text-purple-300 backdrop-blur-sm'
              >
                {alt}
              </code>
            ))}
          </div>
        </div>
      )}

      {error.suggestions && error.suggestions.length > 0 && (
        <div className='space-y-2'>
          <p className={cn(cardTextStyles.body, 'text-slate-300')}>Suggestions:</p>
          <ul className='space-y-1'>
            {error.suggestions.map((suggestion, i) => (
              <li key={i} className='flex items-start gap-2 text-sm text-slate-400'>
                <span className='mt-0.5 text-slate-500'>•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className='flex flex-wrap gap-2 pt-2'>
        <Button
          onClick={onRetry}
          size='sm'
          variant='outline'
          className={cn(cardTextStyles.labelSmall)}
        >
          <RefreshCw className='mr-1 h-3 w-3' />
          Retry Query
        </Button>
        {error.showHelp && (
          <Button
            onClick={() => window.open('/help/ask-database', '_blank')}
            size='sm'
            variant='outline'
            className={cn(cardTextStyles.labelSmall)}
          >
            <HelpCircle className='mr-1 h-3 w-3' />
            View Help
          </Button>
        )}
      </div>
    </div>
  );
};

/**
 * 優化的 AIResponseRenderer 組件 - AI回應渲染器
 *
 * 職責：
 * - 高效統一所有AI回應格式化邏輯（使用 React.memo 和 useMemo）
 * - 支援 list/table/single/empty/summary 回應類型
 * - 處理增強錯誤顯示
 * - 提供類型安全的消息處理
 * - 保持錯誤處理和重試機制
 * - 優化複雜內容的渲染性能
 */
export const AIResponseRenderer: React.FC<AIResponseRendererProps> = memo(
  ({ content, onRetry, className }) => {
    const { endRenderMeasure } = usePerformanceMonitor('AIResponseRenderer');

    // 優化：創建穩定的重試回調
    const handleRetry = useCallback(() => {
      if (onRetry) {
        onRetry();
      }
    }, [onRetry]);

    // 優化：使用 useMemo 緩存內容解析結果
    const parsedContent = useMemo(() => {
      // 檢查是否為增強錯誤
      if (isEnhancedError(content)) {
        return { type: 'error', data: content };
      }

      // 檢查是否為AI回應
      if (isAIResponse(content)) {
        return { type: 'response', data: content };
      }

      // 嘗試解析字符串為JSON
      if (typeof content === 'string') {
        const parsed = safeParseAIResponse(content);
        if (parsed) {
          return { type: 'response', data: parsed };
        }
      }

      // 回退到簡單文本
      return { type: 'text', data: content };
    }, [content]);

    // 記錄渲染性能
    React.useEffect(() => {
      endRenderMeasure({
        contentType: parsedContent.type,
        hasRetry: Boolean(onRetry),
        className,
        contentSize: typeof content === 'string' ? content.length : JSON.stringify(content).length,
      });
    });

    // 優化：根據解析結果渲染內容
    const renderedContent = useMemo(() => {
      switch (parsedContent.type) {
        case 'error':
          return (
            <EnhancedErrorDisplay
              error={parsedContent.data as EnhancedError}
              onRetry={handleRetry}
            />
          );

        case 'response':
          return renderAIResponse(parsedContent.data as AIResponse);

        case 'text':
        default:
          return (
            <div className={cn(cardTextStyles.body, 'leading-relaxed')}>
              {String(parsedContent.data)}
            </div>
          );
      }
    }, [parsedContent, handleRetry]);

    return <div className={className}>{renderedContent}</div>;
  },
  (prevProps, nextProps) => {
    // 自定義比較函數 - 避免不必要的重渲染
    return (
      prevProps.content === nextProps.content &&
      prevProps.onRetry === nextProps.onRetry &&
      prevProps.className === nextProps.className
    );
  }
);

AIResponseRenderer.displayName = 'AIResponseRenderer';

export default AIResponseRenderer;
