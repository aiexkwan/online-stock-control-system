/**
 * Unified API Client - 統一 API 客戶端 (v1.2.3)
 *
 * 統一 REST API 調用接口，支援 fallback 機制和性能監控
 * Note: 保留 GraphQL 接口以供向後兼容
 */

// Type-safe logger interface to avoid dependency issues
interface Logger {
  debug(message: string): void;
  debug(obj: Record<string, unknown>, message: string): void;
  info(message: string): void;
  info(obj: Record<string, unknown>, message: string): void;
  warn(message: string): void;
  warn(obj: Record<string, unknown>, message: string): void;
  error(message: string): void;
  error(obj: Record<string, unknown>, message: string): void;
}

// Create a simple logger implementation
const createSimpleLogger = (): Logger => ({
  debug: (msgOrObj: string | Record<string, unknown>, msg?: string) => {
    if (typeof msgOrObj === 'string') {
      console.debug(`[DEBUG] ${msgOrObj}`);
    } else {
      console.debug(`[DEBUG] ${msg}`, msgOrObj);
    }
  },
  info: (msgOrObj: string | Record<string, unknown>, msg?: string) => {
    if (typeof msgOrObj === 'string') {
      console.info(`[INFO] ${msgOrObj}`);
    } else {
      console.info(`[INFO] ${msg}`, msgOrObj);
    }
  },
  warn: (msgOrObj: string | Record<string, unknown>, msg?: string) => {
    if (typeof msgOrObj === 'string') {
      console.warn(`[WARN] ${msgOrObj}`);
    } else {
      console.warn(`[WARN] ${msg}`, msgOrObj);
    }
  },
  error: (msgOrObj: string | Record<string, unknown>, msg?: string) => {
    if (typeof msgOrObj === 'string') {
      console.error(`[ERROR] ${msgOrObj}`);
    } else {
      console.error(`[ERROR] ${msg}`, msgOrObj);
    }
  },
});

const logger = createSimpleLogger();

// Using local simplified implementations to avoid problematic dependencies

// Simplified router implementation to avoid dependency issues
interface SimpleRouterResult {
  useRestAPI: boolean;
  fallbackEnabled: boolean;
  percentage: number;
  reason: string;
}

class SimpleAPIRouter {
  private config: { userId?: string; userEmail?: string } = {};

  constructor(config: { userId?: string; userEmail?: string } = {}) {
    this.config = config;
  }

  async route(): Promise<SimpleRouterResult> {
    // For type safety, always default to GraphQL since REST is deprecated
    return {
      useRestAPI: false,
      fallbackEnabled: true,
      percentage: 0,
      reason: 'REST API deprecated, using GraphQL',
    };
  }
}

// Simplified monitor implementation to avoid dependency issues
class SimpleAPIMonitor {
  recordSuccess(
    apiType: 'graphql' | 'rest',
    endpoint: string,
    responseTime: number,
    userId?: string,
    metadata?: Record<string, unknown>
  ): void {
    logger.debug(
      {
        apiType,
        endpoint,
        responseTime,
        userId,
        metadata,
      },
      'API success recorded'
    );
  }

  recordError(
    apiType: 'graphql' | 'rest',
    endpoint: string,
    responseTime: number,
    error: string,
    userId?: string,
    metadata?: Record<string, unknown>
  ): void {
    logger.debug(
      {
        apiType,
        endpoint,
        responseTime,
        error,
        userId,
        metadata,
      },
      'API error recorded'
    );
  }
}

// Create instances
const createAPIRouter = (config?: { userId?: string; userEmail?: string }): SimpleAPIRouter => {
  return new SimpleAPIRouter(config);
};

const apiMonitor = new SimpleAPIMonitor();

export interface APIClientConfig {
  userId?: string;
  userEmail?: string;
  timeout?: number;
  retries?: number;
}

export interface APIRequest {
  // Legacy GraphQL support (向後兼容)
  query?: string;
  variables?: Record<string, unknown>;
  operationName?: string;

  // REST API 相關
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint?: string;
  params?: Record<string, unknown>;
  data?: unknown;

  // 通用
  headers?: Record<string, string>;
  metadata?: Record<string, unknown>;
}

export interface APIResponse<T = unknown> {
  data?: T;
  error?: string;
  errors?: Array<{ message: string; code?: string }>;
  success: boolean;
  apiType: 'graphql' | 'rest';
  responseTime: number;
  fromCache?: boolean;
}

// GraphQL response type for type safety
interface GraphQLResponse<T = unknown> {
  data?: T;
  errors?: Array<{ message: string; extensions?: Record<string, unknown> }>;
}

/**
 * 統一 API 客戶端
 * 自動選擇最佳 API 類型
 */
export class UnifiedAPIClient {
  private config: APIClientConfig;
  private router: SimpleAPIRouter;

  constructor(config: APIClientConfig = {}) {
    this.config = {
      timeout: 30000,
      retries: 3,
      ...config,
    };

    this.router = createAPIRouter({
      userId: config.userId,
      userEmail: config.userEmail,
    });
  }

