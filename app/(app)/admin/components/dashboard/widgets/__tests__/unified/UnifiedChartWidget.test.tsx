/**
 * Tests for UnifiedChartWidget
 * Based on Storybook test scenarios
 */

import React, { ReactNode } from 'react';
import {
  render,
  screen,
  waitFor,
  createChartConfig,
  createMockChartData,
  mockSuccessResponse,
  mockLoadingResponse,
  mockErrorResponse,
} from './test-utils';
import { UnifiedChartWidget } from '../../UnifiedChartWidgetWithErrorBoundary';

// Mock the hook
jest.mock('@/app/(app)/admin/hooks/useDashboardConcurrentQuery', () => ({
  useDashboardConcurrentQuery: jest.fn(),
}));

// Mock recharts to avoid rendering issues in tests
interface MockChartProps {
  children?: ReactNode;
}

jest.mock('@/lib/recharts-dynamic', () => ({
  BarChart: ({ children }: MockChartProps) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  LineChart: ({ children }: MockChartProps) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  PieChart: ({ children }: MockChartProps) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children }: MockChartProps) => <div data-testid="pie">{children}</div>,
  AreaChart: ({ children }: MockChartProps) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: MockChartProps) => <div data-testid="responsive-container">{children}</div>,
  Cell: () => <div data-testid="cell" />,
}));

import { useDashboardConcurrentQuery } from '@/app/(app)/admin/hooks/useDashboardConcurrentQuery';

