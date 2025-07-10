/**
 * Production Details Widget - Apollo GraphQL Version
 * 顯示生產詳情表格
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
import { useGetProductionDetailsWidgetQuery } from '@/lib/graphql/generated/apollo-hooks';

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
  } = useGetProductionDetailsWidgetQuery({
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

  // 表格頭部
  const headers = ['Pallet Number', 'Product Code', 'Quantity', 'QC By', 'Generate Time'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="h-full flex flex-col relative"
    >
      
      <CardHeader className="pb-2">
        <CardTitle className="widget-title flex items-center gap-2">
          <TableCellsIcon className="w-5 h-5" />
          {title}
        </CardTitle>
        <p className="text-xs text-slate-400 mt-1">
          From {format(new Date(dateRange.start), 'MMM d')} to {format(new Date(dateRange.end), 'MMM d')}
          {metadata?.useGraphQL ? (
            <span className="text-blue-400/70 ml-2">
              ⚡ GraphQL optimized
            </span>
          ) : metadata?.rpcFunction ? (
            <span className="text-green-400/70 ml-2">
              ✓ Server optimized
            </span>
          ) : null}
        </p>
      </CardHeader>
      
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="animate-pulse p-4">
            <div className="h-10 bg-slate-700 rounded mb-2"></div>
            <div className="space-y-1">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-8 bg-slate-700/50 rounded"></div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="text-red-400 text-sm text-center h-full flex items-center justify-center">
            Error loading data: {error}
          </div>
        ) : tableData.length === 0 ? (
          <div className="text-slate-400 text-sm text-center h-full flex items-center justify-center">
            No production data available for the selected period
          </div>
        ) : (
          <div className="overflow-x-auto h-full">
            <table className="w-full">
              <thead className="sticky top-0 bg-slate-800/90 z-10">
                <tr className="border-b border-slate-700">
                  {headers.map((header, index) => (
                    <th key={index} className="text-left py-2 px-3 text-xs font-medium text-gray-400 uppercase whitespace-nowrap">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.map((row: any, rowIndex: number) => (
                  <tr key={rowIndex} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                    <td className="py-2 px-3 text-sm text-white whitespace-nowrap">
                      {row.plt_num || 'N/A'}
                    </td>
                    <td className="py-2 px-3 text-sm text-slate-300 whitespace-nowrap">
                      {row.product_code || 'N/A'}
                    </td>
                    <td className="py-2 px-3 text-sm text-slate-300 text-right">
                      {typeof row.product_qty === 'number' ? row.product_qty.toLocaleString() : row.product_qty || 'N/A'}
                    </td>
                    <td className="py-2 px-3 text-sm text-slate-300 whitespace-nowrap">
                      {row.qc_by || 'N/A'}
                    </td>
                    <td className="py-2 px-3 text-sm text-slate-400 whitespace-nowrap">
                      {row.generate_time ? format(new Date(row.generate_time), 'MMM d, HH:mm') : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
};