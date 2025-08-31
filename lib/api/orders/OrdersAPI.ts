/**
 * Orders API
 * Demonstrates hybrid approach for order management
 */

import { createClient } from '@/app/utils/supabase/client';
import {
  loadPalletToOrder,
  undoLoadPallet,
  getOrderInfo,
  type LoadPalletResult,
  type UndoLoadResult,
} from '@/app/actions/orderLoadingActions';
import { DataAccessLayer } from '../core/DataAccessStrategy';

// Enhanced error handling types
export interface OrderAPIError extends Error {
  code?: 'FETCH_ERROR' | 'VALIDATION_ERROR' | 'DATABASE_ERROR' | 'NETWORK_ERROR';
  details?: Record<string, unknown>;
}

// Database row type for better type safety
export interface OrderRow {
  order_ref: string | null;
  product_code: string | null;
  product_desc: string | null;
  product_qty: string | number | null;
  loaded_qty: string | number | null;
  created_at: string | null;
  [key: string]: unknown; // Allow additional properties
}

// Type definitions with better constraints
export type OrderStatus = 'pending' | 'in_progress' | 'completed';

export interface OrderSearchParams {
  orderRef?: string;
  status?: OrderStatus;
  dateFrom?: string;
  dateTo?: string;
  productCode?: string;
  includeDetails?: boolean;
  // Index signature to satisfy DataAccessParams constraint
  [key: string]: unknown;
}

export interface OrderItem {
  productCode: string;
  productDesc: string;
  orderedQty: number;
  loadedQty: number;
  remainingQty: number;
  completionPercentage: number;
}

// Validation helper for OrderItem
export function isValidOrderItem(item: unknown): item is OrderItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    typeof (item as OrderItem).productCode === 'string' &&
    typeof (item as OrderItem).productDesc === 'string' &&
    typeof (item as OrderItem).orderedQty === 'number' &&
    typeof (item as OrderItem).loadedQty === 'number' &&
    typeof (item as OrderItem).remainingQty === 'number' &&
    typeof (item as OrderItem).completionPercentage === 'number'
  );
}

export interface Order {
  orderRef: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  totalItems: number;
  completedItems: number;
  totalQty: number;
  loadedQty: number;
  completionPercentage: number;
  items?: OrderItem[];
}

// Validation helper for Order
export function isValidOrder(order: unknown): order is Order {
  return (
    typeof order === 'object' &&
    order !== null &&
    typeof (order as Order).orderRef === 'string' &&
    ['pending', 'in_progress', 'completed'].includes((order as Order).status) &&
    typeof (order as Order).createdAt === 'string' &&
    typeof (order as Order).updatedAt === 'string' &&
    typeof (order as Order).totalItems === 'number' &&
    typeof (order as Order).completedItems === 'number' &&
    typeof (order as Order).totalQty === 'number' &&
    typeof (order as Order).loadedQty === 'number' &&
    typeof (order as Order).completionPercentage === 'number'
  );
}

export interface OrdersResult {
  orders: Order[];
  total: number;
  summary: {
    totalOrders: number;
    pendingOrders: number;
    inProgressOrders: number;
    completedOrders: number;
    avgCompletionRate: number;
  };
  // Index signature to satisfy DataAccessResult constraint
  [key: string]: unknown;
}

export class OrdersAPI extends DataAccessLayer<OrderSearchParams, OrdersResult> {
  constructor() {
    super('orders');
  }

