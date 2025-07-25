/**
 * ListCard Component Unit Tests
 * 測試 ListCard 組件的所有核心功能
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import { ListCard, ListType } from '../ListCard';

// 測試數據
const mockTimeFrame = {
  start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  end: new Date().toISOString()
};

// GraphQL Mocks
const mockOrderStateData = {
  request: {
    query: expect.any(Object),
    variables: {
      input: {
        listType: ListType.OrderState,
        timeFrame: mockTimeFrame,
        pagination: { page: 1, limit: 10 },
        filters: {},
        sort: { field: 'created_at', direction: 'DESC' }
      }
    }
  },
  result: {
    data: {
      listCardData: {
        __typename: 'OrderStateList',
        id: 'order-state-list',
        listType: ListType.OrderState,
        title: 'Order Status List',
        description: 'Display order status information',
        items: [
          {
            id: '1',
            orderNumber: 'ORD-001',
            status: 'PENDING',
            customerName: 'Test Customer',
            totalAmount: 1000.0,
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T12:00:00Z'
          },
          {
            id: '2',
            orderNumber: 'ORD-002',
            status: 'PROCESSING',
            customerName: 'Another Customer',
            totalAmount: 1500.0,
            createdAt: '2025-01-02T00:00:00Z',
            updatedAt: '2025-01-02T12:00:00Z'
          }
        ],
        totalCount: 2,
        hasNextPage: false,
        hasPreviousPage: false,
        columns: [
          { key: 'orderNumber', label: 'Order Number', sortable: true },
          { key: 'status', label: 'Status', sortable: true },
          { key: 'customerName', label: 'Customer', sortable: true },
          { key: 'totalAmount', label: 'Amount', sortable: true },
          { key: 'createdAt', label: 'Created', sortable: true }
        ],
        metadata: {
          lastUpdated: '2025-01-02T12:00:00Z',
          cacheKey: 'order-state-list-cache'
        }
      }
    }
  }
};

const mockOrderRecordData = {
  request: {
    query: expect.any(Object),
    variables: {
      input: {
        listType: ListType.OrderRecord,
        timeFrame: mockTimeFrame
      }
    }
  },
  result: {
    data: {
      listCardData: {
        __typename: 'OrderRecordList',
        id: 'order-record-list',
        listType: ListType.OrderRecord,
        title: 'Order Records',
        items: [
          {
            id: '1',
            recordType: 'CREATE',
            orderId: 'ORD-001',
            changes: 'Order created',
            timestamp: '2025-01-01T00:00:00Z',
            userId: 'user-1'
          }
        ],
        totalCount: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        columns: [],
        metadata: {}
      }
    }
  }
};

const mockWarehouseTransferData = {
  request: {
    query: expect.any(Object),
    variables: {
      input: {
        listType: ListType.WarehouseTransfer,
        timeFrame: mockTimeFrame
      }
    }
  },
  result: {
    data: {
      listCardData: {
        __typename: 'WarehouseTransferList',
        id: 'warehouse-transfer-list',
        listType: ListType.WarehouseTransfer,
        title: 'Warehouse Transfers',
        items: [
          {
            id: '1',
            transferNumber: 'TRF-001',
            fromWarehouse: 'Warehouse A',
            toWarehouse: 'Warehouse B',
            status: 'IN_TRANSIT',
            itemCount: 10,
            createdAt: '2025-01-01T00:00:00Z'
          }
        ],
        totalCount: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        columns: [],
        metadata: {}
      }
    }
  }
};

const mockOtherFilesData = {
  request: {
    query: expect.any(Object),
    variables: {
      input: {
        listType: ListType.OtherFiles,
        timeFrame: mockTimeFrame
      }
    }
  },
  result: {
    data: {
      listCardData: {
        __typename: 'OtherFilesList',
        id: 'other-files-list',
        listType: ListType.OtherFiles,
        title: 'Other Files',
        items: [
          {
            id: '1',
            fileName: 'document.pdf',
            fileType: 'PDF',
            fileSize: 1024000,
            uploadedAt: '2025-01-01T00:00:00Z',
            uploadedBy: 'user-1'
          }
        ],
        totalCount: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        columns: [],
        metadata: {}
      }
    }
  }
};

const errorMock = {
  request: {
    query: expect.any(Object)
  },
  error: new Error('Failed to fetch list data')
};

const renderWithProviders = (component: React.ReactElement, mocks: any[] = [mockOrderStateData]) => {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      {component}
    </MockedProvider>
  );
};

describe('ListCard Component', () => {
  describe('基本渲染測試', () => {
    test('ORDER_STATE 列表正常渲染', async () => {
      renderWithProviders(
        <ListCard
          listType={ListType.OrderState}
          dateRange={{
            start: new Date(mockTimeFrame.start),
            end: new Date(mockTimeFrame.end)
          }}
          showHeader={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Order Status List')).toBeInTheDocument();
      });

      // 檢查數據項目
      await waitFor(() => {
        expect(screen.getByText('ORD-001')).toBeInTheDocument();
        expect(screen.getByText('Test Customer')).toBeInTheDocument();
        expect(screen.getByText('PENDING')).toBeInTheDocument();
      });
    });

    test('ORDER_RECORD 列表正常渲染', async () => {
      renderWithProviders(
        <ListCard
          listType={ListType.OrderRecord}
          dateRange={{
            start: new Date(mockTimeFrame.start),
            end: new Date(mockTimeFrame.end)
          }}
        />,
        [mockOrderRecordData]
      );

      await waitFor(() => {
        expect(screen.getByText('Order Records')).toBeInTheDocument();
      });
    });

    test('WAREHOUSE_TRANSFER 列表正常渲染', async () => {
      renderWithProviders(
        <ListCard
          listType={ListType.WarehouseTransfer}
          dateRange={{
            start: new Date(mockTimeFrame.start),
            end: new Date(mockTimeFrame.end)
          }}
        />,
        [mockWarehouseTransferData]
      );

      await waitFor(() => {
        expect(screen.getByText('Warehouse Transfers')).toBeInTheDocument();
      });
    });

    test('OTHER_FILES 列表正常渲染', async () => {
      renderWithProviders(
        <ListCard
          listType={ListType.OtherFiles}
          dateRange={{
            start: new Date(mockTimeFrame.start),
            end: new Date(mockTimeFrame.end)
          }}
        />,
        [mockOtherFilesData]
      );

      await waitFor(() => {
        expect(screen.getByText('Other Files')).toBeInTheDocument();
      });
    });
  });

  describe('載入狀態測試', () => {
    test('顯示載入指示器', () => {
      renderWithProviders(
        <ListCard
          listType={ListType.OrderState}
          dateRange={{
            start: new Date(mockTimeFrame.start),
            end: new Date(mockTimeFrame.end)
          }}
        />
      );

      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });

    test('載入完成後隱藏載入指示器', async () => {
      renderWithProviders(
        <ListCard
          listType={ListType.OrderState}
          dateRange={{
            start: new Date(mockTimeFrame.start),
            end: new Date(mockTimeFrame.end)
          }}
        />
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
      });
    });
  });

  describe('分頁功能測試', () => {
    test('顯示分頁控制器', async () => {
      renderWithProviders(
        <ListCard
          listType={ListType.OrderState}
          dateRange={{
            start: new Date(mockTimeFrame.start),
            end: new Date(mockTimeFrame.end)
          }}
          showPagination={true}
          pageSize={1}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('pagination-controls')).toBeInTheDocument();
      });
    });

    test('分頁導航功能', async () => {
      const user = userEvent.setup();
      const onPageChange = jest.fn();

      renderWithProviders(
        <ListCard
          listType={ListType.OrderState}
          dateRange={{
            start: new Date(mockTimeFrame.start),
            end: new Date(mockTimeFrame.end)
          }}
          showPagination={true}
          pageSize={1}
          onPageChange={onPageChange}
        />
      );

      await waitFor(() => {
        const nextButton = screen.getByTestId('next-page-button');
        expect(nextButton).toBeInTheDocument();
      });

      const nextButton = screen.getByTestId('next-page-button');
      await user.click(nextButton);

      expect(onPageChange).toHaveBeenCalledWith(2);
    });
  });

  describe('排序功能測試', () => {
    test('點擊列標題進行排序', async () => {
      const user = userEvent.setup();
      const onSortChange = jest.fn();

      renderWithProviders(
        <ListCard
          listType={ListType.OrderState}
          dateRange={{
            start: new Date(mockTimeFrame.start),
            end: new Date(mockTimeFrame.end)
          }}
          onSortChange={onSortChange}
        />
      );

      await waitFor(() => {
        const sortableHeader = screen.getByTestId('sortable-header-status');
        expect(sortableHeader).toBeInTheDocument();
      });

      const statusHeader = screen.getByTestId('sortable-header-status');
      await user.click(statusHeader);

      expect(onSortChange).toHaveBeenCalledWith({
        field: 'status',
        direction: 'ASC'
      });
    });

    test('重複點擊切換排序方向', async () => {
      const user = userEvent.setup();
      const onSortChange = jest.fn();

      renderWithProviders(
        <ListCard
          listType={ListType.OrderState}
          dateRange={{
            start: new Date(mockTimeFrame.start),
            end: new Date(mockTimeFrame.end)
          }}
          onSortChange={onSortChange}
          defaultSort={{ field: 'status', direction: 'ASC' }}
        />
      );

      await waitFor(() => {
        const statusHeader = screen.getByTestId('sortable-header-status');
        expect(statusHeader).toBeInTheDocument();
      });

      const statusHeader = screen.getByTestId('sortable-header-status');
      await user.click(statusHeader);

      expect(onSortChange).toHaveBeenCalledWith({
        field: 'status',
        direction: 'DESC'
      });
    });
  });

  describe('過濾功能測試', () => {
    test('顯示過濾控制器', async () => {
      renderWithProviders(
        <ListCard
          listType={ListType.OrderState}
          dateRange={{
            start: new Date(mockTimeFrame.start),
            end: new Date(mockTimeFrame.end)
          }}
          showFilters={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('filter-controls')).toBeInTheDocument();
      });
    });

    test('應用過濾器', async () => {
      const user = userEvent.setup();
      const onFilterChange = jest.fn();

      renderWithProviders(
        <ListCard
          listType={ListType.OrderState}
          dateRange={{
            start: new Date(mockTimeFrame.start),
            end: new Date(mockTimeFrame.end)
          }}
          showFilters={true}
          onFilterChange={onFilterChange}
        />
      );

      await waitFor(() => {
        const filterInput = screen.getByTestId('filter-input-status');
        expect(filterInput).toBeInTheDocument();
      });

      const filterInput = screen.getByTestId('filter-input-status');
      await user.type(filterInput, 'PENDING');

      expect(onFilterChange).toHaveBeenCalledWith({
        status: 'PENDING'
      });
    });
  });

  describe('數據選擇測試', () => {
    test('單行選擇功能', async () => {
      const user = userEvent.setup();
      const onItemSelect = jest.fn();

      renderWithProviders(
        <ListCard
          listType={ListType.OrderState}
          dateRange={{
            start: new Date(mockTimeFrame.start),
            end: new Date(mockTimeFrame.end)
          }}
          selectable={true}
          onItemSelect={onItemSelect}
        />
      );

      await waitFor(() => {
        const firstRowCheckbox = screen.getByTestId('row-checkbox-1');
        expect(firstRowCheckbox).toBeInTheDocument();
      });

      const firstRowCheckbox = screen.getByTestId('row-checkbox-1');
      await user.click(firstRowCheckbox);

      expect(onItemSelect).toHaveBeenCalledWith([
        expect.objectContaining({ id: '1' })
      ]);
    });

    test('全選功能', async () => {
      const user = userEvent.setup();
      const onItemSelect = jest.fn();

      renderWithProviders(
        <ListCard
          listType={ListType.OrderState}
          dateRange={{
            start: new Date(mockTimeFrame.start),
            end: new Date(mockTimeFrame.end)
          }}
          selectable={true}
          onItemSelect={onItemSelect}
        />
      );

      await waitFor(() => {
        const selectAllCheckbox = screen.getByTestId('select-all-checkbox');
        expect(selectAllCheckbox).toBeInTheDocument();
      });

      const selectAllCheckbox = screen.getByTestId('select-all-checkbox');
      await user.click(selectAllCheckbox);

      expect(onItemSelect).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: '1' }),
          expect.objectContaining({ id: '2' })
        ])
      );
    });
  });

  describe('刷新功能測試', () => {
    test('手動刷新數據', async () => {
      const user = userEvent.setup();
      const onRefresh = jest.fn();

      renderWithProviders(
        <ListCard
          listType={ListType.OrderState}
          dateRange={{
            start: new Date(mockTimeFrame.start),
            end: new Date(mockTimeFrame.end)
          }}
          showRefreshButton={true}
          onRefresh={onRefresh}
        />
      );

      await waitFor(() => {
        const refreshButton = screen.getByTestId('refresh-button');
        expect(refreshButton).toBeInTheDocument();
      });

      const refreshButton = screen.getByTestId('refresh-button');
      await user.click(refreshButton);

      expect(onRefresh).toHaveBeenCalled();
    });

    test('自動刷新功能', async () => {
      jest.useFakeTimers();
      const onRefresh = jest.fn();

      renderWithProviders(
        <ListCard
          listType={ListType.OrderState}
          dateRange={{
            start: new Date(mockTimeFrame.start),
            end: new Date(mockTimeFrame.end)
          }}
          autoRefresh={true}
          refreshInterval={5000}
          onRefresh={onRefresh}
        />
      );

      // 快進5秒
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(onRefresh).toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('錯誤處理測試', () => {
    test('顯示錯誤信息', async () => {
      renderWithProviders(
        <ListCard
          listType={ListType.OrderState}
          dateRange={{
            start: new Date(mockTimeFrame.start),
            end: new Date(mockTimeFrame.end)
          }}
        />,
        [errorMock]
      );

      await waitFor(() => {
        expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument();
      });
    });

    test('錯誤重試功能', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <ListCard
          listType={ListType.OrderState}
          dateRange={{
            start: new Date(mockTimeFrame.start),
            end: new Date(mockTimeFrame.end)
          }}
        />,
        [errorMock]
      );

      await waitFor(() => {
        const retryButton = screen.getByTestId('retry-button');
        expect(retryButton).toBeInTheDocument();
      });

      const retryButton = screen.getByTestId('retry-button');
      await user.click(retryButton);

      // 應該重新嘗試獲取數據
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });
  });

  describe('自定義樣式測試', () => {
    test('應用自定義類名', () => {
      renderWithProviders(
        <ListCard
          listType={ListType.OrderState}
          dateRange={{
            start: new Date(mockTimeFrame.start),
            end: new Date(mockTimeFrame.end)
          }}
          className="custom-list-card"
        />
      );

      const container = screen.getByTestId('list-card-container');
      expect(container).toHaveClass('custom-list-card');
    });

    test('設置自定義高度', () => {
      renderWithProviders(
        <ListCard
          listType={ListType.OrderState}
          dateRange={{
            start: new Date(mockTimeFrame.start),
            end: new Date(mockTimeFrame.end)
          }}
          height={400}
        />
      );

      const container = screen.getByTestId('list-card-container');
      expect(container).toHaveStyle({ height: '400px' });
    });
  });

  describe('響應式設計測試', () => {
    test('移動端佈局調整', () => {
      // 模擬移動設備
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderWithProviders(
        <ListCard
          listType={ListType.OrderState}
          dateRange={{
            start: new Date(mockTimeFrame.start),
            end: new Date(mockTimeFrame.end)
          }}
        />
      );

      const container = screen.getByTestId('list-card-container');
      expect(container).toHaveClass(/mobile/);
    });

    test('平板端佈局調整', () => {
      // 模擬平板設備
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      renderWithProviders(
        <ListCard
          listType={ListType.OrderState}
          dateRange={{
            start: new Date(mockTimeFrame.start),
            end: new Date(mockTimeFrame.end)
          }}
        />
      );

      const container = screen.getByTestId('list-card-container');
      expect(container).toHaveClass(/tablet/);
    });
  });

  describe('可訪問性測試', () => {
    test('ARIA 標籤正確設置', async () => {
      renderWithProviders(
        <ListCard
          listType={ListType.OrderState}
          dateRange={{
            start: new Date(mockTimeFrame.start),
            end: new Date(mockTimeFrame.end)
          }}
        />
      );

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toHaveAttribute('aria-label');
      });
    });

    test('鍵盤導航支援', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <ListCard
          listType={ListType.OrderState}
          dateRange={{
            start: new Date(mockTimeFrame.start),
            end: new Date(mockTimeFrame.end)
          }}
          selectable={true}
        />
      );

      await waitFor(() => {
        const firstRow = screen.getByTestId('table-row-1');
        expect(firstRow).toBeInTheDocument();
      });

      const firstRow = screen.getByTestId('table-row-1');
      firstRow.focus();
      
      await user.keyboard('{Enter}');
      
      // 應該選中該行
      expect(firstRow).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('性能測試', () => {
    test('大量數據渲染性能', async () => {
      const largeDataMock = {
        ...mockOrderStateData,
        result: {
          data: {
            listCardData: {
              ...mockOrderStateData.result.data.listCardData,
              items: Array.from({ length: 1000 }, (_, i) => ({
                id: `${i + 1}`,
                orderNumber: `ORD-${String(i + 1).padStart(3, '0')}`,
                status: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'][i % 4],
                customerName: `Customer ${i + 1}`,
                totalAmount: (i + 1) * 100,
                createdAt: new Date(Date.now() - i * 60000).toISOString(),
                updatedAt: new Date(Date.now() - i * 30000).toISOString()
              })),
              totalCount: 1000
            }
          }
        }
      };

      const startTime = performance.now();

      renderWithProviders(
        <ListCard
          listType={ListType.OrderState}
          dateRange={{
            start: new Date(mockTimeFrame.start),
            end: new Date(mockTimeFrame.end)
          }}
          pageSize={50}
          virtualScrolling={true}
        />,
        [largeDataMock]
      );

      await waitFor(() => {
        expect(screen.getByText('ORD-001')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // 渲染時間應該在合理範圍內
      expect(renderTime).toBeLessThan(1000);
    });
  });
});

export { mockOrderStateData, mockOrderRecordData, mockWarehouseTransferData, mockOtherFilesData };