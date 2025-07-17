/**
 * Supplier Update Widget V2
 * 使用 RPC 函數優化 CRUD 操作
 * 遷移自原 SupplierUpdateWidget
 */

'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BuildingOfficeIcon,
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
import { searchSupplier, createSupplier, updateSupplier } from '@/app/actions/supplierActions';
import { errorHandler } from '@/app/components/qc-label-form/services/ErrorHandler';
// GraphQL dependencies removed - using REST API only
import { useWidgetErrorHandler } from '@/app/admin/hooks/useWidgetErrorHandler';
import { 
  brandColors, 
  widgetColors, 
  semanticColors,
  getWidgetCategoryColor 
} from '@/lib/design-system/colors';
import { textClasses, getTextClass } from '@/lib/design-system/typography';
import { spacing, widgetSpacing, spacingUtilities } from '@/lib/design-system/spacing';
import { cn } from '@/lib/utils';

// GraphQL queries removed - using REST API only

interface SupplierData {
  supplier_code: string;
  supplier_name: string;
}

interface StatusMessageType {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export const SupplierUpdateWidgetV2 = React.memo(function SupplierUpdateWidgetV2({
  widget,
  isEditMode,
}: WidgetComponentProps) {
  const { handleSuccess, handleError, handleWarning, handleSubmitError } = useWidgetErrorHandler(
    'title' in widget ? widget.title : widget.config?.title || 'Supplier Update'
  );
  // State management
  const [supplierData, setSupplierData] = useState<SupplierData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchedCode, setSearchedCode] = useState('');
  const [searchInput, setSearchInput] = useState(''); // Track input value
  const [statusMessage, setStatusMessage] = useState<StatusMessageType | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    lastOperationTime?: number;
    optimized?: boolean;
  }>({});

  // Form state
  const [formData, setFormData] = useState<SupplierData>({
    supplier_code: '',
    supplier_name: '',
  });


  // GraphQL mutations removed - using REST API only


  // Reset state
  const resetState = useCallback(() => {
    setSupplierData(null);
    setIsEditing(false);
    setShowCreateDialog(false);
    setShowForm(false);
    setSearchedCode('');
    setSearchInput(''); // Reset search input
    setStatusMessage(null);
    setFormData({
      supplier_code: '',
      supplier_name: '',
    });
  }, []);

  // Search supplier using REST API only
  const [searchData, setSearchData] = useState<{ data_supplierCollection: { edges: Array<{ node: SupplierData }> } } | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<any>(null);

  // Handle search using REST API only
  const handleSearch = useCallback(
    async (code: string) => {
      if (!code || !code.trim()) {
        handleWarning('Please enter a supplier code', 'search_validation');
        setStatusMessage({
          type: 'error',
          message: 'Please enter a supplier code',
        });
        return;
      }

      setStatusMessage(null);
      setSearchLoading(true);
      setSearchError(null);
      const searchCode = code.trim().toUpperCase();
      setSearchedCode(searchCode);

      try {
        const startTime = performance.now();
        const result = await searchSupplier(searchCode);
        const endTime = performance.now();
        
        console.log(`[SupplierUpdateWidgetV2] Server Action search: ${Math.round(endTime - startTime)}ms`);
        
        if (result.exists && result.supplier) {
          setSearchData({
            data_supplierCollection: {
              edges: [{ node: result.supplier }],
            },
          });
        } else {
          setSearchData({ data_supplierCollection: { edges: [] } });
        }
      } catch (error) {
        setSearchError(error);
        setStatusMessage({
          type: 'error',
          message: 'Search failed. Please try again.',
        });
      } finally {
        setSearchLoading(false);
      }
    },
    [handleWarning as string]
  );

  // React to search data changes
  React.useEffect(() => {
    if (searchData && searchedCode) {
      const edges = searchData.data_supplierCollection?.edges || [];
      
      if (edges.length > 0) {
        const supplier = edges[0].node;
        setSupplierData(supplier);
        setIsEditing(false);
        setShowForm(false);
        setShowCreateDialog(false);
        setStatusMessage({
          type: 'success',
          message: `Found: ${supplier.supplier_code}`,
        });
        handleSuccess(`Supplier ${supplier.supplier_code} found`, 'search_supplier', {
          supplierCode: supplier.supplier_code,
        });
      } else {
        // Supplier not found
        setSupplierData(null);
        setShowCreateDialog(true);
        setShowForm(false);
        setIsEditing(false);
        setFormData({
          supplier_code: searchedCode,
          supplier_name: '',
        });
        setStatusMessage({
          type: 'warning',
          message: `"${searchedCode}" not found`,
        });
      }
    }
  }, [searchData, searchedCode, handleSuccess]);

  // Start editing
  const handleEdit = useCallback(() => {
    if (supplierData) {
      setFormData(supplierData);
      setIsEditing(true);
      setShowForm(true);
      setShowCreateDialog(false);
    }
  }, [supplierData as string]);

