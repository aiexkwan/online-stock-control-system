/**
 * 圖表組件類型定義
 */

// 基礎圖表配置
export interface ChartConfig {
  type: ChartType;
  title?: string;
  subtitle?: string;
  data: ChartDataPoint[];
  xAxis?: AxisConfig;
  yAxis?: AxisConfig;
  legend?: LegendConfig;
  tooltip?: TooltipConfig;
  colors?: string[];
  theme?: ChartTheme;
  animation?: AnimationConfig;
  responsive?: boolean;
  height?: number;
  width?: number;
}

export enum ChartType {
  BAR = 'bar',
  HORIZONTAL_BAR = 'horizontal_bar',
  LINE = 'line',
  AREA = 'area',
  PIE = 'pie',
  DOUGHNUT = 'doughnut',
  SCATTER = 'scatter',
  BUBBLE = 'bubble',
  RADAR = 'radar',
  POLAR = 'polar',
  HEATMAP = 'heatmap',
  TREEMAP = 'treemap',
  WATERFALL = 'waterfall',
  GANTT = 'gantt',
}

// 圖表數據點
export interface ChartDataPoint {
  x: string | number | Date;
  y: number;
  z?: number; // 用於氣泡圖
  label?: string;
  color?: string;
  category?: string;
  series?: string;
  metadata?: Record<string, unknown>;
}

// 軸配置
export interface AxisConfig {
  type?: 'category' | 'linear' | 'time' | 'logarithmic';
  position?: 'top' | 'bottom' | 'left' | 'right';
  title?: string;
  min?: number;
  max?: number;
  tickCount?: number;
  tickFormat?: string | ((value: unknown) => string);
  gridLines?: boolean;
  axisLine?: boolean;
  tickLine?: boolean;
  labels?: boolean;
  rotate?: number;
  offset?: number;
}

// 圖例配置
export interface LegendConfig {
  show?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  orientation?: 'horizontal' | 'vertical';
  itemStyle?: {
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    cursor?: string;
  };
  onClick?: (event: LegendClickEvent) => void;
}

export interface LegendClickEvent {
  dataKey: string;
  value: string;
  visible: boolean;
}

// 提示框配置
export interface TooltipConfig {
  show?: boolean;
  trigger?: 'hover' | 'click' | 'none';
  formatter?: (params: TooltipParams) => string | React.ReactNode;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: string | number;
  textStyle?: {
    color?: string;
    fontSize?: number;
    fontWeight?: string;
  };
  position?: TooltipPosition | ((point: { x: number; y: number }) => TooltipPosition);
}

export interface TooltipParams {
  value: number;
  name: string;
  dataKey: string;
  payload: ChartDataPoint;
  color: string;
  label: string;
}

export interface TooltipPosition {
  x: number;
  y: number;
}

// 圖表主題
export interface ChartTheme {
  name: string;
  colors: string[];
  backgroundColor?: string;
  textColor?: string;
  gridColor?: string;
  axisColor?: string;
  fontFamily?: string;
  fontSize?: number;
}

// 動畫配置
export interface AnimationConfig {
  enabled?: boolean;
  duration?: number;
  easing?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
  delay?: number;
  loop?: boolean;
}

// 圖表交互事件
export interface ChartEvents {
  onClick?: (event: ChartClickEvent) => void;
  onHover?: (event: ChartHoverEvent) => void;
  onLegendClick?: (event: LegendClickEvent) => void;
  onZoom?: (event: ChartZoomEvent) => void;
  onBrush?: (event: ChartBrushEvent) => void;
}

export interface ChartClickEvent {
  dataPoint: ChartDataPoint;
  seriesName: string;
  value: number;
  x: number;
  y: number;
}

export interface ChartHoverEvent {
  dataPoint?: ChartDataPoint;
  seriesName?: string;
  value?: number;
  x: number;
  y: number;
}

export interface ChartZoomEvent {
  startIndex: number;
  endIndex: number;
  startValue: unknown;
  endValue: unknown;
}

export interface ChartBrushEvent {
  startIndex: number;
  endIndex: number;
  selectedData: ChartDataPoint[];
}

// 特定圖表類型配置
export interface BarChartConfig extends ChartConfig {
  type: ChartType.BAR | ChartType.HORIZONTAL_BAR;
  barWidth?: number | string;
  barGap?: number | string;
  barCategoryGap?: number | string;
  stacked?: boolean;
  showValues?: boolean;
}

export interface LineChartConfig extends ChartConfig {
  type: ChartType.LINE;
  smooth?: boolean;
  strokeWidth?: number;
  strokeDasharray?: string;
  connectNulls?: boolean;
  showPoints?: boolean;
  pointSize?: number;
}

export interface PieChartConfig extends ChartConfig {
  type: ChartType.PIE | ChartType.DOUGHNUT;
  innerRadius?: number | string;
  outerRadius?: number | string;
  startAngle?: number;
  endAngle?: number;
  showLabels?: boolean;
  labelPosition?: 'inside' | 'outside' | 'edge';
}

export interface AreaChartConfig extends ChartConfig {
  type: ChartType.AREA;
  stacked?: boolean;
  smooth?: boolean;
  fillOpacity?: number;
  gradient?: boolean;
}

// 圖表數據處理
export interface ChartDataProcessor {
  aggregate?: (data: ChartDataPoint[]) => ChartDataPoint[];
  filter?: (data: ChartDataPoint[]) => ChartDataPoint[];
  sort?: (data: ChartDataPoint[]) => ChartDataPoint[];
  transform?: (data: ChartDataPoint[]) => ChartDataPoint[];
}

// 圖表狀態
export interface ChartState {
  data: ChartDataPoint[];
  loading: boolean;
  error?: string;
  selectedItems: string[];
  zoomRange?: { start: number; end: number };
  filters: Record<string, unknown>;
}

// 圖表性能配置
export interface ChartPerformanceConfig {
  enableVirtualization?: boolean;
  maxDataPoints?: number;
  updateStrategy?: 'replace' | 'append' | 'prepend';
  debounceMs?: number;
  lazyLoad?: boolean;
}

// === 從 app/types/warehouse-work-level.ts 遷移的圖表相關類型 ===

// 圖表數據點 (特定於倉庫工作水平)
export interface WarehouseChartDataPoint {
  date: string;
  moves: number;
  operators: number;
}

// 摘要統計數據
export interface SummaryStats {
  totalMoves: number;
  uniqueOperators: number;
  avgMovesPerDay: number;
  peakDay: {
    date: string;
    moves: number;
    formattedDate: string;
  } | null;
}
