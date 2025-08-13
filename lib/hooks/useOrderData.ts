/**
 * useOrderData Hook - Unified Order Data Management
 * Provides comprehensive order data fetching, caching, and mutation capabilities
 * 
 * Features:
 * - Warehouse orders (list/single)
 * - ACO order reports
 * - Order loading records
 * - Order status management
 * - Real-time updates via subscriptions
 * - Smart caching and error handling
 * - Optimistic updates
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { 
  useQuery, 
  useLazyQuery, 
  useMutation, 
  useSubscription,
  QueryHookOptions,
  LazyQueryHookOptions,
  MutationHookOptions,
  ApolloError,
  NetworkStatus,
  WatchQueryFetchPolicy
} from '@apollo/client';
import { useError } from '../error-handling/hooks/useError';

// GraphQL Queries & Mutations
import {
  WAREHOUSE_ORDERS_QUERY,
  WAREHOUSE_ORDER_QUERY,
  ACO_ORDER_REPORT_QUERY,
  ORDER_LOADING_RECORDS_QUERY,
  UPDATE_WAREHOUSE_ORDER_STATUS,
  UPDATE_ACO_ORDER,
  CANCEL_WAREHOUSE_ORDER,
  ORDER_UPDATES_SUBSCRIPTION,
  
  // Types
  WarehouseOrdersVariables,
  WarehouseOrderVariables,
  AcoOrderReportVariables,
  OrderLoadingRecordsVariables,
  UpdateWarehouseOrderStatusVariables,
  UpdateAcoOrderVariables,
  CancelWarehouseOrderVariables,
  
  WarehouseOrdersData,
  WarehouseOrderData,
  AcoOrderReportData,
  OrderLoadingRecordsData,
  UpdateAcoOrderData,
  UpdateWarehouseOrderStatusData,
  CancelWarehouseOrderData,
  
  WarehouseOrder,
  AcoOrder,
  OrderLoadingRecord,
  WarehouseOrderFilterInput,
  OrderLoadingFilterInput
} from '../graphql/queries/orderData.graphql';

// Import types from separate types file
import type { UseOrderDataReturn } from './types/orderData.types';

// Import types from types file instead of defining here
import type {
  CacheConfig,
  PaginationConfig,
  OrderDataConfig,
  OrderDataState,
  OrderDataActions
} from './types/orderData.types';

/**
 * Main useOrderData Hook
 */
