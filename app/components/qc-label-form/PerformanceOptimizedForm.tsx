'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { useErrorHandler } from './hooks/useErrorHandler';
import { useMediaQuery } from './hooks/useMediaQuery';

import { useOptimizedFormHandler } from './hooks/useOptimizedCallback';
import { useQcLabelBusiness } from './hooks/useQcLabelBusiness';
import ClockNumberConfirmDialog from './ClockNumberConfirmDialog';
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
  onAcoNewRefChange: (checked: boolean) => void;
  onAcoOrderDetailChange: (idx: number, field: 'code' | 'qty', value: string) => void;
  onValidateAcoOrderDetailCode: (code: string, idx: number) => void;
  onAcoOrderDetailUpdate: () => void;
  onAcoSearch: () => void;
}

// Memoized form sections
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

const SlateSection = React.memo<{
  slateDetail: SlateDetail;
  onSlateDetailChange: (field: keyof SlateDetail, value: string) => void;
  availableFirstOffDates: string[];
  disabled?: boolean;
}>(({
  slateDetail,
  onSlateDetailChange,
  availableFirstOffDates,
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
        availableFirstOffDates={availableFirstOffDates}
        disabled={disabled}
      />
    </AccordionItem>
  );
});

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
      firstOffDate: '',
      batchNumber: '',
      setterName: '',
      material: '',
      weight: '',
      topThickness: '',
      bottomThickness: '',
      length: '',
      width: '',
      centreHole: '',
      colour: '',
      shapes: '',
      flameTest: '',
      remark: ''
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
    availableFirstOffDates: [],
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

    // ACO new order validation
    if (productInfo?.type === 'ACO' && formData.acoNewRef) {
      const validOrderDetails = formData.acoOrderDetails.filter((detail, idx) => 
        detail.code.trim() && 
        detail.qty.trim() && 
        !formData.acoOrderDetailErrors[idx] && // No validation errors
        !isNaN(parseInt(detail.qty.trim())) && 
        parseInt(detail.qty.trim()) > 0
      );
      
      if (validOrderDetails.length === 0) {
        newErrors.acoOrderDetails = 'At least one valid ACO product detail is required for new ACO orders';
      }
      
      // Check if there are any validation errors in the order details
      const hasValidationErrors = formData.acoOrderDetailErrors.some(error => error.trim() !== '');
      if (hasValidationErrors) {
        newErrors.acoOrderDetails = 'Please fix all product code validation errors before proceeding';
      }
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
    setErrors(validationState.errors);
  }, [validationState.errors]);

  // Auto-set count to 1 for Slate products
  useEffect(() => {
    if (productInfo?.type === 'Slate' && formData.count !== '1') {
      handleInputChange('count', '1');
    }
  }, [productInfo?.type, formData.count, handleInputChange]);

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
    onAcoSearch: businessLogic.handleAcoSearch,
    onAcoOrderDetailChange: businessLogic.handleAcoOrderDetailChange,
    onAcoOrderDetailUpdate: businessLogic.handleAcoOrderDetailUpdate,
    onValidateAcoOrderDetailCode: businessLogic.validateAcoProductCode
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
    setPdfProgress({
      current: formData.pdfProgress.current,
      total: formData.pdfProgress.total,
      status: formData.pdfProgress.status
    });
  }, [formData.pdfProgress]);

  return (
    <ResponsiveLayout className={className}>
      <ResponsiveContainer maxWidth="xl">
        {/* Auto-fill notification */}
        {isAutoFill && autoFillSource === 'void-pallet' && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <InformationCircleIcon className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-sm font-medium text-blue-800">
                  自動填充模式
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  表單已從 Void Pallet 系統自動填充基本信息。請檢查並完成其他必要欄位，然後點擊「Print Label」生成新標籤。
                  {urlParams.originalPltNum && (
                    <span className="block mt-1">
                      原棧板號碼: <span className="font-mono">{urlParams.originalPltNum}</span>
                      {urlParams.voidReason && ` | 作廢原因: ${urlParams.voidReason}`}
                    </span>
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
                      acoNewRef={formData.acoNewRef}
                      acoOrderDetails={formData.acoOrderDetails}
                      acoOrderDetailErrors={formData.acoOrderDetailErrors}
                      onAcoOrderDetailChange={acoHandlers.onAcoOrderDetailChange}
                      onAcoOrderDetailUpdate={acoHandlers.onAcoOrderDetailUpdate}
                      onValidateAcoOrderDetailCode={acoHandlers.onValidateAcoOrderDetailCode}
                      isAcoOrderExcess={businessLogic.isAcoOrderExcess}
                      disabled={isLoading}
                    />
                  )}

                  {productInfo.type === 'Slate' && (
                    <SlateSection
                      slateDetail={formData.slateDetail}
                      onSlateDetailChange={businessLogic.handleSlateDetailChange}
                      availableFirstOffDates={formData.availableFirstOffDates}
                      disabled={isLoading}
                    />
                  )}
                </AccordionGroup>
              )}
            </div>

            {/* Sidebar */}
            <div className={`${isMobile ? 'w-full' : 'w-80'} flex-shrink-0`}>
              <div className="space-y-6">
                {/* Instructions */}
                <ResponsiveCard
                  title="Instructions"
                  padding="sm"
                >
                  <ul className="text-sm text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">1.</span>
                      Enter all required pallet details
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">2.</span>
                      Configure product-specific settings if needed
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">3.</span>
                      Click Print Label to generate labels
                    </li>
                  </ul>
                </ResponsiveCard>

                {/* Progress */}
                <ProgressSection
                  current={pdfProgress.current}
                  total={pdfProgress.total}
                  status={pdfProgress.status}
                  isMobile={isMobile}
                />

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!validationState.isValid || isLoading || businessLogic.isAcoOrderExcess || businessLogic.isAcoOrderFulfilled || businessLogic.isAcoOrderIncomplete}
                  className={`
                    w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200
                    flex items-center justify-center space-x-2
                    ${validationState.isValid && !isLoading && !businessLogic.isAcoOrderExcess && !businessLogic.isAcoOrderFulfilled && !businessLogic.isAcoOrderIncomplete
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                      : 'bg-gray-600 text-gray-300 cursor-not-allowed'
                    }
                  `}
                >
                  <PrinterIcon className="h-5 w-5" />
                  <span>
                    {isLoading ? 'Processing...' : 
                     businessLogic.isAcoOrderFulfilled ? 'Order Fulfilled' :
                     businessLogic.isAcoOrderExcess ? 'Quantity Exceeds Order' : 
                     businessLogic.isAcoOrderIncomplete ? 'Complete ACO Details' :
                     'Print Label'}
                  </span>
                </button>
                
                {/* ACO Fulfilled Warning */}
                {businessLogic.isAcoOrderFulfilled && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="text-sm font-medium text-yellow-800">
                      ⚠️ Cannot Print Label
                    </div>
                    <div className="text-xs text-yellow-600 mt-1">
                      This ACO order has been fulfilled. No remaining quantity available.
                    </div>
                  </div>
                )}
                
                {/* ACO Excess Warning */}
                {businessLogic.isAcoOrderExcess && !businessLogic.isAcoOrderFulfilled && !businessLogic.isAcoOrderIncomplete && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="text-sm font-medium text-red-800">
                      ⚠️ Cannot Print Label
                    </div>
                    <div className="text-xs text-red-600 mt-1">
                      The total quantity exceeds the remaining ACO order quantity. Please adjust your input.
                    </div>
                  </div>
                )}
                
                {/* ACO Incomplete Warning */}
                {businessLogic.isAcoOrderIncomplete && (
                  <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="text-sm font-medium text-orange-800">
                      ⚠️ Complete ACO Order Details
                    </div>
                    <div className="text-xs text-orange-600 mt-1">
                      Please complete the ACO order search or enter all required order details before printing.
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