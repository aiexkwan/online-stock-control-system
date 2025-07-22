/**
 * Widget 通用類型定義
 * Common types for all widgets
 */

import type {
  WidgetType,
  BaseWidgetConfig as DashboardBaseWidgetConfig,
  BaseWidgetState as DashboardBaseWidgetState,
  WidgetComponentProps as DashboardWidgetComponentProps,
  WidgetErrorType as DashboardWidgetErrorType,
} from '@/types/components/dashboard';

// Re-export dashboard types to maintain backward compatibility
export type { WidgetType } from '@/types/components/dashboard';

/**
 * Widget 基礎配置接口 - 簡化版本
 * 避免與 dashboard.ts 中的 BaseWidgetConfig 重複
 */
export interface WidgetBaseConfig {
  id: string;
  title: string;
  description?: string;
  refreshInterval?: number;
  showRefreshButton?: boolean;
  showDownloadButton?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  // 擴展屬性
  theme?: string;
  variant?: 'default' | 'compact' | 'detailed';
  autoRefresh?: boolean;
}

/**
 * Widget 基礎狀態接口 - 簡化版本
 * 避免與 dashboard.ts 中的 BaseWidgetState 重複
 */
export interface WidgetBaseState {
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  data: unknown[];
  // 擴展屬性
  refreshing: boolean;
  retryCount: number;
  lastError?: Error;
}

/**
 * Widget 組件屬性接口
 */
export interface WidgetComponentProps {
  isEditMode?: boolean;
  onUpdate?: (config: WidgetBaseConfig) => void;
  onRemove?: () => void;
  timeFrame?: {
    start: Date;
    end: Date;
  };
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Widget 錯誤類型
 */
export type WidgetErrorType = DashboardWidgetErrorType;

/**
 * Widget 大小類型
 */
export type WidgetSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * Widget 大小映射
 */
export const WIDGET_SIZE_CLASSES = {
  sm: 'col-span-1 row-span-1',
  md: 'col-span-2 row-span-1',
  lg: 'col-span-3 row-span-2',
  xl: 'col-span-4 row-span-2',
} as const;

/**
 * Widget 動畫配置
 */
export const WIDGET_ANIMATION_VARIANTS = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
} as const;

/**
 * Widget 過渡動畫配置
 */
export const WIDGET_TRANSITION = {
  duration: 0.3,
  ease: 'easeInOut' as const,
};

/**
 * Widget 刷新狀態
 */
export interface WidgetRefreshState {
  isRefreshing: boolean;
  lastRefresh?: Date;
  nextRefresh?: Date;
  refreshCount: number;
}

/**
 * Widget 性能指標
 */
export interface WidgetPerformanceMetrics {
  loadTime: number;
  renderTime: number;
  dataFetchTime: number;
  errorRate: number;
  refreshRate: number;
}

/**
 * Widget 配置驗證結果
 */
export interface WidgetConfigValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Widget 生命周期回調
 */
export interface WidgetLifecycleCallbacks {
  onMount?: () => void;
  onUnmount?: () => void;
  onRefresh?: () => void;
  onError?: (error: Error) => void;
  onDataLoad?: (data: unknown) => void;
}
