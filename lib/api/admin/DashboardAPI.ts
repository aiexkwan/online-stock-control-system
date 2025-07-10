/**
 * Admin Dashboard API
 * Demonstrates server-side strategy for complex aggregations
 */

import { DataAccessLayer } from '../core/DataAccessStrategy';
import { isNotProduction } from '@/lib/utils/env';

// Dashboard widget types
export interface DashboardWidgetData {
  widgetId: string;
  title: string;
  data: any;
  lastUpdated: string;
}

export interface DashboardParams {
  widgetIds: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  warehouse?: string;
  params?: {
    dataSource?: string;
    staticValue?: number | string;
    label?: string;
    productCodes?: string[];
    productType?: string;
    palletNum?: string;
    timeSegments?: number;
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
    orderRef?: number;
    tableName?: string;
    fieldName?: string;
    stockType?: string;
    grnRef?: string;
    materialCode?: string;
    metric?: 'pallet_count' | 'quantity_sum';
    department?: string;
  };
}

export interface DashboardResult {
  widgets: DashboardWidgetData[];
  metadata: {
    generatedAt: string;
    cacheHit: boolean;
    processingTime: number;
  };
}

// All widgets now use RPC functions through DashboardAPI for optimal performance

export class DashboardAPI extends DataAccessLayer<DashboardParams, DashboardResult> {
  constructor() {
    super('admin-dashboard');
  }
  
  /**
   * Server-side implementation using GraphQL for complex aggregations
   * Uses React cache() for automatic request deduplication
   */
  async serverFetch(params: DashboardParams): Promise<DashboardResult> {
    // Use client import for compatibility with client components
    const { createClient } = await import('@/app/utils/supabase/client');
    const supabase = createClient();
    
    const startTime = performance.now();
    const widgets: DashboardWidgetData[] = [];
    
    // Fetch data for each requested widget in parallel
    const widgetPromises = params.widgetIds.map(async (widgetId) => {
      try {
        const widgetData = await this.fetchWidgetData(widgetId, params, supabase);
        return {
          widgetId,
          title: this.getWidgetTitle(widgetId),
          data: widgetData,
          lastUpdated: new Date().toISOString()
        };
      } catch (error) {
        console.error(`Failed to fetch widget ${widgetId}:`, error);
        return {
          widgetId,
          title: this.getWidgetTitle(widgetId),
          data: { error: 'Failed to load widget data' },
          lastUpdated: new Date().toISOString()
        };
      }
    });
    
    const widgetResults = await Promise.all(widgetPromises);
    widgets.push(...widgetResults);
    
    const processingTime = performance.now() - startTime;
    
    return {
      widgets,
      metadata: {
        generatedAt: new Date().toISOString(),
        cacheHit: false,
        processingTime
      }
    };
  }
  
