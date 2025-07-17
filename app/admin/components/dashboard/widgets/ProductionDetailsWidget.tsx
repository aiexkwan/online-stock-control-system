/**
 * Production Details Widget - DataTable Version
 * 顯示生產詳情表格
 * 使用 DataTable 統一顯示邏輯
 * 
 * REST API Migration:
 * - 使用 REST API 取代 GraphQL
 * - 簡化數據獲取邏輯
 * - 移除雙模式架構
 */

'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { format, startOfDay, endOfDay } from 'date-fns';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { TableCellsIcon } from '@heroicons/react/24/outline';
import { createDashboardAPIClient as createDashboardAPI } from '@/lib/api/admin/DashboardAPI.client';
import { WidgetComponentProps } from '@/app/types/dashboard';
// Note: Migrated to REST API - GraphQL hooks removed
import { DataTable } from './common/data-display/DataTable';
import type { Column, TableData } from './common/data-display/DataTable';

interface ProductionDetailsWidgetProps extends WidgetComponentProps {
  title: string;
  limit?: number;
  // useGraphQL prop removed - using REST API only
}

export const ProductionDetailsWidget: React.FC<ProductionDetailsWidgetProps> = ({ 
  title, 
  timeFrame,
  isEditMode,
  limit = 50,
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
  }, [timeFrame as string]);

  // REST API state management
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>({});

  useEffect(() => {
    if (isEditMode) return;

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
            console.error('[ProductionDetailsWidget as string] API error:', widgetData.data.error);
            setError(widgetData.data.error);
            setData([]);
            return;
          }

          const detailsData = widgetData.data.value || [];
          const widgetMetadata = widgetData.data.metadata || {};

          console.log('[ProductionDetailsWidget as string] API returned data:', detailsData);
          console.log('[ProductionDetailsWidget as string] Metadata:', widgetMetadata);

          setData(detailsData);
          setMetadata({ ...widgetMetadata, useGraphQL: false });

        } else {
          console.warn('[ProductionDetailsWidget as string] No widget data returned from API');
          setData([]);
        }
      } catch (err) {
        console.error('[ProductionDetailsWidget as string] Error fetching data from API:', err);
        setError(err instanceof Error ? (err as { message: string }).message : 'Unknown error');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dashboardAPI, dateRange, limit, isEditMode]);

  // 直接使用 REST API 數據
  const tableData = data;

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
        performanceMetrics={metadata?.rpcFunction ? {
          source: 'REST API',
          optimized: true
        } : {
          source: 'REST API',
          optimized: false
        }}
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