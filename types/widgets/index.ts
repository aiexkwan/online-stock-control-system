/**
 * Widget 類型系統主入口
 * Main entry point for widget type system
 * 
 * 統一導出所有 widget 相關類型，確保整個項目使用一致的類型定義
 */

// 導出所有統一類型
export * from './unified';

// 為了方便使用，直接導出常用類型
export type {
  // 基礎類型
  BaseWidgetConfig,
  BaseWidgetProps,
  WidgetState,
  WidgetError,
  WidgetMetadata,
  WidgetCallbacks,
  WidgetLifecycle,
  WidgetRegistryItem,
  WidgetPerformance,
  
  // 數據類型
  BaseApiResponse,
  ApiMetadata,
  DashboardBatchQueryData,
  ChartDataPoint,
  TableData,
  TableColumn,
  MetricConfig,
  TrendInfo,
  ComparisonInfo,
  DataSourceConfig,
  
  // 狀態管理類型
  WidgetAction,
  WidgetStateManager,
  WidgetStateSnapshot,
  WidgetStateSubscriber,
  WidgetStateStore,
  WidgetStatePersistence,
  WidgetStateMiddleware,
} from './unified';

// 導出枚舉
export {
  WidgetType,
  DashboardTheme,
  ChartType,
  WidgetEventType,
  WidgetErrorType,
  WidgetActionType,
} from './unified';

// 導出常量
export {
  WIDGET_SIZE_CLASSES,
  WIDGET_ANIMATION_VARIANTS,
  WIDGET_TRANSITION,
  WIDGET_TYPE_MAP,
  WIDGET_CATEGORIES,
  WIDGET_CONSTANTS,
} from './unified';

// 導出工具函數
export {
  // 類型保護函數
  isWidgetError,
  isBaseWidgetConfig,
  isWidgetState,
  isBaseApiResponse,
  isChartDataPoint,
  isTableData,
  isWidgetAction,
  
  // Widget 類型工具
  isValidWidgetType,
  getWidgetCategory,
  parseWidgetType,
  createWidgetConfig,
  assertWidgetType,
  
  // 狀態管理工具
  createInitialWidgetState,
  widgetStateReducer,
  widgetStateSelectors,
  
  // 數據轉換工具
  WidgetDataMapper,
} from './unified';