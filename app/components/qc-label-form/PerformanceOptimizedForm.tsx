'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MAX_PALLET_COUNT, SLATE_DEFAULT_COUNT } from './constants';
import { useSearchParams } from 'next/navigation';
import { 
  ResponsiveLayout, 
  ResponsiveContainer, 
  ResponsiveCard, 
  ResponsiveStack 
} from './ResponsiveLayout';
import { 
  EnhancedFormField, 
  EnhancedInput, 
  EnhancedSelect 
} from './EnhancedFormField';
import { 
  Accordion, 
  AccordionItem, 
  AccordionGroup 
} from './Accordion';
import { EnhancedProgressBar } from './EnhancedProgressBar';
import { ProductCodeInput } from './ProductCodeInput';
import { BasicProductForm } from './BasicProductForm';
import { AcoOrderForm } from './AcoOrderForm';
import { SlateDetailsForm } from './SlateDetailsForm';
import { FormPersistenceIndicator } from './FormPersistenceIndicator';
import { useErrorHandler } from './hooks/useErrorHandler';
import { useMediaQuery } from './hooks/useMediaQuery';

import { useOptimizedFormHandler } from './hooks/useOptimizedCallback';
import { useQcLabelBusiness } from './hooks/useQcLabelBusiness';
import ClockNumberConfirmDialog from './ClockNumberConfirmDialog';
import { toast } from 'sonner';
import { 
  CubeIcon, 
  DocumentTextIcon, 
  Cog6ToothIcon,
  PrinterIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import type { ProductInfo, FormData, SlateDetail } from './types';

interface PerformanceOptimizedFormProps {
  onSubmit?: (data: FormData) => void;
  isLoading?: boolean;
  className?: string;
}

interface AcoHandlers {
  onAcoOrderRefChange: (value: string) => void;
  onAcoSearch: () => void;
}

// Memoized form sections
// ProductSection is memoized because it receives multiple callback props
// and renders expensive child components (ProductCodeInput, ProductInfoDisplay)
const ProductSection = React.memo<{
  productCode: string;
  onProductCodeChange: (value: string) => void;
  productInfo: ProductInfo | null;
  onProductInfoChange: (info: ProductInfo | null) => void;
  quantity: string;
  onQuantityChange: (value: string) => void;
  count: string;
  onCountChange: (value: string) => void;
  operator: string;
  onOperatorChange: (value: string) => void;
  errors: Record<string, string>;
  disabled?: boolean;
}>(({
  productCode,
  onProductCodeChange,
  productInfo,
  onProductInfoChange,
  quantity,
  onQuantityChange,
  count,
  onCountChange,
  operator,
  onOperatorChange,
  errors,
  disabled = false
}) => {
  const handleProductCodeChange = useCallback((value: string) => {
    onProductCodeChange(value);
  }, [onProductCodeChange]);

  const handleProductInfoChange = useCallback((info: ProductInfo | null) => {
    onProductInfoChange(info);
  }, [onProductInfoChange]);

  return (
    <ResponsiveCard 
      title="Pallet Details"
      //subtitle="Enter the basic information for your pallet labels"
      className="mb-6"
    >
      <BasicProductForm
        productCode={productCode}
        onProductCodeChange={handleProductCodeChange}
        productInfo={productInfo}
        onProductInfoChange={onProductInfoChange}
        quantity={quantity}
        onQuantityChange={onQuantityChange}
        count={count}
        onCountChange={onCountChange}
        operator={operator}
        onOperatorChange={onOperatorChange}
        disabled={disabled}
      />
    </ResponsiveCard>
  );
});

// AcoSection is memoized because it has many props that don't change frequently
// and contains complex conditional rendering logic
const AcoSection = React.memo<{
  acoOrderRef: string;
  onAcoOrderRefChange: (value: string) => void;
  availableAcoOrderRefs: number[];
  acoRemain: string | null;
  acoSearchLoading: boolean;
  canSearchAco: boolean;
  onAcoSearch: () => void;
  acoNewRef: boolean;
  acoOrderDetails: any[];
  acoOrderDetailErrors: string[];
  onAcoOrderDetailChange: (idx: number, key: 'code' | 'qty', value: string) => void;
  onAcoOrderDetailUpdate: () => void;
  onValidateAcoOrderDetailCode: (code: string, idx: number) => void;
  isAcoOrderExcess?: boolean;
  disabled?: boolean;
}>(({
  acoOrderRef,
  onAcoOrderRefChange,
  availableAcoOrderRefs,
  acoRemain,
  acoSearchLoading,
  canSearchAco,
  onAcoSearch,
  acoNewRef,
  acoOrderDetails,
  acoOrderDetailErrors,
  onAcoOrderDetailChange,
  onAcoOrderDetailUpdate,
  onValidateAcoOrderDetailCode,
  isAcoOrderExcess = false,
  disabled = false
}) => {
  const handleAcoOrderRefChange = useCallback((value: string) => {
    onAcoOrderRefChange(value);
  }, [onAcoOrderRefChange]);

  return (
    <AccordionItem
      title="ACO Order Details"
      //subtitle="Configure ACO order reference and details"
      icon={<DocumentTextIcon className="h-5 w-5" />}
      defaultOpen
      badge="Required"
    >
      <AcoOrderForm
        acoOrderRef={acoOrderRef}
        onAcoOrderRefChange={handleAcoOrderRefChange}
        availableAcoOrderRefs={availableAcoOrderRefs}
        acoRemain={acoRemain}
        acoSearchLoading={acoSearchLoading}
        canSearchAco={canSearchAco}
        onAcoSearch={onAcoSearch}
        acoNewRef={acoNewRef}
        acoOrderDetails={acoOrderDetails}
        acoOrderDetailErrors={acoOrderDetailErrors}
        onAcoOrderDetailChange={onAcoOrderDetailChange}
        onAcoOrderDetailUpdate={onAcoOrderDetailUpdate}
        onValidateAcoOrderDetailCode={onValidateAcoOrderDetailCode}
        isAcoOrderExcess={isAcoOrderExcess}
        disabled={disabled}
      />
    </AccordionItem>
  );
});

// SlateSection is memoized as it receives stable props and renders
// the SlateDetailsForm which has its own internal state
const SlateSection = React.memo<{
  slateDetail: SlateDetail;
  onSlateDetailChange: (field: keyof SlateDetail, value: string) => void;
  disabled?: boolean;
}>(({
  slateDetail,
  onSlateDetailChange,
  disabled = false
}) => {
  const handleSlateDetailChange = useCallback((field: keyof SlateDetail, value: string) => {
    onSlateDetailChange(field, value);
  }, [onSlateDetailChange]);

  return (
    <AccordionItem
      title="Slate Product Details"
      subtitle="Configure slate-specific parameters"
      icon={<Cog6ToothIcon className="h-5 w-5" />}
      defaultOpen
      badge="Required"
    >
      <SlateDetailsForm
        slateDetail={slateDetail}
        onSlateDetailChange={handleSlateDetailChange}
        disabled={disabled}
      />
    </AccordionItem>
  );
});

// ProgressSection is memoized because it's rendered with frequently changing
// progress data but only needs to re-render when actual progress changes
const ProgressSection = React.memo<{
  current: number;
  total: number;
  status: Array<'Pending' | 'Processing' | 'Success' | 'Failed'>;
  isMobile: boolean;
}>(({
  current,
  total,
  status,
  isMobile
}) => {
  if (total === 0) return null;

  return (
    <ResponsiveCard
      title="Generation Progress"
      padding="sm"
    >
      <EnhancedProgressBar
        current={current}
        total={total}
        status={status}
        title="QC Label Generation"
        variant={isMobile ? 'compact' : 'default'}
        showPercentage={true}
        showItemDetails={true}
        className="bg-gray-700 p-4 rounded-lg"
      />
    </ResponsiveCard>
  );
});

export const PerformanceOptimizedForm: React.FC<PerformanceOptimizedFormProps> = React.memo(({
  onSubmit,
  isLoading = false,
  className = ''
}) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');
  const searchParams = useSearchParams();
  
  const { handleError, handleSuccess } = useErrorHandler({
    component: 'PerformanceOptimizedForm',
    userId: '12345' // This should come from auth context
  });

  // Check if this is an auto-fill request from void-pallet
  const isAutoFill = searchParams.get('autoFill') === 'true';
  const autoFillSource = searchParams.get('autoFillSource');

  // Get URL parameters for pre-filling
  const urlParams = useMemo(() => ({
    productCode: searchParams.get('productCode') || '',
    quantity: searchParams.get('quantity') || '',
    operatorClockNum: searchParams.get('operatorClockNum') || '',
    qcClockNum: searchParams.get('qcClockNum') || '',
    sourceAction: searchParams.get('sourceAction') || '',
    originalPltNum: searchParams.get('originalPltNum') || '',
    voidReason: searchParams.get('voidReason') || '',
  }), [searchParams]);

  // Form state with batched updates
  const [formData, setFormData] = useState<FormData>({
    productCode: urlParams.productCode, // Pre-fill from URL
    productInfo: null,
    quantity: urlParams.quantity, // Pre-fill from URL
    count: '',
    operator: urlParams.operatorClockNum, // Pre-fill from URL
    userId: '12345', // This should come from auth context
    acoOrderRef: '',
    acoOrderDetails: [],
    acoNewRef: false,
    acoNewProductCode: '',
    acoNewOrderQty: '',
    slateDetail: {
      batchNumber: ''
    },
    pdfProgress: {
      current: 0,
      total: 0,
      status: []
    },
    isLoading: false,
    acoSearchLoading: false,
    productError: null,
    acoOrderDetailErrors: [],
    acoRemain: null,
    availableAcoOrderRefs: []
  });

  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pdfProgress, setPdfProgress] = useState({
    current: 0,
    total: 0,
    status: [] as Array<'Pending' | 'Processing' | 'Success' | 'Failed'>
  });

  // ACO specific state is now managed in formData and businessLogic hook

  // Direct form handlers for immediate response
  const handleInputChange = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  // Memoized validation
  const validationState = useMemo(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.productCode.trim()) {
      newErrors.productCode = 'Product code is required';
    }

    // 安全處理 quantity - 確保它是字符串
    const quantityStr = String(formData.quantity || '');
    if (!quantityStr.trim() || parseInt(quantityStr) <= 0) {
      newErrors.quantity = 'Valid quantity is required';
    }

    // 安全處理 count - 確保它是字符串
    const countStr = String(formData.count || '');
    if (!countStr.trim() || parseInt(countStr) <= 0) {
      newErrors.count = 'Valid count is required';
    }

    // ACO specific validation
    if (productInfo?.type === 'ACO' && !formData.acoOrderRef.trim()) {
      newErrors.acoOrderRef = 'ACO Order Reference is required';
    }



    // Slate specific validation
    if (productInfo?.type === 'Slate') {
      if (!formData.slateDetail.batchNumber.trim()) {
        newErrors.batchNumber = 'Batch number is required';
      }
    }

    return {
      errors: newErrors,
      isValid: Object.keys(newErrors).length === 0,
      errorCount: Object.keys(newErrors).length
    };
  }, [formData, productInfo]);

  // Update errors when validation changes
  useEffect(() => {
    setErrors(prevErrors => {
      // Only update if errors actually changed
      const hasChanged = JSON.stringify(prevErrors) !== JSON.stringify(validationState.errors);
      return hasChanged ? validationState.errors : prevErrors;
    });
  }, [validationState.errors]);

  // Auto-set count to 1 for Slate products
  useEffect(() => {
    if (productInfo?.type === 'Slate' && formData.count !== SLATE_DEFAULT_COUNT) {
      handleInputChange('count', SLATE_DEFAULT_COUNT);
    }
  }, [productInfo?.type, formData.count, handleInputChange]);

  // Check if count exceeds limit
  const isCountExceeded = useMemo(() => {
    const countValue = parseInt(formData.count) || 0;
    return countValue > MAX_PALLET_COUNT;
  }, [formData.count]);

  // Business logic hook
  const businessLogic = useQcLabelBusiness({
    formData,
    setFormData,
    productInfo,
    onProductInfoReset: () => {
      setProductInfo(null);
      setErrors({});
      setPdfProgress({
        current: 0,
        total: 0,
        status: []
      });
    }
  });

  // Memoized ACO handlers
  const acoHandlers = useMemo(() => ({
    onAcoOrderRefChange: (value: string) => handleInputChange('acoOrderRef', value),
    onAcoSearch: businessLogic.handleAcoSearch
  }), [handleInputChange, businessLogic]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validationState.isValid) {
      handleError(new Error('Form validation failed'), 'form_validation');
      return;
    }

    // Use business logic for print handling
    businessLogic.handlePrintLabel(e);
    
    if (onSubmit) {
      onSubmit(formData);
    }
  }, [validationState.isValid, formData, onSubmit, handleError, businessLogic]);

  // Sync pdfProgress from formData to local state
  useEffect(() => {
    setPdfProgress(prev => {
      // Only update if progress actually changed
      const hasChanged = 
        prev.current !== formData.pdfProgress.current ||
        prev.total !== formData.pdfProgress.total ||
        JSON.stringify(prev.status) !== JSON.stringify(formData.pdfProgress.status);
      
      return hasChanged ? {
        current: formData.pdfProgress.current,
        total: formData.pdfProgress.total,
        status: formData.pdfProgress.status
      } : prev;
    });
  }, [formData.pdfProgress]);
  
  // 清理 effect - 當用戶離開頁面時清理資源
  useEffect(() => {
    return () => {
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[PerformanceOptimizedForm] Cleaning up on unmount');
      // 只清除保存的數據，不要在 cleanup 中調用 setState
      // 因為組件已經 unmount，setState 會導致內存洩漏和警告
      if (businessLogic.clearSavedData) {
        businessLogic.clearSavedData();
      }
    };
  }, [businessLogic]);

  return (
    <ResponsiveLayout className={className}>
      <ResponsiveContainer maxWidth="xl">
        {/* Auto-fill notification */}
        {isAutoFill && autoFillSource === 'void-pallet' && (
          <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-blue-900/40 backdrop-blur-sm border border-blue-500/30 p-6 shadow-2xl shadow-blue-900/20">
            {/* 背景光效 */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/10 to-blue-500/5"></div>
            
            {/* 動態光點 */}
            <div className="absolute top-2 right-2 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            
            <div className="relative z-10">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <InformationCircleIcon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-lg font-semibold bg-gradient-to-r from-blue-200 to-indigo-200 bg-clip-text text-transparent mb-2">
                    Auto-Fill Mode
                  </div>
                  <div className="text-sm text-blue-200/90 leading-relaxed">
                    Form has been automatically filled with basic information from the Void Pallet system. Please review and complete other required fields, then click &quot;Print Label&quot; to generate new labels.
                  </div>
                  {urlParams.originalPltNum && (
                    <div className="mt-3 p-3 bg-slate-800/40 rounded-xl border border-slate-600/30">
                      <div className="text-xs text-slate-300 space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-400">Original Pallet Number:</span>
                          <span className="font-mono text-blue-300 bg-slate-700/50 px-2 py-1 rounded">{urlParams.originalPltNum}</span>
                        </div>
                        {urlParams.voidReason && (
                          <div className="flex items-center space-x-2">
                            <span className="text-slate-400">Void Reason:</span>
                            <span className="text-amber-300">{urlParams.voidReason}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <ResponsiveStack 
            direction="responsive" 
            spacing={8} 
            align="start"
          >
            {/* Main Form Section */}
            <div className="flex-1 min-w-0">
              {/* Form Persistence Indicator */}
              {businessLogic.lastSaved && (
                <div className="mb-4">
                  <FormPersistenceIndicator
                    lastSaved={businessLogic.lastSaved}
                    hasSavedData={businessLogic.hasSavedData}
                    className="text-sm"
                  />
                </div>
              )}
              
              <ProductSection
                productCode={formData.productCode}
                onProductCodeChange={(value) => handleInputChange('productCode', value)}
                productInfo={productInfo}
                onProductInfoChange={setProductInfo}
                quantity={formData.quantity}
                onQuantityChange={(value) => handleInputChange('quantity', value)}
                count={formData.count}
                onCountChange={(value) => handleInputChange('count', value)}
                operator={formData.operator}
                onOperatorChange={(value) => handleInputChange('operator', value)}
                errors={errors}
                disabled={isLoading}
              />

              {/* Product Type Specific Sections */}
              {productInfo && (productInfo.type === 'ACO' || productInfo.type === 'Slate') && (
                <AccordionGroup title="Product Specific Details">
                  {productInfo.type === 'ACO' && (
                    <AcoSection
                      acoOrderRef={formData.acoOrderRef}
                      onAcoOrderRefChange={acoHandlers.onAcoOrderRefChange}
                      availableAcoOrderRefs={formData.availableAcoOrderRefs}
                      acoRemain={formData.acoRemain}
                      acoSearchLoading={formData.acoSearchLoading}
                      canSearchAco={businessLogic.canSearchAco}
                      onAcoSearch={acoHandlers.onAcoSearch}
                      acoNewRef={false}
                      acoOrderDetails={[]}
                      acoOrderDetailErrors={[]}
                      onAcoOrderDetailChange={() => {}}
                      onAcoOrderDetailUpdate={() => {}}
                      onValidateAcoOrderDetailCode={() => {}}
                      isAcoOrderExcess={businessLogic.isAcoOrderExcess}
                      disabled={isLoading}
                    />
                  )}

                  {productInfo.type === 'Slate' && (
                    <SlateSection
                      slateDetail={formData.slateDetail}
                      onSlateDetailChange={businessLogic.handleSlateDetailChange}
                      disabled={isLoading}
                    />
                  )}
                </AccordionGroup>
              )}
            </div>

            {/* Right panel content */}
            <div className={`${isMobile ? 'w-full' : 'w-80'} flex-shrink-0`}>
              <div className="space-y-6">
                {/* Progress */}
                <ProgressSection
                  current={pdfProgress.current}
                  total={pdfProgress.total}
                  status={pdfProgress.status}
                  isMobile={isMobile}
                />

                {/* Submit Button */}
                <div className="relative group">
                                  <button
                  type="submit"
                  disabled={!validationState.isValid || isLoading || businessLogic.isProcessing || businessLogic.isAcoOrderExcess || businessLogic.isAcoOrderFulfilled || businessLogic.isAcoOrderIncomplete || isCountExceeded}
                    className={`
                      w-full py-4 px-6 rounded-2xl font-semibold text-lg
                      transition-all duration-300 ease-out
                      flex items-center justify-center space-x-3
                      relative overflow-hidden
                      ${validationState.isValid && !isLoading && !businessLogic.isProcessing && !businessLogic.isAcoOrderExcess && !businessLogic.isAcoOrderFulfilled && !businessLogic.isAcoOrderIncomplete && !isCountExceeded
                        ? 'bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:via-blue-400 hover:to-cyan-400 text-white shadow-2xl shadow-blue-500/25 hover:shadow-blue-400/40 hover:scale-[1.02] active:scale-[0.98]'
                        : 'bg-gradient-to-r from-slate-700 to-slate-600 text-slate-300 cursor-not-allowed shadow-lg shadow-slate-900/20'
                      }
                    `}
                  >
                    {/* 按鈕內部光效 */}
                    {validationState.isValid && !isLoading && !businessLogic.isProcessing && !businessLogic.isAcoOrderExcess && !businessLogic.isAcoOrderFulfilled && !businessLogic.isAcoOrderIncomplete && !isCountExceeded && (
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    )}
                    
                    <div className="relative z-10 flex items-center space-x-3">
                      <PrinterIcon className={`h-6 w-6 ${isLoading ? 'animate-pulse' : ''}`} />
                      <span>
                        {isLoading || businessLogic.isProcessing ? 'Processing...' : 
                         businessLogic.isAcoOrderFulfilled ? 'Order Fulfilled' :
                         businessLogic.isAcoOrderExcess ? 'Quantity Exceeds Order' : 
                         businessLogic.isAcoOrderIncomplete ? 'Complete ACO Details' :
                         isCountExceeded ? 'Print Limit Exceeded' :
                         'Print Label'}
                      </span>
                    </div>
                    
                    {/* 載入動畫 */}
                    {(isLoading || businessLogic.isProcessing) && (
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      </div>
                    )}
                  </button>
                </div>
                
                {/* ACO Fulfilled Warning */}
                {businessLogic.isAcoOrderFulfilled && (
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-900/40 via-yellow-900/30 to-amber-900/40 backdrop-blur-sm border border-amber-500/30 p-4 shadow-lg shadow-amber-900/20">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-yellow-500/10 to-amber-500/5"></div>
                    <div className="relative z-10">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center">
                          <span className="text-amber-400 text-lg">⚠️</span>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-amber-200">
                            Cannot Print Label
                          </div>
                          <div className="text-xs text-amber-300/80 mt-1">
                            This ACO order has been fulfilled. No remaining quantity available.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* ACO Excess Warning */}
                {businessLogic.isAcoOrderExcess && !businessLogic.isAcoOrderFulfilled && !businessLogic.isAcoOrderIncomplete && (
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-900/40 via-rose-900/30 to-red-900/40 backdrop-blur-sm border border-red-500/30 p-4 shadow-lg shadow-red-900/20">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-rose-500/10 to-red-500/5"></div>
                    <div className="relative z-10">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                          <span className="text-red-400 text-lg">⚠️</span>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-red-200">
                            Cannot Print Label
                          </div>
                          <div className="text-xs text-red-300/80 mt-1">
                            The total quantity exceeds the remaining ACO order quantity. Please adjust your input.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* ACO Incomplete Warning */}
                {businessLogic.isAcoOrderIncomplete && (
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-900/40 via-amber-900/30 to-orange-900/40 backdrop-blur-sm border border-orange-500/30 p-4 shadow-lg shadow-orange-900/20">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-amber-500/10 to-orange-500/5"></div>
                    <div className="relative z-10">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center">
                          <span className="text-orange-400 text-lg">⚠️</span>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-orange-200">
                            Complete ACO Order Details
                          </div>
                          <div className="text-xs text-orange-300/80 mt-1">
                            Please complete the ACO order search or enter all required order details before printing.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Count Limit Exceeded Warning */}
                {isCountExceeded && (
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-900/40 via-red-900/30 to-red-900/40 backdrop-blur-sm border border-red-500/30 p-4 shadow-lg shadow-red-900/20">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-red-500/10 to-red-500/5"></div>
                    <div className="relative z-10">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                          <span className="text-red-400 text-lg">🚫</span>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-red-200">
                            Print Limit Exceeded
                          </div>
                          <div className="text-xs text-red-300/80 mt-1">
                            Maximum {MAX_PALLET_COUNT} pallet labels allowed. Please adjust Count of Pallet to {MAX_PALLET_COUNT} or below.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Streaming Progress */}
                {businessLogic.streamingStatus.isStreaming && (
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900/40 via-cyan-900/30 to-blue-900/40 backdrop-blur-sm border border-blue-500/30 p-4 shadow-lg shadow-blue-900/20 mt-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-cyan-500/10 to-blue-500/5"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-semibold text-blue-200">
                          Streaming PDF Generation
                        </div>
                        <button
                          onClick={businessLogic.cancelStreaming}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Cancel
                        </button>
                      </div>
                      <div className="text-xs text-blue-300/80">
                        Completed: {businessLogic.streamingStatus.completed} / {businessLogic.streamingStatus.total}
                      </div>
                      <div className="w-full bg-blue-900/30 rounded-full h-2 mt-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(businessLogic.streamingStatus.completed / businessLogic.streamingStatus.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ResponsiveStack>
        </form>

        {/* Clock Number Confirmation Dialog */}
        <ClockNumberConfirmDialog
          isOpen={businessLogic.isClockConfirmOpen}
          onOpenChange={() => {}} // Controlled by business logic
          onConfirm={businessLogic.handleClockNumberConfirm}
          onCancel={businessLogic.handleClockNumberCancel}
          title="Confirm Print Action"
          description="Please enter your clock number to proceed with printing the labels."
          isLoading={isLoading}
        />
        
      </ResponsiveContainer>
    </ResponsiveLayout>
  );
});

// Set display names
ProductSection.displayName = 'ProductSection';
AcoSection.displayName = 'AcoSection';
SlateSection.displayName = 'SlateSection';
ProgressSection.displayName = 'ProgressSection';
PerformanceOptimizedForm.displayName = 'PerformanceOptimizedForm';

export default PerformanceOptimizedForm; 