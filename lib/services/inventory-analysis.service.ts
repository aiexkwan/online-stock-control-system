import { createClient } from '@/app/utils/supabase/server';
import { GraphQLError } from 'graphql';
import { getCacheAdapter } from '@/lib/cache/cache-factory';
import { CacheAdapter } from '@/lib/cache/base-cache-adapter';
import { safeGet, safeNumber, safeString } from '@/types/database/helpers';
import { toGraphQLErrorMessage } from '@/lib/types/api';

// Input Types
export interface InventoryAnalysisInput {
  productCodes?: string[];
  productType?: string;
  filters?: InventoryAnalysisFiltersInput;
  sorting?: InventoryAnalysisSortInput;
  pagination?: PaginationInput;
}

export interface InventoryAnalysisFiltersInput {
  warehouse?: string;
  category?: string;
  minQuantity?: number;
  maxQuantity?: number;
  includeZeroStock?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface InventoryAnalysisSortInput {
  sortBy?: 'PRODUCT_CODE' | 'QUANTITY' | 'VALUE' | 'MOVEMENT' | 'LAST_ACTIVITY';
  direction?: 'ASC' | 'DESC';
}

export interface PaginationInput {
  first?: number;
  after?: string;
  offset?: number;
}

// Response Types
export interface InventoryAnalysisResult {
  products: InventoryAnalysisProductConnection;
  aggregation: InventoryAnalysisAggregation;
  metadata: AnalysisMetadata;
  lastUpdated: string;
  refreshInterval: number;
  dataSource: string;
}

export interface InventoryAnalysisProductConnection {
  edges: InventoryAnalysisProductEdge[];
  pageInfo: PageInfo;
  totalCount: number;
}

export interface InventoryAnalysisProductEdge {
  cursor: string;
  node: InventoryAnalysisProduct;
}

export interface InventoryAnalysisProduct {
  productCode: string;
  productName: string;
  category?: string;
  quantity: number;
  value: number;
  movement: number;
  lastActivity?: string;
  warehouse: string;
  location?: string;
  palletCount: number;
  unitPrice?: number;
  averageMovement?: number;
  turnoverRate?: number;
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK';
}

export interface InventoryAnalysisAggregation {
  totalProducts: number;
  totalQuantity: number;
  totalValue: number;
  totalPallets: number;
  categoryBreakdown: CategoryBreakdown[];
  warehouseBreakdown: WarehouseBreakdown[];
  movementSummary: MovementSummary;
}

export interface CategoryBreakdown {
  category: string;
  productCount: number;
  totalQuantity: number;
  totalValue: number;
  percentage: number;
}

export interface WarehouseBreakdown {
  warehouse: string;
  productCount: number;
  totalQuantity: number;
  totalValue: number;
  percentage: number;
}

export interface MovementSummary {
  fastMoving: number;
  slowMoving: number;
  noMovement: number;
  averageTurnover: number;
}

export interface AnalysisMetadata {
  requestId: string;
  executionTimeMs: number;
  queryComplexity: number;
  dataFreshness: string;
  cacheStatus: 'HIT' | 'MISS' | 'PARTIAL' | 'REFRESH';
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

// Define RPC response type
interface RPCResponse {
  products?: unknown[];
  aggregation?: {
    total_products?: number;
    total_quantity?: number;
    total_value?: number;
    total_pallets?: number;
    category_breakdown?: unknown[];
    warehouse_breakdown?: unknown[];
    movement_summary?: Record<string, unknown>;
  };
  total_count?: number;
  limit?: number;
  offset?: number;
}

// Define product type from RPC
interface RPCProduct {
  product_code?: string;
  product_name?: string;
  category?: string;
  quantity?: number;
  unit_price?: number;
  movement?: number;
  last_activity?: string;
  warehouse?: string;
  location?: string;
  pallet_count?: number;
  average_movement?: number;
  turnover_rate?: number;
}

interface CategoryBreakdownItem {
  category?: string;
  product_count?: number;
  total_quantity?: number;
  total_value?: number;
  percentage?: number;
}

interface WarehouseBreakdownItem {
  warehouse?: string;
  product_count?: number;
  total_quantity?: number;
  total_value?: number;
  percentage?: number;
}

export class InventoryAnalysisService {
  private cacheAdapter?: CacheAdapter;
  private readonly CACHE_TTL = 600; // 10 minutes
  private readonly CACHE_PREFIX = 'inventory_analysis';

  constructor(cacheAdapter?: CacheAdapter) {
    this.cacheAdapter = cacheAdapter || getCacheAdapter();
  }

