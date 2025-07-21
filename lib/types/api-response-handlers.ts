/**
 * Phase 6.1 Week 3: API 響應處理標準化
 * 策略 4: unknown + type narrowing - 安全的 API 響應處理
 */

import type { PostgrestSingleResponse } from '@supabase/supabase-js';

export class ApiResponseHandler {
  /**
   * 處理 RPC 響應並確保類型安全
   * @param rpcCall RPC 調用的 Promise
   * @param typeGuard 類型守衛函數
   * @returns 安全類型的數據
   */
  static async handleRPCResponse<T>(
    rpcCall: Promise<PostgrestSingleResponse<T>>,
    typeGuard: (data: unknown) => data is T
  ): Promise<T> {
    const { data, error } = await rpcCall;

    if (error) {
      throw new Error(`RPC Error: ${error.message}`);
    }

    if (!typeGuard(data)) {
      throw new Error('Invalid response format');
    }

    return data;
  }

  /**
   * 處理陣列響應並過濾無效項目
   * @param data 未知類型的陣列數據
   * @param itemGuard 項目類型守衛
   * @returns 安全類型的陣列
   */
  static handleArrayResponse<T>(data: unknown, itemGuard: (item: unknown) => item is T): T[] {
    if (!Array.isArray(data)) {
      throw new Error('Expected array response');
    }

    const validItems: T[] = [];
    const errors: string[] = [];

    data.forEach((item, index) => {
      if (itemGuard(item)) {
        validItems.push(item);
      } else {
        errors.push(`Invalid item at index ${index}`);
      }
    });

    if (errors.length > 0) {
      console.warn('Response validation warnings:', errors);
    }

    return validItems;
  }

  /**
   * 安全的 API 響應轉換
   * @param response API 響應
   * @param transformer 轉換函數
   * @param fallback 失敗時的回退值
   * @returns 轉換後的數據或回退值
   */
  static safeTransform<T, R>(
    response: unknown,
    transformer: (data: T) => R,
    fallback: R,
    typeGuard: (data: unknown) => data is T
  ): R {
    try {
      if (typeGuard(response)) {
        return transformer(response);
      }
      return fallback;
    } catch (error) {
      console.warn('API response transformation failed:', error);
      return fallback;
    }
  }

  /**
   * 批量處理多個 API 響應
   * @param responses API 響應陣列
   * @param typeGuard 類型守衛
   * @returns 有效響應陣列
   */
  static handleBatchResponses<T>(
    responses: unknown[],
    typeGuard: (data: unknown) => data is T
  ): T[] {
    return responses.filter(typeGuard);
  }

  /**
   * 處理分頁響應
   * @param response 分頁響應
   * @param itemGuard 項目類型守衛
   * @returns 分頁數據
   */
  static handlePaginatedResponse<T>(
    response: unknown,
    itemGuard: (item: unknown) => item is T
  ): { data: T[]; total?: number; page?: number; limit?: number } {
    if (typeof response !== 'object' || response === null) {
      return { data: [] };
    }

    const responseObj = response as Record<string, unknown>;
    const data = Array.isArray(responseObj.data)
      ? this.handleArrayResponse(responseObj.data, itemGuard)
      : [];

    return {
      data,
      total: typeof responseObj.total === 'number' ? responseObj.total : undefined,
      page: typeof responseObj.page === 'number' ? responseObj.page : undefined,
      limit: typeof responseObj.limit === 'number' ? responseObj.limit : undefined,
    };
  }
}
