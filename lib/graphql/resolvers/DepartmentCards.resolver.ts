/**
 * Unified Department GraphQL Resolver
 * Single resolver handling all department types (INJECTION, PIPE, WAREHOUSE)
 * with shared logic and DataLoader optimization
 */

import DataLoader from 'dataloader';
import { createClient } from '../../../app/utils/supabase/server';
import type { Database } from '../../../types/database/supabase';

// Temporary type definitions until GraphQL codegen is fixed
type DepartmentType = 'INJECTION' | 'PIPE' | 'WAREHOUSE';

// Define Supabase client type from createClient return type
type SupabaseClientType = Awaited<ReturnType<typeof createClient>>;

// Define GraphQL Context type
interface GraphQLContext {
  supabase: SupabaseClientType;
  user?: { id: string; email: string; role: string };
}

// Define database result types for better type safety
interface DataIdRow {
  id: number;
  name: string;
}

interface DataCodeRow {
  code: string;
  description?: string | null;
  type?: string | null;
}

interface RecordPalletinfoRow {
  plt_num: string;
  product_qty?: number | null;
}

interface DepartmentStats {
  todayFinished?: number;
  todayTransferred?: number;
  past7Days: number;
  past14Days: number;
  lastUpdated: string; // Changed from Date to string for GraphQL compatibility
}

interface StockItem {
  stock: string;
  description?: string;
  stockLevel: number;
  updateTime: string; // Changed from Date to string for GraphQL compatibility
  type?: string;
}

interface MachineState {
  machineNumber: string;
  lastActiveTime?: string | null; // Changed from Date to string for GraphQL compatibility
  state: 'ACTIVE' | 'IDLE' | 'MAINTENANCE' | 'OFFLINE' | 'UNKNOWN';
}

interface RecentActivity {
  time: string;
  staff: string;
  action: string;
  detail: string;
}

interface OrderCompletion {
  orderRef: string;
  productQty: number;
  loadedQty: number;
  completionPercentage: number;
  latestUpdate?: string;
  hasPdf: boolean;
  docUrl?: string | null;
}

interface OrderDetail {
  actionTime: string;
  palletNum: string;
  description: string;
  productQty: number;
  loadedBy: string;
}

interface _DepartmentData {
  stats: DepartmentStats;
  topStocks: StockItem[];
  materialStocks: StockItem[];
  machineStates?: MachineState[];
  recentActivities?: RecentActivity[];
  orderCompletions?: OrderCompletion[];
  loading: boolean;
  error?: string | null;
}

/**
 * Department Configuration
 */
interface DepartmentConfig {
  type: DepartmentType;
  statsField: 'todayFinished' | 'todayTransferred';
  statsTable: 'record_palletinfo' | 'record_transfer';
  statsDateField: 'generate_time' | 'tran_date';
  productFilter: (type: string) => boolean;
  materialPattern?: string;
  machines: MachineState[];
  hasRecentActivities: boolean;
  hasOrderCompletions: boolean;
}

/**
 * Get configuration for each department type
 */
