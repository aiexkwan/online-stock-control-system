/**
 * Orders API Module
 * Part of Phase 3.1: Real-time Component Migration
 *
 * Provides server-side data access for Orders List Card
 * with optimized RPC calls and Server Actions
 */

import { createClient } from '@/app/utils/supabase/client';
import { cache } from 'react';

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

// ================================
// Orders API Class
// ================================

class OrdersAPI {
  /**
   * Get orders list with optimized RPC call
   * Uses React cache() for automatic request deduplication
   */
  getOrdersList = cache(
    async (limit: number = 15, offset: number = 0): Promise<OrdersListResponse> => {
      const startTime = performance.now();

      try {
        // Use client for compatibility with both server and client components
        const supabase = createClient();

        // Call the optimized RPC function
        const { data, error } = await supabase.rpc('rpc_get_orders_list', {
          p_limit: limit,
          p_offset: offset,
        });

        if (error) {
          console.error('[OrdersAPI] Error fetching orders:', error);
          throw new Error(`Failed to fetch orders: ${error.message}`);
        }

        // Extract total count from first record (if exists)
        const firstRecord = data && Array.isArray(data) && data.length > 0 ? data[0] : null;
        const totalCount =
          firstRecord && typeof firstRecord.total_count === 'number' ? firstRecord.total_count : 0;
        const hasMore = offset + limit < totalCount;

        // Transform data to match interface
        const orders: OrderRecord[] = (Array.isArray(data) ? data : []).map(
          (record: Record<string, unknown>) => ({
            uuid: String(record.uuid || ''),
            time: String(record.time || ''),
            id: typeof record.id === 'number' ? record.id : null,
            action: String(record.action || ''),
            plt_num: typeof record.plt_num === 'string' ? record.plt_num : null,
            loc: typeof record.loc === 'string' ? record.loc : null,
            remark: String(record.remark || ''),
            uploader_name: String(record.uploader_name || ''),
            doc_url: typeof record.doc_url === 'string' ? record.doc_url : null,
          })
        );

        const queryTime = `${(performance.now() - startTime).toFixed(2)}ms`;

        return {
          orders,
          totalCount,
          hasMore,
          metadata: {
            executedAt: new Date().toISOString(),
            queryTime,
            cached: false,
          },
        };
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
  );

  /**
   * Subscribe to real-time order updates
   * Returns a channel that can be used to listen for new orders
   */
  subscribeToOrderUpdates(onNewOrder: (order: OrderRecord) => void) {
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
        console.log('[OrdersAPI] New order received:', payload);
        onNewOrder(payload.new as OrderRecord);
      }
    );

    return channel;
  }
}

// ================================
// Singleton Export
// ================================

export const ordersAPI = new OrdersAPI();

// ================================
// Utility Functions
// ================================

// Raw database record interface
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
    uploader_name: raw.uploader_name || 'Unknown',
    doc_url: raw.doc_url,
  };
}

/**
 * Check if an order has a PDF attached
 */
export function orderHasPdf(order: OrderRecord): boolean {
  return !!order.doc_url;
}
