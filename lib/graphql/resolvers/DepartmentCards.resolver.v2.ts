/**
 * Updated Department GraphQL Resolver v2.0
 * Uses new adapter pattern and field mapping system to handle database mismatches
 * Includes proper error handling and schema validation
 */

import { GraphQLError } from 'graphql';
import { AdapterFactory, DepartmentDataAdapter } from '../adapters/database-adapter';
import { withSchemaValidation } from '../middleware/schema-validation';
import { TypeTransformers } from '../types/database-types';
import type { GraphQLContext } from '../../types/graphql-resolver.types';
import type { 
  DepartmentStats, 
  StockItem, 
  MachineState, 
  RecentActivity, 
  OrderCompletion 
} from '../types/database-types';

// Department configuration remains the same
interface DepartmentConfig {
  type: 'INJECTION' | 'PIPE' | 'WAREHOUSE';
  statsField: 'todayFinished' | 'todayTransferred';
  productFilter: (type: string) => boolean;
  materialPattern?: string;
  machines: MachineState[];
  hasRecentActivities: boolean;
  hasOrderCompletions: boolean;
}

function getDepartmentConfig(type: 'INJECTION' | 'PIPE' | 'WAREHOUSE'): DepartmentConfig {
  switch (type) {
    case 'INJECTION':
      return {
        type,
        statsField: 'todayFinished',
        productFilter: (productType) => productType !== 'Material' && productType !== 'Pipe',
        machines: [
          { machineNumber: 'Machine No.04', lastActiveTime: null, state: 'UNKNOWN' },
          { machineNumber: 'Machine No.06', lastActiveTime: null, state: 'UNKNOWN' },
          { machineNumber: 'Machine No.07', lastActiveTime: null, state: 'UNKNOWN' },
          { machineNumber: 'Machine No.11', lastActiveTime: null, state: 'UNKNOWN' },
          { machineNumber: 'Machine No.12', lastActiveTime: null, state: 'UNKNOWN' },
          { machineNumber: 'Machine No.14', lastActiveTime: null, state: 'UNKNOWN' },
        ],
        hasRecentActivities: false,
        hasOrderCompletions: false
      };
    
    case 'PIPE':
      return {
        type,
        statsField: 'todayFinished',
        productFilter: (productType) => productType === 'Pipe',
        machines: [
          { machineNumber: 'Machine No.01', lastActiveTime: null, state: 'UNKNOWN' },
          { machineNumber: 'Machine No.02', lastActiveTime: null, state: 'UNKNOWN' },
          { machineNumber: 'Machine No.03', lastActiveTime: null, state: 'UNKNOWN' },
          { machineNumber: 'Machine No.04', lastActiveTime: null, state: 'UNKNOWN' },
        ],
        hasRecentActivities: false,
        hasOrderCompletions: false
      };
    
    case 'WAREHOUSE':
      return {
        type,
        statsField: 'todayTransferred',
        productFilter: () => true,
        materialPattern: 'MAT%',
        machines: [],
        hasRecentActivities: true,
        hasOrderCompletions: true
      };
    
    default:
      throw new GraphQLError(`Unknown department type: ${type}`);
  }
}

/**
 * Enhanced resolver with adapter pattern and error handling
 */
