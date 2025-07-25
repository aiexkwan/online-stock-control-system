/**
 * Analytics GraphQL Resolvers
 */

import { IResolvers } from '@graphql-tools/utils';
import { GraphQLContext } from './index';

// 導入數據庫類型
import { DataOrderRow, RecordInventoryRow } from '@/lib/types/database';

// Analytics 數據轉換類型定義
interface InventoryOrderedAnalysisItem {
  product_code: string;
  product_description: string;
  product_type: string;
  standard_qty: number;
  inventory: {
    total: number;
    locations: Record<string, number> | null;
    last_update: string;
  };
  orders: {
    total_orders: number;
    total_ordered_qty: number;
    total_loaded_qty: number;
    total_outstanding_qty: number;
  };
  analysis: {
    fulfillment_rate: number;
    inventory_gap: number;
    status: string;
  };
}

interface HistoryTreeEntry {
  id: string;
  timestamp: string;
  action: string;
  location: string;
  remark?: string;
  user?: {
    id: string;
    name: string;
    department?: string;
    position?: string;
    email?: string;
  };
  pallet?: {
    number: string;
    series: string;
    quantity: number;
    generatedAt: string;
    product?: {
      code: string;
      description: string;
      type: string;
      colour?: string;
      standardQty: number;
    };
  };
}

interface TopProductItem {
  productCode: string;
  productName: string;
  productType: string;
  colour?: string;
  standardQty: number;
  totalQuantity: number;
  locationQuantities: Record<string, number>;
  lastUpdated: string;
}

interface StockDistributionItem {
  name: string;
  stock: number;
  stockLevel: string;
  description?: string;
  type: string;
  productCode?: string;
  percentage: number;
}

