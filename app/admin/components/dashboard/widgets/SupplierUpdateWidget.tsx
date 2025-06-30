/**
 * Supplier Update Widget
 * 將原本的 dialog 功能完整移植到 widget 內
 * 支援的尺寸：3x4 (與 Product Update Widget 相同)
 */

'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BuildingOfficeIcon, MagnifyingGlassIcon, PencilIcon, CheckCircleIcon, ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UniversalWidgetCard as WidgetCard } from '../UniversalWidgetCard';
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase';
import { getUserIdFromEmail } from '@/lib/utils/getUserIdClient';

interface SupplierData {
  supplier_code: string;
  supplier_name: string;
}

interface StatusMessageType {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export const SupplierUpdateWidget = React.memo(function SupplierUpdateWidget({ widget, isEditMode }: WidgetComponentProps) {
  // State management
  const [supplierData, setSupplierData] = useState<SupplierData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchedCode, setSearchedCode] = useState('');
  const [searchInput, setSearchInput] = useState(''); // Track input value
  const [statusMessage, setStatusMessage] = useState<StatusMessageType | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<SupplierData>({
    supplier_code: '',
    supplier_name: ''
  });

  const supabase = createClient();

  // Record supplier operation history
  const recordSupplierHistory = useCallback(async (
    action: 'Add' | 'Edit',
    supplierCode: string
  ): Promise<void> => {
    try {
      // Get current user info
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserEmail = user?.email || 'unknown';
      
      console.log('[recordSupplierHistory] Current user email:', currentUserEmail);
      
      // Get user ID
      const userId = await getUserIdFromEmail(currentUserEmail);
      
      console.log('[recordSupplierHistory] Retrieved user ID:', userId);
      
      // Insert history record
      const { error } = await supabase
        .from('record_history')
        .insert({
          time: new Date().toISOString(),
          id: userId || 999, // Use ID from data_id table, or 999 if not found
          action: action === 'Add' ? 'Supplier Added' : 'Supplier Update',
          plt_num: null, // Supplier operations don't involve pallets
          loc: null, // Supplier operations don't involve locations
          remark: supplierCode // Only record supplier code
        });
      
      if (error) {
        console.error('[recordSupplierHistory] Error recording history:', error);
      } else {
        console.log(`[recordSupplierHistory] Recorded: ${action} for ${supplierCode} by user ID ${userId}`);
      }
    } catch (error) {
      console.error('[recordSupplierHistory] Unexpected error:', error);
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
      supplier_name: ''
    });
  }, []);

  // Search supplier
  const handleSearch = useCallback(async (code: string) => {
    console.log('[SupplierSearch] Input value:', code);
    console.log('[SupplierSearch] Trimmed value:', code.trim());
    
    if (!code || !code.trim()) {
      setStatusMessage({
        type: 'error',
        message: 'Please enter a supplier code'
      });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);
    setSearchedCode(code.trim().toUpperCase());
    
    try {
      const { data, error } = await supabase
        .from('data_supplier')
        .select('*')
        .eq('supplier_code', code.trim().toUpperCase())
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        // Search success - show supplier info
        setSupplierData(data);
        setIsEditing(false);
        setShowForm(false);
        setShowCreateDialog(false);
        setStatusMessage({
          type: 'success',
          message: `Found: ${data.supplier_code}`
        });
      } else {
        // Search failed - ask if create new
        setSupplierData(null);
        setShowCreateDialog(true);
        setShowForm(false);
        setIsEditing(false);
        setStatusMessage({
          type: 'warning',
          message: `"${code.trim().toUpperCase()}" not found`
        });
      }
    } catch (error: any) {
      console.error('Search error:', error);
      setStatusMessage({
        type: 'error',
        message: 'Search error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

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
      supplier_name: ''
    });
    setIsEditing(false);
    setShowForm(true);
    setShowCreateDialog(false);
    setStatusMessage({
      type: 'info',
      message: 'Fill in supplier details'
    });
  }, [searchedCode]);

