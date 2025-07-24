/**
 * DataLoader Result Types
 * 定義所有 complex.dataloader.ts 嘅返回類型
 */

export interface DatabaseEntity {
  id: string;
  created_at?: string;
  updated_at?: string;
}

// Unified Operations DataLoader Types
export interface PalletInfo extends DatabaseEntity {
  pallet_no: string;
  warehouse_location: string;
  status: string;
  quantity: number;
  product_code?: string;
  location_id?: string;
}

export interface InventoryRecord extends DatabaseEntity {
  product_code: string;
  quantity: number;
  location_id?: string;
  warehouse_location?: string;
  status?: string;
  pallet_no?: string;
}

export interface TransferRecord extends DatabaseEntity {
  from_location: string;
  to_location: string;
  product_code?: string;
  quantity?: number;
  transfer_user?: string;
  transfer_date?: string;
  status?: string;
  pallet_no?: string;
}

export interface UnifiedOperationsResult {
  id: string;
  warehouse: string;
  totalPallets: number;
  totalInventory: number;
  totalTransfers: number;
  pallets: PalletInfo[];
  inventory: InventoryRecord[];
  transfers: TransferRecord[];
  locationBreakdown: Array<{
    location: string;
    palletCount: number;
    inventoryCount: number;
    transferCount: number;
  }>;
  lastUpdated: string;
}

// Stock Levels DataLoader Types
export interface StockLevelData extends DatabaseEntity {
  product_code: string;
  current_stock: number;
  min_level?: number;
  max_level?: number;
  location_id?: string;
  warehouse_location?: string;
}

export interface StockLevelResult {
  productCode: string;
  currentStock: number;
  minLevel: number;
  maxLevel: number;
  status: 'normal' | 'low' | 'critical' | 'overstocked';
  locations: Array<{
    locationId: string;
    warehouseLocation: string;
    stock: number;
  }>;
  lastRestocked?: string;
  trend: 'increasing' | 'decreasing' | 'stable';
}

// Work Level DataLoader Types
export interface WorkLevelData extends DatabaseEntity {
  department?: string;
  user_id?: string;
  efficiency?: number;
  completed_tasks?: number;
  total_tasks?: number;
  work_date?: string;
}

export interface WorkLevelResult {
  department: string;
  totalUsers: number;
  averageEfficiency: number;
  completedTasks: number;
  totalTasks: number;
  efficiencyTrend: 'up' | 'down' | 'stable';
  topPerformers: Array<{
    userId: string;
    efficiency: number;
    completedTasks: number;
  }>;
  departmentRanking: number;
}

// GRN Analytics DataLoader Types
export interface GRNData extends DatabaseEntity {
  grn_number: string;
  supplier_code?: string;
  total_quantity?: number;
  received_quantity?: number;
  status?: string;
  grn_date?: string;
}

export interface GRNLevelData extends DatabaseEntity {
  grn_id: string;
  quality_score?: number;
  processing_time?: number;
  efficiency_rating?: number;
}

export interface GRNAnalyticsResult {
  totalGRNs: number;
  completedGRNs: number;
  averageQualityScore: number;
  averageProcessingTime: number;
  efficiencyRating: number;
  supplierBreakdown: Array<{
    supplierCode: string;
    grnCount: number;
    averageQuality: number;
    onTimeDelivery: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    grnCount: number;
    qualityScore: number;
  }>;
}

// Performance Metrics DataLoader Types
export interface PerformanceMetricsResult {
  totalOperations: number;
  completedOperations: number;
  averageCompletionTime: number;
  errorRate: number;
  efficiency: number;
  departmentMetrics: Array<{
    department: string;
    operations: number;
    efficiency: number;
    errorRate: number;
  }>;
  userMetrics: Array<{
    userId: string;
    userName?: string;
    operations: number;
    efficiency: number;
    completionTime: number;
  }>;
  trends: {
    weekly: Array<{ week: string; efficiency: number }>;
    monthly: Array<{ month: string; efficiency: number }>;
  };
}

// Inventory Ordered Analysis DataLoader Types
export interface InventoryOrderedAnalysisResult {
  totalProducts: number;
  orderedProducts: number;
  pendingOrders: number;
  completedOrders: number;
  orderEfficiency: number;
  categoryBreakdown: Array<{
    category: string;
    productCount: number;
    orderedCount: number;
    completionRate: number;
  }>;
  supplierAnalysis: Array<{
    supplierCode: string;
    productCount: number;
    orderVolume: number;
    deliveryPerformance: number;
  }>;
  timeline: Array<{
    date: string;
    orderedCount: number;
    completedCount: number;
  }>;
}

