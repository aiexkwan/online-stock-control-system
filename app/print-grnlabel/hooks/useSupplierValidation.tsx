'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/app/utils/supabase/client';
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
      const supabase = createClient();
      
      // 使用 RPC 函數代替直接查詢
      const { data, error } = await supabase
        .rpc('search_supplier_code', { 
          p_code: supplierCode.toUpperCase() 
        });

      if (error || !data) {
        setSupplierInfo(null);
        const errorMsg = 'Supplier Code Not Found';
        setSupplierError(errorMsg);
        process.env.NODE_ENV !== "production" && console.log('[useSupplierValidation] Supplier not found:', supplierCode);
        
        grnErrorHandler.handleSupplierError(
          error || errorMsg,
          supplierCode,
          {
            component: 'useSupplierValidation',
            action: 'supplier_validation'
          }
        );
      } else {
        // RPC 函數返回的數據直接使用
        const supplierData = data as SupplierInfo;
        setSupplierInfo(supplierData);
        setSupplierError(null);
        process.env.NODE_ENV !== "production" && console.log('[useSupplierValidation] Supplier found:', supplierData);
        return supplierData; // Return the found supplier
      }
    } catch (error) {
      console.error('[useSupplierValidation] Error validating supplier:', error);
      setSupplierInfo(null);
      const errorMsg = 'Error validating supplier';
      setSupplierError(errorMsg);
      
      grnErrorHandler.handleSupplierError(
        error as Error,
        supplierCode,
        {
          component: 'useSupplierValidation',
          action: 'supplier_validation'
        }
      );
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
    validateSupplier,
    clearSupplierInfo
  };
};

export default useSupplierValidation;