/**
 * PDF Performance Monitor
 * Advanced performance monitoring for PDF extraction system
 * Tracks metrics, costs, and optimizations
 */

import { EventEmitter } from 'events';
import { systemLogger } from '@/lib/logger';

export interface PerformanceMetrics {
  // Request metrics
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  
  // Cache metrics
  cacheHits: number;
  cacheMisses: number;
  cacheHitRate: number;
  cacheEvictions: number;
  cacheSizeBytes: number;
  
  // Token usage metrics
  totalTokensUsed: number;
  averageTokensPerRequest: number;
  tokensSaved: number;
  
  // Cost metrics
  totalCost: number;
  averageCostPerRequest: number;
  costSavings: number;
  
  // Resource metrics
  memoryUsageMB: number;
  cpuUsagePercent: number;
  activeConnections: number;
  queueSize: number;
  
  // Time series data
  timeSeries: TimeSeriesData[];
}

export interface TimeSeriesData {
  timestamp: number;
  requests: number;
  responseTimeMs: number;
  tokensUsed: number;
  cacheHitRate: number;
  memoryUsageMB: number;
  cpuUsagePercent: number;
}

export interface RequestMetadata {
  requestId: string;
  timestamp: number;
  fileHash: string;
  fileSize: number;
  pagesExtracted: number;
  tokensUsed: number;
  responseTime: number;
  cacheHit: boolean;
  cost: number;
  error?: string;
}

export interface PerformanceThresholds {
  maxResponseTime: number; // ms
  maxTokensPerRequest: number;
  maxMemoryUsageMB: number;
  maxCPUUsagePercent: number;
  minCacheHitRate: number;
  maxCostPerRequest: number;
}

/**
 * PDF Performance Monitor Class
 * Monitors and tracks performance metrics for PDF extraction
 */
export class PDFPerformanceMonitor extends EventEmitter {
  private static instance: PDFPerformanceMonitor;
  
  private metrics: PerformanceMetrics;
  private requestHistory: RequestMetadata[] = [];
  private timeSeries: TimeSeriesData[] = [];
  private thresholds: PerformanceThresholds;
  private monitoringInterval: NodeJS.Timeout | null = null;
  
  // Response time tracking
  private responseTimes: number[] = [];
  private maxHistorySize = 1000;
  
  // Cost calculation (OpenAI GPT-4 pricing)
  private readonly COST_PER_1K_TOKENS = {
    input: 0.01,    // $0.01 per 1K input tokens
    output: 0.03,   // $0.03 per 1K output tokens
    cached: 0.005,  // Estimated savings for cached requests
  };
  
  private constructor() {
    super();
    
    this.metrics = this.initializeMetrics();
    this.thresholds = this.getDefaultThresholds();
    
    // Start monitoring
    this.startMonitoring();
    
    systemLogger.info('[PDFPerformanceMonitor] Performance monitoring initialized');
  }
  
  public static getInstance(): PDFPerformanceMonitor {
    if (!PDFPerformanceMonitor.instance) {
      PDFPerformanceMonitor.instance = new PDFPerformanceMonitor();
    }
    return PDFPerformanceMonitor.instance;
  }
  
