import type { Meta, StoryObj } from '@storybook/react';
import { DatabaseRecord } from '@/lib/types/database';
import { UnifiedTableWidgetMockWrapper } from './components/UnifiedTableWidgetMockWrapper';
import { AdminWidgetConfig } from '@/app/admin/components/dashboard/adminDashboardLayouts';
import React from 'react';

// Mock 表格數據生成器
const createMockTableData = (type: 'orders' | 'inventory' | 'transfers' | 'staff' | 'custom', count: number = 5) => {
  const generateData = (count: number, template: any) => {
    return Array.from({ length: count }, (_, index) => {
      const data = { ...template };
      Object.keys(data).forEach(key => {
        if (typeof data[key] === 'function') {
          data[key] = data[key](index);
        }
      });
      return data;
    });
  };

  switch (type) {
    case 'orders':
      return generateData(count, {
        id: (i: number) => `ORD-${String(i + 1).padStart(4, '0')}`,
        order_number: (i: number) => `2025-${String(i + 100)}`,
        customer: (i: number) => `Customer ${String.fromCharCode(65 + (i % 26))}`,
        status: (i: number) => ['Pending', 'Processing', 'Shipped', 'Delivered'][i % 4],
        date: (i: number) => new Date(2025, 0, i + 1).toISOString().split('T')[0],
        items: (i: number) => Math.floor(Math.random() * 20) + 1,
        total_amount: (i: number) => Math.floor(Math.random() * 5000) + 500,
      });
      
    case 'inventory':
      return generateData(count, {
        id: (i: number) => `ITM-${String(i + 1).padStart(4, '0')}`,
        product_code: (i: number) => `P${String(i + 1000)}`,
        product_name: (i: number) => `Product ${i + 1}`,
        category: (i: number) => ['Electronics', 'Machinery', 'Tools', 'Materials'][i % 4],
        quantity: (i: number) => Math.floor(Math.random() * 1000) + 10,
        location: (i: number) => `A${Math.floor(i / 3) + 1}-${(i % 3) + 1}`,
        last_updated: (i: number) => new Date(2025, 0, 18 - i).toISOString(),
      });
      
    case 'transfers':
      return generateData(count, {
        id: (i: number) => `TRF-${String(i + 1).padStart(4, '0')}`,
        from_location: (i: number) => `A${Math.floor(i / 2) + 1}-${(i % 2) + 1}`,
        to_location: (i: number) => `B${Math.floor(i / 2) + 1}-${(i % 2) + 1}`,
        product_code: (i: number) => `P${String(i + 2000)}`,
        quantity: (i: number) => Math.floor(Math.random() * 100) + 1,
        status: (i: number) => ['Pending', 'In Progress', 'Completed'][i % 3],
        created_at: (i: number) => new Date(2025, 0, 18 - i).toISOString(),
        staff_name: (i: number) => `Staff ${String.fromCharCode(65 + (i % 10))}`,
      });
      
    case 'staff':
      return generateData(count, {
        id: (i: number) => `STF-${String(i + 1).padStart(3, '0')}`,
        staff_name: (i: number) => `${['John', 'Jane', 'Bob', 'Alice', 'Charlie'][i % 5]} ${['Doe', 'Smith', 'Johnson', 'Williams', 'Brown'][Math.floor(i / 5) % 5]}`,
        department: (i: number) => ['Production', 'Quality Control', 'Warehouse', 'Management'][i % 4],
        shift: (i: number) => ['Morning', 'Afternoon', 'Night'][i % 3],
        tasks_completed: (i: number) => Math.floor(Math.random() * 50) + 10,
        tasks_pending: (i: number) => Math.floor(Math.random() * 20),
        efficiency: (i: number) => Math.floor(Math.random() * 30) + 70,
        last_active: (i: number) => new Date(Date.now() - (i * 1800000)).toISOString(),
      });
      
    case 'custom':
    default:
      return generateData(count, {
        id: (i: number) => `ITEM-${i + 1}`,
        name: (i: number) => `Item ${i + 1}`,
        value: (i: number) => Math.floor(Math.random() * 1000) + 1,
        category: (i: number) => `Category ${String.fromCharCode(65 + (i % 5))}`,
        active: (i: number) => i % 3 !== 0,
        created_date: (i: number) => new Date(2025, 0, i + 1).toISOString().split('T')[0],
      });
  }
};

