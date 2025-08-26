/**
 * Type definitions for Order Data Hooks
 * Comprehensive type system for order management functionality
 */

import { ApolloError, NetworkStatus, WatchQueryFetchPolicy } from '@apollo/client';

// Base Order Types
export interface BaseOrderItem {
  id: string;
  productCode: string;
  productDesc?: string;
  quantity: number;
  status: OrderItemStatus;
}

export interface BaseOrder {
  id: string;
  orderRef: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

// Warehouse Order Types
export interface WarehouseOrderItem extends BaseOrderItem {
  orderId: string;
  loadedQuantity: number;
  status: WarehouseOrderItemStatus;
}

export interface WarehouseOrder extends BaseOrder {
  customerName?: string;
  items: WarehouseOrderItem[];
  totalQuantity: number;
  loadedQuantity: number;
  remainingQuantity: number;
  completedAt?: string;
  status: WarehouseOrderStatus;
}

// ACO Order Types
export interface AcoOrder {
  orderRef: number;
  productCode: string;
  productDesc?: string;
  quantityOrdered: number;
  quantityUsed: number;
  remainingQuantity: number;
  completionStatus: string;
  lastUpdated?: string;
}

// Order Loading Record Types
export interface OrderLoadingRecord {
  timestamp: string;
  orderNumber: string;
  productCode: string;
  loadedQty: number;
  userName: string;
  action: string;
}

export interface LoadingSummary {
  totalLoaded: number;
  uniqueOrders: number;
  uniqueProducts: number;
  averageLoadPerOrder: number;
}

// Enum Types
export type OrderStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type WarehouseOrderStatus = OrderStatus;
export type OrderItemStatus = 'PENDING' | 'PARTIAL' | 'COMPLETED';
export type WarehouseOrderItemStatus = OrderItemStatus;

// Filter Types
export interface BaseFilterInput {
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface WarehouseOrderFilterInput extends BaseFilterInput {
  orderRef?: string;
  status?: WarehouseOrderStatus;
  customerName?: string;
}

export interface OrderLoadingFilterInput extends BaseFilterInput {
  startDate: string;
  endDate: string;
  orderRef?: string;
  productCode?: string;
  actionBy?: string;
}

// Configuration Types
export interface CacheConfig {
  fetchPolicy?: WatchQueryFetchPolicy;
  errorPolicy?: 'none' | 'ignore' | 'all';
  notifyOnNetworkStatusChange?: boolean;
}

export interface PaginationConfig {
  limit?: number;
  offset?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface OrderDataConfig extends CacheConfig {
  polling?: number;
  subscriptions?: boolean;
  optimisticUpdates?: boolean;
  pagination?: PaginationConfig;
}

// Aggregates Types
export interface WarehouseOrderAggregates {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalQuantity: number;
  loadedQuantity: number;
}

// Response Types
export interface WarehouseOrdersResponse {
  items: WarehouseOrder[];
  total: number;
  aggregates: WarehouseOrderAggregates;
}

export interface AcoOrderReportResponse {
  data: AcoOrder[];
  total: number;
  reference: string;
  generatedAt: string;
}

export interface OrderLoadingRecordsResponse {
  records: OrderLoadingRecord[];
  total: number;
  summary: LoadingSummary;
}

// GraphQL Variables Types
export interface WarehouseOrdersVariables {
  input?: WarehouseOrderFilterInput;
}

export interface WarehouseOrderVariables {
  id?: string;
  orderRef?: string;
}

export interface AcoOrderReportVariables {
  reference: string;
}

export interface OrderLoadingRecordsVariables {
  input: OrderLoadingFilterInput;
}

// Mutation Variables Types
export interface UpdateWarehouseOrderStatusVariables {
  orderId: string;
  status: WarehouseOrderStatus;
}

export interface UpdateAcoOrderInput {
  orderRef: number;
  productCode: string;
  quantityUsed: number;
  skipUpdate?: boolean;
  orderCompleted?: boolean;
}

export interface UpdateAcoOrderVariables {
  input: UpdateAcoOrderInput;
}

export interface CancelWarehouseOrderVariables {
  orderId: string;
  reason?: string;
}

// GraphQL Response Types
export interface WarehouseOrdersData {
  warehouseOrders: WarehouseOrdersResponse;
}

export interface WarehouseOrderData {
  warehouseOrder: WarehouseOrder;
}

export interface AcoOrderReportData {
  acoOrderReport: AcoOrderReportResponse;
}

export interface OrderLoadingRecordsData {
  orderLoadingRecords: OrderLoadingRecordsResponse;
}

export interface UpdateAcoOrderResponse {
  success: boolean;
  message?: string;
  order?: AcoOrder;
  emailSent?: boolean;
  error?: {
    code: string;
    message: string;
  };
}

export interface UpdateAcoOrderData {
  updateAcoOrder: UpdateAcoOrderResponse;
}

export interface UpdateWarehouseOrderStatusData {
  updateWarehouseOrderStatus: WarehouseOrder;
}

export interface CancelWarehouseOrderData {
  cancelWarehouseOrder: WarehouseOrder;
}

// Hook State Types
export interface OrderDataState {
  // Warehouse Orders
  warehouseOrders: WarehouseOrder[];
  warehouseOrder: WarehouseOrder | null;
  warehouseOrdersTotal: number;
  warehouseOrdersAggregates: WarehouseOrderAggregates | null;

