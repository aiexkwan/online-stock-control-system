/**
 * useUnifiedAPI Hook - 統一 API Hook (v1.2.3)
 * 
 * 根據 feature flags 自動選擇 GraphQL 或 REST API
 * 整合現有的 useGraphQLFallback 功能
 * 支援 A/B 測試和性能監控
 */

import { useState, useCallback, useEffect, useRef, useMemo, useContext } from 'react';
import { DocumentNode } from '@apollo/client';
import { getAPIClient, APIRequest, APIResponse } from '@/lib/api/unified-api-client';
import { getAPIRoutingInfo } from '@/lib/api/api-router';
import { useAuth } from '@/app/hooks/useAuth';
import { DashboardDataContext } from '../contexts/DashboardDataContext';
import { useWidgetErrorHandler } from './useWidgetErrorHandler';
import { logger } from '@/lib/logger';

export interface UseUnifiedAPIOptions<TData, TVariables> {
  // GraphQL 支援
  graphqlQuery?: DocumentNode;
  graphqlOperationName?: string;
  
  // REST API 支援
  restEndpoint?: string;
  restMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  
  // 通用選項
  variables?: TVariables;
  skip?: boolean;
  onCompleted?: (data: TData) => void;
  onError?: (error: Error) => void;
  extractFromContext?: (contextData: any) => TData | null;
  widgetId?: string;
  
  // 快取和重試
  cacheTime?: number;
  staleTime?: number;
  retryCount?: number;
  
  // A/B 測試
  forceAPIType?: 'graphql' | 'rest';
}

export interface UseUnifiedAPIResult<TData> {
  data: TData | undefined;
  loading: boolean;
  error: Error | undefined;
  refetch: () => Promise<void>;
  apiType: 'graphql' | 'rest' | 'context';
  routingInfo?: {
    useRestAPI: boolean;
    percentage: number;
    reason: string;
  };
  performanceMetrics?: {
    queryTime: number;
    dataSource: 'context' | 'graphql' | 'rest' | 'cache';
    fallbackUsed: boolean;
  };
}

/**
 * 統一 API Hook
 * 自動選擇最佳 API 類型
 */
