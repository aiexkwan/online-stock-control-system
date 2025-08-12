/**
 * Enhanced Stock History Hook with Full GraphQL Integration
 * Replaces useActivityLog with optimized GraphQL queries and real-time subscriptions
 */

'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  useLazyQuery, 
  useApolloClient 
} from '@apollo/client';
import { 
  PALLET_HISTORY_BY_PRODUCT,
  PALLET_HISTORY_BY_NUMBER,
  CACHE_CONFIGURATIONS,
  DEFAULT_QUERY_VARIABLES,
} from '@/lib/graphql/queries/stock-history.graphql';
import type { 
  PalletHistoryVariables,
  SinglePalletHistoryVariables,
} from '@/lib/graphql/queries/stock-history.graphql';
// Removed cache management imports (simplified)
import { formatDate as formatDateUtil } from '../utils/formatters';

// Enhanced interfaces with GraphQL types
export interface StockHistoryRecord {
  id: string;
  timestamp: string;
  palletNumber: string;
  productCode: string;
  action: string;
  location?: string;
  fromLocation?: string;
  toLocation?: string;
  operatorName: string;
  operatorId?: string;
  quantity?: number;
  remark?: string;
  actionType: string;
  actionCategory: string;
  metadata?: Record<string, unknown>;
}

export interface ProductInfo {
  code: string;
  description: string;
  chineseDescription?: string;
  type?: string;
  colour?: string;
  standardQty?: number;
  totalPallets: number;
  activePallets: number;
}

export interface PalletHistoryResult {
  productCode: string;
  productInfo: ProductInfo;
  records: StockHistoryRecord[];
  totalRecords: number;
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string;
    endCursor?: string;
    totalCount: number;
    totalPages: number;
    currentPage: number;
  };
  aggregations: {
    totalActions: number;
    uniquePallets: number;
    uniqueOperators: number;
    actionsByType: Array<{ action: string; count: number; percentage: number }>;
    timeRange: { start: string; end: string };
    mostActiveLocation: string;
    mostActiveOperator: string;
  };
  timelineGroups: Array<{
    date: string;
    count: number;
    actions: Array<{ action: string; count: number; percentage: number }>;
  }>;
  locationDistribution: Array<{ location: string; count: number; percentage: number }>;
  operatorDistribution: Array<{ 
    operatorName: string; 
    operatorId: string; 
    count: number; 
    percentage: number; 
    efficiency?: number;
  }>;
}

export interface SinglePalletHistoryResult {
  palletNumber: string;
  palletInfo: {
    palletNumber: string;
    series?: string;
    productCode: string;
    quantity: number;
    currentLocation?: string;
    status: string;
    createdAt: string;
    createdBy: string;
    product: ProductInfo;
  };
  records: StockHistoryRecord[];
  totalRecords: number;
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string;
    endCursor?: string;
    totalCount: number;
    totalPages: number;
    currentPage: number;
  };
  timeline: {
    created: string;
    firstMovement?: string;
    lastMovement: string;
    totalMovements: number;
    totalDaysActive: number;
    averageLocationStay: number;
  };
  currentStatus: {
    location?: string;
    lastAction: string;
    lastActionAt: string;
    lastOperator: string;
    isActive: boolean;
    daysInCurrentLocation: number;
  };
  journey?: Array<{
    sequence: number;
    location: string;
    entryTime: string;
    exitTime?: string;
    duration?: number;
    actions: string[];
    operator?: string;
  }>;
}

// Removed: TransferTimeFlowResult interface (not needed for simplified version)

// Hook configuration options (simplified)
export interface UseStockHistoryGraphQLOptions {
  onError?: (error: Error) => void;
}

// Main hook return interface (simplified)
export interface UseStockHistoryGraphQLReturn {
  // Product-based history
  productHistory: {
    data: PalletHistoryResult | null;
    loading: boolean;
    error: Error | null;
    refetch: () => void;
    fetchMore: () => void;
    hasNextPage: boolean;
  };

  // Single pallet history
  palletHistory: {
    data: SinglePalletHistoryResult | null;
    loading: boolean;
    error: Error | null;
    refetch: () => void;
  };

  // Actions (simplified)
  actions: {
    searchByProductCode: (productCode: string, options?: Partial<PalletHistoryVariables>) => void;
    searchByPalletNumber: (palletNumber: string, options?: Partial<SinglePalletHistoryVariables>) => void;
  };

  // Utility functions (simplified)
  utils: {
    formatDate: (date: string) => string;
    getStatusColor: (action: string) => string;
    getActionIcon: (action: string) => string;
  };
}