  /**
   * Initialize metrics
   */
  private initializeMetrics(): PerformanceMetrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      cacheHitRate: 0,
      cacheEvictions: 0,
      cacheSizeBytes: 0,
      totalTokensUsed: 0,
      averageTokensPerRequest: 0,
      tokensSaved: 0,
      totalCost: 0,
      averageCostPerRequest: 0,
      costSavings: 0,
      memoryUsageMB: 0,
      cpuUsagePercent: 0,
      activeConnections: 0,
      queueSize: 0,
      timeSeries: [],
    };
  }
  
  /**
   * Get default performance thresholds
   */
  private getDefaultThresholds(): PerformanceThresholds {
    return {
      maxResponseTime: 5000,        // 5 seconds
      maxTokensPerRequest: 10000,   // 10K tokens
      maxMemoryUsageMB: 500,         // 500MB
      maxCPUUsagePercent: 80,        // 80%
      minCacheHitRate: 0.3,          // 30% hit rate
      maxCostPerRequest: 0.5,        // $0.50 per request
    };
  }
  
  /**
   * Record a PDF extraction request
   */
  public recordRequest(metadata: Omit<RequestMetadata, 'timestamp'>): void {
    const fullMetadata: RequestMetadata = {
      ...metadata,
      timestamp: Date.now(),
    };
    
    // Update request history
    this.requestHistory.push(fullMetadata);
    if (this.requestHistory.length > this.maxHistorySize) {
      this.requestHistory.shift();
    }
    
    // Update response times
    this.responseTimes.push(metadata.responseTime);
    if (this.responseTimes.length > this.maxHistorySize) {
      this.responseTimes.shift();
    }
    
    // Update metrics
    this.updateMetrics(fullMetadata);
    
    // Check thresholds
    this.checkThresholds(fullMetadata);
    
    // Emit event
    this.emit('request', fullMetadata);
    
    systemLogger.debug({
      requestId: metadata.requestId,
      responseTime: metadata.responseTime,
      cacheHit: metadata.cacheHit,
      tokensUsed: metadata.tokensUsed,
      cost: metadata.cost,
    }, '[PDFPerformanceMonitor] Request recorded');
  }
  
  /**
   * Update metrics based on request
   */
  private updateMetrics(metadata: RequestMetadata): void {
    // Request counts
    this.metrics.totalRequests++;
    if (metadata.error) {
      this.metrics.failedRequests++;
    } else {
      this.metrics.successfulRequests++;
    }
    
    // Cache metrics
    if (metadata.cacheHit) {
      this.metrics.cacheHits++;
      this.metrics.tokensSaved += metadata.tokensUsed;
      this.metrics.costSavings += metadata.cost;
    } else {
      this.metrics.cacheMisses++;
    }
    this.metrics.cacheHitRate = this.metrics.cacheHits / this.metrics.totalRequests;
    
    // Token metrics
    this.metrics.totalTokensUsed += metadata.cacheHit ? 0 : metadata.tokensUsed;
    this.metrics.averageTokensPerRequest = 
      this.metrics.totalTokensUsed / this.metrics.successfulRequests || 0;
    
    // Cost metrics
    if (!metadata.cacheHit) {
      this.metrics.totalCost += metadata.cost;
    }
    this.metrics.averageCostPerRequest = 
      this.metrics.totalCost / this.metrics.successfulRequests || 0;
    
    // Response time metrics
    this.updateResponseTimeMetrics();
  }
  
  /**
   * Update response time percentiles
   */
  private updateResponseTimeMetrics(): void {
    if (this.responseTimes.length === 0) return;
    
    const sorted = [...this.responseTimes].sort((a, b) => a - b);
    const len = sorted.length;
    
    // Average
    this.metrics.averageResponseTime = 
      sorted.reduce((sum, time) => sum + time, 0) / len;
    
    // P95
    const p95Index = Math.floor(len * 0.95);
    this.metrics.p95ResponseTime = sorted[p95Index] || sorted[len - 1];
    
    // P99
    const p99Index = Math.floor(len * 0.99);
    this.metrics.p99ResponseTime = sorted[p99Index] || sorted[len - 1];
  }
  
  /**
   * Check performance thresholds
   */
  private checkThresholds(metadata: RequestMetadata): void {
    const violations: string[] = [];
    
    if (metadata.responseTime > this.thresholds.maxResponseTime) {
      violations.push(`Response time ${metadata.responseTime}ms exceeds threshold ${this.thresholds.maxResponseTime}ms`);
    }
    
    if (metadata.tokensUsed > this.thresholds.maxTokensPerRequest) {
      violations.push(`Token usage ${metadata.tokensUsed} exceeds threshold ${this.thresholds.maxTokensPerRequest}`);
    }
    
    if (metadata.cost > this.thresholds.maxCostPerRequest) {
      violations.push(`Cost $${metadata.cost} exceeds threshold $${this.thresholds.maxCostPerRequest}`);
    }
    
    if (this.metrics.cacheHitRate < this.thresholds.minCacheHitRate) {
      violations.push(`Cache hit rate ${(this.metrics.cacheHitRate * 100).toFixed(1)}% below threshold ${(this.thresholds.minCacheHitRate * 100)}%`);
    }
    
    if (violations.length > 0) {
      this.emit('threshold-violation', {
        requestId: metadata.requestId,
        violations,
        metadata,
      });
      
      systemLogger.warn({
        requestId: metadata.requestId,
        violations,
      }, '[PDFPerformanceMonitor] Performance threshold violations detected');
    }
  }
  
  /**
   * Start system monitoring
   */
  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, 10000); // Every 10 seconds
  }
  
  /**
   * Collect system metrics
   */
  private collectSystemMetrics(): void {
    const memUsage = process.memoryUsage();
    this.metrics.memoryUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    
    // CPU usage (approximation)
    const cpuUsage = process.cpuUsage();
    this.metrics.cpuUsagePercent = Math.min(100, Math.round(
      (cpuUsage.user + cpuUsage.system) / 1000000 / 10
    ));
    
    // Add to time series
    const dataPoint: TimeSeriesData = {
      timestamp: Date.now(),
      requests: this.metrics.totalRequests,
      responseTimeMs: this.metrics.averageResponseTime,
      tokensUsed: this.metrics.totalTokensUsed,
      cacheHitRate: this.metrics.cacheHitRate,
      memoryUsageMB: this.metrics.memoryUsageMB,
      cpuUsagePercent: this.metrics.cpuUsagePercent,
    };
    
    this.timeSeries.push(dataPoint);
    
    // Keep last hour of data
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    this.timeSeries = this.timeSeries.filter(d => d.timestamp > oneHourAgo);
    
    this.metrics.timeSeries = this.timeSeries;
  }
  
  /**
   * Calculate token cost
   */
  public calculateCost(tokensUsed: number, cached: boolean = false): number {
    if (cached) {
      return tokensUsed * this.COST_PER_1K_TOKENS.cached / 1000;
    }
    
    // Assume 70% input, 30% output for PDF extraction
    const inputTokens = tokensUsed * 0.7;
    const outputTokens = tokensUsed * 0.3;
    
    const inputCost = (inputTokens * this.COST_PER_1K_TOKENS.input) / 1000;
    const outputCost = (outputTokens * this.COST_PER_1K_TOKENS.output) / 1000;
    
    return inputCost + outputCost;
  }
  
  /**
   * Get current metrics
   */
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Get performance report
   */
  public getPerformanceReport(): {
    summary: {
      totalRequests: number;
      successRate: number;
      averageResponseTime: string;
      cacheHitRate: string;
      totalCost: string;
      costSavings: string;
      tokensSaved: number;
    };
    metrics: PerformanceMetrics;
    recommendations: string[];
  } {
    const successRate = this.metrics.successfulRequests / this.metrics.totalRequests || 0;
    
    const recommendations: string[] = [];
    
    // Generate recommendations
    if (this.metrics.cacheHitRate < 0.3) {
      recommendations.push('Cache hit rate is low. Consider increasing cache TTL or size.');
    }
    
    if (this.metrics.averageResponseTime > 3000) {
      recommendations.push('Average response time is high. Consider optimizing PDF processing or enabling parallel processing.');
    }
    
    if (this.metrics.averageTokensPerRequest > 5000) {
      recommendations.push('High token usage detected. Consider implementing text summarization or chunking strategies.');
    }
    
    if (this.metrics.memoryUsageMB > 300) {
      recommendations.push('High memory usage. Consider implementing memory cleanup or reducing cache size.');
    }
    
    if (successRate < 0.95) {
      recommendations.push('Success rate below 95%. Review error logs and implement retry mechanisms.');
    }
    
    return {
      summary: {
        totalRequests: this.metrics.totalRequests,
        successRate: successRate,
        averageResponseTime: `${this.metrics.averageResponseTime.toFixed(0)}ms`,
        cacheHitRate: `${(this.metrics.cacheHitRate * 100).toFixed(1)}%`,
        totalCost: `$${this.metrics.totalCost.toFixed(2)}`,
        costSavings: `$${this.metrics.costSavings.toFixed(2)}`,
        tokensSaved: this.metrics.tokensSaved,
      },
      metrics: this.getMetrics(),
      recommendations,
    };
  }
  
  /**
   * Reset metrics
   */
  public resetMetrics(): void {
    this.metrics = this.initializeMetrics();
    this.requestHistory = [];
    this.responseTimes = [];
    this.timeSeries = [];
    
    systemLogger.info('[PDFPerformanceMonitor] Metrics reset');
  }
  
  /**
   * Update thresholds
   */
  public updateThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
    
    systemLogger.info({
      thresholds: this.thresholds,
    }, '[PDFPerformanceMonitor] Thresholds updated');
  }
  
  /**
   * Stop monitoring
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    systemLogger.info('[PDFPerformanceMonitor] Monitoring stopped');
  }
  
  /**
   * Get request history
   */
  public getRequestHistory(limit: number = 100): RequestMetadata[] {
    return this.requestHistory.slice(-limit);
  }
  
  /**
   * Export metrics for analysis
   */
  public exportMetrics(): {
    metrics: PerformanceMetrics;
    requestHistory: RequestMetadata[];
    timeSeries: TimeSeriesData[];
    exportedAt: string;
  } {
    return {
      metrics: this.getMetrics(),
      requestHistory: this.requestHistory,
      timeSeries: this.timeSeries,
      exportedAt: new Date().toISOString(),
    };
  }
}

// Export singleton instance getter
export const pdfPerformanceMonitor = PDFPerformanceMonitor.getInstance();