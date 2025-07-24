/**
 * SearchCard 基本功能測試
 * 驗證SearchCard GraphQL resolver的基本功能
 */

import { searchResolver } from '@/lib/graphql/resolvers/search.resolver';
import { 
  SearchMode, 
  SearchType, 
  SearchableEntity 
} from '@/types/generated/search-types';

describe('SearchCard 基本功能測試', () => {
  test('SearchResolver 應該正確導入', () => {
    expect(searchResolver).toBeDefined();
    expect(searchResolver.Query).toBeDefined();
    expect(searchResolver.Query.searchCard).toBeDefined();
    expect(searchResolver.Mutation).toBeDefined();
    expect(searchResolver.Mutation.saveSearchConfig).toBeDefined();
  });

  test('SearchResolver 應該包含必要的查詢', () => {
    const queryKeys = Object.keys(searchResolver.Query);
    expect(queryKeys).toContain('searchCard');
    expect(queryKeys).toContain('searchSuggestions');
    expect(queryKeys).toContain('searchHistory');
    expect(queryKeys).toContain('searchConfigs');
    expect(queryKeys).toContain('searchAnalytics');
  });

  test('SearchResolver 應該包含必要的mutations', () => {
    const mutationKeys = Object.keys(searchResolver.Mutation);
    expect(mutationKeys).toContain('saveSearchConfig');
    expect(mutationKeys).toContain('deleteSearchConfig');
    expect(mutationKeys).toContain('clearSearchHistory');
    expect(mutationKeys).toContain('updateSearchPreferences');
  });

  test('SearchMode 枚舉應該有正確的值', () => {
    expect(SearchMode.Global).toBe('GLOBAL');
    expect(SearchMode.Entity).toBe('ENTITY');
  });

  test('SearchType 枚舉應該有正確的值', () => {
    expect(SearchType.Text).toBe('TEXT');
    expect(SearchType.Code).toBe('CODE');
  });

  test('SearchableEntity 枚舉應該有正確的值', () => {
    expect(SearchableEntity.Product).toBe('PRODUCT');
    expect(SearchableEntity.Pallet).toBe('PALLET');
  });
});

describe('SearchCard GraphQL Schema 驗證', () => {
  test('應該能夠驗證SearchCard schema已正確定義', async () => {
    // 這裡我們只驗證resolver結構
    expect(typeof searchResolver.Query.searchCard).toBe('function');
    expect(typeof searchResolver.Query.searchSuggestions).toBe('function');
    expect(typeof searchResolver.Mutation.saveSearchConfig).toBe('function');
  });

  test('searchCard 查詢應該正確處理認證錯誤', async () => {
    const mockContext = {
      user: null, // 未認證用戶
      requestId: 'test-123'
    };

    const input = {
      query: 'test',
      mode: SearchMode.Global,
      entities: [SearchableEntity.Product]
    };

    await expect(
      searchResolver.Query.searchCard(null, { input }, mockContext as any)
    ).rejects.toThrow('User not authenticated');
  });
});

// Export types for use in other tests
export { SearchMode, SearchType, SearchableEntity };