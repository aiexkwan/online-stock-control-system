/**
 * Complex DataLoaders for handling relationships and JOINs
 * Optimized for the identified complex queries
 *
 * NOTE: Enhanced type safety implementation
 * - All DataLoaders use proper typed interfaces from ../../types/dataloaders.ts
 * - DatabaseEntity with type assertions ensures data safety while maintaining flexibility
 * - Runtime type checks prevent null reference errors
 */

import DataLoader from 'dataloader';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  DatabaseEntity,
  TransferEntity,
  InventoryEntity,
  asTransferEntity,
  asInventoryEntity,
  asProductEntity,
  asWorkLevelEntity,
  asUserEntity,
  asGRNEntity,
  asHistoryEntity,
  asOrderEntity,
  safeGet,
  safeString,
  safeNumber,
} from '../../types/dataloaders';
import { createBatchLoader } from './base.dataloader';

// 對於 complex.dataloader.ts 的具體類型定義
interface InventoryWithRelations extends InventoryEntity {
  product?: {
    code?: string;
    description?: string;
    type?: string;
    category?: string;
  } | null;
  data_code?: {
    type?: string;
    code?: string;
    description?: string;
  } | null;
  // 動態 location 屬性存取
  injection?: number;
  pipeline?: number;
  prebook?: number;
  await?: number;
  fold?: number;
  bulk?: number;
  backcarpark?: number;
  damage?: number;
  await_grn?: number;
}

// 庫存分佈結果類型
interface _StockDistributionGroupItem {
  name: string;
  stock: string;
  stockLevel: number;
  description: string;
  type: string;
  percentage: number;
}

const _INVENTORY_LOCATIONS = [
  'injection',
  'pipeline',
  'prebook',
  'await',
  'fold',
  'bulk',
  'backcarpark',
  'damage',
  'await_grn',
] as const;

type InventoryLocation = (typeof _INVENTORY_LOCATIONS)[number];

// 安全的 location 數量取得函数
function getLocationQuantity(item: InventoryWithRelations, location: InventoryLocation): number {
  return Number(item[location]) || 0;
}

// Flexible result types that match actual implementation
type DataLoaderResult = Record<string, unknown> | null;
type UnifiedOperationsResult = DataLoaderResult;
type StockLevelResult = DataLoaderResult;
type WorkLevelResult = DataLoaderResult;
type GRNAnalyticsResult = DataLoaderResult;
type PerformanceMetricsResult = DataLoaderResult;
type InventoryOrderedAnalysisResult = DataLoaderResult;
type HistoryTreeResult = DataLoaderResult;
type TopProductsResult = DataLoaderResult;
type StockDistributionResult = DataLoaderResult;

// Type helper functions for safe property access
type SafeAccess<T = unknown> = T | null | undefined;

function _safeAccess<T>(obj: SafeAccess, key: string): T | null {
  return obj && typeof obj === 'object' && key in obj ? (obj as Record<string, T>)[key] : null;
}

function _asRecord(obj: SafeAccess): Record<string, unknown> {
  return obj && typeof obj === 'object' ? (obj as Record<string, unknown>) : {};
}

function _getProperty<T = unknown>(obj: SafeAccess, key: string, defaultValue: T): T {
  if (obj && typeof obj === 'object' && key in obj) {
    const value = (obj as Record<string, unknown>)[key];
    return value !== null && value !== undefined ? (value as T) : defaultValue;
  }
  return defaultValue;
}

function _asString(value: SafeAccess, defaultValue = ''): string {
  return typeof value === 'string' ? value : defaultValue;
}

function _asNumber(value: SafeAccess, defaultValue = 0): number {
  return typeof value === 'number' ? value : defaultValue;
}

// Safe analysis object access
function safeAnalysisAccess(obj: unknown, property: string): unknown {
  const analysis = safeGet(obj, 'analysis', {});
  return safeGet(analysis, property, null);
}

