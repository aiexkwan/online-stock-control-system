/**
 * Stock History GraphQL Queries
 * Optimized queries for StockHistoryCard component with proper fragments and caching
 */

import { gql } from '@apollo/client';

// Fragments for reusability and consistency
export const STOCK_HISTORY_RECORD_FRAGMENT = gql`
  fragment StockHistoryRecordFragment on StockHistoryRecord {
    id
    timestamp
    palletNumber
    productCode
    action
    location
    fromLocation
    toLocation
    operatorName
    quantity
    remark
    actionType
    actionCategory
    
    # Relations (only fetch when needed)
    operator {
      id
      name
      email
    }
  }
`;

export const PRODUCT_BASIC_INFO_FRAGMENT = gql`
  fragment ProductBasicInfoFragment on ProductBasicInfo {
    code
    description
    chineseDescription
    type
    colour
    standardQty
    # Removed: totalPallets, activePallets (not needed for simplified version)
  }
`;

export const PAGE_INFO_FRAGMENT = gql`
  fragment PageInfoFragment on PageInfo {
    hasNextPage
    hasPreviousPage
    startCursor
    endCursor
    totalCount
    totalPages
    currentPage
  }
`;

export const PALLET_HISTORY_AGGREGATIONS_FRAGMENT = gql`
  fragment PalletHistoryAggregationsFragment on PalletHistoryAggregations {
    totalActions
    uniquePallets
    uniqueOperators
    timeRange {
      start
      end
    }
    mostActiveLocation
    mostActiveOperator
  }
`;

// Main Queries

/**
 * Enhanced Product-based Pallet History Query
 * Replaces the original STOCK_HISTORY_QUERY with full optimization
 */
export const PALLET_HISTORY_BY_PRODUCT = gql`
  ${STOCK_HISTORY_RECORD_FRAGMENT}
  ${PRODUCT_BASIC_INFO_FRAGMENT}
  ${PAGE_INFO_FRAGMENT}
  ${PALLET_HISTORY_AGGREGATIONS_FRAGMENT}
  
  query PalletHistoryByProduct(
    $productCode: String!
    $filter: StockHistoryFilter
    $pagination: StockHistoryPagination
    $sort: StockHistorySort
  ) {
    palletHistoryByProduct(
      productCode: $productCode
      filter: $filter
      pagination: $pagination
      sort: $sort
    ) {
      productCode
      productInfo {
        ...ProductBasicInfoFragment
      }
      records {
        ...StockHistoryRecordFragment
      }
      totalRecords
      pageInfo {
        ...PageInfoFragment
      }
      aggregations {
        ...PalletHistoryAggregationsFragment
      }
      timelineGroups {
        date
        count
      }
      locationDistribution {
        location
        count
        percentage
      }
      operatorDistribution {
        operatorName
        operatorId
        count
        percentage
        efficiency
      }
    }
  }
`;

/**
 * Single Pallet History Query
 * For pallet-specific lookup with enhanced journey tracking
 */
export const PALLET_HISTORY_BY_NUMBER = gql`
  ${STOCK_HISTORY_RECORD_FRAGMENT}
  ${PRODUCT_BASIC_INFO_FRAGMENT}
  ${PAGE_INFO_FRAGMENT}
  
  query PalletHistoryByNumber(
    $palletNumber: String!
    $includeJourney: Boolean = true
    $includeSeries: Boolean = true
  ) {
    palletHistoryByNumber(
      palletNumber: $palletNumber
      includeJourney: $includeJourney
      includeSeries: $includeSeries
    ) {
      palletNumber
      palletInfo {
        palletNumber
        # Removed: series (not needed for simplified version)
        productCode
        quantity
        # Removed: currentLocation, status, createdAt, createdBy (not needed for simplified version)
        product {
          ...ProductBasicInfoFragment
        }
      }
      records {
        ...StockHistoryRecordFragment
      }
      totalRecords
      pageInfo {
        ...PageInfoFragment
      }
      # Removed: timeline, currentStatus, journey (not needed for simplified version)
    }
  }
`;

// Removed: TRANSFER_TIME_FLOW_ENHANCED, SEARCH_STOCK_HISTORY, STOCK_HISTORY_STATS queries
// (not needed for simplified version)

// Removed: PAGINATED_STOCK_HISTORY, subscription queries, and mutation queries
// (not needed for simplified version - pagination handled by main queries, real-time updates and manual entries removed)

// Query Configurations and Options

/**
 * Default variables for common queries
 */
export const DEFAULT_QUERY_VARIABLES = {
  pagination: {
    first: 40,
    useCursor: true,
  },
  sort: {
    field: 'TIMESTAMP' as const,
    direction: 'DESC' as const,
  },
  filter: {
    includeVoided: false,
  },
};

/**
 * Cache configurations for Apollo Client (simplified)
 */
export const CACHE_CONFIGURATIONS = {
  // Product-based history - cache for 5 minutes
  palletHistoryByProduct: {
    fetchPolicy: 'cache-first' as const,
    errorPolicy: 'all' as const,
    notifyOnNetworkStatusChange: true,
  },
  
  // Single pallet history - cache for 10 minutes (more stable)
  palletHistoryByNumber: {
    fetchPolicy: 'cache-first' as const,
    errorPolicy: 'all' as const,
    nextFetchPolicy: 'cache-first' as const,
  },
};

/**
 * Type-safe query variables
 */
export interface PalletHistoryVariables {
  productCode: string;
  filter?: {
    actions?: string[];
    locations?: string[];
    operators?: string[];
    dateRange?: {
      start: string;
      end: string;
    };
    palletNumbers?: string[];
    hasRemark?: boolean;
    minQuantity?: number;
    maxQuantity?: number;
    includeVoided?: boolean;
  };
  pagination?: {
    first?: number;
    after?: string;
    last?: number;
    before?: string;
    offset?: number;
    limit?: number;
    useCursor?: boolean;
  };
  sort?: {
    field: 'TIMESTAMP' | 'PALLET_NUMBER' | 'PRODUCT_CODE' | 'ACTION' | 'LOCATION' | 'OPERATOR' | 'QUANTITY';
    direction: 'ASC' | 'DESC';
    secondary?: {
      field: 'TIMESTAMP' | 'PALLET_NUMBER' | 'PRODUCT_CODE' | 'ACTION' | 'LOCATION' | 'OPERATOR' | 'QUANTITY';
      direction: 'ASC' | 'DESC';
    };
  };
}

export interface SinglePalletHistoryVariables {
  palletNumber: string;
  includeJourney?: boolean;
  includeSeries?: boolean;
}

// Removed: TransferTimeFlowVariables, SearchStockHistoryVariables, StockHistoryStatsVariables
// (not needed for simplified version)