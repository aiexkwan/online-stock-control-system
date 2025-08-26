/**
 * Apollo Client Cache Configuration for Stock History
 * Optimized caching strategies with field policies and type policies
 */

import {
  InMemoryCache,
  TypePolicies,
  FieldPolicy,
  gql,
  ApolloClient,
  Reference,
} from '@apollo/client';
import { relayStylePagination } from '@apollo/client/utilities';

// Type definitions for cache data structures
interface CacheObject {
  __typename?: string;
  __ref?: string;
  id?: string;
  code?: string;
  palletNumber?: string;
  productCode?: string;
  [key: string]: unknown;
}

interface CacheReference {
  __typename?: string;
  __ref: string;
  id?: string;
  code?: string;
  palletNumber?: string;
  productCode?: string;
  [key: string]: unknown;
}

interface StockHistoryRecord {
  id: string;
  timestamp: string;
  palletNumber: string;
  productCode?: string;
  action: string;
  operatorName?: string;
  fromLocation?: string;
  toLocation?: string;
  quantity?: number;
  __typename?: string;
}

// Custom field policies for optimized caching
const stockHistoryCacheConfig = {
  typePolicies: {
    Query: {
      fields: {
        // Product-based pallet history with intelligent caching
        palletHistoryByProduct: {
          keyArgs: ['productCode', 'filter', 'sort'],
          merge(existing, incoming, { args, toReference, readField }) {
            // Handle pagination merge
            if (!existing) return incoming;

            const existingRecords = existing.records || [];
            const incomingRecords = incoming.records || [];

            // For cursor-based pagination, append new records
            if (args?.pagination?.after) {
              return {
                ...incoming,
                records: [...existingRecords, ...incomingRecords],
              };
            }

            // For fresh queries, replace existing
            return incoming;
          },
          read(existing, { args, toReference, readField }) {
            if (!existing) return existing;

            // Apply client-side filtering if needed
            const filter = args?.filter;
            if (!filter) return existing;

            let records = existing.records || [];

            // Client-side date filtering for performance
            if (filter.dateRange?.start) {
              const startDate = new Date(filter.dateRange.start);
              records = records.filter((record: unknown) => {
                const ref = record as Reference | CacheObject;
                if ('__ref' in ref && typeof ref.__ref === 'string') {
                  const timestamp = readField('timestamp', ref as Reference) || '';
                  return new Date(timestamp as string) >= startDate;
                }
                // Handle non-reference objects
                if (ref && typeof ref === 'object') {
                  const timestamp = readField('timestamp', ref as Reference) || '';
                  return new Date(timestamp as string) >= startDate;
                }
                return true;
              });
            }

            if (filter.dateRange?.end) {
              const endDate = new Date(filter.dateRange.end);
              records = records.filter((record: unknown) => {
                const ref = record as Reference | CacheObject;
                if ('__ref' in ref && typeof ref.__ref === 'string') {
                  const timestamp = readField('timestamp', ref as Reference) || '';
                  return new Date(timestamp as string) <= endDate;
                }
                // Handle non-reference objects
                if (ref && typeof ref === 'object') {
                  const timestamp = readField('timestamp', ref as Reference) || '';
                  return new Date(timestamp as string) <= endDate;
                }
                return true;
              });
            }

            return {
              ...existing,
              records,
              totalRecords: records.length,
            };
          },
        },

        // Single pallet history with stable caching
        palletHistoryByNumber: {
          keyArgs: ['palletNumber'],
          merge: false, // Always replace - pallet history is more stable
        },

        // Transfer time flow with time-based caching
        transferTimeFlow: {
          keyArgs: ['filter.dateRange'],
          merge(existing, incoming, { args }) {
            // For transfer flow, always prefer fresh data due to real-time nature
            return incoming;
          },
        },

        // Search results - no caching (always fresh)
        searchStockHistory: {
          keyArgs: false, // No caching for search results
          merge: false,
        },

        // Stats with time-window caching
        stockHistoryStats: {
          keyArgs: ['filter', 'timeframe'],
          merge: false,
        },
      },
    },

    StockHistoryRecord: {
      keyFields: ['id'],
      fields: {
        // Computed fields that can be derived client-side
        actionType: {
          read(existing, { readField }) {
            if (existing) return existing;

            const action = readField('action') as string;
            if (!action) return null;

            const movementActions = ['TRANSFERRED', 'MOVED'];
            const statusActions = ['VOIDED', 'ALLOCATED', 'QUALITY_CHECK'];
            const quantityActions = ['ADJUSTED', 'LOADED', 'UNLOADED'];
            const systemActions = ['CREATED'];

            if (movementActions.includes(action)) return 'MOVEMENT';
            if (statusActions.includes(action)) return 'STATUS_CHANGE';
            if (quantityActions.includes(action)) return 'QUANTITY_CHANGE';
            if (systemActions.includes(action)) return 'SYSTEM_ACTION';
            return 'SYSTEM_ACTION';
          },
        },

        actionCategory: {
          read(existing, { readField }) {
            if (existing) return existing;

            const fromLocation = readField('fromLocation') as string | undefined;
            const toLocation = readField('toLocation') as string | undefined;

            if (toLocation && !fromLocation) return 'INBOUND';
            if (fromLocation && !toLocation) return 'OUTBOUND';
            if (fromLocation && toLocation) return 'INTERNAL';
            return 'ADMINISTRATIVE';
          },
        },
      },
    },

    PalletHistoryResult: {
      keyFields: ['productCode'],
      fields: {
        records: relayStylePagination(['filter', 'sort']),

        // Aggregations can be computed client-side from records
        aggregations: {
          read(existing, { readField }) {
            if (existing) return existing;

            const records = (readField('records') as unknown[]) || [];

            return {
              totalActions: records.length,
              uniquePallets: new Set(
                records
                  .map(r => {
                    const ref = r as Reference | CacheObject;
                    if ('__ref' in ref && typeof ref.__ref === 'string') {
                      return readField('palletNumber', ref as Reference) as string;
                    }
                    // Handle non-reference objects
                    if (ref && typeof ref === 'object') {
                      return readField('palletNumber', ref as Reference) as string;
                    }
                    return '';
                  })
                  .filter(Boolean)
              ).size,
              uniqueOperators: new Set(
                records
                  .map(r => {
                    const ref = r as Reference | CacheObject;
                    if ('__ref' in ref && typeof ref.__ref === 'string') {
                      return readField('operatorName', ref as Reference) as string;
                    }
                    // Handle non-reference objects
                    if (ref && typeof ref === 'object') {
                      return readField('operatorName', ref as Reference) as string;
                    }
                    return '';
                  })
                  .filter(Boolean)
              ).size,
              // Other aggregations would be computed here
            };
          },
        },
      },
    },

    SinglePalletHistoryResult: {
      keyFields: ['palletNumber'],
    },

    TransferTimeFlowResult: {
      keyFields: ['filter', 'dateRange'],
      fields: {
        transfers: {
          merge: false, // Always replace for real-time data
        },
      },
    },

    // Product info caching
    ProductBasicInfo: {
      keyFields: ['code'],
    },

    // User info caching
    User: {
      keyFields: ['id'],
    },
  } as TypePolicies,
};

