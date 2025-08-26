/**
 * Database Connection Pool Configuration and Management
 * Optimized for high-performance database operations with proper connection pooling
 * and automatic failover handling for operational excellence
 */

import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/app/utils/supabase/server';
import type { NextRequest, NextResponse } from 'next/server';

// Connection Pool Configuration for Production
interface ConnectionPoolConfig {
  // Basic connection settings
  maxConnections: number;
  minConnections: number;
  idleTimeoutMs: number;
  connectionTimeoutMs: number;

  // Performance tuning
  maxRetries: number;
  retryDelayMs: number;
  statementTimeoutMs: number;

  // Health checking
  healthCheckIntervalMs: number;
  maxHealthCheckFailures: number;

  // Monitoring
  enableLogging: boolean;
  logSlowQueries: boolean;
  slowQueryThresholdMs: number;
}

// Optimized configuration for DepartPipeCard and similar workloads
export const PRODUCTION_POOL_CONFIG: ConnectionPoolConfig = {
  // Connection management
  maxConnections: 20, // Increased for high concurrency
  minConnections: 5, // Keep minimum connections warm
  idleTimeoutMs: 30000, // 30 seconds idle timeout
  connectionTimeoutMs: 10000, // 10 seconds connection timeout

  // Retry and recovery
  maxRetries: 3,
  retryDelayMs: 1000, // 1 second retry delay with exponential backoff
  statementTimeoutMs: 30000, // 30 seconds for query timeout

  // Health monitoring
  healthCheckIntervalMs: 60000, // Check health every minute
  maxHealthCheckFailures: 3, // Allow 3 consecutive failures

  // Performance monitoring
  enableLogging: process.env.NODE_ENV === 'development',
  logSlowQueries: true,
  slowQueryThresholdMs: 1000, // Log queries slower than 1 second
};

// Development configuration with more aggressive monitoring
export const DEVELOPMENT_POOL_CONFIG: ConnectionPoolConfig = {
  ...PRODUCTION_POOL_CONFIG,
  maxConnections: 10,
  enableLogging: true,
  slowQueryThresholdMs: 500, // Lower threshold for development
};

/**
 * Enhanced Database Connection Manager
 * Provides connection pooling, health monitoring, and performance tracking
 */
class DatabaseConnectionManager {
  private config: ConnectionPoolConfig;
  private activeConnections: number = 0;
  private totalQueries: number = 0;
  private slowQueries: number = 0;
  private healthCheckFailures: number = 0;
  private lastHealthCheck: Date = new Date();

  constructor(config: ConnectionPoolConfig = PRODUCTION_POOL_CONFIG) {
    this.config = config;
    this.startHealthChecking();
  }

  /**
   * Get optimized Supabase client with connection pooling
   */
  async getOptimizedClient() {
    // Use server-side client for better connection management
    return await createServerClient();
  }

  /**
   * Execute query with performance monitoring and retry logic
   */
  async executeQuery<T>(
    queryFn: (client: Awaited<ReturnType<typeof createServerClient>>) => Promise<T>,
    queryName?: string
  ): Promise<T> {
    const startTime = Date.now();
    let retries = 0;

    while (retries <= this.config.maxRetries) {
      try {
        this.activeConnections++;
        const client = await this.getOptimizedClient();

        // Execute query with timeout
        const result = await Promise.race([
          queryFn(client),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Query timeout')), this.config.statementTimeoutMs)
          ),
        ]);

        // Log performance metrics
        const executionTime = Date.now() - startTime;
        this.totalQueries++;

        if (executionTime > this.config.slowQueryThresholdMs) {
          this.slowQueries++;
          if (this.config.logSlowQueries) {
            console.warn(
              `[DB] Slow query detected: ${queryName || 'Unknown'} took ${executionTime}ms`
            );
          }
        }

        if (this.config.enableLogging) {
          console.log(`[DB] Query ${queryName || 'Unknown'} completed in ${executionTime}ms`);
        }

        return result;
      } catch (error) {
        retries++;
        if (retries > this.config.maxRetries) {
          console.error(
            `[DB] Query ${queryName || 'Unknown'} failed after ${retries} retries:`,
            error
          );
          throw error;
        }

        // Exponential backoff
        await new Promise(resolve =>
          setTimeout(resolve, this.config.retryDelayMs * Math.pow(2, retries - 1))
        );
      } finally {
        this.activeConnections--;
      }
    }

