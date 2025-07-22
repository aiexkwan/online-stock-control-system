/**
 * Data Access Layer Core Strategy
 * Provides flexible data fetching with automatic strategy selection
 */

// Removed React cache import to fix client component compatibility
import { isProduction } from '@/lib/utils/env';

export interface CacheConfig {
  ttl?: number; // Time to live in seconds
  revalidate?: number; // Revalidation interval
  tags?: string[]; // Cache tags for invalidation
  staleWhileRevalidate?: boolean;
}

export interface DataAccessConfig {
  strategy: 'server' | 'client' | 'auto';
  cache?: CacheConfig;
  realtime?: boolean;
  priority?: 'high' | 'normal' | 'low';
}

export interface DataAccessMetrics {
  operation: string;
  strategy: 'server' | 'client';
  duration: number;
  timestamp: number;
  success: boolean;
  dataSize?: number;
}

/**
 * Abstract base class for all data access implementations
 */
export abstract class DataAccessLayer<TParams, TResult> {
  protected operationName: string;

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
    let strategy: 'server' | 'client' | undefined;
    let result: TResult | undefined;
    let success = true;

    try {
      // Determine strategy
      if (config.strategy === 'auto') {
        strategy = await this.determineOptimalStrategy(params, config);
      } else {
        strategy = config.strategy;
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
      throw error;
    } finally {
      // Record metrics (with error handling to prevent metrics from breaking the main flow)
      try {
        const duration = performance.now() - startTime;
        if (strategy) {
          await this.recordMetrics({
            operation: this.operationName,
            strategy,
            duration,
            timestamp: Date.now(),
            success,
            dataSize: result ? JSON.stringify(result).length : 0,
          });
        }
      } catch (metricsError) {
        // Silently ignore metrics errors to prevent them from affecting the main operation
        console.warn('[DataAccess] Metrics recording failed:', metricsError);
      }
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
    if (config.realtime || this.isRealTimeRequired(params)) {
      return 'client';
    }

    // Complex query check
    if (this.isComplexQuery(params)) {
      return 'server';
    }

    // Check historical performance
    const historicalPerformance = await this.getHistoricalPerformance();
    if (historicalPerformance) {
      return historicalPerformance.optimalStrategy;
    }

    // Default to client for better UX
    return 'client';
  }

  /**
   * Override to implement real-time detection logic
   */
  protected isRealTimeRequired(params: TParams): boolean {
    return false;
  }

  /**
   * Override to implement complex query detection
   */
  protected isComplexQuery(params: TParams): boolean {
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
        fetch('/api/analytics/data-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(metrics),
        }).catch(() => {
          // Fail silently
        });
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
  }

  /**
   * Get historical performance data for strategy optimization
   */
  protected async getHistoricalPerformance(): Promise<{
    optimalStrategy: 'server' | 'client';
    avgServerTime: number;
    avgClientTime: number;
  } | null> {
    // TODO: Implement actual metrics retrieval
    // For now, return null to use default logic
    return null;
  }

  /**
   * Create a cached version of server fetch
   * Note: This method is deprecated. Use React's cache() directly in your implementation if needed.
   */
  protected createCachedServerFetch(ttl: number = 60): (params: TParams) => Promise<TResult> {
    // Return a simple wrapper function instead of using React cache
    // Consumers should implement their own caching strategy
    return async (params: TParams) => this.serverFetch(params);
  }
}

/**
 * Utility class for managing data access metrics
 */
export class DataAccessMetricsManager {
  private static instance: DataAccessMetricsManager;
  private metrics: Map<string, DataAccessMetrics[]> = new Map();

  static getInstance(): DataAccessMetricsManager {
    if (!this.instance) {
      this.instance = new DataAccessMetricsManager();
    }
    return this.instance;
  }

  record(metric: DataAccessMetrics): void {
    const key = `${metric.operation}-${metric.strategy}`;
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    const metrics = this.metrics.get(key)!;
    metrics.push(metric);

    // Keep only last 100 metrics per key
    if (metrics.length > 100) {
      metrics.shift();
    }
  }

  getStats(operation: string): {
    serverAvg: number;
    clientAvg: number;
    serverCount: number;
    clientCount: number;
  } | null {
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
  }

  clear(): void {
    this.metrics.clear();
  }
}
