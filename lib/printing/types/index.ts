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

export interface PrintRequest {
  type: PrintType;
  data: Record<string, any>;
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
}

export interface PrintResult {
  success: boolean;
  jobId: string;
  printedAt?: string;
  pdfUrl?: string;
  error?: string;
  message?: string;
}

export interface PrintHistory {
  id: string;
  jobId: string;
  type: PrintType;
  data: Record<string, any>;
  options: PrintOptions;
  metadata?: PrintMetadata;
  result: PrintResult;
  createdAt: string;
}

export interface PrintStatistics {
  totalJobs: number;
  successRate: number;
  averageTime: number;
  byType: Record<PrintType, number>;
  byUser: Record<string, number>;
  errorRate: number;
}

export interface TemplateConfig {
  id: string;
  name: string;
  type: PrintType;
  version: string;
  template: string;
  schema?: Record<string, any>;
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

export interface BatchPrintResult {
  totalJobs: number;
  successful: number;
  failed: number;
  results: PrintResult[];
  duration: number;
}
