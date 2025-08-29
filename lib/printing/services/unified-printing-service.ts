/**
 * Unified Printing Service
 * Central service for all printing operations
 */

// PrintHistoryService removed - redundant with existing record_history
import { EventEmitter } from 'events';
import { getHardwareAbstractionLayer } from '@/lib/hardware/hardware-abstraction-layer';
import type { PrintJob } from '@/lib/hardware/types';
import type { DatabaseRecord } from '@/types/database/tables';
import { uploadPdfToStorage, updatePalletPdfUrl } from '@/app/actions/grnActions';
import {
  uploadPdfToStorage as uploadPdfToStorageQc,
  updatePalletPdfUrl as updatePalletPdfUrlQc,
} from '@/app/actions/qcActions';
import {
  PrintRequest,
  PrintResult,
  PrintType,
  BatchPrintRequest,
  BatchPrintResult,
  PrintPriority,
  PrintData,
} from '../types';
import { PrintTemplateService } from './print-template-service';

export interface UnifiedPrintingServiceConfig {
  templateService?: PrintTemplateService;
}

/**
 * Unified Printing Service
 * A thin facade over the hardware abstraction layer that adds business logic
 * without duplicating low-level functionality
 */
export class UnifiedPrintingService extends EventEmitter {
  private hal = getHardwareAbstractionLayer();
  private templateService: PrintTemplateService;
  private initialized = false;

  constructor(config?: UnifiedPrintingServiceConfig) {
    super();

    // Only create services that don't exist in HAL
    this.templateService = config?.templateService || new PrintTemplateService();
  }

