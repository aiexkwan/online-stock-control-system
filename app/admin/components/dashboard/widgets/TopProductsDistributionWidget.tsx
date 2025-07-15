/**
 * Top Products Distribution Widget - Apollo GraphQL Version
 * 顯示指定時間範圍內產量最高的前10個產品的分布圖（Donut Chart）
 * 用於 Injection Dashboard
 * 
 * GraphQL Migration:
 * - 使用 Apollo Client 查詢
 * - 支援 cache-and-network 策略
 * - 保留 Server Actions fallback
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
  }, [timeFrame]);

  // 使用環境變量控制是否使用 GraphQL
  const useGraphQL = process.env.NEXT_PUBLIC_ENABLE_GRAPHQL_INJECTION === 'true' || 
                     widget?.config?.useGraphQL === true;

  // GraphQL 查詢 - 使用生成嘅 hook (同 TopProductsByQuantityWidget 共享)
  const { 
    data: graphqlData, 
    loading: graphqlLoading, 
    error: graphqlError 
  } = useGetTopProductsByQuantityQuery({
    skip: !useGraphQL || isEditMode,
    variables: { startDate, endDate },
    pollInterval: 300000, // 5分鐘輪詢
    fetchPolicy: 'cache-and-network',
    onCompleted: (data) => {
      // 處理查詢結果：按產品代碼聚合數量
      const productMap = new Map<string, { qty: number; description?: string; colour?: string }>();
      
      data?.record_palletinfoCollection?.edges?.forEach((edge: any) => {
        const { product_code, product_qty, data_code } = edge.node;
        
        if (productMap.has(product_code)) {
          const existing = productMap.get(product_code)!;
          existing.qty += product_qty || 0;
        } else {
          productMap.set(product_code, {
            qty: product_qty || 0,
            description: data_code?.description,
            colour: data_code?.colour,
          });
        }
      });
      
      // 排序並取前10個
      const sorted = Array.from(productMap.entries())
        .sort((a, b) => b[1].qty - a[1].qty)
        .slice(0, 10);
      
      // 計算總數
      const total = sorted.reduce((sum, [_, data]) => sum + data.qty, 0);
      
      // 轉換為圖表數據格式
      const chartData: ChartData[] = sorted.map(([code, data], index) => ({
        name: code,
        value: data.qty,
        percentage: (data.qty / total) * 100,
        colour: data.colour || COLORS[index % COLORS.length],
      }));
      
      setChartData(chartData);
    }
  });

  // Server Actions fallback
  const [serverActionsLoading, setServerActionsLoading] = useState(!useGraphQL);
  const [serverActionsError, setServerActionsError] = useState<string | null>(null);

  useEffect(() => {
    if (useGraphQL || isEditMode) return;

    const fetchData = async () => {
      setServerActionsLoading(true);
      setServerActionsError(null);

      try {
        const dashboardAPI = createDashboardAPI();
        const result = await dashboardAPI.fetch(
          {
            widgetIds: ['top_products_distribution'],
            dateRange: { start: startDate, end: endDate },
          },
          {
            strategy: 'server',
            cache: { ttl: 300 },
          }
        );

        if (result.widgets && result.widgets.length > 0) {
          const data = result.widgets[0].data;
          if (data.chartData) {
            setChartData(data.chartData);
          }
        }
      } catch (err) {
        console.error('Error fetching product distribution:', err);
        setServerActionsError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setServerActionsLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate, useGraphQL, isEditMode]);

  // 合併 loading 和 error 狀態
  const loading = useGraphQL ? graphqlLoading : serverActionsLoading;
  const error = useGraphQL ? graphqlError?.message : serverActionsError;

  // 獲取實際數據時間範圍（用於顯示）
  const displayDateRange = useMemo(() => {
    const start = timeFrame?.start || new Date();
    const end = timeFrame?.end || new Date();
    
    if (format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')) {
      return format(start, 'MMM d, yyyy');
    }
    
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
  }, [timeFrame]);

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
          {useGraphQL && (
            <span className='ml-2 text-xs text-blue-400'>⚡ GraphQL</span>
          )}
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
 * GraphQL Migration completed on 2025-07-09
 * 
 * Features:
 * - Apollo Client with cache-and-network policy
 * - 5-minute polling for real-time updates
 * - Interactive donut chart with Recharts
 * - Custom tooltips and legends
 * - Feature flag control: NEXT_PUBLIC_ENABLE_GRAPHQL_INJECTION
 * 
 * Performance improvements:
 * - Efficient data aggregation on client
 * - Apollo cache reduces network requests
 * - Smooth animations with Recharts
 */