/**
 * Lib Hooks Export Index
 * Centralized export for all library-level hooks
 */

// Order Data Management
export {
  useOrderData,
  useWarehouseOrders,
  useWarehouseOrder,
  useAcoOrderReport,
  useOrderLoadingRecords,
  type OrderDataConfig,
  type UseOrderDataReturn,
  type WarehouseOrder,
  type AcoOrder,
  type OrderLoadingRecord,
  type WarehouseOrderFilterInput,
  type OrderLoadingFilterInput,
} from './useOrderData';

// Order Data Types
export type {
  BaseOrderItem,
  BaseOrder,
  WarehouseOrderItem,
  WarehouseOrderAggregates,
  LoadingSummary,
  OrderStatus,
  WarehouseOrderStatus,
  OrderItemStatus,
  WarehouseOrderItemStatus,
  CacheConfig,
  PaginationConfig,
  WarehouseOrdersResponse,
  AcoOrderReportResponse,
  OrderLoadingRecordsResponse,
  UpdateAcoOrderInput,
  UseWarehouseOrdersReturn,
  UseWarehouseOrderReturn,
  UseAcoOrderReportReturn,
  UseOrderLoadingRecordsReturn,
  OrderDataMetrics,
  OrderDataError,
  OrderDataEvent,
  OrderDataEventPayload,
  OrderDataPerformanceMetrics,
} from './types/orderData.types';

// Re-export accessibility hooks
export { useAria, useFocusManagement, useKeyboardNavigation } from '@/lib/accessibility';

// Re-export API hooks
export { useRealtimeStock } from '@/lib/api/hooks/useRealtimeStock';

// Re-export error handling hooks
export { useError } from '@/lib/error-handling/hooks/useError';

// Re-export feature flag hooks
export { useFeatureFlag, useTestingFeatures } from '@/lib/feature-flags/hooks';

// Re-export hardware hooks
export { useHardware } from '@/lib/hardware/hooks/useHardware';

// Re-export loading hooks
export { useLoading, useLoadingTimeout, useSmartLoading } from '@/lib/loading/hooks';

// Re-export performance hooks
export { usePerformanceMonitor } from '@/lib/performance/hooks/usePerformanceMonitor';

// Re-export printing hooks
export { usePrinting } from '@/lib/printing/hooks/usePrinting';

// Media query hook
export { useMediaQuery } from './use-media-query';
