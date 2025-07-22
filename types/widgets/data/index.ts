/**
 * Widget 數據類型定義
 * Data type definitions for widgets
 * 
 * 這個文件包含所有 widget 相關的數據類型定義
 */

import { DatabaseRecord } from '@/types/database/tables';
import { WidgetError, WidgetErrorType } from '../base';

/**
 * 基礎 API 響應類型
 * Base API response type
 */
export interface BaseApiResponse {
  success?: boolean;
  error?: string;
  message?: string;
  data?: unknown;
  metadata?: ApiMetadata;
  [key: string]: unknown;
}

/**
 * API 元數據類型
 * API metadata type
 */
export interface ApiMetadata {
  queryTime?: number;
  dataSource?: 'server' | 'cache' | 'rpc';
  timestamp?: string;
  hasMore?: boolean;
  optimized?: boolean;
  totalCount?: number;
  page?: number;
  pageSize?: number;
}

/**
 * Dashboard 批量查詢數據
 * Dashboard batch query data structure
 */
export interface DashboardBatchQueryData {
  // 基礎統計數據
  statsCard?: StatsCardData;
  
  // 棧板總數
  total_pallets?: number | PalletMetric;
  
  // 庫存相關數據
  stockDistribution?: StockDistributionData;
  stockLevelHistory?: StockLevelHistoryData;
  topProducts?: TopProductsData;
  
  // 訂單相關數據
  acoOrderProgress?: AcoOrderProgressData;
  ordersList?: OrdersListData;
  
  // 生產相關數據
  injectionProductionStats?: InjectionProductionStatsData;
  productionDetails?: ProductionDetailsData;
  staffWorkload?: StaffWorkloadData;
  
  // 倉庫相關數據
  warehouseTransferList?: WarehouseTransferListData;
  warehouseWorkLevel?: WarehouseWorkLevelData;
  
  // GRN 相關數據
  grnReport?: GrnReportData;
  
  // 其他數據
  availableSoon?: AvailableSoonData;
  awaitLocationQty?: AwaitLocationQtyData;
  historyTree?: HistoryTreeData;
  yesterdayTransferCount?: YesterdayTransferCountData;
  
  // 允許動態添加新的 widget 數據
  [key: string]: unknown;
}

/**
 * 統計卡片數據
 * Stats card data
 */
export interface StatsCardData {
  totalProducts: number;
  totalStock: number;
  lowStockCount: number;
  averageStockLevel: number;
  [key: string]: number | string | undefined;
}

/**
 * 棧板指標數據
 * Pallet metric data
 */
export interface PalletMetric {
  value: number;
  label?: string;
  trend?: number;
  trendPercentage?: number;
  isPositive?: boolean;
}

/**
 * 庫存分佈數據
 * Stock distribution data
 */
export interface StockDistributionData {
  warehouseData: Array<{
    warehouse: string;
    quantity: number;
    percentage: number;
    color?: string;
  }>;
  totalQuantity: number;
}

/**
 * 庫存歷史數據
 * Stock level history data
 */
export interface StockLevelHistoryData {
  history: Array<{
    date: string;
    totalStock: number;
    changeFromPrevious: number;
    percentageChange?: number;
  }>;
  trend?: 'up' | 'down' | 'stable';
}

/**
 * 熱門產品數據
 * Top products data
 */
export interface TopProductsData {
  products: Array<{
    productCode: string;
    productName: string;
    quantity: number;
    percentage: number;
    category?: string;
    trend?: number;
  }>;
  totalProducts?: number;
}

/**
 * ACO 訂單進度數據
 * ACO order progress data
 */
export interface AcoOrderProgressData {
  states: Array<{
    state: string;
    count: number;
    percentage: number;
    color?: string;
  }>;
  totalOrders: number;
  completionRate?: number;
}

/**
 * 訂單列表數據
 * Orders list data
 */
export interface OrdersListData {
  orders: Array<{
    id: string;
    orderNumber: string;
    customer: string;
    status: string;
    date: string;
    items: number;
    total?: number;
    priority?: 'high' | 'medium' | 'low';
  }>;
  totalCount: number;
  hasMore?: boolean;
}

/**
 * 注塑生產統計數據
 * Injection production stats data
 */
export interface InjectionProductionStatsData {
  todayProduction: number;
  weeklyAverage: number;
  monthlyTotal: number;
  efficiency: number;
  targetAchievement?: number;
  machineUtilization?: number;
}

/**
 * 生產詳情數據
 * Production details data
 */
export interface ProductionDetailsData {
  lines: Array<{
    lineId: string;
    lineName: string;
    currentProduct: string;
    quantity: number;
    status: 'running' | 'stopped' | 'maintenance';
    efficiency?: number;
    nextMaintenance?: string;
  }>;
  totalLines?: number;
  activeLines?: number;
}

/**
 * 員工工作量數據
 * Staff workload data
 */
export interface StaffWorkloadData {
  staff: Array<{
    staffId: string;
    name: string;
    completedTasks: number;
    pendingTasks: number;
    efficiency: number;
    department?: string;
    shift?: string;
  }>;
  averageEfficiency?: number;
}

/**
 * 倉庫轉移列表數據
 * Warehouse transfer list data
 */
export interface WarehouseTransferListData {
  transfers: Array<{
    id: string;
    fromLocation: string;
    toLocation: string;
    quantity: number;
    status: string;
    date: string;
    product?: string;
    transferType?: string;
  }>;
  pendingCount: number;
  completedCount: number;
  totalTransfers?: number;
}

