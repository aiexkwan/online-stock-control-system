/**
 * useVoidPallet Hook
 *
 * Extracted from VoidPalletCard component for better reusability and testability
 * Handles pallet voiding business logic, batch processing, and step management
 *
 * Features:
 * - Single and batch void processing
 * - Pallet search with QR support
 * - Multi-step workflow management
 * - Complex database operations for voiding
 * - Error handling and status management
 * - Already voided detection
 */

'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/app/utils/supabase/client';
import { getProductByCode } from '@/app/actions/productActions';
import type { Database } from '@/lib/database.types';
import type { SearchInputRef } from '../components/shared';
import type {
  VoidMode,
  VoidStep,
  PalletInfo,
  VoidParams,
  VoidResult,
  BatchItem,
} from '../types/data-management';

type InventoryInsert = Database['public']['Tables']['record_inventory']['Insert'];

// Hook state interface
export interface VoidPalletState {
  currentStep: VoidStep;
  voidMode: VoidMode;
  searchValue: string;
  showQrScanner: boolean;
  foundPallet: PalletInfo | null;
  productDescription: string;
  voidReason: string;
  voidResult: VoidResult | null;
  showConfirmDialog: boolean;
  showAlreadyVoidedDialog: boolean;
  alreadyVoidedPalletNum: string;
  batchItems: BatchItem[];
  isLoading: boolean;
}

// Hook actions interface
export interface VoidPalletActions {
  setCurrentStep: (step: VoidStep) => void;
  setVoidMode: (mode: VoidMode) => void;
  setSearchValue: (value: string) => void;
  setShowQrScanner: (show: boolean) => void;
  setVoidReason: (reason: string) => void;
  setShowConfirmDialog: (show: boolean) => void;
  setFoundPallet: (pallet: PalletInfo | null) => void;
  setBatchItems: (items: BatchItem[] | ((items: BatchItem[]) => BatchItem[])) => void;
  setShowAlreadyVoidedDialog: (show: boolean) => void;
  setAlreadyVoidedPalletNum: (num: string) => void;
  searchPallet: (value: string) => Promise<PalletInfo | null>;
  handleSearch: () => Promise<{ success: boolean; message: string; data?: { pallet: PalletInfo } }>;
  handleVoid: () => Promise<{ success: boolean; message: string; data?: VoidResult }>;
  handleQrScan: (qrValue: string) => void;
  resetToSearch: () => void;
  toggleBatchItemSelection: (id: string) => void;
  removeBatchItem: (id: string) => void;
  selectAllBatchItems: (selected: boolean) => void;
  focusSearchInput: () => void;
  executeVoidPallet: (_params: VoidParams) => Promise<VoidResult>;
}

// Hook props interface
export interface UseVoidPalletProps {
  searchInputRef?: React.RefObject<SearchInputRef>;
  onVoidComplete?: (palletId: string, _result: VoidResult) => void;
  onVoidError?: (_error: Error) => void;
}

// Hook return interface
export interface UseVoidPalletReturn {
  state: VoidPalletState;
  actions: VoidPalletActions;
}

