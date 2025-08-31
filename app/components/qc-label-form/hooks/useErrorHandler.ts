'use client';

import { useCallback, useMemo } from 'react';
import { errorHandler, ErrorContext } from '../services/ErrorHandler';

// QC 表單錯誤處理的具體 additionalData 類型
interface QcErrorMetadata {
  palletNumber?: string;
  productCode?: string;
  quantity?: number;
  location?: string;
  batchId?: string;
  timestamp?: string;
  [key: string]: unknown;
}

interface UseErrorHandlerProps {
  component: string;
  userId?: string;
  defaultContext?: Partial<ErrorContext>;
}

export const useErrorHandler = ({ component, userId, defaultContext }: UseErrorHandlerProps) => {
  // Create base context
  const baseContext = useMemo(
    (): Partial<ErrorContext> => ({
      component,
      userId,
      ...defaultContext,
    }),
    [component, userId, defaultContext]
  );

  // API Error handler
  const handleApiError = useCallback(
    (_error: Error, action: string, userMessage?: string, additionalData?: QcErrorMetadata) => {
      errorHandler.handleApiError(
        _error,
        {
          ...baseContext,
          action,
          additionalData: { ...baseContext.additionalData, ...additionalData },
        } as ErrorContext,
        userMessage
      );
    },
    [baseContext]
  );

  // Network Error handler
  const handleNetworkError = useCallback(
    (_error: Error, action: string, additionalData?: QcErrorMetadata) => {
      errorHandler.handleNetworkError(_error, {
        ...baseContext,
        action,
        additionalData: { ...baseContext.additionalData, ...additionalData },
      } as ErrorContext);
    },
    [baseContext]
  );

  // Auth Error handler
  const handleAuthError = useCallback(
    (_error: Error, action: string, additionalData?: QcErrorMetadata) => {
      errorHandler.handleAuthError(_error, {
        ...baseContext,
        action,
        additionalData: { ...baseContext.additionalData, ...additionalData },
      } as ErrorContext);
    },
    [baseContext]
  );

  // PDF Error handler
  const handlePdfError = useCallback(
    (_error: Error, action: string, palletNumber?: string, additionalData?: QcErrorMetadata) => {
      errorHandler.handlePdfError(
        _error,
        {
          ...baseContext,
          action,
          additionalData: {
            ...baseContext.additionalData,
            ...additionalData,
            palletNumber,
          },
        } as ErrorContext,
        palletNumber
      );
    },
    [baseContext]
  );

  // Success handler
  const _handleSuccess = useCallback(
    (message: string, action: string, details?: string, additionalData?: QcErrorMetadata) => {
      errorHandler.handleSuccess(
        message,
        {
          ...baseContext,
          action,
          additionalData: { ...baseContext.additionalData, ...additionalData },
        } as ErrorContext,
        details
      );
    },
    [baseContext]
  );

  // Warning handler
  const handleWarning = useCallback(
    (
      message: string,
      action: string,
      showToast: boolean = true,
      additionalData?: QcErrorMetadata
    ) => {
      errorHandler.handleWarning(
        message,
        {
          ...baseContext,
          action,
          additionalData: { ...baseContext.additionalData, ...additionalData },
        } as ErrorContext,
        showToast
      );
    },
    [baseContext]
  );

  // Info handler
  const handleInfo = useCallback(
    (
      message: string,
      action: string,
      showToast: boolean = true,
      additionalData?: QcErrorMetadata
    ) => {
      errorHandler.handleInfo(
        message,
        {
          ...baseContext,
          action,
          additionalData: { ...baseContext.additionalData, ...additionalData },
        } as ErrorContext,
        showToast
      );
    },
    [baseContext]
  );

  // Validation Error handler
  const handleValidationError = useCallback(
    (
      fieldName: string,
      _error: string,
      action: string = 'validation',
      additionalData?: QcErrorMetadata
    ) => {
      errorHandler.handleValidationError(fieldName, _error, {
        ...baseContext,
        action,
        additionalData: {
          ...baseContext.additionalData,
          ...additionalData,
          fieldName,
          validationError: _error,
        },
      } as ErrorContext);
    },
    [baseContext]
  );

  // Generic error handler with automatic error type detection
  const handleError = useCallback(
    (_error: Error, action: string, userMessage?: string, additionalData?: QcErrorMetadata) => {
      const errorMessage = _error.message.toLowerCase();

      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        handleNetworkError(_error, action, additionalData);
      } else if (errorMessage.includes('auth') || errorMessage.includes('unauthorized')) {
        handleAuthError(_error, action, additionalData);
      } else if (errorMessage.includes('pdf') || errorMessage.includes('generation')) {
        handlePdfError(_error, action, additionalData?.palletNumber, additionalData);
      } else {
        handleApiError(_error, action, userMessage, additionalData);
      }
    },
    [handleNetworkError, handleAuthError, handlePdfError, handleApiError]
  );

  // Batch error handler for bulk operations
  const handleBatchError = useCallback(
    (_errors: Error[], action: string, additionalData?: QcErrorMetadata) => {
      const batchId = additionalData?.batchId || `batch-${Date.now()}`;

      _errors.forEach((error, index) => {
        handleError(error, `${action}-item-${index}`, undefined, {
          ...additionalData,
          batchId,
          batchIndex: index,
          batchTotal: _errors.length,
        });
      });

      // Summary message
      handleWarning(`${_errors.length} errors occurred during batch operation`, action, true, {
        ...additionalData,
        batchId,
      });
    },
    [handleError, handleWarning]
  );

  // Async operation wrapper with error handling
  const withErrorHandling = useCallback(
    <T>(
      operation: () => Promise<T>,
      action: string,
      successMessage?: string,
      errorMessage?: string
    ) => {
      return async (): Promise<T | undefined> => {
        try {
          const _result = await operation();

          if (successMessage) {
            _handleSuccess(successMessage, action);
          }

          return _result;
        } catch (error) {
          handleError(error as Error, action, errorMessage);
          return undefined;
        }
      };
    },
    [handleError, _handleSuccess]
  );

  return {
    // Individual handlers
    handleApiError,
    handleNetworkError,
    handleAuthError,
    handlePdfError,
    _handleSuccess,
    handleWarning,
    handleInfo,
    handleValidationError,

    // Generic handler
    handleError,

    // Utility
    withErrorHandling,

    // Access to base context for custom usage
    baseContext,

    // Batch error handler
    handleBatchError,
  };
};

export default useErrorHandler;
