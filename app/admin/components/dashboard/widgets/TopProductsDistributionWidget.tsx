/**
 * Top Products Distribution Widget - REST API Version
 * 顯示指定時間範圍內產量最高的前10個產品的分布圖（Donut Chart）
 * 用於 Injection Dashboard
 * 
 * REST API 版本，已移除所有 GraphQL 相關代碼
 */

'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UniversalWidgetCard as WidgetCard } from '../UniversalWidgetCard';
import { ChartPieIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { format, startOfDay, endOfDay } from 'date-fns';
import { createDashboardAPIClient as createDashboardAPI } from '@/lib/api/admin/DashboardAPI.client';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
// Note: Migrated to REST API - GraphQL hooks removed
import { WidgetSkeleton } from './common/WidgetStates';

interface ChartData {
  name: string;
  value: number;
  percentage: number;
  colour?: string;
}

// 預設顏色調色板
const COLORS = [
  '#3B82F6', // blue-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
  '#06B6D4', // cyan-500
  '#84CC16', // lime-500
  '#F97316', // orange-500
  '#6366F1', // indigo-500
];

export const TopProductsDistributionWidget = React.memo(function TopProductsDistributionWidget({
  widget,
  isEditMode,
  timeFrame,
}: WidgetComponentProps) {
  const [chartData, setChartData] = useState<ChartData[]>([]);

  // 根據 timeFrame 設定查詢時間範圍
  const { startDate, endDate } = useMemo(() => {
    if (!timeFrame) {
      const today = new Date();
      return {
        startDate: startOfDay(today).toISOString(),
        endDate: endOfDay(today).toISOString(),
      };
    }
    return {
      startDate: timeFrame.start.toISOString(),
      endDate: timeFrame.end.toISOString(),
    };
  }, [timeFrame as string]);

  // 使用 REST API 獲取數據
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditMode) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const dashboardAPI = createDashboardAPI();
        const result = await dashboardAPI.fetch(
          {
            widgetIds: ['top_products_distribution'],
            dateRange: { start: startDate, end: endDate },
          },
          {
            strategy: 'client',
            cache: { ttl: 300 }, // 5-minute cache
          }
        );

        const widgetData = result.widgets?.find(
          w => w.widgetId === 'top_products_distribution'
        );

        if (widgetData && !widgetData.data.error) {
          const rawData = widgetData.data.value || [];
          
          // 轉換為圖表數據格式，計算百分比
          const total = rawData.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
          
          const chartData: ChartData[] = rawData.map((item: any, index: number) => ({
            name: item.product_code || item.name,
            value: item.quantity || item.value || 0,
            percentage: total > 0 ? ((item.quantity || item.value || 0) / total) * 100 : 0,
            colour: item.colour || COLORS[index % COLORS.length],
          }));
          
          setChartData(chartData);
        } else {
          throw new Error(widgetData?.data.error || 'No data received');
        }
      } catch (err) {
        console.error('Error fetching product distribution:', err);
        setError(err instanceof Error ? (err as { message: string }).message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate, isEditMode]);

  // 獲取實際數據時間範圍（用於顯示）
  const displayDateRange = useMemo(() => {
    const start = timeFrame?.start || new Date();
    const end = timeFrame?.end || new Date();
    
    if (format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')) {
      return format(start, 'MMM d, yyyy');
    }
    
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
  }, [timeFrame as string]);

  // 自定義 Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className='rounded-lg bg-slate-800 p-2 shadow-lg border border-slate-700'>
          <p className='text-sm font-medium text-white'>{data.name}</p>
          <p className='text-xs text-slate-400'>
            Quantity: {data.value.toLocaleString()}
          </p>
          <p className='text-xs text-slate-400'>
            Percentage: {data.payload.percentage.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  if (isEditMode) {
    return (
      <WidgetCard widgetType='custom' isEditMode={true}>
        <div className='flex h-full items-center justify-center'>
          <p className='font-medium text-slate-400'>Top Products Distribution</p>
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard widgetType='custom'>
      <CardHeader className='pb-2'>
        <CardTitle className='widget-title flex items-center gap-2'>
          <ChartPieIcon className='h-5 w-5' />
          Top 10 Products Distribution
        </CardTitle>
        <p className='mt-1 text-xs text-slate-400'>
          {displayDateRange}
          <span className='ml-2 text-xs text-green-400'>✓ REST API</span>
        </p>
      </CardHeader>
      <CardContent className='flex-1'>
        {loading ? (
          <WidgetSkeleton type="chart-pie" height={200} />
        ) : error ? (
          <div className='flex h-full items-center justify-center'>
            <div className='text-center text-sm text-red-400'>
              <p>Error loading data</p>
              <p className='mt-1 text-xs'>{error}</p>
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className='flex h-full items-center justify-center'>
            <p className='text-sm text-slate-400'>No production data</p>
          </div>
        ) : (
          <ResponsiveContainer width='100%' height='100%'>
            <PieChart>
              <Pie
                data={chartData}
                cx='50%'
                cy='50%'
                labelLine={false}
                outerRadius={80}
                innerRadius={40}
                fill='#8884d8'
                dataKey='value'
                animationBegin={0}
                animationDuration={800}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.colour || COLORS[index % COLORS.length]} 
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign='middle' 
                align='right' 
                layout='vertical'
                formatter={(value, entry: any) => (
                  <span className='text-xs text-slate-300'>
                    {value} ({entry.payload.percentage.toFixed(1)}%)
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </WidgetCard>
  );
});

export default TopProductsDistributionWidget;

/**
 * GraphQL to REST API Migration completed on 2025-07-16
 * 
 * Changes:
 * - Removed all GraphQL dependencies (Apollo Client, useGetTopProductsByQuantityQuery)
 * - Converted to pure REST API usage via Dashboard API client
 * - Removed environment variable control logic (NEXT_PUBLIC_ENABLE_GRAPHQL_INJECTION)
 * - Removed dual-mode GraphQL/REST architecture
 * - Maintained all functionality with simplified architecture
 * 
 * Features:
 * - Pure REST API data fetching with 5-minute cache
 * - Interactive donut chart with Recharts
 * - Custom tooltips and legends
 * - Responsive design
 * 
 * Performance improvements:
 * - Efficient data processing on client
 * - Dashboard API client cache reduces network requests
 * - Smooth animations with Recharts
 */