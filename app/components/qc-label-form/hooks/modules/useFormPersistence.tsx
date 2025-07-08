'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { debounce } from '@/app/utils/debounce';
import type { FormData } from '../../types';

// 本地存儲鍵名
const STORAGE_KEY = 'qc-label-form-data';
const STORAGE_VERSION = '1.0';

interface StoredFormData {
  version: string;
  timestamp: number;
  data: Partial<FormData>;
}

interface UseFormPersistenceProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  isEnabled?: boolean;
  autoSaveDelay?: number;
}

export const useFormPersistence = ({
  formData,
  setFormData,
  isEnabled = true,
  autoSaveDelay = 1000,
}: UseFormPersistenceProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // 保存表單數據到本地存儲
  const saveFormData = useCallback(
    (data: FormData) => {
      if (!isEnabled) return;

      try {
        const storedData: StoredFormData = {
          version: STORAGE_VERSION,
          timestamp: Date.now(),
          data: {
            productCode: data.productCode,
            quantity: data.quantity,
            count: data.count,
            operator: data.operator,
            acoOrderRef: data.acoOrderRef,
            slateDetail: data.slateDetail,
            // 不保存敏感或臨時數據
            // userId, clockNumber 等不保存
          },
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(storedData));
        setLastSaved(new Date());
      } catch (error) {
        console.error('Failed to save form data:', error);
      }
    },
    [isEnabled]
  );

  // 使用防抖來自動保存
  const debouncedSave = useMemo(
    () => debounce(saveFormData, autoSaveDelay),
    [saveFormData, autoSaveDelay]
  );

  // 從本地存儲加載表單數據
  const loadFormData = useCallback(() => {
    if (!isEnabled) {
      setIsLoading(false);
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setIsLoading(false);
        return;
      }

      const parsedData: StoredFormData = JSON.parse(stored);

      // 檢查版本兼容性
      if (parsedData.version !== STORAGE_VERSION) {
        localStorage.removeItem(STORAGE_KEY);
        setIsLoading(false);
        return;
      }

      // 檢查數據是否過期（24小時）
      const isExpired = Date.now() - parsedData.timestamp > 24 * 60 * 60 * 1000;
      if (isExpired) {
        localStorage.removeItem(STORAGE_KEY);
        setIsLoading(false);
        return;
      }

      // 恢復表單數據
      setFormData(prevData => ({
        ...prevData,
        ...parsedData.data,
        slateDetail: {
          ...prevData.slateDetail,
          ...(parsedData.data.slateDetail || {}),
        },
      }));

      setLastSaved(new Date(parsedData.timestamp));
    } catch (error) {
      console.error('Failed to load form data:', error);
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, [isEnabled, setFormData]);

  // 清除保存的表單數據
  const clearSavedData = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setLastSaved(null);
    } catch (error) {
      console.error('Failed to clear saved data:', error);
    }
  }, []);

  // 檢查是否有保存的數據
  const hasSavedData = useCallback(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) !== null;
    } catch {
      return false;
    }
  }, []);

  // 初始化時加載數據
  useEffect(() => {
    loadFormData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 監聽表單數據變化並自動保存
  useEffect(() => {
    if (isEnabled && !isLoading) {
      debouncedSave(formData);
    }
  }, [formData, isEnabled, isLoading, debouncedSave]);

  // 在瀏覽器關閉前保存
  useEffect(() => {
    if (!isEnabled) return;

    const handleBeforeUnload = () => {
      saveFormData(formData);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [formData, saveFormData, isEnabled]);

  return {
    isLoading,
    lastSaved,
    saveFormData,
    loadFormData,
    clearSavedData,
    hasSavedData,
  };
};
