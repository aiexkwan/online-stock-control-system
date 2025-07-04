'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { PrintLabelGrid, GridWidget } from '../components/qc-label-form/PrintLabelGrid';
import { GridBasicProductForm } from '../components/qc-label-form/GridBasicProductForm';
import { ErrorBoundary } from '../components/qc-label-form/ErrorBoundary';
import { EnhancedProgressBar } from '../components/qc-label-form/EnhancedProgressBar';
import { AcoOrderForm } from '../components/qc-label-form/AcoOrderForm';
import { SlateDetailsForm } from '../components/qc-label-form/SlateDetailsForm';
import { useQcLabelBusiness } from '../components/qc-label-form/hooks/useQcLabelBusiness';
import ClockNumberConfirmDialog from '../components/qc-label-form/ClockNumberConfirmDialog';
import FloatingInstructions from '@/components/ui/floating-instructions';
import { TestHardwareButton } from '../components/qc-label-form/TestHardwareButton';
import { useSearchParams } from 'next/navigation';
import { MAX_PALLET_COUNT } from '../components/qc-label-form/constants';
import type { ProductInfo, FormData } from '../components/qc-label-form/types';
import { PrintQueueMonitor } from '@/lib/printing';

export default function PrintLabelPage() {
  const searchParams = useSearchParams();
  
  // Check if this is an auto-fill request from void-pallet
  const isAutoFill = searchParams.get('autoFill') === 'true';
  const autoFillSource = searchParams.get('autoFillSource');
  
  // Get URL parameters for pre-filling
  const urlParams = useMemo(() => ({
    productCode: searchParams.get('productCode') || '',
    quantity: searchParams.get('quantity') || '',
    operatorClockNum: searchParams.get('operatorClockNum') || '',
  }), [searchParams]);

  // Initial form data state
  const getInitialFormData = useCallback(() => ({
    productCode: urlParams.productCode,
    productInfo: null,
    quantity: urlParams.quantity,
    count: '',
    operator: urlParams.operatorClockNum,
    userId: '12345',
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
  }), [urlParams]);

  // Form state
  const [formData, setFormData] = useState<FormData>(getInitialFormData());

  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Handle input changes
  const handleInputChange = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  // Validation
  const validationState = useMemo(() => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.productCode.trim()) {
      newErrors.productCode = 'Product code is required';
    }
    
    const quantityStr = String(formData.quantity || '');
    if (!quantityStr.trim() || parseInt(quantityStr) <= 0) {
      newErrors.quantity = 'Valid quantity is required';
    }
    
    const countStr = String(formData.count || '');
    if (!countStr.trim() || parseInt(countStr) <= 0) {
      newErrors.count = 'Valid count is required';
    }
    
    if (productInfo?.type === 'ACO' && !formData.acoOrderRef.trim()) {
      newErrors.acoOrderRef = 'ACO Order Reference is required';
    }
    
    if (productInfo?.type === 'Slate' && !formData.slateDetail.batchNumber.trim()) {
      newErrors.batchNumber = 'Batch number is required';
    }
    
    return {
      errors: newErrors,
      isValid: Object.keys(newErrors).length === 0,
      errorCount: Object.keys(newErrors).length
    };
  }, [formData, productInfo]);

  // Update errors only for touched fields
  useEffect(() => {
    setErrors(prevErrors => {
      const filteredErrors: Record<string, string> = {};
      Object.keys(validationState.errors).forEach(key => {
        if (touched[key]) {
          filteredErrors[key] = validationState.errors[key];
        }
      });
      const hasChanged = JSON.stringify(prevErrors) !== JSON.stringify(filteredErrors);
      return hasChanged ? filteredErrors : prevErrors;
    });
  }, [validationState.errors, touched]);

  // Business logic hook
  const businessLogic = useQcLabelBusiness({
    formData,
    setFormData,
    productInfo,
    onProductInfoReset: () => {
      setProductInfo(null);
      setErrors({});
      setTouched({});
      // Clear form data to initial state (except URL params)
      setFormData(getInitialFormData());
    }
  });



  // Check if count exceeds limit
  const isCountExceeded = useMemo(() => {
    const countValue = parseInt(formData.count) || 0;
    return countValue > MAX_PALLET_COUNT;
  }, [formData.count]);

  // Handle print button
  const handlePrintLabel = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Mark all fields as touched when trying to submit
    setTouched({
      productCode: true,
      quantity: true,
      count: true,
      acoOrderRef: productInfo?.type === 'ACO',
      batchNumber: productInfo?.type === 'Slate'
    });
    
    if (!validationState.isValid) {
      return;
    }
    
    businessLogic.handlePrintLabel(e || new Event('submit'));
  }, [validationState.isValid, businessLogic, productInfo]);

  // Print button states
  const isPrintDisabled = !validationState.isValid || 
    formData.isLoading || 
    businessLogic.isProcessing || 
    businessLogic.isAcoOrderExcess || 
    businessLogic.isAcoOrderFulfilled || 
    businessLogic.isAcoOrderIncomplete || 
    isCountExceeded;

  const printButtonText = formData.isLoading || businessLogic.isProcessing ? 'Processing...' : 
    businessLogic.isAcoOrderFulfilled ? 'Order Fulfilled' :
    businessLogic.isAcoOrderExcess ? 'Quantity Exceeds' : 
    businessLogic.isAcoOrderIncomplete ? 'Complete ACO' :
    isCountExceeded ? 'Limit Exceeded' :
    'Print Label';

  return (
    <>
      {/* Hardware Test Button */}
      <div className="fixed top-4 left-4 z-50">
        <TestHardwareButton />
      </div>
      
      {/* Print Queue Monitor - Compact Mode */}
      <div className="fixed top-20 left-4 z-40 w-80">
        <PrintQueueMonitor compact />
      </div>
      
      {/* Floating Instructions */}
      <div className="fixed top-4 right-4 z-50">
        <FloatingInstructions
          title="QC Label Instructions"
          variant="hangover"
          steps={[
            {
              title: "1. Enter Pallet Information",
              description: "Fill in product code, quantity, count, and operator details(optional)."
            },
            {
              title: "2. Configure Product Settings",
              description: "For ACO & Slate products, enter order reference and product details."
            },
            {
              title: "3. Generate and Print Labels",
              description: "Click 'Print Label' button to generate QC labels."
            },
            {
              title: "4. Enter Clock Number",
              description: "Enter your clock number to confirm the QC label generation."
            },
            {
              title: "5. Check Progress",
              description: "The label will be generated and able to download. Press 'Print' button to print the label."
            }
          ]}
        />
      </div>

      <PrintLabelGrid>
        {/* Main Form Widget */}
        <GridWidget area="main">
          <ErrorBoundary>
            <GridBasicProductForm
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
              onPrintLabel={handlePrintLabel}
              isPrintDisabled={isPrintDisabled}
              isPrintLoading={formData.isLoading || businessLogic.isProcessing}
              printButtonText={printButtonText}
              errors={errors}
              disabled={formData.isLoading}
            />
          </ErrorBoundary>
        </GridWidget>

        {/* ACO/Slate Event Widget - Only show when needed */}
        {productInfo && (productInfo.type === 'ACO' || productInfo.type === 'Slate') && (
          <GridWidget area="bottom-left">
            <div className="h-full overflow-auto">
              {productInfo.type === 'Slate' && (
                <h3 className="text-lg font-semibold text-white mb-4">
                  Slate Product Details
                </h3>
              )}
              
              {productInfo.type === 'ACO' && (
                <AcoOrderForm
                  acoOrderRef={formData.acoOrderRef}
                  onAcoOrderRefChange={(value) => handleInputChange('acoOrderRef', value)}
                  availableAcoOrderRefs={formData.availableAcoOrderRefs}
                  acoRemain={formData.acoRemain}
                  acoSearchLoading={formData.acoSearchLoading}
                  canSearchAco={businessLogic.canSearchAco}
                  onAcoSearch={businessLogic.handleAcoSearch}
                  acoNewRef={false}
                  acoOrderDetails={[]}
                  acoOrderDetailErrors={[]}
                  onAcoOrderDetailChange={() => {}}
                  onAcoOrderDetailUpdate={() => {}}
                  onValidateAcoOrderDetailCode={() => {}}
                  isAcoOrderExcess={businessLogic.isAcoOrderExcess}
                  disabled={formData.isLoading}
                />
              )}

              {productInfo.type === 'Slate' && (
                <SlateDetailsForm
                  slateDetail={formData.slateDetail}
                  onSlateDetailChange={businessLogic.handleSlateDetailChange}
                  disabled={formData.isLoading}
                />
              )}
            </div>
          </GridWidget>
        )}

        {/* Progress Widget */}
        {formData.pdfProgress.total > 0 && (
          <GridWidget area="bottom-right">
            <div className="h-full flex flex-col">
              <h3 className="text-lg font-semibold text-white mb-4">Generation Progress</h3>
              <div className="flex-1 flex items-center">
                <EnhancedProgressBar
                  current={formData.pdfProgress.current}
                  total={formData.pdfProgress.total}
                  status={formData.pdfProgress.status}
                  title="QC Label Generation"
                  variant="compact"
                  showPercentage={true}
                  showItemDetails={true}
                  className="w-full"
                />
              </div>
            </div>
          </GridWidget>
        )}
      </PrintLabelGrid>

      {/* Clock Number Confirmation Dialog */}
      <ClockNumberConfirmDialog
        isOpen={businessLogic.isClockConfirmOpen}
        onOpenChange={() => {}}
        onConfirm={businessLogic.handleClockNumberConfirm}
        onCancel={businessLogic.handleClockNumberCancel}
        title="Confirm Print Action"
        description="Please enter your clock number to proceed with printing the labels."
        isLoading={formData.isLoading}
      />

      {/* Bottom Info Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-800/30 backdrop-blur-xl border-t border-slate-700/30 py-2">
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 text-slate-400 text-sm">
            <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
            <span>Pennine Manufacturing Stock Control System</span>
            <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
          </div>
        </div>
      </div>
    </>
  );
}