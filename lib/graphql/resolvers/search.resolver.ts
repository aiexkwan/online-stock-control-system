/**
 * SearchCard GraphQL Resolver
 * 統一搜索卡片的 GraphQL 解析器
 * 支援全域搜索、實體特定搜索、智能建議和搜索分析
 */

import { GraphQLContext as Context } from './index';
import {
  SearchCardInput,
  SearchCardData,
  SearchableEntity,
  SearchMode,
  SearchType,
  SortDirection,
  SearchSuggestion,
  SuggestionType,
  LocationType,
  OrderStatus,
  DateRangeInput,
  SearchResultCollection,
  SearchResultItem,
} from '@/types/generated/search-types';

// Import additional types from main GraphQL types if needed
type SearchSortField = string;

// Define missing core types based on usage analysis
interface SearchHistoryItem {
  id: string;
  query: string;
  entities: SearchableEntity[];
  resultCount: number;
  timestamp: Date;
  userId: string;
  success: boolean;
}

interface SearchConfig {
  id: string;
  name: string;
  query: string;
  entities: SearchableEntity[];
  filters: Record<string, unknown>;
  isDefault: boolean;
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
}

interface SaveSearchConfigInput {
  name: string;
  query: string;
  entities: SearchableEntity[];
  filters: Record<string, unknown>;
  isDefault: boolean;
  isPublic: boolean;
}

// Search Analytics types
interface QueryStats {
  totalQueries: number;
  uniqueQueries: number;
  averageQueryLength: number;
  topQueries: Array<{ query: string; count: number }>;
}

interface ResultStats {
  totalResults: number;
  averageResults: number;
  zeroResultQueries: number;
  entityBreakdown: Array<{ entity: SearchableEntity; count: number }>;
}

interface PerformanceStats {
  averageResponseTime: number;
  slowQueries: Array<{ query: string; responseTime: number }>;
  cacheHitRate: number;
}

interface UserBehavior {
  clickThroughRate: number;
  abandonmentRate: number;
  refinementRate: number;
  commonPatterns: string[];
}

interface SearchAnalytics {
  queryStats: QueryStats;
  resultStats: ResultStats;
  performanceStats: PerformanceStats;
  userBehavior: UserBehavior;
}

// Database result types
interface DatabaseSearchResult {
  entity: SearchableEntity;
  count: number;
  items: SearchResultItem[];
  hasMore: boolean;
  relevanceScore: number;
}

interface ProductRow {
  code: string;
  description?: string;
  colour?: string;
  type?: string;
  standard_qty?: number;
  remark?: string;
  latest_update: Date;
  relevance_score: number;
}

interface PalletRow {
  plt_num: string;
  series?: string;
  product_code: string;
  product_qty: number;
  generate_time: Date;
  plt_remark?: string;
  product_description?: string;
  relevance_score: number;
}

interface SearchHistoryRow {
  id: string;
  query: string;
  entities: string;
  result_count: number;
  user_id: string;
  success: boolean;
  timestamp: Date;
}

interface SearchConfigRow {
  id: string;
  name: string;
  query: string;
  entities: string;
  filters?: string;
  is_default: boolean;
  is_public: boolean;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  usage_count?: number;
}
import { GraphQLError } from 'graphql';

// 搜索處理器映射
const searchHandlers = {
  [SearchableEntity.PRODUCT]: handleProductSearch,
  [SearchableEntity.PALLET]: handlePalletSearch,
  [SearchableEntity.INVENTORY]: handleInventorySearch,
  [SearchableEntity.ORDER]: handleOrderSearch,
  [SearchableEntity.GRN]: handleGRNSearch,
  [SearchableEntity.USER]: handleUserSearch,
  [SearchableEntity.SUPPLIER]: handleSupplierSearch,
  [SearchableEntity.HISTORY]: handleHistorySearch,
  [SearchableEntity.TRANSFER]: handleTransferSearch,
  [SearchableEntity.FILE]: handleFileSearch,
};

