import { useQuery, DocumentNode, ApolloError, WatchQueryFetchPolicy, gql } from '@apollo/client';
import useSWR, { SWRConfiguration } from 'swr';
import { useState, useCallback, useContext, useMemo, useRef, useEffect } from 'react';
import { DashboardDataContext } from '../contexts/DashboardDataContext';
import { useWidgetErrorHandler } from './useWidgetErrorHandler';
import { simplePerformanceMonitor, recordMetric } from '@/lib/performance/SimplePerformanceMonitor';

// Types
export interface UseGraphQLFallbackOptions<TData, TVariables> {
  graphqlQuery?: DocumentNode;
  serverAction?: (variables?: TVariables) => Promise<TData>;
  variables?: TVariables;
  skip?: boolean;
  pollInterval?: number;
  fetchPolicy?: WatchQueryFetchPolicy;
  onCompleted?: (data: TData) => void;
  onError?: (error: Error) => void;
  extractFromContext?: (contextData: any) => TData | null;
  fallbackEnabled?: boolean;
  cacheTime?: number;
  staleTime?: number;
  retryCount?: number;
  widgetId?: string;
}

export interface UseGraphQLFallbackResult<TData> {
  data: TData | undefined;
  loading: boolean;
  error: Error | ApolloError | undefined;
  refetch: () => Promise<void>;
  mode: 'context' | 'server-action' | 'fallback';
  performanceMetrics?: {
    queryTime: number;
    dataSource: 'context' | 'server-action' | 'cache';
    fallbackUsed: boolean;
  };
}

// Default SWR config for fallback
const defaultSWRConfig: SWRConfiguration = {
  revalidateOnFocus: false, // Avoid conflicts with Apollo
  revalidateOnReconnect: true,
  dedupingInterval: 2000,
  errorRetryCount: 3,
  shouldRetryOnError: (error) => {
    // Only retry network errors
    if (error?.networkError?.statusCode) {
      return error.networkError.statusCode >= 500;
    }
    return true;
  },
};

/**
 * A unified hook that handles GraphQL queries with Server Action fallback
 * Integrates with DashboardDataContext for optimized data fetching
 */
