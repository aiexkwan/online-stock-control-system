/**
 * DataLoader Entity Types
 * Centralized type definitions for all DataLoader entities
 */

import type {
  Product,
  Supplier,
  Pallet,
  User,
  Location,
  Order,
  Transfer,
  Customer,
  Inventory,
} from '@/types/generated/graphql';

// Re-export GraphQL types for simple loaders
export type { Product, Supplier, Pallet, User, Location, Order, Transfer, Customer, Inventory };

// Complex loader input keys
export interface UnifiedOperationsKey {
  startDate: string;
  endDate: string;
  warehouse?: string;
  operationType?: 'grn' | 'transfer' | 'order' | 'all';
  dateRange?: string;
}

export interface StockLevelKey {
  productCode: string;
  warehouse: string;
  includeMovements?: boolean;
  dateRange?: string;
}

export interface WorkLevelKey {
  departmentId: string;
  startDate: string;
  endDate: string;
  userId?: string;
}

export interface GRNAnalyticsKey {
  supplierId?: string;
  startDate: string;
  endDate: string;
  groupBy: 'day' | 'week' | 'month';
}

export interface PerformanceMetricsKey {
  metric: 'throughput' | 'accuracy' | 'efficiency';
  departmentId?: string;
  timeRange: 'day' | 'week' | 'month' | 'quarter';
}

export interface InventoryOrderedAnalysisKey {
  orderBy: 'quantity' | 'value' | 'movement';
  warehouse?: string;
  limit?: number;
}

export interface HistoryTreeKey {
  entityType: 'product' | 'pallet' | 'order';
  entityId: string;
  depth?: number;
}

export interface TopProductsKey {
  metric: 'sales' | 'quantity' | 'revenue';
  timeRange: 'week' | 'month' | 'quarter' | 'year';
  limit?: number;
}

export interface StockDistributionKey {
  groupBy: 'warehouse' | 'category' | 'supplier';
  includeEmpty?: boolean;
}

// Complex loader response DTOs
export interface UnifiedOperationsData {
  operations: Array<{
    id: string;
    type: 'grn' | 'transfer' | 'order';
    date: string;
    status: string;
    warehouse: string;
    quantity: number;
    details: Record<string, unknown>;
  }>;
  totalCount: number;
  summary: {
    totalGRN: number;
    totalTransfers: number;
    totalOrders: number;
  };
}

export interface StockLevelData {
  productCode: string;
  productName: string;
  warehouse: string;
  currentLevel: number;
  reservedQuantity: number;
  availableQuantity: number;
  lastUpdated: string;
  movements?: Array<{
    date: string;
    quantity: number;
    type: 'in' | 'out';
    reference: string;
    reason: string;
  }>;
}

export interface WorkLevelData {
  departmentId: string;
  departmentName: string;
  totalTasks: number;
  completedTasks: number;
  efficiency: number;
  averageTimePerTask: number;
  topPerformers: Array<{
    userId: string;
    userName: string;
    tasksCompleted: number;
    efficiency: number;
  }>;
}

export interface GRNAnalyticsData {
  period: string;
  totalGRNs: number;
  totalQuantity: number;
  totalValue: number;
  topSuppliers: Array<{
    supplierId: string;
    supplierName: string;
    grnCount: number;
    totalQuantity: number;
  }>;
  trends: Array<{
    date: string;
    count: number;
    quantity: number;
    value: number;
  }>;
}

export interface PerformanceMetricsData {
  metric: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  percentageChange: number;
  history: Array<{
    date: string;
    value: number;
  }>;
  breakdown?: Record<string, number>;
}

export interface InventoryOrderedAnalysisData {
  items: Array<{
    productCode: string;
    productName: string;
    quantity: number;
    value: number;
    movement: number;
    category: string;
    lastActivity: string;
  }>;
  summary: {
    totalItems: number;
    totalValue: number;
    totalQuantity: number;
  };
}

