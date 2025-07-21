/**
 * Print Label API
 * Demonstrates mixed real-time and batch operations
 */

import { DataAccessLayer } from '../core/DataAccessStrategy';
import { DatabaseRecord } from '@/types/database/tables';
import { createClient } from '@/app/utils/supabase/client';
// Note: The following imports are commented out as the functions may have been moved
// import { qcLabelGeneration, grnLabelGeneration } from '@/app/actions/qcActions';
// import { printGrnLabel } from '@/app/actions/grnActions';

// Type definitions
export interface PrintJobParams {
  type: 'qc' | 'grn';
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

export interface PrintJobResult {
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

export class PrintLabelAPI extends DataAccessLayer<PrintJobParams, PrintJobResult> {
  constructor() {
    super('print-labels');
  }

  /**
   * Server-side implementation for print job history and analytics
   */
  async serverFetch(params: PrintJobParams): Promise<PrintJobResult> {
    const supabase = await createClient();

    // Get print job history
    // Note: print_jobs table may not exist in current schema, using placeholder
    let query = supabase
      .from('record_history')
      .select('*')
      .order('created_at', { ascending: false });

    if (params.type) {
      query = query.eq('label_type', params.type);
    }
    if (params.productCode) {
      query = query.eq('product_code', params.productCode);
    }

    const { data, error } = await query.limit(100);

    if (error) throw error;

    // Transform data
    const jobs: PrintJob[] = (data || []).map((row: Record<string, unknown>) => ({
      id: typeof row.id === 'string' ? row.id : String(row.id || Math.random()),
      type:
        typeof row.action === 'string' && ['qc', 'grn'].includes(row.action)
          ? (row.action as 'qc' | 'grn')
          : 'qc',
      productCode: typeof row.product_code === 'string' ? row.product_code : '',
      palletNum: typeof row.plt_num === 'string' ? row.plt_num : '',
      status:
        typeof row.status === 'string' &&
        ['pending', 'printing', 'completed', 'failed'].includes(row.status)
          ? (row.status as 'pending' | 'printing' | 'completed' | 'failed')
          : 'completed',
      createdAt: typeof row.created_at === 'string' ? row.created_at : new Date().toISOString(),
      completedAt: typeof row.timestamp === 'string' ? row.timestamp : undefined,
      errorMessage: typeof row.description === 'string' ? row.description : undefined,
      retryCount: 0,
    }));

    // Calculate summary
    const summary = {
      total: jobs.length,
      pending: jobs.filter(j => j.status === 'pending').length,
      printing: jobs.filter(j => j.status === 'printing').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
      successRate:
        jobs.length > 0
          ? (jobs.filter(j => j.status === 'completed').length / jobs.length) * 100
          : 0,
    };

    return { jobs, summary };
  }

  /**
   * Client-side implementation for real-time job monitoring
   */
  async clientFetch(params: PrintJobParams): Promise<PrintJobResult> {
    const response = await fetch(
      `/api/print/jobs?${new URLSearchParams(params as unknown as Record<string, string>)}`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch print jobs');
    }
    return response.json();
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
  private static convertToQCData(data: DatabaseRecord[]): {
    productCode: string;
    palletNum: string;
    quantity: number;
    operatorId: string;
  } {
    // Strategy 4: unknown + type narrowing - 安全提取第一條記錄的數據
    const firstRecord = data[0] || ({} as any);
    return {
      productCode: typeof firstRecord.product_code === 'string' ? firstRecord.product_code : '',
      palletNum: typeof firstRecord.plt_num === 'string' ? firstRecord.plt_num : '',
      quantity: typeof firstRecord.product_qty === 'number' ? firstRecord.product_qty : 0,
      operatorId: typeof firstRecord.user_id === 'string' ? firstRecord.user_id : 'system',
    };
  }

  /**
   * Convert DatabaseRecord[] to GRN label format
   */
  private static convertToGRNData(data: DatabaseRecord[]): {
    supplierName: string;
    materialCode: string;
    quantity: number;
    operatorId: string;
  } {
    // Strategy 4: unknown + type narrowing - 安全提取第一條記錄的數據
    const firstRecord = data[0] || ({} as any);
    return {
      supplierName: typeof firstRecord.supplier_name === 'string' ? firstRecord.supplier_name : '',
      materialCode: typeof firstRecord.material_code === 'string' ? firstRecord.material_code : '',
      quantity: typeof firstRecord.quantity === 'number' ? firstRecord.quantity : 0,
      operatorId: typeof firstRecord.user_id === 'string' ? firstRecord.user_id : 'system',
    };
  }

  /**
   * Generate QC Label
   */
  static async generateQCLabel(data: {
    productCode: string;
    palletNum: string;
    quantity: number;
    operatorId: string;
  }) {
    // TODO: Import and use qcLabelGeneration from the correct module
    throw new Error('qcLabelGeneration not implemented - import from correct module');
    /* Original implementation:
    return qcLabelGeneration({
      product_code: data.productCode,
      plt_num: data.palletNum,
      product_qty: data.quantity.toString(),
      id: data.operatorId,
    });
    */
  }

  /**
   * Generate GRN Label
   */
  static async generateGRNLabel(data: {
    supplierName: string;
    materialCode: string;
    quantity: number;
    operatorId: string;
  }) {
    // TODO: Import and use printGrnLabel from the correct module
    throw new Error('printGrnLabel not implemented - import from correct module');
    /* Original implementation:
    return printGrnLabel({
      supplier_name: data.supplierName,
      material_code: data.materialCode,
      quantity: data.quantity.toString(),
      operator_id: data.operatorId,
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
  ) {
    // Process labels in parallel with concurrency limit
    const BATCH_SIZE = 5;
    const results = [];

    for (let i = 0; i < labels.length; i += BATCH_SIZE) {
      const batch = labels.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.allSettled(
        batch.map(label => {
          // Strategy 4: unknown + type narrowing - 安全轉換 DatabaseRecord[] 到期望格式
          if (label.type === 'qc') {
            const qcData = this.convertToQCData(label.data);
            return this.generateQCLabel(qcData);
          } else {
            const grnData = this.convertToGRNData(label.data);
            return this.generateGRNLabel(grnData);
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
  static async cancelJob(jobId: string) {
    const response = await fetch(`/api/print/jobs/${jobId}/cancel`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to cancel print job');
    }

    return response.json();
  }

  /**
   * Retry failed job
   */
  static async retryJob(jobId: string) {
    const response = await fetch(`/api/print/jobs/${jobId}/retry`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to retry print job');
    }

    return response.json();
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
