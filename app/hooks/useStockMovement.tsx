import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { toast } from 'sonner';

interface PalletInfo {
  plt_num: string;
  product_code: string;
  product_qty: number;
  plt_remark?: string | null;
  current_plt_loc?: string | null;
}

interface ActivityLogEntry {
  message: string;
  type: 'success' | 'error' | 'info';
  timestamp: string;
}

interface UseStockMovementOptions {
  enableCache?: boolean;
  debounceMs?: number;
  maxRetries?: number;
}

export const useStockMovement = (options: UseStockMovementOptions = {}) => {
  const {
    enableCache = true,
    debounceMs = 300,
    maxRetries = 3
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Cache and performance optimization
  const debounceTimer = useRef<NodeJS.Timeout>();

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

  // Search pallet information
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
  }, [supabase]);

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
      const { error: transferError } = await supabase
        .from('record_transfer')
        .insert([{
          plt_num: pltNum,
          operator_id: operatorIdNum,
          tran_date: new Date().toISOString(),
          f_loc: fromLocation,
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

      addActivityLog(`Pallet ${pltNum} moved successfully: ${fromLocation} → ${toLocation}`, 'success');
      toast.success(`Pallet ${pltNum} moved to ${toLocation}`);
      
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
      
      addActivityLog(`Pallet ${pltNum} movement failed: ${errorMessage}`, 'error');
      toast.error(`Movement failed: ${errorMessage}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId, supabase]);

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
    
    // Methods
    searchPalletInfo,
    executeStockTransfer,
    addActivityLog,
    clearActivityLog,
    debouncedSearch
  };
}; 