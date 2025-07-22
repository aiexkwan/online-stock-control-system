import React, { useMemo } from 'react';
import { Box, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { MetricCard } from './common/data-display/MetricCard';
import { useDashboardConcurrentQuery } from '@/app/(app)/admin/hooks/useDashboardConcurrentQuery';
import { AdminWidgetConfig } from '@/types/components/dashboard';

interface UnifiedStatsWidgetProps {
  config: AdminWidgetConfig;
  dateRange?: {
    start: string;
    end: string;
  };
  warehouse?: string;
}

/**
 * UnifiedStatsWidget - 統一統計組件
 *
 * 基於現有的 MetricCard 組件，提供統一的統計數據顯示
 * 支持多種統計類型和動態配置
 */
export const UnifiedStatsWidget: React.FC<UnifiedStatsWidgetProps> = ({
  config,
  dateRange,
  warehouse,
}) => {
  // 轉換 dateRange 格式以匹配 DashboardDateRange 接口
  const dashboardDateRange = dateRange
    ? {
        startDate: new Date(dateRange.start),
        endDate: new Date(dateRange.end),
      }
    : {
        startDate: null,
        endDate: null,
      };

  // 使用現有的統一API查詢機制
  const { data, isLoading, error } = useDashboardConcurrentQuery({
    dateRange: dashboardDateRange,
    enabledWidgets: [config.dataSource || 'default'],
    enabled: true,
  });

  // 動態選擇圖標
  const getIcon = (title: string) => {
    if (title.includes('Production') || title.includes('Today')) return Box;
    if (title.includes('Efficiency') || title.includes('Score')) return TrendingUp;
    if (title.includes('Error') || title.includes('Issue')) return AlertTriangle;
    if (title.includes('Success') || title.includes('Complete')) return CheckCircle;
    return Box; // 默認圖標
  };

  // 處理統計數據
  const processedData = useMemo(() => {
    if (!data || !config.metrics) return null;

    const sourceData = data[config.dataSource || 'default'] as Record<string, unknown>;
    if (!sourceData) return null;

    // 根據配置的第一個指標提取數據
    const primaryMetric = config.metrics[0];
    const value = typeof sourceData[primaryMetric] === 'number' ? sourceData[primaryMetric] : 0;

    // 如果配置了多個指標，可以用於計算或顯示額外信息
    const additionalMetrics = config.metrics.slice(1);
    const additionalData = additionalMetrics.map(metric => ({
      key: metric,
      value: typeof sourceData[metric] === 'number' ? sourceData[metric] : 0,
    }));

    return {
      value,
      additionalData,
      rawData: sourceData,
    };
  }, [data, config.dataSource, config.metrics]);

  // 格式化數值顯示
  const formatValue = (value: number | string): string => {
    if (typeof value === 'string') return value;
    if (typeof value !== 'number') return '0';

    // 處理百分比
    if (config.title.includes('%') || config.title.includes('Percentage')) {
      return `${(value * 100).toFixed(1)}%`;
    }

    // 處理大數值
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }

    return value.toString();
  };

  // 生成標籤
  const getLabel = (): string => {
    if (config.description) return config.description;
    if (config.dataSource) return `來源: ${config.dataSource}`;
    return 'Statistics';
  };

  // 錯誤狀態處理
  if (error) {
    return (
      <MetricCard
        title={config.title}
        value='Error'
        label='資料載入失敗'
        icon={AlertTriangle}
        dateRange={dateRange ? `${dateRange.start} - ${dateRange.end}` : undefined}
        loading={false}
        error={error}
        animateOnMount={true}
        performanceMetrics={{
          source: 'REST API',
          optimized: true,
        }}
      />
    );
  }

  // 載入狀態
  if (isLoading) {
    return (
      <MetricCard
        title={config.title}
        value='Loading...'
        label='載入中...'
        icon={getIcon(config.title)}
        dateRange={dateRange ? `${dateRange.start} - ${dateRange.end}` : undefined}
        loading={true}
        error={null}
        animateOnMount={true}
        performanceMetrics={{
          source: 'REST API',
          optimized: true,
        }}
      />
    );
  }

  // 正常數據顯示
  const displayValue = processedData ? formatValue(processedData.value) : '0';

  return (
    <MetricCard
      title={config.title}
      value={displayValue}
      label={getLabel()}
      icon={getIcon(config.title)}
      dateRange={dateRange ? `${dateRange.start} - ${dateRange.end}` : undefined}
      loading={false}
      error={null}
      animateOnMount={true}
      performanceMetrics={{
        source: 'REST API',
        optimized: true,
      }}
    />
  );
};

export default UnifiedStatsWidget;
