/**
 * SearchCard GraphQL Resolver 測試
 * 驗證搜索功能的基本操作
 */

import { searchResolver } from '@/lib/graphql/resolvers/search.resolver';
import { GraphQLContext as Context } from '@/lib/graphql/resolvers/index';
import { 
  SearchMode, 
  SearchType, 
  SearchableEntity,
  SearchCardInput 
} from '@/types/generated/search-types';

// 模擬 Context
const mockContext = {
  user: {
    id: 'test-user-1',
    email: 'test@example.com',
    role: 'VIEWER',
    isSupervisor: false
  },
  db: {
    query: jest.fn().mockResolvedValue({ rows: [] })
  },
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null })
  },
  requestId: 'test-request-id'
} as any;

describe('SearchCard GraphQL Resolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Query.searchCard', () => {
    test('應該成功執行基本產品搜索', async () => {
      // 準備測試數據
      const mockProductResults = {
        rows: [
          {
            code: 'TEST001',
            description: 'Test Product',
            colour: 'Red',
            type: 'A',
            standard_qty: 100,
            remark: 'Test remark',
            latest_update: new Date(),
            relevance_score: 100
          }
        ]
      };

      (mockContext.db!.query as jest.Mock).mockResolvedValue(mockProductResults);

      const input = {
        query: 'test',
        mode: SearchMode.Entity,
        type: SearchType.Text,
        entities: [SearchableEntity.Product],
        pagination: { page: 1, limit: 20 },
        options: {
          enableFuzzySearch: true,
          enableHighlight: true,
          saveToHistory: false,
          includeAnalytics: false,
          includeHistory: false
        }
      };

      const result = await searchResolver.Query.searchCard(
        null,
        { input },
        mockContext as Context
      );

      expect(result).toBeDefined();
      expect(result.searchMeta).toBeDefined();
      expect(result.searchMeta.query).toBe('test');
      expect(result.searchMeta.entities).toContain(SearchableEntity.Product);
      expect(result.results).toBeDefined();
      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    test('應該正確檢測搜索類型', async () => {
      const { detectSearchType } = require('@/lib/graphql/resolvers/search.resolver');
      
      // 測試不同搜索模式的檢測
      expect(detectSearchType('PM-240615')).toBe(SearchType.Code);
      expect(detectSearchType('240615/1')).toBe(SearchType.Code);
      expect(detectSearchType('12345678')).toBe(SearchType.Barcode);
      expect(detectSearchType('test product')).toBe(SearchType.Text);
      expect(detectSearchType('category:electronics')).toBe(SearchType.Advanced);
    });

    test('應該驗證輸入參數', async () => {
      const invalidInput = {
        query: '', // 空查詢
        mode: SearchMode.Global,
        entities: []
      };

      await expect(
        searchResolver.Query.searchCard(
          null,
          { input: invalidInput },
          mockContext as Context
        )
      ).rejects.toThrow('Search query cannot be empty');
    });

    test('應該要求認證', async () => {
      const unauthenticatedContext = {
        ...mockContext,
        user: undefined
      };

      const input = {
        query: 'test',
        mode: SearchMode.Global,
        entities: [SearchableEntity.Product]
      };

      await expect(
        searchResolver.Query.searchCard(
          null,
          { input },
          unauthenticatedContext as Context
        )
      ).rejects.toThrow('User not authenticated');
    });
  });

  describe('Query.searchSuggestions', () => {
    test('應該返回搜索建議', async () => {
      const mockSuggestionResults = {
        rows: [
          {
            code: 'PRODUCT001',
            description: 'Product Description',
            score_modifier: 0
          }
        ]
      };

      (mockContext.db!.query as jest.Mock).mockResolvedValue(mockSuggestionResults);

      const result = await searchResolver.Query.searchSuggestions(
        null,
        { query: 'prod', entity: SearchableEntity.Product, limit: 5 },
        mockContext as Context
      );

      expect(Array.isArray(result)).toBe(true);
      expect(mockContext.db!.query).toHaveBeenCalled();
    });
  });

  describe('Mutation.saveSearchConfig', () => {
    test('應該保存搜索配置', async () => {
      const mockInsertResult = {
        rows: [{ id: 'new-config-id' }]
      };

      const mockSelectResult = {
        rows: [{
          id: 'new-config-id',
          name: 'Test Config',
          query: 'test query',
          entities: JSON.stringify([SearchableEntity.Product]),
          filters: JSON.stringify({}),
          is_default: false,
          is_public: false,
          created_by: 'test-user-1',
          created_at: new Date(),
          updated_at: new Date(),
          usage_count: 0
        }]
      };

      (mockContext.db!.query as jest.Mock)
        .mockResolvedValueOnce(mockInsertResult)
        .mockResolvedValueOnce(mockSelectResult);

      const input = {
        name: 'Test Config',
        query: 'test query',
        entities: [SearchableEntity.Product],
        filters: {},
        isDefault: false,
        isPublic: false
      };

      const result = await searchResolver.Mutation.saveSearchConfig(
        null,
        { input },
        mockContext as Context
      );

      expect(result).toBeDefined();
      expect(result.id).toBe('new-config-id');
      expect(result.name).toBe('Test Config');
      expect(mockContext.db!.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('搜索處理器', () => {
    test('應該正確處理產品搜索', async () => {
      const { handleProductSearch } = require('@/lib/graphql/resolvers/search.resolver');
      
      const mockResults = {
        rows: [
          {
            code: 'TEST001',
            description: 'Test Product',
            colour: 'Red',
            type: 'A',
            standard_qty: 100,
            remark: 'Test remark',
            latest_update: new Date(),
            relevance_score: 100
          }
        ]
      };

      (mockContext.db!.query as jest.Mock).mockResolvedValue(mockResults);

      const input = {
        query: 'test',
        filters: {
          productFilters: {
            colours: ['Red'],
            isActive: true
          }
        }
      };

      const result = await handleProductSearch(input, mockContext as Context);

      expect(result).toBeDefined();
      expect(result.entity).toBe(SearchableEntity.Product);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('Test Product');
    });

    test('應該正確處理托盤搜索', async () => {
      const { handlePalletSearch } = require('@/lib/graphql/resolvers/search.resolver');
      
      const mockResults = {
        rows: [
          {
            plt_num: '240615/1',
            series: 'PM-240615',
            product_code: 'TEST001',
            product_qty: 100,
            generate_time: new Date(),
            plt_remark: 'Test pallet',
            product_description: 'Test Product',
            relevance_score: 100
          }
        ]
      };

      (mockContext.db!.query as jest.Mock).mockResolvedValue(mockResults);

      const input = {
        query: '240615/1',
        filters: {}
      };

      const result = await handlePalletSearch(input, mockContext as Context);

      expect(result).toBeDefined();
      expect(result.entity).toBe(SearchableEntity.Pallet);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('240615/1');
    });
  });

  describe('工具函數', () => {
    test('應該正確生成緩存鍵', () => {
      const { generateCacheKey } = require('@/lib/graphql/resolvers/search.resolver');
      
      const input = {
        query: 'test',
        mode: SearchMode.Global,
        entities: [SearchableEntity.Product]
      };

      const cacheKey = generateCacheKey(input);
      expect(typeof cacheKey).toBe('string');
      expect(cacheKey).toContain('search:');
    });

    test('應該正確建議實體', () => {
      const { suggestEntities } = require('@/lib/graphql/resolvers/search.resolver');
      
      // 測試不同查詢的實體建議
      const productSuggestions = suggestEntities('product', SearchType.Text);
      expect(productSuggestions).toContain(SearchableEntity.Product);

      const palletSuggestions = suggestEntities('PM-240615', SearchType.Code);
      expect(palletSuggestions).toContain(SearchableEntity.Pallet);

      const emailSuggestions = suggestEntities('test@example.com', SearchType.Text);
      expect(emailSuggestions).toContain(SearchableEntity.User);
    });
  });
});

describe('搜索性能測試', () => {
  test('搜索應該在合理時間內完成', async () => {
    const startTime = Date.now();

    const input = {
      query: 'test',
      mode: SearchMode.Global,
      entities: [SearchableEntity.Product],
      options: {
        timeoutMs: 1000
      }
    };

    // 模擬快速響應
    (mockContext.db!.query as jest.Mock).mockResolvedValue({ rows: [] });

    await searchResolver.Query.searchCard(
      null,
      { input },
      mockContext as Context
    );

    const executionTime = Date.now() - startTime;
    expect(executionTime).toBeLessThan(1000); // 應該在1秒內完成
  });
});

describe('錯誤處理', () => {
  test('應該處理數據庫錯誤', async () => {
    const dbError = new Error('Database connection failed');
    (mockContext.db!.query as jest.Mock).mockRejectedValue(dbError);

    const input = {
      query: 'test',
      mode: SearchMode.Global,
      entities: [SearchableEntity.Product]
    };

    await expect(
      searchResolver.Query.searchCard(
        null,
        { input },
        mockContext as Context
      )
    ).rejects.toThrow('Search failed');
  });

  test('應該處理無效查詢', async () => {
    const input = {
      query: 'a'.repeat(1001), // 超過1000字符限制
      mode: SearchMode.Global,
      entities: [SearchableEntity.Product]
    };

    await expect(
      searchResolver.Query.searchCard(
        null,
        { input },
        mockContext as Context
      )
    ).rejects.toThrow('Search query too long');
  });
});