// Mock hook 實現
const createMockData = (type: 'success' | 'loading' | 'error', dataType: string = 'orders', dataCount: number = 10, overrides: DatabaseRecord = {}) => {
  switch (type) {
    case 'loading':
      return {
        data: null,
        isLoading: true,
        error: null,
        ...overrides,
      };
    case 'error':
      return {
        data: null,
        isLoading: false,
        error: new globalThis.Error('Table data loading failed'),
        ...overrides,
      };
    case 'success':
    default:
      const mockData = createMockTableData(dataType as any, dataCount);
      return {
        data: {
          table_data: {
            items: mockData,
            columns: mockData.length > 0 ? Object.keys(mockData[0]) : [],
          },
          orders_list: {
            items: createMockTableData('orders', dataCount),
          },
          inventory_data: {
            rows: createMockTableData('inventory', dataCount),
          },
          transfer_list: {
            items: createMockTableData('transfers', dataCount),
          },
          staff_workload: {
            items: createMockTableData('staff', dataCount),
          },
          // Strategy 4: unknown + type narrowing - 安全的對象展開
          ...(overrides.data && typeof overrides.data === 'object' ? overrides.data as Record<string, unknown> : {}),
        },
        isLoading: false,
        error: null,
        ...overrides,
      };
  }
};

// 基礎配置模板
const baseConfig: AdminWidgetConfig = {
  type: 'table',
  title: 'Orders List',
  gridArea: 'widget1',
  dataSource: 'orders_list',
  description: 'Recent orders and their status',
};

