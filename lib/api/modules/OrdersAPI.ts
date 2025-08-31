/**
 * Orders API Module
 * Part of Phase 3.1: Real-time Component Migration
 *
 * Provides server-side data access for Orders List Card
 * with optimized RPC calls and Server Actions
 */

import { createClient } from '../../../app/utils/supabase/client';
import type { PostgrestError, RealtimeChannel } from '@supabase/supabase-js';

// ================================
// Type Definitions
// ================================

export interface OrderRecord {
  uuid: string;
  time: string;
  id: number | null;
  action: string;
  plt_num: string | null;
  loc: string | null;
  remark: string;
  uploader_name: string;
  doc_url: string | null;
}

// Raw database record from RPC response
export interface RawOrderRPCRecord {
  uuid: string;
  time: string;
  id: number | null;
  action: string;
  plt_num: string | null;
  loc: string | null;
  remark: string;
  uploader_name: string;
  doc_url: string | null;
  total_count: number; // Added by RPC for pagination
}

// Realtime payload type for subscriptions
export interface RealtimeOrderPayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: OrderRecord | null;
  old: OrderRecord | null;
  schema: string;
  table: string;
}

export interface OrdersListResponse {
  orders: OrderRecord[];
  totalCount: number;
  hasMore: boolean;
  metadata?: {
    executedAt: string;
    queryTime?: string;
    cached?: boolean;
  };
}

export interface OrdersListParams {
  limit?: number;
  offset?: number;
}

// Error handling types
export interface OrderAPIError extends Error {
  code?: string;
  details?: string;
  hint?: string;
}

// ================================
// Orders API Class
// ================================

class OrdersAPI {
  // Simple in-memory cache for request deduplication
  private cache = new Map<string, { data: OrdersListResponse; timestamp: number }>();
  private readonly CACHE_TTL = 30000; // 30 seconds

  /**
   * Transform raw RPC response to OrderRecord
   */
  private transformRPCRecord(record: unknown): OrderRecord {
    const raw = record as Record<string, unknown>;

    return {
      uuid: String(raw.uuid || ''),
      time: String(raw.time || ''),
      id: typeof raw.id === 'number' ? raw.id : null,
      action: String(raw.action || ''),
      plt_num: typeof raw.plt_num === 'string' ? raw.plt_num : null,
      loc: typeof raw.loc === 'string' ? raw.loc : null,
      remark: String(raw.remark || ''),
      uploader_name: String(raw.uploader_name || ''),
      doc_url: typeof raw.doc_url === 'string' ? raw.doc_url : null,
    };
  }

  /**
   * Create API error from PostgrestError
   */
  private createAPIError(error: PostgrestError | Error, context: string): OrderAPIError {
    const apiError = new Error(`${context}: ${error.message}`) as OrderAPIError;

    if ('code' in error) {
      apiError.code = error.code;
      apiError.details = error.details;
      apiError.hint = error.hint;
    }

    return apiError;
  }

