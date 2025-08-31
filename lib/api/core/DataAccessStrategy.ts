/**
 * Data Access Layer Core Strategy
 * Provides flexible data fetching with automatic strategy selection
 */

// Removed React cache import to fix client component compatibility
import { isProduction } from '../../utils/env';

// Type constraints for better type safety
export type DataAccessParams = Record<string, unknown>;
export type DataAccessResult = Record<string, unknown> | unknown[];

export interface CacheConfig {
  ttl?: number; // Time to live in seconds
  revalidate?: number; // Revalidation interval
  tags?: string[]; // Cache tags for invalidation
  staleWhileRevalidate?: boolean;
}

export type DataAccessStrategy = 'server' | 'client' | 'auto';
export type DataAccessPriority = 'high' | 'normal' | 'low';

export interface DataAccessConfig {
  strategy: DataAccessStrategy;
  cache?: CacheConfig;
  realtime?: boolean;
  priority?: DataAccessPriority;
}

export interface DataAccessMetrics {
  operation: string;
  strategy: 'server' | 'client';
  duration: number;
  timestamp: number;
  success: boolean;
  dataSize?: number;
}

export interface HistoricalPerformance {
  optimalStrategy: 'server' | 'client';
  avgServerTime: number;
  avgClientTime: number;
}

export interface DataAccessError extends Error {
  strategy?: 'server' | 'client';
  operation?: string;
  originalError?: unknown;
}

/**
 * Abstract base class for all data access implementations
 */
export abstract class DataAccessLayer<
  TParams extends DataAccessParams = DataAccessParams,
  TResult extends DataAccessResult = DataAccessResult,
> {
  protected readonly operationName: string;

  constructor(operationName: string) {
    this.operationName = operationName;
  }

  /**
   * Server-side fetch implementation (Server Actions, GraphQL, etc.)
   */
  abstract serverFetch(params: TParams): Promise<TResult>;

  /**
   * Client-side fetch implementation (REST API, SWR, etc.)
   */
  abstract clientFetch(params: TParams): Promise<TResult>;

  /**
   * Main fetch method with strategy routing
   */
  async fetch(params: TParams, config: DataAccessConfig = { strategy: 'auto' }): Promise<TResult> {
    const startTime = performance.now();
    let strategy: 'server' | 'client' = 'client'; // Default fallback strategy
    let result: TResult;
    let success = true;

    try {
      // Determine strategy
      if (config.strategy === 'auto') {
        strategy = await this.determineOptimalStrategy(params, config);
      } else if (config.strategy === 'server' || config.strategy === 'client') {
        strategy = config.strategy;
      } else {
        strategy = 'client'; // fallback
      }

      // Execute fetch based on strategy
      if (strategy === 'server') {
        result = await this.serverFetch(params);
      } else {
        result = await this.clientFetch(params);
      }

      return result;
    } catch (error) {
      success = false;
      // Create enhanced error with context
      const enhancedError = this.createEnhancedError(error, strategy);
      throw enhancedError;
    } finally {
      // Record metrics (with error handling to prevent metrics from breaking the main flow)
      try {
        const duration = performance.now() - startTime;
        await this.recordMetrics({
          operation: this.operationName,
          strategy,
          duration,
          timestamp: Date.now(),
          success,
          dataSize: result! ? this.calculateDataSize(result!) : 0,
        });
      } catch (metricsError) {
        // Silently ignore metrics errors to prevent them from affecting the main operation
        console.warn('[DataAccess] Metrics recording failed:', metricsError);
      }
    }
  }

  /**
   * Create enhanced error with additional context
   */
  private createEnhancedError(error: unknown, strategy?: 'server' | 'client'): DataAccessError {
    const enhancedError = new Error(
      error instanceof Error ? error.message : 'Unknown data access error'
    ) as DataAccessError;

    enhancedError.name = 'DataAccessError';
    enhancedError.strategy = strategy;
    enhancedError.operation = this.operationName;
    enhancedError.originalError = error;

    return enhancedError;
  }

  /**
   * Calculate data size safely
   */
  private calculateDataSize(data: TResult): number {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }

  /**
   * Determine optimal strategy based on various factors
   */
  protected async determineOptimalStrategy(
    params: TParams,
    config: DataAccessConfig
  ): Promise<'server' | 'client'> {
    // Server-side rendering check
    if (typeof window === 'undefined') {
      return 'server';
    }

    // Real-time requirement check
    if (config.realtime === true || this.isRealTimeRequired(params)) {
      return 'client';
    }

    // Complex query check
    if (this.isComplexQuery(params)) {
      return 'server';
    }

    // Priority-based routing
    if (config.priority === 'high') {
      return 'server'; // Use server for high-priority requests
    }

    // Check historical performance
    try {
      const historicalPerformance = await this.getHistoricalPerformance();
      if (historicalPerformance) {
        return historicalPerformance.optimalStrategy;
      }
    } catch (error) {
      // Log but don't fail on performance check errors
      console.warn('[DataAccess] Historical performance check failed:', error);
    }

    // Default to client for better UX
    return 'client';
  }

  /**
   * Override to implement real-time detection logic
   */
  protected isRealTimeRequired(_params: TParams): boolean {
    return false;
  }

  /**
   * Override to implement complex query detection
   */
  protected isComplexQuery(_params: TParams): boolean {
    return false;
  }

  /**
   * Record performance metrics
   */
  protected async recordMetrics(metrics: DataAccessMetrics): Promise<void> {
    if (typeof window !== 'undefined') {
      // Client-side: Send to analytics API
      // Only send metrics in production to avoid unnecessary 404s in development
      if (isProduction()) {
        try {
          await fetch('/api/analytics/data-access', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(metrics),
          });
        } catch {
          // Fail silently in production
        }
      } else {
        // Development: Log to console instead
        console.log('[DataAccess Metrics]', {
          operation: metrics.operation,
          strategy: metrics.strategy,
          duration: `${metrics.duration.toFixed(2)}ms`,
          success: metrics.success,
          dataSize: metrics.dataSize ? `${metrics.dataSize} bytes` : 'unknown',
        });
      }
    } else {
      // Server-side: Log to monitoring service
      console.log('[DataAccess Metrics]', metrics);
    }

    // Also record to singleton manager for historical analysis
    try {
      DataAccessMetricsManager.getInstance().record(metrics);
    } catch (error) {
      console.warn('[DataAccess] Failed to record metrics to manager:', error);
    }
  }

  /**
   * Get historical performance data for strategy optimization
   */
  protected async getHistoricalPerformance(): Promise<HistoricalPerformance | null> {
    try {
      const stats = DataAccessMetricsManager.getInstance().getStats(this.operationName);
      if (stats && (stats.serverCount > 0 || stats.clientCount > 0)) {
        // Prefer strategy with better average performance
        const optimalStrategy =
          stats.serverAvg > 0 && stats.clientAvg > 0
            ? stats.serverAvg < stats.clientAvg
              ? 'server'
              : 'client'
            : stats.serverCount > 0
              ? 'server'
              : 'client';

        return {
          optimalStrategy,
          avgServerTime: stats.serverAvg,
          avgClientTime: stats.clientAvg,
        };
      }
    } catch (error) {
      console.warn('[DataAccess] Failed to get historical performance:', error);
    }

    return null;
  }

  /**
   * Create a cached version of server fetch
   * Note: This method is deprecated. Use React's cache() directly in your implementation if needed.
   */
  protected createCachedServerFetch(_ttl: number = 60): (params: TParams) => Promise<TResult> {
    // Return a simple wrapper function instead of using React cache
    // Consumers should implement their own caching strategy
    return async (params: TParams) => this.serverFetch(params);
  }
}

