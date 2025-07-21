/**
 * Widget 基礎類型定義
 * Base type definitions for widgets
 * 
 * 這個文件包含所有 widget 的基礎類型定義，包括配置、屬性和通用接口
 */

import { WidgetType } from '@/types/components/dashboard';

/**
 * Widget 基礎配置接口
 * Base configuration interface for all widgets
 */
export interface BaseWidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  refreshInterval?: number;
  showRefreshButton?: boolean;
  showDownloadButton?: boolean;
  dataSource?: string;
  displayOptions?: Record<string, unknown>;
  timeRange?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  [key: string]: unknown; // 允許擴展配置
}

/**
 * Widget 基礎屬性接口
 * Base props interface for widget components
 */
export interface BaseWidgetProps {
  widgetId: string;
  config?: BaseWidgetConfig;
  className?: string;
  isEditMode?: boolean;
  onUpdate?: (config: Partial<BaseWidgetConfig>) => void;
  onRemove?: () => void;
  onRefresh?: () => void;
  timeFrame?: {
    start: Date;
    end: Date;
  };
}

/**
 * Widget 尺寸映射
 * Widget size class mappings for consistent layouts
 */
export const WIDGET_SIZE_CLASSES = {
  sm: 'col-span-1 row-span-1',
  md: 'col-span-2 row-span-1',
  lg: 'col-span-3 row-span-2',
  xl: 'col-span-4 row-span-2',
} as const;

/**
 * Widget 動畫變體
 * Common animation variants for widgets
 */
export const WIDGET_ANIMATION_VARIANTS = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

/**
 * Widget 過渡動畫配置
 * Common transition configuration
 */
export const WIDGET_TRANSITION = {
  duration: 0.3,
  ease: 'easeInOut',
};

/**
 * Widget 元數據接口
 * Metadata interface for widget runtime information
 */
export interface WidgetMetadata {
  lastUpdated?: Date | null;
  queryTime?: number;
  dataSource?: 'server' | 'cache' | 'rpc';
  hasMore?: boolean;
  optimized?: boolean;
}

/**
 * Widget 錯誤類型
 * Widget error types for consistent error handling
 */
export enum WidgetErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  DATA_ERROR = 'DATA_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Widget 錯誤接口
 * Widget error interface
 */
export interface WidgetError {
  type: WidgetErrorType;
  message: string;
  code?: string;
  context?: string;
  original?: unknown;
  timestamp?: Date;
}

/**
 * Widget 回調函數類型
 * Widget callback function types
 */
export interface WidgetCallbacks {
  onError?: (error: WidgetError) => void;
  onSuccess?: (data: unknown) => void;
  onComplete?: () => void;
  onStateChange?: (state: Partial<WidgetState>) => void;
}

/**
 * Widget 狀態接口
 * Widget state interface
 */
export interface WidgetState {
  id: string;
  isLoading: boolean;
  hasError: boolean;
  error?: WidgetError | null;
  data?: unknown;
  metadata?: WidgetMetadata;
  refreshCount: number;
}

/**
 * Widget 生命週期鉤子
 * Widget lifecycle hooks
 */
export interface WidgetLifecycle {
  onMount?: () => void;
  onUnmount?: () => void;
  onDataChange?: (data: unknown) => void;
  onConfigChange?: (config: BaseWidgetConfig) => void;
  onVisibilityChange?: (visible: boolean) => void;
}

/**
 * Widget 註冊項目接口
 * Widget registry item interface
 */
export interface WidgetRegistryItem {
  type: WidgetType;
  name: string;
  description: string;
  icon?: React.ComponentType | string;
  component: React.ComponentType<BaseWidgetProps>;
  defaultConfig: Partial<BaseWidgetConfig>;
  permissions?: string[];
  category?: string;
}

/**
 * Widget 性能監控接口
 * Widget performance monitoring interface
 */
export interface WidgetPerformance {
  widgetId: string;
  loadTime: number;
  renderTime: number;
  dataSize: number;
  errorCount: number;
  refreshCount: number;
  lastRefresh: Date;
}

/**
 * 類型保護函數
 * Type guard functions
 */
export function isWidgetError(error: unknown): error is WidgetError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'type' in error &&
    'message' in error &&
    Object.values(WidgetErrorType).includes((error as WidgetError).type)
  );
}

export function isBaseWidgetConfig(config: unknown): config is BaseWidgetConfig {
  return (
    config !== null &&
    typeof config === 'object' &&
    'id' in config &&
    'type' in config &&
    'title' in config
  );
}

export function isWidgetState(state: unknown): state is WidgetState {
  return (
    state !== null &&
    typeof state === 'object' &&
    'id' in state &&
    'isLoading' in state &&
    'hasError' in state &&
    'refreshCount' in state
  );
}