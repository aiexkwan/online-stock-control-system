/**
 * Enhanced Stock Transfer Hook with comprehensive error handling
 * Builds upon the base useStockTransfer with added resilience features
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getTransferHistory } from '@/app/actions/stockTransferActions';
import type { TransferHistoryItem } from '@/app/actions/stockTransferActions';
import { RequestManager } from '../utils/requestManager';
import { useStockTransfer, UseStockTransferProps } from './useStockTransfer';

export interface TransferHistoryState {
  data: TransferHistoryItem[];
  isLoading: boolean;
  error: Error | null;
  lastFetchTime: number | null;
  retryCount: number;
}

export interface UseStockTransferEnhancedReturn {
  // All original hook returns
  state: ReturnType<typeof useStockTransfer>['state'];
  actions: ReturnType<typeof useStockTransfer>['actions'];

  // Enhanced transfer history management
  transferHistory: TransferHistoryItem[];
  isHistoryLoading: boolean;
  historyError: Error | null;
  retryHistoryLoad: () => Promise<void>;
  clearHistoryError: () => void;

  // Request management
  cancelAllRequests: () => void;
}

export const useStockTransferEnhanced = (
  props?: UseStockTransferProps
): UseStockTransferEnhancedReturn => {
  // Use the base hook
  const baseHook = useStockTransfer(props);

  // Request manager instance
  const requestManagerRef = useRef(new RequestManager());

  // Enhanced transfer history state
  const [transferHistory, setTransferHistory] = useState<TransferHistoryState>({
    data: [],
    isLoading: false,
    error: null,
    lastFetchTime: null,
    retryCount: 0,
  });

  // Track if component is mounted
  const mountedRef = useRef(true);

  /**
   * Load transfer history with enhanced error handling
   */
  const loadTransferHistory = useCallback(
    async (options?: { forceRefresh?: boolean; silent?: boolean }) => {
      // Skip if already loading and not forcing refresh
      if (transferHistory.isLoading && !options?.forceRefresh) {
        return;
      }

      // Skip setting loading state for silent refreshes
      if (!options?.silent) {
        setTransferHistory(prev => ({
          ...prev,
          isLoading: true,
          error: null,
        }));
      }

      try {
        // Execute request with automatic abort handling
        const history = await requestManagerRef.current.executeRequest(
          'transfer-history',
          async signal => {
            return await getTransferHistory(20, undefined, {
              signal,
              includeMetadata: true,
            });
          },
          {
            useCache: !options?.forceRefresh,
            timeout: 10000,
            retryCount: 2,
            retryDelay: 1000,
          }
        );

        // Only update state if component is still mounted
        if (!mountedRef.current) return;

        setTransferHistory({
          data: history || [],
          isLoading: false,
          error: null,
          lastFetchTime: Date.now(),
          retryCount: 0,
        });
      } catch (error) {
        // Only handle errors if component is still mounted
        if (!mountedRef.current) return;

        const errorObj = error instanceof Error ? error : new Error('Failed to load history');

        // Don't update state for abort errors
        if (errorObj.message === 'Request was cancelled') {
          setTransferHistory(prev => ({
            ...prev,
            isLoading: false,
          }));
          return;
        }

        setTransferHistory(prev => ({
          ...prev,
          isLoading: false,
          error: errorObj,
          retryCount: prev.retryCount + 1,
        }));

        // Auto-retry with exponential backoff (max 3 attempts)
        if (transferHistory.retryCount < 3 && !options?.forceRefresh) {
          const retryDelay = Math.min(1000 * Math.pow(2, transferHistory.retryCount), 5000);
          setTimeout(() => {
            if (mountedRef.current) {
              loadTransferHistory({ silent: true });
            }
          }, retryDelay);
        }
      }
    },
    [transferHistory.isLoading, transferHistory.retryCount]
  );

  /**
   * Retry loading history manually
   */
  const retryHistoryLoad = useCallback(async () => {
    setTransferHistory(prev => ({
      ...prev,
      retryCount: 0,
      error: null,
    }));
    await loadTransferHistory({ forceRefresh: true });
  }, [loadTransferHistory]);

  /**
   * Clear history error
   */
  const clearHistoryError = useCallback(() => {
    setTransferHistory(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  /**
   * Cancel all active requests
   */
  const cancelAllRequests = useCallback(() => {
    requestManagerRef.current.cancelAllRequests();
  }, []);

  // Load history on mount
  useEffect(() => {
    loadTransferHistory();

    // Capture the current request manager reference
    const currentRequestManager = requestManagerRef.current;

    // Cleanup on unmount
    return () => {
      mountedRef.current = false;
      currentRequestManager.cancelAllRequests();
    };
  }, [loadTransferHistory]); // Only run on mount

  // Periodic refresh every minute (only when document is visible)
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (!document.hidden && !transferHistory.isLoading) {
        loadTransferHistory({ silent: true });
      }
    }, 60000);

    // Visibility change handler
    const handleVisibilityChange = () => {
      if (!document.hidden && transferHistory.lastFetchTime) {
        // Refresh if page becomes visible and last fetch was more than 1 minute ago
        const timeSinceLastFetch = Date.now() - transferHistory.lastFetchTime;
        if (timeSinceLastFetch > 60000) {
          loadTransferHistory({ silent: true });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadTransferHistory, transferHistory.isLoading, transferHistory.lastFetchTime]);

  // Refresh history when a transfer completes
  useEffect(() => {
    // Check if a transfer just completed by monitoring the base hook state
    if (
      baseHook.state.statusMessage?.type === 'success' &&
      baseHook.state.statusMessage.message.includes('successfully moved')
    ) {
      // Refresh history after a short delay to ensure database is updated
      setTimeout(() => {
        if (mountedRef.current) {
          loadTransferHistory({ forceRefresh: true, silent: true });
        }
      }, 500);
    }
  }, [baseHook.state.statusMessage, loadTransferHistory]);

  // Periodic cache cleanup
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      requestManagerRef.current.cleanupExpiredCache();
    }, 300000); // Every 5 minutes

    return () => clearInterval(cleanupInterval);
  }, []);

  return {
    // Base hook state and actions
    state: baseHook.state,
    actions: baseHook.actions,

    // Enhanced transfer history
    transferHistory: transferHistory.data,
    isHistoryLoading: transferHistory.isLoading,
    historyError: transferHistory.error,
    retryHistoryLoad,
    clearHistoryError,

    // Request management
    cancelAllRequests,
  };
};

export default useStockTransferEnhanced;
