/**
 * 儀表板組件類型定義 - 統一管理
 */

// Widget 類型枚舉 (從 app/types/dashboard.ts 遷移)
export enum WidgetType {
  STATS_CARD = 'stats_card',
  ANALYTICS_CHART = 'analytics_chart',
  RECENT_ACTIVITY = 'recent_activity',
  STOCK_SUMMARY = 'stock_summary',
  ALERTS = 'alerts',
  PRODUCT_MIX_CHART = 'product_mix_chart',
  ACO_ORDER_PROGRESS = 'aco_order_progress',
  VOID_STATS = 'void_stats',
  VOID_PALLET = 'void_pallet',
  UPLOAD_FILES = 'upload_files',
  PRODUCT_SPEC = 'product_spec',
  ANALYTICS_DASHBOARD = 'analytics_dashboard',
  REPORTS = 'reports',
  CUSTOM = 'custom',
  TODAY_PRODUCTION = 'today_production',
  MACHINE_EFFICIENCY = 'machine_efficiency',
  TARGET_HIT_RATE = 'target_hit_rate',
  // 通用類型
  CHART = 'chart',
  TABLE = 'table',
  STATS = 'stats',
  MAP = 'map',
  ALERT = 'alert',
  FORM = 'form',
}

// Widget 基礎配置 (從 app/types/dashboard.ts 遷移)
export interface WidgetBaseConfig {
  refreshInterval?: number; // 自動刷新間隔（毫秒）
  dataSource?: string; // 數據源
  displayOptions?: Record<string, unknown>; // 顯示選項
  timeRange?: string; // 時間範圍
  [key: string]: unknown; // 擴展配置
}

// Widget 配置 (用於 admin page)
export interface WidgetConfig {
  id: string;
  type: WidgetType;
  gridProps: {
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
    maxW?: number;
    maxH?: number;
  };
  config: {
    refreshInterval?: number;
    timeRange?: string;
    [key: string]: unknown;
  };
}

