/**
 * Supabase Client Singleton Manager
 * Provides optimized client instance management with connection pooling,
 * performance monitoring, and automatic reconnection capabilities
 */

import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database/supabase';
import {
  DatabaseQueryResult,
  DatabaseError,
  QueryOptions,
  BatchQueryItem,
  BatchQueryResult,
  DatabaseQueryFunction,
  CacheEntry,
  QueryInterceptor,
} from '../types/database-operations';

// Performance monitoring configuration
interface PerformanceMetrics {
  totalQueries: number;
  totalQueryTime: number;
  averageQueryTime: number;
  slowQueries: number;
  failedQueries: number;
  cacheHits: number;
  cacheMisses: number;
  connectionRetries: number;
  lastQueryTime?: Date;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
}

// Query cache configuration
interface QueryCacheConfig {
  enabled: boolean;
  ttlMs: number;
  maxSize: number;
  strategy: 'lru' | 'fifo';
}

// Connection configuration
interface ConnectionConfig {
  maxRetries: number;
  retryDelayMs: number;
  healthCheckIntervalMs: number;
  connectionTimeoutMs: number;
  enableAutoReconnect: boolean;
  enableQueryMetrics: boolean;
  enableQueryCache: boolean;
}

// Default configuration
const DEFAULT_CONNECTION_CONFIG: ConnectionConfig = {
  maxRetries: 3,
  retryDelayMs: 1000,
  healthCheckIntervalMs: 30000, // 30 seconds
  connectionTimeoutMs: 10000, // 10 seconds
  enableAutoReconnect: true,
  enableQueryMetrics: true,
  enableQueryCache: true,
};

const DEFAULT_CACHE_CONFIG: QueryCacheConfig = {
  enabled: true,
  ttlMs: 60000, // 1 minute cache TTL
  maxSize: 100,
  strategy: 'lru',
};

// Cache entry structure - using imported type
// interface CacheEntry is now imported from database-operations

/**
 * Enhanced Supabase Client Manager with Singleton Pattern
 * Provides connection management, query caching, and performance monitoring
 */
class SupabaseClientManager {
  private static instance: SupabaseClientManager | null = null;
  private client: SupabaseClient<Database> | null = null;
  private metrics: PerformanceMetrics;
  private queryCache: Map<string, CacheEntry>;
  private config: ConnectionConfig;
  private cacheConfig: QueryCacheConfig;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isInitialized: boolean = false;
  private reconnectAttempts: number = 0;
  private queryInterceptors: Set<QueryInterceptor> = new Set();

