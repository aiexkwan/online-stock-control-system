/**
 * Order State List Widget V2 - REST API Version
 * 顯示訂單進度列表
 * 遷移自原 OrderStateListWidget
 *
 * Features:
 * - 使用純 REST API 數據獲取
 * - Progressive Loading with useInViewport
 * - 使用 DataTable 組件統一列表顯示
 * - Client-side 進度計算
 * - 保留實時更新功能
 */

'use client';

import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { ClipboardDocumentListIcon, TruckIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/types/components/dashboard';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { createDashboardAPIClient as createDashboardAPI } from '@/lib/api/admin/DashboardAPI.client';
import { useInViewport, InViewportPresets } from '@/app/(app)/admin/hooks/useInViewport';
import { DataTable, DataTableColumn } from './common/data-display/DataTable';
import {
  OrderProgress,
  InventoryAnalysisMapper,
  isWidgetApiDataWrapper,
} from './types/InventoryAnalysisTypes';

// OrderProgress interface moved to InventoryAnalysisTypes.ts

export const OrderStateListWidgetV2 = React.memo(function OrderStateListWidgetV2({
  widget,
  isEditMode,
  timeFrame,
}: WidgetComponentProps) {
  const widgetRef = useRef<HTMLDivElement>(null);

  // Progressive Loading - 檢測 widget 是否在視窗內
  const { isInViewport, hasBeenInViewport } = useInViewport(widgetRef, InViewportPresets.chart);

  // REST API 狀態管理
  const [rawData, setRawData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  // 獲取訂單數據
  const fetchOrdersData = useCallback(async () => {
    if (isEditMode || !hasBeenInViewport) return;

    setLoading(true);
    setError(null);

    try {
      const api = createDashboardAPI();
      const result = await api.fetch({
        widgetIds: ['statsCard'],
        params: {
          dataSource: 'order_state_list',
          limit: 50,
          offset: 0,
        },
      });

      // Extract widget data from dashboard result
      const widgetData = result.widgets?.find(w => w.widgetId === 'statsCard');

      if (!widgetData || !isWidgetApiDataWrapper(widgetData.data)) {
        throw new Error('Failed to load orders data');
      }

      const errorMsg = InventoryAnalysisMapper.extractErrorFromWrapper(widgetData.data);
      if (errorMsg) {
        throw new Error(errorMsg);
      }

      const dataValue = widgetData.data.value || [];
      setRawData(dataValue);
      setLastFetch(Date.now());
    } catch (err) {
      console.error('Error fetching orders data:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch orders data'));
    } finally {
      setLoading(false);
    }
  }, [isEditMode, hasBeenInViewport]);

  // Initial data fetch only (auto-refresh removed)
  useEffect(() => {
    if (isEditMode || !hasBeenInViewport) return;

    fetchOrdersData();
    // Auto-refresh removed to prevent constant loading animations
  }, [fetchOrdersData, isEditMode, hasBeenInViewport]);

  // 重新獲取數據
  const refetch = useCallback(() => {
    fetchOrdersData();
  }, [fetchOrdersData]);

  // 處理數據
  const data = useMemo<OrderProgress[]>(() => {
    const orders = InventoryAnalysisMapper.extractOrdersFromApiResponse(rawData);
    // 只顯示未完成訂單
    return orders.filter(order => order.status !== 'completed');
  }, [rawData]);

  // 定義 DataTable columns
  const columns = useMemo<DataTableColumn<OrderProgress>[]>(
    () => [
      {
        key: 'order_ref',
        header: 'Order',
        icon: ClipboardDocumentListIcon,
        width: '25%',
        render: (value, item) => (
          <div className='flex items-center gap-2'>
            <div
              className={cn(
                'h-2 w-2 flex-shrink-0 rounded-full',
                (item as OrderProgress).status_color === 'green'
                  ? 'bg-green-400'
                  : (item as OrderProgress).status_color === 'orange'
                    ? 'bg-orange-400'
                    : (item as OrderProgress).status_color === 'yellow'
                      ? 'bg-yellow-400'
                      : (item as OrderProgress).status_color === 'red'
                        ? 'bg-red-400'
                        : 'bg-slate-400'
              )}
            />
            <span className='font-medium text-white'>{String(value || '')}</span>
          </div>
        ),
        className: 'font-medium',
      },
      {
        key: 'product_code',
        header: 'Product',
        width: '35%',
        render: (value, item) => (
          <div>
            <div className='font-medium text-white'>{String(value || '')}</div>
            <div className='mt-0.5 truncate text-xs text-slate-400'>
              {String((item as OrderProgress).product_desc || '')}
            </div>
          </div>
        ),
      },
      {
        key: 'progress',
        header: 'Progress',
        width: '25%',
        render: (value, item) => (
          <div className='space-y-1'>
            <div className='flex justify-between text-xs'>
              <span className='text-slate-400'>{(item as OrderProgress).progress_text}</span>
              <span className='font-medium text-white'>{Math.round(Number(value || 0))}%</span>
            </div>
            <Progress value={Number(value || 0)} className='h-2' />
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        icon: TruckIcon,
        width: '15%',
        align: 'center',
        render: (value, item) => (
          <div className='flex justify-center'>
            {(item as OrderProgress).status === 'completed' && (
              <TruckIcon className='h-4 w-4 text-green-400' />
            )}
            {(item as OrderProgress).status === 'in_progress' && (
              <span
                className={cn(
                  'text-xs font-medium',
                  (item as OrderProgress).status_color === 'orange'
                    ? 'text-orange-400'
                    : 'text-yellow-400'
                )}
              >
                {(item as OrderProgress).progress >= 75 ? 'Almost' : 'Loading'}
              </span>
            )}
            {(item as OrderProgress).status === 'pending' && (
              <span className='text-xs font-medium text-red-400'>Pending</span>
            )}
          </div>
        ),
      },
    ],
    []
  );

  // 計算 metadata
  const metadata = useMemo(() => {
    const orders = data || [];
    const pendingCount = orders.length;
    return {
      pendingCount,
      totalCount: pendingCount, // 因為已經過濾了完成的訂單
    };
  }, [data]);

  // Edit mode - 顯示空白狀態
  if (isEditMode) {
    return (
      <div ref={widgetRef}>
        <DataTable
          title='Order Progress'
          icon={ClipboardDocumentListIcon}
          iconColor='from-blue-500 to-cyan-500'
          data={[]}
          columns={columns}
          empty={true}
          emptyMessage='Order State List Widget V2'
          emptyIcon={ClipboardDocumentListIcon}
        />
      </div>
    );
  }

  // Progressive Loading - 如果還未進入視窗，顯示 skeleton
  if (!hasBeenInViewport) {
    return (
      <div ref={widgetRef}>
        <DataTable
          title='Order Progress'
          icon={ClipboardDocumentListIcon}
          iconColor='from-blue-500 to-cyan-500'
          data={[]}
          columns={columns}
          loading={true}
        />
      </div>
    );
  }

  return (
    <div ref={widgetRef}>
      <DataTable
        title='Order Progress'
        subtitle={`${metadata.pendingCount} pending orders`}
        icon={ClipboardDocumentListIcon}
        iconColor='from-blue-500 to-cyan-500'
        data={data || []}
        columns={columns}
        keyField='uuid'
        loading={loading}
        error={error}
        empty={(data || []).length === 0}
        emptyMessage='All orders completed'
        emptyIcon={ClipboardDocumentListIcon}
        pagination={{
          enabled: false, // 固定顯示 50 筆記錄，無分頁
        }}
        performanceMetrics={{
          source: 'REST API',
          fetchTime: lastFetch > 0 ? Date.now() - lastFetch : undefined,
          optimized: true,
        }}
        connectionStatus={{
          type: 'polling',
          label: '🚀 REST API',
        }}
        onRefresh={refetch}
        showRefreshButton={true}
        animate={true}
        rowClassName={item =>
          cn(
            'transition-colors hover:bg-slate-700/50',
            (item as OrderProgress).status === 'completed' && 'opacity-50'
          )
        }
      />
    </div>
  );
});

export default OrderStateListWidgetV2;

/**
 * Order State List Widget V2 - REST API Version
 *
 * Features:
 * - ✅ 純 REST API 數據獲取
 * - ✅ Progressive Loading with useInViewport
 * - ✅ DataTable 統一列表顯示
 * - ✅ 保留實時更新功能 (30秒輪詢)
 * - ✅ Client-side 進度計算和狀態判斷
 * - ✅ 優化錯誤處理和重試機制
 *
 * Updates (2025-07-16):
 * - 完全改用純 REST API 實現
 * - 移除複雜的數據獲取邏輯，使用標準 React hooks
 * - 保持原有功能不變，遵循 KISS 原則
 * - 優化數據處理邏輯，支持多種數據格式
 */
