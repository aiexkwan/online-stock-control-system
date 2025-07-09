/**
 * Production Details Widget - Hybrid Version (Server Actions + GraphQL)
 * 顯示生產詳情表格
 * 根據 Re-Structure-6.md 建議，支持 GraphQL 優化頻繁時間切換場景
 */

'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { format, startOfDay, endOfDay } from 'date-fns';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { TableCellsIcon } from '@heroicons/react/24/outline';
import { createDashboardAPI } from '@/lib/api/admin/DashboardAPI';
import { useGraphQLQuery } from '@/lib/graphql-client-stable';
import { gql } from 'graphql-tag';
import { print } from 'graphql';
import { WidgetComponentProps } from '@/app/types/dashboard';

// GraphQL query for production details
const GET_PRODUCTION_DETAILS_QUERY = gql`
  query GetProductionDetailsWidget($startDate: Datetime!, $endDate: Datetime!, $limit: Int) {
    record_palletinfoCollection(
      filter: {
        plt_remark: { ilike: "%finished in production%" }
        generate_time: { gte: $startDate, lte: $endDate }
      }
      orderBy: [{ generate_time: DescNullsLast }]
      first: $limit
    ) {
      edges {
        node {
          plt_num
          product_code
          product_qty
          generate_time
          plt_remark
          data_code {
            description
            colour
            type
          }
        }
      }
    }
  }
`;

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
  // 決定是否使用 GraphQL - 可以通過 widget config 或 props 控制
  const widgetConfig = widget?.config as any;
  const shouldUseGraphQL = useGraphQL ?? widgetConfig?.useGraphQL ?? false;
  const [tableData, setTableData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>({});
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

  // GraphQL 查詢參數
  const graphqlVariables = useMemo(() => {
    return {
      startDate: startOfDay(dateRange.start).toISOString(),
      endDate: endOfDay(dateRange.end).toISOString(),
      limit: limit
    };
  }, [dateRange, limit]);

  // GraphQL 查詢 - 只在 shouldUseGraphQL 為 true 時執行
  const { 
    data: graphqlData, 
    loading: graphqlLoading, 
    error: graphqlError 
  } = useGraphQLQuery(
    print(GET_PRODUCTION_DETAILS_QUERY),
    graphqlVariables,
    {
      enabled: shouldUseGraphQL && !isEditMode,
      refetchInterval: 300000, // 5分鐘刷新一次
      cacheTime: 300000, // 5分鐘快取
    }
  );

  // 處理 GraphQL 數據
  useEffect(() => {
    if (shouldUseGraphQL && graphqlData) {
      const edges = graphqlData.record_palletinfoCollection?.edges || [];
      const processedData = edges.map((edge: any) => ({
        plt_num: edge.node.plt_num,
        product_code: edge.node.product_code,
        product_qty: edge.node.product_qty,
        qc_by: edge.node.qc_by,
        generate_time: edge.node.generate_time,
        description: edge.node.data_code?.description,
        colour: edge.node.data_code?.colour,
      }));
      setTableData(processedData);
      setMetadata({ 
        totalCount: graphqlData.record_palletinfoCollection?.totalCount || 0,
        useGraphQL: true 
      });
      setLoading(false);
      setError(null);
    }
  }, [shouldUseGraphQL, graphqlData]);

  // 處理 GraphQL 錯誤
  useEffect(() => {
    if (shouldUseGraphQL && graphqlError) {
      setError(graphqlError.message);
      setLoading(false);
    }
  }, [shouldUseGraphQL, graphqlError]);

  // 處理 GraphQL 載入狀態
  useEffect(() => {
    if (shouldUseGraphQL) {
      setLoading(graphqlLoading);
    }
  }, [shouldUseGraphQL, graphqlLoading]);

  useEffect(() => {
    if (isEditMode || shouldUseGraphQL) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

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
            setError(widgetData.data.error);
            setTableData([]);
            return;
          }

          const detailsData = widgetData.data.value || [];
          const widgetMetadata = widgetData.data.metadata || {};

          console.log('[ProductionDetailsWidget] API returned data:', detailsData);
          console.log('[ProductionDetailsWidget] Metadata:', widgetMetadata);

          setTableData(detailsData);
          setMetadata({ ...widgetMetadata, useGraphQL: false });

        } else {
          console.warn('[ProductionDetailsWidget] No widget data returned from API');
          setTableData([]);
        }
      } catch (err) {
        console.error('[ProductionDetailsWidget] Error fetching data from API:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setTableData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dashboardAPI, dateRange, limit, isEditMode, shouldUseGraphQL]);

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
          {metadata.useGraphQL ? (
            <span className="text-blue-400/70 ml-2">
              ⚡ GraphQL optimized
            </span>
          ) : metadata.rpcFunction ? (
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
                {tableData.map((row, rowIndex) => (
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