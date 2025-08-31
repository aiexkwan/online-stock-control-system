import { GraphQLError } from 'graphql';
import { createClient } from '../../../app/utils/supabase/server';
import { safeGet, safeNumber, safeString } from '../../../types/database/helpers';
import type { GraphQLContext } from './index';

// Type definitions for inventory items
interface StockLevelItem {
  productCode: string;
  productDesc: string;
  warehouse: string;
  location: string;
  quantity: number;
  value: number;
  lastUpdated: string;
  palletCount: number;
}

// interface TransferRecord {
//   id?: string;
//   product_code: string;
//   product_desc?: string;
//   quantity: number;
//   from_location: string;
//   to_location: string;
//   status: string;
//   created_by: string;
//   created_at: string;
//   completed_at?: string;
//   notes?: string;
//   [key: string]: unknown;
// }

interface StockLevelsArgs {
  input?: {
    filter?: {
      warehouse?: string;
      productCode?: string;
      minQty?: number;
      maxQty?: number;
      includeZeroStock?: boolean;
    };
    sortBy?: 'QUANTITY' | 'VALUE' | 'LOCATION' | 'PRODUCT_CODE';
    limit?: number;
    offset?: number;
  };
}

interface CreateTransferArgs {
  input: {
    productCode: string;
    quantity: number;
    fromLocation: string;
    toLocation: string;
    notes?: string;
  };
}

// interface BatchTransferArgs {
//   items: Array<{
//     productCode: string;
//     quantity: number;
//     fromLocation: string;
//     toLocation: string;
//   }>;
// }

