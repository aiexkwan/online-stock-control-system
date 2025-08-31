/**
 * Enhanced DepartmentPipe GraphQL Resolver
 * Optimized resolver for Pipe Department with improved data fetching
 * Integrates stock_level table data and enhanced product filtering
 */

// @ts-ignore - DataLoader module import issue with esModuleInterop
import DataLoader from 'dataloader';
import { createClient } from '../../../app/utils/supabase/server';
import {
  createStockLevelDataLoaders,
  type StockLevelDataLoaders,
  type StockLevelQuery,
  type StockLevelRecord as _StockLevelRecord,
} from '../dataloaders/stock-level.dataloader';
import { DataLoaderContext } from '../dataloaders/base.dataloader';

// Enhanced types for pipe department
interface PipeStats {
  todayFinished: number;
  past7Days: number;
  past14Days: number;
  lastUpdated: string;
}

// Database row types
interface DataCodeRow {
  code: string;
  description?: string;
  type?: string;
  colour?: string;
  standard_qty?: number;
  remark?: string | null;
}

interface RecordPalletInfoRow {
  product_code: string;
  product_qty?: number;
  generate_time: string;
}

interface PipeStatsRPCResult {
  today_count?: number;
  week_count?: number;
  two_week_count?: number;
  last_update?: string;
}

interface PipeStockRPCResult {
  stock: string;
  description?: string;
  stock_level: number;
  update_time: string;
  type?: string;
  real_time_level?: number;
}

// GraphQL resolver types
interface GraphQLResolverContext extends DataLoaderContext {
  user?: {
    id: string;
    email: string;
    role?: string;
    metadata?: Record<string, unknown>;
  };
  session?: {
    access_token: string;
  };
  requestId: string;
}

type GraphQLResolver<TArgs = Record<string, unknown>> = (
  parent: unknown,
  args: TArgs,
  context: GraphQLResolverContext
) => Promise<unknown> | unknown;

interface EnhancedStockItem {
  stock: string;
  description: string;
  stockLevel: number;
  updateTime: string;
  type: string;
  realTimeLevel?: number;
  lastStockUpdate?: string;
}

interface PipeProductionMetrics {
  pipeProductionRate: number;
  materialConsumptionRate: number;
  efficiency: number;
}

interface MachineState {
  machineNumber: string;
  lastActiveTime?: string;
  state: 'ACTIVE' | 'IDLE' | 'MAINTENANCE' | 'OFFLINE' | 'UNKNOWN';
  efficiency?: number;
  currentTask?: string;
  nextMaintenance?: string;
}

interface DepartmentPipeData {
  stats: PipeStats;
  topStocks: {
    nodes: EnhancedStockItem[];
    totalCount: number;
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor?: string;
      endCursor?: string;
    };
  };
  materialStocks: {
    nodes: EnhancedStockItem[];
    totalCount: number;
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor?: string;
      endCursor?: string;
    };
  };
  machineStates: MachineState[];
  pipeProductionRate: number;
  materialConsumptionRate: number;
  loading: boolean;
  error?: string;
}

/**
 * Enhanced DataLoader class for Pipe Department
 */
class PipeDepartmentDataLoaders {
  private supabase: ReturnType<typeof createClient>;
  private stockLevelLoaders?: StockLevelDataLoaders;

  public productLoader: DataLoader<
    string,
    { description: string; type: string; colour: string; standardQty: number }
  >;
  public palletInfoLoader: DataLoader<string, { productQty: number; generateTime: string }>;
  public productionStatsLoader: DataLoader<
    string,
    { todayCount: number; weekCount: number; twoWeekCount: number }
  >;
  public machineStatusLoader: DataLoader<string, MachineState>;

