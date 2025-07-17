/**
 * Universal Stats Widget
 * 統一的統計 Widget 組件，替代6個現有的 stats widgets
 */

'use client';

import React, { useMemo } from 'react';
import { format } from 'date-fns';
import {
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
} from '@heroicons/react/24/outline';
import { Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MetricCard, MetricCardProgress } from '../data-display/MetricCard';
import { useUniversalStats } from './useUniversalStats';
import {
  UniversalStatsWidgetProps,
  StatsData,
  StatsDisplayType,
  StatsFormatType,
} from './types';

/**
 * 格式化數值顯示
 */
function formatStatsValue(
  value: number | string,
  format?: StatsFormatType,
  precision?: number,
  prefix?: string,
  suffix?: string
): string {
  if (typeof value === 'string') {
    return value;
  }

  let formattedValue: string;

  switch (format) {
    case 'percentage':
      formattedValue = `${value.toFixed(precision || 1)}%`;
      break;
    case 'currency':
      formattedValue = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: precision || 2,
      }).format(value);
      break;
    case 'duration':
      formattedValue = `${value}h`;
      break;
    case 'number':
    default:
      formattedValue = value.toLocaleString(undefined, {
        minimumFractionDigits: precision || 0,
        maximumFractionDigits: precision || 0,
      });
      break;
  }

  return `${prefix || ''}${formattedValue}${suffix || ''}`;
}

/**
 * 獲取趨勢圖標
 */
function getTrendIcon(direction: 'up' | 'down' | 'stable') {
  switch (direction) {
    case 'up':
      return ArrowTrendingUpIcon;
    case 'down':
      return ArrowTrendingDownIcon;
    case 'stable':
    default:
      return MinusIcon;
  }
}

/**
 * 獲取趨勢顏色
 */
function getTrendColor(direction: 'up' | 'down' | 'stable') {
  switch (direction) {
    case 'up':
      return 'text-green-500';
    case 'down':
      return 'text-red-500';
    case 'stable':
    default:
      return 'text-gray-500';
  }
}

/**
 * Metric 類型顯示組件
 */
function MetricDisplay({
  data,
  display,
  loading,
  error,
  timeFrame,
}: {
  data: StatsData;
  display: any;
  loading: boolean;
  error: Error | null;
  timeFrame?: { start: Date; end: Date };
}) {
  const formattedValue = formatStatsValue(
    data.value,
    display.format,
    display.precision,
    display.prefix,
    display.suffix
  );

  const dateRange = timeFrame
    ? `${format(timeFrame.start, 'MMM d')} - ${format(timeFrame.end, 'MMM d')}`
    : undefined;

  return (
    <MetricCard
      title={display.title}
      value={formattedValue}
      label={data.label}
      icon={display.icon || ClockIcon}
      iconColor={display.iconColor}
      dateRange={dateRange}
      loading={loading}
      error={error}
      animateOnMount={display.animateOnMount}
      trend={data.trend?.direction === 'up' ? 'up' : data.trend?.direction === 'down' ? 'down' : data.trend ? 'neutral' : undefined}
      trendValue={data.trend?.value}
      trendLabel={data.trend?.label}
      className={cn(
        display.size === 'sm' && 'text-sm',
        display.size === 'lg' && 'text-lg'
      )}
    />
  );
}

/**
 * Progress 類型顯示組件
 */
function ProgressDisplay({
  data,
  display,
  loading,
  error,
  timeFrame,
}: {
  data: StatsData;
  display: any;
  loading: boolean;
  error: Error | null;
  timeFrame?: { start: Date; end: Date };
}) {
  if (!data.progress) {
    // Fallback to metric display if no progress data
    return (
      <MetricDisplay
        data={data}
        display={display}
        loading={loading}
        error={error}
        timeFrame={timeFrame}
      />
    );
  }

  const dateRange = timeFrame
    ? `${format(timeFrame.start, 'MMM d')} - ${format(timeFrame.end, 'MMM d')}`
    : undefined;

  return (
    <MetricCardProgress
      title={display.title}
      value={`${data.progress.percentage}%`}
      label={`${data.progress.current} of ${data.progress.total}`}
      percentage={data.progress.percentage}
      icon={display.icon || ClockIcon}
      iconColor={display.iconColor}
      dateRange={dateRange}
      loading={loading}
      error={error}
      animateOnMount={display.animateOnMount}
      progressColor="bg-blue-500"
      className={cn(
        display.size === 'sm' && 'text-sm',
        display.size === 'lg' && 'text-lg'
      )}
    />
  );
}

/**
 * Trend 類型顯示組件
 */