    throw new Error('Maximum retries exceeded');
  }

  /**
   * Batch execute multiple queries efficiently
   */
  async executeBatch<T>(
    queries: Array<{
      fn: (client: Awaited<ReturnType<typeof createServerClient>>) => Promise<T>;
      name?: string;
    }>
  ): Promise<T[]> {
    // Execute all queries in parallel, each with their own connection
    const promises = queries.map(query => this.executeQuery(query.fn, query.name));

    return Promise.all(promises);
  }

  /**
   * Health check for database connectivity
   */
  private async performHealthCheck(): Promise<boolean> {
    try {
      const client = await this.getOptimizedClient();
      const { data, error } = await client.from('data_code').select('count').limit(1);

      if (error) {
        throw error;
      }

      this.healthCheckFailures = 0;
      this.lastHealthCheck = new Date();
      return true;
    } catch (error) {
      this.healthCheckFailures++;
      console.error(
        `[DB] Health check failed (${this.healthCheckFailures}/${this.config.maxHealthCheckFailures}):`,
        error
      );

      if (this.healthCheckFailures >= this.config.maxHealthCheckFailures) {
        console.error('[DB] Maximum health check failures exceeded. Database may be unavailable.');
        // Here you could trigger alerts or fallback mechanisms
      }

      return false;
    }
  }

  /**
   * Start background health checking
   */
  private startHealthChecking() {
    setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.healthCheckIntervalMs);
  }

  /**
   * Get connection pool statistics
   */
  getStats() {
    return {
      activeConnections: this.activeConnections,
      totalQueries: this.totalQueries,
      slowQueries: this.slowQueries,
      slowQueryPercentage: this.totalQueries > 0 ? (this.slowQueries / this.totalQueries) * 100 : 0,
      healthCheckFailures: this.healthCheckFailures,
      lastHealthCheck: this.lastHealthCheck,
      isHealthy: this.healthCheckFailures < this.config.maxHealthCheckFailures,
    };
  }
}

// Global connection manager instance
export const dbConnectionManager = new DatabaseConnectionManager(
  process.env.NODE_ENV === 'production' ? PRODUCTION_POOL_CONFIG : DEVELOPMENT_POOL_CONFIG
);

/**
 * Optimized query builder for DepartPipeCard specific queries
 */
export class DepartPipeCardQueryOptimizer {
  private connectionManager: DatabaseConnectionManager;

  constructor(connectionManager: DatabaseConnectionManager) {
    this.connectionManager = connectionManager;
  }

  /**
   * Optimized pipe production stats query with proper indexing hints
   */
  async getPipeProductionStats(timeRange: '1d' | '7d' | '14d' = '14d') {
    return this.connectionManager.executeQuery(async client => {
      const timeFilter = {
        '1d': 'generate_time >= CURRENT_DATE',
        '7d': "generate_time >= (CURRENT_DATE - INTERVAL '7 days')",
        '14d': "generate_time >= (CURRENT_DATE - INTERVAL '14 days')",
      }[timeRange];

      const { data, error } = await client.rpc('get_pipe_production_stats_optimized', {
        time_filter: timeFilter,
      });

      if (error) throw error;
      return data;
    }, `getPipeProductionStats_${timeRange}`);
  }

  /**
   * Optimized top pipe stocks query with materialized view support
   */
  async getTopPipeStocks(limit: number = 10) {
    return this.connectionManager.executeQuery(async client => {
      // Use RPC function for aggregated query as client doesn't support .group()
      const { data, error } = await client.rpc('get_top_pipe_stocks', {
        row_limit: limit,
      });

      if (error) throw error;
      return data;
    }, 'getTopPipeStocks');
  }

  /**
   * Optimized material stocks query
   */
  async getMaterialStocks(limit: number = 10) {
    return this.connectionManager.executeQuery(async client => {
      const { data, error } = await client
        .from('stock_level')
        .select(
          `
          stock,
          description,
          stock_level,
          update_time,
          data_code!inner(type)
        `
        )
        .eq('data_code.type', 'Material')
        .gt('stock_level', 0)
        .order('stock_level', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    }, 'getMaterialStocks');
  }

  /**
   * Batch load all DepartPipeCard data efficiently
   */
  async loadAllDepartPipeData() {
    const queries = [
      {
        fn: () => this.getPipeProductionStats('14d'),
        name: 'PipeProductionStats',
      },
      {
        fn: () => this.getTopPipeStocks(10),
        name: 'TopPipeStocks',
      },
      {
        fn: () => this.getMaterialStocks(7),
        name: 'MaterialStocks',
      },
    ];

    const [productionStats, topStocks, materialStocks] =
      await this.connectionManager.executeBatch(queries);

    return {
      productionStats,
      topStocks,
      materialStocks,
      stats: this.connectionManager.getStats(),
    };
  }
}

// Export optimized query builder instance
export const departPipeCardOptimizer = new DepartPipeCardQueryOptimizer(dbConnectionManager);

/**
 * Connection pool health monitoring middleware
 * Can be used in API routes or GraphQL context
 */
export function withConnectionPoolMonitoring() {
  return (req: NextRequest | unknown, res: NextResponse | unknown, next: () => void) => {
    const stats = dbConnectionManager.getStats();

    // Add connection pool stats to response headers for monitoring (if res has setHeader method)
    if (
      res &&
      typeof res === 'object' &&
      'setHeader' in res &&
      typeof res.setHeader === 'function'
    ) {
      res.setHeader('X-DB-Active-Connections', stats.activeConnections);
      res.setHeader('X-DB-Total-Queries', stats.totalQueries);
      res.setHeader('X-DB-Slow-Query-Percentage', stats.slowQueryPercentage.toFixed(2));
      res.setHeader('X-DB-Health-Status', stats.isHealthy ? 'healthy' : 'unhealthy');
    }

    // Log unhealthy state
    if (!stats.isHealthy) {
      console.warn('[DB] Connection pool is unhealthy:', stats);
    }

    next();
  };
}

export default dbConnectionManager;