function getDepartmentConfig(type: DepartmentType): DepartmentConfig {
  switch (type) {
    case 'INJECTION':
      return {
        type,
        statsField: 'todayFinished',
        statsTable: 'record_palletinfo',
        statsDateField: 'generate_time',
        productFilter: productType => {
          // Filter out these types: Material, Pipe, Parts, Test, TEST, Tools, TOOLS
          const excludeTypes = ['Material', 'Pipe', 'Parts', 'Test', 'TEST', 'Tools', 'TOOLS'];
          return !excludeTypes.includes(productType?.trim());
        },
        machines: [
          { machineNumber: 'Machine No.04', lastActiveTime: null, state: 'UNKNOWN' },
          { machineNumber: 'Machine No.06', lastActiveTime: null, state: 'UNKNOWN' },
          { machineNumber: 'Machine No.07', lastActiveTime: null, state: 'UNKNOWN' },
          { machineNumber: 'Machine No.11', lastActiveTime: null, state: 'UNKNOWN' },
          { machineNumber: 'Machine No.12', lastActiveTime: null, state: 'UNKNOWN' },
          { machineNumber: 'Machine No.14', lastActiveTime: null, state: 'UNKNOWN' },
        ],
        hasRecentActivities: false,
        hasOrderCompletions: false,
      };

    case 'PIPE':
      return {
        type,
        statsField: 'todayFinished',
        statsTable: 'record_palletinfo',
        statsDateField: 'generate_time',
        productFilter: productType => productType === 'Pipe',
        machines: [
          { machineNumber: 'Machine No.01', lastActiveTime: null, state: 'UNKNOWN' },
          { machineNumber: 'Machine No.02', lastActiveTime: null, state: 'UNKNOWN' },
          { machineNumber: 'Machine No.03', lastActiveTime: null, state: 'UNKNOWN' },
          { machineNumber: 'Machine No.04', lastActiveTime: null, state: 'UNKNOWN' },
        ],
        hasRecentActivities: false,
        hasOrderCompletions: false,
      };

    case 'WAREHOUSE':
      return {
        type,
        statsField: 'todayTransferred',
        statsTable: 'record_transfer',
        statsDateField: 'tran_date',
        productFilter: () => true, // No filtering for warehouse
        materialPattern: 'MAT%',
        machines: [],
        hasRecentActivities: true,
        hasOrderCompletions: true,
      };

    default:
      throw new Error(`Unknown department type: ${type}`);
  }
}

/**
 * Unified DataLoader class for all departments
 */
class UnifiedDataLoaders {
  private supabase: SupabaseClientType;

  public staffLoader: DataLoader<number, string>;
  public productLoader: DataLoader<string, { description: string; type: string }>;
  public palletInfoLoader: DataLoader<string, number>;
  public orderDetailsLoader: DataLoader<string, OrderDetail[]>;
  public documentLoader: DataLoader<string, string | null>;

