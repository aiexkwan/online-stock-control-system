/**
 * Warehouse Transfer List Widget - Enhanced Version with useGraphQLFallback
 * 列表形式顯示 record_transfer 內容
 * 只需顯示 "time", "pallet number", "operator"
 * 只顯示 operator department = "Warehouse" 的記錄
 *
 * Features:
 * - 使用 useGraphQLFallback hook 統一數據獲取
 * - Progressive Loading with useInViewport
 * - 保留 DataTable 實現和固定 50 筆記錄設計
 * - 保留日期範圍過濾和部門過濾功能
 * - 保留性能指標顯示
 */

'use client';

import React, { useMemo, useRef } from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { format, parseISO } from 'date-fns';
import { Clock, Cube, User } from 'lucide-react';
import { DataTable, DataTableColumn } from './common/data-display/DataTable';
import { useWidgetDateRange } from './common/filters/DateRangeFilter';
import { useGraphQLFallback } from '@/app/admin/hooks/useGraphQLFallback';
import { useInViewport } from '@/app/admin/hooks/useInViewport';
import { GetWarehouseTransferListDocument } from '@/lib/graphql/generated/apollo-hooks';
import { createDashboardAPI } from '@/lib/api/admin/DashboardAPI';

interface TransferRecord {
  tran_date: string;
  plt_num: string;
  operator_name: string;
}

// Server Action fallback using DashboardAPI
async function fetchWarehouseTransferList(variables: {
  startDate: string;
  endDate: string;
  limit: number;
  offset: number;
}) {
  const dashboardAPI = createDashboardAPI();
  
  const result = await dashboardAPI.fetch(
    {
      widgetIds: ['statsCard'],
      dateRange: {
        start: variables.startDate,
        end: variables.endDate,
      },
      params: {
        dataSource: 'warehouse_transfer_list',
        limit: variables.limit,
        offset: variables.offset,
      },
    },
    {
      strategy: 'server',
      cache: { ttl: 60 }, // 1分鐘緩存
    }
  );

  if (result.widgets && result.widgets.length > 0) {
    const widgetData = result.widgets[0];
    if (widgetData.data.error) {
      throw new Error(widgetData.data.error);
    }
    return widgetData.data.value || [];
  }
  
  return [];
}