export interface HistoryTreeData {
  entityId: string;
  entityType: string;
  currentData: Record<string, unknown>;
  history: Array<{
    timestamp: string;
    action: string;
    userId: string;
    userName: string;
    changes: Record<string, { old: unknown; new: unknown }>;
    children?: HistoryTreeData[];
  }>;
}

export interface TopProductsData {
  products: Array<{
    productCode: string;
    productName: string;
    quantity: number;
    revenue: number;
    growth: number;
    rank: number;
  }>;
  period: string;
  totalRevenue: number;
  totalQuantity: number;
}

export interface StockDistributionData {
  distribution: Array<{
    groupName: string;
    totalQuantity: number;
    totalValue: number;
    percentage: number;
    itemCount: number;
    subGroups?: Array<{
      name: string;
      quantity: number;
      value: number;
    }>;
  }>;
  summary: {
    totalGroups: number;
    totalQuantity: number;
    totalValue: number;
  };
}

// ============================================================================
// Database Entity Interfaces for Type Safety
// ============================================================================

/**
 * Base type for all database entities
 * Represents the flexible nature of database query results
 */
export type DatabaseEntity = Record<string, unknown>;

/**
 * Type-safe interfaces for database entities used in complex DataLoaders
 * These replace the `(item as unknown)` patterns for better type safety
 */

/**
 * Transfer entity from database with proper typing
 */
export interface TransferEntity {
  id: string;
  product_code?: string;
  quantity?: number;
  completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
  requested_by?: {
    id: string;
    name?: string;
  } | null;
  executed_by?: {
    id: string;
    name?: string;
  } | null;
  from_location?: string;
  to_location?: string;
  status?: string;
  priority?: string;
  notes?: string;
  // Additional fields found in complex.dataloader.ts
  transfer_time?: number;
  operator_id?: string;
  tran_date?: string;
  t_loc?: string;
  pallet?: {
    product_qty?: number;
  } | null;
}

/**
 * Product entity from database queries
 */
export interface ProductEntity {
  id?: string;
  product_code: string;
  description?: string;
  total_quantity?: number;
  latest_update?: string;
  category?: string;
  supplier_code?: string;
  unit_price?: number;
  stock_level?: number;
  // Product master data fields
  type?: string;
  standard_qty?: number;
  // Product relationship data from joins
  product?: {
    description?: string;
    category?: string;
    unit_price?: number;
  } | null;
}

/**
 * Work level entity from database
 */
export interface WorkLevelEntity {
  id: string;
  user_id: string;
  date: string;
  efficiency?: number;
  tasks_completed?: number;
  hours_worked?: number;
  department_id?: string;
  user?: {
    id: string;
    name?: string;
    email?: string;
  } | null;
  // Additional task-specific fields
  qc?: number;
  move?: number;
  grn?: number;
  loading?: number;
  latest_update?: string;
}

/**
 * Inventory entity from database queries
 */
export interface InventoryEntity {
  id?: string;
  product_code: string;
  quantity?: number;
  reserved_quantity?: number;
  location_code?: string;
  last_movement?: string;
  created_at?: string;
  updated_at?: string;
  // Joined data
  product?: {
    description?: string;
    category?: string;
  } | null;
  location?: {
    name?: string;
    zone?: string;
  } | null;
  // Special aggregated fields
  injection?: number;
  total_pallets?: number;
  total_quantity?: number;
}

/**
 * Pallet entity from database
 */
export interface PalletEntity {
  id?: string;
  plt_num: string;
  product_code?: string;
  quantity?: number;
  location_code?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  last_movement?: string;
  // Relationships
  product?: {
    description?: string;
    unit_price?: number;
  } | null;
  // Index signature to satisfy DatabaseEntity constraint
  [key: string]: unknown;
}

/**
 * User entity with department information
 */
export interface UserEntity {
  id: string;
  name?: string;
  email?: string;
  department_id?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
  // Department relationship
  department?: {
    id: string;
    name?: string;
    code?: string;
  } | null;
}

/**
 * Location entity from database
 */
export interface LocationEntity {
  id?: string;
  code: string;
  name?: string;
  zone?: string;
  warehouse_code?: string;
  is_active?: boolean;
  created_at?: string;
  // Warehouse relationship
  warehouse?: {
    code: string;
    name?: string;
  } | null;
}

