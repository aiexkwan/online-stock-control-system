/**
 * Smart Cache Strategy for Widget System
 * 
 * Implements intelligent caching with:
 * - Date range aware caching
 * - Stale-while-revalidate (SWR) strategy
 * - Predictive preloading
 * - Smart TTL management
 */

import { type WidgetDataMode } from './widget-data-classification';
import { type WidgetPriority, type WidgetDataSource } from './unified-config';

/**
 * Cache configuration for a widget
 */
export interface WidgetCacheConfig {
  /** Base TTL in seconds */
  baseTTL: number;
  /** Enable stale-while-revalidate */
  enableSWR: boolean;
  /** SWR window in seconds */
  swrWindow?: number;
  /** Enable predictive preloading */
  enablePreload: boolean;
  /** Preload timing (in seconds before expiry) */
  preloadTiming?: number;
  /** Date range aware caching */
  dateRangeAware: boolean;
  /** Cache key generator */
  generateKey: (params: CacheKeyParams) => string;
}

/**
 * Parameters for generating cache keys
 */
export interface CacheKeyParams {
  widgetId: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  userId?: string;
  filters?: Record<string, string | number | boolean | Date>;
}

/**
 * Cache entry with metadata
 */
export interface CacheEntry<T = Record<string, unknown> | unknown[]> {
  data: T;
  timestamp: number;
  ttl: number;
  dateRange?: {
    from: string;
    to: string;
  };
  staleAt?: number;
  preloadAt?: number;
}

/**
 * Smart cache strategies based on widget characteristics
 */
export const CACHE_STRATEGIES = {
  // Real-time data (5s - 30s TTL)
  REALTIME: {
    baseTTL: 5,
    enableSWR: true,
    swrWindow: 10,
    enablePreload: false,
    preloadTiming: undefined,
    dateRangeAware: false,
  },
  
  // Frequently changing data (30s - 2m TTL)
  DYNAMIC: {
    baseTTL: 60,
    enableSWR: true,
    swrWindow: 30,
    enablePreload: true,
    preloadTiming: 10,
    dateRangeAware: true,
  },
  
  // Moderate change frequency (2m - 10m TTL)
  STANDARD: {
    baseTTL: 300,
    enableSWR: true,
    swrWindow: 60,
    enablePreload: true,
    preloadTiming: 30,
    dateRangeAware: true,
  },
  
  // Slowly changing data (10m - 1h TTL)
  STABLE: {
    baseTTL: 1800,
    enableSWR: true,
    swrWindow: 300,
    enablePreload: true,
    preloadTiming: 120,
    dateRangeAware: true,
  },
  
  // Static data (1h - 24h TTL)
  STATIC: {
    baseTTL: 3600,
    enableSWR: false,
    swrWindow: undefined,
    enablePreload: false,
    preloadTiming: undefined,
    dateRangeAware: false,
  },
} as const;

/**
 * Smart TTL calculator based on various factors
 */
export class SmartTTLManager {
  /**
   * Calculate dynamic TTL based on multiple factors
   */
  static calculateTTL(params: {
    baseTTL: number;
    dataSource: WidgetDataSource;
    priority: WidgetPriority;
    dateRange?: { from: Date; to: Date };
    lastAccessTime?: number;
    accessFrequency?: number;
    errorRate?: number;
  }): number {
    let ttl = params.baseTTL;
    
    // Adjust based on priority
    switch (params.priority) {
      case 'critical':
        ttl *= 0.5; // Shorter TTL for critical widgets
        break;
      case 'high':
        ttl *= 0.75;
        break;
      case 'low':
        ttl *= 1.5; // Longer TTL for low priority
        break;
    }
    
    // Adjust based on date range
    if (params.dateRange) {
      const rangeMs = params.dateRange.to.getTime() - params.dateRange.from.getTime();
      const daysInRange = rangeMs / (1000 * 60 * 60 * 24);
      
      // Historical data can have longer TTL
      const now = new Date();
      if (params.dateRange.to < now) {
        ttl *= 2; // Double TTL for historical data
      }
      
      // Longer ranges can have longer TTL
      if (daysInRange > 30) {
        ttl *= 1.5;
      }
    }
    
    // Adjust based on access patterns
    if (params.accessFrequency !== undefined) {
      // High frequency access = shorter TTL
      if (params.accessFrequency > 10) {
        ttl *= 0.8;
      } else if (params.accessFrequency < 2) {
        ttl *= 1.2;
      }
    }
    
    // Adjust based on error rate
    if (params.errorRate !== undefined && params.errorRate > 0.1) {
      // High error rate = shorter TTL to retry sooner
      ttl *= 0.5;
    }
    
    // Ensure TTL is within reasonable bounds
    return Math.max(5, Math.min(ttl, 86400)); // 5s to 24h
  }
  
