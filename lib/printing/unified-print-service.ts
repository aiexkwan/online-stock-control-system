/**
 * Unified Print Service
 * 獨立嘅打印服務，取代原有嘅三層架構
 */

import { EventEmitter } from 'events';

export interface PrintRequest {
  type: 'qc-label' | 'grn-label' | 'report';
  pdfBlobs: Blob[];
  metadata: {
    productCode?: string;
    palletNumbers?: string[];
    series?: string[];
    quantity?: number;
    operator?: string;
    userId: string;
    source: string;
    timestamp: string;
  };
  options?: {
    copies?: number;
    paperSize?: 'A4' | 'Letter';
    orientation?: 'portrait' | 'landscape';
  };
}

export interface PrintResult {
  success: boolean;
  jobId: string;
  message?: string;
  error?: string;
}

interface PrintJob {
  id: string;
  request: PrintRequest;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
}

class UnifiedPrintService extends EventEmitter {
  private initialized = false;
  private printQueue: Map<string, PrintJob> = new Map();

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // 初始化打印服務
      console.log('[UnifiedPrintService] Initializing...');

      // 檢查系統打印能力
      if (typeof window !== 'undefined' && 'print' in window) {
        this.initialized = true;
        console.log('[UnifiedPrintService] Initialized successfully');
      } else {
        throw new Error('Print capability not available');
      }
    } catch (error) {
      console.error('[UnifiedPrintService] Initialization failed:', error);
      throw error;
    }
  }

  async print(request: PrintRequest): Promise<PrintResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    const jobId = this.generateJobId();
    const job: PrintJob = {
      id: jobId,
      request,
      status: 'pending',
      createdAt: new Date(),
    };

    try {
      // 1. 驗證請求
      this.validateRequest(request);

      // 2. 加入隊列
      this.printQueue.set(jobId, job);
      this.emit('job.queued', { jobId, request });

      // 3. 更新狀態為處理中
      job.status = 'processing';
      this.emit('job.processing', { jobId });

      // 4. 處理 PDF（合併如果需要）
      const finalPdfBlob =
        request.pdfBlobs.length > 1 ? await this.mergePdfs(request.pdfBlobs) : request.pdfBlobs[0];

      // 5. 執行打印
      await this.executePrint(finalPdfBlob, request, jobId);

      // 6. 更新狀態為完成
      job.status = 'completed';
      this.emit('job.completed', { jobId });

      // 7. 清理隊列（延遲清理以便查詢）
      setTimeout(() => {
        this.printQueue.delete(jobId);
      }, 5000);

      return {
        success: true,
        jobId,
        message: 'Print job completed successfully',
      };
    } catch (error) {
      job.status = 'failed';
      this.emit('job.failed', { jobId, error });

      // 延遲清理失敗任務
      setTimeout(() => {
        this.printQueue.delete(jobId);
      }, 10000);

      return {
        success: false,
        jobId,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async mergePdfs(pdfBlobs: Blob[]): Promise<Blob> {
    try {
      // 動態導入 pdf-lib 以減少初始載入大小
      const { getPDFLib } = await import('../services/unified-pdf-service');
      const { PDFDocument } = await getPDFLib();
      const mergedPdf = await PDFDocument.create();

      for (const pdfBlob of pdfBlobs) {
        try {
          const pdfBuffer = await pdfBlob.arrayBuffer();
          const pdfToMerge = await PDFDocument.load(pdfBuffer);
          const pages = await mergedPdf.copyPages(pdfToMerge, pdfToMerge.getPageIndices());
          pages.forEach(page => mergedPdf.addPage(page));
        } catch (error) {
          console.error('[UnifiedPrintService] Error merging individual PDF:', error);
          // 繼續處理其他 PDF
        }
      }

      if (mergedPdf.getPageCount() === 0) {
        throw new Error('No pages to print after merging');
      }

      const mergedPdfBytes = await mergedPdf.save();
      return new Blob([new Uint8Array(mergedPdfBytes)], { type: 'application/pdf' });
    } catch (error) {
      console.error('[UnifiedPrintService] PDF merge failed:', error);
      throw new Error('Failed to merge PDFs');
    }
  }

  private async executePrint(pdfBlob: Blob, request: PrintRequest, jobId: string): Promise<void> {
    // 建立打印用嘅 iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '-10000px';
    iframe.style.left = '-10000px';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    try {
      // 將 PDF 載入 iframe
      const pdfUrl = URL.createObjectURL(pdfBlob);

      // 設置打印完成嘅處理
      const printCompleteHandler = () => {
        console.log('[UnifiedPrintService] Print dialog closed');
        URL.revokeObjectURL(pdfUrl);
        if (iframe.parentNode) {
          document.body.removeChild(iframe);
        }
      };

      // 監聽焦點返回（表示打印對話框關閉）
      window.addEventListener('focus', printCompleteHandler, { once: true });

      // 載入 PDF
      iframe.src = pdfUrl;

      // 等待載入完成
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('PDF loading timeout'));
        }, 30000);

        iframe.onload = () => {
          clearTimeout(timeout);
          resolve();
        };

        iframe.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('Failed to load PDF'));
        };
      });

      // 延遲一下確保 PDF 完全渲染
      await new Promise(resolve => setTimeout(resolve, 500));

      // 執行打印
      if (iframe.contentWindow) {
        iframe.contentWindow.print();
      } else {
        throw new Error('Cannot access iframe content');
      }

      // 清理會在 focus 事件或 10 秒後自動執行
      setTimeout(() => {
        window.removeEventListener('focus', printCompleteHandler);
        printCompleteHandler();
      }, 10000);
    } catch (error) {
      // 確保清理資源
      if (iframe.parentNode) {
        document.body.removeChild(iframe);
      }
      throw error;
    }
  }

  private validateRequest(request: PrintRequest): void {
    if (!request.pdfBlobs || request.pdfBlobs.length === 0) {
      throw new Error('No PDFs provided for printing');
    }

    if (!request.metadata?.userId) {
      throw new Error('User ID is required');
    }

    if (!request.metadata?.source) {
      throw new Error('Source is required');
    }
  }

  private generateJobId(): string {
    return `job-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  // 隊列管理方法
  getQueueStatus(): {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    jobs: Array<{ id: string; status: string; createdAt: Date }>;
  } {
    const jobs = Array.from(this.printQueue.values());

    return {
      pending: jobs.filter(j => j.status === 'pending').length,
      processing: jobs.filter(j => j.status === 'processing').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
      jobs: jobs.map(j => ({
        id: j.id,
        status: j.status,
        createdAt: j.createdAt,
      })),
    };
  }

  getJob(jobId: string): PrintJob | undefined {
    return this.printQueue.get(jobId);
  }

  cancelJob(jobId: string): boolean {
    const job = this.printQueue.get(jobId);
    if (job && job.status === 'pending') {
      this.printQueue.delete(jobId);
      this.emit('job.cancelled', { jobId });
      return true;
    }
    return false;
  }

  clearCompleted(): number {
    const completedJobs = Array.from(this.printQueue.entries()).filter(
      ([_, job]) => job.status === 'completed' || job.status === 'failed'
    );

    completedJobs.forEach(([jobId]) => {
      this.printQueue.delete(jobId);
    });

    return completedJobs.length;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async shutdown(): Promise<void> {
    if (!this.initialized) return;

    try {
      // 清理所有隊列
      this.printQueue.clear();
      this.removeAllListeners();
      this.initialized = false;
      console.log('[UnifiedPrintService] Shut down successfully');
    } catch (error) {
      console.error('[UnifiedPrintService] Shutdown error:', error);
    }
  }
}

// 單例
let serviceInstance: UnifiedPrintService | null = null;

export function getUnifiedPrintService(): UnifiedPrintService {
  if (!serviceInstance) {
    serviceInstance = new UnifiedPrintService();
  }
  return serviceInstance;
}

// 輔助函數 - 為兼容性提供
export function resetPrintService(): void {
  if (serviceInstance) {
    serviceInstance.shutdown();
    serviceInstance = null;
  }
}
