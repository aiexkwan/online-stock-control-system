/**
 * API client for inventory ordered analysis
 */

import { createClient } from '../../../app/utils/supabase/client';
import type {
  InventoryOrderedAnalysisResponse,
  InventoryAnalysisParams,
  InventoryAnalysisFilters,
  InventoryAnalysisSortBy,
  InventoryAnalysisProduct,
} from '../../types/inventory-analysis.types';

export class InventoryAnalysisAPI {
  private static instance: InventoryAnalysisAPI;
  private supabase: ReturnType<typeof createClient> | null = null;

  private constructor() {}

  private getSupabase(): ReturnType<typeof createClient> | null {
    if (!this.supabase && typeof window !== 'undefined') {
      this.supabase = createClient();
    }
    return this.supabase;
  }

  public static getInstance(): InventoryAnalysisAPI {
    if (!InventoryAnalysisAPI.instance) {
      InventoryAnalysisAPI.instance = new InventoryAnalysisAPI();
    }
    return InventoryAnalysisAPI.instance;
  }

  /**
   * Get inventory ordered analysis from RPC function
   */
  async getInventoryOrderedAnalysis(
    params?: InventoryAnalysisParams
  ): Promise<InventoryOrderedAnalysisResponse> {
    try {
      // 確保參數安全的類型化對象
      const rpcParams: Record<string, unknown> = {
        p_product_codes: params?.p_product_codes ?? null,
        p_product_type: params?.p_product_type ?? null,
      };

      const supabase = this.getSupabase();
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase.rpc('rpc_get_inventory_ordered_analysis', rpcParams);

      if (error) {
        console.error('Error fetching inventory analysis:', error);
        throw new Error(`Inventory analysis failed: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from inventory analysis');
      }

      return data as InventoryOrderedAnalysisResponse;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Failed to fetch inventory ordered analysis:', errorMessage);
      throw new Error(`Inventory analysis API error: ${errorMessage}`);
    }
  }

  /**
   * Apply client-side filters to products
   */
  applyFilters(
    products: InventoryAnalysisProduct[],
    filters: InventoryAnalysisFilters
  ): InventoryAnalysisProduct[] {
    if (!products || products.length === 0) {
      return [];
    }

    let filtered = [...products];

    if (filters.showSufficientOnly) {
      filtered = filtered.filter(p => p.is_sufficient);
    }

    if (filters.showInsufficientOnly) {
      filtered = filtered.filter(p => !p.is_sufficient);
    }

    if (typeof filters.minFulfillmentRate === 'number') {
      filtered = filtered.filter(p => p.fulfillment_rate >= filters.minFulfillmentRate!);
    }

    if (typeof filters.maxFulfillmentRate === 'number') {
      filtered = filtered.filter(p => p.fulfillment_rate <= filters.maxFulfillmentRate!);
    }

    if (filters.productTypes && filters.productTypes.length > 0) {
      filtered = filtered.filter(
        p => p.product_type && filters.productTypes!.includes(p.product_type)
      );
    }

    return filtered;
  }

  /**
   * Sort products by specified field
   */
  sortProducts(
    products: InventoryAnalysisProduct[],
    sortBy: InventoryAnalysisSortBy,
    ascending: boolean = true
  ): InventoryAnalysisProduct[] {
    if (!products || products.length === 0) {
      return [];
    }

    const sorted = [...products];

    sorted.sort((a, b) => {
      // Type-safe value extraction with proper key access
      const aVal = a[sortBy as keyof InventoryAnalysisProduct];
      const bVal = b[sortBy as keyof InventoryAnalysisProduct];

      // Handle null/undefined values
      if (aVal === null || aVal === undefined) {
        if (bVal === null || bVal === undefined) return 0;
        return ascending ? -1 : 1;
      }
      if (bVal === null || bVal === undefined) {
        return ascending ? 1 : -1;
      }

      // Handle boolean values
      if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
        const aNum = aVal ? 1 : 0;
        const bNum = bVal ? 1 : 0;
        return ascending ? aNum - bNum : bNum - aNum;
      }

      // Handle number values
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return ascending ? aVal - bVal : bVal - aVal;
      }

      // Handle string values
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const aStr = aVal.toLowerCase();
        const bStr = bVal.toLowerCase();
        const comparison = aStr.localeCompare(bStr);
        return ascending ? comparison : -comparison;
      }

      // Fallback: convert to string for comparison
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      const comparison = aStr.localeCompare(bStr);
      return ascending ? comparison : -comparison;
    });

    return sorted;
  }

  /**
   * Get unique product types from analysis
   */
  getUniqueProductTypes(products: InventoryAnalysisProduct[]): string[] {
    if (!products || products.length === 0) {
      return [];
    }

    const types = new Set<string>();
    products.forEach(p => {
      if (p.product_type && typeof p.product_type === 'string') {
        types.add(p.product_type);
      }
    });
    return Array.from(types).sort();
  }

  /**
   * Calculate critical metrics
   */
  calculateCriticalMetrics(products: InventoryAnalysisProduct[]): {
    criticalCount: number;
    warningCount: number;
    totalShortage: number;
    avgFulfillmentRate: number;
    criticalProducts: InventoryAnalysisProduct[];
    warningProducts: InventoryAnalysisProduct[];
  } {
    if (!products || products.length === 0) {
      return {
        criticalCount: 0,
        warningCount: 0,
        totalShortage: 0,
        avgFulfillmentRate: 0,
        criticalProducts: [],
        warningProducts: [],
      };
    }

    const criticalProducts = products.filter(p => !p.is_sufficient);
    const warningProducts = products.filter(p => p.is_sufficient && p.fulfillment_rate < 150);

    const totalShortage = criticalProducts.reduce((sum, p) => {
      const shortage = Math.abs(p.remaining_stock);
      return sum + (isNaN(shortage) ? 0 : shortage);
    }, 0);

    const avgFulfillmentRate =
      products.length > 0
        ? products.reduce((sum, p) => {
            const rate = p.fulfillment_rate;
            return sum + (isNaN(rate) ? 0 : rate);
          }, 0) / products.length
        : 0;

    return {
      criticalCount: criticalProducts.length,
      warningCount: warningProducts.length,
      totalShortage: Math.round(totalShortage * 100) / 100,
      avgFulfillmentRate: Math.round(avgFulfillmentRate * 100) / 100,
      criticalProducts,
      warningProducts,
    };
  }

  /**
   * Export analysis to CSV
   */
  exportToCSV(products: InventoryAnalysisProduct[]): string {
    if (!products || products.length === 0) {
      return 'No data available for export';
    }

    const headers = [
      'Product Code',
      'Description',
      'Type',
      'Colour',
      'Current Stock',
      'Order Demand',
      'Remaining Stock',
      'Fulfillment Rate %',
      'Status',
      'Last Updated',
    ].join(',');

    const escapeCSVValue = (value: string | number | null | undefined): string => {
      if (value === null || value === undefined) {
        return '';
      }
      const stringValue = String(value);
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const rows = products.map(p => {
      try {
        const lastUpdated = p.last_updated ? new Date(p.last_updated).toLocaleString() : 'N/A';
        return [
          escapeCSVValue(p.product_code),
          escapeCSVValue(p.product_description),
          escapeCSVValue(p.product_type),
          escapeCSVValue(p.product_colour),
          escapeCSVValue(p.current_stock),
          escapeCSVValue(p.order_demand),
          escapeCSVValue(p.remaining_stock),
          escapeCSVValue(p.fulfillment_rate),
          escapeCSVValue(p.is_sufficient ? 'Sufficient' : 'Insufficient'),
          escapeCSVValue(lastUpdated),
        ].join(',');
      } catch (error) {
        console.error('Error processing product for CSV:', p, error);
        return escapeCSVValue(p.product_code) + ',Error processing product data';
      }
    });

    return [headers, ...rows].join('\n');
  }
}

// Export singleton instance
export const inventoryAnalysisAPI = InventoryAnalysisAPI.getInstance();