export const enhancedDepartmentResolver = {
  Query: {
    // Injection Department Data with schema validation
    departmentInjectionData: withSchemaValidation(async (_: unknown, __: unknown, context: unknown) => {
      const ctx = context as GraphQLContext;
      try {
        const adapter = await AdapterFactory.createDepartmentAdapter();
        const config = getDepartmentConfig('INJECTION');

        // Get time ranges
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const timeRange = { start: today, end: now };

        // Fetch all data in parallel using adapters
        const [stats, topStocks, materialStocks] = await Promise.allSettled([
          adapter.fetchDepartmentStats('INJECTION', timeRange),
          adapter.fetchTopStocks('INJECTION', 10),
          fetchMaterialStocksWithAdapter(adapter, config)
        ]);

        // Handle results with graceful degradation
        const result = {
          stats: stats.status === 'fulfilled' ? stats.value : getDefaultStats('INJECTION'),
          topStocks: topStocks.status === 'fulfilled' ? topStocks.value : [],
          materialStocks: materialStocks.status === 'fulfilled' ? materialStocks.value : [],
          machineStates: config.machines,
          loading: false,
          error: null
        };

        // Log any errors for monitoring
        [stats, topStocks, materialStocks].forEach((result, index) => {
          if (result.status === 'rejected') {
            const section = ['stats', 'topStocks', 'materialStocks'][index];
            console.error(`[departmentInjectionData] ${section} failed:`, result.reason);
          }
        });

        return result;
      } catch (error) {
        console.error('[departmentInjectionData] Critical error:', error);
        return getErrorResponse('INJECTION', error);
      }
    }),

    // Pipe Department Data with schema validation
    departmentPipeData: withSchemaValidation(async (_: unknown, __: unknown, context: GraphQLContext) => {
      try {
        const adapter = await AdapterFactory.createDepartmentAdapter();
        const config = getDepartmentConfig('PIPE');

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const timeRange = { start: today, end: now };

        const [stats, topStocks, materialStocks] = await Promise.allSettled([
          adapter.fetchDepartmentStats('PIPE', timeRange),
          adapter.fetchTopStocks('PIPE', 10),
          fetchMaterialStocksWithAdapter(adapter, config)
        ]);

        const result = {
          stats: stats.status === 'fulfilled' ? stats.value : getDefaultStats('PIPE'),
          topStocks: topStocks.status === 'fulfilled' ? topStocks.value : [],
          materialStocks: materialStocks.status === 'fulfilled' ? materialStocks.value : [],
          machineStates: config.machines,
          loading: false,
          error: null
        };

        [stats, topStocks, materialStocks].forEach((result, index) => {
          if (result.status === 'rejected') {
            const section = ['stats', 'topStocks', 'materialStocks'][index];
            console.error(`[departmentPipeData] ${section} failed:`, result.reason);
          }
        });

        return result;
      } catch (error) {
        console.error('[departmentPipeData] Critical error:', error);
        return getErrorResponse('PIPE', error);
      }
    }),

    // Warehouse Department Data with schema validation
    departmentWarehouseData: withSchemaValidation(async (_: unknown, __: unknown, context: GraphQLContext) => {
      try {
        const adapter = await AdapterFactory.createDepartmentAdapter();
        const config = getDepartmentConfig('WAREHOUSE');

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const timeRange = { start: today, end: now };

        const [stats, topStocks, materialStocks, recentActivities, orderCompletions] = await Promise.allSettled([
          adapter.fetchDepartmentStats('WAREHOUSE', timeRange),
          adapter.fetchTopStocks('WAREHOUSE', 10),
          fetchMaterialStocksWithAdapter(adapter, config),
          adapter.fetchRecentActivities(7),
          fetchOrderCompletionsWithAdapter(adapter)
        ]);

        const result = {
          stats: stats.status === 'fulfilled' ? stats.value : getDefaultStats('WAREHOUSE'),
          topStocks: topStocks.status === 'fulfilled' ? topStocks.value : [],
          materialStocks: materialStocks.status === 'fulfilled' ? materialStocks.value : [],
          recentActivities: recentActivities.status === 'fulfilled' ? recentActivities.value : [],
          orderCompletions: orderCompletions.status === 'fulfilled' ? orderCompletions.value : [],
          loading: false,
          error: null
        };

        [stats, topStocks, materialStocks, recentActivities, orderCompletions].forEach((result, index) => {
          if (result.status === 'rejected') {
            const section = ['stats', 'topStocks', 'materialStocks', 'recentActivities', 'orderCompletions'][index];
            console.error(`[departmentWarehouseData] ${section} failed:`, result.reason);
          }
        });

        return result;
      } catch (error) {
        console.error('[departmentWarehouseData] Critical error:', error);
        return getErrorResponse('WAREHOUSE', error);
      }
    })
  }
};

/**
 * Helper functions with enhanced error handling
 */
async function fetchMaterialStocksWithAdapter(
  adapter: DepartmentDataAdapter, 
  config: DepartmentConfig
): Promise<StockItem[]> {
  try {
    // This would be implemented in the adapter to handle material filtering
    const stocks = await adapter.fetchTopStocks(config.type, 10);
    
    // Convert ProductStockItem to StockItem and apply material filtering
    return stocks
      .map(stock => ({
        stock: stock.stock,
        stockLevel: stock.stockLevel,
        updateTime: new Date(stock.updateTime),
        type: stock.type
      }))
      .filter((stock: StockItem) => {
        if (config.materialPattern) {
          return stock.stock.startsWith(config.materialPattern.replace('%', ''));
        }
        return stock.type === 'Material';
      });
  } catch (error) {
    console.error('Failed to fetch material stocks:', error);
    return [];
  }
}

async function fetchOrderCompletionsWithAdapter(adapter: DepartmentDataAdapter): Promise<OrderCompletion[]> {
  try {
    // This would be implemented in the adapter
    // For now, return empty array with proper error handling
    console.warn('Order completions not yet implemented in adapter');
    return [];
  } catch (error) {
    console.error('Failed to fetch order completions:', error);
    return [];
  }
}

function getDefaultStats(departmentType: string): DepartmentStats {
  return {
    todayFinished: departmentType !== 'WAREHOUSE' ? 0 : undefined,
    todayTransferred: departmentType === 'WAREHOUSE' ? 0 : undefined,
    past7Days: 0,
    past14Days: 0,
    lastUpdated: new Date()
  };
}

function getErrorResponse(departmentType: string, error: unknown): {
  stats: DepartmentStats;
  topStocks: StockItem[];
  materialStocks: StockItem[];
  machineStates: MachineState[];
  recentActivities?: RecentActivity[];
  orderCompletions?: OrderCompletion[];
  loading: boolean;
  error: string;
} {
  return {
    stats: getDefaultStats(departmentType),
    topStocks: [],
    materialStocks: [],
    machineStates: [],
    recentActivities: departmentType === 'WAREHOUSE' ? [] : undefined,
    orderCompletions: departmentType === 'WAREHOUSE' ? [] : undefined,
    loading: false,
    error: error instanceof Error ? error.message : 'Unknown error occurred'
  };
}

export default enhancedDepartmentResolver;