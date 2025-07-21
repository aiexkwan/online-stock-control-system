'use client';

import { useReducer, useCallback, useMemo } from 'react';
import {
  LABEL_MODES,
  type PalletTypeKey,
  type PackageTypeKey,
  type LabelMode,
} from '@/app/constants/grnConstants';

// 定義表單狀態類型
export interface GrnFormState {
  // 基本表單數據
  formData: {
    grnNumber: string;
    materialSupplier: string;
    productCode: string;
  };

  // 標籤模式
  labelMode: LabelMode;

  // 產品信息
  productInfo: {
    code: string;
    description: string;
  } | null;

  // 供應商信息
  supplierInfo: {
    code: string;
    name: string;
    address?: string;
  } | null;

  // 托盤類型數量
  palletType: Record<PalletTypeKey, string>;

  // 包裝類型數量
  packageType: Record<PackageTypeKey, string>;

  // 毛重列表
  grossWeights: string[];

  // UI 狀態
  ui: {
    isClockNumberDialogOpen: boolean;
    isProcessing: boolean;
    supplierError: string | null;
  };

  // 進度狀態
  progress: {
    current: number;
    total: number;
    status: Array<'Pending' | 'Processing' | 'Success' | 'Failed'>;
  };
}

// 定義 Action 類型
export type GrnFormAction =
  | { type: 'SET_FORM_FIELD'; field: keyof GrnFormState['formData']; value: string }
  | { type: 'SET_LABEL_MODE'; mode: LabelMode }
  | { type: 'SET_PRODUCT_INFO'; productInfo: GrnFormState['productInfo'] }
  | { type: 'SET_SUPPLIER_INFO'; supplierInfo: GrnFormState['supplierInfo'] }
  | { type: 'SET_SUPPLIER_ERROR'; error: string | null }
  | { type: 'SET_PALLET_TYPE'; palletType: PalletTypeKey; value: string }
  | { type: 'SET_PACKAGE_TYPE'; packageType: PackageTypeKey; value: string }
  | { type: 'SET_GROSS_WEIGHT'; index: number; value: string }
  | { type: 'ADD_GROSS_WEIGHT' }
  | { type: 'REMOVE_GROSS_WEIGHT'; index: number }
  | { type: 'SET_GROSS_WEIGHTS'; weights: string[] }
  | { type: 'TOGGLE_CLOCK_NUMBER_DIALOG' }
  | { type: 'SET_PROCESSING'; isProcessing: boolean }
  | { type: 'SET_PROGRESS'; progress: GrnFormState['progress'] }
  | {
      type: 'UPDATE_PROGRESS_STATUS';
      index: number;
      status: GrnFormState['progress']['status'][number];
    }
  | { type: 'RESET_FORM' }
  | { type: 'RESET_PRODUCT_AND_WEIGHTS' };

// 初始狀態
export const initialGrnFormState: GrnFormState = {
  formData: {
    grnNumber: '',
    materialSupplier: '',
    productCode: '',
  },
  labelMode: LABEL_MODES.WEIGHT,
  productInfo: null,
  supplierInfo: null,
  palletType: {
    whiteDry: '',
    whiteWet: '',
    chepDry: '',
    chepWet: '',
    euro: '',
    notIncluded: '',
  },
  packageType: {
    still: '',
    bag: '',
    tote: '',
    octo: '',
    notIncluded: '',
  },
  grossWeights: [''],
  ui: {
    isClockNumberDialogOpen: false,
    isProcessing: false,
    supplierError: null,
  },
  progress: {
    current: 0,
    total: 0,
    status: [],
  },
};

