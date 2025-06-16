import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { palletSearchService, type PalletInfo, type SearchParams } from '@/app/services/palletSearchService';
import { detectSearchType } from '@/app/utils/palletSearchUtils';
import { usePalletCache } from './usePalletCache';

interface UsePalletSearchOptions {
  enableCache?: boolean;
  cacheOptions?: {
    ttl?: number;
    maxSize?: number;
  };
  onSearchComplete?: (pallet: PalletInfo | null) => void;
  checkVoided?: boolean;
}

/**
 * 可重用的托盤搜尋 Hook
 * 統一了所有托盤搜尋邏輯，可在任何組件中使用
 */
export const usePalletSearch = (options: UsePalletSearchOptions = {}) => {
  const {
    enableCache = true,
    cacheOptions = {},
    onSearchComplete,
    checkVoided = false
  } = options;

  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);

  // 使用快取 hook
  const {
    searchPalletWithCache,
    invalidateCache,
    getCacheStats
  } = usePalletCache({
    ttl: cacheOptions.ttl || 5 * 60 * 1000,
    maxSize: cacheOptions.maxSize || 100,
    enableBackgroundRefresh: true
  });

  /**
   * 搜尋托盤（支援自動檢測類型）
   */
  const searchPallet = useCallback(async (
    searchValue: string,
    explicitSearchType?: 'series' | 'pallet_num'
  ): Promise<PalletInfo | null> => {
    // 取消之前的搜尋
    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
    }

    // 創建新的 AbortController
    searchAbortRef.current = new AbortController();

    if (!searchValue.trim()) {
      setSearchError('Please enter a value to search');
      return null;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      // 自動檢測搜尋類型（如果沒有明確指定）
      const searchType = explicitSearchType || detectSearchType(searchValue);
      
      if (searchType === 'unknown' && !explicitSearchType) {
        setSearchError('Invalid format. Please enter a valid pallet number or series.');
        return null;
      }

      let result: PalletInfo | null = null;

      // 如果啟用快取，先嘗試從快取獲取
      if (enableCache) {
        result = await searchPalletWithCache(
          searchType === 'unknown' ? 'pallet_num' : searchType,
          searchValue,
          true // 使用優化查詢
        );
      }

      // 如果快取未命中，使用服務搜尋
      if (!result) {
        const searchResult = await palletSearchService.searchPallet({
          searchType: searchType === 'unknown' ? 'pallet_num' : searchType,
          searchValue,
          checkVoided
        });

        if (!searchResult.success) {
          setSearchError(searchResult.error || 'Search failed');
          return null;
        }

        result = searchResult.data || null;
      }

      // 檢查是否已作廢
      if (result && checkVoided && result.is_voided) {
        setSearchError('This pallet has been voided and cannot be used');
        return null;
      }

      // 調用完成回調
      if (onSearchComplete) {
        onSearchComplete(result);
      }

      return result;
    } catch (error: any) {
      // 如果是取消操作，不顯示錯誤
      if (error.name === 'AbortError') {
        return null;
      }

      console.error('Pallet search failed:', error);
      const errorMessage = error.message || 'Search failed';
      setSearchError(errorMessage);
      toast.error(`Search failed: ${errorMessage}`);
      return null;
    } finally {
      setIsSearching(false);
    }
  }, [enableCache, searchPalletWithCache, checkVoided, onSearchComplete]);

  /**
   * 批量搜尋托盤
   */
  const batchSearchPallets = useCallback(async (
    palletNumbers: string[]
  ): Promise<PalletInfo[]> => {
    setIsSearching(true);
    setSearchError(null);

    try {
      const results = await palletSearchService.batchSearchPallets(palletNumbers);
      return results;
    } catch (error: any) {
      console.error('Batch search failed:', error);
      setSearchError('Batch search failed');
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  /**
   * 清除搜尋錯誤
   */
  const clearError = useCallback(() => {
    setSearchError(null);
  }, []);

  /**
   * 取消當前搜尋
   */
  const cancelSearch = useCallback(() => {
    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
      searchAbortRef.current = null;
    }
    setIsSearching(false);
  }, []);

  return {
    // 狀態
    isSearching,
    searchError,
    
    // 方法
    searchPallet,
    batchSearchPallets,
    clearError,
    cancelSearch,
    
    // 快取相關
    invalidateCache,
    getCacheStats
  };
};