/**
 * Strategy 2: DTO/自定義 type interface - Widget API 響應類型定義
 * 為各種 Widget API 響應提供類型安全
 */

// 通用 API 響應基礎類型
export interface BaseApiResponse {
  success?: boolean;
  error?: string;
  message?: string;
  [key: string]: unknown;
}

// REST API Hook 回調函數類型
export interface RestApiCallbacks {
  onError?: (error: Error) => void;
  onSuccess?: (data: unknown) => void;
  onComplete?: () => void;
}

// 元數據類型
export interface ApiMetadata {
  queryTime?: number;
  dataSource?: 'server' | 'cache' | 'rpc';
  timestamp?: string;
  hasMore?: boolean;
  optimized?: boolean;
}

// 歷史記錄事件類型
export interface MergedEvent {
  id: number;
  time: string;
  action: string;
  plt_num: string | null;
  loc: string | null;
  remark: string;
  user_id: number | null;
  user_name: string;
  doc_url: string | null;
  merged_plt_nums: string[];
  merged_count: number;
}

// 歷史記錄 API 響應
export interface HistoryApiResponse extends BaseApiResponse {
  events?: MergedEvent[];
  metadata?: ApiMetadata;
}

// 生產統計相關類型
export interface PalletNode {
  plt_num: string;
  product_qty: number;
  [key: string]: unknown;
}

export interface PalletEdge {
  node: PalletNode;
}

export interface ProductionStatsData {
  record_palletinfoCollection?: {
    edges: PalletEdge[];
  };
  [key: string]: unknown;
}

// Widget 配置類型
export interface WidgetConfig {
  title?: string;
  metric?: string;
  theme?: string;
  refreshInterval?: number;
  [key: string]: unknown;
}

// 生產統計 Widget 配置
export interface ProductionStatsWidgetConfig extends WidgetConfig {
  metric?: 'pallet_count' | 'quantity_sum';
}

// 錯誤對象類型
export interface WidgetError {
  message: string;
  code?: string;
  context?: string;
  original?: unknown;
}

// 類型保護函數
export function isBaseApiResponse(data: unknown): data is BaseApiResponse {
  return data !== null && typeof data === 'object';
}

export function isMergedEvent(data: unknown): data is MergedEvent {
  if (!data || typeof data !== 'object') return false;

  const event = data as Record<string, unknown>;
  return (
    typeof event.id === 'number' &&
    typeof event.time === 'string' &&
    typeof event.action === 'string' &&
    typeof event.user_name === 'string' &&
    Array.isArray(event.merged_plt_nums) &&
    typeof event.merged_count === 'number'
  );
}

export function isHistoryApiResponse(data: unknown): data is HistoryApiResponse {
  if (!isBaseApiResponse(data)) return false;

  const response = data as Record<string, unknown>;
  return (
    response.events === undefined ||
    (Array.isArray(response.events) && response.events.every(isMergedEvent))
  );
}

export function isProductionStatsData(data: unknown): data is ProductionStatsData {
  if (!data || typeof data !== 'object') return false;

  const stats = data as Record<string, unknown>;
  if (!stats.record_palletinfoCollection) return true; // 允許空數據

  const collection = stats.record_palletinfoCollection;
  return (
    typeof collection === 'object' &&
    collection !== null &&
    'edges' in collection &&
    Array.isArray((collection as Record<string, unknown>).edges)
  );
}

export function isPalletNode(data: unknown): data is PalletNode {
  if (!data || typeof data !== 'object') return false;

  const node = data as Record<string, unknown>;
  return typeof node.plt_num === 'string' && typeof node.product_qty === 'number';
}

// DTO 轉換函數
export class WidgetApiMapper {
  static extractMetadata(response: unknown): ApiMetadata {
    if (!isBaseApiResponse(response)) return {};

    const data = response as Record<string, unknown>;
    const metadata = data.metadata;

    if (!metadata || typeof metadata !== 'object') return {};

    const meta = metadata as Record<string, unknown>;
    return {
      queryTime: typeof meta.queryTime === 'number' ? meta.queryTime : undefined,
      dataSource:
        typeof meta.dataSource === 'string'
          ? (meta.dataSource as ApiMetadata['dataSource'])
          : undefined,
      timestamp: typeof meta.timestamp === 'string' ? meta.timestamp : undefined,
      hasMore: typeof meta.hasMore === 'boolean' ? meta.hasMore : undefined,
      optimized: typeof meta.optimized === 'boolean' ? meta.optimized : undefined,
    };
  }

  static extractEvents(response: unknown): MergedEvent[] {
    if (!isHistoryApiResponse(response)) return [];

    return response.events || [];
  }

  static extractProductionData(response: unknown): ProductionStatsData {
    if (!isProductionStatsData(response)) {
      return {};
    }

    return response;
  }

  static createWidgetError(error: unknown, context?: string): WidgetError {
    if (error instanceof Error) {
      return {
        message: error.message,
        context,
        original: error,
      };
    }

    if (typeof error === 'string') {
      return {
        message: error,
        context,
      };
    }

    return {
      message: 'Unknown error occurred',
      context,
      original: error,
    };
  }

  static validateAndExtractData<T>(
    response: unknown,
    validator: (data: unknown) => data is T,
    errorContext?: string
  ): { data: T | null; error: WidgetError | null } {
    try {
      if (validator(response)) {
        return { data: response, error: null };
      }

      return {
        data: null,
        error: this.createWidgetError('Invalid data format', errorContext),
      };
    } catch (err) {
      return {
        data: null,
        error: this.createWidgetError(err, errorContext),
      };
    }
  }
}
