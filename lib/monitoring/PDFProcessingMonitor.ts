/**
 * PDF Processing Performance Monitor
 * Tracks detailed metrics for PDF upload and analysis
 */

import { simplePerformanceMonitor } from '@/lib/performance/SimplePerformanceMonitor';
import type { SimpleStats } from '@/lib/performance/SimplePerformanceMonitor';

interface ProcessingStage {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

interface PDFProcessingMetrics {
  fileId: string;
  fileName: string;
  fileSize: number;
  stages: ProcessingStage[];
  totalDuration?: number;
  tokenUsage?: {
    original: number;
    optimized: number;
    reduction: number;
  };
  cacheHit: boolean;
  retryCount: number;
  success: boolean;
  error?: string;
  timestamp: number;
}

export class PDFProcessingMonitor {
  private static instance: PDFProcessingMonitor;
  private activeProcessing: Map<string, PDFProcessingMetrics> = new Map();
  private completedProcessing: PDFProcessingMetrics[] = [];
  private readonly maxCompletedEntries = 100;

  // Stage names for consistency
  static readonly STAGES = {
    FILE_UPLOAD: 'file_upload',
    CONTENT_EXTRACTION: 'content_extraction',
    TOKEN_OPTIMIZATION: 'token_optimization',
    CACHE_CHECK: 'cache_check',
    OPENAI_ANALYSIS: 'openai_analysis',
    RESULT_PARSING: 'result_parsing',
    DATABASE_SAVE: 'database_save',
    EMAIL_NOTIFICATION: 'email_notification'
  } as const;

  private constructor() {
    // Initialize with performance monitor
  }

  static getInstance(): PDFProcessingMonitor {
    if (!PDFProcessingMonitor.instance) {
      PDFProcessingMonitor.instance = new PDFProcessingMonitor();
    }
    return PDFProcessingMonitor.instance;
  }

  /**
   * Start monitoring a new PDF processing
   */
  startProcessing(fileId: string, fileName: string, fileSize: number): void {
    const metrics: PDFProcessingMetrics = {
      fileId,
      fileName,
      fileSize,
      stages: [],
      cacheHit: false,
      retryCount: 0,
      success: false,
      timestamp: Date.now()
    };

    this.activeProcessing.set(fileId, metrics);
    
    // Record in SimplePerformanceMonitor
    simplePerformanceMonitor.recordMetric('pdf_processing_started', 1, 'pdf');
    simplePerformanceMonitor.recordMetric('pdf_file_size', fileSize, 'pdf');
  }

  /**
   * Start a processing stage
   */
  startStage(fileId: string, stageName: string): void {
    const metrics = this.activeProcessing.get(fileId);
    if (!metrics) return;

    const stage: ProcessingStage = {
      name: stageName,
      startTime: Date.now(),
      status: 'processing'
    };

    metrics.stages.push(stage);
  }

  /**
   * Complete a processing stage
   */
  completeStage(fileId: string, stageName: string, error?: string): void {
    const metrics = this.activeProcessing.get(fileId);
    if (!metrics) return;

    const stage = metrics.stages.find(s => s.name === stageName && s.status === 'processing');
    if (!stage) return;

    stage.endTime = Date.now();
    stage.duration = stage.endTime - stage.startTime;
    stage.status = error ? 'failed' : 'completed';
    stage.error = error;

    // Record stage duration
    simplePerformanceMonitor.recordMetric(
      `pdf_stage_${stageName}`,
      stage.duration,
      'pdf_stages'
    );

    // Record error if present
    if (error) {
      simplePerformanceMonitor.recordMetric(`pdf_stage_${stageName}_error`, 1, 'pdf_errors');
    }
  }

  /**
   * Record token usage
   */
  recordTokenUsage(fileId: string, original: number, optimized: number): void {
    const metrics = this.activeProcessing.get(fileId);
    if (!metrics) return;

    const reduction = Math.round(((original - optimized) / original) * 100);
    
    metrics.tokenUsage = {
      original,
      optimized,
      reduction
    };

    // Record in performance monitor
    simplePerformanceMonitor.recordMetric('pdf_tokens_original', original, 'tokens');
    simplePerformanceMonitor.recordMetric('pdf_tokens_optimized', optimized, 'tokens');
    simplePerformanceMonitor.recordMetric('pdf_tokens_reduction_percent', reduction, 'tokens');
  }

  /**
   * Record cache hit
   */
  recordCacheHit(fileId: string, hit: boolean): void {
    const metrics = this.activeProcessing.get(fileId);
    if (!metrics) return;

    metrics.cacheHit = hit;
    simplePerformanceMonitor.recordMetric('pdf_cache_hit', hit ? 1 : 0, 'cache');
  }

  /**
   * Record retry
   */
  recordRetry(fileId: string): void {
    const metrics = this.activeProcessing.get(fileId);
    if (!metrics) return;

    metrics.retryCount++;
    simplePerformanceMonitor.recordMetric('pdf_retry', 1, 'pdf');
  }

