/**
 * Transfer Resolver
 * GraphQL resolver for Transfer functionality
 */

import { IResolvers } from '@graphql-tools/utils';
import type {
  Transfer,
  QueryTransfersArgs,
  QueryTransferArgs,
  TransferConnection,
  TransferFilterInput,
  PaginationInput,
} from '../../../types/generated/graphql';
import type { GraphQLContext } from './index';

export const transferResolvers: IResolvers<unknown, GraphQLContext> = {
  Transfer: {
    // Field resolvers for Transfer type from schema
    uuid: (parent: any) => parent.uuid || parent.id,
    pltNum: (parent: any) => parent.plt_num,
    fromLocation: (parent: any) => parent.f_loc || parent.from_location,
    toLocation: (parent: any) => parent.t_loc || parent.to_location,
    operatorId: (parent: any) => parent.operator_id,
    tranDate: (parent: any) => parent.tran_date,
    // Add missing field resolvers from schema
    pallet: async (parent: any, _args: unknown, context: GraphQLContext) => {
      // Return pallet information - this would typically use a DataLoader
      return {
        pltNum: parent.plt_num,
        productCode: 'UNKNOWN', // Would be resolved via proper data loading
        quantity: 1,
        status: 'ACTIVE',
      };
    },
    operator: async (parent: any, _args: unknown, context: GraphQLContext) => {
      // Return operator/user information - this would typically use a DataLoader
      return null; // Optional field, can be null
    },
  },

  Query: {
    transfers: async (
      _parent: unknown,
      args: QueryTransfersArgs,
      context: GraphQLContext
    ): Promise<TransferConnection> => {
      // Implementation for transfers query from schema
      const { filter, pagination } = args;
      const { supabase } = context;

      // Extract pagination parameters
      const first = pagination?.first ?? pagination?.limit ?? 20;
      const after = pagination?.after;

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

          if (filter.pltNum) {
            query = query.eq('plt_num', filter.pltNum);
          }

          if (filter.executedBy) {
            query = query.eq('operator_id', filter.executedBy);
          }
        }

        if (after) {
          query = query.gt('uuid', after);
        }

        const { data, error } = await query;

        if (error) {
          throw new Error(`Failed to fetch transfers: ${error.message}`);
        }

        const totalCount = data?.length || 0;
        const currentPage = pagination?.page || 1;
        const totalPages = Math.ceil(totalCount / first);

        return {
          edges: (data || []).map(item => ({
            node: item,
            cursor: item.uuid.toString(),
          })),
          pageInfo: {
            hasNextPage: data ? data.length === first : false,
            hasPreviousPage: !!after,
            startCursor: data && data.length > 0 ? data[0].uuid.toString() : null,
            endCursor: data && data.length > 0 ? data[data.length - 1].uuid.toString() : null,
            totalCount,
            totalPages,
            currentPage,
          },
          totalCount,
        };
      } catch (error) {
        console.error('Error fetching transfers:', error);
        throw new Error('Failed to fetch transfers');
      }
    },

    transfer: async (
      _parent: unknown,
      args: QueryTransferArgs,
      context: GraphQLContext
    ): Promise<Transfer | null> => {
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
          if (error.code === 'PGRST116') {
            // No rows returned
            return null;
          }
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
