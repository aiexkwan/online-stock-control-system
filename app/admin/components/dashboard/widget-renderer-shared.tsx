/**
 * 共享的 Widget Renderer 類型定義和工具函數
 * 供 AdminWidgetRenderer 拆分後的子組件使用
 */

import React from 'react';
import { AdminWidgetConfig } from './adminDashboardLayouts';
import { TimeFrame } from '@/app/components/admin/UniversalTimeRangeSelector';

// 主題顏色映射
export const THEME_GLOW_COLORS = {
  injection: 'production',
  pipeline: 'search', 
  warehouse: 'warehouse',
  analysis: 'inventory',
  upload: 'search',
  update: 'update',
  'stock-management': 'production',
  system: 'update'
} as const;

export type ThemeKey = 'production' | 'warehouse' | 'inventory' | 'update' | 'search';

export const getThemeGlowColor = (theme?: string): ThemeKey => {
  return theme && theme in THEME_GLOW_COLORS 
    ? THEME_GLOW_COLORS[theme as keyof typeof THEME_GLOW_COLORS] as ThemeKey
    : 'warehouse'; // 默認 warehouse（藍色）
};

// 圖表顏色配置
export const CHART_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00',
  '#ff0000', '#0088fe', '#00c49f', '#ffbb28', '#ff8042',
  '#8dd1e1', '#d084d0', '#ffb347', '#87d068', '#ff6b6b'
];

// Widget Renderer 基礎 Props
export interface BaseWidgetRendererProps {
  config: AdminWidgetConfig;
  theme: string;
  timeFrame: TimeFrame;
  data?: any;
  loading?: boolean;
  error?: string | null;
  renderLazyComponent: (componentName: string, props: any) => JSX.Element;
}

// Component Props Factory 類型
export interface ComponentProps {
  config: AdminWidgetConfig;
  timeFrame: TimeFrame;
  theme: string;
  data?: any;
}

// Component Props Factory 函數
export const getComponentPropsFactory = (config: AdminWidgetConfig, timeFrame: TimeFrame, theme: string) => {
  return (data?: any): ComponentProps => ({
    config,
    timeFrame,
    theme,
    data
  });
};

// Widget 類型分類
export const WIDGET_CATEGORIES = {
  CHART: [
    'StockDistributionChart',
    'StockDistributionChartV2', 
    'StockLevelHistoryChart',
    'TransferTimeDistributionWidget',
    'WarehouseWorkLevelAreaChart',
    'WarehouseHeatmap',
    'PipelineFlowDiagram',
    'chart'
  ],
  STATS: [
    'AwaitLocationQtyWidget',
    'YesterdayTransferCountWidget', 
    'StillInAwaitWidget',
    'StillInAwaitPercentageWidget',
    'production_summary',
    'production_details', 
    'work_level',
    'pipeline_production_details',
    'pipeline_work_level',
    'system_status',
    'stats'
  ],
  LIST: [
    'OrderStateListWidget',
    'WarehouseTransferListWidget',
    'StockInventoryTable', 
    'orders-list',
    'other-files-list',
    'activity-feed',
    'table',
    'list'
  ]
} as const;

// 判斷 Widget 類型的工具函數
export const getWidgetCategory = (widgetType: string): 'chart' | 'stats' | 'list' | 'core' => {
  if (WIDGET_CATEGORIES.CHART.includes(widgetType)) return 'chart';
  if (WIDGET_CATEGORIES.STATS.includes(widgetType)) return 'stats';  
  if (WIDGET_CATEGORIES.LIST.includes(widgetType)) return 'list';
  return 'core';
};

// 錯誤邊界組件的錯誤處理
export const createErrorFallback = (componentName: string, error?: string) => {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <h3 className="font-medium text-red-600">Widget Error</h3>
      <p className="mt-1 text-sm text-red-500">Failed to load {componentName}</p>
      {error && (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs text-red-400">Details</summary>
          <pre className="mt-1 overflow-auto text-xs">{error}</pre>
        </details>
      )}
    </div>
  );
};