/**
 * Top Products Chart Widget - ChartContainer Version
 * 顯示產品數量排名條形圖
 * 使用 ChartContainer 和 Progressive Loading
 */

'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { createDashboardAPI } from '@/lib/api/admin/DashboardAPI';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { ChartContainer } from './common/charts/ChartContainer';
import { useInViewport } from '@/app/admin/hooks/useInViewport';

interface TopProductsChartWidgetProps extends WidgetComponentProps {
  title: string;
  limit?: number;
}

export const TopProductsChartWidget: React.FC<TopProductsChartWidgetProps> = ({ 
  title, 
  timeFrame,
  isEditMode,
  limit = 10,
  widget
}) => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>({});
  const dashboardAPI = useMemo(() => createDashboardAPI(), []);

  // Lazy loading with viewport detection
  const targetRef = React.useRef<HTMLDivElement>(null);
  const { isInViewport, hasBeenInViewport } = useInViewport(targetRef, {
    threshold: 0.1,
    rootMargin: '50px',
    triggerOnce: true
  });

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
            dataSource: 'top_products',
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
          console.error('[TopProductsChartWidget] API error:', widgetData.data.error);
          setError(widgetData.data.error);
          setChartData([]);
          return;
        }

        const topProductsData = widgetData.data.value || [];
        const widgetMetadata = widgetData.data.metadata || {};

        console.log('[TopProductsChartWidget] API returned data:', topProductsData);
        console.log('[TopProductsChartWidget] Metadata:', widgetMetadata);

        setChartData(topProductsData);
        setMetadata(widgetMetadata);

      } else {
        console.warn('[TopProductsChartWidget] No widget data returned from API');
        setChartData([]);
      }
    } catch (err) {
      console.error('[TopProductsChartWidget] Error fetching data from API:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isEditMode || !hasBeenInViewport) return;
    fetchData();
  }, [dashboardAPI, dateRange, limit, isEditMode, hasBeenInViewport]);

  // 自定義 Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">{label}</p>
          <p className="text-blue-400">
            Quantity: <span className="font-semibold">{data.value.toLocaleString()}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Calculate total quantity
  const totalQuantity = useMemo(() => {
    return chartData.reduce((sum, item) => sum + (item.value || 0), 0);
  }, [chartData]);

  // Calculate top product
  const topProduct = useMemo(() => {
    if (chartData.length === 0) return null;
    return chartData[0];
  }, [chartData]);

  const stats = [
    {
      label: 'Total Quantity',
      value: totalQuantity.toLocaleString(),
    },
    topProduct && {
      label: 'Top Product',
      value: topProduct.name,
    }
  ].filter(Boolean);

  return (
    <div ref={targetRef} className="h-full">
      <ChartContainer
        title={title}
        icon={ChartBarIcon}
        iconColor="from-blue-500 to-cyan-500"
        dateRange={dateRange}
        loading={loading && hasBeenInViewport}
        error={error ? new Error(error) : null}
        onRetry={fetchData}
        onRefresh={fetchData}
        height="100%"
        chartType="bar"
        performanceMetrics={metadata.rpcFunction ? {
          source: 'Server',
          optimized: true
        } : undefined}
        stats={stats as any}
        showFooter={true}
        widgetType={widget?.type?.toUpperCase()}
      >
        {chartData.length === 0 ? (
          <div className="text-slate-400 text-sm text-center h-full flex items-center justify-center">
            No data available for the selected period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="name" 
                stroke="#9CA3AF"
                fontSize={12}
                tick={{ fill: '#9CA3AF' }}
              />
              <YAxis 
                stroke="#9CA3AF"
                fontSize={12}
                tick={{ fill: '#9CA3AF' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="value" 
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartContainer>
    </div>
  );
};