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
  isEditMode = false 
}: UseWidgetDataOptions) {
  const { refreshTrigger } = useAdminRefresh();

  // Load data on mount and when refresh is triggered
  useEffect(() => {
    if (!isEditMode) {
      loadFunction();
    }
  }, [refreshTrigger, isEditMode]);

  // Load data when dependencies change (skip if it's the initial mount)
  useEffect(() => {
    if (!isEditMode && refreshTrigger > 0) {
      loadFunction();
    }
  }, [...dependencies, isEditMode]);

  return {
    reload: loadFunction
  };
}