interface UnifiedOperationsKey {
  warehouse?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

interface StockLevelKey {
  warehouse?: string;
  productCode?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

interface WorkLevelKey {
  userId: string;
  date: string;
}

interface GRNAnalyticsKey {
  grnRef?: string;
  supplierCode?: string;
  materialCode?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  includeQC?: boolean;
}

interface PerformanceMetricsKey {
  metricType?: 'user' | 'system' | 'operation' | 'overall';
  userId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  includeHistorical?: boolean;
  granularity?: 'hourly' | 'daily' | 'weekly' | 'monthly';
}

interface InventoryOrderedAnalysisKey {
  productType?: string;
  productCodes?: string[];
  includeLocationBreakdown?: boolean;
  filterStatus?: 'Sufficient' | 'Insufficient' | 'Out of Stock' | 'No Orders';
  sortBy?: 'status' | 'fulfillment_rate' | 'inventory_gap' | 'product_code';
  sortOrder?: 'asc' | 'desc';
}

interface HistoryTreeKey {
  entityType: 'product' | 'pallet' | 'order';
  entityId: string;
  depth?: number;
  dateRange?: {
    start: string;
    end: string;
  };
  actionTypes?: string[];
  userIds?: string[];
  palletNumbers?: string[];
  locations?: string[];
  groupBy?: 'time' | 'user' | 'action' | 'location';
  sortBy?: 'time' | 'action' | 'user' | 'location';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

interface TopProductsKey {
  metric: 'sales' | 'quantity' | 'revenue';
  timeRange: 'week' | 'month' | 'quarter' | 'year';
  productType?: string;
  productCodes?: string[];
  limit?: number;
  sortOrder?: 'asc' | 'desc';
  includeInactive?: boolean;
  locationFilter?: string[];
}

/**
 * DataLoader for unified operations data
 * Combines data from record_palletinfo, record_inventory, and record_transfer
 */
export function createUnifiedOperationsLoader(
  supabase: SupabaseClient
): DataLoader<UnifiedOperationsKey, UnifiedOperationsResult | null> {
  return createBatchLoader<UnifiedOperationsKey, UnifiedOperationsResult | null>(async keys => {
    // Since this is a complex query, we'll process each key individually
    // In a real implementation, we'd optimize this further
    const results = await Promise.all(
      keys.map(async key => {
        try {
          // Build base queries
          let palletsQuery = supabase
            .from('record_palletinfo')
            .select(
              `
                *,
                product:data_code(*)
              `
            )
            .eq('status', 'active');

          let inventoryQuery = supabase.from('record_inventory').select(`
                *,
                product:data_code(*)
              `);

          let transfersQuery = supabase.from('record_transfer').select(`
                *,
                pallet:record_palletinfo(*),
                from_location:locations!from_location_id(*),
                to_location:locations!to_location_id(*),
                requested_by:data_id!requested_by_id(*),
                executed_by:data_id!executed_by_id(*)
              `);

          // Apply filters
          if (key.warehouse) {
            palletsQuery = palletsQuery.eq('warehouse', key.warehouse);
            inventoryQuery = inventoryQuery.eq('warehouse', key.warehouse);
            transfersQuery = transfersQuery.eq('warehouse', key.warehouse);
          }

          if (key.dateRange) {
            const { start, end } = key.dateRange;
            palletsQuery = palletsQuery.gte('created_at', start).lte('created_at', end);
            inventoryQuery = inventoryQuery.gte('latest_update', start).lte('latest_update', end);
            transfersQuery = transfersQuery.gte('requested_at', start).lte('requested_at', end);
          }

          // Execute queries in parallel
          const [pallets, _inventory, transfers] = await Promise.all([
            palletsQuery.limit(100),
            inventoryQuery.limit(100),
            transfersQuery.limit(100),
          ]);

          // Get work levels for active users
          const activeUserIds = new Set<string>();
          transfers.data?.forEach((t: DatabaseEntity) => {
            const transfer = asTransferEntity(t);
            if (transfer?.requested_by?.id) activeUserIds.add(transfer.requested_by.id);
            if (transfer?.executed_by?.id) activeUserIds.add(transfer.executed_by.id);
          });

          const workLevelsQuery = supabase
            .from('work_level')
            .select('*')
            .in('user_id', Array.from(activeUserIds));

          if (key.dateRange) {
            workLevelsQuery.gte('date', key.dateRange.start).lte('date', key.dateRange.end);
          }

          const workLevels = await workLevelsQuery;

          // Calculate summary statistics
          const summary = {
            totalTransfers: transfers.data?.length || 0,
            totalOrders: 0, // Would need to query orders
            totalPallets: pallets.data?.length || 0,
            activeUsers: activeUserIds.size,
            averageEfficiency: calculateAverageEfficiency(
              workLevels.data || ([] as DatabaseEntity[])
            ),
          };

          return {
            transfers: transfers.data || [],
            orders: [], // Would need to include order data
            pallets: pallets.data || [],
            workLevels: workLevels.data || [],
            summary,
            lastUpdated: new Date().toISOString(),
            refreshInterval: 60000, // 1 minute
            dataSource: 'unified_operations',
          };
        } catch (error) {
          console.error('[UnifiedOperationsLoader] Error:', error);
          return null;
        }
      })
    );

    return results;
  });
}

/**
 * DataLoader for stock levels with complex JOINs
 */
export function createStockLevelsLoader(
  supabase: SupabaseClient
): DataLoader<StockLevelKey, StockLevelResult | null> {
  return createBatchLoader<StockLevelKey, StockLevelResult | null>(async keys => {
    const results = await Promise.all(
      keys.map(async key => {
        try {
          // Complex query joining inventory, products, and stock levels
          let query = supabase.from('record_inventory').select(`
                product_code,
                total_quantity:quantity_total,
                injection,
                pipeline,
                prebook,
                await,
                fold,
                bulk,
                backcarpark,
                damage,
                latest_update,
                product:data_code(
                  code,
                  description,
                  type,
                  colour
                )
              `);

          // Apply filters
          if (key.productCode) {
            query = query.eq('product_code', key.productCode);
          }

          if (key.warehouse) {
            // Filter by warehouse location quantities > 0
            query = query.or(
              `injection.gt.0,pipeline.gt.0,prebook.gt.0,await.gt.0,fold.gt.0,bulk.gt.0`
            );
          }

          const { data, error } = await query
            .order('total_quantity', { ascending: false })
            .limit(50);

          if (error) throw error;

          // Transform data into stock level items
          const items = (data || []).map((item: DatabaseEntity) => {
            const product = asProductEntity(item);
            return {
              productCode: product?.product_code || '',
              productName: product?.product?.description || product?.description || 'Unknown',
              quantity: product?.total_quantity || 0,
              location: determineMainLocation(item),
              lastUpdated: product?.latest_update || '',
            };
          });

          // Calculate totals
          const totalItems = items.length;
          const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

          return {
            items,
            totalItems,
            totalQuantity,
            lastUpdated: new Date().toISOString(),
            refreshInterval: 60000,
            dataSource: 'stock_levels',
          };
        } catch (error) {
          console.error('[StockLevelsLoader] Error:', error);
          return null;
        }
      })
    );

    return results;
  });
}

/**
 * Enhanced DataLoader for work level statistics with improved batch processing
 * Addresses N+1 query problems and adds performance optimizations
 */
export function createEnhancedWorkLevelLoader(
  supabase: SupabaseClient
): DataLoader<WorkLevelKey, WorkLevelResult | null> {
  return createBatchLoader<WorkLevelKey, WorkLevelResult | null>(async keys => {
    try {
      // Group keys by date for optimal batch querying
      const dateGroups = groupKeysByDate(keys);
      const allResults = new Map<string, WorkLevelResult | null>();

      // Process all date groups in parallel
      const datePromises = Array.from(dateGroups.entries()).map(async ([date, dateKeys]) => {
        const userIds = dateKeys.map(k => k.userId);

        // Execute all queries for this date in parallel
        const [workData, transferData, historyData] = await Promise.all([
          // Work level base data
          supabase
            .from('work_level')
            .select(
              `
                *,
                user:data_id(
                  id,
                  name,
                  department,
                  position
                )
              `
            )
            .in('user_id', userIds)
            .eq('date', date),

          // Transfer operations
          supabase
            .from('record_transfer')
            .select(
              `
                *,
                pallet:record_palletinfo(
                  plt_num,
                  product_code,
                  product_qty
                ),
                from_location:data_location!from_location_id(code, name),
                to_location:data_location!to_location_id(code, name)
              `
            )
            .in('executed_by', userIds)
            .gte('completed_at', `${date}T00:00:00`)
            .lt('completed_at', `${date}T23:59:59`),

          // Historical performance data for trend analysis
          supabase
            .from('record_history')
            .select(
              `
                id,
                time,
                action,
                plt_num,
                loc
              `
            )
            .in('id', userIds) // user id in history
            .gte('time', `${date}T00:00:00`)
            .lt('time', `${date}T23:59:59`),
        ]);

        // Handle errors gracefully
        if (workData.error) {
          console.error('[EnhancedWorkLevelLoader] Work data error:', workData.error);
          return dateKeys.map(key => ({ key, result: null }));
        }

        if (transferData.error) {
          console.error('[EnhancedWorkLevelLoader] Transfer data error:', transferData.error);
        }

        if (historyData.error) {
          console.error('[EnhancedWorkLevelLoader] History data error:', historyData.error);
        }

        // Create efficient lookup maps
        const workDataMap = new Map<string, DatabaseEntity>(
          (workData.data || []).map(w => [w.user_id, w])
        );

        const transfersByUser = groupTransfersByUser(transferData.data || []);
        const historyByUser = groupHistoryByUser(historyData.data || []);

        // Process each user's data
        return dateKeys.map(key => {
          const workLevel = workDataMap.get(key.userId);
          const transfers = transfersByUser.get(key.userId) || [];
          const history = historyByUser.get(key.userId) || [];

          if (!workLevel) {
            return { key, result: null };
          }

          // Enhanced calculations
          const hourlyBreakdown = calculateEnhancedHourlyBreakdown(transfers);
          const locationBreakdown = calculateEnhancedLocationBreakdown(transfers);
          const performanceMetrics = calculatePerformanceMetrics(transfers, history);
          const trendAnalysis = calculateTrendAnalysis(transfers);

          const _result = {
            userId: key.userId,
            user: asWorkLevelEntity(workLevel)?.user,
            date: new Date(date),

            // Basic metrics
            totalTransfers: transfers.length,
            totalPalletsHandled: safeNumber(workLevel, 'total_pallets'),
            totalQuantityMoved: safeNumber(workLevel, 'total_quantity'),

            // Enhanced metrics
            averageTransferTime: performanceMetrics.averageTransferTime,
            efficiency: performanceMetrics.efficiency,
            productivityScore: performanceMetrics.productivityScore,
            errorRate: performanceMetrics.errorRate,

            // Detailed breakdowns
            transfersByHour: hourlyBreakdown,
            transfersByLocation: locationBreakdown,

            // Advanced analytics
            performanceTrends: trendAnalysis,
            workQuality: performanceMetrics.workQuality,
            timeUtilization: performanceMetrics.timeUtilization,

            // Metadata
            lastUpdated: new Date().toISOString(),
            dataSource: 'enhanced_work_level',
            refreshInterval: 120000, // 2 minutes
          };

          return { key, result: _result };
        });
      });

      // Collect all results
      const allDateResults = await Promise.all(datePromises);
      allDateResults.flat().forEach(({ key, result }) => {
        allResults.set(JSON.stringify(key), result);
      });

      // Return results in the same order as input keys
      return keys.map(key => allResults.get(JSON.stringify(key)) || null);
    } catch (error) {
      console.error('[EnhancedWorkLevelLoader] Critical error:', error);
      return keys.map(() => null);
    }
  });
}

/**
 * Legacy DataLoader for work level statistics (maintained for compatibility)
 */
export function createWorkLevelLoader(
  supabase: SupabaseClient
): DataLoader<WorkLevelKey, WorkLevelResult | null> {
  // Delegate to enhanced version
  return createEnhancedWorkLevelLoader(supabase);
}

/**
 * DataLoader for GRN Analytics with complex JOINs
 * Combines data from record_grn, data_supplier, record_palletinfo, and optional QC data
 */
export function createGRNAnalyticsLoader(
  supabase: SupabaseClient
): DataLoader<GRNAnalyticsKey, GRNAnalyticsResult | null> {
  return createBatchLoader<GRNAnalyticsKey, GRNAnalyticsResult | null>(async keys => {
    const results = await Promise.all(
      keys.map(async key => {
        try {
          // Base GRN query with supplier and material relationships
          let grnQuery = supabase.from('record_grn').select(`
                *,
                supplier:data_supplier(
                  supplier_code,
                  supplier_name
                ),
                material:data_code(
                  code,
                  description,
                  colour,
                  type,
                  standard_qty
                ),
                pallet:record_palletinfo(
                  plt_num,
                  product_code,
                  product_qty,
                  series,
                  generate_time
                )
              `);

          // Apply filters
          if (key.grnRef) {
            grnQuery = grnQuery.eq('grn_ref', key.grnRef);
          }

          if (key.supplierCode) {
            grnQuery = grnQuery.eq('sup_code', key.supplierCode);
          }

          if (key.materialCode) {
            grnQuery = grnQuery.eq('material_code', key.materialCode);
          }

          if (key.dateRange) {
            const { start, end } = key.dateRange;
            grnQuery = grnQuery.gte('creat_time', start).lte('creat_time', end);
          }

          const { data: grnData, error: grnError } = await grnQuery
            .order('creat_time', { ascending: false })
            .limit(100);

          if (grnError) throw grnError;

          // Get GRN level summary data
          const grnRefs = Array.from(new Set((grnData || []).map(g => g.grn_ref)));
          const { data: grnLevelData } = await supabase
            .from('grn_level')
            .select('*')
            .in('grn_ref', grnRefs);

          // QC data removed - record_slate table no longer exists
          const qcData: DatabaseEntity[] = [];

          // Create lookup maps for efficient data joining
          const grnLevelMap = new Map<string, DatabaseEntity>(
            (grnLevelData || []).map(gl => [safeString(gl, 'grn_ref', ''), gl])
          );

          const qcMap = new Map<string, DatabaseEntity>(
            qcData.map(qc => [safeString(qc, 'plt_num', ''), qc])
          );

          // Transform and enrich GRN data
          const enrichedGrnData = (grnData || []).map(grn => {
            const grnLevel = grnLevelMap.get(grn.grn_ref);
            const qc = qcMap.get(grn.plt_num);

            return {
              ...grn,
              grn_level: grnLevel,
              qc_results: qc,
              supplier_info: grn.supplier,
              material_info: grn.material,
              pallet_info: grn.pallet,
            };
          });

          // Calculate analytics
          const analytics = calculateGRNAnalytics(enrichedGrnData, grnLevelData || []);

          return {
            grn_records: enrichedGrnData,
            analytics,
            totalRecords: enrichedGrnData.length,
            uniqueSuppliers: Array.from(new Set(enrichedGrnData.map(g => g.sup_code))).length,
            uniqueMaterials: Array.from(new Set(enrichedGrnData.map(g => g.material_code))).length,
            dateRange: key.dateRange,
            lastUpdated: new Date().toISOString(),
            refreshInterval: 300000, // 5 minutes for GRN data
            dataSource: 'grn_analytics',
          };
        } catch (error) {
          console.error('[GRNAnalyticsLoader] Error:', error);
          return null;
        }
      })
    );

    return results;
  });
}

// Helper functions
function calculateAverageEfficiency(workLevels: DatabaseEntity[]): number {
  if (workLevels.length === 0) return 0;
  const sum = workLevels.reduce((acc, wl) => {
    const workLevel = asWorkLevelEntity(wl);
    return acc + (workLevel?.efficiency || 0);
  }, 0);
  return sum / workLevels.length;
}

function determineMainLocation(inventory: DatabaseEntity): string {
  const inventoryEntity = asInventoryEntity(inventory);
  const locations = [
    { name: 'Injection', qty: inventoryEntity?.injection || 0 },
    { name: 'Pipeline', qty: safeNumber(inventory, 'pipeline') },
    { name: 'Prebook', qty: safeNumber(inventory, 'prebook') },
    { name: 'Await', qty: safeNumber(inventory, 'await') },
    { name: 'Fold', qty: safeNumber(inventory, 'fold') },
    { name: 'Bulk', qty: safeNumber(inventory, 'bulk') },
    { name: 'Back Car Park', qty: safeNumber(inventory, 'backcarpark') },
    { name: 'Damage', qty: safeNumber(inventory, 'damage') },
  ];

  const mainLocation = locations.reduce((max, loc) => (loc.qty > max.qty ? loc : max));

  return mainLocation.name;
}

function _calculateHourlyBreakdown(transfers: DatabaseEntity[]): Record<string, unknown>[] {
  const hourlyMap = new Map<number, { count: number; quantity: number }>();

  transfers.forEach(transfer => {
    const transferEntity = asTransferEntity(transfer);
    const hour = new Date(
      transferEntity?.completed_at || transferEntity?.created_at || ''
    ).getHours();
    const current = hourlyMap.get(hour) || { count: 0, quantity: 0 };
    hourlyMap.set(hour, {
      count: current.count + 1,
      quantity: current.quantity + (transferEntity?.quantity || 0),
    });
  });

  return Array.from(hourlyMap.entries()).map(([hour, data]) => ({
    hour,
    count: data.count,
    quantity: data.quantity,
  }));
}

function _calculateLocationBreakdown(transfers: DatabaseEntity[]): Record<string, unknown>[] {
  const locationMap = new Map<string, { count: number; quantity: number }>();

  transfers.forEach(transfer => {
    const transferEntity = asTransferEntity(transfer);
    const location = transferEntity?.to_location || 'Unknown';
    const current = locationMap.get(location) || { count: 0, quantity: 0 };
    locationMap.set(location, {
      count: current.count + 1,
      quantity: current.quantity + (transferEntity?.quantity || 0),
    });
  });

  return Array.from(locationMap.entries()).map(([location, data]) => ({
    location: { code: location, name: location },
    count: data.count,
    quantity: data.quantity,
  }));
}

function calculateGRNAnalytics(
  grnData: DatabaseEntity[],
  _grnLevelData: DatabaseEntity[]
): Record<string, unknown> {
  if (!grnData || grnData.length === 0) {
    return {
      totalGrossWeight: 0,
      totalNetWeight: 0,
      totalPalletCount: 0,
      totalPackageCount: 0,
      averageGrossWeight: 0,
      averageNetWeight: 0,
      supplierBreakdown: [],
      materialBreakdown: [],
      monthlyTrends: [],
      qualityMetrics: {
        totalQCRecords: 0,
        passRate: 0,
        avgWeight: 0,
        avgThickness: 0,
      },
    };
  }

  // Calculate totals
  const totalGrossWeight = grnData.reduce((sum, grn) => {
    const grnEntity = asGRNEntity(grn);
    return sum + (grnEntity?.gross_weight || 0);
  }, 0);
  const totalNetWeight = grnData.reduce((sum, grn) => {
    const grnEntity = asGRNEntity(grn);
    return sum + (grnEntity?.net_weight || 0);
  }, 0);
  const totalPalletCount = grnData.reduce((sum, grn) => {
    const grnEntity = asGRNEntity(grn);
    return sum + (grnEntity?.pallet_count || 0);
  }, 0);
  const totalPackageCount = grnData.reduce((sum, grn) => {
    const grnEntity = asGRNEntity(grn);
    return sum + (grnEntity?.package_count || 0);
  }, 0);

  // Calculate averages
  const recordCount = grnData.length;
  const averageGrossWeight = recordCount > 0 ? totalGrossWeight / recordCount : 0;
  const averageNetWeight = recordCount > 0 ? totalNetWeight / recordCount : 0;

  // Supplier breakdown
  const supplierMap = new Map<string, { count: number; grossWeight: number; netWeight: number }>();
  grnData.forEach(grn => {
    const grnEntity = asGRNEntity(grn);
    const supplierCode = grnEntity?.sup_code || 'Unknown';
    const current = supplierMap.get(supplierCode) || { count: 0, grossWeight: 0, netWeight: 0 };
    supplierMap.set(supplierCode, {
      count: current.count + 1,
      grossWeight: current.grossWeight + (grnEntity?.gross_weight || 0),
      netWeight: current.netWeight + (grnEntity?.net_weight || 0),
    });
  });

  const supplierBreakdown = Array.from(supplierMap.entries()).map(([code, data]) => ({
    supplierCode: code,
    supplierName: (() => {
      const foundGrn = grnData.find(g => asGRNEntity(g)?.sup_code === code);
      const foundGrnEntity = asGRNEntity(foundGrn);
      return foundGrnEntity?.supplier?.supplier_name || code;
    })(),
    recordCount: data.count,
    totalGrossWeight: data.grossWeight,
    totalNetWeight: data.netWeight,
    averageGrossWeight: data.count > 0 ? data.grossWeight / data.count : 0,
  }));

  // Material breakdown
  const materialMap = new Map<string, { count: number; grossWeight: number; netWeight: number }>();
  grnData.forEach(grn => {
    const grnEntity = asGRNEntity(grn);
    const materialCode = grnEntity?.material_code || 'Unknown';
    const current = materialMap.get(materialCode) || { count: 0, grossWeight: 0, netWeight: 0 };
    materialMap.set(materialCode, {
      count: current.count + 1,
      grossWeight: current.grossWeight + (grnEntity?.gross_weight || 0),
      netWeight: current.netWeight + (grnEntity?.net_weight || 0),
    });
  });

  const materialBreakdown = Array.from(materialMap.entries()).map(([code, data]) => ({
    materialCode: code,
    materialName: (() => {
      const foundGrn = grnData.find(g => asGRNEntity(g)?.material_code === code);
      const foundGrnEntity = asGRNEntity(foundGrn);
      return foundGrnEntity?.material?.description || code;
    })(),
    recordCount: data.count,
    totalGrossWeight: data.grossWeight,
    totalNetWeight: data.netWeight,
    averageGrossWeight: data.count > 0 ? data.grossWeight / data.count : 0,
  }));

  // Monthly trends (simplified - group by month)
  const monthlyMap = new Map<string, { count: number; grossWeight: number; netWeight: number }>();
  grnData.forEach(grn => {
    const grnEntity = asGRNEntity(grn);
    const date = new Date(grnEntity?.creat_time || grnEntity?.created_at || new Date());
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const current = monthlyMap.get(monthKey) || { count: 0, grossWeight: 0, netWeight: 0 };
    monthlyMap.set(monthKey, {
      count: current.count + 1,
      grossWeight: current.grossWeight + (grnEntity?.gross_weight || 0),
      netWeight: current.netWeight + (grnEntity?.net_weight || 0),
    });
  });

  const monthlyTrends = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      recordCount: data.count,
      totalGrossWeight: data.grossWeight,
      totalNetWeight: data.netWeight,
      averageGrossWeight: data.count > 0 ? data.grossWeight / data.count : 0,
    }));

