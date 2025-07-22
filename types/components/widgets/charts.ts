/**
 * Widget 圖表相關類型
 * Chart widget types and configurations
 */

import type {
  ChartType as DashboardChartType,
  ChartWidgetConfig as DashboardChartWidgetConfig,
  AxisConfig as DashboardAxisConfig,
} from '@/types/components/dashboard';

// Re-export dashboard chart types
export type {
  ChartType as DashboardChartType,
  ChartWidgetConfig as DashboardChartWidgetConfig,
  AxisConfig as DashboardAxisConfig,
} from '@/types/components/dashboard';

/**
 * 擴展的圖表類型
 */
export type ChartType = DashboardChartType | 'radar' | 'gauge' | 'treemap' | 'sankey';

/**
 * 圖表數據點
 */
export interface ChartDataPoint {
  x: string | number | Date;
  y: number;
  label?: string;
  color?: string;
  metadata?: Record<string, unknown>;
}

/**
 * 圖表數據系列
 */
export interface ChartDataSeries {
  id: string;
  name: string;
  data: ChartDataPoint[];
  color?: string;
  type?: ChartType;
  visible?: boolean;
}

/**
 * 圖表軸配置
 */
export interface ChartAxisConfig extends DashboardAxisConfig {
  gridLines?: boolean;
  tickCount?: number;
  tickSize?: number;
  tickPadding?: number;
  axisLine?: boolean;
  orientation?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * 圖表樣式配置
 */
export interface ChartStyleConfig {
  colors: string[];
  backgroundColor?: string;
  gridColor?: string;
  textColor?: string;
  fontFamily?: string;
  fontSize?: number;
  borderRadius?: number;
  padding?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

/**
 * 圖表交互配置
 */
export interface ChartInteractionConfig {
  zoom?: boolean;
  pan?: boolean;
  brush?: boolean;
  hover?: boolean;
  click?: boolean;
  tooltip?: {
    enabled: boolean;
    trigger?: 'hover' | 'click';
    formatter?: (data: ChartDataPoint) => string;
  };
  legend?: {
    enabled: boolean;
    position: 'top' | 'bottom' | 'left' | 'right';
    interactive?: boolean;
  };
}

/**
 * 圖表動畫配置
 */
export interface ChartAnimationConfig {
  enabled: boolean;
  duration: number;
  easing: string;
  delay?: number;
  stagger?: number;
}

/**
 * 圖表響應式配置
 */
export interface ChartResponsiveConfig {
  breakpoints: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  adaptiveHeight?: boolean;
  minHeight?: number;
  maxHeight?: number;
}

/**
 * 完整的圖表配置
 */
export interface ChartConfig {
  type: ChartType;
  data: ChartDataSeries[];
  xAxis: ChartAxisConfig;
  yAxis: ChartAxisConfig;
  style: ChartStyleConfig;
  interaction: ChartInteractionConfig;
  animation: ChartAnimationConfig;
  responsive: ChartResponsiveConfig;
}

/**
 * 圖表容器屬性
 */
export interface ChartContainerProps {
  config: ChartConfig;
  width?: number;
  height?: number;
  className?: string;
  loading?: boolean;
  error?: string | null;
  onDataPointClick?: (point: ChartDataPoint, series: ChartDataSeries) => void;
  onLegendClick?: (series: ChartDataSeries) => void;
  onZoom?: (domain: { x: [number, number]; y: [number, number] }) => void;
}

/**
 * 圖表渲染器屬性
 */
export interface ChartRendererProps extends ChartContainerProps {
  renderType: 'svg' | 'canvas' | 'webgl';
  debug?: boolean;
}

/**
 * 圖表數據加載器配置
 */
export interface ChartDataLoader {
  source: 'api' | 'websocket' | 'static';
  endpoint?: string;
  query?: Record<string, unknown>;
  transform?: (rawData: unknown) => ChartDataSeries[];
  refreshInterval?: number;
  cache?: {
    enabled: boolean;
    ttl: number;
    key: string;
  };
}

/**
 * 圖表導出配置
 */
export interface ChartExportConfig {
  formats: ('png' | 'jpeg' | 'svg' | 'pdf')[];
  quality?: number;
  backgroundColor?: string;
  scale?: number;
  filename?: string;
}
