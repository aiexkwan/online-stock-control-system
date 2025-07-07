import { useState, useCallback, useRef, useEffect } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { createInventoryService } from '@/lib/inventory/services';
import type { PalletSearchResult, PalletInfoWithLocation } from '@/lib/inventory/types';
import { detectSearchType } from '@/app/utils/palletSearchUtils';

interface UseUnifiedPalletSearchOptions {
  autoDetectType?: boolean;
  cacheTimeout?: number;
}

interface SearchCache {
  [key: string]: {
    result: PalletSearchResult;
    timestamp: number;
  };
}

/**
 * Pallet search hook using unified inventory service
 * Provides caching and auto-detection features
 */
export const useUnifiedPalletSearch = (options: UseUnifiedPalletSearchOptions = {}) => {
  const { autoDetectType = true, cacheTimeout = 5 * 60 * 1000 } = options; // 5 minutes default cache
  
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<PalletInfoWithLocation | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  const inventoryServiceRef = useRef<ReturnType<typeof createInventoryService>>();
  const searchCacheRef = useRef<SearchCache>({});

  // Initialize inventory service
  useEffect(() => {
    const supabase = createClient();
    inventoryServiceRef.current = createInventoryService(supabase);
  }, []);

  // Clear expired cache entries
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const cache = searchCacheRef.current;
      
      Object.keys(cache).forEach(key => {
        if (now - cache[key].timestamp > cacheTimeout) {
          delete cache[key];
        }
      });
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [cacheTimeout]);

  /**
   * Search for a pallet using unified service
   */
  const searchPallet = useCallback(async (
    searchValue: string,
    searchType?: 'series' | 'pallet_num'
  ): Promise<PalletInfoWithLocation | null> => {
    if (!inventoryServiceRef.current) {
      setSearchError('Service not initialized');
      return null;
    }

    if (!searchValue?.trim()) {
      setSearchError('Search value is required');
      return null;
    }

    const trimmedValue = searchValue.trim();
    
    // Auto-detect search type if not provided
    let finalSearchType: 'series' | 'pallet_num';
    if (searchType) {
      finalSearchType = searchType;
    } else if (autoDetectType) {
      const detected = detectSearchType(trimmedValue);
      finalSearchType = detected === 'pallet_num' ? 'pallet_num' : 'series';
    } else {
      finalSearchType = 'pallet_num'; // Default
    }

    // Check cache
    const cacheKey = `${finalSearchType}:${trimmedValue}`;
    const cached = searchCacheRef.current[cacheKey];
    
    if (cached && Date.now() - cached.timestamp < cacheTimeout) {
      setSearchResult(cached.result.pallet);
      setSearchError(cached.result.error || null);
      return cached.result.pallet;
    }

    try {
      setIsSearching(true);
      setSearchError(null);
      
      // Execute search
      const result = await inventoryServiceRef.current.searchPallet(finalSearchType, trimmedValue);
      
      // Update cache
      searchCacheRef.current[cacheKey] = {
        result,
        timestamp: Date.now()
      };
      
      // Update state
      setSearchResult(result.pallet);
      setSearchError(result.error || null);
      
      return result.pallet;
    } catch (error: any) {
      console.error('[useUnifiedPalletSearch] Search error:', error);
      const errorMessage = error.message || 'Search failed';
      setSearchError(errorMessage);
      setSearchResult(null);
      return null;
    } finally {
      setIsSearching(false);
    }
  }, [autoDetectType, cacheTimeout]);

  /**
   * Search by product code
   */
  const searchByProductCode = useCallback(async (
    productCode: string
  ): Promise<PalletInfoWithLocation[]> => {
    if (!inventoryServiceRef.current) {
      setSearchError('Service not initialized');
      return [];
    }

    try {
      setIsSearching(true);
      setSearchError(null);
      
      // Direct call to pallet service
      const palletService = (inventoryServiceRef.current as any).palletService;
      const results = await palletService.searchByProductCode(productCode);
      
      // Add location info to results
      const resultsWithLocation = await Promise.all(
        results.map(async (pallet: any) => {
          const location = await palletService.getCurrentLocation(pallet.plt_num);
          return {
            ...pallet,
            location,
            locationDisplay: location || 'Unknown'
          };
        })
      );
      
      return resultsWithLocation;
    } catch (error: any) {
      console.error('[useUnifiedPalletSearch] Search by product code error:', error);
      setSearchError(error.message || 'Search failed');
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  /**
   * Batch search multiple pallets
   */
  const batchSearchPallets = useCallback(async (
    searches: Array<{ value: string; type?: 'series' | 'pallet_num' }>
  ): Promise<Map<string, PalletInfoWithLocation | null>> => {
    if (!inventoryServiceRef.current) {
      return new Map();
    }

    const results = new Map<string, PalletInfoWithLocation | null>();
    
    try {
      setIsSearching(true);
      
      // Process searches in parallel
      const promises = searches.map(async ({ value, type }) => {
        const result = await searchPallet(value, type);
        return { value, result };
      });
      
      const searchResults = await Promise.all(promises);
      
      // Build results map
      searchResults.forEach(({ value, result }) => {
        results.set(value, result);
      });
      
      return results;
    } catch (error: any) {
      console.error('[useUnifiedPalletSearch] Batch search error:', error);
      return results;
    } finally {
      setIsSearching(false);
    }
  }, [searchPallet]);

  /**
   * Clear search results and error
   */
  const clearSearch = useCallback(() => {
    setSearchResult(null);
    setSearchError(null);
  }, []);

  /**
   * Clear cache
   */
  const clearCache = useCallback(() => {
    searchCacheRef.current = {};
  }, []);

  /**
   * Validate pallet
   */
  const validatePallet = useCallback(async (palletNum: string): Promise<{
    valid: boolean;
    pallet?: PalletInfoWithLocation;
    error?: string;
  }> => {
    if (!inventoryServiceRef.current) {
      return { valid: false, error: 'Service not initialized' };
    }

    try {
      const result = await inventoryServiceRef.current.validatePallet(palletNum);
      return result;
    } catch (error: any) {
      return { valid: false, error: error.message || 'Validation failed' };
    }
  }, []);

  return {
    isSearching,
    searchResult,
    searchError,
    searchPallet,
    searchByProductCode,
    batchSearchPallets,
    clearSearch,
    clearCache,
    validatePallet
  };
};