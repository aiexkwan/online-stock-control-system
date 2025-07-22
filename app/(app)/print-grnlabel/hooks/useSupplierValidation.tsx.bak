'use client';

import { useState, useCallback } from 'react';
import { validateSupplierCode } from '@/app/actions/grnActions';
import { grnErrorHandler } from '../services/ErrorHandler';

interface SupplierInfo {
  supplier_code: string;
  supplier_name: string;
}

interface UseSupplierValidationReturn {
  supplierInfo: SupplierInfo | null;
  supplierError: string | null;
  isValidating: boolean;
  validateSupplier: (supplierCode: string) => Promise<SupplierInfo | null>;
  clearSupplierInfo: () => void;
}

/**
 * Hook for handling supplier validation
 * 處理供應商代碼驗證邏輯
 * 使用 RPC 函數提高效率
 */
export const useSupplierValidation = (): UseSupplierValidationReturn => {
  const [supplierInfo, setSupplierInfo] = useState<SupplierInfo | null>(null);
  const [supplierError, setSupplierError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const validateSupplier = useCallback(async (supplierCode: string) => {
    // 清空輸入時重置狀態
    if (!supplierCode.trim()) {
      setSupplierInfo(null);
      setSupplierError(null);
      return null;
    }

    setIsValidating(true);
    setSupplierError(null);

    try {
      // 使用 Server Action
      const result = await validateSupplierCode(supplierCode);

      if (!result.success || !result.data) {
        setSupplierInfo(null);
        const errorMsg = result.error || 'Supplier Code Not Found';
        setSupplierError(errorMsg);
        (process.env.NODE_ENV as string) !== 'production' &&
          console.log('[useSupplierValidation] Supplier not found:', supplierCode);

        grnErrorHandler.handleSupplierError(errorMsg, supplierCode, {
          component: 'useSupplierValidation',
          action: 'supplier_validation',
        });
        return null;
      } else {
        // Server Action 返回的數據
        const supplierData = result.data;
        setSupplierInfo(supplierData as any);
        setSupplierError(null);
        (process.env.NODE_ENV as string) !== 'production' &&
          console.log('[useSupplierValidation] Supplier found:', supplierData);
        return supplierData;
      }
    } catch (error) {
      console.error('[useSupplierValidation] Error validating supplier:', error);
      setSupplierInfo(null);
      const errorMsg = 'Error validating supplier';
      setSupplierError(errorMsg);

      grnErrorHandler.handleSupplierError(error as Error, supplierCode, {
        component: 'useSupplierValidation',
        action: 'supplier_validation',
      });
    } finally {
      setIsValidating(false);
    }

    return null; // Return null if no supplier found
  }, []);

  const clearSupplierInfo = useCallback(() => {
    setSupplierInfo(null);
    setSupplierError(null);
  }, []);

  return {
    supplierInfo,
    supplierError,
    isValidating,
    validateSupplier: validateSupplier as any,
    clearSupplierInfo,
  };
};

export default useSupplierValidation;
