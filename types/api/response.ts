/**
 * API 響應類型定義 - 統一管理
 * 包含從 lib/types/api-response-types.ts 遷移的類型
 */

export interface BaseResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
  timestamp: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    stack?: string;
  };
  timestamp: string;
}

export interface ValidationErrorResponse extends ErrorResponse {
  error: {
    code: 'VALIDATION_ERROR';
    message: string;
    details: Record<string, unknown> & {
      fields: {
        field: string;
        messages: string[];
      }[];
    };
    stack?: string;
  };
}

export interface PaginatedApiResponse<T> extends BaseResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// 具體 API 響應類型
export interface ProductResponse {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  weight?: number;
  price?: number;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISCONTINUED = 'discontinued',
}

export interface OrderResponse {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  status: OrderStatus;
  items: OrderItemResponse[];
  totalAmount: number;
  deliveryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export interface OrderItemResponse {
  id: string;
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface StockResponse {
  productCode: string;
  productName: string;
  location: string;
  availableQuantity: number;
  reservedQuantity: number;
  totalQuantity: number;
  lastUpdated: string;
}

export interface ReportResponse {
  id: string;
  type: string;
  status: ReportStatus;
  progress?: number;
  downloadUrl?: string;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

export enum ReportStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface PrintResponse {
  jobId: string;
  status: PrintStatus;
  message?: string;
  printedAt?: string;
}

export enum PrintStatus {
  QUEUED = 'queued',
  PRINTING = 'printing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  version: string;
  uptime: number;
  services: ServiceHealth[];
  timestamp: string;
}

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'unhealthy';
  responseTime?: number;
  error?: string;
}

// === 從 lib/types/api-response-types.ts 遷移的類型 ===

// ACO Order Update Response
export interface AcoOrderUpdateResponse {
  success: boolean;
  message?: string;
  error?: string;
  details?: {
    updated_orders?: number;
    failed_updates?: Array<{
      order_number: string;
      reason: string;
    }>;
    order_ref?: number;
    product_code?: string;
    order_completed?: boolean;
  };
}

// Generic RPC Response
export interface RpcResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Monitoring Response
export interface MonitoringResponse {
  success: boolean;
  data?: {
    typescript_errors?: number;
    eslint_warnings?: number;
    health_score?: number;
    last_check?: string;
  };
  error?: string;
}

// === 從 app/types/warehouse-work-level.ts 遷移的類型 ===

export interface WarehouseWorkLevelParams {
  startDate?: Date | string;
  endDate?: Date | string;
  department?: string;
}

export interface DailyWorkStat {
  date: string;
  total_moves: number;
  operator_count: number;
  operators: string[];
}

export interface PeakDay {
  date: string;
  moves: number;
}

export interface QueryParams {
  start_date: string;
  end_date: string;
  department: string;
}

export interface Metadata {
  executed_at: string;
  version: string;
}

export interface WarehouseWorkLevelResponse {
  daily_stats: DailyWorkStat[];
  total_moves: number;
  unique_operators: number;
  avg_moves_per_day: number;
  peak_day: PeakDay | null;
  calculation_time: string;
  query_params: QueryParams;
  metadata: Metadata;
}

export interface WarehouseWorkLevelError {
  error: true;
  message: string;
  detail: string;
  hint: string;
  query_params: QueryParams;
}

export type WarehouseWorkLevelResult = WarehouseWorkLevelResponse | WarehouseWorkLevelError;

// Type guard to check if result is an error
export function isWarehouseWorkLevelError(
  result: WarehouseWorkLevelResult
): result is WarehouseWorkLevelError {
  return 'error' in result && result.error === true;
}

// Helper functions for date formatting
export function formatDateForRPC(date: Date | string): string {
  if (typeof date === 'string') {
    return date;
  }
  return date.toISOString();
}

export function getDefaultDateRange(): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  return { startDate, endDate };
}
