'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { createClient } from '../utils/supabase/client';
import { LocationMapper, DatabaseLocationColumn } from '../../lib/inventory/utils/locationMapper';
import type { PalletInfo } from '../../lib/inventory/types';
import type { Database } from '../../lib/database.types';

interface OptimisticTransfer {
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

export function useStockTransfer(options: UseStockTransferOptions = {}) {
  const [isTransferring, setIsTransferring] = useState(false);
  const [optimisticTransfers, setOptimisticTransfers] = useState<OptimisticTransfer[]>([]);
  const supabase = createClient();
  const cleanupIntervalRef = useRef<NodeJS.Timeout>();

  // Cleanup old transfers
  useEffect(() => {
    const cleanup = () => {
      setOptimisticTransfers(prev =>
        prev.filter(transfer => {
          const isOld = Date.now() - transfer.timestamp > 5000;
          return transfer.status === 'pending' || !isOld;
        })
      );
    };

    cleanupIntervalRef.current = setInterval(cleanup, 1000);
    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
    };
  }, []);

  const hasPendingTransfer = useCallback(
    (pltNum: string): boolean => {
      return optimisticTransfers.some(
        transfer => transfer.pltNum === pltNum && transfer.status === 'pending'
      );
    },
    [optimisticTransfers]
  );

  const executeTransfer = useCallback(
    async (palletInfo: PalletInfo, toLocation: string, operatorId: string): Promise<boolean> => {
      // Validate operator ID format
      if (!/^\d+$/.test(operatorId)) {
        toast.error('Invalid operator ID format');
        return false;
      }

      // Check for pending transfers
      if (hasPendingTransfer(palletInfo.plt_num)) {
        toast.warning(`Pallet ${palletInfo.plt_num} has a pending transfer. Please wait.`);
        return false;
      }

      const transferId = `transfer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      // Get current location from pallet info or default to 'Await'
      const fromLocation = 'Await'; // Default location for pallets without specific location

      // Add optimistic transfer
      setOptimisticTransfers(prev => [
        ...prev,
        {
          id: transferId,
          pltNum: palletInfo.plt_num,
          fromLocation,
          toLocation,
          status: 'pending',
          timestamp: Date.now(),
        },
      ]);

      setIsTransferring(true);
      const toastId = toast.loading(`Moving pallet ${palletInfo.plt_num} to ${toLocation}...`);

      try {
        // Verify operator exists
        const operatorIdNum = parseInt(operatorId);
        const { data: operatorData, error: operatorError } = await supabase
          .from('data_id')
          .select('id')
          .eq('id', operatorIdNum)
          .single();

        if (operatorError || !operatorData) {
          throw new Error(`Operator ID ${operatorId} not found in system`);
        }

        // Add history record
        const { error: historyError } = await supabase.from('record_history').insert([
          {
            id: operatorIdNum,
            action: 'Stock Transfer',
            plt_num: palletInfo.plt_num,
            loc: toLocation,
            remark: `Moved from ${fromLocation} to ${toLocation}`,
            _time: new Date().toISOString(),
          },
        ]);

        if (historyError) {
          throw new Error(`Failed to record history: ${historyError.message}`);
        }

        // Add transfer record
        const { error: transferError } = await supabase.from('record_transfer').insert([
          {
            plt_num: palletInfo.plt_num,
            operator_id: operatorIdNum,
            tran_date: new Date().toISOString(),
            f_loc: fromLocation,
            t_loc: toLocation,
          },
        ]);

        if (transferError) {
          throw new Error(`Failed to record transfer: ${transferError.message}`);
        }

        // Update inventory
        const fromDbColumn = LocationMapper.toDbColumn(fromLocation);
        const toDbColumn = LocationMapper.toDbColumn(toLocation);

        if (!fromDbColumn || !toDbColumn) {
          throw new Error('Invalid location mapping');
        }

        // Create the base inventory update record
        const baseInventoryUpdate: Database['public']['Tables']['record_inventory']['Insert'] = {
          plt_num: palletInfo.plt_num,
          product_code: palletInfo.product_code,
          latest_update: new Date().toISOString(),
          await: 0,
          backcarpark: 0,
          bulk: 0,
          damage: 0,
          fold: 0,
          injection: 0,
          pipeline: 0,
          prebook: 0,
        };

        // Add dynamic location quantities
        const inventoryUpdate = {
          ...baseInventoryUpdate,
          [fromDbColumn]: -palletInfo.product_qty,
          [toDbColumn]: palletInfo.product_qty,
        } as Database['public']['Tables']['record_inventory']['Insert'];

        const { error: inventoryError } = await supabase
          .from('record_inventory')
          .insert([inventoryUpdate]);

        if (inventoryError) {
          throw new Error(`Failed to update inventory: ${inventoryError.message}`);
        }

        // Update work level
        const { error: workLevelError } = await supabase.rpc('update_work_level_move', {
          p_user_id: operatorIdNum,
          p_move_count: 1,
        });

        if (workLevelError) {
          throw new Error(`Failed to update work level: ${workLevelError.message}`);
        }

        // Update optimistic transfer to success
        setOptimisticTransfers(prev =>
          prev.map(t => (t.id === transferId ? { ...t, status: 'success' } : t))
        );

        toast.success(`Pallet ${palletInfo.plt_num} moved to ${toLocation}`, { id: toastId });
        options.onTransferComplete?.(true, palletInfo.plt_num);
        return true;
      } catch (error) {
        // Update optimistic transfer to failed
        setOptimisticTransfers(prev =>
          prev.map(t => (t.id === transferId ? { ...t, status: 'failed' } : t))
        );

        const errorMessage = error instanceof Error ? error.message : 'Transfer failed';
        toast.error(errorMessage, { id: toastId });
        options.onTransferComplete?.(false, palletInfo.plt_num);
        return false;
      } finally {
        setIsTransferring(false);
      }
    },
    [hasPendingTransfer, options, supabase]
  );

  return {
    isTransferring,
    optimisticTransfers,
    executeTransfer,
    hasPendingTransfer,
  };
}
