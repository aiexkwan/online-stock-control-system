import { GraphQLError } from 'graphql';
// import { toGraphQLErrorMessage } from '../../types/api'; // Type not found
const toGraphQLErrorMessage = (error: any) => error?.message || 'Unknown error';
import { createClient } from '../../../app/utils/supabase/server';
import { getAcoReportData } from '../../../app/actions/DownloadCentre-Actions';
import { orderLoadingDataSources } from '../../../app/components/reports/dataSources/OrderLoadingDataSource';
import { safeNumber, toRecordArray } from '../../../types/database/helpers';
import type { GraphQLContext } from './index';

// Database types - matching actual database structure
interface DataOrderRecord {
  uuid: string;
  created_at: string;
  account_num: string;
  order_ref: string;
  invoice_to: string;
  delivery_add: string;
  product_code: string;
  product_desc: string;
  product_qty: number;
  unit_price: string;
  uploaded_by: string;
  loaded_qty: string;
  token: number;
  weight?: number;
  customer_ref?: string;
}

interface OrderLoadingHistoryRecord {
  uuid: string;
  order_ref: string;
  pallet_num: string;
  product_code: string;
  quantity: number;
  action_type: string;
  action_by: string;
  action_time?: string;
  remark?: string;
}

interface AcoReportItem {
  order_ref?: number;
  product_code?: string;
  product_desc?: string;
  quantity_ordered?: number;
  quantity_used?: number;
  remaining_quantity?: number;
  completion_status?: string;
  last_updated?: string;
}

interface LoadingRecord {
  timestamp?: string;
  order_number?: string;
  product_code?: string;
  loaded_qty?: number;
  user_name?: string;
  action?: string;
}

interface OrderFilterArgs {
  input?: {
    orderRef?: string;
    status?: string;
    dateRange?: {
      start: string;
      end: string;
    };
    customerName?: string;
  };
}

interface OrderLoadingFilterArgs {
  input: {
    startDate: string;
    endDate: string;
    orderRef?: string;
    productCode?: string;
    actionBy?: string;
  };
}

interface UpdateAcoOrderArgs {
  input: {
    orderRef: number;
    productCode: string;
    quantityUsed: number;
    skipUpdate?: boolean;
    orderCompleted?: boolean;
  };
}