// Custom cache instance with optimized settings
export const createStockHistoryCache = () => {
  return new InMemoryCache({
    ...stockHistoryCacheConfig,

    // Global cache settings
    resultCaching: true,

    // Custom data ID generation
    dataIdFromObject(object: Readonly<import('@apollo/client').StoreObject>) {
      // Handle different object types
      const typedObject = object as CacheObject;
      if (typedObject.__typename === 'StockHistoryRecord' && typedObject.id) {
        return `StockHistoryRecord:${typedObject.id}`;
      }

      if (typedObject.__typename === 'PalletHistoryResult' && typedObject.productCode) {
        return `PalletHistoryResult:${typedObject.productCode}`;
      }

      if (typedObject.__typename === 'SinglePalletHistoryResult' && typedObject.palletNumber) {
        return `SinglePalletHistoryResult:${typedObject.palletNumber}`;
      }

      if (typedObject.__typename === 'ProductBasicInfo' && typedObject.code) {
        return `ProductBasicInfo:${typedObject.code}`;
      }

      // Default behavior
      return defaultDataIdFromObject(typedObject);
    },

    // Memory management
    possibleTypes: {
      // Add possible types if using unions/interfaces
    },
  });
};

// Cache helper functions

/**
 * Update cache after stock movement
 */
export const updateStockHistoryCache = (cache: InMemoryCache, newRecord: StockHistoryRecord) => {
  // Update product-based history cache
  if (newRecord.productCode) {
    cache.updateQuery(
      {
        query: PALLET_HISTORY_BY_PRODUCT,
        variables: { productCode: newRecord.productCode },
      },
      data => {
        if (!data?.palletHistoryByProduct) return data;

        return {
          palletHistoryByProduct: {
            ...data.palletHistoryByProduct,
            records: [newRecord, ...data.palletHistoryByProduct.records],
            totalRecords: data.palletHistoryByProduct.totalRecords + 1,
          },
        };
      }
    );
  }

  // Update pallet-specific history cache
  if (newRecord.palletNumber) {
    cache.updateQuery(
      {
        query: PALLET_HISTORY_BY_NUMBER,
        variables: { palletNumber: newRecord.palletNumber },
      },
      data => {
        if (!data?.palletHistoryByNumber) return data;

        return {
          palletHistoryByNumber: {
            ...data.palletHistoryByNumber,
            records: [newRecord, ...data.palletHistoryByNumber.records],
            totalRecords: data.palletHistoryByNumber.totalRecords + 1,
          },
        };
      }
    );
  }
};