  /**
   * Server-side implementation with complex aggregations
   */
  async serverFetch(params: OrderSearchParams): Promise<OrdersResult> {
    try {
      const supabase = await createClient();

      // Build query with proper typing
      let query = supabase.from('data_order').select('*', { count: 'exact' });

      // Apply filters with validation
      if (params.orderRef && typeof params.orderRef === 'string') {
        query = query.eq('order_ref', params.orderRef);
      }
      if (params.productCode && typeof params.productCode === 'string') {
        query = query.eq('product_code', params.productCode);
      }
      if (params.dateFrom && typeof params.dateFrom === 'string') {
        query = query.gte('created_at', params.dateFrom);
      }
      if (params.dateTo && typeof params.dateTo === 'string') {
        query = query.lte('created_at', params.dateTo);
      }

      const { data, error, count: _count } = await query;

      if (error) {
        const orderError: OrderAPIError = new Error(
          `Database query failed: ${error.message}`
        ) as OrderAPIError;
        orderError.code = 'DATABASE_ERROR';
        orderError.details = { originalError: error, params };
        throw orderError;
      }

      // Validate data structure
      if (!Array.isArray(data)) {
        const validationError: OrderAPIError = new Error(
          'Invalid data structure returned from database'
        ) as OrderAPIError;
        validationError.code = 'VALIDATION_ERROR';
        throw validationError;
      }

      // Group by order and calculate aggregates with better type safety
      const orderMap = new Map<string, Order>();
      const orderItemsMap = new Map<string, OrderItem[]>();

      data.forEach(row => {
        // Type-safe row processing
        const typedRow = row as OrderRow;
        const orderRef = String(typedRow.order_ref || '');

        if (!orderRef) {
          console.warn('[OrdersAPI] Skipping row with missing order_ref:', typedRow);
          return;
        }

        // Initialize order if not exists
        if (!orderMap.has(orderRef)) {
          orderMap.set(orderRef, {
            orderRef,
            status: 'pending' as OrderStatus,
            createdAt: String(typedRow.created_at || ''),
            updatedAt: String(typedRow.created_at || ''),
            totalItems: 0,
            completedItems: 0,
            totalQty: 0,
            loadedQty: 0,
            completionPercentage: 0,
          });
          orderItemsMap.set(orderRef, []);
        }

        const order = orderMap.get(orderRef)!;
        const items = orderItemsMap.get(orderRef)!;

        // Create order item with proper number parsing and validation
        const rawOrderedQty = String(typedRow.product_qty || '0');
        const rawLoadedQty = String(typedRow.loaded_qty || '0');

        const orderedQty = parseInt(rawOrderedQty, 10);
        const loadedQty = parseInt(rawLoadedQty, 10);

        // Validate parsed numbers
        if (isNaN(orderedQty) || isNaN(loadedQty)) {
          console.warn('[OrdersAPI] Invalid quantity values:', {
            orderRef,
            rawOrderedQty,
            rawLoadedQty,
            parsedOrderedQty: orderedQty,
            parsedLoadedQty: loadedQty,
          });
          return;
        }

        const item: OrderItem = {
          productCode: String(typedRow.product_code || ''),
          productDesc: String(typedRow.product_desc || ''),
          orderedQty,
          loadedQty,
          remainingQty: Math.max(0, orderedQty - loadedQty),
          completionPercentage:
            orderedQty > 0 ? Math.round((loadedQty / orderedQty) * 100 * 100) / 100 : 0,
        };

        items.push(item);

        // Update order aggregates
        order.totalItems++;
        order.totalQty += orderedQty;
        order.loadedQty += loadedQty;

        if (loadedQty >= orderedQty && orderedQty > 0) {
          order.completedItems++;
        }
      });

      // Calculate order status and completion with better precision
      orderMap.forEach((order, orderRef) => {
        order.completionPercentage =
          order.totalQty > 0 ? Math.round((order.loadedQty / order.totalQty) * 100 * 100) / 100 : 0;

        // Determine status with precise logic
        if (order.completionPercentage === 0) {
          order.status = 'pending';
        } else if (order.completionPercentage >= 100) {
          order.status = 'completed';
        } else {
          order.status = 'in_progress';
        }

        // Add items if requested
        if (params.includeDetails) {
          order.items = orderItemsMap.get(orderRef);
        }
      });

      // Apply status filter after calculation
      let orders = Array.from(orderMap.values());
      if (params.status && typeof params.status === 'string') {
        orders = orders.filter(o => o.status === params.status);
      }

      // Calculate summary with better precision
      const summary = {
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        inProgressOrders: orders.filter(o => o.status === 'in_progress').length,
        completedOrders: orders.filter(o => o.status === 'completed').length,
        avgCompletionRate:
          orders.length > 0
            ? Math.round(
                (orders.reduce((sum, o) => sum + o.completionPercentage, 0) / orders.length) * 100
              ) / 100
            : 0,
      };

      return {
        orders,
        total: orders.length,
        summary,
      };
    } catch (error) {
      // Enhanced error handling
      if (error instanceof Error) {
        const orderError: OrderAPIError = error as OrderAPIError;
        if (!orderError.code) {
          orderError.code = 'FETCH_ERROR';
          orderError.details = { params };
        }
        throw orderError;
      }

      const unknownError: OrderAPIError = new Error(
        'Unknown error occurred during order fetch'
      ) as OrderAPIError;
      unknownError.code = 'FETCH_ERROR';
      unknownError.details = { originalError: error, params };
      throw unknownError;
    }
  }

