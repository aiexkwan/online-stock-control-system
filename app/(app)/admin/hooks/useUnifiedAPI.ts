/**
 * useUnifiedAPI Hook - 統一 REST API Hook (v1.7.0)
 *
 * 統一的 REST API 訪問接口
 * 支援緩存、重試和性能監控
 */

import { useState, useCallback, useEffect, useRef, useMemo, useContext } from 'react';
import { getAPIClient, APIRequest, APIResponse } from '@/lib/api/unified-api-client';
import { useAuth } from '@/app/hooks/useAuth';
import { createClient } from '@/app/utils/supabase/client';
import { DashboardDataContext } from '../contexts/DashboardDataContext';
import { useWidgetErrorHandler } from './useWidgetErrorHandler';
import { logger } from '@/lib/logger';
import type {
  APIVariables,
  APIResponseBase,
  UseUnifiedAPIOptions,
  UseUnifiedAPIResult,
} from '@/types/hooks/admin';

/**
 * 統一 REST API Hook
 * 提供統一的 REST API 訪問接口
 */
export function useUnifiedAPI<
  TData = APIResponseBase['data'],
  TVariables extends APIVariables = APIVariables,
>({
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
}: UseUnifiedAPIOptions<TData, TVariables>): UseUnifiedAPIResult<TData> {
  // State
  const [data, setData] = useState<TData | undefined>();
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<Error | undefined>();
  const [apiType, setApiType] = useState<'rest' | 'context'>('context');
  interface PerformanceMetrics {
    queryTime: number;
    dataSource: 'context' | 'rest' | 'cache';
    fallbackUsed: boolean;
  }

  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>();

  // Refs
  const startTimeRef = useRef<number>();
  const cacheRef = useRef<Map<string, { data: TData; timestamp: number }>>(new Map());

  // Hooks
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const dashboardData = useContext(DashboardDataContext);
  const { handleFetchError } = useWidgetErrorHandler(widgetId, 'system');

  // API Client
  const apiClient = useMemo(
    () =>
      getAPIClient({
        userId: user?.id,
        userEmail: user?.email,
      }),
    [user?.id, user?.email]
  );

  // Extract data from context if available
  const contextData = useMemo(() => {
    if (!extractFromContext || !dashboardData?.data || skip) {
      return null;
    }
    try {
      return extractFromContext(dashboardData.data as never);
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
      method: restMethod,
      variables,
      widgetId,
    });
  }, [restEndpoint, restMethod, variables, widgetId]);

  // Check cache
  const getCachedData = useCallback((): TData | null => {
    const cached = cacheRef.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < staleTime) {
      return cached.data;
    }
    return null;
  }, [cacheKey, staleTime]);

  // Set cache
  const setCachedData = useCallback(
    (data: TData) => {
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
    },
    [cacheKey, cacheTime]
  );

  // Record performance metrics
  const recordPerformance = useCallback(
    (dataSource: 'context' | 'rest' | 'cache', fallbackUsed: boolean) => {
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
    },
    [widgetId]
  );

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

      // Get current session for authentication
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Prepare REST API request
      const apiRequest: APIRequest = {
        method: restMethod,
        endpoint: restEndpoint,
        params: variables,
        headers: session?.access_token
          ? {
              Authorization: `Bearer ${session.access_token}`,
            }
          : {},
        metadata: {
          widgetId,
          userId: user?.id,
        },
      };

      setApiType('rest');

      logger.debug('Executing REST API request', {
        endpoint: restEndpoint,
        method: restMethod,
        widgetId,
      });

      // Execute request
      const response: APIResponse<TData> = await apiClient.request(apiRequest);

      if (response.success && response.data) {
        setData(response.data);
        setCachedData(response.data);
        recordPerformance(
          response.apiType === 'graphql' ? 'context' : (response.apiType as 'rest' | 'cache'),
          false
        );
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
    supabase.auth,
    user,
    restEndpoint,
    restMethod,
    variables,
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
    performanceMetrics,
  };
}

// 便利 hooks

/**
 * REST API Hook - 簡化版本
 */
export function useRestAPI<
  TData = APIResponseBase['data'],
  TVariables extends APIVariables = APIVariables,
>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
  options?: Omit<UseUnifiedAPIOptions<TData, TVariables>, 'restEndpoint' | 'restMethod'>
) {
  return useUnifiedAPI<TData, TVariables>({
    ...options,
    restEndpoint: endpoint,
    restMethod: method,
  });
}
