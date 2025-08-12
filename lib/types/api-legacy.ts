/**
 * Legacy API Types
 * 暫時保留的舊類型，將來需要進一步重構
 */

export interface ProductResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface OrderResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface StockResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface ReportResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}