'use client';

import React, { useState, useEffect } from 'react';
import {
  ResponsiveLayout,
  ResponsiveContainer,
  ResponsiveCard,
  ResponsiveStack,
} from './ResponsiveLayout';
import { EnhancedFormField, EnhancedInput, EnhancedSelect } from './EnhancedFormField';
import { Accordion, AccordionItem, AccordionGroup } from './Accordion';
import { EnhancedProgressBar } from './EnhancedProgressBar';
import { ProductCodeInput } from './ProductCodeInput';
import { useErrorHandler } from './hooks/useErrorHandler';
import { useMediaQuery } from './hooks/useMediaQuery';
import {
  CubeIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  PrinterIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

interface ProductInfo {
  code: string;
  description: string;
  standard_qty: string;
  type: string;
}

interface SlateDetail {
  firstOffDate: string;
  batchNumber: string;
  setterName: string;
  material: string;
  weight: string;
  topThickness: string;
  bottomThickness: string;
  length: string;
  width: string;
  centreHole: string;
  colour: string;
  shapes: string;
  flameTest: string;
  remark: string;
}

interface FormData {
  productCode: string;
  quantity: string;
  count: string;
  operator: string;
  acoOrderRef: string;
  slateDetail: SlateDetail;
}

interface ImprovedQcLabelFormProps {
  onSubmit?: (data: FormData) => void;
  isLoading?: boolean;
  className?: string;
}

export const ImprovedQcLabelForm: React.FC<ImprovedQcLabelFormProps> = React.memo(
  ({ onSubmit, isLoading = false, className = '' }) => {
    const isMobile = useMediaQuery('(max-width: 768px)');
    const isTablet = useMediaQuery('(max-width: 1024px)');

    const { handleError, handleSuccess } = useErrorHandler({
      component: 'ImprovedQcLabelForm',
      userId: '12345', // This should come from auth context
    });

    // Form state
    const [formData, setFormData] = useState<FormData>({
      productCode: '',
      quantity: '',
      count: '',
      operator: '',
      acoOrderRef: '',
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
        remark: '',
      },
    });

    const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [pdfProgress, setPdfProgress] = useState({
      current: 0,
      total: 0,
      status: [] as Array<'Pending' | 'Processing' | 'Success' | 'Failed'>,
    });

    // Auto-set count to 1 for Slate products
    useEffect(() => {
      if (productInfo?.type === 'Slate') {
        setFormData(prev => ({ ...prev, count: '1' }));
      }
    }, [productInfo?.type]);

    const handleInputChange = (field: keyof FormData, value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      // Clear error when user starts typing
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
    };

    const handleSlateDetailChange = (field: keyof SlateDetail, value: string) => {
      setFormData(prev => ({
        ...prev,
        slateDetail: { ...prev.slateDetail, [field]: value },
      }));
    };

    const validateForm = (): boolean => {
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
        if (!formData.slateDetail.firstOffDate) {
          newErrors.firstOffDate = 'First-off date is required';
        }
        if (!formData.slateDetail.batchNumber.trim()) {
          newErrors.batchNumber = 'Batch number is required';
        }
        if (!formData.slateDetail.setterName.trim()) {
          newErrors.setterName = 'Setter name is required';
        }
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        handleError(new Error('Form validation failed'), 'form_validation');
        return;
      }

      if (onSubmit) {
        onSubmit(formData);
      }
    };

    const isFormValid = validateForm();

    return (
      <ResponsiveLayout className={className}>
        <ResponsiveContainer maxWidth='xl'>
          <form onSubmit={handleSubmit}>
            <ResponsiveStack direction='responsive' spacing={8} align='start'>
              {/* Main Form Section */}
              <div className='min-w-0 flex-1'>
                <ResponsiveCard
                  title='Pallet Details'
                  subtitle='Enter the basic information for your pallet labels'
                  className='mb-6'
                >
                  <div className='space-y-6'>
                    {/* Product Code */}
                    <EnhancedFormField
                      label='Product Code'
                      required
                      error={errors.productCode}
                      hint='Enter or scan the product code'
                    >
                      <ProductCodeInput
                        value={formData.productCode}
                        onChange={value => handleInputChange('productCode', value)}
                        onProductInfoChange={setProductInfo}
                        onQuantityChange={qty => handleInputChange('quantity', qty)}
                        required
                        userId='12345' // This should come from auth context
                      />
                    </EnhancedFormField>

                    {/* Product Info Display */}
                    {productInfo && (
                      <div className='bg-gray-750 rounded-lg border border-gray-600 p-4'>
                        <h4 className='mb-2 text-sm font-medium text-white'>Product Information</h4>
                        <div className='grid grid-cols-1 gap-3 text-sm sm:grid-cols-2'>
                          <div>
                            <span className='text-gray-400'>Description:</span>
                            <span className='ml-2 text-white'>{productInfo.description}</span>
                          </div>
                          <div>
                            <span className='text-gray-400'>Standard Qty:</span>
                            <span className='ml-2 text-white'>{productInfo.standard_qty}</span>
                          </div>
                          <div>
                            <span className='text-gray-400'>Type:</span>
                            <span
                              className={`ml-2 rounded px-2 py-1 text-xs font-medium ${
                                productInfo.type === 'ACO'
                                  ? 'bg-blue-100 text-blue-800'
                                  : productInfo.type === 'Slate'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {productInfo.type}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Basic Fields */}
                    <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
                      <EnhancedFormField
                        label='Quantity per Pallet'
                        required
                        error={errors.quantity}
                      >
                        <EnhancedInput
                          type='number'
                          value={formData.quantity}
                          onChange={e => handleInputChange('quantity', e.target.value)}
                          placeholder='Enter quantity'
                          min='1'
                          error={errors.quantity}
                        />
                      </EnhancedFormField>

                      <EnhancedFormField
                        label='Number of Pallets'
                        required
                        error={errors.count}
                        hint={
                          productInfo?.type === 'Slate'
                            ? 'Fixed to 1 for Slate products'
                            : undefined
                        }
                      >
                        <EnhancedInput
                          type='number'
                          value={formData.count}
                          onChange={e => handleInputChange('count', e.target.value)}
                          placeholder='Enter count'
                          min='1'
                          disabled={productInfo?.type === 'Slate'}
                          error={errors.count}
                        />
                      </EnhancedFormField>
                    </div>

                    <EnhancedFormField
                      label='Operator Clock Number'
                      hint='Optional - leave blank if not applicable'
                    >
                      <EnhancedInput
                        value={formData.operator}
                        onChange={e => handleInputChange('operator', e.target.value)}
                        placeholder='Enter operator clock number'
                      />
                    </EnhancedFormField>
                  </div>
                </ResponsiveCard>

                {/* Product Type Specific Sections */}
                {productInfo && (
                  <AccordionGroup title='Product Specific Details'>
                    {/* ACO Section */}
                    {productInfo.type === 'ACO' && (
                      <AccordionItem
                        title='ACO Order Details'
                        subtitle='Configure ACO order reference and details'
                        icon={<DocumentTextIcon className='h-5 w-5' />}
                        defaultOpen
                        badge='Required'
                      >
                        <EnhancedFormField
                          label='ACO Order Reference'
                          required
                          error={errors.acoOrderRef}
                          hint='Enter the ACO order reference number'
                        >
                          <EnhancedInput
                            value={formData.acoOrderRef}
                            onChange={e => handleInputChange('acoOrderRef', e.target.value)}
                            placeholder='Enter ACO order reference'
                            error={errors.acoOrderRef}
                          />
                        </EnhancedFormField>
                      </AccordionItem>
                    )}

                    {/* Slate Section */}
                    {productInfo.type === 'Slate' && (
                      <AccordionItem
                        title='Slate Product Details'
                        subtitle='Configure slate-specific parameters'
                        icon={<Cog6ToothIcon className='h-5 w-5' />}
                        defaultOpen
                        badge='Required'
                      >
                        <div className='space-y-4'>
                          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                            <EnhancedFormField
                              label='First-Off Date'
                              required
                              error={errors.firstOffDate}
                            >
                              <EnhancedInput
                                type='date'
                                value={formData.slateDetail.firstOffDate}
                                onChange={e =>
                                  handleSlateDetailChange('firstOffDate', e.target.value)
                                }
                                error={errors.firstOffDate}
                              />
                            </EnhancedFormField>

                            <EnhancedFormField
                              label='Batch Number'
                              required
                              error={errors.batchNumber}
                            >
                              <EnhancedInput
                                value={formData.slateDetail.batchNumber}
                                onChange={e =>
                                  handleSlateDetailChange('batchNumber', e.target.value)
                                }
                                placeholder='Enter batch number'
                                error={errors.batchNumber}
                              />
                            </EnhancedFormField>
                          </div>

                          <EnhancedFormField label='Setter Name' required error={errors.setterName}>
                            <EnhancedInput
                              value={formData.slateDetail.setterName}
                              onChange={e => handleSlateDetailChange('setterName', e.target.value)}
                              placeholder='Enter setter name'
                              error={errors.setterName}
                            />
                          </EnhancedFormField>

                          {/* Additional Slate Fields */}
                          <AccordionItem
                            title='Additional Specifications'
                            subtitle='Optional detailed specifications'
                          >
                            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                              {[
                                { key: 'weight', label: 'Weight' },
                                { key: 'topThickness', label: 'Top Thickness' },
                                { key: 'bottomThickness', label: 'Bottom Thickness' },
                                { key: 'length', label: 'Length' },
                                { key: 'width', label: 'Width' },
                                { key: 'centreHole', label: 'Centre Hole' },
                                { key: 'flameTest', label: 'Flame Test' },
                              ].map(field => (
                                <EnhancedFormField key={field.key} label={field.label} size='sm'>
                                  <EnhancedInput
                                    value={formData.slateDetail[field.key as keyof SlateDetail]}
                                    onChange={e =>
                                      handleSlateDetailChange(
                                        field.key as keyof SlateDetail,
                                        e.target.value
                                      )
                                    }
                                    placeholder={`Enter ${field.label.toLowerCase()}`}
                                    size='sm'
                                  />
                                </EnhancedFormField>
                              ))}
                            </div>

                            <EnhancedFormField
                              label='Remarks'
                              hint='Any additional notes or comments'
                            >
                              <textarea
                                className='w-full resize-none rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                                rows={3}
                                value={formData.slateDetail.remark}
                                onChange={e => handleSlateDetailChange('remark', e.target.value)}
                                placeholder='Enter any additional remarks...'
                              />
                            </EnhancedFormField>
                          </AccordionItem>
                        </div>
                      </AccordionItem>
                    )}
                  </AccordionGroup>
                )}
              </div>

              {/* Legacy comment - sidebar removed */}
              <div className={`${isMobile ? 'w-full' : 'w-80'} flex-shrink-0`}>
                <div className='space-y-6'>
                  {/* Instructions */}
                  <ResponsiveCard title='Instructions' padding='sm'>
                    <ul className='space-y-2 text-sm text-gray-300'>
                      <li className='flex items-start'>
                        <span className='mr-2 text-blue-400'>1.</span>
                        Enter all required pallet details
                      </li>
                      <li className='flex items-start'>
                        <span className='mr-2 text-blue-400'>2.</span>
                        Configure product-specific settings if needed
                      </li>
                      <li className='flex items-start'>
                        <span className='mr-2 text-blue-400'>3.</span>
                        Click Print Label to generate and save labels
                      </li>
                    </ul>
                  </ResponsiveCard>

                  {/* Progress */}
                  {pdfProgress.total > 0 && (
                    <ResponsiveCard title='Generation Progress' padding='sm'>
                      <EnhancedProgressBar
                        current={pdfProgress.current}
                        total={pdfProgress.total}
                        status={pdfProgress.status}
                        variant={isMobile ? 'compact' : 'default'}
                        title='PDF Generation'
                      />
                    </ResponsiveCard>
                  )}

                  {/* Submit Button */}
                  <button
                    type='submit'
                    disabled={!isFormValid || isLoading}
                    className={`flex w-full items-center justify-center space-x-2 rounded-lg px-4 py-3 font-semibold transition-all duration-200 ${
                      isFormValid && !isLoading
                        ? 'bg-blue-600 text-white shadow-lg hover:bg-blue-700 hover:shadow-xl'
                        : 'cursor-not-allowed bg-gray-600 text-gray-300'
                    } `}
                  >
                    <PrinterIcon className='h-5 w-5' />
                    <span>{isLoading ? 'Processing...' : 'Print Label'}</span>
                  </button>
                </div>
              </div>
            </ResponsiveStack>
          </form>
        </ResponsiveContainer>
      </ResponsiveLayout>
    );
  }
);

ImprovedQcLabelForm.displayName = 'ImprovedQcLabelForm';

export default ImprovedQcLabelForm;
