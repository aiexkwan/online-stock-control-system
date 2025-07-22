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
        console.warn(
          '[Deprecated] StockDistributionChart is deprecated, use StockDistributionChartV2'
        );
      // fallthrough
      case 'StockDistributionChartV2':
        return renderLazyComponent('StockDistributionChartV2', createWidgetProps(data));

      case 'StockLevelHistoryChart':
        return renderLazyComponent('StockLevelHistoryChart', createWidgetProps(data));

      case 'TransferTimeDistributionWidget':
        return renderLazyComponent('TransferTimeDistributionWidget', createWidgetProps(data));

      case 'WarehouseWorkLevelAreaChart':
        return renderLazyComponent('WarehouseWorkLevelAreaChart', createWidgetProps(data));

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
        // 通用圖表處理
        if (!data || !Array.isArray(data)) {
          return <div>No chart data available</div>;
        }

        return (
          <div className='h-full w-full'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='name' />
                <YAxis />
                <Tooltip />
                <Bar dataKey='value' fill={CHART_COLORS[0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      case 'advanced-chart':
        return renderLazyComponent('UnifiedChartWidget', createWidgetProps(data));

      case 'predictive-chart':
        return renderLazyComponent('UnifiedChartWidget', createWidgetProps(data));

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
