/**
 * Stock History DataLoader
 * Optimized batch loading for stock history operations to prevent N+1 queries
 */

import DataLoader from 'dataloader';
import { SupabaseClient } from '@supabase/supabase-js';
import { GraphQLContext } from '../resolvers/index';

// Type definitions
interface FilterOptions {
  dateRange?: { start: string; end: string };
  location?: string;
  operator?: string;
  action?: string;
  [key: string]: unknown;
}

interface PaginationOptions {
  limit?: number;
  offset?: number;
  cursor?: string;
}

interface SortOptions {
  field: string;
  direction: 'ASC' | 'DESC';
}

interface TransferData {
  id: string;
  palletNumber: string;
  fromLocation: string;
  toLocation: string;
  timestamp: string;
  operator: string;
  operatorName: string;
  action: string;
  duration?: number;
  formattedDate?: string;
  formattedTime?: string;
  formattedDuration?: string | null;
  isBottleneck?: boolean;
  efficiency?: number | null;
}

interface PalletInfo {
  plt_num: string;
}

interface OperatorInfo {
  id: number;
  name: string;
}

interface SearchResult {
  id: string;
  type: 'PRODUCT' | 'PALLET' | 'LOCATION' | 'PRODUCT_CODE' | 'PALLET_NUMBER';
  title: string;
  subtitle?: string;
  relevance: number;
}

interface StockRecord {
  id: string;
  plt_num: string;
  loc: string;
  time: string;
  [key: string]: unknown;
}

interface PalletHistoryBatchQuery {
  productCode: string;
  filter: FilterOptions;
  pagination: PaginationOptions;
  sort: SortOptions;
}

interface DatabaseRecord {
  time: string;
  plt_num: string;
  action: string;
  loc: string;
  remark: string;
  id: number;
  product_code?: string; // Add optional product_code
}

interface DatabaseOperator {
  id: number;
  name: string;
}

interface DatabaseProductInfo {
  code: string;
  description?: string;
  type?: string;
  colour?: string;
  standard_qty?: number;
}

interface StockHistoryRecord {
  id: string;
  timestamp: string;
  palletNumber: string;
  productCode: string;
  action: string;
  location?: string;
  fromLocation?: string;
  toLocation?: string;
  operatorId?: string | number;
  operatorName: string;
  quantity?: number;
  remark?: string;
  metadata?: Record<string, unknown>;
  description?: string;
  chineseDescription?: string | null;
  type?: string;
  colour?: string;
  standardQty?: number;
  actionType?: 'MOVEMENT' | 'STATUS_CHANGE' | 'QUANTITY_CHANGE' | 'SYSTEM_ACTION';
  actionCategory?: 'INBOUND' | 'OUTBOUND' | 'INTERNAL' | 'ADMINISTRATIVE';
}

export class StockHistoryDataLoader {
  private supabase: SupabaseClient;
  
  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  // Batch loader for pallet history by product code
  static createPalletHistoryLoader(supabase: SupabaseClient) {
    return new DataLoader<string, { records: StockHistoryRecord[]; totalRecords: number; productCode: string }>(
      async (productCodes: readonly string[]) => {
        const results = await Promise.all(
          productCodes.map(async (productCode) => {
            try {
              // Step 1: Get all pallet numbers for this product code (case-insensitive)
              const { data: pallets, error: palletError } = await supabase
                .from('record_palletinfo')
                .select('plt_num')
                .ilike('product_code', productCode);
              
              if (palletError || !pallets || pallets.length === 0) {
                console.log(`No pallets found for product ${productCode}`);
                return { records: [], totalRecords: 0, productCode };
              }
              
              const palletNumbers = pallets.map(p => p.plt_num);
              console.log(`[DataLoader] Found ${palletNumbers.length} pallets for product ${productCode}`);
              
              // Step 2: Get history records with DISTINCT to prevent cartesian products
              const { data: historyData, error: historyError } = await supabase
                .from('record_history')
                .select(`
                  time,
                  plt_num,
                  action,
                  loc,
                  remark,
                  id
                `)
                .in('plt_num', palletNumbers)
                .order('time', { ascending: false })
                .limit(1000);
              
              if (historyError) {
                console.error(`Error fetching history for ${productCode}:`, historyError);
                return { records: [], totalRecords: 0, productCode };
              }
              
              console.log(`[DataLoader] Raw history records: ${historyData?.length || 0}`);
              
              // Step 2.1: Apply aggressive deduplication on raw data
              const seenRawRecords = new Set<string>();
              const deduplicatedHistory = (historyData || []).filter(record => {
                // Create more comprehensive unique key including all relevant fields
                const uniqueKey = `${record.time}-${record.plt_num}-${record.action || 'null'}-${record.loc || 'null'}-${record.id || 'null'}-${record.remark || 'null'}`;
                
                if (seenRawRecords.has(uniqueKey)) {
                  console.warn(`[DataLoader] Duplicate raw record detected and removed: ${uniqueKey}`);
                  return false;
                }
                seenRawRecords.add(uniqueKey);
                return true;
              });
              
              console.log(`[DataLoader] After deduplication: ${deduplicatedHistory.length} records`);
              
              // Step 3: Get operator names separately to avoid JOINs
              const operatorIds = [...new Set(deduplicatedHistory.map(h => h.id).filter(id => id !== null))];
              let operatorMap = new Map<number, string>();
              
              if (operatorIds.length > 0) {
                const { data: operators } = await supabase
                  .from('data_id')
                  .select('id, name')
                  .in('id', operatorIds);
                
                if (operators) {
                  operators.forEach(op => operatorMap.set(op.id, op.name));
                }
              }
              
              // Step 4: Get product info separately
              const { data: productInfo } = await supabase
                .from('data_code')
                .select('code, description, type, colour, standard_qty')
                .ilike('code', productCode)
                .single();
              
              // Step 5: Transform data with additional deduplication check
              const transformedRecords = new Map<string, StockHistoryRecord>();
              
              deduplicatedHistory.forEach(record => {
                // Create a more specific unique key for final deduplication
                const finalUniqueKey = `${record.time}-${record.plt_num}-${record.action}-${record.loc || 'null'}`;
                
                if (transformedRecords.has(finalUniqueKey)) {
                  console.warn(`[DataLoader] Duplicate transformed record detected: ${finalUniqueKey}`);
                  return;
                }
                
                transformedRecords.set(finalUniqueKey, {
                  id: `${record.plt_num}-${new Date(record.time).getTime()}-${record.id || 'unknown'}`,
                  timestamp: record.time,
                  palletNumber: record.plt_num,
                  action: record.action === 'Finished QC' ? 'FINISHED_QC' : 
                         record.action === 'GRN Receiving' ? 'GRN_RECEIVING' :
                         record.action?.replace(/[:\s-]+/g, '_').toUpperCase() || 'UNKNOWN',
                  location: record.loc,
                  remark: record.remark,
                  operatorId: record.id,
                  operatorName: operatorMap.get(record.id) || '',
                  productCode: productCode,
                  description: productInfo?.description || '',
                  chineseDescription: null, // Field not available in database
                  type: productInfo?.type || '',
                  colour: productInfo?.colour || '',
                  standardQty: productInfo?.standard_qty || 0
                });
              });
              
              const records = Array.from(transformedRecords.values());
              console.log(`[DataLoader] Final deduplicated records for ${productCode}: ${records.length}`);
              
              return {
                productCode,
                records: records,
                totalRecords: records.length,
              };
            } catch (error) {
              console.error(`DataLoader error for ${productCode}:`, error);
              return { records: [], totalRecords: 0, productCode };
            }
          })
        );
        
        return results;
      },
      {
        // Cache for 5 minutes to balance freshness vs performance
        cacheKeyFn: (key) => key,
        maxBatchSize: 10,
      }
    );
  }