  // Confirm create supplier
  const handleConfirmCreate = useCallback(() => {
    setFormData({
      supplier_code: searchedCode,
      supplier_name: '',
    });
    setIsEditing(false);
    setShowForm(true);
    setShowCreateDialog(false);
    setStatusMessage({
      type: 'info',
      message: 'Fill in supplier details',
    });
  }, [searchedCode as string]);

  // Cancel operation
  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setShowForm(false);
    setShowCreateDialog(false);
    setStatusMessage(null);
  }, []);

  // Submit form using REST API only
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      
      // Validate form
      if (!formData.supplier_code.trim() || !formData.supplier_name.trim()) {
        handleWarning('Please fill in all required fields', 'form_validation');
        setStatusMessage({
          type: 'error',
          message: 'Please fill in all required fields',
        });
        return;
      }

      const startTime = performance.now();
      setIsLoading(true);

      try {
        if (isEditing) {
          // Update existing supplier
          const result = await updateSupplier(supplierData!.supplier_code, formData.supplier_name);
          
          if (!result.success) {
            throw new Error(result.error || 'Update failed');
          }
          
          if (result.supplier) {
            setSupplierData(result.supplier);
            setStatusMessage({ type: 'success', message: 'Updated successfully!' });
            handleSuccess(`Supplier ${result.supplier.supplier_code} updated`, 'update_supplier', {
              supplierCode: result.supplier.supplier_code,
            });
          }
        } else {
          // Create new supplier
          const result = await createSupplier(formData.supplier_code, formData.supplier_name);
          
          if (!result.success) {
            throw new Error(result.error || 'Creation failed');
          }
          
          if (result.supplier) {
            setSupplierData(result.supplier);
            setStatusMessage({ type: 'success', message: 'Created successfully!' });
            handleSuccess(`Supplier ${result.supplier.supplier_code} created`, 'create_supplier', {
              supplierCode: result.supplier.supplier_code,
            });
          }
        }

        const endTime = performance.now();
        setPerformanceMetrics({
          lastOperationTime: Math.round(endTime - startTime),
          optimized: true,
        });

        // Reset form after success
        setIsEditing(false);
        setShowForm(false);
        setShowCreateDialog(false);
      } catch (error: any) {
        errorHandler.handleApiError(
          error,
          {
            component: 'SupplierUpdateWidgetV2',
            action: isEditing ? 'update_supplier' : 'create_supplier',
            additionalData: {
              supplierCode: formData.supplier_code,
              isEditing,
            },
          },
          (error as { message: string }).message || 'Unexpected error'
        );
        setStatusMessage({
          type: 'error',
          message: (error as { message: string }).message || 'Unexpected error',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [isEditing, supplierData, formData, handleWarning, handleSuccess]
  );

  // Handle form input change
  const handleInputChange = useCallback((field: keyof SupplierData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field as string]: value,
    }));
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='h-full'>
      <WidgetCard widgetType='custom' isEditMode={isEditMode}>
        <CardHeader className='pb-3'>
          <CardTitle className='widget-title flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <BuildingOfficeIcon className='h-5 w-5' />
              Supplier Update
            </div>
            {performanceMetrics.lastOperationTime && (
              <span className={cn(textClasses['label-small'], 'text-muted-foreground')}>
                {performanceMetrics.lastOperationTime}ms
                {performanceMetrics.optimized && ' (optimized)'}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className='max-h-[calc(100%-60px)] space-y-4 overflow-y-auto'>
          {/* Search Section */}
          {!showForm && !showCreateDialog && (
            <div className='space-y-3'>
              <Label htmlFor='search' className={cn(textClasses['body-small'], 'text-muted-foreground')}>
                Supplier Code
              </Label>
              <div className='flex gap-2'>
                <Input
                  id='search'
                  type='text'
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder='Enter supplier code...'
                  className={cn(
                    'h-9 flex-1 border-input bg-background',
                    textClasses['body-small']
                  )}
                  disabled={searchLoading || isEditMode}
                />
                <Button
                  onClick={() => handleSearch(searchInput)}
                  disabled={searchLoading || isEditMode}
                  size='sm'
                  className={cn(
                    'h-9 px-4 bg-gradient-to-r',
                    getWidgetCategoryColor('operations', 'gradient'),
                    'hover:opacity-90'
                  )}
                >
                  {isLoading ? (
                    <div className='h-4 w-4 animate-spin rounded-full border-b-2 border-white' />
                  ) : (
                    <>
                      <MagnifyingGlassIcon className='mr-2 h-4 w-4' />
                      Search
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Status Message */}
          {statusMessage && (
            <div
              className={cn(
                'rounded-lg p-3',
                textClasses['body-small'],
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
            <div className={cn(
              'rounded-lg border border-warning/30 bg-card/50 p-4'
            )}>
              <div className='flex items-start space-x-3'>
                <ExclamationTriangleIcon className='mt-0.5 h-5 w-5 text-warning' />
                <div className='flex-1'>
                  <p className={cn(textClasses['body-small'], 'font-medium text-warning')}>Supplier Not Found</p>
                  <p className={cn('mt-1', textClasses['body-small'], 'text-muted-foreground')}>
                    Create new supplier &quot;{searchedCode}&quot;?
                  </p>
                  <div className='mt-3 flex gap-2'>
                    <Button
                      onClick={handleConfirmCreate}
                      size='sm'
                      className={cn(
                        'h-8 bg-success hover:bg-success/90 text-success-foreground',
                        textClasses['body-small']
                      )}
                      disabled={isEditMode}
                    >
                      <CheckCircleIcon className='mr-1 h-4 w-4' />
                      Create
                    </Button>
                    <Button
                      onClick={handleCancel}
                      size='sm'
                      variant='outline'
                      className={cn(
                        'h-8 border-border',
                        textClasses['body-small']
                      )}
                      disabled={isEditMode}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Supplier Info Display */}
          {supplierData && !showForm && (
            <div className={cn(
              'rounded-lg border border-border bg-card/50 p-4'
            )}>
              <div className='mb-3 flex items-center justify-between'>
                <h4 className={cn(textClasses['body-small'], 'font-medium text-primary')}>Supplier Info</h4>
                <Button
                  onClick={handleEdit}
                  size='sm'
                  className={cn(
                    'h-7 bg-primary hover:bg-primary/90 text-primary-foreground px-3',
                    textClasses['label-small']
                  )}
                  disabled={isEditMode}
                >
                  <PencilIcon className='mr-1 h-3 w-3' />
                  Edit
                </Button>
              </div>
              <div className='space-y-2'>
                <InfoRow label='Code' value={supplierData.supplier_code} />
                <InfoRow label='Name' value={supplierData.supplier_name} />
              </div>
            </div>
          )}

          {/* Supplier Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div className='mb-3 flex items-center justify-between'>
                <h4 className={cn(textClasses['body-small'], 'font-medium text-primary')}>
                  {isEditing ? 'Edit Supplier' : 'New Supplier'}
                </h4>
                <Button
                  type='button'
                  onClick={resetState}
                  size='sm'
                  variant='ghost'
                  className={cn('h-7 px-3', textClasses['label-small'])}
                  disabled={searchLoading || isEditMode}
                >
                  <ArrowPathIcon className='h-4 w-4' />
                </Button>
              </div>

              <div className='space-y-3'>
                <div>
                  <Label htmlFor='supplier_code' className={textClasses['body-small']}>
                    Code *
                  </Label>
                  <Input
                    id='supplier_code'
                    type='text'
                    value={formData.supplier_code}
                    onChange={e => handleInputChange('supplier_code', e.target.value.toUpperCase())}
                    disabled={isEditing || isEditMode}
                    className={cn(
                      'mt-1 h-9 border-input bg-background',
                      textClasses['body-small']
                    )}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor='supplier_name' className={textClasses['body-small']}>
                    Name *
                  </Label>
                  <Input
                    id='supplier_name'
                    type='text'
                    value={formData.supplier_name}
                    onChange={e => handleInputChange('supplier_name', e.target.value)}
                    className={cn(
                      'mt-1 h-9 border-input bg-background',
                      textClasses['body-small']
                    )}
                    disabled={isEditMode}
                    required
                  />
                </div>
              </div>

              <div className='flex gap-2 pt-2'>
                <Button
                  type='button'
                  onClick={handleCancel}
                  size='sm'
                  variant='outline'
                  className={cn(
                    'h-8 flex-1 border-border',
                    textClasses['body-small']
                  )}
                  disabled={searchLoading || isEditMode}
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  size='sm'
                  disabled={searchLoading || isEditMode}
                  className={cn(
                    'h-8 flex-1 bg-primary hover:bg-primary/90 text-primary-foreground',
                    textClasses['body-small']
                  )}
                >
                  {isLoading ? (
                    <div className='h-3 w-3 animate-spin rounded-full border-b-2 border-white' />
                  ) : (
                    <>
                      <CheckCircleIcon className='mr-1 h-4 w-4' />
                      {isEditing ? 'Update' : 'Create'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Performance indicator */}
          {performanceMetrics.optimized && (
            <div className={cn(
              'mt-2 text-center text-success',
              textClasses['label-small']
            )}>
              ✓ Server-side optimized (atomic operations)
            </div>
          )}
        </CardContent>
      </WidgetCard>
    </motion.div>
  );
});

export default SupplierUpdateWidgetV2;

// Info Row Component
interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className={cn(
      'flex items-center justify-between rounded bg-background/30 px-3 py-2',
      textClasses['body-small']
    )}>
      <span className='text-muted-foreground'>{label}:</span>
      <span className='font-medium text-foreground'>{value || '-'}</span>
    </div>
  );
}