  private constructor(
    config: Partial<ConnectionConfig> = {},
    cacheConfig: Partial<QueryCacheConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONNECTION_CONFIG, ...config };
    this.cacheConfig = { ...DEFAULT_CACHE_CONFIG, ...cacheConfig };
    this.queryCache = new Map();
    this.metrics = this.initializeMetrics();
  }

  /**
   * Get singleton instance of the client manager
   */
  public static getInstance(
    config?: Partial<ConnectionConfig>,
    cacheConfig?: Partial<QueryCacheConfig>
  ): SupabaseClientManager {
    if (!SupabaseClientManager.instance) {
      SupabaseClientManager.instance = new SupabaseClientManager(config, cacheConfig);
    }
    return SupabaseClientManager.instance;
  }

  /**
   * Initialize performance metrics
   */
  private initializeMetrics(): PerformanceMetrics {
    return {
      totalQueries: 0,
      totalQueryTime: 0,
      averageQueryTime: 0,
      slowQueries: 0,
      failedQueries: 0,
      cacheHits: 0,
      cacheMisses: 0,
      connectionRetries: 0,
      connectionStatus: 'disconnected',
    };
  }

  /**
   * Get or create Supabase client instance
   */
  public getClient(): SupabaseClient<Database> {
    if (!this.client) {
      this.initializeClient();
    }
    return this.client!;
  }

  /**
   * Initialize Supabase client with optimized configuration
   */
  private initializeClient(): void {
    if (typeof window === 'undefined') {
      throw new Error('SupabaseClientManager should only be used on client side');
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

    // Create optimized client instance
    this.client = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
      global: {
        headers: {
          'x-client-info': 'supabase-client-manager/1.0.0',
        },
      },
      db: {
        schema: 'public',
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });

    // Setup connection monitoring
    this.setupConnectionMonitoring();

    // Start health checking if enabled
    if (this.config.enableAutoReconnect) {
      this.startHealthChecking();
    }

    this.metrics.connectionStatus = 'connected';
    this.isInitialized = true;
  }

  /**
   * Setup connection state monitoring
   */
  private setupConnectionMonitoring(): void {
    if (!this.client) return;

    // Monitor auth state changes
    this.client.auth.onAuthStateChange((event, _session) => {
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        // Clear cache on auth state changes
        this.clearCache();
      }
    });
  }

  /**
   * Execute query with caching and metrics
   */
  public async executeQuery<T = unknown>(
    queryFn: DatabaseQueryFunction<T>,
    cacheKey?: string,
    options?: QueryOptions
  ): Promise<DatabaseQueryResult<T>> {
    const startTime = performance.now();
    const client = this.getClient();

    // Check cache first
    if (cacheKey && !options?.skipCache && this.cacheConfig.enabled) {
      const cached = this.getCachedQuery<T>(cacheKey);
      if (cached) {
        this.metrics.cacheHits++;
        return { data: cached, error: null };
      }
      this.metrics.cacheMisses++;
    }

    // Execute query with retry logic
    let retries = options?.retries ?? this.config.maxRetries;
    let lastError: DatabaseError | null = null;

    while (retries >= 0) {
      try {
        const result = await queryFn(client);

        // Update metrics
        const queryTime = performance.now() - startTime;
        this.updateMetrics(queryTime, !result.error);

        if (result.error) {
          lastError = result.error;
          retries--;
          if (retries >= 0) {
            await this.delay(
              this.config.retryDelayMs * Math.pow(2, this.config.maxRetries - retries)
            );
            continue;
          }
        } else {
          // Cache successful result
          if (cacheKey && this.cacheConfig.enabled) {
            this.setCachedQuery(cacheKey, result.data, options?.ttl);
          }
          return result;
        }
      } catch (error) {
        lastError = error as any;
        retries--;
        if (retries >= 0) {
          await this.delay(
            this.config.retryDelayMs * Math.pow(2, this.config.maxRetries - retries)
          );
        }
      }
    }

    this.metrics.failedQueries++;
    return { data: null, error: lastError };
  }

  /**
   * Execute batch queries efficiently
   */
  public async executeBatch<T = unknown>(
    queries: BatchQueryItem<T>[]
  ): Promise<BatchQueryResult<T>[]> {
    const results = await Promise.all(
      queries.map(q => this.executeQuery<T>(q.queryFn, q.cacheKey, q.options))
    );
    return results.map((result, index) => ({
      success: !result.error,
      result: result,
      error: result.error || undefined,
      executionTime: undefined,
    }));
  }

  /**
   * Get cached query result
   */
  private getCachedQuery<T>(key: string): T | null {
    const entry = this.queryCache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > this.cacheConfig.ttlMs) {
      this.queryCache.delete(key);
      return null;
    }

    entry.accessCount++;
    return entry.data as T;
  }

  /**
   * Set cached query result
   */
  private setCachedQuery<T>(key: string, data: T, _ttl?: number): void {
    // Implement cache size limit with LRU eviction
    if (this.queryCache.size >= this.cacheConfig.maxSize) {
      this.evictCache();
    }

    this.queryCache.set(key, {
      data,
      timestamp: Date.now(),
      accessCount: 0,
    });
  }

  /**
   * Evict least recently used cache entries
   */
  private evictCache(): void {
    if (this.cacheConfig.strategy === 'lru') {
      // Find least recently accessed entry
      let lruKey: string | null = null;
      let minAccess = Infinity;

      const entries = Array.from(this.queryCache.entries());
      for (const [key, entry] of entries) {
        if (entry.accessCount < minAccess) {
          minAccess = entry.accessCount;
          lruKey = key;
        }
      }

      if (lruKey) {
        this.queryCache.delete(lruKey);
      }
    } else {
      // FIFO: Remove first entry
      const firstKey = this.queryCache.keys().next().value;
      if (firstKey) {
        this.queryCache.delete(firstKey);
      }
    }
  }

  /**
   * Clear all cached queries
   */
  public clearCache(): void {
    this.queryCache.clear();
  }

  /**
   * Clear specific cache entries by pattern
   */
  public clearCacheByPattern(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    const keys = Array.from(this.queryCache.keys());
    for (const key of keys) {
      if (regex.test(key)) {
        this.queryCache.delete(key);
      }
    }
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(queryTime: number, success: boolean): void {
    if (!this.config.enableQueryMetrics) return;

    this.metrics.totalQueries++;
    this.metrics.totalQueryTime += queryTime;
    this.metrics.averageQueryTime = this.metrics.totalQueryTime / this.metrics.totalQueries;
    this.metrics.lastQueryTime = new Date();

    if (queryTime > 1000) {
      this.metrics.slowQueries++;
    }

    if (!success) {
      this.metrics.failedQueries++;
    }
  }

  /**
   * Get current performance metrics
   */
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset performance metrics
   */
  public resetMetrics(): void {
    this.metrics = this.initializeMetrics();
  }

  /**
   * Start health checking
   */
  private startHealthChecking(): void {
    if (this.healthCheckInterval) return;

    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.healthCheckIntervalMs);
  }

  /**
   * Perform health check
   */
  private async performHealthCheck(): Promise<boolean> {
    if (!this.client) return false;

    try {
      const { error } = await this.client.from('data_code').select('count').limit(1).single();

      if (error) {
        this.metrics.connectionStatus = 'disconnected';
        if (this.config.enableAutoReconnect) {
          await this.reconnect();
        }
        return false;
      }

      this.metrics.connectionStatus = 'connected';
      this.reconnectAttempts = 0;
      return true;
    } catch {
      this.metrics.connectionStatus = 'disconnected';
      if (this.config.enableAutoReconnect) {
        await this.reconnect();
      }
      return false;
    }
  }

  /**
   * Reconnect to Supabase
   */
  private async reconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.config.maxRetries) {
      console.error('[SupabaseClientManager] Max reconnection attempts reached');
      return;
    }

    this.metrics.connectionStatus = 'reconnecting';
    this.reconnectAttempts++;
    this.metrics.connectionRetries++;

    await this.delay(this.config.retryDelayMs * Math.pow(2, this.reconnectAttempts));

    try {
      this.initializeClient();
      console.info('[SupabaseClientManager] Reconnected successfully');
    } catch (error) {
      console.error('[SupabaseClientManager] Reconnection failed:', error);
    }
  }

  /**
   * Stop health checking
   */
  public stopHealthChecking(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Add query interceptor for monitoring
   */
  public addQueryInterceptor(interceptor: QueryInterceptor): void {
    this.queryInterceptors.add(interceptor);
  }

  /**
   * Remove query interceptor
   */
  public removeQueryInterceptor(interceptor: QueryInterceptor): void {
    this.queryInterceptors.delete(interceptor);
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Dispose of the client manager
   */
  public dispose(): void {
    this.stopHealthChecking();
    this.clearCache();
    this.queryInterceptors.clear();
    this.client = null;
    this.isInitialized = false;
    SupabaseClientManager.instance = null;
  }
}

// Export singleton instance getter
export const getSupabaseClient = (
  config?: Partial<ConnectionConfig>,
  cacheConfig?: Partial<QueryCacheConfig>
): SupabaseClientManager => {
  return SupabaseClientManager.getInstance(config, cacheConfig);
};

// Export types
export type { PerformanceMetrics, QueryCacheConfig, ConnectionConfig };

// Export default instance for backward compatibility
export default SupabaseClientManager.getInstance();
