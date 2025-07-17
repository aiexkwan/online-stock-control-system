/**
 * 統一歷史記錄組件 V2 - Enhanced Version with Progressive Loading
 * 顯示系統全局歷史記錄
 * 
 * Features:
 * - 使用 useUnifiedAPI hook 統一數據獲取
 * - Progressive Loading with useInViewport
 * - Timeline 組件顯示歷史記錄
 * - Client-side 事件合併處理
 * - 保留 Server Actions + RPC fallback
 */

'use client';

import React, { useMemo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  ClockIcon,
  CubeIcon as Package2,
  TruckIcon,
  PrinterIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { DocumentArrowDownIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UniversalWidgetCard as WidgetCard } from '../UniversalWidgetCard';
import { Timeline } from '@/components/ui/timeline';
import { format } from 'date-fns';
import { fromDbTime } from '@/app/utils/timezone';
import {
  WidgetTitle,
  WidgetText,
  WidgetLabel,
  WidgetTextStyles,
  GlowStyles,
} from '../WidgetTypography';
import { cn } from '@/lib/utils';
import { 
  brandColors, 
  widgetColors, 
  semanticColors,
  getWidgetCategoryColor 
} from '@/lib/design-system/colors';
import { textClasses, getTextClass } from '@/lib/design-system/typography';
import { spacing, widgetSpacing } from '@/lib/design-system/spacing';
import { createDashboardAPIClient as createDashboardAPI } from '@/lib/api/admin/DashboardAPI.client';
import { useRestAPI } from '@/app/admin/hooks/useUnifiedAPI';
import { useInViewport, InViewportPresets } from '@/app/admin/hooks/useInViewport';
import { WidgetSkeleton } from './common/WidgetStates';

interface MergedEvent {
  id: number;
  time: string;
  action: string;
  plt_num: string | null;
  loc: string | null;
  remark: string;
  user_id: number | null;
  user_name: string;
  doc_url: string | null;
  merged_plt_nums: string[];
  merged_count: number;
}


interface HistoryTreeV2Props extends WidgetComponentProps {
  useGraphQL?: boolean;
}

// 根據 action 類型返回對應的圖標
const getActionIcon = (action: string) => {
  const iconClass = 'h-3 w-3 text-foreground';

  if (action.includes('Print') || action.includes('Label')) {
    return <PrinterIcon className={iconClass} />;
  } else if (action.includes('QC') || action.includes('Finished')) {
    return <CheckCircleIcon className={iconClass} />;
  } else if (action.includes('Transfer') || action.includes('Move')) {
    return <TruckIcon className={iconClass} />;
  } else if (action.includes('GRN') || action.includes('Receiving')) {
    return <DocumentArrowDownIcon className={iconClass} />;
  } else if (action.includes('Order') || action.includes('Load')) {
    return <ClipboardDocumentListIcon className={iconClass} />;
  } else if (action.includes('Void') || action.includes('Delete')) {
    return <XCircleIcon className={iconClass} />;
  } else {
    return <ArrowRightIcon className={iconClass} />;
  }
};

// 格式化合併後的事件標題
const formatEventTitle = (event: MergedEvent): string => {
  const userName = event.user_name || `User ${event.user_id || 'Unknown'}`;

  if (event.merged_count > 1) {
    // 批量操作
    if (event.action.includes('Print') || event.action.includes('Label')) {
      return `Print Labels By ${userName}`;
    } else if (event.action.includes('Transfer')) {
      return `Transfer Done By ${userName}`;
    } else if (event.action.includes('QC')) {
      return `QC Done By ${userName}`;
    } else if (event.action.includes('GRN') || event.action.includes('Receiving')) {
      return `GRN Received By ${userName}`;
    } else {
      return `${event.action} By ${userName}`;
    }
  } else {
    // 單個操作
    if (event.action.includes('Order') && event.action.includes('Upload')) {
      return `Order Upload By ${userName}`;
    } else if (event.action.includes('GRN') || event.action.includes('Receiving')) {
      return `GRN Received By ${userName}`;
    } else if (event.action.includes('QC')) {
      return `QC Done By ${userName}`;
    } else if (event.action.includes('Transfer')) {
      return `Transfer Done By ${userName}`;
    } else if (event.action.includes('Product') && event.action.includes('Update')) {
      return `Product Update By ${userName}`;
    } else {
      return `${event.action} By ${userName}`;
    }
  }
};

// 格式化事件描述
const formatEventDescription = (event: MergedEvent): string => {
  const parts: string[] = [];

  // 根據事件類型添加具體信息
  if (event.action.includes('Order') && event.action.includes('Upload')) {
    // Order Upload - 顯示訂單號
    const orderMatch = event.remark?.match(/\d{6}/);
    if (orderMatch) {
      parts.push(`Order: ${orderMatch[0]}`);
    } else if (event.merged_plt_nums.length > 0) {
      parts.push(`Order: ${event.merged_plt_nums[0]}`);
    }
  } else if (event.action.includes('GRN') || event.action.includes('Receiving')) {
    // GRN - 顯示 GRN 號碼和數量
    const grnMatch = event.remark?.match(/GRN:\s*(\w+)/i);
    if (grnMatch) {
      if (event.merged_count > 1) {
        parts.push(`GRN: ${grnMatch[1]}, ${event.merged_count} PLT`);
      } else {
        parts.push(`GRN: ${grnMatch[1]}`);
      }
    } else if (event.merged_count > 1) {
      parts.push(`${event.merged_count} PLT`);
    }
  } else if (event.action.includes('QC')) {
    // QC - 顯示棧板數量
    if (event.merged_count > 1) {
      parts.push(`${event.merged_count} pallets`);
    } else if (event.merged_plt_nums.length > 0) {
      parts.push(`PLT: ${event.merged_plt_nums[0]}`);
    }
    // 顯示其他 QC 信息
    if (event.remark && event.remark !== '-' && !event.remark.includes('Material:')) {
      parts.push(event.remark);
    }
  } else if (event.action.includes('Transfer')) {
    // Transfer - 顯示轉移數量
    if (event.merged_count > 1) {
      parts.push(`${event.merged_count} pallets`);
    } else if (event.merged_plt_nums.length > 0) {
      parts.push(`PLT: ${event.merged_plt_nums[0]}`);
    }
  } else if (event.action.includes('Print') || event.action.includes('Label')) {
    // Print - 顯示打印數量
    if (event.merged_count > 1) {
      parts.push(`${event.merged_count} labels`);
    } else {
      parts.push(`1 label`);
    }
  } else {
    // 其他操作 - 顯示基本信息
    if (event.merged_plt_nums.length > 0) {
      parts.push(`PLT: ${event.merged_plt_nums[0]}`);
    }
    if (event.remark && event.remark !== '-') {
      parts.push(event.remark);
    }
  }

  return parts.join(' • ');
};

export const HistoryTreeV2 = React.memo(function HistoryTreeV2({
  widget,
  isEditMode,
  useGraphQL,
}: HistoryTreeV2Props) {
  const widgetRef = useRef<HTMLDivElement>(null);
  
  // Progressive Loading - 檢測 widget 是否在視窗內
  const { isInViewport, hasBeenInViewport } = useInViewport(widgetRef, InViewportPresets.chart);
  
  // Use REST API directly
  const {
    data,
    loading,
    error,
    refetch,
  } = useRestAPI<{ events?: MergedEvent[]; metadata?: any }>('/api/dashboard/widgets/history-tree', 'GET', {
    variables: { limit: 50, offset: 0 },
    skip: isEditMode || !hasBeenInViewport, // Progressive Loading
    widgetId: 'history-tree-v2',
    onError: (err) => {
      console.error('History tree error:', err);
    },
  });

  // 處理 REST API 數據
  const displayEvents = useMemo(() => {
    // REST API 返回的數據已經被後端處理過
    if (data?.events) {
      return data.events;
    }
    
    return [];
  }, [data]);
  const metadata = data?.metadata || {};

  // 將事件轉換為 Timeline 組件需要的格式
  const timelineItems = useMemo(() => {
    return displayEvents.map((event: MergedEvent) => ({
      date: event.time,
      title: formatEventTitle(event),
      description: formatEventDescription(event),
      icon: getActionIcon(event.action),
    }));
  }, [displayEvents]);

  // Progressive Loading - 如果還未進入視窗，顯示 skeleton
  if (!hasBeenInViewport && !isEditMode) {
    return (
      <motion.div ref={widgetRef} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='h-full'>
        <WidgetCard widgetType='custom'>
          <CardHeader className='pb-3'>
            <CardTitle>History Tree</CardTitle>
          </CardHeader>
          <CardContent>
            <WidgetSkeleton type='timeline' rows={5} />
          </CardContent>
        </WidgetCard>
      </motion.div>
    );
  }

  return (
    <motion.div ref={widgetRef} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='h-full'>
      <WidgetCard widgetType='custom' isEditMode={isEditMode}>
        <CardHeader className='pb-4'>
          <CardTitle className='flex items-center justify-between'>
            <span>History Tree</span>
            <div className='flex items-center gap-2'>
              {mode === 'context' && (
                <span className={cn(textClasses['label-small'], 'text-primary')}>
                  ⚡ GraphQL
                </span>
              )}
              {mode === 'server-action' && (
                <span className={cn(textClasses['label-small'], 'text-secondary')}>
                  🔄 Server Action
                </span>
              )}
              {mode === 'context' && (
                <span className={cn(textClasses['label-small'], 'text-success')}>
                  💾 Cached
                </span>
              )}
              {!isEditMode && performanceMetrics?.queryTime && (
                <span className={cn(textClasses['label-small'], 'text-muted-foreground')}>
                  {performanceMetrics.queryTime}ms
                  {performanceMetrics.dataSource === 'cache' && ' (cached)'}
                </span>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <WidgetSkeleton type='timeline' rows={3} />
          ) : error ? (
            <div className='space-y-2'>
              <WidgetText size='xs' glow='red' className='py-4 text-center'>
                {error.message || 'Failed to load history data'}
              </WidgetText>
              {mode === 'context' && (
                <WidgetText size='xs' className={cn('text-center', textClasses['body-small'], 'text-muted-foreground')}>
                  Attempting fallback to server action...
                </WidgetText>
              )}
            </div>
          ) : displayEvents.length === 0 ? (
            <WidgetText size='xs' glow='gray' className='py-8 text-center'>
              No history records found
            </WidgetText>
          ) : (
            <>
              <Timeline
                items={timelineItems}
                initialCount={30}
                className='h-full'
                showMoreText='Show More'
                showLessText='Show Less'
                dotClassName={cn(
                  'bg-gradient-to-br',
                  getWidgetCategoryColor('special', 'gradient'),
                  'border-2 border-border'
                )}
                lineClassName='border-border'
                titleClassName={textClasses['body-small']}
                descriptionClassName={cn(textClasses['label-small'], 'text-muted-foreground')}
                dateClassName={cn(textClasses['label-small'], 'text-muted-foreground')}
                buttonVariant='ghost'
                buttonSize='sm'
                showAnimation={!isEditMode}
              />
              {metadata?.hasMore && (
                <div className='mt-4 text-center'>
                  <button
                    onClick={() => refetch()}
                    className={cn(
                      textClasses['label-base'],
                      'text-primary hover:text-primary/80 transition-colors'
                    )}
                  >
                    Load more events
                  </button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </WidgetCard>
    </motion.div>
  );
});

// 只保留命名導出，避免循環引用問題
// export default HistoryTreeV2;
