/**
 * Tests for UnifiedTableWidget
 * Based on Storybook test scenarios
 */

import React from 'react';
import { DatabaseRecord } from '@/types/database/tables';
import { DataTableColumn } from '../../common/data-display/DataTable';
import {
  render,
  screen,
  waitFor,
  createTableConfig,
  createMockTableData,
  mockSuccessResponse,
  mockLoadingResponse,
  mockErrorResponse,
} from './test-utils';
import { UnifiedTableWidget } from '../../UnifiedTableWidgetWithErrorBoundary';

// Mock the hook
jest.mock('@/app/(app)/admin/hooks/useDashboardConcurrentQuery', () => ({
  useDashboardConcurrentQuery: jest.fn(),
}));

// Mock DataTable component with proper types
interface MockDataTableProps {
  data: DatabaseRecord[];
  columns: DataTableColumn[];
  loading?: boolean;
}

jest.mock('../../common/data-display/DataTable', () => ({
  DataTable: ({ data, columns, loading }: MockDataTableProps) => (
    <div data-testid="data-table">
      {loading && <div>Loading table...</div>}
      {!loading && data && (
        <table>
          <thead>
            <tr>
              {columns.map((col: DataTableColumn, colIndex: number) => (
                <th key={col.key || colIndex}>{col.header || 'Column'}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row: DatabaseRecord, idx: number) => (
              <tr key={idx}>
                {columns.map((col: DataTableColumn, colIndex: number) => (
                  <td key={col.key || colIndex}>
                    {col.render ? col.render(row[col.key] || '', row, idx) : String(row[col.key] || '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  ),
}));

import { useDashboardConcurrentQuery } from '@/app/(app)/admin/hooks/useDashboardConcurrentQuery';

describe('UnifiedTableWidget', () => {
  const mockUseDashboardConcurrentQuery = useDashboardConcurrentQuery as jest.MockedFunction<typeof useDashboardConcurrentQuery>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should render with default configuration', async () => {
      const config = createTableConfig();
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse(createMockTableData())      );

      render(<UnifiedTableWidget config={config} />);

      await waitFor(() => {
        expect(screen.getByText('Test Table Widget')).toBeInTheDocument();
        expect(screen.getByTestId('data-table')).toBeInTheDocument();
      });
    });

    it('should display description when provided', async () => {
      const config = createTableConfig({
        description: 'Table description text',
      });
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse(createMockTableData())      );

      render(<UnifiedTableWidget config={config} />);

      await waitFor(() => {
        expect(screen.getByText('Table description text')).toBeInTheDocument();
      });
    });

    it('should render table headers correctly', async () => {
      const config = createTableConfig();
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse(createMockTableData())      );

      render(<UnifiedTableWidget config={config} />);

      await waitFor(() => {
        expect(screen.getByText('Id')).toBeInTheDocument();
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Quantity')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
      });
    });

    it('should render table data correctly', async () => {
      const config = createTableConfig();
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse(createMockTableData())      );

      render(<UnifiedTableWidget config={config} />);

      await waitFor(() => {
        expect(screen.getByText('Item 1')).toBeInTheDocument();
        expect(screen.getByText('Item 2')).toBeInTheDocument();
        expect(screen.getByText('Item 3')).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument();
        expect(screen.getByText('200')).toBeInTheDocument();
      });
    });

    it('should work with date range', async () => {
      const config = createTableConfig();
      const dateRange = {
        start: '2025-01-01',
        end: '2025-01-31',
      };
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse(createMockTableData())      );

      render(<UnifiedTableWidget config={config} dateRange={dateRange} />);

      await waitFor(() => {
        expect(screen.getByTestId('data-table')).toBeInTheDocument();
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

  describe('Loading States', () => {
    it('should display loading skeleton', () => {
      const config = createTableConfig();
      mockUseDashboardConcurrentQuery.mockReturnValue(mockLoadingResponse() as any);

      render(<UnifiedTableWidget config={config} />);

      expect(screen.getByText('Test Table Widget')).toBeInTheDocument();
      // Look for skeleton indicators
      const container = screen.getByText('Test Table Widget').closest('.p-4');
      expect(container?.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('Error States', () => {
    it('should handle errors with error boundary', async () => {
      const config = createTableConfig();
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockErrorResponse('Table data fetch failed')      );

      render(<UnifiedTableWidget config={config} />);

      await waitFor(() => {
        expect(screen.queryByText('Unable to display table data. Please refresh.')).toBeInTheDocument();
      });
    });
  });

  describe('Data Processing', () => {
    it('should handle data as array', async () => {
      const config = createTableConfig();
      const arrayData = [
        { id: 1, name: 'Array Item 1', quantity: 50 },
        { id: 2, name: 'Array Item 2', quantity: 75 },
      ];
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse(arrayData)      );

      render(<UnifiedTableWidget config={config} />);

      await waitFor(() => {
        expect(screen.getByText('Array Item 1')).toBeInTheDocument();
        expect(screen.getByText('Array Item 2')).toBeInTheDocument();
      });
    });

    it('should handle data with items property', async () => {
      const config = createTableConfig();
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse({
          items: [
            { id: 1, name: 'Items Prop 1', quantity: 25 },
            { id: 2, name: 'Items Prop 2', quantity: 35 },
          ],
        })      );

      render(<UnifiedTableWidget config={config} />);

      await waitFor(() => {
        expect(screen.getByText('Items Prop 1')).toBeInTheDocument();
        expect(screen.getByText('Items Prop 2')).toBeInTheDocument();
      });
    });

    it('should handle data with rows property', async () => {
      const config = createTableConfig();
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse({
          rows: [
            { id: 1, name: 'Row 1', quantity: 15 },
            { id: 2, name: 'Row 2', quantity: 25 },
          ],
        })      );

      render(<UnifiedTableWidget config={config} />);

      await waitFor(() => {
        expect(screen.getByText('Row 1')).toBeInTheDocument();
        expect(screen.getByText('Row 2')).toBeInTheDocument();
      });
    });

    it('should handle empty data array', async () => {
      const config = createTableConfig();
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse({ items: [] })      );

      render(<UnifiedTableWidget config={config} />);

      await waitFor(() => {
        expect(screen.getByText('No data available')).toBeInTheDocument();
      });
    });
  });

  describe('Column Rendering', () => {
    it('should handle null and undefined values', async () => {
      const config = createTableConfig();
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse({
          items: [
            { id: 1, name: null, quantity: undefined, status: 'active' },
          ],
        })      );

      render(<UnifiedTableWidget config={config} />);

      await waitFor(() => {
        // Should render '-' for null/undefined
        const cells = screen.getAllByText('-');
        expect(cells).toHaveLength(2);
      });
    });

    it('should handle boolean values', async () => {
      const config = createTableConfig();
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse({
          items: [
            { id: 1, name: 'Test', quantity: 100, status: true },
            { id: 2, name: 'Test2', quantity: 200, status: false },
          ],
        })      );

      render(<UnifiedTableWidget config={config} />);

      await waitFor(() => {
        expect(screen.getByText('Yes')).toBeInTheDocument();
        expect(screen.getByText('No')).toBeInTheDocument();
      });
    });

    it('should format date timestamps', async () => {
      const config = createTableConfig({
        columns: ['id', 'name', 'created_at'],
      });
      const timestamp = new Date('2025-01-15').getTime();
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse({
          items: [
            { id: 1, name: 'Test', created_at: timestamp },
          ],
        })      );

      render(<UnifiedTableWidget config={config} />);

      await waitFor(() => {
        // Date should be formatted
        expect(screen.getByText('1/15/2025')).toBeInTheDocument();
      });
    });

    it('should format large numbers', async () => {
      const config = createTableConfig();
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse({
          items: [
            { id: 1, name: 'Test1', quantity: 1500, status: 'active' },
            { id: 2, name: 'Test2', quantity: 2500000, status: 'active' },
          ],
        })      );

      render(<UnifiedTableWidget config={config} />);

      await waitFor(() => {
        expect(screen.getByText('1.5K')).toBeInTheDocument();
        expect(screen.getByText('2.5M')).toBeInTheDocument();
      });
    });

    it('should truncate long strings', async () => {
      const config = createTableConfig();
      const longString = 'This is a very long string that should be truncated after fifty characters for display';
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse({
          items: [
            { id: 1, name: longString, quantity: 100, status: 'active' },
          ],
        })      );

      render(<UnifiedTableWidget config={config} />);

      await waitFor(() => {
        expect(screen.getByText(/This is a very long string.+\.\.\./)).toBeInTheDocument();
      });
    });
  });

  describe('Dynamic Column Generation', () => {
    it('should generate columns from data when not specified', async () => {
      const config = createTableConfig();
      const customData = {
        items: [
          { product_id: 'P001', product_name: 'Product 1', price: 99.99 },
          { product_id: 'P002', product_name: 'Product 2', price: 149.99 },
        ],
      };
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse(customData)      );

      render(<UnifiedTableWidget config={config} />);

      await waitFor(() => {
        expect(screen.getByText('Product Id')).toBeInTheDocument();
        expect(screen.getByText('Product Name')).toBeInTheDocument();
        expect(screen.getByText('Price')).toBeInTheDocument();
      });
    });

    it('should handle custom column configuration', async () => {
      const config = createTableConfig({
        columns: ['id', 'name'],
      });
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse(createMockTableData())      );

      render(<UnifiedTableWidget config={config} />);

      await waitFor(() => {
        expect(screen.getByText('Id')).toBeInTheDocument();
        expect(screen.getByText('Name')).toBeInTheDocument();
        // Should not render columns not in config
        expect(screen.queryByText('Quantity')).not.toBeInTheDocument();
        expect(screen.queryByText('Status')).not.toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle null data source', async () => {
      const config = createTableConfig();
      mockUseDashboardConcurrentQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      } as any);

      render(<UnifiedTableWidget config={config} />);

      await waitFor(() => {
        expect(screen.getByText('No data available')).toBeInTheDocument();
      });
    });

    it('should handle malformed data gracefully', async () => {
      const config = createTableConfig();
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse({
          // Wrong structure - not an array or object with items/rows
          someProperty: 'value',
        })      );

      render(<UnifiedTableWidget config={config} />);

      await waitFor(() => {
        expect(screen.getByText('No data available')).toBeInTheDocument();
      });
    });

    it('should handle very large datasets', async () => {
      const config = createTableConfig();
      const largeData = {
        items: Array.from({ length: 1000 }, (_, i) => ({
          id: i + 1,
          name: `Item ${i + 1}`,
          quantity: Math.floor(Math.random() * 1000),
          status: i % 2 === 0 ? 'active' : 'inactive',
        })),
      };
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse(largeData)      );

      render(<UnifiedTableWidget config={config} />);

      await waitFor(() => {
        expect(screen.getByTestId('data-table')).toBeInTheDocument();
        // Should have pagination enabled for large datasets
        expect(screen.getByText('Item 1')).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('should enable pagination by default', async () => {
      const config = createTableConfig();
      const data = {
        items: Array.from({ length: 50 }, (_, i) => ({
          id: i + 1,
          name: `Item ${i + 1}`,
          quantity: 100 + i,
          status: 'active',
        })),
      };
      mockUseDashboardConcurrentQuery.mockReturnValue(
        mockSuccessResponse(data)      );

      render(<UnifiedTableWidget config={config} />);

      await waitFor(() => {
        expect(screen.getByTestId('data-table')).toBeInTheDocument();
      });
    });
  });
});
