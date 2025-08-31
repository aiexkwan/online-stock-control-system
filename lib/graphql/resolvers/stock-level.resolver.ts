/**
 * Stock Level GraphQL Resolvers
 * Resolvers for stock level operations with proper data fetching from stock_level and data_code tables
 */

import { IResolvers } from '@graphql-tools/utils';
import { GraphQLError } from 'graphql';
import { format, subDays } from 'date-fns';
import type { StockLevelRecord } from '../types/database-types';
import type { GraphQLContext } from './index';

export const stockLevelResolvers: IResolvers = {
  // Type Resolvers
  StockLevelRecord: {
    productInfo: async (parent: StockLevelRecord, _args: unknown, context: GraphQLContext) => {
      try {
        if (!parent.stock) return null;

        // Use DataLoader for batch loading to avoid N+1 queries
        if (context.loaders?.product) {
          const product = await context.loaders.product.load(parent.stock);
          if (product) {
            return {
              code: product.code,
              description: product.description,
              type: product.type,
              colour: product.colour,
              standardQty: (product as any).standard_qty || product.standardQty || null,
            };
          }
        }

        // Fallback to direct query if DataLoader not available
        const { data, error } = await context.supabase
          .from('data_code')
          .select('code, description, type, colour, standard_qty')
          .eq('code', parent.stock)
          .single();

        if (error || !data) {
          console.warn(`Product info not found for stock: ${parent.stock}`);
          return null;
        }

        return {
          code: data.code,
          description: data.description,
          type: data.type,
          colour: data.colour,
          standardQty: data.standard_qty || null,
        };
      } catch (error) {
        console.error(`Error loading product info for ${parent.stock}:`, error);
        return null;
      }
    },
  },

  // Query Resolvers
  Query: {
    stockLevelList: async (_parent, args, context: GraphQLContext) => {
      const { productType } = args;

      try {
        // Input validation - return empty result if no product type
        if (!productType || productType.trim() === '') {
          return {
            records: [],
            totalCount: 0,
            lastUpdated: new Date(),
          };
        }

        // First, get all product codes for the selected type from data_code table
        const { data: productCodes, error: productError } = await context.supabase
          .from('data_code')
          .select('code')
          .eq('type', productType)
          .not('code', 'is', null);

        if (productError) throw productError;

        if (!productCodes || productCodes.length === 0) {
          return {
            records: [],
            totalCount: 0,
            lastUpdated: new Date(),
          };
        }

        const codes = productCodes.map(p => p.code);

        // Get latest stock levels for these product codes
        // Use DataLoader if available for better performance
        let stockLevels;
        let stockError;

        if (context.loaders?.stockLevels) {
          // Batch load stock levels
          const results = await Promise.all(
            codes.map(code => context.loaders.stockLevels!.load({ productCode: code } as any))
          );
          stockLevels = results.filter(r => r !== null).flat();
        } else {
          // Fallback to direct query
          const result = await context.supabase
            .from('stock_level')
            .select('uuid, stock, description, stock_level, update_time')
            .in('stock', codes)
            .order('update_time', { ascending: false });
          stockLevels = result.data;
          stockError = result.error;
        }

        if (stockError) throw stockError;

        // Group by stock code and get the latest record for each
        const latestByStock = new Map();

        if (stockLevels) {
          stockLevels.forEach((record: any) => {
            const stockKey = (record as any).stock || record.productCode;
            const updateTime = (record as any).update_time || record.lastUpdated;
            const existingRecord = latestByStock.get(stockKey);
            if (
              !existingRecord ||
              new Date(updateTime) >
                new Date((existingRecord as any).update_time || existingRecord.lastUpdated)
            ) {
              latestByStock.set(stockKey, record);
            }
          });
        }

        const records = Array.from(latestByStock.values()).map((record: any) => ({
          uuid: record.uuid,
          stock: (record as any).stock || record.productCode,
          description: record.description || record.productName,
          stockLevel: record.stock_level || record.stockLevel,
          updateTime: record.update_time || record.updateTime,
        }));

        // Sort by stock code
        records.sort((a, b) => a.stock.localeCompare(b.stock));

        return {
          records,
          totalCount: records.length,
          lastUpdated:
            records.length > 0
              ? new Date(Math.max(...records.map(r => new Date(r.updateTime).getTime())))
              : new Date(),
        };
      } catch (error) {
        console.error('Error in stockLevelList:', error);
        throw error instanceof GraphQLError
          ? error
          : new GraphQLError(
              `Failed to fetch stock levels: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
      }
    },

    stockLevelChart: async (_parent, args, context: GraphQLContext) => {
      const { productType, days = 21 } = args;

      try {
        // Input validation - return empty result if no product type
        if (!productType || productType.trim() === '') {
          const endDate = new Date();
          const startDate = subDays(endDate, days);
          return {
            chartData: [],
            productCodes: [],
            dateRange: {
              start: startDate.toISOString(),
              end: endDate.toISOString(),
            },
          };
        }

        // Calculate date range
        const endDate = new Date();
        const startDate = subDays(endDate, days);

        // First, get all product codes for the selected type
        const { data: productCodes, error: productError } = await context.supabase
          .from('data_code')
          .select('code, description')
          .eq('type', productType)
          .not('code', 'is', null);

        if (productError) throw productError;

        if (!productCodes || productCodes.length === 0) {
          return {
            chartData: [],
            productCodes: [],
            dateRange: {
              start: startDate.toISOString(),
              end: endDate.toISOString(),
            },
          };
        }

        const codes = productCodes.map(p => p.code);

        // Get stock level history for the past X days
        const { data: stockHistory, error: stockError } = await context.supabase
          .from('stock_level')
          .select('uuid, stock, description, stock_level, update_time')
          .in('stock', codes)
          .gte('update_time', startDate.toISOString())
          .lte('update_time', endDate.toISOString())
          .order('update_time', { ascending: true });

        if (stockError) throw stockError;

        // Process data for chart - forward fill missing dates
        const chartDataMap = new Map();
        const productDescriptions = new Map();

        // Build description map
        productCodes.forEach(p => {
          productDescriptions.set(p.code, p.description);
        });

        // Process stock history data
        if (stockHistory) {
          stockHistory.forEach(record => {
            const dateKey = format(new Date(record.update_time), 'yyyy-MM-dd');
            const key = `${record.stock}-${dateKey}`;

            if (
              !chartDataMap.has(key) ||
              new Date(record.update_time) > new Date(chartDataMap.get(key).updateTime)
            ) {
              chartDataMap.set(key, {
                date: record.update_time,
                stockCode: record.stock,
                stockLevel: record.stock_level,
                description: productDescriptions.get(record.stock) || record.description,
                updateTime: record.update_time,
              });
            }
          });
        }

        // Forward fill missing dates for each product
        interface ChartDataPoint {
          date: string;
          stockCode: string;
          stockLevel: number;
          description: string;
        }
        const chartData: ChartDataPoint[] = [];
        const lastKnownValues = new Map();

        // Generate all dates in range
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateKey = format(d, 'yyyy-MM-dd');
          const dateISO = d.toISOString();

          codes.forEach(stockCode => {
            const key = `${stockCode}-${dateKey}`;

            if (chartDataMap.has(key)) {
              // We have data for this date
              const record = chartDataMap.get(key);
              lastKnownValues.set(stockCode, record.stockLevel);
              chartData.push({
                date: dateISO,
                stockCode,
                stockLevel: record.stockLevel,
                description: record.description,
              });
            } else if (lastKnownValues.has(stockCode)) {
              // Forward fill with last known value
              chartData.push({
                date: dateISO,
                stockCode,
                stockLevel: lastKnownValues.get(stockCode),
                description: productDescriptions.get(stockCode) || stockCode,
              });
            }
          });
        }

        return {
          chartData,
          productCodes: codes,
          dateRange: {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
          },
        };
      } catch (error) {
        console.error('Error in stockLevelChart:', error);
        throw error instanceof GraphQLError
          ? error
          : new GraphQLError(
              `Failed to fetch stock level chart data: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
      }
    },

    stockLevelStats: async (_parent, args, context: GraphQLContext) => {
      const { filter = {} } = args;

      try {
        let productQuery = context.supabase.from('data_code').select('code, type');

        if (filter.productType) {
          productQuery = productQuery.eq('type', filter.productType);
        }

        const { data: products, error: productError } = await productQuery;

        if (productError) throw productError;

        if (!products || products.length === 0) {
          return {
            totalProducts: 0,
            totalStock: 0,
            lastUpdate: new Date(),
            productsByType: [],
          };
        }

        const codes = products.map(p => p.code);

        // Get latest stock levels
        const { data: stockLevels, error: stockError } = await context.supabase
          .from('stock_level')
          .select('stock, stock_level, update_time')
          .in('stock', codes)
          .order('update_time', { ascending: false });

        if (stockError) throw stockError;

        // Calculate stats
        const latestByStock = new Map();
        let totalStock = 0;
        let lastUpdate = new Date(0);

        if (stockLevels) {
          stockLevels.forEach(record => {
            if (
              !latestByStock.has(record.stock) ||
              new Date(record.update_time) > new Date(latestByStock.get(record.stock).update_time)
            ) {
              latestByStock.set(record.stock, record);
            }
          });

          // Calculate totals
          latestByStock.forEach(record => {
            totalStock += record.stock_level;
            const updateTime = new Date(record.update_time);
            if (updateTime > lastUpdate) {
              lastUpdate = updateTime;
            }
          });
        }

        // Group by type
        const typeStats = new Map();
        products.forEach(product => {
          const stockLevel = latestByStock.get(product.code)?.stock_level || 0;

          if (!typeStats.has(product.type)) {
            typeStats.set(product.type, {
              type: product.type,
              count: 0,
              totalStock: 0,
            });
          }

          const stats = typeStats.get(product.type);
          stats.count++;
          stats.totalStock += stockLevel;
        });

        return {
          totalProducts: latestByStock.size,
          totalStock,
          lastUpdate: lastUpdate.getTime() > 0 ? lastUpdate : new Date(),
          productsByType: Array.from(typeStats.values()),
        };
      } catch (error) {
        console.error('Error in stockLevelStats:', error);
        throw error instanceof GraphQLError
          ? error
          : new GraphQLError(
              `Failed to fetch stock level statistics: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
      }
    },
  },
};