/**
 * Invalidate cache for specific product or pallet
 */
export const invalidateStockHistoryCache = (
  cache: InMemoryCache,
  identifiers: {
    productCode?: string;
    palletNumber?: string;
  }
) => {
  if (identifiers.productCode) {
    cache.evict({
      id: cache.identify({
        __typename: 'PalletHistoryResult',
        productCode: identifiers.productCode,
      }),
    });
  }

  if (identifiers.palletNumber) {
    cache.evict({
      id: cache.identify({
        __typename: 'SinglePalletHistoryResult',
        palletNumber: identifiers.palletNumber,
      }),
    });
  }

  cache.gc(); // Garbage collect orphaned objects
};

/**
 * Preload cache with initial data
 */
export const preloadStockHistoryCache = (
  cache: InMemoryCache,
  initialData: {
    recentProducts?: string[];
    recentPallets?: string[];
  }
) => {
  // This would be called during app initialization to preload frequently accessed data
  // Implementation depends on your specific needs
};

/**
 * Cache warming strategies
 */
export const cacheWarmingStrategies = {
  // Warm cache with recent product codes
  async warmRecentProducts(client: ApolloClient<unknown>, productCodes: string[]) {
    const promises = productCodes.map(productCode =>
      client.query({
        query: PALLET_HISTORY_BY_PRODUCT,
        variables: {
          productCode,
          pagination: { first: 20 },
          sort: { field: 'TIMESTAMP', direction: 'DESC' },
        },
        fetchPolicy: 'cache-first',
      })
    );

    await Promise.allSettled(promises);
  },

  // Prefetch related data
  async prefetchRelatedData(client: ApolloClient<unknown>, productCode: string) {
    // Prefetch product info
    await client.query({
      query: PRODUCT_BASIC_INFO_QUERY,
      variables: { productCode },
      fetchPolicy: 'cache-first',
    });

    // Prefetch recent stats
    await client.query({
      query: STOCK_HISTORY_STATS,
      variables: {
        filter: { productCodes: [productCode] },
        timeframe: 'LAST_24_HOURS',
      },
      fetchPolicy: 'cache-first',
    });
  },
};

/**
 * Cache monitoring and metrics
 */
export class CacheMonitor {
  private cache: InMemoryCache;
  private metrics: {
    hits: number;
    misses: number;
    evictions: number;
    size: number;
  };

  constructor(cache: InMemoryCache) {
    this.cache = cache;
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
    };
  }

  recordHit() {
    this.metrics.hits++;
  }

  recordMiss() {
    this.metrics.misses++;
  }

  recordEviction() {
    this.metrics.evictions++;
  }

  getMetrics() {
    return {
      ...this.metrics,
      hitRate: this.metrics.hits / (this.metrics.hits + this.metrics.misses) || 0,
      size: this.getCacheSize(),
    };
  }

  private getCacheSize() {
    // Estimate cache size
    const data = this.cache.extract();
    return Object.keys(data).length;
  }

  logMetrics() {
    const metrics = this.getMetrics();
    console.log('Stock History Cache Metrics:', metrics);
  }

  // Auto-cleanup strategy
  scheduleCleanup() {
    setInterval(
      () => {
        this.cache.gc();
        this.recordEviction();
      },
      5 * 60 * 1000
    ); // Every 5 minutes
  }
}

// Default data ID generation fallback
const defaultDataIdFromObject = (object: CacheObject): string | undefined => {
  if (object.__typename && object.id) {
    return `${object.__typename}:${object.id}`;
  }
  return undefined;
};

// Import necessary queries from the queries file
import {
  PALLET_HISTORY_BY_PRODUCT,
  PALLET_HISTORY_BY_NUMBER,
} from '../queries/stock-history.graphql';

// Define missing STOCK_HISTORY_STATS query
const STOCK_HISTORY_STATS = gql`
  query StockHistoryStats($filter: StockHistoryFilter, $timeframe: String!) {
    stockHistoryStats(filter: $filter, timeframe: $timeframe) {
      totalRecords
      uniquePallets
      uniqueProducts
      activeLocations
      recentActivity
    }
  }
`;

// Placeholder for product info query
const PRODUCT_BASIC_INFO_QUERY = gql`
  query ProductBasicInfo($productCode: String!) {
    product(code: $productCode) {
      code
      description
      chineseDescription
      type
      colour
      standardQty
    }
  }
`;

export { stockHistoryCacheConfig };
export default createStockHistoryCache;
