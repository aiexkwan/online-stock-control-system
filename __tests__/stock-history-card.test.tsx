/**
 * StockHistoryCard Integration Test
 * Tests the complete GraphQL integration for stock history functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { StockHistoryCard } from '@/app/(app)/admin/cards/StockHistoryCard';
import { 
  PALLET_HISTORY_BY_PRODUCT,
  PALLET_HISTORY_BY_NUMBER 
} from '@/lib/graphql/queries/stock-history.graphql';

// Mock QR Scanner component
vi.mock('@/components/qr-scanner/simple-qr-scanner', () => ({
  SimpleQRScanner: ({ onScan, open, onClose }: any) => {
    if (!open) return null;
    return (
      <div data-testid="qr-scanner">
        <button
          onClick={() => onScan('060825/1')}
          data-testid="mock-scan-button"
        >
          Simulate QR Scan
        </button>
        <button onClick={onClose} data-testid="close-scanner">
          Close
        </button>
      </div>
    );
  },
}));

// Mock data
const mockProductHistoryData = {
  palletHistoryByProduct: {
    productCode: 'X01A2888',
    productInfo: {
      code: 'X01A2888',
      description: 'Test Product',
      type: 'Material',
      colour: 'Blue',
      totalPallets: 2,
      activePallets: 2,
    },
    records: [
      {
        id: '1',
        timestamp: '2025-08-05T15:15:05.035Z',
        palletNumber: '050825/4',
        productCode: 'X01A2888',
        action: 'GRN_RECEIVING',
        location: 'Await_grn',
        operatorName: 'Alex',
        operatorId: '5997',
        remark: 'GRN: 11111, Material: X01A2888',
        actionType: 'INBOUND',
        actionCategory: 'ADMINISTRATIVE',
      },
      {
        id: '2',
        timestamp: '2025-08-05T15:15:05.035Z',
        palletNumber: '050825/3',
        productCode: 'X01A2888',
        action: 'GRN_RECEIVING',
        location: 'Await_grn',
        operatorName: 'Alex',
        operatorId: '5997',
        remark: 'GRN: 11111, Material: X01A2888',
        actionType: 'INBOUND',
        actionCategory: 'ADMINISTRATIVE',
      },
    ],
    totalRecords: 2,
    pageInfo: {
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: '1',
      endCursor: '2',
      totalCount: 2,
      totalPages: 1,
      currentPage: 1,
    },
    aggregations: {
      totalActions: 2,
      uniquePallets: 2,
      uniqueOperators: 1,
      timeRange: {
        start: '2025-08-05T15:15:05.035Z',
        end: '2025-08-05T15:15:05.035Z',
      },
      mostActiveLocation: 'Await_grn',
      mostActiveOperator: 'Alex',
    },
    timelineGroups: [],
    locationDistribution: [],
    operatorDistribution: [],
  },
};

const mockPalletHistoryData = {
  palletHistoryByNumber: {
    palletNumber: '060825/1',
    palletInfo: {
      palletNumber: '060825/1',
      series: '060825-ea9aed',
      productCode: 'X01A2888',
      quantity: 100,
      currentLocation: 'await',
      status: 'ACTIVE',
      createdAt: '2025-08-06T10:51:19.994Z',
      createdBy: 'Alex',
      product: {
        code: 'X01A2888',
        description: 'Test Product',
        type: 'Material',
        colour: 'Blue',
        totalPallets: 1,
        activePallets: 1,
      },
    },
    records: [
      {
        id: '1',
        timestamp: '2025-08-06T10:51:19.994Z',
        palletNumber: '060825/1',
        productCode: 'X01A2888',
        action: 'FINISHED_QC',
        location: 'await',
        operatorName: 'Alex',
        operatorId: '5997',
        remark: '-',
        actionType: 'STATUS_CHANGE',
        actionCategory: 'ADMINISTRATIVE',
      },
    ],
    totalRecords: 1,
    pageInfo: {
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: '1',
      endCursor: '1',
      totalCount: 1,
      totalPages: 1,
      currentPage: 1,
    },
    timeline: {
      created: '2025-08-06T10:51:19.994Z',
      firstMovement: null,
      lastMovement: '2025-08-06T10:51:19.994Z',
      totalMovements: 0,
      totalDaysActive: 0,
      averageLocationStay: 0,
    },
    currentStatus: {
      location: 'await',
      lastAction: 'FINISHED_QC',
      lastActionAt: '2025-08-06T10:51:19.994Z',
      lastOperator: 'Alex',
      isActive: true,
      daysInCurrentLocation: 1,
    },
    journey: [
      {
        sequence: 0,
        location: 'await',
        entryTime: '2025-08-06T10:51:19.994Z',
        exitTime: null,
        duration: null,
        actions: ['FINISHED_QC'],
        operator: 'Alex',
      },
    ],
  },
};

const productSearchMock = {
  request: {
    query: PALLET_HISTORY_BY_PRODUCT,
    variables: {
      productCode: 'X01A2888',
      filter: {},
      pagination: { first: 40 },
      sort: { field: 'TIMESTAMP', direction: 'DESC' },
    },
  },
  result: {
    data: mockProductHistoryData,
  },
};

const palletSearchMock = {
  request: {
    query: PALLET_HISTORY_BY_NUMBER,
    variables: {
      palletNumber: '060825/1',
      includeJourney: true,
      includeSeries: true,
    },
  },
  result: {
    data: mockPalletHistoryData,
  },
};

describe('StockHistoryCard', () => {
  const renderStockHistoryCard = (mocks: any[] = []) => {
    return render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <StockHistoryCard warehouse="Main" limit={40} />
      </MockedProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with correct structure and tabs', () => {
    renderStockHistoryCard();

    // Check main title
    expect(screen.getByText('Stock History')).toBeInTheDocument();

    // Check tabs
    expect(screen.getByText('Stock Search')).toBeInTheDocument();
    expect(screen.getByText('Pallet Search')).toBeInTheDocument();

    // Check initial empty state
    expect(screen.getByText('Enter a product code and click Search to view pallet history')).toBeInTheDocument();
  });

  it('performs stock search correctly', async () => {
    renderStockHistoryCard([productSearchMock]);

    // Find and fill the search input
    const searchInput = screen.getByPlaceholderText(/Enter product code/);
    const searchButton = screen.getByRole('button', { name: /search/i });

    fireEvent.change(searchInput, { target: { value: 'X01A2888' } });
    fireEvent.click(searchButton);

    // Wait for data to load and check results
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    // Check product info
    expect(screen.getByText('X01A2888')).toBeInTheDocument();
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Total pallets

    // Check table headers (should match requirements: Time, Operator, Action, Location, Remark)
    expect(screen.getByText('Time')).toBeInTheDocument();
    expect(screen.getByText('Operator')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByText('Remark')).toBeInTheDocument();

    // Check that Pallet column is NOT present in Stock Search tab
    const palletHeaders = screen.queryAllByText('Pallet');
    expect(palletHeaders).toHaveLength(0);

    // Check record data
    await waitFor(() => {
      expect(screen.getByText('Alex')).toBeInTheDocument();
      expect(screen.getByText('GRN_RECEIVING')).toBeInTheDocument();
      expect(screen.getByText('Await_grn')).toBeInTheDocument();
      expect(screen.getByText('GRN: 11111, Material: X01A2888')).toBeInTheDocument();
    });
  });

  it('switches to pallet search tab and performs search', async () => {
    renderStockHistoryCard([palletSearchMock]);

    // Switch to pallet search tab
    const palletTab = screen.getByText('Pallet Search');
    fireEvent.click(palletTab);

    // Check that the pallet search interface is active
    expect(screen.getByPlaceholderText(/Enter Pallet Number or scan QR Code/)).toBeInTheDocument();

    // Find and fill the pallet search input
    const palletInput = screen.getByPlaceholderText(/Enter Pallet Number or scan QR Code/);
    const searchButton = screen.getByRole('button', { name: /search/i });

    fireEvent.change(palletInput, { target: { value: '060825/1' } });
    fireEvent.click(searchButton);

    // Wait for pallet data to load
    await waitFor(() => {
      expect(screen.getByText('060825/1')).toBeInTheDocument();
    });

    // Check pallet info
    expect(screen.getByText('Series: 060825-ea9aed')).toBeInTheDocument();
    expect(screen.getByText('Qty: 100')).toBeInTheDocument();

    // Check timeline info
    expect(screen.getByText('0 days active')).toBeInTheDocument();
    expect(screen.getByText('0 movements')).toBeInTheDocument();

    // Check table headers for pallet search (should match requirements: Time, Operator, Action, Location, Remark)
    expect(screen.getByText('Time')).toBeInTheDocument();
    expect(screen.getByText('Operator')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByText('Remark')).toBeInTheDocument();

    // Check record data
    await waitFor(() => {
      expect(screen.getByText('Alex')).toBeInTheDocument();
      expect(screen.getByText('FINISHED_QC')).toBeInTheDocument();
      expect(screen.getByText('await')).toBeInTheDocument();
    });
  });

  it('handles QR scanner functionality', async () => {
    renderStockHistoryCard([palletSearchMock]);

    // Switch to pallet search tab
    const palletTab = screen.getByText('Pallet Search');
    fireEvent.click(palletTab);

    // Find and click QR scanner button (look for QR icon button)
    const qrButton = screen.getByRole('button', { name: /qr/i });
    fireEvent.click(qrButton);

    // Check that QR scanner is open
    await waitFor(() => {
      expect(screen.getByTestId('qr-scanner')).toBeInTheDocument();
    });

    // Simulate QR code scan
    const mockScanButton = screen.getByTestId('mock-scan-button');
    fireEvent.click(mockScanButton);

    // Check that the scanner closes and input is filled
    await waitFor(() => {
      const palletInput = screen.getByPlaceholderText(/Enter Pallet Number or scan QR Code/) as HTMLInputElement;
      expect(palletInput.value).toBe('060825/1');
    });

    // The search should be triggered automatically after scan
    await waitFor(() => {
      expect(screen.getByText('060825/1')).toBeInTheDocument();
    });
  });

  it('displays correct time format (YYYY-MMM-DD HH:MM)', async () => {
    renderStockHistoryCard([productSearchMock]);

    // Perform a search
    const searchInput = screen.getByPlaceholderText(/Enter product code/);
    const searchButton = screen.getByRole('button', { name: /search/i });

    fireEvent.change(searchInput, { target: { value: 'X01A2888' } });
    fireEvent.click(searchButton);

    // Wait for data and check time format
    await waitFor(() => {
      // The mock data timestamp '2025-08-05T15:15:05.035Z' should be formatted as '2025-Aug-05 15:15'
      const timeElement = screen.getByText(/2025-Aug-05 15:15/);
      expect(timeElement).toBeInTheDocument();
    });
  });

  it('shows empty state when no data is found', () => {
    const emptyMock = {
      request: {
        query: PALLET_HISTORY_BY_PRODUCT,
        variables: {
          productCode: 'NONEXISTENT',
          filter: {},
          pagination: { first: 40 },
          sort: { field: 'TIMESTAMP', direction: 'DESC' },
        },
      },
      result: {
        data: {
          palletHistoryByProduct: {
            productCode: 'NONEXISTENT',
            productInfo: {
              code: 'NONEXISTENT',
              description: '',
              type: '',
              colour: '',
              totalPallets: 0,
              activePallets: 0,
            },
            records: [],
            totalRecords: 0,
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: null,
              endCursor: null,
              totalCount: 0,
              totalPages: 0,
              currentPage: 1,
            },
            aggregations: {
              totalActions: 0,
              uniquePallets: 0,
              uniqueOperators: 0,
              timeRange: null,
              mostActiveLocation: 'None',
              mostActiveOperator: 'None',
            },
            timelineGroups: [],
            locationDistribution: [],
            operatorDistribution: [],
          },
        },
      },
    };

    renderStockHistoryCard([emptyMock]);

    // Perform search with non-existent product
    const searchInput = screen.getByPlaceholderText(/Enter product code/);
    const searchButton = screen.getByRole('button', { name: /search/i });

    fireEvent.change(searchInput, { target: { value: 'NONEXISTENT' } });
    fireEvent.click(searchButton);

    // Should show no records message
    expect(screen.getByText('No history records found')).toBeInTheDocument();
  });
});