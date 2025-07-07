/**
 * API client for inventory ordered analysis
 */

import { createClient } from '@/app/utils/supabase/client';
import type {
  InventoryOrderedAnalysisResponse,
  InventoryAnalysisParams,
  InventoryAnalysisFilters,
  InventoryAnalysisSortBy,
  InventoryAnalysisProduct
} from '@/lib/types/inventory-analysis.types';

export class InventoryAnalysisAPI {
  private static instance: InventoryAnalysisAPI;
  private supabase = createClient();

  private constructor() {}

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
      const { data, error } = await this.supabase.rpc('rpc_get_inventory_ordered_analysis', {
        p_product_codes: params?.p_product_codes || null,
        p_product_type: params?.p_product_type || null
      });

      if (error) {
        console.error('Error fetching inventory analysis:', error);
        throw error;
      }

      return data as InventoryOrderedAnalysisResponse;
    } catch (error) {
      console.error('Failed to fetch inventory ordered analysis:', error);
      throw error;
    }
  }

  /**
   * Apply client-side filters to products
   */
  applyFilters(
    products: InventoryAnalysisProduct[],
    filters: InventoryAnalysisFilters
  ): InventoryAnalysisProduct[] {
    let filtered = [...products];

    if (filters.showSufficientOnly) {
      filtered = filtered.filter(p => p.is_sufficient);
    }

    if (filters.showInsufficientOnly) {
      filtered = filtered.filter(p => !p.is_sufficient);
    }

    if (filters.minFulfillmentRate !== undefined) {
      filtered = filtered.filter(p => p.fulfillment_rate >= filters.minFulfillmentRate!);
    }

    if (filters.maxFulfillmentRate !== undefined) {
      filtered = filtered.filter(p => p.fulfillment_rate <= filters.maxFulfillmentRate!);
    }

    if (filters.productTypes && filters.productTypes.length > 0) {
      filtered = filtered.filter(p => 
        p.product_type && filters.productTypes!.includes(p.product_type)
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
    const sorted = [...products];
    
    sorted.sort((a, b) => {
      let aVal: any = a[sortBy];
      let bVal: any = b[sortBy];

      // Handle boolean values
      if (typeof aVal === 'boolean') {
        aVal = aVal ? 1 : 0;
        bVal = bVal ? 1 : 0;
      }

      // Handle string values
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return ascending ? -1 : 1;
      if (aVal > bVal) return ascending ? 1 : -1;
      return 0;
    });

    return sorted;
  }

  /**
   * Get unique product types from analysis
   */
  getUniqueProductTypes(products: InventoryAnalysisProduct[]): string[] {
    const types = new Set<string>();
    products.forEach(p => {
      if (p.product_type) {
        types.add(p.product_type);
      }
    });
    return Array.from(types).sort();
  }

  /**
   * Calculate critical metrics
   */
  calculateCriticalMetrics(products: InventoryAnalysisProduct[]) {
    const criticalProducts = products.filter(p => !p.is_sufficient);
    const warningProducts = products.filter(p => 
      p.is_sufficient && p.fulfillment_rate < 150
    );

    const totalShortage = criticalProducts.reduce((sum, p) => 
      sum + Math.abs(p.remaining_stock), 0
    );

    const avgFulfillmentRate = products.length > 0
      ? products.reduce((sum, p) => sum + p.fulfillment_rate, 0) / products.length
      : 0;

    return {
      criticalCount: criticalProducts.length,
      warningCount: warningProducts.length,
      totalShortage,
      avgFulfillmentRate: Math.round(avgFulfillmentRate * 100) / 100,
      criticalProducts,
      warningProducts
    };
  }

  /**
   * Export analysis to CSV
   */
  exportToCSV(products: InventoryAnalysisProduct[]): string {
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
      'Last Updated'
    ].join(',');

    const rows = products.map(p => [
      p.product_code,
      `"${p.product_description}"`,
      p.product_type || '',
      p.product_colour || '',
      p.current_stock,
      p.order_demand,
      p.remaining_stock,
      p.fulfillment_rate,
      p.is_sufficient ? 'Sufficient' : 'Insufficient',
      new Date(p.last_updated).toLocaleString()
    ].join(','));

    return [headers, ...rows].join('\n');
  }
}

// Export singleton instance
export const inventoryAnalysisAPI = InventoryAnalysisAPI.getInstance();