  // ACO Orders
  acoOrderReport: AcoOrder[];
  acoOrderReportTotal: number;
  acoOrderReference: string;

  // Loading Records
  orderLoadingRecords: OrderLoadingRecord[];
  orderLoadingTotal: number;
  orderLoadingSummary: LoadingSummary | null;

  // Loading States
  loading: boolean;
  loadingOrders: boolean;
  loadingOrder: boolean;
  loadingAcoReport: boolean;
  loadingRecords: boolean;

  // Network Status
  networkStatus: NetworkStatus;

  // Error States
  error: ApolloError | null;
  ordersError: ApolloError | null;
  orderError: ApolloError | null;
  acoError: ApolloError | null;
  recordsError: ApolloError | null;
}

export interface OrderDataActions {
  // Fetch Functions
  fetchWarehouseOrders: (variables?: WarehouseOrdersVariables) => Promise<void>;
  fetchWarehouseOrder: (variables: WarehouseOrderVariables) => Promise<void>;
  fetchAcoOrderReport: (variables: AcoOrderReportVariables) => Promise<void>;
  fetchOrderLoadingRecords: (variables: OrderLoadingRecordsVariables) => Promise<void>;

  // Mutation Functions
  updateOrderStatus: (variables: UpdateWarehouseOrderStatusVariables) => Promise<boolean>;
  updateAcoOrder: (variables: UpdateAcoOrderVariables) => Promise<boolean>;
  cancelOrder: (variables: CancelWarehouseOrderVariables) => Promise<boolean>;

  // Utility Functions
  refetchAll: () => Promise<void>;
  refetchOrders: () => Promise<void>;
  clearCache: () => void;
  setFilter: (filter: WarehouseOrderFilterInput) => void;
  setPagination: (pagination: PaginationConfig) => void;
}

// Main Hook Return Type
export interface UseOrderDataReturn extends OrderDataState, OrderDataActions {}

// Specialized Hook Return Types
export interface UseWarehouseOrdersReturn {
  orders: WarehouseOrder[];
  total: number;
  aggregates: WarehouseOrderAggregates | null;
  loading: boolean;
  error: ApolloError | null;
  refetch: () => Promise<void>;
  setFilter: (filter: WarehouseOrderFilterInput) => void;
}

export interface UseWarehouseOrderReturn {
  order: WarehouseOrder | null;
  loading: boolean;
  error: ApolloError | null;
  refetch: (variables?: WarehouseOrderVariables) => Promise<void>;
}

export interface UseAcoOrderReportReturn {
  report: AcoOrder[];
  total: number;
  reference: string;
  loading: boolean;
  error: ApolloError | null;
  refetch: (newReference?: string) => Promise<void>;
}

export interface UseOrderLoadingRecordsReturn {
  records: OrderLoadingRecord[];
  total: number;
  summary: LoadingSummary | null;
  loading: boolean;
  error: ApolloError | null;
  refetch: (newFilter?: OrderLoadingFilterInput) => Promise<void>;
}

// Subscription Types
export interface OrderUpdateSubscription {
  orderUpdates: {
    orderId: string;
    status: WarehouseOrderStatus;
    loadedQuantity: number;
    updatedAt: string;
    action: string;
  };
}

// Utility Types
export type OrderDataHookVariant =
  | 'complete'
  | 'warehouseOrders'
  | 'warehouseOrder'
  | 'acoReport'
  | 'loadingRecords';

export interface OrderDataMetrics {
  totalOrders: number;
  completionRate: number;
  averageLoadTime: number;
  errorRate: number;
  cacheHitRate: number;
}

// Error Types
export interface OrderDataError extends Error {
  code: string;
  context?: {
    orderId?: string;
    operation?: string;
    timestamp: string;
  };
}

// Event Types
export type OrderDataEvent =
  | 'orderCreated'
  | 'orderUpdated'
  | 'orderCompleted'
  | 'orderCancelled'
  | 'itemLoaded'
  | 'statusChanged';

export interface OrderDataEventPayload {
  event: OrderDataEvent;
  orderId: string;
  timestamp: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

// Performance Types
export interface OrderDataPerformanceMetrics {
  queryTime: number;
  cacheStatus: 'hit' | 'miss' | 'stale';
  networkLatency: number;
  errorCount: number;
  successRate: number;
}

// All types exported above
