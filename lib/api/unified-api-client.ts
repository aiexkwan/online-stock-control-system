/**
 * Unified API Client - 統一 API 客戶端 (v1.2.3)
 * 
 * 根據 feature flags 自動選擇 GraphQL 或 REST API
 * 支援 fallback 機制和性能監控
 */

import { APIRouter, getAPIRouter } from './api-router';
import { apiMonitor } from './api-monitor';
import { logger } from '@/lib/logger';

export interface APIClientConfig {
  userId?: string;
  userEmail?: string;
  timeout?: number;
  retries?: number;
}

export interface APIRequest {
  // GraphQL 相關
  query?: string;
  variables?: Record<string, any>;
  operationName?: string;
  
  // REST API 相關
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint?: string;
  params?: Record<string, any>;
  data?: any;
  
  // 通用
  headers?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface APIResponse<T = any> {
  data?: T;
  error?: string;
  errors?: Array<{ message: string; code?: string }>;
  success: boolean;
  apiType: 'graphql' | 'rest';
  responseTime: number;
  fromCache?: boolean;
}

/**
 * 統一 API 客戶端
 * 自動選擇最佳 API 類型
 */
export class UnifiedAPIClient {
  private config: APIClientConfig;
  private router: APIRouter;
  
  constructor(config: APIClientConfig = {}) {
    this.config = {
      timeout: 30000,
      retries: 3,
      ...config,
    };
    
    this.router = getAPIRouter({
      userId: config.userId,
      userEmail: config.userEmail,
    });
  }

  /**
   * 執行 API 請求
   */
  async request<T = any>(request: APIRequest): Promise<APIResponse<T>> {
    const startTime = Date.now();
    
    try {
      // 獲取路由決策
      const routingInfo = await this.router.route();
      
      logger.debug('API request routing', {
        useRestAPI: routingInfo.useRestAPI,
        percentage: routingInfo.percentage,
        reason: routingInfo.reason,
        endpoint: request.endpoint || 'graphql',
      });

      let response: APIResponse<T>;
      
      if (routingInfo.useRestAPI && request.endpoint) {
        // 使用 REST API
        response = await this.executeRestRequest<T>(request);
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
      
      logger.error('API request failed', {
        error: errorMessage,
        endpoint: request.endpoint || request.operationName,
        responseTime,
        userId: this.config.userId,
      });

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
  private async executeRestRequest<T>(request: APIRequest): Promise<APIResponse<T>> {
    const startTime = Date.now();
    
    if (!request.endpoint) {
      throw new Error('REST API endpoint is required');
    }

    const url = new URL(request.endpoint, 'http://localhost:3001/api/v1');
    
    if (request.params && request.method === 'GET') {
      Object.entries(request.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const fetchOptions: RequestInit = {
      method: request.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...request.headers,
      },
      signal: AbortSignal.timeout(this.config.timeout!),
    };

    if (request.data && request.method !== 'GET') {
      fetchOptions.body = JSON.stringify(request.data);
    }

    const response = await fetch(url.toString(), fetchOptions);
    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      data,
      success: true,
      apiType: 'rest',
      responseTime,
    };
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
      // GraphQL support has been completely removed
      throw new Error('GraphQL support has been removed');
      const responseTime = Date.now() - startTime;
      
      if (result.errors && result.errors.length > 0) {
        throw new Error(result.errors[0].message);
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
    originalError: any
  ): Promise<APIResponse<T>> {
    const startTime = Date.now();
    
    logger.warn('Attempting API fallback', {
      originalError: originalError instanceof Error ? originalError.message : 'Unknown error',
      hasQuery: !!request.query,
      hasEndpoint: !!request.endpoint,
    });

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

      logger.info('API fallback successful', {
        fallbackType: response.apiType,
        responseTime: response.responseTime,
      });

      return response;
      
    } catch (fallbackError) {
      const responseTime = Date.now() - startTime;
      const errorMessage = fallbackError instanceof Error ? fallbackError.message : 'Fallback failed';
      
      logger.error('API fallback failed', {
        originalError: originalError instanceof Error ? originalError.message : 'Unknown error',
        fallbackError: errorMessage,
        responseTime,
      });

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
export async function apiRequest<T = any>(request: APIRequest): Promise<APIResponse<T>> {
  const client = getAPIClient();
  return client.request<T>(request);
}

export async function restRequest<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  endpoint: string,
  data?: any,
  params?: Record<string, any>
): Promise<APIResponse<T>> {
  return apiRequest<T>({
    method,
    endpoint,
    data,
    params,
  });
}

export async function graphqlRequest<T = any>(
  query: string,
  variables?: Record<string, any>,
  operationName?: string
): Promise<APIResponse<T>> {
  return apiRequest<T>({
    query,
    variables,
    operationName,
  });
}