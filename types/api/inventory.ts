/**
 * Inventory API 類型定義
 * 統一管理庫存分析 API 相關的類型
 */

// 庫存分析過濾器
export interface InventoryFilters {
  showSufficientOnly?: boolean;
  stockStatus?: 'sufficient' | 'insufficient' | 'all';
  category?: string;
  supplier?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  minQuantity?: number;
  maxQuantity?: number;
  sortBy?: 'quantity' | 'name' | 'lastUpdated';
  sortOrder?: 'asc' | 'desc';
}

// 庫存產品數據
export interface InventoryProductData {
  id: string;
  code: string;
  name: string;
  description?: string;
  current_quantity: number;
  min_threshold?: number;
  max_threshold?: number;
  is_sufficient: boolean;
  last_updated: string;
  category?: string;
  supplier?: string;
  location?: string;
  unit?: string;
  cost_per_unit?: number;
  total_value?: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock';
}

// 庫存分析請求
export interface InventoryAnalysisRequest {
  filters?: InventoryFilters;
  includeHistory?: boolean;
  includePredictions?: boolean;
  groupBy?: 'category' | 'supplier' | 'location';
}

// 庫存分析響應
export interface InventoryAnalysisResponse {
  success: boolean;
  data?: {
    products: InventoryProductData[];
    summary: InventorySummary;
    trends?: InventoryTrend[];
    predictions?: InventoryPrediction[];
  };
  error?: string;
  metadata?: {
    totalCount: number;
    filteredCount: number;
    lastUpdated: string;
    processingTime: number;
  };
}

// 庫存摘要
export interface InventorySummary {
  total_products: number;
  sufficient_stock: number;
  low_stock: number;
  out_of_stock: number;
  overstock: number;
  total_value: number;
  average_stock_level: number;
  stock_turnover_rate?: number;
}

// 庫存趨勢
export interface InventoryTrend {
  date: string;
  total_value: number;
  quantity_changed: number;
  products_affected: number;
  trend_direction: 'up' | 'down' | 'stable';
}

// 庫存預測
export interface InventoryPrediction {
  product_code: string;
  predicted_stock_out_date?: string;
  recommended_reorder_quantity?: number;
  confidence_level: number;
  risk_level: 'low' | 'medium' | 'high';
}

// 庫存級別查詢
export interface StockLevelsQuery {
  products?: string[];
  includeHistory?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  groupBy?: 'hour' | 'day' | 'week' | 'month';
}

// 庫存級別響應
export interface StockLevelsResponse {
  success: boolean;
  data?: {
    current_levels: StockLevel[];
    history?: StockLevelHistory[];
  };
  error?: string;
  metadata?: {
    query_time: number;
    data_freshness: string;
  };
}

// 庫存級別
export interface StockLevel {
  product_code: string;
  product_name: string;
  current_quantity: number;
  available_quantity: number;
  reserved_quantity: number;
  pending_quantity: number;
  last_movement_date: string;
  location: string;
  unit: string;
}

// 庫存級別歷史
export interface StockLevelHistory {
  product_code: string;
  date: string;
  opening_balance: number;
  closing_balance: number;
  movements: StockMovement[];
}

// 庫存移動
export interface StockMovement {
  type: 'in' | 'out' | 'transfer' | 'adjustment';
  quantity: number;
  reason: string;
  timestamp: string;
  reference?: string;
  user_id?: string;
}

// 庫存分布查詢
export interface StockDistributionQuery {
  groupBy: 'category' | 'supplier' | 'location' | 'status';
  includeValue?: boolean;
  includePercentages?: boolean;
}

// 庫存分布響應
export interface StockDistributionResponse {
  success: boolean;
  data?: StockDistributionData[];
  error?: string;
  metadata?: {
    total_items: number;
    total_value?: number;
    calculation_method: string;
  };
}

// 庫存分布數據
export interface StockDistributionData {
  group: string;
  quantity: number;
  value?: number;
  percentage?: number;
  item_count: number;
  status_breakdown?: {
    sufficient: number;
    low: number;
    out: number;
    overstock: number;
  };
}

// 庫存異常檢測
export interface InventoryAnomalyDetection {
  product_code: string;
  anomaly_type: 'sudden_spike' | 'sudden_drop' | 'unusual_pattern' | 'missing_data';
  severity: 'low' | 'medium' | 'high' | 'critical';
  detected_at: string;
  description: string;
  suggested_actions?: string[];
  confidence_score: number;
}

// 庫存警報配置
export interface InventoryAlertConfig {
  product_code?: string;
  category?: string;
  alert_type: 'low_stock' | 'overstock' | 'no_movement' | 'anomaly';
  threshold_value?: number;
  notification_channels: ('email' | 'sms' | 'dashboard')[];
  is_active: boolean;
  created_by: string;
  created_at: string;
}

// 庫存報告類型
export type InventoryReportType =
  | 'stock_levels'
  | 'movement_summary'
  | 'valuation'
  | 'aging_analysis'
  | 'turnover_analysis'
  | 'abc_analysis'
  | 'shortage_report'
  | 'overstock_report';

// 庫存報告請求
export interface InventoryReportRequest {
  report_type: InventoryReportType;
  date_range: {
    start: string;
    end: string;
  };
  filters?: InventoryFilters;
  format: 'json' | 'csv' | 'excel' | 'pdf';
  include_charts?: boolean;
  group_by?: string[];
}

// 庫存 API 常量
export const INVENTORY_API_CONSTANTS = {
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 1000,
  CACHE_TTL: 300000, // 5 minutes
  STOCK_STATUS_THRESHOLDS: {
    LOW_STOCK: 0.2, // 20% of max threshold
    OVERSTOCK: 1.5, // 150% of max threshold
  },
  SUPPORTED_UNITS: ['pcs', 'kg', 'liters', 'meters', 'boxes', 'pallets'],
  MOVEMENT_TYPES: ['in', 'out', 'transfer', 'adjustment'],
} as const;

export type InventoryApiConstantKey = keyof typeof INVENTORY_API_CONSTANTS;