function TrendDisplay({
  data,
  display,
  loading,
  error,
  timeFrame,
}: {
  data: StatsData;
  display: any;
  loading: boolean;
  error: Error | null;
  timeFrame?: { start: Date; end: Date };
}) {
  const formattedValue = formatStatsValue(
    data.value,
    display.format,
    display.precision,
    display.prefix,
    display.suffix
  );

  const dateRange = timeFrame
    ? `${format(timeFrame.start, 'MMM d')} - ${format(timeFrame.end, 'MMM d')}`
    : undefined;

  const trend = data.trend
    ? {
        value: data.trend.value,
        direction: data.trend.direction,
        label: data.trend.label || `${data.trend.percentage?.toFixed(1)}%`,
      }
    : undefined;

  return (
    <MetricCard
      title={display.title}
      value={formattedValue}
      label={data.label}
      icon={display.icon || ClockIcon}
      iconColor={display.iconColor}
      dateRange={dateRange}
      loading={loading}
      error={error}
      animateOnMount={display.animateOnMount}
      trend={trend?.direction === 'up' ? 'up' : trend?.direction === 'down' ? 'down' : trend ? 'neutral' : undefined}
      trendValue={trend?.value}
      trendLabel={trend?.label}
      className={cn(
        display.size === 'sm' && 'text-sm',
        display.size === 'lg' && 'text-lg',
        'relative'
      )}
    />
  );
}

/**
 * 錯誤顯示組件
 */
function ErrorDisplay({
  error,
  display,
}: {
  error: Error;
  display: any;
}) {
  return (
    <MetricCard
      title={display.title}
      value="Error"
      label="Failed to load data"
      icon={AlertCircle}
      iconColor="from-red-500 to-red-600"
      error={error}
      className="border-red-200"
    />
  );
}

/**
 * 載入顯示組件
 */
function LoadingDisplay({ display }: { display: any }) {
  return (
    <MetricCard
      title={display.title}
      value="--"
      label="Loading..."
      icon={display.icon || Loader2}
      iconColor={display.iconColor}
      loading={true}
      className="animate-pulse"
    />
  );
}

/**
 * 主要的 Universal Stats Widget 組件
 */
export const UniversalStatsWidget = React.memo(function UniversalStatsWidget({
  config,
  widget,
  isEditMode,
  timeFrame,
  className,
  style,
}: UniversalStatsWidgetProps) {
  // 獲取數據
  const { data, loading, error, refetch, lastUpdated, source } = useUniversalStats(
    config.dataSource,
    config.performance,
    timeFrame,
    isEditMode
  );

  // 根據顯示類型選擇組件 (hooks 必須在所有 early returns 之前)
  const DisplayComponent = useMemo(() => {
    switch (config.display.type) {
      case 'progress':
        return ProgressDisplay;
      case 'trend':
        return TrendDisplay;
      case 'metric':
      default:
        return MetricDisplay;
    }
  }, [config.display.type]);

  // 處理互動
  const handleClick = React.useCallback(() => {
    if (config.interaction?.clickable && config.interaction.onClick && data) {
      config.interaction.onClick(data);
    } else if (config.interaction?.drillDownUrl) {
      window.open(config.interaction.drillDownUrl, '_blank');
    }
  }, [config.interaction, data]);

  const handleRefresh = React.useCallback(() => {
    if (config.interaction?.onRefresh) {
      config.interaction.onRefresh();
    } else {
      refetch();
    }
  }, [config.interaction, refetch]);

  // 編輯模式
  if (isEditMode) {
    const mockData = config.interaction?.editMode?.mockData || {
      value: '--',
      label: config.interaction?.editMode?.placeholder || 'Edit Mode',
    };

    return (
      <div className={cn('cursor-not-allowed opacity-75', className)} style={style}>
        <MetricCard
          title={config.display.title}
          value={mockData.value}
          label={mockData.label}
          icon={config.display.icon || ClockIcon}
          iconColor={config.display.iconColor}
          loading={false}
          className="border-dashed"
        />
      </div>
    );
  }

  // 錯誤狀態
  if (error && !config.performance?.fallbackData) {
    return (
      <div className={className} style={style}>
        <ErrorDisplay error={error} display={config.display} />
      </div>
    );
  }

  // 載入狀態
  if (loading && !data) {
    return (
      <div className={className} style={style}>
        <LoadingDisplay display={config.display} />
      </div>
    );
  }

  // 沒有數據
  if (!data) {
    return (
      <div className={className} style={style}>
        <MetricCard
          title={config.display.title}
          value="No Data"
          label="No data available"
          icon={config.display.icon || ClockIcon}
          iconColor="from-gray-400 to-gray-500"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        config.interaction?.clickable && 'cursor-pointer hover:opacity-90 transition-opacity',
        className
      )}
      style={style}
      onClick={config.interaction?.clickable ? handleClick : undefined}
    >
      <DisplayComponent
        data={data}
        display={config.display}
        loading={loading}
        error={error}
        timeFrame={timeFrame}
      />
      
      {/* Performance Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && source && (
        <div className="absolute top-2 right-2 text-xs text-gray-400 opacity-50">
          {source}
        </div>
      )}
    </div>
  );
});

export default UniversalStatsWidget;