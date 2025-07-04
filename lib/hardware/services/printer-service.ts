/**
 * Unified Printer Service
 * Consolidates print-label and print-grnlabel functionality
 */

import { 
  PrintJob, 
  PrintResult, 
  PrinterStatus, 
  StatusCallback, 
  Unsubscribe,
  PrintJobType 
} from '../types';
import { EventEmitter } from 'events';

export interface PrinterService {
  // Printer Management
  listPrinters(): Promise<PrinterStatus[]>;
  selectPrinter(printerId: string): Promise<void>;
  getDefaultPrinter(): Promise<PrinterStatus | null>;
  
  // Print Operations
  print(job: PrintJob): Promise<PrintResult>;
  batchPrint(jobs: PrintJob[]): Promise<PrintResult[]>;
  cancelJob(jobId: string): Promise<boolean>;
  
  // Status Monitoring
  getStatus(printerId?: string): Promise<PrinterStatus | PrinterStatus[]>;
  onStatusChange(callback: StatusCallback): Unsubscribe;
  
  // Queue Management
  getQueueStatus(): Promise<{ pending: number; processing: number }>;
  clearQueue(): Promise<void>;
}

/**
 * Default implementation that wraps existing print functionality
 */
export class DefaultPrinterService extends EventEmitter implements PrinterService {
  private selectedPrinterId: string | null = null;
  private printers: Map<string, PrinterStatus> = new Map();
  private printQueue: PrintJob[] = [];
  private isProcessing = false;

  constructor() {
    super();
    this.initializePrinters();
  }

  private async initializePrinters() {
    // Initialize with a default printer for now
    // In production, this would detect actual printers
    const defaultPrinter: PrinterStatus = {
      id: 'default',
      name: 'System Default Printer',
      isOnline: true,
      isDefault: true,
      jobsInQueue: 0,
      capabilities: {
        supportedFormats: ['pdf', 'html'],
        maxCopies: 999,
        supportsDuplex: false,
        supportsColor: true
      }
    };
    
    this.printers.set(defaultPrinter.id, defaultPrinter);
    this.selectedPrinterId = defaultPrinter.id;
  }

  async listPrinters(): Promise<PrinterStatus[]> {
    return Array.from(this.printers.values());
  }

  async selectPrinter(printerId: string): Promise<void> {
    if (!this.printers.has(printerId)) {
      throw new Error(`Printer ${printerId} not found`);
    }
    this.selectedPrinterId = printerId;
  }

  async getDefaultPrinter(): Promise<PrinterStatus | null> {
    return Array.from(this.printers.values()).find(p => p.isDefault) || null;
  }

