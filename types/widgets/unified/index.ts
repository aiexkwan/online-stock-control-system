/**
 * Widget 統一類型導出
 * Unified widget type exports
 * 
 * 這個文件統一導出所有 widget 相關的類型定義
 * 確保整個項目使用一致的類型系統
 */

// 從 components/dashboard 導入核心枚舉和類型
import { 
  WidgetType,
  DashboardTheme,
  ChartType,
  WidgetEventType 
} from '@/types/components/dashboard';

// 重新導出枚舉
export { 
  WidgetType,
  DashboardTheme,
  ChartType,
  WidgetEventType 
};

// 導出基礎類型（排除已從 state 導出的 WidgetState）
export {
  WIDGET_SIZE_CLASSES,
  WIDGET_ANIMATION_VARIANTS,
  WIDGET_TRANSITION,
  isWidgetError,
  isBaseWidgetConfig,
  WidgetErrorType,  // 導出為值，因為是 enum
} from '../base';

export type {
  BaseWidgetConfig,
  BaseWidgetProps,
  WidgetMetadata,
  WidgetError,
  WidgetCallbacks,
  WidgetLifecycle,
  WidgetRegistryItem,
  WidgetPerformance,
} from '../base';

// 導出數據類型
export * from '../data';

// 導出狀態管理類型（包含 WidgetState）
export * from '../state';

// 從 components/dashboard 重新導出常用類型（避免循環依賴）
export type {
  // Widget 配置相關
  WidgetConfig,
  WidgetBaseConfig,
  DashboardWidget,
  DashboardLayoutItem,
  DashboardConfig,
  DashboardLayout,
  DashboardLayoutExtended,
  
  // Widget 組件屬性
  BaseWidgetComponentProps,
  TraditionalWidgetComponentProps,
  BatchQueryWidgetComponentProps,
  WidgetComponentProps,
  
  // Widget 大小和位置
  WidgetSize,
  WidgetPosition,
  
  // Chart Widget 類型
  ChartWidgetConfig,
  DataSource,
  AxisConfig,
  
  // Table Widget 類型
  TableWidgetConfig,
  
  // Stats Widget 類型
  StatsWidgetConfig,
  
  // Widget 事件
  WidgetEvent,
  
  // 從 dashboard.ts 導入的類型
  WidgetProps,
  DashboardDateRange,
  DashboardBatchQueryError,
  DashboardWidgetConfig,
  DashboardBatchQueryOptions,
} from '@/types/components/dashboard';

// 從 admin/types/dashboard.ts 導入類型（如果需要）
export type {
  WidgetProps as AdminWidgetProps,
  DashboardDateRange as AdminDashboardDateRange,
  DashboardBatchQueryData as AdminDashboardBatchQueryData,
  DashboardBatchQueryError as AdminDashboardBatchQueryError,
  DashboardWidgetConfig as AdminDashboardWidgetConfig,
  DashboardBatchQueryOptions as AdminDashboardBatchQueryOptions,
} from '@/app/(app)/admin/types/dashboard';

/**
 * Widget 類型映射表
 * Widget type mapping for runtime lookups
 */
export const WIDGET_TYPE_MAP: Record<string, WidgetType> = {
  // 基礎類型
  'stats_card': WidgetType.STATS_CARD,
  'analytics_chart': WidgetType.ANALYTICS_CHART,
  'recent_activity': WidgetType.RECENT_ACTIVITY,
  'stock_summary': WidgetType.STOCK_SUMMARY,
  'alerts': WidgetType.ALERTS,
  
  // 業務類型
  'product_mix_chart': WidgetType.PRODUCT_MIX_CHART,
  'aco_order_progress': WidgetType.ACO_ORDER_PROGRESS,
  'void_stats': WidgetType.VOID_STATS,
  'void_pallet': WidgetType.VOID_PALLET,
  
  // 功能類型
  'upload_files': WidgetType.UPLOAD_FILES,
  'product_spec': WidgetType.PRODUCT_SPEC,
  'analytics_dashboard': WidgetType.ANALYTICS_DASHBOARD,
  'reports': WidgetType.REPORTS,
  
  // 生產類型
  'today_production': WidgetType.TODAY_PRODUCTION,
  'machine_efficiency': WidgetType.MACHINE_EFFICIENCY,
  'target_hit_rate': WidgetType.TARGET_HIT_RATE,
  
  // 通用類型
  'chart': WidgetType.CHART,
  'table': WidgetType.TABLE,
  'stats': WidgetType.STATS,
  'map': WidgetType.MAP,
  'alert': WidgetType.ALERT,
  'form': WidgetType.FORM,
  'custom': WidgetType.CUSTOM,
};