export const orderResolvers = {
  Query: {
    warehouseOrders: async (_: unknown, args: OrderFilterArgs, context: GraphQLContext) => {
      const startTime = Date.now();
      const requestId = Math.random().toString(36).substring(7);

      try {
        // 權限檢查
        if (!context.user) {
          throw new GraphQLError('Unauthorized', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }

        console.log(`[GraphQL-${requestId}] warehouseOrders called with args:`, args);

        const supabase = await createClient();
        const input = args.input || {};

        // 建立查詢 - 使用 data_order 表（真正的訂單表）
        let query = supabase.from('data_order').select('*', { count: 'exact' });

        // 應用篩選器
        if (input.orderRef) {
          query = query.eq('order_ref', input.orderRef);
        }
        if (input.customerName) {
          query = query.or(
            `invoice_to.ilike.%${input.customerName}%,delivery_add.ilike.%${input.customerName}%`
          );
        }
        if (input.dateRange) {
          query = query
            .gte('created_at', input.dateRange.start)
            .lte('created_at', input.dateRange.end);
        }

        // 排序
        query = query.order('created_at', { ascending: false });

        const { data: orders, error, count: _count } = await query;

        if (error) {
          throw new GraphQLError(`Database error: ${error.message}`, {
            extensions: { code: 'INTERNAL_SERVER_ERROR' },
          });
        }

        // 獲取訂單的載入歷史以計算載入數量
        const typedOrders = (orders || []) as unknown as DataOrderRecord[];
        const orderRefs = typedOrders.map(o => o.order_ref);
        let loadingHistory: OrderLoadingHistoryRecord[] = [];

        if (orderRefs.length > 0) {
          const { data: historyData } = await supabase
            .from('order_loading_history')
            .select('*')
            .in('order_ref', orderRefs);

          loadingHistory = (historyData || []) as unknown as OrderLoadingHistoryRecord[];
        }

        // 計算每個訂單的載入數量
        const loadingByOrder = loadingHistory.reduce(
          (acc: Record<string, number>, record: OrderLoadingHistoryRecord) => {
            acc[record.order_ref] = (acc[record.order_ref] || 0) + record.quantity;
            return acc;
          },
          {}
        );

        // Group orders by order_ref to get order items
        const orderGroups = typedOrders.reduce((acc: Record<string, DataOrderRecord[]>, order) => {
          if (!acc[order.order_ref]) {
            acc[order.order_ref] = [];
          }
          acc[order.order_ref].push(order);
          return acc;
        }, {});

        // Transform grouped orders into WarehouseOrder format
        const warehouseOrders = Object.entries(orderGroups).map(([orderRef, orderItems]) => {
          const firstItem = orderItems[0];
          const totalQuantity = orderItems.reduce((sum: number, item) => sum + item.product_qty, 0);
          const loadedQuantity = loadingByOrder[orderRef] || 0;
          const loadedQtyFromString = parseInt(firstItem.loaded_qty) || 0;
          const actualLoadedQty = Math.max(loadedQuantity, loadedQtyFromString);

          return {
            id: firstItem.uuid,
            orderRef: orderRef,
            customerName: firstItem.invoice_to || firstItem.delivery_add,
            status:
              actualLoadedQty >= totalQuantity
                ? 'COMPLETED'
                : actualLoadedQty > 0
                  ? 'IN_PROGRESS'
                  : 'PENDING',
            items: orderItems.map(item => ({
              id: item.uuid,
              productCode: item.product_code,
              productDescription: item.product_desc,
              quantity: item.product_qty,
              loadedQuantity: 0, // Will be calculated from loading history
              unitPrice: parseFloat(item.unit_price) || 0,
              status: 'PENDING',
            })),
            totalQuantity: totalQuantity,
            loadedQuantity: actualLoadedQty,
            remainingQuantity: Math.max(0, totalQuantity - actualLoadedQty),
            createdAt: firstItem.created_at,
            updatedAt: firstItem.created_at, // No updated_at field in database
            completedAt: actualLoadedQty >= totalQuantity ? new Date().toISOString() : null,
          };
        });

        // 計算聚合數據
        const aggregates = {
          totalOrders: warehouseOrders.length,
          pendingOrders: warehouseOrders.filter(o => o.status === 'PENDING').length,
          completedOrders: warehouseOrders.filter(o => o.status === 'COMPLETED').length,
          totalQuantity: warehouseOrders.reduce((sum, o) => sum + o.totalQuantity, 0),
          loadedQuantity: warehouseOrders.reduce((sum, o) => sum + o.loadedQuantity, 0),
        };

        console.log(`[GraphQL-${requestId}] Completed in ${Date.now() - startTime}ms`);

        return {
          items: warehouseOrders,
          total: warehouseOrders.length,
          aggregates,
        };
      } catch (error) {
        console.error(`[GraphQL-${requestId}] Error:`, error);
        throw error;
      }
    },

    warehouseOrder: async (
      _: unknown,
      args: { id?: string; orderRef?: string },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      if (!args.id && !args.orderRef) {
        throw new GraphQLError('Either id or orderRef must be provided', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const supabase = await createClient();

      // Query data_order table for the actual order
      let query = supabase.from('data_order').select('*');

      if (args.id) {
        // Query by UUID
        query = query.eq('uuid', args.id);
      } else if (args.orderRef) {
        // Query by order reference
        query = query.eq('order_ref', args.orderRef);
      }

      const { data: orders, error } = await query;

      if (error || !orders || orders.length === 0) {
        throw new GraphQLError('Order not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Type the orders array
      const typedOrders = orders as unknown as DataOrderRecord[];

      // Group items by order_ref (in case of multiple items in same order)
      const orderRef = typedOrders[0].order_ref;
      const orderItems = typedOrders.filter(o => o.order_ref === orderRef);

      // Get loading history for this order
      const { data: loadingHistory } = await supabase
        .from('order_loading_history')
        .select('*')
        .eq('order_ref', orderRef);

      const typedLoadingHistory = (loadingHistory || []) as unknown as OrderLoadingHistoryRecord[];
      const loadedQuantity = typedLoadingHistory.reduce(
        (sum: number, record) => sum + record.quantity,
        0
      );

      const totalQuantity = orderItems.reduce((sum: number, item) => sum + item.product_qty, 0);
      const loadedQtyFromString = parseInt(orderItems[0].loaded_qty) || 0;
      const actualLoadedQty = Math.max(loadedQuantity, loadedQtyFromString);

      return {
        id: orderItems[0].uuid,
        orderRef: orderRef,
        customerName: orderItems[0].invoice_to || orderItems[0].delivery_add,
        status:
          actualLoadedQty >= totalQuantity
            ? 'COMPLETED'
            : actualLoadedQty > 0
              ? 'IN_PROGRESS'
              : 'PENDING',
        items: orderItems.map((item: DataOrderRecord) => ({
          id: item.uuid,
          productCode: item.product_code,
          productDescription: item.product_desc,
          quantity: item.product_qty,
          loadedQuantity: 0, // Will be calculated from loading history
          unitPrice: parseFloat(item.unit_price) || 0,
          status: 'PENDING',
        })),
        totalQuantity: totalQuantity,
        loadedQuantity: actualLoadedQty,
        remainingQuantity: Math.max(0, totalQuantity - actualLoadedQty),
        createdAt: orderItems[0].created_at,
        updatedAt: orderItems[0].created_at, // No updated_at field in database
        completedAt: actualLoadedQty >= totalQuantity ? new Date().toISOString() : null,
      };
    },

    acoOrderReport: async (_: unknown, args: { reference: string }, context: GraphQLContext) => {
      if (!context.user) {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const reportResult = await getAcoReportData(args.reference);

      if (!reportResult.success) {
        const errorMessage =
          'error' in reportResult
            ? reportResult.error || 'Failed to fetch ACO order data'
            : 'Failed to fetch ACO order data';
        throw new GraphQLError(toGraphQLErrorMessage(errorMessage), {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }

      const reportData = reportResult.data;
      if (!reportData || reportData.length === 0) {
        throw new GraphQLError('No data found for the selected ACO order', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      return {
        data: reportData.map((item: AcoReportItem) => ({
          orderRef: item.order_ref || 0,
          productCode: item.product_code || '',
          productDesc: item.product_desc || '',
          quantityOrdered: item.quantity_ordered || 0,
          quantityUsed: item.quantity_used || 0,
          remainingQuantity: item.remaining_quantity || 0,
          completionStatus: item.completion_status || 'PENDING',
          lastUpdated: item.last_updated,
        })),
        total: reportData.length,
        reference: args.reference,
        generatedAt: new Date().toISOString(),
      };
    },

    orderLoadingRecords: async (
      _: unknown,
      args: OrderLoadingFilterArgs,
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const { input } = args;

      // 使用 DataSource 架構
      const dataSource = orderLoadingDataSources.get('loading-details');
      if (!dataSource) {
        throw new GraphQLError('Loading details data source not found', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }

      const filters: Record<string, string | number | boolean | Date | string[]> = {
        dateRange: `${input.startDate}|${input.endDate}`,
        ...(input.orderRef && { orderNumber: input.orderRef }),
        ...(input.productCode && { productCode: input.productCode }),
        ...(input.actionBy && { userId: input.actionBy }),
      };

      // 獲取報表數據
      const rawData = await dataSource.fetch(filters);

      if (!rawData) {
        throw new GraphQLError('No data found for the specified criteria', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      const transformedData = dataSource.transform
        ? dataSource.transform(rawData)
        : toRecordArray(rawData);
      const records = Array.isArray(transformedData) ? transformedData : [];

      // 計算摘要
      const summary = {
        totalLoaded: records.reduce(
          (sum: number, r: LoadingRecord) => sum + (r.loaded_qty || 0),
          0
        ),
        uniqueOrders: new Set(records.map((r: LoadingRecord) => r.order_number)).size,
        uniqueProducts: new Set(records.map((r: LoadingRecord) => r.product_code)).size,
        averageLoadPerOrder: 0,
      };

      if (summary.uniqueOrders > 0) {
        summary.averageLoadPerOrder = summary.totalLoaded / summary.uniqueOrders;
      }

      return {
        records: records.map((r: LoadingRecord) => ({
          timestamp: r.timestamp || new Date().toISOString(),
          orderNumber: r.order_number || '',
          productCode: r.product_code || '',
          loadedQty: r.loaded_qty || 0,
          userName: r.user_name || '',
          action: r.action || 'LOAD',
        })),
        total: records.length,
        summary,
      };
    },
  },

  Mutation: {
    updateAcoOrder: async (_: unknown, args: UpdateAcoOrderArgs, context: GraphQLContext) => {
      if (!context.user) {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const { input } = args;
      const supabase = await createClient();

      try {
        if (input.skipUpdate) {
          // 如果跳過更新，只返回基本資訊
          return {
            success: true,
            message: 'Email-only request',
            order: {
              orderRef: input.orderRef,
              productCode: input.productCode,
              quantityUsed: input.quantityUsed,
              completionStatus: input.orderCompleted ? 'COMPLETED' : 'IN_PROGRESS',
            },
            emailSent: true,
          };
        }

        // 調用 RPC 函數更新 ACO 訂單
        const { data, error } = await supabase.rpc('update_aco_order_with_completion_check', {
          p_order_ref: input.orderRef,
          p_product_code: input.productCode,
          p_quantity_used: input.quantityUsed,
        });

        if (error) {
          throw new GraphQLError(`Failed to update ACO order: ${error.message}`, {
            extensions: { code: 'INTERNAL_SERVER_ERROR' },
          });
        }

        const rpcData = data as {
          message?: string;
          details?: {
            quantity_ordered?: number;
            remaining_quantity?: number;
            order_completed?: boolean;
          };
        } | null;

        return {
          success: true,
          message: rpcData?.message || 'Order updated successfully',
          order: {
            orderRef: input.orderRef,
            productCode: input.productCode,
            quantityUsed: input.quantityUsed,
            quantityOrdered: safeNumber(rpcData?.details?.quantity_ordered, 0),
            remainingQuantity: safeNumber(rpcData?.details?.remaining_quantity, 0),
            completionStatus: rpcData?.details?.order_completed ? 'COMPLETED' : 'IN_PROGRESS',
            lastUpdated: new Date().toISOString(),
          },
          emailSent: false, // Would be true if email integration is added
        };
      } catch (error) {
        if (error instanceof GraphQLError) {
          throw error;
        }
        throw new GraphQLError('Failed to update ACO order', {
          extensions: {
            code: 'INTERNAL_SERVER_ERROR',
            originalError: error instanceof Error ? error.message : String(error),
          },
        });
      }
    },

    updateWarehouseOrderStatus: async (
      _: unknown,
      args: { orderId: string; status: string },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const supabase = await createClient();

      // First, get the order
      const { data: orders } = await supabase
        .from('data_order')
        .select('*')
        .eq('uuid', args.orderId);

      if (!orders || orders.length === 0) {
        throw new GraphQLError('Order not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      const typedOrders = orders as unknown as DataOrderRecord[];
      const orderRef = typedOrders[0].order_ref;
      const orderItems = typedOrders.filter(o => o.order_ref === orderRef);

      // Update loaded_qty based on status
      let updateData: Partial<DataOrderRecord> = {};
      if (args.status === 'COMPLETED') {
        // Mark as fully loaded
        updateData.loaded_qty = typedOrders[0].product_qty.toString();
      } else if (args.status === 'CANCELLED') {
        updateData.loaded_qty = '0';
      }

      // Update all items in the order
      if (Object.keys(updateData).length > 0) {
        await supabase.from('data_order').update(updateData).eq('order_ref', orderRef);
      }

      // Get loading history for this order
      const { data: loadingHistory } = await supabase
        .from('order_loading_history')
        .select('*')
        .eq('order_ref', orderRef);

      const typedLoadingHistory = (loadingHistory || []) as unknown as OrderLoadingHistoryRecord[];
      const loadedQuantity = typedLoadingHistory.reduce(
        (sum: number, record) => sum + record.quantity,
        0
      );

      const totalQuantity = orderItems.reduce((sum, item) => sum + item.product_qty, 0);
      const loadedQtyFromString = parseInt(orderItems[0].loaded_qty) || 0;
      const actualLoadedQty =
        args.status === 'COMPLETED'
          ? totalQuantity
          : args.status === 'CANCELLED'
            ? 0
            : Math.max(loadedQuantity, loadedQtyFromString);

      return {
        id: orderItems[0].uuid,
        orderRef: orderRef,
        customerName: orderItems[0].invoice_to || orderItems[0].delivery_add,
        status: args.status,
        items: orderItems.map((item: DataOrderRecord) => ({
          id: item.uuid,
          productCode: item.product_code,
          productDescription: item.product_desc,
          quantity: item.product_qty,
          loadedQuantity: 0, // Will be calculated from loading history
          unitPrice: parseFloat(item.unit_price) || 0,
          status: 'PENDING',
        })),
        totalQuantity: totalQuantity,
        loadedQuantity: actualLoadedQty,
        remainingQuantity: Math.max(0, totalQuantity - actualLoadedQty),
        createdAt: orderItems[0].created_at,
        updatedAt: new Date().toISOString(),
        completedAt: args.status === 'COMPLETED' ? new Date().toISOString() : null,
      };
    },

    cancelWarehouseOrder: async (
      _: unknown,
      args: { orderId: string; reason?: string },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const supabase = await createClient();

      // Get the order
      const { data: orders } = await supabase
        .from('data_order')
        .select('*')
        .eq('uuid', args.orderId);

      if (!orders || orders.length === 0) {
        throw new GraphQLError('Order not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      const typedOrders = orders as unknown as DataOrderRecord[];
      const orderRef = typedOrders[0].order_ref;
      const orderItems = typedOrders.filter(o => o.order_ref === orderRef);

      // Update customer_ref field with cancellation reason
      const cancelReason = `CANCELLED: ${args.reason || 'No reason provided'} at ${new Date().toISOString()}`;

      await supabase
        .from('data_order')
        .update({
          customer_ref: cancelReason,
          loaded_qty: '0', // Reset loaded quantity
        })
        .eq('order_ref', orderRef);

      // Add cancellation record to loading history
      await supabase.from('order_loading_history').insert({
        order_ref: orderRef,
        pallet_num: 'N/A',
        product_code: orderItems[0].product_code,
        quantity: 0,
        action_type: 'CANCELLED',
        action_by: context.user.id || 'system',
        action_time: new Date().toISOString(),
        remark: args.reason || 'Order cancelled via GraphQL',
      });

      const totalQuantity = orderItems.reduce((sum, item) => sum + item.product_qty, 0);

      return {
        id: orderItems[0].uuid,
        orderRef: orderRef,
        customerName: orderItems[0].invoice_to || orderItems[0].delivery_add,
        status: 'CANCELLED',
        items: orderItems.map((item: DataOrderRecord) => ({
          id: item.uuid,
          productCode: item.product_code,
          productDescription: item.product_desc,
          quantity: item.product_qty,
          loadedQuantity: 0, // Cancelled orders have no loaded quantity
          unitPrice: parseFloat(item.unit_price) || 0,
          status: 'CANCELLED',
        })),
        totalQuantity: totalQuantity,
        loadedQuantity: 0,
        remainingQuantity: 0,
        createdAt: orderItems[0].created_at,
        updatedAt: new Date().toISOString(),
        completedAt: null,
      };
    },
  },
};
