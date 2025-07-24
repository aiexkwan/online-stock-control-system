/**
 * ChartCard Component
 * 統一的圖表卡片組件，取代原有的8個獨立圖表widgets
 * 使用 GraphQL 批量查詢優化性能
 */

'use client';

import React, { useMemo } from 'react';
import { useQuery, gql } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  RadarChart,
  Radar,
  Treemap,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import {
  ChartType,
  AggregationType,
  TimeGranularity,
  type ChartCardData,
  type ChartQueryInput,
  type ChartDataset,
  type ChartConfig,
} from '@/types/generated/graphql';
import { ensureString } from '@/utils/graphql-types';

// 類型定義
type FilterValue = string | number | boolean | Date | null;

// Recharts 點擊事件數據類型
interface ChartClickEventData<T = unknown> {
  activePayload?: Array<{
    dataKey: string;
    value: T;
    payload: T;
  }>;
  activeIndex?: number;
  activeCoordinate?: { x: number; y: number };
  chartX?: number;
  chartY?: number;
}

// GraphQL 查詢
const CHART_CARD_QUERY = gql`
  query ChartCardQuery($input: ChartQueryInput!) {
    chartCardData(input: $input) {
      datasets {
        id
        label
        data {
          x
          y
          label
          value
          metadata
        }
        color
        backgroundColor
        borderColor
        type
        stack
        hidden
      }
      labels
      config {
        type
        title
        description
        responsive
        maintainAspectRatio
        aspectRatio
        xAxis {
          type
          label
          min
          max
          stepSize
          format
          display
        }
        yAxis {
          type
          label
          min
          max
          stepSize
          format
          display
        }
        legend {
          display
          position
          align
          labels
        }
        tooltip {
          enabled
          mode
          intersect
          callbacks
        }
        plugins
        animations
      }
      performance {
        totalQueries
        cachedQueries
        averageResponseTime
        dataAge
      }
      lastUpdated
      refreshInterval
    }
  }
`;

// 默認顏色配置
const DEFAULT_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#ef4444', // red
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#84cc16', // lime
  '#6366f1', // indigo
  '#14b8a6', // teal
];

export interface ChartCardProps {
  // 要顯示的圖表類型
  chartTypes: ChartType[];

  // 數據源配置
  dataSources?: string[];

  // 時間範圍
  dateRange?: {
    start: Date;
    end: Date;
  };

  // 時間粒度
  timeGranularity?: TimeGranularity;

  // 聚合類型
  aggregationType?: AggregationType;

  // 分組
  groupBy?: string[];

  // 篩選條件
  filters?: Record<string, FilterValue>;

  // 數據限制
  limit?: number;

  // 顯示選項
  showComparison?: boolean;
  showPerformance?: boolean;

  // 樣式
  className?: string;
  height?: number | string;

  // 編輯模式
  isEditMode?: boolean;

