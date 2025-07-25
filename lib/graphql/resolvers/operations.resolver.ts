/**
 * Operations GraphQL Resolvers
 */

import { IResolvers } from '@graphql-tools/utils';
import { GraphQLContext } from './index';

export const operationsResolvers: IResolvers = {
  Transfer: {
    pallet: async (parent, _args, context: GraphQLContext) => {
      return context.loaders.pallet.load(parent.plt_num || parent.pltNum);
    },

    requestedBy: async (parent, _args, context: GraphQLContext) => {
      if (!parent.requested_by && !parent.requestedBy) return null;
      return context.loaders.user.load(parent.requested_by || parent.requestedBy);
    },

    executedBy: async (parent, _args, context: GraphQLContext) => {
      if (!parent.executed_by && !parent.executedBy) return null;
      return context.loaders.user.load(parent.executed_by || parent.executedBy);
    },
  },

  Order: {
    customer: async (parent, _args, context: GraphQLContext) => {
      if (!parent.customer_code && !parent.customerCode) return null;
      return context.loaders.customer.load(parent.customer_code || parent.customerCode);
    },
  },

  WorkLevel: {
    user: async (parent, _args, context: GraphQLContext) => {
      return context.loaders.user.load(parent.user_id || parent.userId);
    },
  },

  Query: {
    unifiedOperations: async (_parent, args, context: GraphQLContext) => {
      const { warehouse, dateRange } = args;

      if (!context.loaders.unifiedOperations) {
        throw new Error('Unified operations loader not initialized');
      }

      return context.loaders.unifiedOperations.load({
        warehouse,
        dateRange,
      });
    },

    workLevel: async (_parent, args, context: GraphQLContext) => {
      const { userId, date } = args;

      if (!context.loaders.workLevel) {
        throw new Error('Work level loader not initialized');
      }

      return context.loaders.workLevel.load({
        userId,
        date: date.toISOString().split('T')[0], // Convert to YYYY-MM-DD
      });
    },

    workLevels: async (_parent, args, context: GraphQLContext) => {
      const { dateRange, userIds } = args;

      if (!context.loaders.workLevel) {
        throw new Error('Work level loader not initialized');
      }

      // For simplicity, we'll query each combination
      // In production, this should be optimized
      const results = [];

      if (userIds && dateRange) {
        // Generate date range
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        const dates = [];

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          dates.push(new Date(d).toISOString().split('T')[0]);
        }

        // Load all combinations
        for (const userId of userIds) {
          for (const date of dates) {
            const workLevel = await context.loaders.workLevel.load({
              userId,
              date,
            });
            if (workLevel) {
              results.push(workLevel);
            }
          }
        }
      }

      return results;
    },
  },

  Mutation: {
    createTransfer: async (_parent, args, context: GraphQLContext) => {
      const { input } = args;

      // Would implement actual transfer creation
      const { data, error } = await context.supabase
        .from('record_transfer')
        .insert({
          plt_num: input.pltNum,
          t_loc: input.toLocation,
          quantity: input.quantity,
          reason: input.reason,
          priority: input.priority || 'NORMAL',
          status: 'PENDING',
          requested_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  },
};
