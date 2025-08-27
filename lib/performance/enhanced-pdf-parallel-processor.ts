/**
 * Enhanced PDF Parallel Processor
 * 實現真正的並行 PDF 生成，使用 Promise.allSettled 和智能併發控制
 * 目標：將 PDF 生成時間從 15-30s 減少至 5-10s
 */

import React from 'react';
import { EventEmitter } from 'events';
import { systemLogger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';
import { renderReactPDFToBlob } from '@/lib/services/unified-pdf-service';
import { uploadPdfToStorage, updatePalletPdfUrl } from '@/app/actions/qcActions';
import { PrintLabelPdf } from '@/components/print-label-pdf/PrintLabelPdf';
import { prepareQcLabelData, type QcInputData } from '@/lib/pdfUtils';
import { getOrdinalSuffix, getAcoPalletCount } from '@/app/utils/qcLabelHelpers';
import { createClient } from '@/app/utils/supabase/client';
import type { ProductInfo } from '@/app/components/qc-label-form/types';

export interface ParallelPdfTask {
  id: string;
  productInfo: ProductInfo;
  quantity: number;
  palletNum: string;
  series: string;
  operatorClockNum: string;
  qcClockNum: string;
  acoDisplayText?: string;
  priority: 'high' | 'normal' | 'low';
  timestamp: number;
}

export interface ParallelProcessingConfig {
  maxConcurrency: number;
  chunkSize: number;
  uploadConcurrency: number;
  retryAttempts: number;
  retryDelay: number;
  timeout: number;
  enableProgressTracking: boolean;
}

export interface ProcessingResult {
  taskId: string;
  success: boolean;
  blob?: Blob;
  uploadUrl?: string;
  error?: string;
  processingTime: number;
  uploadTime: number;
}

export interface ProcessingMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  successRate: number;
  averageProcessingTime: number;
  averageUploadTime: number;
  totalProcessingTime: number;
  peakConcurrency: number;
  throughputPerSecond: number;
}

export interface ProgressUpdate {
  phase: 'preparing' | 'generating' | 'uploading' | 'completed';
  completed: number;
  total: number;
  currentBatch: number;
  totalBatches: number;
  metrics: ProcessingMetrics;
  errors: string[];
}

/**
 * 智能併發控制器
 */
class ConcurrencyController {
  private activeJobs = new Set<string>();
  private pendingJobs: Array<() => Promise<any>> = [];
  private maxConcurrency: number;

  constructor(maxConcurrency: number) {
    this.maxConcurrency = maxConcurrency;
  }

  async execute<T>(task: () => Promise<T>, taskId?: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const wrappedTask = async () => {
        const id = taskId || uuidv4();
        this.activeJobs.add(id);

        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.activeJobs.delete(id);
          this.processNext();
        }
      };

      if (this.activeJobs.size < this.maxConcurrency) {
        wrappedTask();
      } else {
        this.pendingJobs.push(wrappedTask);
      }
    });
  }

  private processNext() {
    if (this.pendingJobs.length > 0 && this.activeJobs.size < this.maxConcurrency) {
      const nextTask = this.pendingJobs.shift();
      if (nextTask) {
        nextTask();
      }
    }
  }

  getCurrentConcurrency(): number {
    return this.activeJobs.size;
  }

  getPendingCount(): number {
    return this.pendingJobs.length;
  }

  clear() {
    this.pendingJobs = [];
    this.activeJobs.clear();
  }
}

/**
 * 增強的 PDF 並行處理器
 */
export class EnhancedPdfParallelProcessor extends EventEmitter {
  private static instance: EnhancedPdfParallelProcessor;
  private supabase = createClient();
  private config: ParallelProcessingConfig;
  private pdfController: ConcurrencyController;
  private uploadController: ConcurrencyController;
  private metrics: ProcessingMetrics;
  private startTime = 0;

