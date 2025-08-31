/**
 * Print Label API
 * Demonstrates mixed real-time and batch operations
 */

import { DatabaseRecord } from '@/types/database/tables';
import { createClient } from '@/app/utils/supabase/client';
import { DataAccessLayer } from '../core/DataAccessStrategy';

// Type definitions - extends DataAccessParams for compatibility
export interface PrintJobParams extends Record<string, unknown> {
  type?: 'qc' | 'grn';
  productCode?: string;
  batchMode?: boolean;
  quantity?: number;
  includeHistory?: boolean;
}

export interface PrintJob {
  id: string;
  type: 'qc' | 'grn';
  productCode: string;
  palletNum: string;
  status: 'pending' | 'printing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
  retryCount: number;
}

export interface PrintJobResult extends Record<string, unknown> {
  jobs: PrintJob[];
  summary: {
    total: number;
    pending: number;
    printing: number;
    completed: number;
    failed: number;
    successRate: number;
  };
}

// Safe Supabase query result type
interface SupabaseQueryResult {
  id?: string | number;
  action?: string;
  product_code?: string;
  plt_num?: string;
  status?: string;
  created_at?: string;
  timestamp?: string;
  description?: string;
  [key: string]: unknown;
}

// Print operation types
export interface QCLabelData {
  productCode: string;
  palletNum: string;
  quantity: number;
  operatorId: string;
}

export interface GRNLabelData {
  supplierName: string;
  materialCode: string;
  quantity: number;
  operatorId: string;
}

export interface BatchPrintResult {
  success: boolean;
  total: number;
  successful: number;
  failed: number;
  results: Array<PromiseSettledResult<unknown>>;
}

export class PrintLabelAPI extends DataAccessLayer<PrintJobParams, PrintJobResult> {
  constructor() {
    super('print-labels');
  }

  /**
   * Server-side implementation for print job history and analytics
   */
  async serverFetch(params: PrintJobParams): Promise<PrintJobResult> {
    const supabase = await createClient();

    try {
      // Use type assertion to avoid deep instantiation issues
      const baseQuery = supabase
        .from('record_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      // Apply filters using type assertion
      let queryPromise;

      if (params.type && params.productCode) {
        queryPromise = (baseQuery as any)
          .eq('label_type', params.type)
          .eq('product_code', params.productCode);
      } else if (params.type) {
        queryPromise = (baseQuery as any).eq('label_type', params.type);
      } else if (params.productCode) {
        queryPromise = (baseQuery as any).eq('product_code', params.productCode);
      } else {
        queryPromise = baseQuery;
      }

      const { data, error } = await queryPromise;

      if (error) throw error;

      // Transform data with proper type safety
      const jobs: PrintJob[] = this.transformQueryResults(data || []);

      // Calculate summary
      const summary = this.calculateJobsSummary(jobs);

      return { jobs, summary };
    } catch (error) {
      // Fallback to empty result on error
      console.warn('PrintLabelAPI serverFetch error:', error);
      return {
        jobs: [],
        summary: {
          total: 0,
          pending: 0,
          printing: 0,
          completed: 0,
          failed: 0,
          successRate: 0,
        },
      };
    }
  }

  /**
   * Transform query results to PrintJob array
   */
  private transformQueryResults(data: SupabaseQueryResult[]): PrintJob[] {
    return data.map(row => ({
      id: this.safeGetString(row.id, String(Math.random())),
      type: this.safeGetJobType(row.action),
      productCode: this.safeGetString(row.product_code, ''),
      palletNum: this.safeGetString(row.plt_num, ''),
      status: this.safeGetJobStatus(row.status),
      createdAt: this.safeGetString(row.created_at, new Date().toISOString()),
      completedAt: this.safeGetString(row.timestamp),
      errorMessage: this.safeGetString(row.description),
      retryCount: 0,
    }));
  }

  /**
   * Calculate jobs summary statistics
   */
  private calculateJobsSummary(jobs: PrintJob[]) {
    const total = jobs.length;
    const pending = jobs.filter(j => j.status === 'pending').length;
    const printing = jobs.filter(j => j.status === 'printing').length;
    const completed = jobs.filter(j => j.status === 'completed').length;
    const failed = jobs.filter(j => j.status === 'failed').length;

    return {
      total,
      pending,
      printing,
      completed,
      failed,
      successRate: total > 0 ? (completed / total) * 100 : 0,
    };
  }

  /**
   * Safe string extraction helper
   */
  private safeGetString(value: unknown, defaultValue = ''): string {
    if (typeof value === 'string') return value;
    if (value !== undefined && value !== null) return String(value);
    return defaultValue;
  }

  /**
   * Safe job type extraction
   */
  private safeGetJobType(value: unknown): 'qc' | 'grn' {
    if (typeof value === 'string' && ['qc', 'grn'].includes(value)) {
      return value as 'qc' | 'grn';
    }
    return 'qc';
  }

  /**
   * Safe job status extraction
   */
  private safeGetJobStatus(value: unknown): 'pending' | 'printing' | 'completed' | 'failed' {
    if (
      typeof value === 'string' &&
      ['pending', 'printing', 'completed', 'failed'].includes(value)
    ) {
      return value as 'pending' | 'printing' | 'completed' | 'failed';
    }
    return 'completed';
  }

  /**
   * Client-side implementation for real-time job monitoring
   */
  async clientFetch(params: PrintJobParams): Promise<PrintJobResult> {
    // Safe URL parameter construction
    const searchParams = new URLSearchParams();

    if (params.type) searchParams.append('type', params.type);
    if (params.productCode) searchParams.append('productCode', params.productCode);
    if (params.batchMode !== undefined) searchParams.append('batchMode', String(params.batchMode));
    if (params.quantity !== undefined) searchParams.append('quantity', String(params.quantity));
    if (params.includeHistory !== undefined)
      searchParams.append('includeHistory', String(params.includeHistory));

    const url = `/api/print/jobs${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch print jobs: ${response.status} ${response.statusText}`);
    }
    return response.json() as Promise<PrintJobResult>;
  }

  /**
   * Print operations are always real-time
   */
  protected isRealTimeRequired(): boolean {
    return true;
  }
}

