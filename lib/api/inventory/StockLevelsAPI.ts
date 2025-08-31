/**
 * Stock Levels API - Example implementation of DataAccessLayer
 * Demonstrates hybrid data fetching for inventory stock levels
 */

import { useState, useEffect } from 'react';
import { createClient } from '../../../app/utils/supabase/client';
import { DataAccessLayer, DataAccessConfig } from '../core/DataAccessStrategy';

// Type definitions
export interface StockLevelParams extends Record<string, unknown> {
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

export interface StockLevelResult extends Record<string, unknown> {
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
      // Use direct Supabase query with type-safe approach
      const supabase = createClient();

      // Build query with explicit any typing to avoid deep instantiation
      let query: any = supabase
        .from('data_code')
        .select('*')
        .order(params.sortBy || 'product_code');

      // Apply filters with proper type safety
      if (typeof params.warehouse === 'string' && params.warehouse.trim()) {
        query = query.like('current_plt_loc', `${params.warehouse}%`);
      }

      if (typeof params.productCode === 'string' && params.productCode.trim()) {
        query = query.eq('product_code', params.productCode);
      }

      if (typeof params.minQty === 'number' && !isNaN(params.minQty)) {
        query = query.gte('product_qty', params.minQty);
      }

      if (typeof params.maxQty === 'number' && !isNaN(params.maxQty)) {
        query = query.lte('product_qty', params.maxQty);
      }

      if (params.includeZeroStock !== true) {
        query = query.gt('product_qty', 0);
      }

      // Apply pagination
      const limit = typeof params.limit === 'number' && params.limit > 0 ? params.limit : 50;
      const offset = typeof params.offset === 'number' && params.offset >= 0 ? params.offset : 0;
      query = query.range(offset, offset + limit - 1);

      const { data: products, error: queryError, count } = await query;

      if (queryError) {
        throw new Error(`Database query error: ${queryError.message}`);
      }

      // Validate and transform data
      const validatedProducts = Array.isArray(products) ? products : [];
      const items = this.transformProducts(validatedProducts);
      const aggregates = this.calculateAggregates(items);

