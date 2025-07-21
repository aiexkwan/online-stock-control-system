'use client';

import React, { useState, useEffect, useRef } from 'react';
import { safeString } from '@/types/database/helpers';

interface OrderSummary {
  percentage: number;
  completedItems: number;
  itemCount: number;
  loadedQty: number;
  totalQty: number;
}
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { UnifiedSearch } from '../../components/ui/unified-search';
import { createClient } from '../utils/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MobileButton, MobileInput, MobileCard } from '@/components/ui/mobile';
import { mobileConfig, cn } from '@/lib/mobile-config';
import {
  UserIcon,
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { loadPalletToOrder, undoLoadPallet, getOrderInfo } from '@/app/actions/orderLoadingActions';
import { safeNumber } from '@/lib/widgets/types/enhanced-widget-types';
import MobileOrderLoading from './components/MobileOrderLoading';
import { VirtualizedOrderList, virtualScrollStyles } from './components/VirtualizedOrderList';
import { useOrderDataCache, useOrderSummariesCache } from './hooks/useOrderCache';
import { useSoundFeedback, useSoundSettings } from '@/app/hooks/useSoundFeedback';
import { SoundSettingsToggle } from './components/SoundSettingsToggle';
import { LoadingProgressChart } from './components/LoadingProgressChart';

// 為了類型安全，複製 SearchResult 接口定義
interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  metadata?: string;
  data: Array<Record<string, unknown>>;
}

interface OrderData {
  order_ref: string;
  product_code: string;
  product_desc: string;
  product_qty: string;
  loaded_qty: string;
}

interface RecentLoad {
  uuid?: string;
  pallet_num?: string;
  product_code: string;
  quantity: number;
  action_time: string;
  [key: string]: unknown; // 允許其他屬性以保持兼容性
}

interface UndoItem {
  pallet_num: string;
  product_code: string;
  quantity: number;
  action_time?: string;
  action_by?: string;
  [key: string]: unknown; // 允許其他屬性以保持兼容性
}

interface OrderSummary {
  orderRef: string;
  totalQty: number;
  loadedQty: number;
  percentage: number;
  itemCount: number;
  completedItems: number;
}

