import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { toast } from 'sonner';
import { usePalletCache } from './usePalletCache';
import type { PalletInfo } from '@/app/services/palletSearchService';
import { LOCATION_TO_COLUMN } from '@/app/constants/locations';

interface ActivityLogEntry {
  message: string;
  type: 'success' | 'error' | 'info';
  timestamp: string;
}

// 樂觀更新的轉移狀態
interface OptimisticTransfer {
  id: string;
  pltNum: string;
  fromLocation: string;
  toLocation: string;
  status: 'pending' | 'success' | 'failed';
  timestamp: number;
}

interface UseStockMovementOptions {
  enableCache?: boolean;
  debounceMs?: number;
  maxRetries?: number;
  cacheOptions?: {
    ttl?: number;
    maxSize?: number;
    preloadPatterns?: string[];
    enableBackgroundRefresh?: boolean;
  };
}

/**
 * useStockMovementRPC - 使用 RPC 實現嘅 Stock Movement Hook
 * 將原本 5 個獨立 SQL 操作合併成一個原子性事務
 */
export const useStockMovementRPC = (options: UseStockMovementOptions = {}) => {
  const {
    enableCache = true,
    debounceMs = 300,
    maxRetries = 3,
    cacheOptions = {}
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [optimisticTransfers, setOptimisticTransfers] = useState<OptimisticTransfer[]>([]);
  
  // Cache and performance optimization
  const debounceTimer = useRef<NodeJS.Timeout>();
  
  // 使用快取 hook
  const {
    searchPalletWithCache,
    preloadPallets,
    invalidateCache,
    getCacheStats
  } = usePalletCache({
    ttl: cacheOptions.ttl || 5 * 60 * 1000, // 5分鐘
    maxSize: cacheOptions.maxSize || 100,
    preloadPatterns: cacheOptions.preloadPatterns || [],
    enableBackgroundRefresh: cacheOptions.enableBackgroundRefresh ?? true
  });

  const getCurrentUserId = useCallback(async (): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.email) {
        // Extract clock number from email (format: clocknumber@pennine.com)
        return user.email.split('@')[0];
      }
      return null;
    } catch (error) {
      console.error('Error getting current user ID:', error);
      return null;
    }
  }, [supabase]);

  // Initialize user ID from Supabase Auth
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const clockNumber = await getCurrentUserId();
        if (clockNumber) {
          setUserId(clockNumber);
        }
      } catch (error) {
        console.error('[useStockMovementRPC] Error initializing user:', error);
      }
    };
    
    initializeUser();
  }, [getCurrentUserId]);

  // Debounced search function
  const debouncedSearch = useCallback((searchTerm: string, callback: (term: string) => void) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      callback(searchTerm);
    }, debounceMs);
  }, [debounceMs]);

  // Search pallet information using RPC
  const searchPalletInfo = useCallback(async (
    searchType: 'series' | 'pallet_num',
    searchValue: string
  ): Promise<PalletInfo | null> => {
    if (!searchValue.trim()) {
      toast.info(`Please enter ${searchType === 'series' ? 'series number' : 'pallet number'}`);
      return null;
    }

    try {
      setIsLoading(true);
      
      // 如果啟用快取，先檢查快取
      if (enableCache) {
        const cachedResult = await searchPalletWithCache(searchType, searchValue, true);
        if (cachedResult) {
          return cachedResult;
        }
      }
      
      // 使用新的 RPC function 查詢
      const { data, error } = await supabase.rpc('search_pallet_info', {
        p_search_type: searchType,
        p_search_value: searchValue.trim()
      });

      if (error) {
        throw error;
      }

      if (!data?.success) {
        toast.error(data?.message || `${searchType === 'series' ? 'Series' : 'Pallet'} not found`);
        return null;
      }

      const palletInfo = data.data as PalletInfo;
      
      // 更新快取
      if (enableCache && palletInfo) {
        invalidateCache(palletInfo.plt_num);
        if (palletInfo.series) {
          invalidateCache(palletInfo.series);
        }
      }

      return palletInfo;
    } catch (error: any) {
      console.error('Failed to search pallet information:', error);
      toast.error(`Pallet search failed: ${error.message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [supabase, enableCache, searchPalletWithCache, invalidateCache]);

  // Add activity log
  const addActivityLog = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const newEntry: ActivityLogEntry = {
      message,
      type,
      timestamp: new Date().toLocaleString('en-US')
    };
    setActivityLog(prev => [newEntry, ...prev].slice(0, 100)); // Keep last 100 records
  }, []);

  // Execute stock transfer using RPC (原子性事務)
  const executeStockTransfer = useCallback(async (
    pltNum: string,
    productCode: string,
    productQty: number,
    fromLocation: string,
    toLocation: string,
    clockNumber?: string  // 添加可選的 clockNumber 參數
  ): Promise<boolean> => {
    // 使用傳入的 clockNumber 或現有的 userId
    const operatorId = clockNumber || userId;
    
    if (!operatorId) {
      toast.error('Valid operator ID required for stock transfer');
      return false;
    }

    // 驗證 operator ID 是否為有效數字
    const operatorIdNum = parseInt(operatorId, 10);
    if (isNaN(operatorIdNum)) {
      toast.error('Invalid operator ID format');
      return false;
    }

    // 生成唯一的轉移 ID
    const transferId = `${pltNum}-${Date.now()}`;
    
    // 檢查是否有待處理的相同托盤操作
    const hasPendingTransfer = optimisticTransfers.some(
      t => t.pltNum === pltNum && t.status === 'pending'
    );
    
    if (hasPendingTransfer) {
      toast.warning(`Pallet ${pltNum} has a pending transfer. Please wait.`);
      return false;
    }
    
    // 1. 樂觀更新：立即更新 UI
    const optimisticEntry: OptimisticTransfer = {
      id: transferId,
      pltNum,
      fromLocation,
      toLocation,
      status: 'pending',
      timestamp: Date.now()
    };
    
    setOptimisticTransfers(prev => [...prev, optimisticEntry]);
    
    // 2. 立即使快取失效
    if (enableCache) {
      invalidateCache(pltNum);
    }
    
    // 3. 顯示進行中的 toast
    const toastId = toast.loading(`Moving pallet ${pltNum} to ${toLocation}...`);

    try {
      setIsLoading(true);
      
      // 使用新的 RPC function 執行原子性轉移
      const { data, error } = await supabase.rpc('execute_stock_transfer', {
        p_plt_num: pltNum,
        p_product_code: productCode,
        p_product_qty: productQty,
        p_from_location: fromLocation,
        p_to_location: toLocation,
        p_operator_id: operatorIdNum
      });

      if (error) {
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.message || 'Stock transfer failed');
      }

      // 4. 成功：更新樂觀狀態
      setOptimisticTransfers(prev => 
        prev.map(t => t.id === transferId ? { ...t, status: 'success' } : t)
      );
      
      addActivityLog(`Pallet ${pltNum} successfully moved to ${toLocation}`, 'success');
      toast.success(`Pallet ${pltNum} moved to ${toLocation}`, { id: toastId });
      
      // 使快取失效，確保下次查詢取得最新資料
      if (enableCache) {
        invalidateCache(pltNum);
      }
      
      return true;
    } catch (error: any) {
      console.error('Stock transfer failed:', error);
      let errorMessage = error.message || 'Unknown error';
      
      // 處理特定錯誤代碼
      if (error.code === 'INVALID_OPERATOR') {
        errorMessage = 'Invalid operator ID';
      } else if (error.code === 'INVALID_LOCATION') {
        errorMessage = 'Invalid location mapping';
      }
      
      // 5. 失敗：更新樂觀狀態並回滾
      setOptimisticTransfers(prev => 
        prev.map(t => t.id === transferId ? { ...t, status: 'failed' } : t)
      );
      
      addActivityLog(`Pallet ${pltNum} movement failed: ${errorMessage}`, 'error');
      toast.error(`Movement failed: ${errorMessage}`, { id: toastId });
      
      // 回滾快取（如果需要）
      if (enableCache) {
        invalidateCache(pltNum);
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId, supabase, enableCache, invalidateCache, optimisticTransfers, addActivityLog]);

  // Clear activity log
  const clearActivityLog = useCallback(() => {
    setActivityLog([]);
  }, []);

  // 清理已完成的樂觀轉移
  useEffect(() => {
    const cleanup = setInterval(() => {
      setOptimisticTransfers(prev => 
        prev.filter(t => 
          t.status === 'pending' || 
          (Date.now() - t.timestamp) < 5000 // 保留 5 秒顯示成功/失敗狀態
        )
      );
    }, 1000);
    
    return () => clearInterval(cleanup);
  }, []);

  // Cleanup function
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return {
    // State
    isLoading,
    activityLog,
    userId,
    optimisticTransfers,
    
    // Methods
    searchPalletInfo,
    executeStockTransfer,
    addActivityLog,
    clearActivityLog,
    debouncedSearch,
    
    // Cache methods
    preloadPallets,
    invalidateCache,
    getCacheStats
  };
};