  // 回調
  onChartClick?: <T = unknown>(chartType: ChartType, data: ChartClickEventData<T>) => void;
  onRefresh?: () => void;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  chartTypes,
  dataSources,
  dateRange,
  timeGranularity = TimeGranularity.Day,
  aggregationType = AggregationType.Sum,
  groupBy,
  filters,
  limit,
  showComparison = false,
  showPerformance = false,
  className,
  height = 400,
  isEditMode = false,
  onChartClick,
  onRefresh,
}) => {
  // 準備查詢輸入
  const queryInput: ChartQueryInput = useMemo(
    () => ({
      chartTypes,
      dateRange: dateRange
        ? {
            start: dateRange.start.toISOString(),
            end: dateRange.end.toISOString(),
          }
        : undefined,
      timeGranularity,
      aggregationType,
      groupBy,
      filters,
      limit,
      includeComparison: showComparison,
    }),
    [
      chartTypes,
      dateRange,
      timeGranularity,
      aggregationType,
      groupBy,
      filters,
      limit,
      showComparison,
    ]
  );

  // 執行 GraphQL 查詢
  const { data, loading, error, refetch } = useQuery<{ chartCardData: ChartCardData }>(
    CHART_CARD_QUERY,
    {
      variables: { input: queryInput },
      fetchPolicy: 'cache-and-network',
      pollInterval: 60000, // 每分鐘輪詢
      skip: isEditMode, // 編輯模式時跳過查詢
    }
  );

  // 處理刷新
  const handleRefresh = () => {
    refetch();
    onRefresh?.();
  };

  // 渲染圖表組件
  const renderChart = (config: ChartConfig, datasets: ChartDataset[], index: number) => {
    const chartData = datasets[0]?.data.map((point) => ({
      name: point.x,
      value: point.y,
      ...point.metadata,
    }));

    const commonProps = {
      data: chartData,
      onClick: (data: ChartClickEventData) => onChartClick?.(config.type, data),
    };

    switch (config.type) {
      case ChartType.Area:
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            {config.legend?.display && <Legend />}
            {datasets.map((dataset, idx) => (
              <Area
                key={dataset.id}
                type="monotone"
                dataKey="value"
                name={dataset.label}
                stroke={ensureString(dataset.borderColor ?? null) || DEFAULT_COLORS[idx % DEFAULT_COLORS.length]}
                fill={ensureString(dataset.backgroundColor ?? null) || DEFAULT_COLORS[idx % DEFAULT_COLORS.length]}
                stackId={ensureString(dataset.stack ?? null)}
              />
            ))}
          </AreaChart>
        );

      case ChartType.Bar:
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            {config.legend?.display && <Legend />}
            {datasets.map((dataset, idx) => (
              <Bar
                key={dataset.id}
                dataKey="value"
                name={dataset.label}
                fill={ensureString(dataset.backgroundColor ?? null) || DEFAULT_COLORS[idx % DEFAULT_COLORS.length]}
                stackId={ensureString(dataset.stack ?? null)}
              />
            ))}
          </BarChart>
        );

      case ChartType.Line:
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            {config.legend?.display && <Legend />}
            {datasets.map((dataset, idx) => (
              <Line
                key={dataset.id}
                type="monotone"
                dataKey="value"
                name={dataset.label}
                stroke={dataset.borderColor || DEFAULT_COLORS[idx % DEFAULT_COLORS.length]}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        );

      case ChartType.Pie:
      case ChartType.Donut:
        return (
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label
              outerRadius={config.type === ChartType.Donut ? 80 : 100}
              innerRadius={config.type === ChartType.Donut ? 40 : 0}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData?.map((entry, idx) => (
                <Cell
                  key={`cell-${idx}`}
                  fill={DEFAULT_COLORS[idx % DEFAULT_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            {config.legend?.display && <Legend />}
          </PieChart>
        );

      case ChartType.Radar:
        return (
          <RadarChart data={chartData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="name" />
            <PolarRadiusAxis />
            {datasets.map((dataset, idx) => (
              <Radar
                key={dataset.id}
                name={dataset.label}
                dataKey="value"
                stroke={dataset.borderColor || DEFAULT_COLORS[idx % DEFAULT_COLORS.length]}
                fill={dataset.backgroundColor || DEFAULT_COLORS[idx % DEFAULT_COLORS.length]}
                fillOpacity={0.6}
              />
            ))}
            <Tooltip />
            {config.legend?.display && <Legend />}
          </RadarChart>
        );

      case ChartType.Treemap:
        return (
          <Treemap
            data={chartData}
            dataKey="value"
            aspectRatio={4 / 3}
            stroke="#fff"
            fill={DEFAULT_COLORS[0]}
          />
        );

      default:
        return <div>Unsupported chart type: {config.type}</div>;
    }
  };

  // 錯誤狀態
  if (error && !data) {
    return (
      <div
        className={cn(
          'flex items-center justify-center p-8 bg-red-50 dark:bg-red-950/20 rounded-lg',
          className
        )}
      >
        <ExclamationTriangleIcon className="w-6 h-6 text-red-500 mr-2" />
        <span className="text-red-700 dark:text-red-300">
          Failed to load chart: {error.message}
        </span>
      </div>
    );
  }

  // 加載狀態
  if (loading && !data) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="bg-gray-200 dark:bg-gray-700 rounded-lg" style={{ height }} />
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* 性能指標（可選） */}
      {showPerformance && data?.chartCardData.performance && (
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-2">
          <span>Response: {data.chartCardData.performance.averageResponseTime.toFixed(0)}ms</span>
          <span>
            Cache Hit:{' '}
            {(
              (data.chartCardData.performance.cachedQueries /
                data.chartCardData.performance.totalQueries) *
              100
            ).toFixed(0)}
            %
          </span>
          <span>Data Age: {data.chartCardData.performance.dataAge}s</span>
        </div>
      )}

      {/* 圖表容器 */}
      <AnimatePresence mode="popLayout">
        {data?.chartCardData.config && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
          >
            {/* 圖表標題 */}
            <h3 className="text-lg font-semibold mb-2">{data.chartCardData.config.title}</h3>
            {data.chartCardData.config.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {data.chartCardData.config.description}
              </p>
            )}

            {/* 圖表內容 */}
            <ResponsiveContainer width="100%" height={height}>
              {renderChart(data.chartCardData.config, data.chartCardData.datasets, 0)}
            </ResponsiveContainer>

            {/* 最後更新時間 */}
            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              Last updated: {new Date(data.chartCardData.lastUpdated).toLocaleString()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 刷新按鈕（編輯模式） */}
      {isEditMode && (
        <div className="flex justify-end">
          <button
            onClick={handleRefresh}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Refresh Chart
          </button>
        </div>
      )}
    </div>
  );
};

// 導出類型，方便其他組件使用
export type { ChartType, ChartCardData } from '@/types/generated/graphql';