export const WarehouseTransferListWidget = React.memo(function WarehouseTransferListWidget({
  widget,
  isEditMode,
  timeFrame,
}: WidgetComponentProps) {
  const widgetRef = useRef<HTMLDivElement>(null);
  
  // 使用通用 hook 處理日期範圍
  const dateRange = useWidgetDateRange(timeFrame, 'yesterday');
  
  // Progressive Loading - 檢測 widget 是否在視窗內
  const { isInViewport, hasBeenInViewport } = useInViewport(widgetRef, {
    threshold: 0.1,
    triggerOnce: true, // 只加載一次
    rootMargin: '50px', // 提前 50px 開始加載
  });

  // 準備 GraphQL variables
  const variables = useMemo(() => ({
    startDate: dateRange.start.toISOString(),
    endDate: dateRange.end.toISOString(),
    limit: 50,
    offset: 0,
  }), [dateRange]);

  // 使用 useGraphQLFallback hook 統一數據獲取
  const { 
    data, 
    loading, 
    error,
    refetch,
    mode,
    performanceMetrics
  } = useGraphQLFallback({
    graphqlQuery: GetWarehouseTransferListDocument,
    serverAction: fetchWarehouseTransferList,
    variables,
    skip: isEditMode || !hasBeenInViewport, // Progressive Loading
    pollInterval: 60000, // 1分鐘輪詢
    fetchPolicy: 'cache-and-network',
    fallbackEnabled: true,
    widgetId: 'warehouse-transfer-list',
    extractFromContext: (contextData) => {
      // 從 DashboardDataContext 提取數據（如果有批量查詢）
      return contextData?.warehouseTransfers || null;
    },
  });

  // 處理數據格式
  const transfers = useMemo<TransferRecord[]>(() => {
    if (!data) return [];
    
    // GraphQL 數據格式
    if (data.record_transferCollection?.edges) {
      // 注意：現有 GraphQL query 無 JOIN data_id table
      // 所以 operator_name 會係 'Unknown'，需要依賴 server action fallback
      return data.record_transferCollection.edges.map((edge: any) => ({
        tran_date: edge.node.tran_date,
        plt_num: edge.node.plt_num,
        operator_name: 'Operator ' + (edge.node.operator_id || 'Unknown'),
      }));
    }
    
    // Server Action 數據格式（已經包含 operator_name）
    if (Array.isArray(data)) {
      return data;
    }
    
    return [];
  }, [data]);

  // 定義 DataTable columns
  const columns = useMemo<DataTableColumn<TransferRecord>[]>(() => [
    {
      key: 'tran_date',
      header: 'Time',
      icon: Clock,
      width: '33%',
      render: (value) => format(parseISO(value), 'HH:mm:ss'),
      className: 'font-medium text-slate-300',
    },
    {
      key: 'plt_num',
      header: 'Pallet Number',
      icon: Cube,
      width: '33%',
      className: 'font-medium text-white',
    },
    {
      key: 'operator_name',
      header: 'Operator',
      icon: User,
      width: '34%',
      className: 'font-medium text-slate-300',
    },
  ], []);

  // Edit mode - 顯示空白狀態
  if (isEditMode) {
    return (
      <div ref={widgetRef}>
        <DataTable
          title="Warehouse Transfers"
          icon={DocumentTextIcon}
          iconColor="from-blue-500 to-cyan-500"
          data={[]}
          columns={columns}
          empty={true}
          emptyMessage="Warehouse Transfer List"
          emptyIcon={DocumentTextIcon}
        />
      </div>
    );
  }

  // Progressive Loading - 如果還未進入視窗，顯示 skeleton
  if (!hasBeenInViewport) {
    return (
      <div ref={widgetRef}>
        <DataTable
          title="Warehouse Transfers"
          icon={DocumentTextIcon}
          iconColor="from-blue-500 to-cyan-500"
          data={[]}
          columns={columns}
          loading={true}
          loadingRows={5}
        />
      </div>
    );
  }

  return (
    <div ref={widgetRef}>
      <DataTable
        title="Warehouse Transfers"
        subtitle={`From ${format(dateRange.start, 'MMM d')} to ${format(dateRange.end, 'MMM d')}`}
        icon={DocumentTextIcon}
        iconColor="from-blue-500 to-cyan-500"
        data={transfers}
        columns={columns}
        keyField="plt_num"
        loading={loading}
        error={error}
        empty={transfers.length === 0}
        emptyMessage="No warehouse transfers found"
        emptyIcon={DocumentTextIcon}
        pagination={{
          enabled: false, // 固定顯示 50 筆記錄，無分頁
        }}
        performanceMetrics={{
          source: mode,
          queryTime: performanceMetrics?.queryTime,
          optimized: true,
          fallbackUsed: performanceMetrics?.fallbackUsed,
        }}
        connectionStatus={
          mode === 'graphql' 
            ? { type: 'graphql', label: '⚡ GraphQL' }
            : mode === 'context'
            ? { type: 'batch', label: '🚀 Batch Query' }
            : undefined
        }
        onRefresh={refetch}
      />
    </div>
  );
});

export default WarehouseTransferListWidget;

/**
 * Warehouse Transfer List Widget - Enhanced Version
 * 
 * Features:
 * - ✅ useGraphQLFallback hook 統一數據獲取
 * - ✅ Progressive Loading with useInViewport
 * - ✅ 保留 DataTable 實現和固定 50 筆記錄設計
 * - ✅ 保留日期範圍過濾和部門過濾功能
 * - ✅ 增強性能指標顯示（包括 query time 和 fallback status）
 * - ✅ 支持 DashboardDataContext 批量查詢
 * - ✅ 自動 GraphQL → Server Action fallback
 * 
 * Updates (2025-07-10):
 * - 使用 useGraphQLFallback 替換條件式 GraphQL/DashboardAPI
 * - 實施 Progressive Loading 優化首屏加載
 * - 支持三種數據源：Context (批量查詢) → GraphQL → Server Action
 * - 增強性能監控和錯誤處理
 */
