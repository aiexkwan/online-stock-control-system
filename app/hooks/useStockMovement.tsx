import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '../../lib/supabase';
import { toast } from 'sonner';
import { AuthUtils } from '../utils/auth-utils';

interface Product {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  location: string;
}

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

export function useStockMovement(options: UseStockMovementOptions = {}) {
  const {
    enableCache = true,
    debounceMs = 300,
    maxRetries = 3
  } = options;

  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Cache and performance optimization
  const productsCache = useRef<{ data: Product[]; timestamp: number } | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout>();
  const retryCount = useRef<number>(0);

  // Initialize user ID from Supabase Auth
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const clockNumber = await AuthUtils.getCurrentUserClockNumber();
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
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback((searchTerm: string, callback: (term: string) => void) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      callback(searchTerm);
    }, debounceMs);
  }, [debounceMs]);

  // Cache validation function
  const isCacheValid = useCallback(() => {
    if (!enableCache || !productsCache.current) return false;
    const cacheAge = Date.now() - productsCache.current.timestamp;
    return cacheAge < 5 * 60 * 1000; // 5 minute cache
  }, [enableCache]);

  // Fetch products list (with cache)
  const fetchProducts = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && isCacheValid()) {
      setProducts(productsCache.current!.data);
      return productsCache.current!.data;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      const productData = data || [];
      setProducts(productData);
      
      if (enableCache) {
        productsCache.current = {
          data: productData,
          timestamp: Date.now()
        };
      }
      
      retryCount.current = 0; // Reset retry count
      return productData;
    } catch (error) {
      console.error('Failed to fetch products:', error);
      
      // Retry logic
      if (retryCount.current < maxRetries) {
        retryCount.current++;
        toast.warning(`Failed to fetch products, retrying (${retryCount.current}/${maxRetries})`);
        setTimeout(() => fetchProducts(forceRefresh), 1000 * retryCount.current);
      } else {
        toast.error('Failed to fetch products, please check network connection');
        retryCount.current = 0;
      }
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [supabase, isCacheValid, enableCache, maxRetries]);

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

  // Execute inventory operation (receive, issue, transfer)
  const executeInventoryOperation = useCallback(async (
    operationType: 'receive' | 'issue' | 'transfer',
    productId: number,
    quantity: number,
    fromLocation?: string,
    toLocation?: string,
    notes?: string
  ): Promise<boolean> => {
    if (!userId) {
      toast.error('User ID not found, cannot execute operation');
      return false;
    }

    const selectedProduct = products.find(p => p.id === productId);
    if (!selectedProduct) {
      toast.error('Selected product not found');
      return false;
    }

    try {
      setIsLoading(true);
      
      // Create inventory movement record
      const movementData = {
        product_id: productId,
        quantity,
        type: operationType,
        from_location: operationType === 'receive' ? '' : fromLocation,
        to_location: operationType === 'issue' ? '' : (operationType === 'transfer' ? toLocation : fromLocation),
        created_by: userId,
        notes: notes || ''
      };
      
      const { error: movementError } = await supabase
        .from('inventory_movements')
        .insert([movementData]);
      
      if (movementError) throw movementError;
      
      // Update product quantity and location
      let newQuantity = selectedProduct.quantity;
      let newLocation = selectedProduct.location;
      
      if (operationType === 'receive') {
        newQuantity += quantity;
      } else if (operationType === 'issue') {
        newQuantity -= quantity;
      } else if (operationType === 'transfer') {
        newLocation = toLocation || selectedProduct.location;
      }
      
      const { error: updateError } = await supabase
        .from('products')
        .update({
          quantity: newQuantity,
          location: newLocation,
          last_updated: new Date().toISOString()
        })
        .eq('id', productId);
      
      if (updateError) throw updateError;
      
      // Refresh product list
      await fetchProducts(true);
      
      // Record operation log
      const operationNames = {
        receive: 'Received',
        issue: 'Issued',
        transfer: 'Transferred'
      };
      
      addActivityLog(
        `${operationNames[operationType]} ${quantity} units of ${selectedProduct.name}`,
        'success'
      );
      
      toast.success(`${operationNames[operationType]} operation completed successfully`);
      return true;
    } catch (error: any) {
      console.error('Inventory operation failed:', error);
      addActivityLog(`Operation failed: ${error.message}`, 'error');
      toast.error(`Operation failed: ${error.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId, products, supabase, fetchProducts]);

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
    products,
    activityLog,
    userId,
    
    // Methods
    fetchProducts,
    searchPalletInfo,
    executeStockTransfer,
    executeInventoryOperation,
    addActivityLog,
    clearActivityLog,
    debouncedSearch,
    
    // Utility methods
    refreshCache: () => fetchProducts(true),
    isCacheValid
  };
} 