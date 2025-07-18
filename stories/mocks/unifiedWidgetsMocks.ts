/**
 * Unified Widgets Mock Data
 * 為統一組件 Stories 提供完整的 mock 數據支持
 */

import React from 'react';

// Mock Hook Factory
export const createMockHook = (mockData: any) => {
  return () => mockData;
};

// 統計數據 Mock
export const mockStatsData = {
  success: {
    data: {
      default: {
        total_pallets: 1234,
        production_efficiency: 0.85,
        error_count: 5,
        success_rate: 0.95,
        dynamic_metric_1: 567,
        dynamic_metric_2: 89.2,
        annual_production: 15678234,
        downtime_hours: 0,
        total_units: 2456789,
      },
      record_palletinfo: {
        total_count: 1856,
        active_count: 1234,
        completed_today: 89,
      },
      inventory_data: {
        current_stock: 8245,
        low_stock_items: 12,
        total_value: 2456789,
      },
      system_status: {
        active_users: 67,
        system_health: 0.98,
        uptime_percentage: 0.997,
      },
    },
    isLoading: false,
    error: null,
  },
  loading: {
    data: null,
    isLoading: true,
    error: null,
  },
  error: {
    data: null,
    isLoading: false,
    error: new Error('資料載入失敗'),
  },
};

// 圖表數據 Mock
export const mockChartData = {
  bar: {
    labels: ['Production', 'Quality Control', 'Packaging', 'Shipping', 'Storage'],
    values: [85, 78, 92, 67, 89],
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
  },
  line: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    values: [65, 78, 90, 81, 95, 102],
    borderColors: ['#1E40AF'],
  },
  pie: {
    labels: ['Injection', 'Pipeline', 'Warehouse', 'QC', 'Admin'],
    values: [35, 25, 20, 15, 5],
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
  },
  donut: {
    labels: ['Completed', 'In Progress', 'Pending', 'Failed'],
    values: [60, 25, 10, 5],
    colors: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'],
  },
  area: {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    values: [120, 190, 300, 500],
  },
};

export const createMockChartData = (chartType: keyof typeof mockChartData) => ({
  success: {
    data: {
      chart_data: mockChartData[chartType],
      production_stats: mockChartData.line,
      distribution_data: mockChartData.pie,
    },
    isLoading: false,
    error: null,
  },
  loading: {
    data: null,
    isLoading: true,
    error: null,
  },
  error: {
    data: null,
    isLoading: false,
    error: new Error('Chart data loading failed'),
  },
});

// 表格數據 Mock
export const mockTableData = {
  orders: [
    {
      id: 'ORD-0001',
      order_number: '2025-100',
      customer: 'Customer A',
      status: 'Pending',
      date: '2025-01-18',
      items: 5,
      total_amount: 1250,
    },
    {
      id: 'ORD-0002',
      order_number: '2025-101',
      customer: 'Customer B',
      status: 'Processing',
      date: '2025-01-17',
      items: 12,
      total_amount: 3400,
    },
    {
      id: 'ORD-0003',
      order_number: '2025-102',
      customer: 'Customer C',
      status: 'Shipped',
      date: '2025-01-16',
      items: 8,
      total_amount: 2100,
    },
    {
      id: 'ORD-0004',
      order_number: '2025-103',
      customer: 'Customer D',
      status: 'Delivered',
      date: '2025-01-15',
      items: 15,
      total_amount: 4800,
    },
  ],
  inventory: [
    {
      id: 'ITM-1001',
      product_code: 'P1000',
      product_name: 'Widget A',
      category: 'Electronics',
      quantity: 245,
      location: 'A1-1',
      last_updated: '2025-01-18T10:30:00Z',
    },
    {
      id: 'ITM-1002',
      product_code: 'P1001',
      product_name: 'Component B',
      category: 'Machinery',
      quantity: 156,
      location: 'A1-2',
      last_updated: '2025-01-18T09:15:00Z',
    },
    {
      id: 'ITM-1003',
      product_code: 'P1002',
      product_name: 'Tool C',
      category: 'Tools',
      quantity: 89,
      location: 'B2-1',
      last_updated: '2025-01-17T16:45:00Z',
    },
  ],
  transfers: [
    {
      id: 'TRF-2001',
      from_location: 'A1-1',
      to_location: 'B1-1',
      product_code: 'P1000',
      quantity: 50,
      status: 'Pending',
      created_at: '2025-01-18T08:00:00Z',
      staff_name: 'Staff A',
    },
    {
      id: 'TRF-2002',
      from_location: 'A2-1',
      to_location: 'B2-1',
      product_code: 'P1001',
      quantity: 25,
      status: 'In Progress',
      created_at: '2025-01-17T14:30:00Z',
      staff_name: 'Staff B',
    },
  ],
  staff: [
    {
      id: 'STF-001',
      staff_name: 'John Doe',
      department: 'Production',
      shift: 'Morning',
      tasks_completed: 45,
      tasks_pending: 8,
      efficiency: 85,
      last_active: '2025-01-18T11:00:00Z',
    },
    {
      id: 'STF-002',
      staff_name: 'Jane Smith',
      department: 'Quality Control',
      shift: 'Afternoon',
      tasks_completed: 38,
      tasks_pending: 5,
      efficiency: 92,
      last_active: '2025-01-18T10:45:00Z',
    },
  ],
};