  /**
   * 執行 API 請求
   */
  async request<T = unknown>(request: APIRequest): Promise<APIResponse<T>> {
    const startTime = Date.now();

    try {
      // 獲取路由決策
      const routingInfo = await this.router.route();

      logger.debug(
        {
          useRestAPI: routingInfo.useRestAPI,
          percentage: routingInfo.percentage,
          reason: routingInfo.reason,
          endpoint: request.endpoint || 'graphql',
        },
        'API request routing'
      );

      let response: APIResponse<T>;

      if (request.endpoint) {
        // 如果是 REST 請求
        if (routingInfo.useRestAPI) {
          // REST API 已啟用，正常執行
          response = await this.executeRestRequest<T>(request);
        } else {
          // REST API 被禁用，返回適當的錯誤
          throw new Error(
            'REST API is currently disabled. Please try again later or contact support.'
          );
        }
      } else if (request.query) {
        // 使用 GraphQL
        response = await this.executeGraphQLRequest<T>(request);
      } else {
        throw new Error('Invalid request: missing endpoint or query');
      }

      // 記錄成功指標
      apiMonitor.recordSuccess(
        response.apiType,
        request.endpoint || request.operationName || 'unknown',
        response.responseTime,
        this.config.userId,
        request.metadata
      );

      return response;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error(
        {
          error: errorMessage,
          endpoint: request.endpoint || request.operationName,
          responseTime,
          userId: this.config.userId,
        },
        'API request failed'
      );

      // 記錄錯誤指標
      apiMonitor.recordError(
        'rest', // 假設失敗的是 REST，如果是 GraphQL 會在具體方法中記錄
        request.endpoint || request.operationName || 'unknown',
        responseTime,
        errorMessage,
        this.config.userId,
        request.metadata
      );

      // 如果啟用了 fallback，嘗試使用另一種 API
      const routingInfo = await this.router.route();
      if (routingInfo.fallbackEnabled) {
        return await this.attemptFallback<T>(request, error);
      }

      return {
        success: false,
        error: errorMessage,
        apiType: routingInfo.useRestAPI ? 'rest' : 'graphql',
        responseTime,
      };
    }
  }

  /**
   * 執行 REST API 請求
   */
  private async executeRestRequest<T>(_request: APIRequest): Promise<APIResponse<T>> {
    // REST API backend has been removed - use GraphQL instead
    const responseTime = 0;
    throw new Error('REST API backend has been deprecated. Please use GraphQL API.');
  }

  /**
   * 執行 GraphQL 請求
   */
  private async executeGraphQLRequest<T>(request: APIRequest): Promise<APIResponse<T>> {
    const startTime = Date.now();

    if (!request.query) {
      throw new Error('GraphQL query is required');
    }

    try {
      // Use proper base URL handling
      const baseUrl =
        typeof window !== 'undefined'
          ? window.location.origin
          : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const url = new URL('/api/graphql', baseUrl);

      const fetchOptions: RequestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...request.headers,
        },
        body: JSON.stringify({
          query: request.query,
          variables: request.variables,
          operationName: request.operationName,
        }),
        signal: AbortSignal.timeout(this.config.timeout || 30000),
      };

      const response = await fetch(url.toString(), fetchOptions);
      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: GraphQLResponse<T> = await response.json();

      if (result.errors && result.errors.length > 0) {
        throw new Error(result.errors[0].message || 'GraphQL query failed');
      }

      return {
        data: result.data,
        success: true,
        apiType: 'graphql',
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'GraphQL error';

      // 記錄 GraphQL 錯誤
      apiMonitor.recordError(
        'graphql',
        request.operationName || 'unknown',
        responseTime,
        errorMessage,
        this.config.userId,
        request.metadata
      );

      throw error;
    }
  }

  /**
   * 嘗試 fallback 到另一種 API
   */
  private async attemptFallback<T>(
    request: APIRequest,
    originalError: unknown
  ): Promise<APIResponse<T>> {
    const startTime = Date.now();

    logger.warn(
      {
        originalError: originalError instanceof Error ? originalError.message : 'Unknown error',
        hasQuery: !!request.query,
        hasEndpoint: !!request.endpoint,
      },
      'Attempting API fallback'
    );

    try {
      let response: APIResponse<T>;

      // 如果原本嘗試 REST，則 fallback 到 GraphQL
      if (request.endpoint && request.query) {
        response = await this.executeGraphQLRequest<T>(request);
      } else if (request.query && request.endpoint) {
        response = await this.executeRestRequest<T>(request);
      } else {
        throw new Error('No fallback option available');
      }

      logger.info(
        {
          fallbackType: response.apiType,
          responseTime: response.responseTime,
        },
        'API fallback successful'
      );

      return response;
    } catch (fallbackError) {
      const responseTime = Date.now() - startTime;
      const errorMessage =
        fallbackError instanceof Error ? fallbackError.message : 'Fallback failed';

      logger.error(
        {
          originalError: originalError instanceof Error ? originalError.message : 'Unknown error',
          fallbackError: errorMessage,
          responseTime,
        },
        'API fallback failed'
      );

      return {
        success: false,
        error: `Primary API failed: ${originalError instanceof Error ? originalError.message : 'Unknown error'}. Fallback failed: ${errorMessage}`,
        apiType: 'graphql',
        responseTime,
      };
    }
  }
}

// 全局客戶端實例
let globalClient: UnifiedAPIClient | null = null;

export function getAPIClient(config?: APIClientConfig): UnifiedAPIClient {
  if (!globalClient) {
    globalClient = new UnifiedAPIClient(config);
  }
  return globalClient;
}

// 便利函數
export async function apiRequest<T = unknown>(request: APIRequest): Promise<APIResponse<T>> {
  const client = getAPIClient();
  return client.request<T>(request);
}

export async function restRequest<T = unknown>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  endpoint: string,
  data?: unknown,
  params?: Record<string, unknown>
): Promise<APIResponse<T>> {
  return apiRequest<T>({
    method,
    endpoint,
    data,
    params,
  });
}

export async function graphqlRequest<T = unknown>(
  query: string,
  variables?: Record<string, unknown>,
  operationName?: string
): Promise<APIResponse<T>> {
  return apiRequest<T>({
    query,
    variables,
    operationName,
  });
}
