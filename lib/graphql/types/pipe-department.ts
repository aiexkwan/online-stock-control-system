/**
 * TypeScript types for DepartPipeCard GraphQL operations
 * Enhanced type safety for GraphQL resolvers and components
 */

// RPC Function Return Types
export interface PipeStatsRPCResult {
  today_count: number;
  week_count: number;
  two_week_count: number;
  last_update: string;
}

export interface StockItemRPCResult {
  stock: string;
  description: string;
  stock_level: number;
  update_time: string;
  type: string;
  real_time_level: number;
}

// GraphQL Schema Types
export interface DepartmentStats {
  todayFinished: number;
  past7Days: number;
  past14Days: number;
  lastUpdated: string;
}

export interface StockItem {
  stock: string;
  description: string | null;
  stockLevel: number;
  updateTime: string;
  type: string | null;
  realTimeLevel?: number | null;
  lastStockUpdate?: string | null;
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string | null;
  endCursor?: string | null;
}

export interface StockItemConnection {
  nodes: StockItem[];
  totalCount: number;
  pageInfo: PageInfo;
}

export type MachineStatus = 'ACTIVE' | 'IDLE' | 'MAINTENANCE' | 'OFFLINE' | 'UNKNOWN';

export interface MachineState {
  machineNumber: string;
  lastActiveTime?: string | null;
  state: MachineStatus;
  efficiency?: number | null;
  currentTask?: string | null;
  nextMaintenance?: string | null;
}

export interface DepartmentPipeData {
  stats: DepartmentStats;
  topStocks: StockItemConnection;
  materialStocks: StockItemConnection;
  machineStates: MachineState[];
  pipeProductionRate: number;
  materialConsumptionRate: number;
  loading: boolean;
  error?: string | null;
}

// Input Types for Advanced Queries
export interface PaginationInput {
  first?: number | null;
  after?: string | null;
  last?: number | null;
  before?: string | null;
}

export interface StockFilterInput {
  stockCodePattern?: string | null;
  descriptionPattern?: string | null;
  minLevel?: number | null;
  maxLevel?: number | null;
  productTypes?: string[] | null;
  updatedAfter?: string | null;
  updatedBefore?: string | null;
}

export interface StockSortInput {
  field: 'STOCK_CODE' | 'DESCRIPTION' | 'STOCK_LEVEL' | 'UPDATE_TIME';
  direction: 'ASC' | 'DESC';
}

// Query Variables Types
export interface DepartmentPipeDataAdvancedVariables {
  stockPagination?: PaginationInput | null;
  stockFilter?: StockFilterInput | null;
  stockSort?: StockSortInput | null;
  materialPagination?: PaginationInput | null;
  materialFilter?: StockFilterInput | null;
  materialSort?: StockSortInput | null;
}

export interface RealTimeStockLevelsVariables {
  pagination?: PaginationInput | null;
  filter?: StockFilterInput | null;
  sort?: StockSortInput | null;
}

export interface MachineStatusRealTimeVariables {
  departmentType: string;
}

// Error Types
export interface GraphQLError {
  message: string;
  locations?: Array<{ line: number; column: number }>;
  path?: Array<string | number>;
  extensions?: Record<string, unknown>;
}

// Performance Tracking Types
export interface QueryPerformanceMetrics {
  queryName: string;
  duration: number;
  cacheHit: boolean;
  variablesHash?: string;
  timestamp: number;
}
