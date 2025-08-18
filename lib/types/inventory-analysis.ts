/**
 * 庫存分析外部類型定義
 * 統一管理庫存分析相關的類型
 */

export interface InventoryItem {
  id: string;
  productCode: string;
  productName: string;
  category: string;
  location: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  unitPrice: number;
  totalValue: number;
  lastUpdated: string;
  supplier?: string;
  batch?: string;
  expiryDate?: string;
}

export interface InventoryAnalysis {
  totalItems: number;
  totalValue: number;
  categories: CategoryAnalysis[];
  locations: LocationAnalysis[];
  topProducts: TopProduct[];
  lowStockItems: LowStockItem[];
  expiringItems: ExpiringItem[];
  deadStock: DeadStockItem[];
  turnoverRate: TurnoverRate[];
}

export interface CategoryAnalysis {
  category: string;
  itemCount: number;
  totalValue: number;
  percentage: number;
  averageValue: number;
}

export interface LocationAnalysis {
  location: string;
  itemCount: number;
  totalValue: number;
  utilization: number;
  capacity?: number;
}

export interface TopProduct {
  productCode: string;
  productName: string;
  quantity: number;
  value: number;
  turnoverRate: number;
  category: string;
}

export interface LowStockItem {
  productCode: string;
  productName: string;
  currentStock: number;
  minStock: number;
  reorderLevel: number;
  supplier?: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

export interface ExpiringItem {
  productCode: string;
  productName: string;
  batch: string;
  expiryDate: string;
  daysToExpiry: number;
  quantity: number;
  value: number;
  action: 'monitor' | 'promote' | 'dispose';
}

export interface DeadStockItem {
  productCode: string;
  productName: string;
  quantity: number;
  value: number;
  lastMovement: string;
  daysSinceMovement: number;
  category: string;
}

export interface TurnoverRate {
  productCode: string;
  productName: string;
  averageStock: number;
  costOfGoodsSold: number;
  turnoverRatio: number;
  daysToSell: number;
  category: string;
}

export interface InventoryMovement {
  id: string;
  productCode: string;
  movementType: 'in' | 'out' | 'transfer' | 'adjustment';
  quantity: number;
  fromLocation?: string;
  toLocation?: string;
  reason: string;
  operator: string;
  timestamp: string;
  reference?: string;
}

export interface StockLevel {
  productCode: string;
  location: string;
  quantity: number;
  minLevel: number;
  maxLevel: number;
  reorderPoint: number;
  lastChecked: string;
  status: 'normal' | 'low' | 'critical' | 'overstock';
}

export interface InventoryReport {
  id: string;
  type: 'full' | 'cycle' | 'abc' | 'movement' | 'variance';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startDate: string;
  endDate?: string;
  createdBy: string;
  completedAt?: string;
  results?: InventoryAnalysis;
  downloadUrl?: string;
}

export interface ABC_Analysis {
  category: 'A' | 'B' | 'C';
  products: ABCProduct[];
  valuePercentage: number;
  quantityPercentage: number;
  description: string;
}

export interface ABCProduct {
  productCode: string;
  productName: string;
  annualUsage: number;
  unitCost: number;
  annualValue: number;
  cumulativePercentage: number;
  category: 'A' | 'B' | 'C';
}

// 庫存分析過濾器
export interface InventoryFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  categories?: string[];
  locations?: string[];
  suppliers?: string[];
  status?: string[];
  minValue?: number;
  maxValue?: number;
  includeReserved?: boolean;
}

// 庫存警報配置 (renamed to avoid confusion with removed system alerts)
export interface InventoryAlertConfig {
  id: string;
  name: string;
  type: 'low_stock' | 'expiry' | 'dead_stock' | 'overstock';
  conditions: InventoryAlertCondition[];
  actions: InventoryAlertAction[];
  enabled: boolean;
  frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
}

export interface InventoryAlertCondition {
  field: string;
  operator: 'lt' | 'gt' | 'eq' | 'ne' | 'between';
  value: number | string | [number, number];
}

export interface InventoryAlertAction {
  type: 'email' | 'sms' | 'webhook' | 'notification';
  target: string;
  template?: string;
}

// 庫存預測
export interface InventoryForecast {
  productCode: string;
  predictedDemand: number[];
  confidenceInterval: {
    lower: number[];
    upper: number[];
  };
  recommendedOrder: {
    quantity: number;
    timing: string;
    supplier: string;
  };
  forecastPeriod: {
    start: string;
    end: string;
    intervals: string[];
  };
}

// Missing types for useInventoryAnalysis hook
export interface InventoryOrderedAnalysisResponse {
  data: InventoryItem[];
  products: InventoryItem[];
  summary: {
    totalItems: number;
    totalValue: number;
    totalStock: number;
    totalDemand: number;
    avgFulfillmentRate: number;
    overallSufficient: boolean;
  };
  metadata: {
    total: number;
    pages: number;
    currentPage: number;
  };
}

export interface InventoryAnalysisParams {
  page?: number;
  limit?: number;
  sortBy?: InventoryAnalysisSortBy;
  filters?: InventoryAnalysisFilters;
  p_product_codes?: string[];
  p_product_type?: string;
}

export type InventoryAnalysisFilters = InventoryFilters;

export type InventoryAnalysisSortBy =
  | 'productCode'
  | 'quantity'
  | 'value'
  | 'lastUpdated'
  | 'category'
  | 'location'
  | 'fulfillment_rate';

export type ProductSufficiencyStatus =
  | 'sufficient'
  | 'low'
  | 'critical'
  | 'overstock'
  | 'insufficient';

export const INVENTORY_ANALYSIS_CONSTANTS = {
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,
  DEFAULT_SORT: 'lastUpdated' as InventoryAnalysisSortBy,
  REFRESH_INTERVAL: 300000, // 5 minutes
  CRITICAL_FULFILLMENT_RATE: 0.2,
  WARNING_FULFILLMENT_RATE: 0.5,
} as const;
