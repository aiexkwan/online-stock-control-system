/**
 * WorkLevelCard Component
 * 專門顯示倉庫工作水平 (Warehouse Work Level) 的圖表卡片
 * 使用 GraphQL 查詢 work_level 數據
 */

'use client';

import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
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
import { AnalysisCard } from '@/lib/card-system/EnhancedGlassmorphicCard';
import { getCardTheme, cardTextStyles, cardChartColors } from '@/lib/card-system/theme';
import {
  ChartType,
  AggregationType,
  TimeGranularity,
  type ChartCardData,
  type ChartQueryInput,
  type ChartDataset,
  type ChartConfig,
} from '@/types/generated/graphql';
import { ensureString } from '@/lib/graphql/utils/graphql-types';

// Import types from centralized type definitions
import type { WorkLevelCardProps, ChartClickEventData } from '../types/analytics';
import type { FilterValue } from '../types/common';

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

// 使用統一的圖表顏色系統
const DEFAULT_COLORS = cardChartColors.extended;

export const WorkLevelCard: React.FC<WorkLevelCardProps> = ({
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
  showLegend = true,
  showTooltip = true,
  animationEnabled = true,
  className,
  height = 400,
  title,
  subtitle,
  isEditMode = false,
  onChartClick,
  onRefresh,
}) => {
  // Cleanup ref for polling interval
  const cleanupRef = useRef<(() => void) | null>(null);
  // 部門篩選狀態 - 改為單選
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  // 處理部門篩選變更 - 單選邏輯
  const handleDepartmentToggle = useCallback((department: string) => {
    setSelectedDepartment(prev => {
      // 如果點擊已選中的部門，則取消選中
      if (prev === department) {
        return null;
      }
      // 否則選中新部門
      return department;
    });
  }, []);

  // 準備查詢輸入 - 確保 chartTypes 不為空
  const queryInput: ChartQueryInput = useMemo(
    () => ({
      chartTypes:
        chartTypes && chartTypes.length > 0
          ? chartTypes.map(type => type as ChartType)
          : [ChartType.Bar], // 提供預設值
      dateRange: dateRange
        ? {
            start: dateRange.start.toISOString(),
            end: dateRange.end.toISOString(),
          }
        : undefined,
      timeGranularity: timeGranularity as TimeGranularity,
      aggregationType: aggregationType as AggregationType,
      groupBy: groupBy ? [groupBy] : undefined,
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
  const { data, loading, error, refetch, stopPolling, startPolling } = useQuery<{
    chartCardData: ChartCardData;
  }>(CHART_CARD_QUERY, {
    variables: { input: queryInput },
    fetchPolicy: 'cache-and-network',
    pollInterval: isEditMode ? 0 : 60000, // 編輯模式時不輪詢
    skip: isEditMode, // 編輯模式時跳過查詢
  });

  // 確保在組件卸載時清理輪詢
  useEffect(() => {
    return () => {
      if (stopPolling) {
        stopPolling();
      }
    };
  }, [stopPolling]);

  // 處理刷新
  const handleRefresh = () => {
    refetch();
    onRefresh?.();
  };

  // 渲染圖表組件
  const renderChart = (config: ChartConfig, datasets: ChartDataset[], index: number) => {
    // 對於多線圖表（如 Work Level），需要重組數據
    const isMultiLineChart = datasets.length > 1 && config.type === ChartType.Line;

    let chartData: unknown[];

    if (isMultiLineChart) {
      // 為多線圖表創建數據點，每個 x 值包含所有 dataset 的 y 值
      const allXValues = [...new Set(datasets.flatMap(ds => ds.data.map(d => d.x)))].sort();
      chartData = allXValues.map(x => {
        const point: Record<string, unknown> = { name: x };
        datasets.forEach(dataset => {
          const dataPoint = dataset.data.find(d => d.x === x);
          point[dataset.id] = dataPoint ? dataPoint.y : null;
        });
        return point;
      });
    } else {
      // 單一數據集的處理方式
      chartData =
        datasets[0]?.data.map(point => ({
          name: point.x,
          value: point.y,
          ...point.metadata,
        })) || [];
    }

    const commonProps = {
      data: chartData,
    };

    switch (config.type) {
      case ChartType.Area:
        return (
          <AreaChart
            {...commonProps}
            onClick={(data: unknown) => {
              if (onChartClick && data && typeof data === 'object' && 'activePayload' in data) {
                // Type guard to ensure data has the expected structure
                const chartData = data as { activePayload?: Array<{ payload?: unknown }> };
                if (chartData.activePayload?.[0]?.payload) {
                  onChartClick(chartData.activePayload[0].payload as ChartClickEventData);
                }
              }
            }}
          >
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='name' />
            <YAxis />
            <Tooltip />
            {config.legend?.display && <Legend />}
            {datasets.map((dataset, idx) => (
              <Area
                key={dataset.id}
                type='monotone'
                dataKey='value'
                name={dataset.label}
                stroke={
                  ensureString(dataset.borderColor ?? null) ||
                  DEFAULT_COLORS[idx % DEFAULT_COLORS.length]
                }
                fill={
                  ensureString(dataset.backgroundColor ?? null) ||
                  DEFAULT_COLORS[idx % DEFAULT_COLORS.length]
                }
                stackId={ensureString(dataset.stack ?? null)}
              />
            ))}
          </AreaChart>
        );

      case ChartType.Bar:
        return (
          <BarChart
            {...commonProps}
            onClick={(data: unknown) => {
              if (onChartClick && data && typeof data === 'object' && 'activePayload' in data) {
                // Type guard to ensure data has the expected structure
                const chartData = data as { activePayload?: Array<{ payload?: unknown }> };
                if (chartData.activePayload?.[0]?.payload) {
                  onChartClick(chartData.activePayload[0].payload as ChartClickEventData);
                }
              }
            }}
          >
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='name' />
            <YAxis />
            <Tooltip />
            {config.legend?.display && <Legend />}
            {datasets.map((dataset, idx) => (
              <Bar
                key={dataset.id}
                dataKey='value'
                name={dataset.label}
                fill={
                  ensureString(dataset.backgroundColor ?? null) ||
                  DEFAULT_COLORS[idx % DEFAULT_COLORS.length]
                }
                stackId={ensureString(dataset.stack ?? null)}
              />
            ))}
          </BarChart>
        );

      case ChartType.Line:
        const isWorkLevel = config.plugins?.backgroundColor === '#000000';
        return (
          <LineChart
            {...commonProps}
            onClick={(data: unknown) => {
              if (onChartClick && data && typeof data === 'object' && 'activePayload' in data) {
                // Type guard to ensure data has the expected structure
                const chartData = data as { activePayload?: Array<{ payload?: unknown }> };
                if (chartData.activePayload?.[0]?.payload) {
                  onChartClick(chartData.activePayload[0].payload as ChartClickEventData);
                }
              }
            }}
          >
            <CartesianGrid strokeDasharray='3 3' stroke={isWorkLevel ? '#333333' : '#e0e0e0'} />
            <XAxis
              dataKey='name'
              tick={{ fill: isWorkLevel ? '#ffffff' : '#666666' }}
              axisLine={{ stroke: isWorkLevel ? '#ffffff' : '#666666' }}
            />
            <YAxis
              tick={{ fill: isWorkLevel ? '#ffffff' : '#666666' }}
              axisLine={{ stroke: isWorkLevel ? '#ffffff' : '#666666' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isWorkLevel ? '#1a1a1a' : '#ffffff',
                border: `1px solid ${isWorkLevel ? '#333333' : '#e0e0e0'}`,
                borderRadius: '4px',
                color: isWorkLevel ? '#ffffff' : '#000000',
              }}
              itemStyle={{
                color: isWorkLevel ? '#ffffff' : '#000000',
              }}
            />
            {config.legend?.display && (
              <Legend
                wrapperStyle={{
                  color: isWorkLevel ? '#ffffff' : '#666666',
                }}
              />
            )}
            {datasets.map((dataset, idx) => (
              <Line
                key={dataset.id}
                type='monotone'
                dataKey={isMultiLineChart ? dataset.id : 'value'}
                name={dataset.label}
                stroke={dataset.borderColor || DEFAULT_COLORS[idx % DEFAULT_COLORS.length]}
                strokeWidth={2}
                dot={false} // 移除數據點圓圈，讓圖表更清晰
                connectNulls={true} // 連接空值點
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
              cx='50%'
              cy='50%'
              labelLine={false}
              label
              outerRadius={config.type === ChartType.Donut ? 80 : 100}
              innerRadius={config.type === ChartType.Donut ? 40 : 0}
              fill='#8884d8'
              dataKey='value'
            >
              {chartData?.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={DEFAULT_COLORS[idx % DEFAULT_COLORS.length]} />
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
            <PolarAngleAxis dataKey='name' />
            <PolarRadiusAxis />
            {datasets.map((dataset, idx) => (
              <Radar
                key={dataset.id}
                name={dataset.label}
                dataKey='value'
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
            dataKey='value'
            aspectRatio={4 / 3}
            stroke='#fff'
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
      <AnalysisCard className={className} isLoading={false} status='error'>
        <div className='flex h-full items-center justify-center p-8'>
          <ExclamationTriangleIcon className='mr-2 h-6 w-6 text-red-500' />
          <span className={cardTextStyles.error}>Failed to load chart: {error.message}</span>
        </div>
      </AnalysisCard>
    );
  }

  // 加載狀態
  if (loading && !data) {
    return (
      <AnalysisCard className={className} isLoading={true}>
        <div className='rounded-lg bg-white/5 backdrop-blur-sm' style={{ height }} />
      </AnalysisCard>
    );
  }

  return (
    <AnalysisCard
      className={className}
      isLoading={loading}
      borderGlow='hover'
      glassmorphicVariant='default'
      padding='base'
    >
      <div className='space-y-4'>
        {/* 性能指標（可選） */}
        {showPerformance && data?.chartCardData.performance && (
          <div className='flex items-center justify-between px-2 text-xs text-gray-500 dark:text-gray-400'>
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
        <AnimatePresence mode='popLayout'>
          {data?.chartCardData.config && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={cn(
                'rounded-lg p-6 shadow-md',
                data.chartCardData.config.plugins?.backgroundColor === '#000000'
                  ? 'bg-black text-white'
                  : 'bg-transparent'
              )}
            >
              {/* 圖表標題 */}
              <h3 className='mb-2 text-lg font-semibold'>{data.chartCardData.config.title}</h3>
              {data.chartCardData.config.description && (
                <p className='mb-4 text-sm text-gray-600 dark:text-gray-400'>
                  {data.chartCardData.config.description}
                </p>
              )}

              {/* 圖表和部門篩選容器 */}
              <div className='flex flex-col'>
                {/* 圖表內容 - 90% */}
                <div style={{ height: typeof height === 'number' ? height * 0.9 : '360px' }}>
                  <ResponsiveContainer width='100%' height='100%'>
                    {renderChart(
                      data.chartCardData.config,
                      // 根據部門篩選過濾數據集
                      data.chartCardData.datasets.filter(dataset => {
                        // 如果沒有選中任何部門，顯示所有數據
                        if (!selectedDepartment) return true;
                        // 檢查數據集是否屬於選中的部門
                        // 首先檢查 dataset 的 label 或 id 是否包含部門信息
                        if (
                          dataset.label === selectedDepartment ||
                          dataset.id === selectedDepartment
                        ) {
                          return true;
                        }
                        // 否則檢查數據點中的 metadata
                        const hasSelectedDepartment = dataset.data.some(point => {
                          const department = (point.metadata as { department?: string })
                            ?.department;
                          return department === selectedDepartment;
                        });
                        return hasSelectedDepartment;
                      }),
                      0
                    )}
                  </ResponsiveContainer>
                </div>

                {/* 部門篩選區域 - 10% */}
                {data.chartCardData.config.plugins?.departments && (
                  <div
                    className='mt-4 border-t pt-3'
                    style={{
                      borderColor:
                        data.chartCardData.config.plugins?.backgroundColor === '#000000'
                          ? '#333333'
                          : '#e5e7eb',
                      height: typeof height === 'number' ? height * 0.1 : '40px',
                    }}
                  >
                    <div className='flex justify-center'>
                      <div className='flex flex-wrap items-center gap-4'>
                        <span className='text-sm font-medium'>Departments:</span>

                        {/* 部門 radio buttons (使用 checkbox 樣式但實現單選邏輯) */}
                        {(data.chartCardData.config.plugins.departments as string[]).map(dept => (
                          <label
                            key={dept}
                            className='flex cursor-pointer items-center gap-2 text-sm'
                          >
                            <input
                              type='checkbox'
                              checked={selectedDepartment === dept}
                              onChange={() => handleDepartmentToggle(dept)}
                              className='h-4 w-4'
                            />
                            <span className='font-medium'>{dept}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 最後更新時間 */}
              <div className='mt-2 text-xs text-gray-500 dark:text-gray-400'>
                Last updated: {new Date(data.chartCardData.lastUpdated).toLocaleString()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 刷新按鈕（編輯模式） */}
        {isEditMode && (
          <div className='flex justify-end'>
            <button
              onClick={handleRefresh}
              className='text-sm text-blue-600 hover:underline dark:text-blue-400'
            >
              Refresh Chart
            </button>
          </div>
        )}
      </div>
    </AnalysisCard>
  );
};

// 導出類型，方便其他組件使用
export type { ChartType, ChartCardData } from '@/types/generated/graphql';
export default WorkLevelCard;