export const useVoidPallet = ({
  searchInputRef,
  onVoidComplete,
  onVoidError,
}: UseVoidPalletProps = {}): UseVoidPalletReturn => {
  // State management
  const [currentStep, setCurrentStep] = useState<VoidStep>('search');
  const [voidMode, setVoidMode] = useState<VoidMode>('single');
  const [searchValue, setSearchValue] = useState('');
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [foundPallet, setFoundPallet] = useState<PalletInfo | null>(null);
  const [productDescription, setProductDescription] = useState<string>('');
  const [voidReason, setVoidReason] = useState('');
  const [voidResult, setVoidResult] = useState<VoidResult | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showAlreadyVoidedDialog, setShowAlreadyVoidedDialog] = useState(false);
  const [alreadyVoidedPalletNum, setAlreadyVoidedPalletNum] = useState('');
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Helper function to get inventory column mapping
  const getInventoryColumn = useCallback((location: string | null | undefined): string => {
    if (!location) return 'injection';

    const locationMap: Record<string, string> = {
      Injection: 'injection',
      Pipeline: 'pipeline',
      Await: 'await',
      'Await Location': 'await',
      Folding: 'fold',
      Bulk: 'bulk',
      'Back Car Park': 'backcarpark',
      Damage: 'damage',
      Voided: 'injection', // Default for voided items
    };

    return locationMap[location] || 'injection';
  }, []);

  // Focus search input helper
  const focusSearchInput = useCallback(() => {
    setTimeout(() => {
      searchInputRef?.current?.focus();
    }, 100);
  }, [searchInputRef]);

  // Search pallet function - supports both pallet number and QR series
  const searchPallet = useCallback(async (value: string): Promise<PalletInfo | null> => {
    try {
      const supabase = createClient();
      let plt_num = value;

      // Check if input is QR Code (series format)
      if (value.includes('-') && value.length > 10) {
        const { data: seriesData, error: seriesError } = await supabase
          .from('record_palletinfo')
          .select('plt_num')
          .eq('series', value)
          .maybeSingle();

        if (seriesError || !seriesData) {
          return null;
        }
        plt_num = seriesData.plt_num;
      }

      // Search in record_palletinfo table
      const { data: palletData, error } = await supabase
        .from('record_palletinfo')
        .select('plt_num, product_code, product_qty, plt_remark, generate_time')
        .eq('plt_num', plt_num)
        .maybeSingle();

      if (error || !palletData) {
        return null;
      }

      // Get latest location from record_history
      const { data: locationData } = await supabase
        .from('record_history')
        .select('loc')
        .eq('plt_num', plt_num)
        .order('time', { ascending: false })
        .limit(1)
        .single();

      // Check if already voided
      if (locationData?.loc && ['Voided', 'Void', 'Damaged'].includes(locationData.loc)) {
        throw new Error(`Pallet ${plt_num} Already Been Voided\nPlease Check Again`);
      }

      // Get product description and type
      const { data: productData } = await supabase
        .from('data_code')
        .select('description, type')
        .eq('code', palletData.product_code)
        .single();

      const pallet: PalletInfo = {
        plt_num: palletData.plt_num,
        product_code: palletData.product_code,
        product_qty: palletData.product_qty,
        plt_loc: locationData?.loc || 'N/A',
        description: productData?.description || 'N/A',
        type: productData?.type || 'N/A',
        plt_remark: palletData.plt_remark || '',
        generate_time: palletData.generate_time,
      };

      setProductDescription(pallet.description || 'N/A');

      return pallet;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Already Been Voided')) {
        throw error;
      }
      console.error('Search error:', error);
      return null;
    }
  }, []);

  // Handle search execution
  const handleSearch = useCallback(async () => {
    const value = searchValue.trim();
    if (!value) {
      throw new Error('Please enter a pallet number');
    }

    try {
      const pallet = await searchPallet(value);
      if (!pallet) {
        throw new Error('Pallet not found');
      }

      // Single mode: move to confirm
      if (voidMode === 'single') {
        setFoundPallet(pallet);
        setCurrentStep('confirm');

        // Fetch product description
        try {
          const result = await getProductByCode(pallet.product_code);
          if (result.success && result.data) {
            setProductDescription(result.data.description);
          }
        } catch (error) {
          console.error('Failed to fetch product description:', error);
        }
      }
      // Batch mode: add to list
      else {
        const newItem: BatchItem = {
          id: `batch-${Date.now()}`,
          palletId: pallet.plt_num,
          status: 'pending',
          product_code: pallet.product_code,
          product_qty: pallet.product_qty,
          selected: true,
        };
        setBatchItems(prev => [...prev, newItem]);
        setSearchValue('');
        focusSearchInput();

        toast.success(`Pallet ${pallet.plt_num} added to batch list`);
      }

      return {
        success: true,
        message: voidMode === 'single' ? 'Pallet found' : 'Pallet added to batch',
        data: { pallet },
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('Already Been Voided')) {
        const match = error.message.match(/Pallet (\w+) Already Been Voided/);
        setAlreadyVoidedPalletNum(match ? match[1] : value);
        setShowAlreadyVoidedDialog(true);
        setSearchValue('');
        focusSearchInput();
        throw error;
      }
      throw error;
    }
  }, [searchValue, voidMode, searchPallet, focusSearchInput]);

  // Internal void pallet function
  const executeVoidPallet = useCallback(
    async (params: VoidParams): Promise<VoidResult> => {
      const supabase = createClient();

      try {
        const { palletInfo, voidReason } = params;

        if (!palletInfo) {
          return {
            success: false,
            message: 'Pallet information is required',
          };
        }

        // Update pallet remark to mark as voided
        const { error: updateError } = await supabase
          .from('record_palletinfo')
          .update({
            plt_remark: `${palletInfo.plt_remark || ''} | Voided: ${voidReason} at ${new Date().toISOString()}`,
            product_qty: 0,
          })
          .eq('plt_num', palletInfo.plt_num);

        if (updateError) {
          return {
            success: false,
            message: `Failed to update pallet: ${updateError.message}`,
          };
        }

        // Record history
        const { error: historyError } = await supabase.from('record_history').insert({
          time: new Date().toISOString(),
          id: 999, // Default user ID for batch operations
          action: 'Void Pallet',
          plt_num: palletInfo.plt_num,
          loc: 'Voided',
          remark: `Reason: ${voidReason}`,
        });

        if (historyError) {
          console.error('Failed to record history:', historyError);
        }

        // Record void report
        await supabase.from('report_void').insert({
          plt_num: palletInfo.plt_num,
          reason: voidReason,
          damage_qty: 0,
          time: new Date().toISOString(),
        });

        // Update inventory
        const inventoryColumn = getInventoryColumn(palletInfo.plt_loc);
        const inventoryUpdate = {
          product_code: palletInfo.product_code,
          latest_update: new Date().toISOString(),
          plt_num: palletInfo.plt_num,
          await: 0,
          await_grn: 0,
          backcarpark: 0,
          bulk: 0,
          fold: 0,
          injection: 0,
          pipeline: 0,
          prebook: 0,
          damage: 0,
          uuid: crypto.randomUUID(),
        } as InventoryInsert;
        // Set inventory column value based on location
        const inventoryRecord: InventoryInsert & Record<string, number | string | Date | null> = {
          ...inventoryUpdate,
          [inventoryColumn]: -palletInfo.product_qty,
        };

        await supabase.from('record_inventory').insert(inventoryRecord);

        return {
          success: true,
          message: `Pallet ${palletInfo.plt_num} voided successfully`,
        };
      } catch (error) {
        console.error('Error in executeVoidPallet:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        };
      }
    },
    [getInventoryColumn]
  );

  // Handle void execution with complex database operations
  const handleVoid = useCallback(async () => {
    if (!voidReason) {
      throw new Error('Void reason is required');
    }

    if (voidMode === 'single' && !foundPallet) {
      throw new Error('No pallet selected');
    }

    if (voidMode === 'batch' && batchItems.filter(item => item.selected).length === 0) {
      throw new Error('No items selected for batch void');
    }

    let result: VoidResult;

    try {
      if (voidMode === 'single' && foundPallet) {
        // Single pallet void with complex database operations
        const supabase = createClient();

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user?.email) {
          throw new Error('User not authenticated');
        }

        // Get user ID from email
        const { data: userData } = await supabase
          .from('data_id')
          .select('id')
          .eq('email', user.email)
          .single();

        const userId = userData?.id || 0;

        // 1. Delete record_grn records
        await supabase.from('record_grn').delete().eq('plt_num', foundPallet.plt_num);

        // 2. Delete record_transfer records
        await supabase.from('record_transfer').delete().eq('plt_num', foundPallet.plt_num);

        // 3. Insert record_inventory record (stream accounting)
        const inventoryRecord: InventoryInsert & Record<string, number | string | Date | null> = {
          product_code: foundPallet.product_code,
          plt_num: foundPallet.plt_num, // Use correct database field name
          injection: 0,
          pipeline: 0,
          prebook: 0,
          await: 0,
          fold: 0,
          bulk: 0,
          backcarpark: 0,
          await_grn: 0,
          latest_update: new Date().toISOString(),
          uuid: crypto.randomUUID(),
          damage: 0,
        };

        // Set negative quantity based on current location
        if (foundPallet.plt_loc === 'Await') {
          inventoryRecord.await = -foundPallet.product_qty;
        } else if (foundPallet.plt_loc === 'Await_grn') {
          inventoryRecord.await_grn = -foundPallet.product_qty;
        } else if (foundPallet.plt_loc === 'Fold Mill') {
          inventoryRecord.fold = -foundPallet.product_qty;
        } else if (foundPallet.plt_loc === 'Production') {
          inventoryRecord.injection = -foundPallet.product_qty;
        } else {
          // Default to injection if location not recognized
          inventoryRecord.injection = -foundPallet.product_qty;
        }

        const { error: inventoryError } = await supabase
          .from('record_inventory')
          .insert(inventoryRecord);

        if (inventoryError) {
          console.error('Failed to insert record_inventory:', inventoryError);
        }

        // 4. Insert report_void record
        await supabase.from('report_void').insert({
          plt_num: foundPallet.plt_num,
          reason: voidReason,
          damage_qty: voidReason === 'Damaged' ? foundPallet.product_qty : 0,
          _time: new Date().toISOString(),
        });

        // 5. Update record_aco if ACO order exists
        if (foundPallet.plt_remark && foundPallet.plt_remark.includes('ACO')) {
          const acoMatch = foundPallet.plt_remark.match(/ACO-?\d+/i);
          if (acoMatch) {
            const acoRef = acoMatch[0].replace('ACO', '');
            const { data: acoData } = await supabase
              .from('record_aco')
              .select('finished_qty')
              .eq('order_ref', parseInt(acoRef))
              .eq('code', foundPallet.product_code)
              .single();

            if (acoData) {
              const currentFinished = acoData.finished_qty || 0;
              const newFinished = Math.max(0, currentFinished - foundPallet.product_qty);

              await supabase
                .from('record_aco')
                .update({ finished_qty: newFinished })
                .eq('order_ref', parseInt(acoRef))
                .eq('code', foundPallet.product_code);
            }
          }
        }

        // 6. Update stock_level
        const { data: stockData } = await supabase
          .from('stock_level')
          .select('stock_level')
          .eq('stock', foundPallet.product_code)
          .order('update_time', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (stockData) {
          const currentStock = Number(stockData.stock_level) || 0;
          const newStock = Math.max(0, currentStock - foundPallet.product_qty);

          await supabase.from('stock_level').insert({
            stock: foundPallet.product_code,
            stock_level: newStock,
            update_time: new Date().toISOString(),
          });
        }

        // 7. Insert record_history record
        await supabase.from('record_history').insert({
          id: userId || null,
          action: 'Void Pallet',
          plt_num: foundPallet.plt_num,
          loc: voidReason === 'Damaged' ? 'Damaged' : 'Voided',
          remark: voidReason || '',
        });

        result = {
          success: true,
          message: `Pallet ${foundPallet.plt_num} voided successfully`,
          remainingQty: 0,
          requiresReprint: false,
        };
      } else {
        // Batch void - process one by one
        const selectedItems = batchItems.filter(item => item.selected);
        let successCount = 0;
        let failedCount = 0;

        const supabase = createClient();

        for (const item of selectedItems) {
          try {
            // Get location for each pallet from record_history
            const { data: locationData } = await supabase
              .from('record_history')
              .select('loc')
              .eq('plt_num', item.palletId)
              .order('time', { ascending: false })
              .limit(1)
              .single();

            const response = await executeVoidPallet({
              palletInfo: {
                plt_num: item.palletId,
                product_code: item.product_code || '',
                product_qty: item.product_qty || 0,
                plt_remark: '',
                plt_loc: locationData?.loc || undefined,
              },
              voidReason: voidReason || 'Print Extra',
              password: 'batch-void',
            });
            if (response.success) {
              successCount++;
            } else {
              failedCount++;
            }
          } catch (error) {
            console.error('Batch void error for item:', item.id, error);
            failedCount++;
          }
        }

        result = {
          success: failedCount === 0,
          message: `${successCount} pallets voided successfully${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
          remainingQty: 0,
          requiresReprint: false,
        };
      }
    } catch (error) {
      console.error('Void operation error:', error);
      result = {
        success: false,
        message: 'Failed to void pallet(s)',
        remainingQty: 0,
        requiresReprint: false,
      };

      if (onVoidError) {
        onVoidError(error instanceof Error ? error : new Error('Unknown void error'));
      }
    }

    setVoidResult(result);

    if (result.success) {
      setCurrentStep('result');
      if (onVoidComplete) {
        onVoidComplete(searchValue, result);
      }
    }

    return {
      success: result.success,
      message: result.message,
      data: result,
    };
  }, [
    voidMode,
    foundPallet,
    batchItems,
    voidReason,
    onVoidComplete,
    onVoidError,
    executeVoidPallet,
    searchValue,
  ]);

  // QR scan handler
  const handleQrScan = useCallback(
    (qrValue: string) => {
      setShowQrScanner(false);
      setSearchValue(qrValue);
      // Auto search after QR scan
      setTimeout(() => {
        handleSearch();
      }, 100);
    },
    [handleSearch]
  );

  // Reset to search state
  const resetToSearch = useCallback(() => {
    setCurrentStep('search');
    setSearchValue('');
    setFoundPallet(null);
    setProductDescription('');
    setVoidReason('');
    setVoidResult(null);
    setShowConfirmDialog(false);
    focusSearchInput();
  }, [focusSearchInput]);

  // Batch item management
  const toggleBatchItemSelection = useCallback((id: string) => {
    setBatchItems(items =>
      items.map(item => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  }, []);

  const removeBatchItem = useCallback((id: string) => {
    setBatchItems(items => items.filter(item => item.id !== id));
  }, []);

  const selectAllBatchItems = useCallback((selected: boolean) => {
    setBatchItems(items => items.map(item => ({ ...item, selected })));
  }, []);

  // State object
  const state: VoidPalletState = {
    currentStep,
    voidMode,
    searchValue,
    showQrScanner,
    foundPallet,
    productDescription,
    voidReason,
    voidResult,
    showConfirmDialog,
    showAlreadyVoidedDialog,
    alreadyVoidedPalletNum,
    batchItems,
    isLoading,
  };

  // Actions object
  const actions: VoidPalletActions = {
    setCurrentStep,
    setVoidMode,
    setSearchValue,
    setShowQrScanner,
    setVoidReason,
    setShowConfirmDialog,
    setFoundPallet,
    setBatchItems,
    setShowAlreadyVoidedDialog,
    setAlreadyVoidedPalletNum,
    searchPallet,
    handleSearch,
    handleVoid,
    handleQrScan,
    resetToSearch,
    toggleBatchItemSelection,
    removeBatchItem,
    selectAllBatchItems,
    focusSearchInput,
    executeVoidPallet,
  };

  return { state, actions };
};

export default useVoidPallet;
