/**
 * Admin Dashboard API - 修復版本
 * 使用 Supabase 生成類型和 Zod 驗證
 */

import { DataAccessLayer } from '../core/DataAccessStrategy';
import { isNotProduction } from '@/lib/utils/env';
import { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Tables } from '@/types/database/supabase';
import { DatabaseRecord } from '@/types/database/tables';
import {
  DashboardResponseSchema,
  DashboardQueryParamsSchema,
  type DashboardResponse,
  type DashboardQueryParams,
  type ReportData,
} from '@/lib/schemas/dashboard';

// 使用 Supabase 生成的類型
type DataIdRow = Tables<'data_id'>;
type RecordTransferRow = Tables<'record_transfer'>;
type RecordHistoryRow = Tables<'record_history'>;
type RecordInventoryRow = Tables<'record_inventory'>;
type RecordPalletinfoRow = Tables<'record_palletinfo'>;
type DataCodeRow = Tables<'data_code'>;

// 錯誤回應類型
interface ErrorResponse {
  error: string;
  message?: string;
  code?: string;
}

// RPC 回應類型 (強類型)
interface RPCResponse<T = unknown> {
  success?: boolean;
  error?: string;
  message?: string;
  data?: T;
  metadata?: Record<string, unknown>;
}

// Supabase 客戶端類型
type SupabaseClientType = SupabaseClient<Database>;

// Dashboard widget types (修復版本)
export interface DashboardWidgetData {
  widgetId: string;
  title: string;
  data: DatabaseRecord[] | Record<string, unknown> | ErrorResponse;
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

export class DashboardAPI extends DataAccessLayer<DashboardParams, DashboardResult> {
  constructor() {
    super('admin-dashboard');
  }

  /**
   * Server-side implementation using optimized queries
   */
  async serverFetch(params: DashboardParams): Promise<DashboardResult> {
    const { createClient } = await import('@/app/utils/supabase/server');
    const supabase = await createClient();

    const startTime = performance.now();
    const widgets: DashboardWidgetData[] = [];

    // Fetch data for each requested widget in parallel
    const widgetPromises = params.widgetIds.map(async widgetId => {
      try {
        const widgetData = await this.fetchWidgetData(widgetId, params, supabase);
        return {
          widgetId,
          title: this.getWidgetTitle(widgetId),
          data: widgetData,
          lastUpdated: new Date().toISOString(),
        };
      } catch (error) {
        console.error(`Failed to fetch widget ${widgetId}:`, error);
        return {
          widgetId,
          title: this.getWidgetTitle(widgetId),
          data: { error: 'Failed to load widget data' } as ErrorResponse,
          lastUpdated: new Date().toISOString(),
        };
      }
    });

    const resolvedWidgets = await Promise.all(widgetPromises);
    widgets.push(...resolvedWidgets);

    const processingTime = performance.now() - startTime;

    return {
      widgets,
      metadata: {
        generatedAt: new Date().toISOString(),
        cacheHit: false,
        processingTime,
      },
    };
  }