  constructor(supabase: SupabaseClientType) {
    this.supabase = supabase;

    // Staff name loader
    this.staffLoader = new DataLoader(async (staffIds: readonly number[]) => {
      const { data, error } = await this.supabase
        .from('data_id')
        .select('id, name')
        .in('id', [...staffIds]);

      if (error) {
        console.error('Error loading staff names:', error);
        return staffIds.map(() => 'Unknown');
      }

      const staffMap = new Map(data?.map((s: DataIdRow) => [s.id, s.name]) || []);
      return staffIds.map(id => staffMap.get(id) || 'Unknown');
    });

    // Product info loader
    this.productLoader = new DataLoader(async (productCodes: readonly string[]) => {
      const { data, error } = await this.supabase
        .from('data_code')
        .select('code, description, type')
        .in('code', [...productCodes]);

      if (error) {
        console.error('Error loading product data:', error);
        return productCodes.map(() => ({ description: 'Unknown', type: 'Unknown' }));
      }

      const productMap = new Map(
        data?.map((p: DataCodeRow) => [
          p.code,
          { description: p.description || 'Unknown', type: p.type || 'Unknown' },
        ]) || []
      );
      return productCodes.map(
        code => productMap.get(code) || { description: 'Unknown', type: 'Unknown' }
      );
    });

    // Pallet info loader
    this.palletInfoLoader = new DataLoader(async (palletNums: readonly string[]) => {
      const { data, error } = await this.supabase
        .from('record_palletinfo')
        .select('plt_num, product_qty')
        .in('plt_num', [...palletNums]);

      if (error) {
        console.error('Error loading pallet info:', error);
        return palletNums.map(() => 0);
      }

      const palletMap = new Map(
        data?.map((p: RecordPalletinfoRow) => [p.plt_num, p.product_qty || 0]) || []
      );
      return palletNums.map(num => palletMap.get(num) || 0);
    });

    // Order details loader (for warehouse)
    this.orderDetailsLoader = new DataLoader(async (orderRefs: readonly string[]) => {
      const { data: historyData, error } = await this.supabase
        .from('order_loading_history')
        .select('order_ref, pallet_num, product_code, action_by, action_time')
        .in('order_ref', [...orderRefs])
        .order('action_time', { ascending: false });

      if (error) {
        console.error('Error loading order details:', error);
        return orderRefs.map(() => []);
      }

      // Group by order_ref
      const orderDetailsMap = new Map<string, DatabaseRecord[]>();
      for (const ref of orderRefs) {
        orderDetailsMap.set(ref, []);
      }

      if (historyData) {
        for (const item of historyData as OrderHistoryQueryResult[]) {
          const details = orderDetailsMap.get(item.order_ref) || [];
          // Convert the query result to DatabaseRecord format
          const dbRecord: DatabaseRecord = {
            order_ref: item.order_ref,
            pallet_num: item.pallet_num,
            product_code: item.product_code,
            action_by:
              typeof item.action_by === 'string' ? parseInt(item.action_by, 10) : item.action_by,
            action_time: item.action_time,
          };
          details.push(dbRecord);
          orderDetailsMap.set(item.order_ref, details);
        }
      }

      // Process details using other loaders
      const results = await Promise.all(
        orderRefs.map(async orderRef => {
          const items = orderDetailsMap.get(orderRef) || [];
          const processedDetails: OrderDetail[] = [];

          for (const item of items) {
            const [productQty, productData, staffName] = await Promise.all([
              this.palletInfoLoader.load(item.pallet_num),
              this.productLoader.load(item.product_code),
              this.staffLoader.load(item.action_by),
            ]);

            processedDetails.push({
              actionTime: new Date(item.action_time).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
              palletNum: item.pallet_num,
              description: productData.description,
              productQty,
              loadedBy: staffName,
            });
          }

          return processedDetails;
        })
      );

      return results;
    });

    // Document URL loader (for warehouse) - Optimized with precise database queries
    this.documentLoader = new DataLoader(async (orderRefs: readonly string[]) => {
      try {
        const docMap = new Map<string, string>();

        // Use parallel queries for better performance
        const queryPromises = orderRefs.map(async ref => {
          // Try exact match first
          let { data: exactMatch } = await this.supabase
            .from('doc_upload')
            .select('doc_name, doc_url')
            .eq('doc_type', 'order')
            .eq('doc_name', `${ref} Picking List.pdf`)
            .single();

          if (exactMatch?.doc_url) {
            console.log(`Found exact document for order ${ref}: ${exactMatch.doc_name}`);
            return { ref, url: exactMatch.doc_url };
          }

          // Try partial match with LIKE operator
          const { data: partialMatches } = await this.supabase
            .from('doc_upload')
            .select('doc_name, doc_url')
            .eq('doc_type', 'order')
            .like('doc_name', `%${ref}%`)
            .like('doc_name', '%Picking List%');

          if (partialMatches && partialMatches.length > 0) {
            // Find the best match - prefer exact order_ref match
            const bestMatch =
              partialMatches.find(
                d =>
                  (d.doc_name as string)?.startsWith(ref) &&
                  (d.doc_name as string)?.includes('Picking List')
              ) || partialMatches[0];

            if (bestMatch?.doc_url) {
              console.log(`Found partial document for order ${ref}: ${bestMatch.doc_name}`);
              return { ref, url: bestMatch.doc_url };
            }
          }

          console.log(`No document found for order ${ref}`);
          return { ref, url: null };
        });

        const results = await Promise.all(queryPromises);
        results.forEach(result => {
          if (result.url && typeof result.ref === 'string' && typeof result.url === 'string') {
            docMap.set(result.ref, result.url);
          }
        });

        return orderRefs.map(ref => docMap.get(ref) || null);
      } catch (error) {
        console.error('Error in documentLoader:', error);
        return orderRefs.map(() => null);
      }
    });
  }

  clearAll() {
    this.staffLoader.clearAll();
    this.productLoader.clearAll();
    this.palletInfoLoader.clearAll();
    this.orderDetailsLoader.clearAll();
    this.documentLoader.clearAll();
  }
}

/**
 * Unified resolver for all departments
 */