/**
 * Performance statistics for a specific operation
 */
export interface PerformanceStats {
  serverAvg: number;
  clientAvg: number;
  serverCount: number;
  clientCount: number;
}

/**
 * Utility class for managing data access metrics
 */
export class DataAccessMetricsManager {
  private static instance: DataAccessMetricsManager | undefined;
  private readonly metrics: Map<string, DataAccessMetrics[]> = new Map();
  private readonly MAX_METRICS_PER_KEY = 100;

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): DataAccessMetricsManager {
    if (!DataAccessMetricsManager.instance) {
      DataAccessMetricsManager.instance = new DataAccessMetricsManager();
    }
    return DataAccessMetricsManager.instance;
  }

  /**
   * Record a performance metric
   */
  record(metric: DataAccessMetrics): void {
    try {
      const key = `${metric.operation}-${metric.strategy}`;
      if (!this.metrics.has(key)) {
        this.metrics.set(key, []);
      }

      const metrics = this.metrics.get(key)!;
      metrics.push(metric);

      // Keep only last MAX_METRICS_PER_KEY metrics per key
      if (metrics.length > this.MAX_METRICS_PER_KEY) {
        metrics.shift();
      }
    } catch (error) {
      console.warn('[MetricsManager] Failed to record metric:', error);
    }
  }

  /**
   * Get performance statistics for an operation
   */
  getStats(operation: string): PerformanceStats | null {
    try {
      const serverKey = `${operation}-server`;
      const clientKey = `${operation}-client`;

      const serverMetrics = this.metrics.get(serverKey) || [];
      const clientMetrics = this.metrics.get(clientKey) || [];

      if (serverMetrics.length === 0 && clientMetrics.length === 0) {
        return null;
      }

      const serverAvg =
        serverMetrics.length > 0
          ? serverMetrics.reduce((sum, m) => sum + m.duration, 0) / serverMetrics.length
          : 0;

      const clientAvg =
        clientMetrics.length > 0
          ? clientMetrics.reduce((sum, m) => sum + m.duration, 0) / clientMetrics.length
          : 0;

      return {
        serverAvg,
        clientAvg,
        serverCount: serverMetrics.length,
        clientCount: clientMetrics.length,
      };
    } catch (error) {
      console.warn('[MetricsManager] Failed to get stats:', error);
      return null;
    }
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    try {
      this.metrics.clear();
    } catch (error) {
      console.warn('[MetricsManager] Failed to clear metrics:', error);
    }
  }

  /**
   * Get all recorded metrics for debugging
   */
  getAllMetrics(): ReadonlyMap<string, readonly DataAccessMetrics[]> {
    const result = new Map<string, readonly DataAccessMetrics[]>();
    this.metrics.forEach((value, key) => {
      result.set(key, [...value]); // Create immutable copy
    });
    return result;
  }
}