  // Cancel operation
  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setShowForm(false);
    setShowCreateDialog(false);
    setStatusMessage(null);
  }, []);

  // Submit form
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (isEditing && supplierData) {
        // Update existing supplier
        const { data, error } = await supabase
          .from('data_supplier')
          .update({ supplier_name: formData.supplier_name })
          .eq('supplier_code', supplierData.supplier_code)
          .select()
          .single();
        
        if (error) throw error;
        
        setSupplierData(data);
        
        // Record operation history
        await recordSupplierHistory('Edit', supplierData.supplier_code);
        
        setStatusMessage({
          type: 'success',
          message: 'Updated successfully!'
        });
      } else {
        // Create new supplier
        const { data, error } = await supabase
          .from('data_supplier')
          .insert([formData])
          .select()
          .single();
        
        if (error) throw error;
        
        setSupplierData(data);
        
        // Record operation history
        await recordSupplierHistory('Add', formData.supplier_code);
        
        setStatusMessage({
          type: 'success',
          message: 'Created successfully!'
        });
      }
      
      // Reset form after success
      setIsEditing(false);
      setShowForm(false);
      setShowCreateDialog(false);
      
    } catch (error: any) {
      console.error('Submit error:', error);
      setStatusMessage({
        type: 'error',
        message: error.message || 'Unexpected error'
      });
    } finally {
      setIsLoading(false);
    }
  }, [isEditing, supplierData, formData, supabase, recordSupplierHistory]);

  // Handle form input change
  const handleInputChange = useCallback((field: keyof SupplierData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Handle Enter key search
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSearch(searchInput);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      <WidgetCard widgetType="SUPPLIER_UPDATE" isEditMode={isEditMode}>
        <CardHeader className="pb-3">
          <CardTitle className="widget-title flex items-center gap-2">
            <BuildingOfficeIcon className="w-5 h-5" />
            Supplier Update
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 overflow-y-auto max-h-[calc(100%-60px)]">
          {/* Search Section */}
          {!showForm && !showCreateDialog && (
            <div className="space-y-3">
              <Label htmlFor="search" className="text-sm text-slate-300">
                Supplier Code
              </Label>
              <div className="flex gap-2">
                <Input
                  id="search"
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Enter supplier code..."
                  onKeyPress={handleKeyPress}
                  className="flex-1 h-9 text-sm bg-slate-700/50 border-slate-600/50"
                  disabled={isLoading || isEditMode}
                />
                <Button
                  onClick={() => handleSearch(searchInput)}
                  disabled={isLoading || isEditMode}
                  size="sm"
                  className="h-9 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <>
                      <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Status Message */}
          {statusMessage && (
            <div className={`p-3 rounded-lg text-sm ${
              statusMessage.type === 'success' ? 'bg-green-500/20 text-green-400' :
              statusMessage.type === 'error' ? 'bg-red-500/20 text-red-400' :
              statusMessage.type === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-blue-500/20 text-blue-400'
            }`}>
              {statusMessage.message}
            </div>
          )}

          {/* Create Confirmation */}
          {showCreateDialog && (
            <div className="bg-slate-800/50 rounded-lg p-4 border border-yellow-500/30">
              <div className="flex items-start space-x-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-yellow-400 font-medium">Supplier Not Found</p>
                  <p className="text-sm text-slate-300 mt-1">
                    Create new supplier &quot;{searchedCode}&quot;?
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button
                      onClick={handleConfirmCreate}
                      size="sm"
                      className="h-8 text-sm bg-green-600 hover:bg-green-700"
                      disabled={isEditMode}
                    >
                      <CheckCircleIcon className="w-4 h-4 mr-1" />
                      Create
                    </Button>
                    <Button
                      onClick={handleCancel}
                      size="sm"
                      variant="outline"
                      className="h-8 text-sm border-slate-600"
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
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-blue-400">Supplier Info</h4>
                <Button
                  onClick={handleEdit}
                  size="sm"
                  className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700"
                  disabled={isEditMode}
                >
                  <PencilIcon className="w-3 h-3 mr-1" />
                  Edit
                </Button>
              </div>
              <div className="space-y-2">
                <InfoRow label="Code" value={supplierData.supplier_code} />
                <InfoRow label="Name" value={supplierData.supplier_name} />
              </div>
            </div>
          )}

          {/* Supplier Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-blue-400">
                  {isEditing ? 'Edit Supplier' : 'New Supplier'}
                </h4>
                <Button
                  type="button"
                  onClick={resetState}
                  size="sm"
                  variant="ghost"
                  className="h-7 px-3 text-xs"
                  disabled={isLoading || isEditMode}
                >
                  <ArrowPathIcon className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="supplier_code" className="text-sm">Code *</Label>
                  <Input
                    id="supplier_code"
                    type="text"
                    value={formData.supplier_code}
                    onChange={(e) => handleInputChange('supplier_code', e.target.value.toUpperCase())}
                    disabled={isEditing || isEditMode}
                    className="h-9 text-sm bg-slate-700/50 mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="supplier_name" className="text-sm">Name *</Label>
                  <Input
                    id="supplier_name"
                    type="text"
                    value={formData.supplier_name}
                    onChange={(e) => handleInputChange('supplier_name', e.target.value)}
                    className="h-9 text-sm bg-slate-700/50 mt-1"
                    disabled={isEditMode}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  onClick={handleCancel}
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8 text-sm border-slate-600"
                  disabled={isLoading || isEditMode}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isLoading || isEditMode}
                  className="flex-1 h-8 text-sm bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                  ) : (
                    <>
                      <CheckCircleIcon className="w-4 h-4 mr-1" />
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

// Info Row Component
interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex justify-between items-center py-2 px-3 bg-slate-700/30 rounded text-sm">
      <span className="text-slate-400">{label}:</span>
      <span className="text-slate-200 font-medium">{value || '-'}</span>
    </div>
  );
}