  // Batch loader for single pallet history with deduplication
  static createSinglePalletHistoryLoader(supabase: SupabaseClient) {
    return new DataLoader<string, { records: StockHistoryRecord[]; palletNumber: string; totalRecords: number }>(
      async (palletNumbers: readonly string[]) => {
        const results = await Promise.all(
          palletNumbers.map(async (palletNumber) => {
            try {
              // Use separate queries to avoid JOIN-related cartesian products
              const { data: historyData, error: historyError } = await supabase
                .from('record_history')
                .select(`
                  time,
                  plt_num,
                  action,
                  loc,
                  remark,
                  id
                `)
                .eq('plt_num', palletNumber)
                .order('time', { ascending: false })
                .limit(500);
              
              if (historyError) {
                console.error(`Error fetching single pallet history for ${palletNumber}:`, historyError);
                return { records: [], palletNumber, totalRecords: 0 };
              }
              
              console.log(`[SinglePallet] Raw records for ${palletNumber}: ${historyData?.length || 0}`);
              
              // Apply deduplication on raw data
              const seenRecords = new Set<string>();
              const duplicateCount = (historyData?.length || 0);
              
              const deduplicatedData = (historyData || []).filter(record => {
                const uniqueKey = `${record.time}-${record.plt_num}-${record.action || 'null'}-${record.loc || 'null'}-${record.id || 'null'}-${record.remark || 'null'}`;
                
                if (seenRecords.has(uniqueKey)) {
                  console.warn(`[SinglePallet] Duplicate record removed for ${palletNumber}: ${uniqueKey}`);
                  return false;
                }
                seenRecords.add(uniqueKey);
                return true;
              });
              
              if (deduplicatedData.length !== duplicateCount) {
                console.warn(`[SinglePallet] Removed ${duplicateCount - deduplicatedData.length} duplicates for pallet ${palletNumber}`);
              }
              
              // Get operator names separately
              const operatorIds = [...new Set(deduplicatedData.map(h => h.id).filter(id => id !== null))];
              let operatorMap = new Map<number, string>();
              
              if (operatorIds.length > 0) {
                const { data: operators } = await supabase
                  .from('data_id')
                  .select('id, name')
                  .in('id', operatorIds);
                
                if (operators) {
                  operators.forEach(op => operatorMap.set(op.id, op.name));
                }
              }
              
              // Transform data with final deduplication
              const transformedRecords = new Map<string, StockHistoryRecord>();
              
              deduplicatedData.forEach(item => {
                const finalKey = `${item.time}-${item.plt_num}-${item.action || 'null'}-${item.loc || 'null'}`;
                
                if (transformedRecords.has(finalKey)) {
                  console.warn(`[SinglePallet] Final dedup for ${palletNumber}: ${finalKey}`);
                  return;
                }
                
                transformedRecords.set(finalKey, {
                  id: `${item.plt_num}_${item.time}_${item.id}`, // Generate unique ID
                  timestamp: item.time,
                  palletNumber: item.plt_num,
                  productCode: item.plt_num.split('/')[0] || 'UNKNOWN', // Extract product code from pallet number
                  action: item.action === 'Finished QC' ? 'FINISHED_QC' : 
                          item.action === 'GRN Receiving' ? 'GRN_RECEIVING' :
                          item.action?.replace(/[:\s-]+/g, '_').toUpperCase() || 'UNKNOWN',
                  location: item.loc,
                  remark: item.remark,
                  operatorId: item.id,
                  operatorName: operatorMap.get(item.id) || 'Unknown',
                  actionType: 'MOVEMENT' as const, // Add required actionType
                  actionCategory: 'INTERNAL' as const // Add required actionCategory
                });
              });
              
              const finalRecords = Array.from(transformedRecords.values());
              console.log(`[SinglePallet] Final count for ${palletNumber}: ${finalRecords.length}`);

              return {
                palletNumber,
                records: finalRecords,
                totalRecords: finalRecords.length,
              };
            } catch (error) {
              console.error(`Single pallet DataLoader error for ${palletNumber}:`, error);
              return { records: [], palletNumber, totalRecords: 0 };
            }
          })
        );
        
        return results;
      },
      {
        cacheKeyFn: (key) => key,
        maxBatchSize: 20,
      }
    );
  }

