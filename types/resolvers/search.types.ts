/**
 * Search Resolver Type Definitions
 * 為 search.resolver.ts 提供強類型定義
 */

import { Database } from '@/types/database/supabase';

// Product search result row type
export interface ProductSearchRow {
  code: string;
  description: string;
  type: string; // Changed from product_type to match SQL column name
  product_type?: string; // Keep for backward compatibility
  colour: string | null;
  standard_qty: number;
  latest_update: string | null;
  total_stock: number;
  status: string;
  tags: string[] | null;
  supplier_name: string | null;
  category: string | null;
  relevance_score?: number;
  last_transaction_date: string | null;
  remark?: string | null; // Added to match SQL query
}

// Pallet search result row type
export interface PalletSearchRow {
  plt_num: string;
  product_code: string;
  product_name: string;
  product_description?: string; // Added to match SQL join
  standard_qty: number;
  quantity: number;
  product_qty: number; // Added to match SQL column
  series: string;
  status: string;
  generated_at: string;
  generate_time?: string; // Added for backward compatibility
  generated_by: string;
  location_name: string | null;
  relevance_score?: number;
  tags: string[] | null;
  plt_remark?: string | null; // Added to match SQL column
}

// Order search result row type
export interface OrderSearchRow {
  order_no: string;
  product_code: string;
  ordered_qty: number;
  loaded_qty: number;
  order_date: string;
  status: string;
  customer_name: string | null;
  product_description: string | null;
  relevance_score?: number;
  scheduled_date: string | null;
  priority: string | null;
}

// Location search result row type
export interface LocationSearchRow {
  id: string;
  name: string;
  type: string;
  description: string | null;
  capacity: number | null;
  current_usage: number | null;
  status: string;
  zone: string | null;
  relevance_score?: number;
  last_activity: string | null;
}

// Transfer search result row type
export interface TransferSearchRow {
  id: string;
  pallet_no: string;
  from_location: string;
  to_location: string;
  transfer_date: string;
  transferred_by: string;
  quantity: number;
  product_code: string;
  product_name: string | null;
  status: string;
  relevance_score?: number;
}

// User search result row type
export interface UserSearchRow {
  id: string;
  email: string;
  full_name: string | null;
  department: string | null;
  position: string | null;
  phone: string | null;
  status: string;
  role: string | null;
  last_active: string | null;
  relevance_score?: number;
}

// Search history row type
export interface SearchHistoryRow {
  id: string;
  query: string;
  entities: string[];
  result_count: number;
  timestamp: string;
  user_id: string;
  success: boolean;
}

// Search config row type
export interface SearchConfigRow {
  id: string;
  name: string;
  query: string;
  entities: string[];
  filters: Record<string, unknown>;
  is_default: boolean;
  is_public: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  usage_count: number;
}

// Product suggestion row type
export interface ProductSuggestionRow {
  code: string;
  description: string;
  product_type?: string;
  search_count?: number;
  score_modifier?: number;
}

// Search analytics result type
export interface SearchAnalyticsResult {
  query: string;
  search_count: number;
  avg_results: number;
  success_rate: number;
}

// Generic database query result
export interface DatabaseQueryResult<T> {
  rows: T[];
  rowCount: number;
}

// Type guards for runtime type checking
export function isProductSearchRow(row: unknown): row is ProductSearchRow {
  return (
    typeof row === 'object' &&
    row !== null &&
    'code' in row &&
    typeof (row as ProductSearchRow).code === 'string'
  );
}

export function isPalletSearchRow(row: unknown): row is PalletSearchRow {
  return (
    typeof row === 'object' &&
    row !== null &&
    'plt_num' in row &&
    typeof (row as PalletSearchRow).plt_num === 'string'
  );
}

// Export all types for convenient import
export type SearchResultRow = 
  | ProductSearchRow
  | PalletSearchRow
  | OrderSearchRow
  | LocationSearchRow
  | TransferSearchRow
  | UserSearchRow;

// Mapping type for entity to row type
export interface EntityRowTypeMap {
  PRODUCT: ProductSearchRow;
  PALLET: PalletSearchRow;
  ORDER: OrderSearchRow;
  LOCATION: LocationSearchRow;
  TRANSFER: TransferSearchRow;
  USER: UserSearchRow;
}