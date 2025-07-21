/**
 * Ask Database API 類型定義
 * 統一管理 Ask Database API 相關的類型
 */

import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

// Error classification types (Strategy 4: unknown + type narrowing)
export interface ClassifiedError extends Error {
  errorType: string;
  originalError?: Error;
  sql?: string;
  severity?: 'low' | 'medium' | 'high';
  recoverable?: boolean;
}

// Type guard for classified errors
export function isClassifiedError(error: unknown): error is ClassifiedError {
  return (
    error instanceof Error &&
    typeof error === 'object' &&
    'errorType' in error &&
    typeof (error as Record<string, unknown>).errorType === 'string'
  );
}

// SQL execution result types
export interface SqlExecutionResult {
  data?: unknown[];
  error?: string;
  count?: number;
}

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface SupabaseQueryResult {
  data: Record<string, unknown>[];
  rowCount: number;
  executionTime: number;
}

export interface CacheEntry {
  question: string;
  sql: string;
  result: SupabaseQueryResult;
  answer: string;
  complexity: 'simple' | 'medium' | 'complex';
  tokensUsed: number;
  cached: boolean;
  timestamp: string | number;
  executionTime: number;
  cacheHits: number;
  lastAccessed: number;
  embedding?: number[];
  fuzzyHash?: string;
  tags?: string[];
  usage_count?: number;
  resolvedQuestion?: string;
  references?: Record<string, unknown>[];
  performanceAnalysis?: string;
}

export interface QueryRecordData {
  question: string;
  sql: string;
  result_json: SupabaseQueryResult;
  embedding?: number[];
  fuzzy_hash?: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
  usage_count?: number;
  execution_time?: number;
  success?: boolean;
  error_message?: string;
  user_id?: string;
  session_id?: string;
  query_type?: 'select' | 'insert' | 'update' | 'delete' | 'other';
  complexity_score?: number;
  optimization_suggestions?: string[];
  performance_metrics?: {
    query_time: number;
    rows_examined: number;
    rows_returned: number;
    cache_hit: boolean;
  };
}

export interface QueryResult {
  success: boolean;
  data?: SupabaseQueryResult;
  error?: string;
  sql?: string;
  question?: string;
  result?: SupabaseQueryResult;
  answer?: string;
  complexity?: 'simple' | 'medium' | 'complex';
  tokensUsed?: number;
  cached?: boolean;
  timestamp?: string | number;
  cacheHits?: number;
  lastAccessed?: number;
  resolvedQuestion?: string;
  references?: Record<string, unknown>[];
  performanceAnalysis?: string;
  executionTime: number;
  cacheHit: boolean;
  source: 'cache' | 'database' | 'ai_generation';
  metadata?: {
    queryType: string;
    complexity: number;
    optimizations?: string[];
  };
}

export interface CacheResult extends QueryResult {
  cacheHit: true;
  source: 'cache';
  cacheKey?: string;
  cacheAge?: number;
  cacheLevel?: string;
  similarity?: number;
  responseTime?: number;
  result?: SupabaseQueryResult;
  answer?: string;
}

// Request/Response types
export interface AskDatabaseRequest {
  question: string;
  useCache?: boolean;
  maxCacheAge?: number;
  includeExplanation?: boolean;
  context?: {
    userId?: string;
    sessionId?: string;
    previousQueries?: string[];
  };
}

export interface AskDatabaseResponse {
  success: boolean;
  data?: SupabaseQueryResult;
  error?: string;
  sql?: string;
  explanation?: string;
  executionTime: number;
  cacheHit: boolean;
  source: 'cache' | 'database' | 'ai_generation';
  metadata?: {
    queryType: string;
    complexity: number;
    suggestions?: string[];
    similarQueries?: string[];
  };
}

// OpenAI related types
export type OpenAIChatMessage = ChatCompletionMessageParam;

export interface OpenAIConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

// Cache related types
export interface CacheConfig {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
  updateAgeOnGet: boolean;
}

// Database schema types for Ask Database
export interface DatabaseSchema {
  tables: TableSchema[];
  views: ViewSchema[];
  functions: FunctionSchema[];
}

export interface TableSchema {
  name: string;
  columns: ColumnSchema[];
  primaryKey?: string[];
  foreignKeys?: ForeignKeySchema[];
  description?: string;
}

export interface ColumnSchema {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  description?: string;
}

export interface ViewSchema {
  name: string;
  definition: string;
  columns: ColumnSchema[];
  description?: string;
}

export interface FunctionSchema {
  name: string;
  parameters: ParameterSchema[];
  returnType: string;
  description?: string;
}

export interface ParameterSchema {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

export interface ForeignKeySchema {
  columnName: string;
  referencedTable: string;
  referencedColumn: string;
}

// Query analysis types
export interface QueryAnalysis {
  type: 'select' | 'insert' | 'update' | 'delete' | 'other';
  complexity: number;
  estimatedRows: number;
  tablesUsed: string[];
  hasJoins: boolean;
  hasSubqueries: boolean;
  hasAggregates: boolean;
  indexRecommendations?: string[];
  securityConcerns?: string[];
}

// Error types
export type DatabaseErrorType =
  | 'connection_error'
  | 'syntax_error'
  | 'permission_error'
  | 'timeout_error'
  | 'data_error'
  | 'unknown_error';

export interface DatabaseError extends Error {
  type: DatabaseErrorType;
  query?: string;
  details?: Record<string, unknown>;
  recoverable: boolean;
}

// Utility types
export type QueryExecutionStatus = 'pending' | 'executing' | 'completed' | 'failed' | 'cached';

export interface QueryMetrics {
  executionTime: number;
  rowsReturned: number;
  bytesProcessed: number;
  cacheHitRate: number;
  errorRate: number;
}

// Constants
export const ASK_DATABASE_CONSTANTS = {
  DEFAULT_CACHE_TTL: 300000, // 5 minutes
  MAX_QUERY_LENGTH: 10000,
  MAX_RESULTS_COUNT: 1000,
  DEFAULT_MODEL: 'gpt-4',
  DEFAULT_TEMPERATURE: 0.1,
  DEFAULT_MAX_TOKENS: 2000,
} as const;

export type AskDatabaseConstantKey = keyof typeof ASK_DATABASE_CONSTANTS;