export function useOrderData(config: OrderDataConfig = {}): UseOrderDataReturn {
  const { handleError } = useError();
  
  // Cache configuration
  const cacheConfig: CacheConfig = {
    fetchPolicy: config.fetchPolicy || 'cache-first',
    errorPolicy: config.errorPolicy || 'all',
    notifyOnNetworkStatusChange: config.notifyOnNetworkStatusChange ?? true,
  };

  // State management
  const filterRef = useRef<WarehouseOrderFilterInput>({});
  const paginationRef = useRef<PaginationConfig>(config.pagination || {});

  // Warehouse Orders Query
  const {
    data: warehouseOrdersData,
    loading: loadingOrders,
    error: ordersError,
    refetch: refetchOrders,
    networkStatus: ordersNetworkStatus,
    fetchMore: fetchMoreOrders
  } = useQuery<WarehouseOrdersData, WarehouseOrdersVariables>(
    WAREHOUSE_ORDERS_QUERY,
    {
      variables: { input: filterRef.current },
      ...cacheConfig,
      pollInterval: config.polling,
      skip: false,
      onError: (error) => handleError(error, { 
        component: 'useOrderData', 
        action: 'fetch_warehouse_orders' 
      })
    }
  );

  // Lazy Queries for on-demand fetching
  const [
    fetchWarehouseOrderLazy,
    { data: warehouseOrderData, loading: loadingOrder, error: orderError }
  ] = useLazyQuery<WarehouseOrderData, WarehouseOrderVariables>(
    WAREHOUSE_ORDER_QUERY,
    {
      ...cacheConfig,
      onError: (error) => handleError(error, { 
        component: 'useOrderData', 
        action: 'fetch_warehouse_order' 
      })
    }
  );

  const [
    fetchAcoOrderReportLazy,
    { data: acoOrderReportData, loading: loadingAcoReport, error: acoError }
  ] = useLazyQuery<AcoOrderReportData, AcoOrderReportVariables>(
    ACO_ORDER_REPORT_QUERY,
    {
      ...cacheConfig,
      onError: (error) => handleError(error, { 
        component: 'useOrderData', 
        action: 'fetch_aco_order_report' 
      })
    }
  );

  const [
    fetchOrderLoadingRecordsLazy,
    { data: orderLoadingRecordsData, loading: loadingRecords, error: recordsError }
  ] = useLazyQuery<OrderLoadingRecordsData, OrderLoadingRecordsVariables>(
    ORDER_LOADING_RECORDS_QUERY,
    {
      ...cacheConfig,
      onError: (error) => handleError(error, { 
        component: 'useOrderData', 
        action: 'fetch_order_loading_records' 
      })
    }
  );

  // Mutations
  const [updateOrderStatusMutation, { loading: updatingStatus }] = useMutation<
    UpdateWarehouseOrderStatusData,
    UpdateWarehouseOrderStatusVariables
  >(UPDATE_WAREHOUSE_ORDER_STATUS, {
    onError: (error) => handleError(error, { 
      component: 'useOrderData', 
      action: 'update_order_status' 
    }),
    optimisticResponse: config.optimisticUpdates ? (variables) => ({
      updateWarehouseOrderStatus: {
        __typename: 'WarehouseOrder',
        id: variables.orderId,
        status: variables.status,
        updatedAt: new Date().toISOString(),
        orderRef: '', // 添加必需的屬性
        items: [],   // 添加必需的屬性
        totalQuantity: 0, // 添加必需的屬性
        loadedQuantity: 0, // 添加必需的屬性
        remainingQuantity: 0, // 添加必需的屬性
        progress: 0, // 添加必需的屬性
        createdAt: new Date().toISOString() // 添加必需的屬性
      } as WarehouseOrder
    }) : undefined,
    update: (cache, { data }) => {
      if (data?.updateWarehouseOrderStatus && config.optimisticUpdates) {
        // Update cache with new order status
        cache.modify({
          id: `WarehouseOrder:${data.updateWarehouseOrderStatus.id}`,
          fields: {
            status: () => data.updateWarehouseOrderStatus.status,
            updatedAt: () => data.updateWarehouseOrderStatus.updatedAt
          }
        });
      }
    }
  });

  const [updateAcoOrderMutation, { loading: updatingAco }] = useMutation<
    UpdateAcoOrderData,
    UpdateAcoOrderVariables
  >(UPDATE_ACO_ORDER, {
    onError: (error) => handleError(error, { 
      component: 'useOrderData', 
      action: 'update_aco_order' 
    })
  });

  const [cancelOrderMutation, { loading: cancellingOrder }] = useMutation<
    CancelWarehouseOrderData,
    CancelWarehouseOrderVariables
  >(CANCEL_WAREHOUSE_ORDER, {
    onError: (error) => handleError(error, { 
      component: 'useOrderData', 
      action: 'cancel_order' 
    })
  });

  // Subscription for real-time updates
  const { data: subscriptionData } = useSubscription(
    ORDER_UPDATES_SUBSCRIPTION,
    {
      skip: !config.subscriptions,
      onSubscriptionData: ({ subscriptionData }) => {
        if (subscriptionData.data) {
          // Handle real-time updates
          console.log('Real-time order update:', subscriptionData.data);
        }
      }
    }
  );

  // Computed state
  const state: OrderDataState = useMemo(() => ({
    // Warehouse Orders
    warehouseOrders: warehouseOrdersData?.warehouseOrders?.items || [],
    warehouseOrder: warehouseOrderData?.warehouseOrder || null,
    warehouseOrdersTotal: warehouseOrdersData?.warehouseOrders?.total || 0,
    warehouseOrdersAggregates: warehouseOrdersData?.warehouseOrders?.aggregates || null,

    // ACO Orders
    acoOrderReport: acoOrderReportData?.acoOrderReport?.data || [],
    acoOrderReportTotal: acoOrderReportData?.acoOrderReport?.total || 0,
    acoOrderReference: acoOrderReportData?.acoOrderReport?.reference || '',

    // Loading Records
    orderLoadingRecords: orderLoadingRecordsData?.orderLoadingRecords?.records || [],
    orderLoadingTotal: orderLoadingRecordsData?.orderLoadingRecords?.total || 0,
    orderLoadingSummary: orderLoadingRecordsData?.orderLoadingRecords?.summary || null,

    // Loading States
    loading: loadingOrders || loadingOrder || loadingAcoReport || loadingRecords || 
             updatingStatus || updatingAco || cancellingOrder,
    loadingOrders,
    loadingOrder,
    loadingAcoReport,
    loadingRecords,

    // Network Status
    networkStatus: ordersNetworkStatus,

    // Error States
    error: ordersError || orderError || acoError || recordsError || null,
    ordersError: ordersError || null,
    orderError: orderError || null,
    acoError: acoError || null,
    recordsError: recordsError || null,
  }), [
    warehouseOrdersData, warehouseOrderData, acoOrderReportData, orderLoadingRecordsData,
    loadingOrders, loadingOrder, loadingAcoReport, loadingRecords,
    updatingStatus, updatingAco, cancellingOrder,
    ordersNetworkStatus, ordersError, orderError, acoError, recordsError
  ]);

  // Action Functions with stable references
  const setFilterCallback = useCallback((filter: WarehouseOrderFilterInput) => {
    filterRef.current = filter;
    refetchOrders({ input: filter });
  }, [refetchOrders]);

  const fetchWarehouseOrderCallback = useCallback(async (variables: WarehouseOrderVariables) => {
    try {
      await fetchWarehouseOrderLazy({ variables });
    } catch (error) {
      handleError(error as Error, { 
        component: 'useOrderData', 
        action: 'fetch_warehouse_order' 
      });
    }
  }, [fetchWarehouseOrderLazy, handleError]);

  const fetchAcoOrderReportCallback = useCallback(async (variables: AcoOrderReportVariables) => {
    try {
      await fetchAcoOrderReportLazy({ variables });
    } catch (error) {
      handleError(error as Error, { 
        component: 'useOrderData', 
        action: 'fetch_aco_order_report' 
      });
    }
  }, [fetchAcoOrderReportLazy, handleError]);

  const fetchOrderLoadingRecordsCallback = useCallback(async (variables: OrderLoadingRecordsVariables) => {
    try {
      await fetchOrderLoadingRecordsLazy({ variables });
    } catch (error) {
      handleError(error as Error, { 
        component: 'useOrderData', 
        action: 'fetch_order_loading_records' 
      });
    }
  }, [fetchOrderLoadingRecordsLazy, handleError]);

  const actions: OrderDataActions = useMemo(() => ({
    // Fetch Functions
    fetchWarehouseOrders: async (variables?: WarehouseOrdersVariables) => {
      try {
        if (variables?.input) {
          filterRef.current = variables.input;
        }
        await refetchOrders(variables);
      } catch (error) {
        handleError(error as Error, { 
          component: 'useOrderData', 
          action: 'fetch_warehouse_orders' 
        });
      }
    },

    fetchWarehouseOrder: fetchWarehouseOrderCallback,

    fetchAcoOrderReport: fetchAcoOrderReportCallback,

    fetchOrderLoadingRecords: fetchOrderLoadingRecordsCallback,

    // Mutation Functions
    updateOrderStatus: async (variables: UpdateWarehouseOrderStatusVariables): Promise<boolean> => {
      try {
        const result = await updateOrderStatusMutation({ variables });
        return !!result.data?.updateWarehouseOrderStatus;
      } catch (error) {
        handleError(error as Error, { 
          component: 'useOrderData', 
          action: 'update_order_status' 
        });
        return false;
      }
    },

    updateAcoOrder: async (variables: UpdateAcoOrderVariables): Promise<boolean> => {
      try {
        const result = await updateAcoOrderMutation({ variables });
        return result.data?.updateAcoOrder?.success || false;
      } catch (error) {
        handleError(error as Error, { 
          component: 'useOrderData', 
          action: 'update_aco_order' 
        });
        return false;
      }
    },

    cancelOrder: async (variables: CancelWarehouseOrderVariables): Promise<boolean> => {
      try {
        const result = await cancelOrderMutation({ variables });
        return !!result.data?.cancelWarehouseOrder;
      } catch (error) {
        handleError(error as Error, { 
          component: 'useOrderData', 
          action: 'cancel_order' 
        });
        return false;
      }
    },

    // Utility Functions
    refetchAll: async () => {
      try {
        await Promise.all([
          refetchOrders(),
          // Add other refetch calls as needed
        ]);
      } catch (error) {
        handleError(error as Error, { 
          component: 'useOrderData', 
          action: 'refetch_all' 
        });
      }
    },

    refetchOrders: async () => {
      try {
        await refetchOrders();
      } catch (error) {
        handleError(error as Error, { 
          component: 'useOrderData', 
          action: 'refetch_orders' 
        });
      }
    },

    clearCache: () => {
      // Clear Apollo cache for order-related queries
      // Implementation depends on Apollo Client setup
    },

    setFilter: setFilterCallback,

    setPagination: (pagination: PaginationConfig) => {
      paginationRef.current = pagination;
      // Implement pagination logic
    },
  }), [
    refetchOrders, setFilterCallback, fetchWarehouseOrderCallback, fetchAcoOrderReportCallback, fetchOrderLoadingRecordsCallback,
    updateOrderStatusMutation, updateAcoOrderMutation, cancelOrderMutation,
    handleError
  ]);

  return {
    ...state,
    ...actions
  };
}