// 搜索模式檢測器
const searchPatterns = {
  // Series 模式 (PM-240615, PT-240615)
  series: [
    /^[A-Z]{2,3}-\d{6}$/,
    /^[A-Z]{2,3}-\d{4}-\d{6}$/,
    /^[A-Z]+-[A-Z0-9]+$/,
    /^[\w]+-[\w]+$/,
    /^[A-Z0-9]{12}$/,
  ],
  // Pallet 模式 (240615/1, 240615-1)
  pallet: [/^\d{6}\/\d{1,3}$/, /^\d{6}-\d{1,3}$/, /^PLT-\d{6}\/\d{1,3}$/],
  // 產品代碼模式
  productCode: [/^[A-Z0-9]{3,20}$/, /^[A-Z]{2}\d{4,}$/],
  // 數字ID模式
  numericId: /^\d+$/,
  // 郵件模式
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};

export const searchResolver = {
  Query: {
    /**
     * 主要搜索查詢
     */
    searchCard: async (
      _: unknown,
      { input }: { input: SearchCardInput },
      context: Context
    ): Promise<SearchCardData> => {
      const startTime = Date.now();

      try {
        // 驗證認證
        if (!context.user) {
          throw new GraphQLError('User not authenticated', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }

        // 驗證輸入
        validateSearchInput(input);

        // 預處理查詢
        const processedQuery = preprocessQuery(input.query);
        const detectedType = detectSearchType(processedQuery);
        const suggestedEntities = suggestEntities(processedQuery, detectedType);

        // 確定搜索實體
        const searchEntities = input.entities?.length ? input.entities : suggestedEntities;

        // 檢查緩存
        const cacheKey = generateCacheKey(input);
        const cachedResult = await getCachedResult(cacheKey);
        if (cachedResult && !input.options?.timeoutMs) {
          return cachedResult;
        }

        // 執行搜索
        const searchResults = await executeSearch(
          {
            ...input,
            query: processedQuery,
            type: detectedType,
            entities: searchEntities,
          },
          context
        );

        // 生成建議
        const suggestions = await generateSuggestions(processedQuery, searchEntities, context);

        // 搜索分析 (如果啟用)
        let analytics = null;
        if (input.options?.includeAnalytics) {
          analytics = await generateSearchAnalytics(input, context);
        }

        // 搜索歷史 (如果啟用)
        let history: SearchHistoryItem[] = [];
        if (input.options?.includeHistory) {
          history = await getSearchHistory(context.user.id, 5, 0, context);
        }

        // 保存搜索歷史
        if (input.options?.saveToHistory !== false) {
          await saveSearchHistory(
            {
              query: processedQuery,
              entities: searchEntities,
              resultCount: searchResults.results.items.length,
              userId: context.user.id,
              success: searchResults.results.items.length > 0,
            },
            context
          );
        }

        const executionTime = Date.now() - startTime;

        const result: SearchCardData = {
          searchMeta: {
            query: input.query,
            processedQuery,
            searchMode: input.mode,
            searchType: detectedType,
            entities: searchEntities,
            totalResults: searchResults.results.items.length,
            searchTime: executionTime,
            facets: searchResults.facets,
            hasMore: searchResults.results.pageInfo.hasNextPage,
          },
          results: searchResults.results,
          suggestions,
          analytics,
          history,
        };

        // 緩存結果
        await cacheResult(cacheKey, result, 300); // 5分鐘緩存

        return result;
      } catch (error) {
        console.error('SearchCard error:', error);
        throw new GraphQLError(error.message || 'Search failed', {
          extensions: { code: 'SEARCH_ERROR', query: input.query, entities: input.entities },
        });
      }
    },

    /**
     * 批量搜索
     */
    batchSearch: async (
      _: unknown,
      { inputs }: { inputs: SearchCardInput[] },
      context: Context
    ): Promise<SearchCardData[]> => {
      if (!context.user) {
        throw new GraphQLError('User not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      if (inputs.length > 10) {
        throw new GraphQLError('Too many search requests in batch (max 10)', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      return Promise.all(
        inputs.map(input => searchResolver.Query.searchCard(_, { input }, context))
      );
    },

    /**
     * 搜索建議
     */
    searchSuggestions: async (
      _: unknown,
      { query, entity, limit = 10 }: { query: string; entity?: SearchableEntity; limit?: number },
      context: Context
    ): Promise<SearchSuggestion[]> => {
      if (!context.user) {
        throw new GraphQLError('User not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      return generateSuggestions(query, entity ? [entity] : [], context, limit);
    },

    /**
     * 搜索歷史
     */
    searchHistory: async (
      _: unknown,
      { userId, limit = 50, offset = 0 }: { userId?: string; limit?: number; offset?: number },
      context: Context
    ): Promise<SearchHistoryItem[]> => {
      if (!context.user) {
        throw new GraphQLError('User not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const targetUserId = userId || context.user.id;

      // 權限檢查：只能查看自己的歷史或需要管理員權限
      if (targetUserId !== context.user.id && !context.user.isSupervisor) {
        throw new GraphQLError('Insufficient permissions', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      return getSearchHistory(targetUserId, limit, offset, context);
    },

    /**
     * 搜索配置
     */
    searchConfigs: async (
      _: unknown,
      { userId, includePublic = true }: { userId?: string; includePublic?: boolean },
      context: Context
    ): Promise<SearchConfig[]> => {
      if (!context.user) {
        throw new GraphQLError('User not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const targetUserId = userId || context.user.id;

      const query = `
        SELECT * FROM search_configs 
        WHERE (created_by = $1 ${includePublic ? 'OR is_public = true' : ''})
        ORDER BY is_default DESC, usage_count DESC, created_at DESC
      `;

      const result = await context.db.query(query, [targetUserId]);

      return result.rows.map(mapSearchConfigRow);
    },

    /**
     * 搜索分析
     */
    searchAnalytics: async (
      _: unknown,
      { dateRange, entities }: { dateRange?: DateRangeInput; entities?: SearchableEntity[] },
      context: Context
    ): Promise<SearchAnalytics> => {
      if (!context.user?.isSupervisor) {
        throw new GraphQLError('Supervisor access required', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      return generateSearchAnalytics({ dateRange, entities }, context);
    },
  },

  Mutation: {
    /**
     * 保存搜索配置
     */
    saveSearchConfig: async (
      _: unknown,
      { input }: { input: SaveSearchConfigInput },
      context: Context
    ): Promise<SearchConfig> => {
      if (!context.user) {
        throw new GraphQLError('User not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const configId = await context.db.query(
        `
        INSERT INTO search_configs (
          name, query, entities, filters, is_default, is_public, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `,
        [
          input.name,
          input.query,
          JSON.stringify(input.entities),
          JSON.stringify(input.filters),
          input.isDefault,
          input.isPublic,
          context.user.id,
        ]
      );

      const config = await context.db.query('SELECT * FROM search_configs WHERE id = $1', [
        configId.rows[0].id,
      ]);

      return mapSearchConfigRow(config.rows[0]);
    },

    /**
     * 刪除搜索配置
     */
    deleteSearchConfig: async (
      _: unknown,
      { id }: { id: string },
      context: Context
    ): Promise<boolean> => {
      if (!context.user) {
        throw new GraphQLError('User not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const result = await context.db.query(
        'DELETE FROM search_configs WHERE id = $1 AND created_by = $2',
        [id, context.user.id]
      );

      return result.rowCount > 0;
    },

    /**
     * 清除搜索歷史
     */
    clearSearchHistory: async (
      _: unknown,
      { userId, olderThan }: { userId?: string; olderThan?: Date },
      context: Context
    ): Promise<boolean> => {
      if (!context.user) {
        throw new GraphQLError('User not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const targetUserId = userId || context.user.id;

      // 權限檢查
      if (targetUserId !== context.user.id && !context.user.isSupervisor) {
        throw new GraphQLError('Insufficient permissions', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      let query = 'DELETE FROM search_history WHERE user_id = $1';
      const params = [targetUserId];

      if (olderThan) {
        query += ' AND timestamp < $2';
        params.push(olderThan);
      }

      const result = await context.db.query(query, params);

      return result.rowCount > 0;
    },

    /**
     * 更新搜索偏好
     */
    updateSearchPreferences: async (
      _: unknown,
      { preferences }: { preferences: Record<string, unknown> },
      context: Context
    ): Promise<boolean> => {
      if (!context.user) {
        throw new GraphQLError('User not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      await context.db.query(
        `
        INSERT INTO user_search_preferences (user_id, preferences)
        VALUES ($1, $2)
        ON CONFLICT (user_id) DO UPDATE SET 
          preferences = $2,
          updated_at = NOW()
      `,
        [context.user.id, JSON.stringify(preferences)]
      );

      return true;
    },
  },
};

/**
 * 驗證搜索輸入
 */
function validateSearchInput(input: SearchCardInput): void {
  if (!input.query || input.query.trim().length === 0) {
    throw new GraphQLError('Search query cannot be empty', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  if (input.query.length > 1000) {
    throw new GraphQLError('Search query too long (max 1000 characters)', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  if (input.entities && input.entities.length > 10) {
    throw new GraphQLError('Too many search entities (max 10)', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  if (input.options?.maxResults && input.options.maxResults > 1000) {
    throw new GraphQLError('Too many results requested (max 1000)', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }
}

/**
 * 預處理查詢字串
 */
function preprocessQuery(query: string): string {
  return query
    .trim()
    .replace(/\s+/g, ' ') // 合併多餘空格
    .replace(/[^\w\s\-\/]/g, '') // 移除特殊字符
    .toLowerCase();
}

/**
 * 檢測搜索類型
 */
function detectSearchType(query: string): SearchType {
  // 檢測條碼模式
  if (query.length >= 8 && /^[0-9]+$/.test(query)) {
    return SearchType.BARCODE;
  }

  // 檢測精確代碼模式
  for (const patterns of Object.values(searchPatterns)) {
    if (Array.isArray(patterns)) {
      if (patterns.some(pattern => pattern.test(query))) {
        return SearchType.CODE;
      }
    } else if (patterns.test(query)) {
      return SearchType.CODE;
    }
  }

  // 檢測高級搜索 (包含運算符)
  if (query.includes(':') || query.includes('=') || query.includes('>')) {
    return SearchType.ADVANCED;
  }

  // 默認文字搜索
  return SearchType.TEXT;
}

/**
 * 建議搜索實體
 */
function suggestEntities(query: string, searchType: SearchType): SearchableEntity[] {
  const suggestions: SearchableEntity[] = [];

  switch (searchType) {
    case SearchType.CODE:
      if (searchPatterns.series.some(p => p.test(query))) {
        suggestions.push(SearchableEntity.PALLET);
      }
      if (searchPatterns.pallet.some(p => p.test(query))) {
        suggestions.push(SearchableEntity.PALLET);
      }
      if (searchPatterns.productCode.some(p => p.test(query))) {
        suggestions.push(SearchableEntity.PRODUCT);
      }
      break;

    case SearchType.BARCODE:
      suggestions.push(SearchableEntity.PRODUCT, SearchableEntity.PALLET);
      break;

    case SearchType.TEXT:
      if (searchPatterns.email.test(query)) {
        suggestions.push(SearchableEntity.USER);
      } else {
        suggestions.push(SearchableEntity.PRODUCT, SearchableEntity.PALLET, SearchableEntity.ORDER);
      }
      break;

    default:
      // 全域搜索
      suggestions.push(
        SearchableEntity.PRODUCT,
        SearchableEntity.PALLET,
        SearchableEntity.INVENTORY,
        SearchableEntity.ORDER
      );
  }

  return suggestions.length > 0 ? suggestions : [SearchableEntity.PRODUCT];
}

/**
 * 執行搜索
 */
async function executeSearch(
  input: SearchCardInput & { entities: SearchableEntity[] },
  context: Context
): Promise<{ results: SearchResultCollection; facets: unknown[] }> {
  const searchPromises = input.entities.map(async entity => {
    const handler = searchHandlers[entity];
    if (!handler) {
      console.warn(`No search handler for entity: ${entity}`);
      return { entity, count: 0, items: [], hasMore: false, relevanceScore: 0 };
    }

    try {
      return await handler(input, context);
    } catch (error) {
      console.error(`Search error for entity ${entity}:`, error);
      return { entity, count: 0, items: [], hasMore: false, relevanceScore: 0 };
    }
  });

  const results = await Promise.all(searchPromises);

  // 合併結果
  const allItems = results.flatMap(r => r.items);
  const totalCount = results.reduce((sum, r) => sum + r.count, 0);

  // 按相關性排序
  allItems.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

  // 應用分頁
  const limit = input.pagination?.limit || 20;
  const offset = input.pagination?.offset || 0;
  const paginatedItems = allItems.slice(offset, offset + limit);

  return {
    results: {
      groups: input.options?.groupByEntity ? results.filter(r => r.count > 0) : [],
      items: paginatedItems,
      pageInfo: {
        hasNextPage: offset + limit < totalCount,
        hasPreviousPage: offset > 0,
        startCursor: offset.toString(),
        endCursor: (offset + paginatedItems.length - 1).toString(),
      },
    },
    facets: [], // TODO: 實現面向功能
  };
}

/**
 * 產品搜索處理器
 */
async function handleProductSearch(
  input: SearchCardInput,
  context: Context
): Promise<DatabaseSearchResult> {
  const { query, filters } = input;

  let whereClause = '1=1';
  const params: (string | string[] | boolean | number)[] = [];
  let paramIndex = 1;

  // 基本搜索條件
  if (query) {
    whereClause += ` AND (
      code ILIKE $${paramIndex} OR 
      description ILIKE $${paramIndex} OR
      colour ILIKE $${paramIndex} OR
      type ILIKE $${paramIndex} OR
      remark ILIKE $${paramIndex}
    )`;
    params.push(`%${query}%`);
    paramIndex++;
  }

  // 產品特定過濾器
  if (filters?.productFilters) {
    const pf = filters.productFilters;

    if (pf.productCodes?.length) {
      whereClause += ` AND code = ANY($${paramIndex})`;
      params.push(pf.productCodes);
      paramIndex++;
    }

    if (pf.colours?.length) {
      whereClause += ` AND colour = ANY($${paramIndex})`;
      params.push(pf.colours);
      paramIndex++;
    }

    if (pf.types?.length) {
      whereClause += ` AND type = ANY($${paramIndex})`;
      params.push(pf.types);
      paramIndex++;
    }

    if (pf.isActive !== undefined) {
      whereClause += ` AND is_active = $${paramIndex}`;
      params.push(pf.isActive);
      paramIndex++;
    }
  }

  const sql = `
    SELECT 
      code,
      description,
      colour,
      type,
      standard_qty,
      remark,
      latest_update,
      -- 相關性評分
      CASE 
        WHEN code ILIKE $1 THEN 100
        WHEN description ILIKE $1 THEN 80
        WHEN colour ILIKE $1 THEN 60
        ELSE 40
      END as relevance_score
    FROM data_code
    WHERE ${whereClause}
    ORDER BY relevance_score DESC, latest_update DESC
    LIMIT 50
  `;

  const result = await context.db.query(sql, params);

  const items = result.rows.map(row => ({
    id: row.code,
    entity: SearchableEntity.PRODUCT,
    title: row.description || row.code,
    subtitle: `${row.code} - ${row.colour || 'N/A'}`,
    description: row.remark,
    relevanceScore: row.relevance_score,
    highlights: generateHighlights(query, row),
    matchedFields: getMatchedFields(query, row),
    data: {
      __typename: 'ProductSearchResult',
      code: row.code,
      description: row.description,
      colour: row.colour,
      type: row.type,
      standardQty: row.standard_qty,
      remark: row.remark,
      totalStock: 0, // TODO: 從庫存表獲取
      totalPallets: 0, // TODO: 從托盤表獲取
      lastUpdated: row.latest_update,
    },
    metadata: {
      source: 'data_code',
      freshness: row.latest_update,
      confidence: row.relevance_score / 100,
      tags: [row.type, row.colour].filter(Boolean),
      customFields: {},
    },
    actions: [
      {
        id: 'view-product',
        label: 'View Details',
        icon: 'eye',
        url: `/products/${row.code}`,
        action: 'VIEW',
        requiresAuth: false,
      },
      {
        id: 'check-inventory',
        label: 'Check Inventory',
        icon: 'warehouse',
        url: `/inventory?product=${row.code}`,
        action: 'NAVIGATE',
        requiresAuth: true,
      },
    ],
  }));

  return {
    entity: SearchableEntity.PRODUCT,
    count: items.length,
    items,
    hasMore: items.length === 50,
    relevanceScore: items.length > 0 ? Math.max(...items.map(i => i.relevanceScore)) : 0,
  };
}

/**
 * 托盤搜索處理器
 */
async function handlePalletSearch(
  input: SearchCardInput,
  context: Context
): Promise<DatabaseSearchResult> {
  const { query, filters } = input;

  let whereClause = '1=1';
  const params: (string | string[] | boolean | number)[] = [];
  let paramIndex = 1;

  // 基本搜索條件
  if (query) {
    whereClause += ` AND (
      plt_num ILIKE $${paramIndex} OR 
      series ILIKE $${paramIndex} OR
      product_code ILIKE $${paramIndex} OR
      plt_remark ILIKE $${paramIndex}
    )`;
    params.push(`%${query}%`);
    paramIndex++;
  }

  // 托盤特定過濾器
  if (filters?.palletFilters) {
    const pf = filters.palletFilters;

    if (pf.series?.length) {
      whereClause += ` AND series = ANY($${paramIndex})`;
      params.push(pf.series);
      paramIndex++;
    }

    if (pf.palletNumbers?.length) {
      whereClause += ` AND plt_num = ANY($${paramIndex})`;
      params.push(pf.palletNumbers);
      paramIndex++;
    }

    if (pf.productCodes?.length) {
      whereClause += ` AND product_code = ANY($${paramIndex})`;
      params.push(pf.productCodes);
      paramIndex++;
    }
  }

  const sql = `
    SELECT 
      p.plt_num,
      p.series,
      p.product_code,
      p.product_qty,
      p.generate_time,
      p.plt_remark,
      pc.description as product_description,
      -- 相關性評分
      CASE 
        WHEN p.plt_num = $1 THEN 100
        WHEN p.plt_num ILIKE $1 THEN 90
        WHEN p.series ILIKE $1 THEN 80
        WHEN p.product_code ILIKE $1 THEN 70
        ELSE 40
      END as relevance_score
    FROM record_palletinfo p
    LEFT JOIN data_code pc ON p.product_code = pc.code
    WHERE ${whereClause}
    ORDER BY relevance_score DESC, p.generate_time DESC
    LIMIT 50
  `;

  const result = await context.db.query(sql, params);

  const items = result.rows.map(row => ({
    id: row.plt_num,
    entity: SearchableEntity.PALLET,
    title: row.plt_num,
    subtitle: `${row.series || 'No Series'} - ${row.product_code}`,
    description: row.plt_remark || row.product_description,
    relevanceScore: row.relevance_score,
    highlights: generateHighlights(query, row),
    matchedFields: getMatchedFields(query, row),
    data: {
      __typename: 'PalletSearchResult',
      pltNum: row.plt_num,
      series: row.series,
      productCode: row.product_code,
      productQty: row.product_qty,
      generateTime: row.generate_time,
      remark: row.plt_remark,
      product: {
        code: row.product_code,
        description: row.product_description || '',
        colour: null,
        type: null,
      },
      currentLocation: null, // TODO: 從庫存表獲取
      isAvailable: true, // TODO: 檢查庫存狀態
    },
    metadata: {
      source: 'record_palletinfo',
      freshness: row.generate_time,
      confidence: row.relevance_score / 100,
      tags: [row.series, row.product_code].filter(Boolean),
      customFields: {},
    },
    actions: [
      {
        id: 'view-pallet',
        label: 'View Details',
        icon: 'package',
        url: `/pallets/${row.plt_num}`,
        action: 'VIEW',
        requiresAuth: false,
      },
      {
        id: 'track-pallet',
        label: 'Track Location',
        icon: 'map-pin',
        url: `/tracking?pallet=${row.plt_num}`,
        action: 'NAVIGATE',
        requiresAuth: true,
      },
    ],
  }));

  return {
    entity: SearchableEntity.PALLET,
    count: items.length,
    items,
    hasMore: items.length === 50,
    relevanceScore: items.length > 0 ? Math.max(...items.map(i => i.relevanceScore)) : 0,
  };
}

/**
 * 其他搜索處理器的佔位符實現
 */
async function handleInventorySearch(
  input: SearchCardInput,
  context: Context
): Promise<DatabaseSearchResult> {
  // TODO: 實現庫存搜索邏輯
  return {
    entity: SearchableEntity.INVENTORY,
    count: 0,
    items: [],
    hasMore: false,
    relevanceScore: 0,
  };
}

async function handleOrderSearch(
  input: SearchCardInput,
  context: Context
): Promise<DatabaseSearchResult> {
  // TODO: 實現訂單搜索邏輯
  return { entity: SearchableEntity.ORDER, count: 0, items: [], hasMore: false, relevanceScore: 0 };
}

async function handleGRNSearch(
  input: SearchCardInput,
  context: Context
): Promise<DatabaseSearchResult> {
  // TODO: 實現GRN搜索邏輯
  return { entity: SearchableEntity.GRN, count: 0, items: [], hasMore: false, relevanceScore: 0 };
}

async function handleUserSearch(
  input: SearchCardInput,
  context: Context
): Promise<DatabaseSearchResult> {
  // TODO: 實現用戶搜索邏輯
  return { entity: SearchableEntity.USER, count: 0, items: [], hasMore: false, relevanceScore: 0 };
}

async function handleSupplierSearch(
  input: SearchCardInput,
  context: Context
): Promise<DatabaseSearchResult> {
  // TODO: 實現供應商搜索邏輯
  return {
    entity: SearchableEntity.SUPPLIER,
    count: 0,
    items: [],
    hasMore: false,
    relevanceScore: 0,
  };
}

async function handleHistorySearch(
  input: SearchCardInput,
  context: Context
): Promise<DatabaseSearchResult> {
  // TODO: 實現歷史搜索邏輯
  return {
    entity: SearchableEntity.HISTORY,
    count: 0,
    items: [],
    hasMore: false,
    relevanceScore: 0,
  };
}

async function handleTransferSearch(
  input: SearchCardInput,
  context: Context
): Promise<DatabaseSearchResult> {
  // TODO: 實現轉移搜索邏輯
  return {
    entity: SearchableEntity.TRANSFER,
    count: 0,
    items: [],
    hasMore: false,
    relevanceScore: 0,
  };
}

async function handleFileSearch(
  input: SearchCardInput,
  context: Context
): Promise<DatabaseSearchResult> {
  // TODO: 實現文件搜索邏輯
  return { entity: SearchableEntity.FILE, count: 0, items: [], hasMore: false, relevanceScore: 0 };
}

/**
 * 生成搜索建議
 */
async function generateSuggestions(
  query: string,
  entities: SearchableEntity[],
  context: Context,
  limit: number = 10
): Promise<SearchSuggestion[]> {
  const suggestions: SearchSuggestion[] = [];

  // 自動完成建議
  if (query.length >= 2) {
    const autocompleteSuggestions = await getAutocompleteSuggestions(
      query,
      entities,
      context,
      limit
    );
    suggestions.push(...autocompleteSuggestions);
  }

  // 拼寫糾正
  const correctionSuggestions = await getSpellingCorrections(query, context);
  suggestions.push(...correctionSuggestions);

  // 熱門搜索
  const popularSuggestions = await getPopularSearches(entities, context, 3);
  suggestions.push(...popularSuggestions);

  // 最近搜索
  if (context.user) {
    const recentSuggestions = await getRecentSearches(context.user.id, 3);
    suggestions.push(...recentSuggestions);
  }

  return suggestions.sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * 工具函數
 */
async function getAutocompleteSuggestions(
  query: string,
  entities: SearchableEntity[],
  context: Context,
  limit: number
): Promise<SearchSuggestion[]> {
  const suggestions: SearchSuggestion[] = [];

  // 產品代碼自動完成
  if (entities.includes(SearchableEntity.PRODUCT)) {
    const productSuggestions = await context.db.query(
      `
      SELECT DISTINCT code, description, 
        LENGTH(code) - LENGTH($1) as score_modifier
      FROM data_code 
      WHERE code ILIKE $1 OR description ILIKE $1
      ORDER BY score_modifier ASC, code ASC
      LIMIT $2
    `,
      [`${query}%`, Math.ceil(limit / entities.length)]
    );

    suggestions.push(
      ...productSuggestions.rows.map(row => ({
        text: row.code,
        type: SuggestionType.AUTOCOMPLETE,
        entity: SearchableEntity.PRODUCT,
        count: 1,
        score: 80 - row.score_modifier,
        metadata: { description: row.description },
      }))
    );
  }

  // TODO: 添加其他實體的自動完成建議

  return suggestions;
}

async function getSpellingCorrections(
  query: string,
  context: Context
): Promise<SearchSuggestion[]> {
  // TODO: 實現拼寫糾正邏輯
  return [];
}

async function getPopularSearches(
  entities: SearchableEntity[],
  context: Context,
  limit: number
): Promise<SearchSuggestion[]> {
  const result = await context.db.query(
    `
    SELECT query, COUNT(*) as count
    FROM search_history 
    WHERE entities && $1 AND timestamp > NOW() - INTERVAL '30 days'
    GROUP BY query
    ORDER BY count DESC
    LIMIT $2
  `,
    [JSON.stringify(entities), limit]
  );

  return result.rows.map(row => ({
    text: row.query,
    type: SuggestionType.POPULAR_SEARCH,
    entity: null,
    count: row.count,
    score: 60,
    metadata: {},
  }));
}

async function getRecentSearches(userId: string, limit: number): Promise<SearchSuggestion[]> {
  // TODO: 實現最近搜索建議
  return [];
}

async function generateSearchAnalytics(
  input: { dateRange?: DateRangeInput; entities?: SearchableEntity[] },
  context: Context
): Promise<SearchAnalytics> {
  // TODO: 實現搜索分析功能
  return {
    queryStats: {
      totalQueries: 0,
      uniqueQueries: 0,
      averageQueryLength: 0,
      topQueries: [],
    },
    resultStats: {
      totalResults: 0,
      averageResults: 0,
      zeroResultQueries: 0,
      entityBreakdown: [],
    },
    performanceStats: {
      averageResponseTime: 0,
      slowQueries: [],
      cacheHitRate: 0,
    },
    userBehavior: {
      clickThroughRate: 0,
      abandonmentRate: 0,
      refinementRate: 0,
      commonPatterns: [],
    },
  };
}

async function saveSearchHistory(
  data: {
    query: string;
    entities: SearchableEntity[];
    resultCount: number;
    userId: string;
    success: boolean;
  },
  context: Context
): Promise<void> {
  await context.db.query(
    `
    INSERT INTO search_history (query, entities, result_count, user_id, success, timestamp)
    VALUES ($1, $2, $3, $4, $5, NOW())
  `,
    [data.query, JSON.stringify(data.entities), data.resultCount, data.userId, data.success]
  );
}

async function getSearchHistory(
  userId: string,
  limit: number,
  offset: number = 0,
  context?: Context
): Promise<SearchHistoryItem[]> {
  if (!context) {
    return [];
  }

  const result = await context.db.query(
    `
    SELECT * FROM search_history 
    WHERE user_id = $1 
    ORDER BY timestamp DESC 
    LIMIT $2 OFFSET $3
  `,
    [userId, limit, offset]
  );

  return result.rows.map(row => ({
    id: row.id,
    query: row.query,
    entities: JSON.parse(row.entities),
    resultCount: row.result_count,
    timestamp: row.timestamp,
    userId: row.user_id,
    success: row.success,
  }));
}

function mapSearchConfigRow(row: SearchConfigRow): SearchConfig {
  return {
    id: row.id,
    name: row.name,
    query: row.query,
    entities: JSON.parse(row.entities),
    filters: JSON.parse(row.filters || '{}'),
    isDefault: row.is_default,
    isPublic: row.is_public,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    usageCount: row.usage_count || 0,
  };
}

function generateHighlights(query: string, row: ProductRow | PalletRow): string[] {
  // TODO: 實現文本高亮功能
  return [];
}

function getMatchedFields(query: string, row: Record<string, unknown>): string[] {
  const matchedFields: string[] = [];
  const lowerQuery = query.toLowerCase();

  Object.keys(row).forEach(field => {
    if (row[field] && String(row[field]).toLowerCase().includes(lowerQuery)) {
      matchedFields.push(field);
    }
  });

  return matchedFields;
}

function generateCacheKey(input: SearchCardInput): string {
  return `search:${JSON.stringify(input)}`;
}

async function getCachedResult(cacheKey: string): Promise<SearchCardData | null> {
  // TODO: 實現Redis緩存獲取
  return null;
}

async function cacheResult(cacheKey: string, result: SearchCardData, ttl: number): Promise<void> {
  // TODO: 實現Redis緩存存儲
}