export interface WidgetSize {
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface WidgetPosition {
  x: number;
  y: number;
  z?: number;
}

// 儀表板 Widget (從 app/types/dashboard.ts 遷移)
export interface DashboardWidget {
  id: string; // 唯一標識
  type: WidgetType; // 小部件類型
  title: string; // 顯示標題
  config: WidgetBaseConfig; // 小部件配置
  permissions?: string[]; // 權限要求
}

// 儀表板佈局項目 (從 app/types/dashboard.ts 遷移)
export interface DashboardLayoutItem {
  i: string; // widget id
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

// 儀表板配置 (從 app/types/dashboard.ts 遷移)
export interface DashboardConfig {
  id?: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  layouts: {
    lg?: DashboardLayoutItem[];
    md?: DashboardLayoutItem[];
    sm?: DashboardLayoutItem[];
    xs?: DashboardLayoutItem[];
    xxs?: DashboardLayoutItem[];
  };
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// 簡化的 Dashboard Layout (用於 admin page)
export interface DashboardLayout {
  widgets: WidgetConfig[];
}

// Dashboard 佈局 (通用)
export interface DashboardLayoutExtended {
  id: string;
  name: string;
  description?: string;
  theme: DashboardTheme;
  widgets: WidgetConfig[];
  isDefault: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export enum DashboardTheme {
  INJECTION = 'injection',
  PIPELINE = 'pipeline',
  WAREHOUSE = 'warehouse',
  CUSTOM = 'custom',
}

// Widget 組件屬性基礎接口 (從 app/types/dashboard.ts 遷移)
export interface BaseWidgetComponentProps {
  isEditMode?: boolean;
  onUpdate?: (config: WidgetBaseConfig) => void;
  onRemove?: () => void;
  timeFrame?: {
    start: Date;
    end: Date;
  };
}

// 傳統 Widget 組件屬性（使用 widget 對象）
export interface TraditionalWidgetComponentProps extends BaseWidgetComponentProps {
  widget: DashboardWidget | WidgetConfig;
  widgetId?: never;
}

// 批量查詢 Widget 組件屬性（使用 widgetId 字符串）
export interface BatchQueryWidgetComponentProps extends BaseWidgetComponentProps {
  widgetId: string;
  widget?: never;
}

// 聯合類型，支持兩種模式
export type WidgetComponentProps = TraditionalWidgetComponentProps | BatchQueryWidgetComponentProps;

// Widget 註冊表項目 (從 app/types/dashboard.ts 遷移)
export interface WidgetRegistryItem {
  type: WidgetType;
  name: string;
  description: string;
  icon?: React.ComponentType | string;
  component: React.ComponentType<WidgetComponentProps>;
  defaultConfig: WidgetBaseConfig;
}

// Widget 狀態
export interface WidgetState {
  id: string;
  isLoading: boolean;
  hasError: boolean;
  error?: string;
  data?: unknown;
  lastUpdated?: string;
  refreshCount: number;
}

// Chart Widget 特定類型
export interface ChartWidgetConfig {
  chartType: ChartType;
  dataSource: DataSource;
  xAxis: AxisConfig;
  yAxis: AxisConfig;
  colors?: string[];
  showLegend: boolean;
  showTooltip: boolean;
  animation: boolean;
}

export enum ChartType {
  BAR = 'bar',
  LINE = 'line',
  PIE = 'pie',
  AREA = 'area',
  SCATTER = 'scatter',
  HEATMAP = 'heatmap',
}

export interface DataSource {
  type: 'api' | 'static' | 'realtime';
  endpoint?: string;
  query?: Record<string, unknown>;
  refreshInterval?: number;
  data?: unknown[];
}

export interface AxisConfig {
  key: string;
  label: string;
  type: 'category' | 'number' | 'time';
  format?: string;
  domain?: [number, number];
}

// Table Widget 特定類型
export interface TableWidgetConfig {
  columns: TableColumn[];
  dataSource: DataSource;
  pagination: boolean;
  sorting: boolean;
  filtering: boolean;
  exportEnabled: boolean;
}

export interface TableColumn {
  key: string;
  title: string;
  dataIndex: string;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  render?: string; // 渲染函數名稱
}

// Stats Widget 特定類型
export interface StatsWidgetConfig {
  metrics: MetricConfig[];
  layout: 'horizontal' | 'vertical' | 'grid';
  showTrend: boolean;
  showComparison: boolean;
}

export interface MetricConfig {
  key: string;
  label: string;
  value: number | string;
  unit?: string;
  trend?: TrendInfo;
  comparison?: ComparisonInfo;
  format?: string;
  color?: string;
  icon?: string;
}

export interface TrendInfo {
  direction: 'up' | 'down' | 'stable';
  percentage: number;
  period: string;
}

export interface ComparisonInfo {
  value: number | string;
  label: string;
  type: 'percentage' | 'absolute';
}

// Widget 交互事件
export interface WidgetEvent {
  type: WidgetEventType;
  widgetId: string;
  data?: unknown;
  timestamp: string;
}

export enum WidgetEventType {
  CLICK = 'click',
  HOVER = 'hover',
  DRILL_DOWN = 'drill_down',
  EXPORT = 'export',
  REFRESH = 'refresh',
  RESIZE = 'resize',
  MOVE = 'move',
}

// 性能監控
export interface WidgetPerformance {
  widgetId: string;
  loadTime: number;
  renderTime: number;
  dataSize: number;
  errorCount: number;
  refreshCount: number;
  lastRefresh: string;
}

// 批量查詢相關類型
export interface DashboardDateRange {
  start: Date;
  end: Date;
}

export interface DashboardBatchQueryError {
  widgetId: string;
  error: Error;
  timestamp: Date;
}

export interface DashboardBatchQueryOptions {
  parallel?: boolean;
  timeout?: number;
  retryCount?: number;
  cacheStrategy?: 'none' | 'memory' | 'persistent';
}

// Widget Props 類型（用於組件）
export interface WidgetProps extends BaseWidgetComponentProps {
  widget: DashboardWidget | WidgetConfig;
}

// DashboardWidgetConfig 類型別名
export type DashboardWidgetConfig = WidgetConfig;
