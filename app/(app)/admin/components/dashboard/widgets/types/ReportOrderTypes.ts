/**
 * Strategy 2: DTO/自定義 type interface - Report & Order Widget 類型定義
 * 為報表生成和訂單相關 Widget 組件提供類型安全
 */

// 訂單記錄類型
export interface OrderRecord {
  uuid: string;
  time: string;
  remark: string;
  uploader_name: string;
  doc_url?: string;
  id?: string;
  [key: string]: unknown;
}

// 訂單列表 API 響應
export interface OrdersListResponse {
  orders: OrderRecord[];
  hasMore: boolean;
  totalCount: number;
  error?: string;
}

// Report Generator 相關類型
export interface ReportReference {
  value: string;
  label?: string;
  [key: string]: unknown;
}

export interface ReportMetadata {
  totalCount?: number;
  queryTime?: string;
  optimized?: boolean;
  [key: string]: unknown;
}

export interface ReportGeneratorState {
  selectedRef: string;
  references: string[];
  isLoadingRefs: boolean;
  downloadStatus: 'idle' | 'downloading' | 'downloaded' | 'complete';
  progress: number;
  error: string | null;
  metadata: ReportMetadata;
}

// Widget API 響應包裝類型
export interface ReportWidgetApiWrapper {
  value?: unknown;
  error?: string;
  metadata?: ReportMetadata;
  [key: string]: unknown;
}

// Performance metrics 類型
export interface PerformanceMetrics {
  apiResponseTime?: number;
  optimized?: boolean;
  fetchTime?: number;
  source?: string;
}

// 下載狀態類型
export type DownloadStatus = 'idle' | 'downloading' | 'downloaded' | 'complete';

// 類型保護函數
export function isOrderRecord(data: unknown): data is OrderRecord {
  if (!data || typeof data !== 'object') return false;

  const record = data as Record<string, unknown>;
  return (
    typeof record.uuid === 'string' &&
    typeof record.time === 'string' &&
    typeof record.remark === 'string' &&
    typeof record.uploader_name === 'string'
  );
}

export function isOrdersListResponse(data: unknown): data is OrdersListResponse {
  if (!data || typeof data !== 'object') return false;

  const response = data as Record<string, unknown>;
  return (
    Array.isArray(response.orders) &&
    response.orders.every(isOrderRecord) &&
    typeof response.hasMore === 'boolean' &&
    typeof response.totalCount === 'number'
  );
}

export function isReportWidgetApiWrapper(data: unknown): data is ReportWidgetApiWrapper {
  return data !== null && typeof data === 'object';
}

export function isStringArray(data: unknown): data is string[] {
  return Array.isArray(data) && data.every(item => typeof item === 'string');
}

export function isReportMetadata(data: unknown): data is ReportMetadata {
  if (!data || typeof data !== 'object') return false;

  const metadata = data as Record<string, unknown>;
  return (
    (metadata.totalCount === undefined || typeof metadata.totalCount === 'number') &&
    (metadata.queryTime === undefined || typeof metadata.queryTime === 'string') &&
    (metadata.optimized === undefined || typeof metadata.optimized === 'boolean')
  );
}

// DTO 轉換和處理函數
export class ReportOrderMapper {
  static extractReferencesFromWrapper(wrapper: unknown): string[] {
    if (!isReportWidgetApiWrapper(wrapper)) return [];

    if (isStringArray(wrapper.value)) {
      return wrapper.value;
    }

    return [];
  }

  static extractMetadataFromWrapper(wrapper: unknown): ReportMetadata {
    if (!isReportWidgetApiWrapper(wrapper)) return {};

    if (isReportMetadata(wrapper.metadata)) {
      return wrapper.metadata;
    }

    return {};
  }

  static extractErrorFromWrapper(wrapper: unknown): string | null {
    if (!isReportWidgetApiWrapper(wrapper)) return 'Invalid data format';

    if (wrapper.error && typeof wrapper.error === 'string') {
      return wrapper.error;
    }

    return null;
  }

  static createOrderFromRawData(data: unknown): OrderRecord | null {
    if (!data || typeof data !== 'object') return null;

    const rawOrder = data as Record<string, unknown>;

    return {
      uuid: String(rawOrder.uuid || ''),
      time: String(rawOrder.time || ''),
      remark: String(rawOrder.remark || ''),
      uploader_name: String(rawOrder.uploader_name || ''),
      doc_url: rawOrder.doc_url ? String(rawOrder.doc_url) : undefined,
      id: rawOrder.id ? String(rawOrder.id) : undefined,
      ...rawOrder,
    };
  }

  static validateOrdersListResponse(data: unknown): {
    response: OrdersListResponse | null;
    error: string | null;
  } {
    if (!data || typeof data !== 'object') {
      return {
        response: null,
        error: 'Invalid response format',
      };
    }

    const response = data as Record<string, unknown>;

    if (!Array.isArray(response.orders)) {
      return {
        response: null,
        error: 'Orders data is not an array',
      };
    }

    const orders = response.orders
      .map(this.createOrderFromRawData)
      .filter((order): order is OrderRecord => order !== null);

    return {
      response: {
        orders,
        hasMore: Boolean(response.hasMore),
        totalCount: Number(response.totalCount || 0),
      },
      error: null,
    };
  }

  static createPerformanceMetrics(
    startTime?: number,
    endTime?: number,
    source?: string
  ): PerformanceMetrics {
    const metrics: PerformanceMetrics = {
      source: source || 'REST API',
      optimized: true,
    };

    if (startTime !== undefined && endTime !== undefined) {
      metrics.fetchTime = Math.round(endTime - startTime);
      metrics.apiResponseTime = metrics.fetchTime;
    }

    return metrics;
  }

  static sanitizeReference(ref: unknown): string {
    if (typeof ref === 'string') return ref;
    if (typeof ref === 'number') return ref.toString();
    return String(ref || '');
  }

  static sortReferences(references: string[]): string[] {
    return [...references].sort((a, b) => {
      // Try to sort numerically if possible
      const numA = parseInt(a);
      const numB = parseInt(b);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numB - numA; // Descending order for numbers
      }
      return a.localeCompare(b);
    });
  }
}
