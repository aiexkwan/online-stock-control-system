/**
 * Strategy 2: DTO/自定義 type interface - GRN Report Widget 類型定義
 * 為 GRN Report Widget 相關組件提供類型安全
 */

import { DatabaseRecord } from '@/types/database/tables';

// GRN Report Widget API 響應類型
export interface GrnReportData {
  material_description?: string;
  supplier_name?: string;
  report_date?: string;
  records?: DatabaseRecord[];
  error?: string;
  [key: string]: unknown;
}

// 用於處理 API 響應中不確定數據的類型
export interface GrnApiResponse {
  value?: unknown;
  error?: string;
  [key: string]: unknown;
}

// Widget 數據響應格式
export interface GrnWidgetData {
  data: GrnApiResponse;
  metadata?: {
    timestamp?: string;
    source?: string;
  };
}

// GRN Reference API 響應
export interface GrnReferencesResponse {
  references: string[];
}

// Material Codes API 響應
export interface GrnMaterialCodesResponse {
  materialCodes: string[];
}

// 類型保護函數
export function isGrnApiResponse(data: unknown): data is GrnApiResponse {
  return data !== null && typeof data === 'object';
}

export function isStringArray(data: unknown): data is string[] {
  return Array.isArray(data) && data.every(item => typeof item === 'string');
}

export function isGrnReportData(data: unknown): data is GrnReportData {
  if (!data || typeof data !== 'object') return false;

  const d = data as Record<string, unknown>;
  return (
    (d.material_description === undefined || typeof d.material_description === 'string') &&
    (d.supplier_name === undefined || typeof d.supplier_name === 'string') &&
    (d.report_date === undefined || typeof d.report_date === 'string') &&
    (d.records === undefined || Array.isArray(d.records)) &&
    (d.error === undefined || typeof d.error === 'string')
  );
}

// DTO 轉換和驗證函數
export class GrnDataMapper {
  static extractStringArrayFromApiResponse(response: unknown): string[] {
    if (!isGrnApiResponse(response)) return [];

    if (isStringArray(response.value)) {
      return response.value;
    }

    return [];
  }

  static extractGrnDataFromApiResponse(response: unknown): GrnReportData | null {
    if (!isGrnApiResponse(response)) return null;

    if (isGrnReportData(response.value)) {
      return response.value;
    }

    return null;
  }

  static validateErrorResponse(response: unknown): string | null {
    if (!isGrnApiResponse(response)) return 'Invalid response format';

    if (response.error && typeof response.error === 'string') {
      return response.error;
    }

    return null;
  }
}

// Report 生成相關類型
export interface GrnReportExportData extends GrnReportData {
  uploader_email: string;
  uploader_name: string;
}

// Print service 相關類型
export interface PrintReportOptions {
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  format?: 'A4' | 'Letter';
}

// 錯誤類型定義
export interface GrnError {
  message: string;
  code?: string;
  context?: 'fetch' | 'print' | 'export' | 'api';
}

// 類型安全的錯誤處理
export function createGrnError(message: string, context?: GrnError['context']): GrnError {
  return {
    message,
    context,
  };
}

export function isGrnError(error: unknown): error is GrnError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as GrnError).message === 'string'
  );
}