  /**
   * 主要查詢方法 - 整合 Supabase RPC 的 Single Query 實現
   */
  async getAnalysis(
    input: InventoryAnalysisInput,
    requestId: string
  ): Promise<InventoryAnalysisResult> {
    const startTime = Date.now();

    try {
      console.log(`[InventoryAnalysisService-${requestId}] Starting analysis with input:`, input);

      // 檢查快取
      const cacheKey = this.generateCacheKey(input);
      const cachedResult = await this.getFromCache(cacheKey);

      if (cachedResult) {
        console.log(`[InventoryAnalysisService-${requestId}] Cache hit`);
        return {
          ...cachedResult,
          metadata: {
            ...cachedResult.metadata,
            requestId,
            cacheStatus: 'HIT' as const,
          },
        };
      }

      // 調用 Supabase RPC
      const rpcResult = await this.callInventoryAnalysisRPC(input, requestId);

      // 轉換數據格式
      const analysisResult = await this.transformRPCResponse(rpcResult, requestId, startTime);

      // 存儲到快取
      await this.saveToCache(cacheKey, analysisResult);

      console.log(
        `[InventoryAnalysisService-${requestId}] Analysis completed in ${Date.now() - startTime}ms`
      );

      return analysisResult;
    } catch (error) {
      console.error(`[InventoryAnalysisService-${requestId}] Error:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze inventory';
      throw new GraphQLError(toGraphQLErrorMessage(errorMessage), {
        extensions: {
          code: 'INVENTORY_ANALYSIS_ERROR',
          requestId,
          executionTime: Date.now() - startTime,
        },
      });
    }
  }

  /**
   * 調用 Supabase RPC 函數
   */
  private async callInventoryAnalysisRPC(input: InventoryAnalysisInput, requestId: string) {
    const supabase = await createClient();

    // 構建 RPC 參數
    const rpcParams = {
      p_product_codes: input.productCodes || null,
      p_product_type: input.productType || null,
      p_warehouse: input.filters?.warehouse || null,
      p_category: input.filters?.category || null,
      p_min_quantity: input.filters?.minQuantity || null,
      p_max_quantity: input.filters?.maxQuantity || null,
      p_include_zero_stock: input.filters?.includeZeroStock ?? true,
      p_date_start: input.filters?.dateRange?.start || null,
      p_date_end: input.filters?.dateRange?.end || null,
      p_sort_by: input.sorting?.sortBy || 'PRODUCT_CODE',
      p_sort_direction: input.sorting?.direction || 'ASC',
      p_limit: input.pagination?.first || 50,
      p_offset: input.pagination?.offset || 0,
    };

    console.log(`[InventoryAnalysisService-${requestId}] Calling RPC with params:`, rpcParams);

    const { data, error } = await supabase.rpc('rpc_get_inventory_analysis_aggregation', rpcParams);

    if (error) {
      throw new GraphQLError(toGraphQLErrorMessage(`RPC call failed: ${error.message}`), {
        extensions: { code: 'RPC_ERROR' },
      });
    }

    if (!data) {
      throw new GraphQLError(toGraphQLErrorMessage('No data returned from RPC'), {
        extensions: { code: 'NO_DATA' },
      });
    }

    return data;
  }

  /**
   * 轉換 RPC 響應為 GraphQL 格式
   */
  private async transformRPCResponse(
    rpcData: RPCResponse,
    requestId: string,
    startTime: number
  ): Promise<InventoryAnalysisResult> {
    const products = this.transformProducts(rpcData.products || []);
    const aggregation = this.transformAggregation(rpcData.aggregation || {});
    const totalCount = safeNumber(rpcData.total_count, products.length);

    // 分頁信息
    const pageInfo = this.buildPageInfo(rpcData, totalCount);

    // 產品連接
    const productConnection: InventoryAnalysisProductConnection = {
      edges: products.map((product, index) => ({
        cursor: Buffer.from(`${product.productCode}:${index}`).toString('base64'),
        node: product,
      })),
      pageInfo,
      totalCount,
    };

    // 元數據
    const metadata: AnalysisMetadata = {
      requestId,
      executionTimeMs: Date.now() - startTime,
      queryComplexity: this.calculateComplexity(rpcData),
      dataFreshness: new Date().toISOString(),
      cacheStatus: 'MISS' as const,
    };

    return {
      products: productConnection,
      aggregation,
      metadata,
      lastUpdated: new Date().toISOString(),
      refreshInterval: 300000, // 5 minutes
      dataSource: 'supabase_rpc_single_query',
    };
  }

  /**
   * 轉換產品數據
   */
  private transformProducts(products: unknown[]): InventoryAnalysisProduct[] {
    return products.map((product: unknown) => {
      const productData = product as RPCProduct;
      const quantity = safeNumber(productData.quantity, 0);
      const unitPrice = safeNumber(productData.unit_price, 0);
      const movement = safeNumber(productData.movement, 0);

      return {
        productCode: safeString(productData.product_code, ''),
        productName: safeString(productData.product_name, ''),
        category: safeString(productData.category, ''),
        quantity,
        value: quantity * unitPrice,
        movement,
        lastActivity: safeString(productData.last_activity, ''),
        warehouse: safeString(productData.warehouse, ''),
        location: safeString(productData.location, ''),
        palletCount: safeNumber(productData.pallet_count, 1),
        unitPrice,
        averageMovement: safeNumber(productData.average_movement, 0),
        turnoverRate: safeNumber(productData.turnover_rate, 0),
        stockStatus: this.determineStockStatus(quantity, movement),
      };
    });
  }

  /**
   * 轉換聚合數據
   */
  private transformAggregation(
    aggregation: NonNullable<RPCResponse['aggregation']>
  ): InventoryAnalysisAggregation {
    return {
      totalProducts: safeNumber(aggregation.total_products, 0),
      totalQuantity: safeNumber(aggregation.total_quantity, 0),
      totalValue: safeNumber(aggregation.total_value, 0),
      totalPallets: safeNumber(aggregation.total_pallets, 0),
      categoryBreakdown: this.transformCategoryBreakdown(aggregation.category_breakdown || []),
      warehouseBreakdown: this.transformWarehouseBreakdown(aggregation.warehouse_breakdown || []),
      movementSummary: this.transformMovementSummary(aggregation.movement_summary || {}),
    };
  }

  /**
   * 轉換類別分解數據
   */
  private transformCategoryBreakdown(breakdown: unknown[]): CategoryBreakdown[] {
    return breakdown.map((item: unknown) => {
      const itemData = item as CategoryBreakdownItem;
      return {
        category: safeString(itemData.category, ''),
        productCount: safeNumber(itemData.product_count, 0),
        totalQuantity: safeNumber(itemData.total_quantity, 0),
        totalValue: safeNumber(itemData.total_value, 0),
        percentage: safeNumber(itemData.percentage, 0),
      };
    });
  }

  /**
   * 轉換倉庫分解數據
   */
  private transformWarehouseBreakdown(breakdown: unknown[]): WarehouseBreakdown[] {
    return breakdown.map((item: unknown) => {
      const itemData = item as WarehouseBreakdownItem;
      return {
        warehouse: safeString(itemData.warehouse, ''),
        productCount: safeNumber(itemData.product_count, 0),
        totalQuantity: safeNumber(itemData.total_quantity, 0),
        totalValue: safeNumber(itemData.total_value, 0),
        percentage: safeNumber(itemData.percentage, 0),
      };
    });
  }

  /**
   * 轉換移動摘要數據
   */
  private transformMovementSummary(summary: Record<string, unknown>): MovementSummary {
    return {
      fastMoving: safeNumber(summary.fast_moving, 0),
      slowMoving: safeNumber(summary.slow_moving, 0),
      noMovement: safeNumber(summary.no_movement, 0),
      averageTurnover: safeNumber(summary.average_turnover, 0),
    };
  }

  /**
   * 決定庫存狀態
   */
  private determineStockStatus(
    quantity: number,
    movement: number
  ): InventoryAnalysisProduct['stockStatus'] {
    if (quantity === 0) return 'OUT_OF_STOCK';
    if (quantity < 10) return 'LOW_STOCK';
    if (movement > 0 && quantity / movement > 100) return 'OVERSTOCK';
    return 'IN_STOCK';
  }

  /**
   * 建立分頁信息
   */
  private buildPageInfo(rpcData: RPCResponse, totalCount: number): PageInfo {
    const limit = safeNumber(rpcData.limit, 50);
    const offset = safeNumber(rpcData.offset, 0);
    const currentPage = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
      startCursor: offset > 0 ? Buffer.from(`offset:${offset}`).toString('base64') : undefined,
      endCursor:
        offset + limit < totalCount
          ? Buffer.from(`offset:${offset + limit}`).toString('base64')
          : undefined,
      totalCount,
      totalPages,
      currentPage,
    };
  }

  /**
   * 計算查詢複雜度
   */
  private calculateComplexity(rpcData: RPCResponse): number {
    let complexity = 1;

    // 根據數據量增加複雜度
    if ((rpcData.products?.length ?? 0) > 100) complexity += 2;
    if ((rpcData.aggregation?.category_breakdown?.length ?? 0) > 5) complexity += 1;
    if ((rpcData.aggregation?.warehouse_breakdown?.length ?? 0) > 3) complexity += 1;

    return complexity;
  }

  /**
   * 生成快取 key
   */
  private generateCacheKey(input: InventoryAnalysisInput): string {
    const keyData = {
      productCodes: input.productCodes?.sort(),
      productType: input.productType,
      filters: input.filters,
      sorting: input.sorting,
      pagination: { ...input.pagination, after: undefined }, // 忽略 cursor
    };

    const hash = Buffer.from(JSON.stringify(keyData)).toString('base64');
    return `${this.CACHE_PREFIX}:${hash}`;
  }

  /**
   * 從快取獲取數據
   */
  private async getFromCache(key: string): Promise<InventoryAnalysisResult | null> {
    if (!this.cacheAdapter) return null;

    try {
      return await this.cacheAdapter.get<InventoryAnalysisResult>(key);
    } catch (error) {
      console.warn('[InventoryAnalysisService] Cache get error:', error);
      return null;
    }
  }

  /**
   * 保存數據到快取
   */
  private async saveToCache(key: string, data: InventoryAnalysisResult): Promise<void> {
    if (!this.cacheAdapter) return;

    try {
      await this.cacheAdapter.set(key, data, this.CACHE_TTL);
    } catch (error) {
      console.warn('[InventoryAnalysisService] Cache set error:', error);
    }
  }
}

export default InventoryAnalysisService;
