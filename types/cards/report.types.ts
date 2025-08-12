/**
 * Report Card Type Definitions
 * 為所有報告卡片組件提供統一的類型定義
 */

// 基礎報告數據類型
export interface BaseReportData {
  reportId?: string;
  generatedAt?: string;
  format?: 'pdf' | 'excel' | 'csv';
  [key: string]: unknown;
}

// GRN 報告數據類型
export interface GrnReportData extends BaseReportData {
  grnReference: string;
  supplier?: string;
  receivedDate?: string;
  materials: Array<{
    code: string;
    description: string;
    quantity: number;
    unit?: string;
    location?: string;
  }>;
  totalItems?: number;
  totalQuantity?: number;
  notes?: string;
}

// 交易報告數據類型
export interface TransactionReportData extends BaseReportData {
  dateRange: {
    from: string;
    to: string;
  };
  transactions: Array<{
    id: string;
    date: string;
    type: string;
    productCode: string;
    quantity: number;
    fromLocation?: string;
    toLocation?: string;
    user?: string;
  }>;
  summary?: {
    totalTransactions: number;
    totalQuantity: number;
    byType?: Record<string, number>;
  };
}

// ACO 訂單報告數據類型
export interface AcoOrderReportData extends BaseReportData {
  orderRef: string;
  orderDate?: string;
  customer?: string;
  items: Array<{
    productCode: string;
    description: string;
    orderedQty: number;
    pickedQty?: number;
    status?: string;
  }>;
  status?: string;
  completionRate?: number;
}

// 通用報告成功回調類型
export type ReportSuccessCallback<T extends BaseReportData = BaseReportData> = (data: T) => void;

// 報告錯誤類型
export type ReportError = Error | string;

// 報告生成參數
export interface ReportGenerationParams {
  reportType: string;
  filters?: Record<string, unknown>;
  format?: 'pdf' | 'excel' | 'csv';
  options?: {
    includeDetails?: boolean;
    groupBy?: string;
    sortBy?: string;
    [key: string]: unknown;
  };
}

// 帶選擇器的報告生成參數（用於需要選擇特定項目的報告）
export interface ReportGenerationParamsWithSelection extends ReportGenerationParams {
  selectedValue?: string;
  selectedValues?: string[];
  dateFrom?: string;
  dateTo?: string;
}

// 報告導出結果
export interface ReportExportResult {
  success: boolean;
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  error?: string;
}

// 類型守衛
export function isGrnReportData(data: unknown): data is GrnReportData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'grnReference' in data &&
    'materials' in data &&
    Array.isArray((data as GrnReportData).materials)
  );
}

export function isTransactionReportData(data: unknown): data is TransactionReportData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'dateRange' in data &&
    'transactions' in data &&
    Array.isArray((data as TransactionReportData).transactions)
  );
}

export function isAcoOrderReportData(data: unknown): data is AcoOrderReportData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'orderRef' in data &&
    'items' in data &&
    Array.isArray((data as AcoOrderReportData).items)
  );
}