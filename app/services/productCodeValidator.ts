/**
 * ProductCodeValidator - 產品代碼驗證和豐富化服務
 *
 * 功能特點：
 * - 單例模式設計，確保全應用唯一實例
 * - LRU快取機制，5分鐘過期時間
 * - 批量處理支援，每批最多100筆
 * - 高性能字符串相似度匹配（≥0.85閾值）
 * - 完整錯誤處理和日誌記錄
 * - 數據庫連接池管理和安全查詢
 *
 * 安全特性：
 * - 防SQL注入攻擊
 * - 內存洩漏保護（LRU限制10000條記錄）
 * - 批量查詢分頁處理
 * - 降級策略支援
 *
 * 性能要求：
 * - 快取命中 < 1ms
 * - 批量驗證 < 100ms
 * - 內存使用 < 10MB
 * - 支援併發處理
 *
 * @version 1.0.0
 * @author ProductCodeValidator System
 */

import { createClient as createServerClient } from '../utils/supabase/server';
import { calculateStringSimilarity } from '../../lib/utils/string-similarity';
import { createLogger, sanitizeLogData, dbLogger, systemLogger } from '../../lib/logger';
import type { Database } from '../../types/database/supabase';

// 類型定義
interface ProductCode {
  code: string;
  description: string;
}

// 資料庫查詢結果類型
interface DatabaseProductCode {
  code: string;
  description: string;
}

interface ValidationResult {
  enrichedOrders: Array<{
    product_code: string;
    product_desc: string;
    is_valid: boolean;
    was_corrected: boolean;
    original_code?: string;
    confidence_score?: number;
  }>;
  summary: {
    total: number;
    valid: number;
    corrected: number;
    invalid: number;
  };
}

interface CacheEntry {
  data: ProductCode;
  timestamp: number;
}

interface BatchProcessingConfig {
  maxBatchSize: number;
  similarityThreshold: number;
  cacheExpireTime: number;
  maxCacheSize: number;
  queryTimeout: number;
}

// LRU Cache 實現
class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private readonly maxSize: number;

  constructor(maxSize: number = 10000) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    if (this.cache.has(key)) {
      // Move to end (most recently used)
      const value = this.cache.get(key)!;
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return undefined;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first entry)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * 產品代碼驗證器主類
 * 使用單例模式確保全應用唯一實例
 */
class ProductCodeValidator {
  private static instance: ProductCodeValidator | null = null;
  private readonly logger = createLogger('ProductCodeValidator');
  private readonly cache = new LRUCache<string, CacheEntry>();
  private allProductCodes: ProductCode[] = [];
  private lastFullCacheRefresh = 0;

  // 配置參數
  private readonly _config: BatchProcessingConfig = {
    maxBatchSize: 100,
    similarityThreshold: 0.85,
    cacheExpireTime: 5 * 60 * 1000, // 5 minutes in milliseconds
    maxCacheSize: 10000,
    queryTimeout: 30000, // 30 seconds
  };

  private constructor() {
    this.logger.info(
      {
        maxBatchSize: this._config.maxBatchSize,
        similarityThreshold: this._config.similarityThreshold,
        cacheExpireTime: this._config.cacheExpireTime,
        maxCacheSize: this._config.maxCacheSize,
      },
      'ProductCodeValidator initialized with config'
    );
  }

  /**
   * 獲取單例實例
   */
  public static getInstance(): ProductCodeValidator {
    if (!ProductCodeValidator.instance) {
      ProductCodeValidator.instance = new ProductCodeValidator();
    }
    return ProductCodeValidator.instance;
  }

