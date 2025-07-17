/**
 * Production Stats Widget - MetricCard Version
 * 用於 Admin Dashboard 的生產統計組件
 * 使用 MetricCard 通用組件統一顯示邏輯
 */

'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { CubeIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { createDashboardAPIClient as createDashboardAPI } from '@/lib/api/admin/DashboardAPI.client';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { MetricCard } from './common/data-display/MetricCard';

interface ProductionStatsWidgetProps extends WidgetComponentProps {
  title: string;
  metric: 'pallet_count' | 'quantity_sum';
}

export const ProductionStatsWidget: React.FC<ProductionStatsWidgetProps> = ({ 
  title, 
  metric,
  timeFrame,
  isEditMode,
  widget
}) => {
  const [statValue, setStatValue] = useState(0);
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
  }, [timeFrame as string]);

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
              dataSource: 'production_stats',
              staticValue: metric, // Use staticValue for metric
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
            console.error('[ProductionStatsWidget as string] API error:', widgetData.data.error);
            setError(widgetData.data.error);
            setStatValue(0);
            return;
          }

          const productionValue = widgetData.data.value || 0;
          const widgetMetadata = widgetData.data.metadata || {};

          console.log('[ProductionStatsWidget as string] API returned value:', productionValue);
          console.log('[ProductionStatsWidget as string] Metadata:', widgetMetadata);

          setStatValue(productionValue);
          setMetadata(widgetMetadata);

        } else {
          console.warn('[ProductionStatsWidget as string] No widget data returned from API');
          setStatValue(0);
        }
      } catch (err) {
        console.error('[ProductionStatsWidget as string] Error fetching data from API:', err);
        setError(err instanceof Error ? (err as { message: string }).message : 'Unknown error');
        setStatValue(0);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dashboardAPI, dateRange, metric, isEditMode]);

  // 格式化日期範圍
  const dateRangeText = `${format(new Date(dateRange.start), 'MMM d')} to ${format(new Date(dateRange.end), 'MMM d')}`;

  // 決定標籤文字
  const label = metric === 'pallet_count' ? 'Pallets produced' : 'Total quantity';

  if (isEditMode) {
    return (
      <MetricCard
        title={title}
        value={0}
        label={label}
        icon={CubeIcon}
        isEditMode={true}
      />
    );
  }

  return (
    <MetricCard
      title={title}
      value={statValue}
      label={label}
      icon={CubeIcon}
      dateRange={dateRangeText}
      performanceMetrics={metadata.rpcFunction ? {
        source: 'Server',
        optimized: true
      } : undefined}
      loading={loading}
      error={error ? error : undefined}
      onRetry={() => {
        // Trigger re-fetch by updating state
        window.location.reload();
      }}
      animateOnMount={true}
      widgetType={widget?.type?.toUpperCase() as any}
    />
  );
};