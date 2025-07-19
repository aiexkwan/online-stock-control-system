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
    (error: Error, action: string, userMessage?: string, additionalData?: QcErrorMetadata) => {
      errorHandler.handleApiError(
        error,
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
    (error: Error, action: string, additionalData?: QcErrorMetadata) => {
      errorHandler.handleNetworkError(error, {
        ...baseContext,
        action,
        additionalData: { ...baseContext.additionalData, ...additionalData },
      } as ErrorContext);
    },
    [baseContext]
  );

  // Auth Error handler
  const handleAuthError = useCallback(
    (error: Error, action: string, additionalData?: QcErrorMetadata) => {
      errorHandler.handleAuthError(error, {
        ...baseContext,
        action,
        additionalData: { ...baseContext.additionalData, ...additionalData },
      } as ErrorContext);
    },
    [baseContext]
  );

  // PDF Error handler
  const handlePdfError = useCallback(
    (error: Error, action: string, palletNumber?: string, additionalData?: QcErrorMetadata) => {
      errorHandler.handlePdfError(
        error,
        {
          ...baseContext,
          action,
          additionalData: { 
            ...baseContext.additionalData, 
            ...additionalData,
            palletNumber 
          },
        } as ErrorContext,
        palletNumber
      );
    },
    [baseContext]
  );

  // Success handler
  const handleSuccess = useCallback(
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
      error: string,
      action: string = 'validation',
      additionalData?: QcErrorMetadata
    ) => {
      errorHandler.handleValidationError(fieldName, error, {
        ...baseContext,
        action,
        additionalData: { 
          ...baseContext.additionalData, 
          ...additionalData,
          fieldName,
          validationError: error 
        },
      } as ErrorContext);
    },
    [baseContext]
  );

  // Generic error handler with automatic error type detection
  const handleError = useCallback(
    (error: Error, action: string, userMessage?: string, additionalData?: QcErrorMetadata) => {
      const errorMessage = error.message.toLowerCase();

      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        handleNetworkError(error, action, additionalData);
      } else if (errorMessage.includes('auth') || errorMessage.includes('unauthorized')) {
        handleAuthError(error, action, additionalData);
      } else if (errorMessage.includes('pdf') || errorMessage.includes('generation')) {
        handlePdfError(error, action, additionalData?.palletNumber, additionalData);
      } else {
        handleApiError(error, action, userMessage, additionalData);
      }
    },
    [handleNetworkError, handleAuthError, handlePdfError, handleApiError]
  );

  // Batch error handler for bulk operations
  const handleBatchError = useCallback(
    (errors: Error[], action: string, additionalData?: QcErrorMetadata) => {
      const batchId = additionalData?.batchId || `batch-${Date.now()}`;
      
      errors.forEach((error, index) => {
        handleError(error, `${action}-item-${index}`, undefined, {
          ...additionalData,
          batchId,
          batchIndex: index,
          batchTotal: errors.length,
        });
      });

      // Summary message
      handleWarning(
        `${errors.length} errors occurred during batch operation`,
        action,
        true,
        { ...additionalData, batchId }
      );
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
          const result = await operation();

          if (successMessage) {
            handleSuccess(successMessage, action);
          }

          return result;
        } catch (error) {
          handleError(error as Error, action, errorMessage);
          return undefined;
        }
      };
    },
    [handleError, handleSuccess]
  );

  return {
    // Individual handlers
    handleApiError,
    handleNetworkError,
    handleAuthError,
    handlePdfError,
    handleSuccess,
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
