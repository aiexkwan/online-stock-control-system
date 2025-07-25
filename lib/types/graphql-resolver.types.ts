/**
 * GraphQL Resolver Types
 * 統一 GraphQL resolver 的類型定義
 */

import { SupabaseClient } from '@supabase/supabase-js';
// import type { Database } from '@/types/supabase-generated';
import DataLoader from 'dataloader';

// 基礎數據加載器類型
export type DataLoaderKey = string | number;
export type DataLoaderValue = Record<string, unknown> | unknown[];

// Supabase 查詢構建器類型約束
export interface SupabaseRow extends Record<string, unknown> {
  id?: string | number;
  created_at?: string;
  updated_at?: string;
}

// GraphQL Context 類型
export interface GraphQLContext {
  supabase: SupabaseClient;
  user?: {
    id: string;
    email?: string;
    role?: string;
  } | null;
  dataloaders?: {
    [key: string]: DataLoader<DataLoaderKey, DataLoaderValue>;
  };
  requestId?: string;
}

// GraphQL Resolver 通用類型
export type GraphQLResolver<TArgs = Record<string, unknown>, TResult = unknown> = (
  parent: unknown,
  args: TArgs,
  context: GraphQLContext
) => Promise<TResult> | TResult;

// Supabase 查詢構建器類型
export type PostgrestQueryBuilder<T extends SupabaseRow = SupabaseRow> = {
  select: (columns?: string) => PostgrestQueryBuilder<T>;
  from: (table: string) => PostgrestQueryBuilder<T>;
  eq: (column: string, value: unknown) => PostgrestQueryBuilder<T>;
  neq: (column: string, value: unknown) => PostgrestQueryBuilder<T>;
  gt: (column: string, value: unknown) => PostgrestQueryBuilder<T>;
  gte: (column: string, value: unknown) => PostgrestQueryBuilder<T>;
  lt: (column: string, value: unknown) => PostgrestQueryBuilder<T>;
  lte: (column: string, value: unknown) => PostgrestQueryBuilder<T>;
  like: (column: string, pattern: string) => PostgrestQueryBuilder<T>;
  in: (column: string, values: unknown[]) => PostgrestQueryBuilder<T>;
  is: (column: string, value: null | boolean) => PostgrestQueryBuilder<T>;
  order: (column: string, options?: { ascending?: boolean }) => PostgrestQueryBuilder<T>;
  limit: (count: number) => PostgrestQueryBuilder<T>;
  range: (from: number, to: number) => PostgrestQueryBuilder<T>;
};

// 數據推斷類型
export type TableDataType = 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';

// 表格數據源配置
export interface TableDataSourceConfig {
  name: string;
  description: string;
  baseQuery: string;
  joins?: string[];
  defaultColumns: string[];
  permissions: {
    canView: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canCreate: boolean;
    canExport: boolean;
    canFilter: boolean;
    canSort: boolean;
  };
  searchColumns?: string[];
  sortableColumns?: string[];
  filterableColumns?: string[];
  defaultSort?: {
    column: string;
    direction: 'asc' | 'desc';
  };
}