export const unifiedDepartmentResolver = {
  Query: {
    // Injection Department Data
    departmentInjectionData: async (_: unknown, __: unknown, context: unknown) => {
      const _ctx = context as GraphQLContext;
      try {
        const supabase = await createClient();
        const loaders = new UnifiedDataLoaders(supabase);
        const config = getDepartmentConfig('INJECTION');

        // Fetch all data in parallel
        const [stats, topStocks, materialStocks] = await Promise.all([
          fetchStats(supabase, config),
          fetchTopStocks(supabase, loaders, config),
          fetchMaterialStocks(supabase, loaders, config),
        ]);

        // Clear loaders after use
        loaders.clearAll();

        return {
          stats,
          topStocks: {
            edges: topStocks.map((item, index) => ({
              node: item,
              cursor: Buffer.from(`${index}`).toString('base64'),
            })),
            nodes: topStocks,
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: topStocks.length > 0 ? Buffer.from('0').toString('base64') : null,
              endCursor:
                topStocks.length > 0
                  ? Buffer.from(`${topStocks.length - 1}`).toString('base64')
                  : null,
            },
            totalCount: topStocks.length,
          },
          materialStocks: {
            edges: materialStocks.map((item, index) => ({
              node: item,
              cursor: Buffer.from(`${index}`).toString('base64'),
            })),
            nodes: materialStocks,
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: materialStocks.length > 0 ? Buffer.from('0').toString('base64') : null,
              endCursor:
                materialStocks.length > 0
                  ? Buffer.from(`${materialStocks.length - 1}`).toString('base64')
                  : null,
            },
            totalCount: materialStocks.length,
          },
          machineStates: config.machines,
          loading: false,
          error: null,
        };
      } catch (error) {
        console.error('[departmentInjectionData] Error:', error);
        return {
          stats: {
            todayFinished: 0,
            past7Days: 0,
            past14Days: 0,
            lastUpdated: new Date().toISOString(),
          },
          topStocks: {
            edges: [],
            nodes: [],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: null,
              endCursor: null,
            },
            totalCount: 0,
          },
          materialStocks: {
            edges: [],
            nodes: [],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: null,
              endCursor: null,
            },
            totalCount: 0,
          },
          machineStates: [],
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
      }
    },

    // Pipe Department Data
    departmentPipeData: async (_: unknown, __: unknown, context: unknown) => {
      const _ctx = context as GraphQLContext;
      try {
        const supabase = await createClient();
        const loaders = new UnifiedDataLoaders(supabase);
        const config = getDepartmentConfig('PIPE');

        const [stats, topStocks, materialStocks] = await Promise.all([
          fetchStats(supabase, config),
          fetchTopStocks(supabase, loaders, config),
          fetchMaterialStocks(supabase, loaders, config),
        ]);

        loaders.clearAll();

        return {
          stats,
          topStocks: {
            edges: topStocks.map((item, index) => ({
              node: item,
              cursor: Buffer.from(`${index}`).toString('base64'),
            })),
            nodes: topStocks,
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: topStocks.length > 0 ? Buffer.from('0').toString('base64') : null,
              endCursor:
                topStocks.length > 0
                  ? Buffer.from(`${topStocks.length - 1}`).toString('base64')
                  : null,
            },
            totalCount: topStocks.length,
          },
          materialStocks: {
            edges: materialStocks.map((item, index) => ({
              node: item,
              cursor: Buffer.from(`${index}`).toString('base64'),
            })),
            nodes: materialStocks,
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: materialStocks.length > 0 ? Buffer.from('0').toString('base64') : null,
              endCursor:
                materialStocks.length > 0
                  ? Buffer.from(`${materialStocks.length - 1}`).toString('base64')
                  : null,
            },
            totalCount: materialStocks.length,
          },
          machineStates: config.machines,
          loading: false,
          error: null,
        };
      } catch (error) {
        console.error('[departmentPipeData] Error:', error);
        return {
          stats: {
            todayFinished: 0,
            past7Days: 0,
            past14Days: 0,
            lastUpdated: new Date().toISOString(),
          },
          topStocks: {
            edges: [],
            nodes: [],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: null,
              endCursor: null,
            },
            totalCount: 0,
          },
          materialStocks: {
            edges: [],
            nodes: [],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: null,
              endCursor: null,
            },
            totalCount: 0,
          },
          machineStates: [],
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
      }
    },

    // Warehouse Department Data
    departmentWarehouseData: async (_: unknown, __: unknown, context: unknown) => {
      const _ctx = context as GraphQLContext;
      try {
        const supabase = await createClient();
        const loaders = new UnifiedDataLoaders(supabase);
        const config = getDepartmentConfig('WAREHOUSE');

        const [stats, topStocks, materialStocks, recentActivities, orderCompletions] =
          await Promise.all([
            fetchStats(supabase, config),
            fetchTopStocks(supabase, loaders, config),
            fetchMaterialStocks(supabase, loaders, config),
            fetchRecentActivities(supabase, loaders),
            fetchOrderCompletions(supabase, loaders),
          ]);

        loaders.clearAll();

        return {
          stats,
          topStocks: {
            edges: topStocks.map((item, index) => ({
              node: item,
              cursor: Buffer.from(`${index}`).toString('base64'),
            })),
            nodes: topStocks,
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: topStocks.length > 0 ? Buffer.from('0').toString('base64') : null,
              endCursor:
                topStocks.length > 0
                  ? Buffer.from(`${topStocks.length - 1}`).toString('base64')
                  : null,
            },
            totalCount: topStocks.length,
          },
          materialStocks: {
            edges: materialStocks.map((item, index) => ({
              node: item,
              cursor: Buffer.from(`${index}`).toString('base64'),
            })),
            nodes: materialStocks,
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: materialStocks.length > 0 ? Buffer.from('0').toString('base64') : null,
              endCursor:
                materialStocks.length > 0
                  ? Buffer.from(`${materialStocks.length - 1}`).toString('base64')
                  : null,
            },
            totalCount: materialStocks.length,
          },
          recentActivities,
          orderCompletions,
          loading: false,
          error: null,
        };
      } catch (error) {
        console.error('[departmentWarehouseData] Error:', error);
        return {
          stats: {
            todayTransferred: 0,
            past7Days: 0,
            past14Days: 0,
            lastUpdated: new Date().toISOString(),
          },
          topStocks: {
            edges: [],
            nodes: [],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: null,
              endCursor: null,
            },
            totalCount: 0,
          },
          materialStocks: {
            edges: [],
            nodes: [],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: null,
              endCursor: null,
            },
            totalCount: 0,
          },
          recentActivities: [],
          orderCompletions: [],
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
      }
    },
  },
};