  // Quality metrics from QC data
  const qcRecords: unknown[] = grnData
    .map(grn => asGRNEntity(grn))
    .filter(grnEntity => grnEntity && safeGet(grnEntity, 'qc_results', null))
    .map(grnEntity => safeGet(grnEntity, 'qc_results', {}));
  const qualityMetrics = {
    totalQCRecords: qcRecords.length,
    passRate:
      qcRecords.length > 0
        ? (qcRecords.filter(qc => safeString(qc, 'flame_test', 'UNKNOWN') === 'PASS').length /
            qcRecords.length) *
          100
        : 0,
    avgWeight:
      qcRecords.length > 0
        ? (() => {
            const total = qcRecords.reduce((sum: number, qc: unknown) => {
              const weight = safeNumber(qc, 'weight', 0);
              return sum + weight;
            }, 0);
            return (total as number) / qcRecords.length;
          })()
        : 0,
    avgThickness:
      qcRecords.length > 0
        ? (() => {
            const total = qcRecords.reduce((sum: number, qc: unknown) => {
              const tThick = safeNumber(qc, 't_thick', 0);
              const bThick = safeNumber(qc, 'b_thick', 0);
              return sum + (tThick + bThick) / 2;
            }, 0);
            return (total as number) / qcRecords.length;
          })()
        : 0,
  };

  return {
    totalGrossWeight,
    totalNetWeight,
    totalPalletCount,
    totalPackageCount,
    averageGrossWeight,
    averageNetWeight,
    supplierBreakdown: supplierBreakdown.sort((a, b) => b.totalGrossWeight - a.totalGrossWeight),
    materialBreakdown: materialBreakdown.sort((a, b) => b.totalGrossWeight - a.totalGrossWeight),
    monthlyTrends,
    qualityMetrics,
  };
}

// Enhanced WorkLevel helper functions
function groupKeysByDate(keys: readonly WorkLevelKey[]): Map<string, WorkLevelKey[]> {
  const groups = new Map<string, WorkLevelKey[]>();
  keys.forEach(key => {
    if (!groups.has(key.date)) {
      groups.set(key.date, []);
    }
    groups.get(key.date)!.push(key);
  });
  return groups;
}

function groupTransfersByUser(transfers: DatabaseEntity[]): Map<string, DatabaseEntity[]> {
  const groups = new Map<string, DatabaseEntity[]>();
  transfers.forEach(transfer => {
    const transferEntity = asTransferEntity(transfer);
    const userId = transferEntity?.executed_by?.id || 'unknown';
    if (!groups.has(userId)) {
      groups.set(userId, []);
    }
    groups.get(userId)!.push(transfer);
  });
  return groups;
}

function groupHistoryByUser(history: DatabaseEntity[]): Map<string, DatabaseEntity[]> {
  const groups = new Map<string, DatabaseEntity[]>();
  history.forEach(record => {
    const userEntity = asUserEntity(record);
    const userId = userEntity?.id || 'unknown';
    if (!groups.has(userId)) {
      groups.set(userId, []);
    }
    groups.get(userId)!.push(record);
  });
  return groups;
}

function calculateEnhancedHourlyBreakdown(transfers: DatabaseEntity[]): Record<string, unknown>[] {
  const hourlyMap = new Map<
    number,
    {
      count: number;
      quantity: number;
      averageTime: number;
      efficiency: number;
    }
  >();

  // Initialize all hours
  for (let hour = 0; hour < 24; hour++) {
    hourlyMap.set(hour, { count: 0, quantity: 0, averageTime: 0, efficiency: 0 });
  }

  transfers.forEach(transfer => {
    const transferEntity = asTransferEntity(transfer);
    const date = new Date(transferEntity?.completed_at || transferEntity?.created_at || new Date());
    const hour = date.getHours();
    const current = hourlyMap.get(hour)!;

    const transferTime = transferEntity?.transfer_time || 0;
    const quantity = transferEntity?.quantity || 0;

    hourlyMap.set(hour, {
      count: current.count + 1,
      quantity: current.quantity + quantity,
      averageTime:
        current.count > 0
          ? (current.averageTime * current.count + transferTime) / (current.count + 1)
          : transferTime,
      efficiency: quantity > 0 && transferTime > 0 ? quantity / transferTime : 0,
    });
  });

  return Array.from(hourlyMap.entries()).map(([hour, data]) => ({
    hour,
    count: data.count,
    quantity: data.quantity,
    averageTime: Math.round(data.averageTime * 100) / 100,
    efficiency: Math.round(data.efficiency * 100) / 100,
    productivityScore: data.count > 0 ? (data.quantity / data.count) * data.efficiency : 0,
  }));
}

function calculateEnhancedLocationBreakdown(
  transfers: DatabaseEntity[]
): Record<string, unknown>[] {
  const locationMap = new Map<
    string,
    {
      count: number;
      quantity: number;
      averageTime: number;
      fromCount: number;
      toCount: number;
    }
  >();

  transfers.forEach(transfer => {
    const transferEntity = asTransferEntity(transfer);
    const fromLocation = transferEntity?.from_location || 'Unknown';
    const toLocation = transferEntity?.to_location || 'Unknown';
    const quantity = transferEntity?.quantity || 0;
    const transferTime = transferEntity?.transfer_time || 0;

    // Track "to" locations
    const toCurrent = locationMap.get(toLocation) || {
      count: 0,
      quantity: 0,
      averageTime: 0,
      fromCount: 0,
      toCount: 0,
    };
    locationMap.set(toLocation, {
      count: toCurrent.count + 1,
      quantity: toCurrent.quantity + quantity,
      averageTime:
        toCurrent.count > 0
          ? (toCurrent.averageTime * toCurrent.count + transferTime) / (toCurrent.count + 1)
          : transferTime,
      fromCount: toCurrent.fromCount,
      toCount: toCurrent.toCount + 1,
    });

    // Track "from" locations
    const fromCurrent = locationMap.get(fromLocation) || {
      count: 0,
      quantity: 0,
      averageTime: 0,
      fromCount: 0,
      toCount: 0,
    };
    locationMap.set(fromLocation, {
      ...fromCurrent,
      fromCount: fromCurrent.fromCount + 1,
    });
  });

  return Array.from(locationMap.entries())
    .map(([locationCode, data]) => ({
      location: {
        code: locationCode,
        name: locationCode,
      },
      inboundCount: data.toCount,
      outboundCount: data.fromCount,
      totalCount: data.count,
      totalQuantity: data.quantity,
      averageTime: Math.round(data.averageTime * 100) / 100,
      throughputRatio: data.fromCount > 0 ? data.toCount / data.fromCount : 0,
      efficiency: data.quantity > 0 && data.averageTime > 0 ? data.quantity / data.averageTime : 0,
    }))
    .sort((a, b) => b.totalCount - a.totalCount);
}

function calculatePerformanceMetrics(
  transfers: DatabaseEntity[],
  history: DatabaseEntity[]
): Record<string, unknown> {
  if (transfers.length === 0) {
    return {
      averageTransferTime: 0,
      efficiency: 0,
      productivityScore: 0,
      errorRate: 0,
      workQuality: 0,
      timeUtilization: 0,
    };
  }

  // Calculate transfer metrics
  const totalTransferTime = transfers.reduce((sum, t) => {
    const transferEntity = asTransferEntity(t);
    return sum + (transferEntity?.transfer_time || 0);
  }, 0);
  const totalQuantity = transfers.reduce((sum, t) => {
    const transferEntity = asTransferEntity(t);
    return sum + (transferEntity?.quantity || 0);
  }, 0);
  const averageTransferTime = totalTransferTime / transfers.length;

  // Calculate efficiency (quantity per minute)
  const efficiency = totalTransferTime > 0 ? (totalQuantity / totalTransferTime) * 60 : 0;

  // Calculate error rate from history
  const errorActions = history.filter(h => {
    const historyEntity = asHistoryEntity(h);
    return (
      historyEntity?.action &&
      (historyEntity.action.includes('error') || historyEntity.action.includes('retry'))
    );
  }).length;
  const errorRate = history.length > 0 ? (errorActions / history.length) * 100 : 0;

  // Calculate productivity score (combination of speed and accuracy)
  const productivityScore = efficiency * (1 - errorRate / 100);

  // Work quality score based on consistency and accuracy
  const transferTimes = transfers
    .map(t => asTransferEntity(t)?.transfer_time || 0)
    .filter(t => t > 0);
  const timeVariance = calculateVariance(transferTimes);
  const workQuality = Math.max(0, 100 - timeVariance / 10 - errorRate);

  // Time utilization (active time vs total time)
  const workingHours = 8 * 60; // 8 hours in minutes
  const activeTime = totalTransferTime;
  const timeUtilization = Math.min(100, (activeTime / workingHours) * 100);

  return {
    averageTransferTime: Math.round(averageTransferTime * 100) / 100,
    efficiency: Math.round(efficiency * 100) / 100,
    productivityScore: Math.round(productivityScore * 100) / 100,
    errorRate: Math.round(errorRate * 100) / 100,
    workQuality: Math.round(workQuality * 100) / 100,
    timeUtilization: Math.round(timeUtilization * 100) / 100,
  };
}