/**
 * 倉庫工作水平數據
 * Warehouse work level data
 */
export interface WarehouseWorkLevelData {
  workLevels: Array<{
    hour: number;
    inbound: number;
    outbound: number;
    transfers: number;
    total?: number;
  }>;
  peakHour: number;
  averageActivity: number;
  trend?: 'increasing' | 'decreasing' | 'stable';
}

/**
 * GRN 報告數據
 * GRN report data
 */
export interface GrnReportData {
  recentGrns: Array<{
    id: string;
    supplierName: string;
    date: string;
    itemsCount: number;
    status: string;
    totalValue?: number;
    category?: string;
  }>;
  pendingCount: number;
  completedToday: number;
  totalValue?: number;
}

/**
 * 即將可用數據
 * Available soon data
 */
export interface AvailableSoonData {
  items: Array<{
    productCode: string;
    productName: string;
    expectedDate: string;
    quantity: number;
    supplier: string;
    status?: string;
  }>;
  totalExpected: number;
  nextDelivery?: string;
}

/**
 * 等待位置數量數據
 * Await location quantity data
 */
export interface AwaitLocationQtyData {
  records: Array<{
    location: string;
    quantity: number;
    lastUpdated?: string;
  }>;
  value: number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  // Legacy fields for compatibility
  locations?: Array<{
    location: string;
    quantity: number;
    lastUpdated: string;
  }>;
  totalAwaitingQty?: number;
}

/**
 * 歷史樹數據
 * History tree data
 */
export interface HistoryTreeData {
  nodes: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    user: string;
    children?: string[];
    metadata?: Record<string, unknown>;
  }>;
  rootNodes?: string[];
}

/**
 * 昨日轉移計數數據
 * Yesterday transfer count data
 */
export interface YesterdayTransferCountData {
  count: number;
  trend: number;
  dateRange: {
    start: string;
    end: string;
  };
  optimized?: boolean;
  breakdown?: {
    inbound: number;
    outbound: number;
    internal: number;
  };
}

/**
 * 通用圖表數據點
 * Generic chart data point
 */
export interface ChartDataPoint {
  x: string | number | Date;
  y: number;
  label?: string;
  color?: string;
  metadata?: Record<string, unknown>;
}

/**
 * 通用表格數據
 * Generic table data
 */
export interface TableData<T = DatabaseRecord> {
  rows: T[];
  columns: TableColumn[];
  totalCount: number;
  page?: number;
  pageSize?: number;
  hasMore?: boolean;
}

/**
 * 表格列定義
 * Table column definition
 */
export interface TableColumn {
  key: string;
  title: string;
  dataIndex: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  filterable?: boolean;
  render?: string;
  format?: string;
}

/**
 * 指標配置
 * Metric configuration
 */
export interface MetricConfig {
  key: string;
  label: string;
  value: number | string;
  unit?: string;
  trend?: TrendInfo;
  comparison?: ComparisonInfo;
  format?: string;
  color?: string;
  icon?: string;
}

/**
 * 趨勢信息
 * Trend information
 */
export interface TrendInfo {
  direction: 'up' | 'down' | 'stable';
  percentage: number;
  period: string;
  isPositive?: boolean;
}

/**
 * 比較信息
 * Comparison information
 */
export interface ComparisonInfo {
  value: number | string;
  label: string;
  type: 'percentage' | 'absolute';
  baseValue?: number | string;
}

/**
 * 數據源配置
 * Data source configuration
 */
export interface DataSourceConfig {
  type: 'api' | 'static' | 'realtime' | 'rpc';
  endpoint?: string;
  query?: Record<string, unknown>;
  refreshInterval?: number;
  data?: unknown[];
  transform?: string; // 數據轉換函數名稱
}

/**
 * 類型保護函數
 * Type guard functions
 */
export function isBaseApiResponse(data: unknown): data is BaseApiResponse {
  return data !== null && typeof data === 'object';
}

export function isChartDataPoint(data: unknown): data is ChartDataPoint {
  if (!data || typeof data !== 'object') return false;
  const point = data as Record<string, unknown>;
  return 'x' in point && 'y' in point && typeof point.y === 'number';
}

export function isTableData(data: unknown): data is TableData {
  if (!data || typeof data !== 'object') return false;
  const table = data as Record<string, unknown>;
  return (
    Array.isArray(table.rows) &&
    Array.isArray(table.columns) &&
    typeof table.totalCount === 'number'
  );
}

/**
 * 數據轉換工具函數
 * Data transformation utilities
 */
export class WidgetDataMapper {
  static extractMetadata(response: unknown): ApiMetadata {
    if (!isBaseApiResponse(response)) return {};
    
    const data = response as Record<string, unknown>;
    const metadata = data.metadata;
    
    if (!metadata || typeof metadata !== 'object') return {};
    
    return metadata as ApiMetadata;
  }
  
  static createWidgetError(error: unknown, context?: string): WidgetError {
    if (error instanceof Error) {
      return {
        type: WidgetErrorType.DATA_ERROR,
        message: error.message,
        context,
        original: error,
        timestamp: new Date(),
      };
    }
    
    if (typeof error === 'string') {
      return {
        type: WidgetErrorType.DATA_ERROR,
        message: error,
        context,
        timestamp: new Date(),
      };
    }
    
    return {
      type: WidgetErrorType.UNKNOWN_ERROR,
      message: 'Unknown error occurred',
      context,
      original: error,
      timestamp: new Date(),
    };
  }
}