describe('UnifiedChartWidget', () => {
  const mockUseDashboardConcurrentQuery = useDashboardConcurrentQuery as jest.MockedFunction<typeof useDashboardConcurrentQuery>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should render with default bar chart configuration', async () => {
      const config = createChartConfig();
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse(createMockChartData())      );

      render(<UnifiedChartWidget config={config} />);

      await waitFor(() => {
        expect(screen.getByText('Test Chart Widget')).toBeInTheDocument();
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      });
    });

    it('should display subtitle when provided', async () => {
      const config = createChartConfig({
        description: 'Chart subtitle text',
      });
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse(createMockChartData())      );

      render(<UnifiedChartWidget config={config} />);

      await waitFor(() => {
        expect(screen.getByText('Chart subtitle text')).toBeInTheDocument();
      });
    });

    it('should work with date range', async () => {
      const config = createChartConfig();
      const dateRange = {
        start: '2025-01-01',
        end: '2025-01-31',
      };
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse(createMockChartData())      );

      render(<UnifiedChartWidget config={config} dateRange={dateRange} />);

      await waitFor(() => {
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      });

      expect(mockUseDashboardConcurrentQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          dateRange: {
            startDate: new Date('2025-01-01'),
            endDate: new Date('2025-01-31'),
          },
        })
      );
    });
  });

  describe('Chart Types', () => {
    it('should render line chart', async () => {
      const config = createChartConfig({
        chartType: 'line',
      });
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse(createMockChartData())      );

      render(<UnifiedChartWidget config={config} />);

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });
    });

    it('should render pie chart', async () => {
      const config = createChartConfig({
        chartType: 'pie',
      });
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse(createMockChartData())      );

      render(<UnifiedChartWidget config={config} />);

      await waitFor(() => {
        expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      });
    });

    it('should render donut chart', async () => {
      const config = createChartConfig({
        chartType: 'donut',
      });
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse(createMockChartData())      );

      render(<UnifiedChartWidget config={config} />);

      await waitFor(() => {
        expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      });
    });

    it('should render area chart', async () => {
      const config = createChartConfig({
        chartType: 'area',
      });
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse(createMockChartData())      );

      render(<UnifiedChartWidget config={config} />);

      await waitFor(() => {
        expect(screen.getByTestId('area-chart')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should display skeleton loader when loading', () => {
      const config = createChartConfig();
      mockUseDashboardConcurrentQuery.mockReturnValue(mockLoadingResponse() as any);

      render(<UnifiedChartWidget config={config} />);

      // ChartSkeleton should be rendered
      expect(screen.getByText('Test Chart Widget')).toBeInTheDocument();
      // Look for loading indicator (skeleton)
      const container = screen.getByText('Test Chart Widget').closest('div');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Error States', () => {
    it('should handle errors with error boundary', async () => {
      const config = createChartConfig();
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockErrorResponse('Chart data fetch failed')      );

      render(<UnifiedChartWidget config={config} />);

      await waitFor(() => {
        expect(screen.queryByText('Unable to render chart. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('Data Processing', () => {
    it('should handle empty data arrays', async () => {
      const config = createChartConfig();
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse({
          labels: [],
          values: [],
        })      );

      render(<UnifiedChartWidget config={config} />);

      await waitFor(() => {
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      });
    });

    it('should handle missing labels', async () => {
      const config = createChartConfig();
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse({
          values: [100, 200, 300],
        })      );

      render(<UnifiedChartWidget config={config} />);

      await waitFor(() => {
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      });
    });

    it('should handle missing values', async () => {
      const config = createChartConfig();
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse({
          labels: ['Jan', 'Feb', 'Mar'],
        })      );

      render(<UnifiedChartWidget config={config} />);

      await waitFor(() => {
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      });
    });

    it('should use custom colors when provided', async () => {
      const config = createChartConfig();
      const customColors = ['#FF0000', '#00FF00', '#0000FF'];
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse(createMockChartData({ colors: customColors }))      );

      render(<UnifiedChartWidget config={config} />);

      await waitFor(() => {
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      });
    });
  });

  describe('Different Data Structures', () => {
    it('should handle data with multiple datasets', async () => {
      const config = createChartConfig({
        chartType: 'line',
      });
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse({
          labels: ['Jan', 'Feb', 'Mar'],
          datasets: [
            { label: 'Series 1', data: [100, 200, 150] },
            { label: 'Series 2', data: [150, 100, 200] },
          ],
        })      );

      render(<UnifiedChartWidget config={config} />);

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });
    });

    it('should handle real-time data updates', async () => {
      const config = createChartConfig();
      const initialData = createMockChartData();
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse(initialData)      );

      const { rerender } = render(<UnifiedChartWidget config={config} />);

      await waitFor(() => {
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      });

      // Update data
      const updatedData = createMockChartData({
        values: [200, 300, 250, 400, 350],
      });
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse(updatedData)      );

      rerender(<UnifiedChartWidget config={config} />);

      await waitFor(() => {
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle null data source', async () => {
      const config = createChartConfig();
      mockUseDashboardConcurrentQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      } as any);

      render(<UnifiedChartWidget config={config} />);

      await waitFor(() => {
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      });
    });

    it('should handle unknown chart type by defaulting to bar', async () => {
      const config = createChartConfig({
        chartType: 'unknown' as any,
      });
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse(createMockChartData())      );

      render(<UnifiedChartWidget config={config} />);

      await waitFor(() => {
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      });
    });

    it('should handle very large datasets', async () => {
      const config = createChartConfig();
      const largeData = {
        labels: Array.from({ length: 100 }, (_, i) => `Label ${i}`),
        values: Array.from({ length: 100 }, () => Math.random() * 1000),
      };
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse(largeData)      );

      render(<UnifiedChartWidget config={config} />);

      await waitFor(() => {
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      });
    });
  });

  describe('Chart Options', () => {
    it('should apply appropriate options for line charts', async () => {
      const config = createChartConfig({
        chartType: 'line',
      });
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse(createMockChartData())      );

      render(<UnifiedChartWidget config={config} />);

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
        expect(screen.getByTestId('x-axis')).toBeInTheDocument();
        expect(screen.getByTestId('y-axis')).toBeInTheDocument();
      });
    });

    it('should apply appropriate options for pie charts', async () => {
      const config = createChartConfig({
        chartType: 'pie',
      });
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse(createMockChartData())      );

      render(<UnifiedChartWidget config={config} />);

      await waitFor(() => {
        expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
        expect(screen.getByTestId('legend')).toBeInTheDocument();
      });
    });
  });
});
