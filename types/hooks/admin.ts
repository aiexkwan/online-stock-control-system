/**
 * Admin Hook Types - Centralized
 * 統一管理 Admin 相關 Hook 類型定義
 */

// Re-export types from existing admin hooks types
export type {
  // Dashboard Data Types
  AcoOrder,
  AcoOrderWithProgress,
  AcoOrderProgress,
  InventorySearchResult,

  // Report Printing Types
  ReportPrintMetadata,
  PrintOptions,
  PrintJobResult,

  // Error Handler Types
  WidgetErrorContext,
  ErrorHandleResult,
  FormSubmissionData,
  FileOperationDetails,

  // Performance Tracking Types
  PerformanceMetrics,
  ABTestConfiguration,
  ConversionEvent,
  PerformanceContext,
  RealtimeMetrics,

  // Cache System Types
  QueryParams,
  HookCacheMetrics,
  PredictiveConfig,
  PredictionResult,
  CacheInvalidationOptions,
  OverallCacheStats,

  // API Response Types
  ApiError,
  ApiResponse,

  // Utility Types
  AsyncState,
  RefreshFunction,
  DataFetcher,
  ErrorHandler,
  AdminHookOptions,
  TimeRangeConfig,
} from '@/app/(app)/admin/hooks/types';

// Additional types specific to hooks
export interface WidgetErrorOptions {
  showToast?: boolean;
  logToDatabase?: boolean;
  transactionId?: string;
  customMessage?: string;
}

export interface WidgetToastOptions {
  duration?: number;
  position?:
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface UseWidgetToastReturn {
  showSuccess: (message: string, options?: WidgetToastOptions) => void;
  showError: (message: string, error?: Error, options?: WidgetToastOptions) => void;
  showInfo: (message: string, options?: WidgetToastOptions) => void;
  showWarning: (message: string, options?: WidgetToastOptions) => void;
  showLoading: (message: string, options?: WidgetToastOptions) => () => void;
  showPromise: <T>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ) => Promise<T>;
}

// API Variables and Response types
export type APIVariables = Record<string, string | number | boolean | string[] | null | undefined>;

export interface APIResponseBase {
  data?: unknown;
  error?: string | null;
  meta?: {
    total?: number;
    page?: number;
    hasMore?: boolean;
  };
}

export interface UseUnifiedAPIOptions<TData, TVariables extends APIVariables = APIVariables> {
  // REST API configuration
  restEndpoint: string;
  restMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

  // Common options
  variables?: TVariables;
  skip?: boolean;
  onCompleted?: (data: TData) => void;
  onError?: (error: Error) => void;
  extractFromContext?: (contextData: APIResponseBase) => TData | null;
  widgetId?: string;

  // Cache and retry
  cacheTime?: number;
  staleTime?: number;
  retryCount?: number;
}

export interface UseUnifiedAPIResult<TData> {
  data: TData | undefined;
  loading: boolean;
  error: Error | undefined;
  refetch: () => Promise<void>;
  apiType: 'rest' | 'context';
  performanceMetrics?: {
    queryTime: number;
    dataSource: 'context' | 'rest' | 'cache';
    fallbackUsed: boolean;
  };
}

// Smart Cache Types - re-export specific types from admin hooks
export type {
  UseWidgetSmartCacheOptions,
  UseWidgetSmartCacheResult,
} from '@/app/(app)/admin/hooks/useWidgetSmartCache';
