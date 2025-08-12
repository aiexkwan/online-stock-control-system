/**
 * GraphQL Resolver Type Definitions
 * 統一管理所有 resolver 的類型定義
 */

// Re-export search types
export * from './search.types';

// Common GraphQL types
export interface GraphQLPaginationInfo {
  hasMore: boolean;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

// Generic collection response
export interface GraphQLCollection<T> {
  items: T[];
  pagination: GraphQLPaginationInfo;
  totalCount: number;
}

// Common error type
export interface GraphQLError {
  message: string;
  code?: string;
  field?: string;
  details?: Record<string, unknown>;
}

// Operation result type
export interface GraphQLOperationResult {
  success: boolean;
  message?: string;
  errors?: GraphQLError[];
  data?: unknown;
}