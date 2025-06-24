import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { toast } from 'sonner';
import { usePalletCache } from './usePalletCache';
import { usePalletSearch } from './usePalletSearch';
import { useStockTransfer } from './useStockTransfer';
import { useActivityLog } from './useActivityLog';
import type { PalletInfo } from '@/app/services/palletSearchService';

// 使用統一的 PalletInfo 類型（從服務導入）
// 這裡的重複定義是為了保持向後兼容

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

export const useStockMovement = (options: UseStockMovementOptions = {}) => {
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
        } else {
          // AuthChecker middleware will handle authentication
        }
      } catch (error) {
        console.error('[useStockMovement] Error initializing user:', error);
        // AuthChecker middleware will handle authentication
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

  // Search pallet information (with cache support)
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
      
      // 如果啟用快取，使用快取查詢
      if (enableCache) {
        const cachedResult = await searchPalletWithCache(searchType, searchValue, true);
        if (cachedResult) {
          return cachedResult;
        }
      }
      
      // 如果未啟用快取或快取未命中，使用原始查詢
      // First, get pallet basic information from record_palletinfo
      let palletData, palletError;

      if (searchType === 'series') {
        // 搜尋系列號：使用 record_palletinfo.series 欄位
        const { data, error } = await supabase
          .from('record_palletinfo')
          .select('plt_num, product_code, product_qty, plt_remark, series')
          .eq('series', searchValue.trim())
          .single();
        palletData = data;
        palletError = error;
      } else {
        // 搜尋托盤號：使用 record_palletinfo.plt_num 欄位
        const { data, error } = await supabase
          .from('record_palletinfo')
          .select('plt_num, product_code, product_qty, plt_remark, series')
          .eq('plt_num', searchValue.trim())
          .single();
        palletData = data;
        palletError = error;
      }

      if (palletError || !palletData) {
        if (palletError?.code === 'PGRST116' || !palletData) {
          const searchTypeText = searchType === 'series' ? 'Series' : 'Pallet number';
          toast.error(`${searchTypeText} ${searchValue} not found`);
        } else if (palletError) {
          throw palletError;
        }
        return null;
      }

      // Get the latest location from record_history
      const { data: historyData, error: historyError } = await supabase
        .from('record_history')
        .select('loc')
        .eq('plt_num', palletData.plt_num)
        .order('time', { ascending: false })
        .limit(1);

      let currentLocation = 'Await'; // Default location
      if (!historyError && historyData && historyData.length > 0) {
        currentLocation = historyData[0].loc || 'Await';
      }

      return {
        plt_num: palletData.plt_num,
        product_code: palletData.product_code,
        product_qty: palletData.product_qty,
        plt_remark: palletData.plt_remark,
        current_plt_loc: currentLocation
      };
    } catch (error: any) {
      console.error('Failed to search pallet information:', error);
      toast.error(`Pallet search failed: ${error.message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [supabase, enableCache, searchPalletWithCache]);

  // Execute stock transfer
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
    
    // 2. 立即更新快取（樂觀）
    if (enableCache) {
      const cachedPallet = await searchPalletWithCache('pallet_num', pltNum, false);
      if (cachedPallet) {
        // 更新快取中的位置
        invalidateCache(pltNum); // 先使原快取失效
        // 注意：這裡不預先設置新位置，避免快取不一致
      }
    }
    
    // 3. 顯示進行中的 toast
    const toastId = toast.loading(`Moving pallet ${pltNum} to ${toLocation}...`);

    try {
      setIsLoading(true);
      
      // 首先驗證 operator ID 是否存在於 data_id 表中
      const { data: operatorData, error: operatorError } = await supabase
        .from('data_id')
        .select('id')
        .eq('id', operatorIdNum)
        .single();

      if (operatorError || !operatorData) {
        throw new Error(`Operator ID ${operatorIdNum} not found in system`);
      }
      
      // Since the RPC function has issues with plt_loc column, we'll implement the transfer logic directly
      // 1. Add history record for the transfer
      const { error: historyError } = await supabase
        .from('record_history')
        .insert([{
          id: operatorIdNum,
          action: 'Stock Transfer',
          plt_num: pltNum,
          loc: toLocation,
          remark: `Moved from ${fromLocation} to ${toLocation}`,
          time: new Date().toISOString()
        }]);

      if (historyError) {
        throw new Error(`Failed to record history: ${historyError.message}`);
      }

      // 2. Add record to record_transfer table
      // 統一處理 await_grn 和 await 為 await
      const normalizedFromLocation = fromLocation === 'Await_grn' ? 'Await' : fromLocation;
      
      const { error: transferError } = await supabase
        .from('record_transfer')
        .insert([{
          plt_num: pltNum,
          operator_id: operatorIdNum,
          tran_date: new Date().toISOString(),
          f_loc: normalizedFromLocation,
          t_loc: toLocation
        }]);

      if (transferError) {
        throw new Error(`Failed to record transfer: ${transferError.message}`);
      }

      // 3. Update inventory records
      // Map location names to inventory column names
      const locationToColumn: { [key: string]: string } = {
        'Production': 'injection',
        'PipeLine': 'pipeline', 
        'Pre-Book': 'prebook',
        'Await': 'await',
        'Await_grn': 'await_grn',
        'Fold Mill': 'fold',
        'Bulk Room': 'bulk',
        'Back Car Park': 'backcarpark'
      };

      const fromColumn = locationToColumn[fromLocation];
      const toColumn = locationToColumn[toLocation];

      if (!fromColumn || !toColumn) {
        throw new Error(`Invalid location mapping: ${fromLocation} → ${toLocation}`);
      }

      // Create inventory movement record (subtract from source, add to destination)
      const { error: inventoryError } = await supabase
        .from('record_inventory')
        .insert([{
          product_code: productCode,
          plt_num: pltNum,
          [fromColumn]: -productQty,  // Subtract from source
          [toColumn]: productQty,     // Add to destination
          latest_update: new Date().toISOString()
        }]);

      if (inventoryError) {
        throw new Error(`Failed to update inventory: ${inventoryError.message}`);
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
      
      // 🚀 新增：更新 work_level 表的 move 欄位
      try {
        console.log('[useStockMovement] 更新員工 Move 工作量記錄...', {
          operatorId: operatorIdNum,
          moveCount: 1
        });

        const { data: workLevelData, error: workLevelError } = await supabase.rpc('update_work_level_move', {
          p_user_id: operatorIdNum,
          p_move_count: 1
        });

        if (workLevelError) {
          console.error('[useStockMovement] Work level move 更新失敗:', workLevelError);
          // 移除活動日誌顯示，只保留控制台日誌
        } else {
          console.log('[useStockMovement] Work level move 更新成功:', workLevelData);
          // 移除活動日誌顯示，只保留控制台日誌
        }
      } catch (workLevelError: any) {
        console.error('[useStockMovement] Work level move 更新異常:', workLevelError);
        // 移除活動日誌顯示，只保留控制台日誌
      }
      
      return true;
    } catch (error: any) {
      console.error('Stock transfer failed:', error);
      let errorMessage = error.message || 'Unknown error';
      
      if (errorMessage.startsWith('ATOMIC_TRANSFER_FAILURE:')) {
        errorMessage = errorMessage.replace('ATOMIC_TRANSFER_FAILURE:', '').trim();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, supabase, enableCache, invalidateCache, searchPalletWithCache, optimisticTransfers, addActivityLog]);

  // Add activity log
  const addActivityLog = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const newEntry: ActivityLogEntry = {
      message,
      type,
      timestamp: new Date().toLocaleString('en-US')
    };
    setActivityLog(prev => [newEntry, ...prev].slice(0, 100)); // Keep last 100 records
  }, []);

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