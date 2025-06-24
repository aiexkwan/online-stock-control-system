/**
 * GraphQL Client Configuration for Supabase
 * 使用原生 fetch API 實現，避免依賴問題
 */

import React from 'react';
import { createClient } from '@/app/utils/supabase/client';

interface GraphQLRequest {
  query: string;
  variables?: Record<string, any>;
}

interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{
    message: string;
    extensions?: any;
  }>;
}

/**
 * Simple GraphQL client for Supabase
 */
export class GraphQLClient {
  private url: string;
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined');
    }
    
    this.url = `${supabaseUrl}/graphql/v1`;
    this.supabase = createClient();
  }

  /**
   * Execute a GraphQL query
   */
  async query<T = any>(request: GraphQLRequest): Promise<GraphQLResponse<T>> {
    try {
      // Get the current session for authentication
      const { data: { session } } = await this.supabase.auth.getSession();
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      };

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(this.url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: request.query,
          variables: request.variables,
        }),
      });

      if (!response.ok) {
        throw new Error(`GraphQL request failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.errors) {
        console.error('[GraphQL] Errors:', result.errors);
        // 顯示更詳細的錯誤信息
        result.errors.forEach((error: any) => {
          console.error('[GraphQL] Error detail:', {
            message: error.message,
            extensions: error.extensions,
            path: error.path
          });
        });
      }
      
      return result;
    } catch (error) {
      console.error('[GraphQL] Request error:', error);
      throw error;
    }
  }

  /**
   * Execute a GraphQL mutation
   */
  async mutate<T = any>(request: GraphQLRequest): Promise<GraphQLResponse<T>> {
    return this.query<T>(request);
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
 * React Hook for GraphQL queries
 */
export function useGraphQLQuery<T = any>(
  query: string,
  variables?: Record<string, any>
) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await graphqlClient.query<T>({ query, variables });
      
      if (result.errors) {
        setError(new Error(result.errors[0].message));
      } else {
        setData(result.data || null);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [query, JSON.stringify(variables)]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);

  const refetch = React.useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return { data, loading, error, refetch };
}