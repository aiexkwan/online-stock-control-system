import type { Meta, StoryObj } from '@storybook/react';
import { UnifiedStatsWidgetMockWrapper } from './components/UnifiedStatsWidgetMockWrapper';
import { AdminWidgetConfig } from '@/app/admin/components/dashboard/adminDashboardLayouts';
import React from 'react';

// Mock 數據生成器
const createMockData = (type: 'success' | 'loading' | 'error', overrides: any = {}) => {
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
        error: new Error('資料載入失敗'),
        ...overrides,
      };
    case 'success':
    default:
      return {
        data: {
          default: {
            total_pallets: 1234,
            production_efficiency: 0.85,
            error_count: 5,
            success_rate: 0.95,
            dynamic_metric_1: 567,
            dynamic_metric_2: 89.2,
            ...overrides.data,
          },
        },
        isLoading: false,
        error: null,
        ...overrides,
      };
  }
};

// 基礎配置模板
const baseConfig: AdminWidgetConfig = {
  type: 'stats',
  title: 'Production Today',
  gridArea: 'widget1',
  dataSource: 'default',
  metrics: ['total_pallets'],
  description: 'Total pallets produced today',
};

const meta: Meta<typeof UnifiedStatsWidgetMockWrapper> = {
  title: 'Dashboard/UnifiedStatsWidget',
  component: UnifiedStatsWidgetMockWrapper,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
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
    (Story, context) => {
      // For Storybook, we'll handle mocking through component props
      return (
        <div className="w-[400px] h-[200px] p-4">
          <Story />
        </div>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// 基礎 Stories
export const Default: Story = {
  args: {
    config: baseConfig,
    mockData: createMockData('success'),
  },
};

export const WithDateRange: Story = {
  args: {
    config: baseConfig,
    dateRange: {
      start: '2025-01-01',
      end: '2025-01-31',
    },
    mockData: createMockData('success'),
  },
};

export const WithWarehouse: Story = {
  args: {
    config: {
      ...baseConfig,
      title: 'Warehouse A Production',
    },
    warehouse: 'warehouse-a',
    mockData: createMockData('success'),
  },
};

// Loading 狀態
export const Loading: Story = {
  args: {
    config: baseConfig,
    mockData: createMockData('loading'),
  },
};

// 錯誤狀態
export const Error: Story = {
  args: {
    config: baseConfig,
    mockData: createMockData('error'),
  },
};

// 不同統計類型
export const ProductionEfficiency: Story = {
  args: {
    config: {
      ...baseConfig,
      title: 'Production Efficiency',
      metrics: ['production_efficiency'],
      description: 'Current production efficiency rate',
    },
    mockData: createMockData('success', {
      data: {
        default: {
          production_efficiency: 0.876,
        },
      },
    }),
  },
};

export const ErrorCount: Story = {
  args: {
    config: {
      ...baseConfig,
      title: 'System Errors',
      metrics: ['error_count'],
      description: 'Number of system errors today',
    },
    mockData: createMockData('success', {
      data: {
        default: {
          error_count: 3,
        },
      },
    }),
  },
};

export const SuccessRate: Story = {
  args: {
    config: {
      ...baseConfig,
      title: 'Success Rate',
      metrics: ['success_rate'],
      description: 'Overall success rate percentage',
    },
    mockData: createMockData('success', {
      data: {
        default: {
          success_rate: 0.924,
        },
      },
    }),
  },
};

// 大數值顯示
export const LargeNumbers: Story = {
  args: {
    config: {
      ...baseConfig,
      title: 'Total Units',
      metrics: ['total_units'],
      description: 'Total units processed',
    },
    mockData: createMockData('success', {
      data: {
        default: {
          total_units: 2456789,
        },
      },
    }),
  },
};

export const MillionUnits: Story = {
  args: {
    config: {
      ...baseConfig,
      title: 'Annual Production',
      metrics: ['annual_production'],
      description: 'Annual production volume',
    },
    mockData: createMockData('success', {
      data: {
        default: {
          annual_production: 15678234,
        },
      },
    }),
  },
};

// 多指標配置
export const MultipleMetrics: Story = {
  args: {
    config: {
      ...baseConfig,
      title: 'Primary Metric',
      metrics: ['dynamic_metric_1', 'dynamic_metric_2', 'dynamic_metric_3'],
      description: 'Primary metric with additional context',
    },
    mockData: createMockData('success', {
      data: {
        default: {
          dynamic_metric_1: 567,
          dynamic_metric_2: 89.2,
          dynamic_metric_3: 23.7,
        },
      },
    }),
  },
};

// 不同數據源
export const DifferentDataSource: Story = {
  args: {
    config: {
      ...baseConfig,
      title: 'Inventory Level',
      dataSource: 'inventory_data',
      metrics: ['current_stock'],
    },
    mockData: createMockData('success', {
      data: {
        inventory_data: {
          current_stock: 8245,
        },
      },
    }),
  },
};

// 極端情況
export const ZeroValue: Story = {
  args: {
    config: {
      ...baseConfig,
      title: 'System Downtime',
      metrics: ['downtime_hours'],
      description: 'Hours of system downtime today',
    },
    mockData: createMockData('success', {
      data: {
        default: {
          downtime_hours: 0,
        },
      },
    }),
  },
};

export const NoData: Story = {
  args: {
    config: baseConfig,
    mockData: createMockData('success', {
      data: {
        wrong_source: {
          some_data: 123,
        },
      },
    }),
  },
};

// 性能優化展示
export const OptimizedWidget: Story = {
  args: {
    config: {
      ...baseConfig,
      title: 'Optimized Metric',
      description: 'Optimized with REST API',
    },
    mockData: createMockData('success'),
  },
};