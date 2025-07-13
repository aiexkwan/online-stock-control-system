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
import { useGraphQLFallback, GraphQLFallbackPresets } from '@/app/admin/hooks/useGraphQLFallback';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client';
import { useWidgetErrorHandler } from '@/app/admin/hooks/useWidgetErrorHandler';

// GraphQL Queries and Mutations
const GET_SUPPLIER_BY_CODE = gql`
  query GetSupplierByCode($code: String!) {
    data_supplierCollection(filter: { supplier_code: { eq: $code } }) {
      edges {
        node {
          supplier_code
          supplier_name
        }
      }
    }
  }
`;

const CREATE_SUPPLIER_MUTATION = gql`
  mutation CreateSupplier($code: String!, $name: String!) {
    insertIntodata_supplierCollection(
      objects: [{ supplier_code: $code, supplier_name: $name }]
    ) {
      records {
        supplier_code
        supplier_name
      }
    }
  }
`;

const UPDATE_SUPPLIER_MUTATION = gql`
  mutation UpdateSupplier($code: String!, $name: String!) {
    updatedata_supplierCollection(
      filter: { supplier_code: { eq: $code } }
      set: { supplier_name: $name }
    ) {
      records {
        supplier_code
        supplier_name
      }
    }
  }
`;

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


  // GraphQL Mutations
  const [createSupplierMutation] = useMutation(CREATE_SUPPLIER_MUTATION, {
    onCompleted: (data) => {
      if (data?.insertIntodata_supplierCollection?.records?.[0]) {
        const newSupplier = data.insertIntodata_supplierCollection.records[0];
        setSupplierData(newSupplier);
        setShowForm(false);
        setShowCreateDialog(false);
        setStatusMessage({
          type: 'success',
          message: `Supplier "${newSupplier.supplier_code}" created successfully`,
        });
        handleSuccess(`Supplier ${newSupplier.supplier_code} created`, 'create_supplier', {
          supplierCode: newSupplier.supplier_code,
        });
      }
    },
    onError: (error) => {
      handleSubmitError(error, {
        action: 'create_supplier',
        supplierCode: formData.supplier_code,
      });
      setStatusMessage({
        type: 'error',
        message: 'Failed to create supplier',
      });
    },
  });

  const [updateSupplierMutation] = useMutation(UPDATE_SUPPLIER_MUTATION, {
    onCompleted: (data) => {
      if (data?.updatedata_supplierCollection?.records?.[0]) {
        const updatedSupplier = data.updatedata_supplierCollection.records[0];
        setSupplierData(updatedSupplier);
        setIsEditing(false);
        setShowForm(false);
        setStatusMessage({
          type: 'success',
          message: `Supplier "${updatedSupplier.supplier_code}" updated successfully`,
        });
        handleSuccess(`Supplier ${updatedSupplier.supplier_code} updated`, 'update_supplier', {
          supplierCode: updatedSupplier.supplier_code,
        });
      }
    },
    onError: (error) => {
      handleSubmitError(error, {
        action: 'update_supplier',
        supplierCode: supplierData?.supplier_code,
      });
      setStatusMessage({
        type: 'error',
        message: 'Failed to update supplier',
      });
    },
  });


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

  // Search supplier using GraphQL with fallback
  const { data: searchData, loading: searchLoading, error: searchError, refetch: searchRefetch } = useGraphQLFallback<
    { data_supplierCollection: { edges: Array<{ node: SupplierData }> } },
    { code: string }
  >({
    graphqlQuery: GET_SUPPLIER_BY_CODE,
    serverAction: async (variables) => {
      // Use Server Action for supplier search
      const code = variables?.code || '';
      const startTime = performance.now();
      
      const result = await searchSupplier(code);

      const endTime = performance.now();
      console.log(`[SupplierUpdateWidgetV2] Server Action search: ${Math.round(endTime - startTime)}ms`);

      if (result.exists && result.supplier) {
        return {
          data_supplierCollection: {
            edges: [{ node: result.supplier }],
          },
        };
      }
      
      return { data_supplierCollection: { edges: [] } };
    },
    variables: { code: searchedCode },
    skip: !searchedCode,
    widgetId: 'SupplierUpdateWidgetV2',
    ...GraphQLFallbackPresets.cached,
    fallbackEnabled: true,
  });

  // Handle search
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
      setSearchedCode(code.trim().toUpperCase());
    },
    [handleWarning]
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
  }, [supplierData]);

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
  }, [searchedCode]);

  // Cancel operation
  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setShowForm(false);
    setShowCreateDialog(false);
    setStatusMessage(null);
  }, []);

  // Submit form using GraphQL with RPC fallback
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
          // Try GraphQL mutation first
          try {
            await updateSupplierMutation({
              variables: {
                code: formData.supplier_code,
                name: formData.supplier_name,
              },
            });
          } catch (graphqlError) {
            // Fallback to Server Action if GraphQL fails
            console.log('[SupplierUpdateWidgetV2] GraphQL failed, falling back to Server Action');
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
          }
        } else {
          // Try GraphQL mutation first
          try {
            await createSupplierMutation({
              variables: {
                code: formData.supplier_code,
                name: formData.supplier_name,
              },
            });
          } catch (graphqlError) {
            // Fallback to Server Action if GraphQL fails
            console.log('[SupplierUpdateWidgetV2] GraphQL failed, falling back to Server Action');
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
          error.message || 'Unexpected error'
        );
        setStatusMessage({
          type: 'error',
          message: error.message || 'Unexpected error',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [isEditing, supplierData, formData, createSupplierMutation, updateSupplierMutation, handleWarning, handleSuccess]
  );

  // Handle form input change
  const handleInputChange = useCallback((field: keyof SupplierData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
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
              <span className='text-xs text-slate-400'>
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
              <Label htmlFor='search' className='text-sm text-slate-300'>
                Supplier Code
              </Label>
              <div className='flex gap-2'>
                <Input
                  id='search'
                  type='text'
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder='Enter supplier code...'
                  className='h-9 flex-1 border-slate-600/50 bg-slate-700/50 text-sm'
                  disabled={searchLoading || isEditMode}
                />
                <Button
                  onClick={() => handleSearch(searchInput)}
                  disabled={searchLoading || isEditMode}
                  size='sm'
                  className='h-9 bg-gradient-to-r from-blue-600 to-cyan-600 px-4 hover:from-blue-500 hover:to-cyan-500'
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
              className={`rounded-lg p-3 text-sm ${
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
            <div className='rounded-lg border border-yellow-500/30 bg-slate-800/50 p-4'>
              <div className='flex items-start space-x-3'>
                <ExclamationTriangleIcon className='mt-0.5 h-5 w-5 text-yellow-400' />
                <div className='flex-1'>
                  <p className='text-sm font-medium text-yellow-400'>Supplier Not Found</p>
                  <p className='mt-1 text-sm text-slate-300'>
                    Create new supplier &quot;{searchedCode}&quot;?
                  </p>
                  <div className='mt-3 flex gap-2'>
                    <Button
                      onClick={handleConfirmCreate}
                      size='sm'
                      className='h-8 bg-green-600 text-sm hover:bg-green-700'
                      disabled={isEditMode}
                    >
                      <CheckCircleIcon className='mr-1 h-4 w-4' />
                      Create
                    </Button>
                    <Button
                      onClick={handleCancel}
                      size='sm'
                      variant='outline'
                      className='h-8 border-slate-600 text-sm'
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
            <div className='rounded-lg border border-slate-700/50 bg-slate-800/50 p-4'>
              <div className='mb-3 flex items-center justify-between'>
                <h4 className='text-sm font-medium text-blue-400'>Supplier Info</h4>
                <Button
                  onClick={handleEdit}
                  size='sm'
                  className='h-7 bg-blue-600 px-3 text-xs hover:bg-blue-700'
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
                <h4 className='text-sm font-medium text-blue-400'>
                  {isEditing ? 'Edit Supplier' : 'New Supplier'}
                </h4>
                <Button
                  type='button'
                  onClick={resetState}
                  size='sm'
                  variant='ghost'
                  className='h-7 px-3 text-xs'
                  disabled={searchLoading || isEditMode}
                >
                  <ArrowPathIcon className='h-4 w-4' />
                </Button>
              </div>

              <div className='space-y-3'>
                <div>
                  <Label htmlFor='supplier_code' className='text-sm'>
                    Code *
                  </Label>
                  <Input
                    id='supplier_code'
                    type='text'
                    value={formData.supplier_code}
                    onChange={e => handleInputChange('supplier_code', e.target.value.toUpperCase())}
                    disabled={isEditing || isEditMode}
                    className='mt-1 h-9 bg-slate-700/50 text-sm'
                    required
                  />
                </div>

                <div>
                  <Label htmlFor='supplier_name' className='text-sm'>
                    Name *
                  </Label>
                  <Input
                    id='supplier_name'
                    type='text'
                    value={formData.supplier_name}
                    onChange={e => handleInputChange('supplier_name', e.target.value)}
                    className='mt-1 h-9 bg-slate-700/50 text-sm'
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
                  className='h-8 flex-1 border-slate-600 text-sm'
                  disabled={searchLoading || isEditMode}
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  size='sm'
                  disabled={searchLoading || isEditMode}
                  className='h-8 flex-1 bg-blue-600 text-sm hover:bg-blue-700'
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
            <div className='mt-2 text-center text-[10px] text-green-400'>
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
    <div className='flex items-center justify-between rounded bg-slate-700/30 px-3 py-2 text-sm'>
      <span className='text-slate-400'>{label}:</span>
      <span className='font-medium text-slate-200'>{value || '-'}</span>
    </div>
  );
}
