'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  PencilIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { createClient } from '@/lib/supabase';

interface SupplierData {
  supplier_code: string;
  supplier_name: string;
}

interface StatusMessageType {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export default function SupplierUpdateTab() {
  // 狀態管理
  const [supplierData, setSupplierData] = useState<SupplierData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchedCode, setSearchedCode] = useState('');
  const [statusMessage, setStatusMessage] = useState<StatusMessageType | null>(null);
  
  // 表單狀態
  const [formData, setFormData] = useState<SupplierData>({
    supplier_code: '',
    supplier_name: ''
  });

  const supabase = createClient();

  // 重置狀態
  const resetState = useCallback(() => {
    setSupplierData(null);
    setIsEditing(false);
    setShowCreateDialog(false);
    setShowForm(false);
    setSearchedCode('');
    setStatusMessage(null);
    setFormData({
      supplier_code: '',
      supplier_name: ''
    });
  }, []);

  // 搜尋供應商
  const handleSearch = useCallback(async (code: string) => {
    if (!code.trim()) {
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
        // 搜尋成功 - 顯示供應商信息
        setSupplierData(data);
        setIsEditing(false);
        setShowForm(false);
        setShowCreateDialog(false);
        setStatusMessage({
          type: 'success',
          message: `Supplier found: ${data.supplier_code}`
        });
      } else {
        // 搜尋失敗 - 詢問是否新增
        setSupplierData(null);
        setShowCreateDialog(true);
        setShowForm(false);
        setIsEditing(false);
        setStatusMessage({
          type: 'warning',
          message: `Supplier "${code.trim().toUpperCase()}" not found. Would you like to create it?`
        });
      }
    } catch (error: any) {
      console.error('Search error:', error);
      setStatusMessage({
        type: 'error',
        message: 'An unexpected error occurred during the search.'
      });
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // 開始編輯
  const handleEdit = useCallback(() => {
    if (supplierData) {
      setFormData(supplierData);
      setIsEditing(true);
      setShowForm(true);
      setShowCreateDialog(false);
    }
  }, [supplierData]);

  // 確認新增供應商
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
      message: 'Fill in the supplier details below to create a new supplier.'
    });
  }, [searchedCode]);

  // 取消操作
  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setShowForm(false);
    setShowCreateDialog(false);
    setStatusMessage(null);
  }, []);

  // 提交表單
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (isEditing && supplierData) {
        // 更新現有供應商
        const { data, error } = await supabase
          .from('data_supplier')
          .update({ supplier_name: formData.supplier_name })
          .eq('supplier_code', supplierData.supplier_code)
          .select()
          .single();
        
        if (error) throw error;
        
        setSupplierData(data);
        setStatusMessage({
          type: 'success',
          message: 'Supplier details updated successfully!'
        });
      } else {
        // 新增供應商
        const { data, error } = await supabase
          .from('data_supplier')
          .insert([formData])
          .select()
          .single();
        
        if (error) throw error;
        
        setSupplierData(data);
        setStatusMessage({
          type: 'success',
          message: 'Supplier created successfully!'
        });
      }
      
      // 成功後重置狀態
      setIsEditing(false);
      setShowForm(false);
      setShowCreateDialog(false);
      
    } catch (error: any) {
      console.error('Submit error:', error);
      setStatusMessage({
        type: 'error',
        message: error.message || 'An unexpected error occurred.'
      });
    } finally {
      setIsLoading(false);
    }
  }, [isEditing, supplierData, formData, supabase]);

  // 處理表單輸入變化
  const handleInputChange = useCallback((field: keyof SupplierData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // 處理 Enter 鍵搜尋
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      const target = e.target as HTMLInputElement;
      handleSearch(target.value);
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-slate-900/50 via-blue-900/20 to-slate-800/50 min-h-full">
      {/* Search Section */}
      {!showForm && (
        <div className="relative group mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-blue-900/30 rounded-2xl blur-xl"></div>
          <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl shadow-blue-900/20 hover:border-blue-500/30 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
            <div className="relative z-10">
              <h3 className="text-lg font-medium bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent mb-4">
                Supplier Search
              </h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="search" className="text-slate-200 font-medium">
                    Supplier Code
                  </Label>
                  <div className="flex gap-3 mt-2">
                    <Input
                      id="search"
                      type="text"
                      placeholder="Enter supplier code and press Enter..."
                      onKeyPress={handleKeyPress}
                      className="flex-1 bg-slate-700/50 border-slate-600/50 text-slate-200 placeholder-slate-400 focus:border-blue-500/70 focus:bg-slate-700/70 hover:border-blue-500/50 hover:bg-slate-700/60 transition-all duration-300"
                      disabled={isLoading || showCreateDialog}
                    />
                    <Button
                      onClick={() => {
                        const input = document.getElementById('search') as HTMLInputElement;
                        if (input) handleSearch(input.value);
                      }}
                      disabled={isLoading}
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-slate-600 disabled:to-slate-600 text-white px-6 shadow-lg hover:shadow-blue-500/25 hover:scale-105 active:scale-95 transition-all duration-300"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                          Search
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Enter a supplier code and press Enter to search (case-insensitive)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Search Button */}
      {showForm && (
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent">
            {isEditing ? 'Edit Supplier' : 'Create New Supplier'}
          </h3>
          <Button
            onClick={resetState}
            variant="outline"
            className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 hover:border-blue-400/70 bg-slate-800/50 backdrop-blur-sm"
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            New Search
          </Button>
        </div>
      )}

      {/* Status Message */}
      {statusMessage && (
        <div className={`p-4 rounded-xl mb-6 backdrop-blur-sm border ${
          statusMessage.type === 'success' ? 'bg-green-500/10 border-green-500/30' :
          statusMessage.type === 'error' ? 'bg-red-500/10 border-red-500/30' :
          statusMessage.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' :
          'bg-blue-500/10 border-blue-500/30'
        }`}>
          <p className={`text-sm ${
            statusMessage.type === 'success' ? 'text-green-400' :
            statusMessage.type === 'error' ? 'text-red-400' :
            statusMessage.type === 'warning' ? 'text-yellow-400' :
            'text-blue-400'
          }`}>
            {statusMessage.message}
          </p>
        </div>
      )}

      {/* Create Confirmation Dialog */}
      {showCreateDialog && (
        <div className="relative group mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-yellow-900/30 rounded-2xl blur-xl"></div>
          <div className="relative bg-slate-800/40 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-6 shadow-xl shadow-yellow-900/20">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-transparent to-amber-500/5 opacity-100 rounded-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-start space-x-4">
                <ExclamationTriangleIcon className="w-6 h-6 text-yellow-400 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-yellow-400 mb-2">
                    Supplier Not Found
                  </h3>
                  <p className="text-slate-300 mb-4">
                    The supplier code "{searchedCode}" was not found in the database. 
                    Would you like to create a new supplier with this code?
                  </p>
                  <div className="flex space-x-3">
                    <Button
                      onClick={handleConfirmCreate}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg hover:shadow-green-500/25 hover:scale-105 active:scale-95 transition-all duration-300"
                    >
                      <CheckCircleIcon className="w-4 h-4 mr-2" />
                      Yes, Create Supplier
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:border-slate-500/70 hover:text-white transition-all duration-300"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Info Display */}
      {supplierData && !showForm && (
        <div className="max-w-2xl mx-auto">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-blue-900/30 rounded-2xl blur-xl"></div>
            <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl shadow-blue-900/20 hover:border-blue-500/30 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
                    Supplier Information
                  </h4>
                  <Button
                    onClick={handleEdit}
                    size="sm"
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg hover:shadow-blue-500/25 hover:scale-105 active:scale-95 transition-all duration-300"
                  >
                    <PencilIcon className="w-4 h-4 mr-2" />
                    Edit Supplier
                  </Button>
                </div>
                <div className="space-y-3">
                  <SupplierInfoRow label="Supplier Code" value={supplierData.supplier_code} />
                  <SupplierInfoRow label="Supplier Name" value={supplierData.supplier_name} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Form */}
      {showForm && (
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-blue-900/30 rounded-2xl blur-xl"></div>
          <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl shadow-blue-900/20">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-cyan-500/5 opacity-100 rounded-2xl"></div>
            <div className="relative z-10">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="supplier_code" className="text-slate-200 font-medium">
                      Supplier Code *
                    </Label>
                    <Input
                      id="supplier_code"
                      type="text"
                      value={formData.supplier_code}
                      onChange={(e) => handleInputChange('supplier_code', e.target.value.toUpperCase())}
                      disabled={isEditing}
                      className="mt-2 bg-slate-700/50 border-slate-600/50 text-slate-200 placeholder-slate-400 focus:border-blue-500/70 focus:bg-slate-700/70 disabled:opacity-50 disabled:cursor-not-allowed"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="supplier_name" className="text-slate-200 font-medium">
                      Supplier Name *
                    </Label>
                    <Input
                      id="supplier_name"
                      type="text"
                      value={formData.supplier_name}
                      onChange={(e) => handleInputChange('supplier_name', e.target.value)}
                      className="mt-2 bg-slate-700/50 border-slate-600/50 text-slate-200 placeholder-slate-400 focus:border-blue-500/70 focus:bg-slate-700/70"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <Button
                    type="button"
                    onClick={handleCancel}
                    variant="outline"
                    className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:border-slate-500/70 hover:text-white transition-all duration-300"
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-slate-600 disabled:to-slate-600 text-white shadow-lg hover:shadow-blue-500/25 hover:scale-105 active:scale-95 transition-all duration-300"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        {isEditing ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-4 h-4 mr-2" />
                        {isEditing ? 'Update Supplier' : 'Create Supplier'}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Supplier Info Row Component
interface SupplierInfoRowProps {
  label: string;
  value: string;
}

function SupplierInfoRow({ label, value }: SupplierInfoRowProps) {
  return (
    <div className="flex justify-between items-center py-3 px-4 bg-slate-700/30 border border-slate-600/30 rounded-xl">
      <span className="text-slate-300 font-medium">{label}:</span>
      <span className="text-slate-100 font-semibold">{value || '-'}</span>
    </div>
  );
} 