  /**
   * Client-side implementation - not recommended for dashboard
   * Falls back to REST API with limited aggregation capabilities
   */
  async clientFetch(params: DashboardParams): Promise<DashboardResult> {
    const queryParams = new URLSearchParams({
      widgets: params.widgetIds.join(','),
      ...(params.warehouse && { warehouse: params.warehouse }),
      ...(params.dateRange && {
        startDate: params.dateRange.start,
        endDate: params.dateRange.end
      })
    });
    
    const response = await fetch(`/api/admin/dashboard?${queryParams}`, {
      cache: 'no-store' // Dashboard data should be fresh
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard data');
    }
    
    return response.json();
  }
  
  /**
   * Dashboard queries are always complex - prefer server-side
   */
  protected isComplexQuery(): boolean {
    return true;
  }
  
  /**
   * Fetch data for specific widget
   */
  private async fetchWidgetData(widgetId: string, params: DashboardParams, supabase?: any): Promise<any> {
    // All widgets go through fetchStatsCardData
    // Either use provided dataSource or the widgetId itself as dataSource
    const dataSource = params.params?.dataSource || widgetId;
    return this.fetchStatsCardData(dataSource, params, supabase);
  }
  
  /**
   * Fetch stats card data using optimized direct queries
   */
  private async fetchStatsCardData(dataSource: string, params: DashboardParams, supabase?: any): Promise<any> {
    if (!supabase) {
      throw new Error('Supabase client is required for fetchStatsCardData');
    }
    
    try {
      switch (dataSource) {
        case 'total_pallets':
          const { count: palletCount } = await supabase
            .from('record_palletinfo')
            .select('*', { count: 'exact', head: true });
          
          return {
            value: palletCount || 0,
            label: 'Total Pallets'
          };
          
        case 'today_transfers':
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const { count: transferCount } = await supabase
            .from('record_transfer')
            .select('*', { count: 'exact', head: true })
            .gte('tran_date', today.toISOString());
          
          return {
            value: transferCount || 0,
            label: "Today's Transfers"
          };
          
        case 'active_products':
          const { count: productCount } = await supabase
            .from('data_code')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');
          
          return {
            value: productCount || 0,
            label: 'Active Products'
          };
          
        case 'pending_orders':
          const { count: orderCount } = await supabase
            .from('data_order')
            .select('*', { count: 'exact', head: true })
            .is('loaded_qty', null);
          
          return {
            value: orderCount || 0,
            label: 'Pending Orders'
          };
          
        case 'await_percentage_stats':
          // Complex calculation using optimized RPC
          const startDate = params.dateRange?.start || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          const endDate = params.dateRange?.end || new Date().toISOString();
          
          const { data: awaitStats, error: awaitError } = await supabase
            .rpc('rpc_get_await_percentage_stats', {
              p_start_date: startDate,
              p_end_date: endDate
            });
          
          if (awaitError) {
            console.error('Error fetching await percentage stats:', awaitError);
            return {
              value: 0,
              label: 'Error loading await stats',
              error: awaitError.message
            };
          }
          
          return {
            value: awaitStats?.percentage || 0,
            label: 'Still In Await %',
            metadata: {
              totalPallets: awaitStats?.total_pallets || 0,
              stillAwait: awaitStats?.still_await || 0,
              calculationTime: awaitStats?.calculation_time,
              dateRange: awaitStats?.date_range,
              optimized: true
            }
          };
          
        case 'await_location_count':
          // Simple await location count using optimized RPC
          const { data: awaitCount, error: awaitCountError } = await supabase
            .rpc('rpc_get_await_location_count');
          
          if (awaitCountError) {
            console.error('Error fetching await location count:', awaitCountError);
            return {
              value: 0,
              label: 'Error loading await count',
              error: awaitCountError.message
            };
          }
          
          return {
            value: awaitCount?.await_count || 0,
            label: 'Await Location Qty',
            metadata: {
              calculationTime: awaitCount?.calculation_time,
              method: awaitCount?.method,
              optimized: awaitCount?.performance?.optimized || true
            }
          };
          
        case 'transfer_count':
          // Transfer count with trend analysis
          const transferStartDate = params.dateRange?.start || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          const transferEndDate = params.dateRange?.end || new Date().toISOString();
          
          // Get transfer count for specified range
          const { count: transferApiCount } = await supabase
            .from('record_transfer')
            .select('*', { count: 'exact', head: true })
            .gte('tran_date', transferStartDate)
            .lte('tran_date', transferEndDate);
          
          // Get today's count for trend comparison (if not already today)
          let trendPercentage = 0;
          const todayDate = new Date();
          const todayStart = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate()).toISOString();
          const todayEnd = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate() + 1).toISOString();
          
          if (transferStartDate !== todayStart) {
            const { count: todayCount } = await supabase
              .from('record_transfer')
              .select('*', { count: 'exact', head: true })
              .gte('tran_date', todayStart)
              .lt('tran_date', todayEnd);
            
            if (todayCount && todayCount > 0) {
              trendPercentage = ((transferApiCount || 0) - todayCount) / todayCount * 100;
            }
          }
          
          return {
            value: transferApiCount || 0,
            label: 'Transfer Done',
            metadata: {
              dateRange: {
                start: transferStartDate,
                end: transferEndDate
              },
              trend: trendPercentage,
              optimized: true
            }
          };
          
        case 'warehouse_work_level':
          // Warehouse work level analysis with optimized JOIN query
          const workStartDate = params.dateRange?.start || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          const workEndDate = params.dateRange?.end || new Date().toISOString();
          
          try {
            // Use RPC function for optimized warehouse work level calculation
            const { data: workLevelData, error: workError } = await supabase
              .rpc('rpc_get_warehouse_work_level', {
                p_start_date: workStartDate,
                p_end_date: workEndDate,
                p_department: 'Warehouse' // Filter by department on server side
              });
            
            if (workError) {
              console.error('Error fetching warehouse work level:', workError);
              throw workError;
            }
            
            return {
              value: workLevelData?.daily_stats || [],
              label: 'Warehouse Work Level',
              metadata: {
                dateRange: {
                  start: workStartDate,
                  end: workEndDate
                },
                totalMoves: workLevelData?.total_moves || 0,
                uniqueOperators: workLevelData?.unique_operators || 0,
                avgMovesPerDay: workLevelData?.avg_moves_per_day || 0,
                peakDay: workLevelData?.peak_day,
                calculationTime: workLevelData?.calculation_time,
                optimized: true
              }
            };
          } catch (error) {
            // Fallback to client-side calculation if RPC fails
            console.warn('RPC failed, falling back to client-side calculation:', error);
            
            // First query work_level data
            const { data: workData, error: workQueryError } = await supabase
              .from('work_level')
              .select('id, move, latest_update')
              .gte('latest_update', workStartDate)
              .lte('latest_update', workEndDate)
              .order('latest_update');
            
            if (workQueryError) {
              throw workQueryError;
            }
            
            if (!workData || workData.length === 0) {
              return {
                value: [],
                label: 'Warehouse Work Level',
                metadata: {
                  dateRange: { start: workStartDate, end: workEndDate },
                  totalMoves: 0,
                  optimized: false,
                  fallback: true
                }
              };
            }
            
            // Get unique operator IDs
            const operatorIds = [...new Set(workData.map((w: any) => w.id).filter((id: any) => id != null))];
            
            // Query operator data
            const { data: operatorData, error: operatorError } = await supabase
              .from('data_id')
              .select('id,name,department')
              .in('id', operatorIds);
              
            if (operatorError) {
              throw operatorError;
            }
            
            // Create operator map and filter for Warehouse department
            const operatorMap = new Map(
              (operatorData || []).map((op: any) => [op.id, op])
            );
            
            const warehouseWork = workData.filter((work: any) => {
              const operator = operatorMap.get(work.id);
              return (operator as any)?.department === 'Warehouse';
            });
            
            // Group by date (simplified version)
            const dateGroups = new Map<string, number>();
            warehouseWork.forEach((work: any) => {
              const date = new Date(work.latest_update).toISOString().split('T')[0];
              dateGroups.set(date, (dateGroups.get(date) || 0) + (work.move || 0));
            });
            
            const dailyStats = Array.from(dateGroups.entries())
              .map(([date, moves]) => ({
                date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                value: moves,
                fullDate: date
              }))
              .sort((a, b) => a.fullDate.localeCompare(b.fullDate));
            
            return {
              value: dailyStats,
              label: 'Warehouse Work Level',
              metadata: {
                dateRange: { start: workStartDate, end: workEndDate },
                totalMoves: warehouseWork.reduce((sum: number, w: any) => sum + (w.move || 0), 0),
                uniqueOperators: new Set(warehouseWork.map((w: any) => w.id)).size,
                optimized: false,
                fallback: true
              }
            };
          }
          
        case 'transfer_time_distribution':
          // Transfer time distribution with server-side time slot calculation
          const distStartDate = params.dateRange?.start || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          const distEndDate = params.dateRange?.end || new Date().toISOString();
          
          try {
            // Use RPC function for optimized time distribution calculation
            const { data: timeDistribution, error: distError } = await supabase
              .rpc('rpc_get_transfer_time_distribution', {
                p_start_date: distStartDate,
                p_end_date: distEndDate,
                p_time_slots: 12 // Always use 12 time slots as per widget requirement
              });
            
            if (distError) {
              console.error('Error fetching transfer time distribution:', distError);
              throw distError;
            }
            
            return {
              value: timeDistribution?.distribution || [],
              label: 'Transfer Time Distribution',
              metadata: {
                dateRange: {
                  start: distStartDate,
                  end: distEndDate
                },
                totalTransfers: timeDistribution?.total_transfers || 0,
                timeSlots: timeDistribution?.time_slots || 12,
                calculationTime: timeDistribution?.calculation_time,
                optimized: true,
                peakHour: timeDistribution?.peak_hour,
                avgPerSlot: timeDistribution?.avg_per_slot
              }
            };
          } catch (error) {
            // Fallback to client-side calculation if RPC fails
            console.warn('RPC failed, falling back to client-side calculation:', error);
            
            const { data: transferData, error: queryError } = await supabase
              .from('record_transfer')
              .select('tran_date')
              .gte('tran_date', distStartDate)
              .lte('tran_date', distEndDate)
              .order('tran_date');
            
            if (queryError) {
              throw queryError;
            }
            
            // Client-side time slot calculation (fallback)
            const startTime = new Date(distStartDate);
            const endTime = new Date(distEndDate);
            const totalHours = Math.max(1, Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)));
            const intervalHours = Math.max(1, Math.floor(totalHours / 12));
            
            const timeSlots = [];
            for (let i = 0; i < 12; i++) {
              const slotStart = new Date(startTime.getTime() + (i * intervalHours * 60 * 60 * 1000));
              const slotEnd = new Date(slotStart.getTime() + (intervalHours * 60 * 60 * 1000));
              
              const count = transferData?.filter((transfer: any) => {
                const transferTime = new Date(transfer.tran_date);
                return transferTime >= slotStart && transferTime < slotEnd;
              }).length || 0;
              
              timeSlots.push({
                time: slotStart.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false 
                }),
                value: count,
                fullTime: slotStart.toISOString()
              });
            }
            
            return {
              value: timeSlots,
              label: 'Transfer Time Distribution',
              metadata: {
                dateRange: {
                  start: distStartDate,
                  end: distEndDate
                },
                totalTransfers: transferData?.length || 0,
                timeSlots: 12,
                optimized: false, // Fallback method
                fallback: true
              }
            };
          }
          
        case 'inventory_ordered_analysis':
          // Inventory ordered analysis with server-side joins and calculations
          const productType = params.params?.productType as string | undefined;
          
          try {
            // Use RPC function for optimized inventory ordered analysis
            const { data: analysisData, error: analysisError } = await supabase
              .rpc('rpc_get_inventory_ordered_analysis', {
                p_product_type: productType || null
              });
            
            if (analysisError) {
              console.error('Error fetching inventory ordered analysis:', analysisError);
              throw analysisError;
            }
            
            return {
              value: analysisData || { products: [], summary: {} },
              label: 'Inventory Ordered Analysis',
              metadata: {
                executedAt: analysisData?.metadata?.executed_at || new Date().toISOString(),
                calculationTime: analysisData?.metadata?.calculation_time,
                optimized: true,
                queryParams: {
                  productType: productType
                }
              }
            };
          } catch (error) {
            // Fallback to client-side calculation if RPC fails
            console.warn('RPC failed for inventory ordered analysis:', error);
            
            // This is complex multi-table join, don't implement fallback
            throw new Error('Inventory ordered analysis requires server-side calculation');
          }
          
        case 'pallet_reprint':
          // Pallet reprint information lookup with product details
          const palletNum = params.params?.palletNum;
          
          if (!palletNum) {
            throw new Error('Pallet number is required for reprint lookup');
          }
          
          try {
            const { data: palletData, error: palletError } = await supabase
              .rpc('rpc_get_pallet_reprint_info', {
                p_pallet_num: palletNum
              });
              
            if (palletError) {
              console.error('Error fetching pallet reprint info:', palletError);
              throw palletError;
            }
            
            if (!palletData || palletData.length === 0) {
              return {
                value: null,
                label: 'Pallet Not Found',
                error: `Pallet number ${palletNum} not found in system`
              };
            }
            
            const pallet = palletData[0];
            
            return {
              value: pallet,
              label: 'Pallet Information',
              metadata: {
                palletNumber: pallet.plt_num,
                productCode: pallet.product_code,
                productDescription: pallet.product_description,
                quantity: pallet.product_qty,
                hasPDF: !!pallet.pdf_url,
                generatedTime: pallet.generate_time,
                optimized: true
              }
            };
            
          } catch (error) {
            console.error('Error in pallet reprint lookup:', error);
            return {
              value: null,
              label: 'Lookup Error',
              error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
          }
          
        case 'stock_level_history':
          // Stock level history with server-side time segmentation
          const historyProductCodes = params.params?.productCodes as string[] | undefined;
          const historyStartDate = params.dateRange?.start || params.params?.startDate as string | undefined;
          const historyEndDate = params.dateRange?.end || params.params?.endDate as string | undefined;
          const timeSegments = params.params?.timeSegments as number | undefined || 24;
          
          if (!historyProductCodes || historyProductCodes.length === 0) {
            return {
              value: [],
              label: 'Stock Level History',
              metadata: {
                productCount: 0,
                message: 'No product codes provided'
              }
            };
          }
          
          try {
            // Use RPC function for optimized stock level history calculation
            const { data: historyData, error: historyError } = await supabase
              .rpc('rpc_get_stock_level_history', {
                p_product_codes: historyProductCodes.slice(0, 10), // Limit to 10 products
                p_start_date: historyStartDate || null,
                p_end_date: historyEndDate || null,
                p_time_segments: timeSegments
              });
            
            if (historyError) {
              console.error('Error fetching stock level history:', historyError);
              throw historyError;
            }
            
            if (!historyData || historyData.length === 0) {
              return {
                value: [],
                label: 'Stock Level History',
                metadata: {
                  productCodes: historyProductCodes,
                  dateRange: { start: historyStartDate, end: historyEndDate },
                  message: 'No data found for the specified period'
                }
              };
            }
            
            // 分離元數據和實際數據
            const metadataEntry = historyData.find((item: any) => item.time_segment === 'metadata');
            const chartData = historyData.filter((item: any) => item.time_segment !== 'metadata');
            
            // 處理圖表數據格式
            const processedData = chartData.map((segment: any) => {
              const dataPoint: any = {
                time: segment.time_segment,
                timestamp: segment.segment_start
              };
              
              // 將每個產品的數據添加到數據點中
              if (segment.product_data) {
                Object.entries(segment.product_data).forEach(([productCode, productInfo]: [string, any]) => {
                  dataPoint[productCode] = productInfo.stock_level || 0;
                });
              }
              
              return dataPoint;
            });
            
            return {
              value: processedData,
              label: 'Stock Level History',
              metadata: {
                productCodes: historyProductCodes.slice(0, 10),
                productCount: historyProductCodes.slice(0, 10).length,
                dateRange: { start: historyStartDate, end: historyEndDate },
                timeSegments: timeSegments,
                dataPoints: processedData.length,
                optimized: true,
                executionInfo: metadataEntry?.metadata || {},
                rpcFunction: 'rpc_get_stock_level_history'
              }
            };
            
          } catch (error) {
            console.error('Error in stock level history lookup:', error);
            return {
              value: [],
              label: 'Stock Level History Error',
              error: error instanceof Error ? error.message : 'Unknown error occurred',
              metadata: {
                productCodes: historyProductCodes,
                fallback: false
              }
            };
          }
          
        case 'warehouse_transfer_list':
          // Warehouse transfer list with server-side JOIN and filtering
          const warehouseTransferStartDate = params.dateRange?.start || params.params?.startDate as string | undefined;
          const warehouseTransferEndDate = params.dateRange?.end || params.params?.endDate as string | undefined;
          const transferLimit = params.params?.limit as number | undefined || 50;
          const transferOffset = params.params?.offset as number | undefined || 0;
          
          try {
            // Use RPC function for optimized warehouse transfer list
            const { data: transferListData, error: transferListError } = await supabase
              .rpc('rpc_get_warehouse_transfer_list', {
                p_start_date: warehouseTransferStartDate || null,
                p_end_date: warehouseTransferEndDate || null,
                p_limit: transferLimit,
                p_offset: transferOffset
              });
            
            if (transferListError) {
              console.error('Error fetching warehouse transfer list:', transferListError);
              throw transferListError;
            }
            
            if (!transferListData || transferListData.length === 0) {
              return {
                value: [],
                label: 'Warehouse Transfer List',
                metadata: {
                  dateRange: { start: warehouseTransferStartDate, end: warehouseTransferEndDate },
                  totalCount: 0,
                  message: 'No warehouse transfers found for the specified period'
                }
              };
            }
            
            // Extract total count from first record (all records have same total_count)
            const totalCount = transferListData[0]?.total_count || 0;
            
            // Format the transfer records
            const formattedTransfers = transferListData.map((transfer: any) => ({
              tran_date: transfer.tran_date,
              plt_num: transfer.plt_num,
              operator_name: transfer.operator_name,
              operator_id: transfer.operator_id
            }));
            
            return {
              value: formattedTransfers,
              label: 'Warehouse Transfer List',
              metadata: {
                dateRange: { start: warehouseTransferStartDate, end: warehouseTransferEndDate },
                totalCount: totalCount,
                returnedCount: formattedTransfers.length,
                limit: transferLimit,
                offset: transferOffset,
                hasMore: (transferOffset + formattedTransfers.length) < totalCount,
                optimized: true,
                rpcFunction: 'rpc_get_warehouse_transfer_list'
              }
            };
            
          } catch (error) {
            console.error('Error in warehouse transfer list lookup:', error);
            return {
              value: [],
              label: 'Warehouse Transfer List Error',
              error: error instanceof Error ? error.message : 'Unknown error occurred',
              metadata: {
                dateRange: { start: warehouseTransferStartDate, end: warehouseTransferEndDate },
                fallback: false
              }
            };
          }
          
        case 'await_location_count_by_timeframe':
          // Await location count with timeframe filtering using optimized RPC
          const awaitStartDate = params.dateRange?.start || params.params?.startDate as string | undefined;
          const awaitEndDate = params.dateRange?.end || params.params?.endDate as string | undefined;
          
          if (!awaitStartDate || !awaitEndDate) {
            return {
              value: 0,
              label: 'Still In Await Count',
              error: 'Start date and end date are required for await location count',
              metadata: {
                dateRange: { start: awaitStartDate, end: awaitEndDate },
                fallback: false
              }
            };
          }
          
          try {
            // Use RPC function for optimized await location count with timeframe
            const { data: awaitTimeFrameData, error: awaitTimeFrameError } = await supabase
              .rpc('rpc_get_await_location_count_by_timeframe', {
                p_start_date: awaitStartDate,
                p_end_date: awaitEndDate
              });
            
            if (awaitTimeFrameError) {
              console.error('Error fetching await location count by timeframe:', awaitTimeFrameError);
              throw awaitTimeFrameError;
            }
            
            if (!awaitTimeFrameData) {
              return {
                value: 0,
                label: 'Still In Await Count',
                error: 'No data returned from await location count RPC',
                metadata: {
                  dateRange: { start: awaitStartDate, end: awaitEndDate },
                  fallback: false
                }
              };
            }
            
            // Check if RPC returned an error
            if (!awaitTimeFrameData.success) {
              console.error('RPC function returned error:', awaitTimeFrameData.error);
              return {
                value: 0,
                label: 'Still In Await Count',
                error: awaitTimeFrameData.error || 'RPC function failed',
                metadata: {
                  dateRange: { start: awaitStartDate, end: awaitEndDate },
                  fallback: false
                }
              };
            }
            
            return {
              value: awaitTimeFrameData.await_count || 0,
              label: 'Still In Await Count',
              metadata: {
                dateRange: { start: awaitStartDate, end: awaitEndDate },
                totalPallets: awaitTimeFrameData.total_pallets || 0,
                awaitCount: awaitTimeFrameData.await_count || 0,
                calculationTime: awaitTimeFrameData.calculation_time,
                performance: awaitTimeFrameData.performance || {},
                optimized: true,
                rpcFunction: 'rpc_get_await_location_count_by_timeframe'
              }
            };
            
          } catch (error) {
            console.error('Error in await location count by timeframe lookup:', error);
            return {
              value: 0,
              label: 'Still In Await Count Error',
              error: error instanceof Error ? error.message : 'Unknown error occurred',
              metadata: {
                dateRange: { start: awaitStartDate, end: awaitEndDate },
                fallback: false
              }
            };
          }
          
        case 'aco_incomplete_orders':
          // ACO incomplete orders list using optimized RPC
          const acoLimit = params.params?.limit as number | undefined || 50;
          const acoOffset = params.params?.offset as number | undefined || 0;
          
          try {
            // Use RPC function for optimized ACO incomplete orders list
            const { data: acoOrdersData, error: acoOrdersError } = await supabase
              .rpc('rpc_get_aco_incomplete_orders_dashboard', {
                p_limit: acoLimit,
                p_offset: acoOffset
              });
            
            if (acoOrdersError) {
              console.error('Error fetching ACO incomplete orders:', acoOrdersError);
              throw acoOrdersError;
            }
            
            if (!acoOrdersData) {
              return {
                value: [],
                label: 'ACO Incomplete Orders',
                error: 'No data returned from ACO incomplete orders RPC',
                metadata: {
                  totalCount: 0,
                  fallback: false
                }
              };
            }
            
            // Check if RPC returned an error
            if (!acoOrdersData.success) {
              console.error('RPC function returned error:', acoOrdersData.error);
              return {
                value: [],
                label: 'ACO Incomplete Orders',
                error: acoOrdersData.error || 'RPC function failed',
                metadata: {
                  totalCount: 0,
                  fallback: false
                }
              };
            }
            
            return {
              value: acoOrdersData.orders || [],
              label: 'ACO Incomplete Orders',
              metadata: {
                totalCount: acoOrdersData.total_count || 0,
                returnedCount: acoOrdersData.returned_count || 0,
                limit: acoLimit,
                offset: acoOffset,
                hasMore: acoOrdersData.has_more || false,
                calculationTime: acoOrdersData.calculation_time,
                performance: acoOrdersData.metadata?.performance || {},
                optimized: true,
                rpcFunction: 'rpc_get_aco_incomplete_orders_dashboard'
              }
            };
            
          } catch (error) {
            console.error('Error in ACO incomplete orders lookup:', error);
            return {
              value: [],
              label: 'ACO Incomplete Orders Error',
              error: error instanceof Error ? error.message : 'Unknown error occurred',
              metadata: {
                totalCount: 0,
                fallback: false
              }
            };
          }
          
        case 'aco_order_progress':
          // ACO order progress using existing check_aco_order_completion RPC
          const orderRef = params.params?.orderRef;
          
          if (!orderRef) {
            return {
              value: [],
              label: 'ACO Order Progress',
              error: 'Order reference is required for ACO order progress',
              metadata: {
                orderRef: orderRef,
                fallback: false
              }
            };
          }
          
          try {
            // Use existing RPC function for ACO order completion check
            const { data: progressData, error: progressError } = await supabase
              .rpc('check_aco_order_completion', {
                p_order_ref: orderRef
              });
            
            if (progressError) {
              console.error('Error fetching ACO order progress:', progressError);
              throw progressError;
            }
            
            if (!progressData) {
              return {
                value: [],
                label: 'ACO Order Progress',
                error: 'No data returned from ACO order progress RPC',
                metadata: {
                  orderRef: orderRef,
                  fallback: false
                }
              };
            }
            
            // Check if RPC returned an error
            if (!progressData.success) {
              console.error('RPC function returned error:', progressData.error);
              return {
                value: [],
                label: 'ACO Order Progress',
                error: progressData.error || 'RPC function failed',
                metadata: {
                  orderRef: orderRef,
                  fallback: false
                }
              };
            }
            
            // Transform the products data to match widget expectations
            const transformedProducts = (progressData.products || []).map((product: any) => ({
              code: product.code,
              required_qty: product.required_qty,
              completed_qty: product.finished_qty,
              remain_qty: product.remaining_qty,
              completion_percentage: product.required_qty > 0 
                ? Math.round((product.finished_qty / product.required_qty) * 100) 
                : 0
            }));
            
            return {
              value: transformedProducts,
              label: 'ACO Order Progress',
              metadata: {
                orderRef: orderRef,
                isCompleted: progressData.is_completed || false,
                totalRequired: progressData.total_required || 0,
                totalFinished: progressData.total_finished || 0,
                totalRemaining: progressData.total_remaining || 0,
                productCount: transformedProducts.length,
                optimized: true,
                rpcFunction: 'check_aco_order_completion'
              }
            };
            
          } catch (error) {
            console.error('Error in ACO order progress lookup:', error);
            return {
              value: [],
              label: 'ACO Order Progress Error',
              error: error instanceof Error ? error.message : 'Unknown error occurred',
              metadata: {
                orderRef: orderRef,
                fallback: false
              }
            };
          }
          
        case 'order_state_list':
          // Order state list with server-side progress calculation
          const orderLimit = params.params?.limit as number | undefined || 50;
          const orderOffset = params.params?.offset as number | undefined || 0;
          
          try {
            // Use RPC function for optimized order state list with progress
            const { data: orderData, error: orderError } = await supabase
              .rpc('rpc_get_order_state_list', {
                p_limit: orderLimit,
                p_offset: orderOffset
              });
            
            if (orderError) {
              console.error('Error fetching order state list:', orderError);
              throw orderError;
            }
            
            if (!orderData) {
              return {
                value: [],
                label: 'Order State List',
                error: 'No data returned from order state list RPC',
                metadata: {
                  totalCount: 0,
                  pendingCount: 0,
                  fallback: false
                }
              };
            }
            
            // Check if RPC returned an error
            if (orderData.error) {
              console.error('RPC function returned error:', orderData.message);
              return {
                value: [],
                label: 'Order State List',
                error: orderData.message || 'RPC function failed',
                metadata: {
                  totalCount: 0,
                  pendingCount: 0,
                  fallback: false
                }
              };
            }
            
            return {
              value: orderData.orders || [],
              label: 'Order State List',
              metadata: {
                totalCount: orderData.total_count || 0,
                pendingCount: orderData.pending_count || 0,
                hasMore: orderData.has_more || false,
                limit: orderLimit,
                offset: orderOffset,
                performanceMs: orderData.performance_ms,
                queryTime: orderData.query_time,
                optimized: true,
                rpcFunction: 'rpc_get_order_state_list'
              }
            };
            
          } catch (error) {
            console.error('Error in order state list lookup:', error);
            return {
              value: [],
              label: 'Order State List Error',
              error: error instanceof Error ? error.message : 'Unknown error occurred',
              metadata: {
                totalCount: 0,
                pendingCount: 0,
                fallback: false
              }
            };
          }
          
        case 'history_tree':
          // History tree with server-side event merging
          const historyLimit = params.params?.limit as number | undefined || 50;
          const historyOffset = params.params?.offset as number | undefined || 0;
          
          try {
            // Use RPC function for optimized history tree with event merging
            const { data: historyData, error: historyError } = await supabase
              .rpc('rpc_get_history_tree', {
                p_limit: historyLimit,
                p_offset: historyOffset
              });
            
            if (historyError) {
              console.error('Error fetching history tree:', historyError);
              throw historyError;
            }
            
            if (!historyData) {
              return {
                value: [],
                label: 'History Tree',
                error: 'No data returned from history tree RPC',
                metadata: {
                  totalCount: 0,
                  mergedCount: 0,
                  fallback: false
                }
              };
            }
            
            // Check if RPC returned an error
            if (historyData.error) {
              console.error('RPC function returned error:', historyData.message);
              return {
                value: [],
                label: 'History Tree',
                error: historyData.message || 'RPC function failed',
                metadata: {
                  totalCount: 0,
                  mergedCount: 0,
                  fallback: false
                }
              };
            }
            
            return {
              value: historyData.events || [],
              label: 'History Tree',
              metadata: {
                totalCount: historyData.total_count || 0,
                mergedCount: historyData.merged_count || 0,
                hasMore: historyData.has_more || false,
                limit: historyLimit,
                offset: historyOffset,
                performanceMs: historyData.performance_ms,
                queryTime: historyData.query_time,
                optimized: true,
                rpcFunction: 'rpc_get_history_tree'
              }
            };
            
          } catch (error) {
            console.error('Error in history tree lookup:', error);
            return {
              value: [],
              label: 'History Tree Error',
              error: error instanceof Error ? error.message : 'Unknown error occurred',
              metadata: {
                totalCount: 0,
                mergedCount: 0,
                fallback: false
              }
            };
          }
          
        case 'report_references':
          // Report generator references loader
          const tableName = params.params?.tableName;
          const fieldName = params.params?.fieldName;
          const refLimit = params.params?.limit as number | undefined || 1000;
          const refOffset = params.params?.offset as number | undefined || 0;
          
          if (!tableName || !fieldName) {
            return {
              value: [],
              label: 'Report References',
              error: 'Table name and field name are required',
              metadata: {
                fallback: false
              }
            };
          }
          
          try {
            // Use RPC function for optimized report references loading
            const { data: refData, error: refError } = await supabase
              .rpc('rpc_get_report_references', {
                p_table_name: tableName,
                p_field_name: fieldName,
                p_limit: refLimit,
                p_offset: refOffset
              });
            
            if (refError) {
              console.error('Error fetching report references:', refError);
              throw refError;
            }
            
            if (!refData) {
              return {
                value: [],
                label: 'Report References',
                error: 'No data returned from report references RPC',
                metadata: {
                  tableName,
                  fieldName,
                  fallback: false
                }
              };
            }
            
            // Check if RPC returned an error
            if (refData.error) {
              console.error('RPC function returned error:', refData.message);
              return {
                value: [],
                label: 'Report References',
                error: refData.message || 'Invalid table or field name',
                metadata: {
                  tableName,
                  fieldName,
                  allowedTables: refData.allowed_tables,
                  fallback: false
                }
              };
            }
            
            return {
              value: refData.references || [],
              label: 'Report References',
              metadata: {
                tableName: refData.table_name,
                fieldName: refData.field_name,
                totalCount: refData.total_count || 0,
                hasMore: refData.has_more || false,
                limit: refLimit,
                offset: refOffset,
                queryTime: refData.query_time,
                performance: refData.performance || {},
                optimized: true,
                rpcFunction: 'rpc_get_report_references'
              }
            };
            
          } catch (error) {
            console.error('Error in report references lookup:', error);
            return {
              value: [],
              label: 'Report References Error',
              error: error instanceof Error ? error.message : 'Unknown error occurred',
              metadata: {
                tableName,
                fieldName,
                fallback: false
              }
            };
          }
          
        case 'other_files_list':
          // Other files list (non-order documents) with server-side JOIN
          const filesLimit = params.params?.limit as number | undefined || 10;
          const filesOffset = params.params?.offset as number | undefined || 0;
          
          try {
            // Use RPC function for optimized other files list
            const { data: filesData, error: filesError } = await supabase
              .rpc('rpc_get_other_files_list', {
                p_limit: filesLimit,
                p_offset: filesOffset
              });
            
            if (filesError) {
              console.error('Error fetching other files list:', filesError);
              throw filesError;
            }
            
            if (!filesData) {
              return {
                value: [],
                label: 'Other Files List',
                error: 'No data returned from other files list RPC',
                metadata: {
                  totalCount: 0,
                  fallback: false
                }
              };
            }
            
            return {
              value: filesData.files || [],
              label: 'Other Files List',
              metadata: {
                totalCount: filesData.total_count || 0,
                hasMore: filesData.has_more || false,
                limit: filesLimit,
                offset: filesOffset,
                performanceMs: filesData.performance_ms,
                queryTime: filesData.query_time,
                performance: filesData.performance || {},
                optimized: true,
                rpcFunction: 'rpc_get_other_files_list'
              }
            };
            
          } catch (error) {
            console.error('Error in other files list lookup:', error);
            return {
              value: [],
              label: 'Other Files List Error',
              error: error instanceof Error ? error.message : 'Unknown error occurred',
              metadata: {
                totalCount: 0,
                fallback: false
              }
            };
          }
          
        case 'aco_order_refs':
          // Get list of ACO order references
          const acoRefsLimit = params.params?.limit as number | undefined || 100;
          const acoRefsOffset = params.params?.offset as number | undefined || 0;
          
          try {
            const { data: acoRefsData, error: acoRefsError } = await supabase
              .rpc('rpc_get_aco_order_refs', {
                p_limit: acoRefsLimit,
                p_offset: acoRefsOffset
              });
            
            if (acoRefsError) {
              console.error('Error fetching ACO order refs:', acoRefsError);
              throw acoRefsError;
            }
            
            return {
              value: acoRefsData?.orderRefs || [],
              label: 'ACO Order References',
              metadata: {
                totalCount: acoRefsData?.metadata?.totalCount || 0,
                hasMore: acoRefsData?.metadata?.hasMore || false,
                limit: acoRefsLimit,
                offset: acoRefsOffset,
                performanceMs: acoRefsData?.metadata?.performanceMs,
                optimized: true
              }
            };
            
          } catch (error) {
            console.error('Error in ACO order refs lookup:', error);
            return {
              value: [],
              label: 'ACO Order Refs Error',
              error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
          }
          
        case 'aco_order_report':
          // Get ACO order report data
          const acoOrderRef = params.params?.orderRef;
          
          if (!acoOrderRef) {
            return {
              value: [],
              label: 'ACO Order Report',
              error: 'Order reference is required'
            };
          }
          
          try {
            const { data: acoReportData, error: acoReportError } = await supabase
              .rpc('rpc_get_aco_order_report', {
                p_order_ref: acoOrderRef,
                p_limit: 1000,
                p_offset: 0
              });
            
            if (acoReportError) {
              console.error('Error fetching ACO order report:', acoReportError);
              throw acoReportError;
            }
            
            return {
              value: acoReportData?.products || [],
              label: 'ACO Order Report',
              metadata: {
                orderRef: acoOrderRef,
                productCount: acoReportData?.metadata?.productCount || 0,
                totalPallets: acoReportData?.metadata?.totalPallets || 0,
                performanceMs: acoReportData?.metadata?.performanceMs,
                optimized: true
              }
            };
            
          } catch (error) {
            console.error('Error in ACO order report lookup:', error);
            return {
              value: [],
              label: 'ACO Order Report Error',
              error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
          }
          
        case 'stock_distribution_chart':
          // Stock distribution chart with server-side treemap data processing
          const stockType = params.params?.stockType;
          
          try {
            // Use RPC function for optimized stock distribution data
            const { data: distributionData, error: distributionError } = await supabase
              .rpc('rpc_get_stock_distribution', {
                p_stock_type: stockType || null
              });
            
            if (distributionError) {
              console.error('Error fetching stock distribution:', distributionError);
              throw distributionError;
            }
            
            if (!distributionData) {
              return {
                value: [],
                label: 'Stock Distribution',
                error: 'No data returned from stock distribution RPC',
                metadata: {
                  totalStock: 0,
                  fallback: false
                }
              };
            }
            
            return {
              value: distributionData.data || [],
              label: 'Stock Distribution',
              metadata: {
                totalStock: distributionData.total_stock || 0,
                itemCount: (distributionData.data || []).length,
                stockType: stockType || 'all',
                calculationTime: new Date().toISOString(),
                optimized: true,
                rpcFunction: 'rpc_get_stock_distribution'
              }
            };
            
          } catch (error) {
            console.error('Error in stock distribution lookup:', error);
            return {
              value: [],
              label: 'Stock Distribution Error',
              error: error instanceof Error ? error.message : 'Unknown error occurred',
              metadata: {
                totalStock: 0,
                fallback: false
              }
            };
          }
          
        case 'grn_references':
          // Get list of GRN references
          const grnLimit = params.params?.limit as number | undefined || 1000;
          const grnOffset = params.params?.offset as number | undefined || 0;
          
          try {
            const { data: grnRefsData, error: grnRefsError } = await supabase
              .rpc('rpc_get_grn_references', {
                p_limit: grnLimit,
                p_offset: grnOffset
              });
            
            if (grnRefsError) {
              console.error('Error fetching GRN references:', grnRefsError);
              throw grnRefsError;
            }
            
            return {
              value: grnRefsData?.grn_refs || [],
              label: 'GRN References',
              metadata: {
                totalCount: grnRefsData?.total_count || 0,
                limit: grnLimit,
                offset: grnOffset,
                queryTime: grnRefsData?.metadata?.query_time,
                optimized: true
              }
            };
            
          } catch (error) {
            console.error('Error in GRN references lookup:', error);
            return {
              value: [],
              label: 'GRN References Error',
              error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
          }
          
        case 'grn_material_codes':
          // Get material codes for a GRN reference
          const grnRef = params.params?.grnRef;
          
          if (!grnRef) {
            return {
              value: [],
              label: 'GRN Material Codes',
              error: 'GRN reference is required'
            };
          }
          
          try {
            const { data: materialData, error: materialError } = await supabase
              .rpc('rpc_get_grn_material_codes', {
                p_grn_ref: grnRef
              });
            
            if (materialError) {
              console.error('Error fetching GRN material codes:', materialError);
              throw materialError;
            }
            
            if (materialData?.error) {
              return {
                value: [],
                label: 'GRN Material Codes',
                error: materialData.message
              };
            }
            
            return {
              value: materialData?.material_codes || [],
              label: 'GRN Material Codes',
              metadata: {
                grnRef: grnRef,
                count: materialData?.count || 0,
                queryTime: materialData?.metadata?.query_time,
                optimized: true
              }
            };
            
          } catch (error) {
            console.error('Error in GRN material codes lookup:', error);
            return {
              value: [],
              label: 'GRN Material Codes Error',
              error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
          }
          
        case 'grn_report_data':
          // Get GRN report data
          const reportGrnRef = params.params?.grnRef;
          const materialCode = params.params?.materialCode;
          
          if (!reportGrnRef || !materialCode) {
            return {
              value: null,
              label: 'GRN Report Data',
              error: 'GRN reference and material code are required'
            };
          }
          
          try {
            const { data: reportData, error: reportError } = await supabase
              .rpc('rpc_get_grn_report_data', {
                p_grn_ref: reportGrnRef,
                p_material_code: materialCode
              });
            
            if (reportError) {
              console.error('Error fetching GRN report data:', reportError);
              throw reportError;
            }
            
            if (reportData?.error) {
              return {
                value: null,
                label: 'GRN Report Data',
                error: reportData.message
              };
            }
            
            return {
              value: reportData || null,
              label: 'GRN Report Data',
              metadata: {
                optimized: true,
                queryTime: reportData?.metadata?.query_time
              }
            };
            
          } catch (error) {
            console.error('Error in GRN report data lookup:', error);
            return {
              value: null,
              label: 'GRN Report Data Error',
              error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
          }
          
        case 'production_stats':
          // Production statistics using new RPC function
          const prodStartDate = params.dateRange?.start || params.params?.startDate as string | undefined || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          const prodEndDate = params.dateRange?.end || params.params?.endDate as string | undefined || new Date().toISOString();
          const metric = params.params?.metric || 'pallet_count';
          
          try {
            const { data: productionStats, error: productionError } = await supabase
              .rpc('rpc_get_production_stats', {
                p_start_date: prodStartDate,
                p_end_date: prodEndDate,
                p_metric: metric
              });
            
            if (productionError) {
              console.error('Error fetching production stats:', productionError);
              throw productionError;
            }
            
            return {
              value: productionStats || 0,
              label: metric === 'pallet_count' ? 'Today Produced (PLT)' : 'Today Produced (QTY)',
              metadata: {
                dateRange: { start: prodStartDate, end: prodEndDate },
                metric: metric,
                optimized: true,
                rpcFunction: 'rpc_get_production_stats'
              }
            };
            
          } catch (error) {
            console.error('Error in production stats lookup:', error);
            return {
              value: 0,
              label: 'Production Stats Error',
              error: error instanceof Error ? error.message : 'Unknown error occurred',
              metadata: {
                fallback: false
              }
            };
          }
          
        case 'product_distribution':
          // Product distribution using new RPC function
          const distProdStartDate = params.dateRange?.start || params.params?.startDate as string | undefined || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          const distProdEndDate = params.dateRange?.end || params.params?.endDate as string | undefined || new Date().toISOString();
          const distLimit = params.params?.limit as number | undefined || 10;
          
          try {
            const { data: distributionData, error: distributionError } = await supabase
              .rpc('rpc_get_product_distribution', {
                p_start_date: distProdStartDate,
                p_end_date: distProdEndDate,
                p_limit: distLimit
              });
            
            if (distributionError) {
              console.error('Error fetching product distribution:', distributionError);
              throw distributionError;
            }
            
            return {
              value: distributionData || [],
              label: 'Product Distribution',
              metadata: {
                dateRange: { start: distProdStartDate, end: distProdEndDate },
                limit: distLimit,
                optimized: true,
                rpcFunction: 'rpc_get_product_distribution'
              }
            };
            
          } catch (error) {
            console.error('Error in product distribution lookup:', error);
            return {
              value: [],
              label: 'Product Distribution Error',
              error: error instanceof Error ? error.message : 'Unknown error occurred',
              metadata: {
                fallback: false
              }
            };
          }
          
        case 'top_products':
          // Top products using new RPC function (alias of product distribution)
          const topProdStartDate = params.dateRange?.start || params.params?.startDate as string | undefined || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          const topProdEndDate = params.dateRange?.end || params.params?.endDate as string | undefined || new Date().toISOString();
          const topLimit = params.params?.limit as number | undefined || 10;
          
          try {
            const { data: topProductsData, error: topProductsError } = await supabase
              .rpc('rpc_get_top_products', {
                p_start_date: topProdStartDate,
                p_end_date: topProdEndDate,
                p_limit: topLimit
              });
            
            if (topProductsError) {
              console.error('Error fetching top products:', topProductsError);
              throw topProductsError;
            }
            
            return {
              value: topProductsData || [],
              label: 'Top Products',
              metadata: {
                dateRange: { start: topProdStartDate, end: topProdEndDate },
                limit: topLimit,
                optimized: true,
                rpcFunction: 'rpc_get_top_products'
              }
            };
            
          } catch (error) {
            console.error('Error in top products lookup:', error);
            return {
              value: [],
              label: 'Top Products Error',
              error: error instanceof Error ? error.message : 'Unknown error occurred',
              metadata: {
                fallback: false
              }
            };
          }
          
        case 'production_details':
          // Production details using new RPC function
          const detailsStartDate = params.dateRange?.start || params.params?.startDate as string | undefined || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          const detailsEndDate = params.dateRange?.end || params.params?.endDate as string | undefined || new Date().toISOString();
          const detailsLimit = params.params?.limit as number | undefined || 50;
          
          try {
            const { data: detailsData, error: detailsError } = await supabase
              .rpc('rpc_get_production_details', {
                p_start_date: detailsStartDate,
                p_end_date: detailsEndDate,
                p_limit: detailsLimit
              });
            
            if (detailsError) {
              console.error('Error fetching production details:', detailsError);
              throw detailsError;
            }
            
            return {
              value: detailsData || [],
              label: 'Production Details',
              metadata: {
                dateRange: { start: detailsStartDate, end: detailsEndDate },
                limit: detailsLimit,
                optimized: true,
                rpcFunction: 'rpc_get_production_details'
              }
            };
            
          } catch (error) {
            console.error('Error in production details lookup:', error);
            return {
              value: [],
              label: 'Production Details Error',
              error: error instanceof Error ? error.message : 'Unknown error occurred',
              metadata: {
                fallback: false
              }
            };
          }
          
        case 'staff_workload':
          // Staff workload using new RPC function
          const workloadStartDate = params.dateRange?.start || params.params?.startDate as string | undefined || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          const workloadEndDate = params.dateRange?.end || params.params?.endDate as string | undefined || new Date().toISOString();
          const department = params.params?.department || 'Injection';
          
          try {
            const { data: workloadData, error: workloadError } = await supabase
              .rpc('rpc_get_staff_workload', {
                p_start_date: workloadStartDate,
                p_end_date: workloadEndDate,
                p_department: department
              });
            
            if (workloadError) {
              console.error('Error fetching staff workload:', workloadError);
              throw workloadError;
            }
            
            return {
              value: workloadData || [],
              label: 'Staff Workload',
              metadata: {
                dateRange: { start: workloadStartDate, end: workloadEndDate },
                department: department,
                optimized: true,
                rpcFunction: 'rpc_get_staff_workload'
              }
            };
            
          } catch (error) {
            console.error('Error in staff workload lookup:', error);
            return {
              value: [],
              label: 'Staff Workload Error',
              error: error instanceof Error ? error.message : 'Unknown error occurred',
              metadata: {
                fallback: false
              }
            };
          }
          
        case 'update_stats':
          // Pending updates statistics
          try {
            // Count products missing information
            const { count: productsMissingInfo } = await supabase
              .from('data_code')
              .select('*', { count: 'exact', head: true })
              .or('description.is.null,colour.is.null,standard_qty.is.null');
            
            // Count suppliers missing information
            const { count: suppliersMissingInfo } = await supabase
              .from('data_supplier')
              .select('*', { count: 'exact', head: true })
              .or('contact.is.null,address.is.null');
            
            // Optional: Count void pallets pending approval
            const { count: voidPalletsPending } = await supabase
              .from('record_palletinfo')
              .select('*', { count: 'exact', head: true })
              .eq('status', 'void_pending');
            
            const totalPending = (productsMissingInfo || 0) + (suppliersMissingInfo || 0) + (voidPalletsPending || 0);
            
            return {
              value: totalPending,
              label: 'Pending Updates',
              metadata: {
                productsMissingInfo: productsMissingInfo || 0,
                suppliersMissingInfo: suppliersMissingInfo || 0,
                voidPalletsPending: voidPalletsPending || 0,
                breakdown: {
                  products: productsMissingInfo || 0,
                  suppliers: suppliersMissingInfo || 0,
                  voidPallets: voidPalletsPending || 0
                },
                optimized: true
              }
            };
            
          } catch (error) {
            console.error('Error fetching update stats:', error);
            return {
              value: 0,
              label: 'Pending Updates',
              error: error instanceof Error ? error.message : 'Unknown error occurred',
              metadata: {
                fallback: false
              }
            };
          }
          
        default:
          // Log unknown data source in development
          if (isNotProduction()) {
            console.warn(`Unknown data source: ${dataSource}`);
          }
          return {
            value: params.params?.staticValue || 0,
            label: params.params?.label || dataSource.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            error: `Data source '${dataSource}' not implemented`
          };
      }
    } catch (error) {
      console.error('Error fetching stats card data:', error);
      return {
        value: 0,
        label: 'Error loading data',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
  
  /**
   * Get human-readable widget title
   */
  private getWidgetTitle(widgetId: string): string {
    const titles: Record<string, string> = {
      stockSummary: 'Stock Summary',
      orderProgress: 'Order Progress',
      movementAnalytics: 'Movement Analytics',
      warehouseEfficiency: 'Warehouse Efficiency',
      statsCard: 'Statistics Card',
      total_pallets: 'Total Pallets',
      today_transfers: "Today's Transfers",
      active_products: 'Active Products',
      pending_orders: 'Pending Orders',
      await_percentage_stats: 'Still In Await %',
      await_location_count: 'Await Location Qty',
      transfer_count: 'Transfer Done',
      transfer_time_distribution: 'Transfer Time Distribution',
      warehouse_work_level: 'Warehouse Work Level',
      stock_level_history: 'Stock Level History',
      warehouse_transfer_list: 'Warehouse Transfer List',
      pallet_reprint: 'Pallet Reprint Info',
      await_location_count_by_timeframe: 'Still In Await Count',
      aco_incomplete_orders: 'ACO Incomplete Orders',
      aco_order_progress: 'ACO Order Progress',
      inventory_search: 'Inventory Search',
      history_tree: 'History Tree',
      order_state_list: 'Order State List',
      report_references: 'Report References',
      other_files_list: 'Other Files List',
      aco_order_refs: 'ACO Order References',
      aco_order_report: 'ACO Order Report',
      stock_distribution_chart: 'Stock Distribution Chart',
      grn_references: 'GRN References',
      grn_material_codes: 'GRN Material Codes',
      grn_report_data: 'GRN Report Data',
      production_stats: 'Production Statistics',
      product_distribution: 'Product Distribution',
      top_products: 'Top Products',
      production_details: 'Production Details',
      staff_workload: 'Staff Workload',
      update_stats: 'Pending Updates'
    };
    
    return titles[widgetId] || widgetId;
  }
}

// Factory function
export function createDashboardAPI(): DashboardAPI {
  return new DashboardAPI();
}

// Server Component usage example
export async function getDashboardData(params: DashboardParams): Promise<DashboardResult> {
  const api = createDashboardAPI();
  
  // Will automatically use server-side strategy in Server Components
  return api.fetch(params, { 
    strategy: 'server',
    cache: {
      ttl: 300, // 5 minutes
      tags: ['dashboard', params.warehouse || 'all'].filter(Boolean)
    }
  });
}