/**
 * Helper functions
 */

// Additional types for database records
interface DatabaseRecord {
  order_ref: string;
  pallet_num: string;
  product_code: string;
  action_by: number;
  action_time: string;
}

// Type for actual database query results
interface OrderHistoryQueryResult {
  order_ref: string;
  pallet_num: string;
  product_code: string;
  action_by: string | number;
  action_time: string;
}

async function fetchStats(
  supabase: SupabaseClientType,
  config: DepartmentConfig
): Promise<DepartmentStats> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const past7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const past14Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  if (config.type === 'WAREHOUSE') {
    // Count transfers for warehouse
    const [todayResult, past7Result, past14Result] = await Promise.all([
      supabase
        .from(config.statsTable)
        .select('*', { count: 'exact', head: true })
        .gte(config.statsDateField, today.toISOString()),

      supabase
        .from(config.statsTable)
        .select('*', { count: 'exact', head: true })
        .gte(config.statsDateField, past7Days.toISOString()),

      supabase
        .from(config.statsTable)
        .select('*', { count: 'exact', head: true })
        .gte(config.statsDateField, past14Days.toISOString()),
    ]);

    return {
      todayTransferred: todayResult.count || 0,
      todayFinished: undefined,
      past7Days: past7Result.count || 0,
      past14Days: past14Result.count || 0,
      lastUpdated: new Date().toISOString(),
    };
  } else {
    // Count finished pallets for injection/pipe
    interface StatsRecord {
      product_code: string;
      [key: string]: string | number | Date;
    }
    let allRecords: StatsRecord[] = [];

    if (config.statsTable === 'record_palletinfo') {
      const { data } = await supabase
        .from(config.statsTable)
        .select(`product_code, ${config.statsDateField}`)
        .gte(config.statsDateField, past14Days.toISOString());
      allRecords = (data || []) as StatsRecord[];
    } else {
      // For record_transfer, need to join with record_palletinfo to get product_code
      const { data } = await supabase
        .from(config.statsTable)
        .select(`${config.statsDateField}, plt_num, record_palletinfo!inner(product_code)`)
        .gte(config.statsDateField, past14Days.toISOString());

      // Type the data properly based on field selection
      type TransferRecord = {
        [key: string]: string | number | Date | { product_code: string };
        plt_num: string;
        record_palletinfo: {
          product_code: string;
        };
      } & Record<string, unknown>;

      allRecords = ((data || []) as TransferRecord[])
        .filter(
          (r): r is TransferRecord =>
            typeof r === 'object' && r !== null && 'record_palletinfo' in r
        )
        .map(
          (r): StatsRecord => ({
            product_code: r.record_palletinfo?.product_code || '',
            [config.statsDateField]: r[config.statsDateField] as string | number | Date,
          })
        );
    }

    if (!allRecords || allRecords.length === 0) {
      return {
        todayFinished: 0,
        todayTransferred: undefined,
        past7Days: 0,
        past14Days: 0,
        lastUpdated: new Date().toISOString(),
      };
    }

    // Get product types for filtering
    const productCodesSet = new Set(allRecords.map(r => r.product_code as string).filter(Boolean));
    const productCodes = Array.from(productCodesSet);
    const { data: productData } = await supabase
      .from('data_code')
      .select('code, type')
      .in('code', productCodes);

    const productTypeMap = new Map(
      productData?.map((p: Record<string, unknown>) => [p.code as string, p.type as string]) || []
    );

    // Apply department filter
    const filteredRecords = allRecords.filter(r => {
      const productType = productTypeMap.get(r.product_code as string);
      return productType ? config.productFilter(productType as string) : false;
    });

    // Count by time period
    const todayFinished = filteredRecords.filter(
      r => new Date(r[config.statsDateField] as string) >= today
    ).length;

    const past7DaysCount = filteredRecords.filter(
      r => new Date(r[config.statsDateField] as string) >= past7Days
    ).length;

    return {
      todayFinished,
      todayTransferred: undefined,
      past7Days: past7DaysCount,
      past14Days: filteredRecords.length,
      lastUpdated: new Date().toISOString(),
    };
  }
}