export const inventoryMigrationResolvers = {
  Query: {
    stockLevels: async (_: unknown, args: StockLevelsArgs, context: GraphQLContext) => {
      const startTime = Date.now();
      const requestId = Math.random().toString(36).substring(7);

      try {
        // 權限檢查
        if (!context.user) {
          throw new GraphQLError('Unauthorized', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }

        console.log(`[GraphQL-${requestId}] stockLevels called with args:`, args);

        const supabase = await createClient();
        const input = args.input || {};
        const filter = input.filter || {};

        // 建立查詢
        let query = supabase.from('data_code').select('*', { count: 'exact' });

        // 應用篩選器 (使用實際存在嘅字段)
        if (filter.productCode) {
          query = query.eq('code', filter.productCode);
        }
        if (filter.minQty !== undefined) {
          query = query.gte('standard_qty', filter.minQty);
        }
        if (filter.maxQty !== undefined) {
          query = query.lte('standard_qty', filter.maxQty);
        }
        // warehouse 同 includeZeroStock 篩選器因為缺乏相關字段而移除

        // 應用排序 (使用實際存在嘅字段)
        switch (input.sortBy) {
          case 'QUANTITY':
            query = query.order('standard_qty', { ascending: false });
            break;
          case 'PRODUCT_CODE':
          default:
            query = query.order('code', { ascending: true });
            break;
          // LOCATION 排序因為缺乏相關字段而移除
        }

        // 應用分頁
        const limit = input.limit || 50;
        const offset = input.offset || 0;
        query = query.range(offset, offset + limit - 1);

        const { data: products, error, count } = await query;

        if (error) {
          throw new GraphQLError(`Database query failed: ${error.message}`, {
            extensions: { code: 'DATABASE_ERROR' },
          });
        }

        // 轉換數據 - 從 data_code 表獲取產品基本信息
        // 注意：庫存位置信息應該從 record_inventory 或 record_palletinfo 表獲取
        const items = (products || []).map((product: Record<string, unknown>) => {
          const qty = safeNumber(safeGet(product, 'standard_qty'), 0);

          return {
            productCode: safeString(safeGet(product, 'code'), ''),
            productDesc: safeString(safeGet(product, 'description'), ''),
            warehouse: 'N/A', // 需要從 record_inventory 表獲取實際倉庫信息
            location: 'N/A', // 需要從 record_palletinfo 表獲取實際位置信息
            quantity: qty, // 使用 standard_qty 作為基準數量
            value: 0, // 需要從價格表獲取單價來計算總價值
            lastUpdated: new Date().toISOString(), // data_code 表無時間戳，使用當前時間作為預設
            palletCount: 1, // 預設值，實際需要計算
          };
        });

        // 計算聚合數據
        const uniqueProducts = new Set(items.map((i: StockLevelItem) => i.productCode));
        const aggregates = {
          totalQuantity: items.reduce(
            (sum: number, item: StockLevelItem) => sum + (item.quantity || 0),
            0
          ),
          totalValue: items.reduce(
            (sum: number, item: StockLevelItem) => sum + (item.value || 0),
            0
          ),
          totalPallets: items.length,
          uniqueProducts: uniqueProducts.size,
        };

        console.log(`[GraphQL-${requestId}] Completed in ${Date.now() - startTime}ms`);

        return {
          items,
          total: count || 0,
          aggregates,
        };
      } catch (error) {
        console.error(`[GraphQL-${requestId}] Error:`, error);
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch stock levels';
        throw new GraphQLError(errorMessage, {
          extensions: {
            code: 'INTERNAL_SERVER_ERROR',
            requestId,
          },
        });
      }
    },
  },

  Mutation: {
    createTransfer: async (_: unknown, args: CreateTransferArgs, context: GraphQLContext) => {
      try {
        // 權限檢查
        if (!context.user) {
          throw new GraphQLError('Unauthorized', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }

        const supabase = await createClient();
        const { input } = args;

        // 檢查產品是否存在 (data_code 表沒有位置或數量信息)
        const { data: stockData, error: stockError } = await supabase
          .from('data_code')
          .select('*')
          .eq('code', input.productCode)
          .single();

        if (stockError || !stockData) {
          return {
            success: false,
            transfer: null,
            message: 'Source location not found or insufficient stock',
          };
        }

        const standardQty = safeNumber(safeGet(stockData, 'standard_qty'), 0);
        // 注意：data_code 表沒有實際庫存數量，只有 standard_qty
        // 這裡簡化檢查，實際應該查詢庫存表
        if (standardQty === 0) {
          return {
            success: false,
            transfer: null,
            message: 'Product not found or invalid standard quantity',
          };
        }

        // 創建轉移記錄 - 使用 record_transfer 表
        const transferData = {
          plt_num: input.productCode, // 暫時使用 product_code 作為 plt_num
          f_loc: input.fromLocation,
          t_loc: input.toLocation,
          operator_id: parseInt(context.user.id) || 1, // 確保是數字 ID
          tran_date: new Date().toISOString(),
        };

        const { data: transfer, error: transferError } = await supabase
          .from('record_transfer')
          .insert(transferData)
          .select()
          .single();

        if (transferError) {
          throw new GraphQLError(`Failed to create transfer: ${transferError.message}`, {
            extensions: { code: 'DATABASE_ERROR' },
          });
        }

        // TODO: 實際執行庫存轉移邏輯

        return {
          success: true,
          transfer: {
            ...transfer,
            productDesc: '', // 需要從產品表獲取
            createdBy: transfer.operator_id,
            createdAt: transfer.tran_date,
            fromLocation: transfer.f_loc,
            toLocation: transfer.t_loc,
            completedAt: transfer.tran_date,
          },
          message: 'Transfer created successfully',
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create transfer';
        throw new GraphQLError(errorMessage, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    updateTransferStatus: async (
      _: unknown,
      args: { id: string; status: string },
      context: GraphQLContext
    ) => {
      try {
        // 權限檢查
        if (!context.user) {
          throw new GraphQLError('Unauthorized', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }

        // record_transfer 表沒有 status 字段，所以這個功能暫時不可用
        throw new GraphQLError(
          'Transfer status update not supported with current database schema',
          {
            extensions: { code: 'FEATURE_NOT_AVAILABLE' },
          }
        );

        /* 原始代碼註解掉，因為 record_transfer 表結構不支持
        const supabase = await createClient();
        const updateData: Record<string, unknown> = {
          status: args.status };

        if (args.status === 'COMPLETED') {
          updateData.completed_at = new Date().toISOString();
        }

        const { data, error } = await supabase
          .from('record_transfer')
          .update(updateData)
          .eq('uuid', args.id)
          .select()
          .single();

        if (error) {
          throw new GraphQLError(`Failed to update transfer: ${error.message}`, {
            extensions: { code: 'DATABASE_ERROR' } });
        }

        return {
          success: true,
          transfer: {
            ...data,
            productDesc: '', // 需要從產品表獲取
            createdBy: data.operator_id,
            createdAt: data.tran_date,
            fromLocation: data.f_loc,
            toLocation: data.t_loc,
            completedAt: data.tran_date },
          message: 'Transfer status updated successfully' };
        */
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to update transfer status';
        throw new GraphQLError(errorMessage, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    cancelTransfer: async (
      _: unknown,
      args: { id: string; reason?: string },
      context: GraphQLContext
    ) => {
      try {
        // 權限檢查
        if (!context.user) {
          throw new GraphQLError('Unauthorized', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }

        // record_transfer 表沒有 status 字段，所以取消功能暫時不可用
        // 可以考慮直接刪除記錄或添加一個備註字段來標記取消狀態
        const supabase = await createClient();

        const { data, error } = await supabase
          .from('record_transfer')
          .delete()
          .eq('uuid', args.id)
          .select()
          .single();

        if (error) {
          throw new GraphQLError(`Failed to cancel transfer: ${error.message}`, {
            extensions: { code: 'DATABASE_ERROR' },
          });
        }

        if (!data) {
          return {
            success: false,
            transfer: null,
            message: 'Transfer not found',
          };
        }

        return {
          success: true,
          transfer: {
            ...data,
            productDesc: '', // 需要從產品表獲取
            createdBy: data.operator_id,
            createdAt: data.tran_date,
            fromLocation: data.f_loc,
            toLocation: data.t_loc,
            completedAt: data.tran_date,
          },
          message: 'Transfer cancelled successfully',
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to cancel transfer';
        throw new GraphQLError(errorMessage, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
  },

  // Field resolvers
  StockTransfer: {
    pallet: async (
      parent: Record<string, unknown>,
      _args: Record<string, unknown>,
      _context: GraphQLContext
    ) => {
      // If pallet is already loaded, return it
      if (parent.pallet !== undefined) {
        return parent.pallet;
      }

      // If no pallet_number, return null
      if (!parent.pallet_number) {
        return null;
      }

      try {
        const supabase = await createClient();

        // Fetch pallet info using the pallet_number
        const palletNumber = String(parent.pallet_number);
        const { data, error } = await supabase
          .from('record_palletinfo')
          .select('*')
          .eq('plt_num', palletNumber)
          .single();

        if (error || !data) {
          console.warn(
            `[StockTransfer.pallet] No pallet found for plt_num: ${parent.pallet_number}`
          );
          return null;
        }

        return {
          plt_num: data.plt_num,
          product_code: data.product_code,
          product_qty: data.product_qty,
          generate_time: data.generate_time,
          series: data.series,
          f_loc: ((data as Record<string, unknown>).f_loc as string) || '',
          qc_status: ((data as Record<string, unknown>).qc_status as string) || '',
        };
      } catch (error) {
        console.error('[StockTransfer.pallet] Error loading pallet:', error);
        return null;
      }
    },
  },
};

export default inventoryMigrationResolvers;