export default function OrderLoadingPage() {
  const supabase = createClient();

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
  const [showRecentLoads, setShowRecentLoads] = useState(true);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [showUndoDialog, setShowUndoDialog] = useState(false);
  const [undoItem, setUndoItem] = useState<UndoItem | null>(null);

  // Cache hooks
  const orderDataCache = useOrderDataCache();
  const orderSummariesCache = useOrderSummariesCache();

  // Sound feedback hooks
  const soundSettings = useSoundSettings();
  const sound = useSoundFeedback({
    enabled: soundSettings.getSoundEnabled(),
    volume: soundSettings.getSoundVolume(),
  });

  // Refs
  const idInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto focus on ID input when page loads and check saved ID
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

  // Clear ID from localStorage when leaving the page
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
  const checkIdExists = async (id: string) => {
    // Ensure ID is 4 digits
    if (!id || id.length !== 4 || !/^\d{4}$/.test(id)) {
      setIsIdValid(false);
      setAvailableOrders([]);
      setSelectedOrderRef(null);
      setOrderData([]);
      return;
    }

    setIsCheckingId(true);

    try {
      const { data, error } = await supabase
        .from('data_id')
        .select('id')
        .eq('id', parseInt(id))
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
  };

  // Fetch available order references from data_order table with enhanced data
  const fetchAvailableOrders = async () => {
    try {
      // Check cache first
      const cacheKey = 'order-summaries-all';
      const cachedSummaries = orderSummariesCache.get(cacheKey) as
        | Map<string, OrderSummary>
        | undefined;

      if (cachedSummaries) {
        (process.env.NODE_ENV as string) !== 'production' &&
          console.log('[OrderCache] Using cached order summaries');
        setOrderSummaries(cachedSummaries);
        setAvailableOrders(Array.from(cachedSummaries.keys()));
        return;
      }

      (process.env.NODE_ENV as string) !== 'production' &&
        console.log('[OrderCache] Fetching fresh order summaries');

      // 直接從數據庫獲取訂單
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
      data.forEach(item => {
        const ref = safeString(item.order_ref);
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
        const order = orderMap.get(ref)!;
        const itemQty = parseInt(String(item.product_qty || '0'));
        const itemLoaded = parseInt(safeString(item.loaded_qty) || '0');

        order.totalQty += itemQty;
        order.loadedQty += itemLoaded;
        order.itemCount++;
        if (itemLoaded >= itemQty && itemQty > 0) {
          order.completedItems++;
        }
      });

      // Calculate percentages
      orderMap.forEach(order => {
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
  };

  // Fetch order data from data_order table
  const fetchOrderData = async (orderRef: string) => {
    setIsLoadingOrders(true);

    try {
      // Check cache first
      const cacheKey = `order-data-${orderRef}`;
      const cachedData = orderDataCache.get(cacheKey) as OrderData[] | undefined;

      if (cachedData) {
        (process.env.NODE_ENV as string) !== 'production' &&
          console.log(`[OrderCache] Using cached data for order: ${orderRef}`);
        setOrderData(cachedData);
        setIsLoadingOrders(false);
        return;
      }

      (process.env.NODE_ENV as string) !== 'production' &&
        console.log(`[OrderCache] Fetching fresh data for order: ${orderRef}`);

      // 獲取訂單詳情
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
      // @types-migration:todo(phase3) [P2] 驗證 Supabase 查詢返回類型匹配 OrderData[] - Target: 2025-08 - Owner: @frontend-team
      setOrderData(orderDataArray as OrderData[]);

      // Cache the order data
      orderDataCache.set(cacheKey, orderDataArray);
    } catch (error) {
      console.error('Error fetching order data:', error);
      toast.error('Error occurred while fetching order data');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  // Handle ID input change
  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  // Handle ID input blur (when user finishes typing)
  const handleIdBlur = () => {
    // Only check if ID is 4 digits
    if (idNumber.length === 4) {
      checkIdExists(idNumber);
    } else if (idNumber.length > 0 && idNumber.length < 4) {
      // Show warning if digits are less than 4
      toast.warning('ID must be 4 digits');
    }
  };

  // Handle order selection
  const handleOrderSelect = (orderRef: string) => {
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
  };

  // Fetch recent loading history from record_history
  const fetchRecentLoads = async (orderRef: string) => {
    try {
      const { data, error } = await supabase
        .from('record_history')
        .select('*')
        .eq('action', 'Order Load')
        .like('remark', `%Order: ${orderRef}%`)
        .order('time', { ascending: false })
        .limit(10);

      if (!error && data) {
        // Transform data to match expected format
        const transformedData = data.map(item => {
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
            quantity: qtyMatch ? parseInt(qtyMatch[1]) : 0,
            action_type: 'load',
            action_by: byMatch ? byMatch[1] : 'Unknown',
            action_time: item.time,
          };
        });
        // @types-migration:todo(phase3) [P2] 調整 transformedData 結構匹配 RecentLoad 接口 - Target: 2025-08 - Owner: @frontend-team
        setRecentLoads(transformedData);
      }
    } catch (error) {
      console.error('Error fetching recent loads:', error);
    }
  };

  // Open undo confirmation dialog
  const handleUndoClick = (load: UndoItem) => {
    setUndoItem(load);
    setShowUndoDialog(true);
  };

  // Handle confirmed undo
  const handleConfirmedUndo = async () => {
    if (!undoItem || !selectedOrderRef) return;

    try {
      // Call undo action
      const result = await undoLoadPallet(
        selectedOrderRef,
        undoItem.pallet_num,
        undoItem.product_code,
        undoItem.quantity
      );

      if (result.success) {
        sound.playSuccess();
        toast.success(`✓ Successfully undone: ${undoItem.pallet_num}`);
        // Refresh data
        await refreshAllData();
      } else {
        sound.playError();
        toast.error(`❌ Failed to undo: ${result.message}`);
      }
    } catch (error) {
      console.error('Error undoing load:', error);
      sound.playError();
      toast.error('❌ System error during undo');
    } finally {
      setShowUndoDialog(false);
      setUndoItem(null);
    }
  };

  // Refresh all data
  const refreshAllData = async () => {
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
  };

  // Handle search selection (same as stock-transfer)
  const handleSearchSelect = async (result: SearchResult) => {
    if (!selectedOrderRef) {
      toast.error('Please select an order first');
      return;
    }

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
  };

  // Check if mobile view (simplified check - you might want to use a proper hook)
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div>
      <div className='pb-8 pt-24'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          {/* Page Header */}
          <div className='mb-6 md:mb-8'>
            <div className='flex items-center justify-between'>
              <div>
                <h1
                  className={cn(
                    mobileConfig.fontSize.h1,
                    'mb-2 bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-200 bg-clip-text font-bold text-transparent'
                  )}
                >
                  Order Loading
                </h1>
                <p className={cn(mobileConfig.fontSize.bodyLarge, 'text-slate-400')}>
                  Manage order loading process
                </p>
              </div>
              <SoundSettingsToggle />
            </div>
          </div>

          {/* Mobile View */}
          {isMobile ? (
            <MobileOrderLoading
              idNumber={idNumber}
              isIdValid={isIdValid}
              isCheckingId={isCheckingId}
              onIdChange={handleIdChange}
              onIdBlur={handleIdBlur}
              availableOrders={availableOrders}
              orderSummaries={orderSummaries}
              selectedOrderRef={selectedOrderRef}
              orderSearchQuery={orderSearchQuery}
              onOrderSearchChange={setOrderSearchQuery}
              onOrderSelect={handleOrderSelect}
              onChangeUser={() => {}} // Keep empty function to avoid prop errors
              orderData={orderData as unknown as Record<string, unknown>[]}
              isLoadingOrders={isLoadingOrders}
              searchValue={searchValue}
              isSearching={isSearching}
              onSearchChange={setSearchValue}
              onSearchSelect={handleSearchSelect}
              recentLoads={recentLoads}
              onUndoClick={handleUndoClick}
              idInputRef={idInputRef}
              searchInputRef={searchInputRef}
            />
          ) : (
            // Desktop View (existing code)
            <>
              <div className='grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-8'>
                {/* Left Column - ID Input and Order Selection */}
                <div className='space-y-6'>
                  {/* ID Input Card */}
                  <div className='operational-card operational-glow'>
                    <Card className='border-slate-700/50 bg-slate-800/50 backdrop-blur-sm'>
                      <CardHeader>
                        <CardTitle className='flex items-center text-slate-200'>
                          <UserIcon className='mr-2 h-6 w-6 text-blue-400' />
                          Enter ID Number
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='space-y-4'>
                          <div className='relative'>
                            <input
                              ref={idInputRef}
                              type='text'
                              value={idNumber}
                              onChange={handleIdChange}
                              onBlur={handleIdBlur}
                              placeholder='Enter 4-digit ID...'
                              maxLength={4}
                              className='w-full rounded-xl border border-slate-600/50 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-400 transition-all duration-300 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50'
                              disabled={isCheckingId}
                            />
                            {isCheckingId && (
                              <div className='absolute right-3 top-1/2 -translate-y-1/2 transform'>
                                <div className='h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent'></div>
                              </div>
                            )}
                          </div>

                          {/* ID format hint */}
                          <p className='text-xs text-slate-400'>
                            Please enter your 4-digit employee ID
                          </p>

                          {/* ID Status Indicator - Only show error state */}
                          {idNumber.length === 4 && !isCheckingId && !isIdValid && (
                            <div className='flex items-center space-x-2 text-sm text-red-400'>
                              <ExclamationTriangleIcon className='h-5 w-5' />
                              <span>ID does not exist</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Order Selection Card */}
                  {isIdValid && availableOrders.length > 0 && !selectedOrderRef && (
                    <div className='operational-card'>
                      <Card className='border-slate-700/50 bg-slate-800/50 backdrop-blur-sm'>
                        <CardHeader>
                          <CardTitle className='flex items-center text-slate-200'>
                            <ClipboardDocumentListIcon className='mr-2 h-6 w-6 text-green-400' />
                            Choose order
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {/* Order Search */}
                          <div className='mb-4'>
                            <input
                              type='text'
                              placeholder='Search orders...'
                              value={orderSearchQuery}
                              onChange={e => setOrderSearchQuery(e.target.value)}
                              className='w-full rounded-lg border border-slate-600/50 bg-slate-700/50 px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/50'
                            />
                          </div>

                          <VirtualizedOrderList
                            orders={availableOrders}
                            orderSummaries={orderSummaries}
                            selectedOrderRef={selectedOrderRef}
                            searchQuery={orderSearchQuery}
                            onOrderSelect={handleOrderSelect}
                            containerHeight={384} // Fixed height for desktop
                          />
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>

                {/* Right Column - Order Information and Search */}
                <div className='space-y-6'>
                  {/* Progress Chart - Show first for better visibility */}
                  {selectedOrderRef && orderData.length > 0 && (
                    <LoadingProgressChart orderData={orderData} recentLoads={recentLoads} />
                  )}

                  {/* Order Information Card */}
                  {selectedOrderRef && (
                    <div className='operational-highlight'>
                      <Card className='border-slate-700/50 bg-slate-800/50 backdrop-blur-sm'>
                        <CardHeader>
                          <CardTitle className='flex items-center justify-between text-slate-200'>
                            <div className='flex items-center'>
                              <ClipboardDocumentListIcon className='mr-2 h-6 w-6 text-cyan-400' />
                              Order Details - Order #{selectedOrderRef}
                            </div>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => {
                                setSelectedOrderRef(null);
                                setOrderData([]);
                                setSearchValue('');
                              }}
                              className='bg-transparent text-purple-400 hover:bg-transparent hover:text-purple-300'
                            >
                              Change Order
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {isLoadingOrders ? (
                            <div className='flex items-center justify-center py-8'>
                              <div className='h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent'></div>
                              <span className='ml-3 text-slate-400'>Loading order data...</span>
                            </div>
                          ) : orderData.length > 0 ? (
                            <div className='space-y-4'>
                              {orderData.map((order, index) => {
                                const totalQty = parseInt(order.product_qty || '0');
                                const loadedQty = parseInt(order.loaded_qty || '0');
                                const percentage = totalQty > 0 ? (loadedQty / totalQty) * 100 : 0;
                                const isComplete = loadedQty >= totalQty;
                                const remainingQty = totalQty - loadedQty;
                                const isNearComplete = percentage >= 90 && percentage < 100;

                                return (
                                  <div
                                    key={index}
                                    className='rounded-lg border border-slate-600/30 bg-slate-700/30 p-4'
                                  >
                                    <div className='flex items-start justify-between'>
                                      <div className='flex-1'>
                                        <div className='flex items-center gap-2'>
                                          <span className='font-mono text-cyan-300'>
                                            {order.product_code}
                                          </span>
                                          {isComplete && (
                                            <span className='rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400'>
                                              ✓ Complete
                                            </span>
                                          )}
                                        </div>
                                        <div className='mt-1 text-sm text-slate-400'>
                                          {order.product_desc}
                                        </div>
                                      </div>
                                      <div className='text-right'>
                                        <div className='text-lg font-semibold text-white'>
                                          {loadedQty}/{totalQty}
                                        </div>
                                        <div className='text-sm text-slate-400'>units</div>
                                      </div>
                                    </div>

                                    {/* Warning for nearly complete items */}
                                    {isNearComplete && (
                                      <div className='mt-3 rounded-lg border border-orange-600/50 bg-orange-900/30 p-2'>
                                        <span className='text-xs text-orange-400'>
                                          ⚠️ Only {remainingQty} units remaining
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className='py-8 text-center text-slate-400'>
                              No order data found
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Search Card */}
                  {selectedOrderRef && (
                    <div className='operational-card operational-glow'>
                      <Card className='border-slate-700/50 bg-slate-800/50 backdrop-blur-sm'>
                        <CardHeader>
                          <CardTitle className='flex items-center justify-between text-slate-200'>
                            <div className='flex items-center'>
                              <MagnifyingGlassIcon className='mr-2 h-6 w-6 text-purple-400' />
                              Scan As You Load
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <UnifiedSearch
                            ref={searchInputRef}
                            searchType='pallet'
                            onSelect={handleSearchSelect}
                            placeholder='Search Pallet number or Series...'
                            enableAutoDetection={true}
                            value={searchValue}
                            onChange={setSearchValue}
                            isLoading={isSearching}
                            disabled={isSearching}
                          />

                          {/* Recent Loads History */}
                          {recentLoads.length > 0 && (
                            <div className='mt-4 space-y-2'>
                              <div className='mb-2 text-sm font-medium text-slate-400'>
                                Recent Loads:
                              </div>
                              <div className='max-h-40 space-y-2 overflow-y-auto'>
                                {recentLoads.map((load, index) => (
                                  <div
                                    key={load.uuid}
                                    className='flex items-center justify-between rounded-lg bg-slate-700/30 p-2 text-xs'
                                  >
                                    <div className='flex-1'>
                                      <span className='font-mono text-cyan-300'>
                                        {load.pallet_num}
                                      </span>
                                      <span className='mx-2 text-slate-400'>•</span>
                                      <span className='text-slate-300'>{load.product_code}</span>
                                      <span className='mx-2 text-slate-400'>•</span>
                                      <span className='text-green-300'>Qty: {load.quantity}</span>
                                    </div>
                                    <div className='flex items-center space-x-2'>
                                      <span className='text-slate-500'>
                                        {new Date(load.action_time).toLocaleTimeString()}
                                      </span>
                                      <Button
                                        variant='ghost'
                                        size='sm'
                                        onClick={() =>
                                          handleUndoClick({
                                            ...load,
                                            pallet_num: load.pallet_num || '',
                                            product_code: load.product_code,
                                            quantity: load.quantity,
                                          })
                                        }
                                        className='h-6 w-6 p-0 hover:bg-red-500/20 hover:text-red-400'
                                        title='Undo this load'
                                      >
                                        <XMarkIcon className='h-4 w-4' />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Undo Confirmation Dialog */}
      <Dialog open={showUndoDialog} onOpenChange={setShowUndoDialog}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>Confirm Undo Loading</DialogTitle>
            <DialogDescription>
              Are you sure you want to undo this loading operation?
            </DialogDescription>
          </DialogHeader>
          {undoItem && (
            <div className='space-y-2 py-4'>
              <div className='flex justify-between'>
                <span className='text-slate-500'>Pallet:</span>
                <span className='font-mono text-cyan-300'>{undoItem.pallet_num}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-slate-500'>Product:</span>
                <span>{undoItem.product_code}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-slate-500'>Quantity:</span>
                <span className='text-green-300'>{undoItem.quantity} units</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-slate-500'>Loaded at:</span>
                <span>
                  {undoItem.action_time
                    ? new Date(undoItem.action_time).toLocaleString()
                    : 'Unknown'}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-slate-500'>Loaded by:</span>
                <span>{undoItem.action_by || 'Unknown'}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant='outline' onClick={() => setShowUndoDialog(false)}>
              Cancel
            </Button>
            <Button variant='destructive' onClick={handleConfirmedUndo}>
              Confirm Undo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Virtual Scroll Styles */}
      <style jsx global>
        {virtualScrollStyles}
      </style>
    </div>
  );
}