const meta: Meta<typeof UnifiedTableWidgetMockWrapper> = {
  title: 'Dashboard/UnifiedTableWidget',
  component: UnifiedTableWidgetMockWrapper,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'light',
      values: [
        { name: 'dark', value: '#0f172a' },
        { name: 'light', value: '#ffffff' },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    config: {
      control: 'object',
      description: 'Widget configuration object',
    },
    dateRange: {
      control: 'object',
      description: 'Date range for filtering data',
    },
    warehouse: {
      control: 'text',
      description: 'Warehouse filter',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[800px] h-[600px] p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// 基礎 Stories
export const Default: Story = {
  args: {
    config: baseConfig,
    mockData: createMockData('success', 'orders', 8),
  },
};

// 不同數據類型
export const OrdersList: Story = {
  args: {
    config: {
      ...baseConfig,
      title: 'Recent Orders',
      dataSource: 'orders_list',
      description: 'Customer orders and delivery status',
    },
    mockData: createMockData('success', 'orders', 12),
  },
};

export const InventoryData: Story = {
  args: {
    config: {
      ...baseConfig,
      title: 'Inventory Overview',
      dataSource: 'inventory_data',
      description: 'Current stock levels and locations',
    },
    mockData: createMockData('success', 'inventory', 15),
  },
};

export const TransferList: Story = {
  args: {
    config: {
      ...baseConfig,
      title: 'Stock Transfers',
      dataSource: 'transfer_list',
      description: 'Pending and completed stock transfers',
    },
    mockData: createMockData('success', 'transfers', 10),
  },
};

export const StaffWorkload: Story = {
  args: {
    config: {
      ...baseConfig,
      title: 'Staff Performance',
      dataSource: 'staff_workload',
      description: 'Staff productivity and task completion',
    },
    mockData: createMockData('success', 'staff', 8),
  },
};

// 狀態 Stories
export const Loading: Story = {
  args: {
    config: baseConfig,
    mockData: createMockData('loading'),
  },
};

export const Error: Story = {
  args: {
    config: baseConfig,
    mockData: createMockData('error'),
  },
};

export const NoData: Story = {
  args: {
    config: baseConfig,
    mockData: createMockData('success', 'orders', 0),
  },
};

export const WrongDataSource: Story = {
  args: {
    config: {
      ...baseConfig,
      dataSource: 'non_existent_source',
    },
    mockData: createMockData('success', 'orders', 5),
  },
};

// 大型數據集
export const LargeDataset: Story = {
  args: {
    config: {
      ...baseConfig,
      title: 'Large Dataset',
      description: 'Performance test with large amount of data',
    },
    mockData: createMockData('success', 'orders', 50),
  },
};

// 單一記錄
export const SingleRecord: Story = {
  args: {
    config: {
      ...baseConfig,
      title: 'Single Record',
      description: 'Table with only one record',
    },
    mockData: createMockData('success', 'orders', 1),
  },
};

// 複雜數據結構
export const ComplexData: Story = {
  args: {
    config: {
      ...baseConfig,
      title: 'Complex Data Structure',
      dataSource: 'complex_data',
    },
    mockData: createMockData('success', 'custom', 5, {
      data: {
        complex_data: {
          items: [
            {
              id: 'COMP-001',
              nested_object: { value: 123, label: 'Nested Value' },
              array_field: ['Item 1', 'Item 2', 'Item 3'],
              boolean_field: true,
              date_field: '2025-01-18',
              long_text: 'This is a very long text field that should be truncated when displayed in the table to ensure good user experience',
              null_field: null,
              undefined_field: undefined,
            },
            {
              id: 'COMP-002',
              nested_object: { value: 456, label: 'Another Nested' },
              array_field: ['Item A', 'Item B'],
              boolean_field: false,
              date_field: '2025-01-17',
              long_text: 'Another long text example',
              null_field: null,
              undefined_field: undefined,
            },
          ],
        },
      },
    }),
  },
};

// 數值格式化測試
export const NumericFormatting: Story = {
  args: {
    config: {
      ...baseConfig,
      title: 'Numeric Formatting',
      dataSource: 'numeric_data',
    },
    mockData: createMockData('success', 'custom', 5, {
      data: {
        numeric_data: {
          items: [
            { id: 1, small_number: 42, large_number: 1234567, million_number: 15678234, percentage: 0.856 },
            { id: 2, small_number: 789, large_number: 9876543, million_number: 87654321, percentage: 0.234 },
            { id: 3, small_number: 123, large_number: 5555555, million_number: 99999999, percentage: 0.987 },
          ],
        },
      },
    }),
  },
};

// 日期欄位測試
export const DateFormatting: Story = {
  args: {
    config: {
      ...baseConfig,
      title: 'Date Formatting',
      dataSource: 'date_data',
    },
    mockData: createMockData('success', 'custom', 5, {
      data: {
        date_data: {
          items: [
            { id: 1, created_date: '2025-01-18', updated_time: 1737139200000, last_accessed: new Date().toISOString() },
            { id: 2, created_date: '2025-01-17', updated_time: 1737052800000, last_accessed: new Date(Date.now() - 86400000).toISOString() },
            { id: 3, created_date: '2025-01-16', updated_time: 1736966400000, last_accessed: new Date(Date.now() - 172800000).toISOString() },
          ],
        },
      },
    }),
  },
};

// 帶日期範圍的表格
export const WithDateRange: Story = {
  args: {
    config: {
      ...baseConfig,
      title: 'January Orders',
    },
    dateRange: {
      start: '2025-01-01',
      end: '2025-01-31',
    },
    mockData: createMockData('success', 'orders', 10),
  },
};

// 帶倉庫過濾的表格
export const WithWarehouseFilter: Story = {
  args: {
    config: {
      ...baseConfig,
      title: 'Warehouse A Orders',
    },
    warehouse: 'warehouse-a',
    mockData: createMockData('success', 'orders', 6),
  },
};

// 不同數據結構 - rows 而非 items
export const RowsDataStructure: Story = {
  args: {
    config: {
      ...baseConfig,
      title: 'Rows Data Structure',
      dataSource: 'rows_data',
    },
    mockData: createMockData('success', 'custom', 5, {
      data: {
        rows_data: {
          rows: createMockTableData('inventory', 5),
          columns: ['id', 'product_code', 'product_name', 'quantity', 'location'],
        },
      },
    }),
  },
};

// 數組數據結構
export const ArrayDataStructure: Story = {
  args: {
    config: {
      ...baseConfig,
      title: 'Array Data Structure',
      dataSource: 'array_data',
    },
    mockData: createMockData('success', 'custom', 5, {
      data: {
        array_data: createMockTableData('transfers', 5),
      },
    }),
  },
};