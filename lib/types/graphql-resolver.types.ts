/**
 * GraphQL Resolver Types
 * 統一 GraphQL resolver 的類型定義
 */

import { SupabaseClient } from '@supabase/supabase-js';
// import type { Database } from '@/types/supabase-generated';
import DataLoader from 'dataloader';

// GraphQL Context 類型
export interface GraphQLContext {
  supabase: SupabaseClient;
  user?: {
    id: string;
    email?: string;
    role?: string;
  } | null;
  dataloaders?: {
    [key: string]: DataLoader<any, any>;
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
export type PostgrestQueryBuilder<T = any> = any; // 保持現有兼容性

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