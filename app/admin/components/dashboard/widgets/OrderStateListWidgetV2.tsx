/**
 * Order State List Widget V2 - Enhanced Version with useGraphQLFallback
 * 顯示訂單進度列表
 * 遷移自原 OrderStateListWidget
 *
 * Features:
 * - 使用 useGraphQLFallback hook 統一數據獲取
 * - Progressive Loading with useInViewport
 * - 使用 DataTable 組件統一列表顯示
 * - Client-side 進度計算
 * - 保留實時更新功能
 */

'use client';

import React, { useMemo, useRef } from 'react';
import { ClipboardDocumentListIcon, TruckIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { createDashboardAPIClient as createDashboardAPI } from '@/lib/api/admin/DashboardAPI.client';
import { GetOrderStateListDocument } from '@/lib/graphql/generated/apollo-hooks';
import { useGraphQLFallback, GraphQLFallbackPresets } from '@/app/admin/hooks/useGraphQLFallback';
import { useInViewport, InViewportPresets } from '@/app/admin/hooks/useInViewport';
import { DataTable, DataTableColumn } from './common/data-display/DataTable';

// GraphQL 查詢已經移動到 lib/graphql/generated/apollo-hooks.ts

interface OrderProgress {
  uuid: string;
  order_ref: string;
  account_num: string;
  product_code: string;
  product_desc: string;
  product_qty: number;
  loaded_qty: number;
  created_at: string;
  progress: number;
  progress_text: string;
  status: 'pending' | 'in_progress' | 'completed';
  status_color: 'red' | 'yellow' | 'orange' | 'green';
}

export const OrderStateListWidgetV2 = React.memo(function OrderStateListWidgetV2({
  widget,
  isEditMode,
  timeFrame,
}: WidgetComponentProps) {
  const widgetRef = useRef<HTMLDivElement>(null);
  
  // Progressive Loading - 檢測 widget 是否在視窗內
  const { isInViewport, hasBeenInViewport } = useInViewport(widgetRef, InViewportPresets.chart);

  // Server Action fallback
  async function fetchOrdersServerAction() {
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

    if (!widgetData || widgetData.data.error) {
      throw new Error(widgetData?.data.error || 'Failed to load orders data');
    }

    return widgetData.data.value || [];
  }

  // 使用 useGraphQLFallback hook 統一數據獲取
  const { 
    data: rawData, 
    loading, 
    error,
    refetch,
    mode,
    performanceMetrics
  } = useGraphQLFallback({
    graphqlQuery: GetOrderStateListDocument,
    serverAction: fetchOrdersServerAction,
    variables: {
      limit: 50,
      offset: 0,
    },
    skip: isEditMode || !hasBeenInViewport, // Progressive Loading
    widgetId: 'order-state-list',
    ...GraphQLFallbackPresets.cached,
    pollInterval: 30000, // 30秒輪詢
  });

  // 處理數據
  const data = useMemo<OrderProgress[]>(() => {
    if (!rawData) return [];
    
    // 處理 GraphQL 數據 - 計算進度
    if (rawData?.data_orderCollection?.edges) {
      return rawData.data_orderCollection.edges
        .map((edge: any) => {
          const node = edge.node;
          const productQty = node.product_qty || 0;
          const loadedQty = parseInt(node.loaded_qty || '0', 10);
          
          // 計算進度
          const progress = productQty > 0 ? (loadedQty / productQty) * 100 : 0;
          
          // 判斷狀態
          let status: 'pending' | 'in_progress' | 'completed' = 'pending';
          let statusColor: 'red' | 'yellow' | 'orange' | 'green' = 'red';
          
          if (progress >= 100) {
            status = 'completed';
            statusColor = 'green';
          } else if (progress > 0) {
            status = 'in_progress';
            statusColor = progress >= 75 ? 'orange' : 'yellow';
          }

          return {
            uuid: node.uuid,
            order_ref: node.order_ref,
            account_num: node.account_num,
            product_code: node.product_code,
            product_desc: node.product_desc,
            product_qty: productQty,
            loaded_qty: loadedQty,
            created_at: node.created_at,
            progress,
            progress_text: `${loadedQty}/${productQty}`,
            status,
            status_color: statusColor,
          };
        })
        .filter((order: OrderProgress) => order.status !== 'completed'); // 只顯示未完成訂單
    }
    
    // Server Action data is already processed
    return rawData || [];
  }, [rawData]);

  // 定義 DataTable columns
  const columns = useMemo<DataTableColumn<OrderProgress>[]>(() => [
    {
      key: 'order_ref',
      header: 'Order',
      icon: ClipboardDocumentListIcon,
      width: '25%',
      render: (value, item) => (
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'h-2 w-2 flex-shrink-0 rounded-full',
              item.status_color === 'green'
                ? 'bg-green-400'
                : item.status_color === 'orange'
                  ? 'bg-orange-400'
                  : item.status_color === 'yellow'
                    ? 'bg-yellow-400'
                    : item.status_color === 'red'
                      ? 'bg-red-400'
                      : 'bg-slate-400'
            )}
          />
          <span className="font-medium text-white">{value}</span>
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
          <div className="font-medium text-white">{value}</div>
          <div className="mt-0.5 text-xs text-slate-400 truncate">{item.product_desc}</div>
        </div>
      ),
    },
    {
      key: 'progress',
      header: 'Progress',
      width: '25%',
      render: (value, item) => (
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">{item.progress_text}</span>
            <span className="font-medium text-white">{Math.round(value)}%</span>
          </div>
          <Progress value={value} className="h-2" />
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
        <div className="flex justify-center">
          {item.status === 'completed' && (
            <TruckIcon className="h-4 w-4 text-green-400" />
          )}
          {item.status === 'in_progress' && (
            <span className={cn(
              'text-xs font-medium',
              item.status_color === 'orange' ? 'text-orange-400' : 'text-yellow-400'
            )}>
              {item.progress >= 75 ? 'Almost' : 'Loading'}
            </span>
          )}
          {item.status === 'pending' && (
            <span className="text-xs font-medium text-red-400">Pending</span>
          )}
        </div>
      ),
    },
  ], []);

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
          title="Order Progress"
          icon={ClipboardDocumentListIcon}
          iconColor="from-blue-500 to-cyan-500"
          data={[]}
          columns={columns}
          empty={true}
          emptyMessage="Order State List Widget V2"
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
          title="Order Progress"
          icon={ClipboardDocumentListIcon}
          iconColor="from-blue-500 to-cyan-500"
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
        title="Order Progress"
        subtitle={`${metadata.pendingCount} pending orders`}
        icon={ClipboardDocumentListIcon}
        iconColor="from-blue-500 to-cyan-500"
        data={data || []}
        columns={columns}
        keyField="uuid"
        loading={loading}
        error={error}
        empty={(data || []).length === 0}
        emptyMessage="All orders completed"
        emptyIcon={ClipboardDocumentListIcon}
        pagination={{
          enabled: false, // 固定顯示 50 筆記錄，無分頁
        }}
        performanceMetrics={{
          source: mode,
          fetchTime: performanceMetrics?.queryTime,
          optimized: true,
        }}
        connectionStatus={
          mode === 'graphql' 
            ? { type: 'graphql', label: '⚡ GraphQL' }
            : mode === 'context'
            ? { type: 'polling', label: '🚀 Batch Query' }
            : undefined
        }
        onRefresh={refetch}
        showRefreshButton={true}
        animate={true}
        rowClassName={(item) => 
          cn(
            'transition-colors hover:bg-slate-700/50',
            item.status === 'completed' && 'opacity-50'
          )
        }
      />
    </div>
  );
});

export default OrderStateListWidgetV2;

/**
 * Order State List Widget V2 - Enhanced Version
 * 
 * Features:
 * - ✅ useGraphQLFallback hook 統一數據獲取
 * - ✅ Progressive Loading with useInViewport
 * - ✅ DataTable 統一列表顯示
 * - ✅ 保留實時更新功能 (30秒輪詢)
 * - ✅ Client-side 進度計算和狀態判斷
 * - ✅ 支持 DashboardDataContext 批量查詢
 * - ✅ 自動 GraphQL → Server Action fallback
 * 
 * Updates (2025-01-10):
 * - 使用 useGraphQLFallback 替換自定義 GraphQL/Server Actions 切換邏輯
 * - 使用 DataTable 組件替換自定義列表渲染
 * - 實施 Progressive Loading 優化首屏加載
 * - 增強性能監控和錯誤處理
 */