/**
 * Product GraphQL Resolvers
 * 完整實現產品相關的 GraphQL 查詢和變更
 */

import { IResolvers } from '@graphql-tools/utils';
import { GraphQLContext } from './index';
import { GraphQLError } from 'graphql';
import type { SupabaseClient } from '@supabase/supabase-js';

// Helper types for pagination
interface PaginationParams {
  first?: number;
  after?: string;
  last?: number;
  before?: string;
  limit?: number;
  offset?: number;
}

// Helper function for pagination with proper typing
function buildPaginationQuery<T>(query: T, pagination?: PaginationParams): T {
  if (!pagination) return query;

  const { first, after, last, before, limit, offset } = pagination;

  // Properly typed Supabase query builder
  const supabaseQuery = query as any; // Safe type assertion for Supabase query builder

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
      typedQuery = (typedQuery as unknown as typeof supabaseQuery).gt('id', after) as T;
    }
    return typedQuery;
  } else if (last && last > 0) {
    let typedQuery = supabaseQuery.limit(last) as T;
    if (before) {
      typedQuery = (typedQuery as unknown as typeof supabaseQuery).lt('id', before) as T;
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
  const supabaseQuery = query as any;

  if (!sort) return supabaseQuery.order('code', { ascending: true });

  const { field, order } = sort;
  return supabaseQuery.order(field || 'code', { ascending: order !== 'DESC' });
}

// Helper types for filtering
interface ProductFilter {
  code?: string;
  description?: string;
  type?: string;
  colour?: string;
  isActive?: boolean;
  hasInventory?: boolean;
  minQuantity?: number;
  maxQuantity?: number;
}

// Helper function for filtering
function buildProductFilter<T>(query: T, filter?: ProductFilter): T {
  if (!filter) return query;

  const supabaseQuery = query as unknown as {
    ilike: (column: string, pattern: string) => T;
    eq: (column: string, value: unknown) => T;
    gt: (column: string, value: number) => T;
    lt: (column: string, value: number) => T;
  };

  let result = query;

  if (filter.code) {
    result = supabaseQuery.ilike('code', `%${filter.code}%`);
  }
  if (filter.description) {
    result = (result as typeof supabaseQuery).ilike('description', `%${filter.description}%`);
  }
  if (filter.type) {
    result = (result as typeof supabaseQuery).eq('type', filter.type);
  }
  if (filter.colour) {
    result = (result as typeof supabaseQuery).eq('colour', filter.colour);
  }
  if (filter.isActive !== undefined) {
    result = (result as typeof supabaseQuery).eq('is_active', filter.isActive);
  }

  return result;
}

export const productResolvers: IResolvers = {
  Product: {
    // Field resolvers
    standardQty: parent => {
      // Map database field standard_qty to GraphQL field standardQty
      return parent.standard_qty || null;
    },

    inventory: async (parent, _args, context: GraphQLContext) => {
      try {
        // Use DataLoader for batch loading to avoid N+1 queries
        if (context.loaders?.inventory) {
          return await context.loaders.inventory.load(parent.code);
        }

        // Fallback to direct query if DataLoader not available
        const { data, error } = await context.supabase
          .from('stock_level')
          .select('*')
          .eq('stock', parent.code)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error(`[ProductResolver] Database error for product ${parent.code}:`, {
            error: error.message,
            code: error.code,
            details: error.details,
          });
          throw new GraphQLError(`Failed to load inventory: ${error.message}`);
        }

        if (!data) {
          return {
            totalQuantity: 0,
            availableQuantity: 0,
            reservedQuantity: 0,
            locationBreakdown: {
              injection: 0,
              pipeline: 0,
              prebook: 0,
              await: 0,
              fold: 0,
              bulk: 0,
              backcarpark: 0,
              damage: 0,
            },
            lastUpdate: new Date().toISOString(),
          };
        }

        return {
          totalQuantity: data.stock_level || 0,
          availableQuantity: data.stock_level || 0, // 沒有 reserved_qty 欄位時，假設全部可用
          reservedQuantity: 0, // stock_level 表沒有此欄位
          locationBreakdown: {
            // stock_level 表沒有詳細位置資訊，回傳總量或 0
            injection: 0,
            pipeline: 0,
            prebook: 0,
            await: 0,
            fold: 0,
            bulk: data.stock_level || 0, // 假設全部庫存在 bulk 位置
            backcarpark: 0,
            damage: 0,
          },
          lastUpdate: data.update_time || new Date().toISOString(),
        };
      } catch (error) {
        console.error(`[ProductResolver] Error loading inventory for ${parent.code}:`, error);
        throw new GraphQLError(`Failed to load inventory for product ${parent.code}`);
      }
    },

    pallets: async (parent, args, context: GraphQLContext) => {
      try {
        const { filter, pagination } = args;

        let query = context.supabase
          .from('record_palletinfo')
          .select(
            `
            plt_num,
            product_code,
            product_qty,
            location,
            created_at,
            updated_at,
            status,
            grn_number,
            batch_number,
            expiry_date,
            manufacture_date
          `
          )
          .eq('product_code', parent.code);

        // Apply filters
        if (filter) {
          if (filter.status) {
            query = query.eq('status', filter.status);
          }
          if (filter.location) {
            query = query.eq('location', filter.location);
          }
          if (filter.grnNumber) {
            query = query.eq('grn_number', filter.grnNumber);
          }
          if (filter.dateRange) {
            if (filter.dateRange.from) {
              query = query.gte('created_at', filter.dateRange.from);
            }
            if (filter.dateRange.to) {
              query = query.lte('created_at', filter.dateRange.to);
            }
          }
        }

        // Get total count first
        const countQuery = context.supabase
          .from('record_palletinfo')
          .select('*', { count: 'exact', head: true })
          .eq('product_code', parent.code)
          .eq('status', 'active');

        const { count: totalCount, error: countError } = await countQuery;

        if (countError) {
          throw new GraphQLError(`Failed to count pallets: ${countError.message}`);
        }

        // Apply pagination and sorting
        query = buildSortQuery(query, args.sort);
        query = buildPaginationQuery(query, pagination);

        const { data, error } = await query;

        if (error) {
          throw new GraphQLError(`Failed to load pallets: ${error.message}`);
        }

        const edges = (data || []).map((pallet, index) => ({
          cursor: Buffer.from(pallet.plt_num).toString('base64'),
          node: {
            pltNum: pallet.plt_num,
            productCode: pallet.product_code,
            quantity: pallet.product_qty || 0,
            location: pallet.location,
            status: pallet.status || 'ACTIVE',
            grnNumber: pallet.grn_number,
            batchNumber: pallet.batch_number,
            expiryDate: pallet.expiry_date,
            manufactureDate: pallet.manufacture_date,
            createdAt: pallet.created_at,
            updatedAt: pallet.updated_at,
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
        console.error(`[ProductResolver] Error loading pallets for ${parent.code}:`, error);
        throw error instanceof GraphQLError
          ? error
          : new GraphQLError(`Failed to load pallets for product ${parent.code}`);
      }
    },

    statistics: async (parent, _args, context: GraphQLContext) => {
      try {
        // Aggregate statistics from multiple sources
        const [stockData, palletData] = await Promise.all([
          // Get stock level data
          context.supabase
            .from('stock_level')
            .select('stock_level, update_time')
            .eq('stock', parent.code)
            .single(),

          // Get pallet statistics
          context.supabase
            .from('record_palletinfo')
            .select('plt_num, location, product_qty, created_at')
            .eq('product_code', parent.code)
            .not('status', 'eq', 'VOID'),
        ]);

        const totalQuantity = stockData.data?.stock_level || 0;
        const pallets = palletData.data || [];
        const totalPallets = pallets.length;
        const uniqueLocations = new Set(pallets.map(p => p.location).filter(Boolean)).size;

        // Calculate average stock level (simplified)
        const averageStockLevel = totalQuantity > 0 ? totalQuantity / Math.max(totalPallets, 1) : 0;

        // Find last movement date
        const lastMovementDate =
          pallets.length > 0
            ? pallets
                .reduce((latest, pallet) => {
                  const palletDate = new Date(pallet.created_at);
                  return palletDate > latest ? palletDate : latest;
                }, new Date(pallets[0].created_at))
                .toISOString()
            : null;

        return {
          totalQuantity,
          totalPallets,
          totalLocations: uniqueLocations,
          averageStockLevel: parseFloat(averageStockLevel.toFixed(2)),
          stockTurnoverRate: null, // Would need historical data to calculate
          lastMovementDate,
        };
      } catch (error) {
        console.error(`[ProductResolver] Error calculating statistics for ${parent.code}:`, error);
        // Return default statistics on error
        return {
          totalQuantity: 0,
          totalPallets: 0,
          totalLocations: 0,
          averageStockLevel: 0,
          stockTurnoverRate: null,
          lastMovementDate: null,
        };
      }
    },
  },

  Query: {
    product: async (_parent, args, context: GraphQLContext) => {
      try {
        if (!args.code || args.code.trim() === '') {
          throw new Error('Product code is required');
        }
        return await context.loaders.product.load(args.code.trim());
      } catch (error) {
        console.error(`[ProductResolver] Error loading product ${args.code}:`, error);
        return null;
      }
    },

    products: async (_parent, args, context: GraphQLContext) => {
      try {
        const { filter, pagination, sort } = args;

        let query = context.supabase.from('data_code').select(`
            code,
            description,
            colour,
            type,
            standard_qty,
            remark
          `);

        // Apply filters
        query = buildProductFilter(query, filter);

        // Get total count
        const { count: totalCount, error: countError } = await buildProductFilter(
          context.supabase.from('data_code').select('*', { count: 'exact', head: true }),
          filter
        );

        if (countError) {
          throw new GraphQLError(`Failed to count products: ${countError.message}`);
        }

        // Apply sorting and pagination
        query = buildSortQuery(query, sort);
        query = buildPaginationQuery(query, pagination);

        const { data, error } = await query;

        if (error) {
          throw new GraphQLError(`Failed to load products: ${error.message}`);
        }

        const edges = (data || []).map((product, index) => ({
          cursor: Buffer.from(product.code).toString('base64'),
          node: {
            code: product.code,
            description: product.description,
            colour: product.colour,
            type: product.type,
            standardQty: product.standard_qty || null,
            remark: product.remark,
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
        console.error('[ProductResolver] Error loading products:', error);
        throw error instanceof GraphQLError ? error : new GraphQLError('Failed to load products');
      }
    },

    searchProducts: async (_parent, args, context: GraphQLContext) => {
      try {
        const { query, limit = 10 } = args;

        const { data, error } = await context.supabase
          .from('data_code')
          .select(
            `
            code,
            description,
            colour,
            type,
            standard_qty,
            remark
          `
          )
          .or(`code.ilike.%${query}%,description.ilike.%${query}%`)
          .limit(limit)
          .order('code', { ascending: true });

        if (error) {
          throw new GraphQLError(`Search failed: ${error.message}`);
        }

        return (data || []).map(product => ({
          code: product.code,
          description: product.description,
          colour: product.colour,
          type: product.type,
          standardQty: product.standard_qty || null,
          remark: product.remark,
        }));
      } catch (error) {
        console.error(`[ProductResolver] Search error:`, error);
        throw error instanceof GraphQLError ? error : new GraphQLError('Product search failed');
      }
    },

    productStatistics: async (_parent, args, context: GraphQLContext) => {
      try {
        const { productCode, dateRange } = args;

        if (!productCode || productCode.trim() === '') {
          throw new GraphQLError('Product code is required for statistics');
        }

        // Get basic product to ensure it exists
        const product = await context.loaders.product.load(productCode.trim());
        if (!product) {
          throw new GraphQLError(`Product ${productCode} not found`);
        }

        // Build date filter if provided
        let dateFilter = '';
        if (dateRange) {
          if (dateRange.startDate) {
            dateFilter += ` AND created_at >= '${dateRange.startDate}'`;
          }
          if (dateRange.endDate) {
            dateFilter += ` AND created_at <= '${dateRange.endDate}'`;
          }
        }

        // Get statistics from multiple sources
        const [palletStats, inventoryStats, movementStats] = await Promise.all([
          // Pallet statistics
          context.supabase
            .from('record_palletinfo')
            .select('product_qty, location', { count: 'exact' })
            .eq('product_code', productCode)
            .eq('status', 'active'),

          // Inventory statistics
          context.supabase
            .from('stock_level')
            .select('stock_level, update_time')
            .eq('stock', productCode)
            .order('update_time', { ascending: false })
            .limit(1),

          // Movement statistics
          context.supabase
            .from('record_history')
            .select('created_at')
            .eq('product_code', productCode)
            .order('created_at', { ascending: false })
            .limit(1),
        ]);

        // Calculate statistics
        const totalPallets = palletStats.count || 0;
        const totalQuantity =
          palletStats.data?.reduce((sum, p) => sum + (p.product_qty || 0), 0) || 0;
        const uniqueLocations = new Set(palletStats.data?.map(p => p.location).filter(Boolean))
          .size;
        const currentStock = inventoryStats.data?.[0]?.stock_level || 0;
        const lastMovement = movementStats.data?.[0]?.created_at || null;

        return {
          totalQuantity: currentStock,
          totalPallets,
          totalLocations: uniqueLocations,
          averageStockLevel: totalPallets > 0 ? Math.round(totalQuantity / totalPallets) : 0,
          stockTurnoverRate: null, // Would need historical data to calculate
          lastMovementDate: lastMovement,
        };
      } catch (error) {
        console.error(`[ProductResolver] Error getting statistics for ${args.productCode}:`, error);
        throw error instanceof GraphQLError
          ? error
          : new GraphQLError('Failed to get product statistics');
      }
    },
  },

  Mutation: {
    createProduct: async (_parent, args, context: GraphQLContext) => {
      try {
        const { input } = args;

        const { data, error } = await context.supabase
          .from('data_code')
          .insert({
            code: input.code,
            description: input.description,
            colour: input.colour,
            type: input.type,
            standard_qty: input.standardQty,
            remark: input.remark,
          })
          .select()
          .single();

        if (error) {
          throw new GraphQLError(`Failed to create product: ${error.message}`);
        }

        // Prime the cache
        // Clear loader cache to ensure fresh data on next query
        context.loaders.product.clear(data.code);

        // Return the created product
        return {
          code: data.code,
          description: data.description,
          colour: data.colour,
          type: data.type,
          standardQty: data.standard_qty || null,
          remark: data.remark,
        };
      } catch (error) {
        console.error('[ProductResolver] Error creating product:', error);
        throw error instanceof GraphQLError ? error : new GraphQLError('Failed to create product');
      }
    },

    updateProduct: async (_parent, args, context: GraphQLContext) => {
      try {
        const { code, input } = args;

        const updateData: Record<string, unknown> = {};

        // Only update provided fields that exist in database
        if (input.description !== undefined) updateData.description = input.description;
        if (input.colour !== undefined) updateData.colour = input.colour;
        if (input.type !== undefined) updateData.type = input.type;
        if (input.standardQty !== undefined) updateData.standard_qty = input.standardQty;
        if (input.remark !== undefined) updateData.remark = input.remark;

        const { data, error } = await context.supabase
          .from('data_code')
          .update(updateData)
          .eq('code', code)
          .select()
          .single();

        if (error) {
          throw new GraphQLError(`Failed to update product: ${error.message}`);
        }

        // Clear cache
        context.loaders.product.clear(code);

        const product = {
          code: data.code,
          description: data.description,
          colour: data.colour,
          type: data.type,
          standardQty: data.standard_qty || null,
          remark: data.remark,
        };

        return product;
      } catch (error) {
        console.error(`[ProductResolver] Error updating product ${args.code}:`, error);
        throw error instanceof GraphQLError ? error : new GraphQLError('Failed to update product');
      }
    },

    deactivateProduct: async (_parent, args, context: GraphQLContext) => {
      try {
        const { code } = args;

        // Since is_active doesn't exist in table, just return the product
        const { data, error } = await context.supabase
          .from('data_code')
          .select()
          .eq('code', code)
          .single();

        if (error) {
          throw new GraphQLError(`Failed to deactivate product: ${error.message}`);
        }

        // Clear cache
        context.loaders.product.clear(code);

        return {
          code: data.code,
          description: data.description,
          colour: data.colour,
          type: data.type,
          standardQty: data.standard_qty || null,
          remark: data.remark,
        };
      } catch (error) {
        console.error(`[ProductResolver] Error deactivating product ${args.code}:`, error);
        throw error instanceof GraphQLError
          ? error
          : new GraphQLError('Failed to deactivate product');
      }
    },
  },
};
