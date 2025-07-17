/**
 * Chart Widget Renderer
 * 處理所有圖表類型的 Widget 渲染
 */

'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { 
  BaseWidgetRendererProps, 
  CHART_COLORS,
  createErrorFallback,
  getComponentPropsFactory 
} from './widget-renderer-shared';

// Recharts components - 動態導入避免 SSR 問題
const LineChart = dynamic(() => import('recharts').then(mod => ({ default: mod.LineChart })), { ssr: false });
const Line = dynamic(() => import('recharts').then(mod => ({ default: mod.Line })), { ssr: false });
const BarChart = dynamic(() => import('recharts').then(mod => ({ default: mod.BarChart })), { ssr: false });
const Bar = dynamic(() => import('recharts').then(mod => ({ default: mod.Bar })), { ssr: false });
const PieChart = dynamic(() => import('recharts').then(mod => ({ default: mod.PieChart })), { ssr: false });
const Pie = dynamic(() => import('recharts').then(mod => ({ default: mod.Pie })), { ssr: false });
const Cell = dynamic(() => import('recharts').then(mod => ({ default: mod.Cell })), { ssr: false });
const AreaChart = dynamic(() => import('recharts').then(mod => ({ default: mod.AreaChart })), { ssr: false });
const Area = dynamic(() => import('recharts').then(mod => ({ default: mod.Area })), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => ({ default: mod.XAxis })), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => ({ default: mod.YAxis })), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => ({ default: mod.CartesianGrid })), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => ({ default: mod.Tooltip })), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => ({ default: mod.ResponsiveContainer })), { ssr: false });

export const ChartWidgetRenderer: React.FC<BaseWidgetRendererProps> = ({
  config,
  theme,
  timeFrame,
  data,
  loading,
  error,
  renderLazyComponent
}) => {
  const getComponentProps = getComponentPropsFactory(config, timeFrame, theme);
  
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
        return renderLazyComponent('StockDistributionChartV2', getComponentProps(data));
        
      case 'StockLevelHistoryChart':
        return renderLazyComponent('StockLevelHistoryChart', getComponentProps(data));
        
      case 'TransferTimeDistributionWidget':
        return renderLazyComponent('TransferTimeDistributionWidget', getComponentProps(data));
        
      case 'WarehouseWorkLevelAreaChart':
        return renderLazyComponent('WarehouseWorkLevelAreaChart', getComponentProps(data));
        
      case 'WarehouseHeatmap':
        return (
          <div className="h-full w-full">
            <h3 className="mb-4 text-lg font-semibold">倉庫熱圖</h3>
            <div className="grid grid-cols-10 gap-1">
              {Array.from({ length: 100 }, (_, i) => {
                const intensity = Math.random();
                return (
                  <div 
                    key={i}
                    className="aspect-square rounded"
                    style={{
                      backgroundColor: `rgba(59, 130, 246, ${intensity})`
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
          <div className="h-full w-full">
            <h3 className="mb-4 text-lg font-semibold">管道流程圖</h3>
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Pipeline Flow Diagram Placeholder</div>
            </div>
          </div>
        );
        
      case 'chart':
        // 通用圖表處理
        if (!data || !Array.isArray(data)) {
          return <div>No chart data available</div>;
        }
        
        return (
          <div className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill={CHART_COLORS[0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
        
      default:
        return createErrorFallback(`Unknown chart type: ${config.type}`);
    }
  } catch (err) {
    console.error('ChartWidgetRenderer error:', err);
    return createErrorFallback(config.type, err instanceof Error ? err.message : 'Unknown error');
  }
};