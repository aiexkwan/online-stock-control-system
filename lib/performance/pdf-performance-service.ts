/**
 * PDF Performance Service
 * Integrated performance optimization service for PDF extraction
 */

import { PDFExtractionService, ExtractedPDFData } from '@/app/services/pdfExtractionService';
import { PDFPerformanceMonitor } from './pdf-performance-monitor';
import { PDFCacheOptimizer } from './pdf-cache-optimizer';
import { PDFRequestBatcher } from './pdf-request-batcher';
import { PDFBenchmark, BenchmarkResult, ComparisonResult } from './pdf-benchmark';
import { systemLogger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

export interface OptimizedExtractionResult {
  requestId: string;
  extractedData: ExtractedPDFData;
  orderData?: Record<string, unknown>;
  performance: {
    responseTime: number;
    tokensUsed: number;
    cost: number;
    cacheHit: boolean;
    batchProcessed: boolean;
  };
  metadata: {
    fileName: string;
    fileSize: number;
    fileHash: string;
    timestamp: number;
  };
}

export interface PerformanceConfig {
  caching: {
    enabled: boolean;
    maxSizeMB: number;
    ttlSeconds: number;
  };
  batching: {
    enabled: boolean;
    maxBatchSize: number;
    batchTimeoutMs: number;
  };
  monitoring: {
    enabled: boolean;
    thresholds: {
      maxResponseTime: number;
      maxTokensPerRequest: number;
      maxCostPerRequest: number;
    };
  };
  optimization: {
    compressionEnabled: boolean;
    parallelProcessing: boolean;
    maxConcurrency: number;
    retryEnabled: boolean;
    maxRetries: number;
  };
}

/**
 * PDF Performance Service Class
 * Provides optimized PDF extraction with caching, batching, and monitoring
 */
export class PDFPerformanceService {
  private static instance: PDFPerformanceService;
  
  private pdfService: PDFExtractionService;
  private performanceMonitor: PDFPerformanceMonitor;
  private cacheOptimizer: PDFCacheOptimizer;
  private requestBatcher: PDFRequestBatcher;
  private benchmark: PDFBenchmark;
  private config: PerformanceConfig;
  
  private constructor(config?: Partial<PerformanceConfig>) {
    this.pdfService = PDFExtractionService.getInstance();
    this.performanceMonitor = PDFPerformanceMonitor.getInstance();
    this.cacheOptimizer = PDFCacheOptimizer.getInstance({
      maxSizeBytes: (config?.caching?.maxSizeMB || 100) * 1024 * 1024,
      ttlSeconds: config?.caching?.ttlSeconds || 1800,
      enableCompression: config?.optimization?.compressionEnabled ?? true,
    });
    this.requestBatcher = PDFRequestBatcher.getInstance({
      maxBatchSize: config?.batching?.maxBatchSize || 5,
      batchTimeoutMs: config?.batching?.batchTimeoutMs || 2000,
    });
    this.benchmark = new PDFBenchmark();
    
    this.config = this.getDefaultConfig(config);
    
    // Setup monitoring listeners
    this.setupMonitoring();
    
    systemLogger.info({
      config: this.config,
    }, '[PDFPerformanceService] Performance service initialized');
  }
  
  public static getInstance(config?: Partial<PerformanceConfig>): PDFPerformanceService {
    if (!PDFPerformanceService.instance) {
      PDFPerformanceService.instance = new PDFPerformanceService(config);
    }
    return PDFPerformanceService.instance;
  }
  
  /**
   * Get default configuration
   */
  private getDefaultConfig(override?: Partial<PerformanceConfig>): PerformanceConfig {
    return {
      caching: {
        enabled: true,
        maxSizeMB: 100,
        ttlSeconds: 1800,
        ...override?.caching,
      },
      batching: {
        enabled: true,
        maxBatchSize: 5,
        batchTimeoutMs: 2000,
        ...override?.batching,
      },
      monitoring: {
        enabled: true,
        thresholds: {
          maxResponseTime: 5000,
          maxTokensPerRequest: 10000,
          maxCostPerRequest: 0.5,
          ...override?.monitoring?.thresholds,
        },
        ...override?.monitoring,
      },
      optimization: {
        compressionEnabled: true,
        parallelProcessing: false,
        maxConcurrency: 3,
        retryEnabled: true,
        maxRetries: 3,
        ...override?.optimization,
      },
    };
  }
  
  /**
   * Setup monitoring listeners
   */
  private setupMonitoring(): void {
    if (!this.config.monitoring.enabled) return;
    
    // Listen for threshold violations
    this.performanceMonitor.on('threshold-violation', (event) => {
      systemLogger.warn({
        requestId: event.requestId,
        violations: event.violations,
      }, '[PDFPerformanceService] Performance threshold violation');
      
      // Auto-adjust if needed
      this.autoAdjustPerformance(event);
    });
    
    // Listen for batch events
    this.requestBatcher.on('batch-failed', (event) => {
      systemLogger.error({
        batchId: event.batchId,
        error: event.error,
      }, '[PDFPerformanceService] Batch processing failed');
    });
  }
  
  /**
   * Extract PDF with optimizations
   */
  public async extractPDF(
    fileBuffer: Buffer,
    fileName: string,
    options?: {
      priority?: 'high' | 'normal' | 'low';
      skipCache?: boolean;
      skipBatching?: boolean;
    }
  ): Promise<OptimizedExtractionResult> {
    const requestId = uuidv4();
    const startTime = Date.now();
    const fileHash = this.cacheOptimizer.generateHash(fileBuffer);
    
    systemLogger.debug({
      requestId,
      fileName,
      fileSize: fileBuffer.length,
      options,
    }, '[PDFPerformanceService] Starting PDF extraction');
    
    try {
      let extractedData: ExtractedPDFData | undefined;
      let orderData: Record<string, unknown> | null = null;
      let cacheHit = false;
      let batchProcessed = false;
      
      // Check cache first
      if (this.config.caching.enabled && !options?.skipCache) {
        const cached = this.cacheOptimizer.get(fileHash);
        if (cached) {
          extractedData = cached.extractedData;
          orderData = cached.orderData || null;
          cacheHit = true;
          
          systemLogger.debug({
            requestId,
            fileName,
            cacheHit: true,
          }, '[PDFPerformanceService] Cache hit');
        }
      }
      
      // If not cached, process
      if (!cacheHit) {
        if (this.config.batching.enabled && !options?.skipBatching) {
          // Use batching
          const result = await this.requestBatcher.addRequest(
            fileBuffer,
            fileName,
            fileHash,
            options?.priority || 'normal'
          );
          
          // Extract using service
          extractedData = await this.pdfService.extractText(fileBuffer.buffer as ArrayBuffer);
          orderData = result;
          batchProcessed = true;
          
        } else {
          // Direct extraction
          extractedData = await this.pdfService.extractText(fileBuffer.buffer as ArrayBuffer);
        }
        
        // Cache the result
        if (this.config.caching.enabled && !options?.skipCache) {
          const extractionTime = Date.now() - startTime;
          const tokensUsed = this.estimateTokens(extractedData);
          
          this.cacheOptimizer.set(
            fileHash,
            fileName,
            fileBuffer.length,
            extractedData,
            orderData,
            tokensUsed,
            extractionTime
          );
        }
      }
      
      // Calculate metrics
      const responseTime = Date.now() - startTime;
      const tokensUsed = cacheHit ? 0 : (extractedData ? this.estimateTokens(extractedData) : 0);
      const cost = this.performanceMonitor.calculateCost(tokensUsed, cacheHit);
      
      // Record in performance monitor
      if (this.config.monitoring.enabled) {
        this.performanceMonitor.recordRequest({
          requestId,
          fileHash,
          fileSize: fileBuffer.length,
          pagesExtracted: extractedData ? extractedData.numPages : 0,
          tokensUsed,
          responseTime,
          cacheHit,
          cost,
        });
      }
      
      if (!extractedData) {
        throw new Error('Failed to extract PDF data');
      }
      
      const result: OptimizedExtractionResult = {
        requestId,
        extractedData,
        orderData: orderData ?? undefined,
        performance: {
          responseTime,
          tokensUsed,
          cost,
          cacheHit,
          batchProcessed,
        },
        metadata: {
          fileName,
          fileSize: fileBuffer.length,
          fileHash,
          timestamp: Date.now(),
        },
      };
      
      systemLogger.info({
        requestId,
        fileName,
        responseTime,
        cacheHit,
        batchProcessed,
        tokensUsed,
        cost,
      }, '[PDFPerformanceService] PDF extraction completed');
      
      return result;
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Record failure
      if (this.config.monitoring.enabled) {
        this.performanceMonitor.recordRequest({
          requestId,
          fileHash,
          fileSize: fileBuffer.length,
          pagesExtracted: 0,
          tokensUsed: 0,
          responseTime,
          cacheHit: false,
          cost: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
      
      systemLogger.error({
        requestId,
        fileName,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, '[PDFPerformanceService] PDF extraction failed');
      
      throw error;
    }
  }
  
  /**
   * Extract multiple PDFs with optimization
   */
  public async extractMultiplePDFs(
    files: Array<{ buffer: Buffer; fileName: string }>,
    options?: {
      parallel?: boolean;
      maxConcurrency?: number;
    }
  ): Promise<OptimizedExtractionResult[]> {
    systemLogger.info({
      fileCount: files.length,
      parallel: options?.parallel,
      maxConcurrency: options?.maxConcurrency,
    }, '[PDFPerformanceService] Starting batch PDF extraction');
    
    if (options?.parallel && this.config.optimization.parallelProcessing) {
      // Parallel processing
      const concurrency = options.maxConcurrency || this.config.optimization.maxConcurrency;
      const results: OptimizedExtractionResult[] = [];
      
      // Process in chunks
      for (let i = 0; i < files.length; i += concurrency) {
        const chunk = files.slice(i, i + concurrency);
        const chunkResults = await Promise.all(
          chunk.map(file => this.extractPDF(file.buffer, file.fileName))
        );
        results.push(...chunkResults);
      }
      
      return results;
      
    } else {
      // Sequential processing
      const results: OptimizedExtractionResult[] = [];
      
      for (const file of files) {
        const result = await this.extractPDF(file.buffer, file.fileName);
        results.push(result);
      }
      
      return results;
    }
  }
  
  /**
   * Estimate tokens from extracted data
   */
  private estimateTokens(data: ExtractedPDFData): number {
    // Rough estimation: 1 token per 4 characters
    return Math.ceil(data.text.length / 4);
  }
  
  /**
   * Auto-adjust performance based on violations
   */
  private autoAdjustPerformance(event: { violations: string[] }): void {
    const violations = event.violations as string[];
    
    // Check for specific violations and adjust
    if (violations.some(v => v.includes('Response time'))) {
      // Increase batch size to process more at once
      this.requestBatcher.updateConfig({
        maxBatchSize: Math.min(10, this.config.batching.maxBatchSize + 1),
      });
      
      systemLogger.info('[PDFPerformanceService] Increased batch size due to high response time');
    }
    
    if (violations.some(v => v.includes('Cache hit rate'))) {
      // Increase cache TTL
      this.cacheOptimizer = PDFCacheOptimizer.getInstance({
        ttlSeconds: this.config.caching.ttlSeconds * 1.5,
      });
      
      systemLogger.info('[PDFPerformanceService] Increased cache TTL due to low hit rate');
    }
    
    if (violations.some(v => v.includes('Token usage'))) {
      // Enable more aggressive compression
      this.config.optimization.compressionEnabled = true;
      
      systemLogger.info('[PDFPerformanceService] Enabled compression due to high token usage');
    }
  }
  
  /**
   * Get performance report
   */
  public getPerformanceReport(): {
    monitoring: ReturnType<PDFPerformanceMonitor['getPerformanceReport']>;
    cache: ReturnType<PDFCacheOptimizer['getCacheSummary']>;
    batching: ReturnType<PDFRequestBatcher['getQueueStatus']>;
    recommendations: string[];
  } {
    const monitoringReport = this.performanceMonitor.getPerformanceReport();
    const cacheReport = this.cacheOptimizer.getCacheSummary();
    const batchingReport = this.requestBatcher.getQueueStatus();
    
    // Generate overall recommendations
    const recommendations: string[] = [];
    
    if (monitoringReport.recommendations) {
      recommendations.push(...monitoringReport.recommendations);
    }
    
    if (parseFloat(cacheReport.hitRate) < 30) {
      recommendations.push('Cache hit rate is low. Consider preloading frequently accessed PDFs.');
    }
    
    if (batchingReport.queueSize > 10) {
      recommendations.push('Large queue size detected. Consider increasing processing capacity.');
    }
    
    if (parseFloat(cacheReport.sizeMB) > 80) {
      recommendations.push('Cache size approaching limit. Consider increasing cache size or reducing TTL.');
    }
    
    return {
      monitoring: monitoringReport,
      cache: cacheReport,
      batching: batchingReport,
      recommendations,
    };
  }
  
  /**
   * Run performance benchmark
   */
  public async runBenchmark(
    testData: Buffer[],
    options?: {
      iterations?: number;
      compareWithBaseline?: boolean;
    }
  ): Promise<BenchmarkResult | ComparisonResult> {
    const iterations = options?.iterations || 10;
    
    if (options?.compareWithBaseline) {
      // Compare optimized vs non-optimized
      return this.benchmark.compareBenchmarks(
        testData,
        {
          iterations,
          warmupIterations: 2,
          concurrency: 1,
          cacheEnabled: false,
          batchingEnabled: false,
          reportFormat: 'markdown',
        },
        {
          iterations,
          warmupIterations: 2,
          concurrency: this.config.optimization.maxConcurrency,
          cacheEnabled: this.config.caching.enabled,
          batchingEnabled: this.config.batching.enabled,
          reportFormat: 'markdown',
        }
      );
    } else {
      // Run single benchmark
      return this.benchmark.runBenchmark(
        'Performance Test',
        testData,
        {
          iterations,
          warmupIterations: 2,
          concurrency: this.config.optimization.maxConcurrency,
          cacheEnabled: this.config.caching.enabled,
          batchingEnabled: this.config.batching.enabled,
          reportFormat: 'markdown',
        }
      );
    }
  }
  
  /**
   * Clear all caches and reset metrics
   */
  public clearAll(): void {
    this.cacheOptimizer.clear();
    this.performanceMonitor.resetMetrics();
    this.requestBatcher.clearQueue();
    
    systemLogger.info('[PDFPerformanceService] All caches and metrics cleared');
  }
  
  /**
   * Update configuration
   */
  public updateConfig(config: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Update component configurations
    if (config.caching) {
      this.cacheOptimizer = PDFCacheOptimizer.getInstance({
        maxSizeBytes: (config.caching.maxSizeMB || 100) * 1024 * 1024,
        ttlSeconds: config.caching.ttlSeconds || 1800,
      });
    }
    
    if (config.batching) {
      this.requestBatcher.updateConfig({
        maxBatchSize: config.batching.maxBatchSize,
        batchTimeoutMs: config.batching.batchTimeoutMs,
      });
    }
    
    if (config.monitoring?.thresholds) {
      this.performanceMonitor.updateThresholds(config.monitoring.thresholds);
    }
    
    systemLogger.info({
      config: this.config,
    }, '[PDFPerformanceService] Configuration updated');
  }
  
  /**
   * Get current configuration
   */
  public getConfig(): PerformanceConfig {
    return { ...this.config };
  }
  
  /**
   * Preload cache with frequently used PDFs
   */
  public async preloadCache(
    files: Array<{
      buffer: Buffer;
      fileName: string;
    }>
  ): Promise<void> {
    systemLogger.info({
      fileCount: files.length,
    }, '[PDFPerformanceService] Preloading cache');
    
    const entries = await Promise.all(
      files.map(async (file) => {
        const fileHash = this.cacheOptimizer.generateHash(file.buffer);
        const extractedData = await this.pdfService.extractText(file.buffer.buffer as ArrayBuffer);
        const tokensUsed = this.estimateTokens(extractedData);
        
        return {
          fileHash,
          fileName: file.fileName,
          fileSize: file.buffer.length,
          extractedData,
          orderData: null,
          tokensUsed,
        };
      })
    );
    
    await this.cacheOptimizer.preload(entries);
    
    systemLogger.info({
      loaded: entries.length,
    }, '[PDFPerformanceService] Cache preload completed');
  }
  
  /**
   * Export performance data
   */
  public exportPerformanceData(): {
    metrics: ReturnType<PDFPerformanceMonitor['exportMetrics']>;
    cache: ReturnType<PDFCacheOptimizer['getStatistics']>;
    batching: ReturnType<PDFRequestBatcher['getStatistics']>;
    config: PerformanceConfig;
    exportedAt: string;
  } {
    return {
      metrics: this.performanceMonitor.exportMetrics(),
      cache: this.cacheOptimizer.getStatistics(),
      batching: this.requestBatcher.getStatistics(),
      config: this.config,
      exportedAt: new Date().toISOString(),
    };
  }
}

// Export singleton instance getter
export const pdfPerformanceService = PDFPerformanceService.getInstance();