  // Enhanced transfer time flow with performance optimization
  static createTransferFlowLoader(supabase: SupabaseClient) {
    return new DataLoader<string, { transfers: TransferData[]; totalCount: number }>(
      async (dateRanges: readonly string[]) => {
        const results = await Promise.all(
          dateRanges.map(async (dateRange) => {
            try {
              const [startDate, endDate] = dateRange.split('|');
              
              const query = `
                SELECT 
                  rt.tran_date as timestamp,
                  rt.operator_id as operator,
                  COALESCE(di.name, rt.operator_id::text) as "operatorName",
                  'Stock Transfer' as action,
                  rt.plt_num as "palletNumber",
                  rt.f_loc as "fromLocation",
                  rt.t_loc as "toLocation",
                  rt.uuid as id,
                  EXTRACT(EPOCH FROM (
                    LEAD(rt.tran_date) OVER (
                      PARTITION BY rt.plt_num 
                      ORDER BY rt.tran_date
                    ) - rt.tran_date
                  )) / 60 as duration
                FROM record_transfer rt
                LEFT JOIN data_id di ON rt.operator_id = di.id
                WHERE rt.tran_date >= $1::timestamp 
                  AND rt.tran_date <= $2::timestamp
                ORDER BY rt.tran_date DESC
                LIMIT 1000
              `;
              
              const { data, error } = await supabase.rpc('execute_sql', {
                query,
                params: [startDate, endDate]
              });
              
              if (error) {
                console.error(`Error fetching transfer flow:`, error);
                return { transfers: [], totalCount: 0 };
              }
              
              interface DatabaseTransferRecord {
                timestamp: string;
                operator: string;
                operatorName: string;
                action: string;
                palletNumber: string;
                fromLocation: string;
                toLocation: string;
                id: string;
                duration: number | null;
              }

              return {
                transfers: data?.map((item: DatabaseTransferRecord) => ({
                  ...item,
                  action: StockHistoryDataLoader.normalizeStockAction(item.action),
                  formattedDate: new Date(item.timestamp).toLocaleDateString(),
                  formattedTime: new Date(item.timestamp).toLocaleTimeString(),
                  formattedDuration: item.duration 
                    ? `${Math.round(item.duration)}min` 
                    : null,
                  isBottleneck: item.duration ? item.duration > 120 : false, // 2+ hours considered bottleneck
                  efficiency: item.duration ? Math.max(0, 100 - (item.duration / 60)) : null,
                })) || [],
                totalCount: data?.length || 0,
              };
            } catch (error) {
              console.error(`Transfer flow DataLoader error:`, error);
              return { transfers: [], totalCount: 0 };
            }
          })
        );
        
        return results;
      },
      {
        cacheKeyFn: (key) => key,
        maxBatchSize: 5,
      }
    );
  }

  // Aggregation helpers
  static groupRecordsByDate(records: StockHistoryRecord[]) {
    const groups = new Map<string, {
      date: Date;
      count: number;
      actions: Map<string, number>;
    }>();
    
    records.forEach(record => {
      const date = new Date(record.timestamp).toISOString().split('T')[0];
      
      if (!groups.has(date)) {
        groups.set(date, {
          date: new Date(date),
          count: 0,
          actions: new Map<string, number>(),
        });
      }
      
      const group = groups.get(date)!;
      group.count++;
      
      const currentCount = group.actions.get(record.action) || 0;
      group.actions.set(record.action, currentCount + 1);
    });
    
    return Array.from(groups.values()).map(group => ({
      ...group,
      actions: Array.from(group.actions.entries()).map(([action, count]: [string, number]) => ({
        action,
        count,
        percentage: (count / group.count) * 100,
      })),
    }));
  }

  static aggregateByLocation(records: StockHistoryRecord[]) {
    const locationCounts = new Map<string, number>();
    const total = records.length;
    
    records.forEach(record => {
      const location = record.location || record.toLocation || 'Unknown';
      locationCounts.set(location, (locationCounts.get(location) || 0) + 1);
    });
    
    return Array.from(locationCounts.entries())
      .map(([location, count]) => ({
        location,
        count,
        percentage: (count / total) * 100,
      }))
      .sort((a, b) => b.count - a.count);
  }

  static aggregateByOperator(records: StockHistoryRecord[]) {
    const operatorCounts = new Map<string, { count: number; operatorId?: number }>();
    const total = records.length;
    
    records.forEach(record => {
      const operator = record.operatorName || 'Unknown';
      const current = operatorCounts.get(operator) || { count: 0 };
      operatorCounts.set(operator, {
        count: current.count + 1,
        operatorId: typeof record.operatorId === 'number' ? record.operatorId : 
                   (typeof record.operatorId === 'string' ? parseInt(record.operatorId, 10) : current.operatorId),
      });
    });
    
    return Array.from(operatorCounts.entries())
      .map(([operatorName, data]) => ({
        operatorName,
        operatorId: data.operatorId || '',
        count: data.count,
        percentage: (data.count / total) * 100,
        efficiency: null, // Would be computed with additional performance data
      }))
      .sort((a, b) => b.count - a.count);
  }

