/**
 * Widget API Client - 專門為 widgets 設計的 API 客戶端
 * 使用 NestJS REST API 端點
 * 遵循 KISS 原則
 */

import { logger } from '@/lib/logger';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export interface APIResponse<T = unknown> {
  data?: T;
  error?: string;
  success: boolean;
  responseTime?: number;
}

/**
 * 通用 API 請求方法
 */
async function makeRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
  params?: Record<string, unknown>
): Promise<APIResponse<T>> {
  const startTime = Date.now();

  try {
    // 構建 URL
    const url = new URL(`${API_BASE_URL}${endpoint}`);

    // 添加查詢參數
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    // 獲取 auth token
    const token = localStorage.getItem('token');

    // 設置請求選項
    const fetchOptions: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    // 發送請求
    const response = await fetch(url.toString(), fetchOptions);
    const responseTime = Date.now() - startTime;

    // 解析響應
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return {
      data,
      success: true,
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error('Widget API request failed', {
      endpoint,
      error: errorMessage,
      responseTime,
    });

    return {
      success: false,
      error: errorMessage,
      responseTime,
    };
  }
}

/**
 * Widget API 客戶端
 */
export const widgetAPI = {
  /**
   * 獲取 void records 分析數據
   */
  async getVoidRecordsAnalysis(params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<APIResponse<unknown>> {
    return makeRequest(
      '/analysis/void-records',
      {
        method: 'GET',
      },
      params
    );
  },

  /**
   * 獲取庫存分佈數據
   */
  async getStockDistribution(params?: {
    type?: string;
    warehouseId?: string;
  }): Promise<APIResponse<unknown>> {
    return makeRequest(
      '/widgets/stock-distribution',
      {
        method: 'GET',
      },
      params
    );
  },

  /**
   * 獲取 ACO order progress 數據
   */
  async getAcoOrderProgress(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<APIResponse<unknown>> {
    return makeRequest(
      '/analysis/aco-order-progress-chart',
      {
        method: 'GET',
      },
      params
    );
  },

  /**
   * 獲取 inventory ordered analysis 數據
   */
  async getInventoryOrderedAnalysis(params?: {
    stockCodes?: string[];
    idsuppliers?: string[];
    fromACO?: boolean;
  }): Promise<APIResponse<unknown>> {
    return makeRequest(
      '/widgets/inventory-ordered-analysis',
      {
        method: 'GET',
      },
      params
    );
  },

  /**
   * 獲取 transaction report 數據
   */
  async getTransactionReport(params?: {
    startDate?: string;
    endDate?: string;
    productCode?: string;
    supplier?: string;
    username?: string;
    actionType?: string;
  }): Promise<APIResponse<unknown>> {
    return makeRequest(
      '/widgets/transaction-report',
      {
        method: 'GET',
      },
      params
    );
  },
};

export default widgetAPI;