  /**
   * Determine if cache should be preloaded
   */
  static shouldPreload(entry: CacheEntry, config: WidgetCacheConfig): boolean {
    if (!config.enablePreload) return false;
    
    const now = Date.now() / 1000;
    const preloadTime = entry.preloadAt || (entry.timestamp + entry.ttl - (config.preloadTiming || 30));
    
    return now >= preloadTime;
  }
  
  /**
   * Check if data is stale but still usable (SWR)
   */
  static isStaleButUsable(entry: CacheEntry, config: WidgetCacheConfig): boolean {
    if (!config.enableSWR) return false;
    
    const now = Date.now() / 1000;
    const staleTime = entry.staleAt || (entry.timestamp + entry.ttl);
    const swrEndTime = staleTime + (config.swrWindow || 60);
    
    return now >= staleTime && now < swrEndTime;
  }
}

/**
 * Date range aware cache key generator
 */
export class DateRangeCacheKeyGenerator {
  /**
   * Generate cache key with date range awareness
   */
  static generate(params: CacheKeyParams): string {
    const parts = [`widget:${params.widgetId}`];
    
    if (params.dateRange) {
      // Normalize date range to day boundaries for better cache hits
      const fromDate = new Date(params.dateRange.from);
      fromDate.setHours(0, 0, 0, 0);
      
      const toDate = new Date(params.dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      
      parts.push(`dr:${fromDate.toISOString().split('T')[0]}_${toDate.toISOString().split('T')[0]}`);
    }
    
    if (params.userId) {
      parts.push(`u:${params.userId}`);
    }
    
    if (params.filters && Object.keys(params.filters).length > 0) {
      // Sort filter keys for consistent cache keys
      const sortedFilters = Object.keys(params.filters)
        .sort()
        .map(key => `${key}:${params.filters![key]}`)
        .join(',');
      parts.push(`f:${sortedFilters}`);
    }
    
    return parts.join(':');
  }
  
  /**
   * Check if two date ranges overlap for cache invalidation
   */
  static rangesOverlap(
    range1: { from: Date; to: Date },
    range2: { from: Date; to: Date }
  ): boolean {
    return range1.from <= range2.to && range2.from <= range1.to;
  }
}

/**
 * Predictive preloader for widgets
 */
export class PredictivePreloader {
  private preloadQueue: Map<string, NodeJS.Timeout> = new Map();
  
  /**
   * Schedule predictive preload based on usage patterns
   */
  schedulePreload(
    widgetId: string,
    loadFunction: () => Promise<Record<string, unknown> | unknown[]>,
    prediction: {
      probability: number;
      timeUntilNeeded: number;
      priority: WidgetPriority;
    }
  ): void {
    // Only preload if probability is high enough
    if (prediction.probability < 0.7) return;
    
    // Adjust timing based on priority
    let preloadDelay = prediction.timeUntilNeeded;
    switch (prediction.priority) {
      case 'critical':
        preloadDelay *= 0.5; // Preload earlier
        break;
      case 'low':
        preloadDelay *= 1.5; // Preload later
        break;
    }
    
    // Cancel existing preload if any
    this.cancelPreload(widgetId);
    
    // Schedule new preload
    const timeout = setTimeout(async () => {
      try {
        await loadFunction();
        console.log(`[PredictivePreloader] Preloaded widget: ${widgetId}`);
      } catch (error) {
        console.error(`[PredictivePreloader] Failed to preload widget: ${widgetId}`, error);
      } finally {
        this.preloadQueue.delete(widgetId);
      }
    }, Math.max(0, preloadDelay * 1000));
    
    this.preloadQueue.set(widgetId, timeout);
  }
  