  /**
   * 驗證並豐富化產品代碼列表
   * @param codes 待驗證的產品代碼數組
   * @returns 驗證結果包含豐富化信息和統計摘要
   * @throws {Error} 當輸入無效或批次大小超出限制時
   */
  public async validateAndEnrichCodes(codes: readonly string[]): Promise<ValidationResult> {
    const _startTime = Date.now();

    try {
      // 嚴格輸入驗證
      if (!Array.isArray(codes)) {
        throw new TypeError('Invalid input: codes must be an array');
      }

      if (codes.length === 0) {
        throw new Error('Invalid input: codes array cannot be empty');
      }

      // 驗證每個代碼項目都是字串
      const invalidIndex = codes.findIndex(code => typeof code !== 'string');
      if (invalidIndex !== -1) {
        throw new TypeError(
          `Invalid input: code at index ${invalidIndex} must be a string, got ${typeof codes[invalidIndex]}`
        );
      }

      if (codes.length > this._config.maxBatchSize) {
        throw new Error(`Batch size exceeds limit: ${codes.length} > ${this._config.maxBatchSize}`);
      }

      this.logger.info(
        {
          _batchSize: codes.length,
          sampleCodes: codes.slice(0, 3), // 只記錄前3個作為樣本
        },
        'Starting batch validation'
      );

      // 確保產品代碼庫已載入
      await this.ensureProductCodesLoaded();

      const enrichedOrders: ValidationResult['enrichedOrders'] = [];
      const stats = { valid: 0, corrected: 0, invalid: 0 };

      // 處理每個批次
      const batches = this.chunkArray(codes, this._config.maxBatchSize);

      for (const batch of batches) {
        const batchResults = await this.processBatch(batch);
        enrichedOrders.push(...batchResults);

        // 更新統計
        batchResults.forEach(result => {
          if (result.is_valid && !result.was_corrected) stats.valid++;
          else if (result.is_valid && result.was_corrected) stats.corrected++;
          else stats.invalid++;
        });
      }

      const processingTime = Date.now() - _startTime;

      this.logger.info(
        {
          total: codes.length,
          valid: stats.valid,
          corrected: stats.corrected,
          invalid: stats.invalid,
          processingTimeMs: processingTime,
          averageTimePerCode: processingTime / codes.length,
        },
        'Batch validation completed'
      );

      // 性能監控
      if (processingTime > 100) {
        this.logger.warn(
          {
            targetMs: 100,
            actualMs: processingTime,
            _batchSize: codes.length,
          },
          'Batch processing exceeded target time'
        );
      }

      return {
        enrichedOrders,
        summary: {
          total: codes.length,
          ...stats,
        },
      };
    } catch (error) {
      const processingTime = Date.now() - _startTime;
      this.logger.error(
        {
          _error: error instanceof Error ? error.message : 'Unknown error',
          _batchSize: codes?.length || 0,
          processingTimeMs: processingTime,
          stack: error instanceof Error ? error.stack : undefined,
        },
        'Batch validation failed'
      );

      // 降級策略：返回原始代碼作為無效項目
      return this.getFallbackResult(codes);
    }
  }

  /**
   * 處理單個批次的產品代碼
   */
  private async processBatch(codes: string[]): Promise<ValidationResult['enrichedOrders']> {
    const results: ValidationResult['enrichedOrders'] = [];

    for (const code of codes) {
      if (!code || typeof code !== 'string') {
        results.push({
          product_code: code || '',
          product_desc: 'Invalid code format',
          is_valid: false,
          was_corrected: false,
        });
        continue;
      }

      const normalizedCode = this.normalizeProductCode(code);
      const cachedResult = this.getCachedResult(normalizedCode);

      if (cachedResult) {
        results.push({
          product_code: normalizedCode,
          product_desc: cachedResult.description,
          is_valid: true,
          was_corrected: normalizedCode !== code,
          original_code: normalizedCode !== code ? code : undefined,
        });
        continue;
      }

      // 嘗試在產品代碼庫中查找
      const exactMatch = this.findExactMatch(normalizedCode);
      if (exactMatch) {
        this.setCacheEntry(normalizedCode, exactMatch);
        results.push({
          product_code: normalizedCode,
          product_desc: exactMatch.description,
          is_valid: true,
          was_corrected: normalizedCode !== code,
          original_code: normalizedCode !== code ? code : undefined,
        });
        continue;
      }

      // 嘗試相似度匹配
      const similarMatches = this.findSimilarCodes(normalizedCode);
      if (similarMatches.length > 0) {
        const bestMatch = similarMatches[0];
        const confidence = this.calculateSimilarity(normalizedCode, bestMatch.code);

        this.setCacheEntry(normalizedCode, bestMatch);
        results.push({
          product_code: bestMatch.code,
          product_desc: bestMatch.description,
          is_valid: true,
          was_corrected: true,
          original_code: code,
          confidence_score: confidence,
        });
        continue;
      }

      // 無法匹配
      results.push({
        product_code: code,
        product_desc: 'Product code not found',
        is_valid: false,
        was_corrected: false,
      });
    }

    return results;
  }

