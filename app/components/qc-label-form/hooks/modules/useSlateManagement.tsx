/**
 * useSlateManagement Hook
 * 處理 Slate 產品相關的所有邏輯
 */

import { useCallback } from 'react';
import type { FormData, SlateDetail } from '../../types';

interface UseSlateManagementProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}

interface UseSlateManagementReturn {
  handleSlateDetailChange: (field: keyof SlateDetail, value: string) => void;
  handleSlateBatchNumberChange: (batchNumber: string) => void;
  validateSlateDetails: () => boolean;
  clearSlateDetails: () => void;
}

export const useSlateManagement = ({
  formData,
  setFormData
}: UseSlateManagementProps): UseSlateManagementReturn => {
  
  // Slate 批次號碼更改處理器 - 簡化為只處理批次號碼
  const handleSlateBatchNumberChange = useCallback((batchNumber: string) => {
    // 只更新批次號碼，不自動填充材料
    setFormData(prev => ({
      ...prev,
      slateDetail: {
        ...prev.slateDetail,
        batchNumber: batchNumber
      }
    }));
  }, [setFormData]);

  // 通用 Slate 詳情更改處理器
  const handleSlateDetailChange = useCallback((field: keyof SlateDetail, value: string) => {
    if (field === 'batchNumber') {
      handleSlateBatchNumberChange(value);
    } else {
      // 對於其他字段，只是正常更新，沒有特殊邏輯
      setFormData(prev => ({
        ...prev,
        slateDetail: {
          ...prev.slateDetail,
          [field]: value
        }
      }));
    }
  }, [setFormData, handleSlateBatchNumberChange]);

  // 驗證 Slate 詳情
  const validateSlateDetails = useCallback(() => {
    // 檢查批次號碼是否存在
    const hasValidBatchNumber = formData.slateDetail?.batchNumber?.trim().length > 0;
    
    return hasValidBatchNumber;
  }, [formData.slateDetail]);

  // 清除 Slate 詳情
  const clearSlateDetails = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      slateDetail: {
        batchNumber: ''
      }
    }));
  }, [setFormData]);


  return {
    handleSlateDetailChange,
    handleSlateBatchNumberChange,
    validateSlateDetails,
    clearSlateDetails
  };
};