/**
 * Print Operations
 * Write operations that must use Server Actions
 */
export class PrintOperationsAPI {
  /**
   * Convert DatabaseRecord[] to QC label format
   */
  private static convertToQCData(data: DatabaseRecord[]): QCLabelData {
    const firstRecord = data[0] || {};
    return {
      productCode: this.safeGetValue(firstRecord.product_code, 'string', ''),
      palletNum: this.safeGetValue(firstRecord.plt_num, 'string', ''),
      quantity: this.safeGetValue(firstRecord.product_qty, 'number', 0),
      operatorId: this.safeGetValue(firstRecord.user_id, 'string', 'system'),
    };
  }

  /**
   * Convert DatabaseRecord[] to GRN label format
   */
  private static convertToGRNData(data: DatabaseRecord[]): GRNLabelData {
    const firstRecord = data[0] || {};
    return {
      supplierName: this.safeGetValue(firstRecord.supplier_name, 'string', ''),
      materialCode: this.safeGetValue(firstRecord.material_code, 'string', ''),
      quantity: this.safeGetValue(firstRecord.quantity, 'number', 0),
      operatorId: this.safeGetValue(firstRecord.user_id, 'string', 'system'),
    };
  }

  /**
   * Safe value extraction with type checking
   */
  private static safeGetValue<T>(
    value: unknown,
    expectedType: 'string' | 'number' | 'boolean',
    defaultValue: T
  ): T {
    if (expectedType === 'string' && typeof value === 'string') {
      return value as T;
    }
    if (expectedType === 'number' && typeof value === 'number') {
      return value as T;
    }
    if (expectedType === 'boolean' && typeof value === 'boolean') {
      return value as T;
    }
    // Handle string to number conversion
    if (expectedType === 'number' && typeof value === 'string') {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        return parsed as T;
      }
    }
    return defaultValue;
  }

  /**
   * Generate QC Label
   */
  static async generateQCLabel(_data: QCLabelData): Promise<{ success: boolean; message: string }> {
    // TODO: Import and use qcLabelGeneration from the correct module
    throw new Error('qcLabelGeneration not implemented - import from correct module');
    /* Original implementation:
    return qcLabelGeneration({
      product_code: data.productCode,
      plt_num: data.palletNum,
      product_qty: data.quantity.toString(),
      id: data.operatorId 
    });
    */
  }

  /**
   * Generate GRN Label
   */
  static async generateGRNLabel(
    _data: GRNLabelData
  ): Promise<{ success: boolean; message: string }> {
    // TODO: Import and use printGrnLabel from the correct module
    throw new Error('printGrnLabel not implemented - import from correct module');
    /* Original implementation:
    return printGrnLabel({
      supplier_name: data.supplierName,
      material_code: data.materialCode,
      quantity: data.quantity.toString(),
      operator_id: data.operatorId 
    });
    */
  }

  /**
   * Batch print multiple labels
   */
  static async batchPrint(
    labels: Array<{
      type: 'qc' | 'grn';
      data: DatabaseRecord[];
    }>
  ): Promise<BatchPrintResult> {
    // Process labels in parallel with concurrency limit
    const BATCH_SIZE = 5;
    const results: Array<PromiseSettledResult<{ success: boolean; message: string }>> = [];

    for (let i = 0; i < labels.length; i += BATCH_SIZE) {
      const batch = labels.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.allSettled(
        batch.map(async label => {
          try {
            if (label.type === 'qc') {
              const qcData = this.convertToQCData(label.data);
              return await this.generateQCLabel(qcData);
            } else {
              const grnData = this.convertToGRNData(label.data);
              return await this.generateGRNLabel(grnData);
            }
          } catch (error) {
            return {
              success: false,
              message: error instanceof Error ? error.message : 'Unknown print error',
            };
          }
        })
      );
      results.push(...batchResults);
    }

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return {
      success: true,
      total: labels.length,
      successful,
      failed,
      results,
    };
  }

  /**
   * Cancel print job
   */
  static async cancelJob(jobId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`/api/print/jobs/${jobId}/cancel`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Failed to cancel print job: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<{ success: boolean; message: string }>;
  }

  /**
   * Retry failed job
   */
  static async retryJob(jobId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`/api/print/jobs/${jobId}/retry`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Failed to retry print job: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<{ success: boolean; message: string }>;
  }
}

// Factory function
export function createPrintLabelAPI(): PrintLabelAPI {
  return new PrintLabelAPI();
}

// Note: React hooks should be defined in separate files or in React components
// The usePrintJobs hook has been removed from this API file.
// To use real-time print job monitoring in React components:
// 1. Import createPrintLabelAPI and use it directly
// 2. Create a custom hook in your component file
// 3. Use WebSocket connections for real-time updates as needed