async function fetchTopStocks(
  supabase: SupabaseClientType,
  loaders: UnifiedDataLoaders,
  config: DepartmentConfig
): Promise<StockItem[]> {
  // Get latest stock levels from stock_level table
  // First get the latest update time for each stock
  const { data: latestStocks, error } = await supabase
    .from('stock_level')
    .select('stock, stock_level, update_time, description')
    .order('update_time', { ascending: false });

  if (error || !latestStocks) return [];

  // Get unique stocks with their latest values
  const stockMap = new Map<string, { level: number; updateTime: string; description: string }>();
  for (const item of latestStocks) {
    if (!stockMap.has(item.stock as string)) {
      // Ensure update_time is a proper ISO string
      const updateTime = item.update_time
        ? typeof item.update_time === 'string'
          ? item.update_time
          : new Date(item.update_time as string | Date).toISOString()
        : new Date().toISOString();

      stockMap.set(item.stock as string, {
        level: (item.stock_level as number) || 0,
        updateTime: updateTime,
        description: (item.description as string) || '',
      });
    }
  }

  // Get product info for filtering
  const productCodes = Array.from(stockMap.keys());
  const productInfos = await loaders.productLoader.loadMany(productCodes);

  // Build and filter stock items
  const stockItems: StockItem[] = [];
  for (let i = 0; i < productCodes.length; i++) {
    const code = productCodes[i];
    const info = productInfos[i];
    const stockData = stockMap.get(code);

    if (
      stockData &&
      typeof info === 'object' &&
      'type' in info &&
      typeof info.type === 'string' &&
      config.productFilter(info.type)
    ) {
      stockItems.push({
        stock: code,
        description: info.description || stockData.description,
        stockLevel: stockData.level,
        updateTime: stockData.updateTime || new Date().toISOString(),
        type: info.type,
      });
    }
  }

  return stockItems.sort((a, b) => b.stockLevel - a.stockLevel).slice(0, 10);
}