  /**
   * Client-side implementation with enhanced error handling
   */
  async clientFetch(params: OrderSearchParams): Promise<OrdersResult> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      const response = await fetch(`/api/orders?${queryParams}`);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        const networkError: OrderAPIError = new Error(
          `Failed to fetch orders: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`
        ) as OrderAPIError;
        networkError.code = 'NETWORK_ERROR';
        networkError.details = {
          status: response.status,
          statusText: response.statusText,
          params,
        };
        throw networkError;
      }

      const result = await response.json();

      // Basic validation of the response structure
      if (typeof result !== 'object' || !Array.isArray(result.orders)) {
        const validationError: OrderAPIError = new Error(
          'Invalid response structure from API'
        ) as OrderAPIError;
        validationError.code = 'VALIDATION_ERROR';
        validationError.details = { result, params };
        throw validationError;
      }

      return result as OrdersResult;
    } catch (error) {
      if (error instanceof Error && (error as OrderAPIError).code) {
        throw error;
      }

      const fetchError: OrderAPIError = new Error(
        error instanceof Error ? error.message : 'Unknown client fetch error'
      ) as OrderAPIError;
      fetchError.code = 'FETCH_ERROR';
      fetchError.details = { originalError: error, params };
      throw fetchError;
    }
  }

  /**
   * Complex queries with aggregations should use server-side
   */
  protected isComplexQuery(_params: OrderSearchParams): boolean {
    // Always complex due to aggregations
    return true;
  }
}

/**
 * Order Loading Operations
 * These are write operations that should always use Server Actions
 */
export class OrderLoadingAPI {
  /**
   * Load pallet to order - always server-side with enhanced type safety
   */
  static async loadPallet(orderRef: string, palletInput: string): Promise<LoadPalletResult> {
    if (!orderRef || typeof orderRef !== 'string' || orderRef.trim() === '') {
      throw new Error('Invalid orderRef parameter');
    }
    if (!palletInput || typeof palletInput !== 'string' || palletInput.trim() === '') {
      throw new Error('Invalid palletInput parameter');
    }

    try {
      // Uses existing Server Action with proper error handling
      const result = await loadPalletToOrder(orderRef.trim(), palletInput.trim());
      return result;
    } catch (error) {
      const orderError: OrderAPIError = new Error(
        error instanceof Error ? error.message : 'Failed to load pallet'
      ) as OrderAPIError;
      orderError.code = 'DATABASE_ERROR';
      orderError.details = { orderRef, palletInput, originalError: error };
      throw orderError;
    }
  }

  /**
   * Undo pallet loading - always server-side with enhanced validation
   */
  static async undoLoad(
    orderRef: string,
    palletNum: string,
    productCode: string,
    quantity: number
  ): Promise<UndoLoadResult> {
    // Parameter validation
    if (!orderRef || typeof orderRef !== 'string' || orderRef.trim() === '') {
      throw new Error('Invalid orderRef parameter');
    }
    if (!palletNum || typeof palletNum !== 'string' || palletNum.trim() === '') {
      throw new Error('Invalid palletNum parameter');
    }
    if (!productCode || typeof productCode !== 'string' || productCode.trim() === '') {
      throw new Error('Invalid productCode parameter');
    }
    if (typeof quantity !== 'number' || quantity <= 0 || !Number.isInteger(quantity)) {
      throw new Error('Invalid quantity parameter: must be a positive integer');
    }

    try {
      // Uses existing Server Action with proper error handling
      const result = await undoLoadPallet(
        orderRef.trim(),
        palletNum.trim(),
        productCode.trim(),
        quantity
      );
      return result;
    } catch (error) {
      const orderError: OrderAPIError = new Error(
        error instanceof Error ? error.message : 'Failed to undo pallet load'
      ) as OrderAPIError;
      orderError.code = 'DATABASE_ERROR';
      orderError.details = { orderRef, palletNum, productCode, quantity, originalError: error };
      throw orderError;
    }
  }

  /**
   * Get single order info - can use cache with validation
   */
  static async getOrderInfo(orderRef: string): Promise<unknown> {
    if (!orderRef || typeof orderRef !== 'string' || orderRef.trim() === '') {
      throw new Error('Invalid orderRef parameter');
    }

    try {
      // Uses existing Server Action
      const result = await getOrderInfo(orderRef.trim());
      return result;
    } catch (error) {
      const orderError: OrderAPIError = new Error(
        error instanceof Error ? error.message : 'Failed to get order info'
      ) as OrderAPIError;
      orderError.code = 'DATABASE_ERROR';
      orderError.details = { orderRef, originalError: error };
      throw orderError;
    }
  }
}

// Factory function
export function createOrdersAPI(): OrdersAPI {
  return new OrdersAPI();
}

// Note: React hooks should be defined in separate files or in React components
// The useOrders hook has been removed from this API file.
// To use this API in React components, import createOrdersAPI and use it directly
// or create a custom hook in your component file.
