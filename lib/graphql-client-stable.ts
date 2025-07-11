/**
 * Stable GraphQL Client Configuration for Supabase
 * 解決畫面閃爍問題
 * 支援 TypeScript type safety via GraphQL Code Generator
 */

import React from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { TypedDocumentNode } from '@graphql-typed-document-node/core';

interface GraphQLRequest<TVariables = Record<string, any>> {
  query: string | TypedDocumentNode<any, TVariables>;
  variables?: TVariables;
  operationName?: string;
}

interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{
    message: string;
    extensions?: any;
    path?: Array<string | number>;
  }>;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// 全局緩存，組件卸載後仍保留數據
const globalCache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 5000; // 5秒緩存

/**
 * Stable GraphQL client for Supabase with persistent caching
 */
export class GraphQLClient {
  private url: string;
  private supabase: ReturnType<typeof createClient>;
  private requestInProgress = new Map<string, Promise<GraphQLResponse>>();

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined');
    }

    this.url = `${supabaseUrl}/graphql/v1`;
    this.supabase = createClient();
  }

  /**
   * Generate cache key from query and variables
   */
  private getCacheKey<TVariables>(
    query: string | TypedDocumentNode<any, TVariables>, 
    variables?: TVariables
  ): string {
    const queryStr = typeof query === 'string' ? query : query.loc?.source.body || '';
    return `${queryStr}:${JSON.stringify(variables || {})}`;
  }

  /**
   * Execute a GraphQL query with deduplication and caching
   */
  async query<TData = any, TVariables = Record<string, any>>(
    request: GraphQLRequest<TVariables>
  ): Promise<GraphQLResponse<TData>> {
    const cacheKey = this.getCacheKey(request.query, request.variables);

    // 檢查緩存
    const cached = globalCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return { data: cached.data };
    }

    // 檢查是否有相同請求正在進行
    const inProgress = this.requestInProgress.get(cacheKey);
    if (inProgress) {
      return inProgress as Promise<GraphQLResponse<TData>>;
    }

    // 執行新請求
    const requestPromise = this.executeQuery<TData, TVariables>(request);
    this.requestInProgress.set(cacheKey, requestPromise as Promise<GraphQLResponse>);

    try {
      const result = await requestPromise;

      // 如果成功，更新緩存
      if (result.data && !result.errors) {
        globalCache.set(cacheKey, {
          data: result.data,
          timestamp: Date.now(),
        });
      }

      return result;
    } finally {
      // 清理進行中嘅請求
      this.requestInProgress.delete(cacheKey);
    }
  }

  private async executeQuery<TData, TVariables>(
    request: GraphQLRequest<TVariables>
  ): Promise<GraphQLResponse<TData>> {
    try {
      // Get the current session for authentication
      const {
        data: { session },
      } = await this.supabase.auth.getSession();

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      };

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(this.url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: typeof request.query === 'string' ? request.query : request.query.loc?.source.body,
          variables: request.variables,
          operationName: request.operationName,
        }),
      });

      if (!response.ok) {
        throw new Error(`GraphQL request failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.errors) {
        // 開發環境先至輸出詳細錯誤
        if (process.env.NODE_ENV === 'development') {
          console.warn('[GraphQL] Query returned errors:', {
            errorCount: result.errors.length,
            firstError: result.errors[0]?.message || 'Unknown error',
            operationName: request.operationName
          });
          
          // 只喺需要 debug 時先輸出完整錯誤
          if (process.env.NEXT_PUBLIC_DEBUG_GRAPHQL === 'true') {
            console.debug('[GraphQL] Error Details:', {
              query: typeof request.query === 'string' ? request.query.substring(0, 200) + '...' : '[TypedDocumentNode]', // 只顯示前200字符
              variables: request.variables,
              errors: result.errors.map((e: any) => ({
                message: e.message,
                path: e.path
              }))
            });
          }
        }
      }

      return result;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[GraphQL] Request failed:', error instanceof Error ? error.message : 'Unknown error');
      }
      throw error;
    }
  }

  /**
   * Execute a GraphQL mutation
   */
  async mutate<TData = any, TVariables = Record<string, any>>(
    request: GraphQLRequest<TVariables>
  ): Promise<GraphQLResponse<TData>> {
    // Mutations 唔使用緩存
    return this.executeQuery<TData, TVariables>(request);
  }

  /**
   * Clear cache for specific query or all cache
   */
  clearCache<TVariables = Record<string, any>>(
    query?: string | TypedDocumentNode<any, TVariables>, 
    variables?: TVariables
  ) {
    if (query) {
      const cacheKey = this.getCacheKey(query, variables);
      globalCache.delete(cacheKey);
    } else {
      globalCache.clear();
    }
  }
}

// Export singleton instance
export const graphqlClient = new GraphQLClient();

/**
 * Helper function to create GraphQL queries
 */
export function gql(strings: TemplateStringsArray, ...values: any[]): string {
  let result = '';
  strings.forEach((string, i) => {
    result += string;
    if (i < values.length) {
      result += values[i];
    }
  });
  return result;
}

/**
 * Stable React Hook for GraphQL queries with TypeScript support
 * 解決閃爍問題：
 * 1. 使用全局緩存保留數據
 * 2. 初始狀態從緩存讀取
 * 3. 背景更新而非立即 loading
 * 
 * @example
 * // 使用 generated types
 * import { GetProductionStatsDocument } from '@/lib/graphql/generated/types';
 * const { data, loading } = useGraphQLQuery(GetProductionStatsDocument, { startDate, endDate });
 */
export function useGraphQLQuery<TData = any, TVariables = Record<string, any>>(
  query: string | TypedDocumentNode<TData, TVariables>,
  variables?: TVariables,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
    cacheTime?: number;
    suspense?: boolean;
  }
) {
  const cacheKey = React.useMemo(
    () => graphqlClient['getCacheKey'](query, variables),
    [query, variables]
  );

  // 從緩存獲取初始數據，避免閃爍
  const cachedData = React.useMemo(() => {
    const cached = globalCache.get(cacheKey);
    return cached?.data || null;
  }, [cacheKey]);

  const [data, setData] = React.useState<TData | null>(cachedData);
  const [loading, setLoading] = React.useState(!cachedData); // 有緩存就唔 loading
  const [error, setError] = React.useState<Error | null>(null);
  const [isRefetching, setIsRefetching] = React.useState(false);

  // 使用 useRef 避免重複執行
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const isMountedRef = React.useRef(true);

  // 穩定嘅 variables reference
  const stableVariables = React.useMemo(
    () => variables,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(variables)]
  );

  const fetchData = React.useCallback(
    async (isBackground = false) => {
      // 取消上一個請求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // 如果組件已卸載，唔執行
      if (!isMountedRef.current) return;

      abortControllerRef.current = new AbortController();

      try {
        if (isBackground) {
          setIsRefetching(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const result = await graphqlClient.query<TData, TVariables>({
          query,
          variables: stableVariables as TVariables,
        });

        // 只有組件仍然掛載時才更新狀態
        if (isMountedRef.current) {
          if (result.errors) {
            // 更詳細嘅錯誤信息
            const errorMessage = result.errors[0]?.message || 'GraphQL query failed';
            const error = new Error(errorMessage);
            // 附加所有錯誤信息到 error 對象
            (error as any).graphQLErrors = result.errors;
            setError(error);
          } else {
            setData(result.data || null);
          }
        }
      } catch (err) {
        if (isMountedRef.current && err instanceof Error && err.name !== 'AbortError') {
          setError(err);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          setIsRefetching(false);
        }
      }
    },
    [query, stableVariables]
  );

  React.useEffect(() => {
    isMountedRef.current = true;

    if (options?.enabled !== false) {
      // 如果有緩存數據，背景更新
      const hasCache = !!globalCache.get(cacheKey);
      fetchData(hasCache);
    }

    // 設置定期刷新
    let intervalId: NodeJS.Timeout | null = null;
    if (options?.refetchInterval) {
      intervalId = setInterval(() => fetchData(true), options.refetchInterval);
    }

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [fetchData, options?.enabled, options?.refetchInterval, cacheKey]);

  const refetch = React.useCallback(() => {
    return fetchData(false);
  }, [fetchData]);

  // Suspense 支援
  if (options?.suspense && loading && !data) {
    throw fetchData(false);
  }

  return { data, loading, error, refetch, isRefetching };
}

/**
 * Hook for GraphQL mutations with TypeScript support
 * 
 * @example
 * // 使用 generated types
 * import { UpdateInventoryDocument } from '@/lib/graphql/generated/types';
 * const { mutate } = useGraphQLMutation<UpdateInventoryMutation, UpdateInventoryMutationVariables>();
 * await mutate(UpdateInventoryDocument, { id, quantity });
 */
export function useGraphQLMutation<TData = any, TVariables = Record<string, any>>() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const mutate = React.useCallback(
    async (
      query: string | TypedDocumentNode<TData, TVariables>, 
      variables?: TVariables
    ): Promise<TData | null> => {
      try {
        setLoading(true);
        setError(null);

        const result = await graphqlClient.mutate<TData, TVariables>({
          query,
          variables,
        });

        if (result.errors) {
          throw new Error(result.errors[0].message);
        }

        return result.data || null;
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { mutate, loading, error };
}
