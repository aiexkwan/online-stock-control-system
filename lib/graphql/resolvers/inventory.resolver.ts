/**
 * Inventory GraphQL Resolvers
 */

import { IResolvers } from '@graphql-tools/utils';
import { GraphQLContext } from './index';

export const inventoryResolvers: IResolvers = {
  Inventory: {
    product: async (parent, _args, context: GraphQLContext) => {
      return context.loaders.product.load(parent.product_code || parent.productCode);
    },
  },

  Pallet: {
    product: async (parent, _args, context: GraphQLContext) => {
      return context.loaders.product.load(parent.product_code || parent.productCode);
    },
    
    transfers: async (parent, args, context: GraphQLContext) => {
      // Would implement transfer loading
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
  },

  Query: {
    stockLevels: async (_parent, args, context: GraphQLContext) => {
      const { warehouse, dateRange } = args;
      
      if (!context.loaders.stockLevels) {
        throw new Error('Stock levels loader not initialized');
      }
      
      return context.loaders.stockLevels.load({
        warehouse,
        dateRange,
      });
    },
  },
};