  private constructor(config?: Partial<ParallelProcessingConfig>) {
    super();
    
    this.config = {
      maxConcurrency: 6, // 增加並發數
      chunkSize: 10, // 每批處理數量
      uploadConcurrency: 8, // 上傳並發數
      retryAttempts: 3,
      retryDelay: 1000,
      timeout: 30000,
      enableProgressTracking: true,
      ...config,
    };

    this.pdfController = new ConcurrencyController(this.config.maxConcurrency);
    this.uploadController = new ConcurrencyController(this.config.uploadConcurrency);
    this.metrics = this.initializeMetrics();

    systemLogger.info(
      { config: this.config },
      '[EnhancedPdfParallelProcessor] Processor initialized'
    );
  }

  public static getInstance(config?: Partial<ParallelProcessingConfig>): EnhancedPdfParallelProcessor {
    if (!EnhancedPdfParallelProcessor.instance) {
      EnhancedPdfParallelProcessor.instance = new EnhancedPdfParallelProcessor(config);
    }
    return EnhancedPdfParallelProcessor.instance;
  }

  private initializeMetrics(): ProcessingMetrics {
    return {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      successRate: 0,
      averageProcessingTime: 0,
      averageUploadTime: 0,
      totalProcessingTime: 0,
      peakConcurrency: 0,
      throughputPerSecond: 0,
    };
  }

  /**
   * 並行處理多個 PDF 任務
   */
  async processParallel(tasks: ParallelPdfTask[]): Promise<{
    success: boolean;
    results: ProcessingResult[];
    metrics: ProcessingMetrics;
    errors: string[];
  }> {
    if (tasks.length === 0) {
      return { success: true, results: [], metrics: this.metrics, errors: [] };
    }

    this.startTime = Date.now();
    this.metrics = this.initializeMetrics();
    this.metrics.totalTasks = tasks.length;

    const allErrors: string[] = [];
    const allResults: ProcessingResult[] = [];

    systemLogger.info(
      {
        taskCount: tasks.length,
        config: this.config,
      },
      '[EnhancedPdfParallelProcessor] Starting parallel processing'
    );

    try {
      // 按優先級排序任務
      const prioritizedTasks = this.prioritizeTasks(tasks);
      
      // 分批處理以避免記憶體過載
      const batches = this.chunkTasks(prioritizedTasks, this.config.chunkSize);
      
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        
        systemLogger.info(
          {
            batchIndex: batchIndex + 1,
            totalBatches: batches.length,
            batchSize: batch.length,
          },
          '[EnhancedPdfParallelProcessor] Processing batch'
        );

        // 發出進度更新
        if (this.config.enableProgressTracking) {
          this.emit('progress', {
            phase: 'generating',
            completed: allResults.length,
            total: tasks.length,
            currentBatch: batchIndex + 1,
            totalBatches: batches.length,
            metrics: this.calculateCurrentMetrics(),
            errors: allErrors,
          } as ProgressUpdate);
        }

        // 並行處理當前批次
        const batchResults = await this.processBatch(batch);
        
        // 收集結果和錯誤
        allResults.push(...batchResults.results);
        allErrors.push(...batchResults.errors);

        // 更新指標
        this.updateMetrics(batchResults.results);

        // 短暫延遲以避免過載
        if (batchIndex < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // 計算最終指標
      const finalMetrics = this.calculateFinalMetrics();
      
      // 發出完成事件
      this.emit('progress', {
        phase: 'completed',
        completed: allResults.length,
        total: tasks.length,
        currentBatch: batches.length,
        totalBatches: batches.length,
        metrics: finalMetrics,
        errors: allErrors,
      } as ProgressUpdate);

      const successCount = allResults.filter(r => r.success).length;
      const success = successCount > 0;

      systemLogger.info(
        {
          totalTasks: tasks.length,
          successCount,
          failedCount: allResults.length - successCount,
          processingTime: Date.now() - this.startTime,
          metrics: finalMetrics,
        },
        '[EnhancedPdfParallelProcessor] Parallel processing completed'
      );

      return {
        success,
        results: allResults,
        metrics: finalMetrics,
        errors: allErrors,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      systemLogger.error(
        { error: errorMessage, taskCount: tasks.length },
        '[EnhancedPdfParallelProcessor] Parallel processing failed'
      );

      allErrors.push(errorMessage);
      return {
        success: false,
        results: allResults,
        metrics: this.calculateCurrentMetrics(),
        errors: allErrors,
      };
    }
  }

  /**
   * 處理單個批次
   */
  private async processBatch(tasks: ParallelPdfTask[]): Promise<{
    results: ProcessingResult[];
    errors: string[];
  }> {
    const results: ProcessingResult[] = [];
    const errors: string[] = [];

    // 使用 Promise.allSettled 實現真正的並行處理
    const batchPromises = tasks.map(task =>
      this.pdfController.execute(
        () => this.processSingleTask(task),
        task.id
      )
    );

    const settledResults = await Promise.allSettled(batchPromises);

    // 處理結果
    settledResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
        if (!result.value.success && result.value.error) {
          errors.push(`Task ${tasks[index].id}: ${result.value.error}`);
        }
      } else {
        const errorMessage = result.reason instanceof Error ? result.reason.message : 'Unknown error';
        errors.push(`Task ${tasks[index].id}: ${errorMessage}`);
        results.push({
          taskId: tasks[index].id,
          success: false,
          error: errorMessage,
          processingTime: 0,
          uploadTime: 0,
        });
      }
    });

