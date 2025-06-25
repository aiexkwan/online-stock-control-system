import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { toast } from 'sonner';
import { usePalletSearch } from './usePalletSearch';
import { useStockTransfer } from './useStockTransfer';
import { useActivityLog } from './useActivityLog';
import type { PalletInfo } from '@/app/services/palletSearchService';
import type { OptimisticTransfer } from './useStockTransfer';

// 為了向後兼容，保留原有的介面定義
interface ActivityLogEntry {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  timestamp: string;
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
 * useStockMovement V2 - 重構版本
 * 
 * 這是 useStockMovement 的重構版本，使用組合模式整合多個專門的 hooks。
 * 保持完全向後兼容，現有代碼無需修改即可使用。
 * 
 * 主要改進：
 * 1. 更好的關注點分離
 * 2. 更容易測試和維護
 * 3. 托盤搜尋邏輯可在其他地方重用
 * 4. 活動日誌可獨立使用
 */
export const useStockMovement = (options: UseStockMovementOptions = {}) => {
  const {
    enableCache = true,
    debounceMs = 300,
    maxRetries = 3,
    cacheOptions = {}
  } = options;

  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  // 使用組合的 hooks
  const {
    isSearching,
    searchError,
    searchPallet,
    invalidateCache,
    getCacheStats
  } = usePalletSearch({
    enableCache,
    cacheOptions: {
      ttl: cacheOptions.ttl,
      maxSize: cacheOptions.maxSize
    }
  });

  const {
    isTransferring,
    optimisticTransfers,
    executeTransfer,
    hasPendingTransfer
  } = useStockTransfer({
    onTransferComplete: (success, pltNum) => {
      if (enableCache) {
        invalidateCache(pltNum);
      }
    }
  });

  const {
    activityLog: activityLogEntries,
    addSuccess,
    addError,
    addInfo,
    clearLog: clearActivityLog
  } = useActivityLog({
    maxEntries: 100
  });

  // 獲取當前用戶 ID
  const getCurrentUserId = useCallback(async (): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.email) {
        return user.email.split('@')[0];
      }
      return null;
    } catch (error) {
      console.error('Error getting current user ID:', error);
      return null;
    }
  }, [supabase]);

  // 初始化用戶 ID
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const clockNumber = await getCurrentUserId();
        if (clockNumber) {
          setUserId(clockNumber);
        }
      } catch (error) {
        console.error('[useStockMovement] Error initializing user:', error);
      }
    };
    
    initializeUser();
  }, [getCurrentUserId]);

  // 搜尋托盤信息（保持原有介面）
  const searchPalletInfo = useCallback(async (
    searchType: 'series' | 'pallet_num',
    searchValue: string
  ): Promise<PalletInfo | null> => {
    if (!searchValue.trim()) {
      toast.info(`Please enter ${searchType === 'series' ? 'series number' : 'pallet number'}`);
      return null;
    }

    const result = await searchPallet(searchValue, searchType);
    
    if (!result && searchError) {
      toast.error(searchError);
    }
    
    return result;
  }, [searchPallet, searchError]);

  // 執行庫存轉移（保持原有介面）
  const executeStockTransfer = useCallback(async (
    pltNum: string,
    productCode: string,
    productQty: number,
    fromLocation: string,
    toLocation: string,
    clockNumber?: string
  ): Promise<boolean> => {
    const operatorId = clockNumber || userId;
    
    if (!operatorId) {
      toast.error('Valid operator ID required for stock transfer');
      return false;
    }

    // 創建 PalletInfo 對象
    const palletInfo: PalletInfo = {
      plt_num: pltNum,
      product_code: productCode,
      product_qty: productQty,
      current_plt_loc: fromLocation
    };

    const success = await executeTransfer(palletInfo, toLocation, operatorId);
    
    if (success) {
      addSuccess(`Pallet ${pltNum} moved successfully: ${fromLocation} → ${toLocation}`);
    } else {
      addError(`Pallet ${pltNum} movement failed`);
    }
    
    return success;
  }, [userId, executeTransfer, addSuccess, addError]);

  // 添加活動日誌（保持原有介面）
  const addActivityLog = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    switch (type) {
      case 'success':
        addSuccess(message);
        break;
      case 'error':
        addError(message);
        break;
      default:
        addInfo(message);
    }
  }, [addSuccess, addError, addInfo]);

  // 防抖搜尋功能
  const debouncedSearch = useCallback((searchTerm: string, callback: (term: string) => void) => {
    const timer = setTimeout(() => {
      callback(searchTerm);
    }, debounceMs);
    
    return () => clearTimeout(timer);
  }, [debounceMs]);

  // 預加載托盤（使用批量搜尋）
  const preloadPallets = useCallback(async (patterns: string[]): Promise<void> => {
    // 這個功能在新架構中通過快取自動實現
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[useStockMovement] Preload patterns:', patterns);
  }, []);

  // 轉換活動日誌格式（為了向後兼容）
  const activityLog: ActivityLogEntry[] = activityLogEntries;

  // 合併載入狀態
  const isLoading = isSearching || isTransferring;

  return {
    // 狀態（保持原有介面）
    isLoading,
    activityLog,
    userId,
    optimisticTransfers,
    
    // 方法（保持原有介面）
    searchPalletInfo,
    executeStockTransfer,
    addActivityLog,
    clearActivityLog,
    debouncedSearch,
    
    // 快取方法（保持原有介面）
    preloadPallets,
    invalidateCache,
    getCacheStats
  };
};