export function useGraphQLFallback<TData = any, TVariables = any>({
  graphqlQuery,
  serverAction,
  variables,
  skip = false,
  pollInterval,
  fetchPolicy = 'cache-first',
  onCompleted,
  onError,
  extractFromContext,
  fallbackEnabled = true,
  cacheTime = 5 * 60 * 1000, // 5 minutes
  staleTime = 30 * 1000, // 30 seconds
  retryCount = 3,
  widgetId = 'graphql-fallback',
}: UseGraphQLFallbackOptions<TData, TVariables>): UseGraphQLFallbackResult<TData> {
  // State
  const [mode, setMode] = useState<UseGraphQLFallbackResult<TData>['mode']>('context');
  const [performanceMetrics, setPerformanceMetrics] = useState<UseGraphQLFallbackResult<TData>['performanceMetrics']>();
  const startTimeRef = useRef<number>();
  
  // Hooks
  const dashboardData = useContext(DashboardDataContext);
  const { handleFetchError } = useWidgetErrorHandler(widgetId, 'system');

  // Extract data from context if available
  const contextData = useMemo(() => {
    if (!extractFromContext || !dashboardData?.data || skip) {
      return null;
    }
    try {
      return extractFromContext(dashboardData.data);
    } catch (error) {
      console.error('Error extracting data from context:', error);
      return null;
    }
  }, [dashboardData?.data, extractFromContext, skip]);

  // Track performance
  const recordPerformance = useCallback((dataSource: string, fallbackUsed: boolean) => {
    if (startTimeRef.current) {
      const queryTime = Date.now() - startTimeRef.current;
      const metrics = {
        queryTime,
        dataSource: dataSource as any,
        fallbackUsed,
      };
      
      setPerformanceMetrics(metrics);
      
      // Record to performance monitor (使用簡化系統)
      simplePerformanceMonitor.recordMetric(`${widgetId}_query_time`, queryTime, 'performance');
      simplePerformanceMonitor.recordMetric(`${widgetId}_data_source`, dataSource === 'context' ? 1 : 0, 'performance');
      simplePerformanceMonitor.recordMetric(`${widgetId}_fallback_used`, fallbackUsed ? 1 : 0, 'performance');
    }
  }, [widgetId]); // Removed variables dependency to prevent infinite loops

  // Check if Apollo Client is available - 優化檢查邏輯，避免重複檢查
  const [isApolloAvailable, setIsApolloAvailable] = useState(false);
  const apolloCheckRef = useRef(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && !apolloCheckRef.current) {
      apolloCheckRef.current = true;
      
      let mounted = true;
      try {
        // Try to get Apollo client from the import
        import('@/lib/apollo-client').then(({ apolloClient }) => {
          if (mounted) {
            setIsApolloAvailable(Boolean(apolloClient));
          }
        }).catch(() => {
          if (mounted) {
            setIsApolloAvailable(false);
          }
        });
      } catch (error) {
        if (mounted) {
          setIsApolloAvailable(false);
        }
      }
      
      return () => {
        mounted = false;
      };
    }
  }, []);
  
  // GraphQL Query - only use when we have a valid query and Apollo Client is available
  const {
    data: graphqlData,
    loading: graphqlLoading,
    error: graphqlError,
    refetch: graphqlRefetch,
  } = useQuery(
    graphqlQuery || gql`query EmptyQuery { __typename }`, 
    {
      variables,
      skip: true, // GraphQL disabled - always skip
      pollInterval,
      fetchPolicy,
      errorPolicy: 'all', // Handle errors gracefully
      onCompleted: (data) => {
        recordPerformance('context', false);
        onCompleted?.(data);
      },
      onError: (error) => {
        console.warn('GraphQL error (will fallback):', error.message);
        handleFetchError(error, 'graphql-query');
        
        // Fallback to server action if enabled
        if (fallbackEnabled && serverAction) {
          setMode(currentMode => currentMode !== 'server-action' ? 'server-action' : currentMode);
        } else {
          onError?.(error);
        }
      },
    }
  );

  // Server Action fallback (using SWR)
  const {
    data: serverData,
    error: serverError,
    isLoading: serverLoading,
    mutate: serverMutate,
  } = useSWR(
    mode === 'server-action' && !skip && serverAction ? ['server-action', widgetId, variables] : null,
    async () => {
      startTimeRef.current = Date.now();
      try {
        const result = await serverAction!(variables);
        recordPerformance('server-action', true);
        onCompleted?.(result);
        return result;
      } catch (error) {
        handleFetchError(error as Error, 'server-action');
        throw error;
      }
    },
    {
      ...defaultSWRConfig,
      refreshInterval: pollInterval,
      errorRetryCount: retryCount,
      onError: (error) => {
        console.error('Server action error:', error);
        onError?.(error);
      },
    }
  );

  // Effect to manage mode transitions - 修復無限循環問題
  useEffect(() => {
    if (!skip) {
      startTimeRef.current = Date.now();
      
      if (contextData !== null) {
        setMode(currentMode => {
          if (currentMode !== 'context') {
            recordPerformance('context', false);
            return 'context';
          }
          return currentMode;
        });
      } else if (serverAction) {
        setMode(currentMode => currentMode !== 'server-action' ? 'server-action' : currentMode);
      }
    }
  }, [skip, contextData, graphqlQuery, isApolloAvailable, graphqlError, serverAction]); // 移除 recordPerformance 依賴

  // Unified refetch function
  const refetch = useCallback(async () => {
    startTimeRef.current = Date.now();
    
    try {
      if (mode === 'context' && dashboardData?.refetch) {
        await dashboardData.refetch();
      } else if (mode === 'server-action' && serverMutate) {
        await serverMutate();
      }
    } catch (error) {
      console.error('Refetch error:', error);
      handleFetchError(error as Error, 'refetch');
    }
  }, [mode, dashboardData, graphqlRefetch, serverMutate, handleFetchError]);

  // Return unified result
  const data = contextData ?? serverData;
  const loading = mode === 'server-action' ? serverLoading : false;
  const error = mode === 'server-action' ? serverError : undefined;

  return {
    data,
    loading,
    error,
    refetch,
    mode,
    performanceMetrics,
  };
}

// Preset configurations for common use cases - OPTIMIZED FOR MINIMAL API CALLS
export const GraphQLFallbackPresets = {
  // For critical widgets that need real-time data - DISABLED POLLING
  realtime: {
    fetchPolicy: 'cache-first' as WatchQueryFetchPolicy, // Changed from network-only
    pollInterval: undefined, // DISABLED: was 5000
    fallbackEnabled: true,
    cacheTime: 30 * 60 * 1000, // 30 minutes - increased
    staleTime: 10 * 60 * 1000, // 10 minutes - increased
  },
  
  // For widgets that can use cached data
  cached: {
    fetchPolicy: 'cache-first' as WatchQueryFetchPolicy,
    pollInterval: undefined,
    fallbackEnabled: true,
    cacheTime: 60 * 60 * 1000, // 60 minutes - increased
    staleTime: 30 * 60 * 1000, // 30 minutes - increased
  },
  
  // For write operations
  mutation: {
    fetchPolicy: 'no-cache' as WatchQueryFetchPolicy,
    pollInterval: undefined,
    fallbackEnabled: true,
    cacheTime: 0,
    staleTime: 0,
  },
} as const;