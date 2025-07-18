/**
 * Unified Printing Service
 * Central service for all printing operations
 */

import {
  PrintRequest,
  PrintResult,
  PrintType,
  BatchPrintRequest,
  BatchPrintResult,
  PrintPriority,
  PrintData,
} from '../types';
import { getHardwareAbstractionLayer } from '@/lib/hardware/hardware-abstraction-layer';
import { PrintHistoryService } from './print-history-service';
import { PrintTemplateService } from './print-template-service';
import { EventEmitter } from 'events';
import type { PrintJob } from '@/lib/hardware/types';

export interface UnifiedPrintingServiceConfig {
  historyService?: PrintHistoryService;
  templateService?: PrintTemplateService;
  enableHistory?: boolean;
}

/**
 * Unified Printing Service
 * A thin facade over the hardware abstraction layer that adds business logic
 * without duplicating low-level functionality
 */
export class UnifiedPrintingService extends EventEmitter {
  private hal = getHardwareAbstractionLayer();
  private historyService: PrintHistoryService;
  private templateService: PrintTemplateService;
  private initialized = false;
  private enableHistory: boolean;

  constructor(config?: UnifiedPrintingServiceConfig) {
    super();

    // Only create services that don't exist in HAL
    this.historyService = config?.historyService || new PrintHistoryService();
    this.templateService = config?.templateService || new PrintTemplateService();
    this.enableHistory = config?.enableHistory ?? false; // Disable by default since table might not exist
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

      // 2. Prepare print data
      const printData = await this.preparePrintData(request);

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
        metadata: request.metadata,
      };

      // 5. Use HAL to print (it handles queuing internally)
      const result = await this.hal.print(printJob);

      // 6. Record history (if enabled)
      console.log('[UnifiedPrintingService] History enabled?', this.enableHistory);
      if (this.enableHistory) {
        try {
          console.log('[UnifiedPrintingService] Recording print history for job:', result.jobId);
          await this.historyService.record({
            jobId: result.jobId,
            type: request.type,
            data: request.data,
            options: request.options,
            metadata: request.metadata,
            result,
            createdAt: new Date().toISOString(),
          });
          console.log('[UnifiedPrintingService] History recorded successfully');
        } catch (error) {
          console.warn('[UnifiedPrintingService] Failed to record history (non-blocking):', error);
        }
      } else {
        console.log('[UnifiedPrintingService] History recording is disabled');
      }

      // 7. Emit completion event
      this.emit('printCompleted', result);

      return result;
    } catch (error) {
      const errorResult: PrintResult = {
        success: false,
        jobId: this.generateJobId(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      // Record failed attempt in history
      await this.historyService.record({
        jobId: errorResult.jobId,
        type: request.type,
        data: request.data,
        options: request.options,
        metadata: request.metadata,
        result: errorResult,
        createdAt: new Date().toISOString(),
      });

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

  /**
   * Reprint a previous job from history
   */
  async reprint(historyId: string): Promise<PrintResult> {
    this.ensureInitialized();

    const history = await this.historyService.getById(historyId);
    if (!history) {
      throw new Error(`Print history ${historyId} not found`);
    }

    // Create new print request from history
    const request: PrintRequest = {
      type: history.type,
      data: history.data,
      options: history.options,
      metadata: {
        userId: history.metadata?.userId || 'system',
        ...history.metadata,
        source: 'reprint',
        reference: historyId,
      },
    };

    return this.print(request);
  }

  /**
   * Get print statistics
   */
  async getStatistics(startDate: Date, endDate: Date) {
    return this.historyService.getStatistics(startDate, endDate);
  }

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

  private async preparePrintData(request: PrintRequest): Promise<{
    formattedData: unknown;
    template: string;
    metadata: Record<string, string | number>;
  } | PrintData> {
    // Apply template if available
    const template = await this.templateService.getTemplate(request.type);
    if (template) {
      return this.templateService.applyTemplate(template, request.data);
    }

    // Return raw data if no template
    return request.data;
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
    serviceInstance = new UnifiedPrintingService({
      enableHistory: true, // Enable history now that table exists
    });
  }
  return serviceInstance;
}