  // Main query methods with cursor-based pagination
  static async getPalletHistoryByProduct(
    productCode: string,
    options: { 
      filter: FilterOptions & { actions?: string[]; locations?: string[]; palletNumbers?: string[]; hasRemark?: boolean };
      pagination: PaginationOptions & { first: number; after?: string; offset?: number; useCursor?: boolean };
      sort: SortOptions;
    },
    context: GraphQLContext
  ) {
    const { filter, pagination, sort } = options;
    
    console.log(`[getPalletHistoryByProduct] Starting query for product: ${productCode}`);
    
    // First, get pallets for this product (case-insensitive search)
    const palletQuery = await context.supabase
      .from('record_palletinfo')
      .select('plt_num')
      .ilike('product_code', productCode);
    
    if (palletQuery.error) {
      throw new Error(`Failed to fetch pallets for product: ${palletQuery.error.message}`);
    }
    
    const palletNumbers = (palletQuery.data || []).map((p: PalletInfo) => p.plt_num);
    console.log(`[getPalletHistoryByProduct] Found ${palletNumbers.length} pallets for ${productCode}`);
    
    if (palletNumbers.length === 0) {
      console.log(`[getPalletHistoryByProduct] No pallets found for ${productCode}`);
      return {
        productCode,
        productInfo: {
          code: productCode,
          description: '',
          type: '',
          colour: '',
          activePallets: 0,
          totalPallets: 0,
        },
        records: [],
        totalRecords: 0,
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
          totalCount: 0,
          totalPages: 0,
          currentPage: 1,
        },
        aggregations: {
          totalActions: 0,
          uniquePallets: 0,
          uniqueOperators: 0,
          timeRange: null,
          mostActiveLocation: 'None',
          mostActiveOperator: 'None',
        },
      };
    }
    
    // Build optimized query WITHOUT join to avoid cartesian product
    let query = context.supabase
      .from('record_history')
      .select(`
        time,
        plt_num,
        action,
        loc,
        remark,
        id
      `);
    
    // Map GraphQL field names to database column names
    const fieldMapping: Record<string, string> = {
      'TIMESTAMP': 'time',
      'timestamp': 'time',
      'PALLET_NUMBER': 'plt_num',
      'pallet_number': 'plt_num',
      'ACTION': 'action',
      'action': 'action',
      'LOCATION': 'loc',
      'location': 'loc',
      'OPERATOR': 'id',
      'operator': 'id',
    };
    
    const sortField = fieldMapping[sort.field] || fieldMapping[sort.field.toLowerCase()] || sort.field.toLowerCase();
    
    query = query.in('plt_num', palletNumbers)
      .order(sortField, { ascending: sort.direction === 'ASC' });
    
    // Apply filters
    if (filter.actions && filter.actions.length > 0) {
      query = query.in('action', filter.actions);
    }
    
    if (filter.locations && filter.locations.length > 0) {
      query = query.in('loc', filter.locations);
    }
    
    if (filter.dateRange) {
      if (filter.dateRange.start) {
        query = query.gte('time', filter.dateRange.start);
      }
      if (filter.dateRange.end) {
        query = query.lte('time', filter.dateRange.end);
      }
    }
    
    if (filter.palletNumbers && filter.palletNumbers.length > 0) {
      query = query.in('plt_num', filter.palletNumbers);
    }
    
    if (filter.hasRemark !== undefined) {
      query = filter.hasRemark 
        ? query.not('remark', 'is', null)
        : query.is('remark', null);
    }
    
    // Apply pagination
    if (pagination.useCursor && pagination.after) {
      query = query.gt('id', pagination.after);
    } else if (pagination.offset) {
      query = query.range(pagination.offset, pagination.offset + pagination.first - 1);
    }
    