  constructor(supabase: ReturnType<typeof createClient>) {
    this.supabase = supabase;
    // Note: stockLevelLoaders will be initialized asynchronously
    this.initStockLevelLoaders();

    // Enhanced product loader with more details
    this.productLoader = new DataLoader(
      async (productCodes: readonly string[]) => {
        const supabase = await this.supabase;
        const { data, error } = await supabase
          .from('data_code')
          .select('code, description, type, colour, standard_qty, remark')
          .in('code', [...productCodes]);

        if (error) {
          console.error('[PipeDepartment] Error loading product data:', error);
          return productCodes.map(() => ({
            description: 'Unknown',
            type: 'Unknown',
            colour: 'Unknown',
            standardQty: 0,
          }));
        }

        const productMap = new Map(
          data?.map((p: DataCodeRow) => [
            p.code,
            {
              description: p.description || 'Unknown',
              type: p.type || 'Unknown',
              colour: p.colour || 'Unknown',
              standardQty: p.standard_qty || 0,
            },
          ]) || []
        );

        return productCodes.map(
          code =>
            productMap.get(code) || {
              description: 'Unknown',
              type: 'Unknown',
              colour: 'Unknown',
              standardQty: 0,
            }
        );
      },
      { maxBatchSize: 50, cache: true }
    );

    // Pallet info loader with timestamps
    this.palletInfoLoader = new DataLoader(
      async (productCodes: readonly string[]) => {
        const supabase = await this.supabase;
        const { data, error } = await supabase
          .from('record_palletinfo')
          .select('product_code, product_qty, generate_time')
          .in('product_code', [...productCodes]);

        if (error) {
          console.error('[PipeDepartment] Error loading pallet info:', error);
          return productCodes.map(() => ({
            productQty: 0,
            generateTime: new Date().toISOString(),
          }));
        }

        // Aggregate by product code
        const productMap = new Map<string, { productQty: number; generateTime: string }>();

        data?.forEach((item: RecordPalletInfoRow) => {
          const current = productMap.get(item.product_code) || {
            productQty: 0,
            generateTime: item.generate_time,
          };
          productMap.set(item.product_code, {
            productQty: current.productQty + (item.product_qty || 0),
            generateTime:
              item.generate_time > current.generateTime ? item.generate_time : current.generateTime,
          });
        });

        return productCodes.map(
          code => productMap.get(code) || { productQty: 0, generateTime: new Date().toISOString() }
        );
      },
      { maxBatchSize: 50, cache: true }
    );

    // Production stats loader for time-based analytics
    this.productionStatsLoader = new DataLoader(
      async (productCodes: readonly string[]) => {
        const _now = new Date();
        const today = new Date(_now.getFullYear(), _now.getMonth(), _now.getDate());
        const past7Days = new Date(_now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const past14Days = new Date(_now.getTime() - 14 * 24 * 60 * 60 * 1000);

        const supabase = await this.supabase;
        const { data, error } = await supabase
          .from('record_palletinfo')
          .select('product_code, generate_time')
          .in('product_code', [...productCodes])
          .gte('generate_time', past14Days.toISOString());

        if (error) {
          console.error('[PipeDepartment] Error loading production stats:', error);
          return productCodes.map(() => ({ todayCount: 0, weekCount: 0, twoWeekCount: 0 }));
        }

        // Count by time periods for each product
        const statsMap = new Map<
          string,
          { todayCount: number; weekCount: number; twoWeekCount: number }
        >();

        productCodes.forEach(code => {
          statsMap.set(code, { todayCount: 0, weekCount: 0, twoWeekCount: 0 });
        });

        data?.forEach((item: RecordPalletInfoRow) => {
          const generateTime = new Date(item.generate_time);
          const stats = statsMap.get(item.product_code) || {
            todayCount: 0,
            weekCount: 0,
            twoWeekCount: 0,
          };

          if (generateTime >= today) stats.todayCount++;
          if (generateTime >= past7Days) stats.weekCount++;
          stats.twoWeekCount++;

          statsMap.set(item.product_code, stats);
        });

        return productCodes.map(
          code => statsMap.get(code) || { todayCount: 0, weekCount: 0, twoWeekCount: 0 }
        );
      },
      { maxBatchSize: 30, cache: true }
    );

    // Machine status loader (placeholder for future IoT integration)
    this.machineStatusLoader = new DataLoader(
      async (machineNumbers: readonly string[]) => {
        // For now, return static data. In production, this would query machine monitoring system
        const pipeMachines = ['Machine No.01', 'Machine No.02', 'Machine No.03', 'Machine No.04'];

        return machineNumbers.map(machineNumber => {
          if (pipeMachines.includes(machineNumber)) {
            return {
              machineNumber,
              lastActiveTime: undefined, // Would come from IoT system
              state: 'UNKNOWN' as const,
              efficiency: undefined,
              currentTask: 'N/A',
              nextMaintenance: 'N/A',
            };
          }
          return {
            machineNumber,
            lastActiveTime: undefined,
            state: 'OFFLINE' as const,
            efficiency: 0,
            currentTask: 'N/A',
            nextMaintenance: 'N/A',
          };
        });
      },
      { maxBatchSize: 10, cache: true }
    );
  }

  // Initialize stock level loaders asynchronously
  async initStockLevelLoaders() {
    const client = await this.supabase;
    this.stockLevelLoaders = createStockLevelDataLoaders(client);
  }

  // Access stock level loaders
  get stockLevel() {
    return this.stockLevelLoaders;
  }

  clearAll() {
    this.productLoader.clearAll();
    this.palletInfoLoader.clearAll();
    this.productionStatsLoader.clearAll();
    this.machineStatusLoader.clearAll();
    if (this.stockLevelLoaders) {
      this.stockLevelLoaders.byCode.clearAll();
      this.stockLevelLoaders.byQuery.clearAll();
      this.stockLevelLoaders.byType.clearAll();
    }
  }
}

/**
 * Enhanced pipe product filtering logic
 */
function _isPipeProduct(productType: string): boolean {
  const pipeTypes = ['Pipe', 'pipe', 'PIPE', 'Tube', 'tube', 'TUBE'];
  return pipeTypes.includes(productType);
}

function _isMaterialProduct(productType: string): boolean {
  const materialTypes = ['Material', 'material', 'MATERIAL', 'Raw Material', 'raw_material'];
  return materialTypes.includes(productType);
}

/**
 * Fetch enhanced pipe production statistics using optimized RPC
 */
async function fetchPipeStats(
  supabase: ReturnType<typeof createClient>,
  _loaders: PipeDepartmentDataLoaders
): Promise<PipeStats> {
  try {
    // Use optimized RPC function instead of complex client-side filtering
    const client = await supabase;
    const { data, error } = await client.rpc('get_pipe_production_stats_optimized');

    if (error) {
      console.error('[PipeDepartment] Error fetching pipe stats:', error);
      return {
        todayFinished: 0,
        past7Days: 0,
        past14Days: 0,
        lastUpdated: new Date().toISOString(),
      };
    }

    // Type guard for RPC result
    const rpcData = data as PipeStatsRPCResult[] | PipeStatsRPCResult | null;
    let statsData: PipeStatsRPCResult | null = null;

    if (Array.isArray(rpcData) && rpcData.length > 0) {
      statsData = rpcData[0];
    } else if (rpcData && !Array.isArray(rpcData)) {
      statsData = rpcData;
    }

    if (!statsData) {
      return {
        todayFinished: 0,
        past7Days: 0,
        past14Days: 0,
        lastUpdated: new Date().toISOString(),
      };
    }

    return {
      todayFinished: statsData.today_count || 0,
      past7Days: statsData.week_count || 0,
      past14Days: statsData.two_week_count || 0,
      lastUpdated: statsData.last_update || new Date().toISOString(),
    };
  } catch (error) {
    console.error('[PipeDepartment] Error in fetchPipeStats:', error);
    return {
      todayFinished: 0,
      past7Days: 0,
      past14Days: 0,
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Fetch enhanced top pipe stocks using optimized RPC
 */
async function fetchEnhancedTopStocks(
  supabase: ReturnType<typeof createClient>,
  _loaders: PipeDepartmentDataLoaders,
  limit: number = 10
): Promise<{ nodes: EnhancedStockItem[]; totalCount: number }> {
  try {
    // Use optimized RPC function for better performance
    const client = await supabase;
    const { data, error } = await client.rpc('get_top_pipe_stocks_optimized', {
      stock_limit: limit,
    });

    if (error) {
      console.error('[PipeDepartment] Error loading top pipe stocks:', error);
      return { nodes: [], totalCount: 0 };
    }

    // Type guard for RPC result
    const stockData = data as PipeStockRPCResult[] | null;

    if (!stockData || !Array.isArray(stockData) || stockData.length === 0) {
      return { nodes: [], totalCount: 0 };
    }

    // Transform RPC result to EnhancedStockItem format
    const enhancedStocks: EnhancedStockItem[] = stockData.map((item: PipeStockRPCResult) => ({
      stock: item.stock,
      description: item.description || 'Unknown',
      stockLevel: item.stock_level,
      updateTime: item.update_time,
      type: item.type || 'Unknown',
      realTimeLevel: item.real_time_level,
      lastStockUpdate: item.update_time,
    }));

    return {
      nodes: enhancedStocks,
      totalCount: enhancedStocks.length,
    };
  } catch (error) {
    console.error('[PipeDepartment] Error in fetchEnhancedTopStocks:', error);
    return { nodes: [], totalCount: 0 };
  }
}

/**
 * Fetch enhanced material stocks using optimized RPC
 */
async function fetchEnhancedMaterialStocks(
  supabase: ReturnType<typeof createClient>,
  _loaders: PipeDepartmentDataLoaders,
  limit: number = 10
): Promise<{ nodes: EnhancedStockItem[]; totalCount: number }> {
  try {
    // Use optimized RPC function for material stocks
    const client = await supabase;
    const { data, error } = await client.rpc('get_material_stocks_optimized', {
      stock_limit: limit,
    });

    if (error) {
      console.error('[PipeDepartment] Error loading material stocks:', error);
      return { nodes: [], totalCount: 0 };
    }

    // Type guard for RPC result
    const materialData = data as PipeStockRPCResult[] | null;

    if (!materialData || !Array.isArray(materialData) || materialData.length === 0) {
      return { nodes: [], totalCount: 0 };
    }

    // Transform RPC result to EnhancedStockItem format
    const enhancedMaterials: EnhancedStockItem[] = materialData.map((item: PipeStockRPCResult) => ({
      stock: item.stock,
      description: item.description || 'Unknown',
      stockLevel: item.stock_level,
      updateTime: item.update_time,
      type: item.type || 'Unknown',
      realTimeLevel: item.real_time_level,
      lastStockUpdate: item.update_time,
    }));

    return {
      nodes: enhancedMaterials,
      totalCount: enhancedMaterials.length,
    };
  } catch (error) {
    console.error('[PipeDepartment] Error in fetchEnhancedMaterialStocks:', error);
    return { nodes: [], totalCount: 0 };
  }
}

/**
 * Calculate pipe production metrics
 */
async function calculatePipeProductionMetrics(
  _loaders: PipeDepartmentDataLoaders
): Promise<PipeProductionMetrics> {
  // This would integrate with production monitoring systems
  // For now, return placeholder values
  return {
    pipeProductionRate: 0.85, // 85% efficiency rate
    materialConsumptionRate: 0.92, // 92% material utilization
    efficiency: 0.88, // Overall efficiency
  };
}

/**
 * Enhanced Pipe Department Resolver
 */
export const enhancedPipeDepartmentResolver = {
  Query: {
    // Enhanced main query
    departmentPipeData: (async (_, __, _context) => {
      try {
        const supabasePromise = createClient();
        const loaders = new PipeDepartmentDataLoaders(supabasePromise);

        // Fetch all data in parallel for optimal performance
        const [stats, topStocks, materialStocks, metrics] = await Promise.all([
          fetchPipeStats(supabasePromise, loaders),
          fetchEnhancedTopStocks(supabasePromise, loaders, 10),
          fetchEnhancedMaterialStocks(supabasePromise, loaders, 7),
          calculatePipeProductionMetrics(loaders),
        ]);

        // Load machine states
        const machineNumbers = ['Machine No.01', 'Machine No.02', 'Machine No.03', 'Machine No.04'];
        const machineStates = await loaders.machineStatusLoader.loadMany(machineNumbers);

        // Clear loaders after use
        loaders.clearAll();

        const response: DepartmentPipeData = {
          stats,
          topStocks: {
            nodes: topStocks.nodes,
            totalCount: topStocks.totalCount,
            pageInfo: {
              hasNextPage: topStocks.nodes.length === 10,
              hasPreviousPage: false,
              startCursor:
                topStocks.nodes.length > 0 ? btoa(`stock:${topStocks.nodes[0].stock}`) : undefined,
              endCursor:
                topStocks.nodes.length > 0
                  ? btoa(`stock:${topStocks.nodes[topStocks.nodes.length - 1].stock}`)
                  : undefined,
            },
          },
          materialStocks: {
            nodes: materialStocks.nodes,
            totalCount: materialStocks.totalCount,
            pageInfo: {
              hasNextPage: materialStocks.nodes.length === 7,
              hasPreviousPage: false,
              startCursor:
                materialStocks.nodes.length > 0
                  ? btoa(`stock:${materialStocks.nodes[0].stock}`)
                  : undefined,
              endCursor:
                materialStocks.nodes.length > 0
                  ? btoa(`stock:${materialStocks.nodes[materialStocks.nodes.length - 1].stock}`)
                  : undefined,
            },
          },
          machineStates: machineStates.filter(
            (state: MachineState | Error): state is MachineState => !(state instanceof Error)
          ),
          pipeProductionRate: metrics.pipeProductionRate,
          materialConsumptionRate: metrics.materialConsumptionRate,
          loading: false,
          error: undefined,
        };

        return response;
      } catch (error) {
        console.error('[EnhancedPipeDepartment] Error:', error);
        return {
          stats: {
            todayFinished: 0,
            past7Days: 0,
            past14Days: 0,
            lastUpdated: new Date().toISOString(),
          },
          topStocks: {
            nodes: [],
            totalCount: 0,
            pageInfo: { hasNextPage: false, hasPreviousPage: false },
          },
          materialStocks: {
            nodes: [],
            totalCount: 0,
            pageInfo: { hasNextPage: false, hasPreviousPage: false },
          },
          machineStates: [],
          pipeProductionRate: 0,
          materialConsumptionRate: 0,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
      }
    }) as GraphQLResolver<Record<string, unknown>>,

    // Advanced query with filtering and pagination
    departmentPipeDataAdvanced: (async (_, args, context) => {
      // Implementation for advanced query with pagination and filtering
      // This would use the enhanced loaders with full pagination support
      return enhancedPipeDepartmentResolver.Query.departmentPipeData(_, {}, context);
    }) as GraphQLResolver<Record<string, unknown>>,

    // Real-time stock levels query
    realTimeStockLevels: (async (_, args, _context) => {
      try {
        const supabasePromise = createClient();
        const loaders = new PipeDepartmentDataLoaders(supabasePromise);

        const argsTyped = args as {
          filter?: Record<string, unknown>;
          sort?: { field: string; direction: 'ASC' | 'DESC' };
          pagination?: { first?: number; after?: string };
        };

        const query: StockLevelQuery = {
          filter: argsTyped.filter,
          sort: argsTyped.sort
            ? {
                field: argsTyped.sort.field as
                  | 'stock'
                  | 'description'
                  | 'stock_level'
                  | 'update_time',
                direction: argsTyped.sort.direction.toLowerCase() as 'asc' | 'desc',
              }
            : undefined,
          limit: argsTyped.pagination?.first || 20,
          offset: argsTyped.pagination?.after ? parseInt(atob(argsTyped.pagination.after)) : 0,
        };

        // Ensure stock level loaders are initialized
        if (!loaders.stockLevel) {
          await loaders.initStockLevelLoaders();
        }

        const _result = await loaders.stockLevel!.byQuery.load(query);
        loaders.clearAll();

        if (_result instanceof Error) {
          throw _result;
        }

        return _result;
      } catch (error) {
        console.error('[EnhancedPipeDepartment] Real-time stock levels error:', error);
        throw new Error('Failed to load real-time stock levels');
      }
    }) as GraphQLResolver<{
      filter?: Record<string, unknown>;
      sort?: { field: string; direction: 'ASC' | 'DESC' };
      pagination?: { first?: number; after?: string };
    }>,

    // Machine status query
    machineStatusRealTime: (async (_, args: { departmentType: string }, _context) => {
      if (args.departmentType !== 'PIPE') {
        return [];
      }

      try {
        const supabasePromise = createClient();
        const loaders = new PipeDepartmentDataLoaders(supabasePromise);

        const machineNumbers = ['Machine No.01', 'Machine No.02', 'Machine No.03', 'Machine No.04'];
        const machineStates = await loaders.machineStatusLoader.loadMany(machineNumbers);

        loaders.clearAll();

        return machineStates.filter(
          (state: MachineState | Error): state is MachineState => !(state instanceof Error)
        );
      } catch (error) {
        console.error('[EnhancedPipeDepartment] Machine status error:', error);
        return [];
      }
    }) as GraphQLResolver<{ departmentType: string }>,
  },
};

export default enhancedPipeDepartmentResolver;