  async print(job: PrintJob): Promise<PrintResult> {
    const jobId = this.generateJobId();
    const jobWithId = { ...job, id: jobId };
    
    try {
      // Route to appropriate handler based on job type
      switch (job.type) {
        case 'qc-label':
          return await this.printQcLabel(jobWithId);
        case 'grn-label':
          return await this.printGrnLabel(jobWithId);
        case 'report':
        case 'document':
          return await this.printDocument(jobWithId);
        default:
          throw new Error(`Unsupported print job type: ${job.type}`);
      }
    } catch (error) {
      return {
        success: false,
        jobId,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async batchPrint(jobs: PrintJob[]): Promise<PrintResult[]> {
    // Add jobs to queue and process
    this.printQueue.push(...jobs);
    return this.processQueue();
  }

  async cancelJob(jobId: string): Promise<boolean> {
    const index = this.printQueue.findIndex(job => job.id === jobId);
    if (index !== -1) {
      this.printQueue.splice(index, 1);
      return true;
    }
    return false;
  }

  async getStatus(printerId?: string): Promise<PrinterStatus | PrinterStatus[]> {
    if (printerId) {
      const printer = this.printers.get(printerId);
      if (!printer) throw new Error(`Printer ${printerId} not found`);
      return printer;
    }
    return Array.from(this.printers.values());
  }

  onStatusChange(callback: StatusCallback): Unsubscribe {
    const listener = (status: PrinterStatus) => callback(status);
    this.on('statusChange', listener);
    return () => this.off('statusChange', listener);
  }

  async getQueueStatus(): Promise<{ pending: number; processing: number }> {
    return {
      pending: this.printQueue.length,
      processing: this.isProcessing ? 1 : 0
    };
  }

  async clearQueue(): Promise<void> {
    this.printQueue = [];
  }

  // Private helper methods
  private generateJobId(): string {
    return `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async processQueue(): Promise<PrintResult[]> {
    if (this.isProcessing) {
      return [];
    }

    this.isProcessing = true;
    const results: PrintResult[] = [];

    while (this.printQueue.length > 0) {
      const job = this.printQueue.shift();
      if (job) {
        const result = await this.print(job);
        results.push(result);
      }
    }

    this.isProcessing = false;
    return results;
  }

  // Type-specific print handlers that call existing APIs
  private async printQcLabel(job: PrintJob): Promise<PrintResult> {
    try {
      // Check if we already have a PDF blob
      if (job.data.pdfBlob) {
        // Direct print from blob
        const pdfUrl = URL.createObjectURL(job.data.pdfBlob);
        
        // Trigger actual print dialog
        await this.triggerPrint(pdfUrl, job.copies);
        
        return {
          success: true,
          jobId: job.id!,
          pdfUrl,
          printedAt: new Date().toISOString(),
          message: 'QC label printed successfully'
        };
      } else {
        // Legacy API call if no blob provided
        const response = await fetch('/api/print-label-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(job.data)
        });

        if (!response.ok) {
          throw new Error(`Print failed: ${response.statusText}`);
        }

        const pdfBlob = await response.blob();
        const pdfUrl = URL.createObjectURL(pdfBlob);

        // Trigger actual print dialog
        await this.triggerPrint(pdfUrl, job.copies);

        return {
          success: true,
          jobId: job.id!,
          pdfUrl,
          printedAt: new Date().toISOString()
        };
      }
    } catch (error) {
      throw error;
    }
  }

  private async printGrnLabel(job: PrintJob): Promise<PrintResult> {
    try {
      // Check if we already have a PDF blob
      if (job.data.pdfBlob) {
        // Direct print from blob
        const pdfUrl = URL.createObjectURL(job.data.pdfBlob);
        
        // Trigger actual print dialog
        await this.triggerPrint(pdfUrl, job.copies);
        
        return {
          success: true,
          jobId: job.id!,
          pdfUrl,
          printedAt: new Date().toISOString(),
          message: 'GRN label printed successfully'
        };
      } else {
        // Legacy API call if no blob provided
        // Note: GRN labels are typically generated with blob already
        return {
          success: false,
          jobId: job.id!,
          error: 'GRN label printing requires PDF blob'
        };
      }
    } catch (error) {
      throw error;
    }
  }

  private async printDocument(job: PrintJob): Promise<PrintResult> {
    try {
      // Check if we have a PDF blob
      if (job.data.pdfBlob) {
        const pdfUrl = URL.createObjectURL(job.data.pdfBlob);
        
        // Trigger actual print dialog
        await this.triggerPrint(pdfUrl, job.copies);
        
        return {
          success: true,
          jobId: job.id!,
          pdfUrl,
          printedAt: new Date().toISOString(),
          message: 'Document printed successfully'
        };
      } else {
        // No PDF blob provided
        return {
          success: false,
          jobId: job.id!,
          error: 'Document printing requires PDF blob'
        };
      }
    } catch (error) {
      throw error;
    }
  }

  private async triggerPrint(pdfUrl: string, copies: number): Promise<void> {
    // Create iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = pdfUrl;
    
    document.body.appendChild(iframe);
    
    return new Promise((resolve) => {
      iframe.onload = () => {
        // Focus on iframe for better print dialog handling
        iframe.contentWindow?.focus();
        
        // Print based on copies
        for (let i = 0; i < copies; i++) {
          iframe.contentWindow?.print();
        }
        
        // IMPORTANT: Increased delay to allow user to interact with print dialog
        // Most browsers need time for print dialog to fully close
        setTimeout(() => {
          // Check if iframe still exists before removing
          if (iframe.parentNode) {
            document.body.removeChild(iframe);
          }
          URL.revokeObjectURL(pdfUrl);
          resolve();
        }, 10000); // 10 seconds - same as legacy system
      };
    });
  }
}