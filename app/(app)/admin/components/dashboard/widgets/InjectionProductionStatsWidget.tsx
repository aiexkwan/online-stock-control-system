/**
 * Injection Production Stats Widget - REST API Version
 * 用於 Injection Route 的生產統計組件
 * 使用 MetricCard 通用組件統一顯示邏輯
 *
 * Widget2: Today Produced (PLT)
 * Widget3: Today Produced (QTY)
 *
 * REST API Migration:
 * - 使用純 REST API 查詢
 * - 統一數據獲取架構
 * - 保留相同功能和性能
 */

'use client';

import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { CubeIcon } from '@heroicons/react/24/outline';
import { format, startOfDay, endOfDay } from 'date-fns';
import { createDashboardAPIClient as createDashboardAPI } from '@/lib/api/admin/DashboardAPI.client';
import { TraditionalWidgetComponentProps } from '@/types/components/dashboard';
import { MetricCard } from './common/data-display/MetricCard';
import {
  ProductionStatsData,
  ProductionStatsWidgetConfig,
  PalletEdge,
  WidgetApiMapper,
  isProductionStatsData,
} from './types/WidgetApiTypes';

interface InjectionProductionStatsWidgetProps extends TraditionalWidgetComponentProps {
  title?: string;
  metric?: 'pallet_count' | 'quantity_sum';
}

// Interfaces moved to WidgetApiTypes.ts

export const InjectionProductionStatsWidget: React.FC<InjectionProductionStatsWidgetProps> = ({
  title,
  metric,
  timeFrame,
  isEditMode,
  widget,
}) => {
  // 從 widget config 提取數據
  // 使用類型斷言處理擴展屬性
  const widgetConfig = widget?.config as ProductionStatsWidgetConfig;
  const widgetTitle = title || widgetConfig?.title || 'Production Stats';
  const widgetMetric = metric || widgetConfig?.metric || 'pallet_count';
  // 根據 timeFrame 設定查詢時間範圍
  const { startDate, endDate } = useMemo(() => {
    if (!timeFrame) {
      // 默認使用今天
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

  // REST API 狀態管理
  const [data, setData] = useState<ProductionStatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchProductionStats = useCallback(async () => {
    if (isEditMode) return;

    setLoading(true);
    setError(null);

    try {
      const dashboardAPI = createDashboardAPI();
      const result = await dashboardAPI.fetch(
        {
          widgetIds: ['injection_production_stats'],
          dateRange: { start: startDate, end: endDate },
        },
        {
          strategy: 'server',
          cache: { ttl: 300 },
        }
      );

      if (result.widgets && result.widgets.length > 0) {
        const widgetData = result.widgets[0].data;
        const { data: productionData, error: dataError } = WidgetApiMapper.validateAndExtractData(
          widgetData,
          isProductionStatsData,
          'production-stats'
        );

        if (dataError) {
          throw new Error(dataError.message);
        }

        setData(productionData);
      }
    } catch (err) {
      console.error('Error fetching production stats:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, isEditMode]);

  useEffect(() => {
    fetchProductionStats();
    // Auto-refresh removed to prevent constant loading animations
  }, [fetchProductionStats]);

  // 計算統計值
  const statValue = useMemo((): number => {
    if (!data?.record_palletinfoCollection?.edges) return 0;

    const edges = data.record_palletinfoCollection.edges;

    if (widgetMetric === 'pallet_count') {
      // 計算唯一托盤數量
      const uniquePallets = new Set(edges.map((edge: PalletEdge) => edge.node.plt_num));
      return uniquePallets.size;
    } else {
      // 計算總數量
      return edges.reduce((sum: number, edge: PalletEdge) => {
        return sum + (edge.node.product_qty || 0);
      }, 0);
    }
  }, [data, widgetMetric]);

  // 獲取實際數據時間範圍（用於顯示）
  const displayDateRange = useMemo(() => {
    const start = timeFrame?.start || new Date();
    const end = timeFrame?.end || new Date();

    // 如果是同一天，只顯示一個日期
    if (format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')) {
      return format(start, 'MMM d, yyyy');
    }

    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
  }, [timeFrame]);

  // 決定標籤文字
  const label = widgetMetric === 'pallet_count' ? 'Pallets produced' : 'Total quantity';

  // 處理重試
  const handleRetry = useCallback(() => {
    fetchProductionStats();
  }, [fetchProductionStats]);

  if (isEditMode) {
    return <MetricCard title={widgetTitle} value={0} label={label} icon={CubeIcon} />;
  }

  return (
    <MetricCard
      title={widgetTitle}
      value={statValue}
      label={label}
      icon={CubeIcon}
      dateRange={displayDateRange}
      performanceMetrics={{
        source: 'REST API',
        optimized: true,
      }}
      loading={loading}
      error={error ? new Error(error.message) : undefined}
      animateOnMount={true}
    />
  );
};

// Export as default for lazy loading compatibility
export default InjectionProductionStatsWidget;

/**
 * REST API Migration completed on 2025-07-16
 *
 * Features:
 * - 純 REST API 查詢實現
 * - 5分鐘輪詢實時更新
 * - 支持 pallet_count 和 quantity_sum 指標
 * - 統一錯誤處理和重試機制
 * - 保持原有功能和性能
 *
 * 性能改善:
 * - 簡化查詢邏輯，統一數據獲取策略
 * - 客戶端數據聚合和計算
 * - 內建緩存和輪詢機制
 * - 遵循 KISS 原則，降低維護成本
 */