  /**
   * Initialize the printing service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('[UnifiedPrintingService] Initializing...');

      // Initialize hardware abstraction layer
      await this.hal.initialize();

      // Set up event listeners to forward HAL events
      this.setupEventListeners();

      this.initialized = true;
      console.log('[UnifiedPrintingService] Initialized successfully');
    } catch (error) {
      console.error('[UnifiedPrintingService] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.initialized && this.hal.isInitialized;
  }

  /**
   * Main print method - handles all print requests
   */
  async print(request: PrintRequest): Promise<PrintResult> {
    this.ensureInitialized();

    try {
      // 1. Validate print permission
      await this.validatePermission(request);

      // 2. Handle PDF upload if enabled
      let uploadedUrls: string[] = [];
      let uploadErrors: string[] = [];

      if (request.pdfBlobs && request.metadata?.uploadEnabled && request.metadata?.palletNumbers) {
        console.log('[UnifiedPrintingService] Processing PDF uploads...');
        const uploadResults = await this.uploadPdfsToStorage(
          request.pdfBlobs,
          request.metadata.palletNumbers,
          request.type
        );
        uploadedUrls = uploadResults.uploadedUrls;
        uploadErrors = uploadResults.uploadErrors;
      }

      // 3. Prepare print data
      let printData:
        | { pdfBlob: Blob }
        | { formattedData: unknown; template: string; metadata: Record<string, string | number> }
        | PrintData
        | null = null;
      if (request.pdfBlobs && request.pdfBlobs.length > 0) {
        // Handle PDF blobs - merge if multiple
        printData = await this.preparePdfPrintData(request.pdfBlobs);
      } else if (
        request.data &&
        typeof request.data === 'object' &&
        'pdfBlob' in request.data &&
        request.data.pdfBlob instanceof Blob
      ) {
        // Direct PDF printing - skip template processing
        console.log('[UnifiedPrintingService] PDF blob detected, skipping template processing');
        printData = { pdfBlob: request.data.pdfBlob };
      } else {
        // Apply template processing for other types
        printData = await this.preparePrintData(request);
      }

      // 3. Select printer if preference provided
      if (request.options.printerPreference) {
        await this.hal.printer.selectPrinter(request.options.printerPreference);
      }

      // 4. Convert to HAL print job format
      // Map our print types to HAL supported types
      let halPrintType: string = request.type;
      if (
        request.type === PrintType.GRN_REPORT ||
        request.type === PrintType.TRANSACTION_REPORT ||
        request.type === PrintType.INVENTORY_REPORT ||
        request.type === PrintType.ACO_ORDER_REPORT
      ) {
        halPrintType = 'report'; // HAL only supports generic 'report' type
      }

      const printJob: PrintJob = {
        type: halPrintType as 'qc-label' | 'grn-label' | 'report',
        data: printData,
        copies: request.options.copies,
        priority: (request.options.priority as 'high' | 'normal' | 'low') || 'normal',
        metadata: request.metadata
          ? ({
              ...request.metadata,
              operatorClockNum: request.metadata.userId,
              timestamp: request.metadata.timestamp,
              source: request.metadata.source,
            } as { [key: string]: unknown })
          : undefined,
      };

      // 5. Use HAL to print (it handles queuing internally)
      const result = await this.hal.print(printJob);

      // 6. History recording removed - using existing record_history mechanism

      // 7. Add upload results to response
      const enhancedResult: PrintResult = {
        ...result,
        uploadedUrls: uploadedUrls.length > 0 ? uploadedUrls : undefined,
        uploadErrors: uploadErrors.length > 0 ? uploadErrors : undefined,
      };

      // 8. Emit completion event
      this.emit('printCompleted', enhancedResult);

      return enhancedResult;
    } catch (error) {
      const errorResult: PrintResult = {
        success: false,
        jobId: this.generateJobId(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      // History recording removed - errors are handled by calling service

      this.emit('printFailed', errorResult);
      return errorResult;
    }
  }

  /**
   * Batch print multiple documents
   */
  async batchPrint(batch: BatchPrintRequest): Promise<BatchPrintResult> {
    this.ensureInitialized();

    const startTime = Date.now();
    const results: PrintResult[] = [];
    let successful = 0;
    let failed = 0;

    try {
      // Group by type if requested
      const groups = batch.options?.groupByType
        ? this.groupPrintJobsByType(batch.requests)
        : [batch.requests];

      for (const group of groups) {
        // Process in parallel if requested
        if (batch.options?.parallel) {
          const promises = group.map(request => this.print(request));
          const groupResults = await Promise.allSettled(promises);

          groupResults.forEach(result => {
            if (result.status === 'fulfilled') {
              results.push(result.value);
              if (result.value.success) successful++;
              else failed++;
            } else {
              failed++;
              results.push({
                success: false,
                jobId: this.generateJobId(),
                error: result.reason?.message || 'Unknown error',
              });
            }
          });
        } else {
          // Sequential processing
          for (const request of group) {
            try {
              const result = await this.print(request);
              results.push(result);
              if (result.success) successful++;
              else failed++;

              // Stop on error if requested
              if (!result.success && batch.options?.stopOnError) {
                break;
              }
            } catch (error) {
              failed++;
              results.push({
                success: false,
                jobId: this.generateJobId(),
                error: error instanceof Error ? error.message : 'Unknown error',
              });

              if (batch.options?.stopOnError) break;
            }
          }
        }
      }

      return {
        totalJobs: batch.requests.length,
        successful,
        failed,
        results,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      console.error('[UnifiedPrintingService] Batch print failed:', error);
      throw error;
    }
  }

  // Statistics functionality removed - use existing record_history if needed

  /**
   * Get queue status from HAL
   */
  async getQueueStatus() {
    // Return empty status if not initialized
    if (!this.isInitialized()) {
      return {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
      };
    }

    return this.hal.queue.getQueueStatus();
  }

  /**
   * Cancel a print job via HAL
   */
  async cancelJob(jobId: string): Promise<boolean> {
    return this.hal.queue.removeFromQueue(jobId);
  }

  // Private helper methods
  private async validatePermission(request: PrintRequest): Promise<void> {
    // TODO: Implement permission validation based on user role and print type
    // For now, allow all prints
    return;
  }

  private mapToCompatibleType(
    printType: PrintType
  ):
    | 'QC_LABEL'
    | 'GRN_LABEL'
    | 'TRANSACTION_REPORT'
    | 'INVENTORY_REPORT'
    | 'PALLET_LABEL'
    | 'TRANSFER_SLIP'
    | 'VOID_REPORT' {
    // 策略4: unknown + type narrowing - 映射 PrintType 到兼容的類型
    switch (printType) {
      case PrintType.QC_LABEL:
        return 'QC_LABEL';
      case PrintType.GRN_LABEL:
        return 'GRN_LABEL';
      case PrintType.TRANSACTION_REPORT:
        return 'TRANSACTION_REPORT';
      case PrintType.INVENTORY_REPORT:
        return 'INVENTORY_REPORT';
      case PrintType.ACO_ORDER_REPORT:
        return 'TRANSACTION_REPORT'; // 映射到兼容類型
      case PrintType.GRN_REPORT:
        return 'INVENTORY_REPORT'; // 映射到兼容類型
      case PrintType.CUSTOM_DOCUMENT:
        return 'TRANSACTION_REPORT'; // 默認映射
      default:
        return 'TRANSACTION_REPORT'; // 安全的回退值
    }
  }

  private async preparePrintData(request: PrintRequest): Promise<
    | {
        formattedData: unknown;
        template: string;
        metadata: Record<string, string | number>;
      }
    | PrintData
  > {
    // Apply template if available
    // 策略4: unknown + type narrowing - 安全轉換 PrintType 為兼容類型
    const compatibleType = this.mapToCompatibleType(request.type);
    const template = await this.templateService.getTemplate(compatibleType);
    if (template) {
      // 策略4: unknown + type narrowing - 確保數據為陣列格式
      const dataArray = Array.isArray(request.data) ? request.data : [request.data];
      // Filter out undefined values and cast to DatabaseRecord[]
      const validData = dataArray.filter((item): item is DatabaseRecord => item !== undefined);
      return this.templateService.applyTemplate(template, validData);
    }

    // Return raw data if no template
    return request.data || {};
  }

  private groupPrintJobsByType(requests: PrintRequest[]): PrintRequest[][] {
    const groups = new Map<PrintType, PrintRequest[]>();

    requests.forEach(request => {
      const group = groups.get(request.type) || [];
      group.push(request);
      groups.set(request.type, group);
    });

    return Array.from(groups.values());
  }

  private generateJobId(): string {
    return `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Upload PDFs to storage and update pallet records
   */
  private async uploadPdfsToStorage(
    pdfBlobs: Blob[],
    palletNumbers: string[],
    printType: PrintType
  ): Promise<{ uploadedUrls: string[]; uploadErrors: string[] }> {
    const uploadedUrls: string[] = [];
    const uploadErrors: string[] = [];

    console.log(`[UnifiedPrintingService] Uploading ${pdfBlobs.length} PDFs to storage...`);

    for (let i = 0; i < pdfBlobs.length; i++) {
      try {
        const pdfBlob = pdfBlobs[i];
        const palletNum = palletNumbers[i];

        if (!palletNum) {
          uploadErrors.push(`Missing pallet number for PDF ${i + 1}`);
          continue;
        }

        // Convert blob to number array for upload
        const arrayBuffer = await pdfBlob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const numberArray = Array.from(uint8Array);

        // Generate filename
        const fileName = `${palletNum.replace('/', '_')}.pdf`;

        // Upload based on print type
        let uploadResult: { publicUrl?: string; error?: string };
        if (printType === PrintType.QC_LABEL) {
          uploadResult = await uploadPdfToStorageQc(numberArray, fileName);
        } else {
          uploadResult = await uploadPdfToStorage(numberArray, fileName);
        }

        if (uploadResult.publicUrl) {
          uploadedUrls.push(uploadResult.publicUrl);
          console.log(`[UnifiedPrintingService] PDF uploaded for pallet ${palletNum}`);

          // Update database with PDF URL
          const updateResult =
            printType === PrintType.QC_LABEL
              ? await updatePalletPdfUrlQc(palletNum, uploadResult.publicUrl)
              : await updatePalletPdfUrl(palletNum, uploadResult.publicUrl);

          if (!updateResult.success) {
            console.error(
              `[UnifiedPrintingService] Failed to update PDF URL for pallet ${palletNum}:`,
              updateResult.error
            );
          }
        } else {
          uploadErrors.push(`Failed to upload PDF for pallet ${palletNum}: ${uploadResult.error}`);
        }
      } catch (error) {
        const errorMsg = `Upload error for PDF ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error('[UnifiedPrintingService]', errorMsg);
        uploadErrors.push(errorMsg);
      }
    }

    console.log(
      `[UnifiedPrintingService] Upload complete: ${uploadedUrls.length} successful, ${uploadErrors.length} failed`
    );
    return { uploadedUrls, uploadErrors };
  }

  /**
   * Prepare PDF print data - merge if multiple PDFs
   */
  private async preparePdfPrintData(pdfBlobs: Blob[]): Promise<{ pdfBlob: Blob }> {
    if (pdfBlobs.length === 1) {
      // Single PDF - return as is
      return { pdfBlob: pdfBlobs[0] };
    }

    // Multiple PDFs - merge them
    console.log(`[UnifiedPrintingService] Merging ${pdfBlobs.length} PDFs...`);

    try {
      const { PDFDocument } = await import('pdf-lib');
      const mergedPdf = await PDFDocument.create();

      for (let i = 0; i < pdfBlobs.length; i++) {
        const pdfBuffer = await pdfBlobs[i].arrayBuffer();
        const pdfToMerge = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
        const pages = await mergedPdf.copyPages(pdfToMerge, pdfToMerge.getPageIndices());
        pages.forEach(page => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const mergedPdfBlob = new Blob([mergedPdfBytes as unknown as ArrayBuffer], {
        type: 'application/pdf',
      });

      console.log(`[UnifiedPrintingService] Successfully merged ${pdfBlobs.length} PDFs`);
      return { pdfBlob: mergedPdfBlob };
    } catch (error) {
      console.error('[UnifiedPrintingService] PDF merge failed:', error);
      throw new Error(
        `Failed to merge PDFs: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private setupEventListeners(): void {
    // Forward queue events from HAL
    this.hal.queue.on('job.added', job => {
      this.emit('jobQueued', job);
    });

    this.hal.queue.on('job.processing', job => {
      this.emit('jobStarted', job);
    });

    this.hal.queue.on('job.completed', job => {
      this.emit('jobCompleted', job);
    });

    this.hal.queue.on('job.failed', (job, error) => {
      this.emit('jobFailed', job, error);
    });

    // Forward monitoring events
    this.hal.monitoring.on('statusChange', status => {
      this.emit('printerStatusChange', status);
    });
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('UnifiedPrintingService not initialized. Call initialize() first.');
    }
  }

  /**
   * Shutdown the service
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) return;

    try {
      await this.hal.shutdown();
      this.initialized = false;
      console.log('[UnifiedPrintingService] Shut down successfully');
    } catch (error) {
      console.error('[UnifiedPrintingService] Shutdown error:', error);
    }
  }
}

// Singleton instance
let serviceInstance: UnifiedPrintingService | null = null;

/**
 * Get or create service instance
 */
export function getUnifiedPrintingService(): UnifiedPrintingService {
  if (!serviceInstance) {
    serviceInstance = new UnifiedPrintingService();
  }
  return serviceInstance;
}
