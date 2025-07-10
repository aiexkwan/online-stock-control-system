/**
 * 統一歷史記錄組件 V2 - Apollo GraphQL Version
 * 顯示系統全局歷史記錄
 * 
 * GraphQL Migration:
 * - 遷移至 Apollo Client
 * - 查詢 record_history 表
 * - Client-side 事件合併處理
 * - 保留 Server Actions + RPC fallback
 */

'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
import { createDashboardAPI } from '@/lib/api/admin/DashboardAPI';
import { errorHandler } from '@/app/components/qc-label-form/services/ErrorHandler';
import { useQuery, gql } from '@apollo/client';

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

// Apollo GraphQL query
const GET_HISTORY_TREE = gql`
  query GetHistoryTree($limit: Int = 50, $offset: Int = 0) {
    record_historyCollection(
      orderBy: [{ time: DescNullsLast }]
      first: $limit
      offset: $offset
    ) {
      edges {
        node {
          id
          time
          action
          plt_num
          loc
          remark
          who
          doc_url
          data_id {
            id
            name
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;

interface HistoryTreeV2Props extends WidgetComponentProps {
  useGraphQL?: boolean;
}

// 根據 action 類型返回對應的圖標
const getActionIcon = (action: string) => {
  const iconClass = 'h-3 w-3 text-white';

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
  const [events, setEvents] = useState<MergedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>({});
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    apiResponseTime?: number;
    cacheHit?: boolean;
  }>({});
  
  // 使用環境變量控制是否使用 GraphQL
  const shouldUseGraphQL = process.env.NEXT_PUBLIC_ENABLE_GRAPHQL_SHARED === 'true' || 
                          (useGraphQL ?? (widget as any)?.useGraphQL ?? false);

  // Apollo GraphQL 查詢
  const { 
    data: graphqlData, 
    loading: graphqlLoading, 
    error: graphqlError,
    refetch: graphqlRefetch
  } = useQuery(GET_HISTORY_TREE, {
    skip: !shouldUseGraphQL || isEditMode,
    variables: {
      limit: 50,
      offset: 0,
    },
    fetchPolicy: 'cache-and-network',
    pollInterval: 60000, // 1分鐘輪詢
  });

  // 處理 GraphQL 數據 - 合併相似事件
  const processGraphQLData = useMemo(() => {
    if (!graphqlData?.record_historyCollection?.edges) return [];

    const rawEvents = graphqlData.record_historyCollection.edges.map((edge: any) => {
      const node = edge.node;
      return {
        id: node.id,
        time: node.time,
        action: node.action,
        plt_num: node.plt_num,
        loc: node.loc,
        remark: node.remark || '',
        user_id: parseInt(node.who) || null,
        user_name: node.data_id?.name || node.who || 'Unknown',
        doc_url: node.doc_url,
      };
    });

    // 合併相同時間範圍內的相似事件 (5分鐘內)
    const mergedEvents: MergedEvent[] = [];
    const TIME_WINDOW = 5 * 60 * 1000; // 5 minutes

    rawEvents.forEach((event: any) => {
      const eventTime = new Date(event.time).getTime();
      
      // 查找可以合併的事件
      const existingEvent = mergedEvents.find(e => {
        const existingTime = new Date(e.time).getTime();
        return (
          e.action === event.action &&
          e.user_id === event.user_id &&
          Math.abs(eventTime - existingTime) < TIME_WINDOW
        );
      });

      if (existingEvent) {
        // 合併到現有事件
        if (event.plt_num) {
          existingEvent.merged_plt_nums.push(event.plt_num);
        }
        existingEvent.merged_count++;
      } else {
        // 創建新事件
        mergedEvents.push({
          ...event,
          merged_plt_nums: event.plt_num ? [event.plt_num] : [],
          merged_count: 1,
        });
      }
    });

    return mergedEvents;
  }, [graphqlData]);

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const startTime = performance.now();

      const api = createDashboardAPI();
      const result = await api.fetch({
        widgetIds: ['statsCard'],
        params: {
          dataSource: 'history_tree',
          limit: 50,
          offset: 0,
        },
      });

      const endTime = performance.now();

      // Extract widget data from dashboard result
      const widgetData = result.widgets?.find(w => w.widgetId === 'statsCard');

      if (!widgetData || widgetData.data.error) {
        throw new Error(widgetData?.data.error || 'Failed to load history data');
      }

      setPerformanceMetrics({
        apiResponseTime: Math.round(endTime - startTime),
        cacheHit: result.metadata?.cacheHit || false,
      });

      // Extract events from the value property
      setEvents(widgetData.data.value || []);
      setMetadata(widgetData.data.metadata || {});
      setError(null);
    } catch (err: any) {
      errorHandler.handleApiError(
        err,
        { component: 'HistoryTreeV2', action: 'load_history' },
        'Failed to load history data. Please try again.'
      );
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isEditMode && !shouldUseGraphQL) {
      loadHistory();

      // Set up refresh interval (optional)
      const interval = setInterval(loadHistory, 60000); // Refresh every minute
      return () => clearInterval(interval);
    }
  }, [loadHistory, isEditMode, shouldUseGraphQL]);

  // 合併數據源
  const displayEvents = shouldUseGraphQL ? processGraphQLData : events;
  const displayLoading = shouldUseGraphQL ? graphqlLoading : loading;
  const displayError = shouldUseGraphQL ? graphqlError?.message : error;

  // 將事件轉換為 Timeline 組件需要的格式
  const timelineItems = useMemo(() => {
    return displayEvents.map(event => ({
      date: event.time,
      title: formatEventTitle(event),
      description: formatEventDescription(event),
      icon: getActionIcon(event.action),
    }));
  }, [displayEvents]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='h-full'>
      <WidgetCard widgetType='custom' isEditMode={isEditMode}>
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center justify-between'>
            <span>History Tree</span>
            {shouldUseGraphQL && (
              <span className='text-xs text-blue-400'>
                ⚡ GraphQL
              </span>
            )}
            {!isEditMode && !shouldUseGraphQL && performanceMetrics.apiResponseTime && (
              <span className='text-xs text-slate-400'>
                {performanceMetrics.apiResponseTime}ms
                {performanceMetrics.cacheHit && ' (cached)'}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {displayLoading ? (
            <div className='space-y-4'>
              {[...Array(3)].map((_, i) => (
                <div key={i} className='animate-pulse'>
                  <div className='flex items-center gap-3'>
                    <div className='h-8 w-8 rounded-full bg-white/10'></div>
                    <div className='flex-1'>
                      <div className='mb-2 h-4 w-3/4 rounded bg-white/10'></div>
                      <div className='h-3 w-1/2 rounded bg-white/10'></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : displayError ? (
            <WidgetText size='xs' glow='red' className='py-4 text-center'>
              {displayError}
            </WidgetText>
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
                dotClassName='bg-gradient-to-r from-indigo-500 to-purple-500 border-2 border-slate-800'
                lineClassName='border-slate-600'
                titleClassName='text-slate-200 text-xs font-medium'
                descriptionClassName='text-slate-400 text-[10px] font-medium'
                dateClassName='text-slate-400 text-[10px] font-medium'
                buttonVariant='ghost'
                buttonSize='sm'
                showAnimation={!isEditMode}
              />
            </>
          )}
        </CardContent>
      </WidgetCard>
    </motion.div>
  );
});

export default HistoryTreeV2;

/**
 * GraphQL Migration completed on 2025-07-09
 * 
 * Features:
 * - Apollo Client query for record_history table
 * - Client-side event merging (5-minute window)
 * - Supports pagination
 * - 1-minute polling for updates
 * - Fallback to Server Actions + RPC when GraphQL disabled
 * - Feature flag control: NEXT_PUBLIC_ENABLE_GRAPHQL_SHARED
 * 
 * Performance considerations:
 * - RPC function (rpc_get_history_tree) performs server-side merging
 * - GraphQL version does client-side merging which may be less efficient
 * - Consider keeping RPC as primary method for better performance
 */