/**
 * Specialized hooks for specific order data
 */

// Hook for warehouse orders only
export function useWarehouseOrders(
  filter?: WarehouseOrderFilterInput,
  config?: OrderDataConfig
) {
  const orderData = useOrderData(config);
  
  useEffect(() => {
    if (filter) {
      orderData.setFilter(filter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, orderData.setFilter]); // Only depend on setFilter function, not entire orderData object

  return {
    orders: orderData.warehouseOrders,
    total: orderData.warehouseOrdersTotal,
    aggregates: orderData.warehouseOrdersAggregates,
    loading: orderData.loadingOrders,
    error: orderData.ordersError,
    refetch: orderData.refetchOrders,
    setFilter: orderData.setFilter
  };
}

// Hook for single warehouse order
export function useWarehouseOrder(
  id?: string,
  orderRef?: string,
  config?: OrderDataConfig
) {
  const orderData = useOrderData(config);

  useEffect(() => {
    if (id || orderRef) {
      orderData.fetchWarehouseOrder({ id, orderRef });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, orderRef, orderData.fetchWarehouseOrder]);

  return {
    order: orderData.warehouseOrder,
    loading: orderData.loadingOrder,
    error: orderData.orderError,
    refetch: (variables?: WarehouseOrderVariables) => 
      orderData.fetchWarehouseOrder(variables || { id, orderRef })
  };
}

// Hook for ACO order reports
export function useAcoOrderReport(
  reference?: string,
  config?: OrderDataConfig
) {
  const orderData = useOrderData(config);

  useEffect(() => {
    if (reference) {
      orderData.fetchAcoOrderReport({ reference });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference, orderData.fetchAcoOrderReport]);

  return {
    report: orderData.acoOrderReport,
    total: orderData.acoOrderReportTotal,
    reference: orderData.acoOrderReference,
    loading: orderData.loadingAcoReport,
    error: orderData.acoError,
    refetch: (newReference?: string) => 
      orderData.fetchAcoOrderReport({ reference: newReference || reference || '' })
  };
}

// Hook for order loading records
export function useOrderLoadingRecords(
  filter: OrderLoadingFilterInput,
  config?: OrderDataConfig
) {
  const orderData = useOrderData(config);

  useEffect(() => {
    if (filter.startDate && filter.endDate) {
      orderData.fetchOrderLoadingRecords({ input: filter });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, orderData.fetchOrderLoadingRecords]);

  return {
    records: orderData.orderLoadingRecords,
    total: orderData.orderLoadingTotal,
    summary: orderData.orderLoadingSummary,
    loading: orderData.loadingRecords,
    error: orderData.recordsError,
    refetch: (newFilter?: OrderLoadingFilterInput) => 
      orderData.fetchOrderLoadingRecords({ input: newFilter || filter })
  };
}

// Export types for external use
export type {
  OrderDataConfig,
  UseOrderDataReturn,
  WarehouseOrder,
  AcoOrder,
  OrderLoadingRecord,
  WarehouseOrderFilterInput,
  OrderLoadingFilterInput
};