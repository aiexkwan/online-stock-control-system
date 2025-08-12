/**
 * Transfer Resolver
 * GraphQL resolver for Transfer functionality
 */

import { IResolvers } from '@graphql-tools/utils';
import { GraphQLContext } from './index';
import type { Transfer } from '../types/database-types';

export const transferResolvers: IResolvers<unknown, GraphQLContext> = {
  Transfer: {
    // Field resolvers for Transfer type from schema
    id: (parent: Transfer) => parent.id,
    fromLocation: (parent: Transfer) => parent.from_location || parent.fromLocation,
    toLocation: (parent: Transfer) => parent.to_location || parent.toLocation,
    createdAt: (parent: Transfer) => parent.created_at || parent.createdAt,
  },

  Query: {
    transfers: async (_parent, args, context: GraphQLContext) => {
      // Implementation for transfers query from schema
      const { first = 20, after, filter } = args;
      const { supabase } = context;

      try {
        let query = supabase
          .from('record_transfer')
          .select('*')
          .order('tran_date', { ascending: false })
          .limit(first);

        // Apply filters if provided
        if (filter) {
          if (filter.dateRange) {
            if (filter.dateRange.start) {
              query = query.gte('tran_date', filter.dateRange.start);
            }
            if (filter.dateRange.end) {
              query = query.lte('tran_date', filter.dateRange.end);
            }
          }

          if (filter.fromLocation) {
            query = query.eq('f_loc', filter.fromLocation);
          }

          if (filter.toLocation) {
            query = query.eq('t_loc', filter.toLocation);
          }
        }

        if (after) {
          query = query.gt('id', after);
        }

        const { data, error } = await query;

        if (error) {
          throw new Error(`Failed to fetch transfers: ${error.message}`);
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
        console.error('Error fetching transfers:', error);
        throw new Error('Failed to fetch transfers');
      }
    },

    transfer: async (_parent, args, context: GraphQLContext) => {
      // Implementation for transfer query from schema
      const { id } = args;
      const { supabase } = context;

      try {
        const { data, error } = await supabase
          .from('record_transfer')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          throw new Error(`Failed to fetch transfer: ${error.message}`);
        }

        return data;
      } catch (error) {
        console.error('Error fetching transfer:', error);
        throw new Error('Failed to fetch transfer');
      }
    },
  },
};