  /**
   * Cancel scheduled preload
   */
  cancelPreload(widgetId: string): void {
    const timeout = this.preloadQueue.get(widgetId);
    if (timeout) {
      clearTimeout(timeout);
      this.preloadQueue.delete(widgetId);
    }
  }
  
  /**
   * Clear all scheduled preloads
   */
  clearAll(): void {
    for (const timeout of this.preloadQueue.values()) {
      clearTimeout(timeout);
    }
    this.preloadQueue.clear();
  }
}

/**
 * Get recommended cache strategy for a widget
 */
export function getRecommendedCacheStrategy(
  dataSource: WidgetDataSource,
  dataMode: WidgetDataMode,
  priority: WidgetPriority
): keyof typeof CACHE_STRATEGIES {
  // Real-time widgets
  if (dataMode === 'real-time' || priority === 'critical') {
    return 'REALTIME';
  }
  
  // Write-only widgets don't need aggressive caching
  if (dataMode === 'write-only') {
    return 'STATIC';
  }
  
  // Batch and GraphQL sources can use standard caching
  if (dataSource === 'batch' || dataSource === 'graphql') {
    return priority === 'high' ? 'DYNAMIC' : 'STANDARD';
  }
  
  // Server actions might have more variable data
  if (dataSource === 'server-action') {
    return 'DYNAMIC';
  }
  
  // Default to standard caching
  return 'STANDARD';
}

/**
 * Widget-specific cache configuration factory
 */
export function createWidgetCacheConfig(
  widgetId: string,
  options: {
    dataSource: WidgetDataSource;
    dataMode: WidgetDataMode;
    priority: WidgetPriority;
    customStrategy?: Partial<WidgetCacheConfig>;
  }
): WidgetCacheConfig {
  const strategyName = getRecommendedCacheStrategy(
    options.dataSource,
    options.dataMode,
    options.priority
  );
  
  const baseStrategy = CACHE_STRATEGIES[strategyName];
  
  return {
    baseTTL: baseStrategy.baseTTL,
    enableSWR: baseStrategy.enableSWR,
    swrWindow: baseStrategy.swrWindow || 60,
    enablePreload: baseStrategy.enablePreload,
    preloadTiming: baseStrategy.preloadTiming ?? 30,
    dateRangeAware: baseStrategy.dateRangeAware,
    generateKey: (params) => DateRangeCacheKeyGenerator.generate(params),
    ...options.customStrategy,
  };
}

/**
 * Cache performance metrics
 */
export interface CacheMetrics {
  hits: number;
  misses: number;
  staleHits: number;
  preloads: number;
  errors: number;
  avgLoadTime: number;
}

/**
 * Track and report cache performance
 */
export class CachePerformanceTracker {
  private metrics: Map<string, CacheMetrics> = new Map();
  
  recordHit(widgetId: string, isStale: boolean = false): void {
    const metric = this.getOrCreateMetric(widgetId);
    metric.hits++;
    if (isStale) metric.staleHits++;
  }
  
  recordMiss(widgetId: string): void {
    const metric = this.getOrCreateMetric(widgetId);
    metric.misses++;
  }
  
  recordPreload(widgetId: string): void {
    const metric = this.getOrCreateMetric(widgetId);
    metric.preloads++;
  }
  
  recordError(widgetId: string): void {
    const metric = this.getOrCreateMetric(widgetId);
    metric.errors++;
  }
  
  recordLoadTime(widgetId: string, timeMs: number): void {
    const metric = this.getOrCreateMetric(widgetId);
    metric.avgLoadTime = (metric.avgLoadTime * (metric.hits + metric.misses - 1) + timeMs) / (metric.hits + metric.misses);
  }
  
  getMetrics(widgetId: string): CacheMetrics | undefined {
    return this.metrics.get(widgetId);
  }
  
  getAllMetrics(): Map<string, CacheMetrics> {
    return new Map(this.metrics);
  }
  
  private getOrCreateMetric(widgetId: string): CacheMetrics {
    let metric = this.metrics.get(widgetId);
    if (!metric) {
      metric = {
        hits: 0,
        misses: 0,
        staleHits: 0,
        preloads: 0,
        errors: 0,
        avgLoadTime: 0,
      };
      this.metrics.set(widgetId, metric);
    }
    return metric;
  }
}

// Export singleton instances
export const predictivePreloader = new PredictivePreloader();
export const cachePerformanceTracker = new CachePerformanceTracker();