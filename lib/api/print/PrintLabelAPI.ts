/**
 * Print Label API
 * Demonstrates mixed real-time and batch operations
 */

import { DataAccessLayer } from '../core/DataAccessStrategy';
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
    let query = supabase.from('print_jobs').select('*').order('created_at', { ascending: false });

    if (params.type) {
      query = query.eq('label_type', params.type);
    }
    if (params.productCode) {
      query = query.eq('product_code', params.productCode);
    }

    const { data, error } = await query.limit(100);

    if (error) throw error;

    // Transform data
    const jobs: PrintJob[] = (data || []).map(row => ({
      id: row.id,
      type: row.label_type,
      productCode: row.product_code,
      palletNum: row.pallet_num,
      status: row.status,
      createdAt: row.created_at,
      completedAt: row.completed_at,
      errorMessage: row.error_message,
      retryCount: row.retry_count || 0,
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
    const response = await fetch(`/api/print/jobs?${new URLSearchParams(params as any)}`);
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
      data: any;
    }>
  ) {
    // Process labels in parallel with concurrency limit
    const BATCH_SIZE = 5;
    const results = [];

    for (let i = 0; i < labels.length; i += BATCH_SIZE) {
      const batch = labels.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.allSettled(
        batch.map(label =>
          label.type === 'qc' ? this.generateQCLabel(label.data) : this.generateGRNLabel(label.data)
        )
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