// Reducer 函數
export function grnFormReducer(state: GrnFormState, action: GrnFormAction): GrnFormState {
  switch (action.type) {
    case 'SET_FORM_FIELD':
      return {
        ...state,
        formData: {
          ...state.formData,
          [action.field]: action.value,
        },
      };

    case 'SET_LABEL_MODE':
      return {
        ...state,
        labelMode: action.mode,
      };

    case 'SET_PRODUCT_INFO':
      return {
        ...state,
        productInfo: action.productInfo,
      };

    case 'SET_SUPPLIER_INFO':
      return {
        ...state,
        supplierInfo: action.supplierInfo,
        ui: {
          ...state.ui,
          supplierError: null, // 清除錯誤當成功設置供應商
        },
      };

    case 'SET_SUPPLIER_ERROR':
      return {
        ...state,
        ui: {
          ...state.ui,
          supplierError: action.error,
        },
      };

    case 'SET_PALLET_TYPE':
      return {
        ...state,
        palletType: {
          ...state.palletType,
          [action.palletType]: action.value,
        },
      };

    case 'SET_PACKAGE_TYPE':
      return {
        ...state,
        packageType: {
          ...state.packageType,
          [action.packageType]: action.value,
        },
      };

    case 'SET_GROSS_WEIGHT':
      const newWeights = [...state.grossWeights];
      newWeights[action.index] = action.value;
      return {
        ...state,
        grossWeights: newWeights,
      };

    case 'ADD_GROSS_WEIGHT':
      return {
        ...state,
        grossWeights: [...state.grossWeights, ''],
      };

    case 'REMOVE_GROSS_WEIGHT':
      if (state.grossWeights.length > 1) {
        const filteredWeights = state.grossWeights.filter((_, index) => index !== action.index);
        return {
          ...state,
          grossWeights: filteredWeights,
        };
      }
      return state;

    case 'SET_GROSS_WEIGHTS':
      return {
        ...state,
        grossWeights: action.weights,
      };

    case 'TOGGLE_CLOCK_NUMBER_DIALOG':
      return {
        ...state,
        ui: {
          ...state.ui,
          isClockNumberDialogOpen: !state.ui.isClockNumberDialogOpen,
        },
      };

    case 'SET_PROCESSING':
      return {
        ...state,
        ui: {
          ...state.ui,
          isProcessing: action.isProcessing,
        },
      };

    case 'SET_PROGRESS':
      return {
        ...state,
        progress: action.progress,
      };

    case 'UPDATE_PROGRESS_STATUS':
      const newStatus = [...state.progress.status];
      newStatus[action.index] = action.status;
      return {
        ...state,
        progress: {
          ...state.progress,
          status: newStatus,
        },
      };

    case 'RESET_FORM':
      return initialGrnFormState;

    case 'RESET_PRODUCT_AND_WEIGHTS':
      return {
        ...state,
        formData: {
          ...state.formData,
          productCode: '',
        },
        productInfo: null,
        grossWeights: [''],
        labelMode: LABEL_MODES.WEIGHT,
        palletType: {
          whiteDry: '',
          whiteWet: '',
          chepDry: '',
          chepWet: '',
          euro: '',
          notIncluded: '',
        },
        packageType: {
          still: '',
          bag: '',
          tote: '',
          octo: '',
          notIncluded: '',
        },
      };

    default:
      return state;
  }
}

/**
 * Custom hook for GRN form state management
 * 使用 useReducer 統一管理 GRN 表單狀態
 */
export const useGrnFormReducer = () => {
  const [state, dispatch] = useReducer(grnFormReducer, initialGrnFormState);

  // 輔助函數 - 設置表單字段
  const setFormField = useCallback((field: keyof GrnFormState['formData'], value: string) => {
    dispatch({ type: 'SET_FORM_FIELD', field, value });
  }, []);

  // 輔助函數 - 設置托盤類型
  const setPalletType = useCallback((palletType: PalletTypeKey, value: string) => {
    dispatch({ type: 'SET_PALLET_TYPE', palletType, value });
  }, []);

  // 輔助函數 - 設置包裝類型
  const setPackageType = useCallback((packageType: PackageTypeKey, value: string) => {
    dispatch({ type: 'SET_PACKAGE_TYPE', packageType, value });
  }, []);

  // 輔助函數 - 設置單個毛重
  const setGrossWeight = useCallback((index: number, value: string) => {
    dispatch({ type: 'SET_GROSS_WEIGHT', index, value });
  }, []);

  // 輔助函數 - 更新進度狀態
  const updateProgressStatus = useCallback(
    (index: number, status: GrnFormState['progress']['status'][number]) => {
      dispatch({ type: 'UPDATE_PROGRESS_STATUS', index, status });
    },
    []
  );

  // 使用 useMemo 確保 actions 對象穩定
  const actions = useMemo(
    () => ({
      setFormField,
      setPalletType,
      setPackageType,
      setGrossWeight,
      updateProgressStatus,
      setLabelMode: (mode: LabelMode) => dispatch({ type: 'SET_LABEL_MODE', mode }),
      setProductInfo: (productInfo: GrnFormState['productInfo']) =>
        dispatch({ type: 'SET_PRODUCT_INFO', productInfo }),
      setSupplierInfo: (supplierInfo: GrnFormState['supplierInfo']) =>
        dispatch({ type: 'SET_SUPPLIER_INFO', supplierInfo }),
      setSupplierError: (error: string | null) => dispatch({ type: 'SET_SUPPLIER_ERROR', error }),
      addGrossWeight: () => dispatch({ type: 'ADD_GROSS_WEIGHT' }),
      removeGrossWeight: (index: number) => dispatch({ type: 'REMOVE_GROSS_WEIGHT', index }),
      setGrossWeights: (weights: string[]) => dispatch({ type: 'SET_GROSS_WEIGHTS', weights }),
      toggleClockNumberDialog: () => dispatch({ type: 'TOGGLE_CLOCK_NUMBER_DIALOG' }),
      setProcessing: (isProcessing: boolean) => dispatch({ type: 'SET_PROCESSING', isProcessing }),
      setProgress: (progress: GrnFormState['progress']) =>
        dispatch({ type: 'SET_PROGRESS', progress }),
      resetForm: () => dispatch({ type: 'RESET_FORM' }),
      resetProductAndWeights: () => dispatch({ type: 'RESET_PRODUCT_AND_WEIGHTS' }),
    }),
    [setFormField, setPalletType, setPackageType, setGrossWeight, updateProgressStatus]
  );

  return {
    state,
    dispatch,
    actions,
  };
};