/**
 * Widget 類別分組
 * Widget category groupings
 */
export const WIDGET_CATEGORIES = {
  stats: [
    WidgetType.STATS_CARD,
    WidgetType.STATS,
    WidgetType.VOID_STATS,
  ],
  
  charts: [
    WidgetType.ANALYTICS_CHART,
    WidgetType.PRODUCT_MIX_CHART,
    WidgetType.CHART,
  ],
  
  production: [
    WidgetType.TODAY_PRODUCTION,
    WidgetType.MACHINE_EFFICIENCY,
    WidgetType.TARGET_HIT_RATE,
  ],
  
  orders: [
    WidgetType.ACO_ORDER_PROGRESS,
    WidgetType.RECENT_ACTIVITY,
  ],
  
  warehouse: [
    WidgetType.STOCK_SUMMARY,
    WidgetType.VOID_PALLET,
  ],
  
  tools: [
    WidgetType.UPLOAD_FILES,
    WidgetType.PRODUCT_SPEC,
    WidgetType.REPORTS,
    WidgetType.ANALYTICS_DASHBOARD,
  ],
  
  system: [
    WidgetType.ALERTS,
    WidgetType.ALERT,
    WidgetType.MAP,
    WidgetType.FORM,
    WidgetType.TABLE,
  ],
} as const;

/**
 * 類型工具函數
 * Type utility functions
 */

/**
 * 檢查是否為有效的 Widget 類型
 */
export function isValidWidgetType(type: string): type is WidgetType {
  return Object.values(WidgetType).includes(type as WidgetType);
}

/**
 * 獲取 Widget 類別
 */
export function getWidgetCategory(type: WidgetType): string | undefined {
  for (const [category, types] of Object.entries(WIDGET_CATEGORIES)) {
    if ((types as readonly WidgetType[]).includes(type as any)) {
      return category;
    }
  }
  return undefined;
}

/**
 * 從字符串轉換為 WidgetType
 */
export function parseWidgetType(type: string): WidgetType | undefined {
  const normalizedType = type.toLowerCase().replace(/-/g, '_');
  return WIDGET_TYPE_MAP[normalizedType];
}

/**
 * 創建類型安全的 Widget 配置
 */
export function createWidgetConfig<T extends { type: WidgetType }>(
  type: WidgetType,
  config: Omit<T, 'type'>
): T {
  return {
    ...config,
    type,
  } as T;
}

/**
 * 類型斷言輔助函數
 */
export function assertWidgetType<T extends WidgetType>(
  type: unknown,
  expectedType: T
): asserts type is T {
  if (type !== expectedType) {
    throw new Error(`Expected widget type ${expectedType}, but got ${type}`);
  }
}

/**
 * Widget 類型相關的常量
 */
export const WIDGET_CONSTANTS = {
  // 默認刷新間隔（毫秒）
  DEFAULT_REFRESH_INTERVAL: 30000,
  
  // 最小刷新間隔（毫秒）
  MIN_REFRESH_INTERVAL: 5000,
  
  // 最大刷新間隔（毫秒）
  MAX_REFRESH_INTERVAL: 3600000,
  
  // 默認頁面大小
  DEFAULT_PAGE_SIZE: 20,
  
  // 最大頁面大小
  MAX_PAGE_SIZE: 100,
  
  // 緩存過期時間（毫秒）
  CACHE_TTL: 300000, // 5 minutes
  
  // 錯誤重試次數
  ERROR_RETRY_COUNT: 3,
  
  // 錯誤重試延遲（毫秒）
  ERROR_RETRY_DELAY: 1000,
} as const;