export const useStockHistoryGraphQL = (
  options: UseStockHistoryGraphQLOptions = {}
): UseStockHistoryGraphQLReturn => {
  const client = useApolloClient();
  const { onError } = options;

  // State management (simplified)
  const [currentProductCode, setCurrentProductCode] = useState<string>('');
  const [currentPalletNumber, setCurrentPalletNumber] = useState<string>('');

  // Lazy queries for on-demand loading (simplified)
  const [getProductHistory, productHistoryQuery] = useLazyQuery(
    PALLET_HISTORY_BY_PRODUCT,
    {
      ...CACHE_CONFIGURATIONS.palletHistoryByProduct,
      onError: (error) => {
        console.error('Product history query error:', error);
        onError?.(error);
      },
    }
  );

  const [getPalletHistory, palletHistoryQuery] = useLazyQuery(
    PALLET_HISTORY_BY_NUMBER,
    {
      ...CACHE_CONFIGURATIONS.palletHistoryByNumber,
      onError: (error) => {
        console.error('Pallet history query error:', error);
        onError?.(error);
      },
    }
  );

  // Removed: Transfer flow, search, stats queries, subscriptions, and mutations
  // This simplification focuses only on core pallet history functionality

  // Action handlers (simplified)
  const searchByProductCode = useCallback((
    productCode: string, 
    options: Partial<PalletHistoryVariables> = {}
  ) => {
    if (!productCode.trim()) return;
    
    setCurrentProductCode(productCode);
    
    const variables: PalletHistoryVariables = {
      productCode,
      ...DEFAULT_QUERY_VARIABLES,
      ...options,
    };
    
    getProductHistory({ variables });
  }, [getProductHistory]);

  const searchByPalletNumber = useCallback((
    palletNumber: string,
    options: Partial<SinglePalletHistoryVariables> = {}
  ) => {
    if (!palletNumber.trim()) return;
    
    setCurrentPalletNumber(palletNumber);
    
    const variables: SinglePalletHistoryVariables = {
      palletNumber,
      includeJourney: false, // Simplified: no journey needed
      includeSeries: true,
      ...options,
    };
    
    getPalletHistory({ variables });
  }, [getPalletHistory]);

  // Fetch more for pagination
  const fetchMore = useCallback(() => {
    const { data, fetchMore } = productHistoryQuery;
    
    if (!data?.palletHistoryByProduct?.pageInfo?.hasNextPage || !fetchMore) {
      return;
    }
    
    fetchMore({
      variables: {
        pagination: {
          first: 20,
          after: data.palletHistoryByProduct.pageInfo.endCursor,
          useCursor: true,
        },
      },
    });
  }, [productHistoryQuery]);

  // Utility functions
  const formatDate = useCallback((date: string) => {
    return formatDateUtil(date);
  }, []);

  const getStatusColor = useCallback((action: string) => {
    const colorMap: Record<string, string> = {
      CREATED: 'green',
      TRANSFERRED: 'blue',
      MOVED: 'blue',
      VOIDED: 'red',
      ALLOCATED: 'orange',
      LOADED: 'purple',
      UNLOADED: 'purple',
      QUALITY_CHECK: 'yellow',
      DAMAGED: 'red',
      ADJUSTED: 'orange',
    };
    
    return colorMap[action] || 'gray';
  }, []);

  const getActionIcon = useCallback((action: string) => {
    const iconMap: Record<string, string> = {
      CREATED: '➕',
      TRANSFERRED: '🔄',
      MOVED: '↔️',
      VOIDED: '❌',
      ALLOCATED: '📦',
      LOADED: '⬆️',
      UNLOADED: '⬇️',
      QUALITY_CHECK: '🔍',
      DAMAGED: '⚠️',
      ADJUSTED: '⚙️',
    };
    
    return iconMap[action] || '📋';
  }, []);

  // Removed: Export, real-time toggle, and prefetching functionality

  // Memoized return object (simplified)
  return useMemo(() => ({
    productHistory: {
      data: productHistoryQuery.data?.palletHistoryByProduct || null,
      loading: productHistoryQuery.loading,
      error: productHistoryQuery.error || null,
      refetch: () => productHistoryQuery.refetch?.(),
      fetchMore,
      hasNextPage: productHistoryQuery.data?.palletHistoryByProduct?.pageInfo?.hasNextPage || false,
    },

    palletHistory: {
      data: palletHistoryQuery.data?.palletHistoryByNumber || null,
      loading: palletHistoryQuery.loading,
      error: palletHistoryQuery.error || null,
      refetch: () => palletHistoryQuery.refetch?.(),
    },

    actions: {
      searchByProductCode,
      searchByPalletNumber,
    },

    utils: {
      formatDate,
      getStatusColor,
      getActionIcon,
    },
  }), [
    productHistoryQuery,
    palletHistoryQuery,
    searchByProductCode,
    searchByPalletNumber,
    fetchMore,
    formatDate,
    getStatusColor,
    getActionIcon,
  ]);
};

export default useStockHistoryGraphQL;