/**
 * Product GraphQL Resolvers
 */

import { IResolvers } from '@graphql-tools/utils';
import { GraphQLContext } from './index';

export const productResolvers: IResolvers = {
  Product: {
    // Field resolvers
    inventory: async (parent, _args, context: GraphQLContext) => {
      return context.loaders.inventory.load(parent.code);
    },

    pallets: async (parent, args, context: GraphQLContext) => {
      const { filter, pagination } = args;

      // For now, return empty - would implement actual query
      return {
        edges: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          totalCount: 0,
          totalPages: 0,
          currentPage: 1,
        },
        totalCount: 0,
      };
    },

    statistics: async (parent, _args, context: GraphQLContext) => {
      // Would implement actual statistics calculation
      return {
        totalQuantity: 0,
        totalPallets: 0,
        totalLocations: 0,
        averageStockLevel: 0,
        stockTurnoverRate: 0,
        lastMovementDate: null,
      };
    },
  },

  Query: {
    product: async (_parent, args, context: GraphQLContext) => {
      return context.loaders.product.load(args.code);
    },

    products: async (_parent, args, context: GraphQLContext) => {
      // Would implement filtering, pagination, and sorting
      const { filter, pagination, sort } = args;

      return {
        edges: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          totalCount: 0,
          totalPages: 0,
          currentPage: 1,
        },
        totalCount: 0,
      };
    },

    searchProducts: async (_parent, args, context: GraphQLContext) => {
      const { query, limit = 10 } = args;

      const { data, error } = await context.supabase
        .from('data_code')
        .select('*')
        .or(`code.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
  },

  Mutation: {
    createProduct: async (_parent, args, context: GraphQLContext) => {
      const { input } = args;

      const { data, error } = await context.supabase
        .from('data_code')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    updateProduct: async (_parent, args, context: GraphQLContext) => {
      const { code, input } = args;

      const { data, error } = await context.supabase
        .from('data_code')
        .update(input)
        .eq('code', code)
        .select()
        .single();

      if (error) throw error;

      // Clear cache
      context.loaders.product.clear(code);

      return data;
    },
  },
};
