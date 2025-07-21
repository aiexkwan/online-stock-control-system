/**
 * API 請求類型定義
 */

export interface BaseRequest {
  headers?: Record<string, string>;
  timeout?: number;
}

export interface ApiRequestConfig extends BaseRequest {
  method: HttpMethod;
  url: string;
  params?: Record<string, unknown>;
  data?: unknown;
  responseType?: ResponseType;
}

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

export enum ResponseType {
  JSON = 'json',
  BLOB = 'blob',
  TEXT = 'text',
  STREAM = 'stream',
}

// 具體 API 請求類型
export interface ProductSearchRequest {
  query?: string;
  category?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface OrderCreateRequest {
  customerId: string;
  items: OrderItem[];
  deliveryDate?: string;
  notes?: string;
}

export interface OrderItem {
  productCode: string;
  quantity: number;
  unitPrice?: number;
}

export interface StockUpdateRequest {
  productCode: string;
  location: string;
  quantity: number;
  operation: 'add' | 'subtract' | 'set';
  reason?: string;
}

export interface ReportGenerateRequest {
  type: ReportType;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  filters?: Record<string, unknown>;
  format: ExportFormat;
}

export enum ReportType {
  ACO_ORDER = 'aco_order',
  GRN = 'grn',
  TRANSACTION = 'transaction',
  STOCK_TAKE = 'stock_take',
  VOID_PALLET = 'void_pallet',
}

export enum ExportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
}

export interface PrintRequest {
  type: PrintType;
  data: unknown;
  options?: PrintOptions;
}

export enum PrintType {
  LABEL = 'label',
  REPORT = 'report',
  BARCODE = 'barcode',
}

export interface PrintOptions {
  copies?: number;
  paperSize?: string;
  orientation?: 'portrait' | 'landscape';
  quality?: 'draft' | 'normal' | 'high';
}
