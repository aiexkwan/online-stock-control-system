/**
 * Custom hook for inventory ordered analysis
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { inventoryAnalysisAPI } from '@/lib/api/inventory/InventoryAnalysisAPI';
import type {
  InventoryOrderedAnalysisResponse,
  InventoryAnalysisParams,
  InventoryAnalysisFilters,
  InventoryAnalysisSortBy,
  ProductSufficiencyStatus
} from '@/lib/types/inventory-analysis.types';
import { INVENTORY_ANALYSIS_CONSTANTS } from '@/lib/types/inventory-analysis.types';

interface UseInventoryAnalysisOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  initialFilters?: InventoryAnalysisFilters;
  initialSortBy?: InventoryAnalysisSortBy;
  initialSortAscending?: boolean;
}

export function useInventoryAnalysis(
  params?: InventoryAnalysisParams,
  options?: UseInventoryAnalysisOptions
) {
  const [data, setData] = useState<InventoryOrderedAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<InventoryAnalysisFilters>(
    options?.initialFilters || {}
  );
  const [sortBy, setSortBy] = useState<InventoryAnalysisSortBy>(
    options?.initialSortBy || 'fulfillment_rate'
  );
  const [sortAscending, setSortAscending] = useState(
    options?.initialSortAscending ?? true
  );

  // Fetch data function
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await inventoryAnalysisAPI.getInventoryOrderedAnalysis(params);
      setData(response);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching inventory analysis:', err);
    } finally {
      setLoading(false);
    }
  }, [params]);

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchData();

    if (options?.autoRefresh) {
      const interval = setInterval(
        fetchData,
        options.refreshInterval || INVENTORY_ANALYSIS_CONSTANTS.REFRESH_INTERVAL
      );
      return () => clearInterval(interval);
    }
  }, [fetchData, options?.autoRefresh, options?.refreshInterval]);

  // Apply filters and sorting to products
  const processedProducts = useMemo(() => {
    if (!data?.products) return [];

    let processed = inventoryAnalysisAPI.applyFilters(data.products, filters);
    processed = inventoryAnalysisAPI.sortProducts(processed, sortBy, sortAscending);

    return processed;
  }, [data?.products, filters, sortBy, sortAscending]);

  // Calculate critical metrics
  const criticalMetrics = useMemo(() => {
    if (!data?.products) return null;
    return inventoryAnalysisAPI.calculateCriticalMetrics(data.products);
  }, [data?.products]);

  // Get unique product types
  const productTypes = useMemo(() => {
    if (!data?.products) return [];
    return inventoryAnalysisAPI.getUniqueProductTypes(data.products);
  }, [data?.products]);

  // Helper function to get product status
  const getProductStatus = useCallback((fulfillmentRate: number): ProductSufficiencyStatus => {
    if (fulfillmentRate === 0) return 'critical';
    if (fulfillmentRate < INVENTORY_ANALYSIS_CONSTANTS.CRITICAL_FULFILLMENT_RATE) return 'critical';
    if (fulfillmentRate < INVENTORY_ANALYSIS_CONSTANTS.WARNING_FULFILLMENT_RATE) return 'insufficient';
    return 'sufficient';
  }, []);

  // Export to CSV
  const exportToCSV = useCallback(() => {
    if (!processedProducts.length) return;

    const csv = inventoryAnalysisAPI.exportToCSV(processedProducts);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-analysis-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [processedProducts]);

  // Toggle sort direction
  const toggleSortDirection = useCallback(() => {
    setSortAscending(prev => !prev);
  }, []);

  // Update sort field
  const updateSortBy = useCallback((newSortBy: InventoryAnalysisSortBy) => {
    if (sortBy === newSortBy) {
      toggleSortDirection();
    } else {
      setSortBy(newSortBy);
      setSortAscending(true);
    }
  }, [sortBy, toggleSortDirection]);

  return {
    // Data
    data,
    products: processedProducts,
    summary: data?.summary || null,
    metadata: data?.metadata || null,
    criticalMetrics,
    productTypes,

    // State
    loading,
    error,
    filters,
    sortBy,
    sortAscending,

    // Actions
    refresh: fetchData,
    setFilters,
    updateSortBy,
    toggleSortDirection,
    exportToCSV,
    getProductStatus,

    // Utilities
    api: inventoryAnalysisAPI
  };
}