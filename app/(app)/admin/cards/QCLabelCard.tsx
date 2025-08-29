'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { ApolloError } from '@apollo/client';
import { SpecialCard } from '@/lib/card-system/EnhancedGlassmorphicCard';
import { cardTextStyles } from '@/lib/card-system/theme';
import { cn } from '@/lib/utils';
import GridBasicProductFormGraphQL from '../components/GridBasicProductFormGraphQL';
import { CardErrorBoundary } from '@/lib/error-handling';
import { useAdminQcLabelBusiness } from '../hooks/useAdminQcLabelBusiness';
import { MAX_PALLET_COUNT } from '../components/qc-label-constants';
import { createClient } from '@/app/utils/supabase/client';
import { useAcoOrderReport, useOrderData } from '@/lib/hooks/useOrderData';
import { useAuth } from '@/app/hooks/useAuth';
import type { ProductInfo, AdminFormData as FormData } from '../types/adminQcTypes';

// 重型組件的懶加載
const UserIdVerificationDialog = React.lazy(() => import('../components/UserIdVerificationDialog'));
const EnhancedProgressBar = React.lazy(() => import('../components/EnhancedProgressBar'));

export interface QCLabelCardProps {
  className?: string;
}

export const QCLabelCard: React.FC<QCLabelCardProps> = ({ className }) => {
  const { loading, isAuthenticated } = useAuth();

  // UserIdVerificationDialog 狀態
  const [showUserIdDialog, setShowUserIdDialog] = useState(false);

  // 初始表單數據狀態
  const getInitialFormData = useCallback(
    () => ({
      productCode: '',
      productInfo: null,
      quantity: '',
      count: '',
      operator: '',
      userId: '', // 用戶ID將在需要時由 UserIdVerificationDialog 設置
      acoOrderRef: '',
      acoRemain: null,
      availableAcoOrders: [],
      acoOrdersLoading: false,
      slateDetail: {
        batchNumber: '',
      },
      pdfProgress: {
        current: 0,
        total: 0,
        status: [],
      },
      isLoading: false,
      acoSearchLoading: false,
      productError: null,
    }),
    []
  );

  // 表單狀態
  const [formData, setFormData] = useState<FormData>(getInitialFormData());
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // ACO訂單狀態及緩存 - 保持獨立以避免循環更新
  const [acoOrders, setAcoOrders] = useState<string[]>([]);
  const [isLoadingAcoOrders, setIsLoadingAcoOrders] = useState(false);
  const acoOrdersCache = useRef<Map<string, { orders: string[]; timestamp: number }>>(new Map());
  const loadingAcoRef = useRef<AbortController | null>(null);

  // 錯誤覆蓋層狀態
  const [showErrorOverlay, setShowErrorOverlay] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [overlayType, setOverlayType] = useState<'error' | 'warning'>('error');

  // 輕量提醒狀態（用於非關鍵訊息）
  const [reminder, setReminder] = useState<string | null>(null);
  const reminderTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 記憶化的欄位錯誤計算
  const getFieldError = useCallback(
    (field: string): string => {
      if (!touched[field]) return '';

      switch (field) {
        case 'productCode':
          return formData.productCode.trim() ? '' : 'Product code is required';
        case 'quantity':
          const quantityStr = String(formData.quantity || '');
          return !quantityStr.trim() || parseInt(quantityStr) <= 0
            ? 'Valid quantity is required'
            : '';
        case 'count':
          const countStr = String(formData.count || '');
          return !countStr.trim() || parseInt(countStr) <= 0 ? 'Valid count is required' : '';
        case 'acoOrderRef':
          return productInfo?.type === 'ACO' && !formData.acoOrderRef.trim()
            ? 'ACO Order Reference is required'
            : '';
        case 'batchNumber':
          return productInfo?.type?.toLowerCase().includes('slate') &&
            !formData.slateDetail.batchNumber.trim()
            ? 'Batch number is required'
            : '';
        default:
          return '';
      }
    },
    [formData, productInfo, touched]
  );

  // Check if form is valid
  const isFormValid = useCallback(() => {
    if (!formData.productCode.trim()) return false;
    const quantityStr = String(formData.quantity || '');
    if (!quantityStr.trim() || parseInt(quantityStr) <= 0) return false;
    const countStr = String(formData.count || '');
    if (!countStr.trim() || parseInt(countStr) <= 0) return false;
    if (productInfo?.type === 'ACO' && !formData.acoOrderRef.trim()) return false;
    if (
      productInfo?.type?.toLowerCase().includes('slate') &&
      !formData.slateDetail.batchNumber.trim()
    )
      return false;
    return true;
  }, [formData, productInfo]);

  // Handle input changes with debouncing for validation
  const handleInputChange = useCallback((field: keyof FormData, value: string) => {
    // Update form data immediately for responsive UI
    setFormData(prev => ({ ...prev, [field]: value }));

    // Debounce the touched state update for validation
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setTouched(prev => ({ ...prev, [field]: true }));
      debounceTimeoutRef.current = null;
    }, 300); // 300ms debounce for validation
  }, []);

  // Create supabase client once
  const supabase = useMemo(() => createClient(), []);

  // Product code input handler
  const handleProductCodeChange = useCallback(
    (value: string) => {
      handleInputChange('productCode', value);
    },
    [handleInputChange]
  );

  // Handle product code blur event
  const handleProductCodeBlur = useCallback(() => {
    // 不需要在這裡檢查，ProductCodeInput 會處理錯誤顯示
    // 呢度只係 placeholder，俾 ProductCodeInput 知道 blur 事件發生咗
  }, []);

  // Simple handler for product info change
  const handleProductInfoChange = (newProductInfo: ProductInfo | null) => {
    setProductInfo(newProductInfo);

    // 當找到產品時，更新產品代碼為正確大小寫並填充標準數量
    if (newProductInfo) {
      // 對於 Slate 產品，自動設置 count 為 1
      const isSlateProduct = newProductInfo.type?.toLowerCase().includes('slate');

      setFormData(prev => ({
        ...prev,
        productCode: newProductInfo.code,
        quantity: newProductInfo.standard_qty,
        count: isSlateProduct ? '1' : prev.count || '1', // 如果是 Slate 設為 1，否則保留原值或預設 1
      }));
      setShowErrorOverlay(false);
    }

    // Clear ACO data when product changes
    if (!newProductInfo || newProductInfo.type !== 'ACO') {
      setAcoOrders([]);
      // Use updater function to avoid dependency on formData
      setFormData(prev => ({ ...prev, acoOrderRef: '', acoRemain: null }));
    } else if (newProductInfo.type === 'ACO' && newProductInfo.code) {
      // Load ACO orders for ACO products
      // TODO: Migrate this to GraphQL when ACO orders are added to the GraphQL schema
      setIsLoadingAcoOrders(true);

      // Use async function to load ACO orders with caching and cancellation
      const loadAcoOrders = async () => {
        try {
          // Check cache first (5 minutes TTL)
          const cached = acoOrdersCache.current.get(newProductInfo.code);
          if (cached && Date.now() - cached.timestamp < 300000) {
            setAcoOrders(cached.orders);
            setIsLoadingAcoOrders(false);
            return;
          }

          // Cancel previous request if exists
          if (loadingAcoRef.current) {
            loadingAcoRef.current.abort();
          }

          // Create new abort controller
          loadingAcoRef.current = new AbortController();

          const { data, error } = await supabase
            .from('record_aco')
            .select('order_ref, required_qty, finished_qty')
            .eq('code', newProductInfo.code)
            .order('order_ref', { ascending: false })
            .abortSignal(loadingAcoRef.current.signal);

          if (error) {
            console.error('Error loading ACO orders:', error);
            setAcoOrders([]);
          } else {
            // Group by order_ref and calculate remaining quantities
            const orderMap = new Map<string, { required: number; finished: number }>();

            data?.forEach(item => {
              const orderRef = item.order_ref.toString();
              const existing = orderMap.get(orderRef);

              if (existing) {
                // If duplicate, sum up the quantities
                orderMap.set(orderRef, {
                  required: existing.required + (item.required_qty || 0),
                  finished: existing.finished + (item.finished_qty || 0),
                });
              } else {
                orderMap.set(orderRef, {
                  required: item.required_qty || 0,
                  finished: item.finished_qty || 0,
                });
              }
            });

            // Filter only orders with remaining quantity > 0
            const availableOrders = Array.from(orderMap.entries())
              .filter(([_, quantities]) => quantities.required - quantities.finished > 0)
              .map(([orderRef]) => orderRef)
              .sort((a, b) => parseInt(b) - parseInt(a)); // Sort descending

            setAcoOrders(availableOrders);

            // Cache the result
            acoOrdersCache.current.set(newProductInfo.code, {
              orders: availableOrders,
              timestamp: Date.now(),
            });
          }
        } catch (error: unknown) {
          if (
            error &&
            typeof error === 'object' &&
            'name' in error &&
            error.name !== 'AbortError'
          ) {
            console.error('Error loading ACO orders:', error);
            setAcoOrders([]);
          }
        } finally {
          setIsLoadingAcoOrders(false);
          loadingAcoRef.current = null;
        }
      };

      loadAcoOrders();
    }
  };

  // Memoize onProductInfoReset to prevent re-creation
  const onProductInfoReset = useCallback(() => {
    setProductInfo(null);
    setTouched({});
    setAcoOrders([]);
    setIsLoadingAcoOrders(false);
    setFormData(getInitialFormData());
  }, [getInitialFormData]);

  // Callbacks for error/warning overlays
  const handleShowError = useCallback((message: string) => {
    setErrorMessage(message);
    setOverlayType('error');
    setShowErrorOverlay(true);
  }, []);

  const handleShowWarning = useCallback((message: string) => {
    // 判斷係咪輕量提示
    if (message.includes('Processing in progress')) {
      // 輕量提示
      setReminder(message);
      // 清理之前的定時器
      if (reminderTimeoutRef.current) {
        clearTimeout(reminderTimeoutRef.current);
      }
      // 3 秒後自動消失
      reminderTimeoutRef.current = setTimeout(() => {
        setReminder(null);
        reminderTimeoutRef.current = null;
      }, 3000);
    } else {
      // 全屏 overlay
      setErrorMessage(message);
      setOverlayType('warning');
      setShowErrorOverlay(true);
    }
  }, []);

  // Business logic hook
  const businessLogic = useAdminQcLabelBusiness({
    formData,
    setFormData,
    productInfo,
    onProductInfoReset,
    onShowError: handleShowError,
    onShowWarning: handleShowWarning,
  });

  // Check if count exceeds limit
  const isCountExceeded = useMemo(() => {
    const countValue = parseInt(formData.count) || 0;
    return countValue > MAX_PALLET_COUNT;
  }, [formData.count]);

  // Handle print button - 直接顯示 UserIdVerificationDialog
  const handlePrintLabel = useCallback((e?: React.FormEvent) => {
    console.log('[QCLabelCard] handlePrintLabel called');
    if (e) e.preventDefault();

    // 讓 UserIdVerificationDialog 處理所有用戶ID驗證邏輯
    setShowUserIdDialog(true);
  }, []);

  // 用戶ID驗證後處理實際列印
  const handleVerifiedPrint = useCallback(
    (verifiedUserId: string) => {
      console.log('[QCLabelCard] handleVerifiedPrint called with verified user ID');

      // 嘗試提交時標記所有欄位為已觸碰
      setTouched({
        productCode: true,
        quantity: true,
        count: true,
        acoOrderRef: productInfo?.type === 'ACO',
        batchNumber: productInfo?.type?.toLowerCase().includes('slate') || false,
      });

      if (!isFormValid()) {
        return;
      }

      // 進行前檢查ACO數量
      if (productInfo?.type === 'ACO' && formData.acoOrderRef && formData.acoRemain !== null) {
        const quantityStr = String(formData.quantity || '');
        const countStr = String(formData.count || '');
        const totalQuantity = parseInt(quantityStr) * parseInt(countStr);

        if (totalQuantity > formData.acoRemain) {
          setShowErrorOverlay(true);
          setErrorMessage(
            'Quantity exceeds remaining order amount.\nPlease adjust quantity or select different order.'
          );
          return;
        }
      }

      // 在這個簡化方法中不需要合成表單事件

      // 直接使用已驗證的用戶ID調用時鐘號確認
      businessLogic.handleClockNumberConfirm(verifiedUserId);
    },
    [productInfo, formData, isFormValid, businessLogic]
  );

  // 列印按鈕狀態
  const isPrintDisabled =
    !isFormValid() ||
    formData.isLoading ||
    businessLogic.isProcessing ||
    businessLogic.isAcoOrderExcess ||
    businessLogic.isAcoOrderFulfilled ||
    businessLogic.isAcoOrderIncomplete ||
    isCountExceeded;

  const printButtonText =
    formData.isLoading || businessLogic.isProcessing
      ? 'Processing...'
      : businessLogic.isAcoOrderFulfilled
        ? 'Order Fulfilled'
        : businessLogic.isAcoOrderExcess
          ? 'Quantity Exceeds'
          : businessLogic.isAcoOrderIncomplete
            ? 'Complete ACO'
            : isCountExceeded
              ? 'Limit Exceeded'
              : 'Print Label';

  // UserIdVerificationDialog 驗證處理器
  const handleUserIdVerified = useCallback(
    (verifiedUserId: string) => {
      setShowUserIdDialog(false);
      // 使用已驗證的用戶ID執行列印
      handleVerifiedPrint(verifiedUserId);
    },
    [handleVerifiedPrint]
  );

  const handleUserIdVerificationCancel = useCallback(() => {
    setShowUserIdDialog(false);
  }, []);

  // 組件卸載時清理
  useEffect(() => {
    return () => {
      if (reminderTimeoutRef.current) {
        clearTimeout(reminderTimeoutRef.current);
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (loadingAcoRef.current) {
        loadingAcoRef.current.abort();
      }
    };
  }, []);

  return (
    <div className={`h-full ${className || ''}`}>
      <SpecialCard
        variant='glass'
        isHoverable={false}
        borderGlow={false}
        className='h-full overflow-hidden'
        padding='none'
      >
        <div className='flex h-full flex-col'>
          {/* Header */}
          <div className='border-b border-slate-700/50 p-4'>
            <h2 className={cn(cardTextStyles.title, 'text-white')}>QC Label Generation</h2>
            <p className={cn(cardTextStyles.body, 'text-slate-400')}>Printing QC labels</p>
          </div>

          <div className='min-h-0 flex-1 overflow-auto p-4'>
            <div className='space-y-6'>
              {/* Main Form - GraphQL Version */}
              <CardErrorBoundary cardName='QCLabel'>
                <GridBasicProductFormGraphQL
                  productCode={formData.productCode}
                  onProductCodeChange={handleProductCodeChange}
                  onProductCodeBlur={handleProductCodeBlur}
                  productInfo={productInfo}
                  onProductInfoChange={handleProductInfoChange}
                  quantity={formData.quantity}
                  onQuantityChange={value => handleInputChange('quantity', value)}
                  count={formData.count}
                  onCountChange={value => handleInputChange('count', value)}
                  operator={formData.operator}
                  onOperatorChange={value => handleInputChange('operator', value)}
                  onPrintLabel={handlePrintLabel}
                  isPrintDisabled={isPrintDisabled}
                  isPrintLoading={formData.isLoading || businessLogic.isProcessing}
                  printButtonText={printButtonText}
                  errors={{
                    productCode: getFieldError('productCode'),
                    quantity: getFieldError('quantity'),
                    count: getFieldError('count'),
                    operator: getFieldError('operator'),
                  }}
                  disabled={formData.isLoading}
                />
              </CardErrorBoundary>

              {/* ACO/Slate Details */}
              {productInfo &&
                (productInfo.type === 'ACO' ||
                  productInfo.type?.toLowerCase().includes('slate')) && (
                  <div className='space-y-4'>
                    {productInfo.type?.toLowerCase().includes('slate') && (
                      <h3 className={cn(cardTextStyles.subtitle, 'text-white')}>
                        Slate Product Details
                      </h3>
                    )}

                    {productInfo.type === 'ACO' && (
                      <div className='space-y-3'>
                        <label
                          className={cn(cardTextStyles.body, 'block font-semibold text-slate-300')}
                        >
                          ACO Order Reference
                        </label>
                        <div className='flex gap-2'>
                          <select
                            value={formData.acoOrderRef}
                            onChange={e => {
                              handleInputChange('acoOrderRef', e.target.value);
                              if (e.target.value) {
                                businessLogic.handleAutoAcoConfirm(e.target.value);
                              }
                            }}
                            className='flex-1 rounded-md border-none bg-white/10 px-3 py-2 text-white backdrop-blur-sm focus:outline-none focus:ring-1 focus:ring-white/30'
                            disabled={
                              formData.isLoading || formData.acoSearchLoading || isLoadingAcoOrders
                            }
                          >
                            <option value=''>Select ACO Order...</option>
                            {acoOrders.map(orderRef => (
                              <option key={orderRef} value={orderRef}>
                                {orderRef}
                              </option>
                            ))}
                          </select>
                          {(formData.acoSearchLoading || isLoadingAcoOrders) && (
                            <div
                              className={cn(
                                cardTextStyles.body,
                                'flex items-center text-slate-400'
                              )}
                            >
                              <span className='animate-pulse'>Loading...</span>
                            </div>
                          )}
                        </div>
                        {formData.acoRemain !== null && (
                          <p className={cn(cardTextStyles.body, 'text-slate-400')}>
                            Remaining Quantity:{' '}
                            <span className={cn(cardTextStyles.body, 'font-semibold text-white')}>
                              {formData.acoRemain}
                            </span>
                          </p>
                        )}
                        {touched.acoOrderRef && getFieldError('acoOrderRef') && (
                          <p className={cn(cardTextStyles.body, 'text-red-400')}>
                            {getFieldError('acoOrderRef')}
                          </p>
                        )}
                        {businessLogic.isAcoOrderExcess && (
                          <p className={cn(cardTextStyles.body, 'text-yellow-400')}>
                            Quantity exceeds remaining order amount
                          </p>
                        )}
                        {businessLogic.isAcoOrderFulfilled && (
                          <p className={cn(cardTextStyles.body, 'text-green-400')}>
                            This order has been fulfilled
                          </p>
                        )}
                      </div>
                    )}

                    {productInfo.type?.toLowerCase().includes('slate') && (
                      <div className='space-y-3'>
                        <label
                          className={cn(cardTextStyles.body, 'block font-semibold text-slate-300')}
                        >
                          Batch Number <span className='text-red-400'>*</span>
                        </label>
                        <input
                          type='text'
                          value={formData.slateDetail.batchNumber}
                          onChange={e =>
                            businessLogic.handleSlateDetailChange({ batchNumber: e.target.value })
                          }
                          placeholder='Enter batch number'
                          className='w-full rounded-md border-none bg-white/10 px-3 py-2 text-white placeholder-slate-400 backdrop-blur-sm focus:outline-none focus:ring-1 focus:ring-white/30'
                          disabled={formData.isLoading}
                        />
                        {touched.batchNumber && getFieldError('batchNumber') && (
                          <p className={cn(cardTextStyles.body, 'text-red-400')}>
                            {getFieldError('batchNumber')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

              {/* Progress */}
              {formData.pdfProgress.total > 0 && (
                <div className='space-y-4'>
                  <h3 className={cn(cardTextStyles.subtitle, 'text-white')}>Generation Progress</h3>
                  <React.Suspense
                    fallback={<div className='h-4 animate-pulse rounded bg-slate-700' />}
                  >
                    <EnhancedProgressBar
                      current={formData.pdfProgress.current}
                      total={formData.pdfProgress.total}
                      status={formData.pdfProgress.status}
                      title='QC Label Generation'
                      variant='compact'
                      showPercentage={true}
                      showItemDetails={true}
                      className='w-full'
                    />
                  </React.Suspense>
                </div>
              )}
            </div>
          </div>
        </div>
      </SpecialCard>

      {/* Light Reminder */}
      {reminder && (
        <div className='fixed left-1/2 top-20 z-40 -translate-x-1/2'>
          <div className='flex items-center gap-2 rounded-lg border-none bg-white/10 px-4 py-3 shadow-lg backdrop-blur-sm'>
            <div className='text-red-400'>⚠️</div>
            <div className={cn(cardTextStyles.body, 'font-semibold text-slate-100')}>
              {reminder}
            </div>
          </div>
        </div>
      )}

      {/* UserIdVerificationDialog - 處理所有用戶ID驗證邏輯 */}
      {showUserIdDialog && (
        <React.Suspense
          fallback={
            <div className='fixed inset-0 flex items-center justify-center bg-black/50'>
              <div className='h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent' />
            </div>
          }
        >
          <UserIdVerificationDialog
            isOpen={showUserIdDialog}
            onOpenChange={setShowUserIdDialog}
            onVerified={handleUserIdVerified}
            onCancel={handleUserIdVerificationCancel}
            title='User ID Required'
            description='Your account metadata does not contain a User ID. Please enter your User ID to continue.'
            isLoading={formData.isLoading}
          />
        </React.Suspense>
      )}

      {/* Error/Warning Overlay */}
      {showErrorOverlay && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4'
          onClick={() => setShowErrorOverlay(false)}
        >
          <div
            className={`rounded-lg p-8 text-center shadow-xl ${
              overlayType === 'error' ? 'bg-red-900/90' : 'bg-yellow-900/90'
            }`}
          >
            <div className='mb-4 text-6xl'>{overlayType === 'error' ? '⚠️' : '⚡'}</div>
            <div
              className={cn(cardTextStyles.title, 'whitespace-pre-line font-semibold text-white')}
            >
              {errorMessage}
            </div>
            <button
              onClick={() => setShowErrorOverlay(false)}
              className='mt-6 rounded-md bg-white/20 px-6 py-2 text-white hover:bg-white/30'
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QCLabelCard;
