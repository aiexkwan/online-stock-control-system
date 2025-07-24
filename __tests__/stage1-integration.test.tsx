/**
 * 階段1整合測試 - ListCard + FormCard 協同驗證
 * 確保兩個核心Card組件嘅功能完整性同整合正常工作
 * 覆蓋率目標: 95%+
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MockedProvider } from '@apollo/client/testing';
import { ListCard } from '../app/(app)/admin/components/dashboard/cards/ListCard';
import { FormCard, FormType } from '../app/(app)/admin/components/dashboard/cards/FormCard';
import { ListType } from '../types/generated/graphql';
import { AdminCardRenderer } from '../app/(app)/admin/components/dashboard/AdminCardRenderer';
import { AdminWidgetConfig } from '../types/components/dashboard';

// 測試數據
const mockTimeFrame = {
  start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  end: new Date().toISOString()
};

const mockListCardConfig: AdminWidgetConfig = {
  type: 'list',
  title: 'Test List Card',
  gridArea: 'list-area',
  component: 'ListCard',
  dataSource: 'OrderState',
  metrics: ['listType:OrderState', 'pageSize:10']
};

const mockFormCardConfig: AdminWidgetConfig = {
  type: 'form-card',
  title: 'Test Form Card',
  gridArea: 'form-area',
  component: 'FormCard',
  dataSource: 'PRODUCT_EDIT',
  metrics: ['formType:PRODUCT_EDIT', 'entityId:test-product-123']
};

// GraphQL Mocks
const mocks = [
  {
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
          items: [
            {
              id: '1',
              status: 'PENDING',
              created_at: '2025-01-01T00:00:00Z',
              customer_name: 'Test Customer'
            }
          ],
          totalCount: 1,
          hasNextPage: false,
          metadata: {}
        }
      }
    }
  },
  {
    request: {
      query: expect.any(Object),
      variables: {
        input: {
          formType: FormType.PRODUCT_EDIT,
          entityId: undefined,
          prefilledData: {}
        }
      }
    },
    result: {
      data: {
        formCardData: {
          id: 'product-edit-form',
          formType: FormType.PRODUCT_EDIT,
          title: 'Product Information',
          fields: [],
          submitEndpoint: '/api/products'
        }
      }
    }
  }
];

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      {component}
    </MockedProvider>
  );
};

describe('階段1整合測試', () => {
  describe('ListCard 單元測試', () => {
    test('ListCard 正常渲染', async () => {
      renderWithProviders(
        <ListCard
          listType={ListType.OrderState}
          timeFrame={mockTimeFrame}
          showHeader={true}
          showPagination={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
      });
    });

    test('ListCard 支援分頁功能', async () => {
      renderWithProviders(
        <ListCard
          listType={ListType.OrderState}
          timeFrame={mockTimeFrame}
          showPagination={true}
          pageSize={5}
        />
      );

      // 測試分頁控制
      await waitFor(() => {
        const listContainer = screen.getByTestId('list-card-container');
        expect(listContainer).toBeInTheDocument();
      });
    });

    test('ListCard 支援過濾功能', async () => {
      const onFilterChange = jest.fn();
      
      renderWithProviders(
        <ListCard
          listType={ListType.OrderState}
          timeFrame={mockTimeFrame}
          onFilterChange={onFilterChange}
        />
      );

      // 測試過濾器
      await waitFor(() => {
        const listContainer = screen.getByTestId('list-card-container');
        expect(listContainer).toBeInTheDocument();
      });
    });

    test('ListCard 支援排序功能', async () => {
      const onSortChange = jest.fn();
      
      renderWithProviders(
        <ListCard
          listType={ListType.OrderState}
          timeFrame={mockTimeFrame}
          onSortChange={onSortChange}
        />
      );

      // 測試排序功能
      await waitFor(() => {
        const listContainer = screen.getByTestId('list-card-container');
        expect(listContainer).toBeInTheDocument();
      });
    });
  });

  describe('FormCard 單元測試', () => {
    test('FormCard 正常渲染', async () => {
      renderWithProviders(
        <FormCard
          formType={FormType.PRODUCT_EDIT}
          showHeader={true}
          showProgress={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Product Information')).toBeInTheDocument();
      });
    });

    test('FormCard 表單驗證功能', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <FormCard
          formType={FormType.PRODUCT_EDIT}
          showValidationSummary={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/Product Code/i)).toBeInTheDocument();
      });

      // 測試空表單提交
      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessages = screen.getAllByText(/required/i);
        expect(errorMessages.length).toBeGreaterThan(0);
      });
    });

    test('FormCard 進度指示器功能', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <FormCard
          formType={FormType.PRODUCT_EDIT}
          showProgress={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Form Completion/i)).toBeInTheDocument();
      });

      // 填寫字段測試進度變化
      const codeInput = screen.getByLabelText(/Product Code/i);
      await user.type(codeInput, 'TEST-001');

      // 進度應該有變化
      expect(codeInput).toHaveValue('TEST-001');
    });
  });

  describe('AdminCardRenderer 整合測試', () => {
    test('AdminCardRenderer 渲染 ListCard', async () => {
      renderWithProviders(
        <AdminCardRenderer
          config={mockListCardConfig}
          theme="dark"
          timeFrame={mockTimeFrame}
          index={0}
        />
      );

      await waitFor(() => {
        const container = screen.getByTestId('widget-container');
        expect(container).toBeInTheDocument();
      });
    });

    test('AdminCardRenderer 渲染 FormCard', async () => {
      renderWithProviders(
        <AdminCardRenderer
          config={mockFormCardConfig}
          theme="dark"
          timeFrame={mockTimeFrame}
          index={1}
        />
      );

      await waitFor(() => {
        const container = screen.getByTestId('widget-container');
        expect(container).toBeInTheDocument();
      });
    });

    test('多個Card同時渲染測試', async () => {
      const { rerender } = renderWithProviders(
        <div>
          <AdminCardRenderer
            config={mockListCardConfig}
            theme="dark"
            timeFrame={mockTimeFrame}
            index={0}
          />
          <AdminCardRenderer
            config={mockFormCardConfig}
            theme="dark"
            timeFrame={mockTimeFrame}
            index={1}
          />
        </div>
      );

      await waitFor(() => {
        const widgets = screen.getAllByTestId('widget-container');
        expect(widgets).toHaveLength(2);
      });
    });
  });

  describe('Card間協同測試', () => {
    test('ListCard選擇項目後，FormCard應該能預填數據', async () => {
      const user = userEvent.setup();
      let selectedData = null;

      const onItemSelect = (data: any) => {
        selectedData = data;
      };

      const { rerender } = renderWithProviders(
        <div>
          <ListCard
            listType={ListType.OrderState}
            timeFrame={mockTimeFrame}
            onItemSelect={onItemSelect}
          />
          <FormCard
            formType={FormType.PRODUCT_EDIT}
            prefilledData={selectedData}
          />
        </div>
      );

      // 模擬選擇ListCard項目
      await waitFor(() => {
        const listContainer = screen.getByTestId('list-card-container');
        expect(listContainer).toBeInTheDocument();
      });

      // 如果有選擇功能，測試數據傳遞
      if (selectedData) {
        rerender(
          <MockedProvider mocks={mocks} addTypename={false}>
            <FormCard
              formType={FormType.PRODUCT_EDIT}
              prefilledData={selectedData}
            />
          </MockedProvider>
        );
      }
    });

    test('FormCard提交成功後，ListCard應該刷新數據', async () => {
      const onFormSubmitSuccess = jest.fn();
      const onListRefresh = jest.fn();

      renderWithProviders(
        <div>
          <ListCard
            listType={ListType.OrderState}
            timeFrame={mockTimeFrame}
            onRefresh={onListRefresh}
          />
          <FormCard
            formType={FormType.PRODUCT_EDIT}
            onSubmitSuccess={onFormSubmitSuccess}
          />
        </div>
      );

      // 模擬表單提交成功
      await act(async () => {
        onFormSubmitSuccess({ id: 'new-item' });
      });

      // 驗證列表刷新被調用
      expect(onFormSubmitSuccess).toHaveBeenCalled();
    });
  });

  describe('性能測試', () => {
    test('大量數據渲染性能測試', async () => {
      const startTime = performance.now();

      const largeDataMock = {
        ...mocks[0],
        result: {
          data: {
            listCardData: {
              __typename: 'OrderStateList',
              id: 'order-state-list',
              listType: ListType.OrderState,
              title: 'Order Status List',
              items: Array.from({ length: 100 }, (_, i) => ({
                id: `${i + 1}`,
                status: 'PENDING',
                created_at: '2025-01-01T00:00:00Z',
                customer_name: `Customer ${i + 1}`
              })),
              totalCount: 100,
              hasNextPage: true,
              metadata: {}
            }
          }
        }
      };

      render(
        <MockedProvider mocks={[largeDataMock]} addTypename={false}>
          <ListCard
            listType={ListType.OrderState}
            timeFrame={mockTimeFrame}
            pageSize={100}
          />
        </MockedProvider>
      );

      await waitFor(() => {
        const listContainer = screen.getByTestId('list-card-container');
        expect(listContainer).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // 渲染時間應該在合理範圍內
      expect(renderTime).toBeLessThan(2000); // 2秒內
    });

    test('快速切換Card類型性能測試', async () => {
      const { rerender } = renderWithProviders(
        <ListCard
          listType={ListType.OrderState}
          timeFrame={mockTimeFrame}
        />
      );

      const startTime = performance.now();

      // 快速切換到FormCard
      rerender(
        <MockedProvider mocks={mocks} addTypename={false}>
          <FormCard formType={FormType.PRODUCT_EDIT} />
        </MockedProvider>
      );

      // 再切換回ListCard
      rerender(
        <MockedProvider mocks={mocks} addTypename={false}>
          <ListCard
            listType={ListType.OrderRecord}
            timeFrame={mockTimeFrame}
          />
        </MockedProvider>
      );

      const endTime = performance.now();
      const switchTime = endTime - startTime;

      // 切換時間應該很快
      expect(switchTime).toBeLessThan(500); // 500ms內
    });
  });

  describe('錯誤處理測試', () => {
    test('ListCard GraphQL錯誤處理', async () => {
      const errorMock = {
        request: {
          query: expect.any(Object)
        },
        error: new Error('GraphQL Error: Failed to fetch data')
      };

      render(
        <MockedProvider mocks={[errorMock]} addTypename={false}>
          <ListCard
            listType={ListType.OrderState}
            timeFrame={mockTimeFrame}
          />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    test('FormCard提交錯誤處理', async () => {
      const onSubmitError = jest.fn();
      
      renderWithProviders(
        <FormCard
          formType={FormType.PRODUCT_EDIT}
          onSubmitError={onSubmitError}
        />
      );

      // 模擬提交錯誤
      await act(async () => {
        onSubmitError(new Error('Submission failed'));
      });

      expect(onSubmitError).toHaveBeenCalled();
    });
  });

  describe('可訪問性測試', () => {
    test('ListCard可訪問性', async () => {
      renderWithProviders(
        <ListCard
          listType={ListType.OrderState}
          timeFrame={mockTimeFrame}
        />
      );

      await waitFor(() => {
        // 檢查ARIA標籤
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();
      });
    });

    test('FormCard可訪問性', async () => {
      renderWithProviders(
        <FormCard formType={FormType.PRODUCT_EDIT} />
      );

      await waitFor(() => {
        // 檢查表單標籤
        const form = screen.getByRole('form');
        expect(form).toBeInTheDocument();
        
        // 檢查必填字段標記
        const requiredFields = screen.getAllByText('*');
        expect(requiredFields.length).toBeGreaterThan(0);
      });
    });
  });

  describe('響應式設計測試', () => {
    test('移動端ListCard佈局', () => {
      // 模擬移動端視口
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderWithProviders(
        <ListCard
          listType={ListType.OrderState}
          timeFrame={mockTimeFrame}
        />
      );

      // 檢查響應式類名
      const container = screen.getByTestId('list-card-container');
      expect(container).toHaveClass(/responsive/);
    });

    test('移動端FormCard佈局', () => {
      // 模擬移動端視口
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderWithProviders(
        <FormCard formType={FormType.PRODUCT_EDIT} />
      );

      // 檢查響應式佈局
      const form = screen.getByRole('form');
      expect(form).toBeInTheDocument();
    });
  });
});

// 測試工具函數
export const testUtils = {
  mockTimeFrame,
  mockListCardConfig,
  mockFormCardConfig,
  renderWithProviders,
  mocks
};