/**
 * Order entity from database
 */
export interface OrderEntity {
  id?: string;
  order_number: string;
  customer_code?: string;
  status?: string;
  total_quantity?: number;
  total_value?: number;
  order_date?: string;
  delivery_date?: string;
  completed_at?: string;
  created_at?: string;
  // Order line item fields
  product_code?: string;
  product_qty?: number;
  loaded_qty?: string | number;
  // Customer relationship
  customer?: {
    code: string;
    name?: string;
  } | null;
}

/**
 * Supplier entity from database
 */
export interface SupplierEntity {
  id?: string;
  code: string;
  name?: string;
  contact_email?: string;
  contact_phone?: string;
  is_active?: boolean;
  created_at?: string;
  // Address information
  address?: {
    street?: string;
    city?: string;
    country?: string;
    postal_code?: string;
  } | null;
}

/**
 * Customer entity from database
 */
export interface CustomerEntity {
  id?: string;
  code: string;
  name?: string;
  contact_email?: string;
  contact_phone?: string;
  is_active?: boolean;
  created_at?: string;
  // Address information
  address?: {
    street?: string;
    city?: string;
    country?: string;
    postal_code?: string;
  } | null;
}

/**
 * GRN (Goods Received Note) entity from database
 */
export interface GRNEntity {
  id?: string;
  grn_number?: string;
  sup_code?: string;
  material_code?: string;
  gross_weight?: number;
  net_weight?: number;
  pallet_count?: number;
  package_count?: number;
  quantity?: number;
  received_date?: string;
  created_at?: string;
  creat_time?: string; // Alternative creation time field
  // Relationships
  supplier?: {
    supplier_name?: string;
    contact_info?: string;
  } | null;
  material?: {
    description?: string;
    category?: string;
  } | null;
}

/**
 * History entity from record_history table
 */
export interface HistoryEntity {
  time: string;
  id: string;
  action: string;
  plt_num?: string;
  loc?: string;
  remark?: string;
}

// ============================================================================
// Type Guard Functions for Safe Type Conversion
// ============================================================================

/**
 * Type guard for TransferEntity
 */
export function isTransferEntity(obj: unknown): obj is TransferEntity {
  return obj !== null && typeof obj === 'object' && 'id' in obj;
}

/**
 * Type guard for ProductEntity
 */
export function isProductEntity(obj: unknown): obj is ProductEntity {
  return obj !== null && typeof obj === 'object' && 'product_code' in obj;
}

/**
 * Type guard for WorkLevelEntity
 */
export function isWorkLevelEntity(obj: unknown): obj is WorkLevelEntity {
  return obj !== null && typeof obj === 'object' && 'user_id' in obj && 'date' in obj;
}

/**
 * Type guard for InventoryEntity
 */
export function isInventoryEntity(obj: unknown): obj is InventoryEntity {
  return obj !== null && typeof obj === 'object' && 'product_code' in obj;
}

/**
 * Type guard for PalletEntity
 */
export function isPalletEntity(obj: unknown): obj is PalletEntity {
  return obj !== null && typeof obj === 'object' && 'plt_num' in obj;
}

/**
 * Type guard for UserEntity
 */
export function isUserEntity(obj: unknown): obj is UserEntity {
  return obj !== null && typeof obj === 'object' && 'id' in obj;
}

/**
 * Type guard for GRNEntity
 */
export function isGRNEntity(obj: unknown): obj is GRNEntity {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    ('grn_number' in obj || 'sup_code' in obj || 'material_code' in obj)
  );
}

/**
 * Type guard for HistoryEntity
 */
export function isHistoryEntity(obj: unknown): obj is HistoryEntity {
  return obj !== null && typeof obj === 'object' && 'time' in obj && 'action' in obj;
}

/**
 * Type guard for OrderEntity
 */
export function isOrderEntity(obj: unknown): obj is OrderEntity {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    ('order_number' in obj || 'product_code' in obj || 'product_qty' in obj)
  );
}