function calculateTrendAnalysis(transfers: DatabaseEntity[]): Record<string, unknown> {
  if (transfers.length < 2) {
    return {
      trend: 'stable',
      improvement: 0,
      peakHours: [],
      consistencyScore: 0,
    };
  }

  // Sort transfers by time
  const sortedTransfers = transfers
    .filter(t => {
      const transferEntity = asTransferEntity(t);
      return transferEntity?.completed_at || transferEntity?.created_at;
    })
    .sort((a, b) => {
      const aEntity = asTransferEntity(a);
      const bEntity = asTransferEntity(b);
      const aTime = new Date(aEntity?.completed_at || aEntity?.created_at || 0).getTime();
      const bTime = new Date(bEntity?.completed_at || bEntity?.created_at || 0).getTime();
      return aTime - bTime;
    });

  // Calculate trend in efficiency over time
  const halfPoint = Math.floor(sortedTransfers.length / 2);
  const firstHalf = sortedTransfers.slice(0, halfPoint);
  const secondHalf = sortedTransfers.slice(halfPoint);

  const firstHalfEfficiency = calculateEfficiency(firstHalf);
  const secondHalfEfficiency = calculateEfficiency(secondHalf);

  const improvement = secondHalfEfficiency - firstHalfEfficiency;
  const trend = improvement > 5 ? 'improving' : improvement < -5 ? 'declining' : 'stable';

  // Find peak performance hours
  const hourlyPerformance = new Map<number, number>();
  sortedTransfers.forEach(transfer => {
    const transferEntity = asTransferEntity(transfer);
    const date = new Date(transferEntity?.completed_at || transferEntity?.created_at || new Date());
    const hour = date.getHours();
    const quantity = transferEntity?.quantity || 0;
    const transferTime = transferEntity?.transfer_time || 1;
    const efficiency = quantity / transferTime;
    const current = hourlyPerformance.get(hour) || 0;
    hourlyPerformance.set(hour, Math.max(current, efficiency));
  });

  const peakHours = Array.from(hourlyPerformance.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([hour]) => hour);

  // Calculate consistency score
  const transferTimes = sortedTransfers
    .map(t => asTransferEntity(t)?.transfer_time || 0)
    .filter(t => t > 0);
  const consistency =
    transferTimes.length > 0
      ? 100 - Math.min(100, (calculateVariance(transferTimes) / calculateMean(transferTimes)) * 100)
      : 0;

  return {
    trend,
    improvement: Math.round(improvement * 100) / 100,
    peakHours,
    consistencyScore: Math.round(consistency * 100) / 100,
  };
}

function calculateEfficiency(transfers: DatabaseEntity[]): number {
  if (transfers.length === 0) return 0;
  const totalQuantity = transfers.reduce((sum, t) => {
    const transferEntity = asTransferEntity(t);
    return sum + (transferEntity?.quantity || 0);
  }, 0);
  const totalTime = transfers.reduce((sum, t) => {
    const transferEntity = asTransferEntity(t);
    return sum + (transferEntity?.transfer_time || 1);
  }, 0);
  return totalTime > 0 ? (totalQuantity / totalTime) * 60 : 0;
}

function calculateVariance(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const mean = calculateMean(numbers);
  const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
  return Math.sqrt(variance);
}

function calculateMean(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
}

/**
 * DataLoader for Performance Metrics with comprehensive system analytics
 * Aggregates data from work_level, record_history, record_transfer, and record_grn
 * Provides KPIs for operational efficiency and user productivity
 */
export function createPerformanceMetricsLoader(
  supabase: SupabaseClient
): DataLoader<PerformanceMetricsKey, PerformanceMetricsResult | null> {
  return createBatchLoader<PerformanceMetricsKey, PerformanceMetricsResult | null>(async keys => {
    const results = await Promise.all(
      keys.map(async key => {
        try {
          const { start, end } = key.dateRange || {
            start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
            end: new Date().toISOString(), // Now
          };

          // Parallel data collection from all relevant tables
          const [workLevelData, historyData, transferData, grnData] = await Promise.all([
            // Work level performance data
            supabase
              .from('work_level')
              .select(
                `
                  *,
                  user:data_id(
                    id,
                    name,
                    department,
                    position
                  )
                `
              )
              .gte('latest_update', start)
              .lte('latest_update', end)
              .order('latest_update', { ascending: false }),

            // Historical operations data
            supabase
              .from('record_history')
              .select(
                `
                  time,
                  id,
                  action,
                  plt_num,
                  loc,
                  remark
                `
              )
              .gte('time', start)
              .lte('time', end)
              .order('time', { ascending: false }),

            // Transfer efficiency data
            supabase
              .from('record_transfer')
              .select(
                `
                  *,
                  pallet:record_palletinfo(
                    plt_num,
                    product_code,
                    product_qty
                  ),
                  operator:data_id!operator_id(
                    id,
                    name,
                    department
                  )
                `
              )
              .gte('tran_date', start)
              .lte('tran_date', end)
              .order('tran_date', { ascending: false }),

            // GRN processing efficiency
            supabase
              .from('record_grn')
              .select(
                `
                  creat_time,
                  sup_code,
                  material_code,
                  gross_weight,
                  net_weight,
                  pallet_count,
                  package_count
                `
              )
              .gte('creat_time', start)
              .lte('creat_time', end)
              .order('creat_time', { ascending: false }),
          ]);

          // Handle errors gracefully
          if (workLevelData.error) {
            console.error('[PerformanceMetricsLoader] Work level data error:', workLevelData.error);
          }
          if (historyData.error) {
            console.error('[PerformanceMetricsLoader] History data error:', historyData.error);
          }
          if (transferData.error) {
            console.error('[PerformanceMetricsLoader] Transfer data error:', transferData.error);
          }
          if (grnData.error) {
            console.error('[PerformanceMetricsLoader] GRN data error:', grnData.error);
          }

          // Calculate performance metrics based on metric type
          let metrics: Record<string, unknown> = {};

          switch (key.metricType) {
            case 'user':
              metrics = calculateUserPerformanceMetrics(
                workLevelData.data || [],
                historyData.data || [],
                transferData.data || [],
                key.userId
              );
              break;

            case 'system':
              metrics = calculateSystemPerformanceMetrics(
                workLevelData.data || [],
                historyData.data || [],
                transferData.data || [],
                grnData.data || []
              );
              break;

            case 'operation':
              metrics = calculateOperationPerformanceMetrics(
                transferData.data || [],
                grnData.data || [],
                historyData.data || []
              );
              break;

            case 'overall':
            default:
              metrics = calculateOverallPerformanceMetrics(
                workLevelData.data || [],
                historyData.data || [],
                transferData.data || [],
                grnData.data || []
              );
              break;
          }

          return {
            metricType: key.metricType || 'overall',
            dateRange: { start, end },
            granularity: key.granularity || 'daily',
            metrics,
            summary: {
              totalUsers: Array.from(new Set((workLevelData.data || []).map(w => w.user_id)))
                .length,
              totalOperations: (historyData.data || []).length,
              totalTransfers: (transferData.data || []).length,
              totalGRNRecords: (grnData.data || []).length,
            },
            lastUpdated: new Date().toISOString(),
            refreshInterval: 180000, // 3 minutes
            dataSource: 'performance_metrics',
          };
        } catch (error) {
          console.error('[PerformanceMetricsLoader] Error:', error);
          return null;
        }
      })
    );

    return results;
  });
}

// Performance Metrics Calculation Functions

function calculateUserPerformanceMetrics(
  workLevels: DatabaseEntity[],
  history: DatabaseEntity[],
  transfers: DatabaseEntity[],
  userId?: string
): Record<string, unknown> {
  // Filter data for specific user if provided
  const userWorkLevels = userId
    ? workLevels.filter(w => {
        const workLevelEntity = asWorkLevelEntity(w);
        return workLevelEntity?.user_id === userId;
      })
    : workLevels;
  const userHistory = userId
    ? history.filter(h => {
        const historyEntity = asHistoryEntity(h);
        return historyEntity?.id === userId;
      })
    : history;
  const userTransfers = userId
    ? transfers.filter(t => {
        const transferEntity = asTransferEntity(t);
        return transferEntity?.operator_id === userId;
      })
    : transfers;

  if (userWorkLevels.length === 0) {
    return {
      productivity: 0,
      efficiency: 0,
      qualityScore: 0,
      averageTaskTime: 0,
      completionRate: 0,
      errorRate: 0,
      improvementTrend: 'stable',
    };
  }

  // Calculate productivity metrics
  const totalQC = userWorkLevels.reduce((sum, w) => {
    const workLevelEntity = asWorkLevelEntity(w);
    return sum + (workLevelEntity?.qc || 0);
  }, 0);
  const totalMove = userWorkLevels.reduce((sum, w) => {
    const workLevelEntity = asWorkLevelEntity(w);
    return sum + (workLevelEntity?.move || 0);
  }, 0);
  const totalGRN = userWorkLevels.reduce((sum, w) => {
    const workLevelEntity = asWorkLevelEntity(w);
    return sum + (workLevelEntity?.grn || 0);
  }, 0);
  const totalLoading = userWorkLevels.reduce((sum, w) => {
    const workLevelEntity = asWorkLevelEntity(w);
    return sum + (workLevelEntity?.loading || 0);
  }, 0);

  const totalTasks = totalQC + totalMove + totalGRN + totalLoading;
  const workingDays = userWorkLevels.length;
  const productivity = workingDays > 0 ? totalTasks / workingDays : 0;

  // Calculate efficiency from transfers
  const avgTransferTime =
    userTransfers.length > 0
      ? userTransfers.reduce((sum, t) => sum + (calculateTransferDuration(t) || 0), 0) /
        userTransfers.length
      : 0;
  const efficiency = avgTransferTime > 0 ? Math.min(100, (30 / avgTransferTime) * 100) : 0; // 30 min baseline

  // Calculate quality score from history (error rate)
  const errorOperations = userHistory.filter(h => {
    const historyEntity = asHistoryEntity(h);
    return (
      historyEntity?.action &&
      (historyEntity.action.includes('error') ||
        historyEntity.action.includes('retry') ||
        historyEntity.action.includes('fail'))
    );
  }).length;
  const errorRate = userHistory.length > 0 ? (errorOperations / userHistory.length) * 100 : 0;
  const qualityScore = Math.max(0, 100 - errorRate);

  // Calculate completion rate
  const completedOperations = userHistory.filter(h => {
    const historyEntity = asHistoryEntity(h);
    return (
      historyEntity?.action &&
      (historyEntity.action.includes('complete') || historyEntity.action.includes('success'))
    );
  }).length;
  const completionRate =
    userHistory.length > 0 ? (completedOperations / userHistory.length) * 100 : 0;

  // Calculate improvement trend
  const improvementTrend = calculateUserImprovementTrend(userWorkLevels);

  return {
    productivity: Math.round(productivity * 100) / 100,
    efficiency: Math.round(efficiency * 100) / 100,
    qualityScore: Math.round(qualityScore * 100) / 100,
    averageTaskTime: Math.round(avgTransferTime * 100) / 100,
    completionRate: Math.round(completionRate * 100) / 100,
    errorRate: Math.round(errorRate * 100) / 100,
    improvementTrend,
    taskBreakdown: {
      qc: totalQC,
      move: totalMove,
      grn: totalGRN,
      loading: totalLoading,
    },
  };
}