    query = query.limit(pagination.first);
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to fetch pallet history: ${error.message}`);
    }
    
    console.log(`[getPalletHistoryByProduct] Raw query returned ${data?.length || 0} records`);
    
    // Get unique operator IDs and fetch operator names separately
    const operatorIds = [...new Set(data?.map((item: DatabaseRecord) => item.id).filter(id => id !== null))];
    let operatorMap = new Map<number, string>();
    
    if (operatorIds.length > 0) {
      const { data: operators } = await context.supabase
        .from('data_id')
        .select('id, name')
        .in('id', operatorIds);
      
      if (operators) {
        operators.forEach((op: DatabaseOperator) => operatorMap.set(op.id, op.name));
      }
    }
    
    // Enhanced deduplication with comprehensive logging
    const seenRecords = new Set<string>();
    const duplicateTracker = new Map<string, number>();
    
    const records = (data || [])
      .map((item: DatabaseRecord) => {
        // Create comprehensive unique key including timestamp hash for exact matches
        const timeHash = new Date(item.time).getTime();
        const uniqueKey = `${timeHash}-${item.plt_num}-${item.action || 'null'}-${item.loc || 'null'}-${item.id || 'null'}`;
        
        if (seenRecords.has(uniqueKey)) {
          const count = duplicateTracker.get(uniqueKey) || 0;
          duplicateTracker.set(uniqueKey, count + 1);
          console.warn(`[DEDUP] Duplicate record #${count + 1} detected and skipped: ${uniqueKey}`);
          return null;
        }
        seenRecords.add(uniqueKey);
        
        return {
          id: `${item.plt_num}-${timeHash}-${item.id || 'unknown'}`, // More precise composite ID
          timestamp: item.time,
          palletNumber: item.plt_num,
          productCode,
          action: StockHistoryDataLoader.normalizeStockAction(item.action),
          location: item.loc,
          operatorName: operatorMap.get(item.id) || 'Unknown',
          operatorId: item.id,
          remark: item.remark,
        };
      })
      .filter(record => record !== null);
    
    // Log duplicate statistics
    if (duplicateTracker.size > 0) {
      console.warn(`[DEDUP] Found duplicates for product ${productCode}:`);
      duplicateTracker.forEach((count, key) => {
        console.warn(`  - ${key}: ${count} duplicates`);
      });
    }
    
    console.log(`[DEDUP] Final record count for ${productCode}: ${records.length} (removed ${(data?.length || 0) - records.length} duplicates)`);
    
    // Prepare result with pagination info
    const hasNextPage = records.length === pagination.first;
    const endCursor = records.length > 0 ? records[records.length - 1].id : null;
    
    // Get product info - use direct query to data_code table (case-insensitive search)
    const productQuery = await context.supabase
      .from('data_code')
      .select('code, description, type, colour, standard_qty')
      .ilike('code', productCode)
      .single();
    
    const productInfo = {
      code: productCode,
      description: productQuery.data?.description || '',
      chineseDescription: null, // Field not available in database
      type: productQuery.data?.type || '',
      colour: productQuery.data?.colour || '',
      standardQty: productQuery.data?.standard_qty || 0,
      activePallets: records.length > 0 ? new Set(records.filter(r => r.action !== 'VOIDED').map(r => r.palletNumber)).size : 0,
      totalPallets: records.length > 0 ? new Set(records.map(r => r.palletNumber)).size : 0,
    };

    return {
      productCode,
      productInfo,
      records,
      totalRecords: records.length,
      pageInfo: {
        hasNextPage,
        hasPreviousPage: !!pagination.after,
        startCursor: records.length > 0 ? records[0].id : null,
        endCursor,
        totalCount: records.length, // Would need COUNT query for exact total
        totalPages: Math.ceil(records.length / pagination.first),
        currentPage: pagination.offset ? Math.floor(pagination.offset / pagination.first) + 1 : 1,
      },
      aggregations: {
        totalActions: records.length,
        uniquePallets: new Set(records.map(r => r.palletNumber)).size,
        uniqueOperators: new Set(records.map(r => r.operatorName)).size,
        timeRange: records.length > 0 ? {
          start: records[records.length - 1].timestamp,
          end: records[0].timestamp,
        } : null,
        mostActiveLocation: StockHistoryDataLoader.getMostActiveLocation(records),
        mostActiveOperator: StockHistoryDataLoader.getMostActiveOperator(records),
      },
    };
  }

  static async getPalletHistoryByNumber(
    palletNumber: string,
    _options: { includeJourney: boolean },
    context: GraphQLContext
  ) {
    // Validate input and normalize
    if (!palletNumber || palletNumber.trim() === '') {
      throw new Error('Pallet number is required for history lookup');
    }
    
    // Normalize the pallet number to ensure consistency
    const normalizedPalletNumber = palletNumber.trim();
    console.log(`[getPalletHistoryByNumber] Processing pallet number: "${normalizedPalletNumber}"`);

    // Similar implementation but focused on single pallet
    const query = context.supabase
      .from('record_history')
      .select(`
        time,
        plt_num,
        action,
        loc,
        remark,
        id,
        data_id(name)
      `)
      .eq('plt_num', normalizedPalletNumber)
      .order('time', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to fetch pallet history: ${error.message}`);
    }
    
    // Get pallet info and product code
    let productCode = '';
    let quantity = 0;
    let palletInfoData = null;
    
    try {
      const { data: palletInfo, error: palletError } = await context.supabase
        .from('record_palletinfo')
        .select('product_code, product_qty, plt_num')
        .eq('plt_num', normalizedPalletNumber)
        .single();
      
      if (!palletError && palletInfo) {
        productCode = palletInfo.product_code || '';
        quantity = palletInfo.product_qty || 0;
        palletInfoData = palletInfo;
        console.log(`[getPalletHistoryByNumber] Found pallet info:`, { productCode, quantity, palletInfo });
      } else {
        console.warn(`[getPalletHistoryByNumber] No pallet info found for ${normalizedPalletNumber}:`, palletError);
      }
    } catch (productLookupError) {
      console.warn(`Could not fetch pallet info for ${palletNumber}:`, productLookupError);
    }
    
    // Get product info if we have a product code
    let productInfo: { 
      code: string;
      description: string;
      chineseDescription: null;
      type: string;
      colour: string;
      standardQty: number;
    } | null = null;
    if (productCode) {
      try {
        const { data: product } = await context.supabase
          .from('data_code')
          .select('code, description, type, colour, standard_qty')
          .ilike('code', productCode)
          .single();
        
        if (product) {
          productInfo = {
            code: product.code,
            description: product.description || '',
            chineseDescription: null, // Field not available in database
            type: product.type || '',
            colour: product.colour || '',
            standardQty: product.standard_qty || 0,
          };
        }
      } catch (error) {
        console.warn(`Could not fetch product info for ${productCode}:`, error);
      }
    }
    
    // Apply deduplication for getPalletHistoryByNumber method as well
    const seenRecords = new Set<string>();
    const records = (data || [])
      .map((item: DatabaseRecord) => {
        // Create unique key for deduplication
        const timeHash = new Date(item.time).getTime();
        const uniqueKey = `${timeHash}-${item.plt_num}-${item.action || 'null'}-${item.loc || 'null'}-${item.id || 'null'}`;
        
        if (seenRecords.has(uniqueKey)) {
          console.warn(`[getPalletHistoryByNumber] Duplicate removed: ${uniqueKey}`);
          return null;
        }
        seenRecords.add(uniqueKey);
        
        return {
          id: `${item.plt_num}-${timeHash}-${item.id || 'unknown'}`,
          timestamp: item.time,
          palletNumber: item.plt_num,
          productCode: productCode || item.plt_num.split('/')[0] || 'N/A',
          action: StockHistoryDataLoader.normalizeStockAction(item.action),
          location: item.loc,
          operatorName: 'Unknown', // data_id not available in DatabaseRecord
          operatorId: item.id,
          remark: item.remark,
        };
      })
      .filter(record => record !== null);
    
    console.log(`[getPalletHistoryByNumber] Deduplicated records for ${palletNumber}: ${records.length}/${data?.length || 0}`);
    
    // Build palletInfo object - ensure palletNumber is never null
    const palletInfo = {
      palletNumber: normalizedPalletNumber || 'N/A',  // Use normalized pallet number
      productCode: productCode || normalizedPalletNumber.split('/')[0] || 'N/A',
      product: productInfo || {
        code: productCode || normalizedPalletNumber.split('/')[0] || 'N/A',
        description: 'Product information not available',
        type: 'N/A',
        colour: 'N/A',
      },
      quantity: quantity || 0,
    };
    
    console.log(`[getPalletHistoryByNumber] Built palletInfo:`, palletInfo);
    
    return {
      palletNumber: normalizedPalletNumber,
      palletInfo,  // Add the required palletInfo field
      records,
      totalRecords: records.length,
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: records.length > 0 ? records[0].id : null,
        endCursor: records.length > 0 ? records[records.length - 1].id : null,
        totalCount: records.length,
        totalPages: 1,
        currentPage: 1,
      },
      timeline: StockHistoryDataLoader.computePalletTimeline(records),
    };
  }

  static async getTransferTimeFlow(
    filter: FilterOptions,
    options: { 
      pagination: PaginationOptions & { first: number };
      includeMetrics: boolean;
      includeBottlenecks: boolean;
    },
    context: GraphQLContext
  ) {
    const cacheKey = `${filter.dateRange?.start || ''}|${filter.dateRange?.end || ''}`;
    
    // Create a new transfer flow loader for this request
    const transferFlowLoader = StockHistoryDataLoader.createTransferFlowLoader(context.supabase);
    const result = await transferFlowLoader.load(cacheKey);
    
    return {
      ...result,
      summary: {
        totalTransfers: result.transfers.length,
        uniquePallets: new Set(result.transfers.map((t: TransferData) => t.palletNumber)).size,
        uniqueOperators: new Set(result.transfers.map((t: TransferData) => t.operator)).size,
        averageTransferTime: result.transfers
          .filter((t: TransferData) => t.duration)
          .reduce((sum: number, t: TransferData) => sum + (t.duration || 0), 0) / 
          result.transfers.filter((t: TransferData) => t.duration).length || 0,
        timeSpan: {
          start: filter.dateRange?.start || null,
          end: filter.dateRange?.end || null,
        },
        topFromLocation: StockHistoryDataLoader.getTopLocation(result.transfers, 'fromLocation'),
        topToLocation: StockHistoryDataLoader.getTopLocation(result.transfers, 'toLocation'),
      },
      pageInfo: {
        hasNextPage: result.transfers.length >= options.pagination.first,
        hasPreviousPage: false,
        totalCount: result.totalCount,
        totalPages: Math.ceil(result.totalCount / options.pagination.first),
        currentPage: 1,
      },
    };
  }

  // Helper methods for aggregations
  
  static generateTrendsData(records: Record<string, unknown>[]) {
    // Group records by date and count
    const dateGroups = new Map<string, number>();
    
    records.forEach((record: Record<string, unknown>) => {
      const date = new Date(String(record.time || ''));
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      dateGroups.set(dateKey, (dateGroups.get(dateKey) || 0) + 1);
    });
    
    // Convert to array and sort by date
    return Array.from(dateGroups.entries())
      .map(([date, count]) => ({
        timestamp: new Date(date).toISOString(),
        value: count,
        label: 'Stock Activity'
      }))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-30); // Keep last 30 days
  }

  static getMostActiveLocation(records: StockHistoryRecord[]): string {
    const locationCounts = StockHistoryDataLoader.aggregateByLocation(records);
    return locationCounts.length > 0 ? locationCounts[0].location : 'None';
  }

  static getMostActiveOperator(records: StockHistoryRecord[]): string {
    const operatorCounts = StockHistoryDataLoader.aggregateByOperator(records);
    return operatorCounts.length > 0 ? operatorCounts[0].operatorName : 'None';
  }

  static getTopLocation(transfers: TransferData[], field: keyof TransferData): string {
    const locationCounts = new Map<string, number>();
    
    transfers.forEach(transfer => {
      const location = transfer[field] as string;
      if (location && typeof location === 'string') {
        locationCounts.set(location, (locationCounts.get(location) || 0) + 1);
      }
    });
    
    let maxCount = 0;
    let topLocation = 'None';
    
    locationCounts.forEach((count, location) => {
      if (count > maxCount) {
        maxCount = count;
        topLocation = location;
      }
    });
    
    return topLocation;
  }

  static computePalletTimeline(records: StockHistoryRecord[]) {
    if (records.length === 0) {
      return {
        created: null,
        firstMovement: null,
        lastMovement: null,
        totalMovements: 0,
        totalDaysActive: 0,
        averageLocationStay: 0,
      };
    }
    
    const sortedRecords = [...records].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    const created = new Date(sortedRecords[0].timestamp);
    const lastMovement = new Date(sortedRecords[sortedRecords.length - 1].timestamp);
    const movementRecords = sortedRecords.filter(r => 
      ['TRANSFERRED', 'MOVED'].includes(r.action)
    );
    
    return {
      created,
      firstMovement: movementRecords.length > 0 ? new Date(movementRecords[0].timestamp) : null,
      lastMovement,
      totalMovements: movementRecords.length,
      totalDaysActive: Math.ceil((lastMovement.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)),
      averageLocationStay: movementRecords.length > 1 ? 
        (lastMovement.getTime() - created.getTime()) / (1000 * 60 * 60 * 24) / movementRecords.length : 0,
    };
  }

  static async computePalletCurrentStatus(
    _palletNumber: string, 
    records: StockHistoryRecord[], 
    _context: GraphQLContext
  ) {
    if (records.length === 0) {
      return {
        location: null,
        lastAction: 'UNKNOWN',
        lastActionAt: null,
        lastOperator: null,
        isActive: false,
        daysInCurrentLocation: 0,
      };
    }
    
    const latestRecord = records[0]; // Assuming sorted by timestamp DESC
    const lastActionAt = new Date(latestRecord.timestamp);
    const now = new Date();
    
    return {
      location: latestRecord.location,
      lastAction: latestRecord.action,
      lastActionAt,
      lastOperator: latestRecord.operatorName,
      isActive: latestRecord.action !== 'VOIDED',
      daysInCurrentLocation: Math.ceil((now.getTime() - lastActionAt.getTime()) / (1000 * 60 * 60 * 24)),
    };
  }

  static computeLocationJourney(records: StockHistoryRecord[]) {
    const sortedRecords = [...records].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    interface LocationJourneyEntry {
      sequence: number;
      location: string;
      entryTime: Date;
      exitTime: Date | null;
      duration: number | null;
      actions: string[];
      operator: string;
    }
    
    const journey: LocationJourneyEntry[] = [];
    let currentLocation: string | null = null;
    let entryTime: Date | null = null;
    let sequence = 0;
    
    sortedRecords.forEach((record, index) => {
      const location = record.location || record.toLocation;
      
      if (location && location !== currentLocation) {
        // Close previous location if exists
        if (currentLocation && entryTime) {
          journey.push({
            sequence: sequence++,
            location: currentLocation,
            entryTime,
            exitTime: new Date(record.timestamp),
            duration: Math.round((new Date(record.timestamp).getTime() - entryTime.getTime()) / (1000 * 60)),
            actions: sortedRecords
              .slice(0, index)
              .filter(r => r.location === currentLocation || r.toLocation === currentLocation)
              .map(r => r.action),
            operator: record.operatorName,
          });
        }
        
        // Start new location
        currentLocation = location;
        entryTime = new Date(record.timestamp);
      }
    });
    
    // Add final location if exists
    if (currentLocation && entryTime) {
      journey.push({
        sequence: sequence++,
        location: currentLocation,
        entryTime,
        exitTime: null,
        duration: null,
        actions: sortedRecords
          .filter(r => r.location === currentLocation || r.toLocation === currentLocation)
          .map(r => r.action),
        operator: sortedRecords[sortedRecords.length - 1].operatorName,
      });
    }
    
    return journey;
  }

  // Search functionality
  static async searchStockHistory(
    query: string,
    type: string,
    limit: number,
    context: GraphQLContext
  ) {
    const searchResults: SearchResult[] = [];
    
    switch (type) {
      case 'PRODUCT_CODE':
        const productResults = await context.supabase
          .from('data_code')
          .select('code, description')
          .or(`code.ilike.%${query}%,description.ilike.%${query}%`)
          .limit(limit);
        
        if (productResults.data) {
          interface DatabaseProductResult {
            code: string;
            description?: string;
          }
          
          searchResults.push(...productResults.data.map((item: DatabaseProductResult) => ({
            id: item.code,
            type: 'PRODUCT_CODE' as const,
            title: item.code,
            subtitle: item.description,
            relevance: 1.0,
          })));
        }
        break;
        
      case 'PALLET_NUMBER':
        const palletResults = await context.supabase
          .from('record_palletinfo')
          .select(`
            plt_num,
            series,
            data_code(code, description)
          `)
          .or(`plt_num.ilike.%${query}%,series.ilike.%${query}%`)
          .limit(limit);
        
        if (palletResults.data) {
          interface DatabasePalletResult {
            plt_num: string;
            series?: string;
            data_code: Array<{
              code?: string;
              description?: string;
            }>;
          }
          
          searchResults.push(...palletResults.data.map((item: DatabasePalletResult) => ({
            id: item.plt_num,
            type: 'PALLET_NUMBER' as const,
            title: item.plt_num,
            subtitle: item.series,
            relevance: 1.0,
          })));
        }
        break;
        
      // Add other search types as needed
      default:
        break;
    }
    
    return searchResults;
  }

  // Statistics computation
  static async getStockHistoryStats(
    _filter: FilterOptions,
    timeframe: string,
    context: GraphQLContext
  ) {
    // Implement statistics computation based on timeframe
    const now = new Date();
    let startDate: Date;
    
    switch (timeframe) {
      case 'LAST_24_HOURS':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'LAST_7_DAYS':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'LAST_30_DAYS':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
    
    // Basic statistics query
    const statsQuery = await context.supabase
      .from('record_history')
      .select('action, plt_num, loc, time')
      .gte('time', startDate.toISOString())
      .order('time', { ascending: false })
      .limit(10000);
    
    const records = statsQuery.data || [];
    
    // Type for the limited query result
    type StatsRecord = {
      action: string;
      plt_num: string;
      loc: string;
      time: string;
    };
    
    return {
      totalRecords: records.length,
      uniquePallets: new Set(records.map((r: StatsRecord) => r.plt_num)).size,
      uniqueProducts: 0, // Would require additional query
      activeLocations: new Set(records.map((r: StatsRecord) => r.loc).filter(Boolean)).size,
      recentActivity: records.filter((r: StatsRecord) => 
        new Date(r.time).getTime() > (now.getTime() - 24 * 60 * 60 * 1000)
      ).length,
      trendsData: StockHistoryDataLoader.generateTrendsData(records as Record<string, unknown>[])
    };
  }

  // Batch operations for mutations
  static async batchUpdateStockHistory(
    recordIds: string[],
    updates: Partial<StockHistoryRecord>,
    context: GraphQLContext
  ) {
    const results = [];
    const errors = [];
    
    for (const recordId of recordIds) {
      try {
        const { data, error } = await context.supabase
          .from('record_history')
          .update(updates)
          .eq('id', recordId)
          .select()
          .single();
        
        if (error) throw error;
        results.push(data);
      } catch (error) {
        errors.push({
          recordId,
          error: error instanceof Error ? error.message : 'Unknown error',
          code: 'UPDATE_FAILED',
        });
      }
    }
    
    return {
      successful: results.length,
      failed: errors.length,
      errors,
      updatedRecords: results,
    };
  }

  static async addManualStockEntry(
    input: {
      palletNumber: string;
      action: string;
      location: string;
      remark?: string;
      timestamp?: string;
    },
    context: GraphQLContext
  ) {
    const { data, error } = await context.supabase
      .from('record_history')
      .insert({
        plt_num: input.palletNumber,
        action: input.action,
        loc: input.location,
        remark: input.remark,
        id: context.user?.id,
        time: input.timestamp || new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to add manual entry: ${error.message}`);
    }
    
    // Real-time updates would be handled by the subscription system
    // For now, we just return the data
    
    return data;
  }

  // Action normalization for consistent enum values
  static normalizeStockAction(action: string | null | undefined): string {
    if (!action) return 'UNKNOWN';
    
    // Handle specific known mappings
    const actionMappings: Record<string, string> = {
      'Finished QC': 'FINISHED_QC',
      'GRN Receiving': 'GRN_RECEIVING',
      'GRN Error': 'GRN_LABEL_ERROR',
    };
    
    // Check for direct mappings first
    if (actionMappings[action]) {
      return actionMappings[action];
    }
    
    // Transform generic actions (replace special characters and uppercase)
    const normalized = action.replace(/[:\s-]+/g, '_').toUpperCase();
    
    // Validate against known enum values to prevent schema violations
    const validActions = [
      'CREATED', 'TRANSFERRED', 'MOVED', 'ALLOCATED', 'VOIDED',
      'ADJUSTED', 'LOADED', 'UNLOADED', 'QUALITY_CHECK', 'FINISHED_QC',
      'GRN_RECEIVING', 'GRN_LABEL_ERROR', 'DAMAGED', 'REPAIRED', 'EXPIRED'
    ];
    
    return validActions.includes(normalized) ? normalized : 'UNKNOWN';
  }

  // Additional methods for metrics computation
  static computeFlowMetrics(transfers: TransferData[]) {
    const durations = transfers.filter(t => t.duration).map(t => t.duration);
    
    return {
      averageTransferDuration: durations.length > 0 ? 
        durations.reduce((sum: number, d) => sum + (d || 0), 0) / durations.length : 0,
      p95TransferDuration: durations.length > 0 ? 
        durations.sort((a, b) => (a || 0) - (b || 0))[Math.floor(durations.length * 0.95)] : 0,
      totalThroughput: transfers.length,
      peakHour: StockHistoryDataLoader.findPeakHour(transfers),
      slowestRoute: null, // Would compute route metrics
      fastestRoute: null,
    };
  }

  static identifyBottlenecks(transfers: TransferData[]) {
    const locationWaitTimes = new Map<string, number[]>();
    
    transfers.forEach(transfer => {
      if (transfer.duration && transfer.toLocation) {
        if (!locationWaitTimes.has(transfer.toLocation)) {
          locationWaitTimes.set(transfer.toLocation, []);
        }
        locationWaitTimes.get(transfer.toLocation)!.push(transfer.duration);
      }
    });
    
    return Array.from(locationWaitTimes.entries()).map(([location, times]) => {
      const avgWaitTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      let severity: string;
      
      if (avgWaitTime > 240) severity = 'CRITICAL';
      else if (avgWaitTime > 120) severity = 'HIGH';
      else if (avgWaitTime > 60) severity = 'MEDIUM';
      else severity = 'LOW';
      
      return {
        location,
        avgWaitTime,
        backlogCount: times.filter(t => t > 120).length,
        severity,
      };
    });
  }

  static analyzeOperatorPerformance(transfers: TransferData[]) {
    const operatorMetrics = new Map<string, { transfers: TransferData[], totalDuration: number }>();
    
    transfers.forEach(transfer => {
      if (!operatorMetrics.has(transfer.operator)) {
        operatorMetrics.set(transfer.operator, { transfers: [], totalDuration: 0 });
      }
      
      const metrics = operatorMetrics.get(transfer.operator)!;
      metrics.transfers.push(transfer);
      if (transfer.duration) {
        metrics.totalDuration += transfer.duration;
      }
    });
    
    return Array.from(operatorMetrics.entries())
      .map(([operatorName, metrics]) => ({
        operatorName,
        transfersPerHour: 0, // Would calculate based on time span
        averageDuration: metrics.totalDuration / metrics.transfers.filter(t => t.duration).length || 0,
        efficiency: 100, // Would calculate efficiency score
        rank: 1, // Would rank operators
      }))
      .sort((a, b) => b.efficiency - a.efficiency);
  }

  private static findPeakHour(transfers: TransferData[]): string {
    const hourCounts = new Map<number, number>();
    
    transfers.forEach(transfer => {
      const hour = new Date(transfer.timestamp).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });
    
    let maxCount = 0;
    let peakHour = 0;
    
    hourCounts.forEach((count, hour) => {
      if (count > maxCount) {
        maxCount = count;
        peakHour = hour;
      }
    });
    
    return `${peakHour}:00`;
  }
}