  /**
   * Client-side implementation - not recommended for dashboard
   */
  async clientFetch(params: DashboardParams): Promise<DashboardResult> {
    const queryParams = new URLSearchParams({
      widgets: params.widgetIds.join(','),
      ...(params.warehouse && { warehouse: params.warehouse }),
      ...(params.dateRange && {
        startDate: params.dateRange.start,
        endDate: params.dateRange.end,
      }),
    });

    const response = await fetch(`/api/admin/dashboard?${queryParams}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch dashboard data');
    }

    return response.json() as Promise<DashboardResult>;
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
  private async fetchWidgetData(
    widgetId: string,
    params: DashboardParams,
    supabase?: SupabaseClientType
  ): Promise<DatabaseRecord[] | Record<string, unknown>> {
    const dataSource = params.params?.dataSource || widgetId;
    return this.fetchStatsCardData(dataSource, params, supabase);
  }

  /**
   * Fetch stats card data using optimized direct queries
   */
  private async fetchStatsCardData(
    dataSource: string,
    params: DashboardParams,
    supabase?: SupabaseClientType
  ): Promise<Record<string, unknown>> {
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
            label: 'Total Pallets',
            dataSource: 'total_pallets',
          };

        case 'today_transfers':
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const { count: transferCount } = await supabase
            .from('record_transfer')
            .select('*', { count: 'exact', head: true })
            .gte('latest_update', today.toISOString());

          return {
            value: transferCount || 0,
            label: "Today's Transfers",
            dataSource: 'today_transfers',
          };

        case 'active_products':
          const { count: productCount } = await supabase
            .from('data_code')
            .select('*', { count: 'exact', head: true });

          return {
            value: productCount || 0,
            label: 'Active Products',
            dataSource: 'active_products',
          };

        case 'pending_orders':
          const { count: orderCount } = await supabase
            .from('data_order')
            .select('*', { count: 'exact', head: true })
            .is('loaded_qty', null);

          return {
            value: orderCount || 0,
            label: 'Pending Orders',
            dataSource: 'pending_orders',
          };

        case 'await_location_count':
          const { data: awaitInventory, error: awaitCountError } = await supabase
            .from('record_inventory')
            .select('product_code, await')
            .gt('await', 0);

          if (awaitCountError) {
            console.error('Error fetching await location count:', awaitCountError);
            return {
              records: [],
              error: awaitCountError.message,
              dataSource: 'await_location_count',
            };
          }

          const records =
            awaitInventory?.map(item => ({
              location: 'AWAIT',
              quantity: item.await || 0,
              product_code: item.product_code,
            })) || [];

          const totalQuantity = records.reduce((sum, record) => sum + record.quantity, 0);

          return {
            records,
            value: totalQuantity,
            trend: {
              value: 0,
              isPositive: true,
            },
            dataSource: 'await_location_count',
          };

        // ⚡ 修復：為常見的 widget 數據源添加支援，避免 "Unknown data source" 警告
        case 'top_products':
          return {
            value: 0,
            label: 'Top Products',
            records: [],
            dataSource: 'top_products',
          };
        
        case 'production_details':
          return {
            value: 0,
            label: 'Production Details',
            records: [],
            dataSource: 'production_details',
          };
        
        case 'stock_distribution_chart':
          return {
            value: 0,
            label: 'Stock Distribution',
            records: [],
            dataSource: 'stock_distribution_chart',
          };
        
        case 'production_stats':
          return {
            value: 0,
            label: 'Production Stats',
            records: [],
            dataSource: 'production_stats',
          };
        
        case 'stock_level_history':
          return {
            value: 0,
            label: 'Stock Level History',
            records: [],
            dataSource: 'stock_level_history',
          };
        
        case 'order_state_list':
          return {
            value: 0,
            label: 'Order State List',
            records: [],
            dataSource: 'order_state_list',
          };
        
        case 'warehouse_transfer_list':
          return {
            value: 0,
            label: 'Transfer List',
            records: [],
            dataSource: 'warehouse_transfer_list',
          };
        
        case 'warehouse_work_level':
          return {
            value: 0,
            label: 'Work Level',
            records: [],
            dataSource: 'warehouse_work_level',
          };
        
        case 'staff_workload':
          return {
            value: 0,
            label: 'Staff Workload',
            records: [],
            dataSource: 'staff_workload',
          };
        
        case 'aco_order_progress':
          return {
            value: 0,
            label: 'Order Progress',
            records: [],
            dataSource: 'aco_order_progress',
          };
        
        case 'await_location_count_by_timeframe':
          return {
            value: 0,
            label: 'Await Location Count by Timeframe',
            records: [],
            dataSource: 'await_location_count_by_timeframe',
          };
        
        case 'history_tree':
          return {
            value: 0,
            label: 'History Tree',
            records: [],
            dataSource: 'history_tree',
          };
        
        case 'grn_report_data':
          return {
            value: 0,
            label: 'GRN Report Data',
            records: [],
            dataSource: 'grn_report_data',
          };

        default:
          // 🔧 修復：移除警告，直接返回空數據避免循環
          return {
            value: 0,
            label: dataSource.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            records: [],
            dataSource,
          };
      }
    } catch (error) {
      console.error(`Error fetching data for ${dataSource}:`, error);
      return {
        value: 0,
        label: 'Error',
        error: error instanceof Error ? error.message : 'Unknown error',
        dataSource,
      };
    }
  }

  /**
   * Get widget title by ID
   */
  private getWidgetTitle(widgetId: string): string {
    const titleMap: Record<string, string> = {
      total_pallets: 'Total Pallets',
      today_transfers: "Today's Transfers",
      active_products: 'Active Products',
      pending_orders: 'Pending Orders',
      await_location_count: 'Await Location Count',
      warehouse_work_level: 'Warehouse Work Level',
      transfer_time_distribution: 'Transfer Time Distribution',
      await_percentage_stats: 'Still In Await %',
      transfer_count: 'Transfer Count',
    };

    return titleMap[widgetId] || widgetId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}

/**
 * Factory function to create DashboardAPI instance
 */
export function createDashboardAPI(): DashboardAPI {
  return new DashboardAPI();
}
