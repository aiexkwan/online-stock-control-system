/**
 * ChartCard Component Unit Tests
 * 測試 ChartCard 組件的所有核心功能
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import { ChartCard, ChartType } from '../ChartCard';
import { gql } from '@apollo/client';

// 測試數據
const mockTimeFrame = {
  start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  end: new Date().toISOString()
};

// GraphQL Query Mock
const CHART_CARD_QUERY = gql`
  query GetChartCardData($input: ChartQueryInput!) {
    chartCardData(input: $input) {
      id
      chartType
      title
      description
      datasets {
        label
        data {
          name
          value
          category
          timestamp
          metadata
        }
        color
        backgroundColor
        borderColor
      }
      config {
        showLegend
        showGrid
        showTooltip
        animation
        responsive
        maintainAspectRatio
        xAxisLabel
        yAxisLabel
      }
      metadata {
        lastUpdated
        cacheKey
        dataSource
      }
    }
  }
`;

// GraphQL Mocks
const mockLineChartData = {
  request: {
    query: CHART_CARD_QUERY,
    variables: {
      input: {
        chartType: ChartType.Line,
        timeFrame: mockTimeFrame,
        metrics: ['revenue'],
        dimensions: ['date'],
        filters: {},
        granularity: 'day'
      }
    }
  },
  result: {
    data: {
      chartCardData: {
        id: 'line-chart-1',
        chartType: ChartType.Line,
        title: 'Revenue Trend',
        description: 'Daily revenue over time',
        datasets: [
          {
            label: 'Revenue',
            data: [
              { name: '2025-01-01', value: 1000, category: null, timestamp: '2025-01-01T00:00:00Z', metadata: {} },
              { name: '2025-01-02', value: 1200, category: null, timestamp: '2025-01-02T00:00:00Z', metadata: {} },
              { name: '2025-01-03', value: 1100, category: null, timestamp: '2025-01-03T00:00:00Z', metadata: {} }
            ],
            color: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderColor: '#3B82F6'
          }
        ],
        config: {
          showLegend: true,
          showGrid: true,
          showTooltip: true,
          animation: true,
          responsive: true,
          maintainAspectRatio: false,
          xAxisLabel: 'Date',
          yAxisLabel: 'Revenue ($)'
        },
        metadata: {
          lastUpdated: '2025-01-03T12:00:00Z',
          cacheKey: 'line-chart-revenue-cache',
          dataSource: 'analytics'
        }
      }
    }
  }
};

const mockBarChartData = {
  request: {
    query: CHART_CARD_QUERY,
    variables: {
      input: {
        chartType: ChartType.Bar,
        timeFrame: mockTimeFrame,
        metrics: ['quantity'],
        dimensions: ['product'],
        filters: {},
        granularity: 'day'
      }
    }
  },
  result: {
    data: {
      chartCardData: {
        id: 'bar-chart-1',
        chartType: ChartType.Bar,
        title: 'Product Quantities',
        description: 'Quantity by product',
        datasets: [
          {
            label: 'Quantity',
            data: [
              { name: 'Product A', value: 50, category: 'Electronics', timestamp: null, metadata: {} },
              { name: 'Product B', value: 30, category: 'Clothing', timestamp: null, metadata: {} },
              { name: 'Product C', value: 45, category: 'Electronics', timestamp: null, metadata: {} }
            ],
            color: '#10B981',
            backgroundColor: '#10B981',
            borderColor: '#10B981'
          }
        ],
        config: {
          showLegend: false,
          showGrid: true,
          showTooltip: true,
          animation: true,
          responsive: true,
          maintainAspectRatio: false,
          xAxisLabel: 'Products',
          yAxisLabel: 'Quantity'
        },
        metadata: {
          lastUpdated: '2025-01-03T12:00:00Z',
          cacheKey: 'bar-chart-quantity-cache',
          dataSource: 'inventory'
        }
      }
    }
  }
};

const mockPieChartData = {
  request: {
    query: CHART_CARD_QUERY,
    variables: {
      input: {
        chartType: ChartType.Pie,
        timeFrame: mockTimeFrame,
        metrics: ['percentage'],
        dimensions: ['category'],
        filters: {},
        granularity: 'day'
      }
    }
  },
  result: {
    data: {
      chartCardData: {
        id: 'pie-chart-1',
        chartType: ChartType.Pie,
        title: 'Category Distribution',
        description: 'Distribution by category',
        datasets: [
          {
            label: 'Distribution',
            data: [
              { name: 'Electronics', value: 40, category: 'Electronics', timestamp: null, metadata: {} },
              { name: 'Clothing', value: 30, category: 'Clothing', timestamp: null, metadata: {} },
              { name: 'Food', value: 30, category: 'Food', timestamp: null, metadata: {} }
            ],
            color: null,
            backgroundColor: ['#3B82F6', '#10B981', '#F59E0B'],
            borderColor: null
          }
        ],
        config: {
          showLegend: true,
          showGrid: false,
          showTooltip: true,
          animation: true,
          responsive: true,
          maintainAspectRatio: false,
          xAxisLabel: null,
          yAxisLabel: null
        },
        metadata: {
          lastUpdated: '2025-01-03T12:00:00Z',
          cacheKey: 'pie-chart-category-cache',
          dataSource: 'analytics'
        }
      }
    }
  }
};

// Error mock
const mockErrorData = {
  request: {
    query: CHART_CARD_QUERY,
    variables: {
      input: {
        chartType: ChartType.Line,
        timeFrame: mockTimeFrame,
        metrics: ['error'],
        dimensions: ['date'],
        filters: {},
        granularity: 'day'
      }
    }
  },
  error: new Error('Failed to fetch chart data')
};

describe('ChartCard Component', () => {
  // 基本渲染測試
  describe('Basic Rendering', () => {
    it('should render line chart correctly', async () => {
      render(
        <MockedProvider mocks={[mockLineChartData]} addTypename={false}>
          <ChartCard
            chartType={ChartType.Line}
            metrics={['revenue']}
            dimensions={['date']}
            granularity="day"
            timeFrame={mockTimeFrame}
          />
        </MockedProvider>
      );

      // 等待數據加載
      await waitFor(() => {
        expect(screen.getByText('Revenue Trend')).toBeInTheDocument();
      });

      // 檢查圖表描述
      expect(screen.getByText('Daily revenue over time')).toBeInTheDocument();

      // 檢查圖表容器
      expect(screen.getByTestId('chart-container')).toBeInTheDocument();
    });

    it('should render bar chart correctly', async () => {
      render(
        <MockedProvider mocks={[mockBarChartData]} addTypename={false}>
          <ChartCard
            chartType={ChartType.Bar}
            metrics={['quantity']}
            dimensions={['product']}
            granularity="day"
            timeFrame={mockTimeFrame}
          />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Product Quantities')).toBeInTheDocument();
      });

      expect(screen.getByText('Quantity by product')).toBeInTheDocument();
    });

    it('should render pie chart correctly', async () => {
      render(
        <MockedProvider mocks={[mockPieChartData]} addTypename={false}>
          <ChartCard
            chartType={ChartType.Pie}
            metrics={['percentage']}
            dimensions={['category']}
            granularity="day"
            timeFrame={mockTimeFrame}
          />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Category Distribution')).toBeInTheDocument();
      });

      expect(screen.getByText('Distribution by category')).toBeInTheDocument();
    });
  });

  // 加載狀態測試
  describe('Loading States', () => {
    it('should show loading state initially', () => {
      render(
        <MockedProvider mocks={[mockLineChartData]} addTypename={false}>
          <ChartCard
            chartType={ChartType.Line}
            metrics={['revenue']}
            dimensions={['date']}
            granularity="day"
            timeFrame={mockTimeFrame}
          />
        </MockedProvider>
      );

      expect(screen.getByTestId('chart-skeleton')).toBeInTheDocument();
    });
  });

  // 錯誤處理測試
  describe('Error Handling', () => {
    it('should display error message when query fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <MockedProvider mocks={[mockErrorData]} addTypename={false}>
          <ChartCard
            chartType={ChartType.Line}
            metrics={['error']}
            dimensions={['date']}
            granularity="day"
            timeFrame={mockTimeFrame}
          />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/Failed to load chart data/i)).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  // 交互測試
  describe('Interactions', () => {
    it('should handle refresh correctly', async () => {
      const mockRefetch = jest.fn();
      const mockWithRefetch = {
        ...mockLineChartData,
        result: {
          ...mockLineChartData.result,
          refetch: mockRefetch
        }
      };

      render(
        <MockedProvider mocks={[mockWithRefetch]} addTypename={false}>
          <ChartCard
            chartType={ChartType.Line}
            metrics={['revenue']}
            dimensions={['date']}
            granularity="day"
            timeFrame={mockTimeFrame}
            onRefresh={mockRefetch}
          />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Revenue Trend')).toBeInTheDocument();
      });

      // 找到並點擊刷新按鈕
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);

      expect(mockRefetch).toHaveBeenCalled();
    });

    it('should handle time range changes', async () => {
      const onTimeRangeChange = jest.fn();

      render(
        <MockedProvider mocks={[mockLineChartData]} addTypename={false}>
          <ChartCard
            chartType={ChartType.Line}
            metrics={['revenue']}
            dimensions={['date']}
            granularity="day"
            timeFrame={mockTimeFrame}
            onTimeRangeChange={onTimeRangeChange}
          />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Revenue Trend')).toBeInTheDocument();
      });

      // 測試時間範圍選擇器（如果有的話）
      const timeRangeButton = screen.queryByRole('button', { name: /time range/i });
      if (timeRangeButton) {
        fireEvent.click(timeRangeButton);
        expect(onTimeRangeChange).toHaveBeenCalled();
      }
    });
  });

  // 編輯模式測試
  describe('Edit Mode', () => {
    it('should show edit controls in edit mode', async () => {
      render(
        <MockedProvider mocks={[mockLineChartData]} addTypename={false}>
          <ChartCard
            chartType={ChartType.Line}
            metrics={['revenue']}
            dimensions={['date']}
            granularity="day"
            timeFrame={mockTimeFrame}
            isEditMode={true}
          />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Revenue Trend')).toBeInTheDocument();
      });

      // 檢查編輯控制項
      expect(screen.getByTestId('edit-controls')).toBeInTheDocument();
    });

    it('should handle chart type changes in edit mode', async () => {
      const onUpdate = jest.fn();

      render(
        <MockedProvider mocks={[mockLineChartData]} addTypename={false}>
          <ChartCard
            chartType={ChartType.Line}
            metrics={['revenue']}
            dimensions={['date']}
            granularity="day"
            timeFrame={mockTimeFrame}
            isEditMode={true}
            onUpdate={onUpdate}
          />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Revenue Trend')).toBeInTheDocument();
      });

      // 測試圖表類型切換
      const chartTypeSelect = screen.getByLabelText(/chart type/i);
      fireEvent.change(chartTypeSelect, { target: { value: ChartType.Bar } });

      expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({
        chartType: ChartType.Bar
      }));
    });
  });

  // 響應式測試
  describe('Responsive Behavior', () => {
    it('should be responsive to container size', async () => {
      render(
        <MockedProvider mocks={[mockLineChartData]} addTypename={false}>
          <ChartCard
            chartType={ChartType.Line}
            metrics={['revenue']}
            dimensions={['date']}
            granularity="day"
            timeFrame={mockTimeFrame}
          />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Revenue Trend')).toBeInTheDocument();
      });

      const chartContainer = screen.getByTestId('chart-container');
      expect(chartContainer).toHaveClass('responsive-container');
    });
  });

  // 數據更新測試
  describe('Data Updates', () => {
    it('should update when filters change', async () => {
      const { rerender } = render(
        <MockedProvider mocks={[mockLineChartData]} addTypename={false}>
          <ChartCard
            chartType={ChartType.Line}
            metrics={['revenue']}
            dimensions={['date']}
            granularity="day"
            timeFrame={mockTimeFrame}
            filters={{}}
          />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Revenue Trend')).toBeInTheDocument();
      });

      // 更新 filters
      const newMock = {
        ...mockLineChartData,
        request: {
          ...mockLineChartData.request,
          variables: {
            ...mockLineChartData.request.variables,
            input: {
              ...mockLineChartData.request.variables.input,
              filters: { category: 'Electronics' }
            }
          }
        }
      };

      rerender(
        <MockedProvider mocks={[newMock]} addTypename={false}>
          <ChartCard
            chartType={ChartType.Line}
            metrics={['revenue']}
            dimensions={['date']}
            granularity="day"
            timeFrame={mockTimeFrame}
            filters={{ category: 'Electronics' }}
          />
        </MockedProvider>
      );

      // 檢查是否重新加載數據
      expect(screen.getByTestId('chart-skeleton')).toBeInTheDocument();
    });
  });

  // 性能測試
  describe('Performance', () => {
    it('should memoize chart configurations', async () => {
      const { rerender } = render(
        <MockedProvider mocks={[mockLineChartData]} addTypename={false}>
          <ChartCard
            chartType={ChartType.Line}
            metrics={['revenue']}
            dimensions={['date']}
            granularity="day"
            timeFrame={mockTimeFrame}
          />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Revenue Trend')).toBeInTheDocument();
      });

      // 使用相同的 props 重新渲染
      rerender(
        <MockedProvider mocks={[mockLineChartData]} addTypename={false}>
          <ChartCard
            chartType={ChartType.Line}
            metrics={['revenue']}
            dimensions={['date']}
            granularity="day"
            timeFrame={mockTimeFrame}
          />
        </MockedProvider>
      );

      // 應該不會重新請求數據
      expect(screen.queryByTestId('chart-skeleton')).not.toBeInTheDocument();
    });
  });

  // 可訪問性測試
  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(
        <MockedProvider mocks={[mockLineChartData]} addTypename={false}>
          <ChartCard
            chartType={ChartType.Line}
            metrics={['revenue']}
            dimensions={['date']}
            granularity="day"
            timeFrame={mockTimeFrame}
          />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Revenue Trend')).toBeInTheDocument();
      });

      const chartRegion = screen.getByRole('region', { name: /revenue trend chart/i });
      expect(chartRegion).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();

      render(
        <MockedProvider mocks={[mockLineChartData]} addTypename={false}>
          <ChartCard
            chartType={ChartType.Line}
            metrics={['revenue']}
            dimensions={['date']}
            granularity="day"
            timeFrame={mockTimeFrame}
            onRefresh={jest.fn()}
          />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Revenue Trend')).toBeInTheDocument();
      });

      // Tab to refresh button
      await user.tab();
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      expect(refreshButton).toHaveFocus();

      // Press Enter to activate
      await user.keyboard('{Enter}');
      expect(refreshButton).toHaveBeenCalled();
    });
  });
});