/**
 * Product Update Widget V2
 * 使用 Server Actions 實現產品管理功能
 * REST API 版本，已移除所有 GraphQL 相關代碼
 */

'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  CubeIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/types/components/dashboard';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UniversalWidgetCard as WidgetCard } from '../UniversalWidgetCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWidgetErrorHandler } from '@/app/(app)/admin/hooks/useWidgetErrorHandler';
import {
  getProductByCode,
  createProduct,
  updateProduct,
  ProductData,
} from '@/app/actions/productActions';
import {
  brandColors,
  widgetColors,
  semanticColors,
  getWidgetCategoryColor,
} from '@/lib/design-system/colors';
import { textClasses, getTextClass } from '@/lib/design-system/typography';
import { spacing, widgetSpacing, spacingUtilities } from '@/lib/design-system/spacing';
import { cn } from '@/lib/utils';

interface StatusMessageType {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export const ProductUpdateWidgetV2 = React.memo(function ProductUpdateWidgetV2({
  widget,
  isEditMode,
}: WidgetComponentProps) {
  // Error handler hook
  const { handleError, handleFetchError, handleSubmitError, handleSuccess, handleWarning } =
    useWidgetErrorHandler('ProductUpdateWidgetV2');

  // State management
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchedCode, setSearchedCode] = useState('');
  const [statusMessage, setStatusMessage] = useState<StatusMessageType | null>(null);

  // Form state
  const [formData, setFormData] = useState<ProductData>({
    code: '',
    description: '',
    colour: '',
    standard_qty: 0,
    type: '',
  });

  // Reset state
  const resetState = useCallback(() => {
    setProductData(null);
    setIsEditing(false);
    setShowCreateDialog(false);
    setShowForm(false);
    setSearchedCode('');
    setStatusMessage(null);
    setFormData({
      code: '',
      description: '',
      colour: '',
      standard_qty: 0,
      type: '',
    });
  }, []);

  // Search product handler
  const handleSearch = useCallback(
    async (code: string) => {
      if (!code.trim()) {
        handleWarning('Please enter a product code', 'search_validation');
        setStatusMessage({
          type: 'error',
          message: 'Please enter a product code',
        });
        return;
      }

      setStatusMessage(null);
      setSearchedCode(code.trim());
      setIsLoading(true);

      try {
        const result = await getProductByCode(code.trim());

        if (result.success && result.data) {
          setProductData(result.data);
          setIsEditing(false);
          setShowForm(false);
          setShowCreateDialog(false);
          setStatusMessage({
            type: 'success',
            message: `Found: ${result.data.code}`,
          });
          handleSuccess(`Product ${result.data.code} found`, 'search_product', {
            productCode: result.data.code,
          });
        } else {
          // Product not found
          setProductData(null);
          setShowCreateDialog(true);
          setShowForm(false);
          setIsEditing(false);
          setStatusMessage({
            type: 'warning',
            message: `"${code.trim()}" not found`,
          });
          handleWarning(`Product "${code.trim()}" not found`, 'search_product');
        }
      } catch (error) {
        handleFetchError(error, 'product_search');
        setStatusMessage({
          type: 'error',
          message: 'Search failed. Please try again.',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [handleWarning, handleSuccess, handleFetchError]
  );

  // Start editing
  const handleEdit = useCallback(() => {
    if (productData) {
      setFormData(productData);
      setIsEditing(true);
      setShowForm(true);
      setShowCreateDialog(false);
    }
  }, [productData]);

  // Confirm create product
  const handleConfirmCreate = useCallback(() => {
    setFormData({
      code: searchedCode,
      description: '',
      colour: '',
      standard_qty: 0,
      type: '',
    });
    setIsEditing(false);
    setShowForm(true);
    setShowCreateDialog(false);
    setStatusMessage({
      type: 'info',
      message: 'Fill in product details',
    });
  }, [searchedCode]);

  // Cancel operation
  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setShowForm(false);
    setShowCreateDialog(false);
    setStatusMessage(null);
  }, []);

  // Submit form - 使用 Server Actions
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);

      try {
        if (isEditing && productData) {
          // Update existing product
          const { code: _, ...updateData } = formData;
          if (typeof updateData.standard_qty === 'string') {
            updateData.standard_qty = parseInt(updateData.standard_qty) || 0;
          }
          const result = await updateProduct(productData.code, updateData);

          if (result.success) {
            setProductData(result.data!);
            setStatusMessage({
              type: 'success',
              message: 'Updated successfully!',
            });
            handleSuccess('Product updated successfully', 'update_product', {
              productCode: productData.code,
              changes: updateData,
            });
            setIsEditing(false);
            setShowForm(false);
          } else {
            throw new Error(result.error || 'Operation failed');
          }
        } else {
          // Create new product
          const result = await createProduct(formData);
          if (result.success) {
            setProductData(result.data!);
            setStatusMessage({
              type: 'success',
              message: 'Created successfully!',
            });
            handleSuccess('Product created successfully', 'create_product', {
              productCode: formData.code,
            });
            setIsEditing(false);
            setShowForm(false);
            setShowCreateDialog(false);
          } else {
            throw new Error(result.error || 'Operation failed');
          }
        }
      } catch (error) {
        const action = isEditing ? 'update_product' : 'create_product';
        handleSubmitError(error, {
          action,
          productCode: isEditing ? productData?.code : formData.code,
          formData,
        });
        setStatusMessage({
          type: 'error',
          message: 'Operation failed. Please try again.',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [isEditing, productData, formData, handleSuccess, handleSubmitError]
  );

  // Handle form input change
  const handleInputChange = useCallback((field: keyof ProductData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field as string]: value,
    }));
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='h-full'>
      <WidgetCard widgetType='custom' isEditMode={isEditMode}>
        <CardHeader className='pb-2'>
          <CardTitle className='flex items-center gap-2'>
            <CubeIcon className='h-5 w-5' />
            <span className={textClasses['widget-title']}>Product Update V2</span>
            <span className={cn(textClasses['label-small'], 'text-muted-foreground')}>
              (REST API)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className='max-h-[calc(100%-60px)] space-y-3 overflow-y-auto'>
          {/* Search Section */}
          {!showForm && !showCreateDialog && (
            <div className='space-y-2'>
              <Label
                htmlFor='search'
                className={cn(textClasses['label-base'], 'text-muted-foreground')}
              >
                Product Code
              </Label>
              <div className='flex gap-2'>
                <Input
                  id='search'
                  type='text'
                  placeholder='Enter code...'
                  className={cn('h-8 flex-1 border-input bg-background', textClasses['body-small'])}
                  disabled={isLoading || isEditMode}
                />
                <Button
                  onClick={() => {
                    const input = document.getElementById('search') as HTMLInputElement;
                    if (input) handleSearch(input.value);
                  }}
                  disabled={isLoading || isEditMode}
                  size='sm'
                  className={cn(
                    'h-8 bg-gradient-to-br px-3',
                    getWidgetCategoryColor('operations', 'gradient'),
                    'hover:opacity-90'
                  )}
                >
                  {isLoading ? (
                    <div className='h-1 w-6 bg-white/60 rounded-full' />
                  ) : (
                    <MagnifyingGlassIcon className='h-4 w-4' />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Status Message */}
          {statusMessage && (
            <div
              className={cn(
                'rounded-lg p-2',
                textClasses['label-base'],
                statusMessage.type === 'success'
                  ? 'bg-success/20 text-success'
                  : statusMessage.type === 'error'
                    ? 'bg-destructive/20 text-destructive'
                    : statusMessage.type === 'warning'
                      ? 'bg-warning/20 text-warning'
                      : 'bg-info/20 text-info'
              )}
            >
              {(statusMessage as { message: string }).message}
            </div>
          )}

          {/* Create Confirmation */}
          {showCreateDialog && (
            <div className='border-warning/30 bg-warning/10 rounded-lg border p-3'>
              <div className='flex items-start gap-2'>
                <ExclamationTriangleIcon className='text-warning mt-0.5 h-5 w-5' />
                <div className='flex-1'>
                  <p className={cn(textClasses['body-small'], 'text-warning font-medium')}>
                    Product Not Found
                  </p>
                  <p className={cn('mt-1', textClasses['label-small'], 'text-muted-foreground')}>
                    Create new product &quot;{searchedCode}&quot;?
                  </p>
                  <div className='mt-2 flex gap-2'>
                    <Button
                      onClick={handleConfirmCreate}
                      size='sm'
                      className={cn(
                        'bg-success hover:bg-success/90 h-7',
                        textClasses['label-small']
                      )}
                      disabled={isEditMode}
                    >
                      <CheckCircleIcon className='mr-1 h-3 w-3' />
                      Create
                    </Button>
                    <Button
                      onClick={handleCancel}
                      size='sm'
                      variant='outline'
                      className={cn('h-7 border-border', textClasses['label-small'])}
                      disabled={isEditMode}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Product Info Display */}
          {productData && !showForm && (
            <div className='rounded-lg border border-border bg-card p-3'>
              <div className='mb-2 flex items-center justify-between'>
                <h4 className={cn(textClasses['label-large'], 'text-primary')}>Product Info</h4>
                <Button
                  onClick={handleEdit}
                  size='sm'
                  className={cn(
                    'h-6 bg-primary px-2 hover:bg-primary/90',
                    textClasses['label-small']
                  )}
                  disabled={isEditMode}
                >
                  <PencilIcon className='mr-1 h-3 w-3' />
                  Edit
                </Button>
              </div>
              <div className='space-y-1.5'>
                <InfoRow label='Code' value={productData.code} />
                <InfoRow label='Description' value={productData.description} />
                <InfoRow label='Colour' value={productData.colour} />
                <InfoRow label='Qty' value={productData.standard_qty.toString()} />
                <InfoRow label='Type' value={productData.type} />
              </div>
            </div>
          )}

          {/* Product Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className='space-y-3'>
              <div className='mb-2 flex items-center justify-between'>
                <h4 className={cn(textClasses['label-large'], 'text-primary')}>
                  {isEditing ? 'Edit Product' : 'New Product'}
                </h4>
                <Button
                  type='button'
                  onClick={resetState}
                  size='sm'
                  variant='ghost'
                  className='h-6 px-2 text-xs'
                  disabled={isLoading || isEditMode}
                >
                  <ArrowPathIcon className='h-3 w-3' />
                </Button>
              </div>

              <div className='space-y-2'>
                <div>
                  <Label htmlFor='code' className='text-xs'>
                    Code *
                  </Label>
                  <Input
                    id='code'
                    type='text'
                    value={formData.code}
                    onChange={e => handleInputChange('code', e.target.value)}
                    disabled={isEditing || isEditMode}
                    className='h-8 bg-slate-700/50 text-sm'
                    required
                  />
                </div>

                <div>
                  <Label htmlFor='type' className='text-xs'>
                    Type *
                  </Label>
                  <Input
                    id='type'
                    type='text'
                    value={formData.type}
                    onChange={e => handleInputChange('type', e.target.value)}
                    className='h-8 bg-slate-700/50 text-sm'
                    disabled={isEditMode}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor='description' className='text-xs'>
                    Description *
                  </Label>
                  <Input
                    id='description'
                    type='text'
                    value={formData.description}
                    onChange={e => handleInputChange('description', e.target.value)}
                    className='h-8 bg-slate-700/50 text-sm'
                    disabled={isEditMode}
                    required
                  />
                </div>

                <div className='grid grid-cols-2 gap-2'>
                  <div>
                    <Label htmlFor='colour' className='text-xs'>
                      Colour
                    </Label>
                    <Input
                      id='colour'
                      type='text'
                      value={formData.colour}
                      onChange={e => handleInputChange('colour', e.target.value)}
                      className='h-8 bg-slate-700/50 text-sm'
                      disabled={isEditMode}
                    />
                  </div>

                  <div>
                    <Label htmlFor='standard_qty' className='text-xs'>
                      Qty *
                    </Label>
                    <Input
                      id='standard_qty'
                      type='number'
                      value={formData.standard_qty}
                      onChange={e =>
                        handleInputChange('standard_qty', parseInt(e.target.value) || 0)
                      }
                      className='h-8 bg-slate-700/50 text-sm'
                      min='0'
                      disabled={isEditMode}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className='flex gap-2 pt-2'>
                <Button
                  type='button'
                  onClick={handleCancel}
                  size='sm'
                  variant='outline'
                  className='h-7 flex-1 border-slate-600 text-xs'
                  disabled={isLoading || isEditMode}
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  size='sm'
                  disabled={isLoading || isEditMode}
                  className='h-7 flex-1 bg-orange-600 text-xs hover:bg-orange-700'
                >
                  {isLoading ? (
                    <div className='h-1 w-6 bg-white/60 rounded-full' />
                  ) : (
                    <>
                      <CheckCircleIcon className='mr-1 h-3 w-3' />
                      {isEditing ? 'Update' : 'Create'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </WidgetCard>
    </motion.div>
  );
});

export default ProductUpdateWidgetV2;

// Info Row Component
interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className='flex items-center justify-between rounded bg-slate-700/30 px-2 py-1 text-xs'>
      <span className='text-slate-400'>{label}:</span>
      <span className='font-medium text-slate-200'>{value || '-'}</span>
    </div>
  );
}
