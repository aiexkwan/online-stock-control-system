import type { Meta, StoryObj } from '@storybook/react';
import { DatabaseRecord } from '@/types/database/tables';
import { UnifiedChartWidgetMockWrapper } from './components/UnifiedChartWidgetMockWrapper';
import { AdminWidgetConfig } from '@/types/components/dashboard';
import React from 'react';

// Mock 圖表數據生成器
const createMockChartData = (chartType: string, dataSize: number = 5) => {
  const labels = [];
  const values = [];
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4'];

  for (let i = 0; i < dataSize; i++) {
    labels.push(`Item ${i + 1}`);
    values.push(Math.floor(Math.random() * 100) + 10);
  }

  switch (chartType) {
    case 'line':
      return {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        values: [65, 78, 90, 81, 95, 102],
        borderColors: ['#1E40AF'],
      };
    case 'area':
      return {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        values: [120, 190, 300, 500],
      };
    case 'pie':
    case 'donut':
      return {
        labels: ['Production', 'Quality Control', 'Packaging', 'Shipping', 'Storage'],
        values: [30, 20, 25, 15, 10],
        colors: colors.slice(0, 5),
      };
    case 'bar':
    default:
      return {
        labels,
        values,
        colors: colors.slice(0, dataSize),
      };
  }
};

// Mock hook 實現
const createMockData = (
  type: 'success' | 'loading' | 'error',
  chartType: string = 'bar',
  overrides: Partial<DatabaseRecord> = {}
) => {
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
        error: new globalThis.Error('Chart data loading failed'),
        ...overrides,
      };
    case 'success':
    default:
      return {
        data: {
          chart_data: createMockChartData(chartType),
          production_stats: createMockChartData('line'),
          distribution_data: createMockChartData('pie'),
          ...(overrides?.data && typeof overrides.data === 'object' ? overrides.data : {}),
        },
        isLoading: false,
        error: null,
        ...overrides,
      };
  }
};

// 基礎配置模板
const baseConfig: AdminWidgetConfig = {
  type: 'chart',
  title: 'Production Overview',
  gridArea: 'widget1',
  dataSource: 'chart_data',
  chartType: 'bar',
  description: 'Daily production statistics',
};

const meta: Meta<typeof UnifiedChartWidgetMockWrapper> = {
  title: 'Dashboard/UnifiedChartWidget',
  component: UnifiedChartWidgetMockWrapper,
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
    Story => (
      <div className='h-[400px] w-[600px] p-4'>
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
    mockData: createMockData('success', 'bar'),
  },
};

// 不同圖表類型
export const BarChart: Story = {
  args: {
    config: {
      ...baseConfig,
      title: 'Production by Department',
      chartType: 'bar',
    },
    mockData: createMockData('success', 'bar'),
  },
};

export const LineChart: Story = {
  args: {
    config: {
      ...baseConfig,
      title: 'Monthly Trends',
      chartType: 'line',
      description: 'Production trends over the last 6 months',
    },
    mockData: createMockData('success', 'line'),
  },
};

export const PieChart: Story = {
  args: {
    config: {
      ...baseConfig,
      title: 'Department Distribution',
      chartType: 'pie',
      description: 'Resource allocation by department',
    },
    mockData: createMockData('success', 'pie'),
  },
};

export const DonutChart: Story = {
  args: {
    config: {
      ...baseConfig,
      title: 'Process Distribution',
      chartType: 'donut',
      description: 'Process time distribution',
    },
    mockData: createMockData('success', 'donut'),
  },
};

export const AreaChart: Story = {
  args: {
    config: {
      ...baseConfig,
      title: 'Weekly Growth',
      chartType: 'area',
      description: 'Weekly production growth',
    },
    mockData: createMockData('success', 'area'),
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

// 特殊場景
export const NoData: Story = {
  args: {
    config: baseConfig,
    mockData: createMockData('success', 'bar', {
      data: {
        wrong_source: {
          some_data: 123,
        },
      },
    }),
  },
};

export const EmptyDataset: Story = {
  args: {
    config: baseConfig,
    mockData: createMockData('success', 'bar', {
      data: {
        chart_data: {
          labels: [],
          values: [],
        },
      },
    }),
  },
};

// 大型數據集
export const LargeDataset: Story = {
  args: {
    config: {
      ...baseConfig,
      title: 'Detailed Analysis',
      description: 'Comprehensive data visualization',
    },
    mockData: createMockData('success', 'bar', {
      data: {
        chart_data: {
          labels: Array.from({ length: 20 }, (_, i) => `Product ${i + 1}`),
          values: Array.from({ length: 20 }, () => Math.floor(Math.random() * 1000) + 100),
          colors: Array.from({ length: 20 }, (_, i) => `hsl(${(i * 18) % 360}, 70%, 50%)`),
        },
      },
    }),
  },
};

// 單一數據點
export const SingleDataPoint: Story = {
  args: {
    config: {
      ...baseConfig,
      title: 'Single Metric',
      chartType: 'bar',
    },
    mockData: createMockData('success', 'bar', {
      data: {
        chart_data: {
          labels: ['Total Production'],
          values: [1500],
          colors: ['#3B82F6'],
        },
      },
    }),
  },
};

// 零值數據
export const ZeroValues: Story = {
  args: {
    config: {
      ...baseConfig,
      title: 'Maintenance Period',
      description: 'No production during maintenance',
    },
    mockData: createMockData('success', 'bar', {
      data: {
        chart_data: {
          labels: ['Line 1', 'Line 2', 'Line 3', 'Line 4'],
          values: [0, 0, 0, 0],
          colors: ['#EF4444', '#EF4444', '#EF4444', '#EF4444'],
        },
      },
    }),
  },
};

// 時間序列數據
export const TimeSeriesData: Story = {
  args: {
    config: {
      ...baseConfig,
      title: 'Hourly Production',
      chartType: 'line',
      description: 'Production rate throughout the day',
    },
    mockData: createMockData('success', 'line', {
      data: {
        chart_data: {
          labels: ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'],
          values: [45, 67, 89, 92, 87, 95, 78, 56],
          borderColors: ['#10B981'],
        },
      },
    }),
  },
};

// 比較數據
export const ComparisonData: Story = {
  args: {
    config: {
      ...baseConfig,
      title: 'Department Comparison',
      chartType: 'bar',
      description: 'Performance comparison across departments',
    },
    mockData: createMockData('success', 'bar', {
      data: {
        chart_data: {
          labels: ['Injection', 'Pipeline', 'Warehouse', 'QC', 'Packaging'],
          values: [95, 87, 92, 89, 94],
          colors: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'],
        },
      },
    }),
  },
};

// 帶日期範圍的圖表
export const WithDateRange: Story = {
  args: {
    config: {
      ...baseConfig,
      title: 'January Production',
      chartType: 'area',
    },
    dateRange: {
      start: '2025-01-01',
      end: '2025-01-31',
    },
    mockData: createMockData('success', 'area'),
  },
};

// 帶倉庫過濾的圖表
export const WithWarehouseFilter: Story = {
  args: {
    config: {
      ...baseConfig,
      title: 'Warehouse A Analytics',
      chartType: 'line',
    },
    warehouse: 'warehouse-a',
    mockData: createMockData('success', 'line'),
  },
};
