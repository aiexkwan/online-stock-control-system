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
import { createClient } from '@/app/utils/supabase/client';
import { errorHandler } from '@/app/components/qc-label-form/services/ErrorHandler';

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

  const supabase = createClient();

  // Get current user ID
  const getCurrentUserId = useCallback(async (): Promise<number> => {
    try {
      const startTime = performance.now();

      // Get current user info
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const currentUserEmail = user?.email || 'unknown';

      // Use RPC function to get user ID
      const { data, error } = await supabase.rpc('rpc_get_user_id_by_email', {
        p_email: currentUserEmail,
      });

      const endTime = performance.now();
      console.log(`[SupplierUpdateWidgetV2] User ID lookup: ${Math.round(endTime - startTime)}ms`);

      if (error) {
        errorHandler.handleApiError(
          error,
          { component: 'SupplierUpdateWidgetV2', action: 'get_user_id' },
          'Failed to get user information'
        );
        return 999; // Default value
      }

      return data || 999;
    } catch (error) {
      errorHandler.handleApiError(
        error as Error,
        { component: 'SupplierUpdateWidgetV2', action: 'get_user_id' },
        'Unexpected error getting user information'
      );
      return 999;
    }
  }, [supabase]);

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

  // Search supplier using RPC
  const handleSearch = useCallback(
    async (code: string) => {
      if (!code || !code.trim()) {
        setStatusMessage({
          type: 'error',
          message: 'Please enter a supplier code',
        });
        return;
      }

      setIsLoading(true);
      setStatusMessage(null);
      setSearchedCode(code.trim().toUpperCase());

      try {
        const startTime = performance.now();

        // Use RPC function for search
        const { data, error } = await supabase.rpc('rpc_search_supplier', {
          p_supplier_code: code.trim(),
        });

        const endTime = performance.now();
        setPerformanceMetrics({
          lastOperationTime: Math.round(endTime - startTime),
          optimized: true,
        });

        if (error) {
          throw error;
        }

        if (data.exists) {
          // Search success - show supplier info
          setSupplierData(data.supplier);
          setIsEditing(false);
          setShowForm(false);
          setShowCreateDialog(false);
          setStatusMessage({
            type: 'success',
            message: `Found: ${data.supplier.supplier_code}`,
          });
        } else {
          // Search failed - ask if create new
          setSupplierData(null);
          setShowCreateDialog(true);
          setShowForm(false);
          setIsEditing(false);
          setSearchedCode(data.normalized_code);
          setStatusMessage({
            type: 'warning',
            message: `"${data.normalized_code}" not found`,
          });
        }
      } catch (error: any) {
        errorHandler.handleApiError(
          error,
          {
            component: 'SupplierUpdateWidgetV2',
            action: 'search_supplier',
            additionalData: { searchCode: code.trim() },
          },
          'Search error occurred'
        );
        setStatusMessage({
          type: 'error',
          message: 'Search error occurred',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [supabase]
  );

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

  // Submit form using RPC
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);

      try {
        const startTime = performance.now();
        const userId = await getCurrentUserId();

        if (isEditing && supplierData) {
          // Update existing supplier using RPC
          const { data, error } = await supabase.rpc('rpc_update_supplier', {
            p_supplier_code: supplierData.supplier_code,
            p_supplier_name: formData.supplier_name,
            p_user_id: userId,
          });

          if (error) throw error;

          if (!data.success) {
            throw new Error(data.error || 'Update failed');
          }

          setSupplierData(data.supplier);
          setStatusMessage({
            type: 'success',
            message: 'Updated successfully!',
          });
        } else {
          // Create new supplier using RPC
          const { data, error } = await supabase.rpc('rpc_create_supplier', {
            p_supplier_code: formData.supplier_code,
            p_supplier_name: formData.supplier_name,
            p_user_id: userId,
          });

          if (error) throw error;

          if (!data.success) {
            throw new Error(data.error || 'Creation failed');
          }

          setSupplierData(data.supplier);
          setStatusMessage({
            type: 'success',
            message: 'Created successfully!',
          });
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
    [isEditing, supplierData, formData, supabase, getCurrentUserId]
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
                  disabled={isLoading || isEditMode}
                />
                <Button
                  onClick={() => handleSearch(searchInput)}
                  disabled={isLoading || isEditMode}
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
                  disabled={isLoading || isEditMode}
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
                  disabled={isLoading || isEditMode}
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  size='sm'
                  disabled={isLoading || isEditMode}
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
