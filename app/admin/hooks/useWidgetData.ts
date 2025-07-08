/**
 * Hook for widget data management with manual refresh
 * Provides consistent data loading pattern for all widgets
 */

import { useEffect, useCallback } from 'react';
import { useAdminRefresh } from '../contexts/AdminRefreshContext';

interface UseWidgetDataOptions {
  loadFunction: () => Promise<void>;
  dependencies?: any[];
  isEditMode?: boolean;
}

export function useWidgetData({
  loadFunction,
  dependencies = [],
  isEditMode = false,
}: UseWidgetDataOptions) {
  const { refreshTrigger } = useAdminRefresh();

  // Memoize the load function to prevent unnecessary re-renders
  const memoizedLoadFunction = useCallback(() => {
    if (!isEditMode) {
      loadFunction();
    }
  }, [isEditMode, loadFunction]);

  // Single useEffect to handle all data loading scenarios
  useEffect(() => {
    memoizedLoadFunction();
    // We only want to re-run when refreshTrigger changes or dependencies change
    // loadFunction changes are handled by the memoizedLoadFunction
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger, isEditMode, ...dependencies]);

  return {
    reload: loadFunction,
  };
}