  /**
   * Get cache key for orders list request
   */
  private getCacheKey(limit: number, offset: number): string {
    return `orders_${limit}_${offset}`;
  }

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_TTL;
  }

  /**
   * Get orders list with optimized RPC call
   * Uses simple caching for request deduplication
   */
  async getOrdersList(limit: number = 15, offset: number = 0): Promise<OrdersListResponse> {
    const startTime = performance.now();
    const cacheKey = this.getCacheKey(limit, offset);

    try {
      // Check cache first
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult && this.isCacheValid(cachedResult.timestamp)) {
        return {
          ...cachedResult.data,
          metadata: {
            ...cachedResult.data.metadata,
            cached: true,
          },
        };
      }

      // Use client for compatibility with both server and client components
      const supabase = createClient();

      // Call the optimized RPC function
      const { data, error } = await supabase.rpc('rpc_get_orders_list', {
        p_limit: limit,
        p_offset: offset,
      });

      if (error) {
        console.error('[OrdersAPI] Error fetching orders:', error);
        throw this.createAPIError(error, 'Failed to fetch orders');
      }

      // Ensure data is array and has proper structure
      const rawData = Array.isArray(data) ? data : [];

      // Extract total count from first record (if exists)
      const firstRecord = rawData.length > 0 ? (rawData[0] as RawOrderRPCRecord) : null;
      const totalCount = firstRecord?.total_count ?? 0;
      const hasMore = offset + limit < totalCount;

      // Transform data to match interface
      const orders: OrderRecord[] = rawData.map(record => this.transformRPCRecord(record));

      const queryTime = `${(performance.now() - startTime).toFixed(2)}ms`;

      const result: OrdersListResponse = {
        orders,
        totalCount,
        hasMore,
        metadata: {
          executedAt: new Date().toISOString(),
          queryTime,
          cached: false,
        },
      };

      // Cache the result
      this.cache.set(cacheKey, { data: result, timestamp: Date.now() });

      return result;
    } catch (error) {
      console.error('[OrdersAPI] getOrdersList error:', error);

      // Return empty result on error
      return {
        orders: [],
        totalCount: 0,
        hasMore: false,
        metadata: {
          executedAt: new Date().toISOString(),
          queryTime: `${(performance.now() - startTime).toFixed(2)}ms`,
          cached: false,
        },
      };
    }
  }

  /**
   * Subscribe to real-time order updates
   * Returns a channel that can be used to listen for new orders
   */
  subscribeToOrderUpdates(
    onNewOrder: (order: OrderRecord) => void,
    onError?: (error: Error) => void
  ): RealtimeChannel {
    const supabase = createClient();

    const channel = supabase.channel('orders-realtime').on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'record_history',
        filter: 'action=eq.Order Upload',
      },
      payload => {
        try {
          console.log('[OrdersAPI] New order received:', payload);

          // Safely transform the payload
          if (payload.new && typeof payload.new === 'object') {
            const transformedOrder = this.transformRPCRecord(payload.new);
            onNewOrder(transformedOrder);
          } else {
            console.warn('[OrdersAPI] Invalid payload received:', payload);
          }
        } catch (error) {
          console.error('[OrdersAPI] Error processing realtime update:', error);
          if (onError) {
            onError(
              error instanceof Error ? error : new Error('Unknown error processing realtime update')
            );
          }
        }
      }
    );

    return channel;
  }

  /**
   * Unsubscribe from order updates
   */
  unsubscribeFromOrderUpdates(channel: RealtimeChannel): Promise<'ok' | 'timed out' | 'error'> {
    return channel.unsubscribe();
  }
}

// ================================
// Singleton Export
// ================================

export const ordersAPI = new OrdersAPI();

// ================================
// Utility Functions
// ================================

// Raw database record interface for direct database access
interface RawOrderRecord {
  uuid: string;
  time: string;
  id: number | null;
  action: string;
  plt_num: string | null;
  loc: string | null;
  remark: string;
  uploader_name?: string;
  doc_url: string | null;
}

/**
 * Transform raw database record to OrderRecord type
 * Used for direct database access outside of the API class
 */
export function transformOrderRecord(raw: RawOrderRecord): OrderRecord {
  return {
    uuid: raw.uuid,
    time: raw.time,
    id: raw.id,
    action: raw.action,
    plt_num: raw.plt_num,
    loc: raw.loc,
    remark: raw.remark,
    uploader_name: raw.uploader_name ?? 'Unknown',
    doc_url: raw.doc_url,
  };
}

/**
 * Check if an order has a PDF attached
 */
export function orderHasPdf(order: OrderRecord): boolean {
  return Boolean(order.doc_url);
}

/**
 * Validate order record structure
 */
export function isValidOrderRecord(obj: unknown): obj is OrderRecord {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const record = obj as Record<string, unknown>;

  return (
    typeof record.uuid === 'string' &&
    typeof record.time === 'string' &&
    (typeof record.id === 'number' || record.id === null) &&
    typeof record.action === 'string' &&
    (typeof record.plt_num === 'string' || record.plt_num === null) &&
    (typeof record.loc === 'string' || record.loc === null) &&
    typeof record.remark === 'string' &&
    typeof record.uploader_name === 'string' &&
    (typeof record.doc_url === 'string' || record.doc_url === null)
  );
}
