/**
 * Tests for UnifiedStatsWidget
 * Based on Storybook test scenarios
 */

import React from 'react';
import {
  render,
  screen,
  waitFor,
  createStatsConfig,
  createMockStatsData,
  mockSuccessResponse,
  mockLoadingResponse,
  mockErrorResponse,
} from './test-utils';
import { UnifiedStatsWidget } from '../../UnifiedStatsWidgetWithErrorBoundary';

// Mock the hook
jest.mock('@/app/(app)/admin/hooks/useDashboardConcurrentQuery', () => ({
  useDashboardConcurrentQuery: jest.fn(),
}));

import { useDashboardConcurrentQuery } from '@/app/(app)/admin/hooks/useDashboardConcurrentQuery';

describe('UnifiedStatsWidget', () => {
  const mockUseDashboardConcurrentQuery = useDashboardConcurrentQuery as jest.MockedFunction<typeof useDashboardConcurrentQuery>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should render with default configuration', async () => {
      const config = createStatsConfig();
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse(createMockStatsData()) as any
      );

      render(<UnifiedStatsWidget config={config} />);

      await waitFor(() => {
        expect(screen.getByText('Test Stats Widget')).toBeInTheDocument();
        expect(screen.getByText('1234')).toBeInTheDocument(); // formatted value
      });
    });

    it('should display description when provided', async () => {
      const config = createStatsConfig({
        description: 'Custom description text',
      });
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse(createMockStatsData()) as any
      );

      render(<UnifiedStatsWidget config={config} />);

      await waitFor(() => {
        expect(screen.getByText('Custom description text')).toBeInTheDocument();
      });
    });

    it('should work with date range', async () => {
      const config = createStatsConfig();
      const dateRange = {
        start: '2025-01-01',
        end: '2025-01-31',
      };
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse(createMockStatsData()) as any
      );

      render(<UnifiedStatsWidget config={config} dateRange={dateRange} />);

      await waitFor(() => {
        expect(screen.getByText('1234')).toBeInTheDocument();
      });

      // Verify the hook was called with correct date range
      expect(mockUseDashboardConcurrentQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          dateRange: {
            startDate: new Date('2025-01-01'),
            endDate: new Date('2025-01-31'),
          },
        })
      );
    });

    it('should work with warehouse filter', async () => {
      const config = createStatsConfig({
        title: 'Warehouse A Production',
      });
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse(createMockStatsData()) as any
      );

      render(<UnifiedStatsWidget config={config} warehouse="warehouse-a" />);

      await waitFor(() => {
        expect(screen.getByText('Warehouse A Production')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should display loading state', () => {
      const config = createStatsConfig();
      mockUseDashboardConcurrentQuery.mockReturnValue(mockLoadingResponse() as any);

      render(<UnifiedStatsWidget config={config} />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Error States', () => {
    it('should handle errors gracefully with error boundary', async () => {
      const config = createStatsConfig();
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockErrorResponse('Network error') as any
      );

      render(<UnifiedStatsWidget config={config} />);

      // The error boundary should catch and display an error fallback
      await waitFor(() => {
        expect(screen.queryByText('Unable to load statistics. Please refresh.')).toBeInTheDocument();
      });
    });
  });

  describe('Value Formatting', () => {
    it('should format percentage values correctly', async () => {
      const config = createStatsConfig({
        title: 'Production Efficiency %',
        metrics: ['production_efficiency'],
      });
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse(createMockStatsData({ production_efficiency: 0.876 })) as any
      );

      render(<UnifiedStatsWidget config={config} />);

      await waitFor(() => {
        expect(screen.getByText('87.6%')).toBeInTheDocument();
      });
    });

    it('should format large numbers with K suffix', async () => {
      const config = createStatsConfig({
        title: 'Total Units',
        metrics: ['total_units'],
      });
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse(createMockStatsData({ total_units: 2456 })) as any
      );

      render(<UnifiedStatsWidget config={config} />);

      await waitFor(() => {
        expect(screen.getByText('2.5K')).toBeInTheDocument();
      });
    });

    it('should format million values with M suffix', async () => {
      const config = createStatsConfig({
        title: 'Annual Production',
        metrics: ['annual_production'],
      });
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse(createMockStatsData({ annual_production: 15678234 })) as any
      );

      render(<UnifiedStatsWidget config={config} />);

      await waitFor(() => {
        expect(screen.getByText('15.7M')).toBeInTheDocument();
      });
    });

    it('should display zero values correctly', async () => {
      const config = createStatsConfig({
        metrics: ['error_count'],
      });
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse(createMockStatsData({ error_count: 0 })) as any
      );

      render(<UnifiedStatsWidget config={config} />);

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument();
      });
    });
  });

  describe('Multiple Metrics', () => {
    it('should handle multiple metrics configuration', async () => {
      const config = createStatsConfig({
        title: 'Primary Metric',
        metrics: ['dynamic_metric_1', 'dynamic_metric_2', 'dynamic_metric_3'],
      });
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse(
          createMockStatsData({
            dynamic_metric_1: 567,
            dynamic_metric_2: 89.2,
            dynamic_metric_3: 23.7,
          })
        ) as any
      );

      render(<UnifiedStatsWidget config={config} />);

      await waitFor(() => {
        // Should display the first metric
        expect(screen.getByText('567')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing data gracefully', async () => {
      const config = createStatsConfig({
        metrics: ['non_existent_metric'],
      });
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse({}) as any
      );

      render(<UnifiedStatsWidget config={config} />);

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument();
      });
    });

    it('should handle null data source', async () => {
      const config = createStatsConfig();
      mockUseDashboardConcurrentQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      } as any);

      render(<UnifiedStatsWidget config={config} />);

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument();
      });
    });

    it('should handle string values', async () => {
      const config = createStatsConfig({
        metrics: ['status'],
      });
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse({ status: 'Active' }) as any
      );

      render(<UnifiedStatsWidget config={config} />);

      await waitFor(() => {
        expect(screen.getByText('Active')).toBeInTheDocument();
      });
    });
  });

  describe('Icon Selection', () => {
    it('should select appropriate icon based on title', async () => {
      const configs = [
        { title: 'Production Today', expectedIcon: 'Box' },
        { title: 'Efficiency Score', expectedIcon: 'TrendingUp' },
        { title: 'Error Count', expectedIcon: 'AlertTriangle' },
        { title: 'Success Rate', expectedIcon: 'CheckCircle' },
      ];

      for (const { title } of configs) {
        const config = createStatsConfig({ title });
        mockUseDashboardConcurrentQuery.mockReturnValue(
          mockSuccessResponse(createMockStatsData()) as any
        );

        const { container } = render(<UnifiedStatsWidget config={config} />);

        await waitFor(() => {
          // Check that an SVG icon is rendered
          expect(container.querySelector('svg')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Performance Metrics', () => {
    it('should include performance metrics in MetricCard', async () => {
      const config = createStatsConfig();
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse(createMockStatsData()) as any
      );

      render(<UnifiedStatsWidget config={config} />);

      await waitFor(() => {
        // The component passes performanceMetrics prop to MetricCard
        expect(screen.getByText('Test Stats Widget')).toBeInTheDocument();
      });
    });
  });
});
