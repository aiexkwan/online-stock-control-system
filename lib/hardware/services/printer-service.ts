/**
 * Unified Printer Service
 * Consolidates print-label and print-grnlabel functionality
 */

import {
  PrintJob,
  PrintResult,
  PrinterStatus,
  PrinterStatusCallback,
  Unsubscribe,
  PrintJobType,
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
  onStatusChange(callback: PrinterStatusCallback): Unsubscribe;

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
        supportsColor: true,
      },
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
        error: error instanceof Error ? error.message : 'Unknown error',
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

  onStatusChange(callback: PrinterStatusCallback): Unsubscribe {
    const listener = (status: PrinterStatus) => callback(status);
    this.on('statusChange', listener);
    return () => this.off('statusChange', listener);
  }

  async getQueueStatus(): Promise<{ pending: number; processing: number }> {
    return {
      pending: this.printQueue.length,
      processing: this.isProcessing ? 1 : 0,
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
      // Strategy 4: unknown + type narrowing - 安全訪問 job.data 屬性
      const jobData = job.data as Record<string, unknown>;
      if (
        jobData &&
        typeof jobData === 'object' &&
        'pdfBlob' in jobData &&
        jobData.pdfBlob instanceof Blob
      ) {
        // Direct print from blob
        const pdfUrl = URL.createObjectURL(jobData.pdfBlob);

        // Trigger actual print dialog
        await this.triggerPrint(pdfUrl, job.copies);

        return {
          success: true,
          jobId: job.id!,
          pdfUrl,
          printedAt: new Date().toISOString(),
          message: 'QC label printed successfully',
        };
      } else {
        // Generate PDF using React PDF if no blob provided
        throw new Error(
          'PDF blob is required for printing. Legacy Puppeteer API has been removed. ' +
            'Please use React PDF generation instead.'
        );
      }
    } catch (error) {
      throw error;
    }
  }

  private async printGrnLabel(job: PrintJob): Promise<PrintResult> {
    try {
      // Check if we already have a PDF blob
      // Strategy 4: unknown + type narrowing - 安全訪問 job.data 屬性
      const jobData = job.data as Record<string, unknown>;
      if (
        jobData &&
        typeof jobData === 'object' &&
        'pdfBlob' in jobData &&
        jobData.pdfBlob instanceof Blob
      ) {
        // Direct print from blob
        const pdfUrl = URL.createObjectURL(jobData.pdfBlob);

        // Trigger actual print dialog
        await this.triggerPrint(pdfUrl, job.copies);

        return {
          success: true,
          jobId: job.id!,
          pdfUrl,
          printedAt: new Date().toISOString(),
          message: 'GRN label printed successfully',
        };
      } else {
        // Legacy API call if no blob provided
        // Note: GRN labels are typically generated with blob already
        return {
          success: false,
          jobId: job.id!,
          error: 'GRN label printing requires PDF blob',
        };
      }
    } catch (error) {
      throw error;
    }
  }

  private async printDocument(job: PrintJob): Promise<PrintResult> {
    try {
      // Check if we have a PDF blob
      const reportJobData = job.data as Record<string, unknown>;
      if (
        reportJobData &&
        typeof reportJobData === 'object' &&
        'pdfBlob' in reportJobData &&
        reportJobData.pdfBlob instanceof Blob
      ) {
        const pdfUrl = URL.createObjectURL(reportJobData.pdfBlob);

        // Trigger actual print dialog
        await this.triggerPrint(pdfUrl, job.copies);

        return {
          success: true,
          jobId: job.id!,
          pdfUrl,
          printedAt: new Date().toISOString(),
          message: 'Document printed successfully',
        };
      } else {
        // No PDF blob provided
        return {
          success: false,
          jobId: job.id!,
          error: 'Document printing requires PDF blob',
        };
      }
    } catch (error) {
      throw error;
    }
  }

  private async triggerPrint(pdfUrl: string, copies: number): Promise<void> {
    console.log('[PrinterService] Using Web Print API for direct PDF printing.');

    return new Promise(resolve => {
      try {
        // Use iframe method for better PDF rendering compatibility
        try {
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(`
              <html>
                <head>
                  <title>Print Document</title>
                  <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    html, body { width: 100%; height: 100%; overflow: hidden; }
                    iframe { 
                      width: 100%; 
                      height: 100vh; 
                      border: none; 
                      display: block;
                    }
                  </style>
                </head>
                <body>
                  <iframe id="pdfFrame" src="${pdfUrl}" type="application/pdf"></iframe>
                  <script>
                    let printCount = 0;
                    const totalCopies = ${copies};
                    let printAttempted = false;
                    
                    function attemptPrint() {
                      if (printAttempted || printCount >= totalCopies) return;
                      printAttempted = true;
                      
                      try {
                        // Try to access iframe content and print
                        const iframe = document.getElementById('pdfFrame');
                        if (iframe && iframe.contentWindow) {
                          iframe.contentWindow.focus();
                          iframe.contentWindow.print();
                        } else {
                          // Fallback to window print
                          window.focus();
                          window.print();
                        }
                        
                        printCount++;
                        
                        // Handle multiple copies
                        if (printCount < totalCopies) {
                          printAttempted = false;
                          setTimeout(attemptPrint, 2000);
                        } else {
                          setTimeout(function() {
                            window.close();
                          }, 2000);
                        }
                      } catch (e) {
                        console.log('Print access restricted, using window.print()');
                        window.focus();
                        window.print();
                        printCount++;
                        
                        if (printCount < totalCopies) {
                          printAttempted = false;
                          setTimeout(attemptPrint, 2000);
                        } else {
                          setTimeout(function() {
                            window.close();
                          }, 2000);
                        }
                      }
                    }
                    
                    // Multiple methods to ensure printing triggers
                    document.getElementById('pdfFrame').onload = function() {
                      setTimeout(attemptPrint, 1000);
                    };
                    
                    // Backup timer
                    setTimeout(attemptPrint, 3000);
                  </script>
                </body>
              </html>
            `);
            printWindow.document.close();

            // Clean up after all prints
            setTimeout(
              () => {
                URL.revokeObjectURL(pdfUrl);
                console.log(
                  `[PrinterService] Print window method completed for ${copies} copies, blob URL cleaned up.`
                );
                resolve();
              },
              Math.max(10000, copies * 2500)
            );
          } else {
            throw new Error('Could not open print window');
          }
        } catch (windowError) {
          console.error('[PrinterService] Print window method failed:', windowError);
          // Fallback: Download multiple copies
          for (let i = 0; i < copies; i++) {
            const link = document.createElement('a');
            link.href = pdfUrl;
            link.download = `print_document_${Date.now()}_copy${i + 1}.pdf`;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }

          setTimeout(() => {
            URL.revokeObjectURL(pdfUrl);
            console.log(`[PrinterService] Fallback download completed for ${copies} copies.`);
            resolve();
          }, 1000);
        }
      } catch (error) {
        console.error('[PrinterService] Error in print process:', error);
        URL.revokeObjectURL(pdfUrl);
        resolve();
      }
    });
  }
}
