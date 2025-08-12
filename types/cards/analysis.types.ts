/**
 * Analysis Card Type Definitions
 * 為所有分析卡片組件提供統一的類型定義
 */

// 基礎數據類型
export interface AnalysisDataItem {
  id: string | number;
  [key: string]: unknown;
}

// 分析數據結構
export interface AnalysisData<T = AnalysisDataItem> {
  items?: T[];
  summary?: Record<string, number | string>;
  metadata?: {
    total?: number;
    page?: number;
    pageSize?: number;
    timestamp?: string;
    [key: string]: unknown;
  };
}

// GraphQL 查詢定義
export interface GraphQLQuery {
  query: string;
  variables?: Record<string, unknown>;
  operationName?: string;
}

// API 參數
export interface APIParams {
  [key: string]: string | number | boolean | string[] | number[] | undefined;
}

// 數據轉換函數 - 支援同步和異步返回
export type DataTransformFunction<TInput = unknown, TOutput = unknown> = (data: TInput) => TOutput | Promise<TOutput>;

// 自定義過濾器值類型
export type FilterValue = string | number | boolean | Date | string[] | number[] | null | undefined;

// 子卡片組件屬性
export interface SubCardProps<T = unknown> {
  data?: T;
  loading?: boolean;
  error?: Error | null;
  filters?: Record<string, FilterValue>;
  onAction?: (action: string, payload?: unknown) => void;
}

// Render Props 模式的屬性
export interface RenderProps<T = unknown> {
  data: T;
  loading: boolean;
  error?: Error | null;
  refresh?: () => void;
}

// 分析狀態的泛型定義
export interface AnalysisState<T = unknown> {
  filters: Record<string, FilterValue>;
  data: T;
  loading: boolean;
  error: Error | null;
  lastUpdated?: Date;
}

// 通用的分析結果類型
export interface AnalysisResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// 時間範圍類型
export interface TimeRange {
  start: Date;
  end: Date;
  preset?: 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
}

// 分析過濾器 - 統一定義
export interface AnalysisFilters {
  timeRange?: TimeRange;
  dateRange?: {
    from: string;
    to: string;
  };
  productType?: string;
  productCodes?: string[];
  stockTypes?: string[];
  department?: string;
  matchingStatus?: string;
  customFilters?: Record<string, FilterValue>;
  // 注意：我們有意避免使用寬泛的索引簽名，以保持類型安全
  // 如需動態屬性，請使用 customFilters
}

// 分頁配置
export interface PaginationConfig {
  enabled: boolean;
  pageSize: number;
  currentPage: number;
  totalPages?: number;
  totalItems?: number;
}

// 導出相關的實用類型
export type PartialAnalysisData<T = AnalysisDataItem> = Partial<AnalysisData<T>>;
export type AsyncAnalysisResult<T = unknown> = Promise<AnalysisResult<T>>;

// 類型守衛
export function isAnalysisData(data: unknown): data is AnalysisData {
  return (
    typeof data === 'object' &&
    data !== null &&
    ('items' in data || 'summary' in data || 'metadata' in data)
  );
}

export function isTimeRange(value: unknown): value is TimeRange {
  return (
    typeof value === 'object' &&
    value !== null &&
    'start' in value &&
    'end' in value &&
    value.start instanceof Date &&
    value.end instanceof Date
  );
}