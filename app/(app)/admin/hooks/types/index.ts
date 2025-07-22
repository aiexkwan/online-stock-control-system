/**
 * Admin Hooks Type Definitions
 * 統一管理所有 admin hooks 的類型定義
 */

// ========================
// Dashboard Data Types
// ========================

export interface AcoOrder {
  id: number;
  order_ref: number;
  supplier: string;
  status: string;
  created_at: string;
  updated_at: string;
  item_count?: number;
  completed_items?: number;
  progress_percentage?: number;
}

export interface AcoOrderWithProgress extends AcoOrder {
  progress: AcoOrderProgress[];
}

export interface AcoOrderProgress {
  id: number;
  order_ref: number;
  product_code: string;
  product_name: string;
  ordered_quantity: number;
  received_quantity: number;
  status: 'pending' | 'partial' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface InventorySearchResult {
  product_code: string;
  product_name: string;
  total_quantity: number;
  available_quantity: number;
  reserved_quantity: number;
  locations: Array<{
    location_code: string;
    quantity: number;
    status: string;
  }>;
  recent_movements: Array<{
    type: 'in' | 'out' | 'transfer';
    quantity: number;
    timestamp: string;
    reference?: string;
  }>;
}

// ========================
// Report Printing Types
// ========================

export interface ReportPrintMetadata {
  userId?: string;
  dateRange?: string;
  filters?: Record<string, unknown>;
  reportTitle?: string;
  generatedAt?: string;
  totalRecords?: number;
}

export interface PrintOptions {
  copies?: number;
  paperSize?: 'A4' | 'A3' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  priority?: 'low' | 'normal' | 'high';
  colorMode?: 'color' | 'grayscale' | 'blackwhite';
}

export interface PrintJobResult {
  success: boolean;
  jobId?: string;
  error?: string;
  estimatedCompletionTime?: Date;
}

// ========================
// Error Handler Types
// ========================

export interface WidgetErrorContext {
  component: string;
  action: string;
  userId?: string;
  additionalData?: Record<string, unknown>;
  timestamp?: string;
  widget?: string;
}

export interface ErrorHandleResult {
  error: Error;
  handled: boolean;
  context: WidgetErrorContext;
}

export interface FormSubmissionData {
  [key: string]: unknown;
}

export interface FileOperationDetails {
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  operation: 'upload' | 'download' | 'process' | 'convert';
}

// ========================
// Performance Tracking Types
// ========================

export interface PerformanceMetrics {
  loadTime?: number;
  renderTime?: number;
  dataFetchTime?: number;
  errorCount: number;
  memoryUsage?: number;
  bundleSize?: number;
}

export interface ABTestConfiguration {
  testId: string;
  variant: 'control' | 'test';
  conversionGoals: string[];
  startDate: Date;
  endDate?: Date;
  trafficSplit: number; // 0-1
}

export interface ConversionEvent {
  type: string;
  value?: number;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export interface PerformanceContext {
  route: string;
  variant: string;
  sessionId: string;
  userId?: string;
  deviceInfo?: {
    userAgent: string;
    viewport: { width: number; height: number };
    connection?: string;
  };
}

export interface RealtimeMetrics {
  widget?: {
    id: string;
    loadTime: number;
    renderTime: number;
    errorRate: number;
    sampleSize: number;
  };
  global: {
    totalMetrics: number;
    activeWidgets: number;
    avgResponseTime: number;
    errorRate: number;
    alerts: Array<{
      type: 'warning' | 'critical';
      message: string;
      metric: string;
      value: number;
      threshold: number;
      timestamp: number;
      category: string;
    }>;
  };
}

// ========================
// Cache System Types
// ========================

export interface QueryParams {
  dateRange?: {
    from: Date;
    to: Date;
  };
  filters?: Record<string, unknown>;
  pagination?: {
    page: number;
    limit: number;
  };
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface HookCacheMetrics {
  hitRate: number;
  avgLoadTime: number;
  lastUpdated: Date | null;
  totalRequests: number;
  errorRate: number;
}

export interface PredictiveConfig {
  enabled: boolean;
  predictor: () => PredictionResult;
  confidence: number; // 0-1
  lookAheadMinutes: number;
}

export interface PredictionResult {
  probability: number; // 0-1
  timeUntilNeeded: number; // milliseconds
  confidence: number; // 0-1
  factors: string[]; // factors that influenced the prediction
}

export interface CacheInvalidationOptions {
  widgetIds?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  tags?: string[];
  force?: boolean;
}

export interface OverallCacheStats {
  totalHits: number;
  totalMisses: number;
  totalErrors: number;
  totalPreloads: number;
  overallHitRate: number;
  avgLoadTime: number;
  widgetCount: number;
  memoryUsage: number;
  cacheSize: number;
}

// ========================
// API Response Types
// ========================

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  success: boolean;
  metadata?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
}

// ========================
// Utility Types
// ========================

export type AsyncState<T> = {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
};

export type RefreshFunction = (force?: boolean) => void | Promise<void>;

export type DataFetcher<T> = (params?: QueryParams) => Promise<T>;

export type ErrorHandler = (error: Error | unknown, context?: Record<string, unknown>) => void;

// ========================
// Export consolidated types for convenience
// ========================

export interface AdminHookOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enabled?: boolean;
  onSuccess?: () => void;
  onError?: ErrorHandler;
}

export interface TimeRangeConfig {
  defaultRange: string;
  availableRanges: string[];
  customRangeEnabled: boolean;
}
