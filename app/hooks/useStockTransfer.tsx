import { useState, useCallback, useRef, useEffect } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { toast } from 'sonner';
import type { PalletInfo } from '@/app/services/palletSearchService';
import { LocationMapper } from '@/lib/inventory/utils/locationMapper';

// 樂觀更新的轉移狀態
export interface OptimisticTransfer {
  id: string;
  pltNum: string;
  fromLocation: string;
  toLocation: string;
  status: 'pending' | 'success' | 'failed';
  timestamp: number;
}

interface UseStockTransferOptions {
  onTransferComplete?: (success: boolean, pltNum: string) => void;
}

/**
 * 專門處理庫存轉移的 Hook
 * 從 useStockMovement 分離出來，專注於轉移邏輯
 */
export const useStockTransfer = (options: UseStockTransferOptions = {}) => {
  const { onTransferComplete } = options;
  
  const [isTransferring, setIsTransferring] = useState(false);
  const [optimisticTransfers, setOptimisticTransfers] = useState<OptimisticTransfer[]>([]);
  const supabase = createClient();
  const cleanupIntervalRef = useRef<NodeJS.Timeout>();

  // 清理已完成的樂觀轉移
  useEffect(() => {
    cleanupIntervalRef.current = setInterval(() => {
      setOptimisticTransfers(prev => 
        prev.filter(t => 
          t.status === 'pending' || 
          (Date.now() - t.timestamp) < 5000 // 保留 5 秒顯示成功/失敗狀態
        )
      );
    }, 1000);
    
    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
    };
  }, []);

  /**
   * 執行庫存轉移
   */
  const executeTransfer = useCallback(async (
    palletInfo: PalletInfo,
    toLocation: string,
    operatorId: string
  ): Promise<boolean> => {
    const { plt_num: pltNum, product_code: productCode, product_qty: productQty } = palletInfo;
    const fromLocation = palletInfo.current_plt_loc || 'Await';
    
    // 驗證 operator ID
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
    
    // 2. 顯示進行中的 toast
    const toastId = toast.loading(`Moving pallet ${pltNum} to ${toLocation}...`);

    try {
      setIsTransferring(true);
      
      // 驗證 operator ID 是否存在
      const { data: operatorData, error: operatorError } = await supabase
        .from('data_id')
        .select('id')
        .eq('id', operatorIdNum)
        .single();

      if (operatorError || !operatorData) {
        throw new Error(`Operator ID ${operatorIdNum} not found in system`);
      }
      
      // 執行轉移事務
      // 1. 添加歷史記錄
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

      // 2. 添加轉移記錄
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

      // 3. 更新庫存記錄
      // Use the unified LocationMapper instead of local mapping
      const fromColumn = LocationMapper.toDbColumn(fromLocation);
      const toColumn = LocationMapper.toDbColumn(toLocation);

      if (!fromColumn || !toColumn) {
        throw new Error(`Invalid location mapping: ${fromLocation} → ${toLocation}`);
      }

      const { error: inventoryError } = await supabase
        .from('record_inventory')
        .insert([{
          product_code: productCode,
          plt_num: pltNum,
          [fromColumn]: -productQty,  // 減少來源位置
          [toColumn]: productQty,     // 增加目標位置
          latest_update: new Date().toISOString()
        }]);

      if (inventoryError) {
        throw new Error(`Failed to update inventory: ${inventoryError.message}`);
      }

      // 4. 更新工作量記錄
      try {
        await supabase.rpc('update_work_level_move', {
          p_user_id: operatorIdNum,
          p_move_count: 1
        });
      } catch (error) {
        console.error('[useStockTransfer] Work level update failed:', error);
      }

      // 成功：更新樂觀狀態
      setOptimisticTransfers(prev => 
        prev.map(t => t.id === transferId ? { ...t, status: 'success' } : t)
      );
      
      toast.success(`Pallet ${pltNum} moved to ${toLocation}`, { id: toastId });
      
      if (onTransferComplete) {
        onTransferComplete(true, pltNum);
      }
      
      return true;
    } catch (error: any) {
      console.error('Stock transfer failed:', error);
      let errorMessage = error.message || 'Unknown error';
      
      // 失敗：更新樂觀狀態
      setOptimisticTransfers(prev => 
        prev.map(t => t.id === transferId ? { ...t, status: 'failed' } : t)
      );
      
      toast.error(`Movement failed: ${errorMessage}`, { id: toastId });
      
      if (onTransferComplete) {
        onTransferComplete(false, pltNum);
      }
      
      return false;
    } finally {
      setIsTransferring(false);
    }
  }, [supabase, optimisticTransfers, onTransferComplete]);

  /**
   * 檢查托盤是否有待處理的轉移
   */
  const hasPendingTransfer = useCallback((pltNum: string): boolean => {
    return optimisticTransfers.some(
      t => t.pltNum === pltNum && t.status === 'pending'
    );
  }, [optimisticTransfers]);

  return {
    isTransferring,
    optimisticTransfers,
    executeTransfer,
    hasPendingTransfer
  };
};