async function fetchMaterialStocks(
  supabase: SupabaseClientType,
  loaders: UnifiedDataLoaders,
  config: DepartmentConfig
): Promise<StockItem[]> {
  // Get latest stock levels from stock_level table
  let query = supabase
    .from('stock_level')
    .select('stock, stock_level, update_time, description')
    .order('update_time', { ascending: false });

  // Apply material pattern for warehouse
  if (config.materialPattern) {
    query = query.like('stock', config.materialPattern);
  }

  const { data: latestStocks, error } = await query;

  if (error || !latestStocks) return [];

  // Get unique stocks with their latest values
  const stockMap = new Map<string, { level: number; updateTime: string; description: string }>();
  for (const item of latestStocks) {
    if (!stockMap.has(item.stock as string)) {
      // Ensure update_time is a proper ISO string
      const updateTime = item.update_time
        ? typeof item.update_time === 'string'
          ? item.update_time
          : new Date(item.update_time as string | Date).toISOString()
        : new Date().toISOString();

      stockMap.set(item.stock as string, {
        level: (item.stock_level as number) || 0,
        updateTime: updateTime,
        description: (item.description as string) || '',
      });
    }
  }

  // Get material info
  const materialCodes = Array.from(stockMap.keys());
  const materialInfos = await loaders.productLoader.loadMany(materialCodes);

  // Build material items
  const materialItems: StockItem[] = [];
  for (let i = 0; i < materialCodes.length; i++) {
    const code = materialCodes[i];
    const info = materialInfos[i];
    const stockData = stockMap.get(code);

    if (stockData && typeof info === 'object' && 'type' in info) {
      // For INJECTION department: Only show Material type items
      if (config.type === 'INJECTION' && info.type !== 'Material') {
        continue;
      }
      // For PIPE department: Only show Material type items
      if (config.type === 'PIPE' && info.type !== 'Material') {
        continue;
      }

      materialItems.push({
        stock: code,
        description: info.description || stockData.description,
        stockLevel: stockData.level,
        updateTime: stockData.updateTime || new Date().toISOString(),
        type: config.type === 'WAREHOUSE' ? 'MATERIAL' : info.type,
      });
    }
  }

  return materialItems.sort((a, b) => b.stockLevel - a.stockLevel);
}

async function fetchRecentActivities(
  supabase: SupabaseClientType,
  loaders: UnifiedDataLoaders
): Promise<RecentActivity[]> {
  const last24Hours = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);

  const { data: historyData, error } = await supabase
    .from('record_history')
    .select('time, id, action, plt_num, remark')
    .in('action', ['Stock Transfer', 'Loaded'])
    .gte('time', last24Hours.toISOString())
    .order('time', { ascending: false })
    .limit(50);

  if (error || !historyData) return [];

  // Get staff names
  const staffIdsSet = new Set(
    historyData
      .map((h: Record<string, unknown>) => h.id as number)
      .filter((id): id is number => id !== null)
  );
  const staffIds = Array.from(staffIdsSet);
  const staffNames = await loaders.staffLoader.loadMany(staffIds);
  const staffMap = new Map(staffIds.map((id, index) => [id, staffNames[index] as string]));

  return historyData.slice(0, 7).map((activity: Record<string, unknown>) => ({
    time: new Date(activity.time as string).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    staff:
      activity.id && typeof staffMap.get(activity.id as number) === 'string'
        ? (staffMap.get(activity.id as number) as string)
        : 'Unknown',
    action: activity.action as string,
    detail: `${(activity.plt_num as string) || ''}-${(activity.remark as string) || ''}`,
  }));
}

