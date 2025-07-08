/**
 * Type definitions for inventory ordered analysis
 */

/**
 * Product inventory analysis details
 */
export interface InventoryAnalysisProduct {
  product_code: string;
  product_description: string;
  product_type: string | null;
  product_colour: string | null;
  current_stock: number;
  order_demand: number;
  remaining_stock: number;
  fulfillment_rate: number;
  is_sufficient: boolean;
  last_updated: string;
}

/**
 * Summary statistics for inventory analysis
 */
export interface InventoryAnalysisSummary {
  total_products: number;
  total_stock: number;
  total_demand: number;
  total_remaining: number;
  sufficient_count: number;
  insufficient_count: number;
  overall_sufficient: boolean;
  overall_fulfillment_rate: number;
}

/**
 * Metadata for the analysis execution
 */
export interface InventoryAnalysisMetadata {
  execution_time_ms?: number;
  filters_applied?: {
    product_codes: string[] | null;
    product_type: string | null;
  };
  generated_at: string;
  error?: boolean;
  error_message?: string;
  error_detail?: string;
}

/**
 * Complete response from rpc_get_inventory_ordered_analysis
 */
export interface InventoryOrderedAnalysisResponse {
  products: InventoryAnalysisProduct[];
  summary: InventoryAnalysisSummary;
  metadata: InventoryAnalysisMetadata;
}

/**
 * Parameters for inventory analysis RPC function
 */
export interface InventoryAnalysisParams {
  p_product_codes?: string[] | null;
  p_product_type?: string | null;
}

/**
 * Sorting options for inventory analysis results
 */
export type InventoryAnalysisSortBy =
  | 'product_code'
  | 'current_stock'
  | 'order_demand'
  | 'remaining_stock'
  | 'fulfillment_rate'
  | 'is_sufficient';

/**
 * Filter options for inventory analysis display
 */
export interface InventoryAnalysisFilters {
  showSufficientOnly?: boolean;
  showInsufficientOnly?: boolean;
  minFulfillmentRate?: number;
  maxFulfillmentRate?: number;
  productTypes?: string[];
}

/**
 * Utility type for product sufficiency status
 */
export type ProductSufficiencyStatus = 'sufficient' | 'insufficient' | 'critical';

/**
 * Helper function type to determine product status
 */
export type GetProductStatus = (product: InventoryAnalysisProduct) => ProductSufficiencyStatus;

/**
 * Constants for inventory analysis
 */
export const INVENTORY_ANALYSIS_CONSTANTS = {
  CRITICAL_FULFILLMENT_RATE: 50,
  WARNING_FULFILLMENT_RATE: 80,
  REFRESH_INTERVAL: 60000, // 1 minute
} as const;
