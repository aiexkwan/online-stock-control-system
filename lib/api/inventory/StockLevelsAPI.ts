/**
 * Stock Levels API - Example implementation of DataAccessLayer
 * Demonstrates hybrid data fetching for inventory stock levels
 */

import { DataAccessLayer, DataAccessConfig } from '../core/DataAccessStrategy';
import { createClient } from '@/app/utils/supabase/client';
import { useState, useEffect } from 'react';

// Type definitions
export interface StockLevelParams {
  warehouse?: string;
  productCode?: string;
  minQty?: number;
  maxQty?: number;
  includeZeroStock?: boolean;
  sortBy?: 'quantity' | 'value' | 'location';
  limit?: number;
  offset?: number;
}

export interface StockLevelItem {
  productCode: string;
  productDesc: string;
  warehouse: string;
  location: string;
  quantity: number;
  value: number;
  lastUpdated: string;
  palletCount: number;
}

export interface StockLevelResult {
  items: StockLevelItem[];
  total: number;
  aggregates: {
    totalQuantity: number;
    totalValue: number;
    totalPallets: number;
    uniqueProducts: number;
  };
}

// Using direct Supabase queries instead of GraphQL for this implementation

export class StockLevelsAPI extends DataAccessLayer<StockLevelParams, StockLevelResult> {
  constructor() {
    super('stock-levels');
  }

  /**
   * Server-side implementation using direct Supabase queries
   */
  async serverFetch(params: StockLevelParams): Promise<StockLevelResult> {
    try {
      // Use direct Supabase query
      const supabase = createClient();

      let query = supabase
        .from('data_product')
        .select('*')
        .order(params.sortBy || 'product_code');

      // Apply filters
      if (params.warehouse) {
        query = query.like('current_plt_loc', `${params.warehouse}%`);
      }
      if (params.productCode) {
        query = query.eq('product_code', params.productCode);
      }
      if (params.minQty !== undefined) {
        query = query.gte('product_qty', params.minQty);
      }
      if (params.maxQty !== undefined) {
        query = query.lte('product_qty', params.maxQty);
      }
      if (!params.includeZeroStock) {
        query = query.gt('product_qty', 0);
      }

      // Pagination
      const limit = params.limit || 50;
      const offset = params.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data: products, error: queryError, count } = await query;

      if (queryError) throw queryError;

      // Transform and aggregate data
      const items = this.transformProducts(products || []);
      const aggregates = this.calculateAggregates(items);

      return {
        items,
        total: count || 0,
        aggregates,
      };
    } catch (error) {
      console.error('Error in serverFetch:', error);
      throw error;
    }
  }

  /**
   * Client-side implementation using REST API with caching
   */
  async clientFetch(params: StockLevelParams): Promise<StockLevelResult> {
    // Build query string
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, String(value));
      }
    });

    // Fetch from REST API
    const response = await fetch(`/api/inventory/stock-levels?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Enable caching for GET requests
      cache: 'force-cache',
      next: {
        revalidate: 60, // Revalidate every 60 seconds
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch stock levels: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Override to detect complex queries that benefit from server-side processing
   */
  protected isComplexQuery(params: StockLevelParams): boolean {
    // Complex if:
    // - Multiple filters applied
    // - Large data set expected (no specific product filter)
    // - Sorting by calculated fields (value)
    const filterCount = [params.warehouse, params.productCode, params.minQty, params.maxQty].filter(
      Boolean
    ).length;

    return filterCount >= 2 || !params.productCode || params.sortBy === 'value';
  }

  /**
   * Transform raw product data to stock level format
   * Strategy 4: unknown + type narrowing with safe accessors
   */
  private transformProducts(products: Record<string, unknown>[]): StockLevelItem[] {
    return products.map(product => {
      // Safe type narrowing for product data
      const productCode = typeof product.product_code === 'string' ? product.product_code : 'Unknown';
      const productDesc = typeof product.product_desc === 'string' ? product.product_desc : '';
      const currentPltLoc = typeof product.current_plt_loc === 'string' ? product.current_plt_loc : 'Unknown';
      const productQty = typeof product.product_qty === 'number' ? product.product_qty : 0;
      const unitPrice = typeof product.unit_price === 'number' ? product.unit_price : 0;
      const updatedAt = typeof product.updated_at === 'string' ? product.updated_at : 
                       typeof product.created_at === 'string' ? product.created_at : new Date().toISOString();

      return {
        productCode,
        productDesc,
        warehouse: currentPltLoc.charAt(0) || 'Unknown',
        location: currentPltLoc,
        quantity: productQty,
        value: productQty * unitPrice,
        lastUpdated: updatedAt,
        palletCount: 1, // Each record represents one pallet
      };
    });
  }

  /**
   * Calculate aggregates from items
   */
  private calculateAggregates(items: StockLevelItem[]): StockLevelResult['aggregates'] {
    const uniqueProducts = new Set(items.map(i => i.productCode));

    return {
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
      totalValue: items.reduce((sum, item) => sum + item.value, 0),
      totalPallets: items.length,
      uniqueProducts: uniqueProducts.size,
    };
  }
}

// Factory function for easy instantiation
export function createStockLevelsAPI(): StockLevelsAPI {
  return new StockLevelsAPI();
}

// React Hook for client-side usage with SWR
export function useStockLevels(params: StockLevelParams, config?: DataAccessConfig) {
  const [data, setData] = useState<StockLevelResult | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Extract complex expression to separate variable for static checking
  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    const api = createStockLevelsAPI();

    api
      .fetch(params, {
        strategy: 'client', // Force client-side for hook usage
        ...config,
      })
      .then(setData)
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [params, paramsKey, config]);

  return { data, error, isLoading };
}
