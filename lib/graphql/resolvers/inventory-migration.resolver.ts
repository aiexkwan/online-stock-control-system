import { GraphQLError } from 'graphql';
import { createClient } from '@/app/utils/supabase/server';
import { safeGet, safeNumber, safeString } from '@/types/database/helpers';
import InventoryAnalysisService, { type InventoryAnalysisInput } from '@/lib/services/inventory-analysis.service';
import { GraphQLContext } from './index';

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

interface TransferRecord {
  id?: string;
  product_code: string;
  product_desc?: string;
  quantity: number;
  from_location: string;
  to_location: string;
  status: string;
  created_by: string;
  created_at: string;
  completed_at?: string;
  notes?: string;
  [key: string]: unknown;
}

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

interface BatchTransferArgs {
  items: Array<{
    productCode: string;
    quantity: number;
    fromLocation: string;
    toLocation: string;
  }>;
}

export const inventoryMigrationResolvers = {
  Query: {
    stockLevels: async (_: unknown, args: StockLevelsArgs, context: GraphQLContext) => {
      const startTime = Date.now();
      const requestId = Math.random().toString(36).substring(7);

      try {
        // 權限檢查
        if (!context.user) {
          throw new GraphQLError('Unauthorized', {
            extensions: { code: 'UNAUTHENTICATED' }
          });
        }

        console.log(`[GraphQL-${requestId}] stockLevels called with args:`, args);

        const supabase = await createClient();
        const input = args.input || {};
        const filter = input.filter || {};

        // 建立查詢
        let query = supabase.from('data_code').select('*', { count: 'exact' });

        // 應用篩選器
        if (filter.warehouse) {
          query = query.like('current_plt_loc', `${filter.warehouse}%`);
        }
        if (filter.productCode) {
          query = query.eq('product_code', filter.productCode);
        }
        if (filter.minQty !== undefined) {
          query = query.gte('product_qty', filter.minQty);
        }
        if (filter.maxQty !== undefined) {
          query = query.lte('product_qty', filter.maxQty);
        }
        if (filter.includeZeroStock === false) {
          query = query.gt('product_qty', 0);
        }

        // 應用排序
        switch (input.sortBy) {
          case 'QUANTITY':
            query = query.order('product_qty', { ascending: false });
            break;
          case 'LOCATION':
            query = query.order('current_plt_loc', { ascending: true });
            break;
          case 'PRODUCT_CODE':
          default:
            query = query.order('product_code', { ascending: true });
            break;
        }

        // 應用分頁
        const limit = input.limit || 50;
        const offset = input.offset || 0;
        query = query.range(offset, offset + limit - 1);

        const { data: products, error, count } = await query;

        if (error) {
          throw new GraphQLError(`Database query failed: ${error.message}`, {
            extensions: { code: 'DATABASE_ERROR' }
          });
        }

        // 轉換數據
        const items = (products || []).map((product: Record<string, unknown>) => {
          const location = safeString(safeGet(product, 'current_plt_loc'), 'Unknown');
          const qty = safeNumber(safeGet(product, 'product_qty'), 0);
          const unitPrice = safeNumber(safeGet(product, 'unit_price'), 0);

          return {
            productCode: safeString(safeGet(product, 'product_code'), ''),
            productDesc: safeString(safeGet(product, 'product_desc'), ''),
            warehouse: location.charAt(0) || 'Unknown',
            location: location,
            quantity: qty,
            value: qty * unitPrice,
            lastUpdated:
              safeString(safeGet(product, 'updated_at'), '') ||
              safeString(safeGet(product, 'created_at'), ''),
            palletCount: 1,
          };
        });

        // 計算聚合數據
        const uniqueProducts = new Set(items.map((i: StockLevelItem) => i.productCode));
        const aggregates = {
          totalQuantity: items.reduce((sum: number, item: StockLevelItem) => sum + (item.quantity || 0), 0),
          totalValue: items.reduce((sum: number, item: StockLevelItem) => sum + (item.value || 0), 0),
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
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch stock levels';
        throw new GraphQLError(errorMessage, {
          extensions: { 
            code: 'INTERNAL_SERVER_ERROR',
            requestId 
          }
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
            extensions: { code: 'UNAUTHENTICATED' }
          });
        }

        const supabase = await createClient();
        const { input } = args;

        // 檢查庫存是否足夠
        const { data: stockData, error: stockError } = await supabase
          .from('data_code')
          .select('*')
          .eq('product_code', input.productCode)
          .eq('current_plt_loc', input.fromLocation)
          .single();

        if (stockError || !stockData) {
          return {
            success: false,
            transfer: null,
            message: 'Source location not found or insufficient stock',
          };
        }

        const availableQty = safeNumber(safeGet(stockData, 'product_qty'), 0);
        if (availableQty < input.quantity) {
          return {
            success: false,
            transfer: null,
            message: `Insufficient stock. Available: ${availableQty}`,
          };
        }

        // 創建轉移記錄
        const transferData = {
          product_code: input.productCode,
          quantity: input.quantity,
          from_location: input.fromLocation,
          to_location: input.toLocation,
          status: 'PENDING',
          created_by: context.user.email,
          created_at: new Date().toISOString(),
          notes: input.notes,
        };

        const { data: transfer, error: transferError } = await supabase
          .from('stock_transfers')
          .insert(transferData)
          .select()
          .single();

        if (transferError) {
          throw new GraphQLError(`Failed to create transfer: ${transferError.message}`, {
            extensions: { code: 'DATABASE_ERROR' }
          });
        }

        // TODO: 實際執行庫存轉移邏輯

        return {
          success: true,
          transfer: {
            ...transfer,
            productDesc: '', // 需要從產品表獲取
            createdBy: transfer.created_by,
            createdAt: transfer.created_at,
            fromLocation: transfer.from_location,
            toLocation: transfer.to_location,
            completedAt: transfer.completed_at,
          },
          message: 'Transfer created successfully',
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create transfer';
        throw new GraphQLError(errorMessage, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
},

    updateTransferStatus: async (_: unknown, args: { id: string; status: string }, context: GraphQLContext) => {
      try {
        // 權限檢查
        if (!context.user) {
          throw new GraphQLError('Unauthorized', {
            extensions: { code: 'UNAUTHENTICATED' }
          });
        }

        const supabase = await createClient();
        
        const updateData: Record<string, unknown> = {
          status: args.status,
        };

        if (args.status === 'COMPLETED') {
          updateData.completed_at = new Date().toISOString();
        }

        const { data, error } = await supabase
          .from('stock_transfers')
          .update(updateData)
          .eq('id', args.id)
          .select()
          .single();

        if (error) {
          throw new GraphQLError(`Failed to update transfer: ${error.message}`, {
            extensions: { code: 'DATABASE_ERROR' }
          });
        }

        return {
          success: true,
          transfer: {
            ...data,
            productDesc: '', // 需要從產品表獲取
            createdBy: data.created_by,
            createdAt: data.created_at,
            fromLocation: data.from_location,
            toLocation: data.to_location,
            completedAt: data.completed_at,
          },
          message: 'Transfer status updated successfully',
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update transfer status';
        throw new GraphQLError(errorMessage, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    cancelTransfer: async (_: unknown, args: { id: string; reason?: string }, context: GraphQLContext) => {
      try {
        // 權限檢查
        if (!context.user) {
          throw new GraphQLError('Unauthorized', {
            extensions: { code: 'UNAUTHENTICATED' }
          });
        }

        const supabase = await createClient();
        
        const updateData = {
          status: 'CANCELLED',
          notes: args.reason || 'Cancelled by user',
        };

        const { data, error } = await supabase
          .from('stock_transfers')
          .update(updateData)
          .eq('id', args.id)
          .eq('status', 'PENDING') // 只能取消待處理的轉移
          .select()
          .single();

        if (error) {
          throw new GraphQLError(`Failed to cancel transfer: ${error.message}`, {
            extensions: { code: 'DATABASE_ERROR' }
          });
        }

        if (!data) {
          return {
            success: false,
            transfer: null,
            message: 'Transfer not found or already processed',
          };
        }

        return {
          success: true,
          transfer: {
            ...data,
            productDesc: '', // 需要從產品表獲取
            createdBy: data.created_by,
            createdAt: data.created_at,
            fromLocation: data.from_location,
            toLocation: data.to_location,
            completedAt: data.completed_at,
          },
          message: 'Transfer cancelled successfully',
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to cancel transfer';
        throw new GraphQLError(errorMessage, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },
  },

  // Field resolvers
  StockTransfer: {
    pallet: async (parent: Record<string, unknown>, _args: Record<string, unknown>, context: GraphQLContext) => {
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
          console.warn(`[StockTransfer.pallet] No pallet found for plt_num: ${parent.pallet_number}`);
          return null;
        }

        return {
          plt_num: data.plt_num,
          product_code: data.product_code,
          product_qty: data.product_qty,
          generate_time: data.generate_time,
          series: data.series,
          f_loc: (data as Record<string, unknown>).f_loc as string || '',
          qc_status: (data as Record<string, unknown>).qc_status as string || '',
        };
      } catch (error) {
        console.error('[StockTransfer.pallet] Error loading pallet:', error);
        return null;
      }
    },
  },
};

export default inventoryMigrationResolvers;