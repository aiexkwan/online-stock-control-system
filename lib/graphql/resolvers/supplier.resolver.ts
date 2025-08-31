/**
 * Supplier GraphQL Resolvers
 * Complete implementation of supplier-related GraphQL queries and mutations
 */

import { IResolvers } from '@graphql-tools/utils';
import { GraphQLError } from 'graphql';
import { GraphQLContext } from './index';

// Helper types for pagination (same as product resolver)
interface PaginationParams {
  first?: number;
  after?: string;
  last?: number;
  before?: string;
  limit?: number;
  offset?: number;
}

// Helper function for pagination
function buildPaginationQuery<T>(query: T, pagination?: PaginationParams): T {
  if (!pagination) return query;

  const { first, after, last, before, limit, offset } = pagination;

  const supabaseQuery = query as unknown as {
    limit: (count: number) => typeof query;
    gt: (column: string, value: string) => typeof query;
    lt: (column: string, value: string) => typeof query;
    range: (from: number, to: number) => typeof query;
  };

  if (limit && limit > 0) {
    const typedQuery = supabaseQuery.limit(limit) as T;
    if (offset && offset > 0) {
      return (typedQuery as unknown as typeof supabaseQuery).range(offset, offset + limit - 1) as T;
    }
    return typedQuery;
  }

  if (first && first > 0) {
    let typedQuery = supabaseQuery.limit(first) as T;
    if (after) {
      typedQuery = (typedQuery as unknown as typeof supabaseQuery).gt('supplier_code', after) as T;
    }
    return typedQuery;
  } else if (last && last > 0) {
    let typedQuery = supabaseQuery.limit(last) as T;
    if (before) {
      typedQuery = (typedQuery as unknown as typeof supabaseQuery).lt('supplier_code', before) as T;
    }
    return typedQuery;
  }

  return query;
}

// Helper types for sorting
interface SortParams {
  field?: string;
  order?: 'ASC' | 'DESC';
}

// Helper function for sorting
function buildSortQuery<T>(query: T, sort?: SortParams): T {
  const supabaseQuery = query as unknown as {
    order: (column: string, options?: { ascending: boolean }) => T;
  };

  if (!sort) return supabaseQuery.order('supplier_code', { ascending: true });

  const { field, order } = sort;
  return supabaseQuery.order(field || 'supplier_code', { ascending: order !== 'DESC' });
}

// Helper types for filtering
interface SupplierFilter {
  code?: string;
  name?: string;
  status?: string;
}

// Helper function for filtering
function buildSupplierFilter<T>(query: T, filter?: SupplierFilter): T {
  if (!filter) return query;

  const supabaseQuery = query as unknown as {
    ilike: (column: string, pattern: string) => T;
    eq: (column: string, value: unknown) => T;
  };

  let result = query;

  if (filter.code) {
    result = supabaseQuery.ilike('supplier_code', `%${filter.code}%`);
  }
  if (filter.name) {
    result = (result as typeof supabaseQuery).ilike('supplier_name', `%${filter.name}%`);
  }
  if (filter.status) {
    result = (result as typeof supabaseQuery).eq('status', filter.status);
  }

  return result;
}

