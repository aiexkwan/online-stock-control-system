'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/app/utils/supabase/client';
import { loadPalletToOrder, undoLoadPallet } from '@/app/actions/orderLoadingActions';
// Order Cache 功能已移除，採用極簡化方法
// import { useOrderDataCache, useOrderSummariesCache } from '@/app/(app)/order-loading/hooks/useOrderCache';

// 簡單的記憶體快取替代
type SimpleCache<T> = {
  get: (key: string) => T | undefined;
  set: (key: string, value: T) => void;
  remove: (key: string) => void;
};

function createSimpleCache<T>(): SimpleCache<T> {
  const cache = new Map<string, T>();
  return {
    get: (key: string) => cache.get(key),
    set: (key: string, value: T) => {
      cache.set(key, value);
    },
    remove: (key: string) => {
      cache.delete(key);
    },
  };
}
import { useSoundFeedback, useSoundSettings } from '@/app/hooks/useSoundFeedback';
import { safeString } from '@/types/database/helpers';
import { DatabaseRecord } from '@/types/database/tables';

// Types from order loading page
export interface OrderSummary {
  orderRef: string;
  totalQty: number;
  loadedQty: number;
  percentage: number;
  itemCount: number;
  completedItems: number;
}

export interface OrderData {
  order_ref: string;
  product_code: string;
  product_desc: string;
  product_qty: string;
  loaded_qty: string;
}

export interface RecentLoad {
  uuid?: string;
  pallet_num?: string;
  product_code: string;
  quantity: number;
  action_time: string;
  [key: string]: unknown;
}

export interface UndoItem {
  pallet_num: string;
  product_code: string;
  quantity: number;
  action_time?: string;
  action_by?: string;
  [key: string]: unknown;
}

export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  metadata?: string;
  data: DatabaseRecord[];
}

// Database result types
interface DatabaseOrderItem {
  order_ref: string;
  product_code: string;
  product_desc: string;
  product_qty: string;
  loaded_qty: string;
}

interface RecordHistoryItem {
  uuid: string;
  action: string;
  plt_num: string | null;
  remark: string;
  time: string;
}

export interface UseOrderLoadReturn {
  // State
  idNumber: string;
  isIdValid: boolean;
  isCheckingId: boolean;
  availableOrders: string[];
  orderSummaries: Map<string, OrderSummary>;
  selectedOrderRef: string | null;
  orderData: OrderData[];
  isLoadingOrders: boolean;
  searchValue: string;
  isSearching: boolean;
  recentLoads: RecentLoad[];
  orderSearchQuery: string;
  showUndoDialog: boolean;
  undoItem: UndoItem | null;

  // Functions
  setIdNumber: (id: string) => void;
  setSearchValue: (value: string) => void;
  setOrderSearchQuery: (query: string) => void;
  setShowUndoDialog: (show: boolean) => void;
  handleIdChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleIdBlur: () => void;
  handleOrderSelect: (orderRef: string) => void;
  handleSearchSelect: (result: SearchResult) => void;
  handleUndoClick: (load: UndoItem) => void;
  handleConfirmedUndo: () => Promise<void>;
  refreshAllData: () => Promise<void>;

  // Refs
  idInputRef: React.RefObject<HTMLInputElement>;
  searchInputRef: React.RefObject<HTMLInputElement>;

  // Sound
  sound: ReturnType<typeof useSoundFeedback>;
  soundSettings: ReturnType<typeof useSoundSettings>;
}

