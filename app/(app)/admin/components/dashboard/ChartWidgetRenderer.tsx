/**
 * Chart Widget Renderer
 * 處理所有圖表類型的 Widget 渲染
 */

'use client';

import React from 'react';
import { WidgetComponentProps as SharedWidgetComponentProps } from './widget-renderer-shared';
import {
  BaseWidgetRendererProps,
  CHART_COLORS,
  createErrorFallback,
  getComponentPropsFactory,
} from './widget-renderer-shared';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from '@/lib/recharts-dynamic';

export const ChartWidgetRenderer: React.FC<BaseWidgetRendererProps> = ({
  config,
  theme,
  timeFrame,
  data,
  loading,
  error,
  renderLazyComponent,
}) => {
  const getComponentProps = getComponentPropsFactory(config, timeFrame, theme);

  // 創建符合 SharedWidgetComponentProps 的 props 對象
  const createWidgetProps = (widgetData?: unknown): SharedWidgetComponentProps => {
    return {
      config,
      timeFrame,
      theme,
      data: widgetData as Record<string, unknown>,
    };
  };

  if (loading) {
    return <div>Loading chart...</div>;
  }

  if (error) {
    return createErrorFallback(config.type, error);
  }

  try {
    switch (config.type) {
      case 'StockDistributionChart':
      case 'StockDistributionChartV2':
        // 使用 ChartCard 替代舊的 Widget
        return renderLazyComponent('ChartCard', {
          ...createWidgetProps(data),
          chartType: 'pie',
          title: 'Stock Distribution',
          description: 'Distribution of stock across categories',
        });

      case 'StockLevelHistoryChart':
        // 使用 ChartCard 替代舊的 Widget
        return renderLazyComponent('ChartCard', {
          ...createWidgetProps(data),
          chartType: 'line',
          title: 'Stock Level History',
          description: 'Historical stock levels over time',
        });

      case 'TransferTimeDistributionWidget':
        // 使用 ChartCard 替代舊的 Widget
        return renderLazyComponent('ChartCard', {
          ...createWidgetProps(data),
          chartType: 'bar',
          title: 'Transfer Time Distribution',
          description: 'Distribution of transfer times',
        });

      case 'WarehouseWorkLevelAreaChart':
        // 使用 ChartCard 替代舊的 Widget
        return renderLazyComponent('ChartCard', {
          ...createWidgetProps(data),
          chartType: 'area',
          title: 'Warehouse Work Level',
          description: 'Work level across warehouses',
        });

      case 'WarehouseHeatmap':
        return (
          <div className='h-full w-full'>
            <h3 className='mb-4 text-lg font-semibold'>倉庫熱圖</h3>
            <div className='grid grid-cols-10 gap-1'>
              {Array.from({ length: 100 }, (_, i) => {
                const intensity = Math.random();
                return (
                  <div
                    key={i}
                    className='aspect-square rounded'
                    style={{
                      backgroundColor: `rgba(59, 130, 246, ${intensity})`,
                    }}
                    title={`位置 ${i + 1}: ${(intensity * 100).toFixed(1)}%`}
                  />
                );
              })}
            </div>
          </div>
        );

      case 'PipelineFlowDiagram':
        return (
          <div className='h-full w-full'>
            <h3 className='mb-4 text-lg font-semibold'>管道流程圖</h3>
            <div className='flex h-64 items-center justify-center'>
              <div className='text-gray-500'>Pipeline Flow Diagram Placeholder</div>
            </div>
          </div>
        );

      case 'chart':
        // 通用圖表處理 - 使用 ChartCard
        return renderLazyComponent('ChartCard', {
          ...createWidgetProps(data),
          chartType: 'bar',
          title: config.title || 'Chart',
          description: config.description || 'Data visualization',
        });

      case 'advanced-chart':
        // 使用 ChartCard 替代 UnifiedChartWidget
        return renderLazyComponent('ChartCard', {
          ...createWidgetProps(data),
          chartType: config.chartType || 'line',
          title: config.title || 'Advanced Chart',
          description: config.description || 'Advanced data visualization',
        });

      case 'predictive-chart':
        // 使用 ChartCard 替代 UnifiedChartWidget
        return renderLazyComponent('ChartCard', {
          ...createWidgetProps(data),
          chartType: config.chartType || 'area',
          title: config.title || 'Predictive Chart',
          description: config.description || 'AI-powered predictions',
        });

      default:
        return createErrorFallback(`Unknown chart type: ${config.type}`);
    }
  } catch (err) {
    console.error('ChartWidgetRenderer error:', err);
    return createErrorFallback(
      config.type,
      err instanceof Error ? (err as { message: string }).message : 'Unknown error'
    );
  }
};