function calculateSystemPerformanceMetrics(
  workLevels: DatabaseEntity[],
  history: DatabaseEntity[],
  transfers: DatabaseEntity[],
  grnRecords: DatabaseEntity[]
): Record<string, unknown> {
  // Overall system health metrics
  const totalOperations = history.length;
  const _totalTransfers = transfers.length;
  const _totalGRNs = grnRecords.length;
  const totalUsers = Array.from(
    new Set(
      workLevels
        .map(w => {
          const workLevelEntity = asWorkLevelEntity(w);
          return workLevelEntity?.user_id;
        })
        .filter(Boolean)
    )
  ).length;

  // System throughput (operations per hour)
  const timeSpanHours = calculateTimeSpanHours(history);
  const systemThroughput = timeSpanHours > 0 ? totalOperations / timeSpanHours : 0;

  // System reliability (success rate)
  const successfulOps = history.filter(h => {
    const historyEntity = asHistoryEntity(h);
    return (
      historyEntity?.action &&
      !historyEntity.action.includes('error') &&
      !historyEntity.action.includes('fail')
    );
  }).length;
  const systemReliability = totalOperations > 0 ? (successfulOps / totalOperations) * 100 : 0;

  // Resource utilization
  const activeUsers = Array.from(
    new Set(
      transfers
        .map(t => {
          const transferEntity = asTransferEntity(t);
          return transferEntity?.operator_id;
        })
        .filter(Boolean)
    )
  ).length;
  const resourceUtilization = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;

  // Processing efficiency
  const avgGRNProcessTime = calculateAverageGRNProcessingTime(grnRecords);
  const processingEfficiency =
    avgGRNProcessTime > 0 ? Math.min(100, (60 / avgGRNProcessTime) * 100) : 0;

  return {
    systemThroughput: Math.round(systemThroughput * 100) / 100,
    systemReliability: Math.round(systemReliability * 100) / 100,
    resourceUtilization: Math.round(resourceUtilization * 100) / 100,
    processingEfficiency: Math.round(processingEfficiency * 100) / 100,
    totalOperations,
    totalUsers,
    activeUsers,
    systemHealth: calculateSystemHealthScore(
      systemReliability,
      resourceUtilization,
      processingEfficiency
    ),
  };
}

function calculateOperationPerformanceMetrics(
  transfers: DatabaseEntity[],
  grnRecords: DatabaseEntity[],
  history: DatabaseEntity[]
): Record<string, unknown> {
  // Operation-specific metrics
  const transferEfficiency = calculateTransferEfficiency(transfers);
  const grnEfficiency = calculateGRNEfficiency(grnRecords);
  const operationReliability = calculateOperationReliability(history);

  // Location performance
  const locationPerformance = calculateLocationPerformance(transfers);

  // Time-based analysis
  const peakHours = calculatePeakOperationHours(transfers, grnRecords);
  const bottlenecks = identifyOperationBottlenecks(transfers, grnRecords, history);

  return {
    transferEfficiency: Math.round(transferEfficiency * 100) / 100,
    grnEfficiency: Math.round(grnEfficiency * 100) / 100,
    operationReliability: Math.round(operationReliability * 100) / 100,
    locationPerformance,
    peakHours,
    bottlenecks,
    recommendations: generateOperationRecommendations(
      transferEfficiency,
      grnEfficiency,
      operationReliability
    ),
  };
}

function calculateOverallPerformanceMetrics(
  workLevels: DatabaseEntity[],
  history: DatabaseEntity[],
  transfers: DatabaseEntity[],
  grnRecords: DatabaseEntity[]
): Record<string, unknown> {
  // Combined metrics for comprehensive view
  const userMetrics = calculateUserPerformanceMetrics(workLevels, history, transfers);
  const systemMetrics = calculateSystemPerformanceMetrics(
    workLevels,
    history,
    transfers,
    grnRecords
  );
  const operationMetrics = calculateOperationPerformanceMetrics(transfers, grnRecords, history);

  // Calculate overall KPIs
  const overallEfficiency =
    (Number(userMetrics.efficiency || 0) +
      Number(systemMetrics.processingEfficiency || 0) +
      Number(operationMetrics.transferEfficiency || 0)) /
    3;

  const overallQuality =
    (Number(userMetrics.qualityScore || 0) +
      Number(systemMetrics.systemReliability || 0) +
      Number(operationMetrics.operationReliability || 0)) /
    3;

  const overallProductivity =
    (Number(userMetrics.productivity || 0) + Number(systemMetrics.systemThroughput || 0)) / 2;

  return {
    overallKPIs: {
      efficiency: Math.round(overallEfficiency * 100) / 100,
      quality: Math.round(overallQuality * 100) / 100,
      productivity: Math.round(overallProductivity * 100) / 100,
    },
    userMetrics,
    systemMetrics,
    operationMetrics,
    insights: generatePerformanceInsights(overallEfficiency, overallQuality, overallProductivity),
    recommendations: generateOverallRecommendations(userMetrics, systemMetrics, operationMetrics),
  };
}

// Helper functions for performance calculations

function calculateTransferDuration(transfer: DatabaseEntity): number {
  const transferEntity = asTransferEntity(transfer);
  if (!transferEntity?.tran_date) return 0;
  // Simplified - in real scenario would calculate based on start/end times
  return 15; // Average 15 minutes per transfer
}

function calculateUserImprovementTrend(workLevels: DatabaseEntity[]): string {
  if (workLevels.length < 2) return 'stable';

  const sorted = workLevels.sort((a, b) => {
    const aEntity = asWorkLevelEntity(a);
    const bEntity = asWorkLevelEntity(b);
    const aTime = new Date(aEntity?.latest_update || 0).getTime();
    const bTime = new Date(bEntity?.latest_update || 0).getTime();
    return aTime - bTime;
  });
  const early = sorted.slice(0, Math.ceil(sorted.length / 2));
  const recent = sorted.slice(Math.floor(sorted.length / 2));

  const earlyAvg =
    early.reduce((sum, w) => {
      const workLevelEntity = asWorkLevelEntity(w);
      return (
        sum +
        ((workLevelEntity?.qc || 0) +
          (workLevelEntity?.move || 0) +
          (workLevelEntity?.grn || 0) +
          (workLevelEntity?.loading || 0))
      );
    }, 0) / early.length;
  const recentAvg =
    recent.reduce((sum, w) => {
      const workLevelEntity = asWorkLevelEntity(w);
      return (
        sum +
        ((workLevelEntity?.qc || 0) +
          (workLevelEntity?.move || 0) +
          (workLevelEntity?.grn || 0) +
          (workLevelEntity?.loading || 0))
      );
    }, 0) / recent.length;

  const improvement = ((recentAvg - earlyAvg) / earlyAvg) * 100;

  if (improvement > 10) return 'improving';
  if (improvement < -10) return 'declining';
  return 'stable';
}

function calculateTimeSpanHours(history: DatabaseEntity[]): number {
  if (history.length === 0) return 0;

  const times = history
    .map(h => {
      const historyEntity = asHistoryEntity(h);
      return new Date(historyEntity?.time || 0).getTime();
    })
    .sort((a, b) => a - b);
  const spanMs = times[times.length - 1] - times[0];
  return spanMs / (1000 * 60 * 60); // Convert to hours
}

function calculateAverageGRNProcessingTime(grnRecords: DatabaseEntity[]): number {
  // Simplified calculation - would need actual processing start/end times
  return grnRecords.length > 0 ? 45 : 0; // Average 45 minutes per GRN
}

function calculateSystemHealthScore(
  reliability: number,
  utilization: number,
  efficiency: number
): number {
  return Math.round(((reliability + utilization + efficiency) / 3) * 100) / 100;
}

function calculateTransferEfficiency(transfers: DatabaseEntity[]): number {
  if (transfers.length === 0) return 0;

  // Calculate based on quantity moved per time unit
  const totalQuantity = transfers.reduce((sum, t) => {
    const transferEntity = asTransferEntity(t);
    return sum + (transferEntity?.pallet?.product_qty || 1);
  }, 0);
  const avgTime = 15; // Simplified average time

  return totalQuantity / (transfers.length * avgTime);
}

function calculateGRNEfficiency(grnRecords: DatabaseEntity[]): number {
  if (grnRecords.length === 0) return 0;

  const totalWeight = grnRecords.reduce((sum, g) => {
    const grnEntity = asGRNEntity(g);
    return sum + (grnEntity?.gross_weight || 0);
  }, 0);
  const avgProcessTime = 45; // Simplified

  return totalWeight / (grnRecords.length * avgProcessTime);
}

function calculateOperationReliability(history: DatabaseEntity[]): number {
  if (history.length === 0) return 0;

  const successfulOps = history.filter(h => {
    const historyEntity = asHistoryEntity(h);
    return (
      historyEntity?.action &&
      !historyEntity.action.includes('error') &&
      !historyEntity.action.includes('fail')
    );
  }).length;

  return (successfulOps / history.length) * 100;
}

function calculateLocationPerformance(transfers: DatabaseEntity[]): Record<string, unknown>[] {
  const locationMap = new Map<string, { count: number; efficiency: number }>();

  transfers.forEach(transfer => {
    const transferEntity = asTransferEntity(transfer);
    const location = transferEntity?.t_loc || 'Unknown';
    const current = locationMap.get(location) || { count: 0, efficiency: 0 };
    locationMap.set(location, {
      count: current.count + 1,
      efficiency: current.efficiency + 1, // Simplified efficiency calculation
    });
  });

  return Array.from(locationMap.entries()).map(([location, data]) => ({
    location,
    transferCount: data.count,
    efficiency: Math.round((data.efficiency / data.count) * 100) / 100,
  }));
}

function calculatePeakOperationHours(
  transfers: DatabaseEntity[],
  grnRecords: DatabaseEntity[]
): number[] {
  const hourCounts = new Map<number, number>();

  [...transfers, ...grnRecords].forEach(record => {
    // Try as transfer first, then as GRN
    const transferEntity = asTransferEntity(record);
    const grnEntity = asGRNEntity(record);
    const date = new Date(
      transferEntity?.tran_date || grnEntity?.creat_time || grnEntity?.created_at || new Date()
    );
    const hour = date.getHours();
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
  });

  return Array.from(hourCounts.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([hour]) => hour);
}

function identifyOperationBottlenecks(
  transfers: DatabaseEntity[],
  grnRecords: DatabaseEntity[],
  history: DatabaseEntity[]
): string[] {
  const bottlenecks: string[] = [];

  // Check for high error rates
  const errorRate =
    history.filter(h => {
      const historyEntity = asHistoryEntity(h);
      return historyEntity?.action?.includes('error');
    }).length / history.length;
  if (errorRate > 0.1) bottlenecks.push('High error rate detected');

  // Check for slow transfers
  const avgTransferTime = 15; // Simplified
  if (avgTransferTime > 20) bottlenecks.push('Slow transfer operations');

  // Check for GRN processing delays
  const avgGRNTime = 45; // Simplified
  if (avgGRNTime > 60) bottlenecks.push('GRN processing delays');

  return bottlenecks;
}