export const createMockTableData = (dataType: keyof typeof mockTableData, overrides: any = {}) => ({
  success: {
    data: {
      table_data: {
        items: mockTableData[dataType],
        columns: mockTableData[dataType].length > 0 ? Object.keys(mockTableData[dataType][0]) : [],
      },
      orders_list: {
        items: mockTableData.orders,
      },
      inventory_data: {
        rows: mockTableData.inventory,
      },
      transfer_list: {
        items: mockTableData.transfers,
      },
      staff_workload: {
        items: mockTableData.staff,
      },
      ...overrides.data,
    },
    isLoading: false,
    error: null,
    ...overrides,
  },
  loading: {
    data: null,
    isLoading: true,
    error: null,
  },
  error: {
    data: null,
    isLoading: false,
    error: new Error('Table data loading failed'),
  },
});

// 統一的 Mock Hook 工廠
export const createUnifiedMockHook = (mockReturn: any) => {
  return jest.fn(() => mockReturn);
};

// Storybook Decorator 工廠
export const createMockDecorator = (mockHookPath: string, mockData: any) => {
  return (Story: any, context: any) => {
    const { args } = context;
    const mockReturn = args.mockData || mockData.success;
    
    // Mock the hook
    jest.doMock(mockHookPath, () => ({
      useDashboardConcurrentQuery: () => mockReturn,
    }));

    return React.createElement(
      'div',
      { className: 'p-4' },
      React.createElement(Story)
    );
  };
};

// 常用配置模板
export const configTemplates = {
  stats: {
    base: {
      type: 'stats',
      title: 'Production Today',
      gridArea: 'widget1',
      dataSource: 'default',
      metrics: ['total_pallets'],
      description: 'Total pallets produced today',
    },
    efficiency: {
      type: 'stats',
      title: 'Production Efficiency',
      gridArea: 'widget2',
      dataSource: 'default',
      metrics: ['production_efficiency'],
      description: 'Current production efficiency rate',
    },
    errors: {
      type: 'stats',
      title: 'System Errors',
      gridArea: 'widget3',
      dataSource: 'default',
      metrics: ['error_count'],
      description: 'Number of system errors today',
    },
  },
  chart: {
    base: {
      type: 'chart',
      title: 'Production Overview',
      gridArea: 'widget1',
      dataSource: 'chart_data',
      chartType: 'bar' as const,
      description: 'Daily production statistics',
    },
    line: {
      type: 'chart',
      title: 'Monthly Trends',
      gridArea: 'widget2',
      dataSource: 'chart_data',
      chartType: 'line' as const,
      description: 'Production trends over time',
    },
    pie: {
      type: 'chart',
      title: 'Department Distribution',
      gridArea: 'widget3',
      dataSource: 'chart_data',
      chartType: 'pie' as const,
      description: 'Resource allocation by department',
    },
  },
  table: {
    base: {
      type: 'table',
      title: 'Orders List',
      gridArea: 'widget1',
      dataSource: 'orders_list',
      description: 'Recent orders and their status',
    },
    inventory: {
      type: 'table',
      title: 'Inventory Overview',
      gridArea: 'widget2',
      dataSource: 'inventory_data',
      description: 'Current stock levels and locations',
    },
    transfers: {
      type: 'table',
      title: 'Stock Transfers',
      gridArea: 'widget3',
      dataSource: 'transfer_list',
      description: 'Pending and completed stock transfers',
    },
  },
};

// 測試場景數據
export const testScenarios = {
  performance: {
    largeDataset: {
      statsData: { ...mockStatsData.success.data.default, total_pallets: 999999 },
      chartData: {
        labels: Array.from({ length: 50 }, (_, i) => `Item ${i + 1}`),
        values: Array.from({ length: 50 }, () => Math.floor(Math.random() * 1000)),
      },
      tableData: Array.from({ length: 100 }, (_, i) => ({
        id: `PERF-${i + 1}`,
        name: `Performance Item ${i + 1}`,
        value: Math.floor(Math.random() * 10000),
        status: ['Active', 'Inactive', 'Pending'][i % 3],
      })),
    },
  },
  edge: {
    emptyData: {
      statsData: { ...mockStatsData.success.data.default, total_pallets: 0 },
      chartData: { labels: [], values: [] },
      tableData: [],
    },
    extremeValues: {
      statsData: { 
        ...mockStatsData.success.data.default, 
        total_pallets: Number.MAX_SAFE_INTEGER,
        production_efficiency: 1.0,
      },
      chartData: {
        labels: ['Extreme'],
        values: [Number.MAX_SAFE_INTEGER],
      },
    },
  },
  realworld: {
    mixed: {
      statsData: {
        total_pallets: 1856,
        production_efficiency: 0.876,
        error_count: 3,
        success_rate: 0.924,
        downtime_hours: 2.5,
      },
      chartData: {
        labels: ['6AM', '8AM', '10AM', '12PM', '2PM', '4PM', '6PM', '8PM'],
        values: [45, 67, 89, 92, 87, 95, 78, 56],
      },
    },
  },
};

export default {
  mockStatsData,
  mockChartData,
  mockTableData,
  createMockChartData,
  createMockTableData,
  createUnifiedMockHook,
  createMockDecorator,
  configTemplates,
  testScenarios,
};