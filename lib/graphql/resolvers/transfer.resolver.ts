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
    uuid: (parent: Transfer) => parent.uuid || parent.id,
    pltNum: (parent: Transfer) => parent.plt_num,
    fromLocation: (parent: Transfer) => parent.f_loc || parent.from_location,
    toLocation: (parent: Transfer) => parent.t_loc || parent.to_location,
    operatorId: (parent: Transfer) => parent.operator_id,
    tranDate: (parent: Transfer) => parent.tran_date,
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
          query = query.gt('uuid', after);
        }

        const { data, error } = await query;

        if (error) {
          throw new Error(`Failed to fetch transfers: ${error.message}`);
        }

        return {
          edges: (data || []).map((item) => ({
            node: item,
            cursor: item.uuid.toString(),
          })),
          pageInfo: {
            hasNextPage: data && data.length === first,
            hasPreviousPage: !!after,
            startCursor: data && data.length > 0 ? data[0].uuid.toString() : null,
            endCursor: data && data.length > 0 ? data[data.length - 1].uuid.toString() : null,
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
          .eq('uuid', id)
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