      return {
        items,
        total: typeof count === 'number' ? count : items.length,
        aggregates,
      };
    } catch (error) {
      console.error('Error in serverFetch:', error);
      // Re-throw with enhanced context
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Unknown error occurred during stock levels fetch: ${String(error)}`);
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
      // Enable caching for GET requests (standard fetch API only)
      cache: 'force-cache',
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
    const validFilters = [
      typeof params.warehouse === 'string' && params.warehouse.trim(),
      typeof params.productCode === 'string' && params.productCode.trim(),
      typeof params.minQty === 'number' && !isNaN(params.minQty),
      typeof params.maxQty === 'number' && !isNaN(params.maxQty),
    ];

    const filterCount = validFilters.filter(Boolean).length;
    const hasProductCode = typeof params.productCode === 'string' && params.productCode.trim();
    const isValueSorting = params.sortBy === 'value';

    return filterCount >= 2 || !hasProductCode || isValueSorting;
  }

  /**
   * Transform raw product data to stock level format
   * Strategy 4: unknown + type narrowing with safe accessors
   */
  private transformProducts(products: Record<string, unknown>[]): StockLevelItem[] {
    if (!Array.isArray(products)) {
      console.warn('transformProducts received non-array data, returning empty array');
      return [];
    }

    return products.map((product, index) => {
      try {
        // Safe type narrowing for product data with validation
        const productCode = this.validateStringField(product.product_code, `Unknown-${index}`);
        const productDesc = this.validateStringField(product.product_desc, '');
        const currentPltLoc = this.validateStringField(product.current_plt_loc, 'Unknown');
        const productQty = this.validateNumberField(product.product_qty, 0);
        const unitPrice = this.validateNumberField(product.unit_price, 0);

        // Handle timestamp with fallback chain
        const updatedAt = this.validateTimestamp(
          product.updated_at ?? product.created_at ?? new Date().toISOString()
        );

        // Calculate warehouse from location with safety checks
        const warehouse = currentPltLoc.length > 0 ? currentPltLoc.charAt(0) : 'U';

        // Ensure value calculation is safe
        const value = Math.max(0, productQty * Math.max(0, unitPrice));

        return {
          productCode,
          productDesc,
          warehouse,
          location: currentPltLoc,
          quantity: productQty,
          value,
          lastUpdated: updatedAt,
          palletCount: 1, // Each record represents one pallet
        };
      } catch (error) {
        console.warn(`Error transforming product at index ${index}:`, error);
        // Return safe fallback item
        return {
          productCode: `Error-${index}`,
          productDesc: 'Data transformation error',
          warehouse: 'E',
          location: 'ERROR',
          quantity: 0,
          value: 0,
          lastUpdated: new Date().toISOString(),
          palletCount: 0,
        };
      }
    });
  }

  /**
   * Validate and normalize string fields
   */
  private validateStringField(value: unknown, fallback: string): string {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
    return fallback;
  }

  /**
   * Validate and normalize number fields
   */
  private validateNumberField(value: unknown, fallback: number): number {
    if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
      return Math.max(0, value); // Ensure non-negative
    }
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      if (!isNaN(parsed) && isFinite(parsed)) {
        return Math.max(0, parsed);
      }
    }
    return fallback;
  }

  /**
   * Validate and normalize timestamp fields
   */
  private validateTimestamp(value: unknown): string {
    if (typeof value === 'string' && value.trim()) {
      try {
        const date = new Date(value.trim());
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      } catch {
        // Fall through to default
      }
    }
    return new Date().toISOString();
  }

  /**
   * Calculate aggregates from items with type safety
   */
  private calculateAggregates(items: StockLevelItem[]): StockLevelResult['aggregates'] {
    if (!Array.isArray(items) || items.length === 0) {
      return {
        totalQuantity: 0,
        totalValue: 0,
        totalPallets: 0,
        uniqueProducts: 0,
      };
    }

    try {
      const uniqueProducts = new Set<string>();
      let totalQuantity = 0;
      let totalValue = 0;
      let totalPallets = 0;

      for (const item of items) {
        // Validate item structure and add to aggregates
        if (item && typeof item === 'object') {
          // Safe quantity aggregation
          if (typeof item.quantity === 'number' && isFinite(item.quantity)) {
            totalQuantity += Math.max(0, item.quantity);
          }

          // Safe value aggregation
          if (typeof item.value === 'number' && isFinite(item.value)) {
            totalValue += Math.max(0, item.value);
          }

          // Safe pallet count aggregation
          if (typeof item.palletCount === 'number' && isFinite(item.palletCount)) {
            totalPallets += Math.max(0, item.palletCount);
          }

          // Safe product code collection
          if (typeof item.productCode === 'string' && item.productCode.trim()) {
            uniqueProducts.add(item.productCode.trim());
          }
        }
      }

      return {
        totalQuantity: Math.round(totalQuantity * 100) / 100, // Round to 2 decimal places
        totalValue: Math.round(totalValue * 100) / 100,
        totalPallets: Math.round(totalPallets),
        uniqueProducts: uniqueProducts.size,
      };
    } catch (error) {
      console.warn('Error calculating aggregates:', error);
      // Return safe fallback
      return {
        totalQuantity: 0,
        totalValue: 0,
        totalPallets: items.length, // At least count the items
        uniqueProducts: 0,
      };
    }
  }
}

// Factory function for easy instantiation
export function createStockLevelsAPI(): StockLevelsAPI {
  return new StockLevelsAPI();
}

// React Hook for client-side usage
export function useStockLevels(params: StockLevelParams, config?: DataAccessConfig) {
  const [data, setData] = useState<StockLevelResult | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const api = createStockLevelsAPI();

    api
      .fetch(params, {
        strategy: 'client', // Force client-side for hook usage
        ...config,
      })
      .then(setData)
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [
    params.warehouse,
    params.productCode,
    params.minQty,
    params.maxQty,
    params.includeZeroStock,
    params.sortBy,
    params.limit,
    params.offset,
    config?.strategy,
    config?.priority,
    config?.realtime,
    config,
    params,
  ]);

  return { data, error, isLoading };
}
