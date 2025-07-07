import { useState, useCallback, useRef, useEffect } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { toast } from 'sonner';
import { createInventoryService } from '@/lib/inventory/services';
import type { PalletInfo, StockTransferDto } from '@/lib/inventory/types';

// 樂觀更新的轉移狀態
export interface OptimisticTransfer {
  id: string;
  pltNum: string;
  fromLocation: string;
  toLocation: string;
  status: 'pending' | 'success' | 'failed';
  timestamp: number;
}

interface UseUnifiedStockTransferOptions {
  onTransferComplete?: (success: boolean, pltNum: string) => void;
}

/**
 * Stock transfer hook using unified inventory service
 * Provides optimistic updates and error handling
 */
export const useUnifiedStockTransfer = (options: UseUnifiedStockTransferOptions = {}) => {
  const { onTransferComplete } = options;
  
  const [isTransferring, setIsTransferring] = useState(false);
  const [optimisticTransfers, setOptimisticTransfers] = useState<OptimisticTransfer[]>([]);
  const inventoryServiceRef = useRef<ReturnType<typeof createInventoryService>>();
  const cleanupIntervalRef = useRef<NodeJS.Timeout>();

  // Initialize inventory service
  useEffect(() => {
    const supabase = createClient();
    inventoryServiceRef.current = createInventoryService(supabase);
  }, []);

  // Cleanup completed optimistic transfers
  useEffect(() => {
    cleanupIntervalRef.current = setInterval(() => {
      setOptimisticTransfers(prev => 
        prev.filter(t => 
          t.status === 'pending' || 
          (Date.now() - t.timestamp) < 5000 // Keep success/failed status for 5 seconds
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
   * Execute stock transfer using unified service
   */
  const executeTransfer = useCallback(async (
    palletInfo: PalletInfo,
    toLocation: string,
    operatorId: string
  ): Promise<boolean> => {
    if (!inventoryServiceRef.current) {
      toast.error('Service not initialized');
      return false;
    }

    const { plt_num: pltNum, product_code: productCode, product_qty: productQty } = palletInfo;
    const fromLocation = (palletInfo as any).current_plt_loc || (palletInfo as any).location || 'Await';
    
    // Generate unique transfer ID
    const transferId = `${pltNum}-${Date.now()}`;
    
    // Check for pending transfers on same pallet
    const hasPendingTransfer = optimisticTransfers.some(
      t => t.pltNum === pltNum && t.status === 'pending'
    );
    
    if (hasPendingTransfer) {
      toast.warning(`Pallet ${pltNum} has a pending transfer. Please wait.`);
      return false;
    }
    
    // 1. Optimistic update: immediately update UI
    const optimisticEntry: OptimisticTransfer = {
      id: transferId,
      pltNum,
      fromLocation,
      toLocation,
      status: 'pending',
      timestamp: Date.now()
    };
    
    setOptimisticTransfers(prev => [...prev, optimisticEntry]);
    
    // 2. Show loading toast
    const toastId = toast.loading(`Moving pallet ${pltNum} to ${toLocation}...`);

    try {
      setIsTransferring(true);
      
      // Prepare transfer data
      const transferData: StockTransferDto = {
        palletNum: pltNum,
        productCode,
        quantity: productQty,
        fromLocation,
        toLocation,
        operator: operatorId,
        remark: `Transfer via unified service`
      };

      // Execute transfer
      const result = await inventoryServiceRef.current.transferStock(transferData);

      if (result.success) {
        // Update optimistic state
        setOptimisticTransfers(prev =>
          prev.map(t => t.id === transferId ? { ...t, status: 'success' } : t)
        );
        
        // Success notification
        toast.success(`Pallet ${pltNum} moved to ${toLocation}`, { id: toastId });
        
        // Callback
        onTransferComplete?.(true, pltNum);
        
        return true;
      } else {
        // Update optimistic state
        setOptimisticTransfers(prev =>
          prev.map(t => t.id === transferId ? { ...t, status: 'failed' } : t)
        );
        
        // Error notification
        toast.error(result.error || 'Transfer failed', { id: toastId });
        
        // Callback
        onTransferComplete?.(false, pltNum);
        
        return false;
      }
    } catch (error: any) {
      console.error('[useUnifiedStockTransfer] Transfer error:', error);
      
      // Update optimistic state
      setOptimisticTransfers(prev =>
        prev.map(t => t.id === transferId ? { ...t, status: 'failed' } : t)
      );
      
      // Error notification
      toast.error(error.message || 'Transfer failed', { id: toastId });
      
      // Callback
      onTransferComplete?.(false, pltNum);
      
      return false;
    } finally {
      setIsTransferring(false);
    }
  }, [optimisticTransfers, onTransferComplete]);

  /**
   * Batch transfer multiple pallets
   */
  const executeBatchTransfer = useCallback(async (
    transfers: Array<{
      palletInfo: PalletInfo;
      toLocation: string;
    }>,
    operatorId: string
  ): Promise<{ successCount: number; failureCount: number }> => {
    if (!inventoryServiceRef.current) {
      toast.error('Service not initialized');
      return { successCount: 0, failureCount: transfers.length };
    }

    const toastId = toast.loading(`Processing ${transfers.length} transfers...`);
    
    try {
      setIsTransferring(true);
      
      // Prepare batch transfer data
      const batchTransferData = {
        transfers: transfers.map(({ palletInfo, toLocation }) => ({
          palletNum: palletInfo.plt_num,
          productCode: palletInfo.product_code,
          quantity: palletInfo.product_qty,
          fromLocation: palletInfo.current_plt_loc || 'Await',
          toLocation,
          operator: operatorId
        })),
        operator: operatorId
      };

      // Execute batch transfer
      const result = await inventoryServiceRef.current.batchTransfer(batchTransferData);

      if (result.success) {
        toast.success(
          `Batch transfer completed: ${result.successCount} succeeded, ${result.failureCount} failed`,
          { id: toastId }
        );
      } else {
        toast.error(result.error || 'Batch transfer failed', { id: toastId });
      }

      return {
        successCount: result.successCount || 0,
        failureCount: result.failureCount || 0
      };
    } catch (error: any) {
      console.error('[useUnifiedStockTransfer] Batch transfer error:', error);
      toast.error(error.message || 'Batch transfer failed', { id: toastId });
      
      return {
        successCount: 0,
        failureCount: transfers.length
      };
    } finally {
      setIsTransferring(false);
    }
  }, []);

  /**
   * Check if a pallet has pending transfer
   */
  const hasPendingTransfer = useCallback((pltNum: string): boolean => {
    return optimisticTransfers.some(
      t => t.pltNum === pltNum && t.status === 'pending'
    );
  }, [optimisticTransfers]);

  /**
   * Get optimistic location for a pallet
   */
  const getOptimisticLocation = useCallback((pltNum: string, currentLocation: string): string => {
    const pendingTransfer = optimisticTransfers.find(
      t => t.pltNum === pltNum && t.status === 'pending'
    );
    
    return pendingTransfer ? pendingTransfer.toLocation : currentLocation;
  }, [optimisticTransfers]);

  return {
    isTransferring,
    optimisticTransfers,
    executeTransfer,
    executeBatchTransfer,
    hasPendingTransfer,
    getOptimisticLocation
  };
};