  /**
   * 確保產品代碼庫已載入
   */
  private async ensureProductCodesLoaded(): Promise<void> {
    const now = Date.now();
    const shouldRefresh = now - this.lastFullCacheRefresh > this._config.cacheExpireTime;

    if (this.allProductCodes.length === 0 || shouldRefresh) {
      await this.refreshCache();
    }
  }

  /**
   * 刷新快取，從資料庫載入所有產品代碼
   */
  public async refreshCache(): Promise<void> {
    const _startTime = Date.now();

    try {
      this.logger.info('Starting cache refresh');

      const supabase = await createServerClient();

      // 使用分頁查詢避免一次性載入過多數據
      let allData: ProductCode[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('data_code')
          .select('code, description')
          .range(page * pageSize, (page + 1) * pageSize - 1)
          .order('code', { ascending: true });

        if (error) {
          throw new Error(`Database query failed: ${error.message}`);
        }

        if (!data || data.length === 0) {
          hasMore = false;
          break;
        }

        // 數據清理和轉換，使用嚴格的類型檢查
        const cleanedData: ProductCode[] = data
          .filter(
            (item): item is DatabaseProductCode =>
              typeof item === 'object' &&
              item !== null &&
              'code' in item &&
              'description' in item &&
              typeof item.code === 'string' &&
              typeof item.description === 'string' &&
              item.code.trim() !== '' &&
              item.description.trim() !== ''
          )
          .map(
            (item: DatabaseProductCode): ProductCode => ({
              code: this.normalizeProductCode(item.code),
              description: item.description.trim(),
            })
          );

        allData = allData.concat(cleanedData);

        if (data.length < pageSize) {
          hasMore = false;
        } else {
          page++;
        }
      }

      // 去重處理
      const uniqueData = this.deduplicateProducts(allData);

      this.allProductCodes = uniqueData;
      this.lastFullCacheRefresh = Date.now();
      this.cache.clear(); // 清空舊快取

      const loadTime = Date.now() - _startTime;

      this.logger.info(
        {
          totalCodes: this.allProductCodes.length,
          loadTimeMs: loadTime,
          memoryUsageMB: (JSON.stringify(this.allProductCodes).length / 1024 / 1024).toFixed(2),
          pages: page + 1,
        },
        'Cache refresh completed'
      );

      // 性能警告
      if (loadTime > 5000) {
        this.logger.warn(
          {
            targetMs: 5000,
            actualMs: loadTime,
          },
          'Cache refresh took longer than expected'
        );
      }
    } catch (error) {
      const loadTime = Date.now() - _startTime;

      this.logger.error(
        {
          _error: error instanceof Error ? error.message : 'Unknown error',
          loadTimeMs: loadTime,
          currentCacheSize: this.allProductCodes.length,
          stack: error instanceof Error ? error.stack : undefined,
        },
        'Cache refresh failed'
      );

      // 如果是首次載入失敗，拋出錯誤
      if (this.allProductCodes.length === 0) {
        throw new Error('Failed to load product codes from database');
      }

      // 否則繼續使用舊快取
      this.logger.warn('Continuing with existing cache data');
    }
  }

  /**
   * 查找精確匹配的產品代碼
   */
  private findExactMatch(code: string): ProductCode | null {
    return this.allProductCodes.find(product => product.code === code) || null;
  }

  /**
   * 查找相似的產品代碼
   */
  public findSimilarCodes(invalidCode: string): ProductCode[] {
    const similarities: Array<{ product: ProductCode; similarity: number }> = [];

    for (const product of this.allProductCodes) {
      const similarity = this.calculateSimilarity(invalidCode, product.code);

      if (similarity >= this._config.similarityThreshold) {
        similarities.push({ product, similarity });
      }
    }

    // 按相似度降序排列
    similarities.sort((a, b) => b.similarity - a.similarity);

    // 返回前5個最相似的
    return similarities.slice(0, 5).map(item => item.product);
  }

  /**
   * 計算字符串相似度
   */
  public calculateSimilarity(a: string, b: string): number {
    if (!a || !b) return 0;

    // 標準化處理
    const normalizedA = a.toUpperCase().trim();
    const normalizedB = b.toUpperCase().trim();

    if (normalizedA === normalizedB) return 1.0;

    return calculateStringSimilarity(normalizedA, normalizedB);
  }