// ============================================================================
// Safe Access Helper Functions
// ============================================================================

/**
 * Safely convert DatabaseEntity to TransferEntity
 */
export function asTransferEntity(obj: unknown): TransferEntity | null {
  return isTransferEntity(obj) ? obj : null;
}

/**
 * Safely convert DatabaseEntity to ProductEntity
 */
export function asProductEntity(obj: unknown): ProductEntity | null {
  return isProductEntity(obj) ? obj : null;
}

/**
 * Safely convert DatabaseEntity to WorkLevelEntity
 */
export function asWorkLevelEntity(obj: unknown): WorkLevelEntity | null {
  return isWorkLevelEntity(obj) ? obj : null;
}

/**
 * Safely convert DatabaseEntity to InventoryEntity
 */
export function asInventoryEntity(obj: unknown): InventoryEntity | null {
  return isInventoryEntity(obj) ? obj : null;
}

/**
 * Safely convert DatabaseEntity to PalletEntity
 */
export function asPalletEntity(obj: unknown): PalletEntity | null {
  return isPalletEntity(obj) ? obj : null;
}

/**
 * Safely convert DatabaseEntity to UserEntity
 */
export function asUserEntity(obj: unknown): UserEntity | null {
  return isUserEntity(obj) ? obj : null;
}

/**
 * Safely convert DatabaseEntity to GRNEntity
 */
export function asGRNEntity(obj: unknown): GRNEntity | null {
  return isGRNEntity(obj) ? obj : null;
}

/**
 * Safely convert DatabaseEntity to HistoryEntity
 */
export function asHistoryEntity(obj: unknown): HistoryEntity | null {
  return isHistoryEntity(obj) ? obj : null;
}

/**
 * Safely convert DatabaseEntity to OrderEntity
 */
export function asOrderEntity(obj: unknown): OrderEntity | null {
  return isOrderEntity(obj) ? obj : null;
}

/**
 * Generic safe property access helper
 */
export function safeGet<T>(obj: unknown, key: string, defaultValue: T): T {
  if (obj && typeof obj === 'object' && key in obj) {
    const value = (obj as Record<string, unknown>)[key];
    return value !== null && value !== undefined ? (value as T) : defaultValue;
  }
  return defaultValue;
}

/**
 * Safe string access helper
 */
export function safeString(obj: unknown, key: string, defaultValue = ''): string {
  return safeGet(obj, key, defaultValue);
}

/**
 * Safe number access helper
 */
export function safeNumber(obj: unknown, key: string, defaultValue = 0): number {
  const value = safeGet(obj, key, defaultValue);
  return typeof value === 'number' ? value : defaultValue;
}

/**
 * Dashboard Stats Data Interface for DataLoader
 * Maps to GraphQL DashboardStatsResponse type
 */
export interface DashboardStatsData {
  // Basic statistics
  totalPallets: number;
  activePallets: number;
  uniqueProducts: number;
  todayTransfers: number;
  pendingOrders: number;

  // Extended statistics (conditional)
  dailyDonePallets?: number;
  dailyTransferredPallets?: number;
  yesterdayDonePallets?: number;
  yesterdayTransferredPallets?: number;
  past3DaysGenerated?: number;
  past3DaysTransferredPallets?: number;
  past7DaysGenerated?: number;
  past7DaysTransferredPallets?: number;

  // Performance metrics
  executionTimeMs: number;
  
  // Metadata
  lastUpdated: string;
}

/**
 * Type guard for DashboardStatsData
 */
export function isDashboardStatsData(obj: unknown): obj is DashboardStatsData {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'totalPallets' in obj &&
    'activePallets' in obj &&
    'uniqueProducts' in obj &&
    'todayTransfers' in obj &&
    'pendingOrders' in obj &&
    'executionTimeMs' in obj &&
    'lastUpdated' in obj
  );
}

/**
 * Safely convert unknown to DashboardStatsData
 */
export function asDashboardStatsData(obj: unknown): DashboardStatsData | null {
  return isDashboardStatsData(obj) ? obj : null;
}
