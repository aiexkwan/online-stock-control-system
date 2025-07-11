import { useQuery, DocumentNode, ApolloError, WatchQueryFetchPolicy, gql } from '@apollo/client';
import useSWR, { SWRConfiguration } from 'swr';
import { useState, useCallback, useContext, useMemo, useRef, useEffect } from 'react';
import { DashboardDataContext } from '../contexts/DashboardDataContext';
import { useWidgetErrorHandler } from './useWidgetErrorHandler';
import { performanceMonitor } from '@/lib/widgets/performance-monitor';

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
  mode: 'context' | 'graphql' | 'server-action' | 'fallback';
  performanceMetrics?: {
    queryTime: number;
    dataSource: 'context' | 'graphql' | 'server-action' | 'cache';
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
      
      // Record to performance monitor
      performanceMonitor.recordMetric({
        widgetId,
        metricType: 'dataFetch',
        value: queryTime,
        timestamp: Date.now(),
        metadata: {
          dataSource,
          fallbackUsed,
          variables: JSON.stringify(variables),
        },
      });
    }
  }, [widgetId, variables]);

  // GraphQL Query - only use when we have a valid query
  const {
    data: graphqlData,
    loading: graphqlLoading,
    error: graphqlError,
    refetch: graphqlRefetch,
  } = useQuery(graphqlQuery || gql`query EmptyQuery { __typename }`, {
    variables,
    skip: skip || !graphqlQuery || contextData !== null || mode !== 'graphql',
    pollInterval,
    fetchPolicy,
    onCompleted: (data) => {
      recordPerformance('graphql', false);
      onCompleted?.(data);
    },
    onError: (error) => {
      console.error('GraphQL error:', error);
      handleFetchError(error, 'graphql-query');
      
      // Fallback to server action if enabled
      if (fallbackEnabled && serverAction) {
        setMode('server-action');
      } else {
        onError?.(error);
      }
    },
  });

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

  // Effect to manage mode transitions
  useEffect(() => {
    if (!skip) {
      startTimeRef.current = Date.now();
      
      if (contextData !== null) {
        setMode('context');
        recordPerformance('context', false);
      } else if (graphqlQuery && !graphqlError) {
        setMode('graphql');
      } else if (serverAction && (graphqlError || !graphqlQuery)) {
        setMode('server-action');
      }
    }
  }, [skip, contextData, graphqlQuery, graphqlError, serverAction, recordPerformance]);

  // Unified refetch function
  const refetch = useCallback(async () => {
    startTimeRef.current = Date.now();
    
    try {
      if (mode === 'context' && dashboardData?.refetch) {
        await dashboardData.refetch();
      } else if (mode === 'graphql' && graphqlRefetch) {
        await graphqlRefetch();
      } else if (mode === 'server-action' && serverMutate) {
        await serverMutate();
      }
    } catch (error) {
      console.error('Refetch error:', error);
      handleFetchError(error as Error, 'refetch');
    }
  }, [mode, dashboardData, graphqlRefetch, serverMutate, handleFetchError]);

  // Return unified result
  const data = contextData ?? graphqlData ?? serverData;
  const loading = mode === 'graphql' ? graphqlLoading : mode === 'server-action' ? serverLoading : false;
  const error = mode === 'graphql' ? graphqlError : mode === 'server-action' ? serverError : undefined;

  return {
    data,
    loading,
    error,
    refetch,
    mode,
    performanceMetrics,
  };
}

// Preset configurations for common use cases
export const GraphQLFallbackPresets = {
  // For critical widgets that need real-time data
  realtime: {
    fetchPolicy: 'network-only' as WatchQueryFetchPolicy,
    pollInterval: 5000,
    fallbackEnabled: true,
    cacheTime: 60 * 1000, // 1 minute
    staleTime: 10 * 1000, // 10 seconds
  },
  
  // For widgets that can use cached data
  cached: {
    fetchPolicy: 'cache-first' as WatchQueryFetchPolicy,
    pollInterval: undefined,
    fallbackEnabled: true,
    cacheTime: 30 * 60 * 1000, // 30 minutes
    staleTime: 5 * 60 * 1000, // 5 minutes
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