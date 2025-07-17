/**
 * Universal Stats Widget 統一接口定義
 * 
 * 支援將6個現有 stats widgets 統一到配置驅動的系統：
 * - AwaitLocationQtyWidget
 * - YesterdayTransferCountWidget  
 * - StillInAwaitWidget
 * - StillInAwaitPercentageWidget
 * - StatsCardWidget
 * - InjectionProductionStatsWidget
 */

export type StatsDisplayType = 'metric' | 'progress' | 'trend';
export type StatsDataSourceType = 'batch' | 'graphql' | 'server';
export type StatsFormatType = 'number' | 'percentage' | 'currency' | 'duration';

/**
 * 統一的 Stats 數據結構
 */
export interface StatsData {
  value: number | string;
  label?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'stable';
    percentage?: number;
    label?: string;
  };
  progress?: {
    current: number;
    total: number;
    percentage: number;
  };
  metadata?: {
    [key: string]: any;
  };
}

/**
 * 數據源配置
 */
export interface StatsDataSourceConfig {
  type: StatsDataSourceType;
  
  // GraphQL 查詢配置
  query?: string;
  variables?: Record<string, any>;
  
  // 批量查詢配置
  widgetId?: string;
  batchKey?: string;
  
  // Server Action 配置
  serverAction?: (...args: any[]) => Promise<any>;
  
  // 數據轉換函數
  transform?: (data: any) => StatsData;
  
  // 緩存配置
  cacheTTL?: number;
  enableCache?: boolean;
}

/**
 * 顯示配置
 */
export interface StatsDisplayConfig {
  type: StatsDisplayType;
  title: string;
  
  // 圖標配置
  icon?: React.ComponentType<any>;
  iconColor?: string;
  
  // 格式化配置
  format?: StatsFormatType;
  precision?: number;
  prefix?: string;
  suffix?: string;
  
  // 樣式配置
  theme?: 'default' | 'accent' | 'warning' | 'success' | 'error';
  size?: 'sm' | 'md' | 'lg';
  
  // 動畫配置
  animateOnMount?: boolean;
  animationDuration?: number;
  
  // 時間範圍顯示
  showDateRange?: boolean;
  dateRangeFormat?: string;
}

/**
 * 互動配置
 */
export interface StatsInteractionConfig {
  clickable?: boolean;
  drillDownUrl?: string;
  onClick?: (data: StatsData) => void;
  
  // 刷新配置
  refreshInterval?: number;
  showRefreshButton?: boolean;
  onRefresh?: () => void;
  
  // Tooltip 配置
  tooltip?: string | ((data: StatsData) => string);
  
  // 編輯模式配置
  editMode?: {
    mockData?: StatsData;
    placeholder?: string;
  };
}

/**
 * 性能配置
 */
export interface StatsPerformanceConfig {
  enableFallback?: boolean;
  fallbackData?: StatsData;
  loadingTimeout?: number;
  retryAttempts?: number;
  
  // Progressive Loading
  enableProgressiveLoading?: boolean;
  viewport?: {
    threshold?: number;
    rootMargin?: string;
  };
  
  // 性能監控
  enableMetrics?: boolean;
  metricsId?: string;
}

/**
 * 完整的 Universal Stats Widget 配置
 */
export interface UniversalStatsWidgetConfig {
  id: string;
  dataSource: StatsDataSourceConfig;
  display: StatsDisplayConfig;
  interaction?: StatsInteractionConfig;
  performance?: StatsPerformanceConfig;
}

/**
 * Widget Props
 */
export interface UniversalStatsWidgetProps {
  config: UniversalStatsWidgetConfig;
  widget?: any; // 從現有 WidgetComponentProps 繼承
  isEditMode?: boolean;
  timeFrame?: {
    start: Date;
    end: Date;
  };
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 預設配置模板
 */
export interface StatsWidgetTemplate {
  id: string;
  name: string;
  description: string;
  config: UniversalStatsWidgetConfig;
  category: 'inventory' | 'production' | 'transfer' | 'general';
  tags: string[];
}

/**
 * 統一的 Hook 返回類型
 */
export interface UseUniversalStatsResult {
  data: StatsData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  lastUpdated?: Date;
  source?: 'cache' | 'graphql' | 'server' | 'fallback';
}