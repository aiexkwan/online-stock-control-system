/**
 * 資料庫操作類型定義
 * Database Operations Type Definitions
 *
 * 提供資料庫相關的所有類型定義，包括查詢、快取、監控和錯誤處理
 * Provides all database-related type definitions including queries, caching, monitoring and error handling
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database/supabase';

// =============================================================================
// 資料庫查詢相關類型 / Database Query Related Types
// =============================================================================

export interface DatabaseQueryResult<T = unknown> {
  data: T | null;
  error: DatabaseError | null;
  count?: number;
  status?: number;
  statusText?: string;
}

export interface DatabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
  status?: number;
}

export interface QueryOptions {
  skipCache?: boolean;
  ttl?: number;
  retries?: number;
  timeout?: number;
  abortSignal?: AbortSignal;
}

export interface BatchQueryItem<T = unknown> {
  queryFn: (client: SupabaseClient<Database>) => Promise<DatabaseQueryResult<T>>;
  cacheKey?: string;
  options?: QueryOptions;
  id?: string;
  description?: string;
}

export interface BatchQueryResult<T = unknown> {
  id?: string;
  success: boolean;
  result?: DatabaseQueryResult<T>;
  error?: DatabaseError;
  executionTime?: number;
}

export type DatabaseQueryFunction<T = unknown> = (
  client: SupabaseClient<Database>
) => Promise<DatabaseQueryResult<T>>;

// =============================================================================
// 快取系統類型 / Cache System Types
// =============================================================================

export interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  accessCount: number;
  ttl?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface CacheConfig {
  enabled: boolean;
  ttlMs: number;
  maxSize: number;
  strategy: 'lru' | 'fifo' | 'lfu';
  compressLargeEntries?: boolean;
  maxEntrySize?: number;
}

export interface CacheOperations<T = unknown> {
  get(key: string): T | null;
  set(key: string, data: T, ttl?: number): void;
  delete(key: string): boolean;
  clear(): void;
  has(key: string): boolean;
  size(): number;
  keys(): string[];
  evict(): void;
  stats(): CacheStats;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  maxSize: number;
  memoryUsage?: number;
}

// =============================================================================
// 查詢攔截器類型 / Query Interceptor Types
// =============================================================================

export interface QueryExecutionContext {
  queryId: string;
  queryFn: DatabaseQueryFunction;
  cacheKey?: string;
  options?: QueryOptions;
  startTime: number;
  retryCount?: number;
}

export interface QueryInterceptorResult {
  continue: boolean;
  modifiedQuery?: DatabaseQueryFunction;
  modifiedOptions?: QueryOptions;
  error?: DatabaseError;
}

export type QueryInterceptor = (
  context: QueryExecutionContext
) => QueryInterceptorResult | Promise<QueryInterceptorResult>;

export interface InterceptorChain {
  before: QueryInterceptor[];
  after: ((context: QueryExecutionContext, result: DatabaseQueryResult) => void)[];
  error: ((context: QueryExecutionContext, error: DatabaseError) => void)[];
}

// =============================================================================
// 性能監控類型 / Performance Monitoring Types
// =============================================================================

export interface PerformanceMetrics {
  totalQueries: number;
  totalQueryTime: number;
  averageQueryTime: number;
  slowQueries: number;
  failedQueries: number;
  cacheHits: number;
  cacheMisses: number;
  connectionRetries: number;
  lastQueryTime?: Date;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting' | 'error';
}

export interface QueryPerformanceData {
  queryId: string;
  executionTime: number;
  success: boolean;
  cacheHit?: boolean;
  retries?: number;
  error?: DatabaseError;
  timestamp: Date;
}

export interface PerformanceThresholds {
  slowQueryThreshold: number;
  errorRateThreshold: number;
  cacheHitRateThreshold: number;
  connectionTimeoutThreshold: number;
}

export type PerformanceEventHandler = (metrics: PerformanceMetrics) => void;

// =============================================================================
// 連接管理類型 / Connection Management Types
// =============================================================================

export interface ConnectionConfig {
  maxRetries: number;
  retryDelayMs: number;
  healthCheckIntervalMs: number;
  connectionTimeoutMs: number;
  enableAutoReconnect: boolean;
  enableQueryMetrics: boolean;
  enableQueryCache: boolean;
  enableInterceptors?: boolean;
}

export interface ConnectionState {
  status: 'connected' | 'disconnected' | 'reconnecting' | 'error';
  lastConnectedAt?: Date;
  lastDisconnectedAt?: Date;
  reconnectAttempts: number;
  totalConnections: number;
  uptime?: number;
}

export interface HealthCheckResult {
  success: boolean;
  responseTime?: number;
  error?: DatabaseError;
  timestamp: Date;
}

// =============================================================================
// 資料庫服務介面 / Database Service Interface
// =============================================================================

export interface DatabaseServiceOperations {
  // 查詢操作
  executeQuery<T = unknown>(
    queryFn: DatabaseQueryFunction<T>,
    cacheKey?: string,
    options?: QueryOptions
  ): Promise<DatabaseQueryResult<T>>;

  // 批量操作
  executeBatch<T = unknown>(queries: BatchQueryItem<T>[]): Promise<BatchQueryResult<T>[]>;

  // 快取操作
  clearCache(): void;
  clearCacheByPattern(pattern: string | RegExp): void;
  getCacheStats(): CacheStats;

  // 監控操作
  getMetrics(): PerformanceMetrics;
  resetMetrics(): void;
  onPerformanceUpdate(handler: PerformanceEventHandler): void;

  // 攔截器操作
  addInterceptor(phase: keyof InterceptorChain, interceptor: QueryInterceptor | Function): void;
  removeInterceptor(phase: keyof InterceptorChain, interceptor: QueryInterceptor | Function): void;

  // 連接管理
  getConnectionState(): ConnectionState;
  performHealthCheck(): Promise<HealthCheckResult>;
  reconnect(): Promise<void>;
  dispose(): void;
}

// =============================================================================
// GRN 特定資料庫類型 / GRN-specific Database Types
// =============================================================================

export interface GrnDatabaseRecord {
  id: string;
  grn_number: string;
  supplier_id?: string;
  status: string;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface GrnQueryFilters {
  grnNumber?: string;
  supplierId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export interface GrnDatabaseOperations {
  findByGrnNumber(grnNumber: string): Promise<DatabaseQueryResult<GrnDatabaseRecord>>;
  findBySupplier(supplierId: string): Promise<DatabaseQueryResult<GrnDatabaseRecord[]>>;
  create(data: Partial<GrnDatabaseRecord>): Promise<DatabaseQueryResult<GrnDatabaseRecord>>;
  update(
    id: string,
    data: Partial<GrnDatabaseRecord>
  ): Promise<DatabaseQueryResult<GrnDatabaseRecord>>;
  delete(id: string): Promise<DatabaseQueryResult<void>>;
  search(filters: GrnQueryFilters): Promise<DatabaseQueryResult<GrnDatabaseRecord[]>>;
}

// =============================================================================
// 匯出便利類型 / Export Convenience Types
// =============================================================================

export type AnyDatabaseResult = DatabaseQueryResult<unknown>;
export type AnyQueryFunction = DatabaseQueryFunction<unknown>;
export type AnyCacheEntry = CacheEntry<unknown>;
