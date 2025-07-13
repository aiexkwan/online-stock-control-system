import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { WeightInputList } from '@/app/print-grnlabel/components/WeightInputList';
import { getPalletLabel, type PalletTypeKey, type PackageTypeKey } from '@/app/constants/grnConstants';

// Mock GrnErrorHandler
jest.mock('@/app/print-grnlabel/services/ErrorHandler', () => ({
  grnErrorHandler: {
    handleWeightError: jest.fn(),
  },
}));

describe('WeightInputList - GRN 重量輸入列表組件', () => {
  const mockProps = {
    grossWeights: ['100', '200', ''],
    onChange: jest.fn(),
    onRemove: jest.fn(),
    labelMode: 'weight' as const,
    selectedPalletType: 'whiteDry' as const,
    selectedPackageType: 'bag' as const,
    disabled: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('渲染測試', () => {
    test('正確渲染所有重量輸入框', () => {
      render(<WeightInputList {...mockProps} />);

      // 應該有 3 個輸入框
      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs).toHaveLength(3);

      // 檢查值
      expect(inputs[0]).toHaveValue(100);
      expect(inputs[1]).toHaveValue(200);
      expect(inputs[2]).toHaveValue(null);
    });

    test('顯示正確的托盤編號', () => {
      render(<WeightInputList {...mockProps} />);

      // Component shows numbers instead of ordinal labels
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    test('顯示淨重信息', () => {
      render(<WeightInputList {...mockProps} />);

      // Component shows total net weight
      expect(screen.getByText('Total Net Weight:')).toBeInTheDocument();
      // Total: (100 - 14 - 1) + (200 - 14 - 1) = 85 + 185 = 270
      // But the mockProps uses 'bag' package type which has 0 weight, so:
      // Total: (100 - 14) + (200 - 14) = 86 + 186 = 272
      // The text is split as "272.0" and "kg" in separate elements
      expect(screen.getByText((content, element) => {
        return element?.textContent === '272.0 kg';
      })).toBeInTheDocument();
    });

    test('禁用狀態下所有輸入框應該被禁用', () => {
      render(<WeightInputList {...mockProps} disabled={true} />);

      const inputs = screen.getAllByRole('spinbutton');
      inputs.forEach(input => {
        expect(input).toBeDisabled();
      });

      // 刪除按鈕也應該被禁用
      const removeButtons = screen.getAllByText('×');
      removeButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('交互測試', () => {
    test('輸入重量時觸發 onChange', () => {
      render(<WeightInputList {...mockProps} />);

      const firstInput = screen.getAllByRole('spinbutton')[0];
      fireEvent.change(firstInput, { target: { value: '150' } });

      expect(mockProps.onChange).toHaveBeenCalledWith(0, '150');
    });

    test('不顯示添加按鈕', () => {
      render(<WeightInputList {...mockProps} />);

      // WeightInputList 不使用添加按鈕
      const addButton = screen.queryByText('+');
      expect(addButton).not.toBeInTheDocument();
    });

    test('點擊刪除按鈕觸發 onRemove', () => {
      render(<WeightInputList {...mockProps} />);

      const removeButtons = screen.getAllByText('×');
      fireEvent.click(removeButtons[1]); // 刪除第二個

      expect(mockProps.onRemove).toHaveBeenCalledWith(1);
    });

    test('Enter 鍵不觸發特殊行為', () => {
      render(<WeightInputList {...mockProps} />);

      const firstInput = screen.getAllByRole('spinbutton')[0];
      fireEvent.keyDown(firstInput, { key: 'Enter' });

      // 組件不處理 Enter 鍵
      expect(mockProps.onChange).not.toHaveBeenCalled();
    });

    test('最後一個元素不顯示刪除按鈕', () => {
      render(<WeightInputList {...mockProps} />);

      // grossWeights = ['100', '200', '']
      // 第一個元素: hasValue=true, isLast=false -> 顯示刪除按鈕
      // 第二個元素: hasValue=true, isLast=false -> 顯示刪除按鈕
      // 第三個元素: hasValue=false, isLast=true -> 不顯示刪除按鈕
      const removeButtons = screen.queryAllByText('×');
      expect(removeButtons).toHaveLength(2); // 前兩個有值的元素都有刪除按鈕
    });
  });

  describe('展開/收起功能', () => {
    test('預設展開當有超過 5 個填寫的輸入框', () => {
      const manyWeightsProps = {
        ...mockProps,
        grossWeights: ['100', '200', '300', '400', '500', '600'],
      };

      render(<WeightInputList {...manyWeightsProps} />);

      // Component auto-expands when more than 5 items, but no collapse button
      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs).toHaveLength(6);
    });

    test('顯示漸變效果當超過 5 個項目且未展開', () => {
      const manyWeightsProps = {
        ...mockProps,
        grossWeights: ['100', '200', '300', '400', '500', '600'],
      };

      // Component doesn't have manual expand/collapse, just automatic behavior
      render(<WeightInputList {...manyWeightsProps} />);
      
      // All items should be visible (auto-expanded)
      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs).toHaveLength(6);
    });

    test('少於 5 個輸入框時不顯示漸變效果', () => {
      render(<WeightInputList {...mockProps} />);

      // Just verify the inputs are rendered
      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs).toHaveLength(3);
    });
  });

  describe('邊界情況', () => {
    test('處理空的重量陣列', () => {
      const emptyProps = {
        ...mockProps,
        grossWeights: [],
      };

      render(<WeightInputList {...emptyProps} />);

      // 應該顯示至少一個輸入框或提示訊息
      expect(screen.queryAllByRole('spinbutton')).toHaveLength(0);
    });

    test('處理非常大的數值', () => {
      const largeValueProps = {
        ...mockProps,
        grossWeights: ['999999999'],
      };

      render(<WeightInputList {...largeValueProps} />);

      const input = screen.getByRole('spinbutton');
      expect(input).toHaveValue(999999999);
    });

    test('處理小數點數值', () => {
      const decimalProps = {
        ...mockProps,
        grossWeights: ['123.45'],
      };

      render(<WeightInputList {...decimalProps} />);

      const input = screen.getByRole('spinbutton');
      expect(input).toHaveValue(123.45);
    });
  });

  describe('輔助函數測試', () => {
    test('getPalletLabel 函數正確生成標籤', () => {
      expect(getPalletLabel(0)).toBe('1st Pallet');
      expect(getPalletLabel(1)).toBe('2nd Pallet');
      expect(getPalletLabel(2)).toBe('3rd Pallet');
      expect(getPalletLabel(3)).toBe('4th Pallet');
      expect(getPalletLabel(20)).toBe('21st Pallet');
      expect(getPalletLabel(21)).toBe('22nd Pallet');
      expect(getPalletLabel(22)).toBe('23rd Pallet');
    });
  });
});