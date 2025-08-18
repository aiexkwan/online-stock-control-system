/**
 * Unified Data Layer
 * Abstraction layer supporting both REST and GraphQL with automatic fallback
 */

import { ApolloClient, DocumentNode, gql, NormalizedCacheObject, OperationVariables } from '@apollo/client';
import { apolloClient } from '@/lib/graphql/apollo-client';
import { restRequest } from '@/lib/api/unified-api-client';
import { dataSourceConfig } from '@/lib/data/data-source-config';
// WidgetCategory type removed - using Card architecture
type WidgetCategory = 'stats' | 'chart' | 'table' | 'analysis' | 'unknown';

// Type-safe alternatives to 'any'
type GraphQLVariables = Record<string, unknown>;
type RequestBody = Record<string, unknown> | FormData | string | null;
type DataTransformer<TInput = unknown, TOutput = unknown> = (data: TInput) => TOutput;
type DefaultApiResponse = Record<string, unknown>;

// Card parameter types based on existing GraphQL queries
interface WidgetParameters {
  warehouse?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  limit?: number;
  chartType?: string;
  timeRange?: string;
  widgetId?: string;
  widgetCategory?: string;
  [key: string]: unknown;
}

export enum DataSourceType {
  GRAPHQL = 'graphql',
  REST = 'rest',
  SERVER_ACTION = 'server_action',
  AUTO = 'auto',
}

export interface QueryOptions<TVariables = GraphQLVariables> {
  source?: DataSourceType;
  query?: DocumentNode | string;
  variables?: TVariables;
  endpoint?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  fallbackEnabled?: boolean;
  cachePolicy?: 'cache-first' | 'network-only' | 'no-cache';
  serverAction?: (variables?: TVariables) => Promise<unknown>;
}

export interface MutationOptions<TVariables = GraphQLVariables> {
  source?: DataSourceType;
  mutation?: DocumentNode | string;
  variables?: TVariables;
  endpoint?: string;
  method?: 'POST' | 'PUT' | 'DELETE';
  body?: RequestBody;
  fallbackEnabled?: boolean;
  serverAction?: (variables?: TVariables) => Promise<unknown>;
}

export interface DataLayerResponse<T> {
  data: T | null;
  error?: Error;
  source: DataSourceType;
  cached?: boolean;
  executionTime?: number;
}

export interface WidgetDataMapping {
  [widgetId: string]: {
    graphql?: {
      query: DocumentNode;
      transform?: DataTransformer;
    };
    rest?: {
      endpoint: string;
      method?: 'GET' | 'POST';
      transform?: DataTransformer;
    };
    serverAction?: {
      action: (params?: unknown) => Promise<unknown>;
      transform?: DataTransformer;
    };
    preferredSource?: DataSourceType;
  };
}

/**
 * Card mappings for dual-mode operation
 */
const WIDGET_MAPPINGS: WidgetDataMapping = {
  stock_levels: {
    graphql: {
      query: gql`
        query GetStockLevelsUnified($warehouse: String, $dateRange: DateRange) {
          stockLevels(warehouse: $warehouse, dateRange: $dateRange) {
            items {
              productCode
              productName
              quantity
              location
              lastUpdated
            }
            totalItems
            totalQuantity
          }
        }
      `,
    },
    rest: {
      endpoint: '/api/inventory/stock-levels',
    },
    preferredSource: DataSourceType.GRAPHQL,
  },
  transfer_activity: {
    graphql: {
      query: gql`
        query GetTransferActivityUnified($limit: Int, $dateRange: DateRange) {
          transferActivity(limit: $limit, dateRange: $dateRange) {
            transfers {
              id
              fromLocation
              toLocation
              quantity
              status
              timestamp
            }
            totalCount
          }
        }
      `,
    },
    rest: {
      endpoint: '/api/warehouse/transfers',
    },
    preferredSource: DataSourceType.GRAPHQL,
  },
  analytics_charts: {
    graphql: {
      query: gql`
        query GetAnalyticsData($chartType: String!, $dateRange: DateRange) {
          analyticsData(chartType: $chartType, dateRange: $dateRange) {
            labels
            datasets {
              label
              data
              backgroundColor
              borderColor
            }
          }
        }
      `,
    },
    rest: {
      endpoint: '/api/analytics/charts',
    },
    preferredSource: DataSourceType.GRAPHQL, // GraphQL 更適合複雜查詢
  },
  // Add more card mappings as we migrate
};