export function useOrderLoad(): UseOrderLoadReturn {
  // State management
  const [idNumber, setIdNumber] = useState('');
  const [isIdValid, setIsIdValid] = useState(false);
  const [isCheckingId, setIsCheckingId] = useState(false);
  const [availableOrders, setAvailableOrders] = useState<string[]>([]);
  const [orderSummaries, setOrderSummaries] = useState<Map<string, OrderSummary>>(new Map());
  const [selectedOrderRef, setSelectedOrderRef] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<OrderData[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [recentLoads, setRecentLoads] = useState<RecentLoad[]>([]);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [showUndoDialog, setShowUndoDialog] = useState(false);
  const [undoItem, setUndoItem] = useState<UndoItem | null>(null);

  // Lazy initialize Supabase client only on client side
  const [supabase] = useState(() => {
    if (typeof window !== 'undefined') {
      return createClient();
    }
    return null;
  });

  // 簡化的快取系統
  const orderDataCache = useState(() => createSimpleCache<OrderData[]>())[0];
  const orderSummariesCache = useState(() => createSimpleCache<Map<string, OrderSummary>>())[0];

  // Sound feedback hooks
  const soundSettings = useSoundSettings();
  const sound = useSoundFeedback({
    enabled: soundSettings.getSoundEnabled(),
    volume: soundSettings.getSoundVolume(),
  });

  // Refs
  const idInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto focus on ID input when component mounts and check saved ID
  useEffect(() => {
    // Check if ID is saved in localStorage
    const savedId = localStorage.getItem('orderLoadingUserId');
    if (savedId && /^\d{4}$/.test(savedId)) {
      setIdNumber(savedId);
      checkIdExists(savedId);
    } else if (idInputRef.current) {
      idInputRef.current.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save ID to localStorage when validated
  useEffect(() => {
    if (isIdValid && idNumber) {
      localStorage.setItem('orderLoadingUserId', idNumber);
    }
  }, [isIdValid, idNumber]);

  // Clear ID from localStorage when unmounting
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.removeItem('orderLoadingUserId');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Also clear when component unmounts
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      localStorage.removeItem('orderLoadingUserId');
    };
  }, []);

  // Check if ID exists in data_id table
  const checkIdExists = useCallback(
    async (id: string) => {
      // Ensure ID is 4 digits
      if (!id || id.length !== 4 || !/^\d{4}$/.test(id)) {
        setIsIdValid(false);
        setAvailableOrders([]);
        setSelectedOrderRef(null);
        setOrderData([]);
        return;
      }

      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }

      setIsCheckingId(true);

      try {
        const { data, error } = await supabase
          .from('data_id')
          .select('id')
          .eq('id', parseInt(id, 10))
          .single();

        if (error || !data) {
          setIsIdValid(false);
          setAvailableOrders([]);
          setSelectedOrderRef(null);
          setOrderData([]);
          sound.playError();
          toast.error(`❌ ID ${id} not found. Please check your ID number.`);
        } else {
          setIsIdValid(true);
          sound.playSuccess();
          await fetchAvailableOrders();
        }
      } catch (error) {
        console.error('Error checking ID:', error);
        setIsIdValid(false);
        toast.error('❌ System error. Please try again.');
      } finally {
        setIsCheckingId(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [supabase, sound] // fetchAvailableOrders 不能加入依賴，因為會造成循環依賴
  );

  // Fetch available order references from data_order table with enhanced data
  const fetchAvailableOrders = useCallback(async () => {
    try {
      // Check cache first
      const cacheKey = 'order-summaries-all';
      const cachedSummaries = orderSummariesCache.get(cacheKey) as
        | Map<string, OrderSummary>
        | undefined;

      if (cachedSummaries) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[OrderCache] Using cached order summaries');
        }
        setOrderSummaries(cachedSummaries);
        setAvailableOrders(Array.from(cachedSummaries.keys()));
        return;
      }

      if (process.env.NODE_ENV !== 'production') {
        console.log('[OrderCache] Fetching fresh order summaries');
      }

      // 直接從數據庫獲取訂單
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }

      const { data, error } = await supabase
        .from('data_order')
        .select('order_ref, product_code, product_desc, product_qty, loaded_qty')
        .order('order_ref', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        toast.error('Error occurred while fetching order list');
        return;
      }

      if (!data || data.length === 0) {
        console.log('No orders found');
        setOrderSummaries(new Map());
        setAvailableOrders([]);
        return;
      }

      // Group by order_ref and calculate completion
      const orderMap = new Map<string, OrderSummary>();
      data.forEach((item: any) => {
        // Type guard to ensure item has required properties
        if (!item || typeof item !== 'object') return;
        const dbItem = item as DatabaseOrderItem;
        const ref = safeString(dbItem.order_ref);
        if (!orderMap.has(ref)) {
          orderMap.set(ref, {
            orderRef: ref,
            totalQty: 0,
            loadedQty: 0,
            percentage: 0,
            itemCount: 0,
            completedItems: 0,
          });
        }
        const order = orderMap.get(ref);
        if (!order) return;
        const itemQty = parseInt(String(dbItem.product_qty || '0'), 10);
        const itemLoaded = parseInt(safeString(dbItem.loaded_qty) || '0', 10);

        order.totalQty += itemQty;
        order.loadedQty += itemLoaded;
        order.itemCount++;
        if (itemLoaded >= itemQty && itemQty > 0) {
          order.completedItems++;
        }
      });

      // Calculate percentages
      orderMap.forEach((order: OrderSummary) => {
        order.percentage = order.totalQty > 0 ? (order.loadedQty / order.totalQty) * 100 : 0;
      });

      // Cache the summaries
      orderSummariesCache.set(cacheKey, orderMap);

      const uniqueOrderRefs = Array.from(orderMap.keys());
      setAvailableOrders(uniqueOrderRefs);
      setOrderSummaries(orderMap);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Error occurred while fetching order list');
    }
  }, [supabase, orderSummariesCache]);

  // Fetch order data from data_order table
  const fetchOrderData = useCallback(
    async (orderRef: string) => {
      setIsLoadingOrders(true);

      try {
        // Check cache first
        const cacheKey = `order-data-${orderRef}`;
        const cachedData = orderDataCache.get(cacheKey) as OrderData[] | undefined;

        if (cachedData) {
          if (process.env.NODE_ENV !== 'production') {
            console.log(`[OrderCache] Using cached data for order: ${orderRef}`);
          }
          setOrderData(cachedData);
          setIsLoadingOrders(false);
          return;
        }

        if (process.env.NODE_ENV !== 'production') {
          console.log(`[OrderCache] Fetching fresh data for order: ${orderRef}`);
        }

        // 獲取訂單詳情
        if (!supabase) {
          console.error('Supabase client not initialized');
          return;
        }

        const { data, error } = await supabase
          .from('data_order')
          .select('order_ref, product_code, product_desc, product_qty, loaded_qty')
          .eq('order_ref', orderRef)
          .order('product_code', { ascending: true });

        if (error) {
          console.error('Error fetching order data:', error);
          toast.error('Error occurred while fetching order data');
          return;
        }

        if (!data) {
          toast.error('Order not found');
          return;
        }

        const orderDataArray = data || [];
        setOrderData(orderDataArray as OrderData[]);

        // Cache the order data
        orderDataCache.set(cacheKey, orderDataArray);
      } catch (error) {
        console.error('Error fetching order data:', error);
        toast.error('Error occurred while fetching order data');
      } finally {
        setIsLoadingOrders(false);
      }
    },
    [supabase, orderDataCache]
  );

  // Fetch recent loading history from record_history
  const fetchRecentLoads = useCallback(
    async (orderRef: string) => {
      try {
        if (!supabase) {
          console.error('Supabase client not initialized');
          return;
        }

        const { data, error } = await supabase
          .from('record_history')
          .select('*')
          .eq('action', 'Order Load')
          .like('remark', `%Order: ${orderRef}%`)
          .order('time', { ascending: false })
          .limit(10);

        if (!error && data) {
          // Transform data to match expected format
          const transformedData = data
            .map((rawItem: any) => {
              // Type guard and casting
              if (!rawItem || typeof rawItem !== 'object') return null;
              const item = rawItem as RecordHistoryItem;

              // Extract details from remark
              const orderMatch = item.remark.match(/Order: ([^,]+)/);
              const productMatch = item.remark.match(/Product: ([^,]+)/);
              const qtyMatch = item.remark.match(/Qty: (\d+)/);
              const byMatch = item.remark.match(/by (.+)$/);

              return {
                uuid: item.uuid,
                order_ref: orderMatch ? orderMatch[1] : orderRef,
                pallet_num: item.plt_num || undefined,
                product_code: productMatch ? productMatch[1] : '',
                quantity: qtyMatch ? parseInt(qtyMatch[1], 10) : 0,
                action_type: 'load',
                action_by: byMatch ? byMatch[1] : 'Unknown',
                action_time: item.time,
              };
            })
            .filter((item): item is NonNullable<typeof item> => item !== null);
          setRecentLoads(transformedData);
        }
      } catch (error) {
        console.error('Error fetching recent loads:', error);
      }
    },
    [supabase]
  );

  // Handle ID input change
  const handleIdChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // Only allow digits
      const value = e.target.value.replace(/\D/g, '');

      // Limit to 4 digits maximum
      const truncatedValue = value.slice(0, 4);
      setIdNumber(truncatedValue);

      // Reset states if necessary
      if (isIdValid) {
        setIsIdValid(false);
        setAvailableOrders([]);
        setSelectedOrderRef(null);
        setOrderData([]);
      }

      // Automatically check ID if 4 digits are entered
      if (truncatedValue.length === 4) {
        checkIdExists(truncatedValue);
      }
    },
    [isIdValid, checkIdExists]
  );

  // Handle ID input blur (when user finishes typing)
  const handleIdBlur = useCallback(() => {
    // Only check if ID is 4 digits
    if (idNumber.length === 4) {
      checkIdExists(idNumber);
    } else if (idNumber.length > 0 && idNumber.length < 4) {
      // Show warning if digits are less than 4
      toast.warning('ID must be 4 digits');
    }
  }, [idNumber, checkIdExists]);

  // Handle order selection
  const handleOrderSelect = useCallback(
    (orderRef: string) => {
      sound.playScan();
      setSelectedOrderRef(orderRef);
      fetchOrderData(orderRef);
      fetchRecentLoads(orderRef);

      // Reset search value when switching orders
      setSearchValue('');

      // Auto focus on search input after order selection
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    },
    [sound, fetchOrderData, fetchRecentLoads]
  );

  // Open undo confirmation dialog
  const handleUndoClick = useCallback((load: UndoItem) => {
    setUndoItem(load);
    setShowUndoDialog(true);
  }, []);

  // Handle confirmed undo
  const handleConfirmedUndo = useCallback(async () => {
    if (!undoItem || !selectedOrderRef) return;

    try {
      // Call undo action
      const _result = await undoLoadPallet(
        selectedOrderRef,
        undoItem.pallet_num,
        undoItem.product_code,
        undoItem.quantity
      );

      if (_result.success) {
        sound.playSuccess();
        toast.success(`✓ Successfully undone: ${undoItem.pallet_num}`);
        // Refresh data
        await refreshAllData();
      } else {
        sound.playError();
        toast.error(`❌ Failed to undo: ${_result.message}`);
      }
    } catch (error) {
      console.error('Error undoing load:', error);
      sound.playError();
      toast.error('❌ System error during undo');
    } finally {
      setShowUndoDialog(false);
      setUndoItem(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [undoItem, selectedOrderRef, sound]);

  // Refresh all data
  const refreshAllData = useCallback(async () => {
    if (selectedOrderRef) {
      // Clear caches to ensure fresh data
      orderDataCache.remove(`order-data-${selectedOrderRef}`);
      orderSummariesCache.remove('order-summaries-all');

      await Promise.all([
        fetchOrderData(selectedOrderRef),
        fetchRecentLoads(selectedOrderRef),
        fetchAvailableOrders(),
      ]);
    }
  }, [
    selectedOrderRef,
    orderDataCache,
    orderSummariesCache,
    fetchOrderData,
    fetchRecentLoads,
    fetchAvailableOrders,
  ]);

  // Handle search selection (same as stock-transfer)
  const handleSearchSelect = useCallback(
    (result: SearchResult) => {
      if (!selectedOrderRef) {
        toast.error('Please select an order first');
        return;
      }

      // Execute async logic in background
      (async () => {
        setIsSearching(true);
        try {
          // 使用 server action 裝載棧板
          // 策略4: unknown + type narrowing - 安全獲取 input 值
          const inputValue =
            Array.isArray(result.data) && result.data.length > 0
              ? typeof result.data[0]?.value === 'string'
                ? result.data[0].value
                : result.title
              : (result.title ?? '');
          const response = await loadPalletToOrder(selectedOrderRef, inputValue);

          if (response.success) {
            // Play success sound
            sound.playSuccess();

            // Show success with better formatting
            if (response.data) {
              toast.success(
                `✓ Successfully Loaded! Pallet: ${response.data.palletNumber} | Product: ${response.data.productCode} | Qty: ${response.data.productQty} | Total: ${response.data.updatedLoadedQty}`
              );
            } else {
              toast.success(response.message);
            }

            // Show warning if anomaly detected
            if (response.warning) {
              sound.playWarning();
              setTimeout(() => {
                toast.warning(response.warning);
              }, 500);
            }

            // Refresh order data and history
            await refreshAllData();

            // Clear search value after successful scan
            setSearchValue('');

            // Refocus on search input
            if (searchInputRef.current) {
              searchInputRef.current.focus();
            }
          } else {
            // Show more user-friendly error messages
            let errorMessage = response.message;

            if (response.message.includes('Exceeds order quantity')) {
              errorMessage = response.message; // Already formatted well
            } else if (response.error === 'EXCEED_ORDER_QTY') {
              errorMessage = 'Cannot load more than ordered quantity';
            } else if (response.error === 'NOT_FOUND') {
              errorMessage = 'Pallet or series not found in system';
            } else if (response.error === 'INVALID_FORMAT') {
              errorMessage = 'Invalid scan format. Please scan a valid pallet or series barcode';
            } else if (response.message.includes('is not in order')) {
              errorMessage = response.message; // Already clear
            } else if (response.error === 'DUPLICATE_SCAN') {
              // Special handling for duplicate scan - use warning instead of error
              sound.playWarning();
              toast.warning(response.message);
              return;
            }

            sound.playError();
            toast.error(`❌ Loading Failed: ${errorMessage}`);
          }
        } catch (error) {
          console.error('Error loading pallet:', error);
          sound.playError();
          toast.error('Failed to load pallet');
        } finally {
          setIsSearching(false);
        }
      })();
    },
    [selectedOrderRef, sound, refreshAllData]
  );

  return {
    // State
    idNumber,
    isIdValid,
    isCheckingId,
    availableOrders,
    orderSummaries,
    selectedOrderRef,
    orderData,
    isLoadingOrders,
    searchValue,
    isSearching,
    recentLoads,
    orderSearchQuery,
    showUndoDialog,
    undoItem,

    // Functions
    setIdNumber,
    setSearchValue,
    setOrderSearchQuery,
    setShowUndoDialog,
    handleIdChange,
    handleIdBlur,
    handleOrderSelect,
    handleSearchSelect,
    handleUndoClick,
    handleConfirmedUndo,
    refreshAllData,

    // Refs
    idInputRef,
    searchInputRef,

    // Sound
    sound,
    soundSettings,
  };
}
