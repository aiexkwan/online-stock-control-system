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
import { TraditionalWidgetComponentProps } from '@/types/components/dashboard';
import { MetricCard } from './common/data-display/MetricCard';

interface ProductionStatsWidgetProps extends TraditionalWidgetComponentProps {
  title: string;
  metric: 'pallet_count' | 'quantity_sum';
}

export const ProductionStatsWidget: React.FC<ProductionStatsWidgetProps> = ({
  title,
  metric,
  timeFrame,
  isEditMode,
  widget,
}) => {
  const [statValue, setStatValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<Record<string, unknown>>({});
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

          if (
            typeof widgetData.data === 'object' &&
            widgetData.data !== null &&
            'error' in widgetData.data &&
            widgetData.data.error
          ) {
            const errorMsg = String(widgetData.data.error);
            console.error('[ProductionStatsWidget as string] API error:', errorMsg);
            setError(errorMsg);
            setStatValue(0);
            return;
          }

          const productionValue =
            typeof widgetData.data === 'object' &&
            widgetData.data !== null &&
            'value' in widgetData.data
              ? widgetData.data.value
              : 0;
          const widgetMetadata =
            typeof widgetData.data === 'object' &&
            widgetData.data !== null &&
            'metadata' in widgetData.data
              ? widgetData.data.metadata
              : {};

          console.log('[ProductionStatsWidget as string] API returned value:', productionValue);
          console.log('[ProductionStatsWidget as string] Metadata:', widgetMetadata);

          setStatValue(
            typeof productionValue === 'number' ? productionValue : Number(productionValue) || 0
          );
          setMetadata(
            typeof widgetMetadata === 'object' && widgetMetadata !== null
              ? (widgetMetadata as Record<string, unknown>)
              : {}
          );
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
  const dateRangeText = `${format(new Date(), 'MMM yyyy')}`;

  // 決定標籤文字
  const label = metric === 'pallet_count' ? 'Pallets produced' : 'Total quantity';

  if (isEditMode) {
    return <MetricCard title={title} value={0} label={label} icon={CubeIcon} />;
  }

  return (
    <MetricCard
      title={title}
      value={statValue}
      label={label}
      icon={CubeIcon}
      dateRange={dateRangeText}
      performanceMetrics={
        metadata.rpcFunction
          ? {
              source: 'Server',
              optimized: true,
            }
          : undefined
      }
      loading={loading}
      error={error ? new Error(error) : undefined}
      animateOnMount={true}
    />
  );
};
