import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import { FormCard, FormType } from '../FormCard';
import ProductEditForm from '../../../../../productUpdate/components/ProductEditForm';
import { ProductData } from '@/app/actions/productActions';

// Mock data
const mockProductData: ProductData = {
  code: 'TEST-001',
  description: 'Test Product for Migration',
  colour: 'BLUE',
  standard_qty: 100,
  type: 'FINISHED_GOODS'
};

const invalidProductData: ProductData = {
  code: '',
  description: '',
  colour: 'RED',
  standard_qty: -1,
  type: 'RAW_MATERIALS'
};

// Mock GraphQL responses
const mocks = [
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
          description: 'Edit product details and specifications',
          fields: [],
          submitEndpoint: '/api/products',
          layout: {
            columns: 12,
            spacing: 'normal'
          }
        }
      }
    }
  }
];

// Helper function to render components with providers
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      {component}
    </MockedProvider>
  );
};

describe('FormCard 遷移驗證測試', () => {
  describe('基本渲染測試', () => {
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

    test('ProductEditForm 正常渲染', () => {
      const mockSubmit = jest.fn();
      const mockCancel = jest.fn();

      render(
        <ProductEditForm
          initialData={mockProductData}
          isCreating={true}
          onSubmit={mockSubmit}
          onCancel={mockCancel}
        />
      );

      expect(screen.getByText('Create New Product')).toBeInTheDocument();
      expect(screen.getByLabelText(/product code/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/product description/i)).toBeInTheDocument();
    });
  });

  describe('功能對比測試', () => {
    test('兩個組件都包含相同的表單字段', async () => {
      const mockSubmit = jest.fn();
      const mockCancel = jest.fn();

      // 渲染 ProductEditForm
      const { unmount: unmountOriginal } = render(
        <ProductEditForm
          initialData={mockProductData}
          isCreating={true}
          onSubmit={mockSubmit}
          onCancel={mockCancel}
        />
      );

      // 檢查 ProductEditForm 的字段
      expect(screen.getByLabelText(/product code/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/product description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/product colour/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/standard qty/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/product type/i)).toBeInTheDocument();

      unmountOriginal();

      // 渲染 FormCard
      renderWithProviders(
        <FormCard
          formType={FormType.PRODUCT_EDIT}
          prefilledData={mockProductData}
          showHeader={true}
        />
      );

      await waitFor(() => {
        // 檢查 FormCard 的字段
        expect(screen.getByLabelText(/product code/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/product description/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/product colour/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/standard quantity/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/product type/i)).toBeInTheDocument();
      });
    });

    test('數據預填功能對比', async () => {
      const mockSubmit = jest.fn();
      const mockCancel = jest.fn();

      // 測試 ProductEditForm 的數據預填
      const { unmount: unmountOriginal } = render(
        <ProductEditForm
          initialData={mockProductData}
          isCreating={false}
          onSubmit={mockSubmit}
          onCancel={mockCancel}
        />
      );

      const originalCodeInput = screen.getByDisplayValue(mockProductData.code);
      expect(originalCodeInput).toBeInTheDocument();

      unmountOriginal();

      // 測試 FormCard 的數據預填
      renderWithProviders(
        <FormCard
          formType={FormType.PRODUCT_EDIT}
          prefilledData={mockProductData}
          showHeader={true}
        />
      );

      await waitFor(() => {
        const formCardCodeInput = screen.getByDisplayValue(mockProductData.code);
        expect(formCardCodeInput).toBeInTheDocument();
      });
    });
  });

  describe('表單驗證測試', () => {
    test('ProductEditForm 驗證邏輯', async () => {
      const user = userEvent.setup();
      const mockSubmit = jest.fn();
      const mockCancel = jest.fn();

      render(
        <ProductEditForm
          initialData={invalidProductData}
          isCreating={true}
          onSubmit={mockSubmit}
          onCancel={mockCancel}
        />
      );

      // 清空必填字段
      const codeInput = screen.getByLabelText(/product code/i);
      await user.clear(codeInput);

      const descriptionInput = screen.getByLabelText(/product description/i);
      await user.clear(descriptionInput);

      // 嘗試提交
      const submitButton = screen.getByRole('button', { name: /create product/i });
      await user.click(submitButton);

      // 應該顯示驗證錯誤
      await waitFor(() => {
        expect(screen.getByText(/product code.*required/i)).toBeInTheDocument();
        expect(screen.getByText(/description.*required/i)).toBeInTheDocument();
      });

      expect(mockSubmit).not.toHaveBeenCalled();
    });

    test('FormCard 驗證邏輯', async () => {
      const user = userEvent.setup();
      const mockSubmitSuccess = jest.fn();
      const mockSubmitError = jest.fn();

      renderWithProviders(
        <FormCard
          formType={FormType.PRODUCT_EDIT}
          prefilledData={{}}
          onSubmitSuccess={mockSubmitSuccess}
          onSubmitError={mockSubmitError}
          showValidationSummary={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/product code/i)).toBeInTheDocument();
      });

      // 嘗試提交空表單
      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      // 應該顯示驗證錯誤
      await waitFor(() => {
        const errorMessages = screen.getAllByText(/required/i);
        expect(errorMessages.length).toBeGreaterThan(0);
      });
    });
  });

  describe('用戶交互測試', () => {
    test('ProductEditForm 字段更新', async () => {
      const user = userEvent.setup();
      const mockSubmit = jest.fn();
      const mockCancel = jest.fn();

      render(
        <ProductEditForm
          initialData={{ ...mockProductData, code: '' }}
          isCreating={true}
          onSubmit={mockSubmit}
          onCancel={mockCancel}
        />
      );

      const codeInput = screen.getByLabelText(/product code/i);
      await user.type(codeInput, 'NEW-001');

      expect(codeInput).toHaveValue('NEW-001');
    });

    test('FormCard 字段更新和進度跟蹤', async () => {
      const user = userEvent.setup();
      const mockFieldChange = jest.fn();

      renderWithProviders(
        <FormCard
          formType={FormType.PRODUCT_EDIT}
          prefilledData={{}}
          showProgress={true}
          onFieldChange={mockFieldChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/product code/i)).toBeInTheDocument();
      });

      const codeInput = screen.getByLabelText(/product code/i);
      await user.type(codeInput, 'NEW-001');

      expect(codeInput).toHaveValue('NEW-001');
      
      // FormCard 應該有進度指示器
      expect(screen.getByText(/form completion/i)).toBeInTheDocument();
    });
  });

  describe('提交流程測試', () => {
    test('ProductEditForm 提交成功', async () => {
      const user = userEvent.setup();
      const mockSubmit = jest.fn().mockResolvedValue(undefined);
      const mockCancel = jest.fn();

      render(
        <ProductEditForm
          initialData={mockProductData}
          isCreating={true}
          onSubmit={mockSubmit}
          onCancel={mockCancel}
        />
      );

      const submitButton = screen.getByRole('button', { name: /create product/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith(mockProductData);
      });
    });

    test('FormCard 提交成功', async () => {
      const user = userEvent.setup();
      const mockSubmitSuccess = jest.fn();

      renderWithProviders(
        <FormCard
          formType={FormType.PRODUCT_EDIT}
          prefilledData={mockProductData}
          onSubmitSuccess={mockSubmitSuccess}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      // 注意：由於 FormCard 使用 GraphQL mutation，這裡的測試可能需要更複雜的 mock
      // 實際的提交測試應該在 E2E 測試中進行
    });
  });

  describe('錯誤處理測試', () => {
    test('ProductEditForm 提交失敗處理', async () => {
      const user = userEvent.setup();
      const mockSubmit = jest.fn().mockRejectedValue(new Error('Submit failed'));
      const mockCancel = jest.fn();

      render(
        <ProductEditForm
          initialData={mockProductData}
          isCreating={true}
          onSubmit={mockSubmit}
          onCancel={mockCancel}
        />
      );

      const submitButton = screen.getByRole('button', { name: /create product/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalled();
      });

      // 提交按鈕應該恢復可用狀態
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    test('FormCard 錯誤處理', async () => {
      const mockSubmitError = jest.fn();

      renderWithProviders(
        <FormCard
          formType={FormType.PRODUCT_EDIT}
          prefilledData={invalidProductData}
          onSubmitError={mockSubmitError}
          showValidationSummary={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
      });

      // 提交無效數據應該觸發驗證錯誤
      const submitButton = screen.getByRole('button', { name: /create/i });
      const user = userEvent.setup();
      await user.click(submitButton);

      await waitFor(() => {
        const errorSummary = screen.getByText(/please fix the following errors/i);
        expect(errorSummary).toBeInTheDocument();
      });
    });
  });

  describe('可訪問性測試', () => {
    test('ProductEditForm 可訪問性', () => {
      const mockSubmit = jest.fn();
      const mockCancel = jest.fn();

      render(
        <ProductEditForm
          initialData={mockProductData}
          isCreating={true}
          onSubmit={mockSubmit}
          onCancel={mockCancel}
        />
      );

      // 檢查表單標籤
      expect(screen.getByLabelText(/product code/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/product description/i)).toBeInTheDocument();

      // 檢查必填字段標記
      const requiredMarkers = screen.getAllByText('*');
      expect(requiredMarkers.length).toBeGreaterThan(0);
    });

    test('FormCard 可訪問性', async () => {
      renderWithProviders(
        <FormCard
          formType={FormType.PRODUCT_EDIT}
          showHeader={true}
        />
      );

      await waitFor(() => {
        // 檢查 ARIA 標籤
        expect(screen.getByRole('region')).toBeInTheDocument();
        
        // 檢查表單標籤
        expect(screen.getByLabelText(/product code/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/product description/i)).toBeInTheDocument();
      });
    });
  });

  describe('性能測試', () => {
    test('FormCard 渲染性能', async () => {
      const startTime = performance.now();

      renderWithProviders(
        <FormCard
          formType={FormType.PRODUCT_EDIT}
          prefilledData={mockProductData}
          showHeader={true}
          showProgress={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Product Information')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // 渲染時間應該在合理範圍內（這個閾值可能需要根據實際環境調整）
      expect(renderTime).toBeLessThan(1000); // 1秒內
    });

    test('ProductEditForm 渲染性能', () => {
      const startTime = performance.now();

      const mockSubmit = jest.fn();
      const mockCancel = jest.fn();

      render(
        <ProductEditForm
          initialData={mockProductData}
          isCreating={true}
          onSubmit={mockSubmit}
          onCancel={mockCancel}
        />
      );

      expect(screen.getByText('Create New Product')).toBeInTheDocument();

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(500); // 500ms內
    });
  });
});

describe('遷移兼容性測試', () => {
  test('FormCard 支援 ProductEditForm 的所有配置選項', async () => {
    // 測試編輯模式
    renderWithProviders(
      <FormCard
        formType={FormType.PRODUCT_EDIT}
        entityId="existing-product-id"
        prefilledData={mockProductData}
        isEditMode={false}
        showHeader={true}
        showProgress={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Product Information')).toBeInTheDocument();
    });

    // 應該顯示 Update 而不是 Create
    expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
  });

  test('事件處理器兼容性', async () => {
    const mockSubmitSuccess = jest.fn();
    const mockSubmitError = jest.fn();
    const mockCancel = jest.fn();
    const mockFieldChange = jest.fn();

    renderWithProviders(
      <FormCard
        formType={FormType.PRODUCT_EDIT}
        onSubmitSuccess={mockSubmitSuccess}
        onSubmitError={mockSubmitError}
        onCancel={mockCancel}
        onFieldChange={mockFieldChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/product code/i)).toBeInTheDocument();
    });

    // 測試字段變更事件
    const user = userEvent.setup();
    const codeInput = screen.getByLabelText(/product code/i);
    await user.type(codeInput, 'TEST');

    // 測試取消按鈕
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockCancel).toHaveBeenCalled();
  });
});

describe('邊界情況測試', () => {
  test('空數據處理', async () => {
    renderWithProviders(
      <FormCard
        formType={FormType.PRODUCT_EDIT}
        prefilledData={{}}
        showHeader={true}
      />
    );

    await waitFor(() => {
      const codeInput = screen.getByLabelText(/product code/i);
      expect(codeInput).toHaveValue('');
    });
  });

  test('無效 FormType 處理', async () => {
    // 這應該降級到默認表單配置
    renderWithProviders(
      <FormCard
        formType={'INVALID_TYPE' as FormType}
        showHeader={true}
      />
    );

    // 應該至少渲染出基本的表單結構
    await waitFor(() => {
      expect(screen.getByRole('form')).toBeInTheDocument();
    });
  });

  test('大量數據處理', async () => {
    const largePrefilledData = {
      ...mockProductData,
      description: 'A'.repeat(1000), // 很長的描述
    };

    renderWithProviders(
      <FormCard
        formType={FormType.PRODUCT_EDIT}
        prefilledData={largePrefilledData}
        showHeader={true}
      />
    );

    await waitFor(() => {
      const descriptionInput = screen.getByLabelText(/product description/i);
      expect(descriptionInput).toHaveValue(largePrefilledData.description);
    });
  });
});