    return { results, errors };
  }

  /**
   * 處理單個 PDF 任務
   */
  private async processSingleTask(task: ParallelPdfTask): Promise<ProcessingResult> {
    const startTime = Date.now();
    let processingTime = 0;
    let uploadTime = 0;

    try {
      // 準備 QC 標籤數據
      const qcInput: QcInputData = {
        productCode: task.productInfo.code,
        productDescription: task.productInfo.description,
        quantity: task.quantity,
        series: task.series,
        palletNum: task.palletNum,
        operatorClockNum: task.operatorClockNum,
        qcClockNum: task.qcClockNum,
        workOrderNumber: task.acoDisplayText || undefined,
        workOrderName: task.productInfo.type === 'ACO' ? 'ACO Order' : undefined,
        productType: task.productInfo.type,
      };

      const pdfLabelProps = await prepareQcLabelData(qcInput);

      // 生成 PDF blob
      const pdfBlob = await renderReactPDFToBlob(
        React.createElement(PrintLabelPdf, pdfLabelProps)
      );

      if (!pdfBlob) {
        throw new Error('PDF generation failed to return a blob');
      }

      processingTime = Date.now() - startTime;

      // 並行上傳
      const uploadStartTime = Date.now();
      const uploadResult = await this.uploadController.execute(
        () => this.uploadPdf(pdfBlob, task.palletNum),
        `upload-${task.id}`
      );

      uploadTime = Date.now() - uploadStartTime;

      return {
        taskId: task.id,
        success: true,
        blob: pdfBlob,
        uploadUrl: uploadResult,
        processingTime,
        uploadTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      systemLogger.error(
        {
          taskId: task.id,
          palletNum: task.palletNum,
          error: errorMessage,
          processingTime: Date.now() - startTime,
        },
        '[EnhancedPdfParallelProcessor] Task processing failed'
      );

      return {
        taskId: task.id,
        success: false,
        error: errorMessage,
        processingTime: processingTime || Date.now() - startTime,
        uploadTime,
      };
    }
  }

  /**
   * 上傳 PDF 到存儲
   */
  private async uploadPdf(pdfBlob: Blob, palletNum: string): Promise<string> {
    const pdfArrayBuffer = await pdfBlob.arrayBuffer();
    const pdfUint8Array = new Uint8Array(pdfArrayBuffer);
    const pdfNumberArray = Array.from(pdfUint8Array);

    const fileName = `${palletNum.replace('/', '_')}.pdf`;
    const uploadResult = await uploadPdfToStorage(pdfNumberArray, fileName, 'qc-labels');

    if (uploadResult.error) {
      throw new Error(`PDF upload failed: ${uploadResult.error}`);
    }

    if (!uploadResult.publicUrl) {
      throw new Error('PDF upload succeeded but no public URL returned');
    }

    // 更新數據庫中的 PDF URL
    const updateResult = await updatePalletPdfUrl(palletNum, uploadResult.publicUrl);
    if (updateResult.error) {
      systemLogger.warn(
        {
          palletNum,
          error: updateResult.error,
        },
        '[EnhancedPdfParallelProcessor] Failed to update PDF URL in database'
      );
    }

    return uploadResult.publicUrl;
  }

  /**
   * 按優先級排序任務
   */
  private prioritizeTasks(tasks: ParallelPdfTask[]): ParallelPdfTask[] {
    return [...tasks].sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * 將任務分批
   */
  private chunkTasks(tasks: ParallelPdfTask[], chunkSize: number): ParallelPdfTask[][] {
    const chunks: ParallelPdfTask[][] = [];
    for (let i = 0; i < tasks.length; i += chunkSize) {
      chunks.push(tasks.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * 更新處理指標
   */
  private updateMetrics(results: ProcessingResult[]) {
    for (const result of results) {
      if (result.success) {
        this.metrics.completedTasks++;
      } else {
        this.metrics.failedTasks++;
      }
    }

    // 更新平均處理時間
    const processingTimes = results.filter(r => r.processingTime > 0).map(r => r.processingTime);
    if (processingTimes.length > 0) {
      const avgProcessingTime = processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length;
      this.metrics.averageProcessingTime = avgProcessingTime;
    }

    // 更新平均上傳時間
    const uploadTimes = results.filter(r => r.uploadTime > 0).map(r => r.uploadTime);
    if (uploadTimes.length > 0) {
      const avgUploadTime = uploadTimes.reduce((sum, time) => sum + time, 0) / uploadTimes.length;
      this.metrics.averageUploadTime = avgUploadTime;
    }

    // 更新成功率
    const totalProcessed = this.metrics.completedTasks + this.metrics.failedTasks;
    if (totalProcessed > 0) {
      this.metrics.successRate = (this.metrics.completedTasks / totalProcessed) * 100;
    }

    // 更新峰值並發
    const currentConcurrency = this.pdfController.getCurrentConcurrency() + this.uploadController.getCurrentConcurrency();
    if (currentConcurrency > this.metrics.peakConcurrency) {
      this.metrics.peakConcurrency = currentConcurrency;
    }
  }

  /**
   * 計算當前指標
   */
  private calculateCurrentMetrics(): ProcessingMetrics {
    const currentTime = Date.now();
    const elapsedSeconds = (currentTime - this.startTime) / 1000;
    
    return {
      ...this.metrics,
      totalProcessingTime: currentTime - this.startTime,
      throughputPerSecond: elapsedSeconds > 0 ? (this.metrics.completedTasks + this.metrics.failedTasks) / elapsedSeconds : 0,
    };
  }

  /**
   * 計算最終指標
   */
  private calculateFinalMetrics(): ProcessingMetrics {
    const finalMetrics = this.calculateCurrentMetrics();
    this.metrics = finalMetrics;
    return finalMetrics;
  }

  /**
   * 取得當前處理狀態
   */
  getProcessingStatus() {
    return {
      pdfConcurrency: this.pdfController.getCurrentConcurrency(),
      uploadConcurrency: this.uploadController.getCurrentConcurrency(),
      pdfPending: this.pdfController.getPendingCount(),
      uploadPending: this.uploadController.getPendingCount(),
      metrics: this.calculateCurrentMetrics(),
    };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<ParallelProcessingConfig>) {
    this.config = { ...this.config, ...newConfig };
    
    // 重新創建控制器如果並發數改變
    if (newConfig.maxConcurrency) {
      this.pdfController = new ConcurrencyController(this.config.maxConcurrency);
    }
    
    if (newConfig.uploadConcurrency) {
      this.uploadController = new ConcurrencyController(this.config.uploadConcurrency);
    }

    systemLogger.info(
      { config: this.config },
      '[EnhancedPdfParallelProcessor] Configuration updated'
    );
  }

  /**
   * 清理資源
   */
  cleanup() {
    this.pdfController.clear();
    this.uploadController.clear();
    this.removeAllListeners();
    
    systemLogger.info('[EnhancedPdfParallelProcessor] Resources cleaned up');
  }
}

// 導出單例實例
export const enhancedPdfParallelProcessor = EnhancedPdfParallelProcessor.getInstance();