  /**
   * Complete processing
   */
  completeProcessing(fileId: string, success: boolean, error?: string): void {
    const metrics = this.activeProcessing.get(fileId);
    if (!metrics) return;

    // Calculate total duration
    const firstStage = metrics.stages[0];
    const lastStage = metrics.stages[metrics.stages.length - 1];
    
    if (firstStage && lastStage?.endTime) {
      metrics.totalDuration = lastStage.endTime - firstStage.startTime;
    }

    metrics.success = success;
    metrics.error = error;

    // Record completion
    simplePerformanceMonitor.recordMetric(
      'pdf_processing_completed',
      success ? 1 : 0,
      'pdf'
    );

    if (metrics.totalDuration) {
      simplePerformanceMonitor.recordMetric(
        'pdf_total_duration',
        metrics.totalDuration,
        'pdf'
      );
    }

    // Move to completed list
    this.completedProcessing.push(metrics);
    if (this.completedProcessing.length > this.maxCompletedEntries) {
      this.completedProcessing.shift();
    }

    this.activeProcessing.delete(fileId);
  }

  /**
   * Get current processing status
   */
  getProcessingStatus(fileId: string): PDFProcessingMetrics | null {
    return this.activeProcessing.get(fileId) || null;
  }

  /**
   * Get all active processing
   */
  getActiveProcessing(): PDFProcessingMetrics[] {
    return Array.from(this.activeProcessing.values());
  }

  /**
   * Get processing statistics
   */
  getStatistics(): {
    totalProcessed: number;
    successRate: number;
    avgTotalDuration: number;
    avgTokenReduction: number;
    cacheHitRate: number;
    stageStats: Record<string, SimpleStats | null>;
    hourlyVolume: number[];
  } {
    const completed = this.completedProcessing;
    const totalProcessed = completed.length;
    const successful = completed.filter(m => m.success).length;
    const successRate = totalProcessed > 0 ? (successful / totalProcessed) * 100 : 0;

    // Average total duration
    const durations = completed
      .filter(m => m.totalDuration)
      .map(m => m.totalDuration!);
    const avgTotalDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

    // Average token reduction
    const tokenReductions = completed
      .filter(m => m.tokenUsage)
      .map(m => m.tokenUsage!.reduction);
    const avgTokenReduction = tokenReductions.length > 0
      ? tokenReductions.reduce((a, b) => a + b, 0) / tokenReductions.length
      : 0;

    // Cache hit rate
    const cacheHits = completed.filter(m => m.cacheHit).length;
    const cacheHitRate = totalProcessed > 0 ? (cacheHits / totalProcessed) * 100 : 0;

    // Stage statistics
    const stageStats: Record<string, SimpleStats | null> = {};
    for (const stageName of Object.values(PDFProcessingMonitor.STAGES)) {
      stageStats[stageName] = simplePerformanceMonitor.getBasicStats(`pdf_stage_${stageName}`);
    }

    // Hourly volume (last 24 hours)
    const hourlyVolume = this.calculateHourlyVolume();

    return {
      totalProcessed,
      successRate: Math.round(successRate),
      avgTotalDuration: Math.round(avgTotalDuration),
      avgTokenReduction: Math.round(avgTokenReduction),
      cacheHitRate: Math.round(cacheHitRate),
      stageStats,
      hourlyVolume
    };
  }

  /**
   * Calculate hourly processing volume
   */
  private calculateHourlyVolume(): number[] {
    const now = Date.now();
    const hourMs = 60 * 60 * 1000;
    const volume: number[] = new Array(24).fill(0);

    for (const metrics of this.completedProcessing) {
      const hoursAgo = Math.floor((now - metrics.timestamp) / hourMs);
      if (hoursAgo < 24) {
        volume[23 - hoursAgo]++;
      }
    }

    return volume;
  }

  /**
   * Get performance recommendations
   */
  getRecommendations(): string[] {
    const stats = this.getStatistics();
    const recommendations: string[] = [];

    // Token optimization
    if (stats.avgTokenReduction < 30) {
      recommendations.push('Token reduction below target (30%). Consider improving content optimization.');
    }

    // Cache hit rate
    if (stats.cacheHitRate < 20) {
      recommendations.push('Low cache hit rate. Consider extending cache TTL or warming cache with common patterns.');
    }

    // Processing time
    if (stats.avgTotalDuration > 30000) {
      recommendations.push('Average processing time exceeds 30 seconds. Review OpenAI API performance.');
    }

    // Success rate
    if (stats.successRate < 95) {
      recommendations.push('Success rate below 95%. Review error logs and implement better error recovery.');
    }

    // Stage-specific recommendations
    for (const [stage, stageStats] of Object.entries(stats.stageStats)) {
      if (stageStats && stageStats.avg > 5000 && stage !== PDFProcessingMonitor.STAGES.OPENAI_ANALYSIS) {
        recommendations.push(`Stage "${stage}" taking ${Math.round(stageStats.avg)}ms on average. Consider optimization.`);
      }
    }

    return recommendations;
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): string {
    return JSON.stringify({
      active: Array.from(this.activeProcessing.values()),
      completed: this.completedProcessing,
      statistics: this.getStatistics(),
      recommendations: this.getRecommendations(),
      timestamp: Date.now()
    }, null, 2);
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.activeProcessing.clear();
    this.completedProcessing = [];
  }
}

// Export singleton
export const pdfProcessingMonitor = PDFProcessingMonitor.getInstance();

// Export types
export type { ProcessingStage, PDFProcessingMetrics };