  /**
   * 數組分塊處理
   */
  public chunkArray<T>(array: T[], _size: number): T[][] {
    if (_size <= 0) {
      throw new Error('Chunk size must be greater than 0');
    }

    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += _size) {
      chunks.push(array.slice(i, i + _size));
    }
    return chunks;
  }

  /**
   * 標準化產品代碼
   */
  private normalizeProductCode(code: string): string {
    if (!code || typeof code !== 'string') return '';

    return code
      .toUpperCase()
      .trim()
      .replace(/[^\w\-]/g, ''); // 移除特殊字符，保留字母數字和連字符
  }

  /**
   * 獲取快取結果
   */
  private getCachedResult(code: string): ProductCode | null {
    const cached = this.cache.get(code);

    if (cached && Date.now() - cached.timestamp < this._config.cacheExpireTime) {
      return cached.data;
    }

    // 清理過期快取
    if (cached) {
      this.cache.set(code, cached); // 這會觸發LRU刪除
    }

    return null;
  }

  /**
   * 設置快取條目
   */
  private setCacheEntry(code: string, data: ProductCode): void {
    this.cache.set(code, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * 去重處理產品列表
   */
  private deduplicateProducts(products: ProductCode[]): ProductCode[] {
    const seen = new Set<string>();
    const unique: ProductCode[] = [];

    for (const product of products) {
      if (!seen.has(product.code)) {
        seen.add(product.code);
        unique.push(product);
      }
    }

    return unique;
  }

  /**
   * 降級策略：返回預設結果
   * @param codes 原始產品代碼數組 (可能包含undefined/null)
   * @returns 安全的降級ValidationResult
   */
  private getFallbackResult(codes: readonly string[]): ValidationResult {
    this.logger.warn('Using fallback result due to system failure');

    // 確保所有代碼都是安全的字符串
    const safeCodes = Array.isArray(codes) ? codes : [];

    return {
      enrichedOrders: safeCodes.map((code): ValidationResult['enrichedOrders'][0] => ({
        product_code: typeof code === 'string' ? code : '',
        product_desc: 'System unavailable - please retry',
        is_valid: false,
        was_corrected: false,
      })),
      summary: {
        total: safeCodes.length,
        valid: 0,
        corrected: 0,
        invalid: safeCodes.length,
      },
    };
  }

  /**
   * 獲取快取統計信息
   */
  public getCacheStats(): {
    cacheSize: number;
    maxCacheSize: number;
    totalProductCodes: number;
    lastRefresh: number;
    cacheHitRate?: number;
  } {
    return {
      cacheSize: this.cache.size(),
      maxCacheSize: this._config.maxCacheSize,
      totalProductCodes: this.allProductCodes.length,
      lastRefresh: this.lastFullCacheRefresh,
    };
  }

  /**
   * 清理資源（測試用）
   */
  public cleanup(): void {
    this.cache.clear();
    this.allProductCodes = [];
    this.lastFullCacheRefresh = 0;
    this.logger.info('ProductCodeValidator cleaned up');
  }

  /**
   * 健康檢查
   * @returns 系統健康狀態和詳細信息
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, unknown>;
  }> {
    const details: Record<string, unknown> = {};

    try {
      // 檢查快取狀態
      const cacheStats = this.getCacheStats();
      details.cache = cacheStats;

      // 檢查數據庫連接
      const supabase = await createServerClient();
      const { data, error } = await supabase.from('data_code').select('code').limit(1);

      if (error) {
        details.database = { status: 'error', error: error.message };
        return { status: 'unhealthy', details };
      }

      details.database = { status: 'connected' };

      // 檢查產品代碼載入狀態
      if (this.allProductCodes.length === 0) {
        details.productCodes = { status: 'not_loaded', count: 0 };
        return { status: 'degraded', details };
      }

      details.productCodes = {
        status: 'loaded',
        count: this.allProductCodes.length,
        lastRefresh: new Date(this.lastFullCacheRefresh).toISOString(),
      };

      return { status: 'healthy', details };
    } catch (error) {
      details._error = error instanceof Error ? error.message : 'Unknown error';
      return { status: 'unhealthy', details };
    }
  }
}

// 導出單例實例
export default ProductCodeValidator.getInstance();

// 導出類型定義 - 企業級類型安全
export type {
  ValidationResult,
  ProductCode,
  DatabaseProductCode,
  BatchProcessingConfig,
  CacheEntry,
};

// 導出類型守衛工具函數
export const isValidProductCode = (obj: unknown): obj is ProductCode => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'code' in obj &&
    'description' in obj &&
    typeof (obj as ProductCode).code === 'string' &&
    typeof (obj as ProductCode).description === 'string'
  );
};