async function fetchOrderCompletions(
  supabase: SupabaseClientType,
  loaders: UnifiedDataLoaders
): Promise<OrderCompletion[]> {
  try {
    // Get unique order_refs from data_order table
    const { data: ordersData, error: orderError } = await supabase
      .from('data_order')
      .select('order_ref, product_qty, loaded_qty')
      .limit(50);

    if (orderError) {
      console.error('Error fetching orders:', orderError);
      return [];
    }

    if (!ordersData || ordersData.length === 0) {
      console.log('No orders found in data_order table');
      return [];
    }

    // Group by order_ref and calculate totals with proper type conversion
    const orderMap = new Map<string, { totalProductQty: number; totalLoadedQty: number }>();
    ordersData.forEach((order: Record<string, unknown>) => {
      const existing = orderMap.get(order.order_ref as string) || {
        totalProductQty: 0,
        totalLoadedQty: 0,
      };

      // Robust number conversion with fallbacks
      const loadedQty = (() => {
        if (typeof order.loaded_qty === 'number') return order.loaded_qty;
        if (typeof order.loaded_qty === 'string') {
          const parsed = parseInt(order.loaded_qty, 10);
          return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
      })();

      const productQty = (() => {
        if (typeof order.product_qty === 'number') return order.product_qty;
        if (typeof order.product_qty === 'string') {
          const parsed = parseInt(order.product_qty, 10);
          return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
      })();

      orderMap.set(order.order_ref as string, {
        totalProductQty: existing.totalProductQty + productQty,
        totalLoadedQty: existing.totalLoadedQty + loadedQty,
      });
    });

    console.log('Order totals:', Array.from(orderMap.entries()).slice(0, 3));

    const uniqueOrderRefs = Array.from(orderMap.keys()).slice(0, 7);

    // Fetch latest update for each order from order_loading_history
    const orderDataPromises = uniqueOrderRefs.map(async (orderRef: string) => {
      const orderTotals = orderMap.get(orderRef)!;

      // Get latest action_time from order_loading_history (fallback to data_order created_at if no history)
      let latestUpdate = 'N/A';

      // First try order_loading_history
      const { data: loadingHistory } = await supabase
        .from('order_loading_history')
        .select('action_time, action_by')
        .eq('order_ref', orderRef as string)
        .order('action_time', { ascending: false })
        .limit(1);

      if (loadingHistory && loadingHistory.length > 0) {
        latestUpdate = loadingHistory[0].action_time as string;
      } else {
        // Fallback to data_order created_at
        const { data: orderData } = await supabase
          .from('data_order')
          .select('created_at')
          .eq('order_ref', orderRef)
          .order('created_at', { ascending: false })
          .limit(1);

        if (orderData && orderData.length > 0) {
          latestUpdate = orderData[0].created_at as string;
        }
      }

      return {
        orderRef,
        totalProductQty: orderTotals.totalProductQty,
        totalLoadedQty: orderTotals.totalLoadedQty,
        latestUpdate,
      };
    });

    const orderResults = await Promise.all(orderDataPromises);

    // Check for PDFs in doc_upload table
    const docUrls = await loaders.documentLoader.loadMany(uniqueOrderRefs);

    console.log('DocUrls result:', docUrls);

    // Build results
    const orderCompletions: OrderCompletion[] = [];
    for (let i = 0; i < orderResults.length; i++) {
      const result = orderResults[i];
      const docUrl = docUrls[i];
      if (!result) continue;

      // Calculate completion percentage with proper validation
      const completionPercentage = (() => {
        if (result.totalProductQty <= 0) return 0;
        if (result.totalLoadedQty <= 0) return 0;

        const percentage = (result.totalLoadedQty / result.totalProductQty) * 100;

        // Ensure percentage is within valid range and is an integer
        return Math.min(100, Math.max(0, Math.round(percentage)));
      })();

      orderCompletions.push({
        orderRef: result.orderRef,
        productQty: result.totalProductQty,
        loadedQty: result.totalLoadedQty,
        completionPercentage,
        latestUpdate:
          result.latestUpdate && result.latestUpdate !== 'N/A'
            ? new Date(result.latestUpdate).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'N/A',
        hasPdf: typeof docUrl === 'string' && docUrl.length > 0,
        docUrl: typeof docUrl === 'string' && docUrl.length > 0 ? docUrl : null,
      });
    }

    console.log('Final order completions:', orderCompletions.slice(0, 2));

    return orderCompletions;
  } catch (error) {
    console.error('Error in fetchOrderCompletions:', error);
    return [];
  }
}

export default unifiedDepartmentResolver;