export const analyticsResolvers: IResolvers = {
  Query: {
    qualityMetrics: async (_parent, args, context: GraphQLContext) => {
      const { dateRange, productCodes } = args;

      // Would implement actual quality metrics calculation
      // For now, return mock data structure
      return {
        overallScore: 95.5,
        defectRate: 0.02,
        firstPassYield: 0.98,
        defectsByType: [],
        defectsByProduct: [],
        defectTrends: [],
        totalInspections: 1000,
        passedInspections: 980,
        failedInspections: 20,
        pendingInspections: 0,
        lastUpdated: new Date().toISOString(),
        refreshInterval: 300000, // 5 minutes
        dataSource: 'quality_metrics',
      };
    },

    efficiencyMetrics: async (_parent, args, context: GraphQLContext) => {
      const { dateRange, departments } = args;

      // Would implement actual efficiency calculation
      return {
        overallEfficiency: 85.0,
        productivityIndex: 1.15,
        utilizationRate: 0.78,
        efficiencyByDepartment: [],
        efficiencyByShift: [],
        efficiencyTrends: [],
        averageTaskTime: 15.5,
        tasksPerHour: 4.2,
        idleTimePercentage: 0.22,
        lastUpdated: new Date().toISOString(),
        refreshInterval: 300000,
        dataSource: 'efficiency_metrics',
      };
    },

    uploadStatistics: async (_parent, args, context: GraphQLContext) => {
      const { dateRange } = args;

      // Query upload statistics
      const today = new Date().toISOString().split('T')[0];

      const { data: uploads, error } = await context.supabase
        .from('doc_upload')
        .select('*')
        .gte('created_at', today + 'T00:00:00')
        .lte('created_at', today + 'T23:59:59');

      if (error) throw error;

      const totalUploads = uploads?.length || 0;
      const successCount = uploads?.filter(u => u.doc_url).length || 0;

      return {
        todayUploads: totalUploads,
        successRate: totalUploads > 0 ? successCount / totalUploads : 0,
        failureRate: totalUploads > 0 ? (totalUploads - successCount) / totalUploads : 0,
        averageProcessingTime: 2.5, // Mock value
        uploadsByType: [],
        uploadsByUser: [],
        errorReasons: [],
        uploadTrends: [],
        lastUpdated: new Date().toISOString(),
        refreshInterval: 60000, // 1 minute
        dataSource: 'upload_stats',
      };
    },

    updateStatistics: async (_parent, args, context: GraphQLContext) => {
      const { dateRange } = args;

      // Would query various update-related tables
      // For now, return mock structure
      return {
        pendingCount: 25,
        completedToday: 150,
        inProgress: 10,
        failed: 5,
        updatesByType: [],
        updatesByStatus: [],
        averageCompletionTime: 8.5,
        backlogTrend: [],
        estimatedClearTime: 4.5,
        lastUpdated: new Date().toISOString(),
        refreshInterval: 60000,
        dataSource: 'update_stats',
      };
    },

    systemPerformance: async (_parent, args, context: GraphQLContext) => {
      const { timeWindow } = args;

      // Would implement actual performance monitoring
      return {
        averageResponseTime: 125,
        p95ResponseTime: 450,
        p99ResponseTime: 850,
        requestsPerSecond: 25.5,
        transactionsPerMinute: 1530,
        errorRate: 0.001,
        errorsByType: [],
        cpuUsage: 0.45,
        memoryUsage: 0.62,
        diskUsage: 0.38,
        networkUsage: 0.15,
        servicesHealth: [
          {
            serviceName: 'Database',
            status: 'HEALTHY',
            uptime: 0.999,
            lastError: null,
            responseTime: 15,
          },
          {
            serviceName: 'API',
            status: 'HEALTHY',
            uptime: 0.998,
            lastError: null,
            responseTime: 85,
          },
        ],
        lastUpdated: new Date().toISOString(),
        refreshInterval: 30000, // 30 seconds
        dataSource: 'system_performance',
      };
    },

    analysisCards: async (_parent, args, context: GraphQLContext) => {
      const { category } = args;

      // Would return configured analysis cards
      // For now, return empty array
      return [];
    },

    inventoryOrderedAnalysis: async (_parent, args, context: GraphQLContext) => {
      const { input = {} } = args;

      try {
        // Transform input to match DataLoader key interface
        const loaderKey = {
          productType: input.productType,
          productCodes: input.productCodes,
          includeLocationBreakdown: input.includeLocationBreakdown || false,
          filterStatus: input.filterStatus
            ? transformStatusToString(input.filterStatus)
            : undefined,
          sortBy: input.sortBy ? transformSortField(input.sortBy) : 'status',
          sortOrder: input.sortOrder?.toLowerCase() || 'asc',
        };

        // Use the inventory ordered analysis DataLoader
        const result = await context.loaders.inventoryOrderedAnalysis?.load(loaderKey);

        if (!result) {
          throw new Error('Failed to load inventory ordered analysis data');
        }

        // Transform the result to match GraphQL schema
        return {
          success: result.success,
          summary: {
            total_products: result.summary.total_products,
            total_inventory_value: result.summary.total_inventory_value,
            total_outstanding_orders_value: result.summary.total_outstanding_orders_value,
            overall_fulfillment_rate: result.summary.overall_fulfillment_rate,
            products_sufficient: result.summary.products_sufficient,
            products_insufficient: result.summary.products_insufficient,
            products_out_of_stock: result.summary.products_out_of_stock,
            products_no_orders: result.summary.products_no_orders,
          },
          data: result.data.map((item: InventoryOrderedAnalysisItem) => ({
            product_code: item.product_code,
            product_description: item.product_description,
            product_type: item.product_type,
            standard_qty: item.standard_qty,
            inventory: {
              total: item.inventory.total,
              locations: item.inventory.locations
                ? {
                    injection: item.inventory.locations.injection,
                    pipeline: item.inventory.locations.pipeline,
                    prebook: item.inventory.locations.prebook,
                    await: item.inventory.locations.await,
                    fold: item.inventory.locations.fold,
                    bulk: item.inventory.locations.bulk,
                    backcarpark: item.inventory.locations.backcarpark,
                    damage: item.inventory.locations.damage,
                    await_grn: item.inventory.locations.await_grn,
                  }
                : null,
              last_update: item.inventory.last_update,
            },
            orders: {
              total_orders: item.orders.total_orders,
              total_ordered_qty: item.orders.total_ordered_qty,
              total_loaded_qty: item.orders.total_loaded_qty,
              total_outstanding_qty: item.orders.total_outstanding_qty,
            },
            analysis: {
              fulfillment_rate: item.analysis.fulfillment_rate,
              inventory_gap: item.analysis.inventory_gap,
              status: transformStringToStatus(item.analysis.status),
            },
          })),
          generated_at: result.generated_at || new Date().toISOString(),
        };
      } catch (error) {
        console.error('[InventoryOrderedAnalysis] Resolver error:', error);
        throw new Error(`Failed to fetch inventory ordered analysis: ${error.message}`);
      }
    },

    historyTree: async (_parent, args, context: GraphQLContext) => {
      const { input = {} } = args;

      try {
        // Transform input to match DataLoader key interface
        const loaderKey = {
          dateRange: input.dateRange
            ? {
                start: input.dateRange.start,
                end: input.dateRange.end,
              }
            : undefined,
          actionTypes: input.actionTypes,
          userIds: input.userIds,
          palletNumbers: input.palletNumbers,
          locations: input.locations,
          groupBy: input.groupBy ? transformGroupBy(input.groupBy) : 'time',
          sortBy: input.sortBy ? transformHistorySortField(input.sortBy) : 'time',
          sortOrder: input.sortOrder?.toLowerCase() || 'desc',
          limit: input.limit || 50,
          offset: input.offset || 0,
        };

        // Use the history tree DataLoader
        const result = await context.loaders.historyTree?.load(loaderKey);

        if (!result) {
          throw new Error('Failed to load history tree data');
        }

        // Transform the result to match GraphQL schema
        return {
          entries: result.entries.map((entry: HistoryTreeEntry) => ({
            id: entry.id,
            timestamp: entry.timestamp,
            action: entry.action,
            location: entry.location,
            remark: entry.remark,
            user: entry.user
              ? {
                  id: entry.user.id,
                  name: entry.user.name,
                  department: entry.user.department,
                  position: entry.user.position,
                  email: entry.user.email,
                }
              : null,
            pallet: entry.pallet
              ? {
                  number: entry.pallet.number,
                  series: entry.pallet.series,
                  quantity: entry.pallet.quantity,
                  generatedAt: entry.pallet.generatedAt,
                  product: entry.pallet.product
                    ? {
                        code: entry.pallet.product.code,
                        description: entry.pallet.product.description,
                        type: entry.pallet.product.type,
                        colour: entry.pallet.product.colour,
                        standardQty: entry.pallet.product.standardQty,
                      }
                    : null,
                }
              : null,
          })),
          totalCount: result.totalCount,
          hasNextPage: result.hasNextPage,
          groupedData: result.groupedData,
          limit: result.limit,
          offset: result.offset,
          filters: {
            dateRange: result.filters.dateRange,
            actionTypes: result.filters.actionTypes,
            userIds: result.filters.userIds,
            palletNumbers: result.filters.palletNumbers,
            locations: result.filters.locations,
          },
          sort: {
            sortBy: transformHistorySortFieldReverse(result.sort.sortBy),
            sortOrder: result.sort.sortOrder.toUpperCase(),
          },
        };
      } catch (error) {
        console.error('[HistoryTree] Resolver error:', error);
        throw new Error(`Failed to fetch history tree data: ${error.message}`);
      }
    },

    topProductsByQuantity: async (_parent, args, context: GraphQLContext) => {
      const { input = {} } = args;

      try {
        // Transform input to match DataLoader key interface
        const loaderKey = {
          productType: input.productType,
          productCodes: input.productCodes,
          limit: input.limit || 10,
          sortOrder: input.sortOrder?.toLowerCase() || 'desc',
          includeInactive: input.includeInactive || false,
          locationFilter: input.locationFilter || [],
        };

        // Use the top products DataLoader
        const result = await context.loaders.topProducts?.load(loaderKey);

        if (!result) {
          throw new Error('Failed to load top products data');
        }

        // Transform the result to match GraphQL schema
        return {
          products: result.products.map((product: TopProductItem) => ({
            productCode: product.productCode,
            productName: product.productName,
            productType: product.productType,
            colour: product.colour,
            standardQty: product.standardQty,
            totalQuantity: product.totalQuantity,
            locationQuantities: {
              injection: product.locationQuantities.injection || 0,
              pipeline: product.locationQuantities.pipeline || 0,
              prebook: product.locationQuantities.prebook || 0,
              await: product.locationQuantities.await || 0,
              fold: product.locationQuantities.fold || 0,
              bulk: product.locationQuantities.bulk || 0,
              backcarpark: product.locationQuantities.backcarpark || 0,
              damage: product.locationQuantities.damage || 0,
              await_grn: product.locationQuantities.await_grn || 0,
            },
            lastUpdated: product.lastUpdated,
          })),
          totalCount: result.totalCount,
          averageQuantity: result.averageQuantity,
          maxQuantity: result.maxQuantity,
          minQuantity: result.minQuantity,
          lastUpdated: result.lastUpdated,
          dataSource: result.dataSource,
          refreshInterval: result.refreshInterval,
        };
      } catch (error) {
        console.error('[TopProductsByQuantity] Resolver error:', error);
        throw new Error(`Failed to fetch top products data: ${error.message}`);
      }
    },

    stockDistribution: async (_parent, args, context: GraphQLContext) => {
      const { input = {} } = args;

      try {
        // Transform input to match DataLoader key interface
        const loaderKey = {
          type: input.type,
          warehouseId: input.warehouseId,
          limit: input.limit || 50,
          includeInactive: input.includeInactive || false,
        };

        // Use the stock distribution DataLoader
        const result = await context.loaders.stockDistribution?.load(loaderKey);

        if (!result) {
          throw new Error('Failed to load stock distribution data');
        }

        // Transform the result to match GraphQL schema
        return {
          items: result.items.map((item: StockDistributionItem) => ({
            name: item.name,
            stock: item.stock,
            stockLevel: item.stockLevel,
            description: item.description,
            type: item.type,
            productCode: item.productCode,
            percentage: item.percentage,
          })),
          totalCount: result.totalCount,
          totalStock: result.totalStock,
          lastUpdated: result.lastUpdated,
          dataSource: result.dataSource,
          refreshInterval: result.refreshInterval,
        };
      } catch (error) {
        console.error('[StockDistribution] Resolver error:', error);
        throw new Error(`Failed to fetch stock distribution data: ${error.message}`);
      }
    },
  },
};