// History Tree DataLoader Types
export interface HistoryRecord extends DatabaseEntity {
  record_type?: string;
  operation_type?: string;
  user_id?: string;
  target_id?: string;
  details?: string;
  timestamp?: string;
  status?: string;
}

export interface HistoryTreeNode {
  id: string;
  recordType: string;
  operationType: string;
  userId?: string;
  userName?: string;
  targetId?: string;
  details?: string;
  timestamp: string;
  status: string;
  children: HistoryTreeNode[];
  level: number;
}

export interface HistoryTreeResult {
  rootNodes: HistoryTreeNode[];
  totalRecords: number;
  uniqueUsers: number;
  operationTypes: string[];
  timeRange: {
    start: string;
    end: string;
  };
  statistics: {
    byOperationType: Array<{
      operationType: string;
      count: number;
    }>;
    byUser: Array<{
      userId: string;
      userName?: string;
      operationCount: number;
    }>;
    byStatus: Array<{
      status: string;
      count: number;
    }>;
  };
}

// Top Products DataLoader Types
export interface ProductData extends DatabaseEntity {
  product_code: string;
  product_name?: string;
  quantity?: number;
  order_count?: number;
  revenue?: number;
  category?: string;
}

export interface TopProductsResult {
  byQuantity: Array<{
    productCode: string;
    productName?: string;
    totalQuantity: number;
    orderCount: number;
    averageOrderSize: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  byRevenue: Array<{
    productCode: string;
    productName?: string;
    totalRevenue: number;
    orderCount: number;
    averageOrderValue: number;
  }>;
  byOrderFrequency: Array<{
    productCode: string;
    productName?: string;
    orderCount: number;
    totalQuantity: number;
    lastOrderDate?: string;
  }>;
  categoryInsights: Array<{
    category: string;
    productCount: number;
    totalQuantity: number;
    totalRevenue: number;
  }>;
}

// Stock Distribution DataLoader Types
export interface StockDistributionResult {
  totalStock: number;
  totalLocations: number;
  distributionEfficiency: number;
  locationDistribution: Array<{
    locationId: string;
    warehouseLocation: string;
    stockCount: number;
    productVariety: number;
    utilizationRate: number;
    category: 'high' | 'medium' | 'low';
  }>;
  productDistribution: Array<{
    productCode: string;
    productName?: string;
    totalStock: number;
    locationCount: number;
    averageStockPerLocation: number;
    concentrationRisk: 'high' | 'medium' | 'low';
  }>;
  regionAnalysis: Array<{
    region: string;
    stockPercentage: number;
    locationCount: number;
    efficiency: number;
  }>;
  recommendations: Array<{
    type: 'rebalance' | 'consolidate' | 'redistribute';
    priority: 'high' | 'medium' | 'low';
    description: string;
    affectedLocations: string[];
  }>;
}

// Type guards for runtime type checking
export function isUnifiedOperationsResult(value: unknown): value is UnifiedOperationsResult {
  return typeof value === 'object' && value !== null && 'warehouse' in value && 'pallets' in value;
}

export function isStockLevelResult(value: unknown): value is StockLevelResult {
  return typeof value === 'object' && value !== null && 'productCode' in value && 'currentStock' in value;
}

export function isWorkLevelResult(value: unknown): value is WorkLevelResult {
  return typeof value === 'object' && value !== null && 'department' in value && 'averageEfficiency' in value;
}

export function isGRNAnalyticsResult(value: unknown): value is GRNAnalyticsResult {
  return typeof value === 'object' && value !== null && 'totalGRNs' in value && 'supplierBreakdown' in value;
}

export function isPerformanceMetricsResult(value: unknown): value is PerformanceMetricsResult {
  return typeof value === 'object' && value !== null && 'totalOperations' in value && 'departmentMetrics' in value;
}

export function isInventoryOrderedAnalysisResult(value: unknown): value is InventoryOrderedAnalysisResult {
  return typeof value === 'object' && value !== null && 'totalProducts' in value && 'categoryBreakdown' in value;
}

export function isHistoryTreeResult(value: unknown): value is HistoryTreeResult {
  return typeof value === 'object' && value !== null && 'rootNodes' in value && 'statistics' in value;
}

export function isTopProductsResult(value: unknown): value is TopProductsResult {
  return typeof value === 'object' && value !== null && 'byQuantity' in value && 'byRevenue' in value;
}

export function isStockDistributionResult(value: unknown): value is StockDistributionResult {
  return typeof value === 'object' && value !== null && 'locationDistribution' in value && 'recommendations' in value;
}