export class UnifiedDataLayer {
  private apolloClient: ApolloClient<NormalizedCacheObject>;
  private metricsEnabled: boolean = true;
  private fallbackEnabled: boolean = true;
  private performanceMetrics: {
    restTotal: number;
    restSuccess: number;
    restTotalTime: number;
    graphqlTotal: number;
    graphqlSuccess: number;
    graphqlTotalTime: number;
    serverActionTotal: number;
    serverActionSuccess: number;
    serverActionTotalTime: number;
  } = {
    restTotal: 0,
    restSuccess: 0,
    restTotalTime: 0,
    graphqlTotal: 0,
    graphqlSuccess: 0,
    graphqlTotalTime: 0,
    serverActionTotal: 0,
    serverActionSuccess: 0,
    serverActionTotalTime: 0,
  };

  constructor(client?: ApolloClient<NormalizedCacheObject>) {
    this.apolloClient = client || apolloClient;

    // 定期更新配置管理器的性能指標
    this.startMetricsReporting();
  }

  /**
   * Execute a query with automatic source selection and fallback
   */
  async query<T = DefaultApiResponse, TVariables extends OperationVariables = GraphQLVariables>(
    options: QueryOptions<TVariables>
  ): Promise<DataLayerResponse<T>> {
    const startTime = performance.now();

    // 使用配置管理器決定數據源
    let source = options.source || DataSourceType.AUTO;
    let fallbackEnabled = options.fallbackEnabled ?? this.fallbackEnabled;

    if (source === DataSourceType.AUTO) {
      const decision = await dataSourceConfig.determineDataSource({
        cardId: (options.variables as WidgetParameters)?.widgetId as string,
        cardCategory: (options.variables as WidgetParameters)?.widgetCategory as string,
        performanceMetrics: this.getPerformanceMetrics(),
      });

      source = decision.dataSource;
      fallbackEnabled = decision.fallbackEnabled;

      console.log('[UnifiedDataLayer] Auto-selected data source:', {
        source,
        reason: decision.reason,
        fallbackEnabled,
      });
    }

    try {
      // Determine data source
      if (source === DataSourceType.SERVER_ACTION) {
        try {
          const result = await this.executeServerAction<T, TVariables>(options);
          this.recordMetrics('serverAction', true, result.executionTime || 0);
          return {
            ...result,
            executionTime: performance.now() - startTime,
          };
        } catch (serverActionError) {
          this.recordMetrics('serverAction', false, performance.now() - startTime);
          console.error('[UnifiedDataLayer] Server Action failed:', serverActionError);
          
          // Fallback to GraphQL or REST if enabled
          if (fallbackEnabled) {
            if (options.query) {
              console.log('[UnifiedDataLayer] Falling back to GraphQL');
              const graphqlResult = await this.executeGraphQLQuery<T, TVariables>(options);
              this.recordMetrics('graphql', true, graphqlResult.executionTime || 0);
              return graphqlResult;
            } else if (options.endpoint) {
              console.log('[UnifiedDataLayer] Falling back to REST API');
              const restResult = await this.executeRESTQuery<T>(
                options as QueryOptions<GraphQLVariables>
              );
              this.recordMetrics('rest', true, restResult.executionTime || 0);
              return restResult;
            }
          }
          
          throw serverActionError;
        }
      } else if (source === DataSourceType.GRAPHQL) {
        try {
          const result = await this.executeGraphQLQuery<T, TVariables>(options);
          this.recordMetrics('graphql', true, result.executionTime || 0);
          return {
            ...result,
            executionTime: performance.now() - startTime,
          };
        } catch (graphqlError) {
          this.recordMetrics('graphql', false, performance.now() - startTime);
          console.error('[UnifiedDataLayer] GraphQL query failed:', graphqlError);

          // Fallback to REST if enabled
          if (fallbackEnabled && options.endpoint) {
            console.log('[UnifiedDataLayer] Falling back to REST API');
            const restResult = await this.executeRESTQuery<T>(
              options as QueryOptions<GraphQLVariables>
            );
            this.recordMetrics('rest', true, restResult.executionTime || 0);
            return restResult;
          }

          throw graphqlError;
        }
      }

      // Direct REST query
      const result = await this.executeRESTQuery<T>(options as QueryOptions<GraphQLVariables>);
      this.recordMetrics('rest', true, result.executionTime || 0);
      return result;
    } catch (error) {
      this.recordMetrics('rest', false, performance.now() - startTime);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error'),
        source: DataSourceType.REST,
        executionTime: performance.now() - startTime,
      };
    }
  }

  /**
   * Execute a mutation with automatic source selection and fallback
   */
  async mutation<T = DefaultApiResponse, TVariables extends OperationVariables = GraphQLVariables>(
    options: MutationOptions<TVariables>
  ): Promise<DataLayerResponse<T>> {
    const startTime = performance.now();
    const source = options.source || DataSourceType.AUTO;
    const fallbackEnabled = options.fallbackEnabled ?? this.fallbackEnabled;

    try {
      // Determine data source
      if (source === DataSourceType.SERVER_ACTION) {
        try {
          const result = await this.executeServerAction<T, TVariables>(options);
          this.recordMetrics('serverAction', true, result.executionTime || 0);
          return {
            ...result,
            executionTime: performance.now() - startTime,
          };
        } catch (serverActionError) {
          this.recordMetrics('serverAction', false, performance.now() - startTime);
          console.error('[UnifiedDataLayer] Server Action mutation failed:', serverActionError);
          
          // Fallback if enabled
          if (fallbackEnabled) {
            if (options.mutation) {
              console.log('[UnifiedDataLayer] Falling back to GraphQL');
              return this.executeGraphQLMutation<T, TVariables>(options);
            } else if (options.endpoint) {
              console.log('[UnifiedDataLayer] Falling back to REST API');
              return this.executeRESTMutation<T>(options as MutationOptions<GraphQLVariables>);
            }
          }
          
          throw serverActionError;
        }
      } else if (source === DataSourceType.GRAPHQL || source === DataSourceType.AUTO) {
        try {
          const result = await this.executeGraphQLMutation<T, TVariables>(options);
          return {
            ...result,
            executionTime: performance.now() - startTime,
          };
        } catch (graphqlError) {
          console.error('[UnifiedDataLayer] GraphQL mutation failed:', graphqlError);

          // Fallback to REST if enabled
          if (fallbackEnabled && (source === DataSourceType.AUTO || options.endpoint)) {
            console.log('[UnifiedDataLayer] Falling back to REST API');
            return this.executeRESTMutation<T>(options as MutationOptions<GraphQLVariables>);
          }

          throw graphqlError;
        }
      }

      // Direct REST mutation
      return this.executeRESTMutation<T>(options as MutationOptions<GraphQLVariables>);
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error'),
        source: DataSourceType.REST,
        executionTime: performance.now() - startTime,
      };
    }
  }

  /**
   * Get card data with intelligent source selection
   */
  async getWidgetData<T = DefaultApiResponse>(
    widgetId: string,
    params?: WidgetParameters
  ): Promise<DataLayerResponse<T>> {
    const mapping = WIDGET_MAPPINGS[widgetId];

    if (!mapping) {
      // No mapping found, fallback to REST
      return this.query<T>({
        source: DataSourceType.REST,
        endpoint: `/api/widgets/${widgetId}`,
        variables: params,
      });
    }

    const preferredSource = mapping.preferredSource || DataSourceType.AUTO;

    // Try preferred source first
    if (preferredSource === DataSourceType.GRAPHQL && mapping.graphql) {
      const result = await this.query<T>({
        source: DataSourceType.GRAPHQL,
        query: mapping.graphql.query,
        variables: params,
        fallbackEnabled: true,
        endpoint: mapping.rest?.endpoint,
      });

      // Apply transformation if needed
      if (result.data && mapping.graphql.transform) {
        result.data = mapping.graphql.transform(result.data) as T;
      }

      return result;
    } else if (mapping.rest) {
      const result = await this.query<T>({
        source: DataSourceType.REST,
        endpoint: mapping.rest.endpoint,
        method: mapping.rest.method || 'GET',
        variables: params,
      });

      // Apply transformation if needed
      if (result.data && mapping.rest.transform) {
        result.data = mapping.rest.transform(result.data) as T;
      }

      return result;
    }

    // Default fallback
    return this.query<T>({
      source: DataSourceType.REST,
      endpoint: `/api/widgets/${widgetId}`,
      variables: params,
    });
  }

  /**
   * Execute GraphQL query
   */
  private async executeGraphQLQuery<T, TVariables extends OperationVariables>(
    options: QueryOptions<TVariables>
  ): Promise<DataLayerResponse<T>> {
    if (!options.query) {
      throw new Error('GraphQL query is required');
    }

    const query = typeof options.query === 'string' ? gql(options.query) : options.query;

    const result = await this.apolloClient.query<T, TVariables>({
      query,
      variables: options.variables,
      fetchPolicy:
        (options.cachePolicy as 'cache-first' | 'network-only' | 'no-cache') || 'cache-first',
    });

    return {
      data: result.data,
      source: DataSourceType.GRAPHQL,
      cached: result.loading === false && !result.networkStatus,
    };
  }

  /**
   * Execute GraphQL mutation
   */
  private async executeGraphQLMutation<T, TVariables extends OperationVariables>(
    options: MutationOptions<TVariables>
  ): Promise<DataLayerResponse<T>> {
    if (!options.mutation) {
      throw new Error('GraphQL mutation is required');
    }

    const mutation =
      typeof options.mutation === 'string' ? gql(options.mutation) : options.mutation;

    const result = await this.apolloClient.mutate<T, TVariables>({
      mutation,
      variables: options.variables,
    });

    return {
      data: result.data || null,
      source: DataSourceType.GRAPHQL,
    };
  }

  /**
   * Execute REST query
   */
  private async executeRESTQuery<T>(options: QueryOptions): Promise<DataLayerResponse<T>> {
    if (!options.endpoint) {
      throw new Error('REST endpoint is required');
    }

    const response = await restRequest<T>(
      options.method || 'GET',
      options.endpoint,
      undefined,
      options.variables
    );

    if (!response.success) {
      throw new Error(response.error || 'REST request failed');
    }

    return {
      data: response.data || null,
      source: DataSourceType.REST,
      cached: false,
    };
  }

  /**
   * Execute REST mutation
   */
  private async executeRESTMutation<T>(options: MutationOptions): Promise<DataLayerResponse<T>> {
    if (!options.endpoint) {
      throw new Error('REST endpoint is required');
    }

    const response = await restRequest<T>(
      options.method || 'POST',
      options.endpoint,
      options.body || options.variables
    );

    if (!response.success) {
      throw new Error(response.error || 'REST request failed');
    }

    return {
      data: response.data || null,
      source: DataSourceType.REST,
    };
  }

  /**
   * Execute Server Action
   */
  private async executeServerAction<T, TVariables extends OperationVariables>(
    options: QueryOptions<TVariables> | MutationOptions<TVariables>
  ): Promise<DataLayerResponse<T>> {
    if (!options.serverAction) {
      throw new Error('Server Action is required');
    }

    const startTime = performance.now();
    
    try {
      const result = await options.serverAction(options.variables);
      
      return {
        data: result as T,
        source: DataSourceType.SERVER_ACTION,
        cached: false,
        executionTime: performance.now() - startTime,
      };
    } catch (error) {
      throw new Error(
        `Server Action failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Enable/disable metrics collection
   */
  setMetricsEnabled(enabled: boolean) {
    this.metricsEnabled = enabled;
  }

  /**
   * Enable/disable automatic fallback
   */
  setFallbackEnabled(enabled: boolean) {
    this.fallbackEnabled = enabled;
  }

  /**
   * 記錄性能指標
   */
  private recordMetrics(apiType: 'rest' | 'graphql' | 'serverAction', success: boolean, responseTime: number) {
    if (!this.metricsEnabled) return;

    if (apiType === 'rest') {
      this.performanceMetrics.restTotal++;
      this.performanceMetrics.restTotalTime += responseTime;
      if (success) this.performanceMetrics.restSuccess++;
    } else if (apiType === 'graphql') {
      this.performanceMetrics.graphqlTotal++;
      this.performanceMetrics.graphqlTotalTime += responseTime;
      if (success) this.performanceMetrics.graphqlSuccess++;
    } else if (apiType === 'serverAction') {
      this.performanceMetrics.serverActionTotal++;
      this.performanceMetrics.serverActionTotalTime += responseTime;
      if (success) this.performanceMetrics.serverActionSuccess++;
    }
  }

  /**
   * 獲取性能指標
   */
  private getPerformanceMetrics() {
    const {
      restTotal,
      restSuccess,
      restTotalTime,
      graphqlTotal,
      graphqlSuccess,
      graphqlTotalTime,
      serverActionTotal,
      serverActionSuccess,
      serverActionTotalTime,
    } = this.performanceMetrics;

    return {
      restSuccessRate: restTotal > 0 ? restSuccess / restTotal : 1,
      graphqlSuccessRate: graphqlTotal > 0 ? graphqlSuccess / graphqlTotal : 1,
      serverActionSuccessRate: serverActionTotal > 0 ? serverActionSuccess / serverActionTotal : 1,
      restAvgResponseTime: restTotal > 0 ? restTotalTime / restTotal : 0,
      graphqlAvgResponseTime: graphqlTotal > 0 ? graphqlTotalTime / graphqlTotal : 0,
      serverActionAvgResponseTime: serverActionTotal > 0 ? serverActionTotalTime / serverActionTotal : 0,
      lastUpdated: new Date(),
    };
  }

  /**
   * 開始定期報告指標
   */
  private startMetricsReporting() {
    setInterval(() => {
      if (this.metricsEnabled) {
        const metrics = this.getPerformanceMetrics();
        dataSourceConfig.updateMetrics(metrics);
      }
    }, 30000); // 每 30 秒更新一次指標
  }

  /**
   * 獲取配置狀態（用於監控面板）
   */
  getConfigStatus() {
    return {
      ...dataSourceConfig.getStatus(),
      performanceMetrics: this.getPerformanceMetrics(),
      metricsEnabled: this.metricsEnabled,
      fallbackEnabled: this.fallbackEnabled,
    };
  }

  /**
   * 手動切換數據源（用於測試）
   */
  async switchDataSource(targetSource: DataSourceType, duration?: number) {
    const originalDefault = dataSourceConfig.getStatus().defaultDataSource;

    dataSourceConfig.setDefaultDataSource(targetSource);
    console.log(`[UnifiedDataLayer] Manually switched to ${targetSource}`);

    if (duration) {
      setTimeout(() => {
        dataSourceConfig.setDefaultDataSource(originalDefault);
        console.log(`[UnifiedDataLayer] Reverted to ${originalDefault} after ${duration}ms`);
      }, duration);
    }
  }
}

// Export singleton instance
export const unifiedDataLayer = new UnifiedDataLayer();
