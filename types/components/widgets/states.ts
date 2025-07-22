/**
 * Widget 狀態相關類型
 * Widget state types and state management
 */

import type { WidgetErrorType } from './common';

/**
 * Widget 載入狀態
 */
export interface WidgetLoadingState {
  isLoading: boolean;
  loadingMessage?: string;
  progress?: number; // 0-100
}

/**
 * Widget 錯誤狀態
 */
export interface WidgetErrorState {
  hasError: boolean;
  error?: Error;
  errorType?: WidgetErrorType;
  errorMessage?: string;
  canRetry: boolean;
  retryCount: number;
  maxRetries: number;
}

/**
 * Widget 數據狀態
 */
export interface WidgetDataState<TData = unknown> {
  data: TData | null;
  isEmpty: boolean;
  isStale: boolean;
  lastUpdated?: Date;
  version: number;
}

/**
 * Widget 完整狀態
 */
export interface WidgetState<TData = unknown> {
  id: string;
  loading: WidgetLoadingState;
  error: WidgetErrorState;
  data: WidgetDataState<TData>;
  config: {
    autoRefresh: boolean;
    refreshInterval: number;
  };
}

/**
 * Widget 狀態動作類型
 */
export type WidgetStateAction<TData = unknown> =
  | { type: 'LOADING_START'; payload?: { message?: string; progress?: number } }
  | { type: 'LOADING_END' }
  | { type: 'DATA_LOADED'; payload: { data: TData } }
  | { type: 'DATA_UPDATED'; payload: { data: TData; partial?: boolean } }
  | { type: 'ERROR_OCCURRED'; payload: { error: Error; errorType?: WidgetErrorType } }
  | { type: 'ERROR_CLEARED' }
  | { type: 'RETRY_ATTEMPTED' }
  | { type: 'STATE_RESET' }
  | { type: 'CONFIG_UPDATED'; payload: { autoRefresh?: boolean; refreshInterval?: number } };

/**
 * Widget 狀態 Reducer
 */
export type WidgetStateReducer<TData = unknown> = (
  state: WidgetState<TData>,
  action: WidgetStateAction<TData>
) => WidgetState<TData>;

/**
 * Widget 狀態管理器接口
 */
export interface WidgetStateManager<TData = unknown> {
  state: WidgetState<TData>;
  dispatch: (action: WidgetStateAction<TData>) => void;
  reset: () => void;
  refresh: () => Promise<void>;
  updateConfig: (config: Partial<WidgetState<TData>['config']>) => void;
}

/**
 * Widget 狀態訂閱者
 */
export interface WidgetStateSubscriber<TData = unknown> {
  onStateChange: (state: WidgetState<TData>) => void;
  onError?: (error: WidgetErrorState) => void;
  onDataChange?: (data: WidgetDataState<TData>) => void;
}

/**
 * Widget 狀態持久化配置
 */
export interface WidgetStatePersistence {
  enabled: boolean;
  key: string;
  storage: 'localStorage' | 'sessionStorage' | 'memory';
  serialize?: (state: WidgetState) => string;
  deserialize?: (data: string) => WidgetState;
}

/**
 * Widget 狀態同步配置
 */
export interface WidgetStateSync {
  enabled: boolean;
  channel: string;
  debounceMs: number;
  onSync?: (state: WidgetState) => void;
}

// ================================
// WidgetStates Component Types (從 WidgetStates.tsx 遷移)
// ================================

/**
 * Skeleton 類型
 */
export type SkeletonType =
  | 'default' // Default rows skeleton
  | 'timeline' // Timeline with circles and bars
  | 'chart-bar' // Bar chart skeleton
  | 'chart-pie' // Pie/circular chart skeleton
  | 'chart-area' // Area chart skeleton
  | 'list' // List rows skeleton
  | 'stats' // Stats card skeleton
  | 'table' // Table skeleton
  | 'spinner' // Simple spinner
  | 'custom'; // Custom skeleton

/**
 * Widget Skeleton 屬性
 */
export interface WidgetSkeletonProps {
  /** Type of skeleton to display */
  type?: SkeletonType;
  /** Number of skeleton rows to display (for default/list/table types) */
  rows?: number;
  /** Additional CSS classes */
  className?: string;
  /** Show header skeleton */
  showHeader?: boolean;
  /** Custom skeleton content */
  children?: React.ReactNode;
  /** Height for chart skeletons */
  height?: number;
  /** Number of columns for table skeleton */
  columns?: number;
}

/**
 * 錯誤嚴重程度
 */
export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * 錯誤顯示模式
 */
export type ErrorDisplay = 'inline' | 'full' | 'compact';

/**
 * Widget 錯誤屬性
 */
export interface WidgetErrorProps {
  /** Error message to display */
  message?: string;
  /** Error severity level */
  severity?: ErrorSeverity;
  /** Display mode */
  display?: ErrorDisplay;
  /** Error code for tracking */
  code?: string;
  /** Retry callback function */
  onRetry?: () => void;
  /** Additional action buttons */
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
  }>;
  /** Additional CSS classes */
  className?: string;
  /** Show detailed error in development */
  error?: Error | null;
  /** Custom error icon */
  icon?: React.ReactNode;
  /** Hide icon completely */
  hideIcon?: boolean;
}

/**
 * Widget 空狀態屬性
 */
export interface WidgetEmptyProps {
  /** Empty state message */
  message?: string;
  /** Additional description */
  description?: string;
  /** Action button configuration */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Additional CSS classes */
  className?: string;
  /** Custom empty icon */
  icon?: React.ReactNode;
}

/**
 * Widget 載入遮罩屬性
 */
export interface WidgetLoadingOverlayProps {
  /** Show overlay */
  isLoading: boolean;
  /** Loading message */
  message?: string;
  /** Additional CSS classes */
  className?: string;
  /** Blur background */
  blur?: boolean;
}

/**
 * Widget 狀態包裝器屬性
 */
export interface WidgetStateWrapperProps {
  loading?: boolean;
  error?: Error | string | null;
  empty?: boolean;
  onRetry?: () => void;
  emptyMessage?: string;
  emptyDescription?: string;
  errorMessage?: string;
  skeletonType?: SkeletonType;
  skeletonRows?: number;
  skeletonHeight?: number;
  skeletonColumns?: number;
  showHeaderSkeleton?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Widget Suspense Fallback 屬性
 */
export interface WidgetSuspenseFallbackProps {
  /** Type of widget being loaded */
  type?: 'default' | 'stats' | 'chart' | 'table' | 'list';
  /** Additional CSS classes */
  className?: string;
  /** Height for the fallback */
  height?: string;
}
