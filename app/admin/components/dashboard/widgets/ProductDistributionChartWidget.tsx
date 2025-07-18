/**
 * Product Distribution Chart Widget - ChartContainer Version
 * 顯示產品分佈圓餅圖
 * 使用 ChartContainer 和 Progressive Loading
 */

'use client';

import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { ChartPieIcon } from '@heroicons/react/24/outline';
import { createDashboardAPIClient as createDashboardAPI } from '@/lib/api/admin/DashboardAPI.client';
import { TraditionalWidgetComponentProps } from '@/app/types/dashboard';
import { ChartContainer } from './common/charts/ChartContainer';
import { useInViewport } from '@/app/admin/hooks/useInViewport';
import { 
  brandColors, 
  widgetColors, 
  semanticColors,
  getWidgetCategoryColor 
} from '@/lib/design-system/colors';
import { textClasses, getTextClass } from '@/lib/design-system/typography';
import { spacing, widgetSpacing, spacingUtilities } from '@/lib/design-system/spacing';
import { cn } from '@/lib/utils';

interface ProductDistributionChartWidgetProps extends TraditionalWidgetComponentProps {
  title: string;
  limit?: number;
}

// 顏色配置 - 使用設計系統顏色
const COLORS = [
  String(widgetColors.charts.primary) || '#3B82F6',
  String(semanticColors.success.DEFAULT) || '#10B981',
  String(semanticColors.warning.DEFAULT) || '#F59E0B',
  String(semanticColors.destructive.DEFAULT) || '#EF4444',
  String(brandColors.primary) || '#6366F1',
  String(semanticColors.info.DEFAULT) || '#3B82F6',
  String(brandColors.secondary) || '#8B5CF6',
  String(widgetColors.charts.grid) || '#6B7280',
  String(widgetColors.charts.accent) || '#EC4899',
  String(brandColors.primary) || '#3B82F6'
];

export const ProductDistributionChartWidget: React.FC<ProductDistributionChartWidgetProps> = ({ 
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

  const fetchData = useCallback(async () => {
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
            dataSource: 'product_distribution',
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
          console.error('[ProductDistributionChartWidget as string] API error:', widgetData.data.error);
          setError(widgetData.data.error);
          setChartData([]);
          return;
        }

        const distributionData = widgetData.data.value || [];
        const widgetMetadata = widgetData.data.metadata || {};

        console.log('[ProductDistributionChartWidget as string] API returned data:', distributionData);
        console.log('[ProductDistributionChartWidget as string] Metadata:', widgetMetadata);

        setChartData(distributionData);
        setMetadata(widgetMetadata);

      } else {
        console.warn('[ProductDistributionChartWidget as string] No widget data returned from API');
        setChartData([]);
      }
    } catch (err) {
      console.error('[ProductDistributionChartWidget as string] Error fetching data from API:', err);
      setError(err instanceof Error ? (err as { message: string }).message : 'Unknown error');
      setChartData([]);
    } finally {
      setLoading(false);
    }
  }, [dashboardAPI, dateRange, limit]);

  useEffect(() => {
    if (isEditMode || !hasBeenInViewport) return;
    fetchData();
  }, [dashboardAPI, dateRange, limit, isEditMode, hasBeenInViewport, fetchData]);

  // 計算總數
  const total = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.value, 0);
  }, [chartData]);

  // 自定義 Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : '0';
      return (
        <div className={cn(
          'bg-card border border-border rounded-lg p-3 shadow-lg'
        )}>
          <p className={cn(textClasses['body-small'], 'font-medium text-foreground')}>{data.payload.name}</p>
          <p className={cn(textClasses['label-small'])} style={{ color: widgetColors.charts.primary }}>
            Quantity: <span className="font-semibold">{data.value.toLocaleString()}</span>
          </p>
          <p className={cn(textClasses['label-small'])} style={{ color: semanticColors.success.DEFAULT }}>
            Percentage: <span className="font-semibold">{percentage}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Calculate stats
  const productCount = chartData.length;
  const topProduct = chartData.length > 0 ? chartData[0] : null;

  const stats = [
    {
      label: 'Total Products',
      value: productCount,
    },
    {
      label: 'Total Quantity',
      value: total.toLocaleString(),
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
        icon={ChartPieIcon}
        iconColor="from-purple-500 to-pink-500"
        dateRange={dateRange}
        loading={loading && hasBeenInViewport}
        error={error ? new Error(error) : null}
        onRetry={fetchData}
        onRefresh={fetchData}
        height="100%"
        chartType="pie"
        performanceMetrics={metadata.rpcFunction ? {
          source: 'Server',
          optimized: true
        } : undefined}
        stats={stats as any}
        showFooter={true}
        widgetType={widget?.type?.toUpperCase()}
      >
        {chartData.length === 0 ? (
          <div className={cn(
            'text-center h-full flex items-center justify-center',
            textClasses['body-small'],
            'text-muted-foreground'
          )}>
            No data available for the selected period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry) => (
                  <span className={cn(textClasses['label-small'], 'text-muted-foreground')}>
                    {value} ({entry?.payload ? ((entry.payload.value / total) * 100).toFixed(1) : '0'}%)
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartContainer>
    </div>
  );
};