function generateOperationRecommendations(
  transferEff: number,
  grnEff: number,
  reliability: number
): string[] {
  const recommendations: string[] = [];

  if (transferEff < 0.5) recommendations.push('Optimize transfer procedures');
  if (grnEff < 0.3) recommendations.push('Streamline GRN processing');
  if (reliability < 90) recommendations.push('Improve operation reliability');

  return recommendations;
}

function generatePerformanceInsights(
  efficiency: number,
  quality: number,
  productivity: number
): string[] {
  const insights: string[] = [];

  if (efficiency > 80) insights.push('System operating at high efficiency');
  if (quality > 90) insights.push('Excellent quality standards maintained');
  if (productivity > 70) insights.push('Strong productivity performance');

  if (efficiency < 60) insights.push('Efficiency improvements needed');
  if (quality < 70) insights.push('Quality issues require attention');
  if (productivity < 50) insights.push('Productivity enhancement required');

  return insights;
}

function generateOverallRecommendations(
  userMetrics: Record<string, unknown>,
  systemMetrics: Record<string, unknown>,
  operationMetrics: Record<string, unknown>
): string[] {
  const recommendations: string[] = [];

  if ((userMetrics.efficiency as number) < 70)
    recommendations.push('Provide additional user training');
  if ((systemMetrics.resourceUtilization as number) < 60)
    recommendations.push('Optimize resource allocation');
  if ((operationMetrics.transferEfficiency as number) < 0.4)
    recommendations.push('Review transfer workflows');

  return recommendations;
}

/**
 * DataLoader for Inventory Ordered Analysis
 * Replaces the rpc_get_inventory_ordered_analysis RPC function with optimized GraphQL queries
 * Combines inventory, orders, and product data for comprehensive stock analysis
 */
export function createInventoryOrderedAnalysisLoader(
  supabase: SupabaseClient
): DataLoader<InventoryOrderedAnalysisKey, InventoryOrderedAnalysisResult | null> {
  return createBatchLoader<InventoryOrderedAnalysisKey, InventoryOrderedAnalysisResult | null>(
    async (keys: readonly InventoryOrderedAnalysisKey[]) => {
      const results = await Promise.all(
        keys.map(async key => {
          try {
            // Execute parallel queries to collect all required data
            const [inventoryData, orderData, productData] = await Promise.all([
              // Aggregate inventory by product code (equivalent to inventory_summary CTE)
              supabase
                .from('record_inventory')
                .select(
                  `
                  product_code,
                  injection,
                  pipeline,
                  prebook,
                  await,
                  fold,
                  bulk,
                  backcarpark,
                  damage,
                  await_grn,
                  latest_update
                `
                )
                .not('product_code', 'is', null)
                .neq('product_code', ''),

              // Order data (equivalent to order_summary CTE)
              supabase
                .from('data_order')
                .select(
                  `
                  product_code,
                  product_qty,
                  loaded_qty
                `
                )
                .not('product_code', 'is', null)
                .neq('product_code', ''),

              // Product master data
              supabase.from('data_code').select(`
                  code,
                  description,
                  type,
                  standard_qty
                `),
            ]);

            // Handle potential errors
            if (inventoryData.error) {
              console.error(
                '[InventoryOrderedAnalysisLoader] Inventory data error:',
                inventoryData.error
              );
              return null;
            }
            if (orderData.error) {
              console.error('[InventoryOrderedAnalysisLoader] Order data error:', orderData.error);
            }
            if (productData.error) {
              console.error(
                '[InventoryOrderedAnalysisLoader] Product data error:',
                productData.error
              );
            }

            // Process the data to replicate RPC logic
            const analysis = processInventoryOrderedAnalysis(
              inventoryData.data || [],
              orderData.data || [],
              productData.data || [],
              key
            );

            return {
              success: true,
              summary: analysis.summary,
              data: analysis.data,
              generated_at: new Date().toISOString(),
              dataSource: 'inventory_ordered_analysis',
              refreshInterval: 300000, // 5 minutes for complex analysis
              lastUpdated: new Date().toISOString(),
            };
          } catch (error) {
            console.error('[InventoryOrderedAnalysisLoader] Error:', error);
            return null;
          }
        })
      );

      return results;
    }
  );
}

/**
 * Process inventory ordered analysis data to replicate RPC function logic
 */
function processInventoryOrderedAnalysis(
  inventoryData: DatabaseEntity[],
  orderData: DatabaseEntity[],
  productData: DatabaseEntity[],
  key: InventoryOrderedAnalysisKey
): Record<string, unknown> {
  // Create lookup maps for efficient data joining
  const productMap = new Map<string, DatabaseEntity>(
    productData.map(p => [safeString(p, 'code', ''), p])
  );

  // Aggregate inventory by product code (inventory_summary CTE equivalent)
  const inventorySummary = new Map<
    string,
    {
      product_code: string;
      total_inventory: number;
      qty_injection: number;
      qty_pipeline: number;
      qty_prebook: number;
      qty_await: number;
      qty_fold: number;
      qty_bulk: number;
      qty_backcarpark: number;
      qty_damage: number;
      qty_await_grn: number;
      last_inventory_update: string | null;
    }
  >();
  inventoryData.forEach(inv => {
    const invEntity = asInventoryEntity(inv);
    const current = inventorySummary.get(invEntity?.product_code || '') || {
      product_code: invEntity?.product_code || '',
      total_inventory: 0,
      qty_injection: 0,
      qty_pipeline: 0,
      qty_prebook: 0,
      qty_await: 0,
      qty_fold: 0,
      qty_bulk: 0,
      qty_backcarpark: 0,
      qty_damage: 0,
      qty_await_grn: 0,
      last_inventory_update: null,
    };

    // Aggregate quantities
    const injection = invEntity?.injection || 0;
    const pipeline = safeNumber(inv, 'pipeline', 0);
    const prebook = safeNumber(inv, 'prebook', 0);
    const await_qty = safeNumber(inv, 'await', 0);
    const fold = safeNumber(inv, 'fold', 0);
    const bulk = safeNumber(inv, 'bulk', 0);
    const backcarpark = safeNumber(inv, 'backcarpark', 0);
    const damage = safeNumber(inv, 'damage', 0);
    const await_grn = safeNumber(inv, 'await_grn', 0);

    current.total_inventory +=
      injection + pipeline + prebook + await_qty + fold + bulk + backcarpark + damage + await_grn;
    current.qty_injection += injection;
    current.qty_pipeline += pipeline;
    current.qty_prebook += prebook;
    current.qty_await += await_qty;
    current.qty_fold += fold;
    current.qty_bulk += bulk;
    current.qty_backcarpark += backcarpark;
    current.qty_damage += damage;
    current.qty_await_grn += await_grn;

    const latestUpdate = safeString(inv, 'latest_update', '');
    if (
      !current.last_inventory_update ||
      new Date(latestUpdate) > new Date(current.last_inventory_update)
    ) {
      current.last_inventory_update = latestUpdate;
    }

    inventorySummary.set(invEntity?.product_code || '', current);
  });

  // Aggregate orders by product code (order_summary CTE equivalent)
  const orderSummary = new Map<
    string,
    {
      product_code: string;
      total_orders: number;
      total_outstanding_qty: number;
      total_ordered_qty: number;
      total_loaded_qty: number;
    }
  >();
  orderData.forEach(order => {
    const orderEntity = asOrderEntity(order);
    const current = orderSummary.get(orderEntity?.product_code || '') || {
      product_code: orderEntity?.product_code || '',
      total_orders: 0,
      total_outstanding_qty: 0,
      total_ordered_qty: 0,
      total_loaded_qty: 0,
    };

    current.total_orders += 1;
    current.total_ordered_qty += orderEntity?.product_qty || 0;

    const loadedQtyRaw = orderEntity?.loaded_qty || '0';
    const loadedQty = parseFloat(String(loadedQtyRaw)) || 0;
    current.total_loaded_qty += loadedQty;

    // Calculate outstanding quantity
    const productQty = orderEntity?.product_qty || 0;
    const loadedQtyStr = String(orderEntity?.loaded_qty || '');
    if (!loadedQtyStr || loadedQtyStr === '' || loadedQtyStr === '0') {
      current.total_outstanding_qty += productQty;
    } else if (loadedQty < productQty) {
      current.total_outstanding_qty += productQty - loadedQty;
    }

    orderSummary.set(orderEntity?.product_code || '', current);
  });

  // Combine and analyze data (analysis CTE equivalent)
  const analysisData: Record<string, unknown>[] = [];
  const allProductCodes = new Set([
    ...Array.from(inventorySummary.keys()),
    ...Array.from(orderSummary.keys()),
  ]);

  allProductCodes.forEach(productCode => {
    const inventory = inventorySummary.get(productCode);
    const orders = orderSummary.get(productCode);
    const product = productMap.get(productCode);

    // Apply product type filter if specified
    const productEntity = asProductEntity(product);
    if (key.productType && productEntity?.type !== key.productType) {
      return;
    }

    // Apply product codes filter if specified
    if (
      key.productCodes &&
      key.productCodes.length > 0 &&
      !key.productCodes.includes(productCode)
    ) {
      return;
    }

    const totalInventory = inventory?.total_inventory || 0;
    const totalOutstandingQty = orders?.total_outstanding_qty || 0;
    const totalOrderedQty = orders?.total_ordered_qty || 0;
    const totalLoadedQty = orders?.total_loaded_qty || 0;

    // Skip products with no inventory and no orders
    if (totalInventory === 0 && totalOutstandingQty === 0) {
      return;
    }

    // Calculate analysis metrics
    const fulfillmentRate =
      totalOutstandingQty === 0
        ? 100
        : Math.round((totalInventory / totalOutstandingQty) * 100 * 100) / 100;

    const inventoryGap = totalInventory - totalOutstandingQty;

    // Status classification
    let status: string;
    if (totalInventory === 0 && totalOutstandingQty > 0) {
      status = 'Out of Stock';
    } else if (totalInventory >= totalOutstandingQty) {
      status = 'Sufficient';
    } else if (totalInventory > 0 && totalInventory < totalOutstandingQty) {
      status = 'Insufficient';
    } else {
      status = 'No Orders';
    }

    // Apply status filter if specified
    if (key.filterStatus && status !== key.filterStatus) {
      return;
    }

    const analysisItem = {
      product_code: productCode,
      product_description: productEntity?.description || '',
      product_type: productEntity?.type || '',
      standard_qty: productEntity?.standard_qty || 0,
      inventory: {
        total: totalInventory,
        locations: key.includeLocationBreakdown
          ? {
              injection: inventory?.qty_injection || 0,
              pipeline: inventory?.qty_pipeline || 0,
              prebook: inventory?.qty_prebook || 0,
              await: inventory?.qty_await || 0,
              fold: inventory?.qty_fold || 0,
              bulk: inventory?.qty_bulk || 0,
              backcarpark: inventory?.qty_backcarpark || 0,
              damage: inventory?.qty_damage || 0,
              await_grn: inventory?.qty_await_grn || 0,
            }
          : undefined,
        last_update: inventory?.last_inventory_update || null,
      },
      orders: {
        total_orders: orders?.total_orders || 0,
        total_ordered_qty: totalOrderedQty,
        total_loaded_qty: totalLoadedQty,
        total_outstanding_qty: totalOutstandingQty,
      },
      analysis: {
        fulfillment_rate: fulfillmentRate,
        inventory_gap: inventoryGap,
        status: status,
      },
    };

    analysisData.push(analysisItem);
  });

  // Sort data according to key specifications
  analysisData.sort((a, b) => {
    const sortBy = key.sortBy || 'status';
    const sortOrder = key.sortOrder || 'asc';

    let compareValue = 0;

    switch (sortBy) {
      case 'status':
        const statusOrder = { 'Out of Stock': 1, Insufficient: 2, Sufficient: 3, 'No Orders': 4 };
        const aStatus = safeAnalysisAccess(a, 'status') as string;
        const bStatus = safeAnalysisAccess(b, 'status') as string;
        compareValue =
          (statusOrder[aStatus as keyof typeof statusOrder] || 5) -
          (statusOrder[bStatus as keyof typeof statusOrder] || 5);
        // Secondary sort by inventory_gap ASC for same status
        if (compareValue === 0) {
          const aGap = Number(safeAnalysisAccess(a, 'inventory_gap') || 0);
          const bGap = Number(safeAnalysisAccess(b, 'inventory_gap') || 0);
          compareValue = aGap - bGap;
        }
        break;
      case 'fulfillment_rate':
        const aRate = Number(safeAnalysisAccess(a, 'fulfillment_rate') || 0);
        const bRate = Number(safeAnalysisAccess(b, 'fulfillment_rate') || 0);
        compareValue = aRate - bRate;
        break;
      case 'inventory_gap':
        const aInvGap = Number(safeAnalysisAccess(a, 'inventory_gap') || 0);
        const bInvGap = Number(safeAnalysisAccess(b, 'inventory_gap') || 0);
        compareValue = aInvGap - bInvGap;
        break;
      case 'product_code':
        const aCode = safeString(a, 'product_code', '');
        const bCode = safeString(b, 'product_code', '');
        compareValue = aCode.localeCompare(bCode);
        break;
      default:
        compareValue = 0;
    }

    return sortOrder === 'desc' ? -compareValue : compareValue;
  });

  // Calculate summary statistics
  const summary = {
    total_products: analysisData.length,
    total_inventory_value: analysisData.reduce(
      (sum, item) => sum + safeNumber(safeGet(item, 'inventory', {}), 'total', 0),
      0
    ),
    total_outstanding_orders_value: analysisData.reduce(
      (sum, item) => sum + safeNumber(safeGet(item, 'orders', {}), 'total_outstanding_qty', 0),
      0
    ),
    overall_fulfillment_rate: (() => {
      const totalOutstanding = analysisData.reduce(
        (sum, item) => sum + safeNumber(safeGet(item, 'orders', {}), 'total_outstanding_qty', 0),
        0
      );
      const totalInventory = analysisData.reduce(
        (sum, item) => sum + safeNumber(safeGet(item, 'inventory', {}), 'total', 0),
        0
      );
      return totalOutstanding === 0
        ? 100
        : Math.round((totalInventory / totalOutstanding) * 100 * 100) / 100;
    })(),
    products_sufficient: analysisData.filter(
      item => safeAnalysisAccess(item, 'status') === 'Sufficient'
    ).length,
    products_insufficient: analysisData.filter(
      item => safeAnalysisAccess(item, 'status') === 'Insufficient'
    ).length,
    products_out_of_stock: analysisData.filter(
      item => safeAnalysisAccess(item, 'status') === 'Out of Stock'
    ).length,
    products_no_orders: analysisData.filter(
      item => safeAnalysisAccess(item, 'status') === 'No Orders'
    ).length,
  };

  return {
    summary,
    data: analysisData as unknown[],
  };
}

