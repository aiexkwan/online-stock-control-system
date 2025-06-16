import { grnFormReducer, initialGrnFormState } from '@/app/print-grnlabel/hooks/useGrnFormReducer';
import type { GrnFormState, GrnFormAction } from '@/app/print-grnlabel/hooks/useGrnFormReducer';

describe('grnFormReducer - GRN 表單狀態管理', () => {
  let state: GrnFormState;

  beforeEach(() => {
    state = initialGrnFormState;
  });

  describe('表單欄位更新', () => {
    test('SET_FORM_FIELD 應該更新指定欄位', () => {
      const action: GrnFormAction = {
        type: 'SET_FORM_FIELD',
        field: 'grnNumber',
        value: 'GRN12345'
      };

      const newState = grnFormReducer(state, action);

      expect(newState.formData.grnNumber).toBe('GRN12345');
      expect(newState.formData.materialSupplier).toBe(''); // 其他欄位不變
    });

    test('更新多個表單欄位', () => {
      let newState = state;
      
      newState = grnFormReducer(newState, {
        type: 'SET_FORM_FIELD',
        field: 'grnNumber',
        value: 'GRN001'
      });
      
      newState = grnFormReducer(newState, {
        type: 'SET_FORM_FIELD',
        field: 'materialSupplier',
        value: 'SUP001'
      });
      
      newState = grnFormReducer(newState, {
        type: 'SET_FORM_FIELD',
        field: 'productCode',
        value: 'PROD001'
      });

      expect(newState.formData).toEqual({
        grnNumber: 'GRN001',
        materialSupplier: 'SUP001',
        productCode: 'PROD001'
      });
    });
  });

  describe('供應商信息管理', () => {
    test('SET_SUPPLIER_INFO 應該更新供應商信息', () => {
      const supplierInfo = {
        code: 'SUP001',
        name: 'Test Supplier Ltd',
        address: '123 Test Street'
      };

      const newState = grnFormReducer(state, {
        type: 'SET_SUPPLIER_INFO',
        supplierInfo
      });

      expect(newState.supplierInfo).toEqual(supplierInfo);
    });

    test('SET_SUPPLIER_ERROR 應該設置錯誤信息', () => {
      const errorMessage = 'Supplier not found';
      
      const newState = grnFormReducer(state, {
        type: 'SET_SUPPLIER_ERROR',
        error: errorMessage
      });

      expect(newState.ui.supplierError).toBe(errorMessage);
    });

    test('清除供應商錯誤', () => {
      // 先設置錯誤
      let newState = grnFormReducer(state, {
        type: 'SET_SUPPLIER_ERROR',
        error: 'Some error'
      });

      // 再清除錯誤
      newState = grnFormReducer(newState, {
        type: 'SET_SUPPLIER_ERROR',
        error: null
      });

      expect(newState.ui.supplierError).toBeNull();
    });
  });

  describe('產品信息管理', () => {
    test('SET_PRODUCT_INFO 應該更新產品信息', () => {
      const productInfo = {
        code: 'PROD001',
        description: 'Test Product'
      };

      const newState = grnFormReducer(state, {
        type: 'SET_PRODUCT_INFO',
        productInfo
      });

      expect(newState.productInfo).toEqual(productInfo);
    });

    test('設置 null 產品信息', () => {
      // 先設置產品
      let newState = grnFormReducer(state, {
        type: 'SET_PRODUCT_INFO',
        productInfo: { code: 'PROD001', description: 'Test' }
      });

      // 再設置為 null
      newState = grnFormReducer(newState, {
        type: 'SET_PRODUCT_INFO',
        productInfo: null
      });

      expect(newState.productInfo).toBeNull();
    });
  });

  describe('標籤模式切換', () => {
    test('SET_LABEL_MODE 應該切換模式', () => {
      // 預設是 weight
      expect(state.labelMode).toBe('weight');

      // 切換到 qty
      let newState = grnFormReducer(state, {
        type: 'SET_LABEL_MODE',
        mode: 'qty'
      });

      expect(newState.labelMode).toBe('qty');

      // 切換回 weight
      newState = grnFormReducer(newState, {
        type: 'SET_LABEL_MODE',
        mode: 'weight'
      });

      expect(newState.labelMode).toBe('weight');
    });
  });

  describe('托盤類型管理', () => {
    test('SET_PALLET_TYPE 應該更新托盤類型', () => {
      const newState = grnFormReducer(state, {
        type: 'SET_PALLET_TYPE',
        palletType: 'whiteDry',
        value: '5'
      });

      expect(newState.palletType.whiteDry).toBe('5');
      expect(newState.palletType.whiteWet).toBe(''); // 其他保持不變
    });

    test('清空托盤類型', () => {
      // 先設置
      let newState = grnFormReducer(state, {
        type: 'SET_PALLET_TYPE',
        palletType: 'whiteDry',
        value: '5'
      });

      // 再清空
      newState = grnFormReducer(newState, {
        type: 'SET_PALLET_TYPE',
        palletType: 'whiteDry',
        value: ''
      });

      expect(newState.palletType.whiteDry).toBe('');
    });
  });

  describe('包裝類型管理', () => {
    test('SET_PACKAGE_TYPE 應該更新包裝類型', () => {
      const newState = grnFormReducer(state, {
        type: 'SET_PACKAGE_TYPE',
        packageType: 'bag',
        value: '10'
      });

      expect(newState.packageType.bag).toBe('10');
      expect(newState.packageType.still).toBe(''); // 其他保持不變
    });
  });

  describe('重量管理', () => {
    test('SET_GROSS_WEIGHTS 應該設置所有重量', () => {
      const weights = ['100', '200', '300'];
      
      const newState = grnFormReducer(state, {
        type: 'SET_GROSS_WEIGHTS',
        weights
      });

      expect(newState.grossWeights).toEqual(weights);
    });

    test('SET_GROSS_WEIGHT 應該更新指定位置的重量', () => {
      // 先設置初始重量
      let newState = grnFormReducer(state, {
        type: 'SET_GROSS_WEIGHTS',
        weights: ['100', '200', '300']
      });

      // 更新第二個重量
      newState = grnFormReducer(newState, {
        type: 'SET_GROSS_WEIGHT',
        index: 1,
        value: '250'
      });

      expect(newState.grossWeights[1]).toBe('250');
      expect(newState.grossWeights[0]).toBe('100'); // 其他不變
      expect(newState.grossWeights[2]).toBe('300');
    });

    test('ADD_GROSS_WEIGHT 應該添加新的空重量', () => {
      // 初始只有一個
      expect(state.grossWeights).toHaveLength(1);

      const newState = grnFormReducer(state, {
        type: 'ADD_GROSS_WEIGHT'
      });

      expect(newState.grossWeights).toHaveLength(2);
      expect(newState.grossWeights[1]).toBe(''); // 新增的是空字符串
    });

    test('REMOVE_GROSS_WEIGHT 應該移除指定位置的重量', () => {
      // 先設置多個重量
      let newState = grnFormReducer(state, {
        type: 'SET_GROSS_WEIGHTS',
        weights: ['100', '200', '300']
      });

      // 移除中間的
      newState = grnFormReducer(newState, {
        type: 'REMOVE_GROSS_WEIGHT',
        index: 1
      });

      expect(newState.grossWeights).toEqual(['100', '300']);
    });

    test('REMOVE_GROSS_WEIGHT 不應該移除最後一個重量', () => {
      // 只有一個重量
      const newState = grnFormReducer(state, {
        type: 'REMOVE_GROSS_WEIGHT',
        index: 0
      });

      // 應該保持不變
      expect(newState.grossWeights).toEqual(['']);
    });
  });

  describe('進度管理', () => {
    test('SET_PROGRESS 應該更新進度信息', () => {
      const progress = {
        current: 5,
        total: 10,
        status: ['Completed', 'Completed', 'Processing', 'Pending', 'Pending'] as const
      };

      const newState = grnFormReducer(state, {
        type: 'SET_PROGRESS',
        progress
      });

      expect(newState.progress).toEqual(progress);
    });

    test('UPDATE_PROGRESS_STATUS 應該更新特定進度狀態', () => {
      // 先設置初始進度
      let newState = grnFormReducer(state, {
        type: 'SET_PROGRESS',
        progress: {
          current: 2,
          total: 5,
          status: ['Pending', 'Pending', 'Pending', 'Pending', 'Pending']
        }
      });

      // 更新第一個為完成
      newState = grnFormReducer(newState, {
        type: 'UPDATE_PROGRESS_STATUS',
        index: 0,
        status: 'Completed'
      });

      expect(newState.progress.status[0]).toBe('Completed');
    });
  });

  describe('UI 狀態管理', () => {
    test('SET_PROCESSING 應該更新處理狀態', () => {
      expect(state.ui.isProcessing).toBe(false);

      const newState = grnFormReducer(state, {
        type: 'SET_PROCESSING',
        isProcessing: true
      });

      expect(newState.ui.isProcessing).toBe(true);
    });

    test('TOGGLE_CLOCK_NUMBER_DIALOG 應該切換對話框狀態', () => {
      expect(state.ui.isClockNumberDialogOpen).toBe(false);

      let newState = grnFormReducer(state, {
        type: 'TOGGLE_CLOCK_NUMBER_DIALOG'
      });

      expect(newState.ui.isClockNumberDialogOpen).toBe(true);

      // 再次切換
      newState = grnFormReducer(newState, {
        type: 'TOGGLE_CLOCK_NUMBER_DIALOG'
      });

      expect(newState.ui.isClockNumberDialogOpen).toBe(false);
    });
  });

  describe('重置操作', () => {
    test('RESET_PRODUCT_AND_WEIGHTS 應該重置產品和重量', () => {
      // 先設置一些數據
      let newState = grnFormReducer(state, {
        type: 'SET_PRODUCT_INFO',
        productInfo: { code: 'PROD001', description: 'Test' }
      });
      
      newState = grnFormReducer(newState, {
        type: 'SET_GROSS_WEIGHTS',
        weights: ['100', '200', '300']
      });

      newState = grnFormReducer(newState, {
        type: 'SET_FORM_FIELD',
        field: 'productCode',
        value: 'PROD001'
      });

      // 執行重置
      newState = grnFormReducer(newState, {
        type: 'RESET_PRODUCT_AND_WEIGHTS'
      });

      expect(newState.productInfo).toBeNull();
      expect(newState.grossWeights).toEqual(['']);
      expect(newState.formData.productCode).toBe(''); // productCode 也被清空
      expect(newState.formData.grnNumber).toBe(''); // 但 grnNumber 保持不變（原來的值）
    });

    test('RESET_FORM 應該重置整個表單', () => {
      // 先設置一些數據
      let newState = grnFormReducer(state, {
        type: 'SET_FORM_FIELD',
        field: 'grnNumber',
        value: 'GRN123'
      });

      newState = grnFormReducer(newState, {
        type: 'SET_PRODUCT_INFO',
        productInfo: { code: 'PROD001', description: 'Test' }
      });

      // 完全重置
      newState = grnFormReducer(newState, {
        type: 'RESET_FORM'
      });

      expect(newState).toEqual(initialGrnFormState);
    });
  });

  describe('無效動作處理', () => {
    test('應該返回原狀態對於未知動作', () => {
      const unknownAction = {
        type: 'UNKNOWN_ACTION' as any
      };

      const newState = grnFormReducer(state, unknownAction);

      expect(newState).toBe(state); // 應該返回相同的引用
    });
  });
});