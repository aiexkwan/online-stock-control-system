/**
 * Inventory GraphQL Resolvers
 */

import { IResolvers } from '@graphql-tools/utils';
import { GraphQLContext } from './index';

export const inventoryResolvers: IResolvers = {
  Inventory: {
    product: async (parent, _args, context: GraphQLContext) => {
      const productCode = parent.product_code || parent.productCode;
      if (!productCode) return null;
      return context.loaders.product.load(productCode);
    },
  },

  Pallet: {
    product: async (parent, _args, context: GraphQLContext) => {
      const productCode = parent.product_code || parent.productCode;
      if (!productCode) return null;
      return context.loaders.product.load(productCode);
    },
    
    quantity: (parent) => {
      // Map database field 'product_qty' to GraphQL field 'quantity'
      return parent.product_qty || parent.quantity || 0;
    },
  },

  Query: {
    pallet: async (_parent, args, context: GraphQLContext) => {
      const { pltNum } = args;
      if (!pltNum) {
        throw new Error('Pallet number is required');
      }
      
      try {
        const pallet = await context.loaders.pallet.load(pltNum);
        return pallet;
      } catch (error) {
        console.error(`Error loading pallet ${pltNum}:`, error);
        throw new Error(`Failed to load pallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    inventories: async (_parent, args, context: GraphQLContext) => {
      // Implementation for inventories query from schema
      const { first = 20, after } = args;
      const { supabase } = context;

      try {
        let query = supabase
          .from('record_inventory')
          .select('*')
          .order('product_code')
          .limit(first);

        if (after) {
          query = query.gt('id', after);
        }

        const { data, error } = await query;

        if (error) {
          throw new Error(`Failed to fetch inventories: ${error.message}`);
        }

        return {
          edges: (data || []).map((item) => ({
            node: item,
            cursor: item.id.toString(),
          })),
          pageInfo: {
            hasNextPage: data && data.length === first,
            hasPreviousPage: !!after,
            startCursor: data && data.length > 0 ? data[0].id.toString() : null,
            endCursor: data && data.length > 0 ? data[data.length - 1].id.toString() : null,
          },
          totalCount: data?.length || 0,
        };
      } catch (error) {
        console.error('Error fetching inventories:', error);
        throw new Error('Failed to fetch inventories');
      }
    },

    inventory: async (_parent, args, context: GraphQLContext) => {
      // Implementation for inventory query from schema
      const { id } = args;
      const { supabase } = context;

      try {
        const { data, error } = await supabase
          .from('record_inventory')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          throw new Error(`Failed to fetch inventory: ${error.message}`);
        }

        return data;
      } catch (error) {
        console.error('Error fetching inventory:', error);
        throw new Error('Failed to fetch inventory');
      }
    },

    stockLevels: async (_parent, args, context: GraphQLContext) => {
      // Implementation for stockLevels query from schema
      const { filter, pagination } = args;
      const { supabase } = context;

      try {
        let query;
        
        // Apply filters if provided
        if (filter?.productType) {
          // Join with data_code table to filter by type
          query = supabase
            .from('stock_level')
            .select(`
              *,
              data_code!inner(type)
            `)
            .eq('data_code.type', filter.productType);
        } else {
          query = supabase
            .from('stock_level')
            .select('*');
        }

        if (filter?.minLevel) {
          query = query.gte('stock_level', filter.minLevel);
        }

        if (filter?.maxLevel) {
          query = query.lte('stock_level', filter.maxLevel);
        }

        // Apply pagination
        if (pagination?.limit) {
          query = query.limit(pagination.limit);
        }

        if (pagination?.offset) {
          query = query.range(pagination.offset, pagination.offset + (pagination.limit || 50) - 1);
        }

        const { data, error } = await query;

        if (error) {
          throw new Error(`Failed to fetch stock levels: ${error.message}`);
        }

        return data || [];
      } catch (error) {
        console.error('Error fetching stock levels:', error);
        throw new Error('Failed to fetch stock levels');
      }
    },
  },
};