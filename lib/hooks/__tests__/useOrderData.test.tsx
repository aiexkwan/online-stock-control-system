/**
 * Tests for useOrderData Hook
 * Comprehensive testing for order data management functionality
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { 
  useOrderData, 
  useWarehouseOrders, 
  useWarehouseOrder, 
  useAcoOrderReport, 
  useOrderLoadingRecords 
} from '../useOrderData';
import {
  WAREHOUSE_ORDERS_QUERY,
  WAREHOUSE_ORDER_QUERY,
  ACO_ORDER_REPORT_QUERY,
  ORDER_LOADING_RECORDS_QUERY,
  UPDATE_WAREHOUSE_ORDER_STATUS,
  UPDATE_ACO_ORDER
} from '@/lib/graphql/queries/orderData.graphql';

// Mock Data
const mockWarehouseOrders = {
  warehouseOrders: {
    items: [
      {
        id: '1',
        orderRef: 'ORD-001',
        customerName: 'Test Customer',
        status: 'PENDING',
        items: [
          {
            id: '1',
            orderId: '1',
            productCode: 'PROD-001',
            productDesc: 'Test Product',
            quantity: 100,
            loadedQuantity: 50,
            status: 'PARTIAL'
          }
        ],
        totalQuantity: 100,
        loadedQuantity: 50,
        remainingQuantity: 50,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T12:00:00Z'
      }
    ],
    total: 1,
    aggregates: {
      totalOrders: 1,
      pendingOrders: 1,
      completedOrders: 0,
      totalQuantity: 100,
      loadedQuantity: 50
    }
  }
};

const mockWarehouseOrder = {
  warehouseOrder: {
    id: '1',
    orderRef: 'ORD-001',
    customerName: 'Test Customer',
    status: 'PENDING',
    items: [
      {
        id: '1',
        orderId: '1',
        productCode: 'PROD-001',
        productDesc: 'Test Product',
        quantity: 100,
        loadedQuantity: 50,
        status: 'PARTIAL'
      }
    ],
    totalQuantity: 100,
    loadedQuantity: 50,
    remainingQuantity: 50,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T12:00:00Z'
  }
};

const mockAcoOrderReport = {
  acoOrderReport: {
    data: [
      {
        orderRef: 12345,
        productCode: 'PROD-001',
        productDesc: 'Test Product',
        quantityOrdered: 100,
        quantityUsed: 75,
        remainingQuantity: 25,
        completionStatus: 'IN_PROGRESS',
        lastUpdated: '2024-01-01T12:00:00Z'
      }
    ],
    total: 1,
    reference: 'REF-001',
    generatedAt: '2024-01-01T12:00:00Z'
  }
};

const mockOrderLoadingRecords = {
  orderLoadingRecords: {
    records: [
      {
        timestamp: '2024-01-01T12:00:00Z',
        orderNumber: 'ORD-001',
        productCode: 'PROD-001',
        loadedQty: 25,
        userName: 'testuser',
        action: 'LOAD'
      }
    ],
    total: 1,
    summary: {
      totalLoaded: 25,
      uniqueOrders: 1,
      uniqueProducts: 1,
      averageLoadPerOrder: 25.0
    }
  }
};

// Mock Queries
const mockQueries = [
  {
    request: {
      query: WAREHOUSE_ORDERS_QUERY,
      variables: { input: {} }
    },
    result: {
      data: mockWarehouseOrders
    }
  },
  {
    request: {
      query: WAREHOUSE_ORDER_QUERY,
      variables: { id: '1' }
    },
    result: {
      data: mockWarehouseOrder
    }
  },
  {
    request: {
      query: ACO_ORDER_REPORT_QUERY,
      variables: { reference: 'REF-001' }
    },
    result: {
      data: mockAcoOrderReport
    }
  },
  {
    request: {
      query: ORDER_LOADING_RECORDS_QUERY,
      variables: {
        input: {
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        }
      }
    },
    result: {
      data: mockOrderLoadingRecords
    }
  },
  {
    request: {
      query: UPDATE_WAREHOUSE_ORDER_STATUS,
      variables: {
        orderId: '1',
        status: 'COMPLETED'
      }
    },
    result: {
      data: {
        updateWarehouseOrderStatus: {
          ...mockWarehouseOrder.warehouseOrder,
          status: 'COMPLETED',
          updatedAt: '2024-01-01T13:00:00Z'
        }
      }
    }
  },
  {
    request: {
      query: UPDATE_ACO_ORDER,
      variables: {
        input: {
          orderRef: 12345,
          productCode: 'PROD-001',
          quantityUsed: 100
        }
      }
    },
    result: {
      data: {
        updateAcoOrder: {
          success: true,
          message: 'Order updated successfully',
          order: {
            orderRef: 12345,
            productCode: 'PROD-001',
            quantityUsed: 100,
            completionStatus: 'COMPLETED'
          },
          emailSent: false
        }
      }
    }
  }
];

// Test Wrapper
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MockedProvider mocks={mockQueries} addTypename={false}>
    {children}
  </MockedProvider>
);

describe('useOrderData', () => {
  it('should fetch warehouse orders successfully', async () => {
    const { result } = renderHook(() => useOrderData(), {
      wrapper: TestWrapper
    });

    // Initial state
    expect(result.current.loading).toBe(true);
    expect(result.current.warehouseOrders).toEqual([]);

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Check loaded data
    expect(result.current.warehouseOrders).toHaveLength(1);
    expect(result.current.warehouseOrders[0].orderRef).toBe('ORD-001');
    expect(result.current.warehouseOrdersTotal).toBe(1);
    expect(result.current.warehouseOrdersAggregates?.totalOrders).toBe(1);
  });

  it('should update order status successfully', async () => {
    const { result } = renderHook(() => useOrderData({ optimisticUpdates: true }), {
      wrapper: TestWrapper
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Update order status
    await act(async () => {
      const success = await result.current.updateOrderStatus({
        orderId: '1',
        status: 'COMPLETED'
      });
      expect(success).toBe(true);
    });
  });

  it('should update ACO order successfully', async () => {
    const { result } = renderHook(() => useOrderData(), {
      wrapper: TestWrapper
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Update ACO order
    await act(async () => {
      const success = await result.current.updateAcoOrder({
        input: {
          orderRef: 12345,
          productCode: 'PROD-001',
          quantityUsed: 100
        }
      });
      expect(success).toBe(true);
    });
  });

  it('should handle errors gracefully', async () => {
    const errorMock = [
      {
        request: {
          query: WAREHOUSE_ORDERS_QUERY,
          variables: { input: {} }
        },
        error: new Error('Network error')
      }
    ];

    const ErrorWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <MockedProvider mocks={errorMock} addTypename={false}>
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useOrderData(), {
      wrapper: ErrorWrapper
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.message).toBe('Network error');
    });
  });
});

describe('useWarehouseOrders', () => {
  it('should fetch warehouse orders with filter', async () => {
    const filter = { status: 'PENDING' as const };
    
    const { result } = renderHook(() => useWarehouseOrders(filter), {
      wrapper: TestWrapper
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.orders).toHaveLength(1);
    expect(result.current.orders[0].status).toBe('PENDING');
    expect(result.current.total).toBe(1);
  });

  it('should provide setFilter function', async () => {
    const { result } = renderHook(() => useWarehouseOrders(), {
      wrapper: TestWrapper
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.setFilter).toBe('function');
    
    // Test filter change
    await act(async () => {
      result.current.setFilter({ status: 'COMPLETED' });
    });
  });
});

describe('useWarehouseOrder', () => {
  it('should fetch single warehouse order', async () => {
    const { result } = renderHook(() => useWarehouseOrder('1'), {
      wrapper: TestWrapper
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.order).toBeTruthy();
    expect(result.current.order?.id).toBe('1');
    expect(result.current.order?.orderRef).toBe('ORD-001');
  });

  it('should provide refetch function', async () => {
    const { result } = renderHook(() => useWarehouseOrder('1'), {
      wrapper: TestWrapper
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.refetch).toBe('function');
  });
});

describe('useAcoOrderReport', () => {
  it('should fetch ACO order report', async () => {
    const { result } = renderHook(() => useAcoOrderReport('REF-001'), {
      wrapper: TestWrapper
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.report).toHaveLength(1);
    expect(result.current.report[0].orderRef).toBe(12345);
    expect(result.current.total).toBe(1);
    expect(result.current.reference).toBe('REF-001');
  });

  it('should provide refetch function with new reference', async () => {
    const { result } = renderHook(() => useAcoOrderReport('REF-001'), {
      wrapper: TestWrapper
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.refetch).toBe('function');
    
    // Test refetch with new reference
    await act(async () => {
      await result.current.refetch('REF-002');
    });
  });
});

describe('useOrderLoadingRecords', () => {
  const mockFilter = {
    startDate: '2024-01-01',
    endDate: '2024-01-31'
  };

  it('should fetch order loading records', async () => {
    const { result } = renderHook(() => useOrderLoadingRecords(mockFilter), {
      wrapper: TestWrapper
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.records).toHaveLength(1);
    expect(result.current.records[0].orderNumber).toBe('ORD-001');
    expect(result.current.total).toBe(1);
    expect(result.current.summary?.totalLoaded).toBe(25);
  });

  it('should provide refetch function with new filter', async () => {
    const { result } = renderHook(() => useOrderLoadingRecords(mockFilter), {
      wrapper: TestWrapper
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.refetch).toBe('function');
    
    // Test refetch with new filter
    await act(async () => {
      await result.current.refetch({
        startDate: '2024-02-01',
        endDate: '2024-02-28'
      });
    });
  });
});

describe('Hook Configuration', () => {
  it('should respect polling configuration', async () => {
    const { result } = renderHook(() => useOrderData({ polling: 5000 }), {
      wrapper: TestWrapper
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Polling should be active (we can't easily test the actual polling without mocking timers)
    expect(result.current.warehouseOrders).toHaveLength(1);
  });

  it('should respect cache policy configuration', async () => {
    const { result } = renderHook(() => useOrderData({ fetchPolicy: 'no-cache' }), {
      wrapper: TestWrapper
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.warehouseOrders).toHaveLength(1);
  });

  it('should handle subscription configuration', async () => {
    const { result } = renderHook(() => useOrderData({ subscriptions: true }), {
      wrapper: TestWrapper
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Subscriptions should be enabled (testing actual subscription would require WebSocket mocking)
    expect(result.current.warehouseOrders).toHaveLength(1);
  });
});

describe('Utility Functions', () => {
  it('should provide refetchAll function', async () => {
    const { result } = renderHook(() => useOrderData(), {
      wrapper: TestWrapper
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.refetchAll).toBe('function');
    
    await act(async () => {
      await result.current.refetchAll();
    });
  });

  it('should provide clearCache function', async () => {
    const { result } = renderHook(() => useOrderData(), {
      wrapper: TestWrapper
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.clearCache).toBe('function');
    
    act(() => {
      result.current.clearCache();
    });
  });

  it('should provide setPagination function', async () => {
    const { result } = renderHook(() => useOrderData(), {
      wrapper: TestWrapper
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.setPagination).toBe('function');
    
    act(() => {
      result.current.setPagination({ limit: 50, offset: 0 });
    });
  });
});