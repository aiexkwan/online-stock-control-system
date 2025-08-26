/**
 * Unified Printing Service Types
 * Consolidates all printing-related types
 */

export enum PrintType {
  QC_LABEL = 'qc-label',
  GRN_LABEL = 'grn-label',
  TRANSACTION_REPORT = 'transaction-report',
  INVENTORY_REPORT = 'inventory-report',
  ACO_ORDER_REPORT = 'aco-order-report',
  GRN_REPORT = 'grn-report',
  CUSTOM_DOCUMENT = 'custom-document',
}

export enum PrintPriority {
  HIGH = 'high',
  NORMAL = 'normal',
  LOW = 'low',
}

export enum PaperSize {
  A4 = 'A4',
  A5 = 'A5',
  LETTER = 'Letter',
  LEGAL = 'Legal',
  CUSTOM = 'Custom',
}

// 定義打印數據的具體類型 (策略 2: DTO/自定義 type interface)
export type PrintData = {
  // QC Label 數據
  itemCode?: string;
  quantity?: number;
  supplier?: string;
  palletNumber?: string;
  productCode?: string;
  palletNum?: string;
  plt_num?: string; // Added for print-template-service compatibility
  product_code?: string; // Added for print-template-service compatibility
  product_qty?: number; // Added for print-template-service compatibility
  generate_time?: string; // Added for print-template-service compatibility
  palletNumbers?: string[]; // 批量列印支援
  series?: string | string[]; // 支援單個或多個系列
  operator?: string;
  merged?: boolean; // 合併 PDF 標記
  // GRN Label 數據
  grnNumber?: string;
  grn_ref?: string | number; // For template service compatibility
  receivedDate?: string;
  material_code?: string;
  gross_weight?: number;
  net_weight?: number;
  package?: string;
  package_count?: number;
  pallet?: string;
  pallet_count?: number;
  sup_code?: string;
  creat_time?: string;
  // Report 數據
  reportData?: Array<Record<string, string | number | boolean | null>>;
  filters?: Record<string, string | number | boolean>;
  dateRange?: { from: string; to: string };
  // 通用數據
  title?: string;
  description?: string;
  customFields?: Record<string, string | number | boolean>;
  // PDF Blob 支援 (QC Label 生成使用)
  pdfBlob?: Blob;
};

export interface PrintRequest {
  type: PrintType;
  data?: PrintData;
  pdfBlobs?: Blob[];
  options: PrintOptions;
  metadata?: PrintMetadata;
}

export interface PrintOptions {
  copies: number;
  paperSize: PaperSize;
  orientation: 'portrait' | 'landscape';
  margins?: Margins;
  printerPreference?: string;
  priority?: PrintPriority;
  duplex?: boolean;
  color?: boolean;
}

export interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface PrintMetadata {
  userId: string;
  department?: string;
  costCenter?: string;
  tags?: string[];
  reference?: string;
  source?: string;
  timestamp?: string;
  labelCount?: number;
  // PDF upload options
  uploadEnabled?: boolean;
  palletNumbers?: string[];
  updatePdfUrls?: boolean;
}

export interface PrintResult {
  success: boolean;
  jobId: string;
  printedAt?: string;
  pdfUrl?: string;
  error?: string;
  message?: string;
  // PDF upload results
  uploadedUrls?: string[];
  uploadErrors?: string[];
}

export interface PrintStatistics {
  totalJobs: number;
  successRate: number;
  averageTime: number;
  byType: Record<PrintType, number>;
  byUser: Record<string, number>;
  errorRate: number;
}

// Template schema 類型定義
export type TemplateSchema = {
  fields: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'array';
    required?: boolean;
    validation?: {
      min?: number;
      max?: number;
      pattern?: string;
    };
  }>;
  layout?: {
    orientation: 'portrait' | 'landscape';
    paperSize: PaperSize;
    sections: Array<{
      name: string;
      fields: string[];
    }>;
  };
};

export interface TemplateConfig {
  id: string;
  name: string;
  type: PrintType;
  version: string;
  template: string;
  schema?: TemplateSchema;
  preview?: string;
}

export interface PrintQueueItem {
  id: string;
  request: PrintRequest;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: PrintPriority;
  attempts: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface BatchPrintRequest {
  requests: PrintRequest[];
  options?: BatchPrintOptions;
}

export interface BatchPrintOptions {
  parallel?: boolean;
  stopOnError?: boolean;
  groupByType?: boolean;
}

export interface PrintJobStatus {
  jobId: string;
  status: 'queued' | 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  message?: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  groupByType?: boolean;
}

export interface BatchPrintResult {
  totalJobs: number;
  successful: number;
  failed: number;
  results: PrintResult[];
  duration: number;
}
