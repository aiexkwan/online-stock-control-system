/**
 * Inventory GraphQL Resolvers
 */

import { IResolvers } from '@graphql-tools/utils';
import { GraphQLContext } from './index';
import type {
  Inventory,
  Pallet,
  Product,
  QueryPalletArgs,
  QueryInventoriesArgs,
  QueryInventoryArgs,
  QueryStockLevelsArgs,
  InventoryFilterInput,
  PaginationInput,
  StockLevelFilterInput,
  StockLevel,
  PageInfo,
} from '../../../types/generated/graphql';

// Custom connection type for inventories response
interface InventoryConnection {
  edges: Array<{
    node: Inventory;
    cursor: string;
  }>;
  pageInfo: PageInfo;
  totalCount: number;
}

// Database record types for parent objects
interface InventoryRecord {
  uuid: string;
  product_code: string;
  productCode?: string;
  [key: string]: any;
}

interface PalletRecord {
  uuid: string;
  plt_num: string;
  product_code: string;
  productCode?: string;
  product_qty?: number;
  quantity?: number;
  [key: string]: any;
}

export const inventoryResolvers: IResolvers = {
  Inventory: {
    product: async (
      parent: InventoryRecord,
      _args: {},
      context: GraphQLContext
    ): Promise<Product | null> => {
      const productCode = parent.product_code || parent.productCode;
      if (!productCode) return null;
      try {
        return await context.loaders.product.load(productCode);
      } catch (error) {
        console.error(`Error loading product ${productCode}:`, error);
        return null;
      }
    },
  },

  Pallet: {
    product: async (
      parent: PalletRecord,
      _args: {},
      context: GraphQLContext
    ): Promise<Product | null> => {
      const productCode = parent.product_code || parent.productCode;
      if (!productCode) return null;
      try {
        return await context.loaders.product.load(productCode);
      } catch (error) {
        console.error(`Error loading product ${productCode}:`, error);
        return null;
      }
    },

    quantity: (parent: PalletRecord): number => {
      // Map database field 'product_qty' to GraphQL field 'quantity'
      return parent.product_qty || parent.quantity || 0;
    },
  },

  Query: {
    pallet: async (
      _parent: any,
      args: QueryPalletArgs,
      context: GraphQLContext
    ): Promise<Pallet | null> => {
      const { pltNum } = args;
      if (!pltNum) {
        throw new Error('Pallet number is required');
      }

      try {
        const pallet = await context.loaders.pallet.load(pltNum);
        return pallet;
      } catch (error) {
        console.error(`Error loading pallet ${pltNum}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to load pallet: ${errorMessage}`);
      }
    },

    inventories: async (
      _parent: any,
      args: QueryInventoriesArgs,
      context: GraphQLContext
    ): Promise<InventoryConnection> => {
      // Implementation for inventories query from schema
      const { pagination, filter } = args;
      const first = pagination?.first || 20;
      const after = pagination?.after;
      const { supabase } = context;

      try {
        let query = supabase
          .from('record_inventory')
          .select('*')
          .order('product_code')
          .limit(first);

        // Apply filters if provided
        if (filter?.productCode) {
          query = query.eq('product_code', filter.productCode);
        }

        if (filter?.minQuantity) {
          query = query.gte('total_quantity', filter.minQuantity);
        }

        if (filter?.maxQuantity) {
          query = query.lte('total_quantity', filter.maxQuantity);
        }

        if (after) {
          query = query.gt('uuid', after);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching inventories:', error);
          throw new Error(`Failed to fetch inventories: ${error.message}`);
        }

        const inventoryData = data || [];

        return {
          edges: inventoryData.map((item: any) => ({
            node: item as Inventory,
            cursor: String(item.uuid),
          })),
          pageInfo: {
            hasNextPage: inventoryData.length === first,
            hasPreviousPage: !!after,
            startCursor: inventoryData.length > 0 ? String(inventoryData[0].uuid) : null,
            endCursor:
              inventoryData.length > 0
                ? String(inventoryData[inventoryData.length - 1].uuid)
                : null,
            currentPage: after ? 2 : 1, // Simplified page calculation
            totalCount: inventoryData.length,
            totalPages: Math.ceil(inventoryData.length / first),
          },
          totalCount: inventoryData.length,
        };
      } catch (error) {
        console.error('Error fetching inventories:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to fetch inventories: ${errorMessage}`);
      }
    },

    inventory: async (
      _parent: any,
      args: QueryInventoryArgs,
      context: GraphQLContext
    ): Promise<Inventory | null> => {
      // Implementation for inventory query from schema
      const { productCode } = args;
      const { supabase } = context;

      try {
        const { data, error } = await supabase
          .from('record_inventory')
          .select('*')
          .eq('product_code', productCode)
          .single();

        if (error) {
          throw new Error(`Failed to fetch inventory: ${error.message}`);
        }

        return data as Inventory;
      } catch (error) {
        console.error('Error fetching inventory:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to fetch inventory: ${errorMessage}`);
      }
    },

    stockLevels: async (
      _parent: any,
      args: QueryStockLevelsArgs,
      context: GraphQLContext
    ): Promise<StockLevel[]> => {
      // Implementation for stockLevels query from schema
      const { dateRange, warehouse } = args;
      const { supabase } = context;

      try {
        let query = supabase.from('stock_level').select('*');

        // Apply filters if provided
        if (warehouse) {
          query = query.eq('warehouse', warehouse);
        }

        if (dateRange?.start) {
          query = query.gte('created_at', dateRange.start);
        }

        if (dateRange?.end) {
          query = query.lte('created_at', dateRange.end);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching stock levels:', error);
          throw new Error(`Failed to fetch stock levels: ${error.message}`);
        }

        return (data || []) as StockLevel[];
      } catch (error) {
        console.error('Error fetching stock levels:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to fetch stock levels: ${errorMessage}`);
      }
    },
  },
};
