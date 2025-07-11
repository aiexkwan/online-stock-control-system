/**
 * Production Details Widget - DataTable Version
 * 顯示生產詳情表格
 * 使用 DataTable 統一顯示邏輯
 * 
 * GraphQL Migration:
 * - 遷移至 Apollo Client
 * - 支援實時數據更新
 * - 保留 Server Actions fallback
 */

'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { format, startOfDay, endOfDay } from 'date-fns';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { TableCellsIcon } from '@heroicons/react/24/outline';
import { createDashboardAPI } from '@/lib/api/admin/DashboardAPI';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { useGetProductionDetailsQuery } from '@/lib/graphql/generated/apollo-hooks';
import { DataTable } from './common/data-display/DataTable';
import type { Column, TableData } from './common/data-display/DataTable';

interface ProductionDetailsWidgetProps extends WidgetComponentProps {
  title: string;
  limit?: number;
  useGraphQL?: boolean;
}

export const ProductionDetailsWidget: React.FC<ProductionDetailsWidgetProps> = ({ 
  title, 
  timeFrame,
  isEditMode,
  limit = 50,
  useGraphQL,
  widget
}) => {
  const dashboardAPI = useMemo(() => createDashboardAPI(), []);

  // 根據 timeFrame 設定查詢時間範圍
  const dateRange = useMemo(() => {
    if (!timeFrame) {
      // 默認使用今天
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      return {
        start: today,
        end: tomorrow,
      };
    }
    return {
      start: timeFrame.start,
      end: timeFrame.end,
    };
  }, [timeFrame]);

  // 使用環境變量控制是否使用 GraphQL
  const shouldUseGraphQL = process.env.NEXT_PUBLIC_ENABLE_GRAPHQL_INJECTION === 'true' || 
                          (useGraphQL ?? widget?.config?.useGraphQL ?? false);

  // Apollo GraphQL 查詢 - 使用生成嘅 hook
  const { 
    data: graphqlData, 
    loading: graphqlLoading, 
    error: graphqlError 
  } = useGetProductionDetailsQuery({
    skip: !shouldUseGraphQL || isEditMode,
    variables: {
      startDate: startOfDay(dateRange.start).toISOString(),
      endDate: endOfDay(dateRange.end).toISOString(),
      limit: limit
    },
    pollInterval: 300000, // 5分鐘輪詢
    fetchPolicy: 'cache-and-network',
  });

  // Server Actions fallback
  const [serverActionsData, setServerActionsData] = useState<any[]>([]);
  const [serverActionsLoading, setServerActionsLoading] = useState(!shouldUseGraphQL);
  const [serverActionsError, setServerActionsError] = useState<string | null>(null);
  const [serverActionsMetadata, setServerActionsMetadata] = useState<any>({});

  useEffect(() => {
    if (isEditMode || shouldUseGraphQL) return;

    const fetchData = async () => {
      setServerActionsLoading(true);
      setServerActionsError(null);

      try {
        // 使用統一的 DashboardAPI 獲取數據
        const result = await dashboardAPI.fetch(
          {
            widgetIds: ['statsCard'],
            dateRange: {
              start: dateRange.start.toISOString(),
              end: dateRange.end.toISOString(),
            },
            params: {
              dataSource: 'production_details',
              limit: limit,
            },
          },
          {
            strategy: 'server',
            cache: { ttl: 300 }, // 5分鐘緩存
          }
        );

        if (result.widgets && result.widgets.length > 0) {
          const widgetData = result.widgets[0];

          if (widgetData.data.error) {
            console.error('[ProductionDetailsWidget] API error:', widgetData.data.error);
            setServerActionsError(widgetData.data.error);
            setServerActionsData([]);
            return;
          }

          const detailsData = widgetData.data.value || [];
          const widgetMetadata = widgetData.data.metadata || {};

          console.log('[ProductionDetailsWidget] API returned data:', detailsData);
          console.log('[ProductionDetailsWidget] Metadata:', widgetMetadata);

          setServerActionsData(detailsData);
          setServerActionsMetadata({ ...widgetMetadata, useGraphQL: false });

        } else {
          console.warn('[ProductionDetailsWidget] No widget data returned from API');
          setServerActionsData([]);
        }
      } catch (err) {
        console.error('[ProductionDetailsWidget] Error fetching data from API:', err);
        setServerActionsError(err instanceof Error ? err.message : 'Unknown error');
        setServerActionsData([]);
      } finally {
        setServerActionsLoading(false);
      }
    };

    fetchData();
  }, [dashboardAPI, dateRange, limit, isEditMode, shouldUseGraphQL]);

  // 處理 GraphQL 數據
  const graphqlTableData = useMemo(() => {
    if (!graphqlData?.record_palletinfoCollection?.edges) {
      return [];
    }

    return graphqlData.record_palletinfoCollection.edges.map((edge: any) => ({
      plt_num: edge.node.plt_num,
      product_code: edge.node.product_code,
      product_qty: edge.node.product_qty,
      qc_by: edge.node.series || 'N/A', // 使用 series 作為 QC By 欄位
      generate_time: edge.node.generate_time,
      plt_remark: edge.node.plt_remark,
      data_code: edge.node.data_code,
    }));
  }, [graphqlData]);

  // 計算 GraphQL metadata
  const graphqlMetadata = useMemo(() => {
    return {
      totalCount: graphqlTableData.length,
      useGraphQL: true,
    };
  }, [graphqlTableData]);

  // 合併數據源
  const tableData = shouldUseGraphQL ? graphqlTableData : serverActionsData;
  const loading = shouldUseGraphQL ? graphqlLoading : serverActionsLoading;
  const error = shouldUseGraphQL ? graphqlError?.message : serverActionsError;
  const metadata = shouldUseGraphQL ? graphqlMetadata : serverActionsMetadata;

  // 定義 DataTable columns
  const columns: Column[] = [
    { 
      key: 'plt_num', 
      header: 'Pallet Number',
      sortable: true
    },
    { 
      key: 'product_code', 
      header: 'Product Code',
      sortable: true
    },
    { 
      key: 'product_qty', 
      header: 'Quantity',
      align: 'right',
      sortable: true,
      render: (value) => typeof value === 'number' ? value.toLocaleString() : value || 'N/A'
    },
    { 
      key: 'qc_by', 
      header: 'QC By',
      sortable: true
    },
    { 
      key: 'generate_time', 
      header: 'Generate Time',
      sortable: true,
      render: (value) => value ? format(new Date(value), 'MMM d, HH:mm') : 'N/A'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="h-full"
    >
      <DataTable
        title={title}
        icon={TableCellsIcon}
        dateRange={{
          start: dateRange.start,
          end: dateRange.end
        }}
        performanceMetrics={metadata?.useGraphQL ? {
          source: 'GraphQL',
          optimized: true
        } : metadata?.rpcFunction ? {
          source: 'Server',
          optimized: true
        } : undefined}
        columns={columns}
        data={tableData as TableData[]}
        loading={loading}
        error={error ? new Error(error) : undefined}
        emptyMessage="No production data available for the selected period"
        pagination={false}
        pageSize={limit}
        onLoadMore={undefined}
        hasMore={false}
        height="100%"
      />
    </motion.div>
  );
};