/**
 * PDF Request Batcher
 * Implements request batching, rate limiting, and queue management
 */

import { EventEmitter } from 'events';
import { systemLogger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

export interface BatchRequest {
  id: string;
  fileBuffer: Buffer;
  fileName: string;
  fileHash: string;
  priority: 'high' | 'normal' | 'low';
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  callback: (result: Record<string, unknown> | null, error?: Error) => void;
}

export interface BatchConfig {
  maxBatchSize: number;
  batchTimeoutMs: number;
  maxQueueSize: number;
  maxConcurrentBatches: number;
  rateLimit: {
    requestsPerSecond: number;
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
  retryConfig: {
    maxRetries: number;
    retryDelayMs: number;
    backoffMultiplier: number;
  };
}

export interface BatchStatistics {
  totalRequests: number;
  processedRequests: number;
  failedRequests: number;
  retriedRequests: number;
  queuedRequests: number;
  activeBatches: number;
  averageBatchSize: number;
  averageWaitTime: number;
  rateLimitHits: number;
}

/**
 * Request Queue with priority support
 */
class PriorityQueue<T> {
  private high: T[] = [];
  private normal: T[] = [];
  private low: T[] = [];

  enqueue(item: T, priority: 'high' | 'normal' | 'low'): void {
    switch (priority) {
      case 'high':
        this.high.push(item);
        break;
      case 'normal':
        this.normal.push(item);
        break;
      case 'low':
        this.low.push(item);
        break;
    }
  }

  dequeue(): T | undefined {
    if (this.high.length > 0) return this.high.shift();
    if (this.normal.length > 0) return this.normal.shift();
    if (this.low.length > 0) return this.low.shift();
    return undefined;
  }

  size(): number {
    return this.high.length + this.normal.length + this.low.length;
  }

  clear(): void {
    this.high = [];
    this.normal = [];
    this.low = [];
  }

  peekAll(): T[] {
    return [...this.high, ...this.normal, ...this.low];
  }
}

/**
 * Rate Limiter implementation
 */
class RateLimiter {
  private requestTimestamps: number[] = [];
  private tokenUsage: Array<{ timestamp: number; tokens: number }> = [];
  private config: BatchConfig['rateLimit'];

  constructor(config: BatchConfig['rateLimit']) {
    this.config = config;
  }

  canMakeRequest(): boolean {
    const now = Date.now();

    // Check requests per second
    const oneSecondAgo = now - 1000;
    const recentRequestsPerSec = this.requestTimestamps.filter(t => t > oneSecondAgo).length;
    if (recentRequestsPerSec >= this.config.requestsPerSecond) {
      return false;
    }

    // Check requests per minute
    const oneMinuteAgo = now - 60000;
    const recentRequestsPerMin = this.requestTimestamps.filter(t => t > oneMinuteAgo).length;
    if (recentRequestsPerMin >= this.config.requestsPerMinute) {
      return false;
    }

    return true;
  }

  canUseTokens(tokens: number): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    const recentTokens = this.tokenUsage
      .filter(u => u.timestamp > oneMinuteAgo)
      .reduce((sum, u) => sum + u.tokens, 0);

    return recentTokens + tokens <= this.config.tokensPerMinute;
  }

  recordRequest(): void {
    this.requestTimestamps.push(Date.now());

    // Clean old timestamps
    const oneMinuteAgo = Date.now() - 60000;
    this.requestTimestamps = this.requestTimestamps.filter(t => t > oneMinuteAgo);
  }

  recordTokenUsage(tokens: number): void {
    this.tokenUsage.push({ timestamp: Date.now(), tokens });

    // Clean old usage
    const oneMinuteAgo = Date.now() - 60000;
    this.tokenUsage = this.tokenUsage.filter(u => u.timestamp > oneMinuteAgo);
  }

  getTimeUntilNextRequest(): number {
    const now = Date.now();
    const oneSecondAgo = now - 1000;
    const recentRequests = this.requestTimestamps.filter(t => t > oneSecondAgo);

    if (recentRequests.length >= this.config.requestsPerSecond) {
      const oldestRecent = Math.min(...recentRequests);
      return 1000 - (now - oldestRecent);
    }

    return 0;
  }
}

/**
 * PDF Request Batcher Class
 * Manages batching, queuing, and rate limiting of PDF requests
 */
export class PDFRequestBatcher extends EventEmitter {
  private static instance: PDFRequestBatcher;

  private queue: PriorityQueue<BatchRequest> = new PriorityQueue();
  private activeBatches: Map<string, BatchRequest[]> = new Map();
  private config: BatchConfig;
  private rateLimiter: RateLimiter;
  private statistics: BatchStatistics;
  private batchTimer: NodeJS.Timeout | null = null;
  private processingInterval: NodeJS.Timeout | null = null;

  // Request tracking
  private requestWaitTimes: number[] = [];
  private batchSizes: number[] = [];

  private constructor(config?: Partial<BatchConfig>) {
    super();

    this.config = {
      maxBatchSize: 5,
      batchTimeoutMs: 2000,
      maxQueueSize: 100,
      maxConcurrentBatches: 3,
      rateLimit: {
        requestsPerSecond: 10,
        requestsPerMinute: 300,
        tokensPerMinute: 50000,
      },
      retryConfig: {
        maxRetries: 3,
        retryDelayMs: 1000,
        backoffMultiplier: 2,
      },
      ...config,
    };

    this.rateLimiter = new RateLimiter(this.config.rateLimit);
    this.statistics = this.initializeStatistics();

    // Start processing loop
    this.startProcessingLoop();

    systemLogger.info(
      {
        config: this.config,
      },
      '[PDFRequestBatcher] Request batcher initialized'
    );
  }

  public static getInstance(config?: Partial<BatchConfig>): PDFRequestBatcher {
    if (!PDFRequestBatcher.instance) {
      PDFRequestBatcher.instance = new PDFRequestBatcher(config);
    }
    return PDFRequestBatcher.instance;
  }

  /**
   * Initialize statistics
   */
  private initializeStatistics(): BatchStatistics {
    return {
      totalRequests: 0,
      processedRequests: 0,
      failedRequests: 0,
      retriedRequests: 0,
      queuedRequests: 0,
      activeBatches: 0,
      averageBatchSize: 0,
      averageWaitTime: 0,
      rateLimitHits: 0,
    };
  }

  /**
   * Add request to queue
   */
  public async addRequest(
    fileBuffer: Buffer,
    fileName: string,
    fileHash: string,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      // Check queue size
      if (this.queue.size() >= this.config.maxQueueSize) {
        reject(new Error('Request queue is full'));
        return;
      }

      const request: BatchRequest = {
        id: uuidv4(),
        fileBuffer,
        fileName,
        fileHash,
        priority,
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: this.config.retryConfig.maxRetries,
        callback: (result, error) => {
          if (error) {
            reject(error);
          } else {
            resolve(result || {});
          }
        },
      };

      this.queue.enqueue(request, priority);
      this.statistics.totalRequests++;
      this.statistics.queuedRequests = this.queue.size();

      systemLogger.debug(
        {
          requestId: request.id,
          fileName,
          priority,
          queueSize: this.queue.size(),
        },
        '[PDFRequestBatcher] Request queued'
      );

      this.emit('request-queued', request);

      // Start batch timer if not running
      this.startBatchTimer();
    });
  }

  /**
   * Start batch timer
   */
  private startBatchTimer(): void {
    if (this.batchTimer) return;

    this.batchTimer = setTimeout(() => {
      this.processBatch();
      this.batchTimer = null;
    }, this.config.batchTimeoutMs);
  }

  /**
   * Start processing loop
   */
  private startProcessingLoop(): void {
    this.processingInterval = setInterval(() => {
      this.checkAndProcessBatches();
    }, 100); // Check every 100ms
  }

  /**
   * Check and process batches
   */
  private checkAndProcessBatches(): void {
    // Check if we can process more batches
    if (this.activeBatches.size >= this.config.maxConcurrentBatches) {
      return;
    }

    // Check if we have requests to process
    if (this.queue.size() === 0) {
      return;
    }

    // Check rate limits
    if (!this.rateLimiter.canMakeRequest()) {
      this.statistics.rateLimitHits++;
      return;
    }

    // Process a batch
    this.processBatch();
  }

  /**
   * Process a batch of requests
   */
  private async processBatch(): Promise<void> {
    const batch: BatchRequest[] = [];
    const batchId = uuidv4();

    // Collect requests for batch
    while (batch.length < this.config.maxBatchSize && this.queue.size() > 0) {
      const request = this.queue.dequeue();
      if (request) {
        batch.push(request);

        // Track wait time
        const waitTime = Date.now() - request.timestamp;
        this.requestWaitTimes.push(waitTime);
      }
    }

    if (batch.length === 0) return;

    // Track batch size
    this.batchSizes.push(batch.length);
    this.updateAverages();

    // Store active batch
    this.activeBatches.set(batchId, batch);
    this.statistics.activeBatches = this.activeBatches.size;
    this.statistics.queuedRequests = this.queue.size();

    // Record rate limit
    this.rateLimiter.recordRequest();

    systemLogger.info(
      {
        batchId,
        batchSize: batch.length,
        priorities: batch.map(r => r.priority),
        queueRemaining: this.queue.size(),
      },
      '[PDFRequestBatcher] Processing batch'
    );

    this.emit('batch-started', { batchId, requests: batch });

    try {
      // Process batch (this would be your actual processing logic)
      const results = await this.executeBatch(batch);

      // Handle results
      batch.forEach((request, index) => {
        const result = results[index];
        if (result.error) {
          this.handleFailedRequest(request, result.error);
        } else {
          request.callback(result.data);
          this.statistics.processedRequests++;
        }
      });

      this.emit('batch-completed', { batchId, results });
    } catch (error) {
      // Handle batch failure
      systemLogger.error(
        {
          batchId,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        '[PDFRequestBatcher] Batch processing failed'
      );

      // Retry individual requests
      batch.forEach(request => {
        this.handleFailedRequest(request, error as Error);
      });

      this.emit('batch-failed', { batchId, error });
    } finally {
      // Clean up
      this.activeBatches.delete(batchId);
      this.statistics.activeBatches = this.activeBatches.size;
    }
  }

  /**
   * Execute batch (placeholder for actual processing)
   */
  private async executeBatch(
    batch: BatchRequest[]
  ): Promise<Array<{ data: Record<string, unknown> | null; error: Error | null }>> {
    // This is where you would implement actual batch processing
    // For now, we'll simulate processing

    const results = await Promise.all(
      batch.map(async request => {
        try {
          // Simulate processing delay
          await new Promise(resolve => setTimeout(resolve, 100));

          // Simulate token usage
          const estimatedTokens = Math.ceil(request.fileBuffer.length / 4);
          this.rateLimiter.recordTokenUsage(estimatedTokens);

          // Return simulated result
          return {
            data: {
              requestId: request.id,
              fileName: request.fileName,
              fileHash: request.fileHash,
              processed: true,
              timestamp: Date.now(),
            },
            error: null,
          };
        } catch (error) {
          return {
            data: null,
            error: error as Error,
          };
        }
      })
    );

    return results;
  }

  /**
   * Handle failed request with retry
   */
  private handleFailedRequest(request: BatchRequest, error: Error): void {
    request.retryCount++;

    if (request.retryCount <= request.maxRetries) {
      // Calculate retry delay with exponential backoff
      const delay =
        this.config.retryConfig.retryDelayMs *
        Math.pow(this.config.retryConfig.backoffMultiplier, request.retryCount - 1);

      systemLogger.warn(
        {
          requestId: request.id,
          fileName: request.fileName,
          retryCount: request.retryCount,
          maxRetries: request.maxRetries,
          retryDelay: delay,
          error: error.message,
        },
        '[PDFRequestBatcher] Retrying failed request'
      );

      this.statistics.retriedRequests++;

      // Re-queue with delay
      setTimeout(() => {
        this.queue.enqueue(request, 'high'); // Prioritize retries
        this.statistics.queuedRequests = this.queue.size();
      }, delay);
    } else {
      // Max retries exceeded
      systemLogger.error(
        {
          requestId: request.id,
          fileName: request.fileName,
          retryCount: request.retryCount,
          error: error.message,
        },
        '[PDFRequestBatcher] Request failed after max retries'
      );

      this.statistics.failedRequests++;
      request.callback(null, error);

      this.emit('request-failed', { request, error });
    }
  }

  /**
   * Update averages
   */
  private updateAverages(): void {
    // Update average batch size
    if (this.batchSizes.length > 0) {
      const sum = this.batchSizes.reduce((a, b) => a + b, 0);
      this.statistics.averageBatchSize = sum / this.batchSizes.length;

      // Keep only last 100 sizes
      if (this.batchSizes.length > 100) {
        this.batchSizes = this.batchSizes.slice(-100);
      }
    }

    // Update average wait time
    if (this.requestWaitTimes.length > 0) {
      const sum = this.requestWaitTimes.reduce((a, b) => a + b, 0);
      this.statistics.averageWaitTime = sum / this.requestWaitTimes.length;

      // Keep only last 100 times
      if (this.requestWaitTimes.length > 100) {
        this.requestWaitTimes = this.requestWaitTimes.slice(-100);
      }
    }
  }

  /**
   * Get statistics
   */
  public getStatistics(): BatchStatistics {
    return { ...this.statistics };
  }

  /**
   * Get queue status
   */
  public getQueueStatus(): {
    queueSize: number;
    activeBatches: number;
    canAcceptRequests: boolean;
    timeUntilNextRequest: number;
    priorities: {
      high: number;
      normal: number;
      low: number;
    };
  } {
    const allRequests = this.queue.peekAll();
    const priorities = {
      high: allRequests.filter(r => r.priority === 'high').length,
      normal: allRequests.filter(r => r.priority === 'normal').length,
      low: allRequests.filter(r => r.priority === 'low').length,
    };

    return {
      queueSize: this.queue.size(),
      activeBatches: this.activeBatches.size,
      canAcceptRequests: this.queue.size() < this.config.maxQueueSize,
      timeUntilNextRequest: this.rateLimiter.getTimeUntilNextRequest(),
      priorities,
    };
  }

  /**
   * Clear queue
   */
  public clearQueue(): void {
    const queueSize = this.queue.size();

    // Reject all queued requests
    const allRequests = this.queue.peekAll();
    allRequests.forEach(request => {
      request.callback(null, new Error('Queue cleared'));
    });

    this.queue.clear();
    this.statistics.queuedRequests = 0;

    systemLogger.info(
      {
        clearedRequests: queueSize,
      },
      '[PDFRequestBatcher] Queue cleared'
    );
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<BatchConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.rateLimit) {
      this.rateLimiter = new RateLimiter(this.config.rateLimit);
    }

    systemLogger.info(
      {
        config: this.config,
      },
      '[PDFRequestBatcher] Configuration updated'
    );
  }

  /**
   * Shutdown batcher
   */
  public shutdown(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    this.clearQueue();

    systemLogger.info('[PDFRequestBatcher] Request batcher shutdown');
  }
}

// Export singleton instance getter
export const pdfRequestBatcher = PDFRequestBatcher.getInstance();
