'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import type { WidgetToastOptions, UseWidgetToastReturn } from '@/types/hooks/admin';

/**
 * Widget 專用的 Toast Hook
 * 提供統一的通知體驗，包括成功、錯誤、警告、信息和加載狀態
 */
export function useWidgetToast(): UseWidgetToastReturn {
  const showSuccess = useCallback((message: string, options?: WidgetToastOptions) => {
    toast.success(message, {
      duration: options?.duration || 3000,
      position: options?.position || 'top-right',
      dismissible: options?.dismissible !== false,
      action: options?.action && {
        label: options.action.label,
        onClick: options.action.onClick,
      },
    });
  }, []);

  const showError = useCallback((message: string, error?: Error, options?: WidgetToastOptions) => {
    const errorMessage = error ? `${message}: ${error.message}` : message;

    toast.error(errorMessage, {
      duration: options?.duration || 5000,
      position: options?.position || 'top-right',
      dismissible: options?.dismissible !== false,
      description:
        error?.stack && process.env.NODE_ENV === 'development'
          ? `Stack: ${error.stack.slice(0, 200)}...`
          : undefined,
      action: options?.action && {
        label: options.action.label,
        onClick: options.action.onClick,
      },
    });
  }, []);

  const showInfo = useCallback((message: string, options?: WidgetToastOptions) => {
    toast.info(message, {
      duration: options?.duration || 4000,
      position: options?.position || 'top-right',
      dismissible: options?.dismissible !== false,
      action: options?.action && {
        label: options.action.label,
        onClick: options.action.onClick,
      },
    });
  }, []);

  const showWarning = useCallback((message: string, options?: WidgetToastOptions) => {
    toast.warning(message, {
      duration: options?.duration || 4000,
      position: options?.position || 'top-right',
      dismissible: options?.dismissible !== false,
      action: options?.action && {
        label: options.action.label,
        onClick: options.action.onClick,
      },
    });
  }, []);

  const showLoading = useCallback((message: string, options?: WidgetToastOptions) => {
    const toastId = toast.loading(message, {
      position: options?.position || 'top-right',
      dismissible: options?.dismissible !== false,
    });

    // 返回關閉函數
    return () => {
      toast.dismiss(toastId);
    };
  }, []);

  const showPromise = useCallback(
    <T>(
      promise: Promise<T>,
      options: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((error: Error) => string);
      }
    ): Promise<T> => {
      const toastPromise = toast.promise(promise, {
        loading: options.loading,
        success: options.success,
        error: options.error,
        position: 'top-right',
      });

      // Return the original promise, not the toast promise wrapper
      return promise;
    },
    []
  );

  return {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showLoading,
    showPromise,
  };
}

// 預設配置
export const WidgetToastPresets = {
  dataFetch: {
    loading: 'Loading widget data...',
    success: 'Data loaded successfully',
    error: 'Failed to load widget data',
  },
  dataUpdate: {
    loading: 'Updating data...',
    success: 'Data updated successfully',
    error: 'Failed to update data',
  },
  fileUpload: {
    loading: 'Uploading file...',
    success: 'File uploaded successfully',
    error: 'Failed to upload file',
  },
  reportGeneration: {
    loading: 'Generating report...',
    success: 'Report generated successfully',
    error: 'Failed to generate report',
  },
  export: {
    loading: 'Exporting data...',
    success: 'Data exported successfully',
    error: 'Failed to export data',
  },
};

// 便利函數
export function createWidgetToastAction(label: string, action: () => void) {
  return { label, onClick: action };
}