/**
 * DataLoader for HistoryTree - System Operations History with Hierarchical Structure
 * Combines record_history with user info (data_id) and pallet info (record_palletinfo)
 * Supports filtering, sorting, and pagination for large datasets
 */
export function createHistoryTreeLoader(
  supabase: SupabaseClient
): DataLoader<HistoryTreeKey, HistoryTreeResult | null> {
  return createBatchLoader<HistoryTreeKey, HistoryTreeResult | null>(
    async (keys: readonly HistoryTreeKey[]) => {
      // Process each key individually due to complexity of different filter combinations
      const results = await Promise.all(
        keys.map(async key => {
          try {
            // Base query with JOINs to get user and pallet information
            let query = supabase.from('record_history').select(`
                uuid,
                time,
                action,
                remark,
                loc,
                user:data_id(
                  id,
                  name,
                  department,
                  position,
                  email
                ),
                pallet:record_palletinfo(
                  plt_num,
                  series,
                  product_qty,
                  generate_time,
                  product:data_code(
                    code,
                    description,
                    type,
                    colour,
                    standard_qty
                  )
                )
              `);

            // Apply filters based on key parameters
            if (key.dateRange) {
              query = query.gte('time', key.dateRange.start).lte('time', key.dateRange.end);
            }

            if (key.actionTypes && key.actionTypes.length > 0) {
              query = query.in('action', key.actionTypes);
            }

            if (key.userIds && key.userIds.length > 0) {
              query = query.in('id', key.userIds);
            }

            if (key.palletNumbers && key.palletNumbers.length > 0) {
              query = query.in('plt_num', key.palletNumbers);
            }

            if (key.locations && key.locations.length > 0) {
              query = query.in('loc', key.locations);
            }

            // Apply sorting
            const sortBy = key.sortBy || 'time';
            const sortOrder = key.sortOrder || 'desc';

            switch (sortBy) {
              case 'time':
                query = query.order('time', { ascending: sortOrder === 'asc' });
                break;
              case 'action':
                query = query.order('action', { ascending: sortOrder === 'asc' });
                break;
              case 'user':
                // Sort by user ID as proxy for user name (since we can't directly sort by joined field)
                query = query.order('id', { ascending: sortOrder === 'asc' });
                break;
              case 'location':
                query = query.order('loc', { ascending: sortOrder === 'asc' });
                break;
              default:
                query = query.order('time', { ascending: false });
            }

            // Apply pagination
            const limit = key.limit || 50; // Default to 50 records
            const offset = key.offset || 0;

            query = query.range(offset, offset + limit - 1);

            const { data: historyData, error, count } = await query;

            if (error) {
              console.error('[HistoryTreeLoader] Database error:', error);
              throw new Error(`Failed to fetch history data: ${error.message}`);
            }

            if (!historyData) {
              return {
                entries: [],
                totalCount: 0,
                hasNextPage: false,
                groupedData: {},
              };
            }

            // Process and transform the data
            const processedEntries = historyData.map((entry: DatabaseEntity) => {
              const historyEntry = asHistoryEntity(entry);
              const userInfo = safeGet(entry, 'user', null);

              return {
                id: safeString(entry, 'uuid', ''),
                timestamp: historyEntry?.time || '',
                action: historyEntry?.action || 'Unknown',
                location: historyEntry?.loc || null,
                remark: historyEntry?.remark || null,
                user: userInfo
                  ? {
                      id: safeString(userInfo, 'id', ''),
                      name: safeString(userInfo, 'name', 'Unknown User'),
                      department: safeString(userInfo, 'department', '') || null,
                      position: safeString(userInfo, 'position', 'User'),
                      email: safeString(userInfo, 'email', '') || null,
                    }
                  : null,
                pallet: (() => {
                  const palletInfo = safeGet(entry, 'pallet', null);
                  if (!palletInfo) return null;

                  const productInfo = safeGet(palletInfo, 'product', null);
                  return {
                    number: safeString(palletInfo, 'plt_num', ''),
                    series: safeString(palletInfo, 'series', '') || null,
                    quantity: safeNumber(palletInfo, 'product_qty', 0),
                    generatedAt: safeString(palletInfo, 'generate_time', ''),
                    product: productInfo
                      ? {
                          code: safeString(productInfo, 'code', ''),
                          description: safeString(productInfo, 'description', ''),
                          type: safeString(productInfo, 'type', '-'),
                          colour: safeString(productInfo, 'colour', 'Black'),
                          standardQty: safeNumber(productInfo, 'standard_qty', 1),
                        }
                      : null,
                  };
                })(),
              };
            });

            // Group data if groupBy is specified
            let groupedData: Record<string, unknown[]> = {};
            if (key.groupBy) {
              groupedData = processedEntries.reduce(
                (groups: Record<string, unknown[]>, entry) => {
                  let groupKey: string;

                  switch (key.groupBy) {
                    case 'time':
                      // Group by date (YYYY-MM-DD)
                      groupKey = new Date(entry.timestamp).toISOString().split('T')[0];
                      break;
                    case 'user':
                      groupKey = entry.user?.name || 'Unknown User';
                      break;
                    case 'action':
                      groupKey = entry.action;
                      break;
                    case 'location':
                      groupKey = entry.location || 'No Location';
                      break;
                    default:
                      groupKey = 'All';
                  }

                  if (!groups[groupKey]) {
                    groups[groupKey] = [];
                  }
                  groups[groupKey].push(entry);
                  return groups;
                },
                {} as Record<string, unknown[]>
              );
            }

            // Calculate pagination info
            const hasNextPage = offset + limit < (count || processedEntries.length);

            return {
              entries: processedEntries,
              totalCount: count || processedEntries.length,
              hasNextPage,
              groupedData,
              limit,
              offset,
              filters: {
                dateRange: key.dateRange,
                actionTypes: key.actionTypes,
                userIds: key.userIds,
                palletNumbers: key.palletNumbers,
                locations: key.locations,
              },
              sort: {
                sortBy: sortBy,
                sortOrder: sortOrder,
              },
            };
          } catch (error) {
            console.error('[HistoryTreeLoader] Error processing key:', key, error);
            throw new Error(`HistoryTree loader failed: ${(error as Error).message}`);
          }
        })
      );

      return results;
    },
    {
      // Cache results for 5 minutes since history data doesn't change frequently
      maxBatchSize: 10, // Limit batch size due to complexity
    }
  );
}

/**
 * DataLoader for top products by quantity
 * Aggregates inventory data to find products with highest quantities
 */
export function createTopProductsLoader(
  supabase: SupabaseClient
): DataLoader<TopProductsKey, TopProductsResult | null> {
  return createBatchLoader<TopProductsKey, TopProductsResult | null>(
    async (keys: readonly TopProductsKey[]) => {
      const results = await Promise.all(
        keys.map(async key => {
          try {
            const {
              productType,
              productCodes,
              limit = 10,
              sortOrder = 'desc',
              includeInactive = false,
              locationFilter = [],
            } = key;

            // Base query to aggregate inventory quantities
            let query = supabase.from('record_inventory').select(`
                product_code,
                injection,
                pipeline,
                prebook,
                await,
                fold,
                bulk,
                backcarpark,
                damage,
                await_grn,
                product:data_code!record_inventory_product_code_fkey (
                  code,
                  description,
                  type,
                  colour,
                  standard_qty
                )
              `);

            // Apply product type filter
            if (productType) {
              query = query.eq('product.type', productType);
            }

            // Apply product codes filter
            if (productCodes && productCodes.length > 0) {
              query = query.in('product_code', productCodes);
            }

            // Execute query
            const { data: inventoryData, error } = await query;

            if (error) {
              console.error('[TopProductsLoader] Query error:', error);
              throw new Error(`Failed to fetch inventory data: ${error.message}`);
            }

            if (!inventoryData || inventoryData.length === 0) {
              return {
                products: [],
                totalCount: 0,
                lastUpdated: new Date().toISOString(),
                dataSource: 'top_products_by_quantity',
              };
            }

            // Process and aggregate data
            const productMap = new Map<
              string,
              {
                productCode: string;
                productName: string;
                productType: string;
                colour: string;
                standardQty: number;
                totalQuantity: number;
                locationQuantities: Record<string, number>;
                lastUpdated: string;
              }
            >();

            inventoryData.forEach((item: DatabaseEntity) => {
              const itemEntity = asProductEntity(item);
              const productCode = itemEntity?.product_code || '';
              const inventoryItem = item as unknown as InventoryWithRelations;
              const product = inventoryItem.product;

              if (!product) {
                return; // Skip if product data is missing
              }

              // Calculate total quantity across all locations
              let totalQuantity = 0;
              const locationQuantities: Record<string, number> = {};

              // All location fields
              const locations = [
                'injection',
                'pipeline',
                'prebook',
                'await',
                'fold',
                'bulk',
                'backcarpark',
                'damage',
                'await_grn',
              ];

              locations.forEach(location => {
                const qty = getLocationQuantity(
                  item as unknown as InventoryWithRelations,
                  location as InventoryLocation
                );
                locationQuantities[location] = qty;

                // Apply location filter if specified
                if (locationFilter.length === 0 || locationFilter.includes(location)) {
                  totalQuantity += qty;
                }
              });

              // Aggregate by product code
              if (productMap.has(productCode)) {
                const existing = productMap.get(productCode)!;
                existing.totalQuantity += totalQuantity;

                // Merge location quantities
                locations.forEach(location => {
                  existing.locationQuantities[location] =
                    (existing.locationQuantities[location] || 0) + locationQuantities[location];
                });
              } else {
                productMap.set(productCode, {
                  productCode,
                  productName: product.description || productCode,
                  productType: product.type || '-',
                  colour: safeString(safeGet(product, 'colour', 'Black'), 'Black'),
                  standardQty: safeNumber(product, 'standard_qty', 1),
                  totalQuantity,
                  locationQuantities,
                  lastUpdated: new Date().toISOString(),
                });
              }
            });

            // Convert to array and sort
            let productsArray = Array.from(productMap.values());

            // Filter out inactive products if needed
            if (!includeInactive) {
              productsArray = productsArray.filter(product => product.totalQuantity > 0);
            }

            // Sort by total quantity
            productsArray.sort((a, b) => {
              if (sortOrder === 'desc') {
                return b.totalQuantity - a.totalQuantity;
              } else {
                return a.totalQuantity - b.totalQuantity;
              }
            });

            // Apply limit
            const limitedProducts = productsArray.slice(0, limit);

            return {
              products: limitedProducts,
              totalCount: productsArray.length,
              averageQuantity:
                productsArray.length > 0
                  ? productsArray.reduce((sum, p) => sum + p.totalQuantity, 0) /
                    productsArray.length
                  : 0,
              maxQuantity:
                productsArray.length > 0 ? Math.max(...productsArray.map(p => p.totalQuantity)) : 0,
              minQuantity:
                productsArray.length > 0 ? Math.min(...productsArray.map(p => p.totalQuantity)) : 0,
              lastUpdated: new Date().toISOString(),
              dataSource: 'top_products_by_quantity',
              refreshInterval: 300000, // 5 minutes
            };
          } catch (error) {
            console.error('[TopProductsLoader] Error processing key:', key, error);
            throw new Error(`TopProducts loader failed: ${(error as Error).message}`);
          }
        })
      );

      return results;
    },
    {
      // Cache results for 5 minutes since inventory data changes frequently but not constantly
      maxBatchSize: 5, // Reasonable batch size for aggregation queries
    }
  );
}

// Stock Distribution DataLoader
export interface StockDistributionKey {
  type?: string;
  warehouseId?: string;
  limit?: number;
  includeInactive?: boolean;
  groupBy?: 'warehouse' | 'category' | 'supplier';
  includeEmpty?: boolean;
}

export function createStockDistributionLoader(
  supabase: SupabaseClient
): DataLoader<StockDistributionKey, StockDistributionResult | null> {
  return createBatchLoader<StockDistributionKey, StockDistributionResult | null>(
    async (keys: readonly StockDistributionKey[]) => {
      const results = await Promise.all(
        keys.map(async key => {
          try {
            const { type, warehouseId, limit = 50, includeInactive = false } = key;

            console.log('[StockDistributionLoader] Loading data with params:', {
              type,
              warehouseId,
              limit,
              includeInactive,
            });

            // Query latest stock_level data instead of record_inventory
            // First get all stock levels grouped by stock code to get latest update
            const { data: stockData, error: stockError } = await supabase
              .from('stock_level')
              .select(
                `
                stock,
                description,
                stock_level,
                update_time
              `
              )
              .order('update_time', { ascending: false });

            if (stockError) {
              console.error('[StockDistributionLoader] Database query error:', stockError);
              throw new Error(`Stock distribution query failed: ${stockError.message}`);
            }

            // Group by stock to get latest record for each product
            const latestStockMap = new Map<string, DatabaseEntity>();
            (stockData || []).forEach((item: DatabaseEntity) => {
              const stock = safeString(item, 'stock', '');
              const existing = latestStockMap.get(stock);
              if (
                !existing ||
                new Date(safeString(item, 'update_time', '')) >
                  new Date(safeString(existing, 'update_time', ''))
              ) {
                latestStockMap.set(stock, item);
              }
            });

            // Get product codes for type lookup
            const productCodes = Array.from(latestStockMap.keys());

            // Get product types from data_code table
            const { data: typeData, error: typeError } = await supabase
              .from('data_code')
              .select('code, type, colour')
              .in('code', productCodes);

            if (typeError) {
              console.error('[StockDistributionLoader] Type lookup error:', typeError);
            }

            // Create type lookup map
            const productTypeMap = new Map<string, { type: string; colour: string }>();
            (typeData || []).forEach((item: DatabaseEntity) => {
              productTypeMap.set(safeString(item, 'code', ''), {
                type: safeString(item, 'type', 'Unknown'),
                colour: safeString(item, 'colour', ''),
              });
            });

            // Filter by type if specified
            let filteredData = Array.from(latestStockMap.values());
            if (type && type !== 'all') {
              filteredData = filteredData.filter(item => {
                const productInfo = productTypeMap.get(safeString(item, 'stock', ''));
                return productInfo?.type === type;
              });
            }

            const _data = filteredData;

            if (!_data || _data.length === 0) {
              console.log('[StockDistributionLoader] No data found');
              return {
                items: [],
                totalCount: 0,
                totalStock: 0,
                lastUpdated: new Date().toISOString(),
                dataSource: 'stock_distribution',
                refreshInterval: 300000, // 5 minutes
              };
            }

            // No location fields needed - stock_level table has simple stock_level column

            // Aggregate data by grouping criteria (type, location, or product)
            const groupedData = new Map<
              string,
              {
                name: string;
                stock: string;
                stockLevel: number;
                description?: string;
                type?: string;
                productCode?: string;
                percentage: number;
              }
            >();

            let totalStock = 0;

            // Process each stock record
            _data.forEach((item: DatabaseEntity) => {
              const stockLevel = safeNumber(item, 'stock_level');
              const productCode = safeString(item, 'stock', '');
              const productInfo = productTypeMap.get(productCode);
              const productType = productInfo?.type || 'Unknown';

              // Skip products with no stock if inactive products are excluded
              if (!includeInactive && stockLevel === 0) {
                return;
              }

              totalStock += stockLevel;

              // Group by product type for the Treemap
              const groupKey = productType;

              if (groupedData.has(groupKey)) {
                const existing = groupedData.get(groupKey)!;
                existing.stockLevel += stockLevel;
              } else {
                groupedData.set(groupKey, {
                  name: groupKey,
                  stock: groupKey,
                  stockLevel: stockLevel,
                  description: `${groupKey} products`,
                  type: groupKey,
                  percentage: 0, // Will calculate after totals are known
                });
              }
            });

            // Calculate percentages and convert to array
            let itemsArray = Array.from(groupedData.values());

            // Calculate percentages
            itemsArray.forEach(item => {
              item.percentage = totalStock > 0 ? (item.stockLevel / totalStock) * 100 : 0;
            });

            // Sort by stock level (descending)
            itemsArray.sort((a, b) => b.stockLevel - a.stockLevel);

            // Apply limit
            if (limit > 0 && itemsArray.length > limit) {
              // Keep top items and group the rest as "Others"
              const topItems = itemsArray.slice(0, limit - 1);
              const othersItems = itemsArray.slice(limit - 1);

              if (othersItems.length > 0) {
                const othersStock = othersItems.reduce((sum, item) => sum + item.stockLevel, 0);
                const othersPercentage = totalStock > 0 ? (othersStock / totalStock) * 100 : 0;

                topItems.push({
                  name: 'Others',
                  stock: 'Others',
                  stockLevel: othersStock,
                  description: `${othersItems.length} other product types`,
                  type: 'Others',
                  percentage: othersPercentage,
                });
              }

              itemsArray = topItems;
            }

            console.log(
              `[StockDistributionLoader] Processed ${_data.length} stock level records into ${itemsArray.length} distribution items`
            );

            return {
              items: itemsArray,
              totalCount: itemsArray.length,
              totalStock,
              lastUpdated: new Date().toISOString(),
              dataSource: 'stock_distribution',
              refreshInterval: 300000, // 5 minutes
            };
          } catch (error) {
            console.error('[StockDistributionLoader] Processing error:', error);
            throw new Error(`Stock distribution processing failed: ${(error as Error).message}`);
          }
        })
      );

      return results;
    },
    {
      // Cache results for 5 minutes - stock distribution changes moderately
      maxBatchSize: 3, // Conservative batch size for complex aggregation queries
    }
  );
}

/**
 * Transfer Details Loader with Single Query optimization
 *
 * This loader implements the Single Query pattern to solve the N+1 problem
 * by using field resolvers to fetch pallet data on demand.
 *
 * Performance improvement: Avoids N+1 queries by using field-level optimization
 */
export function createTransferDetailsLoader(supabase: SupabaseClient) {
  return createBatchLoader(
    async (transferIds: readonly string[]) => {
      console.log(`[TransferDetailsLoader] Loading ${transferIds.length} transfer details`);

      try {
        // Fetch transfers - pallet data will be loaded via field resolver for optimization
        const { data, error } = await supabase
          .from('stock_transfers')
          .select('*')
          .in('id', transferIds as string[])
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[TransferDetailsLoader] Database error:', error);
          throw new Error(`Failed to load transfer details: ${error.message}`);
        }

        if (!data) {
          console.warn('[TransferDetailsLoader] No data returned');
          return transferIds.map(() => null);
        }

        console.log(`[TransferDetailsLoader] Successfully loaded ${data.length} transfer records`);

        // Transform the data to match GraphQL schema and create a map for efficient lookup
        const transferMap = new Map<string, TransferEntity>();

        data.forEach((transfer: DatabaseEntity) => {
          const transformedTransfer = {
            ...transfer,
            id: safeString(transfer.id, ''),
            productCode: safeString(transfer.product_code, ''),
            productDesc: safeString(transfer.product_desc, ''),
            fromLocation: safeString(transfer.from_location, ''),
            toLocation: safeString(transfer.to_location, ''),
            createdBy: safeString(transfer.created_by, ''),
            createdAt: safeString(transfer.created_at, ''),
            completedAt: safeString(transfer.completed_at, ''),
            pallet: null, // Will be loaded via field resolver
          };

          transferMap.set(String(transfer.id), transformedTransfer as TransferEntity);
        });

        // Return results in the same order as requested IDs
        return transferIds.map(id => transferMap.get(id) || null);
      } catch (error) {
        console.error('[TransferDetailsLoader] Processing error:', error);
        throw new Error(`Transfer details processing failed: ${(error as Error).message}`);
      }
    },
    {
      // Cache results for 10 minutes - transfer details don't change frequently once created
      maxBatchSize: 50, // Allow larger batches since we're using field-level optimization
    }
  );
}