export function useUnifiedAPI<TData = any, TVariables = any>({
  graphqlQuery,
  graphqlOperationName,
  restEndpoint,
  restMethod = 'GET',
  variables,
  skip = false,
  onCompleted,
  onError,
  extractFromContext,
  widgetId = 'unified-api',
  cacheTime = 5 * 60 * 1000,
  staleTime = 30 * 1000,
  retryCount = 3,
  forceAPIType,
}: UseUnifiedAPIOptions<TData, TVariables>): UseUnifiedAPIResult<TData> {
  
  // State
  const [data, setData] = useState<TData | undefined>();
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<Error | undefined>();
  const [apiType, setApiType] = useState<'graphql' | 'rest' | 'context'>('context');
  const [routingInfo, setRoutingInfo] = useState<any>();
  const [performanceMetrics, setPerformanceMetrics] = useState<any>();
  
  // Refs
  const startTimeRef = useRef<number>();
  const cacheRef = useRef<Map<string, { data: TData; timestamp: number }>>(new Map());
  
  // Hooks
  const { user } = useAuth();
  const dashboardData = useContext(DashboardDataContext);
  const { handleFetchError } = useWidgetErrorHandler(widgetId, 'system');
  
  // API Client
  const apiClient = useMemo(() => getAPIClient({
    userId: user?.id,
    userEmail: user?.email,
  }), [user?.id, user?.email]);

  // Extract data from context if available
  const contextData = useMemo(() => {
    if (!extractFromContext || !dashboardData?.data || skip) {
      return null;
    }
    try {
      return extractFromContext(dashboardData.data);
    } catch (error) {
      logger.warn('Error extracting data from context', {
        error: error instanceof Error ? error.message : 'Unknown error',
        widgetId,
      });
      return null;
    }
  }, [dashboardData?.data, extractFromContext, skip, widgetId]);

  // Generate cache key
  const cacheKey = useMemo(() => {
    return JSON.stringify({
      endpoint: restEndpoint,
      query: graphqlQuery?.loc?.source?.body,
      variables,
      widgetId,
    });
  }, [restEndpoint, graphqlQuery, variables, widgetId]);

  // Check cache
  const getCachedData = useCallback((): TData | null => {
    const cached = cacheRef.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < staleTime) {
      return cached.data;
    }
    return null;
  }, [cacheKey, staleTime]);

  // Set cache
  const setCachedData = useCallback((data: TData) => {
    cacheRef.current.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });
    
    // Clean old cache entries
    const cutoff = Date.now() - cacheTime;
    for (const [key, value] of cacheRef.current.entries()) {
      if (value.timestamp < cutoff) {
        cacheRef.current.delete(key);
      }
    }
  }, [cacheKey, cacheTime]);

  // Record performance metrics
  const recordPerformance = useCallback((dataSource: string, fallbackUsed: boolean) => {
    if (startTimeRef.current) {
      const queryTime = Date.now() - startTimeRef.current;
      setPerformanceMetrics({
        queryTime,
        dataSource,
        fallbackUsed,
      });
      
      logger.debug('API performance metrics recorded', {
        widgetId,
        queryTime,
        dataSource,
        fallbackUsed,
      });
    }
  }, [widgetId]);

  // Execute API request
  const executeRequest = useCallback(async (): Promise<void> => {
    if (skip) return;

    setLoading(true);
    setError(undefined);
    startTimeRef.current = Date.now();

    try {
      // Check context data first
      if (contextData) {
        setData(contextData);
        setApiType('context');
        setLoading(false);
        recordPerformance('context', false);
        onCompleted?.(contextData);
        return;
      }

      // Check cache
      const cachedData = getCachedData();
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        recordPerformance('cache', false);
        onCompleted?.(cachedData);
        return;
      }

      // Get routing information
      let routing;
      if (!forceAPIType) {
        routing = await getAPIRoutingInfo({
          userId: user?.id,
          userEmail: user?.email,
        });
        setRoutingInfo(routing);
      }

      // Prepare API request
      const apiRequest: APIRequest = {
        headers: {
          'Authorization': user?.access_token ? `Bearer ${user.access_token}` : undefined,
        },
        metadata: {
          widgetId,
          userId: user?.id,
        },
      };

      let useRest = forceAPIType === 'rest' || 
        (!forceAPIType && routing?.useRestAPI && restEndpoint);

      if (useRest && restEndpoint) {
        // Use REST API
        apiRequest.method = restMethod;
        apiRequest.endpoint = restEndpoint;
        apiRequest.params = variables;
        
        setApiType('rest');
      } else if (graphqlQuery) {
        // Use GraphQL
        apiRequest.query = graphqlQuery.loc?.source?.body;
        apiRequest.variables = variables;
        apiRequest.operationName = graphqlOperationName;
        
        setApiType('graphql');
      } else {
        throw new Error('No valid API configuration provided');
      }

      logger.debug('Executing API request', {
        apiType: useRest ? 'rest' : 'graphql',
        endpoint: restEndpoint,
        operationName: graphqlOperationName,
        widgetId,
      });

      // Execute request
      const response: APIResponse<TData> = await apiClient.request(apiRequest);

      if (response.success && response.data) {
        setData(response.data);
        setCachedData(response.data);
        recordPerformance(response.apiType, false);
        onCompleted?.(response.data);
      } else {
        throw new Error(response.error || 'API request failed');
      }

    } catch (error) {
      const errorInstance = error instanceof Error ? error : new Error('Unknown error');
      
      logger.error('API request failed', {
        error: errorInstance.message,
        widgetId,
        apiType,
      });

      setError(errorInstance);
      handleFetchError(errorInstance, 'api-request');
      recordPerformance(apiType, true);
      onError?.(errorInstance);
    } finally {
      setLoading(false);
    }
  }, [
    skip,
    contextData,
    getCachedData,
    forceAPIType,
    user,
    restEndpoint,
    restMethod,
    variables,
    graphqlQuery,
    graphqlOperationName,
    widgetId,
    apiClient,
    setCachedData,
    recordPerformance,
    onCompleted,
    handleFetchError,
    onError,
    apiType,
  ]);

  // Refetch function
  const refetch = useCallback(async (): Promise<void> => {
    // Clear cache for this key
    cacheRef.current.delete(cacheKey);
    return executeRequest();
  }, [cacheKey, executeRequest]);

  // Execute request on mount and dependencies change
  useEffect(() => {
    executeRequest();
  }, [executeRequest]);

  return {
    data,
    loading,
    error,
    refetch,
    apiType,
    routingInfo,
    performanceMetrics,
  };
}

// 便利 hooks

/**
 * REST API Hook
 */
export function useRestAPI<TData = any, TVariables = any>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
  options?: Omit<UseUnifiedAPIOptions<TData, TVariables>, 'restEndpoint' | 'restMethod'>
) {
  return useUnifiedAPI({
    ...options,
    restEndpoint: endpoint,
    restMethod: method,
    forceAPIType: 'rest',
  });
}

/**
 * GraphQL Hook
 */
export function useGraphQLAPI<TData = any, TVariables = any>(
  query: DocumentNode,
  operationName?: string,
  options?: Omit<UseUnifiedAPIOptions<TData, TVariables>, 'graphqlQuery' | 'graphqlOperationName'>
) {
  return useUnifiedAPI({
    ...options,
    graphqlQuery: query,
    graphqlOperationName: operationName,
    forceAPIType: 'graphql',
  });
}