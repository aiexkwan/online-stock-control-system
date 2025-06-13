'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  BatchVoidState, 
  BatchPalletItem, 
  BatchVoidParams,
  DEFAULT_BATCH_SETTINGS 
} from '../types/batch';
import { PalletInfo } from '../types';
import { searchPalletAction, voidPalletAction, processDamageAction } from '../actions';

const initialBatchState: BatchVoidState = {
  mode: 'single',
  items: [],
  selectedCount: 0,
  isProcessing: false,
  currentProcessingId: null,
  completedCount: 0,
  errorCount: 0,
};

export function useBatchVoid() {
  const [batchState, setBatchState] = useState<BatchVoidState>(initialBatchState);
  const [settings] = useState(DEFAULT_BATCH_SETTINGS);

  // Toggle between single and batch mode
  const toggleMode = useCallback(() => {
    setBatchState(prev => ({
      ...prev,
      mode: prev.mode === 'single' ? 'batch' : 'single',
      items: [],
      selectedCount: 0,
      completedCount: 0,
      errorCount: 0,
    }));
  }, []);

  // Add pallet to batch
  const addToBatch = useCallback(async (searchValue: string, searchType: 'qr' | 'pallet_num') => {
    // Check if already in batch
    const isDuplicate = batchState.items.some(item => 
      item.palletInfo.plt_num === searchValue || 
      item.palletInfo.series === searchValue
    );

    if (isDuplicate && settings.preventDuplicates) {
      toast.warning('Pallet already in batch list');
      return false;
    }

    // Check max items limit
    if (batchState.items.length >= settings.maxItems) {
      toast.error(`Maximum batch size reached (${settings.maxItems} pallets)`);
      return false;
    }

    try {
      // Search for pallet
      const result = await searchPalletAction({ searchValue, searchType });
      
      if (!result.success || !result.data) {
        toast.error(result.error || 'Pallet not found');
        return false;
      }

      // Create batch item
      const newItem: BatchPalletItem = {
        id: `${Date.now()}-${Math.random()}`,
        palletInfo: result.data,
        selected: settings.autoSelectAll,
        status: 'pending',
        scanTime: new Date(),
      };

      // Add to batch
      setBatchState(prev => ({
        ...prev,
        items: [...prev.items, newItem],
        selectedCount: prev.selectedCount + (settings.autoSelectAll ? 1 : 0),
      }));

      toast.success(`Added: ${result.data.plt_num}`);
      return true;
    } catch (error) {
      toast.error('Failed to add pallet to batch');
      return false;
    }
  }, [batchState.items, settings]);

  // Select/deselect item
  const toggleItemSelection = useCallback((id: string, selected: boolean) => {
    setBatchState(prev => {
      const items = prev.items.map(item =>
        item.id === id ? { ...item, selected } : item
      );
      const selectedCount = items.filter(item => item.selected).length;
      return { ...prev, items, selectedCount };
    });
  }, []);

  // Select/deselect all
  const selectAll = useCallback((selected: boolean) => {
    setBatchState(prev => {
      const items = prev.items.map(item => ({
        ...item,
        selected: item.status === 'pending' ? selected : item.selected
      }));
      const selectedCount = items.filter(item => item.selected).length;
      return { ...prev, items, selectedCount };
    });
  }, []);

  // Remove item from batch
  const removeFromBatch = useCallback((id: string) => {
    setBatchState(prev => {
      const items = prev.items.filter(item => item.id !== id);
      const selectedCount = items.filter(item => item.selected).length;
      return { ...prev, items, selectedCount };
    });
  }, []);

  // Clear all items
  const clearBatch = useCallback(() => {
    setBatchState(prev => ({
      ...prev,
      items: [],
      selectedCount: 0,
      completedCount: 0,
      errorCount: 0,
    }));
  }, []);

  // Execute batch void
  const executeBatchVoid = useCallback(async (params: {
    voidReason: string;
    password: string;
    damageQuantity?: number;
  }) => {
    const selectedItems = batchState.items.filter(item => item.selected);
    
    if (selectedItems.length === 0) {
      toast.error('No pallets selected');
      return { success: false };
    }

    setBatchState(prev => ({ ...prev, isProcessing: true, completedCount: 0, errorCount: 0 }));

    let successCount = 0;
    let errorCount = 0;

    // Process each selected pallet
    for (const item of selectedItems) {
      // Update current processing
      setBatchState(prev => ({
        ...prev,
        currentProcessingId: item.id,
        items: prev.items.map(i =>
          i.id === item.id ? { ...i, status: 'processing' } : i
        ),
      }));

      try {
        // Execute void based on reason
        let result;
        if (params.voidReason === 'Damage' && params.damageQuantity) {
          result = await processDamageAction({
            palletInfo: item.palletInfo,
            voidReason: params.voidReason,
            password: params.password,
            damageQuantity: params.damageQuantity,
          });
        } else {
          result = await voidPalletAction({
            palletInfo: item.palletInfo,
            voidReason: params.voidReason,
            password: params.password,
          });
        }

        if (result.success) {
          successCount++;
          setBatchState(prev => ({
            ...prev,
            items: prev.items.map(i =>
              i.id === item.id ? { ...i, status: 'completed', selected: false } : i
            ),
            completedCount: successCount,
          }));
        } else {
          errorCount++;
          setBatchState(prev => ({
            ...prev,
            items: prev.items.map(i =>
              i.id === item.id ? { ...i, status: 'error', error: result.error } : i
            ),
            errorCount: errorCount,
          }));
        }
      } catch (error: any) {
        errorCount++;
        setBatchState(prev => ({
          ...prev,
          items: prev.items.map(i =>
            i.id === item.id ? { ...i, status: 'error', error: error.message } : i
          ),
          errorCount: errorCount,
        }));
      }
    }

    setBatchState(prev => ({ 
      ...prev, 
      isProcessing: false, 
      currentProcessingId: null,
      selectedCount: 0 
    }));

    // Show summary
    if (successCount > 0 && errorCount === 0) {
      toast.success(`Successfully voided ${successCount} pallet${successCount > 1 ? 's' : ''}`);
    } else if (successCount > 0 && errorCount > 0) {
      toast.warning(`Voided ${successCount} pallet${successCount > 1 ? 's' : ''}, ${errorCount} failed`);
    } else {
      toast.error(`Failed to void ${errorCount} pallet${errorCount > 1 ? 's' : ''}`);
    }

    return {
      success: successCount > 0,
      summary: {
        total: selectedItems.length,
        successful: successCount,
        failed: errorCount,
      }
    };
  }, [batchState.items]);

  return {
    batchState,
    settings,
    toggleMode,
    addToBatch,
    toggleItemSelection,
    selectAll,
    removeFromBatch,
    clearBatch,
    executeBatchVoid,
  };
}