/**
 * Product Update Widget
 * 支援產品創建、更新同搜索功能，整合統一錯誤處理機制
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
import { WidgetComponentProps } from '@/app/types/dashboard';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UniversalWidgetCard as WidgetCard } from '../UniversalWidgetCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  getProductByCode,
  createProduct,
  updateProduct,
  ProductData,
} from '@/app/actions/productActions';
import { useWidgetErrorHandler } from '@/app/admin/hooks/useWidgetErrorHandler';

interface StatusMessageType {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export const ProductUpdateWidget = React.memo(function ProductUpdateWidget({
  widget,
  isEditMode,
}: WidgetComponentProps) {
  // Error handler hook
  const { handleError, handleFetchError, handleSubmitError, handleSuccess, handleWarning } =
    useWidgetErrorHandler('ProductUpdateWidget');

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

  // Search product with enhanced error handling
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

      setIsLoading(true);
      setStatusMessage(null);
      setSearchedCode(code.trim());

      try {
        const result = await getProductByCode(code.trim());

        if (result.success && result.data) {
          // Search success
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

  // Submit form with enhanced error handling
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);

      try {
        let result;

        if (isEditing && productData) {
          // Update existing product
          const { code: _, ...updateData } = formData;

          // Ensure data types
          if (typeof updateData.standard_qty === 'string') {
            updateData.standard_qty = parseInt(updateData.standard_qty) || 0;
          }

          result = await updateProduct(productData.code, updateData);

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
          }
        } else {
          // Create new product
          result = await createProduct(formData);
          if (result.success) {
            setProductData(result.data!);
            setStatusMessage({
              type: 'success',
              message: 'Created successfully!',
            });
            handleSuccess('Product created successfully', 'create_product', {
              productCode: formData.code,
            });
          }
        }

        if (!result.success) {
          throw new Error(result.error || 'Operation failed');
        }

        // Reset form after success
        setIsEditing(false);
        setShowForm(false);
        setShowCreateDialog(false);
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
      [field]: value,
    }));
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='h-full'>
      <WidgetCard widgetType='custom' isEditMode={isEditMode}>
        <CardHeader className='pb-2'>
          <CardTitle className='widget-title flex items-center gap-2'>
            <CubeIcon className='h-5 w-5' />
            Product Update
          </CardTitle>
        </CardHeader>
        <CardContent className='max-h-[calc(100%-60px)] space-y-3 overflow-y-auto'>
          {/* Search Section */}
          {!showForm && !showCreateDialog && (
            <div className='space-y-2'>
              <Label htmlFor='search' className='text-xs text-slate-300'>
                Product Code
              </Label>
              <div className='flex gap-2'>
                <Input
                  id='search'
                  type='text'
                  placeholder='Enter code...'
                  className='h-8 flex-1 border-slate-600/50 bg-slate-700/50 text-sm'
                  disabled={isLoading || isEditMode}
                />
                <Button
                  onClick={() => {
                    const input = document.getElementById('search') as HTMLInputElement;
                    if (input) handleSearch(input.value);
                  }}
                  disabled={isLoading || isEditMode}
                  size='sm'
                  className='h-8 bg-gradient-to-r from-orange-600 to-amber-600 px-3 hover:from-orange-500 hover:to-amber-500'
                >
                  {isLoading ? (
                    <div className='h-3 w-3 animate-spin rounded-full border-b-2 border-white' />
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
              className={`rounded-lg p-2 text-xs ${
                statusMessage.type === 'success'
                  ? 'bg-green-500/20 text-green-400'
                  : statusMessage.type === 'error'
                    ? 'bg-red-500/20 text-red-400'
                    : statusMessage.type === 'warning'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-blue-500/20 text-blue-400'
              }`}
            >
              {statusMessage.message}
            </div>
          )}

          {/* Create Confirmation */}
          {showCreateDialog && (
            <div className='rounded-lg border border-yellow-500/30 bg-slate-800/50 p-3'>
              <div className='flex items-start space-x-2'>
                <ExclamationTriangleIcon className='mt-0.5 h-5 w-5 text-yellow-400' />
                <div className='flex-1'>
                  <p className='text-sm font-medium text-yellow-400'>Product Not Found</p>
                  <p className='mt-1 text-xs text-slate-300'>
                    Create new product &quot;{searchedCode}&quot;?
                  </p>
                  <div className='mt-2 flex gap-2'>
                    <Button
                      onClick={handleConfirmCreate}
                      size='sm'
                      className='h-7 bg-green-600 text-xs hover:bg-green-700'
                      disabled={isEditMode}
                    >
                      <CheckCircleIcon className='mr-1 h-3 w-3' />
                      Create
                    </Button>
                    <Button
                      onClick={handleCancel}
                      size='sm'
                      variant='outline'
                      className='h-7 border-slate-600 text-xs'
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
            <div className='rounded-lg border border-slate-700/50 bg-slate-800/50 p-3'>
              <div className='mb-2 flex items-center justify-between'>
                <h4 className='text-sm font-medium text-orange-400'>Product Info</h4>
                <Button
                  onClick={handleEdit}
                  size='sm'
                  className='h-6 bg-blue-600 px-2 text-xs hover:bg-blue-700'
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
                <h4 className='text-sm font-medium text-orange-400'>
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
                    <div className='h-3 w-3 animate-spin rounded-full border-b-2 border-white' />
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

export default ProductUpdateWidget;

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