// Helper functions for inventory ordered analysis
function transformStatusToString(status: string): string {
  const statusMap: { [key: string]: string } = {
    SUFFICIENT: 'Sufficient',
    INSUFFICIENT: 'Insufficient',
    OUT_OF_STOCK: 'Out of Stock',
    NO_ORDERS: 'No Orders',
  };
  return statusMap[status] || status;
}

function transformStringToStatus(status: string): string {
  const statusMap: { [key: string]: string } = {
    Sufficient: 'SUFFICIENT',
    Insufficient: 'INSUFFICIENT',
    'Out of Stock': 'OUT_OF_STOCK',
    'No Orders': 'NO_ORDERS',
  };
  return statusMap[status] || status;
}

function transformSortField(field: string): string {
  const fieldMap: { [key: string]: string } = {
    STATUS: 'status',
    FULFILLMENT_RATE: 'fulfillment_rate',
    INVENTORY_GAP: 'inventory_gap',
    PRODUCT_CODE: 'product_code',
  };
  return fieldMap[field] || field.toLowerCase();
}

// Helper functions for history tree
function transformGroupBy(groupBy: string): string {
  const groupByMap: { [key: string]: string } = {
    TIME: 'time',
    USER: 'user',
    ACTION: 'action',
    LOCATION: 'location',
  };
  return groupByMap[groupBy] || groupBy.toLowerCase();
}

function transformHistorySortField(field: string): string {
  const fieldMap: { [key: string]: string } = {
    TIME: 'time',
    ACTION: 'action',
    USER: 'user',
    LOCATION: 'location',
  };
  return fieldMap[field] || field.toLowerCase();
}

function transformHistorySortFieldReverse(field: string): string {
  const fieldMap: { [key: string]: string } = {
    time: 'TIME',
    action: 'ACTION',
    user: 'USER',
    location: 'LOCATION',
  };
  return fieldMap[field] || field.toUpperCase();
}