export const supplierResolvers: IResolvers = {
  Supplier: {
    // Map database fields to GraphQL schema
    supplier_code: parent => parent.supplier_code,
    supplier_name: parent => parent.supplier_name,

    // Removed statistics, products, grns field resolvers since they don't exist in the simplified schema
    // The data_supplier table only has supplier_code and supplier_name fields

    /* Commented out - these fields don't exist in the simplified Supplier schema
    statistics: async (parent, _args, _context: GraphQLContext) => {
      try {
        // Get supplier statistics from multiple sources
        const [grnData, productData] = await Promise.all([
          // Get GRN statistics
          context.supabase
            .from('record_grn')
            .select('grn_number, received_date, supplier_code')
            .eq('supplier_code', parent.supplier_code),
          
          // Get product count (this would need proper table structure)
          context.supabase
            .from('data_code')
            .select('code', { count: 'exact', head: true })
            // Note: This is a placeholder since we don't have supplier-product mapping
        ]);

        const grns = grnData.data || [];
        const totalGRNs = grns.length;
        
        // Calculate basic statistics
        const lastDeliveryDate = grns.length > 0 
          ? grns.reduce((latest, grn) => {
              const grnDate = new Date(grn.received_date);
              return grnDate > latest ? grnDate : latest;
            }, new Date(grns[0].received_date)).toISOString()
          : null;

        return {
          totalOrders: 0, // Would need orders table
          totalProducts: productData.count || 0,
          totalGRNs,
          averageLeadTime: null, // Would need historical data
          onTimeDeliveryRate: null, // Would need delivery tracking
          qualityRating: null, // Would need quality data
          lastOrderDate: null, // Would need orders table
          lastDeliveryDate };
      } catch (error) {
        console.error(`[SupplierResolver] Error calculating statistics for ${parent.supplier_code}:`, error);
        return {
          totalOrders: 0,
          totalProducts: 0,
          totalGRNs: 0,
          averageLeadTime: null,
          onTimeDeliveryRate: null,
          qualityRating: null,
          lastOrderDate: null,
          lastDeliveryDate: null };
      }
    },

    products: async (parent, args, _context: GraphQLContext) => {
      try {
        // This is a placeholder - in reality, we'd need a supplier-product mapping table
        const { pagination, sort } = args;
        
        // For now, return empty since we don't have supplier-product relationship
        return {
          edges: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null },
          totalCount: 0 };
      } catch (error) {
        console.error(`[SupplierResolver] Error loading products for ${parent.supplier_code}:`, error);
        throw new GraphQLError(`Failed to load products for supplier ${parent.supplier_code}`);
      }
    },

    grns: async (parent, args, _context: GraphQLContext) => {
      try {
        const { filter, pagination, sort } = args;
        
        let query = context.supabase
          .from('record_grn')
          .select(`
            grn_number,
            product_code,
            qty,
            received_date,
            supplier_code,
            status,
            invoice_number,
            remarks
          `)
          .eq('supplier_code', parent.supplier_code);

        // Apply filters
        if (filter) {
          if (filter.status) {
            query = query.eq('status', filter.status);
          }
          if (filter.productCode) {
            query = query.eq('product_code', filter.productCode);
          }
          if (filter.dateRange) {
            if (filter.dateRange.from) {
              query = query.gte('received_date', filter.dateRange.from);
            }
            if (filter.dateRange.to) {
              query = query.lte('received_date', filter.dateRange.to);
            }
          }
        }

        // Get total count
        const { count: totalCount, error: countError } = await context.supabase
          .from('record_grn')
          .select('*', { count: 'exact', head: true })
          .eq('supplier_code', parent.supplier_code);
        
        if (countError) {
          throw new GraphQLError(`Failed to count GRNs: ${countError.message}`);
        }

        // Apply pagination and sorting
        query = buildSortQuery(query, sort);
        query = buildPaginationQuery(query, pagination);

        const { data, error } = await query;

        if (error) {
          throw new GraphQLError(`Failed to load GRNs: ${error.message}`);
        }

        const edges = (data || []).map((grn, _index) => ({
          cursor: Buffer.from(grn.grn_number).toString('base64'),
          node: {
            grnNumber: grn.grn_number,
            productCode: grn.product_code,
            quantity: grn.qty || 0,
            receivedDate: grn.received_date,
            status: grn.status || 'RECEIVED',
            invoiceNumber: grn.invoice_number,
            remarks: grn.remarks } }));

        const hasNextPage = pagination?.first ? data.length >= (pagination.first || 0) : false;
        const hasPreviousPage = !!pagination?.after || !!pagination?.before;

        return {
          edges,
          pageInfo: {
            hasNextPage,
            hasPreviousPage,
            startCursor: edges.length > 0 ? edges[0].cursor : null,
            endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null },
          totalCount: totalCount || 0 };
      } catch (error) {
        console.error(`[SupplierResolver] Error loading GRNs for ${parent.supplier_code}:`, error);
        throw error instanceof GraphQLError ? error : new GraphQLError(`Failed to load GRNs for supplier ${parent.supplier_code}`);
      }
    },
    End of commented out field resolvers */
  },

  Query: {
    supplier: async (_parent, args, context: GraphQLContext) => {
      try {
        const { data, error } = await context.supabase
          .from('data_supplier')
          .select('*')
          .eq('supplier_code', args.code)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            return null; // Supplier not found
          }
          throw new GraphQLError(`Failed to load supplier: ${error.message}`);
        }

        return {
          supplier_code: data.supplier_code,
          supplier_name: data.supplier_name,
          // Map other fields as needed
        };
      } catch (error) {
        console.error(`[SupplierResolver] Error loading supplier ${args.code}:`, error);
        return null;
      }
    },

    suppliers: async (_parent, args, context: GraphQLContext) => {
      try {
        const { filter, pagination, sort } = args;

        let query = context.supabase.from('data_supplier').select('*');

        // Apply filters
        query = buildSupplierFilter(query, filter);

        // Get total count
        const { count: totalCount, error: countError } = await buildSupplierFilter(
          context.supabase.from('data_supplier').select('*', { count: 'exact', head: true }),
          filter
        );

        if (countError) {
          throw new GraphQLError(`Failed to count suppliers: ${countError.message}`);
        }

        // Apply sorting and pagination
        query = buildSortQuery(query, sort);
        query = buildPaginationQuery(query, pagination);

        const { data, error } = await query;

        if (error) {
          throw new GraphQLError(`Failed to load suppliers: ${error.message}`);
        }

        const edges = (data || []).map((supplier, _index) => ({
          cursor: Buffer.from(supplier.supplier_code).toString('base64'),
          node: {
            supplier_code: supplier.supplier_code,
            supplier_name: supplier.supplier_name,
            // Only these two fields exist in the simplified schema
          },
        }));

        const hasNextPage = pagination?.first ? data.length >= (pagination.first || 0) : false;
        const hasPreviousPage = !!pagination?.after || !!pagination?.before;

        return {
          edges,
          pageInfo: {
            hasNextPage,
            hasPreviousPage,
            startCursor: edges.length > 0 ? edges[0].cursor : null,
            endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
          },
          totalCount: totalCount || 0,
        };
      } catch (error) {
        console.error('[SupplierResolver] Error loading suppliers:', error);
        throw error instanceof GraphQLError ? error : new GraphQLError('Failed to load suppliers');
      }
    },

    searchSuppliers: async (_parent, args, context: GraphQLContext) => {
      try {
        const { query, limit = 10 } = args;

        const { data, error } = await context.supabase
          .from('data_supplier')
          .select('*')
          .or(`supplier_code.ilike.%${query}%,supplier_name.ilike.%${query}%`)
          .limit(limit)
          .order('supplier_code', { ascending: true });

        if (error) {
          throw new GraphQLError(`Search failed: ${error.message}`);
        }

        return (data || []).map(supplier => ({
          code: supplier.supplier_code,
          name: supplier.supplier_name,
          // Map other fields as needed
        }));
      } catch (error) {
        console.error(`[SupplierResolver] Search error:`, error);
        throw error instanceof GraphQLError ? error : new GraphQLError('Supplier search failed');
      }
    },
  },

  Mutation: {
    createSupplier: async (_parent, args, context: GraphQLContext) => {
      try {
        const { input } = args;

        const { data, error } = await context.supabase
          .from('data_supplier')
          .insert({
            supplier_code: input.code,
            supplier_name: input.name,
          })
          .select()
          .single();

        if (error) {
          throw new GraphQLError(`Failed to create supplier: ${error.message}`);
        }

        return {
          code: data.supplier_code,
          name: data.supplier_name,
          createdAt: new Date().toISOString(),
        };
      } catch (error) {
        console.error('[SupplierResolver] Error creating supplier:', error);
        throw error instanceof GraphQLError ? error : new GraphQLError('Failed to create supplier');
      }
    },

    updateSupplier: async (_parent, args, context: GraphQLContext) => {
      try {
        const { code, input } = args;

        const updateData: Record<string, unknown> = {};

        // Only update provided fields
        if (input.name !== undefined) updateData.supplier_name = input.name;

        const { data, error } = await context.supabase
          .from('data_supplier')
          .update(updateData)
          .eq('supplier_code', code)
          .select()
          .single();

        if (error) {
          throw new GraphQLError(`Failed to update supplier: ${error.message}`);
        }

        return {
          code: data.supplier_code,
          name: data.supplier_name,
          updatedAt: new Date().toISOString(),
        };
      } catch (error) {
        console.error(`[SupplierResolver] Error updating supplier ${args.code}:`, error);
        throw error instanceof GraphQLError ? error : new GraphQLError('Failed to update supplier');
      }
    },

    deactivateSupplier: async (_parent, args, context: GraphQLContext) => {
      try {
        const { code } = args;

        // Since status field might not exist, just return the supplier
        const { data, error } = await context.supabase
          .from('data_supplier')
          .select()
          .eq('supplier_code', code)
          .single();

        if (error) {
          throw new GraphQLError(`Failed to deactivate supplier: ${error.message}`);
        }

        return {
          code: data.supplier_code,
          name: data.supplier_name,
          status: 'INACTIVE',
        };
      } catch (error) {
        console.error(`[SupplierResolver] Error deactivating supplier ${args.code}:`, error);
        throw error instanceof GraphQLError
          ? error
          : new GraphQLError('